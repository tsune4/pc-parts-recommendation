// Test high budget upgrades with new priority system
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== 高予算アップグレードテスト ===\n');

const testConfigs = [
    {
        name: '中予算テスト (¥200,000)',
        config: {
            budget: 200000,
            ram: '16GB',
            storage: { capacity: '1TB' },
            cpuBrand: 'amd',
            gpuBrand: 'nvidia',
            usage: 'gaming'
        }
    },
    {
        name: '高予算テスト (¥400,000)',
        config: {
            budget: 400000,
            ram: '32GB',
            storage: { capacity: '1TB' },
            cpuBrand: 'amd',
            gpuBrand: 'nvidia',
            usage: 'gaming'
        }
    },
    {
        name: '超高予算テスト (¥600,000)',
        config: {
            budget: 600000,
            ram: '32GB',
            storage: { capacity: '2TB' },
            cpuBrand: 'any',
            gpuBrand: 'any',
            usage: 'creative'
        }
    }
];

testConfigs.forEach(test => {
    console.log(`\n🧪 ${test.name}:`);
    console.log(`予算: ¥${test.config.budget.toLocaleString()}, RAM: ${test.config.ram}, ストレージ: ${test.config.storage.capacity}`);
    
    try {
        const result = sandbox.getRecommendations(test.config);
        
        console.log(`\n✅ 最終推奨結果 (¥${result.totalPrice.toLocaleString()}):`);
        console.log(`CPU: ${result.recommendations.cpu.name} (¥${result.recommendations.cpu.price.toLocaleString()})`);
        console.log(`GPU: ${result.recommendations.gpu.name} (¥${result.recommendations.gpu.price.toLocaleString()})`);
        console.log(`Motherboard: ${result.recommendations.motherboard.name} (¥${result.recommendations.motherboard.price.toLocaleString()})`);
        console.log(`Memory: ${result.recommendations.memory.name} (¥${result.recommendations.memory.price.toLocaleString()})`);
        console.log(`Storage: ${result.recommendations.storage.name} (¥${result.recommendations.storage.price.toLocaleString()})`);
        console.log(`Cooler: ${result.recommendations.cooler.name} (¥${result.recommendations.cooler.price.toLocaleString()})`);
        console.log(`PSU: ${result.recommendations.psu.name} (¥${result.recommendations.psu.price.toLocaleString()})`);
        console.log(`Case: ${result.recommendations.case.name} (¥${result.recommendations.case.price.toLocaleString()})`);
        
        const remainingBudget = test.config.budget - result.totalPrice;
        console.log(`\n💰 残り予算: ¥${remainingBudget.toLocaleString()}`);
        
        // 高予算での主要パーツの品質確認
        if (test.config.budget >= 400000) {
            console.log('\n🔍 高予算品質チェック:');
            
            // GPUチェック
            const isHighEndGPU = result.recommendations.gpu.price >= 100000;
            console.log(`GPU品質: ${isHighEndGPU ? '✅ ハイエンド' : '⚠️ 要確認'} (¥${result.recommendations.gpu.price.toLocaleString()})`);
            
            // CPUチェック
            const isHighEndCPU = result.recommendations.cpu.price >= 40000;
            console.log(`CPU品質: ${isHighEndCPU ? '✅ ハイエンド' : '⚠️ 要確認'} (¥${result.recommendations.cpu.price.toLocaleString()})`);
            
            // マザーボードチェック
            const isHighEndMB = result.recommendations.motherboard.price >= 20000;
            console.log(`Motherboard品質: ${isHighEndMB ? '✅ 高品質' : '⚠️ 要確認'} (¥${result.recommendations.motherboard.price.toLocaleString()})`);
            
            // PSUチェック
            const isHighEndPSU = result.recommendations.psu.price >= 10000;
            console.log(`PSU品質: ${isHighEndPSU ? '✅ 高品質' : '⚠️ 要確認'} (¥${result.recommendations.psu.price.toLocaleString()})`);
            
            // ケースチェック
            const isPremiumCase = result.recommendations.case.price >= 15000;
            console.log(`Case品質: ${isPremiumCase ? '✅ プレミアム' : '⚠️ 標準品'} (¥${result.recommendations.case.price.toLocaleString()})`);
        }
        
    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
});