/**
 * WatchMe Admin - デバイス管理モジュール
 * デバイスの一覧表示、作成、編集、ステータス管理機能を提供
 */

// =============================================================================
// デバイス管理メイン機能
// =============================================================================

async function loadDevices(page = 1) {
    const admin = window.WatchMeAdmin;
    try {
        console.log('デバイスAPI呼び出し開始');
        const response = await axios.get(`/api/devices?page=${page}&per_page=${admin.devicePagination.per_page}`);
        const data = response.data;
        console.log('デバイスAPIレスポンス:', data);
        
        admin.currentDevices = data.items;
        admin.devicePagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderDevicesTable();
        renderDevicesPagination();
        console.log(`デバイス ${admin.currentDevices.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('デバイス読み込みエラー詳細:', error);
        console.error('エラーレスポンス:', error.response?.data);
        console.error('エラーステータス:', error.response?.status);
        showNotification('デバイスの読み込みに失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

function renderDevicesTable() {
    const admin = window.WatchMeAdmin;
    const tbody = document.getElementById('devices-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (admin.currentDevices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-gray-500">デバイスがありません</td></tr>';
        return;
    }
    
    admin.currentDevices.forEach(device => {
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
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                <button onclick="copyToClipboard('${device.device_id}')" 
                        class="text-blue-600 hover:text-blue-900 font-mono text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        title="クリックでコピー">
                    ${device.device_id.substring(0, 8)}...
                </button>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.device_type || '-'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                ${device.owner_user_id ? 
                    `<button onclick="copyToClipboard('${device.owner_user_id}')" 
                             class="text-blue-600 hover:text-blue-900 font-mono text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                             title="クリックでコピー">
                        ${device.owner_user_id.substring(0, 8)}...
                     </button>` : 
                    '<span class="text-gray-400">未設定</span>'}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.platform_type || '<span class="text-gray-400">-</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${device.platform_identifier || '<span class="text-gray-400">-</span>'}</td>
            <td class="px-4 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors['active']}">
                    ${statusEmojis[status] || statusEmojis['active']} ${getStatusLabel(status)}
                </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(device.registered_at)}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(device.last_sync)}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${device.total_audio_count || 0}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editDevice('${device.device_id}')" class="text-blue-600 hover:text-blue-900 mr-3">編集</button>
                <button onclick="syncDevice('${device.device_id}')" class="text-green-600 hover:text-green-900 mr-3">同期</button>
                <button onclick="deleteDevice('${device.device_id}')" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderDevicesPagination() {
    const admin = window.WatchMeAdmin;
    renderPagination('devices-pagination', admin.devicePagination, 'loadDevices');
}

// =============================================================================
// デバイス作成・編集・削除
// =============================================================================

function showAddDeviceModal() {
    const content = `
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
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">ステータス</label>
                <select id="device-status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="active">アクティブ</option>
                    <option value="inactive">非アクティブ</option>
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
    
    showModal('デバイス追加', content);
    
    // フォーム送信イベント
    document.getElementById('add-device-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const deviceData = {
            device_type: document.getElementById('device-type').value,
            status: document.getElementById('device-status').value
        };
        
        try {
            await axios.post('/api/devices', deviceData);
            showNotification('デバイスを追加しました', 'success');
            closeModal();
            loadDevices(); // ページをリロード
            loadStats(); // 統計を更新
        } catch (error) {
            console.error('デバイス追加エラー:', error);
            showNotification('デバイスの追加に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
        }
    });
}

async function editDevice(deviceId) {
    const admin = window.WatchMeAdmin;
    const device = admin.currentDevices.find(d => d.device_id === deviceId);
    if (!device) {
        showNotification('デバイスが見つかりません', 'error');
        return;
    }
    
    const content = `
        <form id="edit-device-form">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">デバイスタイプ</label>
                <select id="edit-device-type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="iPhone" ${device.device_type === 'iPhone' ? 'selected' : ''}>iPhone</option>
                    <option value="Android" ${device.device_type === 'Android' ? 'selected' : ''}>Android</option>
                    <option value="iPad" ${device.device_type === 'iPad' ? 'selected' : ''}>iPad</option>
                    <option value="PC" ${device.device_type === 'PC' ? 'selected' : ''}>PC</option>
                    <option value="その他" ${device.device_type === 'その他' ? 'selected' : ''}>その他</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">ステータス</label>
                <select id="edit-device-status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="active" ${device.status === 'active' ? 'selected' : ''}>アクティブ</option>
                    <option value="inactive" ${device.status === 'inactive' ? 'selected' : ''}>非アクティブ</option>
                    <option value="syncing" ${device.status === 'syncing' ? 'selected' : ''}>同期中</option>
                    <option value="error" ${device.status === 'error' ? 'selected' : ''}>エラー</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">音声データ数</label>
                <input type="number" id="edit-audio-count" value="${device.total_audio_count || 0}" min="0" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    キャンセル
                </button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    更新
                </button>
            </div>
        </form>
    `;
    
    showModal('デバイス編集', content);
    
    // フォーム送信イベント
    document.getElementById('edit-device-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const updateData = {
            status: document.getElementById('edit-device-status').value,
            total_audio_count: parseInt(document.getElementById('edit-audio-count').value) || 0
        };
        
        try {
            await axios.put(`/api/devices/${deviceId}`, updateData);
            showNotification('デバイス情報を更新しました', 'success');
            closeModal();
            loadDevices(); // ページをリロード
        } catch (error) {
            console.error('デバイス更新エラー:', error);
            showNotification('デバイス情報の更新に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
        }
    });
}

async function syncDevice(deviceId) {
    try {
        await axios.put(`/api/devices/${deviceId}/sync`);
        showNotification('デバイス同期を完了しました', 'success');
        loadDevices(); // ページをリロード
    } catch (error) {
        console.error('デバイス同期エラー:', error);
        showNotification('デバイス同期に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

async function deleteDevice(deviceId) {
    if (!confirm('このデバイスを削除しますか？この操作は元に戻せません。')) {
        return;
    }
    
    try {
        await axios.delete(`/api/devices/${deviceId}`);
        showNotification('デバイスを削除しました', 'success');
        loadDevices(); // ページをリロード
        loadStats(); // 統計を更新
    } catch (error) {
        console.error('デバイス削除エラー:', error);
        showNotification('デバイスの削除に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

function getStatusLabel(status) {
    switch (status) {
        case 'active': return 'アクティブ';
        case 'inactive': return '非アクティブ';
        case 'syncing': return '同期中';
        case 'error': return 'エラー';
        default: return status || '不明';
    }
}

// =============================================================================
// 初期化とイベントリスナー
// =============================================================================

function initializeDeviceManagement() {
    // デバイス管理ボタンのイベントリスナー設定
    const addDeviceBtn = document.getElementById('add-device-btn');
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', showAddDeviceModal);
    }
    
    console.log('デバイス管理モジュール初期化完了');
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // コアモジュールの初期化を待つ
    const waitForCore = () => {
        if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
            initializeDeviceManagement();
            loadDevices(); // 初回データ読み込み
        } else {
            setTimeout(waitForCore, 50);
        }
    };
    waitForCore();
});