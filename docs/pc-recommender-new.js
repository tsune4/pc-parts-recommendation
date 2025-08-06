// PC Parts Recommendation System - New Refactored Version
// ブラウザ対応版（モジュールシステム不使用）

// 設定定義
const RecommendationConfig = {
    USAGE_WEIGHTS: {
        gaming: {
            cpuWeight: 0.25,
            gpuWeight: 0.55,
            ramMin: 16,
            storageType: 'ssd',
            psuMin: 650,
            specialLogic: 'general'
        },
        tarkov: {
            cpuWeight: 0.4,
            gpuWeight: 0.4,
            ramMin: 32,
            storageType: 'ssd',
            psuMin: 750,
            specialLogic: 'x3d_cpu'
        },
        vrchat: {
            cpuWeight: 0.2,
            gpuWeight: 0.65,
            ramMin: 16,
            storageType: 'ssd',
            psuMin: 800,
            specialLogic: 'high_vram_gpu'
        }
    },

    BRAND_KEYWORDS: {
        CPU: new Map([
            ['intel', ['intel', 'core']],
            ['amd', ['amd', 'ryzen']]
        ]),
        GPU: new Map([
            ['nvidia', ['geforce', 'rtx', 'gtx']],
            ['amd', ['radeon', 'rx']]
        ])
    },

    GPU_POWER_ESTIMATES: {
        'rtx 5090': 575, 'rtx 5080': 360, 'rtx 5070 ti': 285, 'rtx 5070': 220,
        'rtx 5060 ti': 180, 'rtx 5060': 115, 'rtx 4090': 450, 'rtx 4080': 320,
        'rtx 4070 ti': 285, 'rtx 4070': 200, 'rtx 4060 ti': 165, 'rtx 4060': 115,
        'rtx 3080': 320, 'rtx 3070': 220, 'rtx 3060': 170,
        'rx 9070 xt': 315, 'rx 9070': 260, 'rx 9060 xt': 190,
        'rx 7900 xtx': 355, 'rx 7900 xt': 315, 'rx 7800 xt': 263,
        'rx 7700 xt': 245, 'rx 7600': 165
    },

    CPU_TDP_ESTIMATES: {
        'i9': 125, 'i7': 125, 'i5': 65, 'i3': 65,
        'ryzen 9': 170, 'ryzen 7': 105, 'ryzen 5': 105, 'ryzen 3': 65
    },

    SYSTEM: {
        PSU_SAFETY_MARGIN: 1.3,
        MIN_SYSTEM_POWER: 100,
        OS_PRICE: 15000,
        SOCKET_MEMORY_MAP: {
            'LGA1700': 'DDR4', 'LGA1851': 'DDR5', 
            'Socket AM5': 'DDR5', 'Socket AM4': 'DDR4'
        },
        UPGRADE_PRIORITIES: {
            gaming: ['gpu', 'cpu', 'storage', 'cooler', 'case'],
            tarkov: ['cpu', 'memory', 'gpu', 'storage', 'cooler'],
            vrchat: ['gpu', 'memory', 'cpu', 'storage', 'cooler']
        }
    }
};

// ブランド検出クラス
class BrandDetector {
    constructor() {
        this.cache = new Map();
        this.cpuKeywords = RecommendationConfig.BRAND_KEYWORDS.CPU;
        this.gpuKeywords = RecommendationConfig.BRAND_KEYWORDS.GPU;
    }

