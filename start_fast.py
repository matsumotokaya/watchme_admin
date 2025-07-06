#!/usr/bin/env python3
"""
高速起動用のWatchMe管理画面サーバー
Supabaseクライアントの遅延初期化により起動時間を短縮
"""

import uvicorn
from datetime import datetime

if __name__ == "__main__":
    print("🚀 WatchMe Admin Server (Fast Mode) starting...")
    print(f"⏰ Start time: {datetime.now().strftime('%H:%M:%S')}")
    print("🔧 Optimizations: Lazy Supabase init, No reload, Reduced logging")
    print("🌐 Access: http://localhost:9000")
    print("🔥 Ready in seconds!")
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=9000, 
        reload=False,           # リロード無効
        access_log=False,       # アクセスログ無効
        log_level="error"       # エラーログのみ
    )