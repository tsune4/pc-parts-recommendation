const fs = require('fs');
const vm = require('vm');

const partsDataContent = fs.readFileSync('./data/parts-data.json', 'utf8');
const PARTS_DATA = JSON.parse(partsDataContent);
const recommenderContent = fs.readFileSync('./docs/pc-recommender.js', 'utf8');

const sandbox = { PARTS_DATA, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(recommenderContent, sandbox);

// Test the exact case from the user's report
console.log('=== Testing Socket Compatibility Fix ===');
const problematicConfig = {
  budget: 150000,
  ram: '16GB',
  storage: { capacity: '1TB' },
  cpuBrand: 'amd',
  gpuBrand: 'nvidia',
  usage: 'gaming'
};

console.log('Testing with configuration that caused AM5 + B760M-E issue...\n');

try {
  const result = sandbox.getRecommendations(problematicConfig);
  
  console.log('\n=== FINAL RESULT ANALYSIS ===');
  console.log(`CPU: ${result.recommendations.cpu.name}`);
  console.log(`CPU Socket: "${result.recommendations.cpu.socket}"`);
  console.log(`Motherboard: ${result.recommendations.motherboard.name}`);
  console.log(`MB Socket: "${result.recommendations.motherboard.socket}"`);
  
  const socketsMatch = result.recommendations.cpu.socket === result.recommendations.motherboard.socket;
  console.log(`\nSocket Compatibility: ${socketsMatch ? '✅ CORRECT' : '❌ MISMATCH!'}`);
  
  if (!socketsMatch) {
    console.log('\n🚨 CRITICAL ERROR: Socket mismatch still detected!');
    console.log('This configuration would not work in real hardware!');
  } else {
    console.log('\n✅ SUCCESS: Socket compatibility is correct');
  }
  
  console.log(`\nTotal Price: ¥${result.totalPrice}`);
  console.log(`Within Budget: ${result.isWithinBudget}`);
  
} catch (error) {
  console.error('❌ Test failed with error:', error.message);
  console.error(error.stack);
}