    getBrand(name, brandKeywordsMap) {
        if (!name || typeof name !== 'string') return null;
        
        const partType = brandKeywordsMap === this.cpuKeywords ? 'cpu' : 'gpu';
        const cacheKey = `${name}_${partType}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const lowerName = name.toLowerCase();
        let result = null;
        
        for (const [brand, keywords] of brandKeywordsMap) {
            if (keywords.some(keyword => lowerName.includes(keyword))) {
                result = brand;
                break;
            }
        }
        
        this.cache.set(cacheKey, result);
        return result;
    }

    isCPUBrand(cpu, targetBrand) {
        if (!cpu || !targetBrand || targetBrand === 'any') return true;
        return this.getBrand(cpu.name, this.cpuKeywords) === targetBrand;
    }

    isGPUBrand(gpu, targetBrand) {
        if (!gpu || !targetBrand || targetBrand === 'any') return true;
        return this.getBrand(gpu.name, this.gpuKeywords) === targetBrand;
    }

    isX3DCPU(cpu) {
        if (!cpu || !cpu.name || typeof cpu.name !== 'string') return false;
        const lowerName = cpu.name.toLowerCase();
        return lowerName.includes('x3d') || lowerName.includes('3d');
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * VRAM容量取得（VRChat用）
     * @param {Object} gpu - GPUオブジェクト
     * @returns {number} - VRAM容量（GB）
     */
    getVRAMCapacity(gpu) {
        if (!gpu || !gpu.memory || typeof gpu.memory !== 'string') return 0;
        
        const memory = gpu.memory.toLowerCase();
        const match = memory.match(/(\d+)gb/);
        
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * 高VRAM GPU判定（8GB超え）
     * @param {Object} gpu - GPUオブジェクト
     * @returns {boolean} - 8GB超えかどうか
     */
    isHighVRAMGPU(gpu) {
        return this.getVRAMCapacity(gpu) > 8;
    }
}

// パーツ選択クラス
class PartSelector {
    constructor() {
        this.brandDetector = new BrandDetector();
        this.parseCache = new Map();
    }

    selectBestPart(parts, budget) {
        if (!parts || parts.length === 0) return null;
        
        const withinBudget = parts.filter(part => part.price <= budget);
        if (withinBudget.length === 0) {
            return parts.sort((a, b) => a.price - b.price)[0];
        }
        
        return withinBudget.sort((a, b) => b.price - a.price)[0];
    }

    selectBestGPU(gpus, budget, brand = 'any') {
        if (!gpus || gpus.length === 0) return null;
        
        const withinBudget = gpus.filter(gpu => gpu.price <= budget);
        if (withinBudget.length === 0) {
            return gpus.sort((a, b) => a.price - b.price)[0];
        }
        
        const sortedGPUs = withinBudget.sort((a, b) => b.price - a.price);
        
        if (brand === 'any' && sortedGPUs.length > 1) {
            const topPrice = sortedGPUs[0].price;
            const samePriceGPUs = sortedGPUs.filter(gpu => gpu.price === topPrice);
            
            if (samePriceGPUs.length > 1) {
                const amdGPU = samePriceGPUs.find(gpu => 
                    this.brandDetector.isGPUBrand(gpu, 'amd')
                );
                
                if (amdGPU) {
                    console.log(`同価格GPU検出、AMD優先選択: ${amdGPU.name} (¥${amdGPU.price})`);
                    return amdGPU;
                }
            }
        }
        
        return sortedGPUs[0];
    }

    parseMemoryCapacity(capacityString) {
        if (this.parseCache.has(capacityString)) {
            return this.parseCache.get(capacityString);
        }
        
        let result;
        const match = capacityString.match(/(\d+)GB×(\d+)/);
        if (match) {
            const singleCapacity = parseInt(match[1]);
            const count = parseInt(match[2]);
            result = singleCapacity * count;
        } else {
            const simpleMatch = capacityString.match(/(\d+)GB/);
            if (simpleMatch) {
                result = parseInt(simpleMatch[1]);
            } else {
                result = parseInt(capacityString.replace(/[^\d]/g, '')) || 0;
            }
        }
        
        this.parseCache.set(capacityString, result);
        return result;
    }

    selectMemory(memories, targetCapacity, budget, cpuSocket) {
        if (!memories || memories.length === 0) return null;
        
        const compatibilityChecker = new CompatibilityChecker();
        const compatibleMemoryType = compatibilityChecker.getCompatibleMemoryType(cpuSocket);
        const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
        
        console.log(`メモリ選択: ターゲット${targetCapacityNum}GB, タイプ${compatibleMemoryType}, 予算¥${budget}`);
        
        const compatibleMemories = memories.filter(mem => 
            mem.type.includes(compatibleMemoryType)
        );
        
        if (compatibleMemories.length === 0) {
            console.warn(`警告: ${compatibleMemoryType}メモリが見つかりません。`);
            return memories.sort((a, b) => a.price - b.price)[0];
        }
        
        const suitable = [];
        for (const mem of compatibleMemories) {
            const memCapacity = this.parseMemoryCapacity(mem.capacity);
            const meetsCapacity = memCapacity >= targetCapacityNum;
            const withinBudget = mem.price <= budget;
            
            if (meetsCapacity && withinBudget) {
                suitable.push(mem);
            }
        }
        
        if (suitable.length === 0) {
            return this.selectBestPart(compatibleMemories, budget) || 
                   compatibleMemories.sort((a, b) => a.price - b.price)[0];
        }
        
        return suitable.sort((a, b) => {
            const aCapacity = this.parseMemoryCapacity(a.capacity);
            const bCapacity = this.parseMemoryCapacity(b.capacity);
            const aDistance = Math.abs(aCapacity - targetCapacityNum);
            const bDistance = Math.abs(bCapacity - targetCapacityNum);
            
            if (aDistance !== bDistance) {
                return aDistance - bDistance;
            }
            return b.price - a.price;
        })[0];
    }

    selectStorage(storages, requirements, budget) {
        if (!storages || storages.length === 0) return null;
        
        const targetCapacity = requirements.storage.capacity;
        const withinBudget = storages.filter(storage => storage.price <= budget);
        
        if (withinBudget.length === 0) {
            return storages.sort((a, b) => a.price - b.price)[0];
        }
        
        const suitable = withinBudget.filter(storage => {
            const storageCapacity = this.parseCapacityToGB(storage.capacity);
            const targetCapacityGB = this.parseCapacityToGB(targetCapacity);
            const storageType = storage.type || '';
            return storageCapacity >= targetCapacityGB && 
                   storageType.toLowerCase().includes('ssd');
        });
        
        if (suitable.length === 0) {
            return this.selectBestPart(withinBudget, budget);
        }
        
        return suitable.sort((a, b) => b.price - a.price)[0];
    }

    selectPSU(psus, minWattage, budget) {
        if (!psus || psus.length === 0) return null;
        
        const withinBudget = psus.filter(psu => psu.price <= budget);
        if (withinBudget.length === 0) {
            return psus.sort((a, b) => a.price - b.price)[0];
        }
        
        const suitable = withinBudget.filter(psu => {
            const wattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
            return wattage >= minWattage;
        });
        
        if (suitable.length === 0) {
            return this.selectBestPart(withinBudget, budget);
        }
        
        return suitable.sort((a, b) => {
            const aWattage = parseInt(a.wattage.replace(/[^\d]/g, ''));
            const bWattage = parseInt(b.wattage.replace(/[^\d]/g, ''));
            const aEfficiency = aWattage / a.price;
            const bEfficiency = bWattage / b.price;
            return bEfficiency - aEfficiency;
        })[0];
    }

    selectCheapestPart(parts) {
        if (!parts || parts.length === 0) return null;
        return parts.sort((a, b) => a.price - b.price)[0];
    }

    parseCapacityToGB(capacityStr) {
        if (!capacityStr) return 0;
        
        const match = capacityStr.match(/(\d+(?:\.\d+)?)(TB|GB)/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return unit === 'TB' ? value * 1000 : value;
    }

    clearCache() {
        this.parseCache.clear();
    }
}

// 互換性チェッククラス
class CompatibilityChecker {
    constructor() {
        this.brandDetector = new BrandDetector();
        this.socketCache = new Map();
    }

    getCompatibleMemoryType(cpuSocket) {
        const normalizedSocket = this.normalizeSocket(cpuSocket);
        const socketMap = RecommendationConfig.SYSTEM.SOCKET_MEMORY_MAP;
        
        for (const [socket, memoryType] of Object.entries(socketMap)) {
            if (this.normalizeSocket(socket) === normalizedSocket) {
                return memoryType;
            }
        }
        
        return 'DDR4';
    }

    normalizeSocket(socket) {
        if (!socket || typeof socket !== 'string') return '';
        
        if (this.socketCache.has(socket)) {
            return this.socketCache.get(socket);
        }
        
        let normalized = socket.toLowerCase().trim();
        
        const socketMap = {
            'lga1700': 'lga1700', 'lga 1700': 'lga1700', 'socket 1700': 'lga1700',
            'lga1851': 'lga1851', 'lga 1851': 'lga1851', 'socket 1851': 'lga1851',
            'socket am5': 'socket am5', 'am5': 'socket am5',
            'socket am4': 'socket am4', 'am4': 'socket am4'
        };
        
        const result = socketMap[normalized] || normalized;
        this.socketCache.set(socket, result);
        return result;
    }

    selectCompatibleMotherboard(motherboards, selectedCPU) {
        if (!motherboards || !selectedCPU) return null;
        
        const cpuSocket = this.normalizeSocket(selectedCPU.socket);
        console.log(`マザーボード選択: CPU ${selectedCPU.name}, ソケット ${cpuSocket}`);
        
        const compatibleBoards = motherboards.filter(board => {
            const boardSocket = this.normalizeSocket(board.socket);
            return boardSocket === cpuSocket;
        });
        
        if (compatibleBoards.length === 0) {
            console.warn(`警告: ${cpuSocket}対応マザーボードが見つかりません`);
            return motherboards.sort((a, b) => a.price - b.price)[0];
        }
        
        return compatibleBoards.sort((a, b) => {
            const aScore = this.calculateMotherboardScore(a);
            const bScore = this.calculateMotherboardScore(b);
            return bScore - aScore;
        })[0];
    }

    calculateMotherboardScore(motherboard) {
        let score = 1000 / (motherboard.price / 1000);
        
        if (motherboard.formFactor === 'ATX') score += 10;
        else if (motherboard.formFactor === 'Micro-ATX') score += 5;
        
        const chipset = (motherboard.chipset || '').toLowerCase();
        if (chipset.includes('z') || chipset.includes('x')) score += 15;
        else if (chipset.includes('b')) score += 10;
        
        return score;
    }

    estimateGpuPower(gpu) {
        if (!gpu || !gpu.name || typeof gpu.name !== 'string') return 0;
        
        const lowerName = gpu.name.toLowerCase();
        const powerEstimates = RecommendationConfig.GPU_POWER_ESTIMATES;
        
        for (const [model, power] of Object.entries(powerEstimates)) {
            if (lowerName.includes(model)) {
                return power;
            }
        }
        
        if (lowerName.includes('rtx 50')) return 300;
        if (lowerName.includes('rtx 40')) return 250;
        if (lowerName.includes('rtx 30')) return 220;
        if (lowerName.includes('rx 90')) return 300;
        if (lowerName.includes('rx 70')) return 250;
        if (lowerName.includes('rx 60')) return 180;
        
        return 200;
    }

    estimateCpuTdp(cpu) {
        if (!cpu || !cpu.name || typeof cpu.name !== 'string') return 65;
        
        const lowerName = cpu.name.toLowerCase();
        const tdpEstimates = RecommendationConfig.CPU_TDP_ESTIMATES;
        
        for (const [grade, tdp] of Object.entries(tdpEstimates)) {
            if (lowerName.includes(grade)) {
                return tdp;
            }
        }
        
        if (lowerName.includes('intel')) return 65;
        if (lowerName.includes('amd')) return 105;
        
        return 65;
    }

    calculateSystemPowerRequirement(cpu, gpu) {
        const cpuPower = this.estimateCpuTdp(cpu);
        const gpuPower = this.estimateGpuPower(gpu);
        const systemBasePower = RecommendationConfig.SYSTEM.MIN_SYSTEM_POWER;
        const safetyMargin = RecommendationConfig.SYSTEM.PSU_SAFETY_MARGIN;
        
        const totalPower = (cpuPower + gpuPower + systemBasePower) * safetyMargin;
        
        console.log(`電力計算: CPU ${cpuPower}W + GPU ${gpuPower}W + System ${systemBasePower}W × ${safetyMargin} = ${Math.round(totalPower)}W`);
        
        return Math.round(totalPower);
    }

    selectPSUForSystem(psus, selectedCPU, selectedGPU) {
        if (!psus || psus.length === 0) return null;
        
        const requiredWattage = this.calculateSystemPowerRequirement(selectedCPU, selectedGPU);
        
        const suitablePSUs = psus.filter(psu => {
            const psuWattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
            return psuWattage >= requiredWattage;
        });
        
        if (suitablePSUs.length === 0) {
            console.warn(`警告: ${requiredWattage}W以上の電源が見つかりません`);
            return psus.sort((a, b) => {
                const aWatt = parseInt(a.wattage.replace(/[^\d]/g, ''));
                const bWatt = parseInt(b.wattage.replace(/[^\d]/g, ''));
                return bWatt - aWatt;
            })[0];
        }
        
        return suitablePSUs.sort((a, b) => {
            const aWatt = parseInt(a.wattage.replace(/[^\d]/g, ''));
            const bWatt = parseInt(b.wattage.replace(/[^\d]/g, ''));
            
            const aOverspec = Math.max(0, (aWatt - requiredWattage) / requiredWattage - 0.5);
            const bOverspec = Math.max(0, (bWatt - requiredWattage) / requiredWattage - 0.5);
            
            const aCostEfficiency = (aWatt / a.price) - aOverspec;
            const bCostEfficiency = (bWatt / b.price) - bOverspec;
            
            return bCostEfficiency - aCostEfficiency;
        })[0];
    }

    clearCache() {
        this.socketCache.clear();
    }
}

// メイン推奨エンジン
class RecommendationEngine {
    constructor() {
        this.brandDetector = new BrandDetector();
        this.partSelector = new PartSelector();
        this.compatibilityChecker = new CompatibilityChecker();
    }

    getRecommendations(requirements) {
        console.log('=== PC構成推奨開始 ===');
        console.log('要求仕様:', requirements);
        
        try {
            // パーツデータの存在確認
            if (typeof PARTS_DATA === 'undefined') {
                throw new Error('パーツデータが読み込まれていません');
            }
            
            const partsData = PARTS_DATA;
            
            // パーツデータの整合性チェック
            this.validatePartsData(partsData);
            
            const { availableBudget, selectedOS } = this.handleOSSelection(
                requirements.budget, 
                requirements.includeOS, 
                partsData
            );
            
            console.log(`利用可能予算: ¥${availableBudget} (OS: ${selectedOS ? selectedOS.name : 'なし'})`);
            
            const baseRecommendations = this.buildBaseConfiguration(partsData, requirements, availableBudget);
            const finalRecommendations = this.optimizeBudget(baseRecommendations, partsData, availableBudget, requirements);
            const result = this.buildResult(finalRecommendations, selectedOS, requirements.budget);
            
            console.log('=== 推奨完了 ===');
            return result;
            
        } catch (error) {
            console.error('推奨処理エラー:', error);
            throw new Error(`推奨処理に失敗しました: ${error.message}`);
        }
    }

    handleOSSelection(budget, includeOS, partsData) {
        if (!includeOS || !partsData.os || partsData.os.length === 0) {
            return { availableBudget: budget, selectedOS: null };
        }
        
        const selectedOS = partsData.os[0];
        const availableBudget = budget - selectedOS.price;
        
        if (availableBudget <= 0) {
            throw new Error('予算がOS代金より少ないため、構成を作成できません');
        }
        
        return { availableBudget, selectedOS };
    }

    buildBaseConfiguration(partsData, requirements, availableBudget) {
        const usageConfig = RecommendationConfig.USAGE_WEIGHTS[requirements.usage] || RecommendationConfig.USAGE_WEIGHTS.gaming;
        
        // 極端に予算が少ない場合は最小構成モード
        const isMinimalMode = availableBudget < 130000;
        
        let budgetAllocation;
        if (isMinimalMode) {
            console.log('🔴 最小構成モード: 各パーツの最安値を優先選択');
            budgetAllocation = this.calculateMinimalBudgetAllocation(availableBudget);
        } else {
            budgetAllocation = this.calculateBudgetAllocation(availableBudget, usageConfig);
        }
        
        console.log('予算配分:', budgetAllocation);
        
        const selectedCPU = this.selectCPUByBrand(
            partsData.cpu,
            budgetAllocation.cpu,
            requirements.cpuBrand,
            usageConfig.specialLogic,
            requirements.usage
        );
        
        if (!selectedCPU) {
            throw new Error('適切なCPUが見つかりません');
        }
        
        console.log(`選択されたCPU: ${selectedCPU.name} (¥${selectedCPU.price})`);
        
        // Tarkov用でX3D CPUが予算オーバーした場合の予算調整
        if (requirements.usage === 'tarkov' && selectedCPU.price > budgetAllocation.cpu) {
            const cpuOverage = selectedCPU.price - budgetAllocation.cpu;
            console.log(`🔄 X3D CPU予算オーバー分を他パーツから調整: ¥${cpuOverage.toLocaleString()}`);
            
            // GPU予算から一部を削減
            budgetAllocation.gpu = Math.max(budgetAllocation.gpu - cpuOverage * 0.7, 30000);
            // その他のパーツからも微調整
            budgetAllocation.storage = Math.max(budgetAllocation.storage - cpuOverage * 0.1, 8000);
            budgetAllocation.cooler = Math.max(budgetAllocation.cooler - cpuOverage * 0.1, 3000);
            budgetAllocation.case = Math.max(budgetAllocation.case - cpuOverage * 0.1, 5000);
            
            console.log('調整後予算配分:', budgetAllocation);
        }
        
        const selectedMotherboard = this.compatibilityChecker.selectCompatibleMotherboard(
            partsData.motherboard, 
            selectedCPU
        );
        
        const selectedGPU = this.selectGPUByBrand(
            partsData.gpu,
            budgetAllocation.gpu,
            requirements.gpuBrand,
            usageConfig.specialLogic
        );
        
        const selectedMemory = this.partSelector.selectMemory(
            partsData.memory,
            requirements.ram,
            budgetAllocation.memory,
            selectedCPU.socket
        );
        
        const selectedStorage = this.partSelector.selectStorage(
            partsData.storage,
            requirements,
            budgetAllocation.storage
        );
        
        const selectedPSU = this.compatibilityChecker.selectPSUForSystem(
            partsData.psu,
            selectedCPU,
            selectedGPU
        );
        
        const selectedCooler = this.partSelector.selectBestPart(
            partsData.cooler,
            budgetAllocation.cooler,
            'cooler'
        );
        
        const selectedCase = this.partSelector.selectBestPart(
            partsData.case,
            budgetAllocation.case,
            'case'
        );
        
        return {
            cpu: selectedCPU,
            motherboard: selectedMotherboard,
            gpu: selectedGPU,
            memory: selectedMemory,
            storage: selectedStorage,
            psu: selectedPSU,
            cooler: selectedCooler,
            case: selectedCase
        };
    }

    calculateBudgetAllocation(budget, usageConfig) {
        // 最低予算チェック
        if (budget < 125000) {
            console.warn(`警告: 予算¥${budget.toLocaleString()}は推奨最小予算¥125,000を下回っています`);
        }
        
        const allocation = {
            cpu: Math.floor(budget * usageConfig.cpuWeight),
            gpu: Math.floor(budget * usageConfig.gpuWeight),
            memory: Math.floor(budget * 0.08), // メモリ予算を少し削減
            storage: Math.floor(budget * 0.07), // ストレージ予算を少し削減
            motherboard: Math.floor(budget * 0.06),
            psu: Math.floor(budget * 0.05),
            cooler: Math.floor(budget * 0.025), // クーラー予算を少し削減
            case: Math.floor(budget * 0.025)   // ケース予算を少し削減
        };
        
        const totalAllocated = Object.values(allocation).reduce((sum, val) => sum + val, 0);
        const remaining = budget - totalAllocated;
        
        if (remaining > 0) {
            allocation.gpu += Math.floor(remaining * 0.7);
            allocation.cpu += remaining - Math.floor(remaining * 0.7);
        }
        
        return allocation;
    }

    /**
     * 最小構成用の予算配分
     * @param {number} budget - 予算
     * @returns {Object} - 最小構成用予算配分
     */
    calculateMinimalBudgetAllocation(budget) {
        // 最小構成では各パーツの最安値を想定した固定配分
        return {
            cpu: 20000,      // Intel Core i5 14400F想定
            gpu: 47000,      // RTX 5060想定
            memory: 6000,    // DDR5 16GB想定
            storage: 9000,   // 1TB SSD想定
            motherboard: 13000, // B760マザー想定
            psu: 6000,       // 600W電源想定
            cooler: 3500,    // 空冷クーラー想定
            case: 6000       // ミドルタワー想定
        };
    }

    selectCPUByBrand(cpus, budget, brand, specialLogic, usage) {
        if (!cpus || cpus.length === 0) return null;
        
        // Tarkov用途の場合、X3D CPUを段階的に選択
        if (specialLogic === 'x3d_cpu' && usage === 'tarkov') {
            console.log('🎯 Tarkov専用: スマートX3D CPU選択モード');
            
            // ブランド条件に合うX3D CPUを全て取得
            const allX3dCPUs = cpus.filter(cpu => 
                this.brandDetector.isCPUBrand(cpu, brand) && this.brandDetector.isX3DCPU(cpu)
            ).sort((a, b) => a.price - b.price); // 価格順でソート（安い順）
            
            if (allX3dCPUs.length > 0) {
                const selectedX3dCPU = this.selectOptimalX3dCPU(allX3dCPUs, budget);
                if (selectedX3dCPU) {
                    console.log(`🚀 X3D CPU選択: ${selectedX3dCPU.name} (¥${selectedX3dCPU.price}) - 予算${budget > selectedX3dCPU.price ? '内' : 'オーバー'}`);
                    return selectedX3dCPU;
                }
            } else {
                console.warn('⚠️ X3D CPUが見つからないため通常選択にフォールバック');
            }
        }
        
        // 通常の予算内選択（高速化版）
        const brandFilteredCPUs = this.partSelector.filterPartsByBrand(cpus, brand, 'cpu', 'CPU');
        let filteredCPUs = this.partSelector.getBudgetPartsWithBinarySearch(
            this.partSelector.getPreSortedParts(brandFilteredCPUs, 'cpu'), 
            budget
        );
        
        if (filteredCPUs.length === 0) {
            filteredCPUs = cpus.filter(cpu => this.brandDetector.isCPUBrand(cpu, brand));
            return this.partSelector.selectCheapestPart(filteredCPUs);
        }
        
        return filteredCPUs.sort((a, b) => b.price - a.price)[0];
    }

    /**
     * Tarkov用最適X3D CPU選択
     * @param {Array} x3dCPUs - X3D CPUリスト（価格順ソート済み）
     * @param {number} budget - CPU予算
     * @returns {Object|null} - 選択されたX3D CPU
     */
    selectOptimalX3dCPU(x3dCPUs, budget) {
        // X3D CPUの優先順位とコスパ設定
        const x3dPriority = {
            '7800x3d': { priority: 1, baselineCost: 52800, description: '基準モデル（推奨）' },
            '9800x3d': { priority: 2, baselineCost: 74361, description: '高性能モデル' },
            '9950x3d': { priority: 3, baselineCost: 109980, description: '最上位モデル' }
        };

        // 7800X3Dを基準として探す
        const baseline7800X3D = x3dCPUs.find(cpu => 
            cpu.name.toLowerCase().includes('7800x3d')
        );

        if (baseline7800X3D) {
            console.log(`📍 基準X3D CPU発見: ${baseline7800X3D.name} (¥${baseline7800X3D.price})`);
            
            // まずは7800X3Dを選択（予算オーバーでも）
            let selectedCPU = baseline7800X3D;
            console.log(`✅ 基準選択: ${selectedCPU.name}`);

            // 予算に余裕があるかチェック
            const budgetBuffer = budget - baseline7800X3D.price;
            console.log(`💰 予算余裕: ¥${budgetBuffer.toLocaleString()}`);

            // 余裕がある場合、上位モデルを検討
            if (budgetBuffer > 20000) { // 2万円以上余裕がある場合
                const higherModelCandidates = x3dCPUs.filter(cpu => 
                    cpu.price > baseline7800X3D.price
                );

                for (const candidate of higherModelCandidates) {
                    const upgradeGap = candidate.price - baseline7800X3D.price;
                    const affordableUpgrade = budgetBuffer >= upgradeGap;
                    
                    console.log(`🔍 上位モデル検討: ${candidate.name} (追加¥${upgradeGap.toLocaleString()}, 予算内: ${affordableUpgrade})`);
                    
                    if (affordableUpgrade) {
                        // コスパ判定：9800X3Dは妥当な価格差、9950X3Dは大きな予算余裕が必要
                        if (candidate.name.toLowerCase().includes('9800x3d')) {
                            if (budgetBuffer >= upgradeGap + 10000) { // 9800X3D + 1万円バッファ
                                selectedCPU = candidate;
                                console.log(`⬆️  9800X3Dにアップグレード: ${candidate.name}`);
                            }
                        } else if (candidate.name.toLowerCase().includes('9950x3d')) {
                            if (budgetBuffer >= upgradeGap + 30000) { // 9950X3D + 3万円バッファ
                                selectedCPU = candidate;
                                console.log(`⬆️⬆️ 9950X3Dにアップグレード: ${candidate.name}`);
                            } else {
                                console.log(`💸 9950X3Dは予算余裕不足のためスキップ`);
                            }
                        }
                    }
                }
            } else {
                console.log(`💡 予算余裕が少ないため7800X3Dのまま選択`);
            }

            return selectedCPU;
        } else {
            // 7800X3Dがない場合は利用可能なX3D CPUから選択
            console.warn('⚠️ 7800X3Dが見つからないため利用可能なX3D CPUから選択');
            
            // 予算内で最も高性能なX3D CPUを選択
            const affordableX3d = x3dCPUs.filter(cpu => cpu.price <= budget * 1.2); // 20%オーバーまで許容
            if (affordableX3d.length > 0) {
                return affordableX3d[affordableX3d.length - 1]; // 最も高価格（高性能）を選択
            } else {
                return x3dCPUs[0]; // 最も安いX3D CPUを選択
            }
        }
    }

    selectGPUByBrand(gpus, budget, brand, specialLogic) {
        if (!gpus || gpus.length === 0) return null;
        
        // VRChat用途の場合、高VRAM GPUを優先
        if (specialLogic === 'high_vram_gpu') {
            console.log('🎮 VRChat専用: 高VRAM GPU優先選択モード');
            
            // ブランド条件に合うGPUを取得（高速化版）
            const brandFilteredGPUs = this.partSelector.filterPartsByBrand(gpus, brand, 'gpu', 'GPU');
            
            // 予算内の高VRAM GPU（8GB超え）を探す
            const highVramBudgetGPUs = brandFilteredGPUs.filter(gpu => 
                gpu.price <= budget && this.brandDetector.isHighVRAMGPU(gpu)
            );
            
            if (highVramBudgetGPUs.length > 0) {
                // 高VRAM GPUがある場合、その中で最高性能を選択
                const bestHighVramGPU = highVramBudgetGPUs.sort((a, b) => b.price - a.price)[0];
                const vramCapacity = this.brandDetector.getVRAMCapacity(bestHighVramGPU);
                console.log(`🚀 高VRAM GPU選択: ${bestHighVramGPU.name} (VRAM: ${vramCapacity}GB, ¥${bestHighVramGPU.price})`);
                return bestHighVramGPU;
            } else {
                console.log('⚠️ 予算内に高VRAM GPUがないため、8GB以下でも選択');
                // 高VRAM GPUが予算内にない場合は通常選択にフォールバック
            }
        }
        
        // 通常の予算内選択（高速化版）
        const brandGPUs = this.partSelector.filterPartsByBrand(gpus, brand, 'gpu', 'GPU');
        let filteredGPUs = this.partSelector.getBudgetPartsWithBinarySearch(
            this.partSelector.getPreSortedParts(brandGPUs, 'gpu'),
            budget
        );
        
        if (filteredGPUs.length === 0) {
            filteredGPUs = gpus.filter(gpu => this.brandDetector.isGPUBrand(gpu, brand));
            return this.partSelector.selectCheapestPart(filteredGPUs);
        }
        
        return this.partSelector.selectBestGPU(filteredGPUs, budget, brand);
    }

    optimizeBudget(baseRecommendations, partsData, availableBudget, requirements) {
        const currentTotal = this.calculateTotalPrice(baseRecommendations);
        const remainingBudget = availableBudget - currentTotal;
        
        console.log(`現在の合計: ¥${currentTotal}, 残予算: ¥${remainingBudget}`);
        
        if (remainingBudget <= 0) {
            return baseRecommendations;
        }
        
        return this.upgradePartsInOrder(baseRecommendations, partsData, remainingBudget, requirements);
    }

    upgradePartsInOrder(recommendations, partsData, remainingBudget, requirements) {
        const upgradePriorities = RecommendationConfig.SYSTEM.UPGRADE_PRIORITIES[requirements.usage] || 
                                RecommendationConfig.SYSTEM.UPGRADE_PRIORITIES.gaming;
        
        let budget = remainingBudget;
        const result = { ...recommendations };
        
        for (const partType of upgradePriorities) {
            if (budget <= 0) break;
            
            const upgraded = this.upgradePart(result, partsData, partType, budget, requirements);
            if (upgraded.success) {
                result[partType] = upgraded.part;
                budget -= (upgraded.part.price - (recommendations[partType]?.price || 0));
                console.log(`${partType}をアップグレード: ${upgraded.part.name} (残予算: ¥${budget})`);
            }
        }
        
        return result;
    }

    upgradePart(currentConfig, partsData, partType, budget, requirements) {
        const currentPart = currentConfig[partType];
        if (!currentPart || !partsData[partType]) {
            return { success: false };
        }
        
        const targetBudget = currentPart.price + budget;
        const candidates = partsData[partType].filter(part => 
            part.price > currentPart.price && part.price <= targetBudget
        );
        
        if (candidates.length === 0) {
            return { success: false };
        }
        
        let bestCandidate;
        switch (partType) {
            case 'gpu':
                bestCandidate = this.partSelector.selectBestGPU(candidates, targetBudget, requirements.gpuBrand);
                break;
            case 'cpu':
                bestCandidate = candidates.filter(cpu => 
                    this.brandDetector.isCPUBrand(cpu, requirements.cpuBrand)
                ).sort((a, b) => b.price - a.price)[0];
                break;
            default:
                bestCandidate = this.partSelector.selectBestPart(candidates, targetBudget);
        }
        
        return bestCandidate ? { success: true, part: bestCandidate } : { success: false };
    }

    calculateTotalPrice(recommendations) {
        return Object.values(recommendations)
            .filter(part => part && part.price)
            .reduce((total, part) => total + part.price, 0);
    }

    buildResult(recommendations, selectedOS, totalBudget) {
        const partsTotal = this.calculateTotalPrice(recommendations);
        const osPrice = selectedOS ? selectedOS.price : 0;
        const grandTotal = partsTotal + osPrice;
        
        const result = {
            recommendations,
            totalPrice: partsTotal,
            grandTotal,
            budget: totalBudget,
            remainingBudget: Math.max(0, totalBudget - grandTotal),
            budgetStatus: grandTotal <= totalBudget ? 'within_budget' : 'over_budget'
        };
        
        if (selectedOS) {
            result.recommendations.os = selectedOS;
        }
        
        return result;
    }

    clearAllCaches() {
        this.brandDetector.clearCache();
        this.partSelector.clearCache();
        this.compatibilityChecker.clearCache();
    }

    /**
     * パーツデータの検証
     * @param {Object} partsData - パーツデータ
     */
    validatePartsData(partsData) {
        const requiredCategories = ['cpu', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'cooler', 'case'];
        const missingCategories = [];
        
        for (const category of requiredCategories) {
            if (!partsData[category] || !Array.isArray(partsData[category]) || partsData[category].length === 0) {
                missingCategories.push(category);
            }
        }
        
        if (missingCategories.length > 0) {
            console.warn('⚠️ Missing or empty part categories:', missingCategories);
        }
        
        // パーツオブジェクトの必須プロパティチェック
        this.validatePartObjects(partsData);
    }

    /**
     * パーツオブジェクトの検証
     * @param {Object} partsData - パーツデータ
     */
    validatePartObjects(partsData) {
        const categories = ['cpu', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'cooler', 'case'];
        
        categories.forEach(category => {
            if (!partsData[category]) return;
            
            partsData[category].forEach((part, index) => {
                // 必須プロパティチェック
                if (!part.name || typeof part.name !== 'string') {
                    console.warn(`⚠️ ${category}[${index}]: name property is missing or invalid`);
                    part.name = part.name || `Unknown ${category}`;
                }
                
                if (typeof part.price !== 'number' || part.price <= 0) {
                    console.warn(`⚠️ ${category}[${index}]: price property is missing or invalid`);
                    part.price = part.price || 1000; // デフォルト価格
                }
                
                // カテゴリ固有の検証
                this.validateCategorySpecificProperties(category, part, index);
            });
        });
    }

    /**
     * カテゴリ固有プロパティの検証
     * @param {string} category - カテゴリ
     * @param {Object} part - パーツオブジェクト
     * @param {number} index - インデックス
     */
    validateCategorySpecificProperties(category, part, index) {
        switch (category) {
            case 'cpu':
                if (!part.socket || typeof part.socket !== 'string') {
                    console.warn(`⚠️ cpu[${index}]: socket property is missing`);
                    part.socket = part.socket || 'Unknown';
                }
                break;
                
            case 'motherboard':
                if (!part.socket || typeof part.socket !== 'string') {
                    console.warn(`⚠️ motherboard[${index}]: socket property is missing`);
                    part.socket = part.socket || 'Unknown';
                }
                if (!part.chipset || typeof part.chipset !== 'string') {
                    part.chipset = part.chipset || 'Unknown';
                }
                break;
                
            case 'memory':
                if (!part.type || typeof part.type !== 'string') {
                    console.warn(`⚠️ memory[${index}]: type property is missing`);
                    part.type = part.type || 'DDR4';
                }
                if (!part.capacity || typeof part.capacity !== 'string') {
                    console.warn(`⚠️ memory[${index}]: capacity property is missing`);
                    part.capacity = part.capacity || '16GB';
                }
                break;
                
            case 'storage':
                if (!part.type || typeof part.type !== 'string') {
                    part.type = part.type || 'SSD';
                }
                if (!part.capacity || typeof part.capacity !== 'string') {
                    part.capacity = part.capacity || '1TB';
                }
                break;
                
            case 'psu':
                if (!part.wattage || typeof part.wattage !== 'string') {
                    console.warn(`⚠️ psu[${index}]: wattage property is missing`);
                    part.wattage = part.wattage || '600W';
                }
                break;
        }
    }
}

// グローバルインスタンス
let recommendationEngine;

function initializeEngine() {
    if (!recommendationEngine) {
        recommendationEngine = new RecommendationEngine();
    }
    return recommendationEngine;
}

// メイン関数（既存コードとの互換性維持）
function getRecommendations(requirements) {
    const engine = initializeEngine();
    return engine.getRecommendations(requirements);
}

// 用途別推奨設定取得
function getUsageRecommendations(usage) {
    return RecommendationConfig.USAGE_WEIGHTS[usage] || RecommendationConfig.USAGE_WEIGHTS.gaming;
}

// レガシー関数群（既存コードとの互換性）
function getBrand(name, brandKeywordsMap) {
    const engine = initializeEngine();
    return engine.brandDetector.getBrand(name, brandKeywordsMap);
}

function isCPUBrand(cpu, targetBrand) {
    const engine = initializeEngine();
    return engine.brandDetector.isCPUBrand(cpu, targetBrand);
}

function isGPUBrand(gpu, targetBrand) {
    const engine = initializeEngine();
    return engine.brandDetector.isGPUBrand(gpu, targetBrand);
}

function isX3DCPU(cpu) {
    const engine = initializeEngine();
    return engine.brandDetector.isX3DCPU(cpu);
}

function selectBestPart(parts, budget) {
    const engine = initializeEngine();
    return engine.partSelector.selectBestPart(parts, budget);
}

function selectBestGPU(gpus, budget, brand = 'any') {
    const engine = initializeEngine();
    return engine.partSelector.selectBestGPU(gpus, budget, brand);
}

function parseMemoryCapacity(capacityString) {
    const engine = initializeEngine();
    return engine.partSelector.parseMemoryCapacity(capacityString);
}

function selectMemory(memories, targetCapacity, budget, cpuSocket) {
    const engine = initializeEngine();
    return engine.partSelector.selectMemory(memories, targetCapacity, budget, cpuSocket);
}

function selectStorage(storages, requirements, budget) {
    const engine = initializeEngine();
    return engine.partSelector.selectStorage(storages, requirements, budget);
}

function selectPSU(psus, minWattage, budget) {
    const engine = initializeEngine();
    return engine.partSelector.selectPSU(psus, minWattage, budget);
}

function getCompatibleMemoryType(socket) {
    const engine = initializeEngine();
    return engine.compatibilityChecker.getCompatibleMemoryType(socket);
}

function selectCompatibleMotherboard(motherboards, selectedCPU) {
    const engine = initializeEngine();
    return engine.compatibilityChecker.selectCompatibleMotherboard(motherboards, selectedCPU);
}

function selectPSUForSystem(psus, selectedCPU, selectedGPU) {
    const engine = initializeEngine();
    return engine.compatibilityChecker.selectPSUForSystem(psus, selectedCPU, selectedGPU);
}

function estimateCpuTdp(cpu) {
    const engine = initializeEngine();
    return engine.compatibilityChecker.estimateCpuTdp(cpu);
}

function estimateGpuPower(gpu) {
    const engine = initializeEngine();
    return engine.compatibilityChecker.estimateGpuPower(gpu);
}

function selectCheapestPart(parts) {
    const engine = initializeEngine();
    return engine.partSelector.selectCheapestPart(parts);
}

function parseCapacityToGB(capacityStr) {
    const engine = initializeEngine();
    return engine.partSelector.parseCapacityToGB(capacityStr);
}

// 互換性のためのグローバル変数
const CPU_BRAND_KEYWORDS = RecommendationConfig.BRAND_KEYWORDS.CPU;
const GPU_BRAND_KEYWORDS = RecommendationConfig.BRAND_KEYWORDS.GPU;