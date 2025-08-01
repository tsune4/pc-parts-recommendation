// Debug memory selection logic
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== メモリ選択デバッグ ===\n');

// メモリデータの解析
console.log('📊 利用可能なメモリ:');
PARTS_DATA.memory.forEach((mem, index) => {
    const capacity = mem.capacity;
    const capacityNum = parseInt(capacity.replace(/[^\d]/g, ''));
    console.log(`${index + 1}. ${mem.name}`);
    console.log(`   容量: "${capacity}" → 解析値: ${capacityNum}GB`);
    console.log(`   タイプ: ${mem.type}, 価格: ¥${mem.price}`);
    console.log('');
});

// 32GB選択のテスト
console.log('🔍 32GB選択テスト (AM5 CPU使用):');
const testConfigurations = [
    { ram: '16GB', socket: 'Socket AM5', budget: 50000 },
    { ram: '32GB', socket: 'Socket AM5', budget: 50000 }
];

testConfigurations.forEach(config => {
    console.log(`\n--- ${config.ram} 選択テスト (予算: ¥${config.budget}) ---`);
    
    const compatibleMemoryType = sandbox.getCompatibleMemoryType(config.socket);
    const targetCapacityNum = parseInt(config.ram.replace('GB', ''));
    
    console.log(`ターゲット容量: ${config.ram} → ${targetCapacityNum}GB`);
    console.log(`CPUソケット: ${config.socket} → 互換メモリタイプ: ${compatibleMemoryType}`);
    
    // 互換メモリフィルタリング
    const compatibleMemories = PARTS_DATA.memory.filter(mem => mem.type.includes(compatibleMemoryType));
    console.log(`互換メモリ数: ${compatibleMemories.length} 個`);
    
    // 条件に合うメモリフィルタリング
    const suitable = compatibleMemories.filter(mem => {
        const memCapacity = parseInt(mem.capacity.replace(/[^\d]/g, ''));
        const meetsCapacity = memCapacity >= targetCapacityNum;
        const withinBudget = mem.price <= config.budget;
        
        console.log(`  - ${mem.name}: ${memCapacity}GB (容量OK: ${meetsCapacity}, 予算OK: ${withinBudget})`);
        
        return meetsCapacity && withinBudget;
    });
    
    console.log(`適合メモリ数: ${suitable.length} 個`);
    
    if (suitable.length > 0) {
        const selected = suitable.sort((a, b) => b.price - a.price)[0];
        console.log(`✅ 選択結果: ${selected.name} (${selected.capacity})`);
    } else {
        console.log('❌ 適合するメモリが見つかりません');
        
        // フォールバック処理
        const closestCapacity = compatibleMemories.filter(mem => {
            const memCapacity = parseInt(mem.capacity.replace(/[^\d]/g, ''));
            return memCapacity >= targetCapacityNum;
        });
        
        if (closestCapacity.length > 0) {
            const fallback = closestCapacity.sort((a, b) => a.price - b.price)[0];
            console.log(`🔧 フォールバック: ${fallback.name} (${fallback.capacity})`);
        }
    }
});

// 実際の関数呼び出しテスト
console.log('\n🚀 実際の関数テスト:');
const result16 = sandbox.selectMemory(PARTS_DATA.memory, '16GB', 50000, 'Socket AM5');
const result32 = sandbox.selectMemory(PARTS_DATA.memory, '32GB', 50000, 'Socket AM5');

console.log(`16GB選択: ${result16?.name} (${result16?.capacity})`);
console.log(`32GB選択: ${result32?.name} (${result32?.capacity})`);