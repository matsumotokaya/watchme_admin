-- =====================================================================
-- WatchMe データベース構造更新 - 現在の状態から新仕様への対応
-- =====================================================================

-- 1. usersテーブルの修正
-- =====================================================================

-- idカラムを追加（新仕様のプライマリキー）
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- idカラムにNOT NULL制約を追加
UPDATE users SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE users ALTER COLUMN id SET NOT NULL;

-- 新しいカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'guest';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

-- user_idをオプショナルに変更（ゲストユーザー用）
ALTER TABLE users ALTER COLUMN user_id DROP NOT NULL;

-- statusカラムの制約を追加
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status IN ('guest', 'member', 'subscriber'));

-- subscription_planカラムの制約を追加
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_plan_check 
CHECK (subscription_plan IS NULL OR subscription_plan IN ('basic', 'premium', 'enterprise'));

-- 既存データのステータスを設定（user_idがあるものは会員、ないものはゲスト）
UPDATE users SET status = CASE 
    WHEN user_id IS NOT NULL THEN 'member'
    ELSE 'guest'
END WHERE status = 'guest';

-- =====================================================================
-- 2. devicesテーブルの修正
-- =====================================================================

-- 新しいカラムを追加
ALTER TABLE devices ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform_type TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform_identifier TEXT;

-- platform_typeの制約を追加
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_platform_type_check;
ALTER TABLE devices ADD CONSTRAINT devices_platform_type_check 
CHECK (platform_type IS NULL OR platform_type IN ('iOS', 'Android', 'Web'));

-- device_typeに仮想デバイスを追加
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_type_check;
ALTER TABLE devices ADD CONSTRAINT devices_device_type_check 
CHECK (device_type IS NULL OR device_type IN ('iPhone', 'Android', 'iPad', 'PC', 'virtual_mobile'));

-- owner_user_idの外部キー制約を追加
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_owner_user_id_fkey;
ALTER TABLE devices ADD CONSTRAINT devices_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================================
-- 3. viewer_linksテーブルの修正
-- =====================================================================

-- owner_user_idカラムを追加
ALTER TABLE viewer_links ADD COLUMN IF NOT EXISTS owner_user_id UUID;

-- owner_user_idの外部キー制約を追加
ALTER TABLE viewer_links DROP CONSTRAINT IF EXISTS viewer_links_owner_user_id_fkey;
ALTER TABLE viewer_links ADD CONSTRAINT viewer_links_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================================
-- 4. インデックス追加
-- =====================================================================

-- usersテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- devicesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_devices_owner_user_id ON devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_platform_identifier ON devices(platform_identifier);
CREATE INDEX IF NOT EXISTS idx_devices_platform_type ON devices(platform_type);

-- viewer_linksテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_viewer_links_owner_user_id ON viewer_links(owner_user_id);

-- =====================================================================
-- 5. 既存データのマイグレーション
-- =====================================================================

-- devicesテーブルのowner_user_idを設定
-- user_idが関連付けられているviewer_linksから逆算
UPDATE devices SET owner_user_id = (
    SELECT u.id FROM users u
    INNER JOIN viewer_links vl ON vl.user_id = u.user_id
    WHERE vl.device_id = devices.device_id
    LIMIT 1
) WHERE owner_user_id IS NULL;

-- viewer_linksテーブルのowner_user_idを設定
UPDATE viewer_links SET owner_user_id = (
    SELECT id FROM users WHERE users.user_id = viewer_links.user_id
) WHERE owner_user_id IS NULL;

-- =====================================================================
-- 6. RLS（Row Level Security）ポリシー更新
-- =====================================================================

-- usersテーブルのRLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated user insert" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- 新しいポリシー（ゲストユーザー対応）
CREATE POLICY "Users can view accessible profiles" ON users
    FOR SELECT USING (
        -- 自分のプロファイル（会員以上）
        (auth.uid() = user_id) OR
        -- 管理者またはサービスロール
        (auth.role() = 'service_role') OR
        -- 認証されたユーザー（一時的な緩い設定）
        (auth.role() = 'authenticated')
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        -- 自分のプロファイル（会員以上）
        auth.uid() = user_id OR
        -- 管理者またはサービスロール
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (
        -- 認証済みユーザー（会員登録）
        auth.role() = 'authenticated' OR
        -- 管理者（ゲストユーザー作成）
        auth.role() = 'service_role' OR
        -- 一時的な緩い設定
        true
    );

-- devicesテーブルのRLS更新
DROP POLICY IF EXISTS "Users can view own devices" ON devices;
DROP POLICY IF EXISTS "Users can manage own devices" ON devices;

CREATE POLICY "Users can view accessible devices" ON devices
    FOR SELECT USING (
        -- owner_user_idを通じたアクセス
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        ) OR
        -- 一時的な緩い設定
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can manage own devices" ON devices
    FOR ALL USING (
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        ) OR
        -- 一時的な緩い設定
        auth.role() = 'service_role'
    );

-- viewer_linksテーブルのRLS更新
ALTER TABLE viewer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own viewer_links" ON viewer_links;
DROP POLICY IF EXISTS "Users can manage own viewer_links" ON viewer_links;

CREATE POLICY "Users can view accessible viewer_links" ON viewer_links
    FOR SELECT USING (
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can manage own viewer_links" ON viewer_links
    FOR ALL USING (
        owner_user_id IN (
            SELECT id FROM users WHERE 
            user_id = auth.uid() OR 
            auth.role() = 'service_role'
        ) OR
        auth.role() = 'service_role'
    );

-- =====================================================================
-- 7. トリガー作成（updated_at自動更新）
-- =====================================================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- usersテーブルのupdated_atトリガー
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 8. テストデータ作成
-- =====================================================================

-- ゲストユーザーのサンプル作成
INSERT INTO users (id, name, status, created_at) 
VALUES (gen_random_uuid(), 'ゲスト', 'guest', NOW())
ON CONFLICT DO NOTHING;

-- 既存の会員ユーザーのステータス確認・更新
UPDATE users SET status = 'member' 
WHERE user_id IS NOT NULL AND status != 'member';

-- =====================================================================
-- 9. 整合性チェック
-- =====================================================================

-- 孤立したレコードの確認
DO $$
BEGIN
    -- devicesテーブルでowner_user_idがNULLのレコード数を表示
    RAISE NOTICE 'owner_user_idがNULLのdevicesレコード数: %', 
        (SELECT COUNT(*) FROM devices WHERE owner_user_id IS NULL);
    
    -- viewer_linksテーブルでowner_user_idがNULLのレコード数を表示
    RAISE NOTICE 'owner_user_idがNULLのviewer_linksレコード数: %', 
        (SELECT COUNT(*) FROM viewer_links WHERE owner_user_id IS NULL);
    
    -- usersテーブルの各ステータスの数を表示
    RAISE NOTICE 'guestユーザー数: %', 
        (SELECT COUNT(*) FROM users WHERE status = 'guest');
    RAISE NOTICE 'memberユーザー数: %', 
        (SELECT COUNT(*) FROM users WHERE status = 'member');
    RAISE NOTICE 'subscriberユーザー数: %', 
        (SELECT COUNT(*) FROM users WHERE status = 'subscriber');
END $$;