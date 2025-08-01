// Test OS budget fix - ensure total price doesn't exceed budget when OS is included
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== OS予算修正テスト ===\n');

const testCases = [
    {
        name: '低予算テスト (¥100,000)',
        budget: 100000,
        expectedWithoutOS: 100000,
        expectedWithOS: 100000  // OS込みでも予算以内
    },
    {
        name: '中予算テスト (¥200,000)',
        budget: 200000,
        expectedWithoutOS: 200000,
        expectedWithOS: 200000  // OS込みでも予算以内
    },
    {
        name: '極小予算テスト (¥20,000)',  // OS価格を超える予算
        budget: 20000,
        expectedWithoutOS: 20000,
        expectedWithOS: 20000  // OS込みでも予算以内
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
        console.log(`予算超過: ${resultWithoutOS.totalPrice > testCase.budget ? '❌' : '✅'}`);
        
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
        console.log(`予算超過: ${resultWithOS.totalPrice > testCase.budget ? '❌' : '✅'}`);
        
        if (resultWithOS.recommendations.os) {
            console.log(`OS: ${resultWithOS.recommendations.os.name} (¥${resultWithOS.recommendations.os.price.toLocaleString()})`);
        }
        
        // 重要: 予算を超えていないかチェック
        if (resultWithOS.totalPrice > testCase.budget) {
            console.log(`\n🚨 予算超過検出！`);
            console.log(`設定予算: ¥${testCase.budget.toLocaleString()}`);
            console.log(`実際価格: ¥${resultWithOS.totalPrice.toLocaleString()}`);
            console.log(`超過額: ¥${(resultWithOS.totalPrice - testCase.budget).toLocaleString()}`);
        } else {
            console.log(`\n✅ 予算遵守: 残り¥${(testCase.budget - resultWithOS.totalPrice).toLocaleString()}`);
        }
        
    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
        if (error.message.includes('OS価格が予算を超過')) {
            console.log('✅ 適切にエラーハンドリングされています');
        }
    }
    
    console.log('\n' + '='.repeat(60));
});

// OS価格が予算を超える場合のテスト
console.log('\n🧪 OS価格が予算を超える場合のテスト:');
console.log('設定予算: ¥10,000 (OS: ¥15,000)');

try {
    const result = sandbox.getRecommendations({
        budget: 10000,  // OS価格(¥15,000)より低い
        ram: '16GB',
        storage: { capacity: '1TB' },
        cpuBrand: 'amd',
        gpuBrand: 'nvidia',
        usage: 'gaming',
        includeOS: true
    });
    
    console.log('❌ エラーが発生するべきでした');
    
} catch (error) {
    console.log(`✅ 期待通りエラー: ${error.message}`);
}