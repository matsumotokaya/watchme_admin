/**
 * WatchMe Admin - ユーザー管理モジュール (ES Modules版)
 * ユーザーの一覧表示、作成、編集機能を提供
 */

import { state, showNotification, showModal, closeModal, formatDate, copyToClipboard } from './core.js';

// =============================================================================
// ユーザー管理メイン機能
// =============================================================================

async function loadUsers(page = 1) {
    try {
        const response = await axios.get(`/api/users?page=${page}&per_page=${state.userPagination.per_page}`);
        const data = response.data;
        
        state.currentUsers = data.items;
        state.userPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_prev: data.has_prev
        };
        
        renderUsersTable();
        renderUsersPagination();
        console.log(`ユーザー ${state.currentUsers.length}/${data.total} 件読み込み完了 (ページ ${page}/${data.total_pages})`);
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
        showNotification('ユーザーの読み込みに失敗しました', 'error');
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (state.currentUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-4 text-center text-gray-500">ユーザーがありません</td></tr>';
        return;
    }
    
    state.currentUsers.forEach(user => {
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
                <button data-action="edit-user" data-user-id="${user.user_id}" class="text-blue-600 hover:text-blue-900 mr-3">編集</button>
                <button data-action="delete-user" data-user-id="${user.user_id}" class="text-red-600 hover:text-red-900">削除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderUsersPagination() {
    const container = document.getElementById('users-pagination');
    if (!container) return;
    
    let html = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                ${state.userPagination.total}件中 ${((state.userPagination.page - 1) * state.userPagination.per_page) + 1}-${Math.min(state.userPagination.page * state.userPagination.per_page, state.userPagination.total)}件を表示
            </div>
            <div class="flex space-x-2">
    `;
    
    // 前へボタン
    if (state.userPagination.has_prev) {
        html += `<button data-action="load-users" data-page="${state.userPagination.page - 1}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">前へ</button>`;
    } else {
        html += `<button disabled class="px-3 py-1 border border-gray-300 text-gray-400 rounded cursor-not-allowed">前へ</button>`;
    }
    
    // ページ番号
    const startPage = Math.max(1, state.userPagination.page - 2);
    const endPage = Math.min(state.userPagination.total_pages, state.userPagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === state.userPagination.page) {
            html += `<button class="px-3 py-1 bg-blue-600 text-white rounded">${i}</button>`;
        } else {
            html += `<button data-action="load-users" data-page="${i}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">${i}</button>`;
        }
    }
    
    // 次へボタン
    if (state.userPagination.has_next) {
        html += `<button data-action="load-users" data-page="${state.userPagination.page + 1}" class="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">次へ</button>`;
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
                <button type="button" data-action="close-modal" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
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
            // loadStats(); // 統計を更新 - coreモジュールから呼び出すように後で修正
        } catch (error) {
            console.error('ユーザー追加エラー:', error);
            showNotification('ユーザーの追加に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
        }
    });
}

async function editUser(userId) {
    const user = state.currentUsers.find(u => u.user_id === userId);
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
                <button type="button" data-action="close-modal" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
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
        // loadStats(); // 統計を更新 - coreモジュールから呼び出すように後で修正
    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        showNotification('ユーザーの削除に失敗しました: ' + (error.response?.data?.detail || error.message), 'error');
    }
}

// =============================================================================
// イベント委譲ハンドラー
// =============================================================================

function setupUserEventDelegation() {
    // ユーザーテーブルのイベント委譲
    const usersTable = document.getElementById('users-table-body');
    if (usersTable) {
        usersTable.addEventListener('click', function(e) {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const userId = button.dataset.userId;
            
            switch (action) {
                case 'edit-user':
                    editUser(userId);
                    break;
                case 'delete-user':
                    deleteUser(userId);
                    break;
            }
        });
    }
    
    // ユーザーページネーションのイベント委譲
    const usersPagination = document.getElementById('users-pagination');
    if (usersPagination) {
        usersPagination.addEventListener('click', function(e) {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const page = parseInt(button.dataset.page);
            
            if (action === 'load-users' && page) {
                loadUsers(page);
            }
        });
    }
    
    // モーダルのイベント委譲（動的に追加されるため、documentレベルで処理）
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action="close-modal"]');
        if (button) {
            closeModal();
        }
    });
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
// 初期化とイベントリスナー（exportする）
// =============================================================================

export function initializeUserManagement() {
    console.log('ユーザー管理モジュール初期化開始');
    
    // ユーザー管理ボタンのイベントリスナー設定
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    // イベント委譲の設定
    setupUserEventDelegation();
    
    // 初回データ読み込み
    loadUsers();
    
    console.log('ユーザー管理モジュール初期化完了');
}