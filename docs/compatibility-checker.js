// Compatibility Checker Module
import { RecommendationConfig } from './recommendation-config.js';
import { BrandDetector } from './brand-detector.js';

export class CompatibilityChecker {
    constructor() {
        this.brandDetector = new BrandDetector();
        this.config = RecommendationConfig;
        this.socketCache = new Map();
    }

    /**
     * CPU対応マザーボード選択
     * @param {Array} motherboards - マザーボード配列
     * @param {Object} selectedCPU - 選択されたCPU
     * @returns {Object|null} - 互換性のあるマザーボード
     */
    selectCompatibleMotherboard(motherboards, selectedCPU) {
        if (!motherboards || !selectedCPU) return null;
        
        const cpuSocket = this.normalizeSocket(selectedCPU.socket);
        console.log(`マザーボード選択: CPU ${selectedCPU.name}, ソケット ${cpuSocket}`);
        
        // ソケット互換性チェック
        const compatibleBoards = motherboards.filter(board => {
            const boardSocket = this.normalizeSocket(board.socket);
            const isCompatible = boardSocket === cpuSocket;
            
            if (!isCompatible) {
                console.log(`  互換性なし: ${board.name} (${boardSocket} !== ${cpuSocket})`);
            }
            
            return isCompatible;
        });
        
        if (compatibleBoards.length === 0) {
            console.warn(`警告: ${cpuSocket}対応マザーボードが見つかりません`);
            return motherboards.sort((a, b) => a.price - b.price)[0];
        }
        
        console.log(`互換性のあるマザーボード: ${compatibleBoards.length}個`);
        
        // 価格効率が良いマザーボードを選択
        return compatibleBoards.sort((a, b) => {
            // 機能性と価格のバランスを考慮
            const aScore = this.calculateMotherboardScore(a);
            const bScore = this.calculateMotherboardScore(b);
            return bScore - aScore;
        })[0];
    }

    /**
     * マザーボードスコア計算
     * @param {Object} motherboard - マザーボード
     * @returns {number} - スコア
     */
    calculateMotherboardScore(motherboard) {
        let score = 0;
        
        // 基本スコア（価格の逆数）
        score += 1000 / (motherboard.price / 1000);
        
        // フォームファクターボーナス
        if (motherboard.formFactor === 'ATX') score += 10;
        else if (motherboard.formFactor === 'Micro-ATX') score += 5;
        
        // チップセットボーナス（高級チップセット優遇）
        const chipset = motherboard.chipset.toLowerCase();
        if (chipset.includes('z') || chipset.includes('x')) score += 15;
        else if (chipset.includes('b')) score += 10;
        
        return score;
    }

    /**
     * ソケット名正規化（キャッシュ付き）
     * @param {string} socket - ソケット名
     * @returns {string} - 正規化されたソケット名
     */
    normalizeSocket(socket) {
        if (!socket) return '';
        
        if (this.socketCache.has(socket)) {
            return this.socketCache.get(socket);
        }
        
        let normalized = socket.toLowerCase().trim();
        
        // ソケット名の統一
        const socketMap = {
            'lga1700': 'lga1700',
            'lga 1700': 'lga1700',
            'socket 1700': 'lga1700',
            'lga1851': 'lga1851',
            'lga 1851': 'lga1851',
            'socket 1851': 'lga1851',
            'socket am5': 'socket am5',
            'am5': 'socket am5',
            'socket am4': 'socket am4',
            'am4': 'socket am4'
        };
        
        const result = socketMap[normalized] || normalized;
        this.socketCache.set(socket, result);
        
        return result;
    }

    /**
     * CPUに対応するメモリタイプを取得
     * @param {string} cpuSocket - CPUソケット
     * @returns {string} - メモリタイプ
     */
    getCompatibleMemoryType(cpuSocket) {
        const normalizedSocket = this.normalizeSocket(cpuSocket);
        const socketMap = this.config.SYSTEM.SOCKET_MEMORY_MAP;
        
        // ソケット名をキーとしてメモリタイプを取得
        for (const [socket, memoryType] of Object.entries(socketMap)) {
            if (this.normalizeSocket(socket) === normalizedSocket) {
                return memoryType;
            }
        }
        
        // デフォルトはDDR4
        return 'DDR4';
    }

    /**
     * GPU電力推定
     * @param {Object} gpu - GPUオブジェクト
     * @returns {number} - 推定電力（W）
     */
    estimateGpuPower(gpu) {
        if (!gpu) return 0;
        
        const lowerName = gpu.name.toLowerCase();
        const powerEstimates = this.config.GPU_POWER_ESTIMATES;
        
        // 完全一致を試行
        for (const [model, power] of Object.entries(powerEstimates)) {
            if (lowerName.includes(model)) {
                return power;
            }
        }
        
        // フォールバック：GPUカテゴリによる推定
        if (lowerName.includes('rtx 50')) return 300; // RTX 50系の平均
        if (lowerName.includes('rtx 40')) return 250; // RTX 40系の平均
        if (lowerName.includes('rtx 30')) return 220; // RTX 30系の平均
        if (lowerName.includes('rx 90')) return 300;  // RX 90系の平均
        if (lowerName.includes('rx 70')) return 250;  // RX 70系の平均
        if (lowerName.includes('rx 60')) return 180;  // RX 60系の平均
        
        // 最終フォールバック
        return 200;
    }

