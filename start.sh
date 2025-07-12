#!/bin/bash

# WatchMe Admin - シンプル起動スクリプト

echo "🚀 WatchMe Admin 起動中..."

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "❌ .envファイルが見つかりません"
    echo "📝 以下の内容で.envファイルを作成してください："
    echo "SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_KEY=your-anon-key"
    exit 1
fi

# 起動情報表示
echo "✅ 起動準備完了"
echo "📍 アクセス先: http://localhost:9000"
echo "⏹️  停止方法: Ctrl+C"
echo "================================="
echo ""

# uvicornで起動（シンプル版）
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 9000