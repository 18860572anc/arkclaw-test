# 交付运维支持后台 · 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 撰写日期 | 2026-04-24 |
| 模块代号 | 模块 C · 我司交付运维后台（R2）—— 细化版 |
| 父文档 | `/1-prd/PRD.md`（v1.0） |
| 兄弟文档 | `/1-prd-det/销售CRM-PRD.md`、`/1-prd-det/超级管理员后台-PRD.md` |
| 目标读者 | 前端开发、后端开发、QA、交付运维负责人、客户支持团队、PM |
| 范围 | R2 交付运维角色的全部可用功能；技术工单、IM 绑定、网络配置、诊断、巡检 |
| 状态 | 待评审（运维负责人 + 安全 sign-off） |

---

## 一、文档元信息

### 1.1 与主 PRD 的引用映射

| 本 PRD 章节 | 主 PRD 对应 |
|---|---|
| § 6.1 工单队列 | § 八 C1 |
| § 6.2 IM 绑定（飞书/企微/钉钉/微信） | § 八 C2 |
| § 6.3 网络配置 | § 八 C3、§ 六 A4.3 |
| § 6.4 客户诊断与支持 | § 八 C4 |
| § 6.5 健康巡检 | 主 PRD 未拆分，本 PRD 补全 |
| § 6.6 客户档案（运维视角） | 主 PRD 未拆分，本 PRD 补全 |
| § 7 数据模型 | § 十二 |
| § 11 权限矩阵 | § 十一 |

### 1.2 与兄弟 PRD 的协同点

| 协同点 | 说明 |
|---|---|
| 远程协助代登录 | 与超级管理员 PRD § 5.6 / § 6.2.3 共用 `impersonation_session` 表，但调用入口与子角色不同 |
| 工单分派 | 工单流入入口包括：客户开通（B3 订单 paid 自动）、客户咨询（A8/B8 转过来）、销售反馈（销售 CRM 跟进发现问题）、内部巡检触发（C5 巡检发现） |
| 网络配置展示 | 客户侧（A4.3）只读 + 工单申请；本 PRD（C3）是可编辑版本 |

### 1.3 引用资产

- `/1-prd/PRD.md` 主 PRD（§ 八、§ 六 A4.3）
- `/1-prd-det/超级管理员后台-PRD.md`（impersonation_session 共用）
- `/1-prd-det/销售CRM-PRD.md`（工单转交协同）
- `/0423会议.md` § 00:47-01:54（"绑定飞书也好，绑定企微也好…应该是给咱自己的交付人员用的"；"网络配置…应该是只给咱自己的运维看的"）
- `/0-assets/ArkClaw/` § 4 网络配置截图（公网入口、出口、私网出口）、§ 3 登录配置截图
- `http://localhost:5160/ops/tickets` 当前已实现的工单队列原型

### 1.4 术语对齐（详见 § 17.1）

- **R2 / 交付运维**：云脑智联内部技术 / 运维角色
- **工单（Ticket）**：客户技术问题或交付任务的承载单元
- **IM 绑定**：飞书 / 企微 / 钉钉 / 微信 4 个 IdP 的回调注册与员工映射
- **巡检（Inspection）**：定时对所有客户企业做的自动健康检查
- **远程协助**：R2 以客户管理员身份登录排查问题，等同于代登录但场景为技术性

---

## 二、模块定位、目标与设计原则

### 2.1 模块定位

交付运维支持后台是云脑智联**技术 / 运维团队**面向下游客户企业提供"交付 + 售后技术服务"的工作台。它与超级管理员后台（R1）在边界上互补：

| 维度 | R1 超管后台 | R2 运维后台 |
|---|---|---|
| 主要业务 | 运营、财务、销售、平台配置 | 客户技术交付、IM 绑定、网络、故障 |
| 视角 | 全平台数据看得见 | 只看自己接的工单 + 全量客户技术档案 |
| 操作风格 | 审批、配置、监控 | 动手做、调测、巡检、排障 |
| 客户接触 | 极少（只在重大事件） | 高频（IM 配置、技术支持） |
| 核心入口 | 仪表盘 | 工单队列（`/ops/tickets`） |

R2 的核心价值是**让客户不接触底层技术参数**（AgentID、Secret、VPC 配置、证书）就能用上整个平台。

### 2.2 本期目标（In Scope）

| # | 模块 | 核心能力 |
|---|---|---|
| C1 | 工单队列 | 工单 CRUD + 分派 + SLA + 状态扭转 + 转 R1 |
| C2 | IM 绑定（飞书/企微/钉钉/微信） | 工作台式录入 + 连通性测试 + 员工同步触发 |
| C3 | 网络配置 | 公网入口（自定义域名 + 证书） / 公网出口（跨境加速） / 私网出口（VPC） |
| C4 | 客户诊断与支持 | 远程协助代登录 + 诊断工具集 |
| C5 | 健康巡检 | 日 / 周 / 月定时对所有客户做体检 + 异常自动建工单 |
| C6 | 客户运维档案 | 每个客户的 IM 配置 / 网络拓扑 / 历史工单 / 重要备注 |

### 2.3 非目标（Out of Scope，详见 § 12）

- ❌ 客户业务数据操作（Claw 实例、技能、知识修改）→ 走客户企业管理员（R4）
- ❌ 火山控制台底层基础设施配置 → 火山原生
- ❌ R2 自身账号管理 → 主 PRD § B10 / 超管 PRD
- ❌ 财务相关（退款、对公审核）→ 超管 PRD § B3
- ❌ 销售归因 / 佣金 → 销售 PRD
- ❌ 自研监控基础设施 → 用 Prometheus / Grafana / 阿里云监控等成熟方案，本 PRD 只接入告警

### 2.4 设计原则

1. **客户不动技术参数**：所有需要 AgentID / Secret / 证书 / VPC 的步骤，客户侧只能"申请"，由 R2 代为录入
2. **写操作工单化**：网络配置、IM 绑定、远程协助都必须**绑定一个工单**（关联 ticket_id），无单不操作
3. **变更可回滚**：网络配置 / IM 绑定保存历史快照，支持一键回滚到上一稳定版本
4. **诊断工具只读**：诊断不修改任何客户数据；如需修复，必须创建工单 + 走变更流程
5. **测试连通在前，保存在后**：IM 绑定、网络配置必须"测试连通成功"才允许保存；强制阻断
6. **远程协助强审计**：与超管 PRD § F1 一致，单会话 ≤ 2h、3 重通知客户、操作全程审计
7. **巡检自治**：发现异常 → 自动建工单 → 自动分派 → R2 接手；不需要人盯着看板
8. **白名单可写**：网络出口、域名等敏感配置，对域名 / IP 段做白名单制约束（默认拒绝）

---

## 三、角色与权限边界

### 3.1 R2 内部子角色（实施层拆分）

主 PRD 把 R2 当成单一"交付运维"角色；本 PRD 拆为 3 子角色：

| 子角色 | 工号前缀 | 职能 |
|---|---|---|
| **R2.0 运维主管**（OpsLead） | OL- | 工单分派、配置审批、关键变更审核、远程协助审计抽查 |
| **R2.1 交付工程师**（Delivery） | DE- | 客户开通、IM 绑定、初次配置、巡检异常处理 |
| **R2.2 技术支持**（TechSupport） | TS- | 客户技术工单响应、远程协助、诊断 |

> 体量不大时可由 1 人兼任多角色；权限矩阵以子角色为单位授予。

### 3.2 与其他角色的接触面

| 接触场景 | R2 可做 | R2 不可做 |
|---|---|---|
| 客户企业基本信息 | 查看 + 加运维备注 | 修改 USCC、企业基本信息 |
| 客户业务数据 | 通过远程协助"看"（与 R1.3 CS- 共享 impersonation_session） | 修改业务数据 |
| 客户 IM 绑定 | **可编辑、测试、保存、回滚** | 修改 IM 平台之外的客户配置 |
| 客户网络配置 | **可编辑、测试、回滚** | 同上 |
| 火山 API 凭证 | 仅 OL- 可见、可轮换 | DE- / TS- 不可见 |
| 工单 | 接收 / 处理 / 转交（同子角色或跨角色） | 删除工单 |
| 销售 / 佣金 / 订单 | — | — |
| R1 操作 | — | — |

