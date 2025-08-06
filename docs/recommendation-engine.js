// Main Recommendation Engine
import { RecommendationConfig } from './recommendation-config.js';
import { BrandDetector } from './brand-detector.js';
import { PartSelector } from './part-selector.js';
import { CompatibilityChecker } from './compatibility-checker.js';

export class RecommendationEngine {
    constructor() {
        this.config = RecommendationConfig;
        this.brandDetector = new BrandDetector();
        this.partSelector = new PartSelector();
        this.compatibilityChecker = new CompatibilityChecker();
    }

    /**
     * メイン推奨処理
     * @param {Object} requirements - 要求仕様
     * @returns {Object} - 推奨結果
     */
    getRecommendations(requirements) {
        console.log('=== PC構成推奨開始 ===');
        console.log('要求仕様:', requirements);
        
        try {
            // パーツデータの取得
            const partsData = this.getPartsData();
            
            // OS予算処理
            const { availableBudget, selectedOS } = this.handleOSSelection(
                requirements.budget, 
                requirements.includeOS, 
                partsData
            );
            
            console.log(`利用可能予算: ¥${availableBudget} (OS: ${selectedOS ? selectedOS.name : 'なし'})`);
            
            // 基本構成の決定
            const baseRecommendations = this.buildBaseConfiguration(partsData, requirements, availableBudget);
            
            // 予算最適化とアップグレード
            const finalRecommendations = this.optimizeBudget(baseRecommendations, partsData, availableBudget, requirements);
            
            // 結果の構築
            const result = this.buildResult(finalRecommendations, selectedOS, requirements.budget);
            
            console.log('=== 推奨完了 ===');
            console.log('最終構成:', result);
            
            return result;
            
        } catch (error) {
            console.error('推奨処理エラー:', error);
            throw new Error(`推奨処理に失敗しました: ${error.message}`);
        }
    }

    /**
     * パーツデータ取得
     * @returns {Object} - パーツデータ
     */
    getPartsData() {
        if (typeof PARTS_DATA === 'undefined') {
            throw new Error('パーツデータが読み込まれていません');
        }
        return PARTS_DATA;
    }

    /**
     * OS選択処理
     * @param {number} budget - 総予算
     * @param {boolean} includeOS - OS含有フラグ
     * @param {Object} partsData - パーツデータ
     * @returns {Object} - {availableBudget, selectedOS}
     */
    handleOSSelection(budget, includeOS, partsData) {
        if (!includeOS || !partsData.os || partsData.os.length === 0) {
            return { availableBudget: budget, selectedOS: null };
        }
        
        const selectedOS = partsData.os[0]; // デフォルトOS選択
        const availableBudget = budget - selectedOS.price;
        
        if (availableBudget <= 0) {
            throw new Error('予算がOS代金より少ないため、構成を作成できません');
        }
        
        return { availableBudget, selectedOS };
    }

