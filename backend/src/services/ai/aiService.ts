/**
 * AI Service - Backend AI Integration for EverEcho
 * Stage 4.3-A: Foundation Layer
 * Stage 4.6: Beta Trial - AI Reward Constraints
 * 
 * 🔒 CODE FREEZE: This service is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Only provides suggestions and draft content
 * 🧪 Beta: Constrains suggestions to Beta-appropriate ranges
 */

// Stage 4.6: Beta configuration for AI constraints
interface BetaConfig {
  enabled: boolean;
  rewardRange: [number, number]; // [min, max]
  defaultReward: number;
  warningThreshold: number;
}

const BETA_CONFIG: BetaConfig = {
  enabled: true, // For Stage 4.6, Beta mode is always enabled
  rewardRange: [5, 20],
  defaultReward: 10,
  warningThreshold: 20
};

// Stage 4.6: Helper functions for Beta constraints
function isWithinBetaRange(reward: number): boolean {
  if (!BETA_CONFIG.enabled) return true;
  return reward >= BETA_CONFIG.rewardRange[0] && reward <= BETA_CONFIG.rewardRange[1];
}

function getBetaWarningMessage(reward: number): string | null {
  if (!BETA_CONFIG.enabled || isWithinBetaRange(reward)) return null;
  return `This is advanced user amount, new users recommended ${BETA_CONFIG.rewardRange[0]}-${BETA_CONFIG.rewardRange[1]} ECHO`;
}

export interface AITaskDraft {
  title: string;
  description: string;
  suggestedRewardEcho: number;
  category?: string;
  skills?: string[];
  disclaimer: string;
}

export interface AIRewardSuggestion {
  rewardEcho: number;
  postFeeEcho: number;
  totalCostEcho: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
  disclaimer: string;
  // Stage 4.6: Beta warning support
  betaWarning?: string;
  isWithinBetaRange: boolean;
}

export interface AIHelperProfile {
  suggestedSkills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeHours: number;
  disclaimer: string;
}

export interface AIProvider {
  generateTaskDraft(prompt: string): Promise<AITaskDraft>;
  suggestReward(description: string): Promise<AIRewardSuggestion>;
  suggestHelperProfile(description: string): Promise<AIHelperProfile>;
}

/**
 * Mock AI Provider - Always available fallback
 */
