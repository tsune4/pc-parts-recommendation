// Add premium PC case to parts data
const fs = require('fs');

console.log('プレミアムPCケースを追加中...');

// JSONファイルを読み込み
const jsonData = JSON.parse(fs.readFileSync('./data/parts-data.json', 'utf8'));

// 高価なケースが既に存在するかチェック
const premiumCaseExists = jsonData.case.find(pc => pc.name === 'Y70 Touch Infinite');

if (!premiumCaseExists) {
    // プレミアムケースを追加
    const premiumCase = {
        "name": "Y70 Touch Infinite",
        "price": 68500,
        "formFactor": "ATX/MicroATX/Extended ATX/Mini-ITX",
        "size": "Mid Tower"
    };
    
    jsonData.case.push(premiumCase);
    
    // JSONファイルを更新
    fs.writeFileSync('./data/parts-data.json', JSON.stringify(jsonData, null, 4), 'utf8');
    
    console.log('✅ プレミアムケース "Y70 Touch Infinite" を追加しました');
    console.log(`💰 価格: ¥${premiumCase.price.toLocaleString()}`);
} else {
    console.log('⚠️ プレミアムケースは既に存在します');
}

console.log(`\n📊 現在のケース数: ${jsonData.case.length} 個`);
jsonData.case.forEach((pc, index) => {
    console.log(`${index + 1}. ${pc.name} - ¥${pc.price.toLocaleString()}`);
});