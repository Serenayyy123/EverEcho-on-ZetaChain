#!/usr/bin/env tsx

/**
 * 预防未来 API 错误的检查脚本
 * 
 * 扫描代码库中可能导致类似 HTTP 404 错误的模式
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 预防未来 API 错误检查\n');

interface Issue {
  file: string;
  line: number;
  pattern: string;
  suggestion: string;
}

const issues: Issue[] = [];

// 递归扫描目录
function scanDirectory(dir: string, extensions: string[] = ['.ts', '.tsx']) {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 等目录
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
          walk(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// 检查文件中的问题模式
function checkFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查 1: 使用 taskURI 调用 getTask
      if (line.includes('apiClient.getTask') && line.includes('taskURI')) {
        issues.push({
          file: filePath,
          line: lineNum,
          pattern: 'apiClient.getTask(*.taskURI)',
          suggestion: '使用 apiClient.getTask(taskId.toString()) 替代'
        });
      }
      
      // 检查 2: 使用 taskURI 调用其他 API
      if (line.includes('apiClient.') && line.includes('taskURI') && !line.includes('// OK:')) {
        issues.push({
          file: filePath,
          line: lineNum,
          pattern: 'apiClient.*(*.taskURI)',
          suggestion: '确认是否应该使用 taskId 而不是 taskURI'
        });
      }
      
      // 检查 3: 直接使用 taskURI 作为 URL 参数
      if (line.includes('fetch') && line.includes('taskURI')) {
        issues.push({
          file: filePath,
          line: lineNum,
          pattern: 'fetch(*.taskURI)',
          suggestion: '确认 URL 构造是否正确'
        });
      }
      
      // 检查 4: 可疑的 URL 拼接
      if (line.includes('/api/task/') && line.includes('taskURI')) {
        issues.push({
          file: filePath,
          line: lineNum,
          pattern: '/api/task/ + taskURI',
          suggestion: '可能导致双重路径，检查 URL 构造'
        });
      }
    });
  } catch (error) {
    console.warn(`⚠️ 无法读取文件 ${filePath}:`, error);
  }
}

// 扫描前端代码
console.log('📁 扫描前端代码...');
const frontendFiles = scanDirectory('frontend/src');
frontendFiles.forEach(checkFile);

// 扫描后端代码
console.log('📁 扫描后端代码...');
const backendFiles = scanDirectory('backend/src');
backendFiles.forEach(checkFile);

// 扫描脚本
console.log('📁 扫描脚本文件...');
const scriptFiles = scanDirectory('scripts');
scriptFiles.forEach(checkFile);

// 报告结果
console.log('\n📊 检查结果:');

if (issues.length === 0) {
  console.log('✅ 未发现潜在的 API 调用问题');
} else {
  console.log(`⚠️ 发现 ${issues.length} 个潜在问题:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:${issue.line}`);
    console.log(`   模式: ${issue.pattern}`);
    console.log(`   建议: ${issue.suggestion}\n`);
  });
}

// 提供最佳实践建议
console.log('💡 最佳实践建议:');
console.log('1. 总是使用 taskId.toString() 调用 apiClient.getTask()');
console.log('2. 避免直接使用 taskURI 进行 API 调用');
console.log('3. 在代码注释中标明正确用法');
console.log('4. 定期运行此检查脚本');

// 生成 ESLint 规则建议
console.log('\n🔧 建议的 ESLint 规则:');
console.log(`
// .eslintrc.js
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.property.name='getTask'][arguments.0.property.name='taskURI']",
      message: "Use taskId.toString() instead of taskData.taskURI for apiClient.getTask()"
    }
  ]
}
`);

process.exit(issues.length > 0 ? 1 : 0);