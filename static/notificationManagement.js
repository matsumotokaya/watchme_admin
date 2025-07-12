/**
 * WatchMe Admin - 通知管理モジュール
 * 通知の一覧表示、作成、一括送信、統計表示機能を提供
 */

// =============================================================================
// 通知管理メイン機能
// =============================================================================

async function loadNotifications(page = 1) {
    const admin = window.WatchMeAdmin;
    try {
        const response = await axios.get(`/api/notifications?page=${page}&per_page=${admin.notificationPagination.per_page}`);
        const data = response.data;
        
        admin.currentNotifications = data.items;
        admin.notificationPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderNotificationsList();
        renderNotificationsPagination();
        updateNotificationStats();
        console.log(`通知一覧 ${admin.currentNotifications.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('通知一覧の読み込みエラー:', error);
        showNotification('通知一覧の取得に失敗しました', 'error');
    }
}

function renderNotificationsList() {
    const admin = window.WatchMeAdmin;
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (admin.currentNotifications.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">通知がありません</div>';
        return;
    }
    
    const html = admin.currentNotifications.map(notification => {
        const typeEmoji = getNotificationTypeEmoji(notification.type);
        const isRead = notification.is_read;
        const readBadge = isRead ? 
            '<span class="text-xs text-green-600">✓ 既読</span>' : 
            '<span class="text-xs text-orange-600">● 未読</span>';
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-lg">${typeEmoji}</span>
                        <h4 class="font-medium text-gray-900">${notification.title}</h4>
                        ${readBadge}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="markAsRead('${notification.id}', ${!isRead})" 
                                class="text-sm px-2 py-1 ${isRead ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded">
                            ${isRead ? '未読にする' : '既読にする'}
                        </button>
                        <button onclick="deleteNotification('${notification.id}')" 
                                class="text-sm px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded">
                            削除
                        </button>
                    </div>
                </div>
                <p class="text-gray-700 mb-3">${notification.message}</p>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <div class="space-x-4">
                        <span>送信先: <span class="font-mono text-xs">${notification.user_id.substring(0, 8)}...</span></span>
                        <span>送信者: ${notification.triggered_by || 'admin'}</span>
                        <span>タイプ: ${getNotificationTypeLabel(notification.type)}</span>
                    </div>
                    <span>${formatDate(notification.created_at)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function renderNotificationsPagination() {
    const admin = window.WatchMeAdmin;
    renderPagination('notifications-pagination', admin.notificationPagination, 'loadNotifications');
}

// =============================================================================
// 通知作成・編集・削除
// =============================================================================

function showAddNotificationModal() {
    const content = `
        <form id="notification-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">ユーザーID</label>
                <input type="text" id="notification-user-id" placeholder="164cba5a-dba6-4cbc-9b39-4eea28d98fa5" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                <p class="mt-1 text-sm text-gray-500">通知を送信するユーザーのUUID</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">通知タイプ</label>
                <select id="notification-type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                    <option value="system">⚙️ システム</option>
                    <option value="alert">🚨 アラート</option>
                    <option value="promotion">🎉 プロモーション</option>
                    <option value="update">📦 アップデート</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">タイトル</label>
                <input type="text" id="notification-title" placeholder="重要なお知らせ" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">メッセージ</label>
                <textarea id="notification-message" rows="4" placeholder="ここに通知メッセージを入力してください..." 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">送信者（任意）</label>
                <input type="text" id="notification-triggered-by" placeholder="admin" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            </div>
        </form>
        <div class="flex justify-end mt-6 space-x-3">
            <button onclick="closeModal()" type="button" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                キャンセル
            </button>
            <button onclick="createNotification()" type="button" 
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                通知を作成
            </button>
        </div>
    `;
    
    showModal('🔔 新しい通知を作成', content);
    
    // ラジオボタンの変更イベント
    document.querySelectorAll('input[name="broadcast-target"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customSection = document.getElementById('custom-users-section');
            if (this.value === 'custom') {
                customSection.classList.remove('hidden');
            } else {
                customSection.classList.add('hidden');
            }
        });
    });
}

async function createNotification() {
    const notificationData = {
        user_id: document.getElementById('notification-user-id').value,
        type: document.getElementById('notification-type').value,
        title: document.getElementById('notification-title').value,
        message: document.getElementById('notification-message').value,
        triggered_by: document.getElementById('notification-triggered-by').value || 'admin'
    };
    
    try {
        await axios.post('/api/notifications', notificationData);
        showNotification('通知を作成しました', 'success');
        closeModal();
        loadNotifications(); // 通知一覧を再読み込み
        updateNotificationStats(); // 統計を更新
    } catch (error) {
        console.error('通知作成エラー:', error);
        showNotification('通知の作成に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

function showBroadcastNotificationModal() {
    const content = `
        <form id="broadcast-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">送信対象</label>
                <div class="mt-2 space-y-2">
                    <label class="inline-flex items-center">
                        <input type="radio" name="broadcast-target" value="all" checked class="form-radio">
                        <span class="ml-2">全ユーザー</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="broadcast-target" value="custom" class="form-radio">
                        <span class="ml-2">指定ユーザー</span>
                    </label>
                </div>
            </div>
            <div id="custom-users-section" class="hidden">
                <label class="block text-sm font-medium text-gray-700">ユーザーID（カンマ区切り）</label>
                <textarea id="broadcast-user-ids" rows="3" placeholder="164cba5a-dba6-4cbc-9b39-4eea28d98fa5,..." 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">通知タイプ</label>
                <select id="broadcast-type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                    <option value="system">⚙️ システム</option>
                    <option value="alert">🚨 アラート</option>
                    <option value="promotion">🎉 プロモーション</option>
                    <option value="update">📦 アップデート</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">タイトル</label>
                <input type="text" id="broadcast-title" placeholder="重要なお知らせ" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">メッセージ</label>
                <textarea id="broadcast-message" rows="4" placeholder="ここに通知メッセージを入力してください..." 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required></textarea>
            </div>
        </form>
        <div class="flex justify-end mt-6 space-x-3">
            <button onclick="closeModal()" type="button" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                キャンセル
            </button>
            <button onclick="sendBroadcastNotification()" type="button" 
                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                一括送信
            </button>
        </div>
    `;
    
    showModal('📡 一括通知送信', content);
    
    // ラジオボタンの変更イベント
    document.querySelectorAll('input[name="broadcast-target"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customSection = document.getElementById('custom-users-section');
            if (customSection) {
                if (this.value === 'custom') {
                    customSection.classList.remove('hidden');
                } else {
                    customSection.classList.add('hidden');
                }
            }
        });
    });
}

async function sendBroadcastNotification() {
    const admin = window.WatchMeAdmin;
    const target = document.querySelector('input[name="broadcast-target"]:checked').value;
    let userIds = [];
    
    if (target === 'all') {
        // 全ユーザーのIDを取得
        try {
            const response = await axios.get('/api/users/all');
            userIds = response.data.map(user => user.user_id);
        } catch (error) {
            showNotification('ユーザーリストの取得に失敗しました', 'error');
            return;
        }
    } else {
        // 指定されたユーザーIDを解析
        const userIdsText = document.getElementById('broadcast-user-ids').value;
        userIds = userIdsText.split(',').map(id => id.trim()).filter(id => id);
    }
    
    if (userIds.length === 0) {
        showNotification('送信対象のユーザーが見つかりません', 'error');
        return;
    }
    
    const broadcastData = {
        user_ids: userIds,
        type: document.getElementById('broadcast-type').value,
        title: document.getElementById('broadcast-title').value,
        message: document.getElementById('broadcast-message').value,
        triggered_by: 'admin'
    };
    
    try {
        const response = await axios.post('/api/notifications/broadcast', broadcastData);
        showNotification(`${response.data.sent_count}件の通知を送信しました`, 'success');
        closeModal();
        loadNotifications(); // 通知一覧を再読み込み
        updateNotificationStats(); // 統計を更新
    } catch (error) {
        console.error('一括通知送信エラー:', error);
        showNotification('一括通知の送信に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

async function markAsRead(notificationId, isRead) {
    try {
        await axios.put(`/api/notifications/${notificationId}`, { is_read: isRead });
        showNotification(isRead ? '通知を既読にしました' : '通知を未読にしました', 'success');
        loadNotifications(); // 通知一覧を再読み込み
        updateNotificationStats(); // 統計を更新
    } catch (error) {
        console.error('通知更新エラー:', error);
        showNotification('通知の更新に失敗しました', 'error');
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('この通知を削除しますか？')) {
        return;
    }
    
    try {
        await axios.delete(`/api/notifications/${notificationId}`);
        showNotification('通知を削除しました', 'success');
        loadNotifications(); // 通知一覧を再読み込み
        updateNotificationStats(); // 統計を更新
    } catch (error) {
        console.error('通知削除エラー:', error);
        showNotification('通知の削除に失敗しました', 'error');
    }
}

// =============================================================================
// 通知統計
// =============================================================================

async function updateNotificationStats() {
    try {
        const response = await axios.get('/api/notifications/stats');
        const stats = response.data;
        
        const statsContainer = document.getElementById('notification-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 class="text-sm font-medium text-gray-900 mb-3">📊 通知統計</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">${stats.total_notifications}</div>
                            <div class="text-sm text-gray-500">総通知数</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-orange-600">${stats.unread_notifications}</div>
                            <div class="text-sm text-gray-500">未読</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">${stats.read_notifications}</div>
                            <div class="text-sm text-gray-500">既読</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600">${Object.keys(stats.type_breakdown).length}</div>
                            <div class="text-sm text-gray-500">タイプ数</div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('通知統計の取得エラー:', error);
    }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

function getNotificationTypeEmoji(type) {
    switch (type) {
        case 'system': return '⚙️';
        case 'alert': return '🚨';
        case 'promotion': return '🎉';
        case 'update': return '📦';
        default: return '📄';
    }
}

function getNotificationTypeLabel(type) {
    switch (type) {
        case 'system': return 'システム';
        case 'alert': return 'アラート';
        case 'promotion': return 'プロモーション';
        case 'update': return 'アップデート';
        default: return type || '不明';
    }
}

// =============================================================================
// 初期化とイベントリスナー
// =============================================================================

function initializeNotificationManagement() {
    // 通知管理ボタンのイベントリスナー設定
    const createNotificationBtn = document.getElementById('create-notification-btn');
    if (createNotificationBtn) {
        createNotificationBtn.addEventListener('click', showAddNotificationModal);
    }
    
    const broadcastNotificationBtn = document.getElementById('broadcast-notification-btn');
    if (broadcastNotificationBtn) {
        broadcastNotificationBtn.addEventListener('click', showBroadcastNotificationModal);
    }
    
    const refreshNotificationsBtn = document.getElementById('refresh-notifications-btn');
    if (refreshNotificationsBtn) {
        refreshNotificationsBtn.addEventListener('click', loadNotifications);
    }
    
    console.log('通知管理モジュール初期化完了');
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // コアモジュールの初期化を待つ
    const waitForCore = () => {
        if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
            initializeNotificationManagement();
            loadNotifications(); // 初回データ読み込み
        } else {
            setTimeout(waitForCore, 50);
        }
    };
    waitForCore();
});