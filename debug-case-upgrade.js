// Debug case upgrade logic
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== PCケースアップグレードデバッグ ===\n');

console.log('📊 利用可能なPCケース:');
PARTS_DATA.case.forEach((pcCase, index) => {
    console.log(`${index + 1}. ${pcCase.name}`);
    console.log(`   価格: ¥${pcCase.price.toLocaleString()}`);
    console.log(`   対応フォームファクター: ${pcCase.formFactor}`);
    console.log('');
});

console.log('🔍 アップグレード機能テスト:');

// 現在のケース（最安価）
const currentCase = PARTS_DATA.case.sort((a, b) => a.price - b.price)[0];
console.log(`現在のケース: ${currentCase.name} (¥${currentCase.price.toLocaleString()})`);

// マザーボードフォームファクター（一般的なATX）
const motherboardFormFactor = 'MicroATX';
const budget = 100000; // 十分な予算

console.log(`マザーボードフォームファクター: ${motherboardFormFactor}`);
console.log(`アップグレード予算: ¥${budget.toLocaleString()}\n`);

// アップグレード関数をテスト
const upgrade = sandbox.upgradeCase(currentCase, PARTS_DATA.case, motherboardFormFactor, budget);

if (upgrade) {
    console.log(`✅ アップグレード結果: ${upgrade.name} (¥${upgrade.price.toLocaleString()})`);
    console.log(`アップグレード費用: ¥${upgrade.price - currentCase.price}`);
} else {
    console.log('❌ アップグレードが見つかりませんでした');
    
    // 詳細なデバッグ
    console.log('\n🔍 詳細デバッグ:');
    console.log('互換性チェック:');
    const compatibleCases = PARTS_DATA.case.filter(pcCase => {
        const isCompatible = pcCase.formFactor.includes(motherboardFormFactor);
        console.log(`  - ${pcCase.name}: ${isCompatible ? '✅' : '❌'} (${pcCase.formFactor})`);
        return isCompatible;
    });
    
    console.log('\n価格フィルター:');
    const betterCases = compatibleCases.filter(pcCase => {
        const isBetter = pcCase.price > currentCase.price;
        const withinBudget = pcCase.price <= currentCase.price + budget;
        console.log(`  - ${pcCase.name}: 高価格=${isBetter}, 予算内=${withinBudget} (¥${pcCase.price.toLocaleString()})`);
        return isBetter && withinBudget;
    });
    
    console.log(`\n最終候補数: ${betterCases.length}`);
}