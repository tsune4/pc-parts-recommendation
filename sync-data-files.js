// Script to sync JSON data to JavaScript data file
const fs = require('fs');

console.log('🔄 JSONデータをJavaScriptファイルに同期中...\n');

// JSON データを読み込み
const jsonData = JSON.parse(fs.readFileSync('./data/parts-data.json', 'utf8'));

// JavaScript ファイル用のデータを生成
const jsContent = `// PC Parts Data for GitHub Pages Static Site
const PARTS_DATA = ${JSON.stringify(jsonData, null, 2)};
`;

// parts-data.js ファイルを更新
fs.writeFileSync('./docs/parts-data.js', jsContent, 'utf8');

console.log('✅ parts-data.js を更新しました');
console.log(`📊 データ項目数:`);
console.log(`  - CPU: ${jsonData.cpu.length} 個`);
console.log(`  - Motherboard: ${jsonData.motherboard.length} 個`);
console.log(`  - AM5 Motherboards: ${jsonData.motherboard.filter(mb => mb.socket === 'Socket AM5').length} 個`);
console.log(`  - Memory: ${jsonData.memory.length} 個`);
console.log(`  - Storage: ${jsonData.storage.length} 個`);
console.log(`  - GPU: ${jsonData.gpu.length} 個`);
console.log(`  - PSU: ${jsonData.psu.length} 個`);
console.log(`  - Case: ${jsonData.case.length} 個`);
console.log(`  - Cooler: ${jsonData.cooler.length} 個`);

console.log('\n🔧 ブラウザキャッシュをクリアしてください！');