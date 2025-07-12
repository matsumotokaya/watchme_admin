/**
 * WatchMe Admin - ユーザー管理モジュール
 * ユーザーの一覧表示、作成、編集機能を提供
 */

// =============================================================================
// ユーザー管理メイン機能
// =============================================================================

async function loadUsers(page = 1) {
    const admin = window.WatchMeAdmin;
    try {
        const response = await axios.get(`/api/users?page=${page}&per_page=${admin.userPagination.per_page}`);
        const data = response.data;
        
        admin.currentUsers = data.items;
        admin.userPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderUsersTable();
        renderUsersPagination();
        console.log(`ユーザー ${admin.currentUsers.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
        showNotification('ユーザーの読み込みに失敗しました', 'error');
    }
}

function renderUsersTable() {
    const admin = window.WatchMeAdmin;
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (admin.currentUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-4 text-center text-gray-500">ユーザーがありません</td></tr>';
        return;
    }
    
    admin.currentUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // ステータス表示のスタイリング
        const statusColor = getStatusColor(user.status);
        const statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">${getStatusLabel(user.status)}</span>`;
        
        // プラン表示
        const planDisplay = user.subscription_plan ? 
            `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">${getPlanLabel(user.subscription_plan)}</span>` : 
            '<span class="text-gray-400">-</span>';
        
        row.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-sm">
                <button onclick="copyToClipboard('${user.user_id}')" 
                        class="text-blue-600 hover:text-blue-900 font-mono text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        title="クリックでコピー">
                    ${user.user_id.substring(0, 8)}...
                </button>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${user.name || '<span class="text-gray-400">未設定</span>'}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${user.email || '<span class="text-gray-400">未設定</span>'}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">${planDisplay}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${user.newsletter_subscription ? 
                    '<span class="text-green-600">✓ 購読中</span>' : 
                    '<span class="text-gray-400">未購読</span>'}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(user.created_at)}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(user.updated_at)}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editUser('${user.user_id}')" class="text-blue-600 hover:text-blue-900 mr-3">編集</button>
                <button onclick="deleteUser('${user.user_id}')" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderUsersPagination() {
    const admin = window.WatchMeAdmin;
    renderPagination('users-pagination', admin.userPagination, 'loadUsers');
}

// =============================================================================
// ユーザー作成・編集・削除
// =============================================================================

function showAddUserModal() {
    const content = `
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
    
    showModal('ユーザー追加', content);
    
    // フォーム送信イベント
    document.getElementById('add-user-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value
        };
        
        try {
            await axios.post('/api/users', userData);
            showNotification('ユーザーを追加しました', 'success');
            closeModal();
            loadUsers(); // ページをリロード
            loadStats(); // 統計を更新
        } catch (error) {
            console.error('ユーザー追加エラー:', error);
            showNotification('ユーザーの追加に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
        }
    });
}

async function editUser(userId) {
    const admin = window.WatchMeAdmin;
    const user = admin.currentUsers.find(u => u.user_id === userId);
    if (!user) {
        showNotification('ユーザーが見つかりません', 'error');
        return;
    }
    
    const content = `
        <form id="edit-user-form">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">名前</label>
                <input type="text" id="edit-user-name" value="${user.name || ''}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">メールアドレス</label>
                <input type="email" id="edit-user-email" value="${user.email || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700">ステータス</label>
                <select id="edit-user-status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="guest" ${user.status === 'guest' ? 'selected' : ''}>ゲスト</option>
                    <option value="member" ${user.status === 'member' ? 'selected' : ''}>会員</option>
                    <option value="subscriber" ${user.status === 'subscriber' ? 'selected' : ''}>サブスクライバー</option>
                </select>
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
    
    showModal('ユーザー編集', content);
    
    // フォーム送信イベント
    document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const updateData = {
            name: document.getElementById('edit-user-name').value,
            email: document.getElementById('edit-user-email').value,
            status: document.getElementById('edit-user-status').value
        };
        
        try {
            await axios.put(`/api/users/${userId}`, updateData);
            showNotification('ユーザー情報を更新しました', 'success');
            closeModal();
            loadUsers(); // ページをリロード
        } catch (error) {
            console.error('ユーザー更新エラー:', error);
            showNotification('ユーザー情報の更新に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
        }
    });
}

async function deleteUser(userId) {
    if (!confirm('このユーザーを削除しますか？この操作は元に戻せません。')) {
        return;
    }
    
    try {
        await axios.delete(`/api/users/${userId}`);
        showNotification('ユーザーを削除しました', 'success');
        loadUsers(); // ページをリロード
        loadStats(); // 統計を更新
    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        showNotification('ユーザーの削除に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

function getStatusColor(status) {
    switch (status) {
        case 'guest': return 'bg-gray-100 text-gray-800';
        case 'member': return 'bg-blue-100 text-blue-800';
        case 'subscriber': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'guest': return 'ゲスト';
        case 'member': return '会員';
        case 'subscriber': return 'サブスクライバー';
        default: return status || '不明';
    }
}

function getPlanLabel(plan) {
    switch (plan) {
        case 'basic': return 'ベーシック';
        case 'premium': return 'プレミアム';
        case 'enterprise': return 'エンタープライズ';
        default: return plan || '不明';
    }
}

// =============================================================================
// 初期化とイベントリスナー
// =============================================================================

function initializeUserManagement() {
    // ユーザー管理ボタンのイベントリスナー設定
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    console.log('ユーザー管理モジュール初期化完了');
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // コアモジュールの初期化を待つ
    const waitForCore = () => {
        if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
            initializeUserManagement();
            loadUsers(); // 初回データ読み込み
        } else {
            setTimeout(waitForCore, 50);
        }
    };
    waitForCore();
});