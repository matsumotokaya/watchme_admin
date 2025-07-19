# WatchMe Admin

**WatchMe システムの管理画面**  
FastAPIとSupabaseを使用したデバイス・ユーザー管理システムです。

## 🌐 本番環境アクセス

**本番URL**: https://admin.hey-watch.me

### ✅ 移行完了（本番環境APIを使用）
**心理グラフタブ** - 以下3機能は本番マイクロサービスAPIに接続済み：
- 🎤 **Whisper音声文字起こし** → `https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe`
- 📝 **Whisperプロンプト生成** → `https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase`
- 🤖 **ChatGPTスコアリング** → `https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase`

**行動グラフタブ** - 以下機能は本番マイクロサービスAPIに接続済み：
- 🎵 **SED音響イベント検出** → `https://api.hey-watch.me/behavior-features/fetch-and-process`
- 📊 **SED Aggregator** → `https://api.hey-watch.me/behavior-aggregator/analysis/sed`

**感情グラフタブ** - 以下機能は本番マイクロサービスAPIに接続済み：
- 🎵 **OpenSMILE音声特徴量抽出** → `https://api.hey-watch.me/emotion-features/process/vault-data`
- 📊 **OpenSMILE Aggregator（感情集計）** → `https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator`

### 🎯 設計思想

#### ⚠️ 最重要：管理画面とマイクロサービスAPIの関係
**管理画面がどこで動いていても（開発環境・本番環境）、APIは常に本番環境のマイクロサービスを参照します**

- **開発環境（localhost:9000）で管理画面を起動** → APIは `https://api.hey-watch.me/...` を呼び出す
- **本番環境（admin.hey-watch.me）で管理画面を起動** → APIは同じく `https://api.hey-watch.me/...` を呼び出す
- **理由**：マイクロサービスは独立したシステムであり、開発環境にローカルAPIは存在しない
- **確認方法**：各機能のタイトル下に表示されているURLが実際の参照先

## 🔄 最新アップデート (2025-07-20)

### 🎤 Whisper音声文字起こし機能の大幅改善（他API処理のお手本実装）

#### 1. スケジューラーの新しい処理方式
**「過去24時間分を処理」の革新的なアプローチ**

従来の方式（データベースに問い合わせ）から、以下の新方式に変更：

1. **ファイルパスの機械的生成**
   - 現在時刻から基準点を計算（現在のタイムブロックの1つ前）
   - 48個のタイムスロット（30分単位）を機械的に生成
   - 例：現在が 2025-07-20 12:15 なら、11:30 から遡って48個のパスを生成

2. **データベースとの突き合わせ**
   ```python
   # 生成した各ファイルパスについて
   for file_path in generated_paths:
       # audio_filesテーブルでレコードの存在とステータスを確認
       if record.exists() and record.status == 'pending':
           pending_files.append(file_path)
   ```

3. **効率的な処理**
   - pendingファイルのみをWhisper APIに送信
   - completedやレコードなしはスキップ
   - 処理結果を詳細にログ出力

#### 2. UI/UXの改善
- **手動処理**：ファイルパスを直接入力して処理（複数可）
- **自動処理**：「過去24時間分を処理」ボタンで48スロットを一括チェック
- **ステータス表示**：Whisper APIの稼働状態をリアルタイム表示

#### 3. 他APIへの適用指針
このWhisper実装は、他のAPI（プロンプト生成、ChatGPT、SED等）の処理パターンとして活用できます：
- ファイルベースの処理が必要な場合は同様の生成方式を採用
- データベースとの突き合わせロジックを再利用
- ログ出力の詳細度を統一

## 🔄 最新アップデート (2025-07-19)

### ⚠️ 重要な仕様変更: Whisper APIインターフェース

#### 変更内容
1. **Whisper APIのパラメータ簡素化**
   - **変更前**: `device_id`, `date`, `model`, `file_paths` を送信
   - **変更後**: `file_paths`, `model` のみ送信
   - `device_id`と`date`は`file_path`から自動抽出されるため不要に

2. **レスポンス形式の変更**
   - `already_completed`フィールドを削除
   - より簡潔なサマリー情報に変更

3. **処理フローの改善**
   - 管理画面が`file_paths`リストを作成し、Whisper APIに送信
   - Whisper APIは受け取った`file_paths`のみを処理（データベース参照を廃止）
   - 責務の明確な分離：管理画面が処理対象を決定、APIは処理のみ実行

#### 実装の詳細
```javascript
// 新しいAPIリクエスト形式
payload = {
    "file_paths": file_paths,  // 処理対象ファイルのリストのみ
    "model": "base"
}
```

この変更により、システムがよりシンプルで理解しやすくなりました。

## ⚠️ 重要: Python実行環境について

### 1. Python コマンドについて
**このプロジェクトでは必ず `python3` コマンドを使用してください。**
- ❌ 使用禁止: `python`
- ✅ 必須使用: `python3`
- ✅ pip も同様: `pip3` を使用

### 2. 実行環境について
**このプロジェクトはグローバルPython3環境を使用します。**
- ✅ 推奨: グローバルのPython3環境で直接実行
- ✅ 必要なパッケージはグローバル環境にインストール
- 📁 `venv/` フォルダは過去の検証用で、現在は未使用

**セットアップ方針:**
- シンプルで確実な起動を重視
- 依存関係管理をグローバル環境で統一
- 起動時の環境問題を最小化

## 🐳 本番環境デプロイ方法

### 🔑 必要な情報
- **EC2サーバーIP**: `3.24.16.82`
- **SSHユーザー**: `ubuntu`
- **SSHキーファイル**: `~/watchme-key.pem`（ローカルPCに必要）

### 📋 デプロイ手順（ステップバイステップ）

#### 1️⃣ ローカルPCでの準備
```bash
# プロジェクトディレクトリに移動
cd /path/to/watchme

# デプロイ用のtarballを作成（不要なファイルは除外）
tar --exclude='admin/venv' --exclude='admin/__pycache__' --exclude='admin/*.log' --exclude='admin/.env' -czf admin.tar.gz admin/
```

#### 2️⃣ EC2サーバーへファイルをアップロード
```bash
# アプリケーションファイルをアップロード
scp -i ~/watchme-key.pem admin.tar.gz ubuntu@3.24.16.82:~/

# 環境設定ファイルを別途アップロード（重要）
scp -i ~/watchme-key.pem admin/.env ubuntu@3.24.16.82:~/admin.env
```

#### 3️⃣ EC2サーバーにSSH接続
```bash
# EC2サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
```

#### 4️⃣ EC2サーバー上での作業
```bash
# アップロードしたファイルを展開
tar -xzf admin.tar.gz

# 環境設定ファイルを正しい場所に配置
mv admin.env admin/.env

# adminディレクトリに移動
cd ~/admin
```

#### 5️⃣ Dockerでアプリケーションを更新・再起動
```bash
# 方法A: systemdサービスを使う（推奨）
sudo systemctl restart watchme-admin

# 方法B: Docker Composeを直接使う場合
docker-compose build
docker-compose down
docker-compose up -d
```

### ⚠️ デプロイが反映されない場合の対処法

**症状**: ファイルを更新してデプロイしたのに、ブラウザで古いバージョンが表示される

**原因と対処法**:

1. **Dockerビルドキャッシュが原因の場合**（最も多い）
   ```bash
   # キャッシュを無視して強制的に再ビルド
   cd ~/admin
   sudo docker-compose build --no-cache
   sudo docker-compose down
   sudo docker-compose up -d
   ```

2. **ブラウザキャッシュが原因の場合**
   - 強制リロード: `Cmd + Shift + R`（Mac）/ `Ctrl + Shift + R`（Windows）
   - 完全なキャッシュクリア: ブラウザ設定 → 閲覧履歴データの削除 → キャッシュされた画像とファイル

