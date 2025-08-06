// PC Parts Recommendation System Configuration
export const RecommendationConfig = {
    // 用途別の重み設定
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
            cpuWeight: 0.15,  // CPU予算を削減
            gpuWeight: 0.7,   // GPU予算を増加（高VRAM GPU確保のため）
            ramMin: 16,
            storageType: 'ssd',
            psuMin: 800,
            specialLogic: 'high_vram_gpu'
        }
    },

    // ブランド判定キーワード
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

    // GPU電力推定値 (W)
    GPU_POWER_ESTIMATES: {
        'rtx 5090': 575,
        'rtx 5080': 360,
        'rtx 5070 ti': 285,
        'rtx 5070': 220,
        'rtx 5060 ti': 180,
        'rtx 5060': 115,
        'rtx 4090': 450,
        'rtx 4080': 320,
        'rtx 4070 ti': 285,
        'rtx 4070': 200,
        'rtx 4060 ti': 165,
        'rtx 4060': 115,
        'rtx 3080': 320,
        'rtx 3070': 220,
        'rtx 3060': 170,
        'rx 9070 xt': 315,
        'rx 9070': 260,
        'rx 9060 xt': 190,
        'rx 7900 xtx': 355,
        'rx 7900 xt': 315,
        'rx 7800 xt': 263,
        'rx 7700 xt': 245,
        'rx 7600': 165
    },

    // CPU TDP推定値 (W)
    CPU_TDP_ESTIMATES: {
        'i9': 125,
        'i7': 125,
        'i5': 65,
        'i3': 65,
        'ryzen 9': 170,
        'ryzen 7': 105,
        'ryzen 5': 105,
        'ryzen 3': 65
    },

    // システム設定
    SYSTEM: {
        PSU_SAFETY_MARGIN: 1.2, // 電源マージンを少し削減（1.3 → 1.2）
        MIN_SYSTEM_POWER: 100, // マザーボード、メモリ等の基本消費電力
        OS_PRICE: 15000,
        MINIMUM_TOTAL_BUDGET: 125000, // 最小予算設定
        
        // ソケット互換性マップ
        SOCKET_MEMORY_MAP: {
            'LGA1700': 'DDR4',
            'LGA1851': 'DDR5', 
            'Socket AM5': 'DDR5',
            'Socket AM4': 'DDR4'
        },

        // アップグレード優先順位
        UPGRADE_PRIORITIES: {
            gaming: ['gpu', 'cpu', 'storage', 'cooler', 'case'],
            tarkov: ['cpu', 'memory', 'gpu', 'storage', 'cooler'],
            vrchat: ['gpu', 'memory', 'cpu', 'storage', 'cooler']
        }
    },

    // デバッグ設定
    DEBUG: {
        ENABLE_CONSOLE_LOG: true,
        ENABLE_PERFORMANCE_LOG: false
    }
};