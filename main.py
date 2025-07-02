"""
実際のSupabaseデータ構造に基づく正しいFastAPIアプリケーション
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
from typing import List
import uuid
from datetime import datetime

from api.supabase_client import SupabaseClient
from models.schemas import (
    User, Device, ViewerLink, ViewerLinkWithDetails,
    UserCreate, DeviceCreate, ViewerLinkCreate, ResponseModel
)

app = FastAPI(title="WatchMe Admin (Fixed)", description="修正済みWatchMe管理画面API", version="2.0.0")

# 静的ファイルとテンプレートの設定
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Supabaseクライアントの初期化
try:
    supabase_client = SupabaseClient()
    print("Supabase client initialized successfully")
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase_client = None


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """管理画面のメインページ"""
    return templates.TemplateResponse("index.html", {"request": request})


# =============================================================================
# Users API - 実際のフィールド構造に基づく
# =============================================================================

@app.get("/api/users", response_model=List[User])
async def get_users():
    """全ユーザーを取得"""
    try:
        users_data = await supabase_client.select("users")
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
        created_user = await supabase_client.insert("users", user_data)
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
        devices_data = await supabase_client.select("devices")
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
            "registered_at": datetime.now().isoformat()
        }
        created_device = await supabase_client.insert("devices", device_data)
        return created_device
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"デバイスの作成に失敗しました: {str(e)}")


# =============================================================================
# ViewerLinks API - 正しい関係性に基づく
# =============================================================================

@app.get("/api/viewer-links", response_model=List[ViewerLink])
async def get_all_viewer_links():
    """全てのViewerLinkを取得"""
    try:
        links = await supabase_client.select("viewer_links")
        return links
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ViewerLinkの取得に失敗しました: {str(e)}")


@app.get("/api/viewer-links/details", response_model=List[ViewerLinkWithDetails])
async def get_viewer_links_with_details():
    """ViewerLinkをユーザーとデバイス情報付きで取得"""
    try:
        # ViewerLinksを取得
        links = await supabase_client.select("viewer_links")
        
        # ユーザーとデバイス情報を並行取得
        users = await supabase_client.select("users")
        devices = await supabase_client.select("devices")
        
        # 辞書化して高速ルックアップ
        users_dict = {user["user_id"]: user for user in users}
        devices_dict = {device["device_id"]: device for device in devices}
        
        # 詳細情報を結合
        detailed_links = []
        for link in links:
            user = users_dict.get(link["user_id"])
            device = devices_dict.get(link["device_id"])
            
            if user and device:
                detailed_link = ViewerLinkWithDetails(
                    viewer_link_id=link["viewer_link_id"],
                    user_id=link["user_id"],
                    user_name=user["name"],
                    user_email=user["email"],
                    device_id=link["device_id"],
                    device_type=device["device_type"],
                    start_time=link.get("start_time"),
                    end_time=link.get("end_time")
                )
                detailed_links.append(detailed_link)
        
        return detailed_links
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"詳細ViewerLinkの取得に失敗しました: {str(e)}")


@app.get("/api/viewer-links/by-user/{user_id}", response_model=List[ViewerLink])
async def get_user_viewer_links(user_id: str):
    """特定ユーザーのViewerLinkを取得"""
    try:
        links = await supabase_client.select("viewer_links", filters={"user_id": user_id})
        return links
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ユーザーのViewerLink取得に失敗しました: {str(e)}")


@app.post("/api/viewer-links", response_model=ViewerLink)
async def create_viewer_link(viewer_link: ViewerLinkCreate):
    """新しいViewerLinkを作成（ユーザーとデバイスを関連付け）"""
    try:
        # ユーザーとデバイスの存在確認
        user_exists = await supabase_client.select("users", filters={"user_id": viewer_link.user_id})
        device_exists = await supabase_client.select("devices", filters={"device_id": viewer_link.device_id})
        
        if not user_exists:
            raise HTTPException(status_code=404, detail="指定されたユーザーが見つかりません")
        if not device_exists:
            raise HTTPException(status_code=404, detail="指定されたデバイスが見つかりません")
        
        link_data = {
            "viewer_link_id": str(uuid.uuid4()),
            "user_id": viewer_link.user_id,
            "device_id": viewer_link.device_id,
            "start_time": viewer_link.start_time.isoformat() if viewer_link.start_time else datetime.now().isoformat(),
            "end_time": viewer_link.end_time.isoformat() if viewer_link.end_time else None
        }
        created_link = await supabase_client.insert("viewer_links", link_data)
        return created_link
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ViewerLinkの作成に失敗しました: {str(e)}")


@app.delete("/api/viewer-links/{link_id}", response_model=ResponseModel)
async def delete_viewer_link(link_id: str):
    """ViewerLinkを削除"""
    try:
        success = await supabase_client.delete("viewer_links", {"viewer_link_id": link_id})
        if success:
            return ResponseModel(success=True, message="ViewerLinkが正常に削除されました")
        else:
            raise HTTPException(status_code=404, detail="ViewerLinkが見つかりません")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ViewerLinkの削除に失敗しました: {str(e)}")


# =============================================================================
# 統計・分析API
# =============================================================================

@app.get("/api/stats")
async def get_stats():
    """システム統計情報を取得"""
    try:
        users = await supabase_client.select("users")
        devices = await supabase_client.select("devices")
        viewer_links = await supabase_client.select("viewer_links")
        
        return {
            "users_count": len(users),
            "devices_count": len(devices),
            "viewer_links_count": len(viewer_links),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"統計情報の取得に失敗しました: {str(e)}")


# =============================================================================
# ヘルスチェック
# =============================================================================

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)