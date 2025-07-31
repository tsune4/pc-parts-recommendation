const axios = require('axios');
const cheerio = require('cheerio');

async function testScraping() {
    console.log('Testing scraping from kakaku.com...');
    
    try {
        const url = 'https://kakaku.com/pc/cpu/';
        console.log(`Fetching: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            },
            timeout: 15000
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers['content-type']);
        console.log(`Response length: ${response.data.length} chars`);
        
        const $ = cheerio.load(response.data);
        
        // ページタイトルを確認
        const title = $('title').text();
        console.log(`Page title: ${title}`);
        
        // 基本的な構造を確認
        console.log(`\nChecking page structure:`);
        console.log(`Body elements: ${$('body').length}`);
        console.log(`Div elements: ${$('div').length}`);
        console.log(`Link elements: ${$('a').length}`);
        
        // 商品リストを探す
        const selectors = [
            '.ranking-list .item',
            '.p-listTable_row',
            '.item-ranking .item',
            '.productitem',
            '.searchresultitem',
            '.item',
            '[class*="product"]',
            '[class*="ranking"]'
        ];
        
        console.log(`\nTrying different selectors:`);
        for (const selector of selectors) {
            const elements = $(selector);
            console.log(`${selector}: ${elements.length} elements`);
            
            if (elements.length > 0 && elements.length < 100) {
                console.log(`  First element HTML (first 200 chars):`);
                console.log(`  ${$(elements[0]).html().substring(0, 200)}...`);
            }
        }
        
        // テキスト内容の一部を確認
        console.log(`\nPage text preview (first 500 chars):`);
        console.log($('body').text().substring(0, 500));
        
    } catch (error) {
        console.error('Error during scraping test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

testScraping();