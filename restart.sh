#!/bin/bash

# WatchMe 管理システム再起動スクリプト
# 使用方法: ./restart.sh

echo "🔄 WatchMe 管理システムを再起動中..."
echo ""

# 現在のディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# まず停止
echo "🛑 現在のプロセスを停止中..."
./stop.sh

echo ""
echo "⏳ 2秒待機中..."
sleep 2

echo ""
echo "🚀 システムを起動中..."
./start.sh