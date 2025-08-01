// Check minimum price parts to understand budget constraints
const fs = require('fs');

const partsData = JSON.parse(fs.readFileSync('./data/parts-data.json', 'utf8'));

console.log('=== 最小価格パーツ分析 ===\n');

let totalMinimum = 0;

Object.entries(partsData).forEach(([category, parts]) => {
    if (category === 'lastUpdated' || category === 'os') return;
    
    if (Array.isArray(parts) && parts.length > 0) {
        const cheapest = parts.sort((a, b) => a.price - b.price)[0];
        console.log(`${category}: ${cheapest.name} - ¥${cheapest.price.toLocaleString()}`);
        totalMinimum += cheapest.price;
    }
});

console.log(`\n最小構成合計: ¥${totalMinimum.toLocaleString()}`);
console.log(`OS込み最小構成: ¥${(totalMinimum + 15000).toLocaleString()}`);

console.log('\n💡 結論:');
console.log(`- OS無し最小予算: ¥${totalMinimum.toLocaleString()}`);
console.log(`- OS有り最小予算: ¥${(totalMinimum + 15000).toLocaleString()}`);
console.log(`- ¥100,000で足りない理由: 最小構成でも¥${totalMinimum.toLocaleString()}必要`);

// パーツカテゴリ別の価格分布
console.log('\n📊 パーツカテゴリ別価格分布:');
Object.entries(partsData).forEach(([category, parts]) => {
    if (category === 'lastUpdated' || category === 'os') return;
    
    if (Array.isArray(parts) && parts.length > 0) {
        const prices = parts.map(p => p.price).sort((a, b) => a - b);
        const min = prices[0];
        const max = prices[prices.length - 1];
        const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
        
        console.log(`${category}: ¥${min.toLocaleString()} ~ ¥${max.toLocaleString()} (平均: ¥${avg.toLocaleString()}, ${parts.length}個)`);
    }
});