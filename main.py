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
import asyncio
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

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
    PaginationParams, PaginatedUsersResponse, PaginatedDevicesResponse, PaginatedNotificationsResponse,
    # スケジューラー関連
    SchedulerAPIType, SchedulerConfig, SchedulerStatus, SchedulerLogEntry, SchedulerLogResponse
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


# =============================================================================
# スケジューラー管理クラス
# =============================================================================

class WhisperTrialScheduler:
    """Whisper試験版スケジューラークラス"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.logs: List[SchedulerLogEntry] = []
        self.job_id = "whisper_trial_scheduler"
        self.scheduler.start()
        
    def start_trial_scheduler(self):
        """3時間おきのスケジューラーを開始"""
        if self.is_running:
            self._add_log("warning", "スケジューラーは既に実行中です")
            return False
            
        # 3時間おきのcron設定 (0, 3, 6, 9, 12, 15, 18, 21時)
        self.scheduler.add_job(
            self._process_whisper_slots,
            'cron',
            hour='0,3,6,9,12,15,18,21',
            id=self.job_id,
            replace_existing=True
        )
        
        self.is_running = True
        self._add_log("success", "Whisper試験スケジューラーを開始しました")
        return True
        
    def stop_trial_scheduler(self):
        """スケジューラーを停止"""
        if not self.is_running:
            self._add_log("warning", "スケジューラーは実行されていません")
            return False
            
        try:
            self.scheduler.remove_job(self.job_id)
            self.is_running = False
            self._add_log("success", "Whisper試験スケジューラーを停止しました")
            return True
        except Exception as e:
            self._add_log("error", f"スケジューラー停止に失敗: {str(e)}")
            return False
            
    def _generate_file_paths_for_24hours(self, device_id: str) -> List[Dict[str, str]]:
        """過去24時間分（48スロット）のファイルパスを機械的に生成"""
        file_paths = []
        now = datetime.now()
        
        # 現在のタイムブロックを計算（30分単位）
        current_minute = now.minute
        if current_minute < 30:
            base_minute = 0
        else:
            base_minute = 30
        
        # 基準点は現在のタイムブロックの1つ前
        base_time = now.replace(minute=base_minute, second=0, microsecond=0)
        if base_minute == 0:
            base_time = base_time - timedelta(minutes=30)
        else:
            base_time = base_time.replace(minute=0)
        
        self._add_log("info", f"🕐 基準時刻: {base_time.strftime('%Y-%m-%d %H:%M')}")
        
        # 48スロット分のファイルパスを生成（30分ずつ遡る）
        for i in range(48):
            slot_time = base_time - timedelta(minutes=30 * i)
            date_str = slot_time.strftime('%Y-%m-%d')
            time_block = slot_time.strftime('%H-%M')
            
            file_path = f"files/{device_id}/{date_str}/{time_block}/audio.wav"
            file_paths.append({
                'file_path': file_path,
                'date': date_str,
                'time_block': time_block,
                'recorded_at': slot_time.isoformat()
            })
        
        return file_paths
    
    async def _process_whisper_slots(self):
        """24時間前から現在までの未処理音声を処理"""
        start_time = datetime.now()
        self._add_log("info", "🚀 Whisper自動処理を開始")
        
        try:
            # デフォルトデバイスID
            device_id = "d067d407-cf73-4174-a9c1-d91fb60d64d0"
            
            # 過去24時間分のファイルパスを生成
            all_possible_files = self._generate_file_paths_for_24hours(device_id)
            self._add_log("info", f"📋 48スロット分のファイルパスを生成しました")
            
            # データベースと突き合わせ
            supabase_client = get_supabase_client()
            pending_file_paths = []
            
            self._add_log("info", "🔍 データベースとの突き合わせを開始...")
            
            # 各ファイルパスについてデータベースを確認
            for file_info in all_possible_files:
                file_path = file_info['file_path']
                date_str = file_info['date']
                time_block = file_info['time_block']
                
                # audio_filesテーブルから該当レコードを検索
                result = await supabase_client.select(
                    "audio_files",
                    filters={
                        "device_id": device_id,
                        "file_path": file_path
                    }
                )
                
                if result and len(result) > 0:
                    record = result[0]
                    # pendingステータスの場合のみ処理対象に追加
                    if record.get('transcriptions_status') == 'pending':
                        pending_file_paths.append(file_path)
                        self._add_log("info", f"  ✅ {time_block} - pending状態、処理対象に追加")
                    else:
                        self._add_log("info", f"  ⏭️ {time_block} - {record.get('transcriptions_status', 'unknown')}、スキップ")
                else:
                    self._add_log("info", f"  ❌ {time_block} - レコードなし、スキップ")
            
            self._add_log("info", f"📊 突き合わせ結果: {len(pending_file_paths)}件のpendingファイルを検出")
            
            if not pending_file_paths:
                self._add_log("info", "ℹ️ 処理対象のファイルがありません（すべて処理済みまたはレコードなし）")
                return
            
            # Whisper APIに処理を依頼
            self._add_log("info", f"🎤 Whisper APIに{len(pending_file_paths)}件のファイルを送信...")
            
            async with httpx.AsyncClient(timeout=600) as client:
                url = "https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe"
                payload = {
                    "file_paths": pending_file_paths,
                    "model": "base"
                }
                
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    summary = result.get("summary", {})
                    
                    # 処理結果をログに記録
                    processed = summary.get("pending_processed", 0)
                    errors = summary.get("errors", 0)
                    
                    self._add_log("success", f"✅ Whisper処理完了: {processed}件を処理、{errors}件のエラー")
                    
                    if result.get("processed_files"):
                        for file_path in result["processed_files"]:
                            time_block = file_path.split('/')[-2] if '/' in file_path else 'unknown'
                            self._add_log("info", f"  ✅ {time_block} - 文字起こし完了")
                else:
                    self._add_log("error", f"❌ Whisper API エラー: ステータス {response.status_code}")
                    self._add_log("error", f"Response: {response.text}")
            
            # 処理完了
            duration = (datetime.now() - start_time).total_seconds()
            self._add_log("success", f"🎉 Whisper自動処理完了 (実行時間: {duration:.1f}秒)")
                    
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self._add_log("error", f"❌ 処理エラー: {str(e)} (実行時間: {duration:.1f}秒)")
            
    async def run_now(self):
        """手動実行（今すぐ実行）"""
        self._add_log("info", "📌 手動実行を開始")
        await self._process_whisper_slots()
            
    def _add_log(self, status: str, message: str):
        """ログエントリを追加"""
        log_entry = SchedulerLogEntry(
            timestamp=datetime.now(),
            api_type=SchedulerAPIType.WHISPER,
            device_id="d067d407-cf73-4174-a9c1-d91fb60d64d0",
            status=status,
            message=message,
            execution_type="scheduled"
        )
        
        self.logs.append(log_entry)
        
        # ログは最新100件まで保持
        if len(self.logs) > 100:
            self.logs = self.logs[-100:]
            
    def get_status(self) -> Dict[str, Any]:
        """現在の状態を取得"""
        return {
            "is_running": self.is_running,
            "logs": self.logs[-20:],  # 最新20件
            "total_logs": len(self.logs)
        }

class APISchedulerManager:
    """各APIのスケジューラーを管理するクラス"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        self.scheduler_logs: Dict[str, List[SchedulerLogEntry]] = {}
        self.scheduler.start()
        
    def _get_job_id(self, api_type: SchedulerAPIType, device_id: str) -> str:
        """ジョブIDを生成"""
        return f"{api_type.value}_{device_id}"
        
    def _add_log_entry(self, api_type: SchedulerAPIType, device_id: str, status: str, 
                      message: str, execution_type: str = "scheduled", 
                      duration_seconds: Optional[float] = None, 
                      error_details: Optional[str] = None):
        """ログエントリを追加"""
        key = f"{api_type.value}_{device_id}"
        if key not in self.scheduler_logs:
            self.scheduler_logs[key] = []
            
        log_entry = SchedulerLogEntry(
            timestamp=datetime.now(),
            api_type=api_type,
            device_id=device_id,
            status=status,
            message=message,
            execution_type=execution_type,
            duration_seconds=duration_seconds,
            error_details=error_details
        )
        
        self.scheduler_logs[key].append(log_entry)
        
        # 最新100件のログのみ保持
        if len(self.scheduler_logs[key]) > 100:
            self.scheduler_logs[key] = self.scheduler_logs[key][-100:]
            
    async def _call_api_endpoint(self, api_type: SchedulerAPIType, device_id: str, date: str = None) -> Dict[str, Any]:
        """APIエンドポイントを呼び出し"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
            
        async with httpx.AsyncClient(timeout=300.0) as client:
            if api_type == SchedulerAPIType.WHISPER:
                response = await client.post(
                    f"http://localhost:9000/api/whisper/fetch-and-transcribe",
                    json={
                        "device_id": device_id,
                        "date": date,
                        "model": "base"
                    }
                )
            elif api_type == SchedulerAPIType.PROMPT:
                response = await client.get(
                    f"http://localhost:9000/api/prompt/generate-mood-prompt-supabase",
                    params={
                        "device_id": device_id,
                        "date": date
                    }
                )
            elif api_type == SchedulerAPIType.CHATGPT:
                response = await client.post(
                    f"http://localhost:9000/api/chatgpt/analyze-vibegraph-supabase",
                    json={
                        "device_id": device_id,
                        "date": date
                    }
                )
            else:
                raise ValueError(f"Unknown API type: {api_type}")
                
            response.raise_for_status()
            return response.json()
            
    async def _scheduled_task(self, api_type: SchedulerAPIType, device_id: str):
        """スケジュールされたタスクを実行"""
        start_time = datetime.now()
        
        try:
            self._add_log_entry(
                api_type, device_id, "started", 
                f"スケジュール実行開始: {api_type.value}", "scheduled"
            )
            
            result = await self._call_api_endpoint(api_type, device_id)
            
            duration = (datetime.now() - start_time).total_seconds()
            self._add_log_entry(
                api_type, device_id, "completed", 
                f"スケジュール実行完了: {api_type.value}", "scheduled",
                duration_seconds=duration
            )
            
            # 最終実行時刻を更新
            job_id = self._get_job_id(api_type, device_id)
            if job_id in self.active_jobs:
                self.active_jobs[job_id]["last_run"] = datetime.now()
                
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self._add_log_entry(
                api_type, device_id, "failed", 
                f"スケジュール実行エラー: {api_type.value}", "scheduled",
                duration_seconds=duration, error_details=str(e)
            )
            
    async def start_scheduler(self, config: SchedulerConfig) -> SchedulerStatus:
        """スケジューラーを開始"""
        job_id = self._get_job_id(config.api_type, config.device_id)
        
        # 既存のジョブがあれば停止
        if job_id in self.active_jobs:
            self.scheduler.remove_job(job_id)
            
        # 新しいジョブを追加
        next_run = datetime.now() + timedelta(hours=config.interval_hours)
        self.scheduler.add_job(
            self._scheduled_task,
            trigger=IntervalTrigger(hours=config.interval_hours),
            id=job_id,
            args=[config.api_type, config.device_id],
            next_run_time=next_run
        )
        
        # アクティブジョブリストに追加
        self.active_jobs[job_id] = {
            "api_type": config.api_type,
            "device_id": config.device_id,
            "enabled": config.enabled,
            "interval_hours": config.interval_hours,
            "last_run": None,
            "next_run": next_run,
            "created_at": datetime.now()
        }
        
        self._add_log_entry(
            config.api_type, config.device_id, "scheduler_started", 
            f"スケジューラー開始: {config.interval_hours}時間間隔", "system"
        )
        
        return SchedulerStatus(
            api_type=config.api_type,
            device_id=config.device_id,
            enabled=config.enabled,
            interval_hours=config.interval_hours,
            last_run=None,
            next_run=next_run,
            created_at=datetime.now()
        )
        
    async def stop_scheduler(self, api_type: SchedulerAPIType, device_id: str) -> bool:
        """スケジューラーを停止"""
        job_id = self._get_job_id(api_type, device_id)
        
        if job_id in self.active_jobs:
            try:
                self.scheduler.remove_job(job_id)
                del self.active_jobs[job_id]
                
                self._add_log_entry(
                    api_type, device_id, "scheduler_stopped", 
                    "スケジューラー停止", "system"
                )
                
                return True
            except Exception as e:
                self._add_log_entry(
                    api_type, device_id, "scheduler_stop_failed", 
                    f"スケジューラー停止エラー: {str(e)}", "system"
                )
                return False
        
        return False
        
    def get_scheduler_status(self, api_type: SchedulerAPIType, device_id: str) -> Optional[SchedulerStatus]:
        """スケジューラーの状態を取得"""
        job_id = self._get_job_id(api_type, device_id)
        
        if job_id in self.active_jobs:
            job_info = self.active_jobs[job_id]
            return SchedulerStatus(
                api_type=job_info["api_type"],
                device_id=job_info["device_id"],
                enabled=job_info["enabled"],
                interval_hours=job_info["interval_hours"],
                last_run=job_info["last_run"],
                next_run=job_info["next_run"],
                created_at=job_info["created_at"]
            )
        
        return None
        
    def get_scheduler_logs(self, api_type: SchedulerAPIType, device_id: str, limit: int = 50) -> SchedulerLogResponse:
        """スケジューラーのログを取得"""
        key = f"{api_type.value}_{device_id}"
        logs = self.scheduler_logs.get(key, [])
        
        # 最新のログから指定数分を取得
        recent_logs = logs[-limit:] if len(logs) > limit else logs
        
        return SchedulerLogResponse(
            api_type=api_type,
            device_id=device_id,
            logs=recent_logs,
            total_count=len(logs)
        )
        
    def get_all_scheduler_status(self) -> List[SchedulerStatus]:
        """すべてのスケジューラーの状態を取得"""
        statuses = []
        for job_id, job_info in self.active_jobs.items():
            statuses.append(SchedulerStatus(
                api_type=job_info["api_type"],
                device_id=job_info["device_id"],
                enabled=job_info["enabled"],
                interval_hours=job_info["interval_hours"],
                last_run=job_info["last_run"],
                next_run=job_info["next_run"],
                created_at=job_info["created_at"]
            ))
        return statuses


# グローバルスケジューラー管理インスタンス
scheduler_manager = APISchedulerManager()
whisper_trial_scheduler = WhisperTrialScheduler()


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
    "whisper": "https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe",
    "prompt_gen": "https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase",
    "chatgpt": "https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase",
    "sed": "https://api.hey-watch.me/behavior-features/fetch-and-process-paths",
    "sed_aggregator": "https://api.hey-watch.me/behavior-aggregator/analysis/sed",
    "opensmile": "https://api.hey-watch.me/emotion-features/process/emotion-features",
    "opensmile_aggregator": "https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator"
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
        whisper_result = await call_api(session, "Whisper音声文字起こし", API_ENDPOINTS["whisper"], json_data={"device_id": device_id, "date": date, "model": "base"})
        
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
        "sed": "/api/sed/fetch-and-process",  # プロキシ経由で呼び出し
        "sed_aggregator": "/api/sed-aggregator/analysis/sed"  # プロキシ経由で呼び出し
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

@app.post("/api/whisper/fetch-and-transcribe")
async def whisper_proxy(request: Request):
    """Whisper APIへのプロキシエンドポイント（CORS回避用）"""
    body = await request.json()
    file_paths = body.get("file_paths")
    model = body.get("model", "base")
    
    # 旧形式との互換性を保持
    device_id = body.get("device_id")
    date = body.get("date")

    # file_pathsが指定されている場合は新形式
    if file_paths:
        whisper_data = {"file_paths": file_paths, "model": model}
    # device_idとdateが指定されている場合は旧形式
    elif device_id and date:
        whisper_data = {"device_id": device_id, "date": date, "model": model}
    else:
        raise HTTPException(status_code=400, detail="file_pathsまたはdevice_idとdateのいずれかが必須です")

    async with httpx.AsyncClient(timeout=600.0) as session:
        whisper_result = await call_api(session, "Whisper音声文字起こし", API_ENDPOINTS["whisper"], json_data=whisper_data)
        
        if whisper_result["success"]:
            return whisper_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=whisper_result.get("message", "Whisper処理に失敗しました"))

@app.get("/api/whisper/status")
async def whisper_status_proxy():
    """Whisper APIのステータス確認エンドポイント"""
    async with httpx.AsyncClient(timeout=10.0) as session:
        try:
            response = await session.get("https://api.hey-watch.me/vibe-transcriber/")
            if response.status_code == 200:
                return {"status": "online", "data": response.json()}
            else:
                return {"status": "error", "message": f"API responded with status {response.status_code}"}
        except Exception as e:
            return {"status": "offline", "message": str(e)}

@app.get("/api/prompt/generate-mood-prompt-supabase")
async def prompt_proxy(device_id: str, date: str):
    """プロンプト生成APIへのプロキシエンドポイント（CORS回避用）"""
    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient(timeout=300.0) as session:
        params = {"device_id": device_id, "date": date}
        prompt_result = await call_api(session, "プロンプト生成", API_ENDPOINTS["prompt_gen"], method='get', params=params)
        
        if prompt_result["success"]:
            return prompt_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=prompt_result.get("message", "プロンプト生成に失敗しました"))

@app.post("/api/chatgpt/analyze-vibegraph-supabase")
async def chatgpt_proxy(request: Request):
    """ChatGPT APIへのプロキシエンドポイント（CORS回避用）"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient(timeout=600.0) as session:
        chatgpt_data = {"device_id": device_id, "date": date}
        chatgpt_result = await call_api(session, "ChatGPTスコアリング", API_ENDPOINTS["chatgpt"], json_data=chatgpt_data)
        
        if chatgpt_result["success"]:
            return chatgpt_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=chatgpt_result.get("message", "ChatGPT処理に失敗しました"))

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

