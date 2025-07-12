/**
 * WatchMe Admin - 心理分析モジュール
 * Whisper音声文字起こし、プロンプト生成、ChatGPT分析機能を提供
 */

// =============================================================================
// 初期化関数
// =============================================================================

function initializePsychologyAnalysis() {
    initializeWhisperDate();
    initializePromptDate();
    initializeChatGPTDate();
    initializeSEDDate();
    initializeSEDAggregatorDate();
    initializeOpenSMILEDate();
    
    // イベントリスナーの設定
    setupPsychologyEventListeners();
    
    console.log('心理分析モジュール初期化完了');
}

function setupPsychologyEventListeners() {
    // Whisper機能のイベントリスナー
    const startWhisperBtn = document.getElementById('start-whisper-btn');
    if (startWhisperBtn) {
        startWhisperBtn.addEventListener('click', startWhisperProcessing);
    }
    
    // Whisperプロンプト生成機能のイベントリスナー
    const generatePromptBtn = document.getElementById('generate-prompt-btn');
    if (generatePromptBtn) {
        generatePromptBtn.addEventListener('click', generateWhisperPrompt);
    }
    
    // ChatGPTスコアリング機能のイベントリスナー
    const startChatGPTBtn = document.getElementById('start-chatgpt-btn');
    if (startChatGPTBtn) {
        startChatGPTBtn.addEventListener('click', startChatGPTAnalysis);
    }
    
    // SED音響イベント検出機能のイベントリスナー
    const startSEDBtn = document.getElementById('start-sed-btn');
    if (startSEDBtn) {
        startSEDBtn.addEventListener('click', startSEDProcessing);
    }
    
    // SED Aggregator機能のイベントリスナー
    const startSEDAggregatorBtn = document.getElementById('start-sed-aggregator-btn');
    if (startSEDAggregatorBtn) {
        startSEDAggregatorBtn.addEventListener('click', startSEDAggregatorProcessing);
    }
    
    // OpenSMILE機能のイベントリスナー
    const startOpenSMILEBtn = document.getElementById('start-opensmile-btn');
    if (startOpenSMILEBtn) {
        startOpenSMILEBtn.addEventListener('click', startOpenSMILEProcessing);
    }
    
    // OpenSMILE Aggregator機能のイベントリスナー
    const startAggregatorBtn = document.getElementById('start-aggregator-btn');
    if (startAggregatorBtn) {
        startAggregatorBtn.addEventListener('click', startOpenSMILEAggregator);
    }
}

// =============================================================================
// 日付初期化関数群
// =============================================================================

