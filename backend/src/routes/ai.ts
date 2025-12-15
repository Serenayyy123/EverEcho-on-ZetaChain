/**
 * AI Routes - Backend API endpoints for AI services
 * Stage 4.3-A: API Layer
 * 
 * 🔒 CODE FREEZE: These routes are completely off-chain
 * ❌ Do NOT access contracts, wallets, or trigger transactions
 * ✅ Only provide AI suggestions and health checks
 */

import express from 'express';
import { aiService } from '../services/ai/aiService';

const router = express.Router();

/**
 * GET /api/ai/health
 * Health check for AI service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await aiService.healthCheck();
    res.json({
      ...health,
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 服务仅提供建议，不执行任何链上操作'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      provider: 'unknown',
      error: 'Health check failed',
      disclaimer: 'AI 服务仅提供建议，不执行任何链上操作'
    });
  }
});

/**
 * POST /api/ai/generate-task
 * Generate task draft from natural language prompt
 */
router.post('/generate-task', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string',
        disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
      });
    }
    
    if (prompt.length > 500) {
      return res.status(400).json({
        error: 'Prompt too long (max 500 characters)',
        disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
      });
    }
    
    // Set timeout for AI call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 10000);
    });
    
    const aiPromise = aiService.generateTaskDraft(prompt.trim());
    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    res.json(result);
  } catch (error) {
    console.error('AI generate-task error:', error);
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
    });
  }
});

/**
 * POST /api/ai/suggest-reward
 * Suggest reward amount based on task description
 */
router.post('/suggest-reward', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description is required and must be a string',
        disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
      });
    }
    
    if (description.length > 2000) {
      return res.status(400).json({
        error: 'Description too long (max 2000 characters)',
        disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
      });
    }
    
    // Set timeout for AI call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 10000);
    });
    
    const aiPromise = aiService.suggestReward(description.trim());
    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    res.json(result);
  } catch (error) {
    console.error('AI suggest-reward error:', error);
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      disclaimer: 'AI 建议仅供参考，所有链上操作需用户手动确认'
    });
  }
});

/**
 * POST /api/ai/suggest-helper-profile
 * Suggest helper profile based on task description
 */
router.post('/suggest-helper-profile', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description is required and must be a string',
        disclaimer: '仅供参考，不代表真实撮合'
      });
    }
    
    if (description.length > 2000) {
      return res.status(400).json({
        error: 'Description too long (max 2000 characters)',
        disclaimer: '仅供参考，不代表真实撮合'
      });
    }
    
    // Set timeout for AI call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 10000);
    });
    
    const aiPromise = aiService.suggestHelperProfile(description.trim());
    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    res.json(result);
  } catch (error) {
    console.error('AI suggest-helper-profile error:', error);
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      disclaimer: '仅供参考，不代表真实撮合'
    });
  }
});

export default router;