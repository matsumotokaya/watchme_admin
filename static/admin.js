/**
 * WatchMe 音声データ心理分析システム JavaScript
 * WatchMe要件対応: 音声データによる心理・行動・感情の可視化
 */

// グローバル変数
let currentUsers = [];
let currentDevices = [];
let currentNotifications = [];

// ページネーション状態
let userPagination = { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false };
let devicePagination = { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false };
let notificationPagination = { page: 1, per_page: 20, total: 0, total_pages: 1, has_next: false, has_prev: false };

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
    loadNotifications();
    initializeDefaultUserSession();
    initializeWhisperDate();
    initializePromptDate();
    initializeChatGPTDate();
    initializeSEDDate();
    initializeSEDAggregatorDate();
    initializeOpenSMILEDate();
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
    document.getElementById('create-notification-btn').addEventListener('click', showAddNotificationModal);
    document.getElementById('broadcast-notification-btn').addEventListener('click', showBroadcastNotificationModal);
    document.getElementById('refresh-notifications-btn').addEventListener('click', loadNotifications);
    
    
    // Whisper機能のイベントリスナー
    document.getElementById('start-whisper-btn').addEventListener('click', startWhisperProcessing);
    
    // Whisperプロンプト生成機能のイベントリスナー
    document.getElementById('generate-prompt-btn').addEventListener('click', generateWhisperPrompt);
    
    // ChatGPTスコアリング機能のイベントリスナー
    document.getElementById('start-chatgpt-btn').addEventListener('click', startChatGPTAnalysis);
    
    // SED音響イベント検出機能のイベントリスナー
    document.getElementById('start-sed-btn').addEventListener('click', startSEDProcessing);
    
    // SED Aggregator機能のイベントリスナー
    document.getElementById('start-sed-aggregator-btn').addEventListener('click', startSEDAggregatorProcessing);
    
    // OpenSMILE機能のイベントリスナー
    document.getElementById('start-opensmile-btn').addEventListener('click', startOpenSMILEProcessing);
    
    // OpenSMILE Aggregator機能のイベントリスナー
    document.getElementById('start-aggregator-btn').addEventListener('click', startOpenSMILEAggregator);
    
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
            // loadAuthUsers(), - 削除済み（権限エラーのため）
            loadUsers(),
            loadDevices()
        ]);
        console.log('全データ読み込み完了');
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

// async function loadAuthUsers() - 削除済み（権限エラーのため）
// auth.usersテーブルは管理者権限でしかアクセスできないため削除