function initializeWhisperDate() {
    const dateInput = document.getElementById('whisper-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializePromptDate() {
    const dateInput = document.getElementById('prompt-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializeChatGPTDate() {
    const dateInput = document.getElementById('chatgpt-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializeSEDDate() {
    const dateInput = document.getElementById('sed-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializeSEDAggregatorDate() {
    const dateInput = document.getElementById('sed-aggregator-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializeOpenSMILEDate() {
    const dateInput = document.getElementById('opensmile-date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function initializeDefaultUserSession() {
    const userSessionInput = document.getElementById('user-session');
    if (userSessionInput) {
        userSessionInput.value = 'default-session';
    }
}

// =============================================================================
// Whisper音声文字起こし処理
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
    
    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
        showNotification('デバイスIDはUUID形式で入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'Whisper音声文字起こし処理を開始しています...';
    if (resultsDiv) resultsDiv.classList.add('hidden');
    
    try {
        const response = await axios.post('http://localhost:8001/fetch-and-transcribe', {
            device_id: deviceId,
            date: date,
            model: model
        });
        
        const data = response.data;
        statusDiv.textContent = `処理完了: ${data.processed_count}件のファイルを処理しました`;
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-medium text-green-900 mb-2">✅ Whisper処理結果</h4>
                    <div class="text-sm text-green-700 space-y-1">
                        <div>処理ファイル数: <span class="font-medium">${data.processed_count}件</span></div>
                        <div>成功: <span class="font-medium">${data.success_count}件</span></div>
                        <div>エラー: <span class="font-medium">${data.error_count}件</span></div>
                        <div>開始時刻: <span class="font-medium">${new Date(data.start_time).toLocaleString('ja-JP')}</span></div>
                        <div>終了時刻: <span class="font-medium">${new Date(data.end_time).toLocaleString('ja-JP')}</span></div>
                        <div>処理時間: <span class="font-medium">${Math.round(data.duration_seconds)}秒</span></div>
                    </div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
        
        showNotification(`Whisper処理が完了しました（${data.success_count}件成功）`, 'success');
        
    } catch (error) {
        console.error('Whisper処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Whisper処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 class="font-medium text-red-900 mb-2">❌ エラー詳細</h4>
                    <div class="text-sm text-red-700">${errorMessage}</div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
    } finally {
        button.disabled = false;
        button.textContent = '🎤 Whisper処理開始';
    }
}

// =============================================================================
// プロンプト生成処理
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
    
    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
        showNotification('デバイスIDはUUID形式で入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'プロンプト生成処理を開始しています...';
    if (resultsDiv) resultsDiv.classList.add('hidden');
    
    try {
        const response = await axios.post('http://localhost:8002/generate-prompt', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        statusDiv.textContent = `プロンプト生成完了: ${data.transcription_count}件のWhisperデータを統合しました`;
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-medium text-green-900 mb-3">✅ プロンプト生成結果</h4>
                    <div class="text-sm text-green-700 space-y-2">
                        <div>統合Whisperデータ: <span class="font-medium">${data.transcription_count}件</span></div>
                        <div>生成プロンプト文字数: <span class="font-medium">${data.prompt_length}文字</span></div>
                        <div>処理時刻: <span class="font-medium">${new Date(data.timestamp).toLocaleString('ja-JP')}</span></div>
                    </div>
                    <div class="mt-4">
                        <h5 class="font-medium text-green-900 mb-2">生成されたプロンプト（抜粋）:</h5>
                        <div class="bg-white p-3 rounded border text-xs text-gray-700 max-h-32 overflow-y-auto">
                            ${data.prompt_preview || '（プロンプトプレビューが利用できません）'}
                        </div>
                    </div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
        
        showNotification(`プロンプト生成が完了しました（${data.transcription_count}件統合）`, 'success');
        
    } catch (error) {
        console.error('プロンプト生成エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'プロンプト生成に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 class="font-medium text-red-900 mb-2">❌ エラー詳細</h4>
                    <div class="text-sm text-red-700">${errorMessage}</div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
    } finally {
        button.disabled = false;
        button.textContent = '📝 プロンプト生成';
    }
}

// =============================================================================
// ChatGPT分析処理
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
    
    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
        showNotification('デバイスIDはUUID形式で入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 分析中...';
    statusDiv.textContent = 'ChatGPT心理分析を開始しています...';
    if (resultsDiv) resultsDiv.classList.add('hidden');
    
    try {
        const response = await axios.post('http://localhost:8002/analyze-psychology', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        statusDiv.textContent = `ChatGPT心理分析完了: スコア平均 ${data.average_score}`;
        
        // 結果表示
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-medium text-green-900 mb-3">🧠 ChatGPT心理分析結果</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div class="text-center p-3 bg-white rounded border">
                            <div class="text-2xl font-bold text-blue-600">${data.average_score}</div>
                            <div class="text-sm text-gray-600">平均スコア</div>
                        </div>
                        <div class="text-center p-3 bg-white rounded border">
                            <div class="text-2xl font-bold text-green-600">${data.positive_time_minutes}min</div>
                            <div class="text-sm text-gray-600">ポジティブ時間</div>
                        </div>
                        <div class="text-center p-3 bg-white rounded border">
                            <div class="text-2xl font-bold text-red-600">${data.negative_time_minutes}min</div>
                            <div class="text-sm text-gray-600">ネガティブ時間</div>
                        </div>
                        <div class="text-center p-3 bg-white rounded border">
                            <div class="text-2xl font-bold text-gray-600">${data.neutral_time_minutes}min</div>
                            <div class="text-sm text-gray-600">ニュートラル時間</div>
                        </div>
                    </div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
        
        // インサイト表示
        if (insightsDiv && data.insights) {
            insightsDiv.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-medium text-blue-900 mb-2">💡 インサイト</h4>
                    <div class="text-sm text-blue-700 whitespace-pre-wrap">${data.insights}</div>
                </div>
            `;
            insightsDiv.classList.remove('hidden');
        }
        
        // 感情変化ポイント表示
        if (summaryDiv && data.emotion_changes) {
            summaryDiv.innerHTML = `
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 class="font-medium text-purple-900 mb-2">📈 感情変化ポイント</h4>
                    <div class="text-sm text-purple-700 space-y-2">
                        ${data.emotion_changes.map(change => `
                            <div class="flex justify-between items-center">
                                <span>${change.time}</span>
                                <span class="font-medium">${change.emotion}</span>
                                <span class="text-xs bg-purple-100 px-2 py-1 rounded">${change.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            summaryDiv.classList.remove('hidden');
        }
        
        showNotification(`ChatGPT心理分析が完了しました（平均スコア: ${data.average_score}）`, 'success');
        
    } catch (error) {
        console.error('ChatGPT分析エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'ChatGPT分析に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 class="font-medium text-red-900 mb-2">❌ エラー詳細</h4>
                    <div class="text-sm text-red-700">${errorMessage}</div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
    } finally {
        button.disabled = false;
        button.textContent = '🧠 ChatGPT分析';
    }
}

// =============================================================================
// SED音響イベント検出処理
// =============================================================================

async function startSEDProcessing() {
    const deviceId = document.getElementById('sed-device-id').value;
    const date = document.getElementById('sed-date').value;
    const button = document.getElementById('start-sed-btn');
    const statusDiv = document.getElementById('sed-status');
    
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'SED音響イベント検出処理を開始しています...';
    
    try {
        const response = await axios.post('http://localhost:8003/process-audio', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        statusDiv.textContent = `SED処理完了: ${data.processed_count}件のファイルを処理しました`;
        showNotification(`SED処理が完了しました（${data.processed_count}件処理）`, 'success');
        
    } catch (error) {
        console.error('SED処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'SED処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '🔊 SED処理開始';
    }
}

// =============================================================================
// SED Aggregator処理
// =============================================================================

async function startSEDAggregatorProcessing() {
    const deviceId = document.getElementById('sed-aggregator-device-id').value;
    const date = document.getElementById('sed-aggregator-date').value;
    const button = document.getElementById('start-sed-aggregator-btn');
    const statusDiv = document.getElementById('sed-aggregator-status');
    
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'SED Aggregator処理を開始しています...';
    
    try {
        const response = await axios.post('http://localhost:8003/aggregate-events', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        statusDiv.textContent = `SED Aggregator処理完了: ${data.aggregated_count}件のイベントを集約しました`;
        showNotification(`SED Aggregator処理が完了しました（${data.aggregated_count}件集約）`, 'success');
        
    } catch (error) {
        console.error('SED Aggregator処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'SED Aggregator処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '📊 SED Aggregator';
    }
}

// =============================================================================
// OpenSMILE処理
// =============================================================================

async function startOpenSMILEProcessing() {
    const deviceId = document.getElementById('opensmile-device-id').value;
    const date = document.getElementById('opensmile-date').value;
    const button = document.getElementById('start-opensmile-btn');
    const statusDiv = document.getElementById('opensmile-status');
    
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'OpenSMILE特徴量抽出処理を開始しています...';
    
    try {
        const response = await axios.post('http://localhost:8004/extract-features', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        statusDiv.textContent = `OpenSMILE処理完了: ${data.processed_count}件のファイルを処理しました`;
        showNotification(`OpenSMILE処理が完了しました（${data.processed_count}件処理）`, 'success');
        
    } catch (error) {
        console.error('OpenSMILE処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'OpenSMILE処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '🎵 OpenSMILE処理';
    }
}

// =============================================================================
// OpenSMILE Aggregator処理
// =============================================================================

async function startOpenSMILEAggregator() {
    const deviceId = document.getElementById('aggregator-device-id').value;
    const userSession = document.getElementById('user-session').value;
    const button = document.getElementById('start-aggregator-btn');
    const statusDiv = document.getElementById('aggregator-status');
    
    if (!deviceId || !userSession) {
        showNotification('デバイスIDとユーザーセッションを入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'OpenSMILE Aggregator処理を開始しています...';
    
    try {
        const response = await axios.post('http://localhost:8004/aggregate-features', {
            device_id: deviceId,
            user_session: userSession
        });
        
        const data = response.data;
        statusDiv.textContent = `OpenSMILE Aggregator処理完了: ${data.aggregated_count}件の特徴量を集約しました`;
        showNotification(`OpenSMILE Aggregator処理が完了しました（${data.aggregated_count}件集約）`, 'success');
        
    } catch (error) {
        console.error('OpenSMILE Aggregator処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'OpenSMILE Aggregator処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '📈 OpenSMILE Aggregator';
    }
}

// =============================================================================
// DOMContentLoaded時の初期化
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // コアモジュールの初期化を待つ
    const waitForCore = () => {
        if (window.WatchMeAdmin && window.WatchMeAdmin.initialized) {
            initializePsychologyAnalysis();
        } else {
            setTimeout(waitForCore, 50);
        }
    };
    waitForCore();
});