3. **確認手順**
   ```bash
   # ファイルが正しくアップロードされているか確認
   cat ~/admin/templates/index.html | grep "変更した部分"
   
   # コンテナが正常に起動しているか確認
   sudo docker ps | grep watchme-admin
   
   # コンテナのログを確認
   sudo docker logs watchme-admin --tail 50
   ```

**💡 ヒント**: Dockerfileは既に最適化されており、通常は`requirements.txt`が変更されない限りビルドは高速です。ただし、長期間更新していない場合はキャッシュが失効している可能性があるため、`--no-cache`オプションが必要になることがあります。

### ✅ デプロイ確認
```bash
# サービスの状態を確認
sudo systemctl status watchme-admin

# ログを確認（エラーがないか確認）
sudo journalctl -u watchme-admin -f --tail 50
```

### 🚨 トラブルシューティング
```bash
# SSH接続できない場合
# 1. キーファイルの権限を確認
chmod 600 ~/watchme-key.pem

# 2. 正しいIPアドレスか確認
ping 3.24.16.82

# サービスが起動しない場合
# 1. Dockerコンテナの状態を確認
docker ps -a

# 2. エラーログを確認
docker logs watchme-admin
```

### 🔧 systemd永続化設定

**本番環境では自動起動するようsystemdに登録済みです。**

```bash
# サービスの状態確認
sudo systemctl status watchme-admin

# サービスの停止
sudo systemctl stop watchme-admin

# サービスの起動
sudo systemctl start watchme-admin

# サービスの再起動
sudo systemctl restart watchme-admin

# ログの確認
sudo journalctl -u watchme-admin -f
```

### 🌐 HTTPS設定

**SSL証明書**: Let's Encryptで自動取得済み
- **証明書パス**: `/etc/letsencrypt/live/admin.hey-watch.me/`
- **自動更新**: certbotにより自動更新設定済み

**Nginx設定**:
```bash
# 設定ファイル確認
sudo cat /etc/nginx/sites-enabled/admin.hey-watch.me

# Nginx再起動
sudo systemctl reload nginx
```

### 🔄 本番環境運用コマンド

```bash
# コンテナ状態確認
docker ps | grep watchme-admin

# ログ確認
docker logs watchme-admin --tail 50

# コンテナの直接操作
docker exec -it watchme-admin bash

# 設定変更後の再起動
sudo systemctl restart watchme-admin
```

## 🛠️ ローカル開発環境

### 📋 必要な環境設定
```bash
# 1. 依存関係のインストール（グローバル環境に）
pip3 install -r requirements.txt

# 2. .envファイルの確認（必須）
# 以下の2つの設定が必要です：
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
```

### 🚀 起動方法（改善版）

#### ⚡ 推奨起動方法
```bash
# 既存プロセスを強制終了してから起動する安全な方法
./start.sh
```

**重要**: `start.sh`は以下の処理を自動で行います：
1. 既存のプロセスを停止
2. PIDファイル（`.server.pid`）を使用した確実なプロセス管理
3. ログファイル（`admin_server.log`）への出力
4. 起動成功・失敗の即座な確認

#### 💡 ログの確認
```bash
# リアルタイムログ監視
tail -f admin_server.log

# 起動・停止ログの確認
cat admin_server.log
```

#### 🔧 トラブルシューティング
```bash
# 起動確認
ps -p $(cat .server.pid)

# ログでエラー確認
tail -20 admin_server.log

# 手動停止（必要に応じて）
./stop.sh
```

### 🛑 停止方法

```bash
# 推奨: 停止スクリプトを使用
./stop.sh

# または、フォアグラウンド実行中の場合
# Ctrl+C でサーバーを停止
```

## 🎯 システム概要

### 🔍 用途・目的
- **WatchMe システムの管理画面**
- **ユーザー・デバイスの統合管理**
- **データベースフィールド名とUI表示の完全統一**
- **音声データ分析と可視化**

### 🚀 主要機能

#### 🧠 心理グラフ（Whisper統合）
- **音声文字起こし**: Whisper APIとの統合による音声認識
  - **API URL**: https://api.hey-watch.me/vibe-transcriber/
  - **モデル**: baseモデルのみ（サーバーリソース制約）
- **デバイス指定処理**: 特定のデバイスIDと日付での一括処理
- **Supabase直接保存**: 処理結果の即座なデータベース保存
- **高速起動**: 遅延初期化により起動時間を大幅短縮（3-5分→数秒）
- **プロンプト生成**: Whisperデータを統合してChatGPT分析用プロンプトを生成
- **ChatGPTスコアリング**: プロンプトを基にChatGPTで心理スコアを分析・保存

#### 🚶 行動グラフ（開発予定）
- **Coming Soon**: 行動パターン分析機能を開発中
- 行動パターンの可視化
- 時間別活動グラフ
- 移動パターンの把握

#### 😊 感情グラフ（開発予定）
- **Coming Soon**: 感情分析機能を開発中
- 感情スコアの可視化
- 喜怒哀楽の分析
- ストレスレベルの測定

#### ⚡ バッチ処理（新機能）
- **心理グラフ作成の自動化**: Whisper→プロンプト生成→ChatGPT分析の3ステップを一括実行
- **行動グラフ作成の自動化**: SED音響イベント検出→SED Aggregatorの2ステップを一括実行
- **指定条件での処理**: デバイスIDと日付を指定した自動処理
- **詳細ログ機能**: 各ステップの実行状況をプログレッシブに表示
- **リアルタイム感の演出**: ログエントリが段階的に表示される改善されたUX
- **エラー対応**: 各段階でのエラー詳細とステップ別処理状況を確認
- **API連携**: 複数のマイクロサービスAPIとの自動連携

#### 🔄 デバイス管理
- デバイス状態監視
- 音声データ管理
- UUID形式IDの全文表示とワンクリックコピー機能

#### 👥 ユーザー管理
- システムユーザーの管理
- 認証ユーザーとの統合
- UUID形式IDの全文表示とワンクリックコピー機能

#### 🔔 通知管理
- **個別通知作成**: 特定のユーザーに個別メッセージを送信
- **一括通知送信**: 全ユーザーまたは指定ユーザーへの同時送信
- **通知統計ダッシュボード**: 総通知数・未読数・タイプ別集計の可視化
- **通知履歴管理**: 送信済み通知の詳細確認・削除機能
- **リアルタイム連携**: WatchMe v8ダッシュボードへの即座な通知表示

## 🔄 最新アップデート

### ✅ ESモジュール化リファクタリング完了 (2025-07-12)

#### 🎯 実施内容
- **コンポーネントベース分割**: `admin.js`（1500行）を機能別モジュールに分割
- **ESモジュール統合**: `import/export`構文による現代的なJavaScript構成
- **依存関係最適化**: モジュール間の適切な依存関係管理

#### 📁 新しいファイル構成
```
static/
├── admin.js              # メインエントリーポイント（81行）
├── core.js               # 共通機能・状態管理（264行）
├── userManagement.js     # ユーザー管理モジュール（281行）
├── deviceManagement.js   # デバイス管理モジュール（310行）
└── notificationManagement.js # 通知管理モジュール（421行）
```

#### 🚀 改善効果
- **保守性向上**: 機能別モジュール化により可読性が大幅向上
- **安定性強化**: 依存関係の整理によりUIフリーズ問題を解決
- **開発効率**: 各機能の独立開発・テストが可能
- **拡張性**: 新機能追加時の影響範囲を最小化

