// Test OS feature implementation
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== OS機能テスト ===\n');

// OS含まないテスト
console.log('📊 OS含まないテスト:');
const testWithoutOS = {
    budget: 200000,
    ram: '16GB',
    storage: { capacity: '1TB' },
    cpuBrand: 'amd',
    gpuBrand: 'nvidia',
    usage: 'gaming',
    includeOS: false
};

try {
    const resultWithoutOS = sandbox.getRecommendations(testWithoutOS);
    console.log(`合計価格: ¥${resultWithoutOS.totalPrice.toLocaleString()}`);
    console.log(`OS含まれている: ${resultWithoutOS.recommendations.os ? 'はい' : 'いいえ'}`);
    console.log(`パーツ数: ${Object.keys(resultWithoutOS.recommendations).length}`);
} catch (error) {
    console.error(`エラー: ${error.message}`);
}

console.log('\n' + '='.repeat(50) + '\n');

// OS含むテスト
console.log('📊 OS含むテスト:');
const testWithOS = {
    budget: 200000,
    ram: '16GB',
    storage: { capacity: '1TB' },
    cpuBrand: 'amd',
    gpuBrand: 'nvidia',
    usage: 'gaming',
    includeOS: true
};

try {
    const resultWithOS = sandbox.getRecommendations(testWithOS);
    console.log(`合計価格: ¥${resultWithOS.totalPrice.toLocaleString()}`);
    console.log(`OS含まれている: ${resultWithOS.recommendations.os ? 'はい' : 'いいえ'}`);
    if (resultWithOS.recommendations.os) {
        console.log(`OS: ${resultWithOS.recommendations.os.name} (¥${resultWithOS.recommendations.os.price.toLocaleString()})`);
    }
    console.log(`パーツ数: ${Object.keys(resultWithOS.recommendations).length}`);
    
    // 価格差を計算
    const priceDifference = resultWithOS.totalPrice - (resultWithoutOS?.totalPrice || 0);
    console.log(`価格差: ¥${priceDifference.toLocaleString()}`);
    
    // パーツリストを表示（OSが最初にあるか確認）
    console.log('\n🔍 パーツリスト（表示順序確認）:');
    const entries = Object.entries(resultWithOS.recommendations);
    entries.forEach(([category, part], index) => {
        if (part) {
            console.log(`${index + 1}. ${category}: ${part.name} (¥${part.price.toLocaleString()})`);
        }
    });
    
} catch (error) {
    console.error(`エラー: ${error.message}`);
    console.error(error.stack);
}

// OSデータの確認
console.log('\n📋 利用可能なOSデータ:');
if (PARTS_DATA.os && PARTS_DATA.os.length > 0) {
    PARTS_DATA.os.forEach((os, index) => {
        console.log(`${index + 1}. ${os.name} - ¥${os.price.toLocaleString()}`);
        console.log(`   タイプ: ${os.type}`);
        console.log(`   説明: ${os.description || '(空欄)'}`);
    });
} else {
    console.log('❌ OSデータが見つかりません');
}