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

// GPU用予算内最適選択（同価格時AMD優先）
function selectBestGPU(gpus, budget, brand = 'any') {
    if (!gpus || gpus.length === 0) return null;
    
    const withinBudget = gpus.filter(gpu => gpu.price <= budget);
    if (withinBudget.length === 0) {
        return gpus.sort((a, b) => a.price - b.price)[0];
    }
    
    // 価格順でソート（高価格優先）
    const sortedGPUs = withinBudget.sort((a, b) => b.price - a.price);
    
    // ブランド指定なしの場合、同価格ならAMD優先
    if (brand === 'any' && sortedGPUs.length > 1) {
        const topPrice = sortedGPUs[0].price;
        const samePriceGPUs = sortedGPUs.filter(gpu => gpu.price === topPrice);
        
        if (samePriceGPUs.length > 1) {
            // 同価格のGPUが複数ある場合、AMD優先
            const amdGPU = samePriceGPUs.find(gpu => 
                gpu.name.toLowerCase().includes('radeon') || 
                gpu.name.toLowerCase().includes('rx')
            );
            
            if (amdGPU) {
                console.log(`同価格GPU検出、AMD優先選択: ${amdGPU.name} (¥${amdGPU.price})`);
                return amdGPU;
            }
        }
    }
    
    return sortedGPUs[0];
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

// CPU用予算内最適選択（ゲーム汎用向け予算効率重視）
function selectBestCPU(cpus, budget, brand = 'any', usage = 'gaming') {
    if (!cpus || cpus.length === 0) return null;
    
    // CPUメーカーが指定されている場合の優先ロジック
    if (brand !== 'any') {
        console.log(`CPUメーカー指定: ${brand.toUpperCase()} - 最安モデルを選択（予算超過許容）`);
        
        // 指定されたブランドのCPUをフィルタ
        const brandCPUs = cpus.filter(cpu => {
            const cpuName = cpu.name.toLowerCase();
            if (brand === 'intel') {
                return cpuName.includes('intel') || cpuName.includes('core');
            } else if (brand === 'amd') {
                return cpuName.includes('amd') || cpuName.includes('ryzen');
            }
            return true;
        });
        
        if (brandCPUs.length > 0) {
            // 指定ブランドの最安モデルを選択（予算無視）
            const cheapestBrandCPU = brandCPUs.sort((a, b) => a.price - b.price)[0];
            console.log(`${brand.toUpperCase()}最安モデル選択: ${cheapestBrandCPU.name} (¥${cheapestBrandCPU.price})`);
            
            if (cheapestBrandCPU.price > budget) {
                console.log(`⚠️ 予算¥${budget}を¥${cheapestBrandCPU.price - budget}超過しますが、メーカー指定のため選択`);
            }
            
            return cheapestBrandCPU;
        } else {
            console.log(`指定された${brand.toUpperCase()}ブランドのCPUが見つかりません`);
        }
    }
    
    const withinBudget = cpus.filter(cpu => cpu.price <= budget);
    if (withinBudget.length === 0) {
        return cpus.sort((a, b) => a.price - b.price)[0];
    }
    
    // ゲーム(汎用)でブランド指定なしの場合の特別ロジック
    if (brand === 'any' && usage === 'gaming') {
        console.log('ゲーム(汎用) CPU選択: 予算効率重視で最適ブランドを選択');
        
        // Intel CPUを探す
        const intelCPUs = withinBudget.filter(cpu => 
            cpu.name.toLowerCase().includes('intel') || 
            cpu.name.toLowerCase().includes('core')
        );
        
        // AMD CPUを探す
        const amdCPUs = withinBudget.filter(cpu => 
            cpu.name.toLowerCase().includes('amd') || 
            cpu.name.toLowerCase().includes('ryzen')
        );
        
        // 両方のブランドで最高性能CPUを取得
        const bestIntel = intelCPUs.length > 0 ? intelCPUs.sort((a, b) => b.price - a.price)[0] : null;
        const bestAMD = amdCPUs.length > 0 ? amdCPUs.sort((a, b) => b.price - a.price)[0] : null;
        
        if (bestIntel && bestAMD) {
            // 両方とも予算内にある場合、予算上限により近い方を選択
            const intelProximity = budget - bestIntel.price;
            const amdProximity = budget - bestAMD.price;
            
            if (intelProximity <= amdProximity) {
                console.log(`Intel/AMD両方予算内: より予算上限に近いIntel選択 ${bestIntel.name} (¥${bestIntel.price}, 余り¥${intelProximity})`);
                return bestIntel;
            } else {
                console.log(`Intel/AMD両方予算内: より予算上限に近いAMD選択 ${bestAMD.name} (¥${bestAMD.price}, 余り¥${amdProximity})`);
                return bestAMD;
            }
        } else if (bestIntel) {
            console.log(`Intel CPU選択: ${bestIntel.name} (¥${bestIntel.price})`);
            return bestIntel;
        } else if (bestAMD) {
            console.log(`AMD CPU選択: ${bestAMD.name} (¥${bestAMD.price})`);
            return bestAMD;
        }
    }
    
    // 通常の高価格優先選択
    return withinBudget.sort((a, b) => b.price - a.price)[0];
}

// ブランド別CPU選択（特別ロジック対応）
function selectCPUByBrand(cpus, budget, brand, specialLogic = 'general', usage = 'gaming') {
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
        
        // CPUメーカー指定時は最安モデル選択（予算超過許容、ただしX3D特別ロジック除く）
        if (filteredCPUs.length > 0 && specialLogic !== 'x3d_cpu') {
            const cheapestBrandCPU = filteredCPUs.sort((a, b) => a.price - b.price)[0];
            console.log(`${brand.toUpperCase()}メーカー指定: 最安モデル選択 ${cheapestBrandCPU.name} (¥${cheapestBrandCPU.price})`);
            
            if (cheapestBrandCPU.price > budget) {
                console.log(`⚠️ 予算¥${budget}を¥${cheapestBrandCPU.price - budget}超過しますが、メーカー指定のため選択`);
            }
            
            return cheapestBrandCPU;
        }
    }
    
    if (filteredCPUs.length === 0) {
        console.log(`No ${brand} CPUs found, using all CPUs`);
        filteredCPUs = cpus;
    }
    
    // X3D CPU専用ロジック (Escape From Tarkov用) - インテリジェントなX3D選択
    if (specialLogic === 'x3d_cpu') {
        const x3dCPUs = filteredCPUs.filter(cpu => 
            cpu.name.toLowerCase().includes('x3d') || 
            cpu.name.toLowerCase().includes('3d')
        );
        
        if (x3dCPUs.length > 0) {
            console.log(`Tarkov専用: X3D CPUのみから選択 (${x3dCPUs.length}個のX3D CPUを発見)`);
            
            // X3D CPUを価格順でソート
            const sortedX3DCPUs = x3dCPUs.sort((a, b) => a.price - b.price);
            
            // 7800X3Dをデフォルトとして探す
            const ryzen7800X3D = sortedX3DCPUs.find(cpu => 
                cpu.name.toLowerCase().includes('7800x3d')
            );
            
            if (ryzen7800X3D) {
                console.log(`Tarkov用デフォルト選択: ${ryzen7800X3D.name} (¥${ryzen7800X3D.price})`);
                return ryzen7800X3D;
            } else {
                // 7800X3Dがない場合は最安のX3D CPUを選択
                const defaultX3D = sortedX3DCPUs[0];
                console.log(`7800X3D未発見、代替X3D選択: ${defaultX3D.name} (¥${defaultX3D.price})`);
                return defaultX3D;
            }
        } else {
            console.log('警告: X3D CPUが見つかりません！Tarkov用途ではX3D CPUが必須です');
            return null;
        }
    }
    
    return selectBestCPU(filteredCPUs, budget, brand, usage);
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
    
    return selectBestGPU(filteredGPUs, budget, brand);
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
    
    // 合計コストを計算するヘルパー関数
    function calculateTotalCost(parts) {
        return Object.values(parts).reduce((sum, part) => sum + (part ? part.price : 0), 0);
    }
    
    // 予算チェック付きアップグレード実行関数
    function attemptUpgrade(upgradeName, upgradeFunc, originalBudget) {
        if (availableBudget <= 0) return false;
        
        const beforeState = { ...optimized };
        const beforeCost = calculateTotalCost(beforeState);
        
        const result = upgradeFunc();
        if (!result.success) return false;
        
        const afterCost = calculateTotalCost(optimized);
        const actualCost = afterCost - beforeCost;
        
        // 予算チェック
        if (actualCost > availableBudget) {
            console.log(`⚠️ ${upgradeName}: 予算¥${availableBudget}を¥${actualCost - availableBudget}超過するためアップグレード取り消し`);
            // 状態を元に戻す
            Object.assign(optimized, beforeState);
            return false;
        }
        
        console.log(`✅ ${upgradeName}: 成功 (コスト: ¥${actualCost})`);
        availableBudget -= actualCost;
        return true;
    }
    
    // 優先度1: GPUアップグレード
    attemptUpgrade('GPUアップグレード', () => {
        const gpuUpgrade = upgradeGPU(optimized.gpu, allParts.gpu, requirements.gpuBrand, availableBudget);
        if (gpuUpgrade && gpuUpgrade.price > optimized.gpu.price) {
            console.log(`Upgrading GPU: ${optimized.gpu.name} (¥${optimized.gpu.price}) -> ${gpuUpgrade.name} (¥${gpuUpgrade.price})`);
            optimized.gpu = gpuUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 優先度2: CPUアップグレード (Tarkov専用ロジック含む)
    attemptUpgrade('CPUアップグレード', () => {
        let cpuUpgrade = null;
        
        // Tarkov用途の場合の特別ロジック
        if (requirements.usage === 'tarkov') {
            cpuUpgrade = upgradeTarkovX3DCPU(optimized.cpu, allParts.cpu, availableBudget, optimized.gpu);
        } else {
            cpuUpgrade = upgradeCPU(optimized.cpu, allParts.cpu, requirements.cpuBrand, availableBudget);
        }
        
        if (cpuUpgrade && cpuUpgrade.price > optimized.cpu.price) {
            console.log(`Upgrading CPU: ${optimized.cpu.name} (¥${optimized.cpu.price}) -> ${cpuUpgrade.name} (¥${cpuUpgrade.price})`);
            optimized.cpu = cpuUpgrade;
            
            // CPUが変更された場合、マザーボードとメモリの互換性を再確認
            const newMotherboard = selectCompatibleMotherboard(allParts.motherboard, cpuUpgrade);
            if (newMotherboard && newMotherboard.name !== optimized.motherboard.name) {
                const mbCostDiff = newMotherboard.price - optimized.motherboard.price;
                console.log(`CPU変更によりマザーボード再選択: ${optimized.motherboard.name} -> ${newMotherboard.name} (差額: ¥${mbCostDiff})`);
                optimized.motherboard = newMotherboard;
            }
            
            const newMemory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, cpuUpgrade.socket);
            if (newMemory && newMemory.name !== optimized.memory.name) {
                const memCostDiff = newMemory.price - optimized.memory.price;
                console.log(`CPU変更によりメモリ再選択: ${optimized.memory.name} -> ${newMemory.name} (差額: ¥${memCostDiff})`);
                optimized.memory = newMemory;
            }
            
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 優先度3: マザーボードアップグレード
    attemptUpgrade('マザーボードアップグレード', () => {
        const motherboardUpgrade = upgradeMotherboard(optimized.motherboard, allParts.motherboard, optimized.cpu.socket, availableBudget);
        if (motherboardUpgrade && motherboardUpgrade.price > optimized.motherboard.price) {
            console.log(`Upgrading motherboard: ${optimized.motherboard.name} (¥${optimized.motherboard.price}) -> ${motherboardUpgrade.name} (¥${motherboardUpgrade.price})`);
            optimized.motherboard = motherboardUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 優先度4: クーラーアップグレード
    attemptUpgrade('クーラーアップグレード', () => {
        const coolerUpgrade = upgradeCooler(optimized.cooler, allParts.cooler, availableBudget);
        if (coolerUpgrade && coolerUpgrade.price > optimized.cooler.price) {
            console.log(`Upgrading cooler: ${optimized.cooler.name} (¥${optimized.cooler.price}) -> ${coolerUpgrade.name} (¥${coolerUpgrade.price})`);
            optimized.cooler = coolerUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 優先度5: PSUアップグレード
    attemptUpgrade('PSUアップグレード', () => {
        const psuUpgrade = upgradePSU(optimized.psu, allParts.psu, optimized.cpu, optimized.gpu, availableBudget);
        if (psuUpgrade && psuUpgrade.price > optimized.psu.price) {
            console.log(`Upgrading PSU: ${optimized.psu.name} (¥${optimized.psu.price}) -> ${psuUpgrade.name} (¥${psuUpgrade.price})`);
            optimized.psu = psuUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 優先度6: PCケースアップグレード
    attemptUpgrade('PCケースアップグレード', () => {
        const caseUpgrade = upgradeCase(optimized.case, allParts.case, optimized.motherboard.formFactor, availableBudget);
        if (caseUpgrade && caseUpgrade.price > optimized.case.price) {
            console.log(`Upgrading PC case: ${optimized.case.name} (¥${optimized.case.price}) -> ${caseUpgrade.name} (¥${caseUpgrade.price})`);
            optimized.case = caseUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
    // 最後にストレージアップグレード（容量固定のため最後）
    attemptUpgrade('ストレージアップグレード', () => {
        const storageUpgrade = upgradeStorage(optimized.storage, allParts.storage, requirements.storage.capacity, availableBudget);
        if (storageUpgrade && storageUpgrade.price > optimized.storage.price) {
            console.log(`Upgrading storage: ${optimized.storage.name} (¥${optimized.storage.price}) -> ${storageUpgrade.name} (¥${storageUpgrade.price})`);
            optimized.storage = storageUpgrade;
            return { success: true };
        }
        return { success: false };
    }, availableBudget);
    
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

// 互換性のあるマザーボードを選択（最安優先）
function selectCompatibleMotherboard(motherboards, cpu) {
    if (!motherboards || motherboards.length === 0 || !cpu) return null;
    
    const compatibleMotherboards = motherboards.filter(mb => mb.socket === cpu.socket);
    if (compatibleMotherboards.length === 0) {
        console.warn(`警告: CPU ${cpu.name} (${cpu.socket}) に適合するマザーボードが見つかりません`);
        return null;
    }
    
    // 最安価のマザーボードを選択
    const cheapest = compatibleMotherboards.sort((a, b) => a.price - b.price)[0];
    console.log(`マザーボード選択: ${cheapest.name} (${cheapest.socket}, ¥${cheapest.price})`);
    return cheapest;
}

// システムに適したPSUを選択
function selectPSUForSystem(psus, cpu, gpu) {
    if (!psus || psus.length === 0) return null;
    
    // 基本的な電力要件を計算（簡易版）
    let requiredWattage = 400; // ベース消費電力
    
    if (cpu) {
        // CPU名から大まかな消費電力を推定
        if (cpu.name.toLowerCase().includes('i9') || cpu.name.toLowerCase().includes('ryzen 9')) {
            requiredWattage += 150;
        } else if (cpu.name.toLowerCase().includes('i7') || cpu.name.toLowerCase().includes('ryzen 7')) {
            requiredWattage += 120;
        } else {
            requiredWattage += 100;
        }
    }
    
    if (gpu) {
        // GPU名から大まかな消費電力を推定
        const gpuName = gpu.name.toLowerCase();
        if (gpuName.includes('5090') || gpuName.includes('5080')) {
            requiredWattage += 400;
        } else if (gpuName.includes('5070') || gpuName.includes('9070')) {
            requiredWattage += 300;
        } else if (gpuName.includes('5060') || gpuName.includes('9060')) {
            requiredWattage += 200;
        } else {
            requiredWattage += 250; // デフォルト
        }
    }
    
    // 安全マージンを追加（20%）
    requiredWattage = Math.ceil(requiredWattage * 1.2);
    
    console.log(`PSU要件: 最低${requiredWattage}W必要`);
    
    // 要件を満たすPSUの中から最安を選択
    const suitablePSUs = psus.filter(psu => {
        const wattage = parseInt(psu.wattage.replace('W', ''));
        return wattage >= requiredWattage;
    });
    
    if (suitablePSUs.length === 0) {
        console.warn(`警告: ${requiredWattage}W以上のPSUが見つかりません。最大容量のPSUを選択します。`);
        const maxPSU = psus.sort((a, b) => {
            const aWatt = parseInt(a.wattage.replace('W', ''));
            const bWatt = parseInt(b.wattage.replace('W', ''));
            return bWatt - aWatt;
        })[0];
        console.log(`PSU選択: ${maxPSU.name} (${maxPSU.wattage}, ¥${maxPSU.price})`);
        return maxPSU;
    }
    
    // 適合するPSUの中から最安を選択
    const cheapest = suitablePSUs.sort((a, b) => a.price - b.price)[0];
    console.log(`PSU選択: ${cheapest.name} (${cheapest.wattage}, ¥${cheapest.price})`);
    return cheapest;
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

// Tarkov専用X3D CPUアップグレード関数
function upgradeTarkovX3DCPU(currentCPU, allCPUs, budget, currentGPU) {
    if (!allCPUs || allCPUs.length === 0 || !currentCPU) return null;
    
    // X3D CPUのみをフィルタリング
    const x3dCPUs = allCPUs.filter(cpu => 
        cpu.name.toLowerCase().includes('x3d') || 
        cpu.name.toLowerCase().includes('3d')
    );
    
    if (x3dCPUs.length === 0) {
        console.log('X3D CPUが見つかりません');
        return null;
    }
    
    // X3D CPUを価格順でソート
    const sortedX3DCPUs = x3dCPUs.sort((a, b) => a.price - b.price);
    
    // 現在のCPUがすでに最高位のX3D CPUかチェック
    const currentIsHighestX3D = sortedX3DCPUs[sortedX3DCPUs.length - 1].name === currentCPU.name;
    if (currentIsHighestX3D) {
        console.log('すでに最高位のX3D CPUです');
        return null;
    }
    
    // GPU価格帯による判定: RTX 5080と5090の価格差の間かチェック
    const rtx5080Price = 160000; // RTX 5080の価格
    const rtx5090Price = 380000; // RTX 5090の価格
    const gpuPriceGap = rtx5090Price - rtx5080Price; // 220,000円の差
    
    // 現在のGPUがRTX 5080以下で、予算が十分にある場合
    const canUpgradeGPU = currentGPU.price <= rtx5080Price && budget >= gpuPriceGap * 0.3; // 価格差の30%以上の予算
    
    if (!canUpgradeGPU) {
        console.log('GPU上位アップグレードが困難なため、X3D CPUをアップグレード');
        
        // 9800X3Dを最優先で探す
        const ryzen9800X3D = sortedX3DCPUs.find(cpu => 
            cpu.name.toLowerCase().includes('9800x3d')
        );
        
        if (ryzen9800X3D && ryzen9800X3D.price > currentCPU.price && ryzen9800X3D.price <= currentCPU.price + budget) {
            console.log(`Tarkov最適化: 9800X3Dにアップグレード ${ryzen9800X3D.name} (¥${ryzen9800X3D.price})`);
            return ryzen9800X3D;
        }
        
        // 9800X3Dがない場合は9950X3Dを探す
        const ryzen9950X3D = sortedX3DCPUs.find(cpu => 
            cpu.name.toLowerCase().includes('9950x3d')
        );
        
        if (ryzen9950X3D && ryzen9950X3D.price > currentCPU.price && ryzen9950X3D.price <= currentCPU.price + budget) {
            console.log(`Tarkov最適化: 9950X3Dにアップグレード ${ryzen9950X3D.name} (¥${ryzen9950X3D.price})`);
            return ryzen9950X3D;
        }
    }
    
    // 通常のアップグレード: 現在より上位のX3D CPUを予算内で選択
    const betterX3DCPUs = sortedX3DCPUs.filter(cpu => 
        cpu.price > currentCPU.price && cpu.price <= currentCPU.price + budget
    );
    
    if (betterX3DCPUs.length > 0) {
        const upgrade = betterX3DCPUs[0]; // 最安の上位X3D CPU
        console.log(`通常X3Dアップグレード: ${upgrade.name} (¥${upgrade.price})`);
        return upgrade;
    }
    
    return null;
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

// CPU+マザーボードセットを選択（CPUメーカー指定時の予算超過許容）
function selectCPUMotherboardSet(cpus, motherboards, budget, cpuBrand, specialLogic, usage, requirements) {
    console.log(`CPU+マザーボードセット選択開始: 予算¥${budget}, CPUブランド: ${cpuBrand}`);
    
    if (!cpus || cpus.length === 0 || !motherboards || motherboards.length === 0) {
        console.error('CPUまたはマザーボードデータが不足');
        return { cpu: null, motherboard: null, memory: null };
    }
    
    let selectedCPU = null;
    let selectedMotherboard = null;
    let selectedMemory = null;
    
    // CPUメーカーが指定されている場合の特別処理
    if (cpuBrand && cpuBrand !== 'any') {
        console.log(`⚡ CPUメーカー指定 (${cpuBrand.toUpperCase()}): 予算超過を許容して最安モデルを選択`);
        
        // 指定されたブランドのCPUをフィルタ
        const brandCPUs = cpus.filter(cpu => {
            const cpuName = cpu.name.toLowerCase();
            if (cpuBrand === 'intel') {
                return cpuName.includes('intel') || cpuName.includes('core');
            } else if (cpuBrand === 'amd') {
                return cpuName.includes('amd') || cpuName.includes('ryzen');
            }
            return true;
        });
        
        if (brandCPUs.length > 0) {
            // X3D特別ロジックがある場合はそれを優先
            if (specialLogic === 'x3d_cpu') {
                selectedCPU = selectCPUByBrand(cpus, budget * 10, cpuBrand, specialLogic, usage); // 予算を大きくして制限を無効化
            } else {
                // 指定ブランドの最安モデルを選択（予算無視）
                selectedCPU = brandCPUs.sort((a, b) => a.price - b.price)[0];
                console.log(`${cpuBrand.toUpperCase()}最安モデル選択: ${selectedCPU.name} (¥${selectedCPU.price})`);
            }
        } else {
            console.warn(`指定された${cpuBrand.toUpperCase()}ブランドのCPUが見つかりません`);
            // フォールバック: 通常のCPU選択
            selectedCPU = selectCPUByBrand(cpus, budget, 'any', specialLogic, usage);
        }
    } else {
        // CPUメーカー指定なしの場合は通常の予算制限付き選択
        console.log('CPUメーカー指定なし: 予算内で最適なCPUを選択');
        selectedCPU = selectCPUByBrand(cpus, budget, cpuBrand, specialLogic, usage);
    }
    
    if (!selectedCPU) {
        console.error('CPU選択に失敗しました');
        return { cpu: null, motherboard: null, memory: null };
    }
    
    // CPUに適合するマザーボードを選択（最安優先）
    selectedMotherboard = selectCompatibleMotherboard(motherboards, selectedCPU);
    if (!selectedMotherboard) {
        console.error(`CPU ${selectedCPU.name} に適合するマザーボードが見つかりません`);
        return { cpu: selectedCPU, motherboard: null, memory: null };
    }
    
    // CPUソケットに適合するメモリを選択
    selectedMemory = selectCompatibleMemoryByCapacity(PARTS_DATA.memory, requirements.ram, selectedCPU.socket);
    if (!selectedMemory) {
        console.warn('適合するメモリが見つかりません');
    }
    
    const totalCost = selectedCPU.price + selectedMotherboard.price + (selectedMemory?.price || 0);
    const overBudget = totalCost - budget;
    
    console.log('CPU+マザーボード+メモリセット選択完了:');
    console.log(`- CPU: ${selectedCPU.name} (¥${selectedCPU.price})`);
    console.log(`- マザーボード: ${selectedMotherboard.name} (¥${selectedMotherboard.price})`);
    console.log(`- メモリ: ${selectedMemory?.name || 'なし'} (¥${selectedMemory?.price || 0})`);
    console.log(`セット合計: ¥${totalCost} (予算¥${budget})`);
    
    if (overBudget > 0 && cpuBrand && cpuBrand !== 'any') {
        console.log(`💰 CPUメーカー指定により¥${overBudget}の予算超過を許容`);
    } else if (overBudget > 0) {
        console.warn(`⚠️ 予算¥${overBudget}超過 - 他のパーツで調整が必要`);
    }
    
    return {
        cpu: selectedCPU,
        motherboard: selectedMotherboard,
        memory: selectedMemory
    };
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
        
        // 【新方式: CPU・マザーボード以外を先に選択】
        console.log('新方式: CPU・マザーボード以外のパーツを先に選択');
        
        // 予算配分（有効予算を使用）
        const gpuBudget = effectiveBudget * usageRec.gpuWeight;
        
        // GPU選択
        const selectedGPU = selectGPUByBrand(partsData.gpu, gpuBudget, gpuBrand, usageRec.specialLogic);
        console.log(`選択されたGPU: ${selectedGPU?.name} (¥${selectedGPU?.price})`);
        
        // 基本パーツ選択（CPU以外）
        const selectedMemory = selectCompatibleMemoryByCapacity(partsData.memory, requirements.ram, 'LGA1700'); // 仮でLGA1700
        const selectedStorage = selectStorageByCapacity(partsData.storage, requirements.storage.capacity);
        const selectedCooler = selectCheapestPart(partsData.cooler);
        const selectedCase = selectCheapestPart(partsData.case);
        const selectedPSU = selectPSUForSystem(partsData.psu, null, selectedGPU); // CPU未定なので仮選択
        
        console.log('固定パーツ選択完了:');
        console.log(`- GPU: ${selectedGPU?.name} (¥${selectedGPU?.price})`);
        console.log(`- メモリ: ${selectedMemory?.name} (¥${selectedMemory?.price})`);
        console.log(`- ストレージ: ${selectedStorage?.name} (¥${selectedStorage?.price})`);
        console.log(`- クーラー: ${selectedCooler?.name} (¥${selectedCooler?.price})`);
        console.log(`- ケース: ${selectedCase?.name} (¥${selectedCase?.price})`);
        console.log(`- PSU: ${selectedPSU?.name} (¥${selectedPSU?.price})`);
        
        // 固定パーツの合計金額を計算
        const fixedPartsPrice = (selectedGPU?.price || 0) + (selectedMemory?.price || 0) + 
                               (selectedStorage?.price || 0) + (selectedCooler?.price || 0) + 
                               (selectedCase?.price || 0) + (selectedPSU?.price || 0);
        
        console.log(`固定パーツ合計: ¥${fixedPartsPrice}`);
        
        // CPU+マザーボード用の残り予算を計算
        const remainingBudgetForCPUMB = effectiveBudget - fixedPartsPrice;
        console.log(`CPU+マザーボード用残り予算: ¥${remainingBudgetForCPUMB}`);
        
        // CPU+マザーボードセットを予算内で選択
        const cpuMBSet = selectCPUMotherboardSet(partsData.cpu, partsData.motherboard, remainingBudgetForCPUMB, cpuBrand, usageRec.specialLogic, usage, requirements);
        
        let recommendations = {
            cpu: cpuMBSet.cpu,
            cooler: selectedCooler,
            motherboard: cpuMBSet.motherboard,
            memory: cpuMBSet.memory, // CPUソケットに対応したメモリ
            storage: selectedStorage,
            gpu: selectedGPU,
            psu: selectPSUForSystem(partsData.psu, cpuMBSet.cpu, selectedGPU), // 最終PSU調整
            case: selectedCase
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
            
            // ゲーム(汎用)用途の特別調整
            if (usage === 'gaming') {
                recommendations = adjustBudgetForGaming(recommendations, partsData, effectiveBudget, requirements);
            } else {
                recommendations = adjustBudgetAutomatically(recommendations, partsData, effectiveBudget, requirements);
            }
            
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
    const { cpuBrand, gpuBrand, usage } = requirements;
    let adjustedRecommendations = { ...recommendations };
    let totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
    
    console.log(`予算調整開始: 現在の合計 ¥${totalPrice}, 予算 ¥${budget}`);
    
    // ゲーム(汎用)でCPUブランド指定なしの場合、まずIntel CPUに変更を試す
    if (usage === 'gaming' && cpuBrand === 'any' && totalPrice > budget) {
        console.log('ゲーム(汎用)用途: Intel CPUへの変更を試行');
        
        const currentCPU = adjustedRecommendations.cpu;
        const isCurrentAMD = currentCPU && (currentCPU.name.toLowerCase().includes('amd') || currentCPU.name.toLowerCase().includes('ryzen'));
        
        if (isCurrentAMD) {
            // Intel CPUを探す
            const intelCPUs = allParts.cpu.filter(cpu => 
                cpu.name.toLowerCase().includes('intel') || 
                cpu.name.toLowerCase().includes('core')
            );
            
            if (intelCPUs.length > 0) {
                // 価格順でソート（安い順）
                const sortedIntelCPUs = intelCPUs.sort((a, b) => a.price - b.price);
                
                for (const intelCPU of sortedIntelCPUs) {
                    // Intel CPUに変更した場合の合計金額を計算
                    const priceDiff = intelCPU.price - currentCPU.price;
                    const newTotalPrice = totalPrice + priceDiff;
                    
                    if (newTotalPrice <= budget) {
                        console.log(`Intel CPUに変更: ${currentCPU.name} (¥${currentCPU.price}) → ${intelCPU.name} (¥${intelCPU.price})`);
                        console.log(`予算調整効果: ¥${newTotalPrice} (¥${budget - newTotalPrice}余り)`);
                        
                        adjustedRecommendations.cpu = intelCPU;
                        
                        // CPUソケット変更に伴う互換性調整
                        const newMotherboard = selectCompatibleMotherboard(allParts.motherboard, intelCPU);
                        if (newMotherboard) {
                            const mbCostDiff = newMotherboard.price - adjustedRecommendations.motherboard.price;
                            adjustedRecommendations.motherboard = newMotherboard;
                            console.log(`マザーボード変更: ${adjustedRecommendations.motherboard.name} → ${newMotherboard.name} (差額: ¥${mbCostDiff})`);
                        }
                        
                        const newMemory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, intelCPU.socket);
                        if (newMemory) {
                            const memCostDiff = newMemory.price - adjustedRecommendations.memory.price;
                            adjustedRecommendations.memory = newMemory;
                            console.log(`メモリ変更: 差額 ¥${memCostDiff}`);
                        }
                        
                        // PSUも再選択
                        adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, intelCPU, adjustedRecommendations.gpu);
                        
                        // 新しい合計金額を計算
                        totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                        console.log(`Intel CPU変更後の合計: ¥${totalPrice}`);
                        
                        if (totalPrice <= budget) {
                            console.log('Intel CPUへの変更で予算内に収まりました');
                            return adjustedRecommendations;
                        }
                        break;
                    }
                }
            }
        }
    }
    
    let adjustmentStep = 0;
    const maxAdjustments = 20; // 無限ループ防止
    
    // 早期終了最適化と無限ループ防止
    let downgradedCPULast = null;
    let downgradedGPULast = null;
    
    while (totalPrice > budget && adjustmentStep < maxAdjustments) {
        adjustmentStep++;
        console.log(`調整ステップ ${adjustmentStep}: オーバー金額 ¥${totalPrice - budget}`);
        
        let progressMade = false;
        
        // ゲーム(汎用)用途でCPUブランド指定なしの場合、CPU優先調整
        if (usage === 'gaming' && cpuBrand === 'any') {
            console.log('ゲーム(汎用)用途: CPU優先調整モード');
            
            // 現在のCPUがAMDの場合、Intelに変更を試す
            const currentCPU = adjustedRecommendations.cpu;
            const isCurrentAMD = currentCPU && (currentCPU.name.toLowerCase().includes('amd') || currentCPU.name.toLowerCase().includes('ryzen'));
            
            if (isCurrentAMD && adjustmentStep <= 3) {
                // Intel CPUを探す（価格順）
                const intelCPUs = allParts.cpu
                    .filter(cpu => cpu.name.toLowerCase().includes('intel') || cpu.name.toLowerCase().includes('core'))
                    .sort((a, b) => a.price - b.price);
                
                if (intelCPUs.length > 0) {
                    const cheapestIntel = intelCPUs[0];
                    console.log(`AMD→Intel変更試行: ${currentCPU.name} (¥${currentCPU.price}) → ${cheapestIntel.name} (¥${cheapestIntel.price})`);
                    
                    // 仮変更して合計金額をチェック
                    const tempRecommendations = { ...adjustedRecommendations };
                    tempRecommendations.cpu = cheapestIntel;
                    
                    // Intel互換パーツに変更
                    const intelMotherboard = selectCompatibleMotherboard(allParts.motherboard, cheapestIntel);
                    const intelMemory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, cheapestIntel.socket);
                    const intelPSU = selectPSUForSystem(allParts.psu, cheapestIntel, adjustedRecommendations.gpu);
                    
                    if (intelMotherboard && intelMemory && intelPSU) {
                        tempRecommendations.motherboard = intelMotherboard;
                        tempRecommendations.memory = intelMemory;
                        tempRecommendations.psu = intelPSU;
                        
                        const tempTotalPrice = Object.values(tempRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                        
                        if (tempTotalPrice < totalPrice) {
                            console.log(`Intel構成採用: 合計 ¥${tempTotalPrice} (¥${totalPrice - tempTotalPrice}節約)`);
                            adjustedRecommendations = tempRecommendations;
                            totalPrice = tempTotalPrice;
                            progressMade = true;
                            
                            if (totalPrice <= budget) {
                                console.log('Intel構成で予算内に収まりました');
                                break;
                            }
                        }
                    }
                }
            }
            
            // Intel構成でも予算オーバーの場合、通常のCPUダウングレード
            if (!progressMade) {
                const downgradedCPU = downgradeCPUByBrand(adjustedRecommendations.cpu, allParts.cpu, 'any', adjustedRecommendations.cpu?.socket);
                
                if (downgradedCPU && downgradedCPU !== downgradedCPULast) {
                    console.log(`CPU通常ダウングレード: ${adjustedRecommendations.cpu.name} → ${downgradedCPU.name}`);
                    
                    adjustedRecommendations.cpu = downgradedCPU;
                    downgradedCPULast = downgradedCPU;
                    
                    // 関連パーツ再選択
                    adjustedRecommendations.motherboard = selectCompatibleMotherboard(allParts.motherboard, downgradedCPU);
                    adjustedRecommendations.memory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, downgradedCPU.socket);
                    adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, downgradedCPU, adjustedRecommendations.gpu);
                    
                    totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                    console.log(`CPU調整後: 合計 ¥${totalPrice}`);
                    progressMade = true;
                }
            }
        } else {
            // 他の用途の場合は従来通り（CPU→GPU交互）
            const isEvenStep = adjustmentStep % 2 === 0;
            
            if (isEvenStep) {
                // 偶数ステップ: CPUをダウングレード
                const downgradedCPU = downgradeCPUByBrand(adjustedRecommendations.cpu, allParts.cpu, cpuBrand, adjustedRecommendations.cpu?.socket);
                
                if (downgradedCPU && downgradedCPU !== downgradedCPULast) {
                    console.log(`CPU変更: ${adjustedRecommendations.cpu.name} → ${downgradedCPU.name}`);
                    
                    adjustedRecommendations.cpu = downgradedCPU;
                    downgradedCPULast = downgradedCPU;
                    
                    // 関連パーツ再選択
                    adjustedRecommendations.motherboard = selectCompatibleMotherboard(allParts.motherboard, downgradedCPU);
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
                    adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, adjustedRecommendations.cpu, downgradedGPU);
                    
                    totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                    console.log(`GPU調整後: 合計 ¥${totalPrice}`);
                    progressMade = true;
                } else {
                    console.log('GPUのこれ以上のダウングレードは不可能');
                }
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

// CPU+マザーボードセットを予算内で選択
function selectCPUMotherboardSet(cpus, motherboards, budget, cpuBrand, specialLogic, usage, requirements) {
    console.log(`CPU+マザーボードセット選択開始: 予算¥${budget}`);
    
    if (!cpus || cpus.length === 0 || !motherboards || motherboards.length === 0) {
        console.error('CPUまたはマザーボードデータが不足');
        return { cpu: null, motherboard: null, memory: null };
    }
    
    // CPU候補を取得
    let candidateCPUs = cpus;
    
    // 特別ロジック適用（Tarkov用X3D CPUなど）
    if (specialLogic === 'x3d_cpu') {
        candidateCPUs = cpus.filter(cpu => 
            cpu.name.toLowerCase().includes('x3d') || 
            cpu.name.toLowerCase().includes('3d')
        );
        if (candidateCPUs.length === 0) {
            console.warn('X3D CPUが見つからないため、全CPUから選択');
            candidateCPUs = cpus;
        }
    }
    
    // ブランドフィルタリング
    if (cpuBrand && cpuBrand !== 'any') {
        candidateCPUs = candidateCPUs.filter(cpu => {
            const cpuName = cpu.name.toLowerCase();
            if (cpuBrand === 'intel') {
                return cpuName.includes('intel') || cpuName.includes('core');
            } else if (cpuBrand === 'amd') {
                return cpuName.includes('amd') || cpuName.includes('ryzen');
            }
            return true;
        });
    }
    
    console.log(`CPU候補数: ${candidateCPUs.length}`);
    
    // 各CPU + 互換マザーボード + メモリの組み合わせを評価
    const validCombinations = [];
    
    for (const cpu of candidateCPUs) {
        // 互換マザーボードを探す
        const compatibleMBs = motherboards.filter(mb => mb.socket === cpu.socket);
        
        if (compatibleMBs.length === 0) {
            console.warn(`${cpu.name}に互換マザーボードなし`);
            continue;
        }
        
        // 最安マザーボードを選択
        const cheapestMB = compatibleMBs.sort((a, b) => a.price - b.price)[0];
        
        // 互換メモリを選択（実際のメモリデータから）
        const memoryData = typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.memory : 
                          (typeof partsData !== 'undefined' ? partsData.memory : null);
        const compatibleMemory = memoryData ? 
            selectCompatibleMemoryByCapacity(memoryData, requirements.ram, cpu.socket) :
            { name: "Default Memory", price: 5780, capacity: requirements.ram };
        
        const totalPrice = cpu.price + cheapestMB.price + compatibleMemory.price;
        
        if (totalPrice <= budget) {
            validCombinations.push({
                cpu,
                motherboard: cheapestMB,
                memory: compatibleMemory,
                totalPrice,
                budgetUtilization: totalPrice / budget
            });
        }
    }
    
    console.log(`予算内の有効な組み合わせ: ${validCombinations.length}個`);
    
    if (validCombinations.length === 0) {
        console.warn('予算内の組み合わせなし、最安構成を選択');
        // 最安のCPU+マザーボード組み合わせを選択
        const allCombinations = [];
        for (const cpu of candidateCPUs) {
            const compatibleMBs = motherboards.filter(mb => mb.socket === cpu.socket);
            if (compatibleMBs.length > 0) {
                const cheapestMB = compatibleMBs.sort((a, b) => a.price - b.price)[0];
                const memoryData = typeof PARTS_DATA !== 'undefined' ? PARTS_DATA.memory : 
                                  (typeof partsData !== 'undefined' ? partsData.memory : null);
                const compatibleMemory = memoryData ? 
                    selectCompatibleMemoryByCapacity(memoryData, requirements.ram, cpu.socket) :
                    { name: "Default Memory", price: 5780, capacity: requirements.ram };
                
                allCombinations.push({
                    cpu,
                    motherboard: cheapestMB,
                    memory: compatibleMemory,
                    totalPrice: cpu.price + cheapestMB.price + compatibleMemory.price
                });
            }
        }
        
        if (allCombinations.length > 0) {
            const cheapest = allCombinations.sort((a, b) => a.totalPrice - b.totalPrice)[0];
            console.log(`最安構成選択: ${cheapest.cpu.name} + ${cheapest.motherboard.name} (¥${cheapest.totalPrice})`);
            return cheapest;
        }
    }
    
    // ゲーム(汎用)でブランド指定なしの場合、Intel優先
    if (usage === 'gaming' && cpuBrand === 'any') {
        const intelCombinations = validCombinations.filter(combo => 
            combo.cpu.name.toLowerCase().includes('intel') || 
            combo.cpu.name.toLowerCase().includes('core')
        );
        
        if (intelCombinations.length > 0) {
            // 予算利用率が最も高いIntel構成を選択
            const bestIntel = intelCombinations.sort((a, b) => b.budgetUtilization - a.budgetUtilization)[0];
            console.log(`Intel優先選択: ${bestIntel.cpu.name} + ${bestIntel.motherboard.name} (¥${bestIntel.totalPrice})`);
            return bestIntel;
        }
    }
    
    // 予算利用率が最も高い組み合わせを選択
    const bestCombination = validCombinations.sort((a, b) => b.budgetUtilization - a.budgetUtilization)[0];
    console.log(`最適組み合わせ選択: ${bestCombination.cpu.name} + ${bestCombination.motherboard.name} (¥${bestCombination.totalPrice})`);
    
    return bestCombination;
}

// ゲーム(汎用)用途専用の予算調整
function adjustBudgetForGaming(recommendations, allParts, budget, requirements) {
    console.log('=== ゲーム(汎用)専用予算調整開始 ===');
    console.log(`目標予算: ¥${budget}`);
    
    let adjustedRecommendations = { ...recommendations };
    let totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
    
    console.log(`調整前合計: ¥${totalPrice} (¥${totalPrice - budget} オーバー)`);
    
    // メモリとストレージは固定（ダウングレード対象外）
    const fixedParts = {
        memory: adjustedRecommendations.memory,
        storage: adjustedRecommendations.storage
    };
    
    console.log('固定パーツ（ダウングレード対象外）:');
    console.log(`- メモリ: ${fixedParts.memory?.name} (¥${fixedParts.memory?.price})`);
    console.log(`- ストレージ: ${fixedParts.storage?.name} (¥${fixedParts.storage?.price})`);
    
    // ダウングレード対象パーツリスト（優先順位順）
    const downgradeParts = [
        { key: 'gpu', name: 'GPU' },
        { key: 'cpu', name: 'CPU' },
        { key: 'motherboard', name: 'マザーボード' },
        { key: 'cooler', name: 'CPUクーラー' },
        { key: 'psu', name: 'PSU' },
        { key: 'case', name: 'PCケース' }
    ];
    
    let adjustmentLoop = 0;
    const maxAdjustments = 20;
    
    while (totalPrice > budget && adjustmentLoop < maxAdjustments) {
        adjustmentLoop++;
        console.log(`\n--- 調整ループ ${adjustmentLoop} ---`);
        console.log(`現在の合計: ¥${totalPrice} (¥${totalPrice - budget} オーバー)`);
        
        let progressMade = false;
        
        for (const partInfo of downgradeParts) {
            const { key, name } = partInfo;
            const currentPart = adjustedRecommendations[key];
            
            if (!currentPart) continue;
            
            console.log(`${name}のダウングレードを試行: ${currentPart.name} (¥${currentPart.price})`);
            
            // 最安パーツを探す
            const cheapestPart = findCheapestCompatiblePart(allParts[key], currentPart, adjustedRecommendations, key);
            
            if (cheapestPart && cheapestPart.price < currentPart.price) {
                console.log(`${name}ダウングレード: ${currentPart.name} → ${cheapestPart.name} (¥${currentPart.price - cheapestPart.price} 節約)`);
                
                adjustedRecommendations[key] = cheapestPart;
                
                // CPU変更の場合は関連パーツも調整
                if (key === 'cpu') {
                    adjustedRecommendations.motherboard = selectCompatibleMotherboard(allParts.motherboard, cheapestPart);
                    adjustedRecommendations.memory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, cheapestPart.socket);
                    adjustedRecommendations.psu = selectPSUForSystem(allParts.psu, cheapestPart, adjustedRecommendations.gpu);
                    console.log('CPU変更により関連パーツも再選択');
                }
                
                // マザーボード変更の場合はメモリも調整
                if (key === 'motherboard') {
                    adjustedRecommendations.memory = selectCompatibleMemoryByCapacity(allParts.memory, requirements.ram, adjustedRecommendations.cpu.socket);
                }
                
                totalPrice = Object.values(adjustedRecommendations).reduce((sum, part) => sum + (part ? part.price : 0), 0);
                console.log(`調整後合計: ¥${totalPrice}`);
                
                progressMade = true;
                
                if (totalPrice <= budget) {
                    console.log('🎉 予算内に収まりました！');
                    break;
                }
            } else {
                console.log(`${name}: これ以上安いパーツなし`);
            }
        }
        
        if (!progressMade) {
            console.log('⚠️ すべてのパーツが最安値です。これ以上の調整は不可能。');
            break;
        }
        
        if (totalPrice <= budget) {
            break;
        }
    }
    
    const finalOverage = totalPrice - budget;
    if (finalOverage > 0) {
        console.log(`\n🔴 最終結果: ¥${finalOverage} の予算オーバー（最安構成）`);
        console.log('これは最小限の構成です。予算を増やすことをお勧めします。');
    } else {
        console.log(`\n🟢 予算調整成功: 最終合計 ¥${totalPrice} (¥${budget - totalPrice} 余り)`);
    }
    
    console.log('=== ゲーム(汎用)専用予算調整完了 ===');
    return adjustedRecommendations;
}

// 互換性を考慮した最安パーツを探す
function findCheapestCompatiblePart(partsList, currentPart, recommendations, partKey) {
    if (!partsList || partsList.length === 0) return null;
    
    // 現在のパーツより安いものをフィルタ
    const cheaperParts = partsList.filter(part => part.price < currentPart.price);
    
    if (cheaperParts.length === 0) return null;
    
    // パーツタイプ別の互換性チェック
    let compatibleParts = cheaperParts;
    
    switch (partKey) {
        case 'motherboard':
            // CPUソケット互換性
            compatibleParts = cheaperParts.filter(mb => mb.socket === recommendations.cpu?.socket);
            break;
        case 'memory':
            // CPUソケット互換性
            const requiredMemoryType = getCompatibleMemoryType(recommendations.cpu?.socket);
            compatibleParts = cheaperParts.filter(mem => mem.type.includes(requiredMemoryType));
            break;
        case 'psu':
            // 最低電力要件
            const minWattage = 500; // 最低限の電力
            compatibleParts = cheaperParts.filter(psu => {
                const wattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
                return wattage >= minWattage;
            });
            break;
        case 'case':
            // マザーボードフォームファクター互換性
            compatibleParts = cheaperParts.filter(pcCase => {
                const mbFormFactor = recommendations.motherboard?.formFactor;
                return !mbFormFactor || pcCase.formFactor.includes(mbFormFactor);
            });
            break;
    }
    
    // 最安の互換パーツを返す
    return compatibleParts.length > 0 ? compatibleParts.sort((a, b) => a.price - b.price)[0] : null;
}