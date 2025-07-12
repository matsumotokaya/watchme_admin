/**
 * WatchMe Admin - メインアプリケーション
 * コンポーネント統合と全体初期化を担当（軽量化済み）
 */

// =============================================================================
// メイン初期化処理
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('WatchMe 音声データ心理分析システム - メイン初期化開始');
    
    // コアモジュールが初期化されるのを待つ
    if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
        initializeMainApplication();
    } else {
        // 短い間隔で初期化状態をチェック
        const initInterval = setInterval(() => {
            if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
                clearInterval(initInterval);
                initializeMainApplication();
            }
        }, 50);
        
        // 5秒でタイムアウト
        setTimeout(() => {
            clearInterval(initInterval);
            console.warn('コアモジュールの初期化がタイムアウトしました');
        }, 5000);
    }
});

function initializeMainApplication() {
    console.log('メインアプリケーション初期化開始');
    
    // 統計情報とデータの初期読み込み
    loadStats();
    
    // 各管理モジュールのデータを並行読み込み
    Promise.all([
        // ユーザー管理とデバイス管理は各モジュールで初期化される
        // 通知管理も各モジュールで初期化される
    ]).then(() => {
        console.log('全モジュールのデータ読み込み完了');
    }).catch(error => {
        console.error('データ読み込みエラー:', error);
        showNotification('データの読み込み中にエラーが発生しました', 'error');
    });
    
    console.log('WatchMe Admin - 初期化完了');
}