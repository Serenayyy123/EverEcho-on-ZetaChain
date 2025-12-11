# EverEcho MVP - 产品需求文档（PRD）



## 1. 需求复述



### 1.1 产品定位

EverEcho 是一个基于 Web3 的互助与价值流动生态系统。用户通过帮助他人获得内部 Token（EOCHO），Token 仅在生态内流通，用于交换技能、时间或资源，形成互相回响的价值网络。



### 1.2 核心功能模块



#### 模块 1：钱包连接与注册（主页入口）

- **功能点**：

  - 用户通过 Web3 钱包（如 MetaMask）连接

  - 首次连接后进入注册流程

  - 注册信息包括：昵称、城市标签、技能 tags（多选）

  - <!-- UPDATED --> **注册信息存储方案（MVP 定版）**：

    - **链上**：`isRegistered[address] = true` + `profileURI[address]`（指向链下 JSON 的 URI）

    - **链下**：完整 profile JSON（昵称、城市、技能 tags）存储在后端数据库

    - **MVP 不支持修改 profile**：注册后 profileURI 不可变更，简化实现

  - **关键规则**：新用户首次注册时，系统自动 mint 100 枚 EOCHO Token 并空投到用户钱包地址

  - **防重复**：每个地址（address）只允许首次 mint 一次，已注册用户再次连接不触发 mint

- **【钉子 1：注册的唯一链上入口】**

  - <!-- UPDATED 架构依赖 --> 注册必须通过链上 `register(string profileURI)` 函数（在**独立 Register 合约**中）。

  - `register()` 成功后：设置 `isRegistered=true`、存储 `profileURI`，并触发 `mintInitial(100 EOCHO)`。

  - **前端不得直接调用 `mintInitial`**，`register()` 是唯一入口。

  - TaskEscrow 合约构造函数传入 Register 合约地址，通过 `registerContract.isRegistered(address)` 判断用户是否已注册。



#### 模块 1.5：Token 经济模型

- **初始供应**：

  - 每个新用户注册时 mint 100 EOCHO

  - Token 总量上限：10,000,000 枚（1000 万）

  

- <!-- UPDATED --> **手续费机制（MVP 定版）**：

  - 每笔任务完成时，从 Creator 抵押的 R 中扣除 2% 作为平台手续费

  - 具体结算方式：

    - Helper 实际收到：`0.98 * R`

    - 平台手续费（销毁）：`0.02 * R`

    - Helper 保证金 R 全额退回

  - 手续费直接销毁（burn），减少流通量

  - 例如：任务奖励 100 EOCHO，Helper 实际收到 98 EOCHO，2 EOCHO 被销毁，Helper 保证金 100 EOCHO 退回

  

- <!-- UPDATED --> **达到上限后的处理（MVP 定版）**：

  - 当总供应量达到 10,000,000 枚时，**仍允许新用户注册**

  - 但 `mintInitial` 数量变为 0（不再 mint）

  - 合约触发事件 `CapReached`，前端提示用户"需通过完成任务获得 EOCHO"；`CapReached` 事件**仅由 EOCHO Token 合约在 `mintInitial()` 内触发**，Register 合约不重复触发同名事件。

  - 新用户可通过接受低门槛任务（如 ≤ 10 EOCHO 奖励）开始参与



#### 模块 2：用户信息界面（Profile）

- **功能点**：

  - 显示当前钱包地址的 EOCHO Token 余额

  - 显示历史记录，包括：

    - **作为 Creator**：我发布过哪些任务（列表 + 状态）

    - **作为 Helper**：我帮助过谁 / 接过哪些任务（列表 + 状态）

    - 每条记录显示：任务标题、状态、金额变动（抵押/奖励/退回）、时间戳



#### 模块 3：互助/任务广场（核心业务流程）

- **资金与结算规则**（核心机制）：

  - Creator 发布任务时，必须抵押 R 枚 EOCHO（R 由 Creator 设定，作为任务奖励）

  - Helper 接受任务时，必须抵押与 Creator 相同数量 R 枚 EOCHO（作为履约保证金）

  - 任务最终完成时：

    - Creator 抵押的 R 枚 EOCHO → 直接转账给 Helper（作为奖励）

    - Helper 抵押的 R 枚 EOCHO → 退回给 Helper（返还保证金）

  - 任务的实际交付（工作内容、聊天、联系方式交换）在链下进行，链上仅负责状态流转和资金锁定/结算

