/**
 * API 工具函数
 * 与 backend 通信
 */

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

/**
 * Profile 数据结构
 * 冻结点 1.4-22：必填字段
 */
export interface ProfileData {
  address: string;
  nickname: string;
  city: string;
  skills: string[];
  encryptionPubKey: string;
}

/**
 * Task 数据结构（上传到 backend）
 * 冻结点 3.2：字段命名必须一致
 */
export interface TaskData {
  taskId: string; // 任务 ID（后端需要）
  title: string;
  description: string;
  contactsEncryptedPayload: string;
  createdAt: number; // Unix timestamp
  creatorAddress: string; // Creator 地址（后端需要）
  category?: string; // 任务分类（可选）
}

/**
 * 上传 Profile 到 backend
 * 冻结点 2.2-P0-F1：先上传 profile 到 backend，获得 profileURI
 * 
 * @param profile Profile 数据
 * @returns profileURI
 */
export async function uploadProfile(profile: ProfileData): Promise<string> {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  
  // backend 返回 profileURI
  if (!data.profileURI) {
    throw new Error('Backend did not return profileURI');
  }

  return data.profileURI;
}

/**
 * 获取 Profile
 * @param address 用户地址
 * @returns Profile 数据
 */
export async function getProfile(address: string): Promise<ProfileData> {
  const response = await fetch(`${API_URL}/api/profile/${address}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 上传 Task 到 backend
 * 冻结点 2.2-P0-F4：先上传 task 到 backend，获得 taskURI
 * 
 * @param task Task 数据
 * @returns taskURI
 */
export async function uploadTask(task: TaskData): Promise<string> {
  console.log('[uploadTask] Sending request:', {
    url: `${API_URL}/api/task`,
    payload: task,
  });

  const response = await fetch(`${API_URL}/api/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    // 增强错误日志：打印原始响应文本
    const responseText = await response.text();
    console.error('[uploadTask] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      responseText,
    });
    
    // 尝试解析 JSON 错误
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
      if (errorData.details) {
        console.error('[uploadTask] Error details:', errorData.details);
      }
    } catch {
      // 如果不是 JSON，使用原始文本
      errorMessage = responseText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('[uploadTask] Success:', data);
  
  // backend 返回 taskURI
  if (!data.taskURI) {
    throw new Error('Backend did not return taskURI');
  }

  return data.taskURI;
}

/**
 * 解密请求参数
 * 冻结点 2.5/3.1：链下解密访问控制
 */
export interface DecryptRequest {
  taskId: string;
  address: string;
  signature: string;
  message: string;
}

/**
 * 解密响应
 */
export interface DecryptResponse {
  wrappedDEK: string;
  senderPublicKey: string;
  contactsEncryptedPayload: string;
}

/**
 * 请求解密联系方式
 * 冻结点 2.5/3.1：必须通过后端 API，需要签名
 * 
 * @param request 解密请求
 * @returns 解密响应
 */
export async function requestDecrypt(request: DecryptRequest): Promise<DecryptResponse> {
  const response = await fetch(`${API_URL}/api/contacts/decrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
