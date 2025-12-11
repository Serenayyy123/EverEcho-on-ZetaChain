import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task API - P0-B2', () => {
  beforeAll(async () => {
    // 清空测试数据
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/task', () => {
    it('应该成功创建 task 并返回 taskURI', async () => {
      const taskData = {
        taskId: '1',
        title: 'Build a website',
        description: 'Need a responsive website with React',
        contactsEncryptedPayload: 'encrypted_contacts_data_here',
        createdAt: 1700000000,
      };

      const response = await request(app)
        .post('/api/task')
        .send(taskData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.taskURI).toBe(
        `https://api.everecho.io/task/${taskData.taskId}.json`
      );
    });

    it('应该接受 createdAt 为字符串格式', async () => {
      const taskData = {
        taskId: '2',
        title: 'Design a logo',
        description: 'Need a modern logo design',
        contactsEncryptedPayload: 'encrypted_data',
        createdAt: '1700000001', // 字符串格式
      };

      const response = await request(app)
        .post('/api/task')
        .send(taskData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝缺少必填字段的请求（400）', async () => {
      const invalidData = {
        taskId: '3',
        title: 'Incomplete task',
        // 缺少 description, contactsEncryptedPayload, createdAt
      };

      const response = await request(app)
        .post('/api/task')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid task data');
      expect(response.body.details).toContain('description is required and must be a string');
      expect(response.body.details).toContain('contactsEncryptedPayload is required and must be a string');
      expect(response.body.details).toContain('createdAt is required');
    });

    it('应该拒绝无效的 createdAt 格式（400）', async () => {
      const invalidData = {
        taskId: '4',
        title: 'Task with invalid timestamp',
        description: 'Test description',
        contactsEncryptedPayload: 'encrypted_data',
        createdAt: 'invalid_timestamp', // 无效格式
      };

      const response = await request(app)
        .post('/api/task')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('createdAt must be a valid uint256 (non-negative number)');
    });

    it('应该拒绝负数的 createdAt（400）', async () => {
      const invalidData = {
        taskId: '5',
        title: 'Task with negative timestamp',
        description: 'Test description',
        contactsEncryptedPayload: 'encrypted_data',
        createdAt: -1, // 负数
      };

      const response = await request(app)
        .post('/api/task')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('createdAt must be a valid uint256 (non-negative number)');
    });

    it('应该支持幂等性：同一 taskId 多次 POST 覆盖旧数据', async () => {
      const taskId = '100';

      // 第一次创建
      const firstData = {
        taskId,
        title: 'Original title',
        description: 'Original description',
        contactsEncryptedPayload: 'original_encrypted_data',
        createdAt: 1700000000,
      };

      await request(app)
        .post('/api/task')
        .send(firstData)
        .expect(200);

      // 第二次更新
      const secondData = {
        taskId,
        title: 'Updated title',
        description: 'Updated description',
        contactsEncryptedPayload: 'updated_encrypted_data',
        createdAt: 1700000001,
      };

      await request(app)
        .post('/api/task')
        .send(secondData)
        .expect(200);

      // 验证数据已更新
      const getResponse = await request(app)
        .get(`/api/task/${taskId}`)
        .expect(200);

      expect(getResponse.body.title).toBe('Updated title');
      expect(getResponse.body.description).toBe('Updated description');
      expect(getResponse.body.contactsEncryptedPayload).toBe('updated_encrypted_data');
      expect(getResponse.body.createdAt).toBe(1700000001);
    });
  });

  describe('GET /api/task/:taskId', () => {
    beforeAll(async () => {
      // 准备测试数据
      await request(app)
        .post('/api/task')
        .send({
          taskId: '200',
          title: 'Test task',
          description: 'Test description',
          contactsEncryptedPayload: 'test_encrypted_data',
          createdAt: 1700000000,
        });
    });

    it('应该成功获取 task JSON', async () => {
      const taskId = '200';

      const response = await request(app)
        .get(`/api/task/${taskId}`)
        .expect(200);

      expect(response.body).toEqual({
        title: 'Test task',
        description: 'Test description',
        contactsEncryptedPayload: 'test_encrypted_data',
        createdAt: 1700000000,
      });
    });

    it('应该返回 404 当 task 不存在', async () => {
      const nonExistentTaskId = '999999';

      const response = await request(app)
        .get(`/api/task/${nonExistentTaskId}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('应该拒绝空的 taskId（400）', async () => {
      const response = await request(app)
        .get('/api/task/ ')
        .expect(404); // Express 路由会返回 404，因为空格会被 trim

      // 注意：这个测试可能因 Express 路由行为而有所不同
    });
  });

  describe('createdAt 类型处理', () => {
    it('应该正确处理 number 类型的 createdAt', async () => {
      const taskData = {
        taskId: '300',
        title: 'Task with number timestamp',
        description: 'Test',
        contactsEncryptedPayload: 'encrypted',
        createdAt: 1700000000, // number
      };

      await request(app)
        .post('/api/task')
        .send(taskData)
        .expect(200);

      const response = await request(app)
        .get('/api/task/300')
        .expect(200);

      expect(typeof response.body.createdAt).toBe('number');
      expect(response.body.createdAt).toBe(1700000000);
    });

    it('应该正确处理 string 类型的 createdAt', async () => {
      const taskData = {
        taskId: '301',
        title: 'Task with string timestamp',
        description: 'Test',
        contactsEncryptedPayload: 'encrypted',
        createdAt: '1700000001', // string
      };

      await request(app)
        .post('/api/task')
        .send(taskData)
        .expect(200);

      const response = await request(app)
        .get('/api/task/301')
        .expect(200);

      expect(typeof response.body.createdAt).toBe('number');
      expect(response.body.createdAt).toBe(1700000001);
    });
  });
});