async function loadUsers(page = 1) {
    try {
        const response = await axios.get(`/api/users?page=${page}&per_page=${userPagination.per_page}`);
        const data = response.data;
        
        currentUsers = data.items;
        userPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderUsersTable();
        renderUsersPagination();
        console.log(`ユーザー ${currentUsers.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
        showNotification('ユーザーの読み込みに失敗しました', 'error');
    }
}

async function loadDevices(page = 1) {
    try {
        console.log('デバイスAPI呼び出し開始');
        const response = await axios.get(`/api/devices?page=${page}&per_page=${devicePagination.per_page}`);
        const data = response.data;
        console.log('デバイスAPIレスポンス:', data);
        
        currentDevices = data.items;
        devicePagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderDevicesTable();
        renderDevicesPagination();
        console.log(`デバイス ${currentDevices.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('デバイス読み込みエラー詳細:', error);
        console.error('エラーレスポンス:', error.response?.data);
        console.error('エラーステータス:', error.response?.status);
        showNotification('デバイスの読み込みに失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}


async function loadStats() {
    try {
        const response = await axios.get('/api/stats');
        const stats = response.data;
        document.getElementById('stats-display').textContent = 
            `ユーザー: ${stats.users_count} | デバイス: ${stats.devices_count}`;
    } catch (error) {
        console.error('統計読み込みエラー:', error);
        document.getElementById('stats-display').textContent = '統計情報取得失敗';
    }
}

// =============================================================================
// テーブル描画関数群
// =============================================================================

// function renderAuthUsersTable() - 削除済み（権限エラーのため）
// auth.usersテーブルは管理者権限でしかアクセスできないため削除

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
            <td class="px-4 py-4 text-sm font-mono text-gray-900 break-all select-all cursor-pointer" title="クリックでコピー" onclick="copyToClipboard('${user.user_id}')">${user.user_id}</td>
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
            <td class="px-4 py-4 text-sm font-mono text-gray-900 break-all select-all cursor-pointer" title="クリックでコピー" onclick="copyToClipboard('${device.device_id}')">${device.device_id}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.device_type || '-'}</td>
            <td class="px-4 py-4 text-sm font-mono text-gray-500 break-all select-all cursor-pointer" title="${device.owner_user_id ? 'クリックでコピー' : ''}" ${device.owner_user_id ? `onclick="copyToClipboard('${device.owner_user_id}')"` : ''}>${device.owner_user_id || '<span class="text-gray-400">未設定</span>'}</td>
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

// 認証ユーザー詳細表示
function viewAuthUserDetails(authUserId) {
    const authUser = currentAuthUsers.find(u => u.id === authUserId);
    if (!authUser) {
        showNotification('認証ユーザーが見つかりません', 'error');
        return;
    }
    
    const metadata = authUser.raw_user_meta_data || {};
    
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">🔐 認証ユーザー詳細</h3>
        </div>
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">認証ID</label>
                    <div class="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">${authUser.id}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">メールアドレス</label>
                    <div class="mt-1 text-sm text-gray-900">${authUser.email || '未設定'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">作成日時</label>
                    <div class="mt-1 text-sm text-gray-900">${formatDate(authUser.created_at)}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">更新日時</label>
                    <div class="mt-1 text-sm text-gray-900">${authUser.updated_at ? formatDate(authUser.updated_at) : '未更新'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">最終ログイン</label>
                    <div class="mt-1 text-sm text-gray-900">${authUser.last_sign_in_at ? formatDate(authUser.last_sign_in_at) : 'ログイン履歴なし'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">メール確認</label>
                    <div class="mt-1 text-sm text-gray-900">${authUser.email_confirmed_at ? formatDate(authUser.email_confirmed_at) : '未確認'}</div>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">メタデータ</label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    <pre class="whitespace-pre-wrap">${JSON.stringify(metadata, null, 2)}</pre>
                </div>
            </div>
        </div>
        <div class="flex justify-end mt-6 space-x-3">
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

// =============================================================================
// Whisper音声文字起こし機能
// =============================================================================

async function startWhisperProcessing() {
    const deviceId = document.getElementById('whisper-device-id').value.trim();
    const date = document.getElementById('whisper-date').value;
    const model = document.getElementById('whisper-model').value;
    const button = document.getElementById('start-whisper-btn');
    const statusDiv = document.getElementById('whisper-status');
    const resultsDiv = document.getElementById('whisper-results');
    const resultsContent = document.getElementById('whisper-results-content');
    
    // 入力チェック
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    // UUID形式の簡単チェック
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(deviceId)) {
        showNotification('正しいデバイスIDのフォーマットを入力してください', 'error');
        return;
    }
    
    // UI状態更新
    button.disabled = true;
    button.textContent = '処理中...';
    statusDiv.textContent = 'Whisper処理を開始しています...';
    resultsDiv.classList.add('hidden');
    resultsContent.textContent = '';
    
    try {
        // Whisper APIに送信
        const response = await axios.post('http://localhost:8001/fetch-and-transcribe', {
            device_id: deviceId,
            date: date,
            model: model
        });
        
        const result = response.data;
        
        // 結果表示
        statusDiv.textContent = '処理が完了しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = JSON.stringify(result, null, 2);
        
        // 成功通知
        const processedCount = result.summary?.supabase_saved || 0;
        const totalCount = result.summary?.total_time_blocks || 48;
        showNotification(`Whisper処理完了: ${processedCount}/${totalCount} 件の音声データを処理しました`, 'success');
        
    } catch (error) {
        console.error('Whisper処理エラー:', error);
        
        let errorMessage = 'Whisper処理でエラーが発生しました';
        if (error.response?.data?.detail) {
            errorMessage += ': ' + error.response.data.detail;
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        statusDiv.textContent = 'エラーが発生しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = errorMessage;
        
        showNotification(errorMessage, 'error');
    } finally {
        // UI状態復元
        button.disabled = false;
        button.textContent = '🎤 Whisper処理開始';
    }
}

// 日付を今日に設定する初期化関数
function initializeWhisperDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('whisper-date').value = formattedDate;
}

// クリップボードにコピーする関数
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showNotification(`コピーしました: ${text.substring(0, 16)}...`, 'success');
    }).catch(function(err) {
        console.error('コピーに失敗しました:', err);
        showNotification('コピーに失敗しました', 'error');
    });
}

// =============================================================================
// Whisperプロンプト生成機能
// =============================================================================

async function generateWhisperPrompt() {
    const deviceId = document.getElementById('prompt-device-id').value;
    const date = document.getElementById('prompt-date').value;
    const button = document.getElementById('generate-prompt-btn');
    const statusDiv = document.getElementById('prompt-status');
    const resultsDiv = document.getElementById('prompt-results');
    const resultsContent = document.getElementById('prompt-results-content');
    
    // バリデーション
    if (!deviceId) {
        showNotification('デバイスIDを入力してください', 'error');
        return;
    }
    
    if (!date) {
        showNotification('日付を選択してください', 'error');
        return;
    }
    
    // UI状態更新
    button.disabled = true;
    button.textContent = '⏳ 処理中...';
    statusDiv.textContent = 'プロンプト生成APIを呼び出しています...';
    resultsDiv.classList.add('hidden');
    resultsContent.textContent = '';
    
    try {
        // プロンプト生成API呼び出し
        const response = await axios.get('http://localhost:8009/generate-mood-prompt-supabase', {
            params: {
                device_id: deviceId,
                date: date
            },
            timeout: 30000 // 30秒タイムアウト
        });
        
        const result = response.data;
        
        // 結果表示
        statusDiv.textContent = '✅ プロンプト生成完了';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = JSON.stringify(result, null, 2);
        
        // 成功通知
        showNotification(`プロンプト生成完了: ${result.output_path}`, 'success');
        
    } catch (error) {
        console.error('プロンプト生成エラー:', error);
        
        let errorMessage = 'プロンプト生成でエラーが発生しました';
        if (error.response?.data?.detail) {
            errorMessage += ': ' + error.response.data.detail;
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        statusDiv.textContent = 'エラーが発生しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = errorMessage;
        
        showNotification(errorMessage, 'error');
    } finally {
        // UI状態復元
        button.disabled = false;
        button.textContent = '📝 プロンプト生成開始';
    }
}

// 日付を今日に設定する初期化関数（プロンプト生成用）
function initializePromptDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const promptDateElement = document.getElementById('prompt-date');
    if (promptDateElement) {
        promptDateElement.value = formattedDate;
    }
}

// =============================================================================
// ChatGPTスコアリング機能
// =============================================================================

async function startChatGPTAnalysis() {
    const deviceId = document.getElementById('chatgpt-device-id').value;
    const date = document.getElementById('chatgpt-date').value;
    const button = document.getElementById('start-chatgpt-btn');
    const statusDiv = document.getElementById('chatgpt-status');
    const resultsDiv = document.getElementById('chatgpt-results');
    const summaryDiv = document.getElementById('chatgpt-summary');
    const insightsDiv = document.getElementById('chatgpt-insights');
    const resultsContent = document.getElementById('chatgpt-results-content');
    
    // バリデーション
    if (!deviceId) {
        showNotification('デバイスIDを入力してください', 'error');
        return;
    }
    
    if (!date) {
        showNotification('日付を選択してください', 'error');
        return;
    }
    
    // UI状態更新
    button.disabled = true;
    button.textContent = '⏳ 処理中...';
    statusDiv.textContent = 'ChatGPT APIを呼び出しています...';
    resultsDiv.classList.add('hidden');
    summaryDiv.innerHTML = '';
    insightsDiv.innerHTML = '';
    resultsContent.textContent = '';
    
    try {
        // ChatGPT分析API呼び出し
        const response = await axios.post('http://localhost:8002/analyze-vibegraph-supabase', {
            device_id: deviceId,
            date: date
        }, {
            timeout: 60000 // 60秒タイムアウト
        });
        
        const result = response.data;
        
        // 結果表示
        statusDiv.textContent = '✅ ChatGPT分析完了';
        resultsDiv.classList.remove('hidden');
        
        // サマリー表示
        if (result.summary) {
            const summary = result.summary;
            summaryDiv.innerHTML = `
                <h5 class="font-medium text-gray-700 mb-2">📊 スコアサマリー</h5>
                <ul class="list-disc list-inside space-y-1">
                    <li>平均スコア: <span class="font-medium">${summary.average_score}</span></li>
                    <li>ポジティブ時間: <span class="font-medium">${summary.positive_hours}時間</span></li>
                    <li>ネガティブ時間: <span class="font-medium">${summary.negative_hours}時間</span></li>
                    <li>ニュートラル時間: <span class="font-medium">${summary.neutral_hours}時間</span></li>
                </ul>
            `;
            
            // インサイト表示
            if (summary.insights && summary.insights.length > 0) {
                insightsDiv.innerHTML = `
                    <h5 class="font-medium text-gray-700 mb-2">💡 インサイト</h5>
                    <ul class="list-disc list-inside space-y-1">
                        ${summary.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                `;
            }
            
            // 感情変化ポイント表示
            if (summary.vibe_changes && summary.vibe_changes.length > 0) {
                insightsDiv.innerHTML += `
                    <h5 class="font-medium text-gray-700 mb-2 mt-4">🔄 感情変化ポイント</h5>
                    <ul class="list-disc list-inside space-y-1">
                        ${summary.vibe_changes.map(change => 
                            `<li>${change.time}: ${change.event} (スコア: ${change.score})</li>`
                        ).join('')}
                    </ul>
                `;
            }
        }
        
        // 詳細データ表示
        resultsContent.textContent = JSON.stringify(result, null, 2);
        
        // 成功通知
        showNotification(`ChatGPT分析完了: vibe_whisper_summaryテーブルに保存されました`, 'success');
        
    } catch (error) {
        console.error('ChatGPT分析エラー:', error);
        
        let errorMessage = 'ChatGPT分析でエラーが発生しました';
        if (error.response?.data?.detail) {
            errorMessage += ': ' + error.response.data.detail;
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        statusDiv.textContent = 'エラーが発生しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = errorMessage;
        
        showNotification(errorMessage, 'error');
    } finally {
        // UI状態復元
        button.disabled = false;
        button.textContent = '🤖 ChatGPT分析開始';
    }
}

// 日付を今日に設定する初期化関数（ChatGPT用）
function initializeChatGPTDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const chatgptDateElement = document.getElementById('chatgpt-date');
    if (chatgptDateElement) {
        chatgptDateElement.value = formattedDate;
    }
}

// =============================================================================
// SED音響イベント検出機能
// =============================================================================

async function startSEDProcessing() {
    const deviceId = document.getElementById('sed-device-id').value.trim();
    const date = document.getElementById('sed-date').value;
    const threshold = parseFloat(document.getElementById('sed-threshold').value);
    const button = document.getElementById('start-sed-btn');
    const statusDiv = document.getElementById('sed-status');
    const resultsDiv = document.getElementById('sed-results');
    const resultsContent = document.getElementById('sed-results-content');
    
    // 入力チェック
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    // UUID形式の簡単チェック
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(deviceId)) {
        showNotification('正しいデバイスIDのフォーマットを入力してください', 'error');
        return;
    }
    
    // UI状態更新
    button.disabled = true;
    button.textContent = '処理中...';
    statusDiv.textContent = 'SED音響イベント検出を開始しています...';
    resultsDiv.classList.add('hidden');
    resultsContent.textContent = '';
    
    try {
        // SED API (fetch-and-process) に送信
        const response = await axios.post('http://localhost:8004/fetch-and-process', {
            device_id: deviceId,
            date: date,
            threshold: threshold
        }, {
            timeout: 300000 // 5分タイムアウト（処理時間が長いため）
        });
        
        const result = response.data;
        
        // 結果表示
        statusDiv.textContent = '処理が完了しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = JSON.stringify(result, null, 2);
        
        // 成功通知
        const processedCount = result.summary?.supabase_saved || 0;
        const totalCount = result.summary?.total_time_blocks || 48;
        const fetchedCount = result.summary?.audio_fetched || 0;
        
        showNotification(
            `SED処理完了: ${fetchedCount}件の音声ファイル取得、${processedCount}/${totalCount}件のタイムブロックを処理してSupabaseに保存しました`, 
            'success'
        );
        
    } catch (error) {
        console.error('SED処理エラー:', error);
        
        let errorMessage = 'SED音響イベント検出でエラーが発生しました';
        if (error.response?.data?.detail) {
            errorMessage += ': ' + error.response.data.detail;
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        // タイムアウトエラーの特別処理
        if (error.code === 'ECONNABORTED') {
            errorMessage = 'SED処理がタイムアウトしました。処理時間が長いため、バックグラウンドで継続している可能性があります。';
        }
        
        statusDiv.textContent = 'エラーが発生しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = errorMessage;
        
        showNotification(errorMessage, 'error');
    } finally {
        // UI状態復元
        button.disabled = false;
        button.textContent = '🎵 SED処理開始';
    }
}

// 日付を今日に設定する初期化関数（SED用）
function initializeSEDDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const sedDateElement = document.getElementById('sed-date');
    if (sedDateElement) {
        sedDateElement.value = formattedDate;
    }
}

// =============================================================================
// SED Aggregator 行動グラフデータ生成機能
// =============================================================================

async function startSEDAggregatorProcessing() {
    const deviceId = document.getElementById('sed-aggregator-device-id').value.trim();
    const date = document.getElementById('sed-aggregator-date').value;
    const button = document.getElementById('start-sed-aggregator-btn');
    const statusDiv = document.getElementById('sed-aggregator-status');
    const resultsDiv = document.getElementById('sed-aggregator-results');
    const resultsContent = document.getElementById('sed-aggregator-results-content');
    
    // 入力チェック
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    // UUID形式の簡単チェック
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(deviceId)) {
        showNotification('正しいデバイスIDのフォーマットを入力してください', 'error');
        return;
    }
    
    // UI状態更新
    button.disabled = true;
    button.textContent = '処理中...';
    statusDiv.textContent = 'SED Aggregator処理を開始しています...';
    resultsDiv.classList.add('hidden');
    resultsContent.textContent = '';
    
    try {
        // SED Aggregator API に送信
        const response = await axios.post('http://localhost:8010/analysis/sed', {
            device_id: deviceId,
            date: date
        }, {
            timeout: 60000 // 1分タイムアウト
        });
        
        const result = response.data;
        
        // 非同期タスクの場合
        if (result.task_id) {
            statusDiv.textContent = '処理を開始しました。バックグラウンドで実行中です...';
            resultsDiv.classList.remove('hidden');
            resultsContent.textContent = JSON.stringify(result, null, 2);
            
            showNotification(`SED Aggregator処理を開始しました: タスクID ${result.task_id}`, 'info');
            
            // タスクIDを保存して、後でステータス確認できるようにする
            const taskInfo = `タスクID: ${result.task_id}\n` +
                           `デバイスID: ${deviceId}\n` +
                           `日付: ${date}\n` +
                           `ステータス確認URL: http://localhost:8010/analysis/sed/${result.task_id}`;
            resultsContent.textContent = taskInfo;
        } else {
            // 同期処理の結果の場合（既存のコード）
            statusDiv.textContent = '処理が完了しました';
            resultsDiv.classList.remove('hidden');
            resultsContent.textContent = JSON.stringify(result, null, 2);
            
            const savedCount = result.data_saved ? 1 : 0;
            const message = savedCount > 0 
                ? `SED Aggregator処理完了: ${date}の行動グラフデータをSupabaseに保存しました` 
                : `SED Aggregator処理完了: ${date}のデータは既に存在するか、処理対象がありませんでした`;
            
            showNotification(message, savedCount > 0 ? 'success' : 'info');
        }
        
    } catch (error) {
        console.error('SED Aggregator処理エラー:', error);
        
        let errorMessage = 'SED Aggregator処理でエラーが発生しました';
        if (error.response?.data?.detail) {
            errorMessage += ': ' + error.response.data.detail;
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        statusDiv.textContent = 'エラーが発生しました';
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = errorMessage;
        
        showNotification(errorMessage, 'error');
    } finally {
        // UI状態復元
        button.disabled = false;
        button.textContent = '📊 集約処理開始';
    }
}

// 日付を今日に設定する初期化関数（SED Aggregator用）
function initializeSEDAggregatorDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const sedAggregatorDateElement = document.getElementById('sed-aggregator-date');
    if (sedAggregatorDateElement) {
        sedAggregatorDateElement.value = formattedDate;
    }
}

// =============================================================================
// OpenSMILE 音声特徴量抽出機能
// =============================================================================

/**
 * OpenSMILE処理を開始
 */
async function startOpenSMILEProcessing() {
    const deviceId = document.getElementById('opensmile-device-id').value.trim();
    const date = document.getElementById('opensmile-date').value;
    const button = document.getElementById('start-opensmile-btn');
    const statusDiv = document.getElementById('opensmile-status');
    const resultsDiv = document.getElementById('opensmile-results');
    const resultsContent = document.getElementById('opensmile-results-content');
    
    // バリデーション
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    // UUID形式チェック
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
        showNotification('デバイスIDはUUID形式で入力してください', 'error');
        return;
    }
    
    try {
        // UI更新
        button.disabled = true;
        statusDiv.textContent = '処理中...';
        statusDiv.className = 'text-sm text-green-600';
        resultsDiv.classList.add('hidden');
        
        // APIリクエスト
        const response = await axios.post('http://localhost:8011/process/vault-data', {
            device_id: deviceId,
            date: date,
            feature_set: 'eGeMAPSv02'
        }, {
            timeout: 120000  // 2分タイムアウト（OpenSMILEは処理に時間がかかる場合がある）
        });
        
        if (response.data.success) {
            // 成功メッセージ
            const message = response.data.message || 'OpenSMILE処理が完了しました';
            showNotification(message, 'success');
            statusDiv.textContent = '処理完了';
            statusDiv.className = 'text-sm text-green-600';
            
            // 結果表示
            resultsDiv.classList.remove('hidden');
            const resultText = `処理日付: ${date}
デバイスID: ${deviceId}
処理ファイル数: ${response.data.processed_files}
保存ファイル数: ${response.data.saved_files.length}
総処理時間: ${response.data.total_processing_time.toFixed(2)}秒

処理されたスロット:
${response.data.saved_files.map(file => `  - ${file}`).join('\n')}`;
            
            resultsContent.textContent = resultText;
            
            // エラーがあった場合は表示
            const errors = response.data.results.filter(r => r.error);
            if (errors.length > 0) {
                resultsContent.textContent += `\n\nエラー:
${errors.map(e => `  - ${e.slot}: ${e.error}`).join('\n')}`;
            }
        } else {
            throw new Error(response.data.error || 'OpenSMILE処理に失敗しました');
        }
        
    } catch (error) {
        console.error('OpenSMILE処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'OpenSMILE処理中にエラーが発生しました';
        showNotification(errorMessage, 'error');
        statusDiv.textContent = 'エラー';
        statusDiv.className = 'text-sm text-red-600';
        
        // エラー詳細を結果エリアに表示
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = `エラー: ${errorMessage}`;
    } finally {
        button.disabled = false;
    }
}

/**
 * OpenSMILE日付フィールドを今日の日付で初期化
 */
function initializeOpenSMILEDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const opensmileDateElement = document.getElementById('opensmile-date');
    if (opensmileDateElement) {
        opensmileDateElement.value = formattedDate;
    }
    // OpenSMILE Aggregatorの日付も初期化
    const aggregatorDateElement = document.getElementById('aggregator-date');
    if (aggregatorDateElement) {
        aggregatorDateElement.value = formattedDate;
    }
}

// =============================================================================
// OpenSMILE Aggregator 感情集計機能
// =============================================================================

/**
 * OpenSMILE Aggregator処理を開始
 */
async function startOpenSMILEAggregator() {
    const deviceId = document.getElementById('aggregator-device-id').value.trim();
    const date = document.getElementById('aggregator-date').value;
    const button = document.getElementById('start-aggregator-btn');
    const statusDiv = document.getElementById('aggregator-status');
    const resultsDiv = document.getElementById('aggregator-results');
    const resultsContent = document.getElementById('aggregator-results-content');
    
    // バリデーション
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    // UUID形式チェック
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
        showNotification('デバイスIDはUUID形式で入力してください', 'error');
        return;
    }
    
    try {
        // UI更新
        button.disabled = true;
        button.textContent = '処理中...';
        statusDiv.textContent = '感情集計処理を開始しています...';
        statusDiv.className = 'text-sm text-purple-600';
        resultsDiv.classList.add('hidden');
        
        // APIリクエスト（タスクの開始）
        const startResponse = await axios.post('http://localhost:8012/analyze/opensmile-aggregator', {
            device_id: deviceId,
            date: date
        }, {
            timeout: 30000  // 30秒タイムアウト
        });
        
        const taskId = startResponse.data.task_id;
        statusDiv.textContent = `処理中... (タスクID: ${taskId})`;
        
        // タスクの完了を確認（ポーリング）
        let taskComplete = false;
        let taskResult = null;
        let pollCount = 0;
        const maxPolls = 60;  // 最大60回（60秒）
        
        while (!taskComplete && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000));  // 1秒待機
            
            try {
                const statusResponse = await axios.get(`http://localhost:8012/analyze/opensmile-aggregator/${taskId}`);
                taskResult = statusResponse.data;
                
                if (taskResult.status === 'completed') {
                    taskComplete = true;
                } else if (taskResult.status === 'failed') {
                    throw new Error(taskResult.error || '処理に失敗しました');
                } else {
                    statusDiv.textContent = `処理中... (タスクID: ${taskId}, 進行状況: ${taskResult.progress}%)`;
                }
            } catch (error) {
                // タスク状態確認でエラーが発生した場合は続行
                console.warn('タスク状態確認エラー:', error);
            }
            
            pollCount++;
        }
        
        if (!taskComplete) {
            throw new Error('処理がタイムアウトしました。バックグラウンドで処理が継続されている可能性があります。');
        }
        
        // 成功メッセージ
        const hasData = taskResult.result?.has_data;
        const message = taskResult.message || 'OpenSMILE Aggregator処理が完了しました';
        
        if (!hasData) {
            showNotification(message, 'info');
            statusDiv.textContent = 'データなし（空データを保存）';
            statusDiv.className = 'text-sm text-orange-600';
        } else {
            showNotification('OpenSMILE Aggregator処理が完了しました', 'success');
            statusDiv.textContent = '処理完了';
            statusDiv.className = 'text-sm text-green-600';
        }
        
        // 結果表示
        resultsDiv.classList.remove('hidden');
        const processedSlots = taskResult.result?.processed_slots || 0;
        const totalEmotionPoints = taskResult.result?.total_emotion_points || 0;
        const resultText = `処理日付: ${date}
デバイスID: ${deviceId}
データ状態: ${hasData ? 'データあり' : 'データなし'}
処理スロット数: ${processedSlots}/48
総感情ポイント: ${totalEmotionPoints}
ステータス: ${taskResult.status}

結果はemotion_opensmile_summaryテーブルに保存されました。`;
        
        resultsContent.textContent = resultText;
        
    } catch (error) {
        console.error('OpenSMILE Aggregator処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'OpenSMILE Aggregator処理中にエラーが発生しました';
        showNotification(errorMessage, 'error');
        statusDiv.textContent = 'エラー';
        statusDiv.className = 'text-sm text-red-600';
        
        // エラー詳細を結果エリアに表示
        resultsDiv.classList.remove('hidden');
        resultsContent.textContent = `エラー: ${errorMessage}`;
    } finally {
        button.disabled = false;
        button.textContent = '📊 集計処理開始';
    }
}

