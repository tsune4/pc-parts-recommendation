// Translation Manager with Observer Pattern
class TranslationManager {
    constructor() {
        this.translations = this.loadTranslations();
        this.currentLanguage = this.getStoredLanguage() || 'ja';
        this.observers = new Set();
        this.setupEventListeners();
    }

    /**
     * 翻訳データ読み込み
     * @returns {Object} - 翻訳データ
     */
    loadTranslations() {
        // 既存のtranslations変数を使用
        if (typeof translations !== 'undefined') {
            return translations;
        }
        
        // フォールバック翻訳データ
        return {
            ja: {
                pageTitle: "PC自作パーツ推奨システム",
                title: "PC自作パーツ推奨システム",
                subtitle: "予算とスペック条件に応じて最適なPCパーツ構成を提案します",
                languageLabel: "言語:",
                conditionsTitle: "条件設定",
                budget: "総予算（円）",
                ram: "希望RAM容量",
                storageCapacity: "ストレージ容量",
                submitBtn: "構成を提案"
            },
            en: {
                pageTitle: "PC Parts Recommendation System",
                title: "PC Parts Recommendation System",
                subtitle: "Suggest optimal PC part configurations based on budget and specifications",
                languageLabel: "Language:",
                conditionsTitle: "Configuration Settings",
                budget: "Total Budget (¥)",
                ram: "RAM Capacity",
                storageCapacity: "Storage Capacity",
                submitBtn: "Get Recommendations"
            }
        };
    }

    /**
     * 保存済み言語設定取得
     * @returns {string|null} - 言語コード
     */
    getStoredLanguage() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (error) {
            console.warn('Failed to access localStorage:', error);
            return null;
        }
    }

    /**
     * 言語設定保存
     * @param {string} language - 言語コード
     */
    storeLanguage(language) {
        try {
            localStorage.setItem('preferredLanguage', language);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // カスタム言語変更イベントをリッスン
        document.addEventListener('languageChange', (event) => {
            this.changeLanguage(event.detail.language);
        });
        
        // 言語選択ドロップダウンの初期化
        this.initializeLanguageSelector();
    }

    /**
     * 言語選択ドロップダウン初期化
     */
    initializeLanguageSelector() {
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.value = this.currentLanguage;
            selector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    /**
     * 翻訳取得
     * @param {string} key - 翻訳キー
     * @param {Object} params - 置換パラメータ
     * @returns {string} - 翻訳されたテキスト
     */
    translate(key, params = {}) {
        const languageData = this.translations[this.currentLanguage];
        if (!languageData) {
            console.warn(`Language '${this.currentLanguage}' not found`);
            return key;
        }
        
        let translation = languageData[key];
        if (translation === undefined) {
            console.warn(`Translation key '${key}' not found for language '${this.currentLanguage}'`);
            return key;
        }
        
        // パラメータ置換
        if (typeof translation === 'string' && Object.keys(params).length > 0) {
            translation = this.replaceParameters(translation, params);
        }
        
        return translation;
    }

    /**
     * パラメータ置換
     * @param {string} text - 元のテキスト
     * @param {Object} params - 置換パラメータ
     * @returns {string} - 置換後のテキスト
     */
    replaceParameters(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * 言語変更
     * @param {string} language - 新しい言語コード
     */
    changeLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`Language '${language}' is not supported`);
            return;
        }
        
        if (this.currentLanguage === language) {
            return; // 既に同じ言語
        }
        
        const oldLanguage = this.currentLanguage;
        this.currentLanguage = language;
        
        // 設定保存
        this.storeLanguage(language);
        
        // 言語選択ドロップダウン更新
        this.updateLanguageSelector();
        
        // オブザーバーに通知
        this.notifyLanguageChange(oldLanguage, language);
        
        console.log(`Language changed from ${oldLanguage} to ${language}`);
    }

    /**
     * 言語選択ドロップダウン更新
     */
    updateLanguageSelector() {
        const selector = document.getElementById('language-selector');
        if (selector && selector.value !== this.currentLanguage) {
            selector.value = this.currentLanguage;
        }
    }

    /**
     * オブザーバー登録
     * @param {Function} callback - コールバック関数
     * @returns {Function} - 登録解除関数
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.observers.add(callback);
        
        // 登録解除関数を返す
        return () => {
            this.observers.delete(callback);
        };
    }

    /**
     * オブザーバー登録解除
     * @param {Function} callback - コールバック関数
     */
    unsubscribe(callback) {
        this.observers.delete(callback);
    }

    /**
     * 言語変更をオブザーバーに通知
     * @param {string} oldLanguage - 旧言語
     * @param {string} newLanguage - 新言語
     */
    notifyLanguageChange(oldLanguage, newLanguage) {
        const event = {
            type: 'languageChange',
            oldLanguage,
            newLanguage,
            timestamp: Date.now()
        };
        
        this.observers.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in translation observer:', error);
            }
        });
    }

    /**
     * 現在の言語取得
     * @returns {string} - 現在の言語コード
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 利用可能言語一覧取得
     * @returns {Array} - 言語コード配列
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * 翻訳統計取得
     * @returns {Object} - 翻訳統計
     */
    getTranslationStats() {
        const stats = {};
        
        for (const [lang, translations] of Object.entries(this.translations)) {
            stats[lang] = {
                keyCount: Object.keys(translations).length,
                missingKeys: this.getMissingKeys(lang)
            };
        }
        
        return stats;
    }

    /**
     * 不足している翻訳キー取得
     * @param {string} language - 言語コード
     * @returns {Array} - 不足キー配列
     */
    getMissingKeys(language) {
        if (!this.translations[language]) return [];
        
        // 基準言語（日本語）との比較
        const baseKeys = new Set(Object.keys(this.translations.ja || {}));
        const langKeys = new Set(Object.keys(this.translations[language]));
        
        return Array.from(baseKeys).filter(key => !langKeys.has(key));
    }

    /**
     * 翻訳検証
     * @returns {Object} - 検証結果
     */
    validateTranslations() {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };
        
        const languages = this.getAvailableLanguages();
        if (languages.length === 0) {
            validation.isValid = false;
            validation.errors.push('No translations found');
            return validation;
        }
        
        // 各言語の不足キーチェック
        for (const lang of languages) {
            const missingKeys = this.getMissingKeys(lang);
            if (missingKeys.length > 0) {
                validation.warnings.push(
                    `Language '${lang}' is missing keys: ${missingKeys.join(', ')}`
                );
            }
        }
        
        return validation;
    }

    /**
     * デバッグ情報出力
     */
    debug() {
        console.group('🌐 Translation Manager Debug');
        console.log('Current language:', this.currentLanguage);
        console.log('Available languages:', this.getAvailableLanguages());
        console.log('Observer count:', this.observers.size);
        console.log('Translation stats:', this.getTranslationStats());
        
        const validation = this.validateTranslations();
        if (!validation.isValid) {
            console.error('Validation errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.warn('Validation warnings:', validation.warnings);
        }
        
        console.groupEnd();
    }
}

