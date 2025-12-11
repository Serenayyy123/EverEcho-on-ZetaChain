import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Profile API - P0-B1', () => {
  beforeAll(async () => {
    // 清空测试数据
    await prisma.profile.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/profile', () => {
    it('应该成功创建 profile 并返回 profileURI', async () => {
      const profileData = {
        address: '0x1234567890123456789012345678901234567890',
        nickname: 'Alice',
        city: 'Shanghai',
        skills: ['Solidity', 'TypeScript'],
        encryptionPubKey: '0xabcdef1234567890',
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profileURI).toBe(
        `https://api.everecho.io/profile/${profileData.address}.json`
      );
    });

    it('应该拒绝缺少必填字段的请求（400）', async () => {
      const invalidData = {
        address: '0x1234567890123456789012345678901234567890',
        nickname: 'Bob',
        // 缺少 city, skills, encryptionPubKey
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid profile data');
      expect(response.body.details).toContain('city is required and must be a string');
      expect(response.body.details).toContain('skills is required and must be an array');
      expect(response.body.details).toContain('encryptionPubKey is required and must be a string');
    });

    it('应该拒绝无效的 address 格式（400）', async () => {
      const invalidData = {
        address: 'invalid-address',
        nickname: 'Charlie',
        city: 'Beijing',
        skills: ['React'],
        encryptionPubKey: '0xabcdef',
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('address must be a valid Ethereum address');
    });

    it('应该支持幂等性：同一 address 多次 POST 覆盖旧数据', async () => {
      const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      // 第一次创建
      const firstData = {
        address,
        nickname: 'David',
        city: 'Hangzhou',
        skills: ['Vue'],
        encryptionPubKey: '0x111111',
      };

      await request(app)
        .post('/api/profile')
        .send(firstData)
        .expect(200);

      // 第二次更新
      const secondData = {
        address,
        nickname: 'David Updated',
        city: 'Shenzhen',
        skills: ['React', 'Node.js'],
        encryptionPubKey: '0x222222',
      };

      await request(app)
        .post('/api/profile')
        .send(secondData)
        .expect(200);

      // 验证数据已更新
      const getResponse = await request(app)
        .get(`/api/profile/${address}`)
        .expect(200);

      expect(getResponse.body.nickname).toBe('David Updated');
      expect(getResponse.body.city).toBe('Shenzhen');
      expect(getResponse.body.skills).toEqual(['React', 'Node.js']);
      expect(getResponse.body.encryptionPubKey).toBe('0x222222');
    });
  });

  describe('GET /api/profile/:address', () => {
    beforeAll(async () => {
      // 准备测试数据
      await request(app)
        .post('/api/profile')
        .send({
          address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          nickname: 'Eve',
          city: 'Guangzhou',
          skills: ['Python', 'Go'],
          encryptionPubKey: '0x333333',
        });
    });

    it('应该成功获取 profile JSON', async () => {
      const address = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

      const response = await request(app)
        .get(`/api/profile/${address}`)
        .expect(200);

      expect(response.body).toEqual({
        nickname: 'Eve',
        city: 'Guangzhou',
        skills: ['Python', 'Go'],
        encryptionPubKey: '0x333333',
      });
    });

    it('应该返回 404 当 profile 不存在', async () => {
      const nonExistentAddress = '0xcccccccccccccccccccccccccccccccccccccccc';

      const response = await request(app)
        .get(`/api/profile/${nonExistentAddress}`)
        .expect(404);

      expect(response.body.error).toBe('Profile not found');
    });

    it('应该拒绝无效的 address 格式（400）', async () => {
      const response = await request(app)
        .get('/api/profile/invalid-address')
        .expect(400);

      expect(response.body.error).toBe('Invalid Ethereum address');
    });
  });
});
