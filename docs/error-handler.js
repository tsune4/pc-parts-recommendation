// Error Handling Module
class ErrorHandler {
    constructor() {
        this.errorCodes = {
            BUDGET_TOO_LOW: 'BUDGET_TOO_LOW',
            PARTS_NOT_FOUND: 'PARTS_NOT_FOUND',
            INCOMPATIBLE_PARTS: 'INCOMPATIBLE_PARTS',
            DATA_LOADING_ERROR: 'DATA_LOADING_ERROR',
            NETWORK_ERROR: 'NETWORK_ERROR',
            VALIDATION_ERROR: 'VALIDATION_ERROR',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };
        
        this.setupGlobalErrorHandling();
    }

    /**
     * グローバルエラーハンドリングのセットアップ
     */
    setupGlobalErrorHandling() {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.logError('Global Error:', event.error);
        });

        // Promise のリジェクションをキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection:', event.reason);
            event.preventDefault();
        });
    }

    /**
     * エラー処理
     * @param {Error} error - エラーオブジェクト
     * @param {string} context - コンテキスト
     * @returns {Object} - {code, message, userMessage}
     */
    handleError(error, context = '') {
        const errorInfo = this.categorizeError(error);
        
        // ログ出力
        this.logError(`[${context}] ${errorInfo.code}:`, error);
        
        // ユーザー向けメッセージ生成
        const userMessage = this.generateUserMessage(errorInfo.code, error);
        
        return {
            code: errorInfo.code,
            message: error.message || 'Unknown error',
            userMessage,
            context,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * エラーの分類
     * @param {Error} error - エラーオブジェクト
     * @returns {Object} - {code, category}
     */
    categorizeError(error) {
        const message = error.message?.toLowerCase() || '';
        
        // 予算関連エラー
        if (message.includes('予算') && (message.includes('少ない') || message.includes('不足'))) {
            return { code: this.errorCodes.BUDGET_TOO_LOW, category: 'validation' };
        }
        
        // パーツ不足エラー
        if (message.includes('見つかりません') || message.includes('not found')) {
            return { code: this.errorCodes.PARTS_NOT_FOUND, category: 'data' };
        }
        
        // 互換性エラー
        if (message.includes('互換') || message.includes('compatible')) {
            return { code: this.errorCodes.INCOMPATIBLE_PARTS, category: 'logic' };
        }
        
        // データロードエラー
        if (message.includes('データ') && message.includes('読み込み')) {
            return { code: this.errorCodes.DATA_LOADING_ERROR, category: 'data' };
        }
        
        // ネットワークエラー
        if (message.includes('network') || message.includes('fetch')) {
            return { code: this.errorCodes.NETWORK_ERROR, category: 'network' };
        }
        
        // バリデーションエラー
        if (message.includes('validation') || message.includes('invalid')) {
            return { code: this.errorCodes.VALIDATION_ERROR, category: 'validation' };
        }
        
        // 不明なエラー
        return { code: this.errorCodes.UNKNOWN_ERROR, category: 'unknown' };
    }

    /**
     * ユーザー向けメッセージ生成
     * @param {string} errorCode - エラーコード
     * @param {Error} originalError - 元のエラー
     * @returns {string} - ユーザー向けメッセージ
     */
    generateUserMessage(errorCode, originalError) {
        const messages = {
            [this.errorCodes.BUDGET_TOO_LOW]: '設定された予算では適切な構成を作成できません。予算を増やすか、要求スペックを下げてください。',
            [this.errorCodes.PARTS_NOT_FOUND]: '指定された条件に合うパーツが見つかりません。条件を変更して再度お試しください。',
            [this.errorCodes.INCOMPATIBLE_PARTS]: 'パーツ間の互換性に問題があります。システムが自動で調整を試みましたが、構成を確認してください。',
            [this.errorCodes.DATA_LOADING_ERROR]: 'パーツデータの読み込みに失敗しました。ページを再読み込みしてください。',
            [this.errorCodes.NETWORK_ERROR]: 'ネットワーク接続に問題があります。接続を確認して再度お試しください。',
            [this.errorCodes.VALIDATION_ERROR]: '入力された値に問題があります。入力内容を確認してください。',
            [this.errorCodes.UNKNOWN_ERROR]: '予期しないエラーが発生しました。ページを再読み込みして再度お試しください。'
        };
        
        return messages[errorCode] || messages[this.errorCodes.UNKNOWN_ERROR];
    }

    /**
     * エラーログ出力
     * @param {string} message - メッセージ
     * @param {Error} error - エラーオブジェクト
     */
    logError(message, error) {
        console.group(`🔴 ${message}`);
        console.error('Error:', error);
        
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        
        console.error('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }

    /**
     * バリデーションエラー処理
     * @param {Array} validationErrors - バリデーションエラー配列
     * @returns {string} - 統合エラーメッセージ
     */
    handleValidationErrors(validationErrors) {
        if (!validationErrors || validationErrors.length === 0) {
            return null;
        }
        
        const errorMessages = validationErrors.map(error => {
            if (typeof error === 'string') {
                return error;
            } else if (error.message) {
                return error.message;
            }
            return '入力エラーが発生しました';
        });
        
        return errorMessages.join('\n');
    }

    /**
     * パフォーマンス警告
     * @param {string} operation - 操作名
     * @param {number} duration - 実行時間（ms）
     */
    warnPerformance(operation, duration) {
        const threshold = 1000; // 1秒
        
        if (duration > threshold) {
            console.warn(`⚠️ Performance Warning: ${operation} took ${duration}ms`);
        }
    }

    /**
     * デバッグ情報出力
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    debug(message, data = null) {
        if (typeof RecommendationConfig !== 'undefined' && RecommendationConfig.DEBUG?.ENABLE_CONSOLE_LOG) {
            console.log(`🐛 ${message}`, data);
        }
    }

    /**
     * 成功ログ出力
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    logSuccess(message, data = null) {
        console.log(`✅ ${message}`, data || '');
    }

    /**
     * 警告ログ出力
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    logWarning(message, data = null) {
        console.warn(`⚠️ ${message}`, data || '');
    }

    /**
     * 情報ログ出力
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    logInfo(message, data = null) {
        console.info(`ℹ️ ${message}`, data || '');
    }
}

// カスタムエラークラス
class PCRecommendationError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
        super(message);
        this.name = 'PCRecommendationError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class BudgetError extends PCRecommendationError {
    constructor(message, budget, requiredBudget = null) {
        super(message, 'BUDGET_TOO_LOW', { budget, requiredBudget });
        this.name = 'BudgetError';
    }
}

class PartsNotFoundError extends PCRecommendationError {
    constructor(message, partType, criteria = {}) {
        super(message, 'PARTS_NOT_FOUND', { partType, criteria });
        this.name = 'PartsNotFoundError';
    }
}

class CompatibilityError extends PCRecommendationError {
    constructor(message, incompatibleParts = {}) {
        super(message, 'INCOMPATIBLE_PARTS', { incompatibleParts });
        this.name = 'CompatibilityError';
    }
}

// グローバルエラーハンドラーインスタンス
const errorHandler = new ErrorHandler();