    /**
     * 基本構成構築
     * @param {Object} partsData - パーツデータ
     * @param {Object} requirements - 要求仕様
     * @param {number} availableBudget - 利用可能予算
     * @returns {Object} - 基本構成
     */
    buildBaseConfiguration(partsData, requirements, availableBudget) {
        const usageConfig = this.config.USAGE_WEIGHTS[requirements.usage] || this.config.USAGE_WEIGHTS.gaming;
        
        // 予算配分計算
        const budgetAllocation = this.calculateBudgetAllocation(availableBudget, usageConfig);
        
        console.log('予算配分:', budgetAllocation);
        
        // CPU選択
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
        
        // マザーボード選択（CPU互換性考慮）
        const selectedMotherboard = this.compatibilityChecker.selectCompatibleMotherboard(
            partsData.motherboard, 
            selectedCPU
        );
        
        // GPU選択
        const selectedGPU = this.selectGPUByBrand(
            partsData.gpu,
            budgetAllocation.gpu,
            requirements.gpuBrand,
            usageConfig.specialLogic
        );
        
        // メモリ選択
        const selectedMemory = this.partSelector.selectMemory(
            partsData.memory,
            requirements.ram,
            budgetAllocation.memory,
            selectedCPU.socket
        );
        
        // ストレージ選択
        const selectedStorage = this.partSelector.selectStorage(
            partsData.storage,
            requirements,
            budgetAllocation.storage
        );
        
        // 電源選択
        const selectedPSU = this.compatibilityChecker.selectPSUForSystem(
            partsData.psu,
            selectedCPU,
            selectedGPU
        );
        
        // クーラー選択
        const selectedCooler = this.partSelector.selectBestPart(
            partsData.cooler,
            budgetAllocation.cooler
        );
        
        // ケース選択
        const selectedCase = this.partSelector.selectBestPart(
            partsData.case,
            budgetAllocation.case
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

    /**
     * 予算配分計算
     * @param {number} budget - 予算
     * @param {Object} usageConfig - 用途設定
     * @returns {Object} - 予算配分
     */
    calculateBudgetAllocation(budget, usageConfig) {
        const allocation = {
            cpu: Math.floor(budget * usageConfig.cpuWeight),
            gpu: Math.floor(budget * usageConfig.gpuWeight),
            memory: Math.floor(budget * 0.1),
            storage: Math.floor(budget * 0.08),
            motherboard: Math.floor(budget * 0.06),
            psu: Math.floor(budget * 0.05),
            cooler: Math.floor(budget * 0.03),
            case: Math.floor(budget * 0.03)
        };
        
        // 残り予算をメインコンポーネントに配分
        const totalAllocated = Object.values(allocation).reduce((sum, val) => sum + val, 0);
        const remaining = budget - totalAllocated;
        
        if (remaining > 0) {
            // GPUに残り予算の70%、CPUに30%を追加配分
            allocation.gpu += Math.floor(remaining * 0.7);
            allocation.cpu += remaining - Math.floor(remaining * 0.7);
        }
        
        return allocation;
    }

    /**
     * ブランド指定CPU選択
     * @param {Array} cpus - CPU配列
     * @param {number} budget - 予算
     * @param {string} brand - ブランド
     * @param {string} specialLogic - 特別ロジック
     * @param {string} usage - 用途
     * @returns {Object|null} - 選択されたCPU
     */
    selectCPUByBrand(cpus, budget, brand, specialLogic, usage) {
        if (!cpus || cpus.length === 0) return null;
        
        let filteredCPUs = cpus.filter(cpu => 
            this.brandDetector.isCPUBrand(cpu, brand) && cpu.price <= budget
        );
        
        if (filteredCPUs.length === 0) {
            // 予算内でブランド条件を満たすものがない場合、最安を選択
            filteredCPUs = cpus.filter(cpu => this.brandDetector.isCPUBrand(cpu, brand));
            return this.partSelector.selectCheapestPart(filteredCPUs);
        }
        
        // 特別ロジック適用
        if (specialLogic === 'x3d_cpu' && usage === 'tarkov') {
            // Tarkov用にX3D CPUを優先
            const x3dCPUs = filteredCPUs.filter(cpu => this.brandDetector.isX3DCPU(cpu));
            if (x3dCPUs.length > 0) {
                return x3dCPUs.sort((a, b) => b.price - a.price)[0];
            }
        }
        
        // 通常の最高価格CPU選択
        return filteredCPUs.sort((a, b) => b.price - a.price)[0];
    }

    /**
     * ブランド指定GPU選択
     * @param {Array} gpus - GPU配列
     * @param {number} budget - 予算
     * @param {string} brand - ブランド
     * @param {string} specialLogic - 特別ロジック
     * @returns {Object|null} - 選択されたGPU
     */
    selectGPUByBrand(gpus, budget, brand, specialLogic) {
        if (!gpus || gpus.length === 0) return null;
        
        let filteredGPUs = gpus.filter(gpu => 
            this.brandDetector.isGPUBrand(gpu, brand) && gpu.price <= budget
        );
        
        if (filteredGPUs.length === 0) {
            filteredGPUs = gpus.filter(gpu => this.brandDetector.isGPUBrand(gpu, brand));
            return this.partSelector.selectCheapestPart(filteredGPUs);
        }
        
        // 特別ロジック適用
        if (specialLogic === 'high_vram_gpu') {
            // VRChat用に高VRAM GPUを優先（仮実装）
            // 実際のVRAM情報がない場合は価格で代用
            return filteredGPUs.sort((a, b) => b.price - a.price)[0];
        }
        
        return this.partSelector.selectBestGPU(filteredGPUs, budget, brand);
    }

    /**
     * 予算最適化
     * @param {Object} baseRecommendations - 基本構成
     * @param {Object} partsData - パーツデータ
     * @param {number} availableBudget - 利用可能予算
     * @param {Object} requirements - 要求仕様
     * @returns {Object} - 最適化後構成
     */
    optimizeBudget(baseRecommendations, partsData, availableBudget, requirements) {
        const currentTotal = this.calculateTotalPrice(baseRecommendations);
        const remainingBudget = availableBudget - currentTotal;
        
        console.log(`現在の合計: ¥${currentTotal}, 残予算: ¥${remainingBudget}`);
        
        if (remainingBudget <= 0) {
            return baseRecommendations;
        }
        
        // アップグレード実行
        return this.upgradePartsInOrder(
            baseRecommendations, 
            partsData, 
            remainingBudget, 
            requirements
        );
    }

    /**
     * パーツアップグレード
     * @param {Object} recommendations - 現在の構成
     * @param {Object} partsData - パーツデータ
     * @param {number} remainingBudget - 残予算
     * @param {Object} requirements - 要求仕様
     * @returns {Object} - アップグレード後構成
     */
    upgradePartsInOrder(recommendations, partsData, remainingBudget, requirements) {
        const upgradePriorities = this.config.SYSTEM.UPGRADE_PRIORITIES[requirements.usage] || 
                                this.config.SYSTEM.UPGRADE_PRIORITIES.gaming;
        
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

    /**
     * 単一パーツアップグレード
     * @param {Object} currentConfig - 現在の構成
     * @param {Object} partsData - パーツデータ
     * @param {string} partType - パーツタイプ
     * @param {number} budget - 予算
     * @param {Object} requirements - 要求仕様
     * @returns {Object} - {success, part}
     */
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
        
        // パーツタイプ別の特別処理
        let bestCandidate;
        switch (partType) {
            case 'gpu':
                bestCandidate = this.partSelector.selectBestGPU(
                    candidates, 
                    targetBudget, 
                    requirements.gpuBrand
                );
                break;
            case 'cpu':
                bestCandidate = candidates.filter(cpu => 
                    this.brandDetector.isCPUBrand(cpu, requirements.cpuBrand)
                ).sort((a, b) => b.price - a.price)[0];
                break;
            default:
                bestCandidate = this.partSelector.selectBestPart(candidates, targetBudget);
        }
        
        return bestCandidate ? 
            { success: true, part: bestCandidate } : 
            { success: false };
    }

    /**
     * 合計価格計算
     * @param {Object} recommendations - 構成
     * @returns {number} - 合計価格
     */
    calculateTotalPrice(recommendations) {
        return Object.values(recommendations)
            .filter(part => part && part.price)
            .reduce((total, part) => total + part.price, 0);
    }

    /**
     * 結果構築
     * @param {Object} recommendations - 最終構成
     * @param {Object} selectedOS - 選択されたOS
     * @param {number} totalBudget - 総予算
     * @returns {Object} - 最終結果
     */
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

    /**
     * キャッシュクリア
     */
    clearAllCaches() {
        this.brandDetector.clearCache();
        this.partSelector.clearCache();
        this.compatibilityChecker.clearCache();
    }
}