// DOM Management Module
class DOMManager {
    constructor() {
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * DOM要素の初期化
     * @returns {Object} - DOM要素オブジェクト
     */
    initializeElements() {
        const elements = {
            form: document.getElementById('recommendation-form'),
            loading: document.getElementById('loading'),
            results: document.getElementById('results-section'),
            error: document.getElementById('error-message'),
            partsTableBody: document.getElementById('parts-table-body'),
            totalBudget: document.getElementById('total-budget'),
            totalPrice: document.getElementById('total-price'),
            budgetStatus: document.getElementById('budget-status'),
            
            // フォーム要素
            budgetInput: document.getElementById('budget'),
            ramSelect: document.getElementById('ram'),
            storageSelect: document.getElementById('storage-capacity'),
            cpuBrandSelect: document.getElementById('cpu-brand'),
            gpuBrandSelect: document.getElementById('gpu-brand'),
            usageSelect: document.getElementById('usage'),
            includeOSCheckbox: document.getElementById('include-os'),
            
            // 言語選択
            languageSelector: document.getElementById('language-selector')
        };

        // 必須要素の存在チェック
        const requiredElements = ['form', 'loading', 'results', 'error', 'partsTableBody'];
        for (const elementName of requiredElements) {
            if (!elements[elementName]) {
                throw new Error(`必須DOM要素が見つかりません: ${elementName}`);
            }
        }

        return elements;
    }

    /**
     * イベントリスナーのセットアップ
     */
    setupEventListeners() {
        // フォーム送信
        this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // 用途変更
        if (this.elements.usageSelect) {
            this.elements.usageSelect.addEventListener('change', this.handleUsageChange.bind(this));
        }

        // 言語切り替え
        if (this.elements.languageSelector) {
            this.elements.languageSelector.addEventListener('change', this.handleLanguageChange.bind(this));
        }

        // リアルタイム予算バリデーション
        if (this.elements.budgetInput) {
            this.elements.budgetInput.addEventListener('input', this.handleBudgetInput.bind(this));
        }
    }

    /**
     * フォーム送信ハンドラ
     * @param {Event} e - イベント
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            
            // UI状態更新
            this.showLoading();
            this.hideResults();
            this.hideError();
            
            // 推奨処理実行
            const recommendations = getRecommendations(formData);
            
            // 結果表示
            this.displayResults(recommendations);
            
        } catch (error) {
            console.error('推奨処理エラー:', error);
            
            // エラーハンドラーが利用可能な場合は使用
            if (typeof errorHandler !== 'undefined') {
                const errorInfo = errorHandler.handleError(error, 'Recommendation');
                this.showError(errorInfo.userMessage);
            } else {
                this.showError(error.message || '推奨処理中にエラーが発生しました');
            }
        } finally {
            this.hideLoading();
        }
    }

    /**
     * フォームデータ取得
     * @returns {Object} - フォームデータ
     */
    getFormData() {
        const formData = new FormData(this.elements.form);
        
        return {
            budget: parseInt(formData.get('budget')),
            ram: formData.get('ram'),
            storage: {
                capacity: formData.get('storage-capacity')
            },
            cpuBrand: formData.get('cpu-brand'),
            gpuBrand: formData.get('gpu-brand'),
            usage: formData.get('usage'),
            includeOS: formData.get('include-os') === 'on'
        };
    }

    /**
     * 用途変更ハンドラ
     * @param {Event} e - イベント
     */
    handleUsageChange(e) {
        const usageValue = e.target.value;
        console.log(`用途変更: ${usageValue}`);
        
        // 用途に応じたUI調整
        this.adjustUIForUsage(usageValue);
    }

    /**
     * 用途に応じたUI調整
     * @param {string} usageValue - 用途
     */
    adjustUIForUsage(usageValue) {
        // Tarkovの場合はメモリ推奨を32GBに
        if (usageValue === 'tarkov' && this.elements.ramSelect) {
            if (this.elements.ramSelect.value === '16GB') {
                this.elements.ramSelect.value = '32GB';
                console.log('Tarkov用途でメモリを32GBに変更しました');
            }
        }
        
        // VRChatの場合は特別な推奨表示
        if (usageValue === 'vrchat') {
            console.log('VRChat用途: 高VRAM GPU優先');
        }
    }

    /**
     * 言語変更ハンドラ
     * @param {Event} e - イベント
     */
    handleLanguageChange(e) {
        const selectedLanguage = e.target.value;
        
        // 言語変更イベントを発行
        document.dispatchEvent(new CustomEvent('languageChange', {
            detail: { language: selectedLanguage }
        }));
    }

    /**
     * 予算入力ハンドラ
     * @param {Event} e - イベント
     */
    handleBudgetInput(e) {
        const budget = parseInt(e.target.value);
        const minBudget = 125000;
        
        if (budget < minBudget) {
            e.target.setCustomValidity(`予算は${minBudget.toLocaleString()}円以上を入力してください`);
        } else {
            e.target.setCustomValidity('');
        }
    }

    /**
     * 要素の表示/非表示切り替え
     * @param {HTMLElement} element - 要素
     * @param {boolean} show - 表示するか
     */
    toggleElement(element, show) {
        if (!element) return;
        
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    // UI状態管理メソッド
    showLoading() {
        this.toggleElement(this.elements.loading, true);
    }

    hideLoading() {
        this.toggleElement(this.elements.loading, false);
    }

    showResults() {
        this.toggleElement(this.elements.results, true);
    }

    hideResults() {
        this.toggleElement(this.elements.results, false);
    }

    showError(message = null) {
        if (message) {
            const errorElement = this.elements.error.querySelector('p');
            if (errorElement) {
                errorElement.textContent = message;
            }
        }
        this.toggleElement(this.elements.error, true);
    }

    hideError() {
        this.toggleElement(this.elements.error, false);
    }

    /**
     * 結果表示
     * @param {Object} data - 推奨結果
     */
    displayResults(data) {
        if (!data || !data.recommendations) {
            throw new Error('推奨データが無効です');
        }

        // 予算情報表示
        this.displayBudgetInfo(data);
        
        // パーツテーブル表示
        this.displayPartsTable(data.recommendations);
        
        // 結果セクション表示
        this.showResults();
    }

    /**
     * 予算情報表示
     * @param {Object} data - 推奨データ
     */
    displayBudgetInfo(data) {
        if (this.elements.totalBudget) {
            this.elements.totalBudget.textContent = this.formatPrice(data.budget);
        }
        
        if (this.elements.totalPrice) {
            this.elements.totalPrice.textContent = this.formatPrice(data.grandTotal);
        }
        
        if (this.elements.budgetStatus) {
            const isWithinBudget = data.budgetStatus === 'within_budget';
            const remaining = data.remainingBudget;
            
            // アイコン付きでより視覚的に
            const statusIcon = isWithinBudget ? '✅' : '⚠️';
            const statusText = isWithinBudget 
                ? `${statusIcon} 予算内 (残り: ${this.formatPrice(remaining)})`
                : `${statusIcon} 予算超過 (${this.formatPrice(-remaining)}オーバー)`;
                
            this.elements.budgetStatus.textContent = statusText;
            this.elements.budgetStatus.className = isWithinBudget ? 'status within-budget' : 'status over-budget';
            
            // アニメーション効果のために一瞬クラスを削除してから再適用
            this.elements.budgetStatus.style.animation = 'none';
            setTimeout(() => {
                this.elements.budgetStatus.style.animation = '';
            }, 10);
        }
    }

    /**
     * パーツテーブル表示
     * @param {Object} recommendations - 推奨パーツ
     */
    displayPartsTable(recommendations) {
        this.elements.partsTableBody.innerHTML = '';
        
        // パーツカテゴリの順序
        const partOrder = ['cpu', 'cooler', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'case', 'os'];
        
        for (const category of partOrder) {
            const part = recommendations[category];
            if (part) {
                const row = this.createPartRow(category, part);
                this.elements.partsTableBody.appendChild(row);
            }
        }
    }

    /**
     * パーツ行作成
     * @param {string} category - カテゴリ
     * @param {Object} part - パーツ
     * @returns {HTMLTableRowElement} - テーブル行
     */
    createPartRow(category, part) {
        const row = document.createElement('tr');
        
        // カテゴリ名
        const categoryCell = document.createElement('td');
        categoryCell.textContent = this.getCategoryDisplayName(category);
        categoryCell.className = 'category-cell';
        
        // 商品名
        const nameCell = document.createElement('td');
        nameCell.textContent = part.name;
        nameCell.className = 'name-cell';
        
        // 価格
        const priceCell = document.createElement('td');
        priceCell.textContent = this.formatPrice(part.price);
        priceCell.className = 'price-cell';
        
        // スペック
        const specsCell = document.createElement('td');
        specsCell.innerHTML = this.formatSpecs(category, part);
        specsCell.className = 'specs-cell';
        
        row.appendChild(categoryCell);
        row.appendChild(nameCell);
        row.appendChild(priceCell);
        row.appendChild(specsCell);
        
        return row;
    }

    /**
     * カテゴリ表示名取得
     * @param {string} category - カテゴリ
     * @returns {string} - 表示名
     */
    getCategoryDisplayName(category) {
        const categoryNames = {
            os: 'OS',
            cpu: 'CPU',
            cooler: 'CPUクーラー',
            motherboard: 'マザーボード',
            memory: 'メモリ',
            storage: 'ストレージ',
            gpu: 'グラフィックボード',
            psu: '電源',
            case: 'ケース'
        };
        
        return categoryNames[category] || category;
    }

    /**
     * 価格フォーマット
     * @param {number} price - 価格
     * @returns {string} - フォーマット済み価格
     */
    formatPrice(price) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0
        }).format(price);
    }

    /**
     * スペック情報フォーマット
     * @param {string} category - カテゴリ
     * @param {Object} part - パーツ
     * @returns {string} - フォーマット済みスペック
     */
    formatSpecs(category, part) {
        if (!part) return '';
        
        const specs = [];
        
        switch (category) {
            case 'cpu':
                if (part.cores) specs.push(`${part.cores}`);
                if (part.frequency) specs.push(`${part.frequency}`);
                if (part.socket) specs.push(`${part.socket}`);
                // X3D CPUかどうか判定して表示
                if (part.name && (part.name.toLowerCase().includes('x3d') || part.name.toLowerCase().includes('3d'))) {
                    specs.push('<span style="color: #dc3545; font-weight: bold;">🎯 Tarkov最適</span>');
                }
                break;
                
            case 'gpu':
                if (part.memory) {
                    specs.push(`VRAM: ${part.memory}`);
                    // VRAM容量を取得して8GB超えかどうか表示
                    const vramMatch = part.memory.match(/(\d+)GB/);
                    if (vramMatch) {
                        const vramCapacity = parseInt(vramMatch[1]);
                        if (vramCapacity > 8) {
                            specs.push('<span style="color: #28a745; font-weight: bold;">🎮 VRChat推奨</span>');
                        }
                    }
                }
                if (part.interface) specs.push(`${part.interface}`);
                break;
                
            case 'memory':
                if (part.capacity) specs.push(`${part.capacity}`);
                if (part.type) specs.push(`${part.type}`);
                if (part.speed) specs.push(`${part.speed}`);
                break;
                
            case 'storage':
                if (part.capacity) specs.push(`${part.capacity}`);
                if (part.type) specs.push(`${part.type}`);
                if (part.interface) specs.push(`${part.interface}`);
                break;
                
            case 'motherboard':
                if (part.socket) specs.push(`${part.socket}`);
                if (part.chipset) specs.push(`${part.chipset}`);
                if (part.formFactor) specs.push(`${part.formFactor}`);
                break;
                
            case 'psu':
                if (part.wattage) specs.push(`${part.wattage}`);
                if (part.efficiency) specs.push(`${part.efficiency}`);
                break;
                
            case 'case':
                if (part.formFactor) specs.push(`${part.formFactor}`);
                break;
                
            default:
                // デフォルトでは主要なプロパティを表示
                if (part.description) specs.push(part.description);
        }
        
        return specs.join('<br>');
    }

    /**
     * フォーム値設定
     * @param {Object} values - 設定値
     */
    setFormValues(values) {
        if (values.budget && this.elements.budgetInput) {
            this.elements.budgetInput.value = values.budget;
        }
        
        if (values.ram && this.elements.ramSelect) {
            this.elements.ramSelect.value = values.ram;
        }
        
        if (values.usage && this.elements.usageSelect) {
            this.elements.usageSelect.value = values.usage;
        }
    }

    /**
     * エラー情報の取得
     * @returns {Array} - エラー一覧
     */
    getValidationErrors() {
        const errors = [];
        
        if (this.elements.budgetInput && !this.elements.budgetInput.validity.valid) {
            errors.push(this.elements.budgetInput.validationMessage);
        }
        
        return errors;
    }
}