#### 🔧 技術詳細
- **状態管理**: `state`オブジェクトによる統一された状態管理
- **イベント処理**: モジュール間の適切なイベントハンドリング
- **API統合**: 各モジュールの独立したAPI呼び出し処理
- **ページネーション**: 共通ページネーション機能の再利用

#### ✅ 動作確認済み機能
- ユーザー管理: 3件のユーザーデータ表示・操作
- デバイス管理: 1件のiOSデバイス表示・操作  
- 通知管理: 11件の通知データ表示・操作
- 統計表示: リアルタイム統計情報更新

## 📊 データベース構造

### users テーブル
- `user_id` (UUID, Primary Key, auth.users.id外部キー)
- `name` (String)
- `email` (String, Optional)
- `status` (String) - 'guest', 'member', 'subscriber'
- `subscription_plan` (String, Optional) - 'basic', 'premium', 'enterprise'
- `newsletter_subscription` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime, Optional)

### notifications テーブル
- `id` (String, Primary Key)
- `user_id` (UUID, Foreign Key to users.user_id)
- `type` (String) - 'system', 'alert', 'promotion', 'update'
- `title` (String)
- `message` (String)
- `triggered_by` (String) - 送信者（default: 'admin'）
- `metadata` (JSON, Optional)
- `is_read` (Boolean, default: false)
- `created_at` (DateTime)

### devices テーブル - 音声取得デバイス
- `device_id` (UUID, Primary Key)
- `owner_user_id` (UUID, Optional, users.user_id外部キー)
- `device_type` (String) - デバイス種別
- `platform_type` (String, Optional) - 'iOS', 'Android', 'Web'
- `platform_identifier` (String, Optional) - プラットフォーム固有ID
- `status` (String) - デバイス状態 (active/inactive/syncing/error)
- `registered_at` (DateTime) - 登録日時
- `last_sync` (DateTime, Optional) - 最終同期時刻
- `total_audio_count` (Integer) - 総音声データ数
- `qr_code` (String, Optional) - QRコード情報

### notifications テーブル - 通知管理
- `id` (UUID, Primary Key) - 通知ID
- `user_id` (UUID, users.user_id外部キー) - 通知対象ユーザー
- `type` (String) - 通知タイプ ('announcement', 'event', 'system')
- `title` (String) - 通知タイトル
- `message` (String) - 通知メッセージ
- `is_read` (Boolean) - 既読フラグ（デフォルト: false）
- `created_at` (DateTime) - 作成日時
- `triggered_by` (String, Optional) - 送信者・システム名
- `metadata` (JSONB, Optional) - 追加メタデータ



## 📋 システム要件

### サーバー要件
- **Python 3.8+**
- **Supabase プロジェクト** (設定済み)

### デバイス要件
- **音声取得デバイス**: iPhone, Android, iPad, PCなど
- **自動音声送信機能**: 常時データ送信対応

### ブラウザ要件
- **モダンブラウザ** (Chrome, Firefox, Safari, Edge 最新版)
- **JavaScript 有効**
- **Canvas API 対応** (QRコード、グラフ表示用)

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

#### 🚀 推奨起動方法
```bash
# 起動スクリプト（ポート解放・依存関係確認付き）
./start.sh

# 停止スクリプト
./stop.sh
```

#### ⚡ その他の起動方法
```bash
# Python直接実行（最速だが依存関係確認なし）
python3 start_fast.py

# 開発モード（リロード機能付き）
python3 main.py
```

#### 🔧 手動起動
```bash
# 最小限の起動コマンド
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000

# ログレベル調整版
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --log-level warning
```

## 🌐 API エンドポイント

### 📈 ユーザー管理 API（ページネーション対応）
- `GET /api/users?page=1&per_page=20` - ページネーション付きユーザー取得
- `GET /api/users/all` - 全ユーザーを取得（後方互換性）
- `POST /api/users` - 新しいユーザーを作成

### 🎤 デバイス管理 API（ページネーション対応）
- `GET /api/devices?page=1&per_page=20` - ページネーション付きデバイス取得
- `GET /api/devices/all` - 全デバイスを取得（後方互換性）
- `POST /api/devices` - 新しいデバイスを作成
- `GET /api/devices/{device_id}/status` - デバイス状態取得
- `PUT /api/devices/{device_id}` - デバイス情報更新
- `PUT /api/devices/{device_id}/sync` - デバイス同期完了通知

### 🔔 通知管理 API（ページネーション対応）
- `GET /api/notifications?page=1&per_page=20` - ページネーション付き通知取得（管理画面用）
- `GET /api/notifications/all` - すべての通知を取得（後方互換性）
- `GET /api/notifications/user/{user_id}` - 特定ユーザーの通知を取得
- `POST /api/notifications` - 新しい通知を作成
- `POST /api/notifications/broadcast` - 一括通知送信
- `PUT /api/notifications/{notification_id}` - 通知を更新（既読状態など）
- `DELETE /api/notifications/{notification_id}` - 通知を削除
- `GET /api/notifications/stats` - 通知統計情報を取得

#### ページネーションパラメータ
- `page`: ページ番号（1から開始、デフォルト: 1）
- `per_page`: 1ページあたりのアイテム数（1-100、デフォルト: 20）

#### ページネーションレスポンス形式
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "total_pages": 5,
  "has_next": true,
  "has_prev": false
}
```

### 🧠 Whisper統合 API
- **外部API**: `POST http://localhost:8001/fetch-and-transcribe` - Whisper音声文字起こし処理

### ⚡ バッチ処理 API
- `POST /api/batch/create-psychology-graph` - 心理グラフ作成バッチ処理
  - **パラメータ**: `device_id` (UUID), `date` (YYYY-MM-DD)
  - **処理ステップ**: Whisper音声文字起こし → プロンプト生成 → ChatGPT分析
  - **戻り値**: 各ステップの実行結果・エラー詳細・処理データ

### 📉 システム情報 API
- `GET /health` - ヘルスチェック
- `GET /api/stats` - システム統計情報 (アクティブデバイス数、総音声データ数など)
- `GET /` - WatchMe管理画面 (メインUI)

## 🏗️ プロジェクト構造

```
admin/
├── api/
│   └── supabase_client.py       # Supabase接続クライアント
├── models/
│   └── schemas.py               # WatchMe対応 Pydanticモデル定義（通知管理含む）
├── templates/
│   └── index.html               # WatchMe管理画面 (音声心理分析UI)
├── static/
│   └── admin.js                 # WatchMeフロントエンド (ページネーション対応、通知管理)
├── main.py                      # WatchMe FastAPIアプリケーションサーバー
├── requirements.txt             # Python依存関係
├── .env                         # 環境変数 (Supabase設定)
├── .env.example                 # 環境変数サンプル
├── .gitignore                   # Git除外ファイル (調査ファイルも除外)
├── REQUIREMENTS_ANALYSIS.md     # WatchMe要件分析書
└── README.md                    # このファイル
```

## 💻 WatchMeシステム使用方法

### 🚀 クイックスタート

1. **サーバー起動後**: ブラウザで `http://localhost:9000` にアクセス

2. **心理グラフ（Whisper統合）**: メインタブでWhisper音声文字起こし機能を使用
   - デバイスIDと日付を指定
   - Whisperモデル（Medium/Large）を選択
   - 処理開始ボタンで一括文字起こし実行
   - 結果はSupabaseに直接保存

3. **プロンプト生成**: 心理グラフタブ内で利用可能
   - デバイスIDと日付を指定
   - Whisperデータを統合してChatGPT分析用プロンプトを生成
   - vibe_whisper_promptテーブルに保存

4. **ChatGPTスコアリング**: 心理グラフタブ内で利用可能
   - デバイスIDと日付を指定
   - ChatGPT APIで心理スコアを分析
   - 平均スコア、ポジティブ/ネガティブ/ニュートラル時間を表示
   - インサイトと感情変化ポイントを可視化
   - vibe_whisper_summaryテーブルに保存

