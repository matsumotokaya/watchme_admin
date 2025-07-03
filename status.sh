#!/bin/bash

# WatchMe 管理システム状態確認スクリプト
# 使用方法: ./status.sh

echo "📊 WatchMe 管理システム - 状態確認"
echo "========================================"

# ポート9000の状態確認
PIDS=$(lsof -ti :9000 2>/dev/null)

if [ ! -z "$PIDS" ]; then
    echo "✅ システム状態: 稼働中"
    echo "📍 URL: http://localhost:9000"
    echo ""
    echo "📋 プロセス詳細:"
    lsof -i :9000
    echo ""
    echo "💾 メモリ使用量:"
    for PID in $PIDS; do
        ps -p $PID -o pid,ppid,pcpu,pmem,comm
    done
else
    echo "🔴 システム状態: 停止中"
    echo ""
    echo "💡 起動するには以下のコマンドを実行:"
    echo "   ./start.sh"
fi

echo ""
echo "🗂️  環境設定:"

# .envファイル確認
if [ -f ".env" ]; then
    echo "✅ .env ファイル: 存在"
else
    echo "❌ .env ファイル: 不存在"
    echo "   cp .env.example .env で作成してください"
fi

# 仮想環境確認
if [ -d "venv" ]; then
    echo "✅ 仮想環境: 存在 (venv/)"
else
    echo "⚠️  仮想環境: 不存在"
fi

# 依存関係確認
echo ""
echo "📦 依存関係チェック:"
if python3 -c "import uvicorn, fastapi, supabase" 2>/dev/null; then
    echo "✅ 必要なパッケージ: インストール済み"
else
    echo "❌ 必要なパッケージ: 不足"
    echo "   pip install -r requirements.txt で解決"
fi

echo ""
echo "🌐 接続テスト:"
if [ ! -z "$PIDS" ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ HTTP接続: 正常 (200 OK)"
    else
        echo "⚠️  HTTP接続: 異常 ($HTTP_STATUS)"
    fi
else
    echo "🔴 HTTP接続: サーバー停止中"
fi