### 3.3 与客户企业管理员（R4）的协作面

- R2 操作前必须有"工单"或"客户授权"
- 重要变更（网络配置、IM 绑定换平台）变更前后客户管理员收到 3 重通知
- R2 不能在没有工单的情况下登录客户工作台

---

## 四、用户故事

| ID | As a | I want | So that |
|---|---|---|---|
| US-O01 | DE- 交付工程师 | 客户付款后自动收到"开通工单" | 我能立刻接手做 IM + 网络配置 |
| US-O02 | DE- | 在一个表单里录入企微 AgentID / Secret / 回调 / 应用密钥 | 不用一行行手填四个 IdP 平台 |
| US-O03 | DE- | 录完后点"测试连通"，连通成功才能保存 | 防止配错放出去客户报错 |
| US-O04 | DE- | 配置完触发员工同步并通知客户管理员"员工可登录" | 完成交付闭环 |
| US-O05 | DE- | 给客户开通自定义域名（含证书上传） | 客户的登录链接是 `claw.客户域名`，更专业 |
| US-O06 | DE- | 配置客户私网出口（连客户内网） | 客户业务系统能被 Agent 调用 |
| US-O07 | TS- 技术支持 | 客户报"登不进去"，我能拉错误日志 + 测试网络连通 | 30 分钟内定位问题 |
| US-O08 | TS- | 在客户授权后远程登录他的工作台排查 | 不需要客户协助，效率高 |
| US-O09 | TS- | 关闭一个故障告警 | 信息确认后清理告警噪音 |
| US-O10 | OL- 运维主管 | 看到所有未分派工单 + 按 SLA 优先级排序 | 合理调度团队 |
| US-O11 | OL- | 抽查 R2 子角色的远程协助会话 | 内部合规 |
| US-O12 | OL- | 审批"网络出口跨境加速开通"这种高敏感操作 | 风险把关 |
| US-O13 | DE- | 看到健康巡检自动建的工单（如"客户火山额度剩 5%"） | 主动维护客户 |
| US-O14 | DE- | 一个客户的 IM 配置变更后能看到历史版本 + 一键回滚 | 出问题能快速恢复 |
| US-O15 | TS- | 客户工单卡在等客户反馈 → 系统自动 24h 后催办 | 工单不会僵在那 |
| US-O16 | DE- | 在客户运维档案里看到这家客户历史所有工单 | 接新工单时快速了解客情 |
| US-O17 | OL- | 客户某次开通时 IM 绑定踩了坑，留个内部知识备注 | 下次同样问题不重复踩 |

---

## 五、核心业务流程

### 5.1 客户开通工单（最高频流程）

```
客户付款（B3）→ order.status=paid
        │
        ▼
系统自动创建工单 (type=onboarding, priority=P1)
  · 关联 tenant_id
  · 关联 order_id
  · 默认未分派
        │
        ▼
OL- 在 C1 队列分派给某个 DE- 交付工程师
  └── 或开启"自动轮询分派"（按队列均分）
        │
        ▼
DE- 收到站内通知 + 邮件
        │
        ▼
DE- 进入工单 → 看客户基本信息 → 询问客户具体诉求（哪个 IM 平台 / 是否要自定义域名）
        │
        ▼
1. C2 IM 绑定（按客户选择的平台）
2. C3 网络配置（如果客户要自定义域名 / 私网）
3. 调火山 API 触发员工同步（如果绑了 IM）
        │
        ▼
连通性测试通过
        │
        ▼
DE- 在工单里点"完成交付"，附"开通确认报告"（自动生成 PDF）
        │
        ▼
工单 status=resolved，客户管理员收到 3 重通知
        │
        ▼
SLA 倒计时停止，工单 24h 内可重开
```

### 5.2 IM 绑定流程（飞书 / 企微 / 钉钉 / 微信）

```
DE- 在 C2 工作台选择目标客户企业
        │
        ▼
选择 IM 平台 → 进入对应平台的配置向导
        │
        ▼
按平台向导引导：
  · 飞书：在飞书开放平台创建应用，复制 App ID + App Secret + 加密 Key + Verification Token
  · 企微：在企微管理后台创建应用，配置可信域名，记录 CorpID + AgentID + Secret
  · 钉钉：钉钉开发者后台创建应用，记录 AppKey + AppSecret + AgentID
  · 微信：微信公众平台创建小程序 / 公众号，配置回调 URL，记录 AppID + AppSecret
        │
        ▼
DE- 填到我方配置表单
  · 字段保存到本系统 binding 表（密文加密）
  · 调火山 API 同步到 ArkClaw 空间
        │
        ▼
点"测试连通"（关键步骤，强制）
  · 系统调用对应平台的 ping/healthz 接口
  · 模拟一次员工登录
  · 模拟一次回调
  └── 失败 → 显示具体错误码 → 不允许保存
  └── 成功 → 显示 ✅ + 测试详情
        │
        ▼
点"保存配置"
        │
        ▼
触发员工同步（拉取该 IM 平台的全量员工 → 火山）
        │
        ▼
保存历史快照（binding_history）
        │
        ▼
通知客户管理员（站内 + 邮件 + 短信）"员工可登录链接：xxx"
        │
        ▼
工单进度推进
```

### 5.3 网络配置变更

```
触发源（其一）：
  A) 客户在 A4.3 点"编辑"→ 申请工单
  B) DE- 在客户开通工单中预先做
  C) 巡检触发（如证书即将过期 → 自动建工单催更新）
        │
        ▼
DE- / OL- 进入 C3 配置页（按客户加载当前网络配置）
        │
        ▼
编辑表单：
  · 公网入口自定义域名：域名 / 证书 / 跳转配置
  · 公网出口：开关 / 跨境加速 / 加速域名 / 限速
  · 私网出口：VPC 配置 / 子网 / 安全组
        │
        ▼
强制"测试"步骤
  · 域名解析测试（DNS 解析正确指向 + 证书有效）
  · 出口连通性测试（指定测试目标 ping）
  · 私网连通性测试（指定客户内网测试 IP ping）
  └── 任一失败 → 不允许保存
        │
        ▼
高危变更（如启用跨境加速、修改 VPC）→ 必须 OL- 审批
普通变更 → 直接保存
        │
        ▼
保存 + 调火山 API 应用配置 + 写历史快照
        │
        ▼
触发回归测试任务（10 分钟后再做一次连通性测试，发邮件给 DE-）
        │
        ▼
通知客户
```

### 5.4 客户诊断与远程协助

```
TS- 收到客户工单"我登不进去"
        │
        ▼
进入工单 → C4 诊断面板
        │
        ▼
一键诊断（系统自动跑下列项）：
  · 客户登录链接可达性
  · 火山 API 健康
  · 该客户 IM 绑定状态
  · 该客户配额健康
  · 客户最近 1h 错误日志（前 50 条）
        │
        ▼
诊断结果展示 + 建议下一步
  ├─ 能从日志判断 → 直接修（创建变更工单）
  └─ 不能 → 申请远程协助
        │
        ▼
申请远程协助（与超管 PRD § 5.6 共用 impersonation_session）
  · 必须录入：工单号 + 客户已书面授权（勾选）
  · 单会话 ≤ 2h
        │
        ▼
进入客户工作台（顶部红色横幅）
  · 客户管理员收到 3 重通知
        │
        ▼
排查 → 定位问题 → 退出会话
        │
        ▼
回到工单 → 写处理记录 → 触发修复操作（创建变更工单或直接 C2/C3 操作）
        │
        ▼
工单 status=resolved，客户回测
```

### 5.5 健康巡检

