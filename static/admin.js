/**
 * WatchMe Admin - メインエントリーポイント (ES Modules版)
 * すべてのモジュールを統合し、アプリケーションを初期化
 */

import { initializeCore, loadStats } from './core.js';
import { initializeUserManagement } from './userManagement.js';
import { initializeNotificationManagement } from './notificationManagement.js';
import { initializeDeviceManagement } from './deviceManagement.js';

// =============================================================================
// メイン初期化処理
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('WatchMe Admin - ESモジュール版初期化開始');
    
    try {
        // 1. コアシステムの初期化
        initializeCore();
        
        // 2. 統計情報の読み込み
        loadStats();
        
        // 3. ユーザー管理モジュールの初期化
        initializeUserManagement();
        
        // 4. 通知管理モジュールの初期化
        initializeNotificationManagement();
        
        // 5. デバイス管理モジュールの初期化
        initializeDeviceManagement();
        
        // 6. 他のモジュールの初期化（現在は簡素化）
        initializeBasicModules();
        
        console.log('WatchMe Admin - 初期化完了');
        
    } catch (error) {
        console.error('初期化エラー:', error);
        // エラーが発生した場合も基本機能は動作させる
        document.getElementById('notification-area').innerHTML = `
            <div class="border-l-4 p-4 mb-4 bg-red-100 border-red-400 text-red-700">
                初期化中にエラーが発生しましたが、基本機能は利用できます。
            </div>
        `;
    }
});

// =============================================================================
// 基本モジュールの簡易初期化
// =============================================================================

function initializeBasicModules() {
    console.log('基本モジュール初期化開始');
    
    // デバイス管理は専用モジュールで処理済み
    
    // 通知管理は専用モジュールで処理済み
    
    // 心理分析の基本機能
    const startWhisperBtn = document.getElementById('start-whisper-btn');
    if (startWhisperBtn) {
        startWhisperBtn.addEventListener('click', function() {
            alert('Whisper処理機能は開発中です');
        });
    }
    
    console.log('基本モジュール初期化完了');
}