- **【钉子 3：MVP 的最小链下存储方案】**

  - MVP 阶段：任务内容/提交物/联系方式全部链下存储。

  - 链上只存 `taskURI`（指向链下 JSON 的 URI），**不做 hash 校验、不上 The Graph/复杂索引**。

  - 联系方式来源为 **任务级**：Creator 发布任务时填写一次；仅在 InProgress 及之后对双方展示。

  - <!-- UPDATED --> **联系方式隐私保护（MVP 定版）**：

    - 联系方式在链下数据库中加密存储（使用 AES-256-GCM）

    - **加密方案（补丁 1 定版）**：

      - 用户注册时，链下 profile JSON **必须包含** `encryptionPubKey`（独立加密公钥，x25519 或 secp256k1-encryption key）

      - **地址本身不可派生公钥**，不得以 taskId+地址直接派生密钥

      - 服务端生成随机 DEK（Data Encryption Key）加密联系方式

      - DEK 分别使用 Creator 和 Helper 的 `encryptionPubKey` **包裹 DEK** 并存储

    - **解密流程**：

      1. 前端用户通过钱包签名验证身份（签名消息包含 taskId）

      2. 后端验证签名 + 检查任务状态（必须 >= InProgress）

      3. 后端返回该用户对应的包裹 DEK

      4. 前端用私钥解包 DEK，再解密联系方式

    - **访问控制**：contacts 仅在任务状态达到 **InProgress/Submitted/Completed** 时允许解密/拉取

    - **信任模型（MVP 定版）**：服务端负责生成 DEK 并加密 contacts，DEK 用双方 `encryptionPubKey` 分别包裹；**MVP 默认信任服务端可解密**，V2 再做零信任/端到端加密。

    - **encryptionPubKey 缺失时的失败语义**：若用户注册时未提供合法 `encryptionPubKey`，**注册直接 revert（必须先提供合法 key）**。



- **任务状态流转**（必须严格遵循）：

  - **Open（待接单）**：

    - Creator 已抵押 R 枚 EOCHO（奖励锁定在合约中）

    - 任何已注册的 Helper 可以接单（接单时需抵押相同数量 R）

    - Creator 可以随时取消（拿回抵押的 R）

    - 超过 T_open（如 7 天）无人接单，任何人可触发超时取消，Creator 拿回 R

  

  - **InProgress（进行中）**：

    - Helper 已抵押 R 枚 EOCHO（保证金锁定）

    - 双方进入链下协作阶段

    - **关键隐私功能**：进入 InProgress 后，前端互见对方联系方式（链下存储，通过状态触发显示）

    - **关键限制（防 Grieving Attack）**：InProgress 状态下，Creator **不可单方面取消任务**

    - Helper 完成工作后，点击"提交任务（Submit Work）"按钮 → 状态变更为 Submitted

    - <!-- UPDATED --> **协商终止机制（MVP 定版）**：

      - 双方协商一致可以提前终止任务（例如需求变更、无法完成等情况）

      - **链上字段**：`terminateRequestedBy`（address，记录谁发起请求）、`terminateRequestedAt`（uint256，请求时间戳）

      - **流程**：

        1. 任一方调用 `requestTerminate(taskId)` → 记录 `terminateRequestedBy` 和 `terminateRequestedAt`

        2. 对方调用 `agreeTerminate(taskId)` → 双方各自拿回抵押的 R，任务状态变更为 Cancelled

        3. 如对方 48 小时内未响应，任何人可调用 `terminateTimeout(taskId)` → 请求失效，重置字段为 0

      - **资金流**：双方都同意后，Creator 拿回 R，Helper 拿回 R，任务关闭为 Cancelled

    - 超过 T_progress（如 14 天）仍未提交，Creator 或任意一方可触发超时判定，双方拿回各自抵押，任务关闭为 Cancelled

  

  - **Submitted（待验收）**：

    - Helper 已提交工作，任务进入锁定验收期

    - **Submitted 期间 Creator 不能取消任务**

    - <!-- UPDATED --> **MVP 极简争议处理**：Submitted 有三条路径：

      - **路径 A（正常验收）**：Creator 满意 → 点击"确认完成（Confirm Complete）" → 资金结算（Creator 的 0.98R 转给 Helper，0.02R burn，Helper 的 R 退回 Helper）

      - **路径 B（请求修正，仅一次）**：Creator 不满意 → 点击"Request Fix" → `T_review` 延长 3 天，Helper 可重新提交（链下更新，**submittedAt 不刷新**）；每个任务仅允许一次 Request Fix

      - **路径 C（Creator 失踪保护）**：超过 T_review（如 3 天，或延长后的时间）Creator 不操作，任何人可触发自动完成并结算

  

  - **Completed（已完成）**：

    - <!-- UPDATED --> 资金已结算完成

    - Creator 抵押的 R → Helper 实际收到 0.98R，0.02R 已销毁

    - Helper 抵押的 R → 已全额退回 Helper

  

  - **Cancelled（已取消/超时关闭）**：

    - 任务被取消或超时关闭

    - 资金已按规则退回



#### 模块 4：任务广场列表 + 搜索

- **功能点**：

  - 任务列表显示：标题、内容摘要、奖励金额 R、发布者标签（城市/技能）、任务状态

  - 支持搜索/过滤功能（可按关键词、城市、技能、状态筛选）

  - Helper 点击"接收任务"按钮时，前端检查余额，不足时提示，充足时调用合约接口并抵押 R

  - 任务状态在列表和详情页中清晰可见



### 1.3 超时与取消规则（必须严格遵循）



**时间戳记录**：

- `createdAt`：任务创建时间

- `acceptedAt`：任务被接受时间（进入 InProgress）

- `submittedAt`：任务被提交时间（进入 Submitted）

- <!-- UPDATED --> `terminateRequestedAt`：协商终止请求时间（InProgress 状态）

- <!-- UPDATED --> `fixRequestedAt`：修正请求时间（Submitted 状态）



**超时阈值**：

- `T_open`：Open 状态超时（例如 7 天）

