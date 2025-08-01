
console.log(`[DEBUG] translations.js loaded at ${new Date().toISOString()}`);

const translations = {
    ja: {
        // Page Title
        pageTitle: "PC自作パーツ推奨システム",

        // Header
        title: "PC自作パーツ推奨システム",
        subtitle: "予算とスペック条件に応じて最適なPCパーツ構成を提案します",
        
        // Language Selector
        languageLabel: "言語:",
        languageJa: "日本語",
        languageEn: "English",

        // Form Labels
        conditionsTitle: "条件設定",
        budget: "総予算（円）",
        ram: "希望RAM容量",
        storageCapacity: "ストレージ容量",
        cpuBrand: "CPU メーカー",
        gpuBrand: "GPU メーカー",
        usage: "用途",
        includeOS: "OSの価格を含める",
        submitBtn: "構成を提案",
        
        // Form Options
        ram8gb: "8GB",
        ram16gb: "16GB",
        ram32gb: "32GB",
        ram64gb: "64GB",
        
        storage1tb: "1TB",
        storage2tb: "2TB",
        storage4tb: "4TB",

        cpuBrandAny: "指定なし",
        cpuBrandIntel: "Intel",
        cpuBrandAmd: "AMD",
        
        gpuBrandAny: "指定なし",
        gpuBrandNvidia: "NVIDIA",
        gpuBrandAmd: "AMD",
        
        usageGaming: "ゲーム(汎用)",
        usageTarkov: "Escape From Tarkov",
        usageVrchat: "VRChat",
        
        // Results
        resultsTitle: "推奨パーツ構成",
        totalBudget: "総予算:",
        totalPrice: "合計金額:",
        withinBudget: "予算内",
        overBudget: "予算オーバー",
        
        // Table Headers
        partCategory: "パーツ",
        productName: "商品名",
        price: "価格",
        specs: "主要スペック",
        
        // Part Categories
        os: "OS",
        cpu: "CPU",
        cooler: "CPUクーラー",
        motherboard: "マザーボード",
        memory: "メモリ",
        storage: "ストレージ",
        gpu: "グラフィックボード",
        psu: "電源ユニット",
        case: "PCケース",

        // Spec Labels
        cores: "コア",
        threads: "スレッド",
        cooler_type_side: "サイドフロー型",
        cooler_type_water: "水冷型",
        psu_modular_non: "非モジュラー",
        psu_modular_semi: "セミモジュラー",
        psu_modular_full: "フルモジュラー",
        vram: "VRAM",
        
        // Loading and Errors
        loading: "パーツ構成を計算中...",
        error: "エラーが発生しました。しばらく時間をおいて再度お試しください。",
    },
    
    en: {
        // Page Title
        pageTitle: "PC Build Parts Recommendation System",

        // Header
        title: "PC Build Parts Recommendation System",
        subtitle: "Suggests optimal PC part configurations based on budget and specifications",
        
        // Language Selector
        languageLabel: "Language:",
        languageJa: "日本語",
        languageEn: "English",

        // Form Labels
        conditionsTitle: "Configuration Settings",
        budget: "Total Budget (¥)",
        ram: "Desired RAM Capacity",
        storageCapacity: "Storage Capacity",
        cpuBrand: "CPU Brand",
        gpuBrand: "GPU Brand",
        usage: "Usage",
        includeOS: "Include OS Price",
        submitBtn: "Get Recommendations",
        
        // Form Options
        ram8gb: "8GB",
        ram16gb: "16GB",
        ram32gb: "32GB",
        ram64gb: "64GB",

        storage1tb: "1TB",
        storage2tb: "2TB",
        storage4tb: "4TB",

        cpuBrandAny: "Any",
        cpuBrandIntel: "Intel",
        cpuBrandAmd: "AMD",
        
        gpuBrandAny: "Any",
        gpuBrandNvidia: "NVIDIA",
        gpuBrandAmd: "AMD",
        
        usageGaming: "Gaming (General)",
        usageTarkov: "Escape From Tarkov",
        usageVrchat: "VRChat",
        
        // Results
        resultsTitle: "Recommended PC Configuration",
        totalBudget: "Total Budget:",
        totalPrice: "Total Price:",
        withinBudget: "Within Budget",
        overBudget: "Over Budget",
        
        // Table Headers
        partCategory: "Part",
        productName: "Product Name",
        price: "Price",
        specs: "Key Specifications",
        
        // Part Categories
        os: "OS",
        cpu: "CPU",
        cooler: "CPU Cooler",
        motherboard: "Motherboard",
        memory: "Memory",
        storage: "Storage",
        gpu: "Graphics Card",
        psu: "Power Supply",
        case: "PC Case",

        // Spec Labels
        cores: "Cores",
        threads: "Threads",
        cooler_type_side: "Side Flow",
        cooler_type_water: "Water Cooled",
        psu_modular_non: "Non-Modular",
        psu_modular_semi: "Semi-Modular",
        psu_modular_full: "Full-Modular",
        vram: "VRAM",
        
        // Loading and Errors
        loading: "Calculating PC configuration...",
        error: "An error occurred. Please try again later.",
    }
};

