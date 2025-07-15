/**
 * WatchMe Admin - 心理分析モジュール
 * Whisper音声文字起こし、プロンプト生成、ChatGPT分析機能を提供
 */

import { showNotification } from './core.js';

// =============================================================================
// 初期化関数 (Export)
// =============================================================================

export function initializePsychologyAnalysis() {
    initializeAllDates();
    initializeBatchProcessingDefaults();
    setupPsychologyEventListeners();
    console.log('心理分析モジュール初期化完了');
}

function initializeAllDates() {
    const dateInputs = [
        'whisper-date', 'prompt-date', 'chatgpt-date',
        'sed-date', 'sed-aggregator-date', 'opensmile-date', 'aggregator-date',
        'batch-psychology-date', 'batch-behavior-date'
    ];
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });
}

function initializeBatchProcessingDefaults() {
    // バッチ処理のデフォルト値を設定
    const defaultDeviceId = 'd067d407-cf73-4174-a9c1-d91fb60d64d0';
    const today = new Date().toISOString().split('T')[0];
    
    // 心理グラフバッチ処理
    const psychologyDeviceInput = document.getElementById('batch-psychology-device-id');
    const psychologyDateInput = document.getElementById('batch-psychology-date');
    
    if (psychologyDeviceInput && !psychologyDeviceInput.value.trim()) {
        psychologyDeviceInput.value = defaultDeviceId;
    }
    if (psychologyDateInput && !psychologyDateInput.value) {
        psychologyDateInput.value = today;
    }
    
    // 行動グラフバッチ処理
    const behaviorDeviceInput = document.getElementById('batch-behavior-device-id');
    const behaviorDateInput = document.getElementById('batch-behavior-date');
    
    if (behaviorDeviceInput && !behaviorDeviceInput.value.trim()) {
        behaviorDeviceInput.value = defaultDeviceId;
    }
    if (behaviorDateInput && !behaviorDateInput.value) {
        behaviorDateInput.value = today;
    }
    
    console.log('バッチ処理デフォルト値設定完了');
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

    // バッチ処理機能のイベントリスナー
    const startPsychologyBatchBtn = document.getElementById('start-psychology-batch-btn');
    if (startPsychologyBatchBtn) {
        startPsychologyBatchBtn.addEventListener('click', startPsychologyBatch);
    }
    
    // 行動グラフバッチ処理機能のイベントリスナー
    const startBehaviorBatchBtn = document.getElementById('start-behavior-batch-btn');
    if (startBehaviorBatchBtn) {
        startBehaviorBatchBtn.addEventListener('click', startBehaviorBatch);
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
// バッチ処理機能
// =============================================================================

async function executeBatchProcessSteps(deviceId, date, log) {
    // ステップ1: Whisper音声文字起こし
    log('🔍 Whisper APIサーバー(ポート8001)の状態を確認中...');
    
    try {
        log('🎤 Whisper音声文字起こし処理を開始...');
        const whisperResponse = await axios.post('/api/batch/whisper-step', {
            device_id: deviceId,
            date: date
        });
        
        const whisperData = whisperResponse.data;
        if (whisperData.success) {
            log('🎤 Whisper音声文字起こし: ✅ 処理完了');
            if (whisperData.data && whisperData.data.summary) {
                const summary = whisperData.data.summary;
                log(`   📊 処理結果: 取得${summary.audio_fetched || 0}件, 保存${summary.supabase_saved || 0}件, スキップ${summary.skipped_existing || 0}件`);
            }
        } else {
            throw new Error(`Whisper処理エラー: ${whisperData.message}`);
        }
    } catch (error) {
        log(`❌ Whisper処理エラー: ${error.message}`, true);
        throw error;
    }
    
    // 小さな待機時間を入れて時間差を作る
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ステップ2: プロンプト生成
    log('🔍 プロンプト生成APIサーバー(ポート8009)の状態を確認中...');
    
    try {
        log('📝 プロンプト生成処理を開始...');
        const promptResponse = await axios.post('/api/batch/prompt-step', {
            device_id: deviceId,
            date: date
        });
        
        const promptData = promptResponse.data;
        if (promptData.success) {
            log('📝 プロンプト生成: ✅ 処理完了');
            if (promptData.data && promptData.data.output_path) {
                log(`   📄 プロンプト生成完了: ${promptData.data.output_path}`);
            }
        } else {
            throw new Error(`プロンプト生成エラー: ${promptData.message}`);
        }
    } catch (error) {
        log(`❌ プロンプト生成エラー: ${error.message}`, true);
        throw error;
    }
    
    // 小さな待機時間を入れて時間差を作る
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ステップ3: ChatGPT心理分析
    log('🔍 ChatGPT APIサーバー(ポート8002)の状態を確認中...');
    
    try {
        log('🧠 ChatGPT心理分析処理を開始...');
        const chatgptResponse = await axios.post('/api/batch/chatgpt-step', {
            device_id: deviceId,
            date: date
        });
        
        const chatgptData = chatgptResponse.data;
        if (chatgptData.success) {
            log('🧠 ChatGPT心理分析: ✅ 処理完了');
            if (chatgptData.data) {
                const data = chatgptData.data;
                if (data.average_score) {
                    log(`   📈 分析結果: 平均スコア ${data.average_score}, ポジティブ${data.positive_time_minutes || 0}分`);
                }
            }
        } else {
            throw new Error(`ChatGPT分析エラー: ${chatgptData.message}`);
        }
    } catch (error) {
        log(`❌ ChatGPT分析エラー: ${error.message}`, true);
        throw error;
    }
    
    log('🎉 全てのステップが正常に完了しました。');
}

async function startPsychologyBatch() {
    const deviceId = document.getElementById('batch-psychology-device-id').value.trim();
    const date = document.getElementById('batch-psychology-date').value;
    const button = document.getElementById('start-psychology-batch-btn');
    const logContainer = document.getElementById('batch-psychology-log-container');
    const logElement = document.getElementById('batch-psychology-log');

    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }

    button.disabled = true;
    button.textContent = '🔄 実行中...';
    logContainer.classList.remove('hidden');
    logElement.innerHTML = '';

    // 進行状況表示のためのカウンター
    let logDelay = 0;
    
    const logWithDelay = (message, isError = false, isWarning = false, delayMs = 400) => {
        setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString();
            let colorClass = 'text-green-400';
            if (isError) {
                colorClass = 'text-red-400';
            } else if (isWarning) {
                colorClass = 'text-yellow-400';
            }
            logElement.innerHTML += `<div class="flex"><div class="w-20 text-gray-500">${timestamp}</div><div class="flex-1 ${colorClass}">${message}</div></div>`;
            logContainer.scrollTop = logContainer.scrollHeight;
        }, logDelay);
        logDelay += delayMs;
    };

    try {
        // 処理開始前のログを段階的に表示
        logWithDelay('🚀 心理グラフ作成バッチを開始します...', false, false, 100);
        logWithDelay('📋 実行予定: ①Whisper音声文字起こし → ②プロンプト生成 → ③ChatGPT心理分析', false, false, 300);
        logWithDelay('🔍 APIサーバーの状態を確認中...', false, false, 500);
        logWithDelay('🔄 バッチ処理リクエストを送信中...', false, false, 600);
        
        // APIリクエストを実際の遅延後に実行
        const response = await new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await axios.post('/api/batch/create-psychology-graph', {
                        device_id: deviceId,
                        date: date
                    });
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, logDelay);
        });

        // 結果を段階的に表示（時間差を大きくして）
        const results = response.data.results;
        logDelay = 0; // 遅延をリセット
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const isError = !result.success;
            const isWarning = result.step.includes('確認');
            
            // より詳細なステップ表示とリアルタイム感の演出
            if (result.step === '初期化') {
                logWithDelay(`🚀 ${result.message}`, isError, false, 200);
            } else if (result.step.includes('サーバー確認')) {
                logWithDelay(`${result.message}`, isError, isWarning, 300);
            } else if (result.step.includes('Whisper')) {
                logWithDelay(`🎤 ${result.step}: 音声文字起こしを開始中...`, false, false, 400);
                logWithDelay(`🎤 ${result.step}: ${result.message}`, isError, false, 600);
                if (result.success && result.data) {
                    const summary = result.data.summary || {};
                    logWithDelay(`   📊 処理結果: 取得${summary.audio_fetched || 0}件, 保存${summary.supabase_saved || 0}件, スキップ${summary.skipped_existing || 0}件`, false, false, 300);
                }
            } else if (result.step.includes('プロンプト')) {
                logWithDelay(`📝 ${result.step}: プロンプト生成を開始中...`, false, false, 400);
                logWithDelay(`📝 ${result.step}: ${result.message}`, isError, false, 500);
                if (result.success && result.data) {
                    logWithDelay(`   📄 プロンプト生成完了: ${result.data.output_path}`, false, false, 300);
                }
            } else if (result.step.includes('ChatGPT')) {
                logWithDelay(`🧠 ${result.step}: ChatGPT分析を開始中...`, false, false, 400);
                logWithDelay(`🧠 ${result.step}: ${result.message}`, isError, false, 700);
                if (result.success && result.data) {
                    const data = result.data;
                    if (data.average_score) {
                        logWithDelay(`   📈 分析結果: 平均スコア ${data.average_score}, ポジティブ${data.positive_time_minutes || 0}分`, false, false, 400);
                    }
                }
            } else if (result.step === '完了') {
                logWithDelay(`🎉 ${result.message}`, isError, false, 500);
            } else {
                logWithDelay(`⚙️ ${result.step}: ${result.message}`, isError, false, 300);
            }
        }

        if (response.data.success) {
            logWithDelay('✅ バッチ処理が正常に完了しました。', false, false, 600);
            setTimeout(() => {
                showNotification('心理グラフ作成バッチが完了しました。', 'success');
            }, logDelay + 500);
        } else {
            throw new Error(response.data.message || 'バッチ処理中に不明なエラーが発生しました。');
        }

    } catch (error) {
        console.error('バッチ処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'バッチ処理に失敗しました。';
        logWithDelay(`❌ 重大なエラー: ${errorMessage}`, true, false, 200);
        setTimeout(() => {
            showNotification(errorMessage, 'error');
        }, logDelay + 300);
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '🚀 バッチ処理開始';
        }, logDelay + 800);
    }
}

