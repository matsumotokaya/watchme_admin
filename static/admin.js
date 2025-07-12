/**
 * WatchMe Admin - メインエントリーポイント (ES Modules版)
 * すべてのモジュールを統合し、アプリケーションを初期化
 */

import { initializeCore, loadStats } from './core.js';
import { initializeUserManagement } from './userManagement.js';
import { initializeNotificationManagement } from './notificationManagement.js';
import { initializeDeviceManagement } from './deviceManagement.js';
import { initializePsychologyAnalysis } from './psychologyAnalysis.js';

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
        
        // 6. 心理分析モジュールの初期化
        initializePsychologyAnalysis();
        
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