// Stage 4.9.x - CrossChainDraftStore: 持久化跨链奖励状态
// 防止网络切换时状态丢失

export interface SelectedAsset {
  key: string;                 // e.g. 'ZETA_ATHENS_NATIVE' | 'ETH_SEPOLIA_NATIVE' | 'USDT_SEPOLIA_ERC20'
  displayName: string;         // e.g. 'ZETA (Athens)' | 'ETH (Sepolia)'
  symbol: string;              // 'ZETA' | 'ETH' | 'USDT'
  sourceChainId: number;       // 7001 for ZetaChain Athens, 11155111 for Sepolia
  kind: 'native' | 'erc20' | 'zrc20';
  tokenAddress?: string;       // erc20 address on source chain when needed
}

export interface CrossChainDraft {
  enabled: boolean;
  asset?: SelectedAsset;
  amount?: string; // 原始输入字符串，避免精度丢失
  depositStatus: 'idle' | 'switching' | 'ready' | 'submitted' | 'confirmed' | 'failed';
  depositTxHash?: string;
  lastUpdatedAt?: number;
}

class CrossChainDraftStore {
  private static instance: CrossChainDraftStore;
  private readonly STORAGE_KEY = 'everecho_crosschain_draft';
  
  private draft: CrossChainDraft = {
    enabled: false,
    depositStatus: 'idle'
  };

  static getInstance(): CrossChainDraftStore {
    if (!CrossChainDraftStore.instance) {
      CrossChainDraftStore.instance = new CrossChainDraftStore();
    }
    return CrossChainDraftStore.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  // 从 localStorage 加载状态
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.draft = { ...this.draft, ...parsed };
        console.log('[CrossChainDraftStore] Loaded from storage:', this.draft);
      }
    } catch (error) {
      console.error('[CrossChainDraftStore] Failed to load from storage:', error);
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    try {
      this.draft.lastUpdatedAt = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.draft));
      console.log('[CrossChainDraftStore] Saved to storage:', this.draft);
    } catch (error) {
      console.error('[CrossChainDraftStore] Failed to save to storage:', error);
    }
  }

  // 获取当前状态
  getDraft(): CrossChainDraft {
    return { ...this.draft };
  }

  // 更新状态
  updateDraft(updates: Partial<CrossChainDraft>): void {
    this.draft = { ...this.draft, ...updates };
    this.saveToStorage();
  }

  // 设置资产
  setAsset(asset: SelectedAsset): void {
    this.updateDraft({ asset });
  }

  // 设置金额
  setAmount(amount: string): void {
    this.updateDraft({ amount });
  }

  // 设置存入状态
  setDepositStatus(status: CrossChainDraft['depositStatus'], txHash?: string): void {
    const updates: Partial<CrossChainDraft> = { depositStatus: status };
    if (txHash) {
      updates.depositTxHash = txHash;
    }
    this.updateDraft(updates);
  }

  // 启用/禁用跨链奖励
  setEnabled(enabled: boolean): void {
    if (!enabled) {
      // 禁用时重置状态
      this.draft = {
        enabled: false,
        depositStatus: 'idle'
      };
    } else {
      this.updateDraft({ enabled });
    }
    this.saveToStorage();
  }

  // 重置状态（用户显式清除或发布成功后）
  reset(): void {
    this.draft = {
      enabled: false,
      depositStatus: 'idle'
    };
    this.saveToStorage();
  }

  // 检查是否有已确认的存入
  hasConfirmedDeposit(): boolean {
    return this.draft.enabled && this.draft.depositStatus === 'confirmed';
  }

  // 获取存入摘要（用于UI显示）
  getDepositSummary(): string | null {
    if (!this.hasConfirmedDeposit() || !this.draft.asset || !this.draft.amount) {
      return null;
    }
    return `${this.draft.amount} ${this.draft.asset.symbol} → Chain ${this.draft.asset.sourceChainId}`;
  }
}

export default CrossChainDraftStore;