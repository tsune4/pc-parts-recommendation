// PC Parts Recommendation Engine - Client Side Version

// 使用目的別の重み設定
function getUsageRecommendations(usage) {
    const recommendations = {
        gaming: {
            cpuWeight: 0.25,
            gpuWeight: 0.55,
            ramMin: 16,
            storageType: 'ssd',
            psuMin: 650
        },
        creative: {
            cpuWeight: 0.3,
            gpuWeight: 0.45,
            ramMin: 32,
            storageType: 'ssd',
            psuMin: 750
        },
        office: {
            cpuWeight: 0.25,
            gpuWeight: 0.2,
            ramMin: 8,
            storageType: 'any',
            psuMin: 500
        },
        development: {
            cpuWeight: 0.3,
            gpuWeight: 0.3,
            ramMin: 16,
            storageType: 'ssd',
            psuMin: 600
        }
    };
    
    return recommendations[usage] || recommendations.office;
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

// メモリ選択
function selectMemory(memories, targetCapacity, budget) {
    if (!memories || memories.length === 0) return null;
    
    const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
    const suitable = memories.filter(mem => {
        const memCapacity = parseInt(mem.capacity.replace('GB', ''));
        return memCapacity >= targetCapacityNum && mem.price <= budget;
    });
    
    if (suitable.length === 0) {
        const closestCapacity = memories.filter(mem => {
            const memCapacity = parseInt(mem.capacity.replace('GB', ''));
            return memCapacity >= targetCapacityNum;
        });
        return closestCapacity.sort((a, b) => a.price - b.price)[0] || memories[0];
    }
    
    return suitable.sort((a, b) => b.price - a.price)[0];
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

// ブランド別GPU選択
function selectGPUByBrand(gpus, budget, brand) {
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

// フェーズ2: 予算内でのアップグレード（優先順位に従って）
function upgradePartsInOrder(currentRecommendations, allParts, remainingBudget, requirements) {
    const optimized = { ...currentRecommendations };
    let availableBudget = remainingBudget;
    
    console.log(`Starting professional upgrade with ¥${availableBudget} remaining budget`);
    
    // 優先度1: ストレージをアップグレード
    if (availableBudget > 0) {
        const storageUpgrade = upgradeStorage(optimized.storage, allParts.storage, requirements.storage.capacity, availableBudget);
        if (storageUpgrade && storageUpgrade.price > optimized.storage.price) {
            const upgradeCost = storageUpgrade.price - optimized.storage.price;
            console.log(`Upgrading storage: ${optimized.storage.name} (¥${optimized.storage.price}) -> ${storageUpgrade.name} (¥${storageUpgrade.price})`);
            optimized.storage = storageUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    // 優先度2: CPUクーラーをアップグレード
    if (availableBudget > 0) {
        const coolerUpgrade = upgradeCooler(optimized.cooler, allParts.cooler, availableBudget);
        if (coolerUpgrade && coolerUpgrade.price > optimized.cooler.price) {
            const upgradeCost = coolerUpgrade.price - optimized.cooler.price;
            console.log(`Upgrading cooler: ${optimized.cooler.name} (¥${optimized.cooler.price}) -> ${coolerUpgrade.name} (¥${coolerUpgrade.price})`);
            optimized.cooler = coolerUpgrade;
            availableBudget -= upgradeCost;
        }
    }
    
    console.log(`Professional upgrade completed. Remaining budget: ¥${availableBudget}`);
    return optimized;
}

// ソケットとメモリタイプの互換性チェック
function getCompatibleMemoryType(socket) {
    const socketMemoryMap = {
        'AM5': 'DDR5',        // AM5ソケットはDDR5のみ
        'AM4': 'DDR4',        // AM4ソケットはDDR4のみ
        'LGA1700': 'DDR4',    // LGA1700はDDR4/DDR5両対応だがDDR4を優先
        'LGA1851': 'DDR5'     // LGA1851はDDR5のみ
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
    const compatibleMemories = memories.filter(mem => mem.type === compatibleMemoryType);
    
    if (compatibleMemories.length === 0) {
        console.warn(`警告: ${compatibleMemoryType}メモリが見つかりません。任意のメモリを選択します。`);
        return memories.sort((a, b) => a.price - b.price)[0];
    }
    
    // 指定容量で結合メモリを検索
    const exactMatches = compatibleMemories.filter(mem => {
        const memCapacity = parseInt(mem.capacity.replace('GB', ''));
        return memCapacity === targetCapacityNum;
    });
    
    if (exactMatches.length > 0) {
        const selected = exactMatches.sort((a, b) => a.price - b.price)[0];
        console.log(`メモリ選択: ${selected.name} (${selected.type})`);
        return selected;
    }
    
    // 完全一致がない場合は、指定容量以上で最安価
    const suitableMatches = compatibleMemories.filter(mem => {
        const memCapacity = parseInt(mem.capacity.replace('GB', ''));
        return memCapacity >= targetCapacityNum;
    });
    
    const selected = suitableMatches.length > 0 ? 
        suitableMatches.sort((a, b) => a.price - b.price)[0] : 
        compatibleMemories.sort((a, b) => a.price - b.price)[0];
    
    console.log(`メモリ選択: ${selected.name} (${selected.type})`);
    return selected;
}

// ユーザー指定容量でストレージを選択（最安価）
function selectStorageByCapacity(storages, targetCapacity) {
    if (!storages || storages.length === 0) return null;
    
    const targetCapacityNum = parseInt(targetCapacity.replace(/[^\d]/g, ''));
    
    // 指定容量と完全一致するストレージを優先
    const exactMatches = storages.filter(storage => {
        const storageCapacityNum = parseInt(storage.capacity.replace(/[^\d]/g, ''));
        return storageCapacityNum === targetCapacityNum;
    });
    
    if (exactMatches.length > 0) {
        const selected = exactMatches.sort((a, b) => a.price - b.price)[0];
        console.log(`ストレージ選択 (指定容量完全一致): ${selected.name} (${selected.capacity})`);
        return selected;
    }
    
    // 指定容量以上のストレージがない場合は、最大容量を選択
    const suitableStorages = storages.filter(storage => {
        const storageCapacityNum = parseInt(storage.capacity.replace(/[^\d]/g, ''));
        return storageCapacityNum >= targetCapacityNum;
    });
    
    if (suitableStorages.length > 0) {
        const selected = suitableStorages.sort((a, b) => a.price - b.price)[0];
        console.log(`ストレージ選択 (指定容量以上): ${selected.name} (${selected.capacity})`);
        return selected;
    }
    
    // 指定容量以上がない場合は最大容量を選択
    const maxCapacityStorage = storages.sort((a, b) => {
        const capacityA = parseInt(a.capacity.replace(/[^\d]/g, ''));
        const capacityB = parseInt(b.capacity.replace(/[^\d]/g, ''));
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
    
    const targetCapacityNum = parseInt(targetCapacity.replace(/[^\d]/g, ''));
    const sameCapacityStorages = allStorages.filter(storage => {
        const storageCapacityNum = parseInt(storage.capacity.replace(/[^\d]/g, ''));
        return storageCapacityNum === targetCapacityNum;
    });
    
    const betterStorages = sameCapacityStorages
        .filter(storage => storage.price > currentStorage.price)
        .filter(storage => storage.price <= currentStorage.price + budget)
        .sort((a, b) => b.price - a.price);
    
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

// メイン推奨機能 - プロのPCビルダーアシスタント版
function getRecommendations(requirements) {
    const { budget, ram, storage, gpuBrand, usage } = requirements;
    const usageRec = getUsageRecommendations(usage);
    
    try {
        console.log('プロのPCビルダーアシスタントによる推奨を開始...');
        const partsData = PARTS_DATA;
        
        // 予算配分
        const cpuBudget = budget * usageRec.cpuWeight;
        const gpuBudget = budget * usageRec.gpuWeight;
        
        // コアパーツの初期選択（CPU、GPU）
        const selectedCPU = selectBestPart(partsData.cpu, cpuBudget);
        const selectedGPU = selectGPUByBrand(partsData.gpu, gpuBudget, gpuBrand);
        
        console.log(`選択されたCPU: ${selectedCPU?.name} (ソケット: ${selectedCPU?.socket})`);
        console.log(`選択されたGPU: ${selectedGPU?.name}`);
        
        // 【フェーズ1: 基本パーツの仮決定】
        console.log('フェーズ1: 基本パーツの仮決定');
        const basicParts = selectBasicParts(partsData, requirements, selectedCPU);
        
        let recommendations = {
            cpu: selectedCPU,
            cooler: selectCheapestPart(partsData.cooler), // AK400を想定（最安価）
            motherboard: selectCompatibleMotherboard(partsData.motherboard, selectedCPU),
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
        
        // 予算オーバーチェックと自動調整
        if (totalPrice > budget) {
            console.log(`予算オーバー検出: ¥${totalPrice - budget} 超過`);
            recommendations = adjustBudgetAutomatically(recommendations, partsData, budget, requirements);
            totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
        }
        
        // 【フェーズ2: 予算内でのアップグレード】
        const leftoverBudget = budget - totalPrice;
        console.log(`フェーズ2: 予算内でのアップグレード（残り予算: ¥${leftoverBudget}）`);
        
        if (leftoverBudget > 0) {
            recommendations = upgradePartsInOrder(recommendations, partsData, leftoverBudget, requirements);
            totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
            console.log(`フェーズ2完了: 最終合計 ¥${totalPrice}`);
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

// CPU互換マザーボード選択
function selectCompatibleMotherboard(motherboards, selectedCPU) {
    if (!motherboards || motherboards.length === 0) {
        console.error('エラー: マザーボードデータがありません');
        return null;
    }
    
    if (!selectedCPU || !selectedCPU.socket) {
        console.warn('警告: CPUが選択されていないため、最安価マザーボードを選択します');
        return motherboards.sort((a, b) => a.price - b.price)[0];
    }
    
    const compatibleMBs = motherboards.filter(mb => mb.socket === selectedCPU.socket);
    
    if (compatibleMBs.length === 0) {
        console.warn(`警告: ${selectedCPU.socket}ソケット対応マザーボードが見つかりません。任意のマザーボードを選択します。`);
        return motherboards.sort((a, b) => a.price - b.price)[0];
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
    
    const suitablePSUs = psus.filter(psu => {
        const wattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
        return wattage >= requiredWattage;
    });
    
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
// CPUを一段階下げる
function downgradeCPU(currentCPU, allCPUs, requiredSocket) {
    if (!allCPUs || allCPUs.length === 0 || !currentCPU) return null;
    
    // 現在のCPUと同じソケットのCPUを価格順でソート
    const compatibleCPUs = allCPUs
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
    const { gpuBrand } = requirements;
    let adjustedRecommendations = { ...recommendations };
    let totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
    
    console.log(`予算調整開始: 現在の合計 ¥${totalPrice}, 予算 ¥${budget}`);
    
    let adjustmentStep = 0;
    const maxAdjustments = 20; // 無限ループ防止
    
    while (totalPrice > budget && adjustmentStep < maxAdjustments) {
        adjustmentStep++;
        console.log(`調整ステップ ${adjustmentStep}: オーバー金額 ¥${totalPrice - budget}`);
        
        const isEvenStep = adjustmentStep % 2 === 0;
        
        if (isEvenStep) {
            // 偶数ステップ: CPUをダウングレード
            const downgradedCPU = downgradeCPU(adjustedRecommendations.cpu, allParts.cpu, adjustedRecommendations.cpu?.socket);
            
            if (downgradedCPU) {
                // CPUが変わったので、関連パーツも再選択
                adjustedRecommendations.cpu = downgradedCPU;
                adjustedRecommendations.motherboard = selectCompatibleMotherboard(allParts.motherboard, downgradedCPU);
                adjustedRecommendations.memory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, downgradedCPU.socket);
                adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, downgradedCPU, adjustedRecommendations.gpu);
                
                totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                console.log(`CPU調整後: 合計 ¥${totalPrice}`);
            } else {
                console.log('CPUのこれ以上のダウングレードは不可能');
            }
        } else {
            // 奇数ステップ: GPUをダウングレード
            const downgradedGPU = downgradeGPU(adjustedRecommendations.gpu, allParts.gpu, gpuBrand);
            
            if (downgradedGPU) {
                adjustedRecommendations.gpu = downgradedGPU;
                // GPUが変わったのでPSUも再計算
                adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, adjustedRecommendations.cpu, downgradedGPU);
                
                totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                console.log(`GPU調整後: 合計 ¥${totalPrice}`);
            } else {
                console.log('GPUのこれ以上のダウングレードは不可能');
            }
        }
        
        // 両方ともダウングレードできない場合は終了
        if (adjustmentStep > 1 && 
            !downgradeCPU(adjustedRecommendations.cpu, allParts.cpu, adjustedRecommendations.cpu?.socket) && 
            !downgradeGPU(adjustedRecommendations.gpu, allParts.gpu, gpuBrand)) {
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