@app.post("/api/sed/fetch-and-process-paths")
async def sed_proxy(request: Request):
    """SED音響イベント検出APIへのプロキシエンドポイント（CORS回避用、file_pathsベース）"""
    body = await request.json()
    file_paths = body.get("file_paths")
    threshold = body.get("threshold", 0.2)
    
    # 旧形式との互換性を保持
    device_id = body.get("device_id")
    date = body.get("date")
    
    # file_pathsが指定されている場合は新形式
    if file_paths:
        sed_data = {
            "file_paths": file_paths,
            "threshold": threshold
        }
    # device_idとdateが指定されている場合は旧形式（廃止予定）
    elif device_id and date:
        raise HTTPException(status_code=400, detail="device_id/date指定は廃止されました。file_pathsを指定してください")
    else:
        raise HTTPException(status_code=400, detail="file_pathsは必須です")

    async with httpx.AsyncClient(timeout=300.0) as session:
        sed_result = await call_api(session, "SED音響イベント検出", API_ENDPOINTS["sed"], json_data=sed_data)
        
        if sed_result["success"]:
            return sed_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=sed_result.get("message", "SED処理に失敗しました"))

@app.get("/api/sed/status")
async def sed_status():
    """SED APIのステータス確認エンドポイント"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as session:
            # SED APIのヘルスチェック
            health_url = "https://api.hey-watch.me/behavior-features/"
            response = await session.get(health_url)
            
            if response.status_code == 200:
                health_data = response.json()
                return {
                    "status": "online",
                    "message": f"SED API稼働中",
                    "data": health_data
                }
            else:
                return {
                    "status": "error", 
                    "message": f"ヘルスチェック異常: HTTP {response.status_code}"
                }
    except Exception as e:
        return {
            "status": "offline",
            "message": f"接続失敗: {str(e)}"
        }

@app.post("/api/sed-aggregator/analysis/sed")
async def sed_aggregator_proxy(request: Request):
    """SED Aggregator APIへのプロキシエンドポイント（CORS回避用）"""
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient(timeout=300.0) as session:
        aggregator_data = {"device_id": device_id, "date": date}
        aggregator_result = await call_api(session, "SED Aggregator", API_ENDPOINTS["sed_aggregator"], json_data=aggregator_data)
        
        if aggregator_result["success"]:
            return aggregator_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=aggregator_result.get("message", "SED Aggregator処理に失敗しました"))

@app.post("/api/opensmile/process/emotion-features")
async def opensmile_proxy(request: Request):
    """OpenSMILE音声特徴量抽出APIへのプロキシエンドポイント（CORS回避用、file_pathsベース）"""
    body = await request.json()
    file_paths = body.get("file_paths")
    feature_set = body.get("feature_set", "eGeMAPSv02")
    include_raw_features = body.get("include_raw_features", False)
    
    # 旧形式との互換性を保持
    device_id = body.get("device_id")
    date = body.get("date")
    
    # file_pathsが指定されている場合は新形式
    if file_paths:
        opensmile_data = {
            "file_paths": file_paths,
            "feature_set": feature_set,
            "include_raw_features": include_raw_features
        }
    # device_idとdateが指定されている場合は旧形式（廃止予定）
    elif device_id and date:
        raise HTTPException(status_code=400, detail="device_id/date指定は廃止されました。file_pathsを指定してください")
    else:
        raise HTTPException(status_code=400, detail="file_pathsは必須です")

    async with httpx.AsyncClient(timeout=300.0) as session:
        opensmile_result = await call_api(session, "OpenSMILE音声特徴量抽出", API_ENDPOINTS["opensmile"], json_data=opensmile_data)
        
        if opensmile_result["success"]:
            return opensmile_result.get("data", {})
        else:
            raise HTTPException(status_code=500, detail=opensmile_result.get("message", "OpenSMILE処理に失敗しました"))

@app.get("/api/opensmile/status")
async def opensmile_status():
    """OpenSMILE APIのステータス確認エンドポイント"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as session:
            # OpenSMILE APIのヘルスチェック
            health_url = "https://api.hey-watch.me/emotion-features/health"
            response = await session.get(health_url)
            
            if response.status_code == 200:
                health_data = response.json()
                return {
                    "status": "online",
                    "message": f"OpenSMILE API稼働中 (v{health_data.get('version', 'unknown')})",
                    "data": health_data
                }
            else:
                return {
                    "status": "error", 
                    "message": f"ヘルスチェック異常: HTTP {response.status_code}"
                }
    except Exception as e:
        return {
            "status": "offline",
            "message": f"接続失敗: {str(e)}"
        }

