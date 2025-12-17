#!/usr/bin/env tsx

/**
 * TaskDetail Fix Verification Script
 * 
 * Tests that TaskDetail.tsx now uses taskId.toString() instead of taskData.taskURI
 * when calling apiClient.getTask(), preventing HTTP 404 errors.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 TaskDetail Fix Verification\n');

// Test 1: Verify TaskDetail.tsx uses correct API call pattern
console.log('Test 1: TaskDetail.tsx API call pattern');
try {
  const taskDetailPath = join(process.cwd(), 'frontend/src/pages/TaskDetail.tsx');
  const taskDetailContent = readFileSync(taskDetailPath, 'utf-8');
  
  // Check for the fixed pattern
  const hasCorrectPattern = taskDetailContent.includes('apiClient.getTask(taskId.toString())');
  const hasOldPattern = taskDetailContent.includes('apiClient.getTask(taskData.taskURI)');
  
  if (hasCorrectPattern && !hasOldPattern) {
    console.log('✅ TaskDetail.tsx uses correct pattern: apiClient.getTask(taskId.toString())');
  } else if (hasOldPattern) {
    console.log('❌ TaskDetail.tsx still uses old pattern: apiClient.getTask(taskData.taskURI)');
  } else {
    console.log('⚠️ TaskDetail.tsx pattern unclear - manual review needed');
  }
} catch (error) {
  console.log('❌ Failed to read TaskDetail.tsx:', error);
}

// Test 2: Compare with working implementations
console.log('\nTest 2: Consistency with other hooks');
try {
  const useTasksPath = join(process.cwd(), 'frontend/src/hooks/useTasks.ts');
  const useTaskHistoryPath = join(process.cwd(), 'frontend/src/hooks/useTaskHistory.ts');
  
  const useTasksContent = readFileSync(useTasksPath, 'utf-8');
  const useTaskHistoryContent = readFileSync(useTaskHistoryPath, 'utf-8');
  
  const useTasksPattern = useTasksContent.includes('apiClient.getTask(taskId.toString())');
  const useTaskHistoryPattern = useTaskHistoryContent.includes('apiClient.getTask(taskId.toString())');
  
  if (useTasksPattern && useTaskHistoryPattern) {
    console.log('✅ All components now use consistent pattern: taskId.toString()');
  } else {
    console.log('⚠️ Inconsistent patterns detected across components');
  }
} catch (error) {
  console.log('❌ Failed to read hook files:', error);
}

// Test 3: Verify error handling consistency
console.log('\nTest 3: Error handling consistency');
try {
  const taskDetailPath = join(process.cwd(), 'frontend/src/pages/TaskDetail.tsx');
  const taskDetailContent = readFileSync(taskDetailPath, 'utf-8');
  
  const hasMetadataError = taskDetailContent.includes('setMetadataError(true)');
  const hasPlaceholderMetadata = taskDetailContent.includes('Metadata loading failed. This task exists on blockchain but metadata is unavailable.');
  
  if (hasMetadataError && hasPlaceholderMetadata) {
    console.log('✅ TaskDetail.tsx has proper error handling with placeholder metadata');
  } else {
    console.log('⚠️ TaskDetail.tsx error handling may be incomplete');
  }
} catch (error) {
  console.log('❌ Failed to verify error handling:', error);
}

console.log('\n📋 Summary:');
console.log('- TaskDetail.tsx should now use taskId.toString() instead of taskData.taskURI');
console.log('- This prevents HTTP 404 errors when loading task metadata');
console.log('- Error handling provides placeholder metadata for missing records');
console.log('- Pattern is now consistent with useTasks.ts and useTaskHistory.ts');

console.log('\n🧪 Next Steps:');
console.log('1. Test TaskDetail page in browser');
console.log('2. Verify no more "Metadata loading failed" placeholder messages');
console.log('3. Check browser console for HTTP 404 errors');
console.log('4. Confirm task titles and descriptions load correctly');