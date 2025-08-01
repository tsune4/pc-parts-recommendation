// DOM要素の取得
const form = document.getElementById('recommendation-form');
const loadingElement = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const errorMessage = document.getElementById('error-message');
const partsTableBody = document.getElementById('parts-table-body');
const totalBudgetElement = document.getElementById('total-budget');
const totalPriceElement = document.getElementById('total-price');
const budgetStatusElement = document.getElementById('budget-status');

// パーツカテゴリーの翻訳対応
const PART_CATEGORIES_TRANSLATIONS = {
    cpu: 'cpu',
    cooler: 'cooler',
    motherboard: 'motherboard',
    memory: 'memory',
    storage: 'storage',
    gpu: 'gpu',
    psu: 'psu',
    case: 'case'
};

// フォーム送信イベント - クライアントサイド版
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // フォームデータの取得
    const formData = new FormData(form);
    const budget = parseInt(formData.get('budget'));
    const ram = formData.get('ram');
    const storageCapacity = formData.get('storage-capacity');
    const gpuBrand = formData.get('gpu-brand');
    const usage = formData.get('usage');
    
    // ストレージ設定のオブジェクト作成
    const storage = {
        capacity: storageCapacity
    };
    
    // リクエストデータ
    const requestData = {
        budget,
        ram,
        storage,
        gpuBrand,
        usage
    };
    
    try {
        // UI状態の更新
        showLoading();
        hideResults();
        hideError();
        
        // クライアントサイドで推奨処理実行
        const data = getRecommendations(requestData);
        
        // 結果の表示
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError();
    } finally {
        hideLoading();
    }
});

// ローディング表示
function showLoading() {
    loadingElement.classList.remove('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

// 結果表示
function showResults() {
    resultsSection.classList.remove('hidden');
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

// エラー表示
function showError() {
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// 価格フォーマット
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0
    }).format(price);
}

// スペック情報のフォーマット
function formatSpecs(category, part) {
    const specs = [];
    
    switch (category) {
        case 'cpu':
            if (part.cores) specs.push(`${part.cores}`);
            if (part.frequency) specs.push(part.frequency);
            if (part.socket) specs.push(part.socket);
            break;
            
        case 'cooler':
            if (part.type) specs.push(part.type);
            break;
            
        case 'motherboard':
            if (part.socket) specs.push(part.socket);
            if (part.chipset) specs.push(part.chipset);
            if (part.formFactor) specs.push(part.formFactor);
            break;
            
        case 'memory':
            if (part.capacity) specs.push(part.capacity);
            if (part.speed) specs.push(part.speed);
            if (part.type) specs.push(part.type);
            break;
            
        case 'storage':
            if (part.capacity) specs.push(part.capacity);
            if (part.interface) specs.push(part.interface);
            if (part.formFactor) specs.push(part.formFactor);
            break;
            
        case 'gpu':
            if (part.gpu) specs.push(part.gpu);
            if (part.memory) specs.push(`VRAM: ${part.memory}`);
            if (part.interface) specs.push(part.interface);
            break;
            
        case 'psu':
            if (part.wattage) specs.push(part.wattage);
            if (part.efficiency) specs.push(part.efficiency);
            if (part.modular) specs.push(`${part.modular}モジュラー`);
            break;
            
        case 'case':
            if (part.formFactor) specs.push(part.formFactor);
            if (part.size) specs.push(part.size);
            break;
    }
    
    return specs.join('<br>');
}

// 結果の表示処理を翻訳対応に更新
function displayResults(data) {
    const { recommendations, totalPrice, budget, isWithinBudget } = data;
    
    // 予算情報の更新
    totalBudgetElement.textContent = formatPrice(budget);
    totalPriceElement.textContent = formatPrice(totalPrice);
    
    // 予算状態の更新（翻訳対応）
    budgetStatusElement.textContent = isWithinBudget ? t('withinBudget') : t('overBudget');
    budgetStatusElement.className = `status ${isWithinBudget ? 'within-budget' : 'over-budget'}`;
    
    // パーツテーブルのクリア
    partsTableBody.innerHTML = '';
    
    // パーツ情報の表示
    Object.entries(recommendations).forEach(([category, part]) => {
        if (part) {
            const row = createPartRow(category, part);
            partsTableBody.appendChild(row);
        }
    });
    
    showResults();
}

// パーツ行の作成を翻訳対応に更新
function createPartRow(category, part) {
    const row = document.createElement('tr');
    
    // パーツカテゴリー（翻訳対応）
    const categoryCell = document.createElement('td');
    categoryCell.className = 'part-category';
    categoryCell.textContent = t(PART_CATEGORIES_TRANSLATIONS[category]) || category;
    
    // 商品名
    const nameCell = document.createElement('td');
    nameCell.className = 'part-name';
    nameCell.textContent = part.name;
    
    // 価格
    const priceCell = document.createElement('td');
    priceCell.className = 'part-price';
    priceCell.textContent = formatPrice(part.price);
    
    // スペック
    const specsCell = document.createElement('td');
    specsCell.className = 'part-specs';
    specsCell.innerHTML = formatSpecs(category, part);
    
    row.appendChild(categoryCell);
    row.appendChild(nameCell);
    row.appendChild(priceCell);
    row.appendChild(specsCell);
    
    return row;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 言語切り替えセレクターのイベントリスナー
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        // 保存された言語設定を適用
        languageSelector.value = currentLanguage;
        
        // 言語変更イベント
        languageSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // 初期言語でページを更新
    updatePageText();
    
    console.log('PC自作パーツ推奨システム（GitHub Pages版）が初期化されました');
});