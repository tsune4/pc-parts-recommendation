// Brand Detection Module
class BrandDetector {
    constructor() {
        this.cache = new Map();
        this.cpuKeywords = RecommendationConfig.BRAND_KEYWORDS.CPU;
        this.gpuKeywords = RecommendationConfig.BRAND_KEYWORDS.GPU;
    }

    /**
     * 高速ブランド判定関数（キャッシュ付き）
     * @param {string} name - パーツ名
     * @param {Map} brandKeywordsMap - ブランドキーワードマップ
     * @returns {string|null} - ブランド名またはnull
     */
    getBrand(name, brandKeywordsMap) {
        if (!name) return null;
        
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

    /**
     * CPUブランド判定
     * @param {Object} cpu - CPUオブジェクト
     * @param {string} targetBrand - ターゲットブランド ('intel', 'amd', 'any')
     * @returns {boolean} - ブランドが一致するかどうか
     */
    isCPUBrand(cpu, targetBrand) {
        if (!cpu || !targetBrand || targetBrand === 'any') return true;
        return this.getBrand(cpu.name, this.cpuKeywords) === targetBrand;
    }

    /**
     * GPUブランド判定
     * @param {Object} gpu - GPUオブジェクト
     * @param {string} targetBrand - ターゲットブランド ('nvidia', 'amd', 'any')
     * @returns {boolean} - ブランドが一致するかどうか
     */
    isGPUBrand(gpu, targetBrand) {
        if (!gpu || !targetBrand || targetBrand === 'any') return true;
        return this.getBrand(gpu.name, this.gpuKeywords) === targetBrand;
    }

    /**
     * X3D CPU判定（Tarkov等の用途で重要）
     * @param {Object} cpu - CPUオブジェクト
     * @returns {boolean} - X3D CPUかどうか
     */
    isX3DCPU(cpu) {
        if (!cpu) return false;
        const lowerName = cpu.name.toLowerCase();
        return lowerName.includes('x3d') || lowerName.includes('3d');
    }

    /**
     * 特定のX3D CPUモデル判定
     * @param {Object} cpu - CPUオブジェクト
     * @param {string} model - モデル名
     * @returns {boolean} - 指定モデルかどうか
     */
    isSpecificX3DCPU(cpu, model) {
        if (!cpu) return false;
        return cpu.name.toLowerCase().includes(model.toLowerCase());
    }

    /**
     * キャッシュクリア
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * キャッシュサイズ取得
     * @returns {number} - キャッシュエントリ数
     */
    getCacheSize() {
        return this.cache.size;
    }
}