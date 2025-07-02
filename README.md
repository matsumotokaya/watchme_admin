# WatchMe 管理画面

WatchMe プロジェクトの管理画面です。FastAPI と Supabase を使用してユーザー、デバイス、ViewerLinkを管理します。

## 🚀 特徴

- **ユーザー管理**: システムに登録されているユーザーの表示・作成
- **デバイス管理**: 音声取得デバイスの登録・表示
- **ViewerLink管理**: ユーザーとデバイスの関連付け管理
- **モダンなUI**: Tailwind CSS を使用したレスポンシブな管理画面
- **Supabase連携**: リアルタイムデータベース操作
- **統計情報**: システム全体の統計表示

## 📊 データベース構造

### users テーブル
- `user_id` (UUID, Primary Key)
- `name` (String)
- `email` (String)
- `created_at` (DateTime)

### devices テーブル
- `device_id` (UUID, Primary Key)
- `device_type` (String)
- `registered_at` (DateTime)

### viewer_links テーブル
- `viewer_link_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `device_id` (UUID, Foreign Key)
- `start_time` (DateTime)
- `end_time` (DateTime, nullable)

## 📋 要件

- Python 3.8+
- Supabase プロジェクト（設定済み）

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone git@github.com:matsumotokaya/watchme_admin.git
cd watchme_admin
```

### 2. 仮想環境の作成

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate     # Windows
```

### 3. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 4. 環境変数の設定

`.env` ファイルを作成し、Supabase の設定を記載してください：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 5. サーバーの起動

```bash
python3 main.py
```

または

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload
```

## 🌐 API エンドポイント

### ユーザー管理
- `GET /api/users` - 全ユーザーを取得
- `POST /api/users` - 新しいユーザーを作成

### デバイス管理
- `GET /api/devices` - 全デバイスを取得
- `POST /api/devices` - 新しいデバイスを作成

### ViewerLink管理
- `GET /api/viewer-links` - 全ViewerLinkを取得
- `GET /api/viewer-links/details` - ユーザー・デバイス情報付きViewerLinkを取得
- `GET /api/viewer-links/by-user/{user_id}` - 特定ユーザーのViewerLinkを取得
- `POST /api/viewer-links` - 新しいViewerLinkを作成（ユーザーとデバイスを関連付け）
- `DELETE /api/viewer-links/{link_id}` - ViewerLinkを削除

### その他
- `GET /health` - ヘルスチェック
- `GET /api/stats` - システム統計情報
- `GET /` - 管理画面（HTML）

## 🏗️ プロジェクト構造

```
admin/
├── api/
│   └── supabase_client.py    # Supabase接続クライアント
├── models/
│   └── schemas.py            # 正しいPydanticモデル定義
├── templates/
│   └── index.html            # 管理画面HTML
├── static/
│   └── admin.js              # フロントエンド JavaScript
├── main.py                   # FastAPIメインアプリケーション
├── requirements.txt          # Python依存関係
├── .env                      # 環境変数（Supabase設定）
├── .gitignore               # Git除外ファイル
└── README.md                # このファイル
```

## 💻 使用方法

1. **サーバー起動後**: ブラウザで `http://localhost:9000` にアクセス
2. **ユーザー管理**: 「ユーザー管理」タブでユーザーの追加・確認
3. **デバイス管理**: 「デバイス管理」タブでデバイスの登録・表示
4. **ViewerLink管理**: 「ViewerLink管理」タブでユーザーとデバイスの関連付け管理

## 🔧 開発

### デバッグモード

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload --log-level debug
```

### API仕様書

サーバー起動後、以下のURLでAPI仕様書を確認できます：
- Swagger UI: `http://localhost:9000/docs`
- ReDoc: `http://localhost:9000/redoc`

### 動作確認テスト

```bash
# 基本的な接続テスト
curl http://localhost:9000/health

# APIテスト
curl http://localhost:9000/api/stats
```

## 🐛 トラブルシューティング

### ポートが使用中の場合

```bash
# 使用中のポートを確認
lsof -i :9000

# プロセスを終了
kill -9 <PID>
```

### Supabase接続エラー

1. `.env` ファイルの URL とキーを確認
2. Supabase プロジェクトが起動していることを確認
3. ネットワーク接続を確認

### 接続テスト

```bash
curl http://localhost:9000/api/stats
```

## 📝 開発履歴

- **v2.0** - 実際のSupabaseデータ構造に基づく完全な再設計
- **v1.0** - 初期バージョン（非推奨）

## ✅ 動作確認済み

- 実際のSupabaseデータ構造に完全対応
- 全APIエンドポイントが正常動作
- フロントエンドとバックエンドの完全統合

## 🤝 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。