export class MockAIProvider implements AIProvider {
  async generateTaskDraft(prompt: string): Promise<AITaskDraft> {
    // Simple keyword-based mock logic
    const isDesign = /design|ui|ux|figma|mockup/i.test(prompt);
    const isDev = /code|develop|program|website|app/i.test(prompt);
    const isContent = /write|content|blog|article/i.test(prompt);
    
    let category = 'General';
    let skills: string[] = [];
    let baseReward = 50;
    
    if (isDesign) {
      category = 'Design';
      skills = ['UI/UX', 'Figma', 'Adobe'];
      baseReward = 80;
    } else if (isDev) {
      category = 'Development';
      skills = ['JavaScript', 'React', 'Node.js'];
      baseReward = 120;
    } else if (isContent) {
      category = 'Content';
      skills = ['Writing', 'SEO', 'Research'];
      baseReward = 40;
    }
    
    // Stage 4.6: Apply Beta constraints to reward suggestions
    let finalReward = baseReward;
    if (BETA_CONFIG.enabled) {
      finalReward = Math.min(Math.max(baseReward, BETA_CONFIG.rewardRange[0]), BETA_CONFIG.rewardRange[1]);
    } else {
      finalReward = Math.min(Math.max(baseReward, 1), 1000);
    }

    return {
      title: `${category} Task: ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      description: `Based on your request: "${prompt}"\n\nThis task involves ${category.toLowerCase()} work. Please provide more specific requirements, deliverables, and timeline expectations.`,
      suggestedRewardEcho: finalReward,
      category,
      skills,
      disclaimer: BETA_CONFIG.enabled 
        ? 'AI 建议仅供参考，Beta 模式推荐 5-20 ECHO 范围，所有链上操作需用户手动确认'
        : 'AI 建议仅供参考，所有链上操作需用户手动确认'
    };
  }

  async suggestReward(description: string): Promise<AIRewardSuggestion> {
    // Rule-based reward calculation (deterministic)
    const wordCount = description.split(' ').length;
    const complexity = this.assessComplexity(description);
    
    let baseReward = 50;
    if (complexity === 'easy') baseReward = 30;
    if (complexity === 'medium') baseReward = 80;
    if (complexity === 'hard') baseReward = 150;
    
    // Adjust by word count
    const wordMultiplier = Math.min(wordCount / 50, 2);
    let rewardEcho = Math.round(baseReward * wordMultiplier);
    
    // Stage 4.6: Apply Beta constraints to reward suggestions
    if (BETA_CONFIG.enabled) {
      rewardEcho = Math.min(Math.max(rewardEcho, BETA_CONFIG.rewardRange[0]), BETA_CONFIG.rewardRange[1]);
    } else {
      rewardEcho = Math.min(Math.max(rewardEcho, 1), 1000);
    }
    
    // Generate appropriate reason based on constraints
    let reason = `${complexity} complexity task (${wordCount} words)`;
    if (BETA_CONFIG.enabled && rewardEcho === BETA_CONFIG.rewardRange[1]) {
      reason += ` - capped at Beta maximum (${BETA_CONFIG.rewardRange[1]} ECHO)`;
    }
    
    return {
      rewardEcho,
      postFeeEcho: 10, // Fixed TASK_POST_FEE
      totalCostEcho: rewardEcho + 10,
      difficulty: complexity,
      reason,
      disclaimer: BETA_CONFIG.enabled 
        ? 'AI 建议仅供参考，Beta 模式推荐 5-20 ECHO 范围，所有链上操作需用户手动确认'
        : 'AI 建议仅供参考，所有链上操作需用户手动确认',
      // Stage 4.6: Beta warning information
      betaWarning: getBetaWarningMessage(rewardEcho) || undefined,
      isWithinBetaRange: isWithinBetaRange(rewardEcho)
    };
  }

  async suggestHelperProfile(description: string): Promise<AIHelperProfile> {
    const complexity = this.assessComplexity(description);
    const skills = this.extractSkills(description);
    
    let estimatedHours = 8;
    if (complexity === 'easy') estimatedHours = 4;
    if (complexity === 'medium') estimatedHours = 12;
    if (complexity === 'hard') estimatedHours = 24;
    
    return {
      suggestedSkills: skills,
      difficulty: complexity,
      estimatedTimeHours: estimatedHours,
      disclaimer: '仅供参考，不代表真实撮合'
    };
  }

  private assessComplexity(description: string): 'easy' | 'medium' | 'hard' {
    const complexKeywords = ['complex', 'advanced', 'enterprise', 'scalable', 'architecture'];
    const easyKeywords = ['simple', 'basic', 'quick', 'small'];
    
    const text = description.toLowerCase();
    
    if (complexKeywords.some(keyword => text.includes(keyword))) return 'hard';
    if (easyKeywords.some(keyword => text.includes(keyword))) return 'easy';
    return 'medium';
  }

  private extractSkills(description: string): string[] {
    const skillMap = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'node': 'Node.js',
      'python': 'Python',
      'solidity': 'Solidity',
      'design': 'UI/UX',
      'figma': 'Figma',
      'photoshop': 'Photoshop',
      'writing': 'Content Writing',
      'seo': 'SEO',
      'marketing': 'Marketing'
    };
    
    const text = description.toLowerCase();
    const foundSkills: string[] = [];
    
    Object.entries(skillMap).forEach(([keyword, skill]) => {
      if (text.includes(keyword)) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills.length > 0 ? foundSkills : ['General'];
  }
}

/**
 * AI Service Factory
 */
export class AIService {
  private provider: AIProvider;
  
  constructor() {
    const aiProvider = process.env.AI_PROVIDER || 'mock';
    
    switch (aiProvider) {
      case 'mock':
        this.provider = new MockAIProvider();
        break;
      // Future: Add QwenAIProvider, OpenAIProvider
      default:
        console.warn(`Unknown AI provider: ${aiProvider}, falling back to mock`);
        this.provider = new MockAIProvider();
    }
  }
  
  async generateTaskDraft(prompt: string): Promise<AITaskDraft> {
    try {
      return await this.provider.generateTaskDraft(prompt);
    } catch (error) {
      console.error('AI generateTaskDraft failed:', error);
      // Fallback to mock
      const mockProvider = new MockAIProvider();
      return await mockProvider.generateTaskDraft(prompt);
    }
  }
  
  async suggestReward(description: string): Promise<AIRewardSuggestion> {
    try {
      return await this.provider.suggestReward(description);
    } catch (error) {
      console.error('AI suggestReward failed:', error);
      // Fallback to mock
      const mockProvider = new MockAIProvider();
      return await mockProvider.suggestReward(description);
    }
  }
  
  async suggestHelperProfile(description: string): Promise<AIHelperProfile> {
    try {
      return await this.provider.suggestHelperProfile(description);
    } catch (error) {
      console.error('AI suggestHelperProfile failed:', error);
      // Fallback to mock
      const mockProvider = new MockAIProvider();
      return await mockProvider.suggestHelperProfile(description);
    }
  }
  
  async healthCheck(): Promise<{ status: 'ok' | 'degraded'; provider: string }> {
    try {
      // Test with a simple prompt
      await this.provider.generateTaskDraft('test');
      return { status: 'ok', provider: process.env.AI_PROVIDER || 'mock' };
    } catch (error) {
      return { status: 'degraded', provider: 'mock-fallback' };
    }
  }
}

// Singleton instance
export const aiService = new AIService();