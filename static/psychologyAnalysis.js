/**
 * WatchMe Admin - 心理分析モジュール
 * Whisper音声文字起こし、プロンプト生成、ChatGPT分析機能を提供
 */

import { showNotification } from './core.js';

// =============================================================================
// 初期化関数 (Export)
// =============================================================================

export function initializePsychologyAnalysis() {
    console.log('心理分析モジュール初期化開始...');
    initializeAllDates();
    initializeBatchProcessingDefaults();
    setupPsychologyEventListeners();
    initializeSchedulers();
    checkWhisperAPIStatus(); // APIステータスチェックを追加
    checkSEDAPIStatus(); // SED APIステータスチェックを追加
    checkOpenSMILEAPIStatus(); // OpenSMILE APIステータスチェックを追加
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
    console.log('心理分析イベントリスナーを設定中...');
    
    // Whisper機能のイベントリスナー
    const startWhisperBtn = document.getElementById('start-whisper-btn');
    if (startWhisperBtn) {
        console.log('Whisperボタンを発見、イベントリスナーを設定');
        startWhisperBtn.addEventListener('click', startWhisperProcessing);
    } else {
        console.error('Whisperボタン (start-whisper-btn) が見つかりません');
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

    // スケジューラー機能のイベントリスナー
    setupSchedulerEventListeners();
    
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
// APIステータスチェック
// =============================================================================

async function checkWhisperAPIStatus() {
    const statusElement = document.getElementById('whisper-api-status');
    if (!statusElement) return;
    
    try {
        console.log('Whisper APIステータスを確認中...');
        const response = await axios.get('/api/whisper/status', {
            timeout: 5000
        });
        
        const data = response.data;
        if (data.status === 'online') {
            statusElement.textContent = '✅ 稼働中';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800';
            console.log('Whisper API稼働確認:', data.data);
        } else if (data.status === 'error') {
            statusElement.textContent = '⚠️ 応答異常';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800';
            console.warn('Whisper APIエラー:', data.message);
        } else {
            statusElement.textContent = '❌ オフライン';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
            console.error('Whisper APIオフライン:', data.message);
        }
    } catch (error) {
        console.error('Whisper APIステータス確認エラー:', error);
        statusElement.textContent = '❌ 接続エラー';
        statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
    }
}

// 定期的にAPIステータスをチェック（30秒ごと）
setInterval(checkWhisperAPIStatus, 30000);

// =============================================================================
// Whisper音声文字起こし処理
// =============================================================================

async function startWhisperProcessing() {
    console.log('Whisper処理開始ボタンがクリックされました');
    
    const filePathsTextarea = document.getElementById('whisper-file-paths');
    if (!filePathsTextarea) {
        console.error('whisper-file-paths要素が見つかりません');
        showNotification('エラー: 入力フィールドが見つかりません', 'error');
        return;
    }
    
    const filePathsText = filePathsTextarea.value.trim();
    const model = 'base'; // サーバーリソースの制約により、baseモデルのみサポート
    const button = document.getElementById('start-whisper-btn');
    const statusDiv = document.getElementById('whisper-status');
    const resultsDiv = document.getElementById('whisper-results');
    const resultsContent = document.getElementById('whisper-results-content');
    
    console.log('入力されたファイルパス:', filePathsText);
    
    // 入力チェック
    if (!filePathsText) {
        console.log('ファイルパスが入力されていません');
        showNotification('ファイルパスを入力してください', 'error');
        return;
    }
    
    // ファイルパスを改行で分割して配列にする
    const filePaths = filePathsText.split('\n')
        .map(path => path.trim())
        .filter(path => path.length > 0);
    
    console.log('処理するファイルパス配列:', filePaths);
    
    if (filePaths.length === 0) {
        console.log('有効なファイルパスがありません');
        showNotification('有効なファイルパスを入力してください', 'error');
        return;
    }
    
    // UI更新
    console.log('UI要素を更新中...');
    if (button) {
        button.disabled = true;
        button.textContent = '🔄 処理中...';
    }
    if (statusDiv) {
        statusDiv.textContent = 'Whisper音声文字起こし処理を開始しています...';
    }
    if (resultsDiv) {
        resultsDiv.classList.add('hidden');
    }
    
    try {
        console.log('Whisper API処理を開始します...');
        const startTime = new Date();
        
        // APIサーバーの接続性確認
        statusDiv.textContent = 'APIサーバーへの接続を確認中...';
        console.log('🔍 APIヘルスチェック開始: https://api.hey-watch.me/vibe-transcriber/');
        try {
            const healthCheck = await axios.get('https://api.hey-watch.me/vibe-transcriber/', { 
                timeout: 10000,
                withCredentials: false
            });
            console.log('✅ ヘルスチェック成功:', healthCheck.data);
            statusDiv.textContent = 'APIサーバー接続OK。音声文字起こし処理を開始...';
        } catch (healthError) {
            console.warn('⚠️ ヘルスチェック失敗:', {
                message: healthError.message,
                code: healthError.code,
                response: healthError.response?.data,
                status: healthError.response?.status
            });
            statusDiv.textContent = 'APIサーバーへの接続を確認できませんが、処理を続行します...';
        }
        
        // 管理画面プロキシ経由でAPIを呼び出す（CORS回避）
        console.log('Whisper APIリクエスト開始（プロキシ経由）:', {
            url: '/api/whisper/fetch-and-transcribe',
            proxy_target: 'https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe',
            data: { file_paths: filePaths, model: model }
        });
        
        const response = await axios({
            method: 'POST',
            url: '/api/whisper/fetch-and-transcribe',  // 管理画面のプロキシエンドポイント
            data: {
                file_paths: filePaths,
                model: model  // baseモデル固定
            },
            timeout: 600000,  // 10分のタイムアウト
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 500; // 4xxエラーも受け入れる
            }
        });
        
        console.log('Whisper APIレスポンス受信:', response.status, response.data);
        
        const result = response.data;
        const endTime = new Date();
        const processingTime = Math.round((endTime - startTime) / 1000);
        
        // エラーレスポンスの詳細を確認
        if (response.status !== 200) {
            console.error('APIエラーレスポンス:', result);
            throw new Error(result.detail || result.message || `APIエラー: ステータス ${response.status}`);
        }
        
        // 処理結果の表示
        if (result.status === 'success') {
            statusDiv.textContent = `処理完了: ${result.summary?.total_files || 0}件のファイルを処理しました`;
            
            if (resultsDiv && resultsContent) {
                resultsContent.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-medium text-green-900 mb-2">✅ Whisper処理結果</h4>
                        <div class="text-sm text-green-700 space-y-1">
                            <div>リクエストファイル数: <span class="font-medium">${filePaths.length}件</span></div>
                            <div>処理ファイル数: <span class="font-medium">${result.summary?.total_files || 0}件</span></div>
                            <div>処理成功: <span class="font-medium">${result.summary?.pending_processed || 0}件</span></div>
                            <div>エラー: <span class="font-medium">${result.summary?.errors || 0}件</span></div>
                            <div>開始時刻: <span class="font-medium">${startTime.toLocaleString('ja-JP')}</span></div>
                            <div>終了時刻: <span class="font-medium">${endTime.toLocaleString('ja-JP')}</span></div>
                            <div>処理時間: <span class="font-medium">${processingTime}秒</span></div>
                        </div>
                        ${result.processed_files && result.processed_files.length > 0 ? `
                            <div class="mt-3 text-sm text-green-700">
                                <h5 class="font-medium">処理したファイル:</h5>
                                <ul class="list-disc list-inside text-xs mt-1 max-h-32 overflow-y-auto">
                                    ${result.processed_files.map(file => `<li>${file}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${result.error_files && result.error_files.length > 0 ? `
                            <div class="mt-3 text-sm text-red-700">
                                <h5 class="font-medium">エラーファイル:</h5>
                                <ul class="list-disc list-inside text-xs mt-1">
                                    ${result.error_files.map(file => `<li>${file}</li>`).join('')}
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
        console.error('エラー詳細:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
        
        // エラーが発生した場合でも必ずUIに表示する
        if (!statusDiv) {
            alert(`Whisper処理エラー: ${error.message}`);
        }
        
        let errorMessage;
        let errorDetails = '';
        
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
        } else if (error.code === 'ERR_NETWORK') {
            errorMessage = 'ネットワーク接続エラーが発生しました';
            errorDetails = `
                <div class="mt-2 text-xs">
                    <p><strong>考えられる原因:</strong></p>
                    <ul class="list-disc list-inside ml-2">
                        <li>インターネット接続の問題</li>
                        <li>APIサーバーのダウンタイム</li>
                        <li>CORS設定の問題</li>
                        <li>SSL証明書の問題</li>
                    </ul>
                    <p class="mt-2"><strong>確認方法:</strong></p>
                    <p>ブラウザの開発者ツール（F12）→ NetworkタブでAPIリクエストの詳細を確認してください</p>
                </div>
            `;
            statusDiv.innerHTML = `
                <div class="text-red-600">
                    <span>❌ ${errorMessage}</span>
                    ${errorDetails}
                </div>
            `;
        } else {
            errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Whisper処理に失敗しました';
            if (error.response?.status) {
                errorDetails = `HTTPステータス: ${error.response.status}`;
            }
            if (error.response?.data) {
                errorDetails += `\nレスポンス: ${JSON.stringify(error.response.data, null, 2)}`;
            }
            statusDiv.innerHTML = `
                <div class="text-red-600">
                    <span>❌ エラー: ${errorMessage}</span>
                    ${errorDetails ? `<div class="text-sm mt-1 whitespace-pre-wrap font-mono bg-red-50 p-2 rounded">${errorDetails}</div>` : ''}
                </div>
            `;
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
        console.log('Whisper処理完了（finally節）');
        if (button) {
            button.disabled = false;
            button.textContent = '🎤 Whisper処理開始';
        }
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
        // 管理画面プロキシ経由でAPIを呼び出し（CORS回避）
        console.log('プロンプト生成APIリクエスト開始（プロキシ経由）:', {
            url: '/api/prompt/generate-mood-prompt-supabase',
            proxy_target: 'https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase',
            params: { device_id: deviceId, date: date }
        });
        
        const response = await axios.get('/api/prompt/generate-mood-prompt-supabase', {
            params: {
                device_id: deviceId,
                date: date
            }
        });
        
        const data = response.data;
        statusDiv.textContent = `プロンプト生成完了: ${data.message}`;
        
        if (resultsDiv && resultsContent) {
            resultsContent.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-medium text-green-900 mb-3">✅ プロンプト生成結果</h4>
                    <div class="text-sm text-green-700 space-y-2">
                        <div>ステータス: <span class="font-medium">${data.status}</span></div>
                        <div>結果: <span class="font-medium">${data.message}</span></div>
                        <div>処理時刻: <span class="font-medium">${new Date().toLocaleString('ja-JP')}</span></div>
                    </div>
                    <div class="mt-4">
                        <h5 class="font-medium text-green-900 mb-2">処理詳細:</h5>
                        <div class="bg-white p-3 rounded border text-xs text-gray-700">
                            マイクロサービスAPIによる処理が完了しました。<br>
                            生成されたプロンプトはSupabaseのvibe_whisper_promptテーブルに保存されています。
                        </div>
                    </div>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }
        
        showNotification(`プロンプト生成が完了しました`, 'success');
        
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
        // 管理画面プロキシ経由でAPIを呼び出し（CORS回避）
        console.log('ChatGPT APIリクエスト開始（プロキシ経由）:', {
            url: '/api/chatgpt/analyze-vibegraph-supabase',
            proxy_target: 'https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase',
            data: { device_id: deviceId, date: date }
        });
        
        const response = await axios.post('/api/chatgpt/analyze-vibegraph-supabase', {
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
    console.log('SED処理開始ボタンがクリックされました');
    
    const filePathsTextarea = document.getElementById('sed-file-paths');
    if (!filePathsTextarea) {
        console.error('sed-file-paths要素が見つかりません');
        showNotification('エラー: 入力フィールドが見つかりません', 'error');
        return;
    }
    
    const filePathsText = filePathsTextarea.value.trim();
    const threshold = parseFloat(document.getElementById('sed-threshold').value) || 0.2;
    const button = document.getElementById('start-sed-btn');
    const statusDiv = document.getElementById('sed-status');
    const resultsDiv = document.getElementById('sed-results');
    const resultsContent = document.getElementById('sed-results-content');
    
    console.log('入力されたファイルパス:', filePathsText);
    
    // 入力チェック
    if (!filePathsText) {
        console.log('ファイルパスが入力されていません');
        showNotification('ファイルパスを入力してください', 'error');
        return;
    }
    
    // ファイルパスを改行で分割して配列にする
    const filePaths = filePathsText.split('\n')
        .map(path => path.trim())
        .filter(path => path.length > 0);
    
    console.log('処理するファイルパス配列:', filePaths);
    
    if (filePaths.length === 0) {
        console.log('有効なファイルパスがありません');
        showNotification('有効なファイルパスを入力してください', 'error');
        return;
    }
    
    // UI更新
    console.log('UI要素を更新中...');
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'SED音響イベント検出処理を開始しています...';
    
    // 結果エリアをクリア
    if (resultsDiv && resultsContent) {
        resultsDiv.classList.add('hidden');
        resultsContent.textContent = '';
    }
    
    try {
        console.log('API呼び出し開始...');
        const response = await axios({
            method: 'POST',
            url: '/api/sed/fetch-and-process-paths',
            data: {
                file_paths: filePaths,
                threshold: threshold
            },
            timeout: 300000 // 5分タイムアウト
        });
        
        console.log('API呼び出し完了:', response.data);
        
        const data = response.data;
        
        // レスポンスの構造に応じて適切なフィールドを参照
        const processedCount = data.summary?.total_files || data.processed_files?.length || 0;
        const errorCount = data.summary?.errors || 0;
        const executionTime = data.execution_time_seconds ? data.execution_time_seconds.toFixed(2) : '不明';
        
        statusDiv.textContent = `SED処理完了: ${processedCount}件のファイルを処理しました（処理時間: ${executionTime}秒、エラー: ${errorCount}件）`;
        showNotification(`SED処理が完了しました（${processedCount}件処理、エラー: ${errorCount}件）`, 'success');
        
        // 結果を表示
        if (resultsDiv && resultsContent) {
            resultsContent.textContent = JSON.stringify(data, null, 2);
            resultsDiv.classList.remove('hidden');
        }
        
        console.log('処理完了');
        
    } catch (error) {
        console.error('SED処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'SED処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
        
        // エラー詳細も表示
        if (resultsDiv && resultsContent) {
            resultsContent.textContent = `エラー詳細:\n${JSON.stringify(error.response?.data || error.message, null, 2)}`;
            resultsDiv.classList.remove('hidden');
        }
    } finally {
        button.disabled = false;
        button.textContent = '🎵 SED処理開始';
        console.log('処理終了、UI復元完了');
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
        const response = await axios.post('/api/sed-aggregator/analysis/sed', {
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
// SED API ステータスチェック
// =============================================================================

async function checkSEDAPIStatus() {
    const statusElement = document.getElementById('sed-api-status');
    if (!statusElement) return;

    try {
        const response = await axios.get('/api/sed/status', { timeout: 10000 });
        
        const data = response.data;
        if (data.status === 'online') {
            statusElement.textContent = '✅ 稼働中';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800';
            console.log('SED API稼働確認:', data.data);
        } else if (data.status === 'error') {
            statusElement.textContent = '⚠️ 応答異常';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800';
            console.warn('SED APIエラー:', data.message);
        } else {
            statusElement.textContent = '❌ オフライン';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
            console.error('SED APIオフライン:', data.message);
        }
    } catch (error) {
        console.error('SED APIステータス確認エラー:', error);
        statusElement.textContent = '❌ 接続エラー';
        statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
    }
}

// 定期的にAPIステータスをチェック（30秒ごと）
setInterval(checkSEDAPIStatus, 30000);

// =============================================================================
// OpenSMILE API ステータスチェック
// =============================================================================

async function checkOpenSMILEAPIStatus() {
    const statusElement = document.getElementById('opensmile-api-status');
    if (!statusElement) return;

    try {
        const response = await axios.get('/api/opensmile/status', { timeout: 10000 });
        
        const data = response.data;
        if (data.status === 'online') {
            statusElement.textContent = '✅ 稼働中';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800';
            console.log('OpenSMILE API稼働確認:', data.data);
        } else if (data.status === 'error') {
            statusElement.textContent = '⚠️ 応答異常';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800';
            console.warn('OpenSMILE APIエラー:', data.message);
        } else {
            statusElement.textContent = '❌ オフライン';
            statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
            console.error('OpenSMILE APIオフライン:', data.message);
        }
    } catch (error) {
        console.error('OpenSMILE APIステータス確認エラー:', error);
        statusElement.textContent = '❌ 接続エラー';
        statusElement.className = 'ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800';
    }
}

// 定期的にAPIステータスをチェック（30秒ごと）
setInterval(checkOpenSMILEAPIStatus, 30000);

// =============================================================================
// OpenSMILE処理
// =============================================================================

async function startOpenSMILEProcessing() {
    console.log('OpenSMILE処理開始ボタンがクリックされました');
    
    const filePathsTextarea = document.getElementById('opensmile-file-paths');
    if (!filePathsTextarea) {
        console.error('opensmile-file-paths要素が見つかりません');
        showNotification('エラー: 入力フィールドが見つかりません', 'error');
        return;
    }
    
    const filePathsText = filePathsTextarea.value.trim();
    const featureSet = document.getElementById('opensmile-feature-set').value || 'eGeMAPSv02';
    const includeRaw = document.getElementById('opensmile-include-raw').value === 'true';
    const button = document.getElementById('start-opensmile-btn');
    const statusDiv = document.getElementById('opensmile-status');
    const resultsDiv = document.getElementById('opensmile-results');
    const resultsContent = document.getElementById('opensmile-results-content');
    
    console.log('入力されたファイルパス:', filePathsText);
    
    // 入力チェック
    if (!filePathsText) {
        console.log('ファイルパスが入力されていません');
        showNotification('ファイルパスを入力してください', 'error');
        return;
    }
    
    // ファイルパスを改行で分割して配列にする
    const filePaths = filePathsText.split('\n')
        .map(path => path.trim())
        .filter(path => path.length > 0);
    
    console.log('処理するファイルパス配列:', filePaths);
    
    if (filePaths.length === 0) {
        console.log('有効なファイルパスがありません');
        showNotification('有効なファイルパスを入力してください', 'error');
        return;
    }
    
    // UI更新
    console.log('UI要素を更新中...');
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'OpenSMILE特徴量抽出処理を開始しています...';
    
    // 結果エリアをクリア
    if (resultsDiv && resultsContent) {
        resultsDiv.classList.add('hidden');
        resultsContent.textContent = '';
    }
    
    try {
        console.log('API呼び出し開始...');
        const response = await axios({
            method: 'POST',
            url: '/api/opensmile/process/emotion-features',
            data: {
                file_paths: filePaths,
                feature_set: featureSet,
                include_raw_features: includeRaw
            },
            timeout: 300000 // 5分タイムアウト
        });
        
        console.log('API呼び出し完了:', response.data);
        
        const data = response.data;
        const processedCount = data.processed_files || 0;
        const totalProcessingTime = data.total_processing_time ? data.total_processing_time.toFixed(2) : '不明';
        
        statusDiv.textContent = `OpenSMILE処理完了: ${processedCount}件のファイルを処理しました（処理時間: ${totalProcessingTime}秒）`;
        showNotification(`OpenSMILE処理が完了しました（${processedCount}件処理）`, 'success');
        
        // 結果を表示
        if (resultsDiv && resultsContent) {
            resultsContent.textContent = JSON.stringify(data, null, 2);
            resultsDiv.classList.remove('hidden');
        }
        
        console.log('処理完了');
        
    } catch (error) {
        console.error('OpenSMILE処理エラー:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'OpenSMILE処理に失敗しました';
        statusDiv.textContent = `エラー: ${errorMessage}`;
        showNotification(errorMessage, 'error');
        
        // エラー詳細も表示
        if (resultsDiv && resultsContent) {
            resultsContent.textContent = `エラー詳細:\n${JSON.stringify(error.response?.data || error.message, null, 2)}`;
            resultsDiv.classList.remove('hidden');
        }
    } finally {
        button.disabled = false;
        button.textContent = '🎵 OpenSMILE処理開始';
        console.log('処理終了、UI復元完了');
    }
}

// =============================================================================
// OpenSMILE Aggregator処理
// =============================================================================

async function startOpenSMILEAggregator() {
    const deviceId = document.getElementById('aggregator-device-id').value;
    const date = document.getElementById('aggregator-date').value;
    const button = document.getElementById('start-aggregator-btn');
    const statusDiv = document.getElementById('aggregator-status');
    
    if (!deviceId || !date) {
        showNotification('デバイスIDと日付を入力してください', 'error');
        return;
    }
    
    button.disabled = true;
    button.textContent = '🔄 処理中...';
    statusDiv.textContent = 'OpenSMILE Aggregator処理を開始しています...';
    
    try {
        const response = await axios.post('/api/opensmile/aggregate-features', {
            device_id: deviceId,
            date: date
        });
        
        const data = response.data;
        if (data.has_data) {
            statusDiv.textContent = `OpenSMILE Aggregator処理完了: ${data.processed_slots}スロット処理、総感情ポイント: ${data.total_emotion_points}`;
            showNotification(`OpenSMILE Aggregator処理が完了しました（${data.processed_slots}スロット処理、${data.total_emotion_points}ポイント）`, 'success');
        } else {
            statusDiv.textContent = `OpenSMILE Aggregator処理完了: データが存在しません`;
            showNotification(`指定された日付にはデータが存在しません`, 'info');
        }
        
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
// スケジューラー機能
// =============================================================================

// スケジューラーの状態を管理するグローバル変数
let schedulerStates = {
    whisper: { enabled: false, interval: 1, nextRun: null },
    prompt: { enabled: false, interval: 1, nextRun: null },
    chatgpt: { enabled: false, interval: 1, nextRun: null }
};

function initializeSchedulers() {
    // 統一スケジューラーシステムを初期化
    initializeUnifiedSchedulers();
    
    // 既存の個別スケジューラー（非表示）
    updateSchedulerUI('prompt');
    updateSchedulerUI('chatgpt');
    
    // スケジューラーログの初期化
    loadSchedulerLogs('prompt');
    loadSchedulerLogs('chatgpt');
}

// ============================================================================= 
// 【非推奨】個別スケジューラー関数群（統一クラスに移行済み）
// 後方互換性のためコメントアウト保持
// =============================================================================

/*
function initializeWhisperTrialScheduler() {
    // 統一スケジューラーに移行済み - unifiedSchedulers.whisper.initialize()
    console.warn('⚠️ initializeWhisperTrialScheduler()は非推奨です。統一スケジューラーを使用してください。');
}
*/

function setupSchedulerEventListeners() {
    // Whisperスケジューラー
    const whisperToggle = document.getElementById('whisper-scheduler-toggle');
    const whisperInterval = document.getElementById('whisper-schedule-interval');
    
    if (whisperToggle) {
        whisperToggle.addEventListener('change', (e) => {
            toggleScheduler('whisper', e.target.checked);
        });
    }
    
    if (whisperInterval) {
        whisperInterval.addEventListener('change', (e) => {
            updateSchedulerInterval('whisper', parseInt(e.target.value));
        });
    }
    
    // Promptスケジューラー
    const promptToggle = document.getElementById('prompt-scheduler-toggle');
    const promptInterval = document.getElementById('prompt-schedule-interval');
    
    if (promptToggle) {
        promptToggle.addEventListener('change', (e) => {
            toggleScheduler('prompt', e.target.checked);
        });
    }
    
    if (promptInterval) {
        promptInterval.addEventListener('change', (e) => {
            updateSchedulerInterval('prompt', parseInt(e.target.value));
        });
    }
    
    // ChatGPTスケジューラー
    const chatgptToggle = document.getElementById('chatgpt-scheduler-toggle');
    const chatgptInterval = document.getElementById('chatgpt-schedule-interval');
    
    if (chatgptToggle) {
        chatgptToggle.addEventListener('change', (e) => {
            toggleScheduler('chatgpt', e.target.checked);
        });
    }
    
    if (chatgptInterval) {
        chatgptInterval.addEventListener('change', (e) => {
            updateSchedulerInterval('chatgpt', parseInt(e.target.value));
        });
    }
}

async function toggleScheduler(apiType, enabled) {
    const deviceId = getDeviceIdForAPI(apiType);
    if (!deviceId) {
        showNotification('デバイスIDを入力してください', 'error');
        return;
    }
    
    try {
        if (enabled) {
            // スケジューラーを開始
            const response = await fetch('/api/scheduler/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_type: apiType,
                    device_id: deviceId,
                    interval_hours: schedulerStates[apiType].interval,
                    enabled: true
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                schedulerStates[apiType].enabled = true;
                schedulerStates[apiType].nextRun = data.next_run;
                updateSchedulerUI(apiType);
                showSchedulerLogs(apiType);
                showNotification(`${apiType}スケジューラーを開始しました`, 'success');
            } else {
                throw new Error('スケジューラー開始に失敗しました');
            }
        } else {
            // スケジューラーを停止
            const response = await fetch('/api/scheduler/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_type: apiType,
                    device_id: deviceId
                })
            });
            
            if (response.ok) {
                schedulerStates[apiType].enabled = false;
                schedulerStates[apiType].nextRun = null;
                updateSchedulerUI(apiType);
                hideSchedulerLogs(apiType);
                showNotification(`${apiType}スケジューラーを停止しました`, 'success');
            } else {
                throw new Error('スケジューラー停止に失敗しました');
            }
        }
    } catch (error) {
        console.error('スケジューラー操作エラー:', error);
        showNotification(`スケジューラー操作エラー: ${error.message}`, 'error');
        
        // トグルを元に戻す
        const toggle = document.getElementById(`${apiType}-scheduler-toggle`);
        if (toggle) {
            toggle.checked = !enabled;
        }
    }
}

async function updateSchedulerInterval(apiType, intervalHours) {
    schedulerStates[apiType].interval = intervalHours;
    
    // スケジューラーが有効な場合は再起動
    if (schedulerStates[apiType].enabled) {
        const deviceId = getDeviceIdForAPI(apiType);
        if (deviceId) {
            await toggleScheduler(apiType, false);
            await toggleScheduler(apiType, true);
        }
    }
}

function updateSchedulerUI(apiType) {
    const nextRunDiv = document.getElementById(`${apiType}-next-run`);
    if (nextRunDiv) {
        if (schedulerStates[apiType].enabled && schedulerStates[apiType].nextRun) {
            const nextRun = new Date(schedulerStates[apiType].nextRun);
            nextRunDiv.textContent = nextRun.toLocaleString('ja-JP');
        } else {
            nextRunDiv.textContent = '未設定';
        }
    }
}

function getDeviceIdForAPI(apiType) {
    const deviceInputs = {
        whisper: 'whisper-device-id',
        prompt: 'prompt-device-id',
        chatgpt: 'chatgpt-device-id'
    };
    
    const input = document.getElementById(deviceInputs[apiType]);
    return input ? input.value.trim() : 'd067d407-cf73-4174-a9c1-d91fb60d64d0';
}

async function loadSchedulerLogs(apiType) {
    const deviceId = getDeviceIdForAPI(apiType);
    if (!deviceId) return;
    
    try {
        const response = await fetch(`/api/scheduler/logs?api_type=${apiType}&device_id=${deviceId}&limit=20`);
        if (response.ok) {
            const data = await response.json();
            displaySchedulerLogs(apiType, data.logs);
        }
    } catch (error) {
        console.error('スケジューラーログ取得エラー:', error);
    }
}

function displaySchedulerLogs(apiType, logs) {
    const logContent = document.getElementById(`${apiType}-scheduler-log-content`);
    if (!logContent) return;
    
    if (logs.length === 0) {
        logContent.textContent = 'スケジューラーログがありません';
        return;
    }
    
    const logText = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('ja-JP');
        const duration = log.duration_seconds ? ` (${log.duration_seconds.toFixed(1)}秒)` : '';
        return `[${timestamp}] ${log.status}: ${log.message}${duration}`;
    }).join('\n');
    
    logContent.textContent = logText;
}

function showSchedulerLogs(apiType) {
    const logsDiv = document.getElementById(`${apiType}-scheduler-logs`);
    if (logsDiv) {
        logsDiv.classList.remove('hidden');
        loadSchedulerLogs(apiType);
    }
}

function hideSchedulerLogs(apiType) {
    const logsDiv = document.getElementById(`${apiType}-scheduler-logs`);
    if (logsDiv) {
        logsDiv.classList.add('hidden');
    }
}

// 定期的にスケジューラーログを更新
setInterval(() => {
    Object.keys(schedulerStates).forEach(apiType => {
        if (schedulerStates[apiType].enabled) {
            loadSchedulerLogs(apiType);
        }
    });
}, 30000); // 30秒毎に更新

// =============================================================================
// Whisper試験版スケジューラー関数
// =============================================================================

/*
// 【非推奨】統一クラス UnifiedTrialSchedulerManager.updateStatus() に移行済み
async function updateWhisperTrialSchedulerStatus() {
    console.warn('⚠️ updateWhisperTrialSchedulerStatus()は非推奨です。unifiedSchedulers.whisper.updateStatus()を使用してください。');
}
*/

/*
// 【非推奨】統一クラス UnifiedTrialSchedulerManager.toggle() に移行済み
async function toggleWhisperTrialScheduler(enabled) {
    console.warn('⚠️ toggleWhisperTrialScheduler()は非推奨です。unifiedSchedulers.whisper.toggle()を使用してください。');
}
*/

async function runWhisperTrialSchedulerNow() {
    try {
        const button = document.getElementById('whisper-trial-run-now-btn');
        if (button) {
            button.disabled = true;
            button.textContent = '実行中...';
        }
        
        const response = await axios.post('/api/whisper-trial-scheduler/run-now');
        
        if (response.data.success) {
            showNotification(response.data.message, 'success');
        } else {
            showNotification('処理の実行に失敗しました', 'error');
        }
        
        // 状態を更新
        setTimeout(() => {
            updateWhisperTrialSchedulerStatus();
        }, 1000);
        
    } catch (error) {
        console.error('Whisper試験版スケジューラー即時実行エラー:', error);
        showNotification('処理の実行に失敗しました', 'error');
    } finally {
        const button = document.getElementById('whisper-trial-run-now-btn');
        if (button) {
            button.disabled = false;
            button.textContent = '今すぐ実行';
        }
    }
}

async function processWhisper24Hours() {
    try {
        const button = document.getElementById('whisper-process-24hours-btn');
        if (button) {
            button.disabled = true;
            button.textContent = '処理中...';
        }
        
        showNotification('過去24時間分の処理を開始します', 'info');
        
        // 過去24時間分を処理するAPIを呼び出す（既存のrun-nowエンドポイントを使用）
        const response = await axios.post('/api/whisper-trial-scheduler/run-now');
        
        if (response.data.success) {
            showNotification('過去24時間分の処理を開始しました', 'success');
        } else {
            showNotification('処理の開始に失敗しました', 'error');
        }
        
        // 状態を更新
        setTimeout(() => {
            updateWhisperTrialSchedulerStatus();
        }, 1000);
        
    } catch (error) {
        console.error('過去24時間分処理エラー:', error);
        showNotification('処理の開始に失敗しました', 'error');
    } finally {
        const button = document.getElementById('whisper-process-24hours-btn');
        if (button) {
            button.disabled = false;
            button.textContent = '過去24時間分を処理';
        }
    }
}

/*
// 【非推奨】統一クラスで自動管理されるため削除
// setInterval(updateWhisperTrialSchedulerStatus, 30000);
*/

// =============================================================================
// 【非推奨】SED試験版スケジューラー個別関数群（統一クラスに移行済み）
// =============================================================================

/*
// 【非推奨】統一クラス UnifiedTrialSchedulerManager.initialize() に移行済み  
function initializeSEDTrialScheduler() {
    console.warn('⚠️ initializeSEDTrialScheduler()は非推奨です。統一スケジューラーを使用してください。');
}
*/

async function updateSEDTrialSchedulerStatus() {
    try {
        const response = await axios.get('/api/sed-trial-scheduler/status');
        const status = response.data;
        
        // UI更新
        const toggle = document.getElementById('sed-trial-scheduler-toggle');
        const statusText = document.getElementById('sed-trial-status-text');
        const logsContainer = document.getElementById('sed-trial-logs');
        
        if (toggle) {
            toggle.checked = status.is_running;
        }
        
        if (statusText) {
            statusText.textContent = status.is_running ? '稼働中' : '停止中';
            statusText.className = status.is_running ? 'text-green-600' : 'text-gray-500';
        }
        
        // ログ表示
        if (logsContainer && status.logs) {
            const logHtml = status.logs.map(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                let colorClass = 'text-gray-600';
                
                switch (log.status) {
                    case 'success':
                        colorClass = 'text-green-600';
                        break;
                    case 'error':
                        colorClass = 'text-red-600';
                        break;
                    case 'warning':
                        colorClass = 'text-yellow-600';
                        break;
                    case 'info':
                        colorClass = 'text-blue-600';
                        break;
                }
                
                return `<div class="text-xs ${colorClass} font-mono">
                    ${time} - ${log.message}
                </div>`;
            }).join('');
            
            logsContainer.innerHTML = logHtml;
        }
        
        console.log('SED試験版スケジューラー状態更新完了:', status);
        
    } catch (error) {
        console.error('SED試験版スケジューラー状態取得エラー:', error);
    }
}

async function toggleSEDTrialScheduler(enabled) {
    try {
        const endpoint = enabled ? '/api/sed-trial-scheduler/start' : '/api/sed-trial-scheduler/stop';
        const response = await axios.post(endpoint);
        
        if (response.data.success) {
            showNotification(response.data.message, 'success');
            // 状態を更新
            setTimeout(() => {
                updateSEDTrialSchedulerStatus();
            }, 500);
        } else {
            showNotification(response.data.message, 'warning');
            // トグルを元に戻す
            const toggle = document.getElementById('sed-trial-scheduler-toggle');
            if (toggle) {
                toggle.checked = !enabled;
            }
        }
        
    } catch (error) {
        console.error('SED試験版スケジューラー操作エラー:', error);
        showNotification('スケジューラー操作に失敗しました', 'error');
        
        // トグルを元に戻す
        const toggle = document.getElementById('sed-trial-scheduler-toggle');
        if (toggle) {
            toggle.checked = !enabled;
        }
    }
}

async function runSEDTrialSchedulerNow() {
    try {
        const button = document.getElementById('sed-trial-run-now-btn');
        if (button) {
            button.disabled = true;
            button.textContent = '実行中...';
        }
        
        const response = await axios.post('/api/sed-trial-scheduler/run-now');
        
        if (response.data.success) {
            showNotification(response.data.message, 'success');
        } else {
            showNotification('処理の実行に失敗しました', 'error');
        }
        
        // 状態を更新
        setTimeout(() => {
            updateSEDTrialSchedulerStatus();
        }, 1000);
        
    } catch (error) {
        console.error('SED試験版スケジューラー即時実行エラー:', error);
        showNotification('処理の実行に失敗しました', 'error');
    } finally {
        const button = document.getElementById('sed-trial-run-now-btn');
        if (button) {
            button.disabled = false;
            button.textContent = '今すぐ実行';
        }
    }
}

async function processSED24Hours() {
    try {
        const button = document.getElementById('sed-process-24hours-btn');
        if (button) {
            button.disabled = true;
            button.textContent = '処理中...';
        }
        
        showNotification('過去24時間分の処理を開始します', 'info');
        
        // 過去24時間分を処理するAPIを呼び出す（既存のrun-nowエンドポイントを使用）
        const response = await axios.post('/api/sed-trial-scheduler/run-now');
        
        if (response.data.success) {
            showNotification('過去24時間分の処理を開始しました', 'success');
        } else {
            showNotification('処理の開始に失敗しました', 'error');
        }
        
        // 状態を更新
        setTimeout(() => {
            updateSEDTrialSchedulerStatus();
        }, 1000);
        
    } catch (error) {
        console.error('過去24時間分処理エラー:', error);
        showNotification('処理の開始に失敗しました', 'error');
    } finally {
        const button = document.getElementById('sed-process-24hours-btn');
        if (button) {
            button.disabled = false;
            button.textContent = '過去24時間分を処理';
        }
    }
}

/*
// 【非推奨】統一クラスで自動管理されるため削除
// setInterval(updateSEDTrialSchedulerStatus, 30000);
*/

// =============================================================================
// 統一スケジューラー管理クラス（フロントエンド共通化）
// =============================================================================

class UnifiedTrialSchedulerManager {
    /**
     * 統一された試験版スケジューラー管理クラス
     * @param {string} apiName - API名 (whisper, sed, opensmile)
     * @param {Object} config - 設定オブジェクト
     */
    constructor(apiName, config) {
        this.apiName = apiName;
        this.config = {
            color: config.color || 'blue',
            displayName: config.displayName || apiName.toUpperCase(),
            icon: config.icon || '🧪',
            ...config
        };
        
        // DOM要素ID（命名規則ベース）
        this.elements = {
            toggle: `${apiName}-trial-scheduler-toggle`,
            statusText: `${apiName}-trial-status-text`,
            logsContainer: `${apiName}-trial-logs`,
            runNowBtn: `${apiName}-process-24hours-btn`
        };
        
        // API エンドポイント
        this.endpoints = {
            status: `/api/${apiName}-trial-scheduler/status`,
            start: `/api/${apiName}-trial-scheduler/start`,
            stop: `/api/${apiName}-trial-scheduler/stop`,
            runNow: `/api/${apiName}-trial-scheduler/run-now`
        };
        
        // 状態更新間隔を設定
        this.statusUpdateInterval = null;
    }
    
    /**
     * スケジューラーを初期化
     */
    initialize() {
        console.log(`${this.config.displayName}試験版スケジューラー初期化開始...`);
        
        // 初期状態更新
        this.updateStatus();
        
        // イベントリスナー設定
        this.setupEventListeners();
        
        // 定期的な状態更新開始
        this.startStatusUpdates();
        
        console.log(`${this.config.displayName}試験版スケジューラー初期化完了`);
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // トグルスイッチ
        const toggle = document.getElementById(this.elements.toggle);
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                await this.toggle(e.target.checked);
            });
        }
        
        // 手動実行ボタン
        const runNowBtn = document.getElementById(this.elements.runNowBtn);
        if (runNowBtn) {
            runNowBtn.addEventListener('click', async () => {
                await this.runNow();
            });
        }
    }
    
    /**
     * スケジューラーの状態を更新
     */
    async updateStatus() {
        try {
            const response = await axios.get(this.endpoints.status);
            const status = response.data;
            
            // UI要素を更新
            this.updateToggle(status.is_running);
            this.updateStatusText(status.is_running);
            this.updateLogs(status.logs);
            
        } catch (error) {
            console.error(`${this.config.displayName}試験版スケジューラー状態取得エラー:`, error);
        }
    }
    
    /**
     * トグルスイッチの状態を更新
     */
    updateToggle(isRunning) {
        const toggle = document.getElementById(this.elements.toggle);
        if (toggle) {
            toggle.checked = isRunning;
        }
    }
    
    /**
     * ステータステキストを更新
     */
    updateStatusText(isRunning) {
        const statusText = document.getElementById(this.elements.statusText);
        if (statusText) {
            statusText.textContent = isRunning ? '稼働中' : '停止中';
            statusText.className = isRunning ? 'text-green-600' : 'text-gray-500';
        }
    }
    
    /**
     * ログを更新
     */
    updateLogs(logs) {
        const logsContainer = document.getElementById(this.elements.logsContainer);
        if (logsContainer && logs) {
            const logHtml = logs.map(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const colorClass = this.getLogColorClass(log.status);
                
                return `<div class="text-xs ${colorClass} font-mono">
                    ${time} - ${log.message}
                </div>`;
            }).join('');
            
            logsContainer.innerHTML = logHtml;
        }
    }
    
    /**
     * ログステータスに応じた色クラスを取得
     */
    getLogColorClass(status) {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            case 'info': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    }
    
    /**
     * スケジューラーのON/OFF切り替え
     */
    async toggle(enabled) {
        try {
            const endpoint = enabled ? this.endpoints.start : this.endpoints.stop;
            const response = await axios.post(endpoint);
            
            if (response.data.success) {
                showNotification(response.data.message, 'success');
                // 状態を更新
                setTimeout(() => {
                    this.updateStatus();
                }, 500);
            } else {
                showNotification(response.data.message, 'warning');
                // トグルを元に戻す
                this.updateToggle(!enabled);
            }
            
        } catch (error) {
            console.error(`${this.config.displayName}スケジューラー切り替えエラー:`, error);
            const errorMessage = error.response?.data?.detail || error.message || `${this.config.displayName}スケジューラー操作に失敗しました`;
            showNotification(errorMessage, 'error');
            
            // トグルを元に戻す
            this.updateToggle(!enabled);
        }
    }
    
    /**
     * 手動実行（24時間処理）
     */
    async runNow() {
        try {
            const runNowBtn = document.getElementById(this.elements.runNowBtn);
            if (runNowBtn) {
                runNowBtn.disabled = true;
                runNowBtn.textContent = '実行中...';
            }
            
            const response = await axios.post(this.endpoints.runNow);
            
            if (response.data.success) {
                showNotification(`${this.config.displayName}24時間処理を開始しました`, 'success');
                // 状態を更新
                setTimeout(() => {
                    this.updateStatus();
                }, 1000);
            } else {
                showNotification(response.data.message, 'warning');
            }
            
        } catch (error) {
            console.error(`${this.config.displayName}手動実行エラー:`, error);
            const errorMessage = error.response?.data?.detail || error.message || `${this.config.displayName}手動実行に失敗しました`;
            showNotification(errorMessage, 'error');
        } finally {
            const runNowBtn = document.getElementById(this.elements.runNowBtn);
            if (runNowBtn) {
                runNowBtn.disabled = false;
                runNowBtn.textContent = `📈 ${this.config.displayName}24時間処理`;
            }
        }
    }
    
    /**
     * 定期的な状態更新を開始
     */
    startStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, 30000); // 30秒毎
    }
    
    /**
     * 定期的な状態更新を停止
     */
    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }
}

// =============================================================================
// スケジューラー設定とインスタンス作成
// =============================================================================

// スケジューラー設定
const schedulerConfigs = {
    whisper: {
        color: 'blue',
        displayName: 'Whisper',
        icon: '🎤'
    },
    sed: {
        color: 'orange', 
        displayName: 'SED',
        icon: '🎵'
    },
    opensmile: {
        color: 'green',
        displayName: 'OpenSMILE',
        icon: '🎵'
    }
};

// 統一スケジューラーインスタンス
const unifiedSchedulers = {};

// 統一スケジューラーの初期化関数
function initializeUnifiedSchedulers() {
    console.log('統一スケジューラーシステム初期化開始...');
    
    // 各スケジューラーを初期化
    Object.keys(schedulerConfigs).forEach(apiName => {
        const config = schedulerConfigs[apiName];
        unifiedSchedulers[apiName] = new UnifiedTrialSchedulerManager(apiName, config);
        unifiedSchedulers[apiName].initialize();
    });
    
    console.log('統一スケジューラーシステム初期化完了');
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