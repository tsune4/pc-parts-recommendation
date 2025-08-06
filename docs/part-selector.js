// Part Selection Module
class PartSelector {
    constructor() {
        this.brandDetector = new BrandDetector();
        this.parseCache = new Map();
        this.config = RecommendationConfig;
        this.sortedPartsCache = new Map();
        this.brandIndexCache = new Map();
        this.metadataCache = new Map();
    }

    /**
     * パーツデータの事前ソートとキャッシュ
     * @param {Array} parts - パーツ配列
     * @param {string} category - カテゴリ名
     * @returns {Array} - ソート済みパーツ配列
     */
    getPreSortedParts(parts, category) {
        if (!parts || parts.length === 0) return [];
        
        const cacheKey = `${category}_sorted`;
        if (this.sortedPartsCache.has(cacheKey)) {
            return this.sortedPartsCache.get(cacheKey);
        }
        
        // 価格順でソート（高い順）
        const sortedParts = [...parts].sort((a, b) => b.price - a.price);
        this.sortedPartsCache.set(cacheKey, sortedParts);
        
        return sortedParts;
    }

    /**
     * バイナリサーチによる予算内パーツ検索
     * @param {Array} sortedParts - ソート済みパーツ配列
     * @param {number} budget - 予算
     * @returns {Array} - 予算内パーツ配列
     */
    getBudgetPartsWithBinarySearch(sortedParts, budget) {
        if (!sortedParts || sortedParts.length === 0) return [];
        
        let left = 0;
        let right = sortedParts.length - 1;
        let maxIndex = -1;
        
        // バイナリサーチで予算内の最大価格インデックスを探す
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (sortedParts[mid].price <= budget) {
                maxIndex = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        
        return maxIndex >= 0 ? sortedParts.slice(maxIndex) : [];
    }

    /**
     * 予算内で最適なパーツを選択（高速化版）
     * @param {Array} parts - パーツ配列
     * @param {number} budget - 予算
     * @param {string} category - カテゴリ名
     * @returns {Object|null} - 選択されたパーツ
     */
    selectBestPart(parts, budget, category = 'general') {
        if (!parts || parts.length === 0) return null;
        
        const sortedParts = this.getPreSortedParts(parts, category);
        const withinBudget = this.getBudgetPartsWithBinarySearch(sortedParts, budget);
        
        if (withinBudget.length === 0) {
            // 予算内にない場合は最安値を返す
            return sortedParts[sortedParts.length - 1];
        }
        
        // 予算内の最高価格パーツを返す
        return withinBudget[0];
    }

    /**
     * GPU用予算内最適選択（同価格時AMD優先）
     * @param {Array} gpus - GPU配列
     * @param {number} budget - 予算
     * @param {string} brand - ブランド指定
     * @returns {Object|null} - 選択されたGPU
     */
    selectBestGPU(gpus, budget, brand = 'any') {
        if (!gpus || gpus.length === 0) return null;
        
        const withinBudget = gpus.filter(gpu => gpu.price <= budget);
        if (withinBudget.length === 0) {
            return gpus.sort((a, b) => a.price - b.price)[0];
        }
        
        const sortedGPUs = withinBudget.sort((a, b) => b.price - a.price);
        
        // ブランド指定なしの場合、同価格ならAMD優先
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

    /**
     * メモリ容量を正しく解析する関数（キャッシュ機能付き）
     * @param {string} capacityString - 容量文字列
     * @returns {number} - 容量(GB)
     */
    parseMemoryCapacity(capacityString) {
        if (this.parseCache.has(capacityString)) {
            return this.parseCache.get(capacityString);
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
        
        this.parseCache.set(capacityString, result);
        return result;
    }

    /**
     * メモリ選択（互換性考慮版）
     * @param {Array} memories - メモリ配列
     * @param {string} targetCapacity - ターゲット容量
     * @param {number} budget - 予算
     * @param {string} cpuSocket - CPUソケット
     * @returns {Object|null} - 選択されたメモリ
     */
    selectMemory(memories, targetCapacity, budget, cpuSocket) {
        if (!memories || memories.length === 0) return null;
        
        const compatibleMemoryType = this.getCompatibleMemoryType(cpuSocket);
        const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
        
        console.log(`メモリ選択: ターゲット${targetCapacityNum}GB, タイプ${compatibleMemoryType}, 予算¥${budget}`);
        
        // CPU互換性のあるメモリのみフィルタリング
        const compatibleMemories = memories.filter(mem => 
            mem.type.includes(compatibleMemoryType)
        );
        
        if (compatibleMemories.length === 0) {
            console.warn(`警告: ${compatibleMemoryType}メモリが見つかりません。`);
            return memories.sort((a, b) => a.price - b.price)[0];
        }
        
        // 単一パスでメモリ選択最適化
        const suitable = [];
        for (const mem of compatibleMemories) {
            const memCapacity = this.parseMemoryCapacity(mem.capacity);
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
                const capacity = this.parseMemoryCapacity(mem.capacity);
                return capacity <= targetCapacityNum && mem.price <= budget;
            }).sort((a, b) => {
                const aCapacity = this.parseMemoryCapacity(a.capacity);
                const bCapacity = this.parseMemoryCapacity(b.capacity);
                return bCapacity - aCapacity;
            });
            
            return closestCapacity.length > 0 ? closestCapacity[0] : 
                   this.selectCheapestPart(compatibleMemories);
        }
        
        // 価格効率の最適化：ターゲット容量に最も近く、価格が高いものを選択
        return suitable.sort((a, b) => {
            const aCapacity = this.parseMemoryCapacity(a.capacity);
            const bCapacity = this.parseMemoryCapacity(b.capacity);
            
            // ターゲット容量に近いものを優先
            const aDistance = Math.abs(aCapacity - targetCapacityNum);
            const bDistance = Math.abs(bCapacity - targetCapacityNum);
            
            if (aDistance !== bDistance) {
                return aDistance - bDistance;
            }
            
            // 容量が同じなら価格が高いものを優先
            return b.price - a.price;
        })[0];
    }

    /**
     * ストレージ選択
     * @param {Array} storages - ストレージ配列
     * @param {Object} requirements - 要求仕様
     * @param {number} budget - 予算
     * @returns {Object|null} - 選択されたストレージ
     */
    selectStorage(storages, requirements, budget) {
        if (!storages || storages.length === 0) return null;
        
        const targetCapacity = requirements.storage.capacity;
        const withinBudget = storages.filter(storage => storage.price <= budget);
        
        if (withinBudget.length === 0) {
            return this.selectCheapestPart(storages);
        }
        
        // 容量とタイプでフィルタリング
        const suitable = withinBudget.filter(storage => {
            const storageCapacity = this.parseCapacityToGB(storage.capacity);
            const targetCapacityGB = this.parseCapacityToGB(targetCapacity);
            return storageCapacity >= targetCapacityGB && 
                   storage.type.toLowerCase().includes('ssd');
        });
        
        if (suitable.length === 0) {
            return this.selectBestPart(withinBudget, budget);
        }
        
        // 価格順でソート（高価格優先）
        return suitable.sort((a, b) => b.price - a.price)[0];
    }

    /**
     * 電源選択
     * @param {Array} psus - 電源配列
     * @param {number} minWattage - 最小ワット数
     * @param {number} budget - 予算
     * @returns {Object|null} - 選択された電源
     */
    selectPSU(psus, minWattage, budget) {
        if (!psus || psus.length === 0) return null;
        
        const withinBudget = psus.filter(psu => psu.price <= budget);
        if (withinBudget.length === 0) {
            return this.selectCheapestPart(psus);
        }
        
        const suitable = withinBudget.filter(psu => {
            const wattage = parseInt(psu.wattage.replace(/[^\d]/g, ''));
            return wattage >= minWattage;
        });
        
        if (suitable.length === 0) {
            console.warn(`警告: 予算¥${budget}で${minWattage}W以上の電源が見つかりません`);
            return this.selectBestPart(withinBudget, budget);
        }
        
        // ワット数が要求を満たす中で最も価格効率が良いものを選択
        return suitable.sort((a, b) => {
            const aWattage = parseInt(a.wattage.replace(/[^\d]/g, ''));
            const bWattage = parseInt(b.wattage.replace(/[^\d]/g, ''));
            const aEfficiency = aWattage / a.price;
            const bEfficiency = bWattage / b.price;
            return bEfficiency - aEfficiency;
        })[0];
    }

    /**
     * 最安パーツ選択
     * @param {Array} parts - パーツ配列
     * @returns {Object|null} - 最安パーツ
     */
    selectCheapestPart(parts) {
        if (!parts || parts.length === 0) return null;
        return parts.sort((a, b) => a.price - b.price)[0];
    }

    /**
     * 容量文字列をGB数値に変換
     * @param {string} capacityStr - 容量文字列
     * @returns {number} - GB数値
     */
    parseCapacityToGB(capacityStr) {
        if (!capacityStr) return 0;
        
        const match = capacityStr.match(/(\d+(?:\.\d+)?)(TB|GB)/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return unit === 'TB' ? value * 1000 : value;
    }

    /**
     * ソケット対応メモリタイプ取得
     * @param {string} socket - CPUソケット
     * @returns {string} - メモリタイプ
     */
    getCompatibleMemoryType(socket) {
        const socketMap = this.config.SYSTEM.SOCKET_MEMORY_MAP;
        return socketMap[socket] || 'DDR4';
    }

    /**
     * ブランド別インデックス作成
     * @param {Array} parts - パーツ配列
     * @param {string} category - カテゴリ名
     * @param {string} type - パーツタイプ ('CPU' or 'GPU')
     * @returns {Map} - ブランド別インデックス
     */
    createBrandIndex(parts, category, type) {
        if (!parts || parts.length === 0) return new Map();
        
        const cacheKey = `${category}_${type}_index`;
        if (this.brandIndexCache.has(cacheKey)) {
            return this.brandIndexCache.get(cacheKey);
        }
        
        const brandIndex = new Map();
        const brands = type === 'CPU' ? ['intel', 'amd'] : ['nvidia', 'amd'];
        
        for (const brand of brands) {
            const brandParts = parts.filter(part => {
                if (type === 'CPU') {
                    return this.brandDetector.isCPUBrand(part, brand);
                } else if (type === 'GPU') {
                    return this.brandDetector.isGPUBrand(part, brand);
                }
                return false;
            });
            
            brandIndex.set(brand, this.getPreSortedParts(brandParts, `${category}_${brand}`));
        }
        
        this.brandIndexCache.set(cacheKey, brandIndex);
        return brandIndex;
    }

    /**
     * ブランド別高速フィルタリング
     * @param {Array} parts - パーツ配列
     * @param {string} brand - ブランド名
     * @param {string} category - カテゴリ名
     * @param {string} type - パーツタイプ
     * @returns {Array} - フィルタリング済みパーツ
     */
    filterPartsByBrand(parts, brand, category, type) {
        if (brand === 'any') return parts;
        
        const brandIndex = this.createBrandIndex(parts, category, type);
        return brandIndex.get(brand) || [];
    }

    /**
     * メタデータ事前計算とキャッシュ
     * @param {Object} part - パーツオブジェクト
     * @param {string} category - カテゴリ名
     * @returns {Object} - 計算済みメタデータ
     */
    getPartMetadata(part, category) {
        if (!part) return {};
        
        const cacheKey = `${category}_${part.name}_meta`;
        if (this.metadataCache.has(cacheKey)) {
            return this.metadataCache.get(cacheKey);
        }
        
        const metadata = {
            normalizedName: part.name.toLowerCase(),
            pricePerGB: 0,
            isX3D: false,
            vramCapacity: 0,
            memoryCapacityGB: 0
        };
        
        // カテゴリ別の特殊メタデータ計算
        switch (category) {
            case 'cpu':
                metadata.isX3D = metadata.normalizedName.includes('x3d') || 
                                metadata.normalizedName.includes('3d');
                break;
                
            case 'gpu':
                if (part.memory) {
                    const vramMatch = part.memory.match(/(\d+)GB/);
                    if (vramMatch) {
                        metadata.vramCapacity = parseInt(vramMatch[1]);
                    }
                }
                break;
                
            case 'memory':
                if (part.capacity) {
                    metadata.memoryCapacityGB = this.parseMemoryCapacity(part.capacity);
                    if (metadata.memoryCapacityGB > 0) {
                        metadata.pricePerGB = part.price / metadata.memoryCapacityGB;
                    }
                }
                break;
                
            case 'storage':
                if (part.capacity) {
                    const capacityGB = this.parseCapacityToGB(part.capacity);
                    if (capacityGB > 0) {
                        metadata.pricePerGB = part.price / capacityGB;
                    }
                }
                break;
        }
        
        this.metadataCache.set(cacheKey, metadata);
        return metadata;
    }

    /**
     * キャッシュクリア
     */
    clearCache() {
        this.parseCache.clear();
        this.sortedPartsCache.clear();
        this.brandIndexCache.clear();
        this.metadataCache.clear();
        this.brandDetector.clearCache();
    }
}