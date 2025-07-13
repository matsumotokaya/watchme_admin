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
    NotificationBroadcast, NotificationBroadcastResponse,
    # ページネーション関連
    PaginationParams, PaginatedUsersResponse, PaginatedDevicesResponse, PaginatedNotificationsResponse
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

@app.get("/debug", response_class=HTMLResponse)
async def debug_page(request: Request):
    """デバッグページ"""
    return templates.TemplateResponse("debug.html", {"request": request})

@app.get("/simple", response_class=HTMLResponse)
async def simple_page(request: Request):
    """シンプルな管理画面（フォールバック）"""
    return templates.TemplateResponse("index_simple.html", {"request": request})


# =============================================================================
# Auth Users API - 削除済み（権限エラーのため）
# =============================================================================
# auth.usersテーブルは管理者権限でしかアクセスできないため削除

# =============================================================================
# Users API - 実際のフィールド構造に基づく
# =============================================================================

@app.get("/api/users", response_model=PaginatedUsersResponse)
async def get_users(page: int = Query(1, ge=1, description="ページ番号"),
                   per_page: int = Query(20, ge=1, le=100, description="1ページあたりのアイテム数")):
    """ページネーション付きでユーザーを取得"""
    try:
        client = get_supabase_client()
        result = await client.select_paginated("users", page=page, per_page=per_page, order="created_at.desc")
        return PaginatedUsersResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザーの取得に失敗しました: {str(e)}")


@app.get("/api/users/all", response_model=List[User])
async def get_all_users():
    """全ユーザーを取得（後方互換性のため）"""
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

@app.get("/api/devices", response_model=PaginatedDevicesResponse)
async def get_devices(page: int = Query(1, ge=1, description="ページ番号"),
                     per_page: int = Query(20, ge=1, le=100, description="1ページあたりのアイテム数")):
    """ページネーション付きでデバイスを取得"""
    try:
        client = get_supabase_client()
        result = await client.select_paginated("devices", page=page, per_page=per_page, order="registered_at.desc")
        return PaginatedDevicesResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイスの取得に失敗しました: {str(e)}")


@app.get("/api/devices/all", response_model=List[Device])
async def get_all_devices():
    """全デバイスを取得（後方互換性のため）"""
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

@app.get("/api/notifications", response_model=PaginatedNotificationsResponse)
async def get_all_notifications(page: int = Query(1, ge=1, description="ページ番号"),
                               per_page: int = Query(20, ge=1, le=100, description="1ページあたりのアイテム数")):
    """ページネーション付きで通知を取得（管理画面用）"""
    try:
        client = get_supabase_client()
        result = await client.select_paginated("notifications", page=page, per_page=per_page, order="created_at.desc")
        return PaginatedNotificationsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通知一覧の取得に失敗しました: {str(e)}")


@app.get("/api/notifications/all", response_model=List[Notification])
async def get_all_notifications_legacy():
    """すべての通知を取得（後方互換性のため）"""
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
# バッチ処理API
# =============================================================================

import httpx
import asyncio

# APIエンドポイントの定義
API_ENDPOINTS = {
    "whisper": "http://localhost:8001/fetch-and-transcribe",
    "prompt_gen": "http://localhost:8009/generate-mood-prompt-supabase",
    "chatgpt": "http://localhost:8002/analyze-vibegraph-supabase"
}

async def check_api_health(session, step_name, base_url):
    """APIサーバーのヘルスチェックを実行"""
    # URLからベースURLを抽出してヘルスチェックURLを構築
    from urllib.parse import urlparse
    parsed = urlparse(base_url)
    health_url = f"{parsed.scheme}://{parsed.netloc}/health"
    
    try:
        response = await session.get(health_url, timeout=5.0)
        if response.status_code == 200:
            return {"step": step_name, "success": True, "message": f"✅ {step_name}サーバー起動確認済み (ポート{parsed.port})"}
        else:
            return {"step": step_name, "success": False, "message": f"❌ {step_name}サーバー異常 (Status: {response.status_code})"}
    except Exception as e:
        return {"step": step_name, "success": False, "message": f"❌ {step_name}サーバーに接続できません (ポート{parsed.port}): {str(e)}"}

