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
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import json
import base64
from fastapi import Query

from api.supabase_client import SupabaseClient
from models.schemas import (
    User, Device, 
    UserCreate, DeviceCreate, ResponseModel,
    DeviceUpdate, DeviceStatus, 
    # 新しいユーザーステータス関連
    UserStatus, SubscriptionPlan, PlatformType,
    GuestUserCreate, UserUpgradeToMember, UserStatusUpdate,
    VirtualMobileDeviceCreate, StatsResponse,
    # 通知管理関連
    NotificationType, Notification, NotificationCreate, NotificationUpdate,
    NotificationBroadcast, NotificationBroadcastResponse
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

# Supabaseクライアントの即時初期化
try:
    supabase_client = SupabaseClient()
    print("✅ Supabase client initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    raise RuntimeError(f"Supabase接続に失敗しました: {e}") from e

def get_supabase_client():
    """初期化済みのSupabaseクライアントを取得"""
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
            viewer_links_count=0,  # 機能削除済み
            active_links_count=0,  # 機能削除済み
            total_audio_count=total_audio_count,
            total_graph_count=0,  # 機能削除済み
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
# 通知管理API - Supabase notifications テーブル
# =============================================================================

@app.get("/api/notifications", response_model=List[Notification])
async def get_all_notifications():
    """すべての通知を取得（管理画面用）"""
    try:
        client = get_supabase_client()
        notifications_data = await client.select("notifications", order="created_at.desc")
        return [Notification(**notification) for notification in notifications_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知一覧の取得に失敗しました: {str(e)}")


@app.get("/api/notifications/user/{user_id}", response_model=List[Notification])
async def get_user_notifications(user_id: str):
    """特定ユーザーの通知を取得"""
    try:
        client = get_supabase_client()
        notifications_data = await client.select("notifications", 
                                                filters={"user_id": user_id},
                                                order="created_at.desc")
        return [Notification(**notification) for notification in notifications_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザー通知の取得に失敗しました: {str(e)}")


@app.post("/api/notifications", response_model=Notification)
async def create_notification(notification: NotificationCreate):
    """新しい通知を作成"""
    try:
        client = get_supabase_client()
        
        notification_data = {
            "user_id": notification.user_id,
            "type": notification.type.value,
            "title": notification.title,
            "message": notification.message,
            "triggered_by": notification.triggered_by or "admin",
            "metadata": notification.metadata,
            "is_read": False
        }
        
        created_notification = await client.insert("notifications", notification_data)
        
        if not created_notification:
            raise HTTPException(status_code=500, detail="通知の作成に失敗しました")
        
        return Notification(**created_notification)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知作成に失敗しました: {str(e)}")


@app.post("/api/notifications/broadcast", response_model=NotificationBroadcastResponse)
async def broadcast_notification(broadcast: NotificationBroadcast):
    """一括通知送信"""
    try:
        client = get_supabase_client()
        
        # 各ユーザーに個別の通知を作成
        notifications_data = []
        for user_id in broadcast.user_ids:
            notification_data = {
                "user_id": user_id,
                "type": broadcast.type.value,
                "title": broadcast.title,
                "message": broadcast.message,
                "triggered_by": broadcast.triggered_by or "admin",
                "metadata": broadcast.metadata,
                "is_read": False
            }
            notifications_data.append(notification_data)
        
        # 一つずつ挿入（バッチ挿入の代替）
        created_notifications = []
        for notification_data in notifications_data:
            created_notification = await client.insert("notifications", notification_data)
            created_notifications.append(created_notification)
        sent_count = len(created_notifications) if created_notifications else 0
        failed_count = len(broadcast.user_ids) - sent_count
        
        return NotificationBroadcastResponse(
            success=True,
            sent_count=sent_count,
            failed_count=failed_count,
            message=f"{sent_count}件の通知を送信しました",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"一括通知送信に失敗しました: {str(e)}")


@app.put("/api/notifications/{notification_id}", response_model=Notification)
async def update_notification(notification_id: str, update_data: NotificationUpdate):
    """通知を更新（既読状態など）"""
    try:
        client = get_supabase_client()
        
        # 更新データの準備
        update_fields = {}
        if update_data.is_read is not None:
            update_fields["is_read"] = update_data.is_read
        if update_data.triggered_by is not None:
            update_fields["triggered_by"] = update_data.triggered_by
        if update_data.metadata is not None:
            update_fields["metadata"] = update_data.metadata
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="更新するデータがありません")
        
        updated_notification = await client.update("notifications", 
                                                  {"id": notification_id}, 
                                                  update_fields)
        if not updated_notification:
            raise HTTPException(status_code=404, detail="通知が見つかりません")
        
        return Notification(**updated_notification[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知更新に失敗しました: {str(e)}")


@app.delete("/api/notifications/{notification_id}", response_model=ResponseModel)
async def delete_notification(notification_id: str):
    """通知を削除"""
    try:
        client = get_supabase_client()
        
        # 通知の存在確認
        existing_notification = await client.select("notifications", filters={"id": notification_id})
        if not existing_notification:
            raise HTTPException(status_code=404, detail="通知が見つかりません")
        
        # 削除実行
        await client.delete("notifications", {"id": notification_id})
        
        return ResponseModel(success=True, message="通知を削除しました")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知削除に失敗しました: {str(e)}")


@app.get("/api/notifications/stats", response_model=Dict[str, Any])
async def get_notification_stats():
    """通知統計情報を取得"""
    try:
        client = get_supabase_client()
        
        # 全通知数
        all_notifications = await client.select("notifications")
        total_count = len(all_notifications)
        
        # 未読通知数
        unread_count = len([n for n in all_notifications if not n.get("is_read", False)])
        
        # タイプ別集計
        type_counts = {}
        for notification in all_notifications:
            notification_type = notification.get("type", "unknown")
            type_counts[notification_type] = type_counts.get(notification_type, 0) + 1
        
        return {
            "total_notifications": total_count,
            "unread_notifications": unread_count,
            "read_notifications": total_count - unread_count,
            "type_breakdown": type_counts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知統計の取得に失敗しました: {str(e)}")


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
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=False, log_level="info")