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

// 予算最適化
function optimizeBudgetUsage(currentRecommendations, allParts, remainingBudget, gpuBrand) {
    const optimized = { ...currentRecommendations };
    let availableBudget = remainingBudget;
    
    console.log(`Starting optimization with ¥${availableBudget} remaining budget`);
    
    const upgradeOrder = [
        { part: 'gpu', parts: allParts.gpu, currentPrice: optimized.gpu?.price || 0 },
        { part: 'cpu', parts: allParts.cpu, currentPrice: optimized.cpu?.price || 0 },
        { part: 'cooler', parts: allParts.cooler, currentPrice: optimized.cooler?.price || 0 },
        { part: 'memory', parts: allParts.memory, currentPrice: optimized.memory?.price || 0 },
        { part: 'storage', parts: allParts.storage, currentPrice: optimized.storage?.price || 0 },
        { part: 'motherboard', parts: allParts.motherboard, currentPrice: optimized.motherboard?.price || 0 }
    ];
    
    for (const upgrade of upgradeOrder) {
        if (availableBudget < 5000) break;
        
        let upgradeParts = upgrade.parts;
        
        if (upgrade.part === 'gpu' && gpuBrand && gpuBrand !== 'any') {
            upgradeParts = upgradeParts.filter(gpu => {
                const gpuName = gpu.name.toLowerCase();
                if (gpuBrand === 'nvidia') {
                    return gpuName.includes('geforce') || gpuName.includes('rtx') || gpuName.includes('gtx');
                } else if (gpuBrand === 'amd') {
                    return gpuName.includes('radeon') || gpuName.includes('rx');
                }
                return true;
            });
        }
        
        const betterParts = upgradeParts
            .filter(part => part.price > upgrade.currentPrice)
            .filter(part => part.price <= upgrade.currentPrice + availableBudget)
            .sort((a, b) => b.price - a.price);
        
        if (betterParts.length > 0) {
            const bestUpgrade = betterParts[0];
            const upgradeCost = bestUpgrade.price - upgrade.currentPrice;
            
            console.log(`Upgrading ${upgrade.part}: ${optimized[upgrade.part]?.name} (¥${upgrade.currentPrice}) -> ${bestUpgrade.name} (¥${bestUpgrade.price}), Cost: ¥${upgradeCost}`);
            
            optimized[upgrade.part] = bestUpgrade;
            availableBudget -= upgradeCost;
            console.log(`Remaining budget after upgrade: ¥${availableBudget}`);
        }
    }
    
    return optimized;
}

// メイン推奨機能 - クライアントサイド版
function getRecommendations(requirements) {
    const { budget, ram, storage, gpuBrand, usage } = requirements;
    const usageRec = getUsageRecommendations(usage);
    
    try {
        console.log('Loading parts data from client-side data...');
        const partsData = PARTS_DATA;
        
        // 予算配分
        const cpuBudget = budget * usageRec.cpuWeight;
        const gpuBudget = budget * usageRec.gpuWeight;
        const remainingBudget = budget - cpuBudget - gpuBudget;
        const otherPartsBudget = remainingBudget / 6;
        
        console.log(`Budget allocation - CPU: ¥${Math.round(cpuBudget)}, GPU: ¥${Math.round(gpuBudget)}, Others: ¥${Math.round(otherPartsBudget)} each`);
        
        // パーツ選択
        let recommendations = {
            cpu: selectBestPart(partsData.cpu, cpuBudget),
            cooler: selectBestPart(partsData.cooler, otherPartsBudget),
            motherboard: selectBestPart(partsData.motherboard, otherPartsBudget),
            memory: selectMemory(partsData.memory, ram, otherPartsBudget),
            storage: selectStorage(partsData.storage, storage, otherPartsBudget),
            gpu: selectGPUByBrand(partsData.gpu, gpuBudget, gpuBrand),
            psu: selectPSU(partsData.psu, usageRec.psuMin, otherPartsBudget),
            case: selectBestPart(partsData.case, otherPartsBudget)
        };
        
        let totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
        
        // 予算最適化
        const leftoverBudget = budget - totalPrice;
        console.log(`Initial total: ¥${totalPrice}, Remaining budget: ¥${leftoverBudget}`);
        
        if (leftoverBudget > 5000) {
            recommendations = optimizeBudgetUsage(recommendations, partsData, leftoverBudget, gpuBrand);
            totalPrice = Object.values(recommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
            console.log(`Optimized total: ¥${totalPrice}, Final remaining: ¥${budget - totalPrice}`);
        }
        
        return {
            recommendations,
            totalPrice,
            budget,
            isWithinBudget: totalPrice <= budget,
            usageRecommendation: usageRec,
            dataSource: 'Client-side data'
        };
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}