async def call_api(session, step_name, url, method='post', json_data=None, params=None):
    """指定されたAPIを呼び出し、結果を返す"""
    try:
        print(f"🔗 APIコール開始: {step_name} -> {url}")
        
        # 相対パスの場合、フルURLに変換
        if url.startswith('/'):
            full_url = f"http://localhost:9000{url}"
        else:
            full_url = url
            
        # APIサーバーのヘルスチェック（失敗しても処理は続行）
        # 相対パスの場合はヘルスチェックをスキップ
        health_check = None
        if not url.startswith('/'):
            base_url = url
            health_check = await check_api_health(session, step_name, base_url)
        
        print(f"🚀 {step_name}API処理開始...")
        if method == 'post':
            response = await session.post(full_url, json=json_data, timeout=300.0)
        else:
            response = await session.get(full_url, params=params, timeout=300.0)
        
        response.raise_for_status() # HTTPエラーがあれば例外を発生
        print(f"✅ {step_name}API処理完了")
        return {"step": step_name, "success": True, "message": "✅ 処理完了", "data": response.json(), "health_check": health_check}
    except httpx.HTTPStatusError as e:
        error_msg = f"❌ APIエラー: {e.response.status_code} - {e.response.text}"
        print(f"❌ {step_name}API処理失敗: {error_msg}")
        return {"step": step_name, "success": False, "message": error_msg}
    except httpx.RequestError as e:
        error_msg = f"❌ 接続エラー: {str(e)}"
        print(f"❌ {step_name}API接続失敗: {error_msg}")
        return {"step": step_name, "success": False, "message": error_msg}

