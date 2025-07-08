#!/bin/bash

# WatchMe Admin - 起動スクリプト
# 最も確実に起動する方法

echo "🚀 WatchMe Admin 起動中..."

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# ポート9000を確実に解放（複数の方法で確認）
echo "🔧 ポート9000を解放中..."
# 方法1: lsofで検索して強制終了
lsof -ti :9000 | xargs kill -9 2>/dev/null || true
# 方法2: uvicornプロセスを名前で検索して終了
pkill -f "uvicorn.*9000" 2>/dev/null || true
# 方法3: pythonプロセスでポート9000を使用しているものを終了
pkill -f "python.*9000" 2>/dev/null || true
sleep 2

# ポートが解放されたか確認
if lsof -i :9000 >/dev/null 2>&1; then
    echo "⚠️  ポート9000がまだ使用中です。再度解放を試みます..."
    lsof -ti :9000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 環境変数チェック
if [ ! -f ".env" ]; then
    echo "❌ .envファイルが見つかりません"
    echo "📝 以下の内容で.envファイルを作成してください："
    echo "SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_KEY=your-anon-key"
    exit 1
fi

# 依存関係の確認（正しいパッケージをチェック）
echo "📦 依存関係を確認中..."
if ! python3 -c "import fastapi, uvicorn, httpx" 2>/dev/null; then
    echo "⚠️  必要なパッケージが不足しています"
    echo "📥 インストール中..."
    pip3 install -r requirements.txt
fi

# サーバー起動
echo ""
echo "✅ 起動準備完了"
echo "📍 アクセス先: http://localhost:9000"
echo "⏹️  停止方法: Ctrl+C"
echo "================================="
echo ""

# uvicornで起動（ログレベルは警告以上のみ表示）
# バックグラウンドで起動してPIDを保存
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --log-level warning &
SERVER_PID=$!
echo ""
echo "✅ サーバーが起動しました (PID: $SERVER_PID)"
echo "🌐 ブラウザで http://localhost:9000 にアクセスしてください"

# PIDをファイルに保存（stop.shで使用）
echo $SERVER_PID > .server.pid

# 起動確認（3秒待機）
sleep 3
if lsof -i :9000 >/dev/null 2>&1; then
    echo "✅ サーバーは正常に動作しています"
    
    # 複数プロセスのチェック
    PROCESS_COUNT=$(lsof -ti :9000 | wc -l)
    if [ $PROCESS_COUNT -gt 1 ]; then
        echo "⚠️  複数のプロセスが検出されました ($PROCESS_COUNT 個)"
        echo "💡 ./check_processes.sh で詳細を確認してください"
    fi
else
    echo "⚠️  サーバーの起動に失敗した可能性があります"
fi