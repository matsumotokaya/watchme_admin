#!/bin/bash

# WatchMe 管理システム起動スクリプト
# 使用方法: ./start.sh

echo "🎧 WatchMe 音声データ心理分析システム - 管理画面起動中..."
echo ""

# プロジェクトディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 既存のプロセスをチェック・終了
echo "📋 既存プロセスをチェック中..."
EXISTING_PID=$(lsof -ti :9000)
if [ ! -z "$EXISTING_PID" ]; then
    echo "⚠️  ポート9000が使用中です (PID: $EXISTING_PID)"
    echo "💀 既存プロセスを終了します..."
    kill -9 $EXISTING_PID 2>/dev/null
    sleep 2
    echo "✅ プロセス終了完了"
fi

# 環境変数ファイルをチェック
if [ ! -f ".env" ]; then
    echo "❌ .env ファイルが見つかりません"
    echo "📝 .env.example から .env を作成してください"
    echo ""
    echo "cp .env.example .env"
    echo "# その後、.env ファイルを編集してSupabaseの設定を入力"
    exit 1
fi

# 仮想環境の確認・アクティベート
if [ -d "venv" ]; then
    echo "🐍 仮想環境をアクティベート中..."
    source venv/bin/activate
    echo "✅ 仮想環境アクティベート完了"
else
    echo "⚠️  仮想環境が見つかりません"
    echo "💡 Python標準環境を使用します"
fi

# 依存関係のチェック
echo "📦 依存関係をチェック中..."
if ! python3 -c "import uvicorn, fastapi, supabase" 2>/dev/null; then
    echo "❌ 必要なパッケージが不足しています"
    echo "📥 依存関係をインストール中..."
    pip install -r requirements.txt
fi

# サーバー起動
echo ""
echo "🚀 WatchMe管理システムを起動しています..."
echo "📍 URL: http://localhost:9000"
echo "🔄 自動リロード: 有効"
echo ""
echo "⏹️  停止するには Ctrl+C を押してください"
echo "================================================"

# uvicornでサーバー起動
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload