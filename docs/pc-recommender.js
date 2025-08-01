// PC Parts Recommendation Engine - Client Side Version

// パフォーマンス最適化用キャッシュ
const parseCache = new Map();
const socketNormalizeCache = new Map();

// 用途別の重み設定と特別ロジック
function getUsageRecommendations(usage) {
    const recommendations = {
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
    };
    
    return recommendations[usage] || recommendations.gaming;
}

// 予算内で最適なパーツを選択
function selectBestPart(parts, budget) {
    if (!parts || parts.length === 0) return null;
    
    const withinBudget = parts.filter(part => part.price <= budget);
    if (withinBudget.length === 0) {
        return parts.sort((a, b) => a.price - b.price)[0];
    }
    
    return withinBudget.sort((a, b) => b.price - a.price)[0];
}

// メモリ容量を正しく解析する関数（キャッシュ機能付き）
function parseMemoryCapacity(capacityString) {
    // キャッシュから値を取得
    if (parseCache.has(capacityString)) {
        return parseCache.get(capacityString);
    }
    
    let result;
    // "16GB×2" → 32, "16GB×1" → 16, "32GB×2" → 64
    const match = capacityString.match(/(\d+)GB×(\d+)/);
    if (match) {
        const singleCapacity = parseInt(match[1]);
        const count = parseInt(match[2]);
        result = singleCapacity * count;
    } else {
        // "16GB" のような単純な形式
        const simpleMatch = capacityString.match(/(\d+)GB/);
        if (simpleMatch) {
            result = parseInt(simpleMatch[1]);
        } else {
            // フォールバック：数字のみを抽出
            result = parseInt(capacityString.replace(/[^\d]/g, '')) || 0;
        }
    }
    
    // 結果をキャッシュに保存
    parseCache.set(capacityString, result);
    return result;
}

// メモリ選択（互換性考慮版）
function selectMemory(memories, targetCapacity, budget, cpuSocket) {
    if (!memories || memories.length === 0) return null;
    
    const compatibleMemoryType = getCompatibleMemoryType(cpuSocket);
    const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
    
    console.log(`メモリ選択: ターゲット${targetCapacityNum}GB, タイプ${compatibleMemoryType}, 予算¥${budget}`);
    
    // CPU互換性のあるメモリのみフィルタリング
    const compatibleMemories = memories.filter(mem => mem.type.includes(compatibleMemoryType));
    
    if (compatibleMemories.length === 0) {
        console.warn(`警告: ${compatibleMemoryType}メモリが見つかりません。`);
        return memories.sort((a, b) => a.price - b.price)[0];
    }
    
    // 単一パスでメモリ選択最適化
    const suitable = [];
    for (const mem of compatibleMemories) {
        const memCapacity = parseMemoryCapacity(mem.capacity);
        const meetsCapacity = memCapacity >= targetCapacityNum;
        const withinBudget = mem.price <= budget;
        
        console.log(`  候補: ${mem.name} (${mem.capacity} = ${memCapacity}GB, 予算内:${withinBudget})`);
        
        if (meetsCapacity && withinBudget) {
            suitable.push(mem);
        }
    }
    
    if (suitable.length === 0) {
        console.warn(`予算¥${budget}で${targetCapacityNum}GB以上のメモリが見つかりません`);
        const closestCapacity = compatibleMemories.filter(mem => {
            const memCapacity = parseMemoryCapacity(mem.capacity);
            return memCapacity >= targetCapacityNum;
        });
        
        if (closestCapacity.length > 0) {
            const fallback = closestCapacity.sort((a, b) => a.price - b.price)[0];
            console.warn(`フォールバック選択: ${fallback.name} (${fallback.capacity})`);
            return fallback;
        }
        
        return compatibleMemories[0];
    }
    
    // 条件を満たすメモリの中で要求容量に最も近いもの優先、同じ容量なら高価なもの
    const selected = suitable.sort((a, b) => {
        const aCapacity = parseMemoryCapacity(a.capacity);
        const bCapacity = parseMemoryCapacity(b.capacity);
        
        // 要求容量に近い順でソート（昇順）
        const aDiff = aCapacity - targetCapacityNum;
        const bDiff = bCapacity - targetCapacityNum;
        
        if (aDiff !== bDiff) {
            return aDiff - bDiff; // 容量差が小さい方が優先
        }
        
        // 容量が同じなら価格で選択（高い方が優先）
        return b.price - a.price;
    })[0];
    
    console.log(`メモリ選択結果: ${selected.name} (${selected.capacity})`);
    return selected;
}

// ストレージ選択
function selectStorage(storages, requirements, budget) {
    if (!storages || storages.length === 0) return null;
    
    const { capacity: targetCapacity, type: storageType } = requirements;
    const targetCapacityNum = parseInt(targetCapacity.replace(/[^\\d]/g, ''));
    
    let suitable = storages.filter(storage => {
        const storageCapacityNum = parseInt(storage.capacity.replace(/[^\\d]/g, ''));
        return storageCapacityNum >= targetCapacityNum && storage.price <= budget;
    });
    
    if (storageType === 'ssd') {
        suitable = suitable.filter(storage => 
            storage.interface === 'NVMe' || storage.formFactor === 'M.2'
        );
    }
    
    if (suitable.length === 0) {
        return storages.sort((a, b) => a.price - b.price)[0];
    }
    
    return suitable.sort((a, b) => b.price - a.price)[0];
}

// ブランド別CPU選択（特別ロジック対応）
function selectCPUByBrand(cpus, budget, brand, specialLogic = 'general') {
    if (!cpus || cpus.length === 0) return null;

    let filteredCPUs = cpus;
    
    if (brand && brand !== 'any') {
        filteredCPUs = cpus.filter(cpu => {
            const cpuName = cpu.name.toLowerCase();
            if (brand === 'intel') {
                return cpuName.includes('intel') || cpuName.includes('core');
            } else if (brand === 'amd') {
                return cpuName.includes('amd') || cpuName.includes('ryzen');
            }
            return true;
        });
        
        console.log(`Filtered ${filteredCPUs.length} ${brand.toUpperCase()} CPUs from ${cpus.length} total CPUs`);
    }
    
    if (filteredCPUs.length === 0) {
        console.log(`No ${brand} CPUs found, using all CPUs`);
        filteredCPUs = cpus;
    }
    
    // X3D CPU優先ロジック (Escape From Tarkov用)
    if (specialLogic === 'x3d_cpu') {
        const x3dCPUs = filteredCPUs.filter(cpu => 
            cpu.name.toLowerCase().includes('x3d') || 
            cpu.name.toLowerCase().includes('3d')
        );
        
        if (x3dCPUs.length > 0) {
            console.log(`X3D CPU優先選択: ${x3dCPUs.length}個のX3D CPUを発見`);
            // X3D CPUから予算内で最適なものを選択
            const selectedX3D = selectBestPart(x3dCPUs, budget);
            if (selectedX3D) {
                console.log(`X3D CPU選択: ${selectedX3D.name}`);
                return selectedX3D;
            }
        } else {
            console.log('X3D CPUが見つからないため、通常のCPU選択を実行');
        }
    }
    
    return selectBestPart(filteredCPUs, budget);
}

// ブランド別GPU選択（特別ロジック対応）
function selectGPUByBrand(gpus, budget, brand, specialLogic = 'general') {
    if (!gpus || gpus.length === 0) return null;

    let filteredGPUs = gpus;
    
    if (brand && brand !== 'any') {
        filteredGPUs = gpus.filter(gpu => {
            const gpuName = gpu.name.toLowerCase();
            if (brand === 'nvidia') {
                return gpuName.includes('geforce') || gpuName.includes('rtx') || gpuName.includes('gtx');
            } else if (brand === 'amd') {
                return gpuName.includes('radeon') || gpuName.includes('rx');
            }
            return true;
        });
        
        console.log(`Filtered ${filteredGPUs.length} ${brand.toUpperCase()} GPUs from ${gpus.length} total GPUs`);
    }
    
    if (filteredGPUs.length === 0) {
        console.log(`No ${brand} GPUs found, using all GPUs`);
        filteredGPUs = gpus;
    }
    
    // VRAM優先ロジック (VRChat用)
    if (specialLogic === 'high_vram_gpu') {
        console.log('VRAM優先GPU選択モードを実行');
        
        // VRAM量を抽出してソートする関数
        const extractVRAM = (gpu) => {
            if (!gpu.memory) return 0;
            const match = gpu.memory.match(/(\d+)GB/);
            return match ? parseInt(match[1]) : 0;
        };
        
        // 予算内のGPUをVRAM量でソート（高VRAM優先）
        const budgetGPUs = filteredGPUs.filter(gpu => gpu.price <= budget);
        
        if (budgetGPUs.length > 0) {
            const vramSortedGPUs = budgetGPUs.sort((a, b) => {
                const vramA = extractVRAM(a);
                const vramB = extractVRAM(b);
                
                if (vramA !== vramB) {
                    return vramB - vramA; // VRAMが多い順
                }
                
                return b.price - a.price; // 同VRAMなら高価格順
            });
            
            const selectedGPU = vramSortedGPUs[0];
            const selectedVRAM = extractVRAM(selectedGPU);
            console.log(`VRAM優先GPU選択: ${selectedGPU.name} (VRAM: ${selectedVRAM}GB)`);
            return selectedGPU;
        } else {
            console.log('予算内のGPUがないため、最安価GPUを選択');
        }
    }
    
    return selectBestPart(filteredGPUs, budget);
}

// PSU選択
function selectPSU(psus, minWattage, budget) {
    if (!psus || psus.length === 0) return null;
    
    const suitable = psus.filter(psu => {
        const wattage = parseInt(psu.wattage.replace(/[^\\d]/g, ''));
        return wattage >= minWattage && psu.price <= budget;
    });
    
    if (suitable.length === 0) {
        return psus.filter(psu => {
            const wattage = parseInt(psu.wattage.replace(/[^\\d]/g, ''));
            return wattage >= minWattage;
        }).sort((a, b) => a.price - b.price)[0] || psus[0];
    }
    
    return suitable.sort((a, b) => b.price - a.price)[0];
}

// プロのPCビルダーアシスタント - フェーズ1: 基本パーツの仮決定
function selectBasicParts(partsData, requirements, selectedCPU) {
    const { ram, storage } = requirements;
    
    if (!selectedCPU || !selectedCPU.socket) {
        console.error('エラー: CPUが選択されていないか、ソケット情報が不足しています');
        return {
            memory: partsData.memory?.[0] || null,
            storage: partsData.storage?.[0] || null,
            case: partsData.case?.[0] || null
        };
    }
    
    // RAMの選定（CPUソケットと互換性のある指定容量）
    const selectedRAM = selectCompatibleMemoryByCapacity(partsData.memory, ram, selectedCPU.socket);
    
    // ストレージの選定（ユーザー指定容量）
    const selectedStorage = selectStorageByCapacity(partsData.storage, storage.capacity);
    
    // PCケースの選定（最安価）
    const selectedCase = selectCheapestPart(partsData.case);
    
    return {
        memory: selectedRAM,
        storage: selectedStorage,
        case: selectedCase
    };
}

// フェーズ2: 予算内でのアップグレード（優先順位: GPU → CPU → Motherboard → Cooler → PSU → PC Case）
function upgradePartsInOrder(currentRecommendations, allParts, remainingBudget, requirements) {
    const optimized = { ...currentRecommendations };
    let availableBudget = remainingBudget;
    
    console.log(`Starting professional upgrade with ¥${availableBudget} remaining budget`);
    
    // 優先度1: GPUアップグレード
    if (availableBudget > 0) {
        const gpuUpgrade = upgradeGPU(optimized.gpu, allParts.gpu, requirements.gpuBrand, availableBudget);
        if (gpuUpgrade && gpuUpgrade.price > optimized.gpu.price) {
            const upgradeCost = gpuUpgrade.price - optimized.gpu.price;
            console.log(`Upgrading GPU: ${optimized.gpu.name} (¥${optimized.gpu.price}) -> ${gpuUpgrade.name} (¥${gpuUpgrade.price})`);
            optimized.gpu = gpuUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 優先度2: CPUアップグレード
    if (availableBudget > 0) {
        const cpuUpgrade = upgradeCPU(optimized.cpu, allParts.cpu, requirements.cpuBrand, availableBudget);
        if (cpuUpgrade && cpuUpgrade.price > optimized.cpu.price) {
            const upgradeCost = cpuUpgrade.price - optimized.cpu.price;
            console.log(`Upgrading CPU: ${optimized.cpu.name} (¥${optimized.cpu.price}) -> ${cpuUpgrade.name} (¥${cpuUpgrade.price})`);
            optimized.cpu = cpuUpgrade;
            availableBudget -= upgradeCost;
            
            // CPUが変更された場合、マザーボードとメモリの互換性を再確認
            const newMotherboard = selectCompatibleMotherboard(allParts.motherboard, cpuUpgrade);
            if (newMotherboard && newMotherboard.name !== optimized.motherboard.name) {
                const mbCostDiff = newMotherboard.price - optimized.motherboard.price;
                console.log(`CPU変更によりマザーボード再選択: ${optimized.motherboard.name} -> ${newMotherboard.name} (差額: ¥${mbCostDiff})`);
                optimized.motherboard = newMotherboard;
                availableBudget -= mbCostDiff;
            }
            
            const newMemory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, cpuUpgrade.socket);
            if (newMemory && newMemory.name !== optimized.memory.name) {
                const memCostDiff = newMemory.price - optimized.memory.price;
                console.log(`CPU変更によりメモリ再選択: ${optimized.memory.name} -> ${newMemory.name} (差額: ¥${memCostDiff})`);
                optimized.memory = newMemory;
                availableBudget -= memCostDiff;
            }
        }
    }
    
    // 優先度3: マザーボードアップグレード
    if (availableBudget > 0) {
        const motherboardUpgrade = upgradeMotherboard(optimized.motherboard, allParts.motherboard, optimized.cpu.socket, availableBudget);
        if (motherboardUpgrade && motherboardUpgrade.price > optimized.motherboard.price) {
            const upgradeCost = motherboardUpgrade.price - optimized.motherboard.price;
            console.log(`Upgrading motherboard: ${optimized.motherboard.name} (¥${optimized.motherboard.price}) -> ${motherboardUpgrade.name} (¥${motherboardUpgrade.price})`);
            optimized.motherboard = motherboardUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 優先度4: クーラーアップグレード
    if (availableBudget > 0) {
        const coolerUpgrade = upgradeCooler(optimized.cooler, allParts.cooler, availableBudget);
        if (coolerUpgrade && coolerUpgrade.price > optimized.cooler.price) {
            const upgradeCost = coolerUpgrade.price - optimized.cooler.price;
            console.log(`Upgrading cooler: ${optimized.cooler.name} (¥${optimized.cooler.price}) -> ${coolerUpgrade.name} (¥${coolerUpgrade.price})`);
            optimized.cooler = coolerUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 優先度5: PSUアップグレード
    if (availableBudget > 0) {
        const psuUpgrade = upgradePSU(optimized.psu, allParts.psu, optimized.cpu, optimized.gpu, availableBudget);
        if (psuUpgrade && psuUpgrade.price > optimized.psu.price) {
            const upgradeCost = psuUpgrade.price - optimized.psu.price;
            console.log(`Upgrading PSU: ${optimized.psu.name} (¥${optimized.psu.price}) -> ${psuUpgrade.name} (¥${psuUpgrade.price})`);
            optimized.psu = psuUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 優先度6: PCケースアップグレード
    if (availableBudget > 0) {
        const caseUpgrade = upgradeCase(optimized.case, allParts.case, optimized.motherboard.formFactor, availableBudget);
        if (caseUpgrade && caseUpgrade.price > optimized.case.price) {
            const upgradeCost = caseUpgrade.price - optimized.case.price;
            console.log(`Upgrading PC case: ${optimized.case.name} (¥${optimized.case.price}) -> ${caseUpgrade.name} (¥${caseUpgrade.price})`);
            optimized.case = caseUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 最後にストレージアップグレード（容量固定のため最後）
    if (availableBudget > 0) {
        const storageUpgrade = upgradeStorage(optimized.storage, allParts.storage, requirements.storage.capacity, availableBudget);
        if (storageUpgrade && storageUpgrade.price > optimized.storage.price) {
            const upgradeCost = storageUpgrade.price - optimized.storage.price;
            console.log(`Upgrading storage: ${optimized.storage.name} (¥${optimized.storage.price}) -> ${storageUpgrade.name} (¥${storageUpgrade.price})`);
            optimized.storage = storageUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    console.log(`Professional upgrade completed. Remaining budget: ¥${availableBudget}`);
    return optimized;
}

// ソケットとメモリタイプの互換性チェック
function getCompatibleMemoryType(socket) {
    const socketMemoryMap = {
        'Socket AM5': 'DDR5',   // AM5ソケットはDDR5のみ
        'Socket AM4': 'DDR4',   // AM4ソケットはDDR4のみ  
        'LGA1700': 'DDR5',      // LGA1700は最新世代でDDR5対応
        'LGA1851': 'DDR5'       // LGA1851はDDR5のみ
    };
    
    return socketMemoryMap[socket] || 'DDR4'; // デフォルトはDDR4
}

// CPUと互換性のあるRAMを容量で選択（最安価）
function selectCompatibleMemoryByCapacity(memories, targetCapacity, cpuSocket) {
    if (!memories || memories.length === 0) return null;
    
    const compatibleMemoryType = getCompatibleMemoryType(cpuSocket);
    const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
    
    console.log(`CPUソケット: ${cpuSocket}, 必要メモリタイプ: ${compatibleMemoryType}`);
    
    // 互換性のあるメモリのみフィルタリング
    const compatibleMemories = memories.filter(mem => mem.type.includes(compatibleMemoryType));
    
    if (compatibleMemories.length === 0) {
        console.warn(`警告: ${compatibleMemoryType}メモリが見つかりません。任意のメモリを選択します。`);
        return memories.sort((a, b) => a.price - b.price)[0];
    }
    
    // parseMemoryCapacity関数を使用して正確な容量解析
    const exactMatches = compatibleMemories.filter(mem => {
        const memCapacity = parseMemoryCapacity(mem.capacity);
        return memCapacity === targetCapacityNum;
    });
    
    if (exactMatches.length > 0) {
        const selected = exactMatches.sort((a, b) => a.price - b.price)[0];
        console.log(`メモリ選択: ${selected.name} (${selected.capacity} = ${parseMemoryCapacity(selected.capacity)}GB)`);
        return selected;
    }
    
    // 完全一致がない場合は、指定容量以上で最も近い容量を選択
    const suitableMatches = compatibleMemories.filter(mem => {
        const memCapacity = parseMemoryCapacity(mem.capacity);
        return memCapacity >= targetCapacityNum;
    });
    
    if (suitableMatches.length > 0) {
        // 要求容量に最も近いもの優先、同じ容量なら安い方
        const selected = suitableMatches.sort((a, b) => {
            const aCapacity = parseMemoryCapacity(a.capacity);
            const bCapacity = parseMemoryCapacity(b.capacity);
            
            const aDiff = aCapacity - targetCapacityNum;
            const bDiff = bCapacity - targetCapacityNum;
            
            if (aDiff !== bDiff) {
                return aDiff - bDiff; // 容量差が小さい方が優先
            }
            
            return a.price - b.price; // 同じ容量なら安い方
        })[0];
        
        console.log(`メモリ選択: ${selected.name} (${selected.capacity} = ${parseMemoryCapacity(selected.capacity)}GB)`);
        return selected;
    }
    
    // フォールバック
    const selected = compatibleMemories.sort((a, b) => a.price - b.price)[0];
    console.log(`フォールバックメモリ選択: ${selected.name} (${selected.capacity})`);
    return selected;
}

// ユーザー指定容量でストレージを選択（最安価）
function selectStorageByCapacity(storages, targetCapacity) {
    if (!storages || storages.length === 0) return null;
    
    const targetCapacityGB = parseCapacityToGB(targetCapacity);
    
    // 指定容量と完全一致するストレージを優先
    const exactMatches = storages.filter(storage => {
        const storageCapacityGB = parseCapacityToGB(storage.capacity);
        return storageCapacityGB === targetCapacityGB;
    });
    
    if (exactMatches.length > 0) {
        const selected = exactMatches.sort((a, b) => a.price - b.price)[0];
        console.log(`ストレージ選択 (指定容量完全一致): ${selected.name} (${selected.capacity})`);
        return selected;
    }
    
    // 指定容量以上のストレージがない場合は、最大容量を選択
    const suitableStorages = storages.filter(storage => {
        const storageCapacityGB = parseCapacityToGB(storage.capacity);
        return storageCapacityGB >= targetCapacityGB;
    });
    
    if (suitableStorages.length > 0) {
        const selected = suitableStorages.sort((a, b) => a.price - b.price)[0];
        console.log(`ストレージ選択 (指定容量以上): ${selected.name} (${selected.capacity})`);
        return selected;
    }
    
    // 指定容量以上がない場合は最大容量を選択
    const maxCapacityStorage = storages.sort((a, b) => {
        const capacityA = parseCapacityToGB(a.capacity);
        const capacityB = parseCapacityToGB(b.capacity);
        return capacityB - capacityA;
    })[0];
    
    console.log(`ストレージ選択 (最大容量): ${maxCapacityStorage.name} (${maxCapacityStorage.capacity})`);
    return maxCapacityStorage;
}

// 最安価パーツを選択
function selectCheapestPart(parts) {
    if (!parts || parts.length === 0) return null;
    return parts.sort((a, b) => a.price - b.price)[0];
}

// ストレージのアップグレード（同容量の高性能モデル）
function upgradeStorage(currentStorage, allStorages, targetCapacity, budget) {
    if (!allStorages || allStorages.length === 0) return null;
    
    const targetCapacityGB = parseCapacityToGB(targetCapacity);
    const sameCapacityStorages = allStorages.filter(storage => {
        const storageCapacityGB = parseCapacityToGB(storage.capacity);
        return storageCapacityGB === targetCapacityGB;
    });
    
    // 単一パスで最適化されたストレージアップグレード処理
    const betterStorages = [];
    const maxPrice = currentStorage.price + budget;
    
    for (const storage of sameCapacityStorages) {
        if (storage.price > currentStorage.price && storage.price <= maxPrice) {
            betterStorages.push(storage);
        }
    }
    
    betterStorages.sort((a, b) => b.price - a.price);
    
    return betterStorages.length > 0 ? betterStorages[0] : null;
}

// CPUクーラーのアップグレード
function upgradeCooler(currentCooler, allCoolers, budget) {
    if (!allCoolers || allCoolers.length === 0) return null;
    
    const betterCoolers = allCoolers
        .filter(cooler => cooler.price > currentCooler.price)
        .filter(cooler => cooler.price <= currentCooler.price + budget)
        .sort((a, b) => b.price - a.price);
    
    return betterCoolers.length > 0 ? betterCoolers[0] : null;
}

// GPUアップグレード関数
function upgradeGPU(currentGPU, allGPUs, gpuBrand, budget) {
    if (!allGPUs || allGPUs.length === 0) return null;
    
    // ブランド制限があるかチェック
    let compatibleGPUs = allGPUs;
    if (gpuBrand && gpuBrand !== 'any') {
        compatibleGPUs = allGPUs.filter(gpu => {
            if (gpuBrand === 'nvidia') {
                return gpu.name.toLowerCase().includes('geforce') || gpu.name.toLowerCase().includes('rtx');
            } else if (gpuBrand === 'amd') {
                return gpu.name.toLowerCase().includes('radeon');
            }
            return true;
        });
    }
    
    // 単一パスで最適化されたGPUアップグレード処理
    const betterGPUs = [];
    const maxPrice = currentGPU.price + budget;
    
    for (const gpu of compatibleGPUs) {
        if (gpu.price > currentGPU.price && gpu.price <= maxPrice) {
            betterGPUs.push(gpu);
        }
    }
    
    betterGPUs.sort((a, b) => b.price - a.price);
    
    return betterGPUs.length > 0 ? betterGPUs[0] : null;
}

// CPUアップグレード関数
function upgradeCPU(currentCPU, allCPUs, cpuBrand, budget) {
    if (!allCPUs || allCPUs.length === 0) return null;
    
    // ブランド制限があるかチェック
    let compatibleCPUs = allCPUs;
    if (cpuBrand && cpuBrand !== 'any') {
        compatibleCPUs = allCPUs.filter(cpu => {
            if (cpuBrand === 'intel') {
                return cpu.name.toLowerCase().includes('intel');
            } else if (cpuBrand === 'amd') {
                return cpu.name.toLowerCase().includes('amd');
            }
            return true;
        });
    }
    
    // 単一パスで最適化されたCPUアップグレード処理
    const betterCPUs = [];
    const maxPrice = currentCPU.price + budget;
    
    for (const cpu of compatibleCPUs) {
        if (cpu.price > currentCPU.price && cpu.price <= maxPrice) {
            betterCPUs.push(cpu);
        }
    }
    
    betterCPUs.sort((a, b) => b.price - a.price);
    
    return betterCPUs.length > 0 ? betterCPUs[0] : null;
}

// マザーボードアップグレード関数
function upgradeMotherboard(currentMotherboard, allMotherboards, cpuSocket, budget) {
    if (!allMotherboards || allMotherboards.length === 0) return null;
    
    // 同じソケットの互換マザーボードのみ
    const compatibleMotherboards = allMotherboards.filter(mb => mb.socket === cpuSocket);
    
    const betterMotherboards = compatibleMotherboards
        .filter(mb => mb.price > currentMotherboard.price)
        .filter(mb => mb.price <= currentMotherboard.price + budget)
        .sort((a, b) => b.price - a.price);
    
    return betterMotherboards.length > 0 ? betterMotherboards[0] : null;
}

// PSUアップグレード関数
function upgradePSU(currentPSU, allPSUs, cpu, gpu, budget) {
    if (!allPSUs || allPSUs.length === 0) return null;
    
    // より高い電力容量・効率のPSUを探す
    const betterPSUs = allPSUs
        .filter(psu => {
            const currentWattage = parseInt(currentPSU.wattage);
            const newWattage = parseInt(psu.wattage);
            return newWattage >= currentWattage; // 同等以上の電力容量
        })
        .filter(psu => psu.price > currentPSU.price)
        .filter(psu => psu.price <= currentPSU.price + budget)
        .sort((a, b) => {
            // 効率レベルで比較 (PLATINUM > GOLD > BRONZE > STANDARD)
            const efficiencyScore = (eff) => {
                switch(eff.toUpperCase()) {
                    case 'PLATINUM': return 4;
                    case 'GOLD': return 3;
                    case 'BRONZE': return 2;
                    case 'STANDARD': return 1;
                    default: return 0;
                }
            };
            
            const aScore = efficiencyScore(a.efficiency);
            const bScore = efficiencyScore(b.efficiency);
            
            if (aScore !== bScore) {
                return bScore - aScore; // 効率が高い順
            }
            
            return b.price - a.price; // 同効率なら高価格順
        });
    
    return betterPSUs.length > 0 ? betterPSUs[0] : null;
}

// PCケースアップグレード関数
function upgradeCase(currentCase, allCases, motherboardFormFactor, budget) {
    if (!allCases || allCases.length === 0) return null;
    
    // マザーボードの互換性をチェック
    const compatibleCases = allCases.filter(pcCase => {
        return pcCase.formFactor.includes(motherboardFormFactor);
    });
    
    const betterCases = compatibleCases
        .filter(pcCase => pcCase.price > currentCase.price)
        .filter(pcCase => pcCase.price <= currentCase.price + budget)
        .sort((a, b) => b.price - a.price);
    
    return betterCases.length > 0 ? betterCases[0] : null;
}

// 容量文字列をGB単位の数値に変換
function parseCapacityToGB(capacityStr) {
    if (typeof capacityStr !== 'string') {
        return 0;
    }
    const num = parseFloat(capacityStr.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
        return 0;
    }
    if (capacityStr.toLowerCase().includes('tb')) {
        return num * 1000;
    }
    if (capacityStr.toLowerCase().includes('gb')) {
        return num;
    }
    return num; // GBが単位でない場合も数値をそのまま返す
}

// メイン推奨機能 - プロのPCビルダーアシスタント版
function getRecommendations(requirements) {
    const { budget, ram, storage, cpuBrand, gpuBrand, usage, includeOS } = requirements;
    const usageRec = getUsageRecommendations(usage);
    
    try {
        console.log('プロのPCビルダーアシスタントによる推奨を開始...');
        const partsData = PARTS_DATA;
        
        // OSを含める場合は、OS価格を事前に予算から差し引く
        let effectiveBudget = budget;
        let selectedOS = null;
        
        if (includeOS && partsData.os && partsData.os.length > 0) {
            selectedOS = partsData.os[0]; // Windows 11 Home
            effectiveBudget = budget - selectedOS.price;
            console.log(`OS選択: ${selectedOS.name} (¥${selectedOS.price})`);
            console.log(`有効予算: ¥${effectiveBudget} (OS価格¥${selectedOS.price}を差し引き)`);
            
            if (effectiveBudget <= 0) {
                console.error('エラー: OS価格が予算を超過しています');
                throw new Error('OS価格が予算を超過しています。予算を増やしてください。');
            }
            
            // 最小構成予算チェック（概算）
            const minimumRequired = 100000; // 最小構成の概算
            if (effectiveBudget < minimumRequired) {
                console.warn(`警告: 有効予算¥${effectiveBudget}は最小構成(約¥${minimumRequired})を下回る可能性があります`);
            }
        }
        
        // 予算配分（有効予算を使用）
        const cpuBudget = effectiveBudget * usageRec.cpuWeight;
        const gpuBudget = effectiveBudget * usageRec.gpuWeight;
        
        // コアパーツの初期選択（CPU、GPU）- 特別ロジック対応
        const selectedCPU = selectCPUByBrand(partsData.cpu, cpuBudget, cpuBrand, usageRec.specialLogic);
        const selectedGPU = selectGPUByBrand(partsData.gpu, gpuBudget, gpuBrand, usageRec.specialLogic);
        
        console.log(`選択されたCPU: ${selectedCPU?.name} (ソケット: ${selectedCPU?.socket})`);
        console.log(`選択されたGPU: ${selectedGPU?.name}`);
        
        // 【フェーズ1: 基本パーツの仮決定】
        console.log('フェーズ1: 基本パーツの仮決定');
        const basicParts = selectBasicParts(partsData, requirements, selectedCPU);
        
        // マザーボード選択（互換性チェック強化）
        const selectedMotherboard = selectCompatibleMotherboard(partsData.motherboard, selectedCPU);

        let recommendations = {
            cpu: selectedCPU,
            cooler: selectCheapestPart(partsData.cooler), // AK400を想定（最安価）
            motherboard: selectedMotherboard,
            memory: basicParts.memory,
            storage: basicParts.storage,
            gpu: selectedGPU,
            psu: selectPSUForSystem(partsData.psu, selectedCPU, selectedGPU),
            case: basicParts.case
        };
        
        // nullチェックとエラーハンドリング
        const missingParts = Object.entries(recommendations)
            .filter(([key, part]) => !part)
            .map(([key]) => key);
        
        if (missingParts.length > 0) {
            console.warn(`警告: 以下のパーツが選択できませんでした: ${missingParts.join(', ')}`);
        }
        
        let totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
        console.log(`フェーズ1完了: 合計 ¥${totalPrice}`);
        
        // 予算オーバーチェックと自動調整（有効予算を使用）
        if (totalPrice > effectiveBudget) {
            console.log(`予算オーバー検出: ¥${totalPrice - effectiveBudget} 超過`);
            recommendations = adjustBudgetAutomatically(recommendations, partsData, effectiveBudget, requirements);
            totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
        }
        
        // 【フェーズ2: 予算内でのアップグレード】
        const leftoverBudget = effectiveBudget - totalPrice;
        console.log(`フェーズ2: 予算内でのアップグレード（残り予算: ¥${leftoverBudget}）`);
        
        if (leftoverBudget > 0) {
            recommendations = upgradePartsInOrder(recommendations, partsData, leftoverBudget, requirements);
            totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
            console.log(`フェーズ2完了: 最終合計 ¥${totalPrice}`);
        }
        
        // OSを含める場合の処理（既に選択済みの場合）
        if (selectedOS) {
            recommendations.os = selectedOS;
            totalPrice += selectedOS.price;
            console.log(`最終OS追加: ${selectedOS.name} (¥${selectedOS.price})`);
        }
        
        return {
            recommendations,
            totalPrice,
            budget,
            isWithinBudget: totalPrice <= budget,
            usageRecommendation: usageRec,
            dataSource: 'Professional PC Builder Assistant'
        };
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

// CPU互換マザーボード選択（より厳密な互換性チェック）
function selectCompatibleMotherboard(motherboards, selectedCPU) {
    if (!motherboards || motherboards.length === 0) {
        console.error('エラー: マザーボードデータがありません');
        return null;
    }
    
    if (!selectedCPU || !selectedCPU.socket) {
        console.warn('警告: CPUが選択されていないため、最安価マザーボードを選択します');
        return motherboards.sort((a, b) => a.price - b.price)[0];
    }
    
    // ソケット名の正規化（空白などの違いを吸収）- キャッシュ機能付き
    const normalizeSocket = (socket) => {
        if (socketNormalizeCache.has(socket)) {
            return socketNormalizeCache.get(socket);
        }
        const normalized = socket.replace(/\s+/g, ' ').trim();
        socketNormalizeCache.set(socket, normalized);
        return normalized;
    };
    const cpuSocket = normalizeSocket(selectedCPU.socket);
    
    const compatibleMBs = motherboards.filter(mb => {
        const mbSocket = normalizeSocket(mb.socket);
        return mbSocket === cpuSocket;
    });
    
    if (compatibleMBs.length === 0) {
        console.error(`❌ 致命的エラー: ${selectedCPU.socket}ソケット対応マザーボードが見つかりません！`);
        
        // CPUソケットに基づいて強制的に正しいマザーボードを探す
        let forcedSelection = null;
        
        if (selectedCPU.socket.includes('AM5')) {
            forcedSelection = motherboards.find(mb => mb.socket.includes('AM5'));
        } else if (selectedCPU.socket.includes('LGA1700')) {
            forcedSelection = motherboards.find(mb => mb.socket.includes('LGA1700'));
        } else if (selectedCPU.socket.includes('LGA1851')) {
            forcedSelection = motherboards.find(mb => mb.socket.includes('LGA1851'));
        }
        
        if (forcedSelection) {
            console.warn(`🔧 強制修正: ${selectedCPU.socket}に対して${forcedSelection.name}を選択`);
            return forcedSelection;
        }
        
        // 最後の手段：最安価のマザーボード（警告付き）
        console.error('💥 データ整合性エラー: 対応するマザーボードが見つかりません');
        const fallback = motherboards.sort((a, b) => a.price - b.price)[0];
        console.error(`⚠️ 互換性なしフォールバック: ${fallback.name} (${fallback.socket})`);
        return fallback;
    }
    
    const selected = compatibleMBs.sort((a, b) => a.price - b.price)[0];
    console.log(`マザーボード選択: ${selected.name} (ソケット: ${selected.socket})`);
    return selected;
}

// システム用PSU選択（CPU・GPU消費電力を考慮）
function selectPSUForSystem(psus, selectedCPU, selectedGPU) {
    if (!psus || psus.length === 0) {
        console.error('エラー: PSUデータがありません');
        return null;
    }
    
    // CPUとGPUから推定電力を計算
    const estimatedCpuTdp = estimateCpuTdp(selectedCPU);
    const estimatedGpuPower = estimateGpuPower(selectedGPU);
    const systemBasePower = 100; // マザボード、メモリ、ストレージなどのベース消費電力
    const requiredWattage = Math.ceil((estimatedCpuTdp + estimatedGpuPower + systemBasePower) * 1.3); // 30%マージン
    
    console.log(`推定必要電力: CPU ${estimatedCpuTdp}W + GPU ${estimatedGpuPower}W + システム ${systemBasePower}W = ${requiredWattage}W (マージン込み)`);
    
    // 単一パスでPSU選択最適化
    const suitablePSUs = [];
    for (const psu of psus) {
        const wattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
        if (wattage >= requiredWattage) {
            suitablePSUs.push(psu);
        }
    }
    
    if (suitablePSUs.length === 0) {
        console.warn(`警告: ${requiredWattage}W以上のPSUが見つかりません。最大容量PSUを選択します。`);
        return psus.sort((a, b) => {
            const wattageA = parseInt(a.wattage.replace(/[^\d]/g, ''));
            const wattageB = parseInt(b.wattage.replace(/[^\d]/g, ''));
            return wattageB - wattageA; // 高いワット数順
        })[0];
    }
    
    const selected = suitablePSUs.sort((a, b) => a.price - b.price)[0];
    console.log(`PSU選択: ${selected.name} (${selected.wattage})`);
    return selected;
}

// CPU TDP推定
function estimateCpuTdp(cpu) {
    if (!cpu) return 65; // デフォルト
    const name = cpu.name.toLowerCase();
    if (name.includes('i5')) return 125;
    if (name.includes('i7')) return 125;
    if (name.includes('ryzen 5')) return 105;
    if (name.includes('ryzen 7')) return 105;
    if (name.includes('ryzen 9')) return 170;
    return 65;
}

// GPU消費電力推定
function estimateGpuPower(gpu) {
    if (!gpu) return 150; // デフォルト
    const name = gpu.name.toLowerCase();
    if (name.includes('rtx 5090')) return 575;
    if (name.includes('rtx 5080')) return 360;
    if (name.includes('rtx 5070')) return 250;
    if (name.includes('rtx 5060')) return 170;
    if (name.includes('rx 9070')) return 260;
    if (name.includes('rx 9060')) return 180;
    return 150;
}

// 予算オーバー時の自動調整機能
// CPUを一段階下げる（ブランド考慮版）
function downgradeCPUByBrand(currentCPU, allCPUs, cpuBrand, requiredSocket) {
    if (!allCPUs || allCPUs.length === 0 || !currentCPU) return null;
    
    // ブランドフィルタリング
    let filteredCPUs = allCPUs;
    if (cpuBrand && cpuBrand !== 'any') {
        filteredCPUs = allCPUs.filter(cpu => {
            const cpuName = cpu.name.toLowerCase();
            if (cpuBrand === 'intel') {
                return cpuName.includes('intel') || cpuName.includes('core');
            } else if (cpuBrand === 'amd') {
                return cpuName.includes('amd') || cpuName.includes('ryzen');
            }
            return true;
        });
    }
    
    // 現在のCPUと同じソケットのCPUを価格順でソート
    const compatibleCPUs = filteredCPUs
        .filter(cpu => cpu.socket === (requiredSocket || currentCPU.socket))
        .sort((a, b) => b.price - a.price); // 高価格順
    
    const currentIndex = compatibleCPUs.findIndex(cpu => cpu.name === currentCPU.name);
    
    if (currentIndex === -1 || currentIndex >= compatibleCPUs.length - 1) {
        console.log('これ以上下げられるCPUがありません');
        return null;
    }
    
    const nextCPU = compatibleCPUs[currentIndex + 1];
    console.log(`CPUダウングレード: ${currentCPU.name} (¥${currentCPU.price}) → ${nextCPU.name} (¥${nextCPU.price})`);
    return nextCPU;
}

// CPUを一段階下げる（互換性維持用）
function downgradeCPU(currentCPU, allCPUs, requiredSocket) {
    return downgradeCPUByBrand(currentCPU, allCPUs, 'any', requiredSocket);
}

// GPUを一段階下げる
function downgradeGPU(currentGPU, allGPUs, gpuBrand) {
    if (!allGPUs || allGPUs.length === 0 || !currentGPU) return null;
    
    // ブランドフィルタリング
    let filteredGPUs = allGPUs;
    if (gpuBrand && gpuBrand !== 'any') {
        filteredGPUs = allGPUs.filter(gpu => {
            const gpuName = gpu.name.toLowerCase();
            if (gpuBrand === 'nvidia') {
                return gpuName.includes('geforce') || gpuName.includes('rtx') || gpuName.includes('gtx');
            } else if (gpuBrand === 'amd') {
                return gpuName.includes('radeon') || gpuName.includes('rx');
            }
            return true;
        });
    }
    
    // 価格順でソート（高価格順）
    const sortedGPUs = filteredGPUs.sort((a, b) => b.price - a.price);
    
    const currentIndex = sortedGPUs.findIndex(gpu => gpu.name === currentGPU.name);
    
    if (currentIndex === -1 || currentIndex >= sortedGPUs.length - 1) {
        console.log('これ以上下げられるGPUがありません');
        return null;
    }
    
    const nextGPU = sortedGPUs[currentIndex + 1];
    console.log(`GPUダウングレード: ${currentGPU.name} (¥${currentGPU.price}) → ${nextGPU.name} (¥${nextGPU.price})`);
    return nextGPU;
}

// 予算内に収めるための自動調整
function adjustBudgetAutomatically(recommendations, allParts, budget, requirements) {
    const { cpuBrand, gpuBrand } = requirements;
    let adjustedRecommendations = { ...recommendations };
    let totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
    
    console.log(`予算調整開始: 現在の合計 ¥${totalPrice}, 予算 ¥${budget}`);
    
    let adjustmentStep = 0;
    const maxAdjustments = 20; // 無限ループ防止
    
    // 早期終了最適化と無限ループ防止
    let downgradedCPULast = null;
    let downgradedGPULast = null;
    
    while (totalPrice > budget && adjustmentStep < maxAdjustments) {
        adjustmentStep++;
        console.log(`調整ステップ ${adjustmentStep}: オーバー金額 ¥${totalPrice - budget}`);
        
        const isEvenStep = adjustmentStep % 2 === 0;
        let progressMade = false;
        
        if (isEvenStep) {
            // 偶数ステップ: CPUをダウングレード
            const downgradedCPU = downgradeCPUByBrand(adjustedRecommendations.cpu, allParts.cpu, cpuBrand, adjustedRecommendations.cpu?.socket);
            
            if (downgradedCPU && downgradedCPU !== downgradedCPULast) {
                console.log(`CPU変更: ${adjustedRecommendations.cpu.name} → ${downgradedCPU.name}`);
                console.log(`CPUソケット変更: ${adjustedRecommendations.cpu.socket} → ${downgradedCPU.socket}`);
                
                // CPUが変わったので、関連パーツも再選択
                adjustedRecommendations.cpu = downgradedCPU;
                downgradedCPULast = downgradedCPU;
                
                // マザーボードを新しいCPUに合わせて再選択
                adjustedRecommendations.motherboard = selectCompatibleMotherboard(allParts.motherboard, downgradedCPU);
                
                // メモリとPSUも再選択
                adjustedRecommendations.memory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, downgradedCPU.socket);
                adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, downgradedCPU, adjustedRecommendations.gpu);
                
                totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                console.log(`CPU調整後: 合計 ¥${totalPrice}`);
                progressMade = true;
            } else {
                console.log('CPUのこれ以上のダウングレードは不可能');
            }
        } else {
            // 奇数ステップ: GPUをダウングレード
            const downgradedGPU = downgradeGPU(adjustedRecommendations.gpu, allParts.gpu, gpuBrand);
            
            if (downgradedGPU && downgradedGPU !== downgradedGPULast) {
                adjustedRecommendations.gpu = downgradedGPU;
                downgradedGPULast = downgradedGPU;
                // GPUが変わったのでPSUも再計算
                adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, adjustedRecommendations.cpu, downgradedGPU);
                
                totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                console.log(`GPU調整後: 合計 ¥${totalPrice}`);
                progressMade = true;
            } else {
                console.log('GPUのこれ以上のダウングレードは不可能');
            }
        }
        
        // 進歩がない場合は早期終了
        if (!progressMade) {
            console.log('これ以上の調整が不可能です。予算を超過したまま終了します。');
            break;
        }
    }
    
    const finalOverage = totalPrice - budget;
    if (finalOverage > 0) {
        console.log(`警告: 予算調整完了ですが、まだ ¥${finalOverage} オーバーしています`);
    } else {
        console.log(`予算調整成功: 最終合計 ¥${totalPrice} (予算内)`);
    }
    
    return adjustedRecommendations;
}