@app.post("/api/opensmile/aggregate-features")
async def opensmile_aggregator_proxy(request: Request):
    """OpenSMILE Aggregator APIへのプロキシエンドポイント（CORS回避用）
    
    非同期タスクベースAPIのため、タスクを開始してから完了まで待機する
    """
    body = await request.json()
    device_id = body.get("device_id")
    date = body.get("date")

    if not device_id or not date:
        raise HTTPException(status_code=400, detail="device_idとdateは必須です")

    async with httpx.AsyncClient(timeout=600.0) as session:
        # Step 1: タスクを開始
        aggregator_data = {"device_id": device_id, "date": date}
        try:
            start_response = await session.post(
                API_ENDPOINTS["opensmile_aggregator"],
                json=aggregator_data,
                timeout=30.0
            )
            start_response.raise_for_status()
            start_result = start_response.json()
        except httpx.HTTPStatusError as e:
            error_msg = f"APIエラー: {e.response.status_code} - {e.response.text}"
            raise HTTPException(status_code=500, detail=error_msg)
        except Exception as e:
            error_msg = f"タスク開始エラー: {str(e)}"
            raise HTTPException(status_code=500, detail=error_msg)

        task_id = start_result.get("task_id")
        if not task_id:
            raise HTTPException(status_code=500, detail="タスクIDが取得できませんでした")

        # Step 2: タスクの完了を待機（最大5分）
        max_wait = 300  # 5分
        check_interval = 2  # 2秒ごとにチェック
        elapsed = 0
        
        while elapsed < max_wait:
            await asyncio.sleep(check_interval)
            elapsed += check_interval
            
            try:
                # タスクのステータスを確認
                status_url = API_ENDPOINTS["opensmile_aggregator"].replace("/analyze/opensmile-aggregator", f"/analyze/opensmile-aggregator/{task_id}")
                status_response = await session.get(status_url, timeout=10.0)
                status_response.raise_for_status()
                status_result = status_response.json()
                
                if status_result["status"] == "completed":
                    # 処理完了
                    if "result" in status_result:
                        result = status_result["result"]
                        # UIが期待する形式に変換
                        return {
                            "processed_slots": result.get("emotion_graph_length", 0),
                            "total_emotion_points": result.get("total_emotion_points", 0),
                            "aggregated_count": result.get("total_emotion_points", 0),  # 互換性のため
                            "has_data": result.get("total_emotion_points", 0) > 0,
                            "message": status_result.get("message", "処理完了"),
                            "output_path": result.get("output_path", "")
                        }
                    else:
                        return {
                            "processed_slots": 0,
                            "total_emotion_points": 0,
                            "aggregated_count": 0,
                            "has_data": False,
                            "message": "データが存在しません"
                        }
                elif status_result["status"] == "failed":
                    # 処理失敗
                    error_msg = status_result.get("error", "不明なエラー")
                    raise HTTPException(status_code=500, detail=f"感情分析失敗: {error_msg}")
                
                # まだ処理中の場合は次のループへ
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise HTTPException(status_code=500, detail="タスクが見つかりません")
                else:
                    # その他のHTTPエラー
                    continue
            except Exception as e:
                # 通信エラーなどは無視して次のチェックへ
                continue
        
        # タイムアウト
        raise HTTPException(status_code=500, detail="OpenSMILE Aggregator処理がタイムアウトしました")