// UI更新クラス
class UITranslationUpdater {
    constructor(translationManager) {
        this.translationManager = translationManager;
        this.setupAutoUpdate();
    }

    /**
     * 自動更新設定
     */
    setupAutoUpdate() {
        // 翻訳マネージャーの変更を監視
        this.translationManager.subscribe((event) => {
            this.updateAllText();
        });
        
        // 初回更新
        this.updateAllText();
    }

    /**
     * 全テキスト更新
     */
    updateAllText() {
        // data-translate属性を持つ要素を更新
        this.updateTranslateElements();
        
        // 特定の要素を直接更新
        this.updateSpecificElements();
        
        // ページタイトル更新
        this.updatePageTitle();
    }

    /**
     * data-translate属性要素の更新
     */
    updateTranslateElements() {
        const elements = document.querySelectorAll('[data-translate]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translationManager.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        });
    }

    /**
     * 特定要素の更新
     */
    updateSpecificElements() {
        const mappings = [
            { selector: 'h1', key: 'title' },
            { selector: 'header p', key: 'subtitle' },
            { selector: 'label[for="language-selector"]', key: 'languageLabel' },
            { selector: 'h2', key: 'conditionsTitle' },
            { selector: '.submit-btn', key: 'submitBtn' }
        ];
        
        mappings.forEach(({ selector, key }) => {
            const element = document.querySelector(selector);
            if (element) {
                const translation = this.translationManager.translate(key);
                element.textContent = translation;
            }
        });
    }

    /**
     * ページタイトル更新
     */
    updatePageTitle() {
        const title = this.translationManager.translate('pageTitle');
        if (title) {
            document.title = title;
        }
    }
}

// グローバルインスタンス
let translationManager;
let uiTranslationUpdater;

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        translationManager = new TranslationManager();
        uiTranslationUpdater = new UITranslationUpdater(translationManager);
        
        console.log('✅ Translation system initialized');
    } catch (error) {
        console.error('❌ Translation system initialization failed:', error);
    }
});

// レガシー互換性関数
function changeLanguage(language) {
    if (translationManager) {
        translationManager.changeLanguage(language);
    }
}

function translate(key, params = {}) {
    if (translationManager) {
        return translationManager.translate(key, params);
    }
    return key;
}

// グローバル関数として公開
if (typeof window !== 'undefined') {
    window.translationManager = translationManager;
    window.changeLanguage = changeLanguage;
    window.translate = translate;
}