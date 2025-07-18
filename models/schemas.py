"""
WatchMe用途に基づく拡張されたPydanticモデル
音声データによる心理・行動・感情の可視化システム
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


# =============================================================================
# Enums - システムで使用する定数
# =============================================================================

class UserStatus(str, Enum):
    GUEST = "guest"
    MEMBER = "member"
    SUBSCRIBER = "subscriber"

class SubscriptionPlan(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class PlatformType(str, Enum):
    IOS = "iOS"
    ANDROID = "Android"
    WEB = "Web"

class DeviceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SYNCING = "syncing"
    ERROR = "error"


class NotificationType(str, Enum):
    ANNOUNCEMENT = "announcement"
    EVENT = "event"
    SYSTEM = "system"


# =============================================================================
# Users テーブル
# フィールド: user_id, name, email, created_at
# =============================================================================

class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    status: UserStatus = UserStatus.GUEST
    subscription_plan: Optional[SubscriptionPlan] = None


class UserCreate(UserBase):
    pass


class GuestUserCreate(BaseModel):
    """ゲストユーザー作成用（Auth不要）"""
    user_id: str  # auth.users.idを指定
    name: str = "ゲスト"
    status: UserStatus = UserStatus.GUEST


class UserUpgradeToMember(BaseModel):
    """ゲストから会員への昇格用"""
    name: str
    email: str
    user_id: str  # auth.usersのid


class UserStatusUpdate(BaseModel):
    """ユーザーステータス変更用"""
    status: UserStatus
    subscription_plan: Optional[SubscriptionPlan] = None


class User(UserBase):
    user_id: str  # 主キー（auth.users.idと同じ）
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =============================================================================
# Devices テーブル - 拡張版（音声取得デバイス）
# フィールド: device_id, device_type, registered_at, status, last_sync, total_audio_count, qr_code
# =============================================================================

class DeviceBase(BaseModel):
    device_type: str
    status: Optional[DeviceStatus] = DeviceStatus.ACTIVE
    platform_type: Optional[PlatformType] = None
    platform_identifier: Optional[str] = None


class DeviceCreate(DeviceBase):
    owner_user_id: str  # users.user_idと連携


class VirtualMobileDeviceCreate(BaseModel):
    """スマホ仮想デバイス作成用"""
    owner_user_id: str
    device_type: str = "virtual_mobile"
    platform_type: PlatformType
    platform_identifier: str  # iOS: identifierForVendor, Android: ANDROID_ID
    status: DeviceStatus = DeviceStatus.ACTIVE


class DeviceUpdate(BaseModel):
    status: Optional[DeviceStatus] = None
    last_sync: Optional[datetime] = None
    total_audio_count: Optional[int] = None


class Device(DeviceBase):
    device_id: str
    owner_user_id: Optional[str] = None  # オプショナルに変更
    registered_at: datetime
    last_sync: Optional[datetime] = None
    total_audio_count: int = 0
    qr_code: Optional[str] = None

    class Config:
        from_attributes = True






# =============================================================================
# 共通レスポンスモデル
# =============================================================================

class ResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class StatsResponse(BaseModel):
    """統計情報レスポンス"""
    users_count: int
    devices_count: int
    active_devices_count: int
    viewer_links_count: int
    active_links_count: int
    total_audio_count: int
    total_graph_count: int
    timestamp: datetime


# =============================================================================
# Notifications テーブル - 通知管理
# フィールド: id, user_id, type, title, message, is_read, created_at, triggered_by, metadata
# =============================================================================

class NotificationBase(BaseModel):
    user_id: str = Field(..., description="通知対象のユーザーID（UUID）")
    type: NotificationType = Field(..., description="通知タイプ")
    title: str = Field(..., description="通知のタイトル")
    message: str = Field(..., description="通知メッセージ")
    triggered_by: Optional[str] = Field(None, description="通知の送信者・システム名")
    metadata: Optional[Dict[str, Any]] = Field(None, description="追加のメタデータ（JSONB）")


class NotificationCreate(NotificationBase):
    """通知作成用モデル"""
    pass


class NotificationUpdate(BaseModel):
    """通知更新用モデル"""
    is_read: Optional[bool] = None
    triggered_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Notification(NotificationBase):
    """通知レスポンスモデル"""
    id: str = Field(..., description="通知ID（UUID）")
    is_read: bool = Field(default=False, description="既読フラグ")
    created_at: datetime = Field(..., description="作成日時")

    class Config:
        from_attributes = True


class NotificationBroadcast(BaseModel):
    """一括通知送信用モデル"""
    user_ids: List[str] = Field(..., description="送信対象のユーザーID一覧")
    type: NotificationType = Field(..., description="通知タイプ")
    title: str = Field(..., description="通知のタイトル")
    message: str = Field(..., description="通知メッセージ")
    triggered_by: Optional[str] = Field(None, description="通知の送信者・システム名")
    metadata: Optional[Dict[str, Any]] = Field(None, description="追加のメタデータ")


class NotificationBroadcastResponse(BaseModel):
    """一括通知送信結果"""
    success: bool
    sent_count: int
    failed_count: int
    message: str
    timestamp: datetime


# =============================================================================
# ページネーション関連モデル
# =============================================================================

class PaginationParams(BaseModel):
    """ページネーションパラメータ"""
    page: int = Field(default=1, ge=1, description="ページ番号（1から開始）")
    per_page: int = Field(default=20, ge=1, le=100, description="1ページあたりのアイテム数（最大100）")


class PaginatedResponse(BaseModel):
    """ページネーション付きレスポンス"""
    items: List[Any] = Field(..., description="アイテムリスト")
    total: int = Field(..., description="総アイテム数")
    page: int = Field(..., description="現在のページ番号")
    per_page: int = Field(..., description="1ページあたりのアイテム数")
    total_pages: int = Field(..., description="総ページ数")
    has_next: bool = Field(..., description="次のページがあるか")
    has_prev: bool = Field(..., description="前のページがあるか")


class PaginatedUsersResponse(PaginatedResponse):
    """ページネーション付きユーザー一覧レスポンス"""
    items: List[User]


class PaginatedDevicesResponse(PaginatedResponse):
    """ページネーション付きデバイス一覧レスポンス"""
    items: List[Device]


class PaginatedNotificationsResponse(PaginatedResponse):
    """ページネーション付き通知一覧レスポンス"""
    items: List[Notification]


# =============================================================================
# スケジューラー関連モデル
# =============================================================================

class SchedulerAPIType(str, Enum):
    """スケジューラーで管理するAPI種別"""
    WHISPER = "whisper"
    PROMPT = "prompt"
    CHATGPT = "chatgpt"

class SchedulerConfig(BaseModel):
    """スケジューラー設定"""
    api_type: SchedulerAPIType = Field(..., description="API種別")
    device_id: str = Field(..., description="デバイスID")
    interval_hours: int = Field(..., ge=1, le=24, description="実行間隔（時間）")
    enabled: bool = Field(True, description="有効/無効")

class SchedulerStatus(BaseModel):
    """スケジューラー状態"""
    api_type: SchedulerAPIType = Field(..., description="API種別")
    device_id: str = Field(..., description="デバイスID")
    enabled: bool = Field(..., description="有効/無効")
    interval_hours: int = Field(..., description="実行間隔（時間）")
    last_run: Optional[datetime] = Field(None, description="最終実行時刻")
    next_run: Optional[datetime] = Field(None, description="次回実行予定時刻")
    created_at: datetime = Field(..., description="作成時刻")

class SchedulerLogEntry(BaseModel):
    """スケジューラー実行ログエントリ"""
    timestamp: datetime = Field(..., description="実行時刻")
    api_type: SchedulerAPIType = Field(..., description="API種別")
    device_id: str = Field(..., description="デバイスID")
    status: str = Field(..., description="実行状態")
    message: str = Field(..., description="実行メッセージ")
    execution_type: str = Field(..., description="実行種別（scheduled/manual）")
    duration_seconds: Optional[float] = Field(None, description="実行時間（秒）")
    error_details: Optional[str] = Field(None, description="エラー詳細")

class SchedulerLogResponse(BaseModel):
    """スケジューラーログレスポンス"""
    api_type: SchedulerAPIType = Field(..., description="API種別")
    device_id: str = Field(..., description="デバイスID")
    logs: List[SchedulerLogEntry] = Field(..., description="ログエントリ一覧")
    total_count: int = Field(..., description="総ログ数")