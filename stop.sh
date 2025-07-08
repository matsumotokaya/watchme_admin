#!/bin/bash

# WatchMe Admin - 停止スクリプト

echo "🛑 WatchMe Admin を停止中..."

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