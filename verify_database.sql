-- =====================================================================
-- データベース構造確認クエリ
-- =====================================================================

-- 1. テーブル構造確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'devices', 'viewer_links', 'audio_data', 'graph_data', 'device_sessions')
ORDER BY table_name, ordinal_position;

-- 2. 制約確認
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name IN ('users', 'devices', 'viewer_links', 'audio_data', 'graph_data', 'device_sessions')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;

-- 3. インデックス確認
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'devices', 'viewer_links', 'audio_data', 'graph_data', 'device_sessions')
ORDER BY tablename, indexname;

-- 4. データ確認
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'viewer_links', COUNT(*) FROM viewer_links
UNION ALL
SELECT 'audio_data', COUNT(*) FROM audio_data
UNION ALL
SELECT 'graph_data', COUNT(*) FROM graph_data
UNION ALL
SELECT 'device_sessions', COUNT(*) FROM device_sessions;

-- 5. usersテーブルの詳細確認
SELECT 
    status,
    COUNT(*) as count,
    COUNT(user_id) as with_auth_id,
    COUNT(*) - COUNT(user_id) as guest_count
FROM users 
GROUP BY status;

-- 6. 外部キー関係の確認
SELECT 
    COUNT(*) as total_devices,
    COUNT(owner_user_id) as with_owner,
    COUNT(*) - COUNT(owner_user_id) as without_owner
FROM devices;

SELECT 
    COUNT(*) as total_viewer_links,
    COUNT(owner_user_id) as with_owner,
    COUNT(*) - COUNT(owner_user_id) as without_owner
FROM viewer_links;