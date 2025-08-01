// Debug script to compare JSON and JS data files
const fs = require('fs');

console.log('=== データファイル整合性チェック ===\n');

// JSON データを読み込み
const jsonData = JSON.parse(fs.readFileSync('./data/parts-data.json', 'utf8'));

// JS データファイルを読み込み（PARTS_DATA部分を抽出）
const jsContent = fs.readFileSync('./docs/parts-data.js', 'utf8');
const jsDataMatch = jsContent.match(/const PARTS_DATA = ({[\s\S]*?});/);

if (!jsDataMatch) {
    console.error('❌ JS ファイルからPARTS_DATAを抽出できませんでした');
    process.exit(1);
}

let jsData;
try {
    // eval() を安全に使用（このコンテキストでは問題なし） 
    jsData = eval(`(${jsDataMatch[1]})`);
} catch (error) {
    console.error('❌ JS データの解析エラー:', error.message);
    process.exit(1);
}

// AMD CPUの検索
console.log('🔍 AMD Ryzen 5 9600X BOX の検索結果:');
const jsonCpu = jsonData.cpu.find(cpu => cpu.name === 'AMD Ryzen 5 9600X BOX');
const jsCpu = jsData.cpu.find(cpu => cpu.name === 'AMD Ryzen 5 9600X BOX');

console.log('\nJSON ファイル:');
if (jsonCpu) {
    console.log(`  名前: ${jsonCpu.name}`);
    console.log(`  ソケット: "${jsonCpu.socket}"`);
    console.log(`  価格: ¥${jsonCpu.price}`);
} else {
    console.log('  ❌ 見つかりませんでした');
}

console.log('\nJS ファイル:');
if (jsCpu) {
    console.log(`  名前: ${jsCpu.name}`);
    console.log(`  ソケット: "${jsCpu.socket}"`);
    console.log(`  価格: ¥${jsCpu.price}`);
} else {
    console.log('  ❌ 見つかりませんでした');
}

// ソケット互換性チェック
console.log('\n🔍 AM5 マザーボードの検索結果:');
const jsonAM5Motherboards = jsonData.motherboard.filter(mb => mb.socket === 'Socket AM5');
const jsAM5Motherboards = jsData.motherboard.filter(mb => mb.socket === 'Socket AM5');

console.log(`\nJSON ファイル: ${jsonAM5Motherboards.length} 個のAM5マザーボード`);
jsonAM5Motherboards.slice(0, 3).forEach(mb => {
    console.log(`  - ${mb.name} (${mb.socket})`);
});

console.log(`\nJS ファイル: ${jsAM5Motherboards.length} 個のAM5マザーボード`);
jsAM5Motherboards.slice(0, 3).forEach(mb => {
    console.log(`  - ${mb.name} (${mb.socket})`);
});

// データ整合性の確認
const dataMatches = JSON.stringify(jsonData) === JSON.stringify(jsData);
console.log(`\n📊 データ整合性: ${dataMatches ? '✅ 完全一致' : '❌ 不一致'}`);

if (!dataMatches) {
    console.log('\n⚠️ JSON と JS ファイルのデータが一致しません！');
    console.log('JS ファイルを JSON データで更新する必要があります。');
}