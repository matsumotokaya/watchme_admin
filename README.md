# WatchMe Admin

**WatchMe システムの管理画面**  
FastAPIとSupabaseを使用したデバイス・ユーザー管理システムです。

## 🎯 システム概要

### 🔍 用途・目的
- **WatchMe システムの管理画面**
- **ユーザー・デバイスの統合管理**
- **データベースフィールド名とUI表示の完全統一**
- **音声データ分析と可視化**

### 🚀 主要機能

#### 🧠 心理グラフ（Whisper統合）
- **音声文字起こし**: Whisper APIとの統合による高精度な音声認識
- **デバイス指定処理**: 特定のデバイスIDと日付での一括処理
- **Supabase直接保存**: 処理結果の即座なデータベース保存
- **高速起動**: 遅延初期化により起動時間を大幅短縮（3-5分→数秒）
- **プロンプト生成**: Whisperデータを統合してChatGPT分析用プロンプトを生成

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

#### 🔄 デバイス管理
- デバイス状態監視
- 音声データ管理
- UUID形式IDの全文表示とワンクリックコピー機能

#### 👥 ユーザー管理
- システムユーザーの管理
- 認証ユーザーとの統合
- UUID形式IDの全文表示とワンクリックコピー機能

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

#### 🚀 高速起動（推奨）
```bash
# 高速起動モード（Supabase遅延初期化）
python3 start_fast.py
```

#### ⚙️ 開発モード起動
```bash
# リロード機能付き開発モード
python3 main.py
```

#### 🔧 手動起動
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

### 🧠 Whisper統合 API
- **外部API**: `POST http://localhost:8001/fetch-and-transcribe` - Whisper音声文字起こし処理

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

2. **心理グラフ（Whisper統合）**: メインタブでWhisper音声文字起こし機能を使用
   - デバイスIDと日付を指定
   - Whisperモデル（Medium/Large）を選択
   - 処理開始ボタンで一括文字起こし実行
   - 結果はSupabaseに直接保存

3. **プロンプト生成**: 心理グラフタブ内で利用可能
   - デバイスIDと日付を指定
   - Whisperデータを統合してChatGPT分析用プロンプトを生成
   - vibe_whisper_promptテーブルに保存

4. **行動グラフ**: 🚧 開発中（Coming Soon）
   - 行動パターン分析機能の実装予定

5. **感情グラフ**: 🚧 開発中（Coming Soon）
   - 感情分析機能の実装予定

### 🔧 管理者機能

6. **ユーザー管理**: システムユーザーの追加・確認
   - 認証ユーザーの管理
   - ゲスト・会員・サブスクライバーの管理
   - UUID形式IDのクリックコピー機能

7. **デバイス管理**: 音声取得デバイスの登録・状態管理
   - デバイス状態の監視
   - 音声データ数の管理
   - UUID形式IDのクリックコピー機能

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

## 🔧 最新のアップデート（2025-07-07）

### ✨ 新機能・改善点
- **🆕 プロンプト生成UI追加**: Whisperデータを統合してChatGPT分析用プロンプトを生成するUIコンポーネント
- **⚡ 起動時間の最適化**: 遅延初期化により3-5分の起動時間を数秒に短縮
- **🗂️ 不要機能の削除**: 📱 自分のデバイス、📊 グラフ表示、🔗 ViewerLink管理機能を削除
- **📋 UUIDの完全表示**: 省略表示を廃止し、全文表示でワンクリックコピー機能を実装
- **🎯 新タブ追加**: 🚶 行動グラフ、😊 感情グラフタブを追加（Coming Soon）

### 🚀 起動方法
```bash
# 高速起動（推奨）
python3 start_fast.py

# 開発モード
python3 main.py
```

---

🎧 **WatchMe**: 音声データから心を読み解く新時代の心理分析システム  
🚀 **ファストスタート**: `python3 start_fast.py` で今すぐ始められます！