# =============================================================================
# ヘルスチェック
# =============================================================================

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# =============================================================================
# スケジューラーAPI エンドポイント
# =============================================================================

@app.post("/api/scheduler/start", response_model=SchedulerStatus)
async def start_scheduler_endpoint(config: SchedulerConfig):
    """スケジューラーを開始"""
    try:
        status = await scheduler_manager.start_scheduler(config)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー開始エラー: {str(e)}")

@app.post("/api/scheduler/stop")
async def stop_scheduler_endpoint(api_type: SchedulerAPIType, device_id: str):
    """スケジューラーを停止"""
    try:
        success = await scheduler_manager.stop_scheduler(api_type, device_id)
        if success:
            return {"success": True, "message": "スケジューラーが停止されました"}
        else:
            return {"success": False, "message": "スケジューラーが見つかりませんでした"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー停止エラー: {str(e)}")

@app.get("/api/scheduler/status", response_model=Optional[SchedulerStatus])
async def get_scheduler_status_endpoint(api_type: SchedulerAPIType, device_id: str):
    """スケジューラーの状態を取得"""
    try:
        status = scheduler_manager.get_scheduler_status(api_type, device_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー状態取得エラー: {str(e)}")

@app.get("/api/scheduler/logs", response_model=SchedulerLogResponse)
async def get_scheduler_logs_endpoint(api_type: SchedulerAPIType, device_id: str, limit: int = 50):
    """スケジューラーのログを取得"""
    try:
        logs = scheduler_manager.get_scheduler_logs(api_type, device_id, limit)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラーログ取得エラー: {str(e)}")

@app.get("/api/scheduler/all-status", response_model=List[SchedulerStatus])
async def get_all_scheduler_status_endpoint():
    """すべてのスケジューラーの状態を取得"""
    try:
        statuses = scheduler_manager.get_all_scheduler_status()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"全スケジューラー状態取得エラー: {str(e)}")


# =============================================================================
# Whisper試験版スケジューラーAPI
# =============================================================================

@app.post("/api/whisper-trial-scheduler/start")
async def start_whisper_trial_scheduler():
    """Whisper試験版スケジューラーを開始"""
    try:
        success = whisper_trial_scheduler.start_trial_scheduler()
        if success:
            return {"success": True, "message": "Whisper試験スケジューラーを開始しました"}
        else:
            return {"success": False, "message": "スケジューラーは既に実行中です"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー開始エラー: {str(e)}")

@app.post("/api/whisper-trial-scheduler/stop")
async def stop_whisper_trial_scheduler():
    """Whisper試験版スケジューラーを停止"""
    try:
        success = whisper_trial_scheduler.stop_trial_scheduler()
        if success:
            return {"success": True, "message": "Whisper試験スケジューラーを停止しました"}
        else:
            return {"success": False, "message": "スケジューラーは実行されていません"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー停止エラー: {str(e)}")

@app.get("/api/whisper-trial-scheduler/status")
async def get_whisper_trial_scheduler_status():
    """Whisper試験版スケジューラーの状態を取得"""
    try:
        status = whisper_trial_scheduler.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー状態取得エラー: {str(e)}")

@app.post("/api/whisper-trial-scheduler/run-now")
async def run_whisper_trial_scheduler_now():
    """Whisper試験版スケジューラーを即座に実行"""
    try:
        await whisper_trial_scheduler._process_whisper_slots()
        return {"success": True, "message": "Whisper試験処理を実行しました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スケジューラー実行エラー: {str(e)}")


if __name__ == "__main__":
    print("🚀 WatchMe Admin Server starting...")
    print("✅ Supabase client will be initialized on first API call")
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=False, log_level="info")