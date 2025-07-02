/**
 * WatchMe 管理画面 (修正版) JavaScript
 * 実際のSupabaseデータ構造に基づく正しい実装
 */

// グローバル変数
let currentUsers = [];
let currentDevices = [];
let currentViewerLinks = [];

// DOM要素の取得
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const notificationArea = document.getElementById('notification-area');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('WatchMe Admin Fixed - 初期化開始');
    setupTabs();
    setupEventListeners();
    loadAllData();
    loadStats();
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
        const response = await axios.get('/api/devices');
        currentDevices = response.data;
        renderDevicesTable();
        console.log(`デバイス ${currentDevices.length} 件読み込み完了`);
    } catch (error) {
        console.error('デバイス読み込みエラー:', error);
        showNotification('デバイスの読み込みに失敗しました', 'error');
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
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">ユーザーがありません</td></tr>';
        return;
    }
    
    currentUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">${user.user_id.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.created_at)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewUserLinks('${user.user_id}')" class="text-blue-600 hover:text-blue-900 mr-3">リンク表示</button>
                <button onclick="deleteUser('${user.user_id}')" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDevicesTable() {
    const tbody = document.getElementById('devices-table-body');
    tbody.innerHTML = '';
    
    if (currentDevices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">デバイスがありません</td></tr>';
        return;
    }
    
    currentDevices.forEach(device => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">${device.device_id.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${device.device_type}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(device.registered_at)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deleteDevice('${device.device_id}')" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderViewerLinksTable() {
    const tbody = document.getElementById('viewer-links-table-body');
    tbody.innerHTML = '';
    
    if (currentViewerLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">ViewerLinkがありません</td></tr>';
        return;
    }
    
    currentViewerLinks.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">${link.viewer_link_id.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${link.user_name}<br><small class="text-gray-400">${link.user_email}</small></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${link.device_type}<br><small class="text-gray-400">${link.device_id.substring(0, 8)}...</small></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${link.start_time ? formatDate(link.start_time) : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${link.end_time ? formatDate(link.end_time) : '進行中'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deleteViewerLink('${link.viewer_link_id}')" class="text-red-600 hover:text-red-900">削除</button>
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
                <label class="block text-sm font-medium text-gray-700">終了時間（オプション）</label>
                <input type="datetime-local" id="viewer-link-end-time" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">空の場合は進行中として作成されます</p>
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
    
    const viewerLinkData = {
        user_id: document.getElementById('viewer-link-user-id').value,
        device_id: document.getElementById('viewer-link-device-id').value,
        end_time: document.getElementById('viewer-link-end-time').value || null
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

// デバッグ用
console.log('WatchMe Admin Fixed JavaScript 読み込み完了');