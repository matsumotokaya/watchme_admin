/**
 * WatchMe 音声データ心理分析システム JavaScript
 * WatchMe要件対応: 音声データによる心理・行動・感情の可視化
 */

// グローバル変数
let currentUsers = [];
let currentDevices = [];
let currentViewerLinks = [];
let currentMyDevices = [];
let currentUserId = null;
let mainChart = null; // Chart.jsインスタンス

// DOM要素の取得
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const notificationArea = document.getElementById('notification-area');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('WatchMe 音声データ心理分析システム - 初期化開始');
    setupTabs();
    setupEventListeners();
    loadAllData();
    loadStats();
    initializeDefaultUserSession();
});

// =============================================================================
// タブ機能
// =============================================================================

function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.id.replace('-tab', '');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // タブボタンのアクティブ状態を更新
    tabButtons.forEach(btn => {
        btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(tabId + '-tab');
    activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');

    // タブコンテンツの表示を切り替え
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(tabId + '-content');
    activeContent.classList.remove('hidden');

    console.log(`タブ切り替え: ${tabId}`);
}

// =============================================================================
// イベントリスナーの設定
// =============================================================================

function setupEventListeners() {
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
    document.getElementById('add-device-btn').addEventListener('click', showAddDeviceModal);
    document.getElementById('add-viewer-link-btn').addEventListener('click', showAddViewerLinkModal);
    
    // 新しいWatchMe機能のイベントリスナー
    document.getElementById('refresh-my-devices-btn').addEventListener('click', refreshMyDevices);
    document.getElementById('load-graph-btn').addEventListener('click', loadGraphData);
    
    // モーダルを閉じる
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

// =============================================================================
// データ読み込み関数群
// =============================================================================

async function loadAllData() {
    console.log('全データ読み込み開始');
    try {
        await Promise.all([
            loadUsers(),
            loadDevices(),
            loadViewerLinks()
        ]);
        console.log('全データ読み込み完了');
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

async function loadUsers() {
    try {
        const response = await axios.get('/api/users');
        currentUsers = response.data;
        renderUsersTable();
        console.log(`ユーザー ${currentUsers.length} 件読み込み完了`);
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
        showNotification('ユーザーの読み込みに失敗しました', 'error');
    }
}

async function loadDevices() {
    try {
        console.log('デバイスAPI呼び出し開始');
        const response = await axios.get('/api/devices');
        console.log('デバイスAPIレスポンス:', response.data);
        currentDevices = response.data;
        renderDevicesTable();
        console.log(`デバイス ${currentDevices.length} 件読み込み完了`);
    } catch (error) {
        console.error('デバイス読み込みエラー詳細:', error);
        console.error('エラーレスポンス:', error.response?.data);
        console.error('エラーステータス:', error.response?.status);
        showNotification('デバイスの読み込みに失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

async function loadViewerLinks() {
    try {
        const response = await axios.get('/api/viewer-links/details');
        currentViewerLinks = response.data;
        renderViewerLinksTable();
        console.log(`ViewerLink ${currentViewerLinks.length} 件読み込み完了`);
    } catch (error) {
        console.error('ViewerLink読み込みエラー:', error);
        showNotification('ViewerLinkの読み込みに失敗しました', 'error');
    }
}

async function loadStats() {
    try {
        const response = await axios.get('/api/stats');
        const stats = response.data;
        document.getElementById('stats-display').textContent = 
            `ユーザー: ${stats.users_count} | デバイス: ${stats.devices_count} | リンク: ${stats.viewer_links_count}`;
    } catch (error) {
        console.error('統計読み込みエラー:', error);
        document.getElementById('stats-display').textContent = '統計情報取得失敗';
    }
}

// =============================================================================
// テーブル描画関数群
// =============================================================================

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    if (currentUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-4 text-center text-gray-500">ユーザーがありません</td></tr>';
        return;
    }
    
    currentUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // ステータス表示のスタイリング
        const statusColor = getStatusColor(user.status);
        const statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">${getStatusLabel(user.status)}</span>`;
        
        // プラン表示
        const planDisplay = user.subscription_plan ? 
            `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">${getPlanLabel(user.subscription_plan)}</span>` : 
            '<span class="text-gray-400">-</span>';
        
        // ニュースレター購読表示
        const newsletterDisplay = user.newsletter_subscription ? 
            '<span class="text-green-600">✓ 購読中</span>' : 
            '<span class="text-gray-400">-</span>';
        
        row.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900" title="${user.user_id}">${user.user_id.substring(0, 8)}...</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name || '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${user.email || '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${planDisplay}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${newsletterDisplay}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.created_at)}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${user.updated_at ? formatDate(user.updated_at) : '<span class="text-gray-400">-</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewUserDetails('${user.user_id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="詳細表示">👁️</button>
                <button onclick="editUser('${user.user_id}')" class="text-green-600 hover:text-green-900 mr-2" title="編集">✏️</button>
                <button onclick="deleteUser('${user.user_id}')" class="text-red-600 hover:text-red-900" title="削除">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDevicesTable() {
    const tbody = document.getElementById('devices-table-body');
    tbody.innerHTML = '';
    
    if (currentDevices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-gray-500">デバイスがありません</td></tr>';
        return;
    }
    
    currentDevices.forEach(device => {
        // デバイス状態の取得
        const status = device.status || 'active';
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800', 
            'syncing': 'bg-blue-100 text-blue-800',
            'error': 'bg-red-100 text-red-800'
        };
        const statusEmojis = {
            'active': '🟢',
            'inactive': '⚪',
            'syncing': '🔄',
            'error': '🔴'
        };
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900" title="${device.device_id}">${device.device_id.substring(0, 8)}...</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.device_type || '-'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title="${device.owner_user_id || ''}">${device.owner_user_id ? device.owner_user_id.substring(0, 8) + '...' : '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.platform_type || '<span class="text-gray-400">-</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.platform_identifier || '<span class="text-gray-400">-</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${statusColors[status] || statusColors.active}">
                    ${statusEmojis[status] || statusEmojis.active} ${status}
                </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.total_audio_count || 0}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.last_sync ? formatDate(device.last_sync) : '<span class="text-gray-400">未同期</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(device.registered_at)}</td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewDeviceDetails('${device.device_id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="詳細表示">👁️</button>
                <button onclick="generateDeviceQR('${device.device_id}')" class="text-purple-600 hover:text-purple-900 mr-2" title="QR生成">📱</button>
                <button onclick="syncDevice('${device.device_id}')" class="text-green-600 hover:text-green-900 mr-2" title="同期">🔄</button>
                <button onclick="deleteDevice('${device.device_id}')" class="text-red-600 hover:text-red-900" title="削除">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderViewerLinksTable() {
    const tbody = document.getElementById('viewer-links-table-body');
    tbody.innerHTML = '';
    
    if (currentViewerLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">ViewerLinkがありません</td></tr>';
        return;
    }
    
    currentViewerLinks.forEach(link => {
        // アクティブ状態の計算
        const now = new Date();
        const startTime = link.start_time ? new Date(link.start_time) : null;
        const endTime = link.end_time ? new Date(link.end_time) : null;
        const isActive = startTime && endTime && startTime <= now && now <= endTime;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900" title="${link.viewer_link_id}">${link.viewer_link_id.substring(0, 8)}...</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title="${link.user_id || ''}">${link.user_id ? link.user_id.substring(0, 8) + '...' : '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title="${link.device_id || ''}">${link.device_id ? link.device_id.substring(0, 8) + '...' : '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title="${link.owner_user_id || ''}">${link.owner_user_id ? link.owner_user_id.substring(0, 8) + '...' : '<span class="text-gray-400">未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${!link.start_time ? 'text-red-500 font-medium' : ''}">${link.start_time ? formatDate(link.start_time) : '<span class="text-red-500">⚠️ 未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${!link.end_time ? 'text-red-500 font-medium' : ''}">${link.end_time ? formatDate(link.end_time) : '<span class="text-red-500">⚠️ 未設定</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${isActive ? '🟢 true' : '⚪ false'}</span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewViewerLinkDetails('${link.viewer_link_id}')" class="text-blue-600 hover:text-blue-900 mr-2" title="詳細表示">👁️</button>
                <button onclick="generateLinkQR('${link.device_id}')" class="text-purple-600 hover:text-purple-900 mr-2" title="QR生成">📱</button>
                <button onclick="deleteViewerLink('${link.viewer_link_id}')" class="text-red-600 hover:text-red-900" title="削除">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// =============================================================================
// モーダル表示関数群
// =============================================================================

function showAddUserModal() {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">ユーザー追加</h3>
        </div>
        <form id="add-user-form">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">名前</label>
                <input type="text" id="user-name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">メールアドレス</label>
                <input type="email" id="user-email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    キャンセル
                </button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    追加
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
    modalOverlay.classList.remove('hidden');
}

function showAddDeviceModal() {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">デバイス追加</h3>
        </div>
        <form id="add-device-form">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">デバイスタイプ</label>
                <select id="device-type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">タイプを選択</option>
                    <option value="iPhone">iPhone</option>
                    <option value="Android">Android</option>
                    <option value="iPad">iPad</option>
                    <option value="PC">PC</option>
                    <option value="その他">その他</option>
                </select>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    キャンセル
                </button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    追加
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('add-device-form').addEventListener('submit', handleAddDevice);
    modalOverlay.classList.remove('hidden');
}

function showAddViewerLinkModal() {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">ViewerLink追加</h3>
            <p class="text-sm text-gray-500 mt-1">ユーザーとデバイスを関連付けます</p>
        </div>
        <form id="add-viewer-link-form">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">ユーザー</label>
                <select id="viewer-link-user-id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">ユーザーを選択</option>
                    ${currentUsers.map(user => `<option value="${user.user_id}">${user.name} (${user.email})</option>`).join('')}
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">デバイス</label>
                <select id="viewer-link-device-id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">デバイスを選択</option>
                    ${currentDevices.map(device => `<option value="${device.device_id}">${device.device_type} (${device.device_id.substring(0, 8)}...)</option>`).join('')}
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">開始時間 <span class="text-red-500">*</span></label>
                <input type="datetime-local" id="viewer-link-start-time" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <p class="text-xs text-amber-600 mt-1">⚠️ WatchMe要件: 開始時間は必須です</p>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">終了時間 <span class="text-red-500">*</span></label>
                <input type="datetime-local" id="viewer-link-end-time" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <p class="text-xs text-amber-600 mt-1">⚠️ WatchMe要件: 終了時間は必須です</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    キャンセル
                </button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    追加
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('add-viewer-link-form').addEventListener('submit', handleAddViewerLink);
    modalOverlay.classList.remove('hidden');
}

// =============================================================================
// フォーム処理関数群
// =============================================================================

async function handleAddUser(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value
    };
    
    try {
        await axios.post('/api/users', userData);
        closeModal();
        await loadUsers();
        await loadStats();
        showNotification('ユーザーが正常に追加されました', 'success');
    } catch (error) {
        console.error('ユーザー追加エラー:', error);
        showNotification('ユーザーの追加に失敗しました', 'error');
    }
}

async function handleAddDevice(e) {
    e.preventDefault();
    
    const deviceData = {
        device_type: document.getElementById('device-type').value
    };
    
    try {
        await axios.post('/api/devices', deviceData);
        closeModal();
        await loadDevices();
        await loadStats();
        showNotification('デバイスが正常に追加されました', 'success');
    } catch (error) {
        console.error('デバイス追加エラー:', error);
        showNotification('デバイスの追加に失敗しました', 'error');
    }
}

async function handleAddViewerLink(e) {
    e.preventDefault();
    
    const startTime = document.getElementById('viewer-link-start-time').value;
    const endTime = document.getElementById('viewer-link-end-time').value;
    
    // WatchMe要件: start_time, end_timeは必須
    if (!startTime || !endTime) {
        showNotification('開始時間と終了時間は必須です', 'error');
        return;
    }
    
    // 開始時間が終了時間より前であることを確認
    if (new Date(startTime) >= new Date(endTime)) {
        showNotification('開始時間は終了時間より前に設定してください', 'error');
        return;
    }
    
    const viewerLinkData = {
        user_id: document.getElementById('viewer-link-user-id').value,
        device_id: document.getElementById('viewer-link-device-id').value,
        start_time: startTime,
        end_time: endTime
    };
    
    try {
        await axios.post('/api/viewer-links', viewerLinkData);
        closeModal();
        await loadViewerLinks();
        await loadStats();
        showNotification('ViewerLinkが正常に追加されました', 'success');
    } catch (error) {
        console.error('ViewerLink追加エラー:', error);
        showNotification('ViewerLinkの追加に失敗しました', 'error');
    }
}

// =============================================================================
// その他の操作関数
// =============================================================================

function closeModal() {
    modalOverlay.classList.add('hidden');
    modalContent.innerHTML = '';
}

function viewUserLinks(userId) {
    switchTab('viewer-links');
    // TODO: ユーザーでフィルタする機能を追加
    showNotification(`ユーザー ${userId.substring(0, 8)}... のリンクを表示中`, 'info');
}

async function deleteUser(userId) {
    if (confirm('このユーザーを削除してもよろしいですか？')) {
        showNotification('ユーザー削除機能は実装中です', 'info');
    }
}

async function deleteDevice(deviceId) {
    if (confirm('このデバイスを削除してもよろしいですか？')) {
        showNotification('デバイス削除機能は実装中です', 'info');
    }
}

async function deleteViewerLink(linkId) {
    if (confirm('このViewerLinkを削除してもよろしいですか？')) {
        try {
            await axios.delete(`/api/viewer-links/${linkId}`);
            await loadViewerLinks();
            await loadStats();
            showNotification('ViewerLinkが正常に削除されました', 'success');
        } catch (error) {
            console.error('ViewerLink削除エラー:', error);
            showNotification('ViewerLinkの削除に失敗しました', 'error');
        }
    }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `mb-4 px-4 py-3 rounded-md ${
        type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 
        type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 
        type === 'warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
        'bg-blue-100 text-blue-700 border border-blue-200'
    }`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// =============================================================================
// WatchMe新機能: 自分のデバイス一覧管理
// =============================================================================

function initializeDefaultUserSession() {
    // デフォルトユーザーIDを設定（実際のアプリではログイン機能から取得）
    const userIdInput = document.getElementById('user-id-input');
    if (userIdInput && currentUsers.length > 0) {
        currentUserId = currentUsers[0].user_id;
        userIdInput.value = currentUserId;
    }
}

async function refreshMyDevices() {
    const userIdInput = document.getElementById('user-id-input');
    const userId = userIdInput.value.trim();
    
    if (!userId) {
        showNotification('ユーザーIDを入力してください', 'warning');
        return;
    }
    
    try {
        const response = await axios.get(`/api/my-devices?user_id=${userId}`);
        currentMyDevices = response.data;
        currentUserId = userId;
        renderMyDevicesGrid();
        updateGraphDeviceSelect();
        showNotification(`${currentMyDevices.length} 個のデバイスが見つかりました`, 'success');
    } catch (error) {
        console.error('自分のデバイス取得エラー:', error);
        showNotification('デバイス一覧の取得に失敗しました', 'error');
        currentMyDevices = [];
        renderMyDevicesGrid();
    }
}

function renderMyDevicesGrid() {
    const grid = document.getElementById('my-devices-grid');
    grid.innerHTML = '';
    
    if (currentMyDevices.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-400 text-6xl mb-4">📱</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">デバイスが見つかりません</h3>
                <p class="text-gray-500">ユーザーIDを確認するか、ViewerLinkを作成してください</p>
            </div>
        `;
        return;
    }
    
    currentMyDevices.forEach(device => {
        const card = document.createElement('div');
        card.className = `bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${device.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'}`;
        
        const statusIcon = device.is_active ? '🟢' : '⚪';
        const statusText = device.is_active ? 'アクティブ' : '非アクティブ';
        const statusColor = device.is_active ? 'text-green-600' : 'text-gray-500';
        
        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                    <div class="text-2xl mr-3">🎤</div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">${device.device_type}</h3>
                        <p class="text-sm text-gray-500">${device.device_id.substring(0, 8)}...</p>
                    </div>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${device.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${statusIcon} ${statusText}
                </span>
            </div>
            
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">音声データ数:</span>
                    <span class="font-medium">${device.total_audio_count} 件</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">最終同期:</span>
                    <span class="font-medium">${device.last_sync ? formatDate(device.last_sync) : '未同期'}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">閲覧期間:</span>
                    <span class="font-medium text-xs">${formatDate(device.start_time)} 〜 ${formatDate(device.end_time)}</span>
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button onclick="viewDeviceGraphs('${device.device_id}')" 
                        class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 ${!device.is_active ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${!device.is_active ? 'disabled' : ''}>
                    📊 グラフ表示
                </button>
                <button onclick="generateDeviceQR('${device.device_id}')" 
                        class="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    📱 QR
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function updateGraphDeviceSelect() {
    const select = document.getElementById('graph-device-select');
    select.innerHTML = '<option value="">デバイス選択</option>';
    
    currentMyDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.device_id;
        option.textContent = `${device.device_type} (${device.device_id.substring(0, 8)}...)`;
        if (device.is_active) {
            option.textContent += ' ✓';
        }
        select.appendChild(option);
    });
}

function viewDeviceGraphs(deviceId) {
    switchTab('graphs');
    const select = document.getElementById('graph-device-select');
    select.value = deviceId;
    
    // デフォルトの時間範囲を設定（過去24時間）
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    document.getElementById('graph-end-time').value = now.toISOString().slice(0, 16);
    document.getElementById('graph-start-time').value = yesterday.toISOString().slice(0, 16);
    
    showNotification(`デバイス ${deviceId.substring(0, 8)}... のグラフ表示画面に移動しました`, 'info');
}

// =============================================================================
// WatchMe新機能: グラフ表示機能
// =============================================================================

async function loadGraphData() {
    const deviceId = document.getElementById('graph-device-select').value;
    const graphType = document.getElementById('graph-type-select').value;
    const startTime = document.getElementById('graph-start-time').value;
    const endTime = document.getElementById('graph-end-time').value;
    
    if (!deviceId) {
        showNotification('デバイスを選択してください', 'warning');
        return;
    }
    
    if (!startTime || !endTime) {
        showNotification('開始時間と終了時間を設定してください', 'warning');
        return;
    }
    
    try {
        const response = await axios.get(`/api/devices/${deviceId}/graphs`, {
            params: {
                start_time: startTime,
                end_time: endTime,
                graph_type: graphType
            }
        });
        
        const graphData = response.data;
        renderMainGraph(graphData);
        updateGraphSummary(graphData);
        showNotification('グラフデータを読み込みました', 'success');
    } catch (error) {
        console.error('グラフデータ取得エラー:', error);
        showNotification('グラフデータの取得に失敗しました', 'error');
        renderEmptyGraph();
    }
}

function renderMainGraph(graphData) {
    const canvas = document.getElementById('main-graph-canvas');
    const ctx = canvas.getContext('2d');
    
    // 既存のチャートを破棄
    if (mainChart) {
        mainChart.destroy();
    }
    
    // サンプルデータ（実際のAPIからのデータが空の場合）
    const sampleData = generateSampleGraphData(graphData.graph_type || 'emotion');
    
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampleData.labels,
            datasets: [{
                label: getGraphTypeLabel(graphData.graph_type || 'emotion'),
                data: sampleData.data,
                borderColor: getGraphTypeColor(graphData.graph_type || 'emotion'),
                backgroundColor: getGraphTypeColor(graphData.graph_type || 'emotion', 0.1),
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${getGraphTypeLabel(graphData.graph_type || 'emotion')} - ${formatDate(graphData.time_range_start)} 〜 ${formatDate(graphData.time_range_end)}`
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'スコア (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '時間'
                    }
                }
            }
        }
    });
}

function generateSampleGraphData(graphType) {
    const now = new Date();
    const labels = [];
    const data = [];
    
    // 過去24時間のサンプルデータを生成
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
        
        // グラフタイプに応じたサンプルデータ
        let value;
        switch (graphType) {
            case 'emotion':
                value = 60 + Math.sin(i * 0.5) * 20 + Math.random() * 10;
                break;
            case 'behavior':
                value = 40 + Math.cos(i * 0.3) * 25 + Math.random() * 15;
                break;
            case 'psychology':
                value = 70 + Math.sin(i * 0.2) * 15 + Math.random() * 8;
                break;
            default:
                value = 50 + Math.random() * 30;
        }
        data.push(Math.max(0, Math.min(100, value)));
    }
    
    return { labels, data };
}

function getGraphTypeLabel(graphType) {
    const labels = {
        'emotion': '😊 感情スコア',
        'behavior': '🚶 行動パターン',
        'psychology': '🧠 心理状態'
    };
    return labels[graphType] || '📊 分析データ';
}

function getGraphTypeColor(graphType, alpha = 1) {
    const colors = {
        'emotion': `rgba(59, 130, 246, ${alpha})`, // blue
        'behavior': `rgba(16, 185, 129, ${alpha})`, // green  
        'psychology': `rgba(139, 92, 246, ${alpha})` // purple
    };
    return colors[graphType] || `rgba(107, 114, 128, ${alpha})`;
}

function updateGraphSummary(graphData) {
    const summaryDiv = document.getElementById('graph-summary');
    const graphType = graphData.graph_type || 'emotion';
    const deviceType = graphData.device_type || 'Unknown';
    
    summaryDiv.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between">
                <span class="text-gray-600">デバイス:</span>
                <span class="font-medium">🎤 ${deviceType}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">分析タイプ:</span>
                <span class="font-medium">${getGraphTypeLabel(graphType)}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">データ期間:</span>
                <span class="font-medium text-xs">${formatDate(graphData.time_range_start)} 〜 ${formatDate(graphData.time_range_end)}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">グラフ数:</span>
                <span class="font-medium">${graphData.graphs?.length || 0} 個</span>
            </div>
            <div class="mt-4 p-3 bg-blue-50 rounded-md">
                <p class="text-sm text-blue-700">
                    <strong>📍 注意:</strong> 実際の音声データ解析機能は実装中です。現在はサンプルデータを表示しています。
                </p>
            </div>
        </div>
    `;
}

function renderEmptyGraph() {
    const summaryDiv = document.getElementById('graph-summary');
    summaryDiv.innerHTML = `
        <div class="text-center py-8">
            <div class="text-gray-400 text-4xl mb-4">📊</div>
            <p class="text-gray-500">グラフデータがありません</p>
            <p class="text-sm text-gray-400 mt-2">デバイスと時間範囲を選択してください</p>
        </div>
    `;
    
    if (mainChart) {
        mainChart.destroy();
        mainChart = null;
    }
}

// =============================================================================
// WatchMe新機能: QRコード・デバイス操作
// =============================================================================

async function generateDeviceQR(deviceId) {
    try {
        const response = await axios.get(`/api/devices/${deviceId}/qr`);
        const qrData = response.data;
        
        showQRModal(qrData);
        showNotification('QRコードを生成しました', 'success');
    } catch (error) {
        console.error('QRコード生成エラー:', error);
        showNotification('QRコードの生成に失敗しました', 'error');
    }
}

async function generateLinkQR(deviceId) {
    // ViewerLink用のQRコード生成（generateDeviceQRと同じ処理）
    await generateDeviceQR(deviceId);
}

function showQRModal(qrData) {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">📱 デバイスQRコード</h3>
            <p class="text-sm text-gray-500 mt-1">デバイス: ${qrData.device_id.substring(0, 8)}...</p>
        </div>
        <div class="text-center mb-4">
            <canvas id="qr-canvas" class="mx-auto border rounded-lg"></canvas>
        </div>
        <div class="text-center mb-4">
            <p class="text-xs text-gray-500">QRコードデータ: ${qrData.qr_code_data.substring(0, 20)}...</p>
            <p class="text-xs text-gray-400 mt-1">有効期限: ${qrData.expires_at ? formatDate(qrData.expires_at) : '無期限'}</p>
        </div>
        <div class="flex justify-end">
            <button onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                閉じる
            </button>
        </div>
    `;
    
    // QRコードを生成
    const canvas = document.getElementById('qr-canvas');
    QRCode.toCanvas(canvas, qrData.qr_code_data, {
        width: 200,
        margin: 2,
        color: {
            dark: '#1f2937',
            light: '#ffffff'
        }
    }, function (error) {
        if (error) {
            console.error('QRコード描画エラー:', error);
            canvas.innerHTML = '<p class="text-red-500">QRコードの表示に失敗しました</p>';
        }
    });
    
    modalOverlay.classList.remove('hidden');
}

async function syncDevice(deviceId) {
    try {
        const response = await axios.put(`/api/devices/${deviceId}/sync`);
        await loadDevices(); // デバイス一覧を再読み込み
        await loadStats(); // 統計情報を更新
        showNotification('デバイスの同期が完了しました', 'success');
    } catch (error) {
        console.error('デバイス同期エラー:', error);
        showNotification('デバイスの同期に失敗しました', 'error');
    }
}

// =============================================================================
// ユーザー管理用ヘルパー関数
// =============================================================================

function getStatusColor(status) {
    switch (status) {
        case 'guest':
            return 'bg-gray-100 text-gray-800';
        case 'member':
            return 'bg-blue-100 text-blue-800';
        case 'subscriber':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'guest':
            return '👤 ゲスト';
        case 'member':
            return '👥 会員';
        case 'subscriber':
            return '⭐ サブスクライバー';
        default:
            return status;
    }
}

function getPlanLabel(plan) {
    switch (plan) {
        case 'basic':
            return '🟢 ベーシック';
        case 'premium':
            return '🟡 プレミアム';
        case 'enterprise':
            return '🔴 エンタープライズ';
        default:
            return plan;
    }
}

// ユーザー詳細表示
function viewUserDetails(userId) {
    const user = currentUsers.find(u => u.user_id === userId);
    if (!user) {
        showNotification('ユーザーが見つかりません', 'error');
        return;
    }
    
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">👤 ユーザー詳細</h3>
        </div>
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">ユーザーID</label>
                    <div class="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">${user.user_id}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">名前</label>
                    <div class="mt-1 text-sm text-gray-900">${user.name || '未設定'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">メールアドレス</label>
                    <div class="mt-1 text-sm text-gray-900">${user.email || '未設定'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">ステータス</label>
                    <div class="mt-1">${getStatusLabel(user.status)}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">サブスクリプションプラン</label>
                    <div class="mt-1">${user.subscription_plan ? getPlanLabel(user.subscription_plan) : '未設定'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">ニュースレター購読</label>
                    <div class="mt-1">${user.newsletter_subscription ? '✓ 購読中' : '購読なし'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">登録日時</label>
                    <div class="mt-1 text-sm text-gray-900">${formatDate(user.created_at)}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">更新日時</label>
                    <div class="mt-1 text-sm text-gray-900">${user.updated_at ? formatDate(user.updated_at) : '未更新'}</div>
                </div>
            </div>
        </div>
        <div class="flex justify-end mt-6 space-x-3">
            <button onclick="editUser('${user.user_id}')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                編集
            </button>
            <button onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                閉じる
            </button>
        </div>
    `;
    
    modalOverlay.classList.remove('hidden');
}

// ユーザー編集（プレースホルダー）
function editUser(userId) {
    showNotification('ユーザー編集機能は今後実装予定です', 'info');
    closeModal();
}

// デバッグ用
console.log('WatchMe 音声データ心理分析システム JavaScript 読み込み完了');