```
定时任务（cron）
  · 每日 02:00：每个客户全量巡检
  · 每周一 02:00：深度巡检
  · 每月 1 日：月报巡检
        │
        ▼
对每个 active 状态的 tenant 执行检查项：
  · 登录链接可达性
  · 火山 API 通
  · 配额：席位 / Token / 存储 < 80%（>= 80% 触发预警）
  · 证书：自定义域名证书剩余有效期 ≥ 30 天
  · IM 绑定：模拟登录可行
  · 安全策略：是否有无效规则
  · 长会话：> 7 天的活跃会话
        │
        ▼
检查项失败 → 自动建工单（priority 按规则映射）
  · 配额 100% → P0
  · 配额 ≥ 90% → P1
  · 证书 < 7 天 → P0
  · 证书 < 30 天 → P2
  · IM 绑定失效 → P1
  · 安全策略异常 → P2
        │
        ▼
进入 C1 工单队列，等待分派
```

### 5.6 工单生命周期

```
new ─分派─→ assigned ─开始处理─→ in_progress
                                    │
                          ┌─────────┼─────────┐
                          ▼         ▼         ▼
                  waiting_customer  waiting_internal   (直接解决)
                          │         │
                          └─────────┘
                          24h 自动催 / 客户回复
                                    │
                                    ▼
                                resolved ─客户确认 / 24h 默认─→ closed
                                    │
                                    └─重开（reopen）─→ assigned
```

---

## 六、功能详解

> 标注约定：✅ 已实现 / ⚠️ 部分实现 / ❌ 待实现 / 🔄 待校准（基于 `localhost:5160/ops/tickets` 现有原型）

### 6.1 C1 工单队列

#### 路径
列表 `/ops/tickets`
详情 `/ops/tickets/:id`

#### 6.1.1 列表页

##### 顶部 Tab 切换视角
- **我的工单**（默认）：当前用户被分派或处理中的
- **未分派**：team 内未指派的（仅 OL- 可见）
- **全部**：team 内所有的
- **关注**：用户标星跟踪的

##### 列定义

| 列 | 字段 |
|---|---|
| 工单号 | ticket.id（前缀 OPS-） |
| 类型 | onboarding / im_binding / network / tech_support / incident / data_export |
| 标题 | 自动生成 + 可改 |
| 客户 | tenant.name |
| 优先级 | P0 红 / P1 橙 / P2 黄 / P3 灰 |
| 状态 | new / assigned / in_progress / waiting_customer / waiting_internal / resolved / closed / reopened |
| 来源 | 系统自动 / 客户申请 / 销售提交 / 巡检触发 / 内部创建 |
| 经办人 | 当前 assignee |
| SLA 剩余 | 倒计时（红色：超时；黄色：< 25%） |
| 创建时间 | created_at |
| 最后更新 | last_updated_at |
| 操作 | 详情 / 转单 / 更改优先级 / 关注 |

##### 筛选与搜索
- 类型多选、状态多选、优先级多选
- 客户搜索（名 / USCC）、经办人下拉、来源、时间范围
- 全文搜索（标题 + 描述 + 客户名 + 工单号）
- 排序：默认优先级降序 + SLA 剩余升序；可切创建时间

##### 批量操作
- 批量分派（仅 OL-）
- 批量更改优先级（仅 OL-）
- 批量关闭（仅 已 resolved 的工单 + OL-）
- 导出 CSV

##### 实现状态：🔄 待校准

#### 6.1.2 工单详情页

##### 布局：左侧主信息 + 右侧时间线

###### 左侧信息

| 区块 | 内容 |
|---|---|
| 基本信息 | 工单号、类型、标题、优先级、状态、来源、SLA |
| 客户卡片 | 客户名 + USCC + 跳详情 + 当前归属销售（只读） |
| 关联订单 / 资源 | 如果是 onboarding 关联 order；如果是 incident 关联告警 |
| 描述 | 富文本，支持图片附件 |
| 处理记录 | 处理过程的关键节点（每次状态变更 / 配置变更 / 远程协助会话） |

###### 右侧时间线
- 全部活动按时间倒序：状态变更、评论、附件、SLA 触发、巡检自动操作
- 每条带操作人 + 时间戳 + 详情链接

##### 操作按钮（按权限）

| 按钮 | 权限 | 说明 |
|---|---|---|
| 接单 | 当前用户 = assignee 或 unassigned 的可见者 | 状态 → in_progress |
| 转单 | 经办人 / OL- | 选目标人 + 必填转单原因 |
| 升级 | 经办人 / OL- | 优先级 + 1 级 |
| 暂挂等客户 | 经办人 | 状态 → waiting_customer，开启 24h 催办 |
| 暂挂等内部 | 经办人 | 状态 → waiting_internal，关联依赖（如等火山） |
| 标记解决 | 经办人 | 状态 → resolved，触发客户验收期（24h） |
| 重开 | 经办人 / 客户回滚 | 状态 → assigned，SLA 重置 |
| 关闭 | OL- 或 24h 自动 | 状态 → closed，不可再操作 |
| 添加评论 | 全部参与人 | 内部 / 对客户可见两种 |
| 转 R1（升级） | 任意 R2 | 工单升级为 R1 处理（如涉及合同金额） |

##### 评论可见性

- **内部**：仅 R2 / R1 内部可见
- **对客户**：客户管理员（R4）也可见（在客户工作台的"我的工单"看到）

##### 实现状态：🔄 待校准

#### 6.1.3 SLA 矩阵

| 优先级 | 响应时长 | 解决时长 | 工单类型默认值 |
|---|---|---|---|
| P0 紧急 | 1h | 4h | incident、配额 100% |
| P1 高 | 4h | 24h | onboarding、im_binding、配额 ≥ 90% |
| P2 中 | 8h | 48h | network、tech_support、证书 < 30 天 |
| P3 低 | 24h | 72h | data_export、咨询类 |

- **响应**：assignee 接单（new → in_progress）
- **解决**：状态扭转到 resolved
- **超时**：发邮件到 OL- + 升级一档优先级

#### 6.1.4 工单类型预设模板

| 类型 | 自动生成的描述模板 |
|---|---|
| onboarding | "客户 [tenant] 已付款 [order]，请协助开通：1) IM 绑定 2) 网络配置 3) 员工同步" |
| im_binding | "客户 [tenant] 申请变更 / 新增 [platform] 绑定" |
| network | "客户 [tenant] 申请 [配置项] 变更" |
| tech_support | "客户 [tenant] 报告：[问题描述]" |
| incident | "巡检发现 [tenant] 异常：[异常项]" |
| data_export | "客户 [tenant] 申请数据导出（[范围]）" |

---

### 6.2 C2 IM 绑定（飞书 / 企微 / 钉钉 / 微信）

#### 路径
工作台 `/ops/im-binding`
按客户进入：`/ops/im-binding/:tenant_id`

#### 6.2.1 工作台首页

##### 内容
- 客户搜索框（USCC / 名 / 跳客户档案）
- 4 个平台 logo 卡片，点击进入对应配置
- 当前所有客户的"绑定状态总览"小表格：客户名 + 4 平台各自的绑定状态（未配置 / 已配置 / 失效）

##### 实现状态：❌ 待实现

#### 6.2.2 飞书绑定向导

##### 5 步引导

```
Step 1：在飞书开放平台创建应用 →（外链跳转）
Step 2：填配置
  - App ID（必填）
  - App Secret（必填，密码框）
  - Encrypt Key（可选）
  - Verification Token（必填）
  - 可信域名（自动生成 + 复制按钮）
  - 回调 URL（自动生成 + 复制按钮）
Step 3：在飞书后台粘贴上述域名 / URL，点 "我已粘贴"
Step 4：点"测试连通"
  - 测试 ping
  - 测试模拟员工登录
  - 测试回调可达
  - 失败 → 显示具体错误码 → Step 4 不通过
Step 5：保存
  - 保存配置
  - 触发员工同步
  - 通知客户
```