- `T_progress`：InProgress 状态超时（例如 14 天）

- `T_review`：Submitted 验收超时（例如 3 天）

- <!-- UPDATED --> `T_terminate_response`：协商终止响应超时（48 小时）

- <!-- UPDATED --> `T_fix_extension`：Request Fix 延长时间（3 天）



**取消/超时规则**：



1. **Open 状态**：

   - Creator 可随时取消 → Creator 拿回奖励 R

   - 超过 T_open 无人接受 → 任何人可触发超时取消 → Creator 拿回奖励 R



2. <!-- UPDATED --> **InProgress 状态**（防止恶意取消）：

   - Creator 不可单方面取消

   - 协商终止：任一方发起 → 对方 48h 内同意 → 双方各拿回 R → Cancelled

   - 超过 T_progress 仍未提交 → Creator 或任意一方可触发超时判定 → **Creator 拿回 R，Helper 拿回 R** → 任务关闭为 Cancelled



3. <!-- UPDATED --> **Submitted 状态**：

   - Creator 不能取消

   - Creator 可点击一次 Request Fix → T_review 延长 3 天

   - 超过 T_review（或延长后时间）Creator 不验收 → 任何人可触发自动完成并结算（Helper 得 0.98R，0.02R burn，Helper 保证金退回）



### 1.4 MVP 参数表（冻结定版）

<!-- UPDATED -->

以下参数为 MVP 阶段确定值，合约与前后端必须统一使用：

#### Token 参数

- `INITIAL_MINT = 100 * 10**18`：新用户首次注册 mint 数量（100 EOCHO）
- `CAP = 10_000_000 * 10**18`：Token 总量上限（1000 万 EOCHO）
- `FEE_BPS = 200`：手续费基点（200 = 2%）；**手续费精度与取整规则**：`fee = reward * FEE_BPS / 10000`（uint256 下取整），`helperReceived = reward - fee`

#### 超时参数

- `T_OPEN = 7 days`：Open 状态超时时间
- `T_PROGRESS = 14 days`：InProgress 状态超时时间
- `T_REVIEW = 3 days`：Submitted 验收超时时间
- `T_TERMINATE_RESPONSE = 48 hours`：协商终止响应超时时间
- `T_FIX_EXTENSION = 3 days`：Request Fix 延长时间

#### 存储参数

- `profileStorage = profileURI`：用户 profile 存储方式（链上存 URI，链下存 JSON）
- `taskMetadataStorage = taskURI`：任务元数据存储方式（链上存 URI，链下存 JSON）
- `profileUpdateAllowed = false`：MVP 不支持修改 profile

#### 争议处理参数

- `maxFixRequests = 1`：每个任务最多允许 Request Fix 次数

#### 奖励范围参数

- <!-- UPDATED reward 策略定版 --> `MAX_REWARD = 1000 * 10**18`：任务奖励硬上限（1000 EOCHO），合约强制限制
- `recommendedMaxReward = 50 * 10**18`：推荐任务奖励上限（50 EOCHO），前端 UI 软提示，便于新用户参与

---



## 2. 用户流程（User Flow）



### 2.1 新用户注册流程

```

1. 用户访问首页

2. 点击"连接钱包" → 选择钱包（MetaMask 等）

3. 钱包连接成功 → 检查是否已注册

4. 未注册 → 进入注册页面

5. 填写：昵称、选择城市标签、选择技能 tags（多选）

6. 点击"完成注册"

7. 系统自动 mint 100 EOCHO 并空投到用户地址

8. 注册信息写入注册用户名单

9. 跳转到任务广场

```



### 2.2 已注册用户登录流程

```

1. 用户访问首页

2. 点击"连接钱包" → 选择钱包

3. 钱包连接成功 → 检查已注册 → 直接进入任务广场（或上次访问的页面）

```



### 2.3 Creator 发布任务流程

```

1. 用户在任务广场点击"发布任务"

2. 填写任务信息：

   - 标题

   - 详细描述

   - 奖励金额 R（需抵押的 EOCHO 数量）

3. 点击"发布任务"

4. 前端检查 EOCHO 余额是否 >= R

5. 余额不足 → 提示用户

6. 余额充足 → 调用合约接口，抵押 R 枚 EOCHO

7. 任务创建成功 → 状态为 Open

8. 任务出现在任务广场列表

```



### 2.4 Helper 接受任务流程

```

1. Helper 在任务广场浏览任务列表

2. 点击某个 Open 状态的任务，查看详情

3. 决定接受任务 → 点击"接收任务"

4. 前端检查 EOCHO 余额是否 >= R（任务要求的奖励金额）

5. 余额不足 → 提示用户

6. 余额充足 → 调用合约接口，抵押 R 枚 EOCHO

7. 任务状态变更为 InProgress

8. 前端显示 Creator 的联系方式（链下存储，通过状态触发）

9. Creator 前端显示 Helper 的联系方式

10. 双方开始链下协作

```



### 2.5 Helper 提交任务流程

```

1. Helper 完成工作后，在任务详情页点击"提交任务（Submit Work）"

2. 调用合约接口，状态变更为 Submitted

3. 任务进入验收期

4. Creator 收到通知（前端显示任务状态为 Submitted）

```



