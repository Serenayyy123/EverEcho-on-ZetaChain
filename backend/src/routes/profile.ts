import { Router, Request, Response } from 'express';
import { validateProfileInput } from '../models/Profile';
import { upsertProfile, getProfile, generateProfileURI } from '../services/profileService';

const router = Router();

/**
 * POST /api/profile
 * 创建或更新 Profile
 * 冻结点 1.4-22：必须校验 schema，缺字段直接 400
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Schema 校验
    const validation = validateProfileInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid profile data',
        details: validation.errors,
      });
    }

    // 存储 Profile
    await upsertProfile(req.body);

    // 返回 profileURI
    const profileURI = generateProfileURI(req.body.address);

    res.status(200).json({
      success: true,
      profileURI,
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/profile/:address
 * 获取 Profile JSON
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // 地址格式校验
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address',
      });
    }

    const profile = await getProfile(address);

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
      });
    }

    // 返回符合 schema 的 JSON（冻结点 3.2）
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
