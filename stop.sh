#!/bin/bash

# WatchMe 管理システム停止スクリプト
# 使用方法: ./stop.sh

echo "🛑 WatchMe 管理システムを停止中..."

# ポート9000を使用している全プロセスを取得
PIDS=$(lsof -ti :9000)

if [ -z "$PIDS" ]; then
    echo "ℹ️  ポート9000で動作中のプロセスは見つかりませんでした"
    exit 0
fi

echo "📋 停止対象プロセス:"
lsof -i :9000

echo ""
echo "💀 プロセスを停止しています..."

# 各プロセスを順次停止
for PID in $PIDS; do
    echo "   PID $PID を停止中..."
    kill -TERM $PID 2>/dev/null
done

# 2秒待機
sleep 2

# まだ残っているプロセスを強制終了
REMAINING_PIDS=$(lsof -ti :9000)
if [ ! -z "$REMAINING_PIDS" ]; then
    echo "⚡ 強制終了を実行中..."
    for PID in $REMAINING_PIDS; do
        echo "   PID $PID を強制停止中..."
        kill -9 $PID 2>/dev/null
    done
    sleep 1
fi

# 最終確認
FINAL_CHECK=$(lsof -ti :9000)
if [ -z "$FINAL_CHECK" ]; then
    echo "✅ WatchMe管理システムが正常に停止しました"
else
    echo "❌ 一部のプロセスが残っています:"
    lsof -i :9000
fi