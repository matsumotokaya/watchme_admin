# WatchMe 要件定義書 vs 現在実装 - 差異分析と修正提案

## 📋 要件定義書の主要ポイント

### 🎯 用途・目的
- **音声データに基づく心理・行動・感情の可視化**
- **マルチデバイス・レンジ管理型閲覧システム**
- **時間範囲制限付きデータ閲覧権限**

### 🔧 システム要件
1. **デバイス**: 自動音声取得・送信、常時データ送信
2. **アカウント**: 時間範囲制限付きデバイスデータ閲覧
3. **グラフ生成**: 30分/1時間単位での自動生成
4. **セキュリティ**: 時間範囲による閲覧制御

---

## ❌ 現在実装との主要な差異

### 1. **データベース設計の不足**

#### 🚫 **欠けているテーブル**
- `audio_data` - 音声データストレージ
- `graph_data` - 生成されたグラフデータ  
- `device_sessions` - デバイスの録音セッション管理

#### 🚫 **不十分なフィールド**
- `devices.status` - デバイスの状態管理が不十分
- `devices.last_sync` - 最終同期時刻が存在しない
- `viewer_links.start_time/end_time` - 必須でない（要件では必須）

### 2. **API機能の不足**

#### 🚫 **欠けているAPI**
- `POST /api/devices/{device_id}/audio` - 音声データ送信
- `GET /api/devices/{device_id}/graphs` - グラフデータ取得
- `POST /api/graphs/generate` - グラフ生成
- `GET /api/qr/{device_id}` - QRコード生成

#### 🚫 **不十分な機能**
- 時間範囲による閲覧制御
- デバイス状態管理
- 自動グラフ生成パイプライン

### 3. **UI/UX機能の不足**

#### 🚫 **欠けている画面・機能**
- グラフ表示機能
- QRコードによるデバイスリンク
- 時間範囲指定UI
- "自分のデバイス一覧"
- 心理・行動・感情データ可視化

---

## ✅ 修正提案

### 📊 1. データベーススキーマ拡張

```sql
-- 音声データテーブル
CREATE TABLE audio_data (
    audio_id UUID PRIMARY KEY,
    device_id UUID REFERENCES devices(device_id),
    recorded_at TIMESTAMP,
    file_path TEXT,
    file_size INTEGER,
    duration_seconds INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- グラフデータテーブル
CREATE TABLE graph_data (
    graph_id UUID PRIMARY KEY,
    device_id UUID REFERENCES devices(device_id),
    audio_id UUID REFERENCES audio_data(audio_id),
    graph_type TEXT, -- 'emotion', 'behavior', 'psychology'
    time_range_start TIMESTAMP,
    time_range_end TIMESTAMP,
    data_json JSONB, -- グラフデータ
    generated_at TIMESTAMP DEFAULT NOW()
);

-- デバイスセッションテーブル
CREATE TABLE device_sessions (
    session_id UUID PRIMARY KEY,
    device_id UUID REFERENCES devices(device_id),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    status TEXT, -- 'active', 'completed', 'error'
    audio_count INTEGER DEFAULT 0
);
```

### 🔧 2. Devicesテーブル拡張

```sql
ALTER TABLE devices ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE devices ADD COLUMN last_sync TIMESTAMP;
ALTER TABLE devices ADD COLUMN total_audio_count INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN qr_code TEXT;
```

### 📝 3. Viewer Linksテーブル修正

```sql
-- start_time, end_time を必須に変更
ALTER TABLE viewer_links ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE viewer_links ALTER COLUMN end_time SET NOT NULL;
```

### 🚀 4. 新規API実装提案

#### デバイス管理API
- `POST /api/devices/{device_id}/audio` - 音声アップロード
- `GET /api/devices/{device_id}/status` - デバイス状態取得
- `PUT /api/devices/{device_id}/sync` - 同期完了通知
- `GET /api/devices/{device_id}/qr` - QRコード生成

#### グラフ・データAPI  
- `GET /api/devices/{device_id}/graphs` - 時間範囲指定グラフ取得
- `GET /api/devices/{device_id}/audio/{time_range}` - 音声データ一覧
- `POST /api/graphs/generate` - 手動グラフ生成
- `GET /api/graphs/{graph_id}` - 特定グラフデータ取得

#### 閲覧権限・時間制御API
- `GET /api/my-devices` - ログインユーザーのリンク済みデバイス
- `POST /api/viewer-links/validate` - 閲覧権限検証
- `GET /api/viewer-links/{user_id}/timeline` - ユーザーの閲覧履歴

### 🎨 5. UI/UX機能追加提案

#### 新規画面
1. **「自分のデバイス一覧」画面**
   - リンク済みデバイス表示
   - 各デバイスの最新状態
   - グラフ閲覧ボタン

2. **「グラフ表示」画面**
   - 心理・行動・感情グラフ
   - 時間範囲選択UI
   - リアルタイム更新

3. **「デバイスリンク」画面**
   - QRコードスキャン機能
   - デバイスID入力
   - 時間範囲設定

#### 既存画面の拡張
1. **ViewerLink管理**
   - 時間範囲の必須入力
   - QRコード表示
   - 閲覧履歴表示

---

## 🎯 実装優先度

### 高優先度（POC必須）
1. ✅ データベーススキーマ拡張
2. ✅ Viewer Linksの時間制御強化
3. ✅ デバイス状態管理API
4. ✅ 基本的なグラフ表示UI

### 中優先度（フェーズ2）  
1. 🔄 音声データアップロードAPI
2. 🔄 自動グラフ生成パイプライン
3. 🔄 QRコードリンク機能

### 低優先度（将来的）
1. ⏳ 高度なグラフ分析機能
2. ⏳ リアルタイム通知
3. ⏳ モバイルアプリ統合

---

## 💡 次のステップ

1. **データベーススキーマの拡張実装**
2. **Pydanticモデルの追加・修正**  
3. **新規API実装**
4. **UI機能の段階的実装**
5. **README.mdへの要件反映**