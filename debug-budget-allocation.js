// Debug budget allocation in high-budget scenarios
const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

console.log('=== 予算配分デバッグ ===\n');

// 超高予算テストケース
const testConfig = {
    budget: 600000,
    ram: '32GB',
    storage: { capacity: '2TB' },
    cpuBrand: 'any',
    gpuBrand: 'any',
    usage: 'creative'
};

console.log(`予算: ¥${testConfig.budget.toLocaleString()}`);
console.log('='.repeat(50));

// フェーズ1の詳細をシミュレート
console.log('\n🔍 フェーズ1: 基本構成の選択');

const selectedCPU = PARTS_DATA.cpu.find(cpu => cpu.name === 'AMD Ryzen 9 9950X3D BOX');
const selectedGPU = PARTS_DATA.gpu.find(gpu => gpu.name === 'GeForce RTX 5080');
const selectedMB = PARTS_DATA.motherboard.find(mb => mb.name === 'MSI B650M GAMING PLUS WIFI');
const selectedMemory = PARTS_DATA.memory.find(mem => mem.name === 'CFD W5U5600CS-16G [DDR5 PC5-44800 16GB 2枚組]');
const selectedStorage = PARTS_DATA.storage.find(storage => storage.name === 'SANDISK 【直販モデル】 エクストリーム SDSSDX3N-2T00-G26');
const selectedCooler = PARTS_DATA.cooler.find(cooler => cooler.name === 'DEEPCOOL AK400 R-AK400-BKNNMN-G-1');
const selectedPSU = PARTS_DATA.psu.find(psu => psu.name === 'Thermaltake TOUGHPOWER GT/0850W ATX3.1');
const selectedCase = PARTS_DATA.case.find(pc => pc.name === 'MSI MAG FORGE 130A AIRFLOW');

const phase1Total = selectedCPU.price + selectedGPU.price + selectedMB.price + 
                   selectedMemory.price + selectedStorage.price + selectedCooler.price + 
                   selectedPSU.price + selectedCase.price;

console.log(`CPU: ${selectedCPU.name} - ¥${selectedCPU.price.toLocaleString()}`);
console.log(`GPU: ${selectedGPU.name} - ¥${selectedGPU.price.toLocaleString()}`);
console.log(`MB: ${selectedMB.name} - ¥${selectedMB.price.toLocaleString()}`);
console.log(`Memory: ${selectedMemory.name} - ¥${selectedMemory.price.toLocaleString()}`);  
console.log(`Storage: ${selectedStorage.name} - ¥${selectedStorage.price.toLocaleString()}`);
console.log(`Cooler: ${selectedCooler.name} - ¥${selectedCooler.price.toLocaleString()}`);
console.log(`PSU: ${selectedPSU.name} - ¥${selectedPSU.price.toLocaleString()}`);
console.log(`Case: ${selectedCase.name} - ¥${selectedCase.price.toLocaleString()}`);

console.log(`\nフェーズ1合計: ¥${phase1Total.toLocaleString()}`);
console.log(`フェーズ2予算: ¥${(testConfig.budget - phase1Total).toLocaleString()}`);

console.log('\n🔍 フェーズ2: アップグレードシミュレーション');
let availableBudget = testConfig.budget - phase1Total;
let currentConfig = {
    cpu: selectedCPU,
    gpu: selectedGPU,    
    motherboard: selectedMB,
    memory: selectedMemory,
    storage: selectedStorage,
    cooler: selectedCooler,
    psu: selectedPSU,
    case: selectedCase
};

console.log(`開始予算: ¥${availableBudget.toLocaleString()}\n`);