### 2.6 Creator 验收任务流程（正常路径）

<!-- UPDATED -->

```

1. Creator 在 Profile 或任务详情页看到 Submitted 状态的任务

2. Creator 查看 Helper 提交的工作内容（链下）

3. Creator 满意 → 点击"确认完成（Confirm Complete）"

4. 调用合约接口，触发资金结算：

   - Creator 抵押的 R 中：Helper 实际收到 0.98R，0.02R 被销毁

   - Helper 抵押的 R → 全额退回 Helper

5. 任务状态变更为 Completed

```



### 2.7 超时自动完成流程（Creator 失踪保护）

<!-- UPDATED -->

```

1. 任务处于 Submitted 状态

2. 超过 T_review（如 3 天，或 Request Fix 后延长的时间）Creator 未操作

3. 任何人（Helper 或其他用户）可触发"超时自动完成"

4. 调用合约接口，触发资金结算（同正常验收）：

   - Helper 实际收到 0.98R，0.02R 被销毁

   - Helper 保证金 R 全额退回

5. 任务状态变更为 Completed

```



### 2.8 Creator 取消任务流程（Open 状态）

```

1. 任务处于 Open 状态

2. Creator 在任务详情页点击"取消任务"

3. 调用合约接口，Creator 抵押的 R 退回 Creator

4. 任务状态变更为 Cancelled

```



### 2.9 超时取消流程（Open 状态）

```

1. 任务处于 Open 状态

2. 超过 T_open（如 7 天）无人接受

3. 任何人可触发"超时取消"

4. 调用合约接口，Creator 抵押的 R 退回 Creator

5. 任务状态变更为 Cancelled

```



### 2.10 InProgress 超时关闭流程

```

1. 任务处于 InProgress 状态

2. 超过 T_progress（如 14 天）仍未提交

3. Creator 或任意一方可触发"超时判定"

4. 调用合约接口：

   - Creator 抵押的 R 退回 Creator

   - Helper 抵押的 R 退回 Helper

5. 任务状态变更为 Cancelled

```

### 2.11 协商终止流程（InProgress 状态）

<!-- UPDATED -->

```

1. 任务处于 InProgress 状态

2. Creator 或 Helper 点击"请求终止任务"

3. 调用合约接口 requestTerminate(taskId)

4. 对方在任务详情页看到"对方请求终止任务"提示

5. 对方有两种选择：

   a. 点击"同意终止" → 调用 agreeTerminate(taskId) → 双方各拿回 R → Cancelled

   b. 48 小时内不操作 → 任何人可触发 terminateTimeout(taskId) → 请求失效

6. 如请求失效，发起方可再次发起请求

```

### 2.12 Creator 请求修正流程（Submitted 状态）

<!-- UPDATED -->

```

1. 任务处于 Submitted 状态

2. Creator 查看 Helper 提交的工作内容（链下）

3. Creator 不满意但认为可修正 → 点击"Request Fix"

4. 调用合约接口 requestFix(taskId)

5. T_review 延长 3 天，Helper 收到通知

6. Helper 可重新提交工作（链下更新，链上不重复调用 submitWork）

7. Creator 在延长期内验收：

   - 满意 → 点击"确认完成" → 正常结算

   - 仍不满意 → 等待延长期结束 → 自动完成并结算（Helper 得 0.98R）

8. 注意：每个任务仅允许一次 Request Fix

```



---



## 3. 页面/模块清单



### 3.1 前端页面模块



#### Home（首页/入口页）

- **功能**：

  - 钱包连接入口

  - 产品介绍/引导

  - 已连接钱包后显示用户基本信息（昵称、EOCHO 余额）

  - 导航栏：任务广场、我的 Profile、发布任务



#### Register（注册页）

- **功能**：

  - 表单：昵称（必填）、城市标签（下拉/选择）、技能 tags（多选）

  - 提交后触发首次 mint 100 EOCHO

  - 注册信息写入注册用户名单



#### Profile（用户信息页）

- **功能**：

  - 显示：昵称、城市、技能 tags、EOCHO 余额

  - 历史记录标签页：

    - **我发布的任务**：列表显示任务标题、状态、奖励金额、时间、操作按钮

    - **我接受的任务**：列表显示任务标题、状态、奖励金额、时间、操作按钮

  - 每条记录可点击查看详情



#### Task Square（任务广场）

- **功能**：

  - 任务列表展示（卡片式或列表式）

  - 每个任务卡片显示：标题、内容摘要、奖励 R、发布者标签（城市/技能）、状态、发布时间

  - 搜索框：支持关键词搜索

  - 过滤器：按城市、技能、状态筛选

  - "发布任务"按钮（跳转到发布任务页）

  - 点击任务卡片进入任务详情页



#### Task Detail（任务详情页）

