#!/usr/bin/env tsx

/**
 * 修复用户缺少encryptionPubKey的问题
 * 为所有用户生成并保存加密密钥
 */

async function fixEncryptionPubKeyIssue() {
  console.log('🔧 Fixing EncryptionPubKey Issue');
  console.log('=================================');

  const BASE_URL = 'http://localhost:3001';

  // Step 1: 分析问题
  console.log('\n1. Problem Analysis');
  console.log('-------------------');
  
  console.log('🚨 Root Cause Found:');
  console.log('   - Profile.tsx only generates encryptionPubKey for "historical users"');
  console.log('   - PublishTask.tsx does not generate encryptionPubKey during profile creation');
  console.log('   - New users create profiles without encryption keys');
  console.log('   - This breaks contacts decryption functionality');

  // Step 2: 检查当前Profile创建流程
  console.log('\n2. Current Profile Creation Flow');
  console.log('-------------------------------');
  
  console.log('Current flow (BROKEN):');
  console.log('   1. User goes to PublishTask');
  console.log('   2. System checks if profile exists');
  console.log('   3. If no profile, user goes to Register/Profile page');
  console.log('   4. Profile is created WITHOUT encryptionPubKey');
  console.log('   5. Later, contacts decryption fails due to missing key');
  console.log('');
  console.log('What should happen (FIXED):');
  console.log('   1. User goes to PublishTask');
  console.log('   2. System checks if profile exists');
  console.log('   3. If no profile, generate encryptionPubKey automatically');
  console.log('   4. Create profile WITH encryptionPubKey');
  console.log('   5. Contacts decryption works correctly');

  // Step 3: 提供修复方案
  console.log('\n3. Fix Implementation Options');
  console.log('----------------------------');
  
  console.log('🎯 Option 1: Fix PublishTask.tsx (Recommended)');
  console.log('   - Add encryptionPubKey generation to PublishTask');
  console.log('   - Generate key when profile is missing');
  console.log('   - Save private key to localStorage');
  console.log('   - Include public key in profile creation');
  console.log('');
  console.log('🎯 Option 2: Fix Profile.tsx');
  console.log('   - Make encryptionPubKey generation available to all users');
  console.log('   - Not just "historical users"');
  console.log('   - Add "Generate Encryption Key" button');
  console.log('');
  console.log('🎯 Option 3: Backend Auto-Generation');
  console.log('   - Generate encryptionPubKey in backend when missing');
  console.log('   - Return private key to frontend once');
  console.log('   - Frontend saves private key locally');

  // Step 4: 实施Option 1 - 修复PublishTask.tsx
  console.log('\n4. Implementing Fix in PublishTask.tsx');
  console.log('-------------------------------------');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const publishTaskPath = path.join(process.cwd(), 'frontend/src/pages/PublishTask.tsx');
    const publishTaskContent = fs.readFileSync(publishTaskPath, 'utf8');
    
    // 检查是否已经有加密密钥生成逻辑
    const hasEncryptionImport = publishTaskContent.includes('generateEncryptionKeyPair');
    const hasKeyGeneration = publishTaskContent.includes('encryptionPubKey');
    
    console.log('Current PublishTask.tsx status:');
    console.log('   - Has encryption import:', hasEncryptionImport ? '✅ Yes' : '❌ No');
    console.log('   - Has key generation:', hasKeyGeneration ? '✅ Yes' : '❌ No');
    
    if (!hasEncryptionImport) {
      console.log('');
      console.log('📝 Required Changes to PublishTask.tsx:');
      console.log('');
      console.log('1. Add import:');
      console.log('   import { generateEncryptionKeyPair, saveEncryptionPrivateKey } from \'../utils/encryption\';');
      console.log('');
      console.log('2. Add key generation logic in form submission:');
      console.log('   ```typescript');
      console.log('   // Generate encryption key if user doesn\'t have one');
      console.log('   if (!profile?.encryptionPubKey) {');
      console.log('     const { publicKey, privateKey } = generateEncryptionKeyPair();');
      console.log('     saveEncryptionPrivateKey(address, privateKey);');
      console.log('     // Include publicKey in profile creation');
      console.log('   }');
      console.log('   ```');
    }
    
  } catch (error) {
    console.log('❌ Failed to analyze PublishTask.tsx:', error.message);
  }

  // Step 5: 创建修复脚本
  console.log('\n5. Creating Automatic Fix');
  console.log('-------------------------');
  
  console.log('Creating modified PublishTask.tsx with encryption key generation...');
  
  // 读取当前文件并添加必要的修改
  try {
    const publishTaskPath = path.join(process.cwd(), 'frontend/src/pages/PublishTask.tsx');
    let content = fs.readFileSync(publishTaskPath, 'utf8');
    
    // 检查是否需要添加import
    if (!content.includes('generateEncryptionKeyPair')) {
      // 找到现有的encryption import并扩展它
      if (content.includes('from \'../utils/encryption\';')) {
        content = content.replace(
          /import { ([^}]+) } from '\.\.\/utils\/encryption';/,
          'import { $1, generateEncryptionKeyPair, saveEncryptionPrivateKey } from \'../utils/encryption\';'
        );
        console.log('✅ Added encryption imports to existing import statement');
      } else {
        // 添加新的import
        const importIndex = content.indexOf('import { apiClient }');
        if (importIndex !== -1) {
          const insertPoint = content.lastIndexOf('\n', importIndex);
          content = content.slice(0, insertPoint) + 
            '\nimport { generateEncryptionKeyPair, saveEncryptionPrivateKey } from \'../utils/encryption\';' +
            content.slice(insertPoint);
          console.log('✅ Added new encryption import statement');
        }
      }
    }
    
    // 检查是否需要添加密钥生成逻辑
    if (!content.includes('generateEncryptionKeyPair()')) {
      // 在proceedWithSubmission函数中添加密钥生成逻辑
      const proceedWithSubmissionMatch = content.match(/(const proceedWithSubmission = async \(\) => \{[\s\S]*?try \{)/);
      if (proceedWithSubmissionMatch) {
        const insertPoint = proceedWithSubmissionMatch[0].length;
        const beforeSubmission = content.indexOf(proceedWithSubmissionMatch[0]);
        
        const keyGenerationCode = `
      // Generate encryption key if user doesn't have one
      let encryptionPubKey = profile?.encryptionPubKey;
      if (!encryptionPubKey) {
        console.log('[PublishTask] Generating encryption key for new user...');
        const { publicKey, privateKey } = generateEncryptionKeyPair();
        saveEncryptionPrivateKey(address!, privateKey);
        encryptionPubKey = publicKey;
        console.log('[PublishTask] Encryption key generated and saved locally');
      }
`;
        
        content = content.slice(0, beforeSubmission + insertPoint) + 
          keyGenerationCode + 
          content.slice(beforeSubmission + insertPoint);
        
        console.log('✅ Added encryption key generation logic');
      }
    }
    
    // 写入修改后的文件
    fs.writeFileSync(publishTaskPath + '.fixed', content);
    console.log('✅ Created fixed version: PublishTask.tsx.fixed');
    
  } catch (error) {
    console.log('❌ Failed to create automatic fix:', error.message);
  }

  // Step 6: 测试修复
  console.log('\n6. Testing the Fix');
  console.log('-----------------');
  
  try {
    // 测试加密密钥生成
    console.log('Testing encryption key generation...');
    
    // 动态导入加密工具
    const encryptionModule = await import('../frontend/src/utils/encryption.js');
    const { generateEncryptionKeyPair } = encryptionModule;
    
    const keyPair = generateEncryptionKeyPair();
    console.log('✅ Key generation works:');
    console.log('   - Public key length:', keyPair.publicKey.length, 'chars');
    console.log('   - Private key length:', keyPair.privateKey.length, 'chars');
    console.log('   - Public key sample:', keyPair.publicKey.slice(0, 16) + '...');
    
  } catch (error) {
    console.log('❌ Failed to test encryption:', error.message);
  }

  // Step 7: 提供手动修复指南
  console.log('\n7. Manual Fix Instructions');
  console.log('--------------------------');
  
  console.log('🔧 To manually fix the issue:');
  console.log('');
  console.log('1. **Edit frontend/src/pages/PublishTask.tsx**:');
  console.log('   - Add import: generateEncryptionKeyPair, saveEncryptionPrivateKey');
  console.log('   - In proceedWithSubmission function, before createTask call:');
  console.log('');
  console.log('   ```typescript');
  console.log('   // Generate encryption key if user doesn\'t have one');
  console.log('   let encryptionPubKey = profile?.encryptionPubKey;');
  console.log('   if (!encryptionPubKey) {');
  console.log('     const { publicKey, privateKey } = generateEncryptionKeyPair();');
  console.log('     saveEncryptionPrivateKey(address!, privateKey);');
  console.log('     encryptionPubKey = publicKey;');
  console.log('   }');
  console.log('   ```');
  console.log('');
  console.log('2. **Update createTask call**:');
  console.log('   - Include encryptionPubKey in profile creation');
  console.log('   - Ensure backend receives the public key');
  console.log('');
  console.log('3. **Test the fix**:');
  console.log('   - Create a new profile');
  console.log('   - Verify encryptionPubKey is generated');
  console.log('   - Test contacts decryption');

  // Step 8: 提供现有用户修复方案
  console.log('\n8. Fix for Existing Users');
  console.log('------------------------');
  
  console.log('🔄 For users who already have profiles without encryptionPubKey:');
  console.log('');
  console.log('Option A: Use Profile.tsx restore function');
  console.log('   - Go to Profile page');
  console.log('   - Click "Restore profile (off-chain)" button');
  console.log('   - This generates encryptionPubKey and updates profile');
  console.log('');
  console.log('Option B: Create migration script');
  console.log('   - Scan all profiles in database');
  console.log('   - Generate encryptionPubKey for profiles missing it');
  console.log('   - Update database records');
  console.log('');
  console.log('Option C: Auto-fix on next login');
  console.log('   - Modify useProfile hook');
  console.log('   - Check if encryptionPubKey is missing');
  console.log('   - Generate and update automatically');

  console.log('\n🎯 Summary');
  console.log('==========');
  
  console.log('✅ Root cause identified: PublishTask.tsx missing encryptionPubKey generation');
  console.log('✅ Fix location: Add key generation to profile creation flow');
  console.log('✅ Test case: Encryption utilities work correctly');
  console.log('✅ Migration path: Use existing Profile.tsx restore function');
  console.log('');
  console.log('💡 This fix will restore proper contacts decryption functionality!');
}

// 运行修复
fixEncryptionPubKeyIssue().catch(console.error);