// --- DO NOT EDIT BELOW THIS LINE ---

// Current language (default: Japanese)
let currentLanguage = localStorage.getItem('preferredLanguage') || 'ja';

// Translation function
function t(key) {
    if (!translations[currentLanguage]) {
        console.error(`[DEBUG] Translation error: Language '${currentLanguage}' not found.`);
        return key;
    }
    if (!translations[currentLanguage][key]) {
        console.warn(`[DEBUG] Translation warning: Key '${key}' not found for language '${currentLanguage}'.`);
    }
    return translations[currentLanguage][key] || key;
}

// Change language function
function changeLanguage(lang) {
    console.log(`[DEBUG] changeLanguage called with: ${lang}`);
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        console.log(`[DEBUG] Language changed to: ${currentLanguage}`);
        updatePageText();
    } else {
        console.error(`[DEBUG] Attempted to switch to an unsupported language: ${lang}`);
    }
}

// Update all text on the page
function updatePageText() {
    console.log(`[DEBUG] updatePageText called for language: ${currentLanguage}`);
    // Page Title
    document.title = t('pageTitle');

    // Header
    document.querySelector('h1').textContent = t('title');
    document.querySelector('header p').textContent = t('subtitle');
    document.querySelector('label[for="language-selector"]').textContent = t('languageLabel');
    
    // Form
    document.querySelector('.input-section h2').textContent = t('conditionsTitle');
    document.querySelector('label[for="budget"]').textContent = t('budget');
    document.querySelector('label[for="ram"]').textContent = t('ram');
    document.querySelector('label[for="storage-capacity"]').textContent = t('storageCapacity');
    document.querySelector('label[for="cpu-brand"]').textContent = t('cpuBrand');
    document.querySelector('label[for="gpu-brand"]').textContent = t('gpuBrand');
    document.querySelector('label[for="usage"]').textContent = t('usage');
    document.querySelector('.submit-btn').textContent = t('submitBtn');
    
    // Form Options
    document.querySelector('#ram option[value="8GB"]').textContent = t('ram8gb');
    document.querySelector('#ram option[value="16GB"]').textContent = t('ram16gb');
    document.querySelector('#ram option[value="32GB"]').textContent = t('ram32gb');
    document.querySelector('#ram option[value="64GB"]').textContent = t('ram64gb');

    document.querySelector('#storage-capacity option[value="1TB"]').textContent = t('storage1tb');
    document.querySelector('#storage-capacity option[value="2TB"]').textContent = t('storage2tb');
    document.querySelector('#storage-capacity option[value="4TB"]').textContent = t('storage4tb');

    document.querySelector('#cpu-brand option[value="any"]').textContent = t('cpuBrandAny');
    document.querySelector('#cpu-brand option[value="intel"]').textContent = t('cpuBrandIntel');
    document.querySelector('#cpu-brand option[value="amd"]').textContent = t('cpuBrandAmd');

    document.querySelector('#gpu-brand option[value="any"]').textContent = t('gpuBrandAny');
    document.querySelector('#gpu-brand option[value="nvidia"]').textContent = t('gpuBrandNvidia');
    document.querySelector('#gpu-brand option[value="amd"]').textContent = t('gpuBrandAmd');
    
    document.querySelector('#usage option[value="gaming"]').textContent = t('usageGaming');
    document.querySelector('#usage option[value="tarkov"]').textContent = t('usageTarkov');
    document.querySelector('#usage option[value="vrchat"]').textContent = t('usageVrchat');
    
    // Update checkbox translation for includeOS
    const includeOSElement = document.querySelector('[data-translate="includeOS"]');
    if (includeOSElement) {
        includeOSElement.textContent = t('includeOS');
    }
    
    // Results section
    const resultsTitleEl = document.querySelector('#results-section h2');
    if(resultsTitleEl) resultsTitleEl.textContent = t('resultsTitle');
    
    const totalBudgetEl = document.querySelector('.budget-info .label');
    if(totalBudgetEl) totalBudgetEl.textContent = t('totalBudget');

    const totalPriceEl = document.querySelector('.price-info .label');
    if(totalPriceEl) totalPriceEl.textContent = t('totalPrice');
    
    // Table headers
    const headers = document.querySelectorAll('.parts-table th');
    if (headers.length >= 4) {
        headers[0].textContent = t('partCategory');
        headers[1].textContent = t('productName');
        headers[2].textContent = t('price');
        headers[3].textContent = t('specs');
    }
    
    // Loading and error messages
    const loadingEl = document.querySelector('#loading p');
    if(loadingEl) loadingEl.textContent = t('loading');

    const errorEl = document.querySelector('#error-message p');
    if(errorEl) errorEl.textContent = t('error');
    
    // Update language selector if it exists
    const langSelector = document.querySelector('#language-selector');
    if (langSelector) {
        langSelector.value = currentLanguage;
        const jaOption = langSelector.querySelector('option[value="ja"]');
        if(jaOption) jaOption.textContent = t('languageJa');

        const enOption = langSelector.querySelector('option[value="en"]');
        if(enOption) enOption.textContent = t('languageEn');
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
    console.log(`[DEBUG] updatePageText finished for language: ${currentLanguage}`);
}
