const translations = {
    ja: {
        // Header
        title: "PC自作パーツ推奨システム",
        subtitle: "予算とスペック条件に応じて最適なPCパーツ構成を提案します",
        
        // Form labels
        conditionsTitle: "条件設定",
        budget: "総予算（円）",
        ram: "希望RAM容量",
        storageCapacity: "ストレージ容量",
        storageType: "ストレージタイプ",
        gpuBrand: "GPU メーカー",
        usage: "用途",
        submitBtn: "構成を提案",
        
        // Options
        gpuBrandAny: "指定なし",
        gpuBrandNvidia: "NVIDIA",
        gpuBrandAmd: "AMD",
        
        storageTypeSsd: "SSD",
        storageTypeHdd: "HDD",
        storageTypeHybrid: "SSD + HDD",
        
        usageOffice: "オフィス作業",
        usageDevelopment: "プログラミング・開発",
        usageGaming: "ゲーミング",
        usageCreative: "クリエイティブ作業",
        
        // Results
        resultsTitle: "推奨パーツ構成",
        totalBudget: "総予算:",
        totalPrice: "合計金額:",
        withinBudget: "予算内",
        overBudget: "予算オーバー",
        
        // Table headers
        partCategory: "パーツ",
        productName: "商品名",
        price: "価格",
        specs: "主要スペック",
        
        // Part categories
        cpu: "CPU",
        motherboard: "マザーボード",
        memory: "メモリ",
        storage: "ストレージ",
        gpu: "グラフィックボード",
        psu: "電源ユニット",
        case: "PCケース",
        
        // Loading and errors
        loading: "パーツ構成を計算中...",
        error: "エラーが発生しました。しばらく時間をおいて再度お試しください。",
        
        // Language toggle
        language: "言語",
        languageJa: "日本語",
        languageEn: "English"
    },
    
    en: {
        // Header
        title: "PC Build Parts Recommendation System",
        subtitle: "Suggests optimal PC part configurations based on budget and specification requirements",
        
        // Form labels
        conditionsTitle: "Configuration Settings",
        budget: "Total Budget (¥)",
        ram: "Desired RAM Capacity",
        storageCapacity: "Storage Capacity",
        storageType: "Storage Type",
        gpuBrand: "GPU Brand",
        usage: "Usage Type",
        submitBtn: "Get Recommendations",
        
        // Options
        gpuBrandAny: "Any",
        gpuBrandNvidia: "NVIDIA",
        gpuBrandAmd: "AMD",
        
        storageTypeSsd: "SSD",
        storageTypeHdd: "HDD",
        storageTypeHybrid: "SSD + HDD",
        
        usageOffice: "Office Work",
        usageDevelopment: "Programming/Development",
        usageGaming: "Gaming",
        usageCreative: "Creative Work",
        
        // Results
        resultsTitle: "Recommended PC Configuration",
        totalBudget: "Total Budget:",
        totalPrice: "Total Price:",
        withinBudget: "Within Budget",
        overBudget: "Over Budget",
        
        // Table headers
        partCategory: "Part",
        productName: "Product Name",
        price: "Price",
        specs: "Key Specifications",
        
        // Part categories
        cpu: "CPU",
        motherboard: "Motherboard",
        memory: "Memory",
        storage: "Storage",
        gpu: "Graphics Card",
        psu: "Power Supply",
        case: "PC Case",
        
        // Loading and errors
        loading: "Calculating PC configuration...",
        error: "An error occurred. Please try again after a moment.",
        
        // Language toggle
        language: "Language",
        languageJa: "日本語",
        languageEn: "English"
    }
};

// Current language (default: Japanese)
let currentLanguage = localStorage.getItem('preferredLanguage') || 'ja';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Change language function
function changeLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        updatePageText();
    }
}

// Update all text on the page
function updatePageText() {
    // Header
    document.querySelector('h1').textContent = t('title');
    document.querySelector('header p').textContent = t('subtitle');
    
    // Form
    document.querySelector('.input-section h2').textContent = t('conditionsTitle');
    document.querySelector('label[for="budget"]').textContent = t('budget');
    document.querySelector('label[for="ram"]').textContent = t('ram');
    document.querySelector('label[for="storage-capacity"]').textContent = t('storageCapacity');
    document.querySelector('label[for="storage-type"]').textContent = t('storageType');
    document.querySelector('label[for="gpu-brand"]').textContent = t('gpuBrand');
    document.querySelector('label[for="usage"]').textContent = t('usage');
    document.querySelector('.submit-btn').textContent = t('submitBtn');
    
    // Options
    document.querySelector('#gpu-brand option[value="any"]').textContent = t('gpuBrandAny');
    document.querySelector('#gpu-brand option[value="nvidia"]').textContent = t('gpuBrandNvidia');
    document.querySelector('#gpu-brand option[value="amd"]').textContent = t('gpuBrandAmd');
    
    document.querySelector('#storage-type option[value="ssd"]').textContent = t('storageTypeSsd');
    document.querySelector('#storage-type option[value="hdd"]').textContent = t('storageTypeHdd');
    document.querySelector('#storage-type option[value="hybrid"]').textContent = t('storageTypeHybrid');
    
    document.querySelector('#usage option[value="office"]').textContent = t('usageOffice');
    document.querySelector('#usage option[value="development"]').textContent = t('usageDevelopment');
    document.querySelector('#usage option[value="gaming"]').textContent = t('usageGaming');
    document.querySelector('#usage option[value="creative"]').textContent = t('usageCreative');
    
    // Results section
    document.querySelector('#results-section h2').textContent = t('resultsTitle');
    document.querySelector('.budget-info .label').textContent = t('totalBudget');
    document.querySelector('.price-info .label').textContent = t('totalPrice');
    
    // Table headers
    const headers = document.querySelectorAll('.parts-table th');
    if (headers.length >= 4) {
        headers[0].textContent = t('partCategory');
        headers[1].textContent = t('productName');
        headers[2].textContent = t('price');
        headers[3].textContent = t('specs');
    }
    
    // Loading and error messages
    document.querySelector('#loading p').textContent = t('loading');
    document.querySelector('#error-message p').textContent = t('error');
    
    // Update language selector if it exists
    const langSelector = document.querySelector('#language-selector');
    if (langSelector) {
        langSelector.value = currentLanguage;
    }
    
    // Update budget status if displayed
    const budgetStatus = document.querySelector('#budget-status');
    if (budgetStatus && budgetStatus.textContent) {
        if (budgetStatus.classList.contains('within-budget')) {
            budgetStatus.textContent = t('withinBudget');
        } else if (budgetStatus.classList.contains('over-budget')) {
            budgetStatus.textContent = t('overBudget');
        }
    }
}