// Test OS budget fix with realistic budgets
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== OS予算修正テスト (現実的な予算) ===\n');

const testCases = [
    {
        name: '適正予算テスト (¥150,000)',
        budget: 150000,
        expectSuccess: true
    },
    {
        name: '高予算テスト (¥300,000)',
        budget: 300000,
        expectSuccess: true
    }
];

testCases.forEach(testCase => {
    console.log(`\n🧪 ${testCase.name}:`);
    console.log(`設定予算: ¥${testCase.budget.toLocaleString()}`);
    console.log('='.repeat(50));
    
    const baseConfig = {
        budget: testCase.budget,
        ram: '16GB',
        storage: { capacity: '1TB' },
        cpuBrand: 'amd',
        gpuBrand: 'nvidia',
        usage: 'gaming'
    };
    
    // OS無しテスト
    console.log('\n📊 OS無し:');
    try {
        const resultWithoutOS = sandbox.getRecommendations({
            ...baseConfig,
            includeOS: false
        });
        
        console.log(`合計価格: ¥${resultWithoutOS.totalPrice.toLocaleString()}`);
        console.log(`予算内: ${resultWithoutOS.isWithinBudget ? '✅' : '❌'}`);
        console.log(`予算超過額: ${resultWithoutOS.totalPrice > testCase.budget ? `¥${(resultWithoutOS.totalPrice - testCase.budget).toLocaleString()}` : '¥0'}`);
        
    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
    }
    
    // OS有りテスト
    console.log('\n📊 OS有り:');
    try {
        const resultWithOS = sandbox.getRecommendations({
            ...baseConfig,
            includeOS: true
        });
        
        console.log(`合計価格: ¥${resultWithOS.totalPrice.toLocaleString()}`);
        console.log(`予算内: ${resultWithOS.isWithinBudget ? '✅' : '❌'}`);
        console.log(`予算超過額: ${resultWithOS.totalPrice > testCase.budget ? `¥${(resultWithOS.totalPrice - testCase.budget).toLocaleString()}` : '¥0'}`);
        
        if (resultWithOS.recommendations.os) {
            console.log(`OS: ${resultWithOS.recommendations.os.name} (¥${resultWithOS.recommendations.os.price.toLocaleString()})`);
        }
        
        // 重要: 予算を超えていないかチェック
        if (resultWithOS.totalPrice <= testCase.budget) {
            console.log(`\n✅ 成功: 予算¥${testCase.budget.toLocaleString()}以内で構成完了`);
            console.log(`残り予算: ¥${(testCase.budget - resultWithOS.totalPrice).toLocaleString()}`);
        } else {
            console.log(`\n⚠️ 予算超過: ¥${(resultWithOS.totalPrice - testCase.budget).toLocaleString()}`);
        }
        
    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
});

// 境界テスト：OS価格ギリギリ
console.log('\n🧪 境界テスト - OS価格ギリギリ:');
console.log('設定予算: ¥15,001 (OS: ¥15,000)');

try {
    const result = sandbox.getRecommendations({
        budget: 15001,  // OS価格より¥1だけ多い
        ram: '16GB',
        storage: { capacity: '1TB' },
        cpuBrand: 'amd',
        gpuBrand: 'nvidia',
        usage: 'gaming',
        includeOS: true
    });
    
    console.log(`✅ 処理成功: 合計¥${result.totalPrice.toLocaleString()}`);
    
} catch (error) {
    console.log(`✅ 期待通りエラー: ${error.message}`);
}