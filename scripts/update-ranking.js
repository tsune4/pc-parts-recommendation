#!/usr/bin/env node

const rankingManager = require('../api/ranking-manager');
const fs = require('fs').promises;
const path = require('path');

// 使用例を表示
function showUsage() {
    console.log(`
PC部品ランキングデータ更新ツール

使用方法:
  node scripts/update-ranking.js [command] [options]

コマンド:
  show-stats              現在のデータ統計を表示
  show-category <category> カテゴリの商品を表示
  update-from-file <file>  JSONファイルからデータを更新
  create-template <file>   テンプレートファイルを作成

例:
  node scripts/update-ranking.js show-stats
  node scripts/update-ranking.js show-category cpu
  node scripts/update-ranking.js create-template template.json
  node scripts/update-ranking.js update-from-file new-data.json
`);
}

async function showStats() {
    try {
        await rankingManager.getRankingData();
        const stats = rankingManager.getDataStats();
        
        console.log('\n=== ランキングデータ統計 ===');
        console.log(`最終更新: ${stats.lastUpdated}`);
        console.log(`総商品数: ${stats.totalItems}`);
        console.log('\nカテゴリ別詳細:');
        
        Object.keys(stats.categories).forEach(category => {
            const cat = stats.categories[category];
            console.log(`  ${cat.displayName} (${category}): ${cat.itemCount}商品`);
            console.log(`    価格帯: ¥${cat.priceRange.min.toLocaleString()} - ¥${cat.priceRange.max.toLocaleString()}`);
        });
    } catch (error) {
        console.error('統計の取得に失敗:', error.message);
    }
}

async function showCategory(category) {
    try {
        await rankingManager.getRankingData();
        const items = rankingManager.getCategoryItems(category);
        
        if (items.length === 0) {
            console.log(`カテゴリ "${category}" にはデータがありません`);
            return;
        }

        console.log(`\n=== ${category}カテゴリの商品 ===`);
        items.forEach(item => {
            console.log(`${item.rank}位: ${item.name}`);
            console.log(`  価格: ¥${item.price.toLocaleString()}`);
            console.log(`  人気度: ${item.popularity} | コスパ: ${item.pricePerformance}`);
            console.log(`  URL: ${item.kakakuUrl}`);
            console.log('');
        });
    } catch (error) {
        console.error('カテゴリデータの取得に失敗:', error.message);
    }
}

async function createTemplate(filename) {
    const template = {
        "lastUpdated": "YYYY-MM-DD",
        "categories": {
            "cpu": {
                "displayName": "CPU",
                "items": [
                    {
                        "rank": 1,
                        "name": "商品名",
                        "price": 30000,
                        "priceRange": "28000-32000",
                        "specifications": {
                            "cores": "6コア",
                            "threads": "12スレッド",
                            "baseClock": "3.5GHz",
                            "boostClock": "4.2GHz",
                            "socket": "LGA1700",
                            "tdp": "65W"
                        },
                        "kakakuUrl": "https://kakaku.com/item/K0001234567/",
                        "popularity": "高",
                        "pricePerformance": "優秀"
                    }
                ]
            }
        }
    };

    try {
        await fs.writeFile(filename, JSON.stringify(template, null, 2), 'utf8');
        console.log(`テンプレートファイルを作成しました: ${filename}`);
        console.log('このファイルを編集してから update-from-file コマンドで更新してください');
    } catch (error) {
        console.error('テンプレートファイルの作成に失敗:', error.message);
    }
}

async function updateFromFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        const newData = JSON.parse(data);
        
        await rankingManager.updateRankingData(newData);
        console.log(`ランキングデータを更新しました: ${filename}`);
        
        // 更新後の統計を表示
        await showStats();
    } catch (error) {
        console.error('データの更新に失敗:', error.message);
    }
}

// メイン処理
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showUsage();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'show-stats':
            await showStats();
            break;
        case 'show-category':
            if (!args[1]) {
                console.error('カテゴリ名を指定してください');
                return;
            }
            await showCategory(args[1]);
            break;
        case 'create-template':
            if (!args[1]) {
                console.error('ファイル名を指定してください');
                return;
            }
            await createTemplate(args[1]);
            break;
        case 'update-from-file':
            if (!args[1]) {
                console.error('ファイル名を指定してください');
                return;
            }
            await updateFromFile(args[1]);
            break;
        default:
            console.error(`不明なコマンド: ${command}`);
            showUsage();
    }
}

main().catch(console.error);