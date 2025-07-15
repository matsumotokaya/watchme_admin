#!/bin/bash

# WatchMe Admin - 安定起動スクリプト
# PID管理とログ出力により、stop.shとの連携を確実にします

echo "🚀 WatchMe Admin を起動中..."

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

# 既存プロセスを停止（念のため）
echo "🛑 既存プロセスを停止中..."
./stop.sh
sleep 1

echo "✅ 起動準備完了"
echo "📍 アクセス先: http://localhost:9000"
echo "📝 ログ出力: tail -f admin_server.log"
echo "⏹️  停止方法: ./stop.sh"
echo "================================="
echo ""

# uvicornをバックグラウンドで起動し、ログをファイルに出力、PIDを保存
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 > admin_server.log 2>&1 & echo $! > .server.pid

# 起動確認
sleep 2
if ps -p $(cat .server.pid) > /dev/null 2>&1; then
    echo "✅ サーバーが正常に起動しました (PID: $(cat .server.pid))"
    echo "📋 ログ確認: tail -f admin_server.log"
else
    echo "❌ サーバーの起動に失敗しました。詳細は admin_server.log を確認してください。"
    if [ -f admin_server.log ]; then
        echo "📋 最新のエラーログ:"
        tail -10 admin_server.log
    fi
fi