import * as fs from 'fs';
import * as path from 'path';

async function verifyAllConfigFiles() {
  console.log('🔍 Verifying all configuration files for correct contract address...');
  
  const correctAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
  const incorrectAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
  
  const filesToCheck = [
    '.env.local',
    '.env.zeta', 
    'frontend/.env',
    'frontend/.env.local',
    'frontend/src/config/contracts.ts',
    'frontend/src/contracts/addresses.ts'
  ];
  
  let allCorrect = true;
  
  for (const filePath of filesToCheck) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes(incorrectAddress)) {
      console.log(`❌ ${filePath} still contains incorrect address: ${incorrectAddress}`);
      allCorrect = false;
    } else if (content.includes(correctAddress)) {
      console.log(`✅ ${filePath} contains correct address: ${correctAddress}`);
    } else {
      console.log(`ℹ️  ${filePath} does not contain Universal Reward address`);
    }
  }
  
  console.log('\n📋 Summary:');
  if (allCorrect) {
    console.log('✅ All configuration files have been updated with the correct address!');
    console.log(`✅ Correct address: ${correctAddress}`);
    console.log('🎉 The frontend should now use the correct contract address.');
  } else {
    console.log('❌ Some files still contain the incorrect address.');
    console.log('Please check the files marked with ❌ above.');
  }
  
  return allCorrect;
}

// Run the verification
verifyAllConfigFiles().catch(console.error);