5. **バッチ処理**: 心理グラフ作成の自動化機能
   - デバイスIDと日付を指定
   - Whisper→プロンプト生成→ChatGPT分析の3ステップを自動実行
   - リアルタイムログでステップ別進行状況を確認
   - エラー発生時は詳細なエラー情報を表示
   - 各APIサーバーとの連携を自動化

6. **行動グラフ**: 🚧 開発中（Coming Soon）
   - 行動パターン分析機能の実装予定

7. **感情グラフ**: 🚧 開発中（Coming Soon）
   - 感情分析機能の実装予定

### 🔧 管理者機能

8. **ユーザー管理**: システムユーザーの追加・確認
   - 認証ユーザーの管理
   - ゲスト・会員・サブスクライバーの管理
   - UUID形式IDのクリックコピー機能

9. **デバイス管理**: 音声取得デバイスの登録・状態管理
   - デバイス状態の監視
   - 音声データ数の管理
   - UUID形式IDのクリックコピー機能

10. **通知管理（ページネーション対応）**: ユーザーへの通知作成・送信・管理
   - **個別通知作成**: ユーザーID・タイプ・タイトル・メッセージを指定して個別送信
   - **一括通知送信**: 全ユーザーまたは指定したユーザーリストへの一括送信
   - **通知統計表示**: 総通知数・未読数・既読数・タイプ別集計をリアルタイム表示
   - **通知履歴管理**: 送信済み通知のページネーション付き一覧表示・詳細確認・削除機能
   - **WatchMe連携**: 作成した通知がWatchMe v8ダッシュボードに即座に反映
   - **大量データ対応**: ページネーション機能により数千件の通知も高速表示

### 🔐 セキュリティ

WatchMeシステムでは、音声データの適切な管理とプライバシー保護を重視しています。

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

### 🔄 ポート関連エラー

```bash
# 使用中のポートを確認
lsof -i :9000

# uvicornプロセスを一括終了
pkill -f "uvicorn"

# 特定プロセスを終了
kill -9 <PID>
```

### 📡 Supabase接続エラー

1. **環境変数確認**:
   ```bash
   cat .env
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_KEY=your-anon-key
   ```

2. **Supabaseプロジェクト状態確認**:
   - Supabaseダッシュボードでプロジェクトがアクティブか確認
   - API URLとキーが正しいか確認

3. **ネットワーク接続確認**:
   ```bash
   ping your-project.supabase.co
   ```

### 🔍 データベーススキーマエラー

- **テーブル不存在エラー**: `users`, `devices`, `viewer_links`テーブルが存在するか確認
- **フィールドエラー**: `status`, `last_sync`, `total_audio_count`フィールドが追加されているか確認

### 🎤 音声データエラー

- **グラフが表示されない**: 現在はサンプルデータで表示されます
- **QRコードエラー**: ブラウザのCanvas API対応を確認
- **デバイス同期エラー**: デバイスIDが正しいか確認

### 🗺️ 時間範囲エラー

- **ViewerLink作成失敗**: start_timeとend_timeが必須であることを確認
- **アクセス拒否**: 現在時刻が許可範囲内か確認
- **時間順序エラー**: 開始時刻 < 終了時刻の順序を確認

### ⚙️ 接続テストコマンド

```bash
# ヘルスチェック
curl http://localhost:9000/health

# 統計情報取得
curl http://localhost:9000/api/stats

# APIドキュメント確認
open http://localhost:9000/docs

# メインUI確認
open http://localhost:9000
```

## 🕰️ WatchMeシステムの進化

### 📋 開発マイルストーン

- **v3.3 (2025-07-03)** - データベーススキーマ完全最適化
  - 🗄️ users.user_id 主キー化完了（auth.users.id直接参照）
  - 🔗 auth.users との完全統合（外部キー制約設定）
  - 🧹 不要な users.id カラム削除によるスキーマ簡素化
  - ✅ 全外部キー関係の整合性確保
  - 📊 パフォーマンス最適化インデックス追加

- **v3.2 (2025-07-03)** - ユーザーステータス管理システム完全実装
  - 📱 ゲスト→会員→サブスクユーザーの段階的ステータス管理
  - 🎯 アプリUX仕様書完全対応（no login → guest → member → subscriber）
  - 📱 スマホ仮想デバイス自動登録システム（iOS/Android対応）
  - 🗄️ データベース構造完全対応（owner_user_id連携システム）
  - 🔧 Auth不要ゲストユーザー作成API実装
  - ⚡ 管理画面API・UI完全対応

- **v3.1 (2025-07-02)** - ユーザー認証システム完全統合
  - 🔐 マーケティングサイト認証連携
  - 🗄️ auth.users + public.users 統合データベース
  - 🎯 ダッシュボード・マイページ開発指針策定
  - 🔗 システム間API連携パターン確立
  - 📋 統合アーキテクチャ設計完了

- **v3.0 (WatchMe対応)** - 音声データ心理分析システム完全対応
  - 📱 自分のデバイス一覧機能
  - 📊 心理・行動・感情グラフ表示
  - 📦 QRコードデバイスリンク機能
  - ⚙️ 時間範囲必須化セキュリティ強化
  - 🔄 デバイス状態リアルタイム監視

- **v2.0** - 実際のSupabaseデータ構造に基づく完全な再設計
- **v1.0** - 初期バージョン（非推奨）

### ✅ 現在の実装状態

#### ✅ 完全実装済み
- 実際のSupabaseデータ構造に完全対応
- 全管理APIエンドポイントが正常動作
- WatchMe新機能 API完全実装
- モダンUI/UXデザイン
- 時間範囲制御セキュリティ
- リアルタイム状態監視

#### 🚧 部分実装（将来版対応）
- **音声データテーブル**: `audio_data`, `graph_data`, `device_sessions`
- **実際の音声解析エンジン**: 現在はサンプルデータで動作
- **30分/1時間単位自動グラフ生成**: 手動グラフ生成は実装済み
- **モバイルアプリ連携**: QRコードベースの基本機能は実装済み

### 🚀 今後の開発予定

1. **フェーズ2**: 音声データテーブル実装
2. **フェーズ3**: 実際の音声解析エンジン統合
3. **フェーズ4**: 自動グラフ生成パイプライン
4. **フェーズ5**: モバイルアプリ完全統合

## 🔐 ユーザー認証連携システム

### 📋 マーケティングサイト連携
WatchMe管理システムは、マーケティングサイト（`/web_marketing`）のユーザー認証システムと完全連携しています。

**マーケティングサイト認証**:
- 新規会員登録・ログイン機能
- Supabase Auth統合
- auth.users + public.users 二重保存システム

### 🗄️ 統合データベース構造

**共通データベース**: 同一Supabase プロジェクト `qvtlwotzuzbavrzqhyvt`

#### 認証テーブル（マーケティングサイト管理）
```sql
-- auth.users（Supabase認証システム）
- id (UUID) - 認証ユーザーID
- email - メールアドレス
- raw_user_meta_data - メタデータ（表示名等）

-- public.users（プロファイル情報）
- user_id (UUID) - auth.usersのidと連携
- name (TEXT) - 表示名
- email (TEXT) - メールアドレス
- newsletter_subscription (BOOLEAN)
- created_at, updated_at
```

#### WatchMe管理テーブル（管理システム管理）
```sql
-- devices（音声取得デバイス）
-- viewer_links（時間範囲制限付きアクセス権限）
-- audio_data（将来実装）
-- graph_data（将来実装）
-- device_sessions（将来実装）
```

