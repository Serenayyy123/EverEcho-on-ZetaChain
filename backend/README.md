# EverEcho Backend - Profile & Task 存储服务

## 功能说明

实现 EverEcho MVP 的 Profile 和 Task 元数据存储与查询服务。

### P0-B1: Profile 存储服务
### P0-B2: Task Metadata 存储服务

### 冻结点遵守

**P0-B1 Profile**:
- ✅ 冻结点 1.4-22：Profile JSON schema 必填字段（nickname, city, skills, encryptionPubKey）
- ✅ 冻结点 2.2-P0-B1：流程固定（前端先上传 profile → backend 返回 profileURI）
- ✅ 冻结点 3.2：JSON 字段命名必须一致

**P0-B2 Task**:
- ✅ 冻结点 1.4-22：Task JSON schema 必填字段（title, description, contactsEncryptedPayload, createdAt）
- ✅ 冻结点 2.2-P0-B2：流程固定（Creator 前端先上传 task → backend 返回 taskURI）
- ✅ 冻结点 3.2：JSON 字段命名必须一致
- ✅ 冻结点 4.3：taskURI 仅存 URI，不做 hash 校验

### API 端点

#### Profile API

##### POST /api/profile
创建或更新 Profile（幂等）

**请求体**：
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "nickname": "Alice",
  "city": "Shanghai",
  "skills": ["Solidity", "TypeScript"],
  "encryptionPubKey": "0xabcdef1234567890"
}
```

**响应**：
```json
{
  "success": true,
  "profileURI": "https://api.everecho.io/profile/0x1234567890123456789012345678901234567890.json"
}
```

##### GET /api/profile/:address
获取 Profile JSON

**响应**：
```json
{
  "nickname": "Alice",
  "city": "Shanghai",
  "skills": ["Solidity", "TypeScript"],
  "encryptionPubKey": "0xabcdef1234567890"
}
```

#### Task API

##### POST /api/task
创建或更新 Task（幂等）

**请求体**：
```json
{
  "taskId": "1",
  "title": "Build a website",
  "description": "Need a responsive website with React",
  "contactsEncryptedPayload": "encrypted_contacts_data_here",
  "createdAt": 1700000000
}
```

**响应**：
```json
{
  "success": true,
  "taskURI": "https://api.everecho.io/task/1.json"
}
```

##### GET /api/task/:taskId
获取 Task JSON

**响应**：
```json
{
  "title": "Build a website",
  "description": "Need a responsive website with React",
  "contactsEncryptedPayload": "encrypted_contacts_data_here",
  "createdAt": 1700000000
}
```

## 本地运行

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 5. 测试 API

**创建 Profile**：
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "nickname": "Alice",
    "city": "Shanghai",
    "skills": ["Solidity", "TypeScript"],
    "encryptionPubKey": "0xabcdef1234567890"
  }'
```

**获取 Profile**：
```bash
curl http://localhost:3000/api/profile/0x1234567890123456789012345678901234567890
```

**创建 Task**：
```bash
curl -X POST http://localhost:3000/api/task \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "1",
    "title": "Build a website",
    "description": "Need a responsive website with React",
    "contactsEncryptedPayload": "encrypted_contacts_data_here",
    "createdAt": 1700000000
  }'
```

**获取 Task**：
```bash
curl http://localhost:3000/api/task/1
```

## 运行测试

```bash
npm test
```

测试覆盖：

**Profile**:
- ✅ Schema 校验（缺字段返回 400）
- ✅ 幂等性（同一 address 覆盖旧数据）
- ✅ 地址格式校验
- ✅ Profile 查询（存在/不存在）

**Task**:
- ✅ Schema 校验（缺字段返回 400）
- ✅ createdAt 类型处理（number/string）
- ✅ 幂等性（同一 taskId 覆盖旧数据）
- ✅ Task 查询（存在/不存在）

## 数据库管理

**查看数据库**：
```bash
npm run prisma:studio
```

**重置数据库**：
```bash
rm prisma/dev.db
npm run prisma:migrate
```

## 技术栈

- Node.js + TypeScript
- Express (Web 框架)
- Prisma (ORM)
- SQLite (数据库)
- Jest + Supertest (测试)

## 目录结构

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma 数据模型
├── src/
│   ├── models/
│   │   ├── Profile.ts         # Profile 类型定义与校验
│   │   └── Task.ts            # Task 类型定义与校验
│   ├── services/
│   │   ├── profileService.ts  # Profile 业务逻辑
│   │   └── taskService.ts     # Task 业务逻辑
│   ├── routes/
│   │   ├── profile.ts         # Profile 路由
│   │   ├── profile.test.ts    # Profile 测试
│   │   ├── task.ts            # Task 路由
│   │   └── task.test.ts       # Task 测试
│   └── index.ts               # 服务器入口
├── package.json
├── tsconfig.json
└── README.md
```