@app.post("/api/batch/create-psychology-graph")
async def create_psychology_graph_batch(request: Request):
    """心理グラフ作成のバッチ処理を実行する"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    results = []
    
    # 初期化ログ
    init_log = {
        "step": "初期化", 
        "success": True, 
        "message": f"🚀 バッチ処理開始 - デバイス: {device_id[:8]}..., 日付: {date}"
    }
    results.append(init_log)

    async with httpx.AsyncClient() as session:
        # ステップ1: Whisperサーバー確認と処理
        whisper_result = await call_api(session, "Whisper音声文字起こし", API_ENDPOINTS["whisper"], json_data={"device_id": device_id, "date": date})
        
        # ヘルスチェック結果があれば追加
        if "health_check" in whisper_result:
            health_check = whisper_result["health_check"]
            health_check["step"] = "Whisperサーバー確認"
            results.append(health_check)
        
        results.append(whisper_result)
        if not whisper_result["success"]:
            return {"success": False, "message": "❌ Whisper処理で失敗しました。", "results": results}

        # ステップ2: プロンプト生成サーバー確認と処理
        prompt_params = {"device_id": device_id, "date": date}
        prompt_result = await call_api(session, "プロンプト生成", API_ENDPOINTS["prompt_gen"], method='get', params=prompt_params)
        
        # ヘルスチェック結果があれば追加
        if "health_check" in prompt_result:
            health_check = prompt_result["health_check"]
            health_check["step"] = "プロンプト生成サーバー確認"
            results.append(health_check)
        
        results.append(prompt_result)
        if not prompt_result["success"]:
            return {"success": False, "message": "❌ プロンプト生成で失敗しました。", "results": results}

        # ステップ3: ChatGPTサーバー確認と処理
        chatgpt_result = await call_api(session, "ChatGPT心理分析", API_ENDPOINTS["chatgpt"], json_data={"device_id": device_id, "date": date})
        
        # ヘルスチェック結果があれば追加
        if "health_check" in chatgpt_result:
            health_check = chatgpt_result["health_check"]
            health_check["step"] = "ChatGPTサーバー確認"
            results.append(health_check)
        
        results.append(chatgpt_result)
        if not chatgpt_result["success"]:
            return {"success": False, "message": "❌ ChatGPT分析で失敗しました。", "results": results}

    # 完了ログ
    completion_log = {
        "step": "完了", 
        "success": True, 
        "message": "🎉 バッチ処理が正常に完了しました。全てのステップが成功しました。"
    }
    results.append(completion_log)

    return {"success": True, "message": "✅ バッチ処理が正常に完了しました。", "results": results}


@app.post("/api/batch/create-behavior-graph")
async def create_behavior_graph_batch(request: Request):
    """
    行動グラフ作成のバッチ処理
    SED音響イベント検出 → SED Aggregatorを順番に実行
    """
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")
    
    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")
    
    results = []
    overall_success = True
    
    # 初期化
    results.append({
        "step": "初期化",
        "message": "行動グラフ作成バッチ処理を開始します...",
        "success": True
    })
    
    # API定義（行動グラフ関連）
    BEHAVIOR_API_ENDPOINTS = {
        "sed": "http://localhost:8004/fetch-and-process",
        "sed_aggregator": "http://localhost:8010/analysis/sed"
    }
    
    async with httpx.AsyncClient() as session:
        # 1. APIヘルスチェック（相対パスの場合はスキップ）
        for api_name, api_url in BEHAVIOR_API_ENDPOINTS.items():
            if api_url.startswith('/'):
                # 相対パスの場合はヘルスチェックをスキップ
                results.append({
                    "step": f"APIサーバー確認: {api_name}",
                    "message": f"✅ {api_name} API は管理画面経由で呼び出されます",
                    "success": True
                })
            else:
                # 絶対URLの場合のみヘルスチェック
                try:
                    api_base_url = api_url.rsplit('/', 1)[0]
                    health_check_url = f"{api_base_url}/health"
                    port = api_base_url.split(':')[-1]
                    
                    health_response = await session.get(health_check_url, timeout=2.0)
                    if health_response.status_code == 200:
                        results.append({
                            "step": f"APIサーバー確認: {api_name}",
                            "message": f"✅ {api_name} API (ポート{port}) は正常に動作しています",
                            "success": True
                        })
                    else:
                        results.append({
                            "step": f"APIサーバー確認: {api_name}",
                            "message": f"⚠️ {api_name} API (ポート{port}) のヘルスチェックが失敗しました (status: {health_response.status_code})",
                            "success": False
                        })
                except:
                    # ヘルスチェックエンドポイントがない場合は続行
                    port = api_url.split(':')[2].split('/')[0]
                    results.append({
                        "step": f"APIサーバー確認: {api_name}",
                        "message": f"⚠️ {api_name} API (ポート{port}) のヘルスチェックができませんでした。処理を続行します。",
                        "success": True
                    })
        
        # 2. SED音響イベント検出
        sed_result = await call_api(
            session, 
            "SED音響イベント検出", 
            BEHAVIOR_API_ENDPOINTS["sed"], 
            json_data={
                "device_id": device_id,
                "date": date
            }
        )
        results.append(sed_result)
        if not sed_result["success"]:
            overall_success = False
            results.append({
                "step": "エラー",
                "message": "SED音響イベント検出でエラーが発生したため、バッチ処理を中止します。",
                "success": False
            })
            return {"success": False, "message": "❌ バッチ処理が失敗しました。", "results": results}
        
        # 3. SED Aggregator - 行動グラフデータ生成
        aggregator_result = await call_api(
            session, 
            "SED Aggregator", 
            BEHAVIOR_API_ENDPOINTS["sed_aggregator"], 
            json_data={
                "device_id": device_id,
                "date": date
            }
        )
        results.append(aggregator_result)
        if not aggregator_result["success"]:
            overall_success = False
            results.append({
                "step": "エラー",
                "message": "SED Aggregatorでエラーが発生しましたが、SEDの処理は完了しています。",
                "success": False
            })
            return {"success": False, "message": "❌ バッチ処理が部分的に失敗しました。", "results": results}
    
    # 完了
    results.append({
        "step": "完了",
        "message": "🎉 行動グラフ作成バッチ処理が完了しました！",
        "success": True
    })
    
    return {"success": True, "message": "✅ バッチ処理が正常に完了しました。", "results": results}


# =============================================================================
# バッチ処理 - 個別ステップAPI（リアルタイム表示用）
# =============================================================================

@app.post("/api/batch/whisper-step")
async def batch_whisper_step(request: Request):
    """Whisperステップのみを実行"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient() as session:
        whisper_result = await call_api(session, "Whisper音声文字起こし", API_ENDPOINTS["whisper"], json_data={"device_id": device_id, "date": date})
        
        if whisper_result["success"]:
            return {"success": True, "message": "Whisper処理完了", "data": whisper_result.get("data")}
        else:
            return {"success": False, "message": whisper_result.get("message", "Whisper処理に失敗しました")}

@app.post("/api/batch/prompt-step")
async def batch_prompt_step(request: Request):
    """プロンプト生成ステップのみを実行"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient() as session:
        prompt_params = {"device_id": device_id, "date": date}
        prompt_result = await call_api(session, "プロンプト生成", API_ENDPOINTS["prompt_gen"], method='get', params=prompt_params)
        
        if prompt_result["success"]:
            return {"success": True, "message": "プロンプト生成完了", "data": prompt_result.get("data")}
        else:
            return {"success": False, "message": prompt_result.get("message", "プロンプト生成に失敗しました")}

@app.post("/api/batch/chatgpt-step")
async def batch_chatgpt_step(request: Request):
    """ChatGPT分析ステップのみを実行"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient() as session:
        chatgpt_result = await call_api(session, "ChatGPT心理分析", API_ENDPOINTS["chatgpt"], json_data={"device_id": device_id, "date": date})
        
        if chatgpt_result["success"]:
            return {"success": True, "message": "ChatGPT分析完了", "data": chatgpt_result.get("data")}
        else:
            return {"success": False, "message": chatgpt_result.get("message", "ChatGPT分析に失敗しました")}


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