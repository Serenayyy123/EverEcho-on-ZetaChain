# Step A4 执行计划：Beta 准备 + UI 美化 + 反馈闭环

**目标**: 将测试网演示版升级为可小规模 Beta 试用的版本

**约束**: 所有冻结点保持不变，只做 UI/UX/文档/监控层面升级

---

## 执行阶段

### 阶段 1: UI 美化与可用性提升（G1）

**时间**: 4-6 小时

#### 1.1 统一设计语言
- [ ] 优化全局样式变量（颜色、字体、间距）
- [ ] 统一按钮、卡片、表单样式
- [ ] 优化状态颜色（Open/InProgress/Submitted/Completed/Cancelled）
- [ ] 改进 loading/success/error 状态显示

#### 1.2 核心页面优化
- [ ] **Home.tsx**: 优化欢迎界面，添加功能介绍
- [ ] **Register.tsx**: 改进表单体验，添加进度提示
- [ ] **TaskSquare.tsx**: 优化任务卡片，改进筛选体验
- [ ] **TaskDetail.tsx**: 优化详情展示，改进操作按钮提示
- [ ] **PublishTask.tsx**: 改进表单验证，添加余额检查提示
- [ ] **Profile.tsx**: 优化信息展示，改进任务历史

#### 1.3 防呆与引导
- [ ] 未注册用户引导
- [ ] 余额不足提示
- [ ] chainId 不匹配阻断
- [ ] 超时状态明确提示
- [ ] Fix/Terminate 条件说明

#### 1.4 移动端适配
- [ ] 响应式布局优化
- [ ] 触摸友好的按钮尺寸
- [ ] 移动端导航优化

---

### 阶段 2: Beta 试用包准备（G2）

**时间**: 2-3 小时

#### 2.1 试用文档
- [ ] `A4_BETA_GUIDE.md` - Beta 试用指南
- [ ] `A4_DEPLOYMENT.md` - 部署指南（测试网/准主网）
- [ ] `A4_TRIAL_ISSUES.md` - 问题收集模板
- [ ] `A4_PATCH_NOTES.md` - Patch 记录模板

#### 2.2 Demo Seed 增强
- [ ] 验证 A3 Patch 已应用
- [ ] 添加使用说明
- [ ] 测试模板功能

#### 2.3 反馈闭环
- [ ] 问题收集流程
- [ ] Patch 应用流程
- [ ] 试用者支持渠道

---

### 阶段 3: 稳定性与监控（G3）

**时间**: 2-3 小时

#### 3.1 前端监控
- [ ] 关键 hooks 错误捕获
- [ ] Toast 错误提示
- [ ] 可复制错误详情
- [ ] 重试机制

#### 3.2 后端健康检查
- [ ] 创建 `healthz.ts` 路由
- [ ] 检查数据库连接
- [ ] 检查 RPC 连接
- [ ] 挂载到主应用

#### 3.3 降级与重试
- [ ] Metadata 加载失败处理
- [ ] RPC 错误提示
- [ ] 网络切换引导

---

## 产出物清单

### 前端文件（必做）

**页面优化**:
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/TaskSquare.tsx`
- `frontend/src/pages/TaskDetail.tsx`
- `frontend/src/pages/PublishTask.tsx`
- `frontend/src/pages/Profile.tsx`

**UI 组件**:
- `frontend/src/components/ui/Toast.tsx` (新增)
- `frontend/src/components/ui/ErrorBoundary.tsx` (新增)
- `frontend/src/styles/globals.css` (优化)

**工具**:
- `frontend/src/utils/errorHandler.ts` (新增)
- `frontend/src/utils/demoSeed.ts` (已完成)

---

### 后端文件（必做）

- `backend/src/routes/healthz.ts` (新增)
- `backend/src/index.ts` (修改，挂载 healthz)

---

### 文档文件（必做）

- `docs/A4_BETA_GUIDE.md`
- `docs/A4_DEPLOYMENT.md`
- `docs/A4_TRIAL_ISSUES.md`
- `docs/A4_PATCH_NOTES.md`
- `docs/A4_EXECUTION_PLAN.md` (本文档)

---

## 验收标准

### G1: UI 美化
- [ ] 设计语言统一
- [ ] 核心页面可用性达标
- [ ] 防呆与引导完善
- [ ] 移动端基础可用

### G2: Beta 试用包
- [ ] 文档完整可用
- [ ] Demo Seed 功能完善
- [ ] 反馈闭环建立

### G3: 稳定性与监控
- [ ] 前端错误可见
- [ ] 后端健康检查
- [ ] 降级与重试机制

### 冻结点验证
- [ ] 所有冻结点保持不变
- [ ] 无业务逻辑修改
- [ ] 仅 UI/UX/文档/监控层面

---

## 时间估算

| 阶段 | 预计时间 | 关键产出 |
|------|---------|---------|
| G1: UI 美化 | 4-6h | 优化后的 6 个页面 |
| G2: Beta 试用包 | 2-3h | 4 个文档 + Demo Seed |
| G3: 稳定性监控 | 2-3h | 健康检查 + 错误处理 |
| **总计** | **8-12h** | **完整 Beta 版本** |

---

## 执行顺序

1. **先做 G3**（稳定性基础）
   - 后端健康检查
   - 前端错误处理

2. **再做 G1**（UI 美化）
   - 全局样式
   - 页面优化

3. **最后 G2**（文档）
   - Beta 指南
   - 试用材料

---

## 成功标准

### 必达标准
- ✅ 三条旅程可完整走通
- ✅ 外部试用者可独立使用
- ✅ 错误可见且可反馈
- ✅ 所有冻结点不变

### 质量标准
- ✅ UI 体验达到 Beta 级别
- ✅ 文档清晰完整
- ✅ 监控覆盖关键路径
- ✅ 移动端基础可用

---

**开始执行**: 2024-XX-XX  
**预计完成**: 2024-XX-XX  
**状态**: 准备开始