### 🔗 システム間連携

#### ユーザーフロー
1. **マーケティングサイト**: 新規会員登録 → auth.users + public.users 作成
2. **管理システム**: public.users.user_id を使用してデバイス・データ管理
3. **ダッシュボード開発**: 同一user_idでユーザー情報・デバイス・音声データを統合表示

#### API連携パターン
```python
# 管理システムでのユーザー情報取得例
async def get_user_profile(user_id: UUID):
    # public.usersからプロファイル取得
    user = await supabase.table('users').select('*').eq('user_id', user_id).single()
    
    # 同一user_idでデバイス情報取得
    devices = await supabase.table('devices').select('*').eq('user_id', user_id)
    
    return {"profile": user, "devices": devices}
```

### 🎯 ダッシュボード・マイページ開発指針

#### 推奨開発フロー
1. **認証状態確認**: Supabase Auth セッション確認
2. **ユーザー情報取得**: public.users テーブルから name, email 取得
3. **デバイス一覧表示**: devices テーブルから user_id で絞り込み
4. **音声データ表示**: audio_data テーブル（実装時）から関連データ取得

#### マイページ必須要素
```javascript
// マイページで使用する基本データ構造
const userDashboard = {
    profile: {
        name: "ユーザー表示名",    // public.users.name
        email: "user@example.com", // public.users.email
        userId: "uuid-string"      // auth.users.id
    },
    devices: [
        {
            deviceId: "uuid",
            deviceType: "iPhone",
            status: "active",
            totalAudioCount: 150,
            lastSync: "2025-07-02T23:30:00Z"
        }
    ],
    analytics: {
        // 音声分析データ（将来実装）
        emotionTrends: [],
        behaviorPatterns: []
    }
}
```

#### セキュリティ考慮事項
- **RLS（Row Level Security）**: すべてのテーブルで auth.uid() = user_id 制限
- **時間範囲制御**: viewer_links での厳密なアクセス制御
- **デバイス認証**: QRコード・デバイスIDによる安全な連携
- **ゲストユーザー**: Auth不要だが一意性は保証（UUID）

### 🔄 ユーザーステータス管理システム

#### 📋 ユーザーステータス遷移
```
no login → guest → member → subscriber
```

#### 🎯 主要API追加
- **POST /api/users/guest**: ゲストユーザー作成（Auth不要）
- **POST /api/users/{user_id}/upgrade**: ゲスト→会員アップグレード
- **PUT /api/users/{user_id}/status**: ステータス更新（サブスク加入等）
- **POST /api/devices/virtual-mobile**: スマホ仮想デバイス作成
- **GET /api/users/{user_id}/devices**: ユーザーのデバイス一覧（新仕様）
- **GET /api/users/by-status/{status}**: ステータス別ユーザー一覧

#### 📱 スマホ仮想デバイス対応
- **iOS**: identifierForVendor 使用
- **Android**: ANDROID_ID 使用  
- **重複管理**: platform_identifier で一意性保証
- **所有者更新**: 既存デバイスのオーナー変更対応

### 🔧 開発環境設定

#### 共通環境変数
```env
# 両システム共通のSupabase設定
SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 管理システム設定
ADMIN_PORT=9000

# マーケティングサイト設定
NODE_ENV=development
```

#### 開発時の注意点
1. **データ整合性**: user_id の一致を常に確認
2. **権限管理**: 適切なRLSポリシー設定
3. **エラーハンドリング**: 認証エラー・権限エラーの適切な処理
4. **テストデータ**: Gmail+エイリアス機能での安全なテスト

### ⚡ 次期開発優先度

#### 高優先度
1. **統合ダッシュボード**: ユーザープロファイル + デバイス管理UI
2. **マイページ**: 個人設定・デバイス一覧・分析結果表示
3. **データ可視化**: Chart.js による音声分析グラフ

#### 中優先度
1. **音声データ管理**: アップロード・分析・表示機能
2. **通知システム**: メール・アプリ内通知
3. **デバイス管理**: リアルタイム状態監視

この統合アーキテクチャにより、マーケティング→登録→管理→分析の完全なユーザージャーニーが実現されています。

## 📚 関連ドキュメント

- **[REQUIREMENTS_ANALYSIS.md](./REQUIREMENTS_ANALYSIS.md)**: WatchMe要件定義書と現在実装の差異分析
- **[.env.example](./.env.example)**: 環境変数のサンプル設定

## 🔒 セキュリティガイドライン

### ❗ 重要なセキュリティ要件

1. **時間範囲必須**: すべてのViewerLinkでstart_timeとend_timeは必須
2. **データアクセス制御**: 許可時間外のデータアクセスを禁止
3. **リアルタイム検証**: アクセス時に時間範囲を自動検証
4. **QRコード有効期限**: 24時間制限でセキュリティ強化

### 👀 プライバシー保護

- **音声データ**: 最高レベルの機密性で取り扱い
- **時間制限アクセス**: 不必要なデータ蔵露を防止
- **ユーザー同意**: 明示的な時間範囲設定で透明性を確保

## 🤝 貢献ガイドライン

### 💙 開発参加手順

1. **リポジトリフォーク**: このリポジトリをフォーク
2. **フィーチャーブランチ作成**: `git checkout -b feature/amazing-feature`
3. **WatchMe要件確認**: REQUIREMENTS_ANALYSIS.mdで系統要件を確認
4. **コード変更**: コーディングスタンダードに従って実装
5. **テスト実行**: 新機能の動作確認
6. **コミット**: `git commit -m 'Add amazing WatchMe feature'`
7. **プッシュ**: `git push origin feature/amazing-feature`
8. **プルリクエスト作成**: 詳細な説明とともに提出

### 🏆 優先開発エリア

1. **音声データテーブル実装** (高優先度)
2. **実際の音声解析エンジン統合** (中優先度)
3. **モバイルアプリ連携強化** (中優先度)
4. **高度なグラフ分析機能** (低優先度)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

## 🎤 Whisper音声文字起こしシステム

### 📋 概要
WatchMe管理画面のWhisper音声文字起こしシステムは、音声ファイルを効率的に処理し、文字起こしを行うための統合ソリューションです。

### 🔄 システムアーキテクチャ

```
[audio_files テーブル] → [管理画面] → [Whisper API] → [vibe_whisper テーブル]
     ↑                                         ↓
  Vault API                                  S3
```

### 📊 重要なテーブル構造

#### audio_files テーブル（音声ファイル管理）
```sql
CREATE TABLE audio_files (
    device_id        text,
    recorded_at      timestamp with time zone,
    file_path        text,                    -- S3ファイルパス
    whisper_status   text DEFAULT 'pending',  -- 処理状態: pending/completed
    file_size_bytes  bigint,
    duration_seconds float,
    created_at       timestamp with time zone,
    PRIMARY KEY (device_id, recorded_at)
);
```

#### vibe_whisper テーブル（文字起こし結果）
```sql
CREATE TABLE vibe_whisper (
    device_id     text,
    date          date,
    time_block    text,  -- 例: "14-30"
    transcription text,
    PRIMARY KEY (device_id, date, time_block)
);
```

### 🚀 Whisper音声文字起こし（手動実行）

#### 機能概要
- **目的**: 指定したファイルパスの音声データを手動で文字起こし
- **エンドポイント**: `POST /api/whisper/fetch-and-transcribe`
- **実際のAPI**: `https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe`

#### 新しいインターフェース（2025-07-20更新）
```javascript
// ファイルパス直接指定方式
{
    "file_paths": [
        "files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-20/14-30/audio.wav",
        "files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-20/15-00/audio.wav"
    ],
    "model": "base"
}
```