- **功能**：

  - 完整任务信息：标题、详细描述、奖励 R、发布者信息、状态、时间戳

  - <!-- UPDATED --> **状态相关操作按钮**（根据当前用户角色和任务状态动态显示）：

    - Open 状态：Helper 显示"接收任务"，Creator 显示"取消任务"

    - InProgress 状态：

      - Helper 显示"提交任务"

      - Creator 和 Helper 都显示"请求终止任务"按钮

      - 如有终止请求，对方显示"同意终止"按钮

    - Submitted 状态：

      - Creator 显示"确认完成"和"Request Fix"（如未使用过）

      - Helper 显示"等待验收"

    - Completed 状态：显示"已完成"，无操作按钮

    - Cancelled 状态：显示"已取消"，无操作按钮

  - **联系方式显示**（InProgress 及之后状态）：

    - 显示对方联系方式（链下存储，通过状态触发）

  - 超时提示：显示剩余时间或已超时，提供"触发超时操作"按钮（如适用）



#### Publish Task（发布任务页）

- **功能**：

  - 表单：标题（必填）、详细描述（必填）、奖励金额 R（必填，数字输入）

  - 提交前检查 EOCHO 余额

  - 提交后调用合约接口，抵押 R 枚 EOCHO



### 3.2 后端/链下服务模块（如需要）



#### 用户注册信息存储服务

- **功能**：

  - <!-- UPDATED 补丁 1 --> 存储用户注册信息（昵称、城市、技能 tags、**encryptionPubKey**）

  - profile JSON 必须包含 `encryptionPubKey`（x25519 或 secp256k1-encryption key）

  - 提供查询接口：根据地址查询用户信息

  - 链下存储（数据库），链上存储 profileURI



#### 联系方式存储服务

- **功能**：

  - 存储用户联系方式（加密或明文，根据隐私策略）

  - 任务进入 InProgress 后，根据任务 ID 和用户角色返回对方联系方式

  - **关键**：不在链上明文存储联系方式，保护隐私



#### 任务链下数据存储服务（可选）

- **功能**：

  - 存储任务详细描述、提交的工作内容等（如链上存储成本高）

  - 提供查询接口



---



## 4. 链上/链下数据划分



### 4.1 必须链上存储的数据（原因）



#### EOCHO Token 合约数据

- **Token 余额**：每个地址的 EOCHO 余额（ERC20 标准）

- **总供应量**：Token 总供应量

- **原因**：资金安全、去中心化、不可篡改



#### 任务核心状态与资金数据（TaskEscrow 合约）

<!-- UPDATED -->

- **任务基础信息**：

  - `taskId`：任务唯一标识

  - `creator`：创建者地址

  - `helper`：接受者地址（Open 状态为 address(0)）

  - `reward`：奖励金额 R（EOCHO 数量）

  - `taskURI`：任务元数据 URI（指向链下 JSON）

  - `status`：任务状态（Open/InProgress/Submitted/Completed/Cancelled）

  - `createdAt`：创建时间戳

  - `acceptedAt`：接受时间戳（Open 状态为 0）

  - `submittedAt`：提交时间戳（Submitted 之前为 0）

  - `terminateRequestedBy`：协商终止发起者地址（无请求时为 address(0)）

  - `terminateRequestedAt`：协商终止请求时间戳（无请求时为 0）

  - `fixRequested`：是否已请求修正（布尔值）

  - `fixRequestedAt`：修正请求时间戳（未请求时为 0）

- **原因**：状态流转和资金结算必须在链上执行，确保不可篡改和自动化



#### 用户注册状态

- **是否已注册**：地址 → 布尔值映射（用于防止重复 mint）

- **原因**：防止重复 mint 100 EOCHO，必须在链上验证



#### 首次 Mint 记录

- **是否已首次 mint**：地址 → 布尔值映射

- **原因**：确保每个地址只 mint 一次



### 4.2 可链下存储的数据（原因）



#### 用户注册详细信息

- **数据**：昵称、城市标签、技能 tags

- **原因**：

  - 降低链上存储成本（Gas 费用）

  - 数据可更新（用户可修改昵称、技能等）——**本段描述为 V2 能力；MVP 阶段 profileURI 不可变且不提供编辑入口。**

  - 可通过链下数据库 + 链上验证（哈希）实现可验证性



#### 任务详细描述

- **数据**：任务标题、详细描述、工作内容

- **原因**：

  - 文本内容较长，链上存储成本高

  - 可通过 IPFS 或链下数据库存储，链上存储哈希值验证



#### 用户联系方式

- **数据**：电话、邮箱、微信、Telegram 等

- **原因**：

  - **隐私保护**：避免将联系方式直接明文上链，保护用户隐私

  - 链下存储，任务进入 InProgress 后通过 API 返回给对方

  - 可加密存储，进一步保护隐私



#### Helper 提交的工作内容

- **数据**：提交的文件、链接、文本描述等

- **原因**：

  - 内容可能较大（文件、图片等），链上存储成本极高

  - 可通过 IPFS 或链下存储，链上仅记录提交时间戳和哈希值



#### 任务搜索索引

- **数据**：全文搜索索引、标签索引

- **原因**：

  - 搜索功能在链上实现成本高、效率低

  - 链下建立索引，提供快速搜索服务



### 4.3 混合方案（链上验证 + 链下存储）



<!-- UPDATED --> #### 用户注册信息（MVP 定版）

- **链上**：`isRegistered[address] = true` + `profileURI[address]`（指向链下 JSON 的 URI）

- **链下**：完整 profile JSON（昵称、城市、技能 tags）

- **验证**：MVP 不做 hash 校验，信任链下服务；V2 可升级为 hash 验证