    /**
     * CPU TDP推定
     * @param {Object} cpu - CPUオブジェクト
     * @returns {number} - 推定TDP（W）
     */
    estimateCpuTdp(cpu) {
        if (!cpu) return 65;
        
        const lowerName = cpu.name.toLowerCase();
        const tdpEstimates = this.config.CPU_TDP_ESTIMATES;
        
        // CPU階級による推定
        for (const [grade, tdp] of Object.entries(tdpEstimates)) {
            if (lowerName.includes(grade)) {
                return tdp;
            }
        }
        
        // フォールバック
        if (lowerName.includes('intel')) return 65;
        if (lowerName.includes('amd')) return 105;
        
        return 65;
    }

    /**
     * システム必要電力計算
     * @param {Object} cpu - CPUオブジェクト
     * @param {Object} gpu - GPUオブジェクト
     * @returns {number} - 必要電力（W）
     */
    calculateSystemPowerRequirement(cpu, gpu) {
        const cpuPower = this.estimateCpuTdp(cpu);
        const gpuPower = this.estimateGpuPower(gpu);
        const systemBasePower = this.config.SYSTEM.MIN_SYSTEM_POWER;
        const safetyMargin = this.config.SYSTEM.PSU_SAFETY_MARGIN;
        
        const totalPower = (cpuPower + gpuPower + systemBasePower) * safetyMargin;
        
        console.log(`電力計算: CPU ${cpuPower}W + GPU ${gpuPower}W + System ${systemBasePower}W × ${safetyMargin} = ${Math.round(totalPower)}W`);
        
        return Math.round(totalPower);
    }

    /**
     * システム用PSU選択
     * @param {Array} psus - 電源配列
     * @param {Object} selectedCPU - 選択されたCPU
     * @param {Object} selectedGPU - 選択されたGPU
     * @returns {Object|null} - 適切な電源
     */
    selectPSUForSystem(psus, selectedCPU, selectedGPU) {
        if (!psus || psus.length === 0) return null;
        
        const requiredWattage = this.calculateSystemPowerRequirement(selectedCPU, selectedGPU);
        
        // 必要電力以上の電源をフィルタリング
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
        
        // 効率性とコストを考慮して選択
        return suitablePSUs.sort((a, b) => {
            const aWatt = parseInt(a.wattage.replace(/[^\d]/g, ''));
            const bWatt = parseInt(b.wattage.replace(/[^\d]/g, ''));
            
            // オーバースペック過ぎる電源にペナルティ
            const aOverspec = Math.max(0, (aWatt - requiredWattage) / requiredWattage - 0.5);
            const bOverspec = Math.max(0, (bWatt - requiredWattage) / requiredWattage - 0.5);
            
            const aCostEfficiency = (aWatt / a.price) - aOverspec;
            const bCostEfficiency = (bWatt / b.price) - bOverspec;
            
            return bCostEfficiency - aCostEfficiency;
        })[0];
    }

    /**
     * メモリ容量互換性チェック
     * @param {Array} memories - メモリ配列
     * @param {string} targetCapacity - ターゲット容量
     * @param {string} cpuSocket - CPUソケット
     * @returns {Array} - 互換性のあるメモリ
     */
    selectCompatibleMemoryByCapacity(memories, targetCapacity, cpuSocket) {
        if (!memories || memories.length === 0) return [];
        
        const compatibleType = this.getCompatibleMemoryType(cpuSocket);
        const targetCapacityNum = parseInt(targetCapacity.replace('GB', ''));
        
        return memories.filter(mem => {
            const isCompatibleType = mem.type.includes(compatibleType);
            const memCapacity = this.parseMemoryCapacity(mem.capacity);
            const meetsCapacity = memCapacity >= targetCapacityNum;
            
            return isCompatibleType && meetsCapacity;
        });
    }

    /**
     * メモリ容量解析
     * @param {string} capacityString - 容量文字列
     * @returns {number} - 容量(GB)
     */
    parseMemoryCapacity(capacityString) {
        const match = capacityString.match(/(\d+)GB×(\d+)/);
        if (match) {
            return parseInt(match[1]) * parseInt(match[2]);
        }
        
        const simpleMatch = capacityString.match(/(\d+)GB/);
        return simpleMatch ? parseInt(simpleMatch[1]) : 0;
    }

    /**
     * キャッシュクリア
     */
    clearCache() {
        this.socketCache.clear();
        this.brandDetector.clearCache();
    }
}