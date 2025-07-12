/**
 * WatchMe Admin - 通知管理モジュール (ES Modules版)
 * 通知の一覧表示、作成、一括送信、統計表示機能を提供
 */

import { state, showNotification, showModal, closeModal, formatDate, copyToClipboard } from './core.js';

// =============================================================================
// 通知管理メイン機能
// =============================================================================

async function loadNotifications(page = 1) {
    try {
        const response = await axios.get(`/api/notifications?page=${page}&per_page=${state.notificationPagination.per_page}`);
        const data = response.data;
        
        state.currentNotifications = data.items;
        state.notificationPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderNotificationsTable();
        renderNotificationsPagination();
        updateNotificationStats();
        console.log(`通知一覧 ${state.currentNotifications.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('通知一覧の読み込みエラー:', error);
        showNotification('通知一覧の取得に失敗しました', 'error');
    }
}

function renderNotificationsTable() {
    const tbody = document.getElementById('notifications-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (state.currentNotifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">通知がありません</td></tr>';
        return;
    }
    
    state.currentNotifications.forEach(notification => {
        const row = document.createElement('tr');
        
        // タイプ表示のスタイリング
        const typeColor = getTypeColor(notification.type);
        const typeBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}">${getTypeLabel(notification.type)}</span>`;
        
        // 既読状態表示
        const readStatus = notification.is_read ? 
            '<span class="text-green-600">✓ 既読</span>' : 
            '<span class="text-blue-600 font-medium">未読</span>';
        
        row.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-sm">${typeBadge}</td>
            <td class="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs">
                <div class="truncate" title="${notification.title}">
                    ${notification.title}
                </div>
            </td>
            <td class="px-4 py-4 text-sm text-gray-900 max-w-sm">
                <div class="truncate" title="${notification.message}">
                    ${notification.message}
                </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${notification.triggered_by || '<span class="text-gray-400">-</span>'}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${readStatus}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(notification.created_at)}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-action="delete-notification" data-notification-id="${notification.id}" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderNotificationsPagination() {
    const container = document.getElementById('notifications-pagination');
    if (!container) return;
    
    let html = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                ${state.notificationPagination.total}件中 ${((state.notificationPagination.page - 1) * state.notificationPagination.per_page) + 1}-${Math.min(state.notificationPagination.page * state.notificationPagination.per_page, state.notificationPagination.total)}件を表示
            </div>
            <div class="flex space-x-2">
    `;
    
    // 前へボタン
    if (state.notificationPagination.has_prev) {
        html += `<button data-action="load-notifications" data-page="${state.notificationPagination.page - 1}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">前へ</button>`;
    } else {
        html += `<button disabled class="px-3 py-1 border border-gray-300 text-gray-400 rounded cursor-not-allowed">前へ</button>`;
    }
    
    // ページ番号
    const startPage = Math.max(1, state.notificationPagination.page - 2);
    const endPage = Math.min(state.notificationPagination.total_pages, state.notificationPagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === state.notificationPagination.page) {
            html += `<button class="px-3 py-1 bg-blue-600 text-white rounded">${i}</button>`;
        } else {
            html += `<button data-action="load-notifications" data-page="${i}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">${i}</button>`;
        }
    }
    
    // 次へボタン
    if (state.notificationPagination.has_next) {
        html += `<button data-action="load-notifications" data-page="${state.notificationPagination.page + 1}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">次へ</button>`;
    } else {
        html += `<button disabled class="px-3 py-1 border border-gray-300 text-gray-400 rounded cursor-not-allowed">次へ</button>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
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
            <button data-action="close-modal" type="button" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                キャンセル
            </button>
            <button data-action="create-notification" type="button" 
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
            <button data-action="close-modal" type="button" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                キャンセル
            </button>
            <button data-action="send-broadcast-notification" type="button" 
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

function getTypeColor(type) {
    switch (type) {
        case 'announcement': return 'bg-blue-100 text-blue-800';
        case 'system': return 'bg-gray-100 text-gray-800';
        case 'event': return 'bg-green-100 text-green-800';
        case 'alert': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getTypeLabel(type) {
    switch (type) {
        case 'announcement': return 'お知らせ';
        case 'system': return 'システム';
        case 'event': return 'イベント';
        case 'alert': return '警告';
        default: return type || '不明';
    }
}

function getNotificationTypeEmoji(type) {
    switch (type) {
        case 'announcement': return '📢';
        case 'system': return '⚙️';
        case 'event': return '🎉';
        case 'alert': return '🚨';
        default: return '📄';
    }
}

function getNotificationTypeLabel(type) {
    return getTypeLabel(type);
}

// =============================================================================
// イベント委譲ハンドラー
// =============================================================================

function setupNotificationEventDelegation() {
    // 通知テーブルのイベント委譲
    const notificationsTable = document.getElementById('notifications-table-body');
    if (notificationsTable) {
        notificationsTable.addEventListener('click', function(e) {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const notificationId = button.dataset.notificationId;
            
            switch (action) {
                case 'delete-notification':
                    deleteNotification(notificationId);
                    break;
            }
        });
    }
    
    // 通知ページネーションのイベント委譲
    const notificationsPagination = document.getElementById('notifications-pagination');
    if (notificationsPagination) {
        notificationsPagination.addEventListener('click', function(e) {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const page = parseInt(button.dataset.page);
            
            if (action === 'load-notifications' && page) {
                loadNotifications(page);
            }
        });
    }
    
    // モーダル内のイベント委譲（動的に追加されるため、documentレベルで処理）
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        
        switch (action) {
            case 'close-modal':
                closeModal();
                break;
            case 'create-notification':
                createNotification();
                break;
            case 'send-broadcast-notification':
                sendBroadcastNotification();
                break;
        }
    });
}

// =============================================================================
// 初期化とイベントリスナー（exportする）
// =============================================================================

export function initializeNotificationManagement() {
    console.log('通知管理モジュール初期化開始');
    
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
    
    // イベント委譲の設定
    setupNotificationEventDelegation();
    
    // 初回データ読み込み
    loadNotifications();
    updateNotificationStats();
    
    console.log('通知管理モジュール初期化完了');
}