- **URI 载体与格式**：`profileURI` 采用 HTTP(S) 或 IPFS 格式，示例：`https://api.everecho.io/profile/{address}.json` 或 `ipfs://Qm...`；Profile JSON 最小 schema 必填字段：`nickname`（string）、`city`（string）、`skills`（string[]）、`encryptionPubKey`（string，x25519 或 secp256k1-encryption key）。



<!-- UPDATED --> #### 任务详细描述（MVP 定版）

- **链上**：`taskURI`（指向链下 JSON 的 URI）

- **链下**：完整任务 JSON（标题、描述、联系方式加密数据等）

- **验证**：MVP 不做 hash 校验，信任链下服务；V2 可升级为 hash 验证

- **URI 载体与格式**：`taskURI` 采用 HTTP(S) 或 IPFS 格式，示例：`https://api.everecho.io/task/{taskId}.json` 或 `ipfs://Qm...`；Task JSON 最小 schema 必填字段：`title`（string）、`description`（string）、`contactsEncryptedPayload`（string，加密后的联系方式）、`createdAt`（uint256）；**MVP 冻结为使用 `contactsEncryptedPayload` 直存加密联系方式**，`contactRef` 仅作为 V2 预留，不在 MVP 实现范围内。



---



## 5. 合约接口草案（仅函数/事件/权限/状态，不要代码）



### 5.1 EOCHO Token 合约（ERC20 标准）

- **【钉子 2：EOCHO Token 的标准实现】**

  - EOCHO 采用 **OpenZeppelin ERC20 继承实现**。

  - **不手写或重复声明 `balanceOf/totalSupply` 等标准变量**。

  - 只额外加入：`hasMintedInitial` 与 `mintInitial` 防重复逻辑、`cap` 上限、`burn` 功能。



#### <!-- UPDATED --> 状态变量（仅额外扩展，ERC20 标准变量由 OZ 继承）

- `uint256 public constant CAP = 10_000_000 * 10**18`：Token 总量上限

- `mapping(address => bool) public hasMintedInitial`：是否已首次 mint（防重复）



#### 函数接口

- `function mintInitial(address to) external`：首次注册时 mint EOCHO

  - **权限**：`mintInitial()` **仅允许 Register 合约调用（onlyRegister modifier）**，外部地址不可直接调用。

  - <!-- UPDATED --> **逻辑**：

    - 检查 `hasMintedInitial[to] == false`

    - 如果 `totalSupply() < CAP`，mint 100 EOCHO

    - 如果 `totalSupply() >= CAP`，mint 0（不报错，但触发 `CapReached` 事件）

    - 设置 `hasMintedInitial[to] = true`

  - **CAP 已满时的语义**：当 CAP 已满导致 mint 量为 0 时，`register()` 仍应成功，事件中必须显式记录 `mintedAmount=0`。

- <!-- UPDATED --> `function burn(uint256 amount) external`：销毁 Token（用于手续费销毁）

  - **权限**：仅 TaskEscrow 合约可调用；EOCHO 合约内部存储 `taskEscrowAddress`，仅允许该地址调用 `burn()`（部署时由构造函数或一次性 setter 设定）。

  - <!-- UPDATED 补丁 4 --> **逻辑**：从 TaskEscrow 合约托管的余额中销毁指定数量 Token，等价于 `_burn(address(this), amount)`，**不是**从调用者余额销毁

- `function transfer(address to, uint256 amount) external returns (bool)`：标准 ERC20 转账

- `function approve(address spender, uint256 amount) external returns (bool)`：标准 ERC20 授权

- `function transferFrom(address from, address to, uint256 amount) external returns (bool)`：标准 ERC20 授权转账



#### 事件

- `event InitialMinted(address indexed to, uint256 amount)`：首次 mint 事件

- <!-- UPDATED --> `event CapReached(address indexed attemptedBy)`：达到上限事件

- `event Burned(uint256 amount)`：销毁事件 

#
## 5.2 TaskEscrow 合约（任务托管与状态管理）

<!-- UPDATED -->

#### 状态变量

- `EOCHOToken public echoToken`：EOCHO Token 合约地址
- <!-- UPDATED 架构依赖 --> `Register public registerContract`：Register 合约地址（用于验证 isRegistered）
- `uint256 public taskCounter`：任务计数器（用于生成 taskId）
- `mapping(uint256 => Task) public tasks`：任务映射

**Task 结构体**：
```
struct Task {
    uint256 taskId;
    address creator;
    address helper;
    uint256 reward;
    string taskURI;
    TaskStatus status;
    uint256 createdAt;
    uint256 acceptedAt;
    uint256 submittedAt;
    address terminateRequestedBy;
    uint256 terminateRequestedAt;
    bool fixRequested;
    uint256 fixRequestedAt;
}

enum TaskStatus { Open, InProgress, Submitted, Completed, Cancelled }
```

#### 常量参数（与 1.4 MVP 参数表一致）

- `uint256 public constant T_OPEN = 7 days`
- `uint256 public constant T_PROGRESS = 14 days`
- `uint256 public constant T_REVIEW = 3 days`
- `uint256 public constant T_TERMINATE_RESPONSE = 48 hours`
- `uint256 public constant T_FIX_EXTENSION = 3 days`
- `uint256 public constant FEE_BPS = 200`（2%）
- <!-- UPDATED reward 范围策略 --> `uint256 public constant MAX_REWARD = 1000 * 10**18`（1000 EOCHO，合约硬限制）

