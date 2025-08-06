// Performance Optimization Module
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.performanceMetrics = new Map();
        this.maxCacheSize = 1000;
        this.defaultDebounceDelay = 300;
    }

    /**
     * メモ化デコレータ
     * @param {Function} fn - メモ化する関数
     * @param {Function} keyGenerator - キー生成関数
     * @param {number} ttl - TTL（ミリ秒）
     * @returns {Function} - メモ化された関数
     */
    memoize(fn, keyGenerator = null, ttl = 300000) { // デフォルト5分
        return (...args) => {
            const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
            const cacheKey = `${fn.name}_${key}`;
            
            // キャッシュチェック
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < ttl) {
                this.recordHit('cache', cacheKey);
                return cached.value;
            }
            
            // 関数実行
            const startTime = performance.now();
            const result = fn(...args);
            const duration = performance.now() - startTime;
            
            // キャッシュ保存
            this.cache.set(cacheKey, {
                value: result,
                timestamp: Date.now()
            });
            
            // キャッシュサイズ管理
            this.manageCache();
            
            // パフォーマンス記録
            this.recordMetric(fn.name, duration);
            
            return result;
        };
    }

    /**
     * デバウンス
     * @param {Function} fn - デバウンスする関数
     * @param {number} delay - 遅延時間（ミリ秒）
     * @param {string} key - 識別キー
     * @returns {Function} - デバウンス済み関数
     */
    debounce(fn, delay = this.defaultDebounceDelay, key = fn.name) {
        return (...args) => {
            // 既存のタイマーをクリア
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            // 新しいタイマー設定
            const timer = setTimeout(() => {
                fn(...args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    /**
     * スロットル
     * @param {Function} fn - スロットルする関数
     * @param {number} interval - 間隔（ミリ秒）
     * @param {string} key - 識別キー
     * @returns {Function} - スロットル済み関数
     */
    throttle(fn, interval = 1000, key = fn.name) {
        let lastCall = 0;
        
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= interval) {
                lastCall = now;
                return fn(...args);
            }
        };
    }

    /**
     * バッチ処理
     * @param {Array} items - 処理するアイテム配列
     * @param {Function} processor - 処理関数
     * @param {number} batchSize - バッチサイズ
     * @param {number} delay - バッチ間の遅延
     * @returns {Promise} - 処理完了Promise
     */
    async batchProcess(items, processor, batchSize = 50, delay = 10) {
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const startTime = performance.now();
            
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
            );
            
            results.push(...batchResults);
            
            const duration = performance.now() - startTime;
            this.recordMetric('batchProcess', duration);
            
            // 次のバッチまで待機
            if (i + batchSize < items.length) {
                await this.delay(delay);
            }
        }
        
        return results;
    }

    /**
     * 遅延実行
     * @param {number} ms - 遅延時間（ミリ秒）
     * @returns {Promise} - 遅延Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * パフォーマンス測定デコレータ
     * @param {Function} fn - 測定する関数
     * @returns {Function} - 測定機能付き関数
     */
    measure(fn) {
        return (...args) => {
            const startTime = performance.now();
            const result = fn(...args);
            const duration = performance.now() - startTime;
            
            this.recordMetric(fn.name, duration);
            
            // 長時間実行の警告
            if (duration > 1000) {
                console.warn(`⚠️ Performance Warning: ${fn.name} took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        };
    }

    /**
     * メトリクス記録
     * @param {string} operation - 操作名
     * @param {number} duration - 実行時間
     */
    recordMetric(operation, duration) {
        if (!this.performanceMetrics.has(operation)) {
            this.performanceMetrics.set(operation, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                maxTime: 0,
                minTime: Infinity
            });
        }
        
        const metric = this.performanceMetrics.get(operation);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        metric.maxTime = Math.max(metric.maxTime, duration);
        metric.minTime = Math.min(metric.minTime, duration);
    }

    /**
     * ヒット記録（キャッシュ等）
     * @param {string} type - タイプ
     * @param {string} key - キー
     */
    recordHit(type, key) {
        const hitKey = `${type}_hits`;
        if (!this.performanceMetrics.has(hitKey)) {
            this.performanceMetrics.set(hitKey, { count: 0 });
        }
        
        this.performanceMetrics.get(hitKey).count++;
    }

    /**
     * キャッシュ管理
     */
    manageCache() {
        if (this.cache.size > this.maxCacheSize) {
            // LRU（最も長く使われていない）キーを削除
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * パフォーマンス統計取得
     * @returns {Object} - パフォーマンス統計
     */
    getStats() {
        const stats = {};
        
        for (const [operation, metric] of this.performanceMetrics) {
            stats[operation] = {
                ...metric,
                avgTime: parseFloat(metric.avgTime?.toFixed(2) || 0),
                maxTime: parseFloat(metric.maxTime?.toFixed(2) || 0),
                minTime: parseFloat(metric.minTime === Infinity ? 0 : metric.minTime.toFixed(2))
            };
        }
        
        stats.cacheSize = this.cache.size;
        stats.maxCacheSize = this.maxCacheSize;
        stats.cacheHitRate = this.calculateCacheHitRate();
        
        return stats;
    }

    /**
     * キャッシュヒット率計算
     * @returns {number} - ヒット率（%）
     */
    calculateCacheHitRate() {
        const hits = this.performanceMetrics.get('cache_hits')?.count || 0;
        const total = Array.from(this.performanceMetrics.values())
            .filter(metric => metric.count)
            .reduce((sum, metric) => sum + metric.count, 0);
        
        return total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
    }

    /**
     * メトリクスリセット
     */
    resetMetrics() {
        this.performanceMetrics.clear();
    }

    /**
     * キャッシュクリア
     * @param {string} prefix - 特定のプレフィックスのみクリア（オプション）
     */
    clearCache(prefix = null) {
        if (prefix) {
            for (const key of this.cache.keys()) {
                if (key.startsWith(prefix)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * 全タイマーキャンセル
     */
    cancelAllTimers() {
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
    }

    /**
     * メモリ使用量取得（サポートされている場合）
     * @returns {Object|null} - メモリ情報
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * パフォーマンスレポート出力
     */
    printReport() {
        console.group('📊 Performance Report');
        
        const stats = this.getStats();
        console.table(stats);
        
        const memory = this.getMemoryUsage();
        if (memory) {
            console.log('💾 Memory Usage:', {
                used: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
                total: `${(memory.total / 1024 / 1024).toFixed(2)} MB`,
                limit: `${(memory.limit / 1024 / 1024).toFixed(2)} MB`
            });
        }
        
        console.groupEnd();
    }

    /**
     * 自動最適化提案
     * @returns {Array} - 最適化提案配列
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        const stats = this.getStats();
        
        // 長時間実行操作の検出
        for (const [operation, metric] of Object.entries(stats)) {
            if (metric.avgTime > 500) {
                suggestions.push({
                    type: 'performance',
                    message: `${operation} の実行時間が長い（平均${metric.avgTime}ms）。最適化を検討してください。`
                });
            }
        }
        
        // キャッシュヒット率の確認
        if (stats.cacheHitRate < 50) {
            suggestions.push({
                type: 'cache',
                message: `キャッシュヒット率が低い（${stats.cacheHitRate}%）。キー生成戦略の見直しを検討してください。`
            });
        }
        
        // メモリ使用量チェック
        const memory = this.getMemoryUsage();
        if (memory && (memory.used / memory.limit) > 0.8) {
            suggestions.push({
                type: 'memory',
                message: 'メモリ使用量が多い。不要なキャッシュのクリアを検討してください。'
            });
        }
        
        return suggestions;
    }
}

// グローバルインスタンス
const performanceOptimizer = new PerformanceOptimizer();

// 便利関数のエクスポート
const memoize = (fn, keyGenerator, ttl) => performanceOptimizer.memoize(fn, keyGenerator, ttl);
const debounce = (fn, delay, key) => performanceOptimizer.debounce(fn, delay, key);
const throttle = (fn, interval, key) => performanceOptimizer.throttle(fn, interval, key);
const measure = (fn) => performanceOptimizer.measure(fn);