// =============================================================================
// 通知管理機能
// =============================================================================

/**
 * 通知一覧を読み込み
 */
async function loadNotifications(page = 1) {
    try {
        const response = await axios.get(`/api/notifications?page=${page}&per_page=${notificationPagination.per_page}`);
        const data = response.data;
        
        currentNotifications = data.items;
        notificationPagination = {
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
        console.log(`通知一覧 ${currentNotifications.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('通知一覧の読み込みエラー:', error);
        showNotification('通知一覧の取得に失敗しました', 'error');
    }
}

// =============================================================================
// ページネーション関数
// =============================================================================

function renderUsersPagination() {
    const container = document.getElementById('users-pagination');
    if (!container) return;
    
    const pagination = userPagination;
    container.innerHTML = createPaginationHTML(pagination, 'loadUsers');
}

function renderDevicesPagination() {
    const container = document.getElementById('devices-pagination');
    if (!container) return;
    
    const pagination = devicePagination;
    container.innerHTML = createPaginationHTML(pagination, 'loadDevices');
}

function renderNotificationsPagination() {
    const container = document.getElementById('notifications-pagination');
    if (!container) return;
    
    const pagination = notificationPagination;
    container.innerHTML = createPaginationHTML(pagination, 'loadNotifications');
}

function createPaginationHTML(pagination, loadFunction) {
    if (pagination.total_pages <= 1) return '';
    
    let html = `
        <div class="flex items-center justify-between mt-4">
            <div class="text-sm text-gray-700">
                ${pagination.per_page * (pagination.page - 1) + 1} - ${Math.min(pagination.per_page * pagination.page, pagination.total)} 件 / 全 ${pagination.total} 件
            </div>
            <div class="flex space-x-2">
    `;
    
    // 前へボタン
    if (pagination.has_prev) {
        html += `<button onclick="${loadFunction}(${pagination.page - 1})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">前へ</button>`;
    } else {
        html += `<button disabled class="px-3 py-1 text-sm bg-gray-300 text-gray-500 rounded cursor-not-allowed">前へ</button>`;
    }
    
    // ページ番号
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.page + 2);
    
    for (let page = startPage; page <= endPage; page++) {
        if (page === pagination.page) {
            html += `<button class="px-3 py-1 text-sm bg-blue-600 text-white rounded">${page}</button>`;
        } else {
            html += `<button onclick="${loadFunction}(${page})" class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${page}</button>`;
        }
    }
    
    // 次へボタン
    if (pagination.has_next) {
        html += `<button onclick="${loadFunction}(${pagination.page + 1})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">次へ</button>`;
    } else {
        html += `<button disabled class="px-3 py-1 text-sm bg-gray-300 text-gray-500 rounded cursor-not-allowed">次へ</button>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * 通知統計を更新
 */
async function updateNotificationStats() {
    try {
        const response = await axios.get('/api/notifications/stats');
        const stats = response.data;
        
        // 統計カードを更新
        const totalElement = document.getElementById('total-notifications-count');
        const unreadElement = document.getElementById('unread-notifications-count');
        const readElement = document.getElementById('read-notifications-count');
        const announcementElement = document.getElementById('announcement-notifications-count');
        
        if (totalElement) totalElement.textContent = stats.total_notifications || 0;
        if (unreadElement) unreadElement.textContent = stats.unread_notifications || 0;
        if (readElement) readElement.textContent = stats.read_notifications || 0;
        if (announcementElement) announcementElement.textContent = stats.type_breakdown?.announcement || 0;
        
    } catch (error) {
        console.error('通知統計の取得エラー:', error);
    }
}

/**
 * 通知一覧をレンダリング
 */
function renderNotificationsList() {
    const tableBody = document.getElementById('notifications-table-body');
    
    if (currentNotifications.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <div class="text-gray-400 text-4xl mb-4">🔔</div>
                        <p>通知はまだありません</p>
                        <p class="text-sm text-gray-400 mt-2">通知を作成してユーザーに送信できます</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = currentNotifications.map(notification => {
        const isRead = notification.is_read;
        const createdAt = new Date(notification.created_at).toLocaleString('ja-JP');
        const typeIcons = {
            announcement: '📢',
            event: '📅',
            system: '⚙️'
        };
        
        return `
            <tr class="hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="flex items-center">
                        ${typeIcons[notification.type] || '📋'}
                        <span class="ml-2">${notification.type}</span>
                        ${!isRead ? '<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">未読</span>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="font-medium">${notification.title}</div>
                    <div class="text-gray-500 text-xs mt-1">${notification.message.substring(0, 100)}${notification.message.length > 100 ? '...' : ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    ${notification.user_id.substring(0, 8)}...
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${notification.triggered_by || 'admin'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${createdAt}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewNotificationDetails('${notification.id}')" 
                            class="text-blue-600 hover:text-blue-900 mr-3">詳細</button>
                    <button onclick="deleteNotification('${notification.id}')" 
                            class="text-red-600 hover:text-red-900">削除</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 通知作成モーダルを表示
 */
function showAddNotificationModal() {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">🔔 新しい通知を作成</h3>
        </div>
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
                    <option value="announcement">📢 お知らせ</option>
                    <option value="event">📅 イベント</option>
                    <option value="system">⚙️ システム</option>
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
    
    modalOverlay.classList.remove('hidden');
}

/**
 * 一括通知送信モーダルを表示
 */
function showBroadcastNotificationModal() {
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">📡 一括通知送信</h3>
        </div>
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
                    <option value="announcement">📢 お知らせ</option>
                    <option value="event">📅 イベント</option>
                    <option value="system">⚙️ システム</option>
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
    
    // ラジオボタンの変更監視
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
    
    modalOverlay.classList.remove('hidden');
}

/**
 * 通知を作成
 */
async function createNotification() {
    const userId = document.getElementById('notification-user-id').value.trim();
    const type = document.getElementById('notification-type').value;
    const title = document.getElementById('notification-title').value.trim();
    const message = document.getElementById('notification-message').value.trim();
    const triggeredBy = document.getElementById('notification-triggered-by').value.trim() || 'admin';
    
    if (!userId || !type || !title || !message) {
        showNotification('すべての必須項目を入力してください', 'error');
        return;
    }
    
    // UUID形式チェック
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
        showNotification('正しいユーザーIDのフォーマットを入力してください', 'error');
        return;
    }
    
    try {
        const notificationData = {
            user_id: userId,
            type: type,
            title: title,
            message: message,
            triggered_by: triggeredBy
        };
        
        await axios.post('/api/notifications', notificationData);
        showNotification('通知を作成しました', 'success');
        closeModal();
        loadNotifications();
    } catch (error) {
        console.error('通知作成エラー:', error);
        const errorMessage = error.response?.data?.detail || '通知の作成に失敗しました';
        showNotification(errorMessage, 'error');
    }
}

/**
 * 一括通知を送信
 */
async function sendBroadcastNotification() {
    const target = document.querySelector('input[name="broadcast-target"]:checked').value;
    const type = document.getElementById('broadcast-type').value;
    const title = document.getElementById('broadcast-title').value.trim();
    const message = document.getElementById('broadcast-message').value.trim();
    
    if (!type || !title || !message) {
        showNotification('すべての必須項目を入力してください', 'error');
        return;
    }
    
    let userIds = [];
    
    if (target === 'all') {
        // 全ユーザーのIDを取得
        try {
            const response = await axios.get('/api/users');
            userIds = response.data.map(user => user.user_id);
            
            if (userIds.length === 0) {
                showNotification('送信対象のユーザーがいません', 'error');
                return;
            }
        } catch (error) {
            console.error('ユーザー一覧取得エラー:', error);
            showNotification('ユーザー一覧の取得に失敗しました', 'error');
            return;
        }
    } else {
        // カスタムユーザーID
        const customIds = document.getElementById('broadcast-user-ids').value.trim();
        if (!customIds) {
            showNotification('ユーザーIDを入力してください', 'error');
            return;
        }
        userIds = customIds.split(',').map(id => id.trim()).filter(id => id);
    }
    
    if (userIds.length === 0) {
        showNotification('送信対象のユーザーがいません', 'error');
        return;
    }
    
    // 確認ダイアログ
    if (!confirm(`${userIds.length}人のユーザーに一括通知を送信しますか？`)) {
        return;
    }
    
    try {
        const broadcastData = {
            user_ids: userIds,
            type: type,
            title: title,
            message: message,
            triggered_by: 'admin'
        };
        
        const response = await axios.post('/api/notifications/broadcast', broadcastData);
        const result = response.data;
        
        showNotification(`${result.sent_count}件の通知を送信しました`, 'success');
        closeModal();
        loadNotifications();
    } catch (error) {
        console.error('一括通知送信エラー:', error);
        const errorMessage = error.response?.data?.detail || '一括通知の送信に失敗しました';
        showNotification(errorMessage, 'error');
    }
}

/**
 * 通知詳細を表示
 */
function viewNotificationDetails(notificationId) {
    const notification = currentNotifications.find(n => n.id === notificationId);
    if (!notification) {
        showNotification('通知が見つかりません', 'error');
        return;
    }
    
    const typeIcons = {
        announcement: '📢',
        event: '📅',
        system: '⚙️'
    };
    
    modalContent.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900">🔔 通知詳細</h3>
        </div>
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">通知ID</label>
                    <div class="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">${notification.id}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">タイプ</label>
                    <div class="mt-1 text-sm text-gray-900">${typeIcons[notification.type]} ${notification.type}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">ユーザーID</label>
                    <div class="mt-1 text-sm text-gray-900 font-mono">${notification.user_id}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">送信者</label>
                    <div class="mt-1 text-sm text-gray-900">${notification.triggered_by || 'admin'}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">作成日時</label>
                    <div class="mt-1 text-sm text-gray-900">${new Date(notification.created_at).toLocaleString('ja-JP')}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">既読状態</label>
                    <div class="mt-1 text-sm text-gray-900">
                        ${notification.is_read ? 
                            '<span class="text-green-600">✓ 既読</span>' : 
                            '<span class="text-orange-600">● 未読</span>'
                        }
                    </div>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">タイトル</label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">${notification.title}</div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">メッセージ</label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">${notification.message}</div>
            </div>
            ${notification.metadata ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">メタデータ</label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    <pre class="whitespace-pre-wrap">${JSON.stringify(notification.metadata, null, 2)}</pre>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="flex justify-end mt-6 space-x-3">
            <button onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                閉じる
            </button>
            <button onclick="deleteNotification('${notification.id}'); closeModal();" class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                削除
            </button>
        </div>
    `;
    
    modalOverlay.classList.remove('hidden');
}

/**
 * 通知を削除
 */
async function deleteNotification(notificationId) {
    if (!confirm('この通知を削除しますか？')) {
        return;
    }
    
    try {
        await axios.delete(`/api/notifications/${notificationId}`);
        showNotification('通知を削除しました', 'success');
        loadNotifications();
    } catch (error) {
        console.error('通知削除エラー:', error);
        const errorMessage = error.response?.data?.detail || '通知の削除に失敗しました';
        showNotification(errorMessage, 'error');
    }
}

// デバッグ用
console.log('WatchMe 音声データ心理分析システム JavaScript 読み込み完了');