#### 函数接口

**任务创建与取消**：

- `function createTask(uint256 reward, string taskURI) external returns (uint256 taskId)`
  - **逻辑**：Creator 抵押 R 枚 EOCHO，创建任务，状态为 Open
  - **权限**：任何已注册用户
  - <!-- UPDATED --> **前置条件**：`registerContract.isRegistered(msg.sender) == true`，`reward > 0 && reward <= MAX_REWARD`，余额 >= reward
  - **资金变化**：Creator 转入 reward 到合约
  - **事件**：`TaskCreated(taskId, creator, reward, taskURI)`

- `function cancelTask(uint256 taskId) external`
  - **逻辑**：Creator 取消 Open 状态任务，退回抵押 R
  - **权限**：仅 Creator
  - **前置条件**：status == Open，`msg.sender == task.creator`
  - **资金变化**：合约转出 reward 到 Creator
  - **事件**：`TaskCancelled(taskId, "Cancelled by creator")`

- `function cancelTaskTimeout(uint256 taskId) external`
  - **逻辑**：Open 状态超过 T_OPEN，任何人可触发，Creator 拿回 R
  - **权限**：任何人
  - **前置条件**：status == Open，`block.timestamp > createdAt + T_OPEN`
  - **资金变化**：合约转出 reward 到 Creator
  - **事件**：`TaskCancelled(taskId, "Timeout in Open")`

**任务接受**：

- `function acceptTask(uint256 taskId) external`
  - **逻辑**：Helper 抵押 R 枚 EOCHO，接受任务，状态变更为 InProgress
  - **权限**：任何已注册用户（除 Creator）
  - <!-- UPDATED --> **前置条件**：`registerContract.isRegistered(msg.sender) == true`，status == Open，`msg.sender != task.creator`，余额 >= reward
  - **资金变化**：Helper 转入 reward 到合约
  - **事件**：`TaskAccepted(taskId, helper)`

**协商终止**：

- `function requestTerminate(uint256 taskId) external`
  - **逻辑**：Creator 或 Helper 发起终止请求，记录 `terminateRequestedBy` 和 `terminateRequestedAt`
  - **权限**：仅 Creator 或 Helper
  - **前置条件**：status == InProgress，`msg.sender == task.creator || msg.sender == task.helper`
  - **资金变化**：无
  - **事件**：`TerminateRequested(taskId, msg.sender)`

- `function agreeTerminate(uint256 taskId) external`
  - **逻辑**：对方同意终止，双方各拿回 R，状态变更为 Cancelled
  - **权限**：仅对方（非发起者）
  - <!-- UPDATED 补丁 3 --> **前置条件**：status == InProgress，`terminateRequestedBy != address(0)`，`msg.sender != terminateRequestedBy`，`block.timestamp <= terminateRequestedAt + T_TERMINATE_RESPONSE`
  - **资金变化**：合约转出 reward 到 Creator，合约转出 reward 到 Helper
  - **事件**：`TerminateAgreed(taskId)`，`TaskCancelled(taskId, "Mutually terminated")`

- `function terminateTimeout(uint256 taskId) external`
  - **逻辑**：T_TERMINATE_RESPONSE 无响应，请求失效，重置 `terminateRequestedBy` 和 `terminateRequestedAt` 为 0；`terminateTimeout()` 重置字段后不限制再次 `requestTerminate()` 的次数。
  - **权限**：任何人
  - **前置条件**：status == InProgress，`terminateRequestedBy != address(0)`，`block.timestamp > terminateRequestedAt + T_TERMINATE_RESPONSE`
  - **资金变化**：无
  - **事件**：无（仅重置字段）

**任务提交与验收**：

- `function submitWork(uint256 taskId) external`
  - **逻辑**：Helper 提交工作，状态变更为 Submitted
  - **权限**：仅 Helper
  - **前置条件**：status == InProgress，`msg.sender == task.helper`
  - **资金变化**：无
  - **事件**：`TaskSubmitted(taskId)`

- `function requestFix(uint256 taskId) external`
  - <!-- UPDATED 补丁 2 --> **逻辑**：Creator 请求修正，`T_review` 延长 T_FIX_EXTENSION，`fixRequested = true`，`fixRequestedAt = block.timestamp`；Helper 链下更新工作内容，**submittedAt 不刷新**
  - **权限**：仅 Creator
  - **前置条件**：status == Submitted，`msg.sender == task.creator`，`fixRequested == false`（仅允许一次）
  - **资金变化**：无
  - **事件**：`FixRequested(taskId)`

- `function confirmComplete(uint256 taskId) external`
  - <!-- UPDATED 补丁 4 --> **逻辑**：Creator 确认完成，资金结算（Helper 得 0.98R，0.02R burn，Helper 保证金退回），状态变更为 Completed；burn 从 TaskEscrow 托管余额执行
  - **权限**：仅 Creator
  - **前置条件**：status == Submitted，`msg.sender == task.creator`
  - **资金变化**：合约转出 `0.98 * reward` 到 Helper，合约 burn `0.02 * reward`，合约转出 reward 到 Helper（保证金）
  - **事件**：`TaskCompleted(taskId, 0.98 * reward, 0.02 * reward)`