// GPUアップグレード
console.log('1. GPUアップグレード:');
const gpuUpgrade = sandbox.upgradeGPU(currentConfig.gpu, PARTS_DATA.gpu, 'any', availableBudget);
if (gpuUpgrade && gpuUpgrade.price > currentConfig.gpu.price) {
    const cost = gpuUpgrade.price - currentConfig.gpu.price;
    console.log(`  ${currentConfig.gpu.name} (¥${currentConfig.gpu.price.toLocaleString()}) → ${gpuUpgrade.name} (¥${gpuUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    currentConfig.gpu = gpuUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし');
}
console.log(`  残り予算: ¥${availableBudget.toLocaleString()}\n`);

// CPUアップグレード
console.log('2. CPUアップグレード:');
const cpuUpgrade = sandbox.upgradeCPU(currentConfig.cpu, PARTS_DATA.cpu, 'any', availableBudget);
if (cpuUpgrade && cpuUpgrade.price > currentConfig.cpu.price) {
    const cost = cpuUpgrade.price - currentConfig.cpu.price;
    console.log(`  ${currentConfig.cpu.name} (¥${currentConfig.cpu.price.toLocaleString()}) → ${cpuUpgrade.name} (¥${cpuUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    currentConfig.cpu = cpuUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし');
}
console.log(`  残り予算: ¥${availableBudget.toLocaleString()}\n`);

// マザーボードアップグレード
console.log('3. マザーボードアップグレード:');
const mbUpgrade = sandbox.upgradeMotherboard(currentConfig.motherboard, PARTS_DATA.motherboard, currentConfig.cpu.socket, availableBudget);
if (mbUpgrade && mbUpgrade.price > currentConfig.motherboard.price) {
    const cost = mbUpgrade.price - currentConfig.motherboard.price;
    console.log(`  ${currentConfig.motherboard.name} (¥${currentConfig.motherboard.price.toLocaleString()}) → ${mbUpgrade.name} (¥${mbUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    currentConfig.motherboard = mbUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし');
}
console.log(`  残り予算: ¥${availableBudget.toLocaleString()}\n`);

// クーラーアップグレード
console.log('4. クーラーアップグレード:');
const coolerUpgrade = sandbox.upgradeCooler(currentConfig.cooler, PARTS_DATA.cooler, availableBudget);
if (coolerUpgrade && coolerUpgrade.price > currentConfig.cooler.price) {
    const cost = coolerUpgrade.price - currentConfig.cooler.price;
    console.log(`  ${currentConfig.cooler.name} (¥${currentConfig.cooler.price.toLocaleString()}) → ${coolerUpgrade.name} (¥${coolerUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    currentConfig.cooler = coolerUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし');
}
console.log(`  残り予算: ¥${availableBudget.toLocaleString()}\n`);

// PSUアップグレード
console.log('5. PSUアップグレード:');
const psuUpgrade = sandbox.upgradePSU(currentConfig.psu, PARTS_DATA.psu, currentConfig.cpu, currentConfig.gpu, availableBudget);
if (psuUpgrade && psuUpgrade.price > currentConfig.psu.price) {
    const cost = psuUpgrade.price - currentConfig.psu.price;
    console.log(`  ${currentConfig.psu.name} (¥${currentConfig.psu.price.toLocaleString()}) → ${psuUpgrade.name} (¥${psuUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    currentConfig.psu = psuUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし');
}
console.log(`  残り予算: ¥${availableBudget.toLocaleString()}\n`);

// ケースアップグレード
console.log('6. ケースアップグレード:');
const caseUpgrade = sandbox.upgradeCase(currentConfig.case, PARTS_DATA.case, currentConfig.motherboard.formFactor, availableBudget);
if (caseUpgrade && caseUpgrade.price > currentConfig.case.price) {
    const cost = caseUpgrade.price - currentConfig.case.price;
    console.log(`  ${currentConfig.case.name} (¥${currentConfig.case.price.toLocaleString()}) → ${caseUpgrade.name} (¥${caseUpgrade.price.toLocaleString()})`);
    console.log(`  アップグレード費用: ¥${cost.toLocaleString()}`);
    console.log(`  ✅ ケースアップグレード成功！`);
    currentConfig.case = caseUpgrade;
    availableBudget -= cost;
} else {
    console.log('  アップグレードなし - 予算不足');
    console.log(`  必要予算: ¥${PARTS_DATA.case.find(c => c.name === 'Y70 Touch Infinite').price - currentConfig.case.price}`);
}
console.log(`  最終残り予算: ¥${availableBudget.toLocaleString()}`);

const finalTotal = Object.values(currentConfig).reduce((sum, part) => sum + part.price, 0);
console.log(`\n📊 最終合計: ¥${finalTotal.toLocaleString()}`);
console.log(`予算効率: ${((finalTotal / testConfig.budget) * 100).toFixed(1)}%`);