##### 表单字段

| 字段 | 必填 | 类型 | 校验 |
|---|---|---|---|
| App ID | ✅ | text | 8-32 字符 |
| App Secret | ✅ | password | 24+ 字符 |
| Encrypt Key |  | password | 16-64 字符 |
| Verification Token | ✅ | text | 24+ 字符 |
| 可见员工范围 |  | select | 全员 / 指定通讯录 / 指定部门 |
| 默认席位等级 | ✅ | select | 4 档之一 |
| 备注 |  | textarea | 最长 200 字 |

##### 测试连通的子检查

| 子检查 | 通过标准 | 失败提示 |
|---|---|---|
| App ID 验证 | tenant_access_token 拉取成功 | "App ID 或 Secret 错误" |
| 回调连通 | 飞书发送测试事件，我方收到 | "回调 URL 不可达" |
| Encrypt Key | 解密验证 token 通过（如果有） | "Encrypt Key 错误" |
| 员工列表读取 | 拉取到 ≥ 1 个员工 | "可见范围内无员工" |

##### 保存后

- 写 binding 表（含密文加密的 secret）
- 写 binding_history 快照
- 调火山 API 同步配置到 ArkClaw 空间
- 触发员工同步（异步任务）
- 客户站内 / 邮件 / 短信通知

##### 实现状态：❌ 待实现

#### 6.2.3 企微绑定向导

类似飞书，字段差异：

| 字段 | 必填 |
|---|---|
| Corp ID | ✅ |
| Agent ID | ✅ |
| Secret | ✅ |
| Token | ✅ |
| EncodingAESKey | ✅ |
| 可信域名（自动生成） | — |
| 回调 URL（自动生成） | — |

##### 实现状态：❌ 待实现

#### 6.2.4 钉钉绑定向导

| 字段 | 必填 |
|---|---|
| AppKey | ✅ |
| AppSecret | ✅ |
| AgentID | ✅ |
| 可信 IP（自动） | — |
| 回调 URL | — |

##### 实现状态：❌ 待实现

#### 6.2.5 微信绑定向导

公众号 / 小程序两选一，字段差异较大：

| 字段 | 必填 |
|---|---|
| AppID | ✅ |
| AppSecret | ✅ |
| Token | ✅ |
| EncodingAESKey | ✅ |
| 关联类型 | 公众号 / 小程序 |

##### 实现状态：❌ 待实现

#### 6.2.6 已绑定查看 / 编辑 / 解绑

##### 查看
- 显示当前配置（Secret 字段始终显示 `****`，仅"重置"按钮可重新填）
- 显示最近一次连通测试时间 + 结果
- "再次测试"按钮（不修改配置即可重测）
- "查看历史"打开 binding_history

##### 编辑
- 编辑 → 强制改为新版本（不能原地改）
- 改完必须"测试连通"才能保存
- 保存后自动写新快照

##### 解绑
- 解绑前必须创建工单 + 录入解绑原因
- 解绑后影响所有该 IM 平台的员工登录 → 客户管理员双重通知（站内 + 短信，T-1 天预通知）
- 解绑后保留历史快照

#### 6.2.7 历史快照与回滚

##### 列表
- 时间、操作人、变更字段、连通测试结果、备注

##### 回滚
- 选某个历史版本 → "回滚到此版本"
- 强制重新测试连通
- 必须 OL- 审批
- 回滚也写一条新快照

---

### 6.3 C3 网络配置

#### 路径
按客户：`/ops/network/:tenant_id`

#### 6.3.1 顶部 Tab

| Tab | 内容 |
|---|---|
| 公网入口 | 员工登录链接 + 自定义域名 + 证书 |
| 公网出口 | 出口开关 + 跨境加速 + 加速域名 + 限速 |
| 私网出口 | VPC 配置 + 子网 + 安全组 + 路由 |

#### 6.3.2 公网入口

##### 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| 系统默认登录链接 | — | 只读 `claw.<我司域名>/<tenant_code>` |
| 启用自定义域名 | — | 开关 |
| 自定义域名 | ✅（开关开） | `claw.客户域名.com` |
| 证书 | ✅ | 上传 .crt + .key 或选 ACME 自动签 |
| 证书有效期 | — | 自动解析，到期前 30 天 / 7 天告警 |
| 跳转策略 | — | 默认页 / 跳转外部 SSO |

##### 测试

- 域名解析测试（dig + nslookup 多节点）
- 证书有效性测试（OpenSSL）
- 端到端登录测试（自动模拟一次浏览器登录）

##### 高危变更
- 启用 / 禁用自定义域名 → 必须 OL- 审批
- 证书更换 → DE- 直接

##### 实现状态：❌ 待实现

#### 6.3.3 公网出口

##### 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| 启用公网出口 | — | 开关，默认禁用（默认拒绝原则） |
| 跨境加速 | — | 开关 + 选择加速节点（北美 / 欧洲 / 东南亚） |
| 加速域名白名单 | ✅（开） | 出站允许访问的域名清单 |
| 出口 IP 白名单 |  | 客户的目标 IP 段（如要严格控） |
| 出口限速 |  | 每秒带宽 / QPS |

##### 测试

- 选定测试目标域名 → 模拟客户机房 → 实际发请求 → 返回时延 / 状态码
- 跨境加速对比（开 / 不开的 RTT 差异）

##### 高危变更
- 启用跨境加速 → 必须 OL- 审批（涉及合规）
- 修改白名单 → DE- 直接

##### 实现状态：❌ 待实现

#### 6.3.4 私网出口

##### 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| 启用私网出口 | — | 开关 |
| 接入方式 | — | 专线 / VPN / 云联网 |
| 客户 VPC ID | ✅ | 客户提供 |
| 客户子网 CIDR | ✅ | 如 `10.0.0.0/16` |
| 客户网关 IP | ✅ | — |
| 我方分配 CIDR | — | 自动分配 |
| 路由表 | — | 自动生成 |
| 安全组规则 | — | 默认拒绝，按需放行 |

##### 测试

- 客户 VPC 可达性测试（指定测试 IP ping）
- 测试目标端口可达性（TCP / UDP）
- 路由健康（往返延时、丢包率）

##### 高危变更
- 任何 VPC 配置变更 → 必须 OL- 审批 + 双人复核
- 私网出口启用 → 必须客户书面授权（上传授权书）

##### 实现状态：❌ 待实现

#### 6.3.5 历史快照与回滚

同 IM 绑定（6.2.7）。回滚必须 OL- 审批。

---

### 6.4 C4 客户诊断与支持

#### 路径
按客户：`/ops/diagnosis/:tenant_id`
工单内入口：工单详情页"开始诊断"按钮

#### 6.4.1 一键诊断

##### 检查项

| 检查项 | 含义 | 失败时建议 |
|---|---|---|
| 登录链接可达 | 客户员工登录链接 200 OK | 检查 C3 公网入口 |
| 火山 API 通 | 调用火山健康接口成功 | 检查火山服务 / API Key |
| 客户空间状态 | 火山空间 active | 联系火山客户经理 |
| IM 绑定健康 | 4 平台至少 1 个绑定 + 模拟登录通 | C2 重新测试 |
| 配额健康 | 各项配额使用率 < 80% | 提醒客户充值 |
| 证书有效 | 自定义域名证书 ≥ 30 天 | C3 续证 |
| 最近 1h 错误率 | < 1% | 拉日志详查 |
| 长会话清理 | < 100 个超 7 天活跃 | 巡检任务清理 |

##### 实现状态：❌ 待实现

#### 6.4.2 错误日志拉取

##### 输入
- 时间范围（默认最近 1h）
- 关键字（可选）
- 用户 ID（可选）

##### 输出
- 表格：时间、错误码、用户、Skill、Trace ID、描述
- 点 Trace ID 跳到主 PRD § A5.2 Trace 分析（穿透客户视角）

##### 实现状态：❌ 待实现

#### 6.4.3 网络连通性测试工具

##### 工具集

