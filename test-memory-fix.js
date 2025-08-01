// Test memory selection fix with full PC recommendation
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== メモリ選択修正テスト ===\n');

const testConfigs = [
    {
        name: '16GB メモリテスト',
        config: {
            budget: 150000,
            ram: '16GB',
            storage: { capacity: '1TB' },
            cpuBrand: 'amd',
            gpuBrand: 'nvidia',
            usage: 'gaming'
        }
    },
    {
        name: '32GB メモリテスト',
        config: {
            budget: 200000,
            ram: '32GB',
            storage: { capacity: '1TB' },
            cpuBrand: 'amd',
            gpuBrand: 'nvidia',
            usage: 'gaming'
        }
    }
];

testConfigs.forEach(test => {
    console.log(`\n🧪 ${test.name}:`);
    console.log(`要求メモリ: ${test.config.ram}, 予算: ¥${test.config.budget}`);
    
    try {
        const result = sandbox.getRecommendations(test.config);
        
        console.log(`\n✅ 推奨結果:`);
        console.log(`CPU: ${result.recommendations.cpu.name}`);
        console.log(`メモリ: ${result.recommendations.memory.name}`);
        console.log(`容量: ${result.recommendations.memory.capacity}`);
        console.log(`合計価格: ¥${result.totalPrice}`);
        
        // メモリ容量が要求通りか確認
        const actualCapacity = sandbox.parseMemoryCapacity(result.recommendations.memory.capacity);
        const targetCapacity = parseInt(test.config.ram.replace('GB', ''));
        
        console.log(`\n📊 メモリ容量チェック:`);
        console.log(`要求: ${targetCapacity}GB`);
        console.log(`実際: ${actualCapacity}GB`);
        console.log(`結果: ${actualCapacity >= targetCapacity ? '✅ 要求以上' : '❌ 不足'}`);
        
    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
});