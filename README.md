# WatchMe Admin

**WatchMe システムの管理画面**  
FastAPIとSupabaseを使用したデバイス・ユーザー・ViewerLink管理システムです。

## 🎯 システム概要

### 🔍 用途・目的
- **WatchMe システムの管理画面**
- **ユーザー・デバイス・ViewerLink の統合管理**
- **データベースフィールド名とUI表示の完全統一**
- **時間範囲制限付きデータ閲覧権限管理**

### 🚀 主要機能

#### 📱 自分のデバイス一覧
- 音声データ取得デバイスの状態表示
- アクティブ状態のリアルタイム表示
- 音声データ数、最終同期時刻の監視

#### 📊 グラフ表示
- **😊 感情分析**: 音声データからの感情スコア可視化
- **🚶 行動分析**: 行動パターンのグラフ化
- **🧠 心理分析**: 心理状態の時系列変化
- 時間範囲指定によるデータフィルタリング

#### 🔗 ViewerLink管理
- ユーザーとデバイスの時間範囲制限付き関連付け
- **必須項目**: start_time, end_timeは必須設定
- アクティブ状態のリアルタイム表示

#### 📦 QRコード連携
- デバイスリンク用QRコード生成
- 24時間有効期限付き

#### 🔄 デバイス管理
- デバイス状態監視 (Active/Inactive/Syncing/Error)
- 音声データアップロード機能
- 同期操作と最終同期時刻管理

#### 📈 統計情報
- リアルタイムシステム統計
- アクティブデバイス数、総音声データ数など

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

### viewer_links テーブル - 時間範囲制限付き関連付け
- `viewer_link_id` (UUID, Primary Key)
- `user_id` (UUID, users.user_id外部キー)
- `device_id` (UUID, devices.device_id外部キー)
- `owner_user_id` (UUID, Optional, users.user_id外部キー)
- `start_time` (DateTime, **必須**) - 閲覧開始時刻
- `end_time` (DateTime, **必須**) - 閲覧終了時刻


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

#### 🚀 簡単起動（推奨）
```bash
# 起動
./start.sh

# 停止  
./stop.sh

# 再起動
./restart.sh

# 状態確認
./status.sh
```

#### ⚙️ 手動起動
```bash
python3 main.py
```

または

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload
```

## 🌐 API エンドポイント

### 📈 ユーザー管理 API
- `GET /api/users` - 全ユーザーを取得
- `POST /api/users` - 新しいユーザーを作成

### 🎤 デバイス管理 API
- `GET /api/devices` - 全デバイスを取得
- `POST /api/devices` - 新しいデバイスを作成
- `GET /api/devices/{device_id}/status` - デバイス状態取得
- `PUT /api/devices/{device_id}` - デバイス情報更新
- `PUT /api/devices/{device_id}/sync` - デバイス同期完了通知
- `GET /api/devices/{device_id}/qr` - QRコード生成
- `POST /api/devices/{device_id}/audio` - 音声データアップロード
- `GET /api/devices/{device_id}/audio` - デバイスの音声データ一覧取得

### 🔗 ViewerLink管理 API
- `GET /api/viewer-links` - 全ViewerLinkを取得
- `GET /api/viewer-links/details` - ユーザー・デバイス情報付きViewerLinkを取得
- `GET /api/viewer-links/by-user/{user_id}` - 特定ユーザーのViewerLinkを取得
- `POST /api/viewer-links` - 新しいViewerLinkを作成 (**start_time, end_time必須**)
- `DELETE /api/viewer-links/{link_id}` - ViewerLinkを削除
- `POST /api/viewer-links/validate` - 閲覧権限検証
- `GET /api/viewer-links/{user_id}/timeline` - ユーザーの閲覧履歴タイムライン

### 📊 グラフ・データ分析 API
- `GET /api/devices/{device_id}/graphs` - デバイスのグラフデータ取得
- `POST /api/graphs/generate` - グラフ手動生成
- `GET /api/graphs/{graph_id}` - 特定グラフデータ取得

### 📱 ユーザーアクセス API
- `GET /api/my-devices` - ログインユーザーのリンク済みデバイス一覧

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
│   └── schemas.py               # WatchMe対応 Pydanticモデル定義
├── templates/
│   └── index.html               # WatchMe管理画面 (音声心理分析UI)
├── static/
│   └── admin.js                 # WatchMeフロントエンド (グラフ、QRコード、デバイス管理)
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

2. **自分のデバイス一覧**: メインタブでユーザーIDを入力してデバイス状態を確認
   - 音声データ数、最終同期時刻、アクティブ状態をリアルタイム表示
   - 「📊 グラフ表示」ボタンで直接分析画面へ移動

3. **グラフ表示**: グラフタブで心理・行動・感情データを可視化
   - 😊 **感情分析**: 音声からの感情スコア
   - 🚶 **行動分析**: 行動パターンの変化
   - 🧠 **心理分析**: 心理状態の推移
   - 時間範囲を指定してデータをフィルタリング

### 🔧 管理者機能

4. **ユーザー管理**: システムユーザーの追加・確認

5. **デバイス管理**: 音声取得デバイスの登録・状態管理
   - デバイス状態 (Active/Inactive/Syncing/Error)
   - 音声データ数、最終同期時刻の監視
   - QRコード生成、手動同期機能

6. **ViewerLink管理**: ユーザーとデバイスの時間範囲制限付き関連付け
   - ❗ **重要**: start_time と end_time は必須入力
   - アクティブ状態のリアルタイム表示
   - QRコードでのデバイスリンク機能

### 🕰️ 時間範囲制御の重要性

WatchMeシステムでは、**セキュリティとプライバシー保護**のため、すべてのデータアクセスに時間範囲制限が必須です。

- **無制限アクセスは不可**: 必ず開始時刻と終了時刻を設定
- **リアルタイム検証**: 現在時刻が許可範囲内か自動チェック
- **期限切れ自動無効化**: 終了時刻過ぎで自動的にアクセス無効化

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

🎧 **WatchMe**: 音声データから心を読み解く新時代の心理分析システム  
🚀 **ファストスタート**: `python3 main.py` で今すぐ始められます！