| 工具 | 输入 | 输出 |
|---|---|---|
| Ping | 域名 / IP | 时延 / 丢包 |
| Traceroute | 域名 / IP | 跳数 / 路径 |
| DNS Resolve | 域名 + DNS 服务器 | 解析结果 |
| TCP 端口探测 | IP + 端口 | 通 / 不通 |
| HTTP 健康 | URL | 状态码 / 时延 |
| 证书检查 | 域名 | 证书链 / 有效期 |

##### 实现状态：❌ 待实现

#### 6.4.4 远程协助（与超管 PRD § 5.6 共用）

##### 入口与流程
- 工单详情页或诊断页"申请远程协助"
- 必须录入：工单号 + 客户已书面授权（勾选 + 截图上传可选）
- 单会话 ≤ 2h（与超管 PRD § F1 一致）
- 进入客户工作台（顶部红色横幅）
- 客户管理员收到 3 重通知（站内 + 邮件 + 短信）
- 数据落 `impersonation_session`，`caller_role=R2.x`

##### R2 与 R1.3 CS- 的差异
- R1.3 CS- 走超管后台 B2.3 入口（业务客户支持）
- R2 走 C4 入口（技术性故障排查）
- 同表，区分入口与原因分类

##### 实现状态：❌ 待实现

#### 6.4.5 客户告警关闭

- 列表：当前客户的活跃告警
- 操作：关闭（必填原因）/ 抑制 X 小时（避免误报噪音）
- 不能批量关闭跨客户的告警

---

### 6.5 C5 健康巡检

#### 路径
列表 `/ops/inspection`
执行明细 `/ops/inspection/:run_id`

#### 6.5.1 巡检任务列表

##### 列
- 巡检 ID、类型（日 / 周 / 月）、执行时间、扫描客户数、异常数、自动建工单数、状态（运行中 / 完成 / 失败）

#### 6.5.2 巡检执行明细

##### 内容
- 表格：客户、检查项、结果（pass / fail / warn）、详情、生成的工单（如有）
- 筛选：失败项、按客户、按检查项

#### 6.5.3 巡检规则配置

##### 路径
`/ops/inspection/rules`（仅 OL-）

##### 字段
- 检查项 ID、名称、描述、执行频率（日 / 周 / 月）、阈值参数、失败时是否自动建工单 + 优先级映射、是否启用

##### 实现状态：❌ 待实现

---

### 6.6 C6 客户运维档案

#### 路径
`/ops/customers/:tenant_id`

#### 6.6.1 5 个 Tab

| Tab | 内容 |
|---|---|
| 概况 | 基本信息 + 当前 IM / 网络配置摘要 + 健康状态 |
| 历史工单 | 该客户的全部工单（含已关闭） |
| 配置变更日志 | binding_history + network_history 时间线 |
| 远程协助记录 | 该客户的所有 impersonation_session |
| 运维备注 | R2 内部知识沉淀（如"该客户内网走专线，私网出口 IP 是 xxx，注意" ） |

#### 6.6.2 运维备注

- 富文本（支持图片 / 链接）
- 多人协作：每条备注带作者 + 时间
- 仅 R2 内部可见，客户不可见
- 离职销售切走客户后保留备注（关联 tenant 不关联 sales）

##### 实现状态：❌ 待实现

---

## 七、数据模型

### 7.1 `ticket`（核心表）

```sql
CREATE TABLE ticket (
  id              BIGINT PRIMARY KEY,
  ticket_no       VARCHAR(32) NOT NULL UNIQUE,         -- OPS-2026042400001
  type            ENUM('onboarding','im_binding','network','tech_support','incident','data_export') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  related_order_id BIGINT REFERENCES `order`(id),
  related_alert_id BIGINT,
  source          ENUM('auto','customer','sales','inspection','internal') NOT NULL,
  priority        ENUM('P0','P1','P2','P3') NOT NULL DEFAULT 'P2',
  status          ENUM('new','assigned','in_progress','waiting_customer','waiting_internal','resolved','closed','reopened') NOT NULL DEFAULT 'new',
  assignee_id     BIGINT REFERENCES admin_user(id),
  assigner_id     BIGINT REFERENCES admin_user(id),
  sla_response_due TIMESTAMP,                            -- 响应截止时间
  sla_resolve_due TIMESTAMP,                            -- 解决截止时间
  sla_response_at TIMESTAMP,                            -- 实际响应时间
  sla_resolve_at  TIMESTAMP,                            -- 实际解决时间
  customer_visible BOOLEAN NOT NULL DEFAULT TRUE,       -- 客户是否可见
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  closed_at       TIMESTAMP,
  closed_reason   VARCHAR(50),
  INDEX idx_tenant (tenant_id),
  INDEX idx_assignee_status (assignee_id, status),
  INDEX idx_priority (priority),
  INDEX idx_sla_resolve_due (sla_resolve_due)
);
```

### 7.2 `ticket_event`（活动时间线）

```sql
CREATE TABLE ticket_event (
  id              BIGINT PRIMARY KEY,
  ticket_id       BIGINT NOT NULL REFERENCES ticket(id),
  event_type      ENUM('status_change','comment','assign','attachment','sla_alert','remote_assist','config_change') NOT NULL,
  actor_id        BIGINT NOT NULL,
  actor_role      VARCHAR(32) NOT NULL,
  payload         JSON NOT NULL,                        -- 详情，如 from_status / to_status / comment_text
  is_internal     BOOLEAN NOT NULL DEFAULT TRUE,        -- 内部 vs 对客户可见
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_ticket_time (ticket_id, created_at)
);
```

### 7.3 `ticket_attachment`

```sql
CREATE TABLE ticket_attachment (
  id              BIGINT PRIMARY KEY,
  ticket_id       BIGINT NOT NULL REFERENCES ticket(id),
  filename        VARCHAR(200) NOT NULL,
  url             VARCHAR(500) NOT NULL,
  size_bytes      BIGINT NOT NULL,
  uploaded_by     BIGINT NOT NULL,
  uploaded_at     TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.4 `binding`（IM 绑定，对应主 PRD § 十二）

```sql
CREATE TABLE binding (
  id              BIGINT PRIMARY KEY,
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  channel         ENUM('feishu','wecom','dingtalk','wechat') NOT NULL,
  config_encrypted JSON NOT NULL,                       -- AppID/Secret/Token 等密文
  callback_url    VARCHAR(500) NOT NULL,
  trusted_domain  VARCHAR(200),
  visible_scope   JSON,                                 -- 可见员工范围
  default_seat_level VARCHAR(32) NOT NULL,
  status          ENUM('active','disabled','broken') NOT NULL DEFAULT 'active',
  configured_by   BIGINT NOT NULL REFERENCES admin_user(id),
  configured_at   TIMESTAMP NOT NULL DEFAULT now(),
  last_test_at    TIMESTAMP,
  last_test_result ENUM('pass','fail') NOT NULL,
  last_test_detail JSON,

  UNIQUE KEY uk_tenant_channel (tenant_id, channel),
  INDEX idx_status (status)
);

CREATE TABLE binding_history (
  id              BIGINT PRIMARY KEY,
  binding_id      BIGINT NOT NULL REFERENCES binding(id),
  snapshot        JSON NOT NULL,
  changed_by      BIGINT NOT NULL,
  change_type     ENUM('create','update','rollback','disable','enable','delete') NOT NULL,
  ticket_id       BIGINT REFERENCES ticket(id),         -- 关联工单
  changed_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_binding_time (binding_id, changed_at)
);
```

### 7.5 `network_config`

```sql
CREATE TABLE network_config (
  id              BIGINT PRIMARY KEY,
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  
  -- 公网入口
  default_login_url VARCHAR(500),
  custom_domain   VARCHAR(200),
  custom_domain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  cert_url        VARCHAR(500),
  cert_expires_at TIMESTAMP,
  redirect_strategy JSON,
  
  -- 公网出口
  egress_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  egress_acceleration BOOLEAN NOT NULL DEFAULT FALSE,
  egress_node     VARCHAR(50),
  egress_whitelist JSON,
  egress_rate_limit JSON,
  
  -- 私网出口
  vpc_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  vpc_method      ENUM('direct','vpn','ccn'),
  vpc_id          VARCHAR(64),
  vpc_subnet      VARCHAR(64),
  vpc_gateway     VARCHAR(64),
  our_cidr        VARCHAR(64),
  routing         JSON,
  security_groups JSON,
  authorization_letter_url VARCHAR(500),                -- 客户授权书

  updated_by      BIGINT NOT NULL REFERENCES admin_user(id),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE KEY uk_tenant (tenant_id)
);

