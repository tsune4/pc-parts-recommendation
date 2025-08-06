// Main Application Script - Refactored Version
class PCRecommendationApp {
    constructor() {
        this.domManager = null;
        this.errorHandler = null;
        this.performanceOptimizer = null;
        this.initialized = false;
        
        // アプリケーション設定
        this.config = {
            debounceDelay: 300,
            autoSave: true,
            enablePerformanceLogging: false
        };
    }

    /**
     * アプリケーション初期化
     */
    async init() {
        try {
            console.log('🚀 PC Recommendation App initializing...');
            
            // 依存関係の初期化
            await this.initializeDependencies();
            
            // DOM管理初期化
            this.domManager = new DOMManager();
            
            // 設定復元
            this.restoreSettings();
            
            // パフォーマンス監視開始
            this.startPerformanceMonitoring();
            
            this.initialized = true;
            console.log('✅ PC Recommendation App initialized successfully');
            
        } catch (error) {
            const errorInfo = this.errorHandler.handleError(error, 'App Initialization');
            console.error('❌ App initialization failed:', errorInfo);
            this.showInitializationError(errorInfo.userMessage);
        }
    }

    /**
     * 依存関係の初期化
     */
    async initializeDependencies() {
        // エラーハンドラー初期化
        if (typeof ErrorHandler !== 'undefined') {
            this.errorHandler = new ErrorHandler();
        } else {
            throw new Error('ErrorHandler not loaded');
        }

        // パフォーマンス最適化初期化
        if (typeof PerformanceOptimizer !== 'undefined') {
            this.performanceOptimizer = new PerformanceOptimizer();
        } else {
            this.errorHandler.logWarning('PerformanceOptimizer not available');
        }

        // パーツデータの存在確認
        if (typeof PARTS_DATA === 'undefined') {
            throw new Error('Parts data not loaded');
        }

        // 推奨エンジンの存在確認
        if (typeof getRecommendations !== 'function') {
            throw new Error('Recommendation engine not loaded');
        }
    }

    /**
     * 設定復元
     */
    restoreSettings() {
        try {
            const savedSettings = localStorage.getItem('pcRecommendationSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // フォーム値復元
                if (this.domManager && settings.formValues) {
                    this.domManager.setFormValues(settings.formValues);
                }
                
                // アプリ設定復元
                if (settings.appConfig) {
                    this.config = { ...this.config, ...settings.appConfig };
                }
                
                this.errorHandler.logInfo('Settings restored from localStorage');
            }
        } catch (error) {
            this.errorHandler.logWarning('Failed to restore settings:', error);
        }
    }

    /**
     * 設定保存
     */
    saveSettings() {
        if (!this.config.autoSave || !this.domManager) return;
        
        try {
            const settings = {
                formValues: this.domManager.getFormData?.() || {},
                appConfig: this.config,
                timestamp: Date.now()
            };
            
            localStorage.setItem('pcRecommendationSettings', JSON.stringify(settings));
            this.errorHandler.logInfo('Settings saved to localStorage');
        } catch (error) {
            this.errorHandler.logWarning('Failed to save settings:', error);
        }
    }

    /**
     * パフォーマンス監視開始
     */
    startPerformanceMonitoring() {
        if (!this.performanceOptimizer || !this.config.enablePerformanceLogging) return;

        // 定期的なパフォーマンスレポート
        setInterval(() => {
            const suggestions = this.performanceOptimizer.getOptimizationSuggestions();
            if (suggestions.length > 0) {
                console.group('🔧 Performance Suggestions');
                suggestions.forEach(suggestion => {
                    console.log(`${suggestion.type}: ${suggestion.message}`);
                });
                console.groupEnd();
            }
        }, 60000); // 1分間隔
    }

    /**
     * 初期化エラー表示
     * @param {string} message - エラーメッセージ
     */
    showInitializationError(message) {
        const errorHtml = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff6b6b;
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
            ">
                <h3>アプリケーションの初期化に失敗しました</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #ff6b6b;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">ページを再読み込み</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHtml);
    }

