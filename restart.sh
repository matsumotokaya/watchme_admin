#!/bin/bash

# WatchMe Admin - 安全な再起動スクリプト
# 確実に古いプロセスを終了してから新しいプロセスを起動

echo "🔄 WatchMe Admin を安全に再起動中..."

# 現在のディレクトリに移動
cd "$(dirname "$0")"

# 1. 停止処理
echo "🛑 既存プロセスを完全に停止中..."
./stop.sh

# 2. 念のため追加チェック
echo "🔍 残存プロセスをチェック中..."
sleep 2
REMAINING=$(lsof -ti :9000 2>/dev/null)
if [ ! -z "$REMAINING" ]; then
    echo "⚠️  まだプロセスが残っています。強制終了します..."
    lsof -ti :9000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 3. 起動処理
echo "🚀 新しいプロセスを起動中..."
./start.sh

echo "✅ 再起動が完了しました"