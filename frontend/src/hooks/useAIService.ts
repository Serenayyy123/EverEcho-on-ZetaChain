/**
 * AI Service Hook - Frontend AI Integration
 * Stage 4.3-B: AI Task Draft Generation
 * 
 * 🔒 CODE FREEZE: This hook is completely off-chain
 * ❌ Does NOT access contracts, private keys, or trigger transactions
 * ✅ Only provides AI suggestions and draft content
 */

import { useState } from 'react';

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

const AI_API_BASE = import.meta.env.VITE_AI_API_BASE || 'http://localhost:3001/api/ai';

export function useAIService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTaskDraft = async (prompt: string): Promise<AITaskDraft | null> => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AI_API_BASE}/generate-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI service unavailable';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestReward = async (description: string): Promise<AIRewardSuggestion | null> => {
    if (!description.trim()) {
      setError('Description cannot be empty');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AI_API_BASE}/suggest-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI service unavailable';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestHelperProfile = async (description: string): Promise<AIHelperProfile | null> => {
    if (!description.trim()) {
      setError('Description cannot be empty');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AI_API_BASE}/suggest-helper-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI service unavailable';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${AI_API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    generateTaskDraft,
    suggestReward,
    suggestHelperProfile,
    checkHealth,
    loading,
    error,
  };
}