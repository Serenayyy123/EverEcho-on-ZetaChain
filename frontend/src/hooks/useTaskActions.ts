import { useState } from 'react';
import { ethers } from 'ethers';
import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * 真实任务操作 Hook
 */
export function useTaskActions(
  signer: ethers.Signer | null,
  chainId: number | null,
  onSuccess?: () => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const executeAction = async (
    actionName: string,
    action: () => Promise<ethers.ContractTransactionResponse>
  ) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return false;
    }

    // chainId guard: 检查是否在支持的网络上
    if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
      setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
      console.error(`${actionName} blocked: unsupported chainId ${chainId}`);
      return false;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      console.log(`Executing ${actionName}...`);
      const tx = await action();
      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt?.hash);

      setLoading(false);
      
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err: any) {
      console.error(`${actionName} failed:`, err);
      
      let errorMessage = `${actionName} failed`;
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const getContract = () => {
    if (!signer || !chainId) throw new Error('Wallet not connected');
    const addresses = getContractAddresses(chainId);
    return new ethers.Contract(addresses.taskEscrow, TaskEscrowABI.abi, signer);
  };

  const acceptTask = async (taskId: number) => {
    return executeAction('acceptTask', async () => {
      const contract = getContract();
      return contract.acceptTask(taskId);
    });
  };

  const submitWork = async (taskId: number) => {
    return executeAction('submitWork', async () => {
      const contract = getContract();
      return contract.submitWork(taskId);
    });
  };

  const confirmComplete = async (taskId: number) => {
    return executeAction('confirmComplete', async () => {
      const contract = getContract();
      return contract.confirmComplete(taskId);
    });
  };

  const cancelTask = async (taskId: number) => {
    return executeAction('cancelTask', async () => {
      const contract = getContract();
      return contract.cancelTask(taskId);
    });
  };

  const cancelTaskTimeout = async (taskId: number) => {
    return executeAction('cancelTaskTimeout', async () => {
      const contract = getContract();
      return contract.cancelTaskTimeout(taskId);
    });
  };

  const progressTimeout = async (taskId: number) => {
    return executeAction('progressTimeout', async () => {
      const contract = getContract();
      return contract.progressTimeout(taskId);
    });
  };

  const completeTimeout = async (taskId: number) => {
    return executeAction('completeTimeout', async () => {
      const contract = getContract();
      return contract.completeTimeout(taskId);
    });
  };

  const requestTerminate = async (taskId: number) => {
    return executeAction('requestTerminate', async () => {
      const contract = getContract();
      return contract.requestTerminate(taskId);
    });
  };

  const agreeTerminate = async (taskId: number) => {
    return executeAction('agreeTerminate', async () => {
      const contract = getContract();
      return contract.agreeTerminate(taskId);
    });
  };

  const terminateTimeout = async (taskId: number) => {
    return executeAction('terminateTimeout', async () => {
      const contract = getContract();
      return contract.terminateTimeout(taskId);
    });
  };

  const requestFix = async (taskId: number, fixRequested: boolean) => {
    // 冻结点 1.4-20：requestFix 仅允许一次
    if (fixRequested) {
      setError('Request Fix already used');
      console.warn('requestFix blocked: already requested');
      return false;
    }

    return executeAction('requestFix', async () => {
      const contract = getContract();
      return contract.requestFix(taskId);
    });
  };

  return {
    acceptTask,
    submitWork,
    confirmComplete,
    cancelTask,
    cancelTaskTimeout,
    progressTimeout,
    completeTimeout,
    requestTerminate,
    agreeTerminate,
    terminateTimeout,
    requestFix,
    loading,
    error,
    txHash,
  };
}
