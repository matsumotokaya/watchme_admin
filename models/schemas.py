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

class GraphType(str, Enum):
    EMOTION = "emotion"
    BEHAVIOR = "behavior"  
    PSYCHOLOGY = "psychology"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ERROR = "error"


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
# ViewerLinks テーブル - 時間範囲必須版
# フィールド: viewer_link_id, user_id, device_id, start_time, end_time
# 要件: start_time, end_time は必須（時間範囲制御）
# =============================================================================

class ViewerLinkBase(BaseModel):
    user_id: str
    device_id: str
    start_time: datetime = Field(..., description="閲覧開始時間（必須）")
    end_time: datetime = Field(..., description="閲覧終了時間（必須）")


class ViewerLinkCreate(ViewerLinkBase):
    pass


class ViewerLink(ViewerLinkBase):
    viewer_link_id: str

    class Config:
        from_attributes = True


class ViewerLinkWithDetails(BaseModel):
    """ユーザーとデバイス情報を含む詳細表示用"""
    viewer_link_id: str
    user_id: str
    user_name: str
    user_email: str
    device_id: str
    device_type: str
    device_status: DeviceStatus
    start_time: datetime
    end_time: datetime
    is_active: bool  # 現在の時刻が期間内かどうか

    class Config:
        from_attributes = True


# =============================================================================
# AudioData テーブル - 音声データ管理
# フィールド: audio_id, device_id, recorded_at, file_path, file_size, duration_seconds, processed, created_at
# =============================================================================

class AudioDataBase(BaseModel):
    device_id: str
    recorded_at: datetime
    file_path: str
    file_size: int = 0
    duration_seconds: int = 0
    processed: bool = False


class AudioDataCreate(AudioDataBase):
    pass


class AudioData(AudioDataBase):
    audio_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# GraphData テーブル - グラフデータ管理
# フィールド: graph_id, device_id, audio_id, graph_type, time_range_start, time_range_end, data_json, generated_at
# =============================================================================

class GraphDataBase(BaseModel):
    device_id: str
    audio_id: str
    graph_type: GraphType
    time_range_start: datetime
    time_range_end: datetime
    data_json: Dict[str, Any] = Field(..., description="グラフデータ（JSON形式）")


class GraphDataCreate(GraphDataBase):
    pass


class GraphData(GraphDataBase):
    graph_id: str
    generated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# DeviceSession テーブル - デバイスセッション管理
# フィールド: session_id, device_id, started_at, ended_at, status, audio_count
# =============================================================================

class DeviceSessionBase(BaseModel):
    device_id: str
    status: SessionStatus = SessionStatus.ACTIVE


class DeviceSessionCreate(DeviceSessionBase):
    pass


class DeviceSessionUpdate(BaseModel):
    ended_at: Optional[datetime] = None
    status: Optional[SessionStatus] = None
    audio_count: Optional[int] = None


class DeviceSession(DeviceSessionBase):
    session_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    audio_count: int = 0

    class Config:
        from_attributes = True


# =============================================================================
# 統合レスポンスモデル - UI表示用
# =============================================================================

class MyDeviceInfo(BaseModel):
    """ユーザーのデバイス一覧表示用"""
    device_id: str
    device_type: str
    device_status: DeviceStatus
    last_sync: Optional[datetime] = None
    viewer_link_id: str
    start_time: datetime
    end_time: datetime
    is_active: bool
    total_audio_count: int = 0
    latest_graph_count: int = 0

    class Config:
        from_attributes = True


class GraphSummary(BaseModel):
    """グラフデータサマリー"""
    graph_type: GraphType
    time_range_start: datetime
    time_range_end: datetime
    data_points: int
    summary: Dict[str, Any]

    class Config:
        from_attributes = True


class DeviceGraphsResponse(BaseModel):
    """デバイスのグラフデータレスポンス"""
    device_id: str
    device_type: str
    time_range_start: datetime
    time_range_end: datetime
    graphs: List[GraphData]
    summary: List[GraphSummary]

    class Config:
        from_attributes = True


# =============================================================================
# QRコード・リンク関連
# =============================================================================

class QRCodeResponse(BaseModel):
    """QRコード生成レスポンス"""
    device_id: str
    qr_code_data: str
    qr_code_image_url: Optional[str] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeviceLinkRequest(BaseModel):
    """デバイスリンクリクエスト"""
    device_id: str
    start_time: datetime
    end_time: datetime


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