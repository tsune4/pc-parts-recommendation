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
    os: 'os',
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
    const cpuBrand = formData.get('cpu-brand');
    const gpuBrand = formData.get('gpu-brand');
    const usage = formData.get('usage');
    const includeOS = formData.get('include-os') === 'on';
    
    // ストレージ設定のオブジェクト作成
    const storage = {
        capacity: storageCapacity
    };
    
    // リクエストデータ
    const requestData = {
        budget,
        ram,
        storage,
        cpuBrand,
        gpuBrand,
        usage,
        includeOS
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

// スペック情報のフォーマット（翻訳対応）
function formatSpecs(category, part) {
    const specs = [];
    
    switch (category) {
        case 'cpu':
            if (part.cores) {
                const coreCount = part.cores.split('コア')[0];
                const threadCount = part.cores.split('スレッド')[0].split('コア')[1];
                specs.push(`${coreCount} ${t('cores')} ${threadCount} ${t('threads')}`);
            }
            if (part.frequency) specs.push(part.frequency);
            if (part.socket) specs.push(part.socket);
            break;
            
        case 'cooler':
            if (part.type) {
                if (part.type.includes('サイドフロー')) {
                    specs.push(t('cooler_type_side'));
                } else if (part.type.includes('水冷')) {
                    specs.push(t('cooler_type_water'));
                } else {
                    specs.push(part.type);
                }
            }
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
            if (part.memory) specs.push(`${t('vram')}: ${part.memory}`);
            if (part.interface) specs.push(part.interface);
            break;
            
        case 'psu':
            if (part.wattage) specs.push(part.wattage);
            if (part.efficiency) specs.push(part.efficiency);
            if (part.modular) {
                if (part.modular.toLowerCase().includes('full')) {
                    specs.push(t('psu_modular_full'));
                } else if (part.modular.toLowerCase().includes('semi')) {
                    specs.push(t('psu_modular_semi'));
                } else {
                    specs.push(t('psu_modular_non'));
                }
            }
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
    
    // パーツ情報の表示（OSを一番上に表示）
    const partEntries = Object.entries(recommendations);
    
    // OSが含まれている場合は最初に表示
    const osEntry = partEntries.find(([category]) => category === 'os');
    if (osEntry && osEntry[1]) {
        const row = createPartRow(osEntry[0], osEntry[1]);
        partsTableBody.appendChild(row);
    }
    
    // OS以外のパーツを表示
    partEntries.forEach(([category, part]) => {
        if (part && category !== 'os') {
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

// --- Initialization ---

// CPU ブランド制御のための変数
let savedCpuBrand = null;

// 用途変更時のCPUブランド制御
function handleUsageChange(usageValue) {
    const cpuBrandSelect = document.getElementById('cpu-brand');
    
    if (usageValue === 'tarkov') {
        // 現在の選択を保存（Tarkov以外の場合のみ）
        if (cpuBrandSelect.value !== 'amd') {
            savedCpuBrand = cpuBrandSelect.value;
        }
        
        // AMDに強制変更
        cpuBrandSelect.value = 'amd';
        cpuBrandSelect.disabled = true;
        cpuBrandSelect.classList.add('tarkov-disabled');
        
        console.log('Tarkov選択: CPUブランドをAMDに固定');
    } else {
        // Tarkov以外の場合は制限解除
        cpuBrandSelect.disabled = false;
        cpuBrandSelect.classList.remove('tarkov-disabled');
        
        // 保存されたブランドがあれば復元
        if (savedCpuBrand && savedCpuBrand !== 'amd') {
            cpuBrandSelect.value = savedCpuBrand;
            console.log(`CPU ブランドを ${savedCpuBrand} に復元`);
        }
    }
}

// This function sets up the entire application once the DOM is ready.
function initializeApp() {
    // Set the initial language from localStorage or default to 'ja'
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'ja';
    changeLanguage(savedLanguage); // This will set currentLanguage and call updatePageText()

    // Set up the language selector event listener
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLanguage; // Reflect the current language in the dropdown
        languageSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }

    // Set up usage selector event listener for CPU brand control
    const usageSelector = document.getElementById('usage');
    if (usageSelector) {
        // 初期状態をチェック
        handleUsageChange(usageSelector.value);
        
        // 変更時のイベントリスナー追加
        usageSelector.addEventListener('change', (e) => {
            handleUsageChange(e.target.value);
        });
    }

    console.log('PC Build Recommendation System Initialized.');
}

// Wait for the DOM to be fully loaded before running the app setup.
document.addEventListener('DOMContentLoaded', initializeApp);