#### 処理フロー
1. ユーザーがデバイスIDと日付を入力
2. Whisper APIに処理リクエストを送信
3. APIが48スロット（30分単位）全てをチェック
4. 存在する音声ファイルのみ文字起こし
5. 結果をvibe_whisperテーブルに保存

### 🧪 Whisper自動スケジューラー（試験版）

#### 機能概要
- **目的**: 24時間分の未処理音声ファイルを自動的に検出・処理
- **実行タイミング**: 3時間おき（0:00, 3:00, 6:00, 9:00, 12:00, 15:00, 18:00, 21:00）
- **処理対象**: 過去24時間分の音声データ（30分スロット×48個）

#### 🔄 2025-07-20 革新的アップデート: ファイルパス生成方式

##### 新しい処理方式の特徴
1. **機械的なファイルパス生成**
   - データベースに問い合わせる前に、48個のファイルパスを機械的に生成
   - 現在時刻から基準点を計算し、30分単位で遡る
   - 例：`files/{device_id}/2025-07-20/14-30/audio.wav`

2. **効率的なデータベース確認**
   ```python
   # 生成した各ファイルパスについて個別に確認
   for file_path in generated_paths:
       record = SELECT * FROM audio_files WHERE file_path = ?
       if record and record.transcriptions_status == 'pending':
           pending_files.append(file_path)
   ```

3. **詳細なログ出力**
   ```
   🕐 基準時刻: 2025-07-20 11:30
   📋 48スロット分のファイルパスを生成しました
   🔍 データベースとの突き合わせを開始...
     ✅ 11-30 - pending状態、処理対象に追加
     ⏭️ 11-00 - completed、スキップ
     ❌ 10-30 - レコードなし、スキップ
   ```

#### 処理フロー（2025-07-20版）

```python
# 1. 48個のファイルパスを機械的に生成
generated_paths = []
base_time = calculate_base_time()  # 現在のタイムブロックの1つ前
for i in range(48):
    slot_time = base_time - timedelta(minutes=30 * i)
    file_path = f"files/{device_id}/{date}/{time_block}/audio.wav"
    generated_paths.append(file_path)

# 2. 各パスをデータベースと突き合わせ
pending_files = []
for path in generated_paths:
    if check_database(path) == 'pending':
        pending_files.append(path)

# 3. pendingファイルのみをWhisper APIに送信
{
    "file_paths": pending_files,
    "model": "base"
}

# 3. Whisper APIは指定されたファイルのみを処理
# （無駄な48スロット試行なし）
```

#### ログ表示の改善

##### 改善前
```
📆 2025-07-18 の処理を開始...
ℹ️ 2025-07-18: 新規処理なし (処理済み: 2件, 音声なし: 0件)
```

##### 改善後
```
📋 audio_filesテーブル確認: 6件の未処理ファイルを検出
📆 2025-07-18 の処理を開始... (未処理: 6件)
  📁 12-00 のファイルを処理対象に追加
  📁 14-00 のファイルを処理対象に追加
  📁 16-00 のファイルを処理対象に追加
  📁 18-30 のファイルを処理対象に追加
  📁 20-30 のファイルを処理対象に追加
  📁 21-00 のファイルを処理対象に追加
✅ 2025-07-18: 6件の新規文字起こし完了
```

### 🎯 他のグラフツール向けスケジューラー実装ガイドライン

#### 1. 基本設計パターン

```python
class BaseScheduler:
    """スケジューラーの基本クラス"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.logs = []
        self.job_id = "unique_scheduler_id"
        
    async def _process_data(self):
        """メイン処理ロジック"""
        # 1. 処理対象データの取得（テーブルから）
        # 2. 外部APIへのリクエスト
        # 3. 結果の保存
        # 4. ログ記録
```

#### 2. audio_filesテーブル統合パターン

```python
async def get_pending_files(device_id: str, hours: int = 24):
    """未処理ファイルの取得"""
    supabase_client = get_supabase_client()
    
    # audio_filesテーブルから未処理ファイルを取得
    all_files = await supabase_client.select(
        "audio_files",
        filters={"device_id": device_id}
    )
    
    # 時間範囲とステータスでフィルタリング
    pending_files = []
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    for file in all_files:
        recorded_at = datetime.fromisoformat(file['recorded_at'].replace('+00:00', ''))
        if recorded_at >= cutoff_time and file.get('whisper_status') == 'pending':
            pending_files.append(file)
            
    return pending_files
```

#### 3. 効率的なAPI呼び出しパターン

```python
# ❌ 悪い例: 全スロットを盲目的に試行
for hour in range(24):
    for minute in ["00", "30"]:
        try:
            process_slot(f"{hour:02d}-{minute}")
        except FileNotFoundError:
            pass  # 404エラーを無視

# ✅ 良い例: 実際に存在するファイルのみ処理
pending_files = await get_pending_files(device_id)
file_paths = [f['file_path'] for f in pending_files]

if file_paths:
    response = await api_call({
        "device_id": device_id,
        "date": date,
        "file_paths": file_paths  # 処理対象を明示
    })
```

#### 4. ログ記録のベストプラクティス

```python
def _add_log(self, status: str, message: str):
    """統一されたログフォーマット"""
    log_entry = {
        "timestamp": datetime.now(),
        "status": status,  # success/info/warning/error
        "message": message,
        "details": {
            "processed_count": 0,
            "skipped_count": 0,
            "error_count": 0
        }
    }
    self.logs.append(log_entry)
```

#### 5. エラーハンドリング

```python
try:
    # メイン処理
    result = await process_files(file_paths)
    self._add_log("success", f"✅ 処理完了: {len(result)}件")
except Exception as e:
    self._add_log("error", f"❌ エラー: {str(e)}")
    # エラーでも処理を継続
    continue
```

### 📝 実装チェックリスト

他のグラフツール（行動グラフ、感情グラフ）でスケジューラーを実装する際のチェックリスト：

- [ ] audio_filesテーブルとの連携実装
- [ ] file_pathを活用した効率的な処理
- [ ] 処理状態（pending/completed）の適切な管理
- [ ] 詳細なログ記録（処理対象ファイルの明示）
- [ ] エラーハンドリングと継続処理
- [ ] 3時間おきの自動実行設定
- [ ] 手動実行（今すぐ実行）機能
- [ ] UIでの状態表示とログ表示
- [ ] 後方互換性の維持

### 🔧 技術仕様

#### WhisperTrialSchedulerクラス
- **場所**: `/admin/main.py`
- **主要メソッド**:
  - `start_trial_scheduler()`: スケジューラー開始
  - `stop_trial_scheduler()`: スケジューラー停止
  - `_process_whisper_slots()`: メイン処理ロジック
  - `run_now()`: 手動実行

#### APIエンドポイント
- `POST /api/whisper-trial-scheduler/start`: スケジューラー開始
- `POST /api/whisper-trial-scheduler/stop`: スケジューラー停止
- `GET /api/whisper-trial-scheduler/status`: 状態取得
- `POST /api/whisper-trial-scheduler/run-now`: 即時実行

## 🔧 最新のアップデート

### ✨ 新機能・改善点（2025-07-18）
- **🔄 Whisper自動スケジューラーの根本的改善**: audio_filesテーブル統合による効率化
  - audio_filesテーブルから未処理ファイルを検出
  - file_pathを活用した効率的な処理（無駄な404エラーを削減）
  - 詳細なログ表示（処理対象ファイルを明確に表示）
  - 処理時間の大幅短縮とネットワーク最適化

### ✨ 新機能・改善点（2025-07-15）
- **🔄 マイクロサービス化完了**: Whisperプロンプト生成機能を独立したマイクロサービスAPIに移行
  - **外部API統合**: `https://api.hey-watch.me/vibe-aggregator/` への完全移行
  - **エンドポイント統一**: 直接UI操作とバッチ処理で同じAPIを使用
  - **本番環境対応**: HTTPS対応の外部URLで安全にアクセス
  - **動作確認済み**: 開発環境・本番環境での動作テスト完了
