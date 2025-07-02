"""
実際のSupabaseデータ構造に基づく正しいPydanticモデル
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


# =============================================================================
# Users テーブル
# フィールド: user_id, name, email, created_at
# =============================================================================

class UserBase(BaseModel):
    name: str
    email: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Devices テーブル  
# フィールド: device_id, device_type, registered_at
# 注意: user_idフィールドは存在しない
# =============================================================================

class DeviceBase(BaseModel):
    device_type: str


class DeviceCreate(DeviceBase):
    pass


class Device(DeviceBase):
    device_id: str
    registered_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# ViewerLinks テーブル
# フィールド: viewer_link_id, user_id, device_id, start_time, end_time
# 注意: これがusersとdevicesを関連付ける中間テーブル
# =============================================================================

class ViewerLinkBase(BaseModel):
    user_id: str
    device_id: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ViewerLinkCreate(ViewerLinkBase):
    pass


class ViewerLink(ViewerLinkBase):
    viewer_link_id: str

    class Config:
        from_attributes = True


# =============================================================================
# ViewerLinkWithDetails - ユーザーとデバイス情報を含む詳細表示用
# =============================================================================

class ViewerLinkWithDetails(BaseModel):
    viewer_link_id: str
    user_id: str
    user_name: str
    user_email: str
    device_id: str
    device_type: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True


# =============================================================================
# 共通レスポンスモデル
# =============================================================================

class ResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None