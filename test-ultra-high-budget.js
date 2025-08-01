// Test ultra-high budget (¥1,000,000) to see if premium case is selected
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== 超高予算テスト (¥1,000,000) ===\n');

const testConfig = {
    budget: 1000000,
    ram: '32GB',
    storage: { capacity: '2TB' },
    cpuBrand: 'any',
    gpuBrand: 'any',
    usage: 'creative'
};

console.log(`予算: ¥${testConfig.budget.toLocaleString()}`);

try {
    const result = sandbox.getRecommendations(testConfig);
    
    console.log(`\n✅ 最終推奨結果 (¥${result.totalPrice.toLocaleString()}):`);
    console.log(`CPU: ${result.recommendations.cpu.name} (¥${result.recommendations.cpu.price.toLocaleString()})`);
    console.log(`GPU: ${result.recommendations.gpu.name} (¥${result.recommendations.gpu.price.toLocaleString()})`);
    console.log(`Motherboard: ${result.recommendations.motherboard.name} (¥${result.recommendations.motherboard.price.toLocaleString()})`);
    console.log(`Memory: ${result.recommendations.memory.name} (¥${result.recommendations.memory.price.toLocaleString()})`);
    console.log(`Storage: ${result.recommendations.storage.name} (¥${result.recommendations.storage.price.toLocaleString()})`);
    console.log(`Cooler: ${result.recommendations.cooler.name} (¥${result.recommendations.cooler.price.toLocaleString()})`);
    console.log(`PSU: ${result.recommendations.psu.name} (¥${result.recommendations.psu.price.toLocaleString()})`);
    console.log(`Case: ${result.recommendations.case.name} (¥${result.recommendations.case.price.toLocaleString()})`);
    
    const remainingBudget = testConfig.budget - result.totalPrice;
    console.log(`\n💰 残り予算: ¥${remainingBudget.toLocaleString()}`);
    
    // ケースの品質チェック
    console.log('\n🔍 ケース品質チェック:');
    const casePrice = result.recommendations.case.price;
    if (casePrice >= 50000) {
        console.log(`✅ 超プレミアム (¥${casePrice.toLocaleString()})`);
    } else if (casePrice >= 20000) {
        console.log(`✅ プレミアム (¥${casePrice.toLocaleString()})`);
    } else if (casePrice >= 10000) {
        console.log(`⚠️ 中級品 (¥${casePrice.toLocaleString()})`);
    } else {
        console.log(`❌ 低価格品 (¥${casePrice.toLocaleString()}) - 予算¥${testConfig.budget.toLocaleString()}に対して不適切`);
    }
    
    // 利用可能な最高級ケースを表示
    const premiumCase = PARTS_DATA.case.find(c => c.name === 'Y70 Touch Infinite');
    if (premiumCase && result.recommendations.case.name !== premiumCase.name) {
        console.log(`\n⚠️ 利用可能な最高級ケース: ${premiumCase.name} (¥${premiumCase.price.toLocaleString()})`);
        console.log(`十分な予算があるにも関わらず選択されていません！`);
    }
    
} catch (error) {
    console.error(`❌ エラー: ${error.message}`);
    console.error(error.stack);
}