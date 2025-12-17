#!/usr/bin/env tsx

/**
 * 诊断联系方式解密 HTTP 404 问题
 * 
 * 分析可能的原因：
 * 1. 后端服务状态
 * 2. 路由注册
 * 3. 前端请求构造
 * 4. 网络连接
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 联系方式解密 HTTP 404 问题诊断\n');

// 1. 检查后端路由注册
console.log('1️⃣ 检查后端路由注册');
try {
  const indexPath = join(process.cwd(), 'backend/src/index.ts');
  const indexContent = readFileSync(indexPath, 'utf-8');
  
  const hasContactsImport = indexContent.includes("import contactsRoutes from './routes/contacts'");
  const hasContactsRoute = indexContent.includes("app.use('/api/contacts', contactsRoutes)");
  
  console.log(`   ✅ Contacts 路由导入: ${hasContactsImport ? '存在' : '❌ 缺失'}`);
  console.log(`   ✅ Contacts 路由注册: ${hasContactsRoute ? '存在' : '❌ 缺失'}`);
  
  if (!hasContactsImport || !hasContactsRoute) {
    console.log('   ⚠️ 后端路由注册有问题');
  }
} catch (error) {
  console.log('   ❌ 无法读取后端 index.ts:', error);
}

// 2. 检查 contacts.ts 文件
console.log('\n2️⃣ 检查 contacts.ts 文件');
try {
  const contactsPath = join(process.cwd(), 'backend/src/routes/contacts.ts');
  const contactsContent = readFileSync(contactsPath, 'utf-8');
  
  const hasDecryptRoute = contactsContent.includes("router.post('/decrypt'");
  const hasExportDefault = contactsContent.includes('export default router');
  
  console.log(`   ✅ /decrypt 路由定义: ${hasDecryptRoute ? '存在' : '❌ 缺失'}`);
  console.log(`   ✅ 默认导出: ${hasExportDefault ? '存在' : '❌ 缺失'}`);
} catch (error) {
  console.log('   ❌ 无法读取 contacts.ts:', error);
}

// 3. 检查前端 API 客户端
console.log('\n3️⃣ 检查前端 API 客户端');
try {
  const clientPath = join(process.cwd(), 'frontend/src/api/client.ts');
  const clientContent = readFileSync(clientPath, 'utf-8');
  
  const hasDecryptMethod = clientContent.includes('decryptContacts');
  const hasCorrectEndpoint = clientContent.includes("'/api/contacts/decrypt'");
  const baseUrlMatch = clientContent.match(/BASE_URL = (.+)/);
  
  console.log(`   ✅ decryptContacts 方法: ${hasDecryptMethod ? '存在' : '❌ 缺失'}`);
  console.log(`   ✅ 正确端点路径: ${hasCorrectEndpoint ? '存在' : '❌ 缺失'}`);
  console.log(`   ✅ BASE_URL 配置: ${baseUrlMatch ? baseUrlMatch[1] : '❌ 未找到'}`);
} catch (error) {
  console.log('   ❌ 无法读取前端 client.ts:', error);
}

// 4. 检查前端环境变量
console.log('\n4️⃣ 检查前端环境变量');
try {
  const envPath = join(process.cwd(), 'frontend/.env');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const backendUrlMatch = envContent.match(/VITE_BACKEND_BASE_URL=(.+)/);
  console.log(`   ✅ VITE_BACKEND_BASE_URL: ${backendUrlMatch ? backendUrlMatch[1] : '❌ 未配置'}`);
} catch (error) {
  console.log('   ⚠️ 无法读取 .env 文件:', error);
}

// 5. 可能的原因分析
console.log('\n📋 可能的原因分析:');

console.log('\n🔍 基于错误信息 "POST http://localhost:3001/api/contacts/decrypt 404"');
console.log('   可能原因:');
console.log('   1. 后端服务重启后路由未正确加载');
console.log('   2. TypeScript 编译错误导致路由未注册');
console.log('   3. 前端缓存问题');
console.log('   4. 网络代理或防火墙问题');

console.log('\n🧪 建议的调试步骤:');
console.log('   1. 重启后端服务');
console.log('   2. 检查后端控制台是否有编译错误');
console.log('   3. 直接测试后端端点: curl -X POST http://localhost:3001/api/contacts/decrypt');
console.log('   4. 检查浏览器网络面板的实际请求');
console.log('   5. 清除浏览器缓存');

console.log('\n🔧 快速修复建议:');
console.log('   1. 确保后端服务正在运行且无编译错误');
console.log('   2. 确保前端使用正确的 BASE_URL');
console.log('   3. 检查是否有路由冲突');

// 6. 生成测试命令
console.log('\n🧪 测试命令:');
console.log('   # 测试后端端点是否存在');
console.log('   curl -X POST http://localhost:3001/api/contacts/decrypt -H "Content-Type: application/json" -d \'{"test":"test"}\'');
console.log('   ');
console.log('   # 检查后端所有路由');
console.log('   curl http://localhost:3001/');
console.log('   ');
console.log('   # 重启后端服务');
console.log('   cd backend && npm run dev');

console.log('\n✅ 诊断完成');