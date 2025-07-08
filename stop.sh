#!/bin/bash

# WatchMe Admin - 停止スクリプト

echo "🛑 WatchMe Admin を停止中..."

# PIDファイルが存在する場合は、そのPIDを使用
if [ -f ".server.pid" ]; then
    SERVER_PID=$(cat .server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "📋 PID $SERVER_PID のプロセスを停止中..."
        kill -TERM $SERVER_PID 2>/dev/null || true
        sleep 1
        kill -9 $SERVER_PID 2>/dev/null || true
    fi
    rm -f .server.pid
fi

# ポート9000を使用している全プロセスを停止
lsof -ti :9000 | xargs kill -9 2>/dev/null || true
pkill -f "uvicorn.*9000" 2>/dev/null || true

sleep 1

# 停止確認
if ! lsof -i :9000 >/dev/null 2>&1; then
    echo "✅ 正常に停止しました"
else
    echo "⚠️  一部プロセスが残っている可能性があります"
    lsof -i :9000
fi