    /**
     * 診断情報取得
     * @returns {Object} - 診断情報
     */
    getDiagnostics() {
        return {
            initialized: this.initialized,
            config: this.config,
            performance: this.performanceOptimizer?.getStats() || null,
            memory: this.performanceOptimizer?.getMemoryUsage() || null,
            errors: this.errorHandler?.getRecentErrors?.() || [],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * デバッグモード切り替え
     * @param {boolean} enabled - デバッグモード有効化
     */
    setDebugMode(enabled) {
        this.config.enablePerformanceLogging = enabled;
        
        if (enabled) {
            console.log('🐛 Debug mode enabled');
            // デバッグ用のグローバル変数設定
            window.appDiagnostics = () => this.getDiagnostics();
            window.performanceReport = () => this.performanceOptimizer?.printReport();
        } else {
            console.log('Debug mode disabled');
            delete window.appDiagnostics;
            delete window.performanceReport;
        }
    }

    /**
     * アプリケーション終了処理
     */
    cleanup() {
        console.log('🧹 Cleaning up PC Recommendation App...');
        
        // 設定保存
        this.saveSettings();
        
        // タイマーキャンセル
        if (this.performanceOptimizer) {
            this.performanceOptimizer.cancelAllTimers();
        }
        
        // キャッシュクリア
        if (this.performanceOptimizer) {
            this.performanceOptimizer.clearCache();
        }
        
        console.log('✅ Cleanup completed');
    }

    /**
     * 健康チェック
     * @returns {Object} - 健康状態
     */
    healthCheck() {
        const health = {
            status: 'healthy',
            checks: {
                initialized: this.initialized,
                domManager: !!this.domManager,
                errorHandler: !!this.errorHandler,
                performanceOptimizer: !!this.performanceOptimizer,
                partsData: typeof PARTS_DATA !== 'undefined',
                recommendationEngine: typeof getRecommendations === 'function'
            }
        };
        
        // 問題がある場合はステータス変更
        const failedChecks = Object.entries(health.checks)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
            
        if (failedChecks.length > 0) {
            health.status = 'unhealthy';
            health.failedChecks = failedChecks;
        }
        
        return health;
    }
}

// アプリケーションインスタンス
let pcApp;

/**
 * アプリケーション初期化関数（レガシー互換性）
 */
function initializeApp() {
    if (!pcApp) {
        pcApp = new PCRecommendationApp();
    }
    
    return pcApp.init();
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', initializeApp);

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (pcApp) {
        pcApp.cleanup();
    }
});

// 開発者向けコンソール関数
if (typeof window !== 'undefined') {
    window.enableDebugMode = () => pcApp?.setDebugMode(true);
    window.disableDebugMode = () => pcApp?.setDebugMode(false);
    window.getAppHealth = () => pcApp?.healthCheck();
}

// エラー回復機能
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && pcApp) {
        const health = pcApp.healthCheck();
        if (health.status === 'unhealthy') {
            console.warn('⚠️ App health check failed, attempting recovery...');
            initializeApp();
        }
    }
});

// レガシー関数サポート（既存のscript.jsとの互換性）
function handleUsageChange(usageValue) {
    if (pcApp?.domManager) {
        pcApp.domManager.adjustUIForUsage(usageValue);
    }
}

// パフォーマンス最適化されたフォーム処理
const debouncedFormValidation = debounce((formData) => {
    // フォームバリデーション処理
    const errors = pcApp?.domManager?.getValidationErrors() || [];
    if (errors.length > 0) {
        console.log('Validation errors:', errors);
    }
}, 300, 'formValidation');

// グローバル関数として公開（下位互換性）
if (typeof window !== 'undefined') {
    window.pcApp = pcApp;
    window.initializeApp = initializeApp;
    window.handleUsageChange = handleUsageChange;
}