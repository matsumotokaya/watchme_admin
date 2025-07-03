-- =====================================================================
-- WatchMe ユーザーステータス仕様対応 - データベースマイグレーション
-- =====================================================================

-- 1. usersテーブルの構造修正
-- =====================================================================

-- 新しいカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'guest';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- statusカラムの制約を追加
ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status IN ('guest', 'member', 'subscriber'));

-- subscription_planカラムの制約を追加
ALTER TABLE users ADD CONSTRAINT users_subscription_plan_check 
CHECK (subscription_plan IS NULL OR subscription_plan IN ('basic', 'premium', 'enterprise'));

-- user_idをオプショナルに変更（ゲストユーザー用）
ALTER TABLE users ALTER COLUMN user_id DROP NOT NULL;

-- idをプライマリキーとして使用（ゲスト・会員共通）
-- user_idはauth.usersとの連携用（member以上のみ）

-- =====================================================================
-- 2. devicesテーブルの修正
-- =====================================================================

-- user_idの代わりにusers.idと連携するように変更
ALTER TABLE devices ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- device_typeに仮想デバイス対応を追加
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_type_check;
ALTER TABLE devices ADD CONSTRAINT devices_device_type_check 
CHECK (device_type IN ('iPhone', 'Android', 'iPad', 'PC', 'virtual_mobile'));

-- platform識別子フィールドを追加
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform_identifier TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform_type TEXT CHECK (platform_type IN ('iOS', 'Android', 'Web'));

-- =====================================================================
-- 3. viewer_linksテーブルの修正
-- =====================================================================

-- user_idの代わりにusers.idと連携
ALTER TABLE viewer_links ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================================
-- 4. インデックス追加
-- =====================================================================

-- usersテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- devicesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_devices_owner_user_id ON devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_platform_identifier ON devices(platform_identifier);
CREATE INDEX IF NOT EXISTS idx_devices_platform_type ON devices(platform_type);

-- viewer_linksテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_viewer_links_owner_user_id ON viewer_links(owner_user_id);

-- =====================================================================
-- 5. RLS（Row Level Security）ポリシー更新
-- =====================================================================

-- usersテーブルのRLSポリシー
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated user insert" ON users;

-- 新しいポリシー（ゲストユーザー対応）
CREATE POLICY "Users can view accessible profiles" ON users
    FOR SELECT USING (
        -- 自分のプロファイル（会員以上）
        (auth.uid() = user_id) OR
        -- 管理者
        (auth.role() = 'service_role')
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        -- 自分のプロファイル（会員以上）
        auth.uid() = user_id OR
        -- 管理者
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (
        -- 認証済みユーザー（会員登録）
        auth.role() = 'authenticated' OR
        -- 管理者（ゲストユーザー作成）
        auth.role() = 'service_role'
    );

-- devicesテーブルのRLSポリシー
DROP POLICY IF EXISTS "Users can view own devices" ON devices;
DROP POLICY IF EXISTS "Users can manage own devices" ON devices;

CREATE POLICY "Users can view accessible devices" ON devices
    FOR SELECT USING (
        -- owner_user_idを通じたアクセス
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        )
    );

CREATE POLICY "Users can manage own devices" ON devices
    FOR ALL USING (
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        )
    );

-- =====================================================================
-- 6. サンプルデータ作成（テスト用）
-- =====================================================================

-- ゲストユーザーのサンプル
INSERT INTO users (id, name, status, created_at) VALUES 
(gen_random_uuid(), 'ゲスト', 'guest', NOW())
ON CONFLICT DO NOTHING;

-- 会員ユーザーのサンプル（既存のauth.usersと連携）
-- INSERT INTO users (id, user_id, name, email, status, created_at) VALUES 
-- (gen_random_uuid(), 'auth-user-uuid', '山田太郎', 'yamada@example.com', 'member', NOW())
-- ON CONFLICT DO NOTHING;

-- =====================================================================
-- 7. 既存データのマイグレーション
-- =====================================================================

-- 既存のuser_idベースのデータをowner_user_idに移行
UPDATE devices SET owner_user_id = (
    SELECT id FROM users WHERE users.user_id = devices.user_id
) WHERE owner_user_id IS NULL AND user_id IS NOT NULL;

UPDATE viewer_links SET owner_user_id = (
    SELECT id FROM users WHERE users.user_id = viewer_links.user_id
) WHERE owner_user_id IS NULL AND user_id IS NOT NULL;

-- 既存ユーザーのステータスをmemberに設定
UPDATE users SET status = 'member' WHERE user_id IS NOT NULL AND status = 'guest';

-- =====================================================================
-- 8. トリガー作成（updated_at自動更新）
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();