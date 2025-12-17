/**
 * 后端 API 客户端
 */

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

/**
 * Profile 数据结构（冻结点 3.2）
 * 字段命名必须与薄片一致
 */
export interface ProfileData {
  address?: string; // 用户地址（后端需要）
  nickname: string; // 用户昵称（薄片字段）
  city?: string; // 城市（薄片字段）
  skills?: string | string[]; // 技能（薄片字段，后端需要数组）
  encryptionPubKey: string; // 加密公钥（冻结点 1.4-22：必填）
  bio?: string; // 个人简介
  avatar?: string; // 头像 URL
  contacts?: string; // 联系方式（明文，用于展示）
}

/**
 * Task 数据结构（冻结点 3.2）
 * 字段命名必须与薄片一致
 */
export interface TaskData {
  taskId: string; // 任务 ID（后端需要）
  title: string; // 任务标题（薄片字段）
  description: string; // 任务描述（薄片字段）
  contactsEncryptedPayload: string; // 加密的联系方式（冻结点 3.2：必须此命名）
  createdAt: number; // 创建时间戳（薄片字段）
  category?: string; // 任务分类
  deliverables?: string; // 交付物说明
  creator?: string; // Creator 地址
  creatorNickname?: string | null; // Creator 昵称
  helper?: string; // Helper 地址
  helperNickname?: string | null; // Helper 昵称
}

/**
 * Profile 创建响应（冻结点 2.2）
 * profileURI 格式：https://api.everecho.io/profile/{address}.json
 * 示例：https://api.everecho.io/profile/0x1234...5678.json
 */
export interface ProfileResponse {
  profileURI: string;
  cid?: string; // IPFS CID（如果使用 IPFS）
}

/**
 * Task 创建响应（冻结点 2.2）
 * taskURI 格式：https://api.everecho.io/task/{taskId}.json
 * 示例：https://api.everecho.io/task/1.json
 */
export interface TaskResponse {
  taskURI: string;
  cid?: string; // IPFS CID（如果使用 IPFS）
}

export interface ContactsDecryptRequest {
  taskId: number | string;
  address: string;
  signature: string;
  message: string;
}

export interface ContactsDecryptResponse {
  success: boolean;
  contacts: string; // 明文联系方式（MVP 简化方案）
  wrappedDEK: string; // 保留用于未来完整实现
  senderPublicKey?: string; // 可选
  contactsEncryptedPayload?: string; // 可选（向后兼容）
}

/**
 * 重试配置选项
 */
export interface RetryOptions {
  maxRetries?: number; // 最大重试次数，默认 3
  retryDelay?: number; // 重试延迟基数（毫秒），默认 1000
  retryOn404?: boolean; // 是否在 404 错误时重试，默认 true
  retryOnNetworkError?: boolean; // 是否在网络错误时重试，默认 true
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 带重试机制的请求方法
   * 自动处理网络错误和 404 错误，提高系统稳定性
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      retryOn404 = true,
      retryOnNetworkError = true
    } = retryOptions;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`[APIClient] Request attempt ${attempt}/${maxRetries}: ${options.method || 'GET'} ${endpoint}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: response.statusText }));
          const errorMessage = error.message || `HTTP ${response.status}`;
          lastError = new Error(errorMessage);

          // 检查是否应该重试
          const shouldRetry = attempt < maxRetries && (
            (response.status === 404 && retryOn404) ||
            (response.status >= 500 && retryOnNetworkError) ||
            (response.status === 0 && retryOnNetworkError) // 网络连接失败
          );

          if (shouldRetry) {
            const delay = retryDelay * attempt; // 指数退避
            console.warn(`[APIClient] HTTP ${response.status} error, retrying in ${delay}ms... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // 不重试或已达到最大重试次数
          throw lastError;
        }

        console.log(`[APIClient] Request successful on attempt ${attempt}`);
        return response.json();

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown network error');
        
        // 检查是否是网络错误且应该重试
        const isNetworkError = err instanceof TypeError || 
                              (err as any).name === 'NetworkError' ||
                              (err as any).code === 'NETWORK_ERROR';
        
        const shouldRetry = attempt < maxRetries && isNetworkError && retryOnNetworkError;

        if (shouldRetry) {
          const delay = retryDelay * attempt;
          console.warn(`[APIClient] Network error, retrying in ${delay}ms... (${attempt}/${maxRetries})`, err);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // 不重试或已达到最大重试次数
        if (attempt === maxRetries) {
          console.error(`[APIClient] All ${maxRetries} attempts failed for ${endpoint}`, lastError);
        }
        throw lastError;
      }
    }

    throw lastError!;
  }

  // Profile API
  async createProfile(data: ProfileData): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(profileURI: string): Promise<ProfileData> {
    // 如果是 IPFS/HTTP URL，直接获取
    if (profileURI.startsWith('http') || profileURI.startsWith('ipfs://')) {
      const url = profileURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(url);
      return response.json();
    }
    // 否则通过后端获取
    return this.request<ProfileData>(`/api/profile/${profileURI}`);
  }

  // Task API
  async createTask(data: TaskData): Promise<TaskResponse> {
    return this.request<TaskResponse>('/api/task', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTask(taskURI: string): Promise<TaskData> {
    // 如果是完整的 HTTP/IPFS URL，直接获取
    if (taskURI.startsWith('http') || taskURI.startsWith('ipfs://')) {
      // 从 URI 中提取 taskId
      // 格式：https://api.everecho.io/task/1.json
      const match = taskURI.match(/\/task\/(\d+)\.json$/);
      if (match) {
        const taskId = match[1];
        return this.request<TaskData>(`/api/task/${taskId}`);
      }
      
      // 如果是其他格式的 URL，直接 fetch
      const url = taskURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(url);
      return response.json();
    }
    
    // 如果只是 taskId，直接使用
    return this.request<TaskData>(`/api/task/${taskURI}`);
  }

  // Contacts API
  async decryptContacts(req: ContactsDecryptRequest): Promise<ContactsDecryptResponse> {
    // 联系方式解密使用增强的重试配置，专门解决 HTTP 404 缓存问题
    return this.request<ContactsDecryptResponse>('/api/contacts/decrypt', {
      method: 'POST',
      body: JSON.stringify(req),
    }, {
      maxRetries: 5, // 增加重试次数，因为这是关键功能
      retryDelay: 1500, // 稍长的延迟，给后端更多时间
      retryOn404: true, // 专门处理 404 缓存问题
      retryOnNetworkError: true
    });
  }



  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/health');
  }

  // Generic POST method
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic GET method
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }
}

export const apiClient = new APIClient(BASE_URL);