CREATE TABLE network_config_history (
  id              BIGINT PRIMARY KEY,
  tenant_id       BIGINT NOT NULL,
  snapshot        JSON NOT NULL,
  changed_by      BIGINT NOT NULL,
  change_type     ENUM('update','rollback') NOT NULL,
  ticket_id       BIGINT REFERENCES ticket(id),
  changed_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_tenant_time (tenant_id, changed_at)
);
```

### 7.6 `inspection_run` / `inspection_item`

```sql
CREATE TABLE inspection_run (
  id              BIGINT PRIMARY KEY,
  run_type        ENUM('daily','weekly','monthly','manual') NOT NULL,
  scheduled_at    TIMESTAMP NOT NULL,
  started_at      TIMESTAMP,
  finished_at     TIMESTAMP,
  scanned_tenants INT NOT NULL DEFAULT 0,
  failed_items    INT NOT NULL DEFAULT 0,
  generated_tickets INT NOT NULL DEFAULT 0,
  status          ENUM('pending','running','completed','failed') NOT NULL DEFAULT 'pending'
);

CREATE TABLE inspection_item_result (
  id              BIGINT PRIMARY KEY,
  run_id          BIGINT NOT NULL REFERENCES inspection_run(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  item_code       VARCHAR(50) NOT NULL,                 -- 检查项 ID
  result          ENUM('pass','fail','warn') NOT NULL,
  detail          JSON,
  generated_ticket_id BIGINT REFERENCES ticket(id),
  checked_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_run (run_id),
  INDEX idx_tenant_item (tenant_id, item_code)
);

CREATE TABLE inspection_rule (
  id              BIGINT PRIMARY KEY,
  item_code       VARCHAR(50) NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  frequency       ENUM('daily','weekly','monthly') NOT NULL,
  threshold_params JSON,
  auto_create_ticket BOOLEAN NOT NULL DEFAULT FALSE,
  default_priority ENUM('P0','P1','P2','P3'),
  enabled         BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 7.7 `ops_remark`（运维内部备注）

```sql
CREATE TABLE ops_remark (
  id              BIGINT PRIMARY KEY,
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  author_id       BIGINT NOT NULL REFERENCES admin_user(id),
  content         TEXT NOT NULL,
  attachments     JSON,
  pinned          BOOLEAN NOT NULL DEFAULT FALSE,       -- 置顶重要备注
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_tenant (tenant_id)
);
```

### 7.8 `impersonation_session`（与超管 PRD 共用，本 PRD 补充字段约束）

```sql
ALTER TABLE impersonation_session
  ADD COLUMN caller_module ENUM('admin_b2','ops_c4') NOT NULL DEFAULT 'admin_b2';
-- caller_module 用于区分 R1.3 CS- 还是 R2 的入口
```

---

## 八、接口清单

> 所有接口前缀 `/api/ops/`。鉴权：JWT + role_code ∈ {R2.0, R2.1, R2.2}。

### 8.1 工单

| Method | Path |
|---|---|
| GET | `/api/ops/tickets` |
| GET | `/api/ops/tickets/:id` |
| POST | `/api/ops/tickets` |
| PATCH | `/api/ops/tickets/:id`（标题、描述、优先级） |
| POST | `/api/ops/tickets/:id/assign` |
| POST | `/api/ops/tickets/:id/transfer` |
| POST | `/api/ops/tickets/:id/escalate`（升级到 R1） |
| POST | `/api/ops/tickets/:id/start`（接单） |
| POST | `/api/ops/tickets/:id/resolve` |
| POST | `/api/ops/tickets/:id/close` |
| POST | `/api/ops/tickets/:id/reopen` |
| POST | `/api/ops/tickets/:id/wait-customer` |
| POST | `/api/ops/tickets/:id/wait-internal` |
| POST | `/api/ops/tickets/:id/comments`（评论） |
| POST | `/api/ops/tickets/:id/attachments` |
| GET | `/api/ops/tickets/:id/events` |
| POST | `/api/ops/tickets/batch-assign`（OL-） |

### 8.2 IM 绑定

| Method | Path |
|---|---|
| GET | `/api/ops/im-binding/tenants/:id` |
| POST | `/api/ops/im-binding/tenants/:id/feishu`（创建 / 更新） |
| POST | `/api/ops/im-binding/tenants/:id/wecom` |
| POST | `/api/ops/im-binding/tenants/:id/dingtalk` |
| POST | `/api/ops/im-binding/tenants/:id/wechat` |
| POST | `/api/ops/im-binding/:binding_id/test` |
| POST | `/api/ops/im-binding/:binding_id/sync-employees` |
| POST | `/api/ops/im-binding/:binding_id/disable` |
| POST | `/api/ops/im-binding/:binding_id/enable` |
| GET | `/api/ops/im-binding/:binding_id/history` |
| POST | `/api/ops/im-binding/:binding_id/rollback` |

### 8.3 网络配置

| Method | Path |
|---|---|
| GET | `/api/ops/network/tenants/:id` |
| PATCH | `/api/ops/network/tenants/:id/ingress` |
| PATCH | `/api/ops/network/tenants/:id/egress` |
| PATCH | `/api/ops/network/tenants/:id/vpc` |
| POST | `/api/ops/network/tenants/:id/test`（一次性跑全部测试） |
| POST | `/api/ops/network/tenants/:id/test/dns` |
| POST | `/api/ops/network/tenants/:id/test/cert` |
| POST | `/api/ops/network/tenants/:id/test/egress` |
| POST | `/api/ops/network/tenants/:id/test/vpc` |
| POST | `/api/ops/network/tenants/:id/cert/upload` |
| POST | `/api/ops/network/tenants/:id/cert/acme`（自动签证书） |
| GET | `/api/ops/network/tenants/:id/history` |
| POST | `/api/ops/network/tenants/:id/rollback` |

### 8.4 诊断

| Method | Path |
|---|---|
| POST | `/api/ops/diagnosis/tenants/:id/quick` |
| GET | `/api/ops/diagnosis/tenants/:id/error-logs` |
| POST | `/api/ops/diagnosis/tools/ping` |
| POST | `/api/ops/diagnosis/tools/traceroute` |
| POST | `/api/ops/diagnosis/tools/dns` |
| POST | `/api/ops/diagnosis/tools/tcp-probe` |
| POST | `/api/ops/diagnosis/tools/http-health` |
| POST | `/api/ops/diagnosis/tools/cert` |
| POST | `/api/ops/diagnosis/tenants/:id/impersonate`（远程协助） |
| POST | `/api/ops/diagnosis/tenants/:id/alerts/:alert_id/close` |
| POST | `/api/ops/diagnosis/tenants/:id/alerts/:alert_id/suppress` |

### 8.5 巡检

| Method | Path |
|---|---|
| GET | `/api/ops/inspection/runs` |
| GET | `/api/ops/inspection/runs/:id` |
| POST | `/api/ops/inspection/runs/manual`（手动触发） |
| GET | `/api/ops/inspection/rules` |
| POST | `/api/ops/inspection/rules`（OL- 创建） |
| PATCH | `/api/ops/inspection/rules/:id` |

### 8.6 客户档案

| Method | Path |
|---|---|
| GET | `/api/ops/customers/:tenant_id/overview` |
| GET | `/api/ops/customers/:tenant_id/tickets` |
| GET | `/api/ops/customers/:tenant_id/changes`（配置变更日志） |
| GET | `/api/ops/customers/:tenant_id/impersonations` |
| GET | `/api/ops/customers/:tenant_id/remarks` |
| POST | `/api/ops/customers/:tenant_id/remarks` |
| PATCH | `/api/ops/customers/:tenant_id/remarks/:id` |
| DELETE | `/api/ops/customers/:tenant_id/remarks/:id` |

### 8.7 错误码

| Code | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 子角色无权 |
| 40302 | 需 OL- 审批 |
| 40303 | 需测试连通通过 |
| 40304 | 工单未关联 / 无单不操作 |
| 40901 | 域名 / 证书校验失败 |
| 40902 | IM 平台凭证错误 |
| 40903 | VPC 配置冲突 |
| 40921 | 配额超限（出口域名白名单数） |
| 50001 | 火山 API 调用失败 |
| 50002 | IM 平台 API 失败 |
| 50003 | 网络测试基础设施不可达 |

---

## 九、业务规则细则（关键边界，需 sign-off）

### G1 无单不操作

- 任何对客户配置的写操作（IM 绑定、网络配置、远程协助）必须**关联工单 ID**
- 接口层校验：缺少 `ticket_id` 直接返回 40304
- 例外：测试性接口（test-only）不写入实际配置

### G2 测试连通强制阻断

- IM 绑定 / 网络配置保存前必须通过最新一次连通测试
- 最新一次测试 > 5 分钟前 → 视为过期，必须重测
- 失败的测试结果不能保存配置

### G3 高危变更审批

| 变更 | 审批 |
|---|---|
| 启用 / 禁用自定义域名 | OL- |
| 启用跨境加速 | OL- |
| 启用 / 修改 VPC | OL- + 双人复核 |
| IM 解绑 | OL- |
| 网络配置回滚 | OL- |
| IM 绑定回滚 | OL- |

### G4 远程协助

完全沿用超管 PRD § F1：
- 单会话 ≤ 2h
- 同一 R2 用户同时只能 1 个会话
- 强制工单号 + 客户授权
- 客户管理员 3 重通知
- 全程审计

### G5 客户授权书

- 私网出口启用 → 必须客户书面授权（PDF 上传到 `network_config.authorization_letter_url`）
- 没有授权书 → 直接拒绝保存
- 授权书有效期 12 个月，过期前 30 天自动建工单催更新

### G6 SLA 超时升级

- 工单超过 SLA 解决时长 → 自动 +1 优先级（P3 → P2 等等）
- 优先级到 P0 后再超时 → 通知 OL- 主管
- 通知 R1 平台运营（OP-）评估是否升级到平台层面响应

### G7 IM 绑定的密文存储

- 所有 Secret / Token 字段必须加密存储（AES-256-GCM）
- 密钥保存在 KMS（云服务）或 Vault（自建）
- 应用层取出仅在调用时解密，不返回前端
- 编辑界面始终显示 `****`

### G8 域名白名单

- 公网出口加速域名白名单**默认拒绝**
- 添加域名 → 必须有合理理由记录
- 黑名单域名（赌博 / 色情 / 政治敏感）系统强阻断

### G9 巡检自动建工单

- 同一客户同一检查项 24h 内重复失败 → 不重复建工单（合并）
- P0 / P1 工单建立时自动通知对应客户经理（销售）
- 如检查项失败但 R2 已主动跟进（同检查项 24h 内有人工操作）→ 不建工单

### G10 工单评论可见性

- 默认 `is_internal=true`（内部）
- 切换"对客户可见"必须手动确认（防误发敏感信息）
- 内部评论中的"@客户管理员"必须是 R2 主动转可见

---

## 十、状态机

### 10.1 工单 `ticket.status`

```
new ──分派──→ assigned ──接单──→ in_progress
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
   waiting_customer       waiting_internal           （直接 resolve）
              │                     │
              └──客户回复─────┬──────┘
                              │
                              ▼
                          in_progress
                              │
                              ▼
                          resolved ─客户确认 / 24h 自动─→ closed
                              │
                              └─重开─→ assigned
                              
                              closed ─重开（72h 内）─→ assigned (reopened)
```

### 10.2 IM 绑定 `binding.status`

```
（创建 + 测试通过）→ active ─手动停用─→ disabled
   │
   ├─手动启用──→ active
   │
   └─巡检发现失效──→ broken ──修复 + 测试通过──→ active
```

### 10.3 巡检任务 `inspection_run.status`

```
pending ──cron 触发──→ running ──全部完成──→ completed
                                  └──发生异常──→ failed（记录失败原因）
```

### 10.4 远程协助会话（同超管 PRD § 10.8）

---

## 十一、权限矩阵（R2 子角色级 + 与 R1 接触面）

| 模块 / 操作 | R2.0 OL- | R2.1 DE- | R2.2 TS- | R1.0 SU- | R1.3 CS- |
|---|---|---|---|---|---|
| 工单查看（全 team） | ✅ | ✅ 我的 + 未分派 | ✅ 我的 | 🔍 | 🔍 |
| 工单分派 / 转单 | ✅ | ✅（自己转他人） | ✅（自己转他人） | ✅ | ❌ |
| 工单升级到 R1 | ✅ | ✅ | ✅ | — | — |
| IM 绑定查看 | ✅ | ✅ | 🔍 | 🔍 | ❌ |
| IM 绑定 CRUD | ✅ | ✅ | ❌ | ✅ | ❌ |
| IM 测试连通 | ✅ | ✅ | ✅ | ✅ | ❌ |
| IM 解绑 | ✅ | ❌（需 OL- 审批） | ❌ | ✅ | ❌ |
| IM 回滚 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 网络配置查看 | ✅ | ✅ | 🔍 | 🔍 | ❌ |
| 网络配置编辑（普通） | ✅ | ✅ | ❌ | ✅ | ❌ |
| 网络配置编辑（高危） | ✅ | ❌（需 OL- 审批） | ❌ | ✅ | ❌ |
| 网络配置回滚 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 诊断工具 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 远程协助发起 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 远程协助审计抽查 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 巡检任务查看 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 巡检规则配置 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 客户运维档案 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 客户运维备注 CRUD | ✅ | ✅ | ✅ | ✅ | ❌ |
| 火山 API 凭证查看 | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 十二、非目标（明确指向其他文档）

| 不做 | 在哪做 |
|---|---|
| 客户业务数据操作（Claw / 技能 / 用量） | 主 PRD § 六 A（R4） |
| 销售归因 / 佣金 | 销售 CRM PRD |
| 财务退款 / 对公审核 | 超管 PRD § B3 |
| R2 自身账号 CRUD | 超管 PRD § B10 |
| 火山控制台底层基础设施 | 火山原生 |
| 自建监控基础设施 | 接入 Prometheus / Grafana / 阿里云监控 |
| 跨平台 IM 数据同步（飞书 → 钉钉等） | 不做 |
| 全自动 IT 运维（IaC / Ansible 化） | 暂不引入 |
| 客户业务知识库 | 走客户企业管理员 R4 |

---

## 十三、成功指标（首版 GA 3 个月内）

| 类别 | 指标 | 目标 |
|---|---|---|
| **效率** | 客户开通工单平均时长（订单 paid → 工单 closed） | ≤ 8 工作小时 |
| | IM 绑定平均时长 | ≤ 2 小时 |
| | 客户技术工单平均响应时长 | ≤ 30 分钟（P1 以上） |
| | 客户技术工单平均解决时长 | ≤ 24 小时（P1 以上） |
| **质量** | 配置变更回滚率 | ≤ 5% |
| | 测试连通失败率 → 重试成功率 | ≥ 85% |
| | 巡检异常自动建单准确率（非误报） | ≥ 90% |
| **客户** | 工单客户满意度（resolved 后调查） | ≥ 4.5/5 |
| | 重开工单率 | ≤ 10% |
| | 远程协助客户主动撤回率 | ≤ 2% |
| **稳定** | C1-C6 所有页面 P95 响应 | ≤ 1.5s |
| | 巡检按时执行率 | ≥ 99% |
| | IM 绑定密文加密合规 | 100% |

---

## 十四、测试要点 / 端到端验证

### 14.1 必测路径

1. **客户开通端到端**：
   订单 paid → 自动建 onboarding 工单 → DE- 接单 → C2 配置飞书绑定 → 测试连通通过 → 保存 → 触发员工同步 → 客户收到 3 重通知 → 工单 resolved → 24h 后自动 closed
2. **IM 绑定回滚**：
   配置 V1 → 测试通过保存 → 配置 V2 失误 → 测试失败 → 紧急回滚 V1 → OL- 审批 → 配置生效
3. **网络配置高危变更审批**：
   DE- 提交"启用跨境加速" → OL- 看到审批工单 → 通过 → 配置生效 + 客户通知
4. **远程协助闭环**：
   TS- 在工单点"远程协助" → 录工单号 + 授权 → 进入客户工作台（红色横幅） → 客户收到 3 重通知 → 2h 自动结束 → 审计完整
5. **巡检自动建单**：
   模拟客户证书剩 5 天 → 巡检触发 → 自动建 P0 工单 → 自动通知 DE- + 销售 + 客户经理
6. **SLA 超时升级**：
   P2 工单 48h 未解决 → 自动升级 P1 + 通知 OL- → 4h 后再超 → 通知 R1
7. **无单不操作拦截**：
   任何配置接口缺 ticket_id → 40304 + 审计警告
8. **测试连通强制**：
   IM 绑定提交保存但未做测试 → 40303 阻断

### 14.2 边界测试

- 同时多个 DE- 在同一客户上配置 IM → 乐观锁 / 串行化
- 工单超过 P0 优先级再超时 → 进入"主管告警"
- 巡检任务被另一巡检任务并发触发 → 跳过
- 客户授权书过期但仍有 VPC 配置 → 30 天前自动催；7 天前升级；过期当天禁用
- 跨平台同时绑定（飞书 + 企微）→ 员工映射去重

### 14.3 现状校准

打开 `http://localhost:5160/ops/tickets`，对照下表填补：

| 模块 | 原型 | PRD 对应 | 差距 |
|---|---|---|---|
| C1 工单列表 | 🔄 | § 6.1 | 待开发对照填 |
| C1 工单详情 | 🔄 | § 6.1.2 | 待开发对照填 |
| C2 IM 绑定 | 🔄 | § 6.2 | 待开发对照填 |
| C3 网络配置 | 🔄 | § 6.3 | 待开发对照填 |
| C4 诊断 | 🔄 | § 6.4 | 待开发对照填 |
| C5 巡检 | 🔄 | § 6.5 | 待开发对照填 |
| C6 客户档案 | 🔄 | § 6.6 | 待开发对照填 |

---

## 十五、风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| **IM 平台 API 变更**（飞书 / 企微 / 钉钉 / 微信任一改了接口） | 客户登录大面积失败 | 巡检每日跑模拟登录；版本变更预警；保留历史快照可快速回滚 |
| **证书自动签失败 / 续期遗漏** | 客户站点告警、登录失败 | 30 天 / 7 天 / 当天三档巡检；自动 ACME 续签 + 失败时人工介入工单 |
| **R2 配置错误**（错填 Secret） | 客户登录失败 | 强制测试连通通过才能保存；单测覆盖各 IM 平台的核心场景 |
| **跨境加速合规问题** | 法务风险 | 默认禁用；启用必须 OL- + 客户授权书；季度合规复审 |
| **远程协助滥用**（无单登录、长时间停留） | 隐私 / 信任 | G1 无单不操作 + 单会话 ≤ 2h + 客户全程通知 + OL- 月度抽查 |
| **巡检告警风暴** | 团队疲劳 | 同检查项 24h 合并；告警分级；OL- 可调阈值 |
| **客户工单堆积** | 客户体验差 | SLA 自动升级 + 主管告警 + 月度工单流转分析 |
| **私网出口配置错误**（路由冲突） | 客户内网中断 | 双人复核 + 必有客户授权书 + 强制测试可达性 |
| **IM 绑定 Secret 泄露** | 客户 IM 数据被攻击 | KMS / Vault + 应用层不返前端 + 定期轮换提示 |
| **删除工单导致历史丢失** | 合规失效 | 工单只能 closed，不能 delete；DB 层禁删 |

---

## 十六、引用映射表

| 本 PRD 章节 | 来源 |
|---|---|
| § 2.1 模块定位 | 0423 会议 00:47-01:54 |
| § 3.1 R2 子角色拆分 | 本 PRD 新增（与超管 PRD 体例一致） |
| § 5.1 客户开通工单 | 主 PRD § 八 C1 + § 七 B3"订单 paid 触发"流程拼合 |
| § 5.2 IM 绑定 | 主 PRD § 八 C2 + 0423 会议（"绑定飞书 / 企微") |
| § 5.3 网络配置 | 主 PRD § 八 C3 + 0423 会议（"网络配置只给运维看") |
| § 5.4 远程协助 | 主 PRD § 八 C4 + 超管 PRD § 5.6 |
| § 5.5 巡检 | 本 PRD 新增（C5 模块） |
| § G1-G10 业务规则 | 本 PRD 新增 |