- **🎯 機能統合**: 心理グラフタブのWhisperプロンプト生成機能を外部マイクロサービスに統合
  - **変更前**: `http://localhost:8002/generate-prompt` (POST) → **変更後**: `https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase` (GET)
  - **バッチ処理**: `http://localhost:8009/` → `https://api.hey-watch.me/vibe-aggregator/` に統一
  - **レスポンス形式**: 外部APIの戻り値に合わせてUI表示を最適化
- **🏗️ アーキテクチャ改善**: ローカル依存からマイクロサービス化によるスケーラビリティ向上
  - **保守性**: 単一のAPIエンドポイントで管理が簡単
  - **一貫性**: バッチ処理と直接UI操作で同じAPIを使用
  - **拡張性**: 他のサービスからも同じAPIを利用可能
- **🛠️ 起動スクリプト安定化**: start.shとstop.shの連携を根本的に改善
  - **PID管理**: `.server.pid`ファイルによる確実なプロセス管理
  - **ログ出力**: `admin_server.log`ファイルによる詳細なエラー追跡
  - **起動確認**: プロセス起動の成功・失敗を即座に確認
  - **信頼性向上**: 起動・停止・再起動の全プロセスが堅牢で確実に動作

### ✨ 新機能・改善点（2025-07-14）
- **🌐 本番環境デプロイ完了**: EC2上でDocker化による本番環境構築
  - **HTTPS対応**: admin.hey-watch.me でSSL/TLS暗号化通信
  - **自動起動設定**: systemdによる永続化と自動起動設定
  - **Let's Encrypt**: SSL証明書の自動取得・更新設定
  - **Nginx**: リバースプロキシによる安全なアクセス制御
- **🔄 API外部公開**: Whisper APIを外部から利用可能に
  - **新エンドポイント**: https://api.hey-watch.me/vibe-transcriber/
  - **モデル制限**: サーバーリソースの制約により、baseモデルのみサポート
  - **CORS対応**: 管理画面からの直接アクセスが可能
- **🐳 Docker化**: コンテナベースの安定した実行環境
  - **docker-compose**: シンプルな起動・停止管理
  - **systemd統合**: サーバー再起動時の自動復旧
  - **ログ管理**: systemd journalによる集中ログ管理
- **📋 運用ドキュメント**: 本番環境の運用手順を完全整備
  - **デプロイ手順**: 段階的なデプロイプロセスの文書化
  - **運用コマンド**: 日常運用に必要なコマンド集
  - **トラブルシューティング**: 問題発生時の対応手順

### ✅ マイクロサービス移行完了状況
- **Whisperプロンプト生成**: ✅ 完了 - 外部マイクロサービスAPIに移行済み
- **基本管理機能**: ✅ 完了 - ユーザー・デバイス・通知管理は本番環境で動作中
- **バッチ処理**: ✅ 完了 - Whisperプロンプト生成ステップは外部API対応済み

### ⚠️ 残り移行作業
- **ChatGPT分析API**: 🔄 移行予定 - 現在localhost参照のため段階的に修正予定
- **その他分析API**: 🔄 移行予定 - 各種分析APIとの接続は段階的に本番用に修正予定

## 🔧 過去のアップデート（2025-07-08）

### ✨ 新機能・改善点（2025-07-12）
- **⚡ バッチ処理機能完全実装**: 心理グラフ作成の3ステップを自動化した一括処理機能を追加
  - **Whisper音声文字起こし**: 指定デバイス・日付の音声データを自動取得・文字起こし
  - **プロンプト生成**: Whisperデータを統合してChatGPT分析用プロンプトを自動生成
  - **ChatGPT心理分析**: プロンプトを基に心理スコア・感情分析を自動実行
  - **エラーハンドリング**: 各ステップでの詳細なエラー報告とログ機能
  - **API連携**: 3つの独立したAPIサーバーとの確実な連携を実現
- **🔧 APIサーバー統合**: 必要なAPIサーバーの自動起動・連携設定
  - Whisper API (ポート8001)
  - ChatGPT API (ポート8002) 
  - プロンプト生成API (ポート8009)
- **🧹 不要コードの徹底削除**: 管理画面のコードベースを大幅に簡素化
- **🗑️ ViewerLink機能完全削除**: ViewerLink関連のAPI・モデル・UI要素を全削除
- **🗑️ 未実装機能削除**: audio_data・graph_data・QRコード関連の未使用APIを削除
- **📉 JavaScript大幅削減**: admin.jsから500行以上の不要コードを削除
- **🔧 依存関係最適化**: Chart.js・QRCode.jsライブラリを削除
- **⚡ パフォーマンス改善**: 不要なライブラリ読み込みを削除してページ読み込み速度向上
- **🎯 機能特化**: 必要な機能のみに絞り込み、保守性を大幅向上
- **🚀 起動安定化**: Supabaseクライアントの即時初期化とstart.shの簡素化を実施
- **📁 環境設定統一**: グローバルPython3環境での実行に統一、仮想環境記述の矛盾を解消
- **📄 サーバーサイドページネーション**: 全件取得からページネーション方式に変更、パフォーマンス大幅改善

**削除した機能・コード:**
- ViewerLink管理（API・UI・モデル）
- audio_data・graph_dataテーブル関連API
- QRコード生成・表示機能
- グラフ表示・分析機能
- デバイス拡張API（/qr、/audio等）
- Chart.js・QRCode.js依存関係

**現在の主要機能:**
- ✅ ユーザー管理（登録・確認・ステータス管理・**ページネーション対応**）
- ✅ デバイス管理（基本的な登録・状態監視・**ページネーション対応**）
- ✅ 通知管理（作成・送信・統計・履歴・**ページネーション対応**）
- ✅ Whisper統合（音声文字起こし・プロンプト生成・ChatGPT分析）
- ✅ **バッチ処理**（心理グラフ作成の3ステップ自動実行・**リアルタイムログ表示**）

**📄 ページネーション機能の詳細:**
- **API**: `GET /api/users?page=1&per_page=20` 形式で実装
- **パフォーマンス**: 大量データでもメモリ効率的で高速表示
- **UI**: 前へ/次へボタン、ページ番号、件数表示を含む完全なページネーション
- **後方互換性**: `/api/users/all` エンドポイントで全件取得も可能
- **スケーラビリティ**: 数万件のデータでも安定動作

### ✨ 新機能・改善点（2025-07-11）
- **🆕 通知管理システム完全実装**: 管理画面からユーザーへの通知作成・送信機能を追加
- **🔔 個別通知作成**: 特定ユーザーへの個別メッセージ送信機能
- **📢 一括通知送信**: 全ユーザーまたは指定ユーザーへの同時送信機能
- **📊 通知統計ダッシュボード**: 総通知数・未読数・既読数・タイプ別集計の可視化
- **📝 通知履歴管理**: 送信済み通知の詳細確認・削除機能
- **🔗 WatchMe v8連携**: 管理画面で作成した通知がダッシュボードに即座に表示
- **⚡ リアルタイム統計**: 通知作成と同時に統計情報が自動更新
- **🎯 通知タイプ管理**: announcement（お知らせ）・event（イベント）・system（システム）の3種類対応
- **💾 Supabase統合**: notificationsテーブルを使用した確実なデータ管理
- **🔧 エラーハンドリング強化**: 詳細なエラーメッセージとユーザーフレンドリーな通知

