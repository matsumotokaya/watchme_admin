/**
 * WatchMe Admin Core - 共通機能 (ES Modules版)
 * すべてのモジュールで使用される基本機能を提供
 */

// 状態管理オブジェクト
export const state = {
    // データ
    currentUsers: [],
    currentDevices: [],
    currentNotifications: [],
    
    // ページネーション状態
    userPagination: { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false },
    devicePagination: { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false },
    notificationPagination: { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false },
    
    // DOM要素キャッシュ
    elements: {},
    
    // 初期化済みフラグ
    initialized: false
};

// =============================================================================
// 通知システム
// =============================================================================

export function showNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                   type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                   'bg-blue-100 border-blue-400 text-blue-700';
    
    notification.className = `border-l-4 p-4 mb-4 ${bgColor}`;
    notification.innerHTML = `
        <div class="flex">
            <div class="flex-1">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-semibold">&times;</button>
        </div>
    `;
    
    notificationArea.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

// =============================================================================
// モーダル管理
// =============================================================================

export function showModal(title, content) {
    const modalOverlay = state.elements.modalOverlay;
    const modalContent = state.elements.modalContent;
    
    if (!modalOverlay || !modalContent) return;
    
    modalContent.innerHTML = `
        <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <span class="sr-only">閉じる</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="px-6 py-4">
                ${content}
            </div>
        </div>
    `;
    
    modalOverlay.classList.remove('hidden');
}

export function closeModal() {
    const modalOverlay = state.elements.modalOverlay;
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
}


// =============================================================================
// タブ機能
// =============================================================================

export function setupTabs() {
    // URLパラメータからタブを取得
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    // タブボタンのクリックイベント
    state.elements.tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.id.replace('-tab', '');
            switchTab(tabId);
            
            // URLを更新（ブラウザ履歴に追加）
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.pushState({}, '', url);
        });
    });
    
    // URLパラメータで指定されたタブがあれば、そのタブを表示
    if (tabFromUrl) {
        switchTab(tabFromUrl);
    }
}

export function switchTab(tabId) {
    // タブボタンのアクティブ状態を更新
    state.elements.tabButtons.forEach(btn => {
        btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(tabId + '-tab');
    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
    }

    // タブコンテンツの表示を切り替え（動的に取得）
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(tabId + '-content');
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }

    console.log(`タブ切り替え: ${tabId}`);
}


// =============================================================================
// ユーティリティ関数
// =============================================================================

export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
}

export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('クリップボードにコピーしました', 'success', 2000);
    }).catch(err => {
        console.error('コピーに失敗:', err);
        showNotification('コピーに失敗しました', 'error');
    });
}


// =============================================================================
// 統計情報読み込み
// =============================================================================

export async function loadStats() {
    try {
        const response = await axios.get('/api/stats');
        const stats = response.data;
        const statsDisplay = document.getElementById('stats-display');
        if (statsDisplay) {
            statsDisplay.textContent = `ユーザー: ${stats.users_count} | デバイス: ${stats.devices_count}`;
        }
    } catch (error) {
        console.error('統計読み込みエラー:', error);
        const statsDisplay = document.getElementById('stats-display');
        if (statsDisplay) {
            statsDisplay.textContent = '統計情報取得失敗';
        }
    }
}

// =============================================================================
// 初期化
// =============================================================================

export function initializeCore() {
    if (state.initialized) return;
    
    console.log('WatchMe Admin Core - 初期化開始');
    
    // DOM要素の初期化
    state.elements = {
        tabButtons: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        modalOverlay: document.getElementById('modal-overlay'),
        modalContent: document.getElementById('modal-content'),
        notificationArea: document.getElementById('notification-area'),
        statsDisplay: document.getElementById('stats-display')
    };
    
    setupTabs();
    
    // モーダルクローズイベント
    const modalOverlay = state.elements.modalOverlay;
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    state.initialized = true;
    console.log('WatchMe Admin Core - 初期化完了');
}