---

## 十七、附录

### 17.1 术语表

| 术语 | 解释 |
|---|---|
| R2 / 交付运维 | 云脑智联内部技术 / 运维角色 |
| OL- / DE- / TS- | R2 子角色：运维主管 / 交付工程师 / 技术支持 |
| 工单 / Ticket | 技术任务承载单元；有类型、优先级、状态、SLA |
| SLA | Service Level Agreement，工单的响应 / 解决时长承诺 |
| IM | Instant Messaging（飞书、企微、钉钉、微信） |
| AgentID / Secret | IM 平台应用的凭证 |
| VPC | Virtual Private Cloud，虚拟私有云 |
| ACME | Automatic Certificate Management Environment，自动证书签发协议 |
| KMS | Key Management Service，密钥管理服务 |
| 巡检 | 定时对所有客户做的自动健康检查 |
| 远程协助 | R2 以客户管理员身份登录排查问题，等同代登录 |
| pHash | 凭证图感知哈希（与超管 PRD 共用） |

### 17.2 IM 平台开发文档（开发参考）

> 实施期外链，本节仅占位，写代码时由开发查阅最新版

- 飞书：https://open.feishu.cn/
- 企业微信：https://developer.work.weixin.qq.com/
- 钉钉：https://open.dingtalk.com/
- 微信公众平台：https://developers.weixin.qq.com/

### 17.3 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-04-24 | 首版，基于主 PRD § C + 0423 会议 + 现有原型 | Claude + 运维团队 |

### 17.4 sign-off 区

#### 运维负责人 sign-off
- [ ] § 2.4 设计原则（无单不操作 / 测试在前 / 默认拒绝）可执行
- [ ] § 3.1 R2 三子角色拆分合理
- [ ] § 6.1 工单 SLA 矩阵（P0-P3）可达成
- [ ] § 6.2 IM 绑定四平台向导设计合理
- [ ] § 6.3 网络配置高危变更审批流程可接受
- [ ] § 6.5 巡检规则可执行（不会造成告警风暴）
- [ ] § 13 KPI 可达

签字 / 日期：__________________________________

#### 安全 / 合规负责人 sign-off
- [ ] § G1 无单不操作强制可执行
- [ ] § G4 远程协助约束（2h、客户通知、审计）满足合规
- [ ] § G5 客户授权书机制可接受
- [ ] § G7 IM 凭证密文存储方案可接受
- [ ] § G8 域名黑白名单合规
- [ ] § 15 远程协助滥用风险已被覆盖

签字 / 日期：__________________________________

---

**文档结束**