// =============================================================================
// 行動グラフバッチ処理
// =============================================================================

async function startBehaviorBatch() {
    const deviceId = document.getElementById('batch-behavior-device-id').value.trim();
    const date = document.getElementById('batch-behavior-date').value;
    const button = document.getElementById('start-behavior-batch-btn');
    const logContainer = document.getElementById('batch-behavior-log-container');
    const logElement = document.getElementById('batch-behavior-log');

    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }

    button.disabled = true;
    button.textContent = '🔄 実行中...';
    logContainer.classList.remove('hidden');
    logElement.innerHTML = '';

    // 進行状況表示のためのカウンター
    let logDelay = 0;
    
    const logWithDelay = (message, isError = false, isWarning = false, delayMs = 400) => {
        setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString();
            let colorClass = 'text-green-400';
            if (isError) {
                colorClass = 'text-red-400';
            } else if (isWarning) {
                colorClass = 'text-yellow-400';
            }
            logElement.innerHTML += `<div class="flex"><div class="w-20 text-gray-500">${timestamp}</div><div class="flex-1 ${colorClass}">${message}</div></div>`;
            logContainer.scrollTop = logContainer.scrollHeight;
        }, logDelay);
        logDelay += delayMs;
    };

    try {
        // 処理開始前のログを段階的に表示
        logWithDelay('🚶 行動グラフ作成バッチを開始します...', false, false, 100);
        logWithDelay('📋 実行予定: ①SED音響イベント検出 → ②SED Aggregator', false, false, 300);
        logWithDelay('🔍 APIサーバーの状態を確認中...', false, false, 500);
        logWithDelay('🔄 バッチ処理リクエストを送信中...', false, false, 600);
        
        // APIリクエストを実際の遅延後に実行
        const response = await new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await axios.post('/api/batch/create-behavior-graph', {
                        device_id: deviceId,
                        date: date
                    });
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, logDelay);
        });

        // 結果を段階的に表示（時間差を大きくして）
        const results = response.data.results;
        logDelay = 0; // 遅延をリセット
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const isError = !result.success;
            const isWarning = result.step.includes('確認');
            
            // より詳細なステップ表示とリアルタイム感の演出
            if (result.step === '初期化') {
                logWithDelay(`🚶 ${result.message}`, isError, false, 200);
            } else if (result.step.includes('サーバー確認')) {
                logWithDelay(`${result.message}`, isError, isWarning, 300);
            } else if (result.step.includes('SED音響イベント検出')) {
                logWithDelay(`🎵 ${result.step}: 音響イベント検出を開始中...`, false, false, 400);
                logWithDelay(`🎵 ${result.step}: ${result.message}`, isError, false, 600);
                if (result.success && result.data) {
                    const summary = result.data.summary || {};
                    const processedCount = summary.audio_fetched || result.data.processed_count || 0;
                    const savedCount = summary.supabase_saved || 0;
                    logWithDelay(`   📊 処理結果: ${processedCount}件のファイルを処理、${savedCount}件を保存`, false, false, 300);
                }
            } else if (result.step.includes('SED Aggregator')) {
                logWithDelay(`📊 ${result.step}: 行動グラフデータ生成を開始中...`, false, false, 400);
                logWithDelay(`📊 ${result.step}: ${result.message}`, isError, false, 500);
                if (result.success && result.data) {
                    if (result.data.task_id) {
                        logWithDelay(`   📈 非同期処理開始: タスクID ${result.data.task_id}`, false, false, 300);
                    } else {
                        logWithDelay(`   📈 集約結果: ${result.data.aggregated_count || 0}件のイベントを集約`, false, false, 300);
                    }
                }
            } else if (result.step === '完了') {
                logWithDelay(`🎉 ${result.message}`, isError, false, 500);
            } else {
                logWithDelay(`⚙️ ${result.step}: ${result.message}`, isError, false, 300);
            }
        }

        if (response.data.success) {
            logWithDelay('✅ バッチ処理が正常に完了しました。', false, false, 600);
            setTimeout(() => {
                showNotification('行動グラフ作成バッチが完了しました。', 'success');
            }, logDelay + 500);
        } else {
            throw new Error(response.data.message || 'バッチ処理中に不明なエラーが発生しました。');
        }

    } catch (error) {
        console.error('バッチ処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'バッチ処理に失敗しました。';
        logWithDelay(`❌ 重大なエラー: ${errorMessage}`, true, false, 200);
        setTimeout(() => {
            showNotification(errorMessage, 'error');
        }, logDelay + 300);
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '🚀 バッチ処理開始';
        }, logDelay + 800);
    }
}

