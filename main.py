"""
実際のSupabaseデータ構造に基づく正しいFastAPIアプリケーション

重要: このプロジェクトでは必ず python3 コマンドを使用してください。
python コマンドではなく、明示的に python3 を使用する必要があります。
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import json
import base64
from fastapi import Query

from api.supabase_client import SupabaseClient
from models.schemas import (
    User, Device, ViewerLink, ViewerLinkWithDetails,
    UserCreate, DeviceCreate, ViewerLinkCreate, ResponseModel,
    AudioData, AudioDataCreate, GraphData, GraphDataCreate,
    DeviceSession, DeviceSessionCreate, DeviceSessionUpdate,
    MyDeviceInfo, GraphSummary, DeviceGraphsResponse,
    QRCodeResponse, DeviceLinkRequest, StatsResponse,
    DeviceUpdate, DeviceStatus, GraphType, SessionStatus,
    # 新しいユーザーステータス関連
    UserStatus, SubscriptionPlan, PlatformType,
    GuestUserCreate, UserUpgradeToMember, UserStatusUpdate,
    VirtualMobileDeviceCreate
)

app = FastAPI(title="WatchMe Admin (Fixed)", description="修正済みWatchMe管理画面API", version="2.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンを指定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルとテンプレートの設定
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Supabaseクライアントの遅延初期化
supabase_client = None

def get_supabase_client():
    """Supabaseクライアントを遅延初期化して取得"""
    global supabase_client
    if supabase_client is None:
        try:
            supabase_client = SupabaseClient()
            print("Supabase client initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Supabase client: {e}")
            raise e
    return supabase_client


@app.get("/health")
async def health_check():
    """ヘルスチェック - 高速レスポンス"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """管理画面のメインページ"""
    return templates.TemplateResponse("index.html", {"request": request})


# =============================================================================
# Auth Users API - 削除済み（権限エラーのため）
# =============================================================================
# auth.usersテーブルは管理者権限でしかアクセスできないため削除

# =============================================================================
# Users API - 実際のフィールド構造に基づく
# =============================================================================

@app.get("/api/users", response_model=List[User])
async def get_users():
    """全ユーザーを取得"""
    try:
        client = get_supabase_client()
        users_data = await client.select("users")
        return users_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザーの取得に失敗しました: {str(e)}")


@app.post("/api/users", response_model=User)
async def create_user(user: UserCreate):
    """新しいユーザーを作成"""
    try:
        user_data = {
            "user_id": str(uuid.uuid4()),
            "name": user.name,
            "email": user.email,
            "created_at": datetime.now().isoformat()
        }
        created_user = await client.insert("users", user_data)
        return created_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザーの作成に失敗しました: {str(e)}")


# =============================================================================
# Devices API - user_idフィールドなしの正しい構造
# =============================================================================

@app.get("/api/devices", response_model=List[Device])
async def get_devices():
    """全デバイスを取得"""
    try:
        client = get_supabase_client()
        devices_data = await client.select("devices")
        return devices_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイスの取得に失敗しました: {str(e)}")


@app.post("/api/devices", response_model=Device)
async def create_device(device: DeviceCreate):
    """新しいデバイスを作成"""
    try:
        device_data = {
            "device_id": str(uuid.uuid4()),
            "device_type": device.device_type,
            "status": device.status or DeviceStatus.ACTIVE,
            "registered_at": datetime.now().isoformat(),
            "last_sync": None,
            "total_audio_count": 0,
            "qr_code": None
        }
        created_device = await supabase_client.insert("devices", device_data)
        return created_device
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイスの作成に失敗しました: {str(e)}")


# =============================================================================
# ViewerLinks API - 削除済み（機能廃止）
# =============================================================================
# ViewerLinks機能は削除されました


# =============================================================================
# デバイス拡張API - WatchMe用音声データ管理
# =============================================================================

@app.get("/api/devices/{device_id}/status", response_model=Device)
async def get_device_status(device_id: str):
    """デバイスの状態を取得"""
    try:
        device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        return device[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイス状態の取得に失敗しました: {str(e)}")


@app.put("/api/devices/{device_id}", response_model=Device)
async def update_device(device_id: str, device_update: DeviceUpdate):
    """デバイス情報を更新"""
    try:
        # デバイスの存在確認
        existing_device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not existing_device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 更新データの準備
        update_data = {}
        if device_update.status is not None:
            update_data["status"] = device_update.status
        if device_update.last_sync is not None:
            update_data["last_sync"] = device_update.last_sync.isoformat()
        if device_update.total_audio_count is not None:
            update_data["total_audio_count"] = device_update.total_audio_count
            
        if not update_data:
            raise HTTPException(status_code=400, detail="更新するデータがありません")
        
        updated_device = await supabase_client.update("devices", {"device_id": device_id}, update_data)
        return updated_device[0] if updated_device else existing_device[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイス更新に失敗しました: {str(e)}")


@app.put("/api/devices/{device_id}/sync", response_model=ResponseModel)
async def sync_device(device_id: str):
    """デバイスの同期完了を通知"""
    try:
        # デバイスの存在確認
        existing_device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not existing_device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 同期時刻を更新
        update_data = {
            "last_sync": datetime.now().isoformat(),
            "status": DeviceStatus.ACTIVE
        }
        
        await supabase_client.update("devices", {"device_id": device_id}, update_data)
        return ResponseModel(success=True, message="デバイス同期が完了しました")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイス同期に失敗しました: {str(e)}")


@app.get("/api/devices/{device_id}/qr", response_model=QRCodeResponse)
async def generate_device_qr(device_id: str):
    """デバイスのQRコードを生成"""
    try:
        # デバイスの存在確認
        device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # QRコードデータの生成（シンプルなJSON形式）
        qr_data = {
            "device_id": device_id,
            "timestamp": datetime.now().isoformat(),
            "type": "watchme_device_link"
        }
        qr_code_data = base64.b64encode(json.dumps(qr_data).encode()).decode()
        
        # QRコード情報をデバイスに保存
        update_data = {"qr_code": qr_code_data}
        await supabase_client.update("devices", {"device_id": device_id}, update_data)
        
        return QRCodeResponse(
            device_id=device_id,
            qr_code_data=qr_code_data,
            expires_at=datetime.now() + timedelta(hours=24)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QRコード生成に失敗しました: {str(e)}")


@app.post("/api/devices/{device_id}/audio", response_model=AudioData)
async def upload_audio_data(device_id: str, audio_data: AudioDataCreate):
    """音声データをアップロード"""
    try:
        # デバイスの存在確認
        device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 音声データの保存（将来的にはaudio_dataテーブルに保存）
        audio_record = {
            "audio_id": str(uuid.uuid4()),
            "device_id": device_id,
            "recorded_at": audio_data.recorded_at.isoformat(),
            "file_path": audio_data.file_path,
            "file_size": audio_data.file_size,
            "duration_seconds": audio_data.duration_seconds,
            "processed": audio_data.processed,
            "created_at": datetime.now().isoformat()
        }
        
        # デバイスのaudio_countを更新
        current_count = device[0].get("total_audio_count", 0)
        await supabase_client.update("devices", {"device_id": device_id}, {
            "total_audio_count": current_count + 1,
            "last_sync": datetime.now().isoformat()
        })
        
        # 注意: 実際の音声データテーブルが存在しない場合は、ダミーレスポンスを返す
        return AudioData(
            audio_id=audio_record["audio_id"],
            device_id=device_id,
            recorded_at=audio_data.recorded_at,
            file_path=audio_data.file_path,
            file_size=audio_data.file_size,
            duration_seconds=audio_data.duration_seconds,
            processed=audio_data.processed,
            created_at=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"音声データのアップロードに失敗しました: {str(e)}")


@app.get("/api/devices/{device_id}/audio")
async def get_device_audio_data(
    device_id: str,
    start_time: Optional[datetime] = Query(None, description="開始時刻"),
    end_time: Optional[datetime] = Query(None, description="終了時刻"),
    limit: int = Query(100, description="取得件数制限")
):
    """デバイスの音声データ一覧を取得"""
    try:
        # デバイスの存在確認
        device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 注意: 実際のaudio_dataテーブルが存在しない場合は、ダミーデータを返す
        return {
            "device_id": device_id,
            "audio_count": device[0].get("total_audio_count", 0),
            "time_range": {
                "start": start_time.isoformat() if start_time else None,
                "end": end_time.isoformat() if end_time else None
            },
            "message": "音声データテーブルの実装が必要です"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"音声データ取得に失敗しました: {str(e)}")


# =============================================================================
# グラフ・データ管理API - WatchMe用心理・行動・感情データ
# =============================================================================

@app.get("/api/devices/{device_id}/graphs", response_model=DeviceGraphsResponse)
async def get_device_graphs(
    device_id: str,
    start_time: Optional[datetime] = Query(None, description="開始時刻"),
    end_time: Optional[datetime] = Query(None, description="終了時刻"),
    graph_type: Optional[GraphType] = Query(None, description="グラフタイプ")
):
    """デバイスのグラフデータを取得"""
    try:
        # デバイスの存在確認
        device = await supabase_client.select("devices", filters={"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 注意: 実際のgraph_dataテーブルが存在しない場合は、ダミーレスポンスを返す
        return DeviceGraphsResponse(
            device_id=device_id,
            device_type=device[0]["device_type"],
            time_range_start=start_time or datetime.now() - timedelta(hours=24),
            time_range_end=end_time or datetime.now(),
            graphs=[],
            summary=[]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"グラフデータ取得に失敗しました: {str(e)}")


@app.post("/api/graphs/generate", response_model=GraphData)
async def generate_graph(graph_data: GraphDataCreate):
    """グラフを手動生成"""
    try:
        # デバイスの存在確認
        device = await supabase_client.select("devices", filters={"device_id": graph_data.device_id})
        if not device:
            raise HTTPException(status_code=404, detail="デバイスが見つかりません")
        
        # 注意: 実際のgraph_dataテーブルが存在しない場合は、ダミーレスポンスを返す
        return GraphData(
            graph_id=str(uuid.uuid4()),
            device_id=graph_data.device_id,
            audio_id=graph_data.audio_id,
            graph_type=graph_data.graph_type,
            time_range_start=graph_data.time_range_start,
            time_range_end=graph_data.time_range_end,
            data_json=graph_data.data_json,
            generated_at=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"グラフ生成に失敗しました: {str(e)}")


@app.get("/api/graphs/{graph_id}", response_model=GraphData)
async def get_graph(graph_id: str):
    """特定のグラフデータを取得"""
    try:
        # 注意: 実際のgraph_dataテーブルが存在しない場合は、エラーを返す
        raise HTTPException(
            status_code=501, 
            detail="グラフデータテーブルの実装が必要です"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"グラフデータ取得に失敗しました: {str(e)}")


# =============================================================================
# 閲覧権限・時間制御API - 削除済み（機能廃止）
# =============================================================================
# ViewerLink関連機能は削除されました


# =============================================================================
# 統計・分析API
# =============================================================================

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """システム統計情報を取得"""
    try:
        client = get_supabase_client()
        users = await client.select("users")
        devices = await client.select("devices")
        
        # アクティブデバイス数を計算
        active_devices_count = len([d for d in devices if d.get("status") == "active"])
        
        # 音声・グラフ総数
        total_audio_count = sum(d.get("total_audio_count", 0) for d in devices)
        total_graph_count = 0  # graph_dataテーブル実装時に更新
        
        return StatsResponse(
            users_count=len(users),
            devices_count=len(devices),
            active_devices_count=active_devices_count,
            viewer_links_count=0,  # viewer_links機能は削除
            active_links_count=0,  # viewer_links機能は削除
            total_audio_count=total_audio_count,
            total_graph_count=total_graph_count,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"統計情報の取得に失敗しました: {str(e)}")


# =============================================================================
# ユーザーステータス管理API（新仕様対応）
# =============================================================================

@app.post("/api/users/guest", response_model=User)
async def create_guest_user(guest_data: GuestUserCreate):
    """ゲストユーザーを作成（Auth不要）"""
    try:
        # ゲストユーザーの作成
        user_data = {
            "user_id": guest_data.user_id,
            "name": guest_data.name,
            "status": guest_data.status.value,
            "created_at": datetime.now().isoformat()
        }
        
        result = await supabase_client.insert("users", user_data)
        if not result:
            raise HTTPException(status_code=500, detail="ゲストユーザーの作成に失敗しました")
        
        return User(**result[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ゲストユーザー作成に失敗しました: {str(e)}")


@app.post("/api/users/{user_id}/upgrade", response_model=User)
async def upgrade_guest_to_member(user_id: str, upgrade_data: UserUpgradeToMember):
    """ゲストユーザーを会員にアップグレード"""
    try:
        # 既存ユーザーの確認
        existing_user = await supabase_client.select("users", filters={"user_id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        if existing_user[0].get("status") != UserStatus.GUEST:
            raise HTTPException(status_code=400, detail="ゲストユーザーのみアップグレード可能です")
        
        # ユーザー情報を更新
        update_data = {
            "name": upgrade_data.name,
            "email": upgrade_data.email,
            "status": UserStatus.MEMBER.value,
            "updated_at": datetime.now().isoformat()
        }
        
        result = await supabase_client.update("users", update_data, {"user_id": user_id})
        if not result:
            raise HTTPException(status_code=500, detail="ユーザーアップグレードに失敗しました")
        
        return User(**result[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"アップグレードに失敗しました: {str(e)}")


@app.put("/api/users/{user_id}/status", response_model=User)
async def update_user_status(user_id: str, status_data: UserStatusUpdate):
    """ユーザーステータスを更新（サブスク加入など）"""
    try:
        # 既存ユーザーの確認
        existing_user = await supabase_client.select("users", filters={"user_id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        # ステータス更新
        update_data = {
            "status": status_data.status.value,
            "updated_at": datetime.now().isoformat()
        }
        
        if status_data.subscription_plan:
            update_data["subscription_plan"] = status_data.subscription_plan.value
        
        result = await supabase_client.update("users", update_data, {"user_id": user_id})
        if not result:
            raise HTTPException(status_code=500, detail="ステータス更新に失敗しました")
        
        return User(**result[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ステータス更新に失敗しました: {str(e)}")


@app.post("/api/devices/virtual-mobile", response_model=Device)
async def create_virtual_mobile_device(device_data: VirtualMobileDeviceCreate):
    """スマホ仮想デバイスを作成"""
    try:
        # 既存デバイスの重複チェック（platform_identifierで）
        existing_devices = await supabase_client.select("devices", filters={
            "platform_identifier": device_data.platform_identifier
        })
        
        if existing_devices:
            # 既存デバイスが見つかった場合、オーナーを更新
            device_id = existing_devices[0]["device_id"]
            update_data = {
                "owner_user_id": device_data.owner_user_id,
                "status": device_data.status.value,
                "updated_at": datetime.now().isoformat()
            }
            result = await supabase_client.update("devices", update_data, {"device_id": device_id})
            return Device(**result[0])
        
        # 新規デバイス作成
        device_uuid = str(uuid.uuid4())
        new_device = {
            "device_id": device_uuid,
            "owner_user_id": device_data.owner_user_id,
            "device_type": device_data.device_type,
            "platform_type": device_data.platform_type.value,
            "platform_identifier": device_data.platform_identifier,
            "status": device_data.status.value,
            "registered_at": datetime.now().isoformat(),
            "total_audio_count": 0
        }
        
        result = await supabase_client.insert("devices", new_device)
        if not result:
            raise HTTPException(status_code=500, detail="仮想デバイス作成に失敗しました")
        
        return Device(**result[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"仮想デバイス作成に失敗しました: {str(e)}")


@app.get("/api/users/{user_id}/devices", response_model=List[Device])
async def get_user_devices(user_id: str):
    """ユーザーのデバイス一覧を取得（新仕様）"""
    try:
        # owner_user_idでデバイスを検索
        devices = await supabase_client.select("devices", filters={"owner_user_id": user_id})
        return [Device(**device) for device in devices]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイス一覧取得に失敗しました: {str(e)}")


@app.get("/api/users/by-status/{status}", response_model=List[User])
async def get_users_by_status(status: UserStatus):
    """ステータス別ユーザー一覧を取得"""
    try:
        users = await supabase_client.select("users", filters={"status": status.value})
        return [User(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザー一覧取得に失敗しました: {str(e)}")


# =============================================================================
# ヘルスチェック
# =============================================================================

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    print("🚀 WatchMe Admin Server starting...")
    print("✅ Supabase client will be initialized on first API call")
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=False, log_level="warning")