### ✨ 最新アップデート（2025-07-16）
- **🎯 感情グラフタブの完全マイクロサービス化達成**: OpenSMILE Aggregator（感情集計）の本番API統合完了
- **🔄 非同期タスクベースAPI対応**: OpenSMILE Aggregatorの非同期処理に完全対応
  - タスク開始→完了待機→結果取得の自動化
  - 最大5分間の処理待機とタイムアウト対応
  - UIに適した形式でのレスポンス変換（processed_slots、total_emotion_points）
- **🎵 OpenSMILE機能の本番化完了**: 
  - OpenSMILE音声特徴量抽出 → `https://api.hey-watch.me/emotion-features/process/vault-data`
  - OpenSMILE Aggregator（感情集計） → `https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator`
- **🏆 全タブ機能100%マイクロサービス化完了**: 心理グラフ、行動グラフ、感情グラフの全機能が本番環境に移行完了
- **🔄 プロキシアーキテクチャ導入**: 管理画面バックエンドに7つのプロキシエンドポイントを追加
  - `/api/whisper/fetch-and-transcribe` → Whisper音声文字起こし
  - `/api/prompt/generate-mood-prompt-supabase` → プロンプト生成  
  - `/api/chatgpt/analyze-vibegraph-supabase` → ChatGPTスコアリング
  - `/api/sed/fetch-and-process` → SED音響イベント検出
  - `/api/sed-aggregator/analysis/sed` → SED Aggregator
  - `/api/opensmile/process/vault-data` → OpenSMILE音声特徴量抽出
  - `/api/opensmile/aggregate-features` → OpenSMILE Aggregator（感情集計）
- **🌐 完全なマイクロサービス化達成**: 心理グラフタブの全機能が本番環境APIと正常通信
- **🎵 行動グラフタブの完全移行完了**: SED音響イベント検出とSED Aggregatorの両機能が本番環境APIに移行完了
- **🔄 行動グラフ機能フル対応**: 音響イベント検出からデータ集約まで全工程がマイクロサービス化完了
- **📋 ドキュメント整備**: READMEにマイクロサービス移行状況と設計思想を明記
- **🔧 デバッグ機能強化**: 詳細なエラーログと診断情報でトラブルシューティングを改善
- **⚡ 安定性向上**: 直接API呼び出しからプロキシ経由に変更し、CORS制約を回避

#### 🔧 技術的改善点
- **統一されたプロキシアーキテクチャ**: 全マイクロサービスAPIへの統一アクセス方式を確立
- **エラーハンドリング強化**: 各APIごとの詳細なエラー情報と診断機能を実装
- **非同期処理対応**: OpenSMILE AggregatorとSED Aggregatorの非同期タスクベース処理に完全対応
- **タスク管理システム**: タスク開始→進捗監視→完了待機→結果取得の自動化
- **ログ統合**: 全プロキシエンドポイントでの統一ログフォーマット
- **タイムアウト設定**: API特性に応じた適切なタイムアウト値設定（OpenSMILE Aggregator: 5分、その他: 300秒）
- **データ形式統一**: 各APIのレスポンスをUI期待形式に自動変換

#### 🎉 完了状況
**心理グラフタブ**：
- **🎤 Whisper音声文字起こし**: ✅ 本番API統合完了
- **📝 Whisperプロンプト生成**: ✅ 本番API統合完了  
- **🤖 ChatGPTスコアリング**: ✅ 本番API統合完了

**行動グラフタブ**：
- **🎵 SED音響イベント検出**: ✅ 本番API統合完了
- **📊 SED Aggregator**: ✅ 本番API統合完了

**感情グラフタブ**：
- **🎵 OpenSMILE音声特徴量抽出**: ✅ 本番API統合完了
- **📊 OpenSMILE Aggregator**: ✅ 本番API統合完了

#### 📈 次のマイルストーン
- **バッチ処理機能**: 本番API移行予定

#### 🎉 2025年7月16日時点での成果
- **心理グラフタブ**: 100% 完了（3機能すべて本番API統合）
- **行動グラフタブ**: 100% 完了（2機能すべて本番API統合）
- **感情グラフタブ**: 100% 完了（2機能すべて本番API統合）
- **全体進捗**: 主要機能の100%がマイクロサービス化完了（全タブ機能）
- **実運用**: 2025年7月16日データでの動作確認済み
- **アーキテクチャ**: 統一されたプロキシベースのマイクロサービス接続を実現
- **技術的達成**: 同期・非同期両対応のタスクベース処理システムを完備

### ✨ 新機能・改善点（2025-07-08）
- **🆕 SED Aggregator機能追加**: 行動グラフタブにSED音響イベント集約機能を追加
- **🔧 CORS設定修正**: SED Aggregator APIに適切なCORS設定を追加してネットワークエラーを解決
- **🛠️ 起動スクリプト統合**: 複数の起動スクリプトを統合し、PID管理と重複プロセス検出機能を実装
- **🧹 auth.users機能完全削除**: 権限エラーを防ぐためauth.usersテーブルへの参照を完全に削除
- **🎯 統計API修正**: viewer_linksテーブルへの参照を削除し、統計情報を正常化
- **🔄 プロセス管理強化**: 
  - PIDファイルによる重複プロセス検出
  - 自動ポート解放機能（lsof + kill）
  - プロセス状況確認スクリプト（check_processes.sh）
  - 安全な再起動スクリプト（restart.sh）
- **📋 起動方法の最適化**: 統合された起動・停止スクリプトで確実な動作を実現

### 🔧 起動関連の改善
- **統合起動スクリプト**: `start.sh` - PID管理、ポート解放、依存関係確認
- **統合停止スクリプト**: `stop.sh` - PIDファイル管理、確実なプロセス終了
- **プロセス確認**: `check_processes.sh` - 重複プロセス検出とトラブルシューティング

### 🛠️ 技術的修正
- **SED Aggregator API**: `api_sed-aggregator_v1/api_server.py` にCORS設定を追加
- **統計API**: `main.py` から viewer_links テーブルへの参照を削除
- **フロントエンド**: `admin.js` から auth.users 関連の処理を完全削除
- **UI修正**: `index.html` から auth.users タブとテーブルを削除

### 🔧 最新のアップデート（2025-07-07）

### ✨ 新機能・改善点（2025-07-07）
- **🆕 Whisper API Supabase統合完了**: JSONファイル出力からSupabaseデータベース（vibe_whisperテーブル）への直接保存に移行
- **🆕 プロンプト生成API Supabase統合**: vibe_whisperテーブルから読み込み、vibe_whisper_promptテーブルに保存
- **🆕 ChatGPT処理API Supabase統合**: vibe_whisper_promptテーブルから読み込み、vibe_whisper_summaryテーブルに保存
- **🆕 管理画面UI統合**: 心理グラフタブに3つの処理コンポーネントを追加
  - Whisper音声文字起こし（青色）
  - Whisperプロンプト生成（紫色）
  - ChatGPTスコアリング（緑色）
- **⚡ 起動時間の最適化**: 遅延初期化により3-5分の起動時間を数秒に短縮
- **🗂️ 不要機能の削除**: 📱 自分のデバイス、📊 グラフ表示、🔗 ViewerLink管理機能を削除
- **📋 UUIDの完全表示**: 省略表示を廃止し、全文表示でワンクリックコピー機能を実装
- **🎯 新タブ追加**: 🚶 行動グラフ、😊 感情グラフタブを追加（Coming Soon）

### 🚀 起動方法
```bash
# 推奨起動方法（既存プロセスを強制終了してから起動）
./start.sh

# 停止
./stop.sh
```

---

🎧 **WatchMe**: 音声データから心を読み解く新時代の心理分析システム  
🚀 **クイックスタート**: `./start.sh` で確実に起動できます！