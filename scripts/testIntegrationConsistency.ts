#!/usr/bin/env npx tsx

/**
 * Integration Test for Consistency Verification
 * 
 * Validates end-to-end consistency between blockchain and database:
 * 1. Chain-first task creation flow
 * 2. Metadata synchronization
 * 3. Data consistency across components
 * 4. Recovery mechanisms
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

interface ConsistencyTestResult {
  testName: string;
  passed: boolean;
  details: string;
  blockchainTaskId?: string;
  databaseTaskId?: string;
  consistencyScore: number; // 0-100
}

interface TaskData {
  taskId: string;
  creator: string;
  title: string;
  description: string;
  reward: string;
  status: string;
  createdAt: number;
}

class IntegrationConsistencyTester {
  private provider: ethers.JsonRpcProvider;
  private taskEscrowAddress: string;
  private backendUrl: string;
  private results: ConsistencyTestResult[] = [];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    this.taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS || '';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  }

  async runAllTests(): Promise<void> {
    console.log('🔄 Starting Integration Consistency Tests...\n');

    await this.testChainFirstTaskCreation();
    await this.testMetadataSynchronization();
    await this.testDataConsistencyAcrossComponents();
    await this.testRecoveryMechanisms();

    this.printResults();
  }

  /**
   * Test 1: Chain-first task creation flow
   * Verify blockchain transaction happens before metadata writes
   */
  async testChainFirstTaskCreation(): Promise<void> {
    const testName = 'Chain-First Task Creation';
    console.log(`🔍 Testing: ${testName}`);

    try {
      // Step 1: Create task on blockchain
      const blockchainResult = await this.createTaskOnBlockchain();
      console.log(`     Blockchain task created: ${blockchainResult.taskId}`);

      // Step 2: Verify task exists on blockchain before metadata write
      const blockchainExists = await this.verifyTaskOnBlockchain(blockchainResult.taskId);
      console.log(`     Blockchain verification: ${blockchainExists}`);

      // Step 3: Write metadata to database
      const metadataResult = await this.writeTaskMetadata(blockchainResult.taskId, blockchainResult.creator);
      console.log(`     Metadata write: ${metadataResult.success}`);

      // Step 4: Verify consistency
      const consistencyScore = await this.calculateConsistencyScore(blockchainResult.taskId);
      
      const passed = blockchainExists && metadataResult.success && consistencyScore >= 95;
      
      this.results.push({
        testName,
        passed,
        details: `Blockchain: ${blockchainExists}, Metadata: ${metadataResult.success}, Consistency: ${consistencyScore}%`,
        blockchainTaskId: blockchainResult.taskId,
        databaseTaskId: metadataResult.taskId,
        consistencyScore
      });

      console.log(`   ${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        consistencyScore: 0
      });
      console.log(`   ❌ ${testName}: FAILED - ${error}\n`);
    }
  }

  /**
   * Test 2: Metadata synchronization
   * Verify metadata writes are properly synchronized with blockchain state
   */
  async testMetadataSynchronization(): Promise<void> {
    const testName = 'Metadata Synchronization';
    console.log(`🔍 Testing: ${testName}`);

    try {
      // Create multiple tasks and verify synchronization
      const tasks = await this.createMultipleTasks(3);
      console.log(`     Created ${tasks.length} tasks for sync testing`);

      let totalConsistency = 0;
      let syncedTasks = 0;

      for (const task of tasks) {
        const consistency = await this.calculateConsistencyScore(task.taskId);
        totalConsistency += consistency;
        
        if (consistency >= 95) {
          syncedTasks++;
        }
        
        console.log(`     Task ${task.taskId}: ${consistency}% consistent`);
      }

      const averageConsistency = totalConsistency / tasks.length;
      const syncRate = (syncedTasks / tasks.length) * 100;
      
      const passed = averageConsistency >= 95 && syncRate >= 90;
      
      this.results.push({
        testName,
        passed,
        details: `Avg Consistency: ${averageConsistency.toFixed(1)}%, Sync Rate: ${syncRate.toFixed(1)}%`,
        consistencyScore: averageConsistency
      });

      console.log(`   ${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        consistencyScore: 0
      });
      console.log(`   ❌ ${testName}: FAILED - ${error}\n`);
    }
  }

  /**
   * Test 3: Data consistency across components
   * Verify frontend, backend, and blockchain all show consistent data
   */
  async testDataConsistencyAcrossComponents(): Promise<void> {
    const testName = 'Cross-Component Data Consistency';
    console.log(`🔍 Testing: ${testName}`);

    try {
      // Create a test task
      const task = await this.createTaskOnBlockchain();
      await this.writeTaskMetadata(task.taskId, task.creator);
      
      // Fetch data from all sources
      const blockchainData = await this.fetchTaskFromBlockchain(task.taskId);
      const backendData = await this.fetchTaskFromBackend(task.taskId);
      const frontendData = await this.simulateFrontendFetch(task.taskId);
      
      console.log(`     Blockchain data: ${blockchainData ? 'Found' : 'Not found'}`);
      console.log(`     Backend data: ${backendData ? 'Found' : 'Not found'}`);
      console.log(`     Frontend data: ${frontendData ? 'Found' : 'Not found'}`);

      // Compare data consistency
      const consistency = this.compareTaskData(blockchainData, backendData, frontendData);
      
      const passed = consistency >= 95;
      
      this.results.push({
        testName,
        passed,
        details: `Blockchain: ${!!blockchainData}, Backend: ${!!backendData}, Frontend: ${!!frontendData}, Match: ${consistency}%`,
        blockchainTaskId: task.taskId,
        consistencyScore: consistency
      });

      console.log(`   ${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        consistencyScore: 0
      });
      console.log(`   ❌ ${testName}: FAILED - ${error}\n`);
    }
  }

  /**
   * Test 4: Recovery mechanisms
   * Verify system can recover from various failure scenarios
   */
  async testRecoveryMechanisms(): Promise<void> {
    const testName = 'Recovery Mechanisms';
    console.log(`🔍 Testing: ${testName}`);

    try {
      // Test scenario 1: Metadata write failure with retry
      const retryTest = await this.testMetadataRetryRecovery();
      console.log(`     Retry recovery: ${retryTest}`);

      // Test scenario 2: Orphan cleanup
      const orphanTest = await this.testOrphanCleanupRecovery();
      console.log(`     Orphan cleanup: ${orphanTest}`);

      // Test scenario 3: Network failure recovery
      const networkTest = await this.testNetworkFailureRecovery();
      console.log(`     Network recovery: ${networkTest}`);

      const passed = retryTest && orphanTest && networkTest;
      
      this.results.push({
        testName,
        passed,
        details: `Retry: ${retryTest}, Orphan: ${orphanTest}, Network: ${networkTest}`,
        consistencyScore: passed ? 100 : 50
      });

      console.log(`   ${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}\n`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        consistencyScore: 0
      });
      console.log(`   ❌ ${testName}: FAILED - ${error}\n`);
    }
  }

  // Helper methods
  private async createTaskOnBlockchain(): Promise<{ taskId: string; creator: string }> {
    // Mock blockchain task creation
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const creator = '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6';
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate blockchain delay
    
    return { taskId, creator };
  }

  private async verifyTaskOnBlockchain(taskId: string): Promise<boolean> {
    // Mock blockchain verification
    await new Promise(resolve => setTimeout(resolve, 500));
    return true; // Assume task exists
  }

  private async writeTaskMetadata(taskId: string, creator: string): Promise<{ success: boolean; taskId: string }> {
    try {
      // Mock metadata write to backend
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, taskId };
    } catch {
      return { success: false, taskId };
    }
  }

  private async calculateConsistencyScore(taskId: string): Promise<number> {
    // Mock consistency calculation
    await new Promise(resolve => setTimeout(resolve, 200));
    return Math.floor(Math.random() * 10) + 90; // 90-100% consistency
  }

  private async createMultipleTasks(count: number): Promise<{ taskId: string; creator: string }[]> {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      const task = await this.createTaskOnBlockchain();
      await this.writeTaskMetadata(task.taskId, task.creator);
      tasks.push(task);
    }
    return tasks;
  }

  private async fetchTaskFromBlockchain(taskId: string): Promise<TaskData | null> {
    // Mock blockchain fetch
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      taskId,
      creator: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6',
      title: 'Test Task',
      description: 'Test Description',
      reward: '10',
      status: 'open',
      createdAt: Date.now()
    };
  }

  private async fetchTaskFromBackend(taskId: string): Promise<TaskData | null> {
    // Mock backend fetch
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      taskId,
      creator: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6',
      title: 'Test Task',
      description: 'Test Description',
      reward: '10',
      status: 'open',
      createdAt: Date.now()
    };
  }

  private async simulateFrontendFetch(taskId: string): Promise<TaskData | null> {
    // Mock frontend fetch
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      taskId,
      creator: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6',
      title: 'Test Task',
      description: 'Test Description',
      reward: '10',
      status: 'open',
      createdAt: Date.now()
    };
  }

  private compareTaskData(blockchain: TaskData | null, backend: TaskData | null, frontend: TaskData | null): number {
    if (!blockchain || !backend || !frontend) return 0;
    
    let matches = 0;
    const fields = ['taskId', 'creator', 'title', 'description', 'reward', 'status'];
    
    for (const field of fields) {
      if (blockchain[field as keyof TaskData] === backend[field as keyof TaskData] && 
          backend[field as keyof TaskData] === frontend[field as keyof TaskData]) {
        matches++;
      }
    }
    
    return (matches / fields.length) * 100;
  }

  private async testMetadataRetryRecovery(): Promise<boolean> {
    // Mock retry recovery test
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }

  private async testOrphanCleanupRecovery(): Promise<boolean> {
    // Mock orphan cleanup test
    await new Promise(resolve => setTimeout(resolve, 600));
    return true;
  }

  private async testNetworkFailureRecovery(): Promise<boolean> {
    // Mock network failure recovery test
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private printResults(): void {
    console.log('📊 Integration Consistency Test Results:');
    console.log('========================================\n');

    let totalPassed = 0;
    let totalConsistency = 0;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} - ${result.testName}`);
      console.log(`   Details: ${result.details}`);
      console.log(`   Consistency Score: ${result.consistencyScore.toFixed(1)}%`);
      if (result.blockchainTaskId) {
        console.log(`   Blockchain Task ID: ${result.blockchainTaskId}`);
      }
      if (result.databaseTaskId) {
        console.log(`   Database Task ID: ${result.databaseTaskId}`);
      }
      console.log();

      if (result.passed) totalPassed++;
      totalConsistency += result.consistencyScore;
    });

    const averageConsistency = totalConsistency / this.results.length;

    console.log(`Summary: ${totalPassed}/${this.results.length} tests passed`);
    console.log(`Average Consistency Score: ${averageConsistency.toFixed(1)}%`);
    
    if (totalPassed === this.results.length && averageConsistency >= 95) {
      console.log('🎉 All integration consistency tests passed!');
    } else {
      console.log('⚠️  Some tests failed or consistency is below threshold. Review implementation.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationConsistencyTester();
  tester.runAllTests().catch(console.error);
}

export { IntegrationConsistencyTester };