- `function completeTimeout(uint256 taskId) external`
  - <!-- UPDATED 补丁 2 --> **逻辑**：超过 T_REVIEW（或延长后时间）Creator 未操作，任何人可触发自动完成并结算；验收截止时间按 `submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)` 计算
  - **权限**：任何人
  - **前置条件**：status == Submitted，`block.timestamp > submittedAt + T_REVIEW + (fixRequested ? T_FIX_EXTENSION : 0)`
  - **资金变化**：合约转出 `0.98 * reward` 到 Helper，合约 burn `0.02 * reward`，合约转出 reward 到 Helper（保证金）
  - **事件**：`TaskCompleted(taskId, 0.98 * reward, 0.02 * reward)`

**InProgress 超时**：

- `function progressTimeout(uint256 taskId) external`
  - **逻辑**：InProgress 超过 T_PROGRESS，双方各拿回 R，状态变更为 Cancelled
  - **权限**：任何人
  - **前置条件**：status == InProgress，`block.timestamp > acceptedAt + T_PROGRESS`
  - **资金变化**：合约转出 reward 到 Creator，合约转出 reward 到 Helper
  - **事件**：`TaskCancelled(taskId, "Timeout in InProgress")`

#### 事件

- `event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)`
- `event TaskAccepted(uint256 indexed taskId, address indexed helper)`
- `event TaskSubmitted(uint256 indexed taskId)`
- `event TaskCompleted(uint256 indexed taskId, uint256 helperReceived, uint256 feeBurned)`
- `event TaskCancelled(uint256 indexed taskId, string reason)`
- `event TerminateRequested(uint256 indexed taskId, address indexed requestedBy)`
- `event TerminateAgreed(uint256 indexed taskId)`
- `event FixRequested(uint256 indexed taskId)`

### 5.3 Register 合约（用户注册）

<!-- UPDATED -->

#### 状态变量

- `EOCHOToken public echoToken`：EOCHO Token 合约地址
- `mapping(address => bool) public isRegistered`：是否已注册
- `mapping(address => string) public profileURI`：用户 profile URI

#### 函数接口

- `function register(string memory _profileURI) external`
  - **逻辑**：
    1. 检查 `isRegistered[msg.sender] == false`
    2. 设置 `isRegistered[msg.sender] = true`
    3. 存储 `profileURI[msg.sender] = _profileURI`
    4. 调用 `echoToken.mintInitial(msg.sender)`
  - **权限**：任何人（但每个地址仅一次）
  - **前置条件**：未注册

#### 事件

- `event UserRegistered(address indexed user, string profileURI, uint256 mintedAmount)`

---

## 6. 验收清单（自检）

<!-- UPDATED -->

- [x] contacts 加密方案不依赖公开信息推导密钥（补丁 1：profile 必须包含 encryptionPubKey）
- [x] Request Fix 不刷新 submittedAt，计时规则明确（补丁 2：验收截止时间按 submittedAt + T_REVIEW + T_FIX_EXTENSION 计算）
- [x] agreeTerminate 仅在未过期请求下可调用（补丁 3：前置条件增加时间检查）
- [x] burn 从 escrow 托管余额执行，语义一致（补丁 4：_burn(address(this), amount)）
- [x] Register 与 TaskEscrow 部署依赖唯一且明确（TaskEscrow 构造函数传入 Register 地址）
- [x] reward R 的限制策略唯一、无歧义（合约硬限制 MAX_REWARD = 1000 EOCHO）
- [x] 状态机与所有资金流完全一致、可实现（所有函数补充资金变化和事件）
- [x] MVP 参数表唯一且全局一致（所有常量命名统一：T_OPEN/T_PROGRESS/T_REVIEW/T_TERMINATE_RESPONSE/T_FIX_EXTENSION/FEE_BPS/MAX_REWARD）

---

## 附录：MVP 实现优先级建议

### P0（核心功能，必须实现）

1. EOCHO Token 合约（含 cap、burn、mintInitial）
2. Register 合约（含 profileURI 存储）
3. TaskEscrow 合约核心流程：
   - createTask / acceptTask / submitWork / confirmComplete
   - 超时机制：cancelTaskTimeout / completeTimeout / progressTimeout
4. 前端：钱包连接、注册、任务广场、任务详情、Profile
5. 后端：profile 存储、task metadata 存储、联系方式加密存储

### P1（重要体验，强烈建议实现）

1. 协商终止机制（requestTerminate / agreeTerminate / terminateTimeout）
2. Request Fix 机制（requestFix + 延长验收期）
3. 联系方式加密解密流程（DEK + 公钥包裹）

### P2（可后续迭代）

1. 任务搜索/过滤功能优化
2. 用户信誉系统
3. Gas 费用优化（Layer 2 迁移）
4. Profile 更新功能（V2）
5. 争议仲裁机制（V2）

---

**文档版本**：v1.2（最终冻结版，应用所有补丁）
**最后更新**：2024-11-23
**状态**：✅ 可直接进入合约+后端+前端实现