// =============================================================================
// Whisper音声文字起こし処理
// =============================================================================

async function startWhisperProcessing() {
    const deviceId = document.getElementById('whisper-device-id').value.trim();
    const date = document.getElementById('whisper-date').value;
    const model = 'base'; // サーバーリソースの制約により、baseモデルのみサポート
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
    
    statusDiv.textContent = 'Whisper音声文字起こし処理を実行中...';
    
    try {
        const startTime = new Date();
        
        // 正しいエンドポイントを使用して直接APIを呼び出す
        const response = await axios.post('https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe', {
            device_id: deviceId,
            date: date,
            model: model  // baseモデル固定
        }, {
            timeout: 600000  // 10分のタイムアウト
        });
        
        const result = response.data;
        const endTime = new Date();
        const processingTime = Math.round((endTime - startTime) / 1000);
        
        // 処理結果の表示
        if (result.status === 'success') {
            statusDiv.textContent = `処理完了: ${result.processed ? result.processed.length : 0}件のファイルを処理しました`;
            
            if (resultsDiv && resultsContent) {
                resultsContent.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-medium text-green-900 mb-2">✅ Whisper処理結果</h4>
                        <div class="text-sm text-green-700 space-y-1">
                            <div>処理ファイル数: <span class="font-medium">${result.summary.total_time_blocks}件</span></div>
                            <div>音声取得: <span class="font-medium">${result.summary.audio_fetched}件</span></div>
                            <div>Supabase保存: <span class="font-medium">${result.summary.supabase_saved}件</span></div>
                            <div>スキップ: <span class="font-medium">${result.summary.skipped_existing}件</span></div>
                            <div>エラー: <span class="font-medium">${result.summary.errors}件</span></div>
                            <div>開始時刻: <span class="font-medium">${startTime.toLocaleString('ja-JP')}</span></div>
                            <div>終了時刻: <span class="font-medium">${endTime.toLocaleString('ja-JP')}</span></div>
                            <div>処理時間: <span class="font-medium">${processingTime}秒</span></div>
                        </div>
                        ${result.errors && result.errors.length > 0 ? `
                            <div class="mt-3 text-sm text-red-700">
                                <h5 class="font-medium">エラー詳細:</h5>
                                <ul class="list-disc list-inside">
                                    ${result.errors.map(err => `<li>${err}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `;
                resultsDiv.classList.remove('hidden');
            }
            
            showNotification('Whisper処理が完了しました', 'success');
        } else {
            throw new Error(result.message || 'Whisper処理が失敗しました');
        }
        
    } catch (error) {
        console.error('Whisper処理エラー:', error);
        
        let errorMessage;
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'タイムアウトしました。処理はバックグラウンドで継続されている可能性があります。';
            statusDiv.innerHTML = `
                <div class="text-yellow-600">
                    <span>⚠️ ${errorMessage}</span>
                    <div class="text-sm mt-2">
                        <p>※ 大量のデータ処理には時間がかかります。</p>
                        <p>※ Supabaseで結果を確認してください。</p>
                    </div>
                </div>
            `;
        } else {
            errorMessage = error.response?.data?.detail || error.message || 'Whisper処理に失敗しました';
            statusDiv.textContent = `エラー: ${errorMessage}`;
        }
        
        showNotification(errorMessage, error.code === 'ECONNABORTED' ? 'warning' : 'error');
        
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
        const response = await axios.post('http://localhost:8004/fetch-and-process', {
            device_id: deviceId,
            date: date,
            threshold: parseFloat(document.getElementById('sed-threshold').value) || 0.2
        });
        
        const data = response.data;
        console.log('SED API Response:', data); // デバッグ用ログ
        
        // レスポンスの構造に応じて適切なフィールドを参照
        const processedCount = data.summary?.audio_fetched || data.processed_count || 0;
        const savedCount = data.summary?.supabase_saved || 0;
        statusDiv.textContent = `SED処理完了: ${processedCount}件のファイルを処理、${savedCount}件を保存しました`;
        showNotification(`SED処理が完了しました（${processedCount}件処理、${savedCount}件保存）`, 'success');
        
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
        const response = await axios.post('http://localhost:8010/analysis/sed', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        console.log('SED Aggregator API Response:', data); // デバッグ用ログ
        
        // レスポンスの構造に応じて適切なフィールドを参照
        // SED Aggregatorは非同期処理なので、タスクIDが返される
        if (data.task_id) {
            statusDiv.textContent = `SED Aggregator処理を開始しました (タスクID: ${data.task_id})`;
            showNotification(`SED Aggregator処理を開始しました`, 'info');
        } else {
            const aggregatedCount = data.aggregated_count || data.aggregatedCount || data.count || 0;
            statusDiv.textContent = `SED Aggregator処理完了: ${aggregatedCount}件のイベントを集約しました`;
            showNotification(`SED Aggregator処理が完了しました（${aggregatedCount}件集約）`, 'success');
        }
        
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
        const response = await axios.post('http://localhost:8011/process/vault-data', {
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
        const response = await axios.post('http://localhost:8011/aggregate-features', {
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