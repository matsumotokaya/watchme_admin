#!/bin/bash

# WatchMe Admin - プロセス状況確認スクリプト
# 重複プロセスや古いプロセスの検出

echo "🔍 WatchMe Admin プロセス状況確認"
echo "=================================="

# ポート9000の使用状況
echo "📊 ポート9000の使用状況:"
PORT_PROCS=$(lsof -i :9000 2>/dev/null)
if [ -z "$PORT_PROCS" ]; then
    echo "  ✅ ポート9000は使用されていません"
else
    echo "$PORT_PROCS"
    echo ""
    echo "🔢 プロセス数: $(echo "$PORT_PROCS" | wc -l)"
fi

echo ""

# PIDファイルの状況
echo "📋 PIDファイルの状況:"
if [ -f ".server.pid" ]; then
    PID=$(cat .server.pid)
    echo "  📁 .server.pid: $PID"
    if kill -0 $PID 2>/dev/null; then
        echo "  ✅ PID $PID は実行中です"
    else
        echo "  ❌ PID $PID は実行されていません（古いPIDファイル）"
        echo "  🧹 古いPIDファイルを削除します..."
        rm -f .server.pid
    fi
else
    echo "  ❌ .server.pidファイルが存在しません"
fi

echo ""

# uvicornプロセスの検索
echo "🔍 uvicornプロセスの検索:"
UVICORN_PROCS=$(ps aux | grep "uvicorn.*9000" | grep -v grep)
if [ -z "$UVICORN_PROCS" ]; then
    echo "  ✅ uvicornプロセスは見つかりませんでした"
else
    echo "$UVICORN_PROCS"
    echo ""
    echo "⚠️  複数のuvicornプロセスが実行中の可能性があります"
fi

echo ""
echo "💡 推奨アクション:"
echo "  - 複数プロセスが実行中の場合: ./restart.sh"
echo "  - 正常に動作中の場合: そのまま継続"