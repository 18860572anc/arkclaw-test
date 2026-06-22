# 官方管理员后台 · 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.3 |
| 撰写日期 | 2026-05-15（v1.0：2026-04-24 / v1.1：Beta1 收敛 / v1.2：仪表盘重构） |
| 模块代号 | 模块 B · 我司官方管理员后台（R1）—— 细化版 |
| 父文档 | `/1-prd/PRD.md`（v1.0） |
| 兄弟文档 | `/1-prd-det/销售CRM-PRD.md`（v1.2）、`/1-prd-det/财务佣金结算-PRD.md`（v1.0）、`/1-prd-det/运维支持后台-PRD.md`（v1.0） |
| 目标读者 | 前端开发、后端开发、QA、PM |
| 范围 | Beta1 统一为"官方管理员"单角色；覆盖企业、订单、对公审核、开通任务、退款、销售、销售继承、留资、佣金规则、佣金流水、套餐价格、内部员工账号 |
| 状态 | 待评审（运营 + 财务 + 法务 三方 sign-off） |

---

## 📌 v1.3 重要变更（2026-05-15 · 来自 5/15 李磊快速会议）

| 变更 | 影响章节 |
|---|---|
| **术语清理**：旧版"代理"在本体系下已统一改名为"销售"；**"代理"重新定义为拥有镜像站的合作伙伴角色**（独立账号、自有品牌、自管下属销售、后置佣金） | § 1.4、§ 3.x |
| **新增 § 6.12 代理商管理模块**：代理账号开通、进货充值、佣金记录、提现工单（手工）、镜像站配置入口 | § 6.12 🆕 |
| **§ 6.4 销售管理补充**：销售可分"直营 / 代理下属"两类，加 `agent_id` 维度 | § 6.4 |
| **§ 6.6 套餐与价格补充**：代理可在自己镜像站内自定义套餐价格（接受让利） | § 6.6 |
| **§ 2.2 In Scope 新增 B12**：代理商管理（5/20 GA 范围）| § 2.2 |
| **§ 6.5 佣金管理补充**：销售佣金 vs 代理佣金两条线 | § 6.5 |
| 防串货机制 / 钱包余额 / 代金券 → 明确进 V2，本期不做 | § 12 |

> **重要边界**：本 PRD 仅描述官方管理员**对代理的管理动作**；代理自己使用的镜像站后台 PRD 另行独立成文（建议 `代理商-PRD.md`）。

---

## 📌 v1.2 重要变更（2026-05-08）

| 变更 | 影响章节 |
|---|---|
| **§ 6.1 全局仪表盘重构**：从"9 张 KPI 卡平铺 + 待办在中下"改为"四区分层（告警 / 待办 / 经营 / 健康），待办优先" | § 6.1 |
| 每张待办卡新增"关联金额 + CTA 按钮"，禁止纯展示卡片 | § 6.1.2 |
| 每张经营指标卡新增"环比上月 ▲▼ %" | § 6.1.3 |
| 新增刷新策略矩阵（不同区不同频率） | § 6.1.5 |
| 引用财务佣金结算 PRD 作为 § B5 详细执行参考（本 PRD 不重写佣金细节） | 文档元信息 |

---

## 一、文档元信息

### 1.1 与主 PRD 的引用映射

| 本 PRD 章节 | 主 PRD 对应 |
|---|---|
| § 6.1 全局仪表盘 | § 七 B1 |
| § 6.2 企业（租户）管理 | § 七 B2 |
| § 6.3 订单与账单 | § 七 B3 |
| § 6.4 销售管理 | § 七 B4 |
| § 6.5 佣金与分成规则 | § 七 B5 |
| § 6.6 套餐与价格 | § 七 B6 |
| § 6.7 资讯管理 | Beta2 后置，不进入 Beta1 |
| § 6.8 咨询留资池 | Beta1 必做 |
| § 6.9 系统配置 | Beta2 后置，不进入 Beta1 |
| § 6.10 内部员工管理 | Beta1 只做账号开通和基础状态 |
| § 6.11 系统监控与告警 | Beta2 后置，不进入 Beta1 |
| § 7 数据模型 | § 十二 |
| § 11 权限矩阵 | § 十一 |

### 1.2 与销售 CRM PRD 的协同点

- §6.4 销售管理 ↔ 销售 PRD § E1（销售离职继承）、E7（归属期内变更归属）的执行入口
- §6.5 佣金 ↔ 销售 PRD § E4 / E5（佣金触发与回退）的对账与发放
- §6.8 咨询留资 ↔ 销售 PRD § 6.5 / 5.4（手动分配规则 D8）

### 1.3 引用资产

- `/1-prd/PRD.md` 主 PRD（§ 七、§ 十二、§ 十一）
- `/1-prd-det/销售CRM-PRD.md`（v1.0）
- `/0423会议.md`（§ 01:54-02:37 R1 角色诉求段）
- `/0-assets/ArkClaw/` 火山控制台原型（视觉风格对齐）
- `http://localhost:5160/admin/dashboard` 当前已实现的管理后台原型

### 1.4 术语对齐（详见 § 17.1）

- **官方管理员**：云脑智联内部用于跑通 Beta1 主流程的统一后台角色
- **后置治理能力**：代登录、权限矩阵、MFA、双人复核、系统参数、监控告警等 Beta2 能力
- **批次（Batch）**：佣金按月汇总发放的执行单元，Beta1 只展示佣金流水，不做发放批次
- **强制接管（Override）**：内部干预业务进程的紧急动作，Beta1 不开放
- **平台**：本 PRD 中"平台 = 云脑智联 × ArkClaw 代理 SaaS 整体"
- **销售（Sales）🔄 v1.3 澄清**：云脑智联体系内的销售员；可分两类
  - **直营销售**：我方员工，归属"官方"，佣金率走平台标准（如 5%）
  - **代理下属销售**：归属某个代理，佣金由代理自己分配，平台不直接结算给该销售
- **代理（Agent）🆕 v1.3**：拥有**独立镜像站**的合作伙伴角色，**不是我方员工**
  - 全款进货 + 后置佣金（如 30%）
  - 镜像站可改 logo / 标题 / 自定义套餐价格
  - 可在自己镜像站下挂自己的销售
  - **不能再发展下级代理**（防传销，只做一级）
  - **不交付**（全部由我方交付，客户最终归到我方平台）
- **镜像站（Mirror Site）🆕 v1.3**：代理拥有的独立品牌前端，本质是平台同一套后端 + 代理自定义品牌包装
- **直营 vs 代理体系**：客户最终都进同一个平台后端，差异仅在"前端门面"和"佣金归属"

---

## 二、模块定位、目标与设计原则

> **Beta1 范围收敛说明**：官方管理后台在 Beta1 不区分 R1.0 超级管理员 / R1.1 平台运营 / R1.2 财务专员 / R1.3 客户支持。前端、菜单、验收均统一为一个“官方管理员”角色。子角色、权限矩阵、内部员工权限治理、MFA、双人复核等能力作为 Beta2 治理能力后置；内部员工账号开通保留在 Beta1。
> **阅读口径**：Beta1 开发和验收以 §2.2、§3.1、§11 为准。文中保留的代登录、销售调拨审批、复杂权限矩阵、系统配置、监控告警等详设均按 Beta1.1 / Beta2 草案处理，不进入当前原型导航和直达页面。

### 2.1 模块定位

官方管理员后台是云脑智联**内部运营人员**操控 Beta1 主链路的"驾驶舱"。它的本质不是客户业务操作（业务由客户企业管理员在自己的工作台中完成），而是：

1. **看主链路**：待审对公、待开通、开通异常、佣金 pending 的统一视图。
2. **管运营闭环**：客户、订单、对公审核、退款、开通任务、销售归属、留资、佣金规则、佣金流水、套餐价格、内部员工账号。
3. **做必要确认**：只保留对公审核、开通任务推进、销售归属确认等与开通闭环直接相关的操作。
4. **保基本留痕**：关键操作记录原因和处理人；完整审计后台、权限矩阵和内部员工权限治理后置。

### 2.2 本期目标（In Scope）

| # | 模块 | 核心能力 |
|---|---|---|
| B1 | 全局仪表盘 | 平台关键待办：待审对公、待开通、开通异常、佣金待确认 |
| B2 | 企业（租户）管理 | 企业列表、后台补录企业、企业详情、销售归属、订单与开通状态 |
| B3 | 订单与账单 | 订单查看、对公转账审核、退款处理、开通任务关联 |
| B4 | 销售管理 | 销售列表、销售详情、名下客户、销售继承；**v1.3 新增：销售可分直营 / 代理下属** |
| B5 | 佣金管理 | 基础佣金规则、佣金流水、订单关联和状态；**v1.3 新增：销售佣金 vs 代理佣金两条线** |
| B6 | 套餐与价格 | 标准套餐和价格口径维护；**v1.3 新增：代理可在镜像站内自定义价格** |
| B8 | 咨询留资池 | 留资列表、手动分配销售、状态追踪 |
| B10 | 内部员工账号 | 新增员工、基础角色、账号状态 |
| **B12** 🆕 | **代理商管理** | **代理账号开通、进货充值、佣金记录、提现工单（手工）、镜像站配置入口** |

### 2.3 非目标（Out of Scope，详见 § 12）

- ❌ 客户业务数据的直接操作（Claw 实例改写、Token 用量改写）—— 走主 PRD § 六 A 的客户侧
- ❌ 火山底层基础设施配置 → 火山原生控制台
- ❌ 销售自助操作 → 销售 PRD
- ❌ 交付运维操作（绑定 IM / 网络配置）→ 主 PRD § 八 C
- ❌ 自动化运维 / IaC（基础设施即代码）—— 暂不引入
- ❌ 多级审批工作流引擎 / 双人复核 —— Beta1 不进入前台原型

### 2.4 设计原则

1. **单角色先跑通**：Beta1 只有“官方管理员”，不做 R1 子角色和权限矩阵；内部员工只做账号开通和基础状态。
2. **主链路优先**：企业、订单、对公审核、退款、开通任务、销售归属、留资、佣金规则、佣金流水优先于系统治理能力。
3. **操作留痕**：对公审核、开通任务、销售归属、套餐价格变更需要保留操作记录；完整审计后台后置。
4. **高风险能力后置**：代登录、双人复核、MFA、角色授权、系统参数修改不进入 Beta1。

---

## 三、角色与权限边界

### 3.1 Beta1 官方管理员角色

Beta1 不拆 R1 子角色，统一为：

| 角色 | 主要职责 | Beta1 权限范围 |
|---|---|---|
| **官方管理员** | 管企业、管订单、审对公、处理退款、推进开通、看销售和佣金、开内部账号 | B1-B6、B8、B10 的 Beta1 能力 |

后续当对公审核、客户运营、客服支持、系统治理分工变重时，再拆分 R1.0 / R1.1 / R1.2 / R1.3。

### 3.2 与其他角色的接触面

| 接触场景 | R1 可做 | R1 不可做 |
|---|---|---|
| 客户企业管理员账号 | 查看管理员状态、必要时提示客户侧处理 | 代登录、重置密码、暂停账号 |
| 客户业务数据（Claw / 用量） | 查看摘要和状态 | 直接修改业务数据 |
| 销售客户绑定 | 查看销售归属，必要时记录备注 | 客户调拨审批、离职继承流程 |
| 火山 API 凭证 | 不在前台展示 | 直接配置或轮换火山凭证 |
| 自己的薪资 / 提成 | — | — |
| 删除审计日志 | **任何子角色都不可** | 数据库层面禁删 |

---

## 四、用户故事

| ID | As a | I want | So that |
|---|---|---|---|
| US-A01 | OP- 平台运营 | 一个仪表盘看到平台月活、本月 GMV、对公转账待审核 | 知道每天最重要的事是什么 |
| US-A02 | OP- | 看到平台所有企业列表 + 各家本月消耗 | 识别 Top 客户与濒危客户 |
| US-A03 | CS- 客户支持 | 临时以企业管理员身份登录排查客户问题 | 不需要客户配合即可定位 |
| US-A04 | OP- | 暂停一个欠费企业的访问 | 协助财务催款 |
| US-A05 | FI- 财务 | 看到所有待审核的对公转账凭证、批量审核 | 客户款项及时到账 |
| US-A06 | FI- | 处理客户退款申请、自动同步火山额度回退 + 佣金冲销 | 退款链路闭环 |
| US-A07 | OP- | 给销售调拨一个被错绑的客户 | 解决归因争议 |
| US-A08 | OP- | 处理销售离职：把客户全部转给接手销售 | 业务连续性 |
| US-A09 | FI- | 月初一键生成上月佣金发放批次、导出打款单 | 财务可执行 |
| US-A10 | OP- | 上线一档新的"年度套餐 7 折活动" | 配合促销 |
| US-A11 | OP- | 发布一篇产品更新资讯 | 客户感知到平台进展 |
| US-A12 | OP- | 把咨询留资分给某个销售 + 设置 24h SLA | 留资不丢 |
| US-A13 | SU- 超管 | 给一个新入职财务专员开 R1.2 账号 + MFA | 团队扩容 |
| US-A14 | SU- | 看到所有 R1 在过去 30 天的所有写操作日志 | 内部合规 |
| US-A15 | SU- | 配置全局通知模板（充值成功邮件） | 改文案不发版 |
| US-A16 | OP- | 看到平台所有销售的业绩排行榜 | 月度评优 |
| US-A17 | FI- | 看到本月异常订单（金额超阈值 / 同客户高频订单） | 风控 |
| US-A18 | SU- | 火山 API 异常时立刻收告警 + 看到失败接口 | 应急响应 |

---

## 五、核心业务流程

### 5.1 对公转账审核

```
客户在 A7.2 选择对公转账 → 上传凭证 + 唯一备注号
        │
        ▼
order.status=pending_review，bank_transfer_proof_url 落库
        │
        ▼
进入 B3.3 对公转账审核队列（FI- 可见）
        │
        ▼
FI- 比对：备注号 / 凭证金额 / 银行流水
        ├─ 一致 → 点"通过" → order.paid → 生成企业开通任务
        │           └─ 开通任务完成后触发佣金（销售 PRD § 5.2 / E4）
        ├─ 金额不符 → 点"驳回" → 录入原因 → 客户站内 + 短信通知
        └─ 凭证可疑 → 点"挂起" → 进入异常订单池等线下沟通
```

### 5.2 退款流程

```
客户提工单"申请退款"（出本 PRD 范围，工单系统）
        │
        ▼
FI- 在 B3.4 退款审核创建退款单 (refund_request, status=pending)
        │
        ├─ 金额 < 10 万：单人 FI- 审批
        └─ 金额 ≥ 10 万：双人复核（FI- + R1.0 SU-）
        │
        ▼
通过 → 调支付通道退款 API → 同步火山额度回退
        │
        ▼
触发 commission 状态扭转（销售 PRD § E5）
        │
        ▼
refund_request.status=completed
```

### 5.3 佣金月度发放

```
每月 1 日 00:30 系统自动跑定时任务
        │
        ▼
扫描上月所有 commission(status=confirmed)
        │
        ▼
按 sales_id 聚合 → 生成 commission_batch (status=pending_review)
        │
        ▼
FI- 在 B5.3 看到批次 → 抽查 ≥ 5 条流水 → 通过
        │
        ▼
导出"打款单 CSV"（销售工号 / 姓名 / 金额 / 银行账号 / 备注）
        │
        ▼
财务线下打款 → 回到 B5.3 标记 batch.status=paid
        │
        ▼
批次内所有 commission.status=paid + 销售收到站内消息
```

### 5.4 销售离职 → 客户继承

```
HR 通知销售离职（系统外）
        │
        ▼
SU- 在 B4.4 选择该销售 → 操作"标记离职"
        │
        ▼
弹窗：选择"接手销售"（同 Team / 自定义）
        │
        ▼
批量更新 sales_customer.sales_id = 接手销售 id
        │
        ├─ 归属期 valid_until 不变（保护客户体验）
        └─ 历史 commission 不动（已发已发，未发归原销售）
        │
        ▼
原销售 sales.status=left
        │
        ▼
接手销售收到站内通知 + 客户列表新增 N 条
```

### 5.5 客户跨销售调拨（归属期内变更）

```
客户主动要求换销售（线下）
        │
        ▼
原销售 / 客户经理在工单系统提"客户调拨申请"
        │
        ▼
OP- 在 B4.5 看到申请 → 双人复核（OP- + SU-）
        │
        ▼
通过 → sales_customer.sales_id 改写
        │
        ▼
切割时点起新订单佣金归新销售；旧订单佣金不动
        │
        ▼
审计日志强制记录原因 + 双方签字
```

### 5.6 R1 代登录

```
CS- 客户支持收到客户工单"我登不进去"
        │
        ▼
B2.6 代登录入口 → 选择目标企业 → 选择目标管理员账号
        │
        ▼
弹窗：必须录入"代登录原因"+"工单号"
        │
        ▼
点"确认"二次确认
        │
        ▼
开启代登录会话 (impersonation_session)，写 session 起始审计
        │  · session_token 生成
        │  · 时长 ≤ 2 小时
        │  · 客户企业管理员收到站内 + 邮件 + 短信通知
        ▼
CS- 进入客户工作台（顶部红色横幅"⚠️ 你正在以 XX 身份登录，倒计时 1:59:00"）
        │
        ▼
执行操作（每个写操作单独审计）
        │
        ▼
点"结束代登录" / 时长到期 / 主动登出
        │
        ▼
session 结束，写 session 结束审计 + 操作摘要
```

---

## 六、功能详解

> 标注约定：✅ 已实现 / ⚠️ 部分实现 / ❌ 待实现 / 🔄 待校准（基于 `localhost:5160/admin/dashboard` 现有原型）

### 6.1 B1 全局仪表盘（v1.2 重构）

#### 路径
`/admin/dashboard`

#### 6.1.1 设计原则

仪表盘是**官方管理员每天进入工作的起点**，不是给老板看的大屏报表。本期遵循 4 条原则：

1. **以"今日要做什么"开篇**，不以"平台累计有多大"开篇
2. **三段式信息层级**：紧急 → 经营 → 健康，每段视觉、颜色、密度都要分开
3. **每张卡片都有 click-through**：禁止纯展示卡片，必有跳转 / CTA
4. **Beta1 强收敛**：4 张待办 + 4 张经营 + 1 张趋势 + 2 张排行 + 1 个折叠健康区，**单屏内完整可见**

#### 6.1.2 页面结构（四区分层）

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠️ 平台异常告警条（仅在有告警时出现，无告警时整条隐藏）              │
│  示例：火山 API 错误率 5.2%（持续 7 分钟）│ 凭证 phash 命中重复 1 笔  │
└────────────────────────────────────────────────────────────────────┘

┌────────────── 第 1 区 · 今日待办（最高优先，永远在最上） ────────────┐
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ 🔴 待审    │ │ 🟡 待开通  │ │ 🟠 开通    │ │ 🔵 佣金    │        │
│  │ 对公       │ │ 任务       │ │ 异常       │ │ 待确认     │        │
│  │   3 笔     │ │   5 笔     │ │   1 笔     │ │   7 笔     │        │
│  │ ¥58,300   │ │     —      │ │ ¥12,000   │ │ ¥3,400    │        │
│  │            │ │            │ │            │ │            │        │
│  │ [去处理 →] │ │ [去处理 →] │ │ [去处理 →] │ │ [去处理 →] │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                      │
│  规则：每张卡 = 图标 + 业务名 + 数量 + 关联金额 + CTA 按钮             │
│  数字为 0 时卡片淡灰显示但保留位置（便于扫视稳定）                     │
└──────────────────────────────────────────────────────────────────────┘

┌────────────── 第 2 区 · 本月经营核心（数字 + 趋势） ─────────────────┐
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ 本月 GMV   │ │ 本月新增   │ │ 本月活跃   │ │ 本月新签   │        │
│  │            │ │ 企业       │ │ 企业       │ │ 订单       │        │
│  │ ¥184,500   │ │ 6          │ │ 47         │ │ 23         │        │
│  │ ▲ 12%      │ │ ▲ 50%      │ │ ▼ 3%       │ │ ▲ 9%       │        │
│  │ [订单列表] │ │ [企业列表] │ │ [企业列表] │ │ [订单列表] │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  近 30 天 GMV 趋势（折线，区分新签 vs 续费）                  │   │
│  │                                                              │   │
│  │            ╱╲                                                │   │
│  │           ╱  ╲      ╱╲                                       │   │
│  │  ════════╱════╲════╱══╲══════════                            │   │
│  │  新签 ━━ 续费 ┄┄                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

┌────────────── 第 3 区 · 本月排行（左右分栏） ────────────────────────┐
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ 🏢 Top 5 企业本月消耗     │  │ 🧑‍💼 Top 5 销售本月业绩    │       │
│  │  1. 某某科技 ¥xx,xxx     │  │  1. 张三 ¥xx,xxx         │         │
│  │  2. 某某制造 ¥xx,xxx     │  │  2. 李四 ¥xx,xxx         │         │
│  │  3. ...                  │  │  3. ...                  │         │
│  │  [查看完整 →]             │  │  [查看完整 →]            │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────┘

┌────────────── 第 4 区 · 平台健康（默认折叠） ───────────────────────┐
│  ▶  平台状态正常  · 最近一次检查 14:32                              │
│  （展开后显示）                                                      │
│  · 火山 API 成功率 99.3% / P95 320ms                                 │
│  · 平台 P95 1.4s / 月可用性 99.7%                                     │
│  · cron 任务（佣金批次 / 销售对账单 / 健康巡检）：全部正常             │
└──────────────────────────────────────────────────────────────────────┘
```

#### 6.1.3 第 1 区 · 今日待办卡片定义

| 卡片 | 数量计算 | 关联金额 | CTA 跳转 |
|---|---|---|---|
| 🔴 **待审对公** | `count(order WHERE status=pending_review AND payment_method=bank_transfer)` | sum(待审对公金额) | § 6.3.3 对公转账审核 |
| 🟡 **待开通任务** | `count(开通任务 WHERE status IN (assigned, in_progress))` | — | § 八 C1（运维工单队列）|
| 🟠 **开通异常** | `count(开通任务 WHERE status=blocked OR result=failed)` | sum(关联订单金额) | § 八 C1 异常筛选 |
| 🔵 **佣金待确认** | `count(commission WHERE status=pending)` | sum(commission.amount WHERE status=pending) | 财务 PRD § 6.2 流水管理（pending 筛选） |

**交互细节**：
- 数字为 0 时：卡片背景淡灰、字色变浅，CTA 按钮置灰但保留（防扫视位移）
- 数字 ≥ 内置阈值时：卡片描边变红 + 顶角小红点，引导优先处理（阈值在 § B9 系统参数配置，Beta1 默认：对公 ≥ 5、异常 ≥ 1、佣金 ≥ 50）
- CTA 按钮一律右下角，点击直接跳到对应处理页 + 自动应用筛选条件

#### 6.1.4 第 2 区 · 经营核心指标定义

| 卡片 | 计算口径 | 环比 | 跳转 |
|---|---|---|---|
| **本月 GMV** | 当月 `sum(order.amount WHERE status=paid)`，不扣退款 | vs 上月同期 | 订单列表（本月 paid 筛选） |
| **本月新增企业** | 当月 `count(tenant WHERE created_at IN month)` | vs 上月 | 企业列表（本月新增筛选） |
| **本月活跃企业** | 当月有任意员工登录的 tenant 数 | vs 上月 | 企业列表（活跃筛选） |
| **本月新签订单** | 当月 `count(order WHERE status=paid AND type=新签)` | vs 上月 | 订单列表（本月新签筛选） |

**环比规则**：
- ▲ 绿色：环比正增长
- ▼ 红色：环比下降
- 上月数据不存在（首月）：显示"—"
- 计算口径：以"当月已过天数"对比上月相同天数（防止月初数字虚低）

#### 6.1.5 第 2 区 · 30 天 GMV 趋势图

- 横轴：近 30 个自然日
- 纵轴：每日 GMV（¥）
- 双线：**新签**（实线）vs **续费**（虚线）
- 鼠标 hover：显示该日具体 GMV、新签 / 续费拆分、订单数
- 点击数据点：跳到该日订单列表

#### 6.1.6 第 3 区 · Top 5 排行

| 区块 | 数据 | 跳转 |
|---|---|---|
| Top 5 企业本月消耗 | 按 token 用量降序前 5 | 点企业行 → § B2 企业详情；"查看完整" → 企业列表（按消耗排序） |
| Top 5 销售本月业绩 | 按本月新签 GMV 降序前 5 | 点销售行 → § B4 销售详情；"查看完整" → 销售列表 |

> **从 v1.0 的 Top 10 收敛到 Top 5**：单屏内不挤占；两栏排行 + "查看完整"按钮覆盖运营需要。

#### 6.1.7 第 4 区 · 平台健康（默认折叠）

##### 折叠态显示

```
▶  平台状态正常 · 最近一次检查 14:32
```

##### 异常态自动展开

任意以下条件触发自动展开 + 文字变红：
- 火山 API 错误率 ≥ 1%（持续 ≥ 5 分钟）
- 平台 P95 ≥ 3s（持续 ≥ 5 分钟）
- cron 任务失败（任意一个）
- 月可用性 < 99.5%

##### 展开内容

- 火山 API：成功率 / P95 / 失败接口 Top 3
- 平台：P95 / 月可用性 / 当前 QPS
- cron 任务：佣金批次 / 销售对账单 / 健康巡检 三项的最近执行时间 + 状态
- "去监控大盘"按钮 → § B11（Beta2）

#### 6.1.8 顶部告警条

##### 出现条件
- 当 § 6.1.7 第 4 区任意异常触发时，**额外**在页面最顶部出现红 / 橙告警条
- 多条告警时：拼接显示，间隔分隔符 `│`
- 点击告警条：跳到对应处理页

##### 关闭逻辑
- 用户不可主动关闭（异常解除后系统自动收起）
- 防止用户为图清净误关键告警

#### 6.1.9 刷新策略

| 区 | 刷新频率 | 触发方式 |
|---|---|---|
| 顶部告警条 | 每 30 秒 | 后台轮询 |
| 第 1 区 待办 | 每 30 秒 | 后台轮询 + 用户切换页签时强制刷新 |
| 第 2 区 经营指标 | 每 5 分钟 | 后台轮询 |
| 第 2 区 趋势图 | 每小时 | 后台轮询 |
| 第 3 区 排行 | 每小时 | 后台轮询 |
| 第 4 区 健康 | 每分钟 | 后台轮询 |

页面右上角："刷新"按钮可手动强制全量刷新（应急 / 调试用）。

#### 6.1.10 空态与首次进入引导

##### 全空态（首次进入、零数据）

```
👋 欢迎，云脑智联官方管理员

平台还很安静。建议先完成以下几步：
  1. 在 § B6 配置至少 1 个套餐（去配置 →）
  2. 在 § B10 添加销售员账号（去添加 →）
  3. 在 § B8 等待第一条客户咨询留资，或邀请销售开始拓客
```

##### 部分空态（某区有数据某区无）

各区单独空：
- 第 1 区全 0 → 卡片淡灰但保留
- 第 2 区无数据 → 显示"本月暂无数据"
- 趋势图无数据 → 显示"暂无 GMV 数据，开始第一笔订单"
- 排行无数据 → 显示"暂无业绩"
- 健康正常 → 折叠态绿色"平台状态正常"

#### 6.1.11 响应式

| 屏宽 | 布局 |
|---|---|
| ≥ 1440px | 4 × 4 卡片单行；趋势图与排行并列两栏 |
| 1280-1440px | 4 × 4 卡片单行；趋势图独占一行；排行并列两栏 |
| 1024-1280px | 4 卡片折成 2×2；其他单列堆叠 |
| < 1024px | 全部单列；提示"建议大屏使用" |

#### 6.1.12 实现状态：🔄 待校准

待校准对照表（开发对照 `localhost:5160/admin/dashboard` 现状填补）：

| 区 | 现有原型 | v1.2 设计 | 差距 |
|---|---|---|---|
| 顶部告警条 | 🔄 | § 6.1.8 | 待开发对照 |
| 第 1 区 待办 | 🔄 | § 6.1.3 | 待开发对照（重点：CTA 按钮 + 关联金额是否齐全）|
| 第 2 区 经营 | 🔄 | § 6.1.4 | 待开发对照（重点：环比计算）|
| 第 2 区 趋势 | 🔄 | § 6.1.5 | 待开发对照（重点：新签 / 续费双线区分）|
| 第 3 区 排行 | 🔄 | § 6.1.6 | 待开发对照（重点：Top 10 → Top 5 收敛）|
| 第 4 区 健康 | 🔄 | § 6.1.7 | 待开发对照（重点：默认折叠）|

#### 6.1.13 与 v1.0/v1.1 的差异（开发改造提示）

| 维度 | v1.0/v1.1 | v1.2 |
|---|---|---|
| 卡片数量 | 9 张 KPI 平铺 | 4 待办 + 4 经营 = 8 张分两区 |
| 待办位置 | 中下部分 | **最顶部**（仅在告警条之下） |
| 卡片内容 | 仅数字 | 数字 + 关联金额 + 环比 + CTA |
| 平台健康 | 主区域常驻 | **底部默认折叠**，异常时自动展开 |
| 排行 | Top 10 | **Top 5** + "查看完整" |
| 子角色筛选 | 待办按子角色筛选 | Beta1 单角色，无需筛选；Beta2 再加 |
| 刷新 | 未定义 | **分区分频率刷新策略** |
| 空态 | 未定义 | **首次进入引导 + 各区分别空态** |

---

### 6.2 B2 企业（租户）管理

#### 6.2.1 企业列表

##### 路径
`/admin/tenants`

##### 列定义

| 列 | 字段 |
|---|---|
| 企业名 | tenant.name |
| USCC | tenant.unified_social_credit_code |
| 行业 | tenant.industry |
| 状态 | active / suspended / closing |
| 归属销售 | sales.name（可点跳 B4） |
| 客户经理 | account_manager_id |
| 已购席位（4 档） | seat_starter/standard/premium/ultimate |
| 本月消耗 Token | aggregated |
| 本月 GMV | aggregated |
| 创建时间 | created_at |
| 火山空间 ID | volc_space_id（点击调试用） |
| 操作 | 详情 / 暂停 / 代登录 / 代开订单 |

##### 筛选
- 状态、行业、归属销售、本月有无消耗、是否欠费、归属期内 / 外

##### 批量操作
- 导出 CSV
- 批量暂停 / 批量恢复（双人复核）
- 批量发送站内消息

#### 6.2.2 企业详情

##### 路径
`/admin/tenants/:id`

##### 8 个 Tab

| Tab | 内容 | 谁能看 |
|---|---|---|
| 基本信息 | tenant 字段（只读 USCC，可改销售备注 / 客户经理） | 全部 R1 |
| 套餐与席位 | 当前套餐、席位明细、变更历史 | OP- / FI- / SU- |
| 订单历史 | 全部 order 列表，可下钻 | OP- / FI- / SU- |
| 用量统计 | 月度 Token / 活跃员工趋势 | 全部 R1 |
| 管理员账号 | R4 账号列表、重置密码、暂停账号 | OP- / SU- / CS- |
| 绑定配置 | 飞书 / 企微等绑定状态（只读，跳 C2 修改） | OP- / SU- |
| 审计日志 | 该企业的 audit_log 子集 | 全部 R1 |
| 高危操作 | 暂停企业、关闭企业、代开订单、代退款 | OP- / FI- / SU-（按操作权限） |

##### 高危操作清单

| 操作 | 子角色 | 二次确认 | 双人复核 | 审计强制 |
|---|---|---|---|---|
| 暂停企业 | OP- / SU- | ✅ | 否 | ✅ |
| 关闭企业（不可恢复） | SU- | ✅ | ✅ | ✅ |
| 代开订单 | OP- / SU- | ✅ | 否 | ✅ |
| 代退款 | FI- / SU- | ✅ | 金额 ≥ 10w | ✅ |
| 重置 R4 密码 | OP- / SU- / CS- | ✅ | 否 | ✅ |
| 暂停 R4 账号 | OP- / SU- | ✅ | 否 | ✅ |
| 修改销售备注 | OP- / SU- | 否 | 否 | ✅ |

#### 6.2.3 代登录

##### 路径
`/admin/tenants/:id/impersonate`

##### 流程
见 § 5.6

##### 关键约束

- 单 R1 用户**同时只能有 1 个代登录会话**
- 单次会话最长 2 小时
- 代登录期间客户工作台**顶部固定红色横幅**显示代登录身份与倒计时
- 代登录无法访问客户**敏感数据**（密码字段、支付凭证）
- 代登录期间，被登录的 R4 用户**仍可正常使用**自己账号（不挤掉）；R4 客户管理员可看到"当前你的账号有 1 个支持人员代登录会话"提示

##### 通知矩阵

| 时点 | 通知谁 | 渠道 |
|---|---|---|
| 代登录开始 | R4 企业管理员、SU- | 站内 + 邮件 + 短信 |
| 代登录每 30 分钟 | R4 企业管理员 | 站内 |
| 代登录结束 | R4 企业管理员 | 站内 + 邮件（含操作摘要） |

#### 6.2.4 实现状态：🔄 待校准

---

### 6.3 B3 订单与账单

#### 6.3.1 订单列表

##### 路径
`/admin/orders`

##### 列
订单号、企业、归属销售、订单类型（席位订阅 / Token 包 / 扩容 / 其他）、金额、支付方式、状态、创建时间、付款时间、操作

##### 筛选
日期、企业、销售、类型、状态、支付方式、金额范围

##### 状态
pending / pending_review（仅对公转账）/ paid / refunded / cancelled

#### 6.3.2 订单详情

##### 子区
- 订单基本（订单号、金额、支付凭证）
- 关联客户 + 销售归属
- 关联开通任务（火山资源映射、统一登录、席位池状态）
- 关联 commission 流水
- 操作历史时间线

#### 6.3.3 对公转账审核（核心）

##### 路径
`/admin/orders/bank-transfer-review`

##### 列
订单号、企业、金额、唯一备注号、凭证图（缩略）、上传时间、距上传天数、操作（通过 / 驳回 / 挂起）

##### 单条审核流

```
点"通过"
  └─ 弹窗：金额校对（系统金额 vs 凭证金额，文本框输入凭证金额）
     └─ 一致 → 点确认 → order.paid + 生成企业开通任务
     └─ 不一致 → 提示选"驳回"或"挂起"

点"驳回"
  └─ 选择驳回原因（金额不符 / 凭证不清 / 备注号缺失 / 其他）
     └─ 客户站内 + 短信通知 + order 退到 pending（可重传）

点"挂起"
  └─ 录入挂起原因 → 进入异常订单池
```

##### SLA
- 凭证上传后 ≤ 2 工作日审核
- 超时未审核 → 在 B1 仪表盘红色告警

##### 防重放凭证
- 凭证图 hash（pHash）+ OCR 关键字（金额、日期、流水号）→ 重复识别
- 命中重复 → 标记"疑似重复" + 阻止"通过"

#### 6.3.4 退款审核

##### 路径
`/admin/orders/refunds`

##### 列
退款单号、订单号、企业、原始金额、退款金额、原因、申请人（客户 / 销售 / OP-）、申请时间、状态、审批人

##### 状态
pending / approved / rejected / processing / completed / failed

##### 流程
见 § 5.2

##### 双人复核规则
- 金额 < 10 万：FI- 单人审批
- 10 万 ≤ 金额 < 100 万：FI- + SU- 双人
- 金额 ≥ 100 万：禁止线上操作，走线下合同流程（系统拒绝）

#### 6.3.5 异常订单

##### 自动触发规则
- 金额 ≥ ¥50,000（首版阈值，可在 B9 配置）
- 同企业 1 小时内 ≥ 3 笔订单
- 凭证 pHash 命中重复
- 火山 API 同步失败（额度未到账）

##### 处理
- OP- / FI- 进入处理队列 → 标记"已处理"或"挂起"
- 全部留痕

#### 6.3.6 对账（每日 T+1）

- 自动比对：银行流水 vs 系统订单（微信 / 支付宝暂不作为 Beta1 主路径）
- 差异列表（金额不匹配、单边账、孤儿订单）
- FI- 在 B3.6 处理差异

#### 6.3.7 实现状态：❌ 待实现

---

### 6.4 B4 销售管理

> **v1.3 重要：** 销售分两类
> - **直营销售**：我方员工，`agent_id IS NULL`，平台直接结算佣金（参 财务佣金结算 PRD）
> - **代理下属销售**：归属某代理，`agent_id = <某代理>`，**平台不直接结算**给该销售；该销售的佣金由所属代理在镜像站内自行管理
>
> 本节列表 / 筛选 / 详情 / 业绩排行均按 `agent_id` 维度可筛选与统计。

#### 6.4.1 销售档案

##### 路径
`/admin/sales`

##### 列
工号、姓名、**归属（直营 / 代理 X）🆕**、Team、入职日期、状态（active/frozen/left）、本月新客、本月 GMV、本月佣金、累计佣金、操作

##### 筛选
- 归属类型：全部 / 直营 / 代理下属
- 代理（多选）—— 仅 `agent_id NOT NULL` 时显示
- 其余沿用

##### 操作
- 详情
- 重置密码（含 MFA 重置）
- 冻结 / 解冻
- 标记离职 → 触发 5.4
- 编辑（仅 SU- 可改 base_commission_rate）

#### 6.4.2 销售档案详情

##### Tab
- 基本信息
- 客户列表（同销售 PRD 6.2，但是只读 + 全字段可见）
- 业绩历史（月度图表）
- 佣金流水
- 分享链接 / 邀请码（只读）
- 操作日志

#### 6.4.3 业绩排行榜

##### 路径
`/admin/sales/leaderboard`

##### 维度
- 时间：本月 / 本季 / 本年 / 自定义
- 指标：新客数 / GMV / 佣金 / 归属期内续约率
- 范围：全平台 / 按 Team

#### 6.4.4 离职继承

见 § 5.4。入口在 B4.1 操作列"标记离职"。

#### 6.4.5 客户调拨

##### 路径
`/admin/sales/transfers`

见 § 5.5。

##### 列表
申请单号、原销售、新销售、客户、申请人、申请时间、状态（pending/approved/rejected）、审批人

##### 双人复核：必须

#### 6.4.6 实现状态：❌ 待实现

---

### 6.5 B5 佣金与分成规则

> **v1.3 重要：佣金分两条线**
>
> | 维度 | 销售佣金 | 代理佣金 |
> |---|---|---|
> | 触发对象 | sales（直营 + 代理下属）的客户付款 | agent 体系下客户的进货金额 |
> | 比例 | 平台基准（默认 5%） | 代理协议约定（如 30%） |
> | 结算对象 | 直营销售直接结算；代理下属销售由所属代理在镜像站自行管理 | 代理本人 |
> | 结算路径 | 财务佣金结算 PRD 全套流程 | 代理提现工单（手工，参 § 6.12.4） |
> | 数据表 | commission（既有） | agent_commission（新增，§ 6.12 / 代理商 PRD） |
>
> 本节后续内容仅描述**销售佣金**部分，代理佣金的规则与流水见 § 6.12 与代理商 PRD。

#### 6.5.1 规则配置

##### 路径
`/admin/commission/rules`

##### 当前规则
- 费率：固定 5%
- 周期：12 个月
- 触发：order.status=paid

##### 修改流程
- 点"新增规则"→ 表单：费率 / 周期 / 生效日期 / 失效日期 / 适用范围（全销售 / 指定 Team）
- 提交需 SU- 双人复核
- **不溯及既往**：老订单按生成时锁定的 rule_id

##### 规则版本快照
- 全部历史规则保留，commission 表通过 rule_id 锁定

#### 6.5.2 佣金流水

##### 路径
`/admin/commission/transactions`

##### 列
流水号、订单号、企业、销售、订单金额、佣金金额、状态、生成时间、确认时间、发放时间

##### 筛选 / 导出 同销售 PRD

##### 单条手工调整
- SU- 可手工修改 commission（如系统计算错）
- 必须录入"调整原因"+ 双人复核
- 修改前后金额都留痕

#### 6.5.3 月度发放批次

##### 路径
`/admin/commission/batches`

##### 列
批次号、批次月份、销售人数、流水条数、金额合计、状态（pending_review/approved/paid）、创建时间

##### 状态机

```
auto_generated（每月 1 日定时任务）
       │
       ▼
pending_review
       │  FI- 抽查 ≥ 5 条 → 通过
       ▼
approved
       │  FI- 导出打款单
       ▼
exported
       │  财务线下打款 → FI- 标记"已打款"
       ▼
paid（批次内 commission 状态全部变 paid）
```

##### 抽查规则
- 系统随机抽 5 条 + 金额 Top 1 + 退款相关 1 条 共 7 条强制查看
- FI- 必须逐条点过

##### 异常情况
- 批次中存在状态非 confirmed 的 commission → 系统自动跳过、列异常
- 批次发放后才发生退款 → 走"已发放冲销"流程（出本 PRD 范围，工单）

#### 6.5.4 实现状态：❌ 待实现

---

### 6.6 B6 套餐与价格

> **v1.3 新增**：套餐价格分两层
> - **平台基准价**：本节维护，所有直营渠道及代理"进货价"基准
> - **代理售卖价**：代理在自己镜像站后台自定义（参 § 6.12 + 代理商 PRD）；售价 < 基准价 = 让利销售（接受）；售价 > 基准价 = 加价销售
> - **本节仅管基准价**，不展示代理自定义价格（避免乱）

#### 6.6.1 套餐列表

##### 路径
`/admin/plans`

##### 列
套餐 ID、名称、产品类型（席位订阅 / Token 包 / 扩容）、规格、月 / 季 / 年价格、状态（草稿 / 上架 / 下架）、生效时间、创建人

##### 套餐类型
- **席位订阅**：4 档（轻量 / 标准 / 高级 / 旗舰）× 周期（月 / 季 / 年）
- **Token 加油包**：定额（10w / 100w / 1000w token）
- **扩容产品**：知识中心扩容、存储扩容、Memory / CPU 扩容

#### 6.6.2 套餐编辑

##### 字段
- 名称、描述、产品类型、规格参数（JSON）
- 价格表（默认价 + 折扣价 + 折扣有效期）
- 上下线时间（可定时）
- 适用范围（全部客户 / 指定企业白名单）

##### 价格历史
- 任何价格变更保留快照
- 老订单仍按下单时点的价格执行

#### 6.6.3 上下线规则

| 操作 | 是否影响存量客户 |
|---|---|
| 新建 | 不影响（新客户可见） |
| 调价 | 不影响存量订单（已付的不变） |
| 下架 | 已购客户续费可继续；新客户不可见 |
| 删除 | 仅草稿可删；上架过的只能下架不能删 |

#### 6.6.4 实现状态：❌ 待实现

---

### 6.7 B7 资讯管理

#### 6.7.1 资讯列表

##### 路径
`/admin/news`

##### 列
标题、分类、标签、状态（draft/scheduled/published/offline）、发布时间、定时发布时间、阅读数、作者、操作

#### 6.7.2 资讯编辑

##### 字段
- 标题、分类（产品动态 / 行业资讯 / 最佳实践）
- 标签（多选）
- 封面图（推荐 16:9，≤ 2MB）
- 正文（富文本编辑器）
- 摘要（自动生成 + 可改）
- 状态（草稿 / 立即发布 / 定时发布）
- SEO（meta description）

##### 富文本编辑器要求
- 支持图片上传（自动压缩 + CDN）
- 支持代码块、引用、有序 / 无序列表、表格
- 不允许 inline JS / iframe（XSS 防护）

#### 6.7.3 发布前审核

- 草稿可由 OP- 创建
- 发布需 OP- + SU- 双人审核（避免错发 / 不当内容）
- 发布后可下架不可删除（保留历史）

#### 6.7.4 阅读统计

- 浏览数（去重 IP）
- 点赞数（客户侧）
- 关联咨询数（从该文章跳到 A8 提交的留资）

#### 6.7.5 实现状态：❌ 待实现

---

### 6.8 B8 咨询留资池

#### 6.8.1 留资列表

##### 路径
`/admin/leads`

##### 列
留资时间、企业名、联系人、电话 / 邮箱、需求摘要、来源（A8 表单 / 资讯页跳转 / 其他）、状态、SLA 倒计时、分配销售、操作

##### 状态机

```
new ──分配──→ assigned ──销售认领──→ claimed ──跟进──→ following ──→ converted/closed
```

#### 6.8.2 分配（首版手动）

##### 操作
- 单条：点"分配"→ 选择销售下拉 → 写入 assigned_sales_id
- 批量：勾选多条 → "批量分配"→ 选择规则（按 Team / 按行业 / 平均分）

##### 自动分配（预留）
- 主 PRD D8 决议首版手动；自动分配规则配置接口预留，开关默认关

#### 6.8.3 SLA 监控

| 时点 | 行为 |
|---|---|
| 留资创建后 1h 未分配 | OP- 接收升级提醒 |
| 分配后 24h 未认领 | 销售 + OP- 接收升级 |
| 认领后 72h 未跟进 | 销售经理（暂等同 SU-）接收升级 |

#### 6.8.4 转化追踪

- 留资 → 转客户 → 客户首单 → 客户续约 漏斗
- 月度转化率：B1 仪表盘卡片

#### 6.8.5 实现状态：❌ 待实现

---

### 6.9 B9 系统配置

#### 6.9.1 角色权限矩阵

##### 路径
`/admin/system/roles`

##### 功能
- 内置 5 大角色（R1.0-R1.3 + 客户角色 R2/R3/R4/R5）的权限点矩阵
- 按钮级权限：勾选 / 取消
- 自定义角色（预留，本期不开放）

#### 6.9.2 字典管理

##### 路径
`/admin/system/dictionaries`

##### 内置字典
- 行业（25 项）
- 客户来源
- 退款原因
- 留资关闭原因
- 套餐类型 / 席位等级
- 国家 / 省 / 市

##### 操作
- CRUD + 启用 / 停用 + 排序

#### 6.9.3 通知模板

##### 路径
`/admin/system/notify-templates`

##### 模板类型
- 邮件、短信、站内信
- 触发场景：注册成功 / 订单支付成功 / 对公转账驳回 / 代登录开始 / 留资分配 / 佣金到账 / 系统维护

##### 字段
- 名称、触发场景、渠道（多选）、主题（仅邮件）、正文（富文本，支持变量）、是否启用

##### 变量列表
内置 30+ 变量：`{{user.name}}` / `{{tenant.name}}` / `{{order.amount}}` ...

#### 6.9.4 系统参数

##### 路径
`/admin/system/params`

##### 关键参数
| Key | 默认 | 说明 |
|---|---|---|
| commission.default_rate | 0.05 | 默认佣金率 |
| commission.cycle_months | 12 | 归属期 |
| order.bank_transfer_review_sla_hours | 48 | 对公审核 SLA |
| lead.unclaimed_alert_hours | 24 | 留资未认领告警 |
| anomaly.order_amount_threshold | 50000 | 异常订单金额阈值 |
| impersonate.max_duration_minutes | 120 | 代登录单次时长 |
| price.refund_double_review_threshold | 100000 | 退款双审阈值 |

##### 修改流程
- 仅 SU- 可改
- 二次确认
- 修改前后值留痕（system_config_history）

#### 6.9.5 全局审计日志

##### 路径
`/admin/system/audit`

##### 列
时间、操作者（角色 + 工号 + 姓名）、动作、目标资源、目标 ID、关联企业、IP、UA、结果、原因（如果是高危）

##### 筛选
时间范围、操作者、动作类型、目标类型、关联企业、结果

##### 保留期
12 个月（与主 PRD § 二 NFR 一致）

##### 不可删除
- 数据库层面无 DELETE 权限
- 任何人不可（包括 SU-）

#### 6.9.6 实现状态：❌ 待实现

---

### 6.10 B10 内部员工管理

#### 6.10.1 员工列表

##### 路径
`/admin/staff`

##### 列
工号、姓名、邮箱、角色（R1.0-R1.3 / R2 / R3）、Team、状态、最近登录、MFA 状态、操作

##### 操作
- 新增（仅 SU-）
- 编辑（角色变更需双人复核）
- 重置密码 / 重置 MFA
- 冻结 / 解冻
- 标记离职（销售员调用 5.4）

#### 6.10.2 新增员工

##### 字段
- 姓名、邮箱、手机、工号（系统自动建议 + 可改）
- 角色（R1.0/R1.1/R1.2/R1.3/R2/R3）
- Team（销售必填）
- 入职日期
- 是否需要 MFA（默认全员强制）
- 是否发送邀请邮件（设置初始密码）

#### 6.10.3 安全策略

- 强制 MFA（TOTP）：R1.0 / R1.2 必须；其他默认开启可关闭
- 弱密码字典拦截
- 异常登录告警（异地、新设备、批量失败）
- 离职后立刻冻结账号 + 撤销所有 token

#### 6.10.4 实现状态：❌ 待实现

---

### 6.11 B11 系统监控与告警

#### 6.11.1 平台健康看板

##### 路径
`/admin/monitoring`

##### 看板
- 平台健康：CPU / Mem / DB 连接数 / Redis 命中率
- API 健康：QPS / P95 / 错误率（按接口分组）
- 火山 API 健康：成功率 / P95 / 失败接口 Top
- 业务指标：登录 PV / UV、订单 / 充值 / 留资数（实时）

#### 6.11.2 告警规则

##### 路径
`/admin/monitoring/alerts`

##### 内置规则
- 火山 API 错误率 > 5% 持续 5 分钟
- 平台 P95 > 5s 持续 10 分钟
- 对公转账积压 > 10 笔
- 退款积压 > 5 笔
- 月可用性 < 99.5%
- 异常登录尖峰

##### 通知渠道
- 站内 + 邮件 + 钉钉机器人 + 短信（按级别）

#### 6.11.3 实现状态：❌ 待实现

---

### 6.12 B12 代理商管理 🆕 v1.3

> **范围声明**：本节仅描述**官方管理员对代理的管理动作**（开通账号、看进货、看佣金、处理提现工单等）。
> 代理自己使用的**镜像站后台**（自定义品牌、自定义套餐价、自管销售、自查报表）是独立产品，详见 **代理商-PRD.md**（建议下一份新增 PRD）。

#### 6.12.1 设计原则

1. **只做一级代理**：代理不能再发展下级代理（防传销）
2. **后置佣金**：代理全款进货，按比例后置返佣（不做前置折扣）
3. **不交付**：客户最终都垒到我方平台，代理只管"卖"和"管自己的销售"
4. **客户透传**：代理体系下的客户注册数据全部透传到我方平台，归属同一套企业管理
5. **品牌可定制**：代理在自己镜像站可改 logo / 标题 / 套餐价；其他企业能力一致
6. **5/20 GA 范围**：账号开通、进货、佣金记录、手工提现工单
7. **进 V2**：区域防串货 / 企查查接入 / 真正的钱包余额 / 代金券

#### 6.12.2 代理列表

##### 路径
`/admin/agents`

##### 列定义

| 列 | 字段 | 说明 |
|---|---|---|
| 代理 ID | agent.id | 前缀 AGT- |
| 代理名 | agent.name | 公司名称 |
| 镜像站域名 | agent.mirror_domain | 如 `claw.agent-x.com` |
| 联系人 | agent.contact_name | — |
| 联系电话 / 邮箱 | 脱敏 | — |
| 代理协议费率 | agent.commission_rate | 默认 30%，签约时锁定 |
| 状态 | active / frozen / closed | — |
| 累计进货 | sum(agent_order.amount) | — |
| 累计佣金 | sum(agent_commission.amount) | — |
| 余额 | 进货 - 已扣减 - 已提现 | 仅本期显示数字，无真实钱包 |
| 名下销售数 | count(sales WHERE agent_id=X) | — |
| 名下客户数 | count(tenant WHERE 来源 = 代理) | — |
| 操作 | 详情 / 冻结 / 开通镜像站 / 处理提现 |

##### 筛选 / 搜索
- 状态、签约时间区间、佣金率范围
- 全文搜索：代理名、联系人、镜像站域名

#### 6.12.3 代理详情

##### 路径
`/admin/agents/:id`

##### 6 个 Tab

| Tab | 内容 |
|---|---|
| **基本信息** | 公司名 / USCC / 联系人 / 协议费率 / 签约时间 / 镜像站域名 / 状态 |
| **镜像站配置** | logo / 标题 / 自定义套餐价格清单（仅查看；编辑入口跳代理商后台）/ 默认欢迎页 |
| **进货记录** | 代理充值流水（充入金额、订单号、时间） |
| **佣金流水** | 代理产生的佣金流水（关联客户订单、计算依据） |
| **名下销售** | 该代理挂载的销售列表（跳 § 6.4 销售管理筛选 agent_id=X） |
| **名下客户** | 该代理体系下的企业客户（跳 § 6.2 企业管理筛选）|

##### 高危操作

| 操作 | 二次确认 | 审计强制 |
|---|---|---|
| 冻结代理（暂停镜像站访问） | ✅ | ✅ |
| 关闭代理（不可恢复） | ✅ | ✅ |
| 调整费率 | ✅ | ✅ |
| 重置代理主账号密码 | ✅ | ✅ |

#### 6.12.4 代理开通

##### 路径
`/admin/agents/new`

##### 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| 公司名 | ✅ | — |
| USCC | ✅ | 18 位 |
| 联系人姓名 | ✅ | — |
| 联系人电话 / 邮箱 | ✅ | — |
| 协议佣金率 | ✅ | 默认 30%，可调 |
| 首次代理费 | ✅ | 我方收取的入场费（一次性） |
| 代理费处置 | ✅ | **直接充到代理进货余额，不退回**（强制消费） |
| 镜像站子域名 | ✅ | 如 `agent-x`，系统拼为 `agent-x.<我方根域>` |
| 镜像站自定义域名 | 可选 | 如 `claw.agent-x.com`，需后续做 DNS + 证书（走 § 八 C3 运维流程） |
| 默认 logo | 可选 | 后续代理可在镜像站后台改 |
| 区域 🆕 V2 | — | V2 才用 |
| 备注 | 可选 | — |

##### 开通后

1. 系统自动创建 agent 记录
2. 创建代理主账号（user 表 + role=agent_admin）
3. 代理费充入代理进货余额（不退）
4. 镜像站子域名分配（CDN / 反代配置）
5. 短信 + 邮件给代理：登录链接（镜像站后台域名）、初始管理员密码

##### 实现状态：❌ 待实现

#### 6.12.5 代理进货充值

##### 触发
代理在自己镜像站后台发起充值（参代理商 PRD）；本节是**官方管理员侧的查询 + 对公审核**入口。

##### 列表
- 充值订单号、代理、金额、支付方式（对公 / 微信 / 支付宝）、状态、时间、操作
- 对公转账走超管 § 6.3.3 通用审核流（与企业对公审核共用流程）

#### 6.12.6 代理佣金记录

##### 触发
代理体系下的客户付款 + 开通可用 → 系统自动按 agent.commission_rate 计算代理佣金 → 写 agent_commission 流水（与 commission 表平行，**不混表**）

##### 列表

| 列 | 字段 |
|---|---|
| 流水号 | id |
| 代理 | agent.name |
| 关联客户 | tenant.name |
| 关联订单 | order.id |
| 订单金额 | order.amount |
| 佣金率 | rate（生成时锁定） |
| 佣金金额 | amount |
| 状态 | pending / confirmed / paid（同 commission 状态机） |
| 时间 | generated_at / confirmed_at / paid_at |

##### 实现状态：❌ 待实现

#### 6.12.7 代理提现工单（手工流程）

##### 触发
代理在镜像站发起提现申请（提的是销售现金流，不是佣金）→ 本节是**官方管理员侧的工单处理**

##### 列表
- 工单号、代理、申请金额、提现类型（销售现金流 / 佣金）、状态（pending / processing / paid / rejected）、申请时间

##### 处理流程

```
代理申请提现
   ↓
官方管理员看到工单（B12.7 列表）
   ↓
点"处理" → 核对余额（系统数字 vs 财务账本）
   ↓
通过：财务线下打款 → 回写"已打款 + 银行流水号" → 工单 closed
驳回：录入原因 → 代理收到通知
```

> **本期机制**：没有真正的钱包扣减，只是"数字运算 + 工单走人工"。V2 才上钱包余额账户。

##### 实现状态：❌ 待实现

#### 6.12.8 关键边界规则

| # | 规则 |
|---|---|
| **G1** | 代理**全款进货**，不支持前置折扣 |
| **G2** | 代理首次代理费**不退**，直接充进货余额强制消费 |
| **G3** | 代理只能挂自己的销售，**不能发展下级代理** |
| **G4** | 代理**不交付**，最终客户全部归我方平台、由我方交付 |
| **G5** | 代理可自定义镜像站套餐价格，**可低于基准价**（让利销售可接受）|
| **G6** | 代理**不能发代金券**（本期；避免乱）|
| **G7** | 代理体系下客户的归属 = 客户 → 销售（代理下属）→ 代理；佣金双线（销售佣金 + 代理佣金）独立计算 |
| **G8** | 代理被冻结后：镜像站访问被拦截 + 名下销售无法登录；已签约客户继续可用（不影响客户）|
| **G9** | 代理关闭后：名下销售批量冻结；客户由我方接管直营 |
| **G10** | 5/20 上线后再上的代理"区域防串货 + 钱包 + 代金券"，**不能打乱已运行代理的数据**（保留 agent_id 在每笔订单准确挂钩）|

#### 6.12.9 数据模型（关键字段）

```sql
-- 代理
CREATE TABLE agent (
  id              BIGINT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  uscc            VARCHAR(18) NOT NULL UNIQUE,
  contact_name    VARCHAR(100),
  contact_phone   VARCHAR(20),
  contact_email   VARCHAR(100),
  commission_rate DECIMAL(5,4) NOT NULL,                -- 协议费率（如 0.30）
  initial_fee     DECIMAL(12,2) NOT NULL,               -- 首次代理费
  mirror_subdomain VARCHAR(64) NOT NULL UNIQUE,         -- agent-x
  mirror_domain   VARCHAR(200),                          -- claw.agent-x.com
  mirror_logo_url VARCHAR(500),
  mirror_title    VARCHAR(200),
  primary_user_id BIGINT REFERENCES user(id),           -- 主账号
  status          ENUM('active','frozen','closed') NOT NULL DEFAULT 'active',
  signed_at       DATE NOT NULL,
  region          VARCHAR(64),                           -- V2：销售区域
  remark          TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_status (status),
  INDEX idx_subdomain (mirror_subdomain)
);

-- 销售表加 agent_id
ALTER TABLE sales
  ADD COLUMN agent_id BIGINT REFERENCES agent(id),     -- NULL = 直营
  ADD INDEX idx_agent (agent_id);

-- 客户表加 agent_id（归属代理）
ALTER TABLE tenant
  ADD COLUMN agent_id BIGINT REFERENCES agent(id),     -- NULL = 直营
  ADD INDEX idx_agent (agent_id);

-- 代理进货流水
CREATE TABLE agent_order (
  id              BIGINT PRIMARY KEY,
  order_no        VARCHAR(32) NOT NULL UNIQUE,         -- AGT-ORDER-...
  agent_id        BIGINT NOT NULL REFERENCES agent(id),
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  ENUM('bank_transfer','wechat','alipay'),
  status          ENUM('pending','pending_review','paid','refunded') NOT NULL,
  bank_transfer_proof_url VARCHAR(500),
  reviewer_id     BIGINT REFERENCES admin_user(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  paid_at         TIMESTAMP
);

-- 代理佣金（与 commission 平行，不混表）
CREATE TABLE agent_commission (
  id              BIGINT PRIMARY KEY,
  agent_id        BIGINT NOT NULL REFERENCES agent(id),
  related_order_id BIGINT NOT NULL REFERENCES `order`(id),  -- 客户订单
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  amount          DECIMAL(12,2) NOT NULL,
  rate            DECIMAL(5,4) NOT NULL,
  status          ENUM('pending','confirmed','paid','reverted') NOT NULL DEFAULT 'pending',
  generated_at    TIMESTAMP NOT NULL DEFAULT now(),
  confirmed_at    TIMESTAMP,
  paid_at         TIMESTAMP,
  INDEX idx_agent_status (agent_id, status)
);

-- 代理自定义套餐价格（覆盖基准价）
CREATE TABLE agent_plan_price (
  id              BIGINT PRIMARY KEY,
  agent_id        BIGINT NOT NULL REFERENCES agent(id),
  plan_id         BIGINT NOT NULL REFERENCES plan(id),
  price_month     DECIMAL(12,2),
  price_quarter   DECIMAL(12,2),
  price_year      DECIMAL(12,2),
  effective_from  TIMESTAMP,
  effective_to    TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE KEY uk_agent_plan (agent_id, plan_id)
);

-- 代理提现工单
CREATE TABLE agent_withdrawal (
  id              BIGINT PRIMARY KEY,
  ticket_no       VARCHAR(32) NOT NULL UNIQUE,
  agent_id        BIGINT NOT NULL REFERENCES agent(id),
  amount          DECIMAL(12,2) NOT NULL,
  withdrawal_type ENUM('sales_cashflow','commission') NOT NULL,
  status          ENUM('pending','processing','paid','rejected') NOT NULL DEFAULT 'pending',
  bank_transfer_no VARCHAR(64),
  bank_receipt_url VARCHAR(500),
  processed_by    BIGINT REFERENCES admin_user(id),
  processed_at    TIMESTAMP,
  reject_reason   VARCHAR(500),
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

#### 6.12.10 接口清单（关键）

| Method | Path |
|---|---|
| GET | `/api/admin/agents` |
| GET | `/api/admin/agents/:id` |
| POST | `/api/admin/agents` |
| PATCH | `/api/admin/agents/:id` |
| POST | `/api/admin/agents/:id/freeze` |
| POST | `/api/admin/agents/:id/close` |
| GET | `/api/admin/agents/:id/orders` |
| GET | `/api/admin/agents/:id/commissions` |
| GET | `/api/admin/agents/:id/sales` |
| GET | `/api/admin/agents/:id/tenants` |
| GET | `/api/admin/agent-withdrawals` |
| POST | `/api/admin/agent-withdrawals/:id/process` |
| POST | `/api/admin/agent-withdrawals/:id/mark-paid` |
| POST | `/api/admin/agent-withdrawals/:id/reject` |

#### 6.12.11 实现状态：❌ 待实现（5/20 GA 范围）

---

## 七、数据模型（管理后台相关）

### 7.1 `admin_user`

```sql
CREATE TABLE admin_user (
  id              BIGINT PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES user(id),
  employee_no     VARCHAR(32) NOT NULL UNIQUE,
  role_code       VARCHAR(32) NOT NULL,           -- R1.0/R1.1/R1.2/R1.3
  team            VARCHAR(64),
  hired_at        DATE NOT NULL,
  status          ENUM('active','frozen','left') NOT NULL DEFAULT 'active',
  mfa_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_role (role_code),
  INDEX idx_status (status)
);
```

### 7.2 `bank_transfer_review`

```sql
CREATE TABLE bank_transfer_review (
  id              BIGINT PRIMARY KEY,
  order_id        BIGINT NOT NULL UNIQUE REFERENCES `order`(id),
  proof_url       VARCHAR(500) NOT NULL,
  proof_phash     VARCHAR(64),                     -- 凭证图 perceptual hash
  proof_ocr_text  TEXT,                            -- OCR 结果
  uploaded_amount DECIMAL(12,2),                   -- 客户填的凭证金额
  reviewer_id     BIGINT REFERENCES admin_user(id),
  review_status   ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  review_reason   VARCHAR(200),
  uploaded_at     TIMESTAMP NOT NULL,
  reviewed_at     TIMESTAMP,
  INDEX idx_status (review_status),
  INDEX idx_phash (proof_phash)
);
```

### 7.3 `refund_request`

```sql
CREATE TABLE refund_request (
  id              BIGINT PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES `order`(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  request_amount  DECIMAL(12,2) NOT NULL,
  reason          VARCHAR(200) NOT NULL,
  applied_by      BIGINT,                          -- user_id（客户 / 销售 / OP-）
  applied_role    VARCHAR(32),
  status          ENUM('pending','approved','rejected','processing','completed','failed') NOT NULL DEFAULT 'pending',
  reviewer1_id    BIGINT REFERENCES admin_user(id),
  reviewer2_id    BIGINT REFERENCES admin_user(id),  -- 双人复核必填
  reviewer1_at    TIMESTAMP,
  reviewer2_at    TIMESTAMP,
  reject_reason   VARCHAR(200),
  refund_channel_response JSON,                     -- 支付通道返回
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  completed_at    TIMESTAMP
);
```

### 7.4 `commission_batch`

```sql
CREATE TABLE commission_batch (
  id              BIGINT PRIMARY KEY,
  batch_no        VARCHAR(32) NOT NULL UNIQUE,
  period_year     SMALLINT NOT NULL,
  period_month    TINYINT NOT NULL,
  sales_count     INT NOT NULL,
  commission_count INT NOT NULL,
  total_amount    DECIMAL(14,2) NOT NULL,
  status          ENUM('auto_generated','pending_review','approved','exported','paid','closed') NOT NULL,
  reviewed_by     BIGINT REFERENCES admin_user(id),
  reviewed_at     TIMESTAMP,
  exported_at     TIMESTAMP,
  paid_at         TIMESTAMP,
  remark          TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE commission_batch_item (
  batch_id        BIGINT NOT NULL REFERENCES commission_batch(id),
  commission_id   BIGINT NOT NULL REFERENCES commission(id),
  PRIMARY KEY (batch_id, commission_id)
);
```

### 7.5 `impersonation_session`

```sql
CREATE TABLE impersonation_session (
  id              BIGINT PRIMARY KEY,
  admin_user_id   BIGINT NOT NULL REFERENCES admin_user(id),
  impersonated_user_id BIGINT NOT NULL REFERENCES user(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  ticket_no       VARCHAR(64),                     -- 关联工单号
  reason          VARCHAR(500) NOT NULL,
  started_at      TIMESTAMP NOT NULL DEFAULT now(),
  expected_end_at TIMESTAMP NOT NULL,               -- started_at + 2h
  ended_at        TIMESTAMP,
  end_reason      ENUM('manual','timeout','forced'),
  operation_summary JSON,                           -- 期间执行的关键操作摘要
  INDEX idx_admin (admin_user_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_started (started_at)
);
```

### 7.6 `customer_transfer_request`

```sql
CREATE TABLE customer_transfer_request (
  id              BIGINT PRIMARY KEY,
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  from_sales_id   BIGINT NOT NULL REFERENCES sales(id),
  to_sales_id     BIGINT NOT NULL REFERENCES sales(id),
  applicant_id    BIGINT NOT NULL,                  -- user_id
  reason          VARCHAR(500) NOT NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewer1_id    BIGINT REFERENCES admin_user(id),
  reviewer2_id    BIGINT REFERENCES admin_user(id),
  reviewer1_at    TIMESTAMP,
  reviewer2_at    TIMESTAMP,
  effective_at    TIMESTAMP,                        -- 生效时点
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.7 `plan`（套餐）

```sql
CREATE TABLE plan (
  id              BIGINT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  product_type    ENUM('seat_sub','token_pack','expansion') NOT NULL,
  spec            JSON NOT NULL,                    -- 规格参数
  price_month     DECIMAL(12,2),
  price_quarter   DECIMAL(12,2),
  price_year      DECIMAL(12,2),
  status          ENUM('draft','published','offline') NOT NULL DEFAULT 'draft',
  effective_from  TIMESTAMP,
  effective_to    TIMESTAMP,
  whitelist_tenant_ids JSON,                        -- 仅指定企业可见，NULL=全部
  created_by      BIGINT REFERENCES admin_user(id),
  published_by    BIGINT REFERENCES admin_user(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE plan_history (
  id              BIGINT PRIMARY KEY,
  plan_id         BIGINT NOT NULL REFERENCES plan(id),
  snapshot        JSON NOT NULL,                    -- 完整快照
  changed_by      BIGINT NOT NULL,
  changed_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.8 `system_config` / `system_config_history`

```sql
CREATE TABLE system_config (
  config_key      VARCHAR(100) PRIMARY KEY,
  config_value    TEXT NOT NULL,
  value_type      ENUM('string','int','float','bool','json') NOT NULL,
  description     VARCHAR(500),
  updated_by      BIGINT,
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE system_config_history (
  id              BIGINT PRIMARY KEY,
  config_key      VARCHAR(100) NOT NULL,
  old_value       TEXT,
  new_value       TEXT NOT NULL,
  changed_by      BIGINT NOT NULL,
  reason          VARCHAR(500),
  changed_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.9 其他

- `dictionary` / `dictionary_item`：字典表
- `notify_template`：通知模板
- `news`：见主 PRD § 十二
- `audit_log`：见主 PRD § 十二（本 PRD 不重复）

---

## 八、接口清单

> 所有接口前缀 `/api/admin/`。鉴权：JWT + role_code ∈ {R1.0, R1.1, R1.2, R1.3}，按子角色分接口权限。

### 8.1 仪表盘

| Method | Path |
|---|---|
| GET | `/api/admin/dashboard/summary` |
| GET | `/api/admin/dashboard/revenue-trend?days=30` |
| GET | `/api/admin/dashboard/top-tenants?limit=10` |
| GET | `/api/admin/dashboard/top-sales?limit=10` |
| GET | `/api/admin/dashboard/todos` |
| GET | `/api/admin/dashboard/health` |

### 8.2 企业管理

| Method | Path |
|---|---|
| GET | `/api/admin/tenants` |
| GET | `/api/admin/tenants/:id` |
| PATCH | `/api/admin/tenants/:id`（销售备注 / 客户经理） |
| POST | `/api/admin/tenants/:id/suspend` |
| POST | `/api/admin/tenants/:id/resume` |
| POST | `/api/admin/tenants/:id/close`（双人复核） |
| POST | `/api/admin/tenants/:id/manual-order` |
| POST | `/api/admin/tenants/:id/impersonate` |
| POST | `/api/admin/tenants/:id/reset-admin-password` |
| GET | `/api/admin/tenants/:id/audit` |
| GET | `/api/admin/tenants/:id/orders` |
| GET | `/api/admin/tenants/:id/usage` |

### 8.3 订单 / 退款 / 对公审核

| Method | Path |
|---|---|
| GET | `/api/admin/orders` |
| GET | `/api/admin/orders/:id` |
| GET | `/api/admin/orders/bank-transfer-review` |
| POST | `/api/admin/orders/bank-transfer-review/:id/approve` |
| POST | `/api/admin/orders/bank-transfer-review/:id/reject` |
| POST | `/api/admin/orders/bank-transfer-review/:id/suspend` |
| GET | `/api/admin/orders/refunds` |
| POST | `/api/admin/orders/refunds`（创建） |
| POST | `/api/admin/orders/refunds/:id/approve` |
| POST | `/api/admin/orders/refunds/:id/reject` |
| GET | `/api/admin/orders/anomaly` |
| GET | `/api/admin/orders/reconciliation?date=YYYY-MM-DD` |

### 8.4 销售管理

| Method | Path |
|---|---|
| GET | `/api/admin/sales` |
| GET | `/api/admin/sales/:id` |
| POST | `/api/admin/sales/:id/freeze` |
| POST | `/api/admin/sales/:id/unfreeze` |
| POST | `/api/admin/sales/:id/leave` |
| GET | `/api/admin/sales/leaderboard` |
| GET | `/api/admin/sales/transfers` |
| POST | `/api/admin/sales/transfers/:id/approve` |
| POST | `/api/admin/sales/transfers/:id/reject` |

### 8.5 佣金

| Method | Path |
|---|---|
| GET | `/api/admin/commission/rules` |
| POST | `/api/admin/commission/rules` |
| GET | `/api/admin/commission/transactions` |
| PATCH | `/api/admin/commission/transactions/:id`（手工调整） |
| GET | `/api/admin/commission/batches` |
| POST | `/api/admin/commission/batches`（手动触发生成） |
| POST | `/api/admin/commission/batches/:id/approve` |
| POST | `/api/admin/commission/batches/:id/export` |
| POST | `/api/admin/commission/batches/:id/mark-paid` |

### 8.6 套餐与价格

| Method | Path |
|---|---|
| GET | `/api/admin/plans` |
| POST | `/api/admin/plans` |
| PATCH | `/api/admin/plans/:id` |
| POST | `/api/admin/plans/:id/publish` |
| POST | `/api/admin/plans/:id/offline` |
| GET | `/api/admin/plans/:id/history` |

### 8.7 资讯

| Method | Path |
|---|---|
| GET | `/api/admin/news` |
| POST | `/api/admin/news` |
| PATCH | `/api/admin/news/:id` |
| POST | `/api/admin/news/:id/submit-review`（提交发布审核） |
| POST | `/api/admin/news/:id/approve`（双审通过） |
| POST | `/api/admin/news/:id/reject` |
| POST | `/api/admin/news/:id/offline` |
| GET | `/api/admin/news/:id/stats` |

### 8.8 留资

| Method | Path |
|---|---|
| GET | `/api/admin/leads` |
| POST | `/api/admin/leads/:id/assign` |
| POST | `/api/admin/leads/batch-assign` |
| POST | `/api/admin/leads/:id/reassign` |
| GET | `/api/admin/leads/funnel`（漏斗分析） |

### 8.9 系统配置

| Method | Path |
|---|---|
| GET | `/api/admin/system/roles` |
| PATCH | `/api/admin/system/roles/:code` |
| GET | `/api/admin/system/dictionaries` |
| POST | `/api/admin/system/dictionaries/:code/items` |
| GET | `/api/admin/system/notify-templates` |
| PATCH | `/api/admin/system/notify-templates/:id` |
| GET | `/api/admin/system/params` |
| PATCH | `/api/admin/system/params/:key` |
| GET | `/api/admin/system/audit` |

### 8.10 内部员工

| Method | Path |
|---|---|
| GET | `/api/admin/staff` |
| POST | `/api/admin/staff` |
| PATCH | `/api/admin/staff/:id` |
| POST | `/api/admin/staff/:id/reset-password` |
| POST | `/api/admin/staff/:id/reset-mfa` |
| POST | `/api/admin/staff/:id/freeze` |
| POST | `/api/admin/staff/:id/leave` |

### 8.11 监控

| Method | Path |
|---|---|
| GET | `/api/admin/monitoring/health` |
| GET | `/api/admin/monitoring/api-stats` |
| GET | `/api/admin/monitoring/volc-api-stats` |
| GET | `/api/admin/monitoring/alerts` |
| PATCH | `/api/admin/monitoring/alerts/:id`（开关 / 阈值） |

### 8.12 通用错误码

| Code | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 子角色无权 |
| 40302 | 需双人复核 |
| 40303 | 需 MFA 二次验证 |
| 40901 | 业务冲突（如 USCC 已存在） |
| 40921 | 凭证 pHash 重复 |
| 40922 | 退款金额超双审阈值 |
| 40923 | 代登录会话已存在 |
| 50001 | 火山 API 调用失败 |
| 50002 | 内部错误 |

---

## 九、业务规则细则（关键边界，需 sign-off）

### F1 代登录的审计与限制

- **会话最长 2 小时**（由 `system_config.impersonate.max_duration_minutes` 控制）
- **同一 R1 账号同时只能 1 个代登录会话**
- **代登录期间禁止操作敏感字段**：客户的支付密码、银行账户、个人证件
- **强制录入工单号 + 原因**；缺一不可
- **客户管理员收到 3 重通知**（站内 + 邮件 + 短信）
- **审计日志包含**：代登录会话起止 + 期间所有写操作 + 浏览页面摘要
- **结束方式**：手动结束 / 超时强退 / SU- 强制结束（紧急情况）

### F2 退款审核分级

- 金额 < 10w：FI- 单人审批
- 10w ≤ 金额 < 100w：FI- + SU- 双审
- 金额 ≥ 100w：禁止线上，走线下合同
- 双审两人不能是同一人；时间间隔 ≥ 1 分钟（防止机器人单人双审）

### F3 对公转账重复凭证

- 凭证图 pHash 命中已审核或处理中的凭证 → 标记"疑似重复"
- 不强制阻止"通过"，但弹窗强提示 + 二次确认
- 两笔订单都通过审核且同一凭证 → 自动进入异常订单池由 SU- 介入

### F4 资讯发布双审

- 草稿可任意编辑
- 提交发布 → 状态 pending_publish → 第二个 OP-/SU- 进入审核
- 同一人不能既写又审
- 通过后立即发布或定时发布
- 已发布的不可删除，只能下架（保留历史）

### F5 销售离职继承

- 系统不自动指定接手销售；必须 SU- 手动选
- 接手销售可一次性选 1 个，或按客户分批转给多个
- 客户的 `valid_until` 不变（不延长不缩短）
- 离职销售后续若有未发放佣金 → 进入"待追回 / 待处理"队列
- 审计日志：源销售、目标销售、客户列表、操作人、原因

### F6 客户跨销售调拨

- 必须双人复核
- 调拨切割时点之前的订单佣金归原销售
- 调拨切割时点之后的订单佣金归新销售
- 客户 `valid_until` 不延长（避免"换销售骗归属期"）
- 客户被通知（短信 + 邮件）"您的销售对接人已变更"

### F7 价格调整

- 上架 / 调价 / 下架不影响存量订单（订单按下单时锁定的 plan_history 快照计费）
- 续费时按当前最新价格
- 折扣价必须同时设有效期，过期自动恢复默认价
- 价格调整后 24h 内系统不允许再调（防误操作）

### F8 佣金月度发放

- 每月 1 日 00:30 自动生成上月批次
- 批次必须 FI- 抽查 ≥ 7 条流水（系统强制弹窗，每条都需点过）
- 通过后导出"打款单 CSV"
- 财务线下打款（出系统）后回到 B5.3 标记
- 已发放批次不可撤销；如有问题走"已发放冲销"工单（出本 PRD 范围）

### F9 异常订单阈值

- 默认 ¥50,000；可在 B9 调
- 同企业 1h 内 ≥ 3 单：自动入异常池
- 同 USCC 月内 ≥ ¥500w：触发风控自动冻结订单（必须人工解冻）

### F10 高危操作的双因素

- 任何"暂停企业 / 关闭企业 / 退款 / 价格上下线 / 通知模板 / 系统参数 / 角色权限"修改，**保存前必须 MFA 二次验证**
- 即便已登录，依然弹窗输入 6 位 TOTP

---

## 十、状态机

### 10.1 订单 `order.status`

```
pending ──支付──→ paid ──退款──→ refunded
   │                                  
   ├─对公转账─→ pending_review ──审核通过──→ paid
   │                              ──审核驳回──→ pending（可重传）
   │                              ──挂起──→ suspended
   │                                  
   └──取消──→ cancelled
```

### 10.2 退款单 `refund_request.status`

```
pending ──通过──→ approved ──退款 API 调用中──→ processing ──成功──→ completed
   │                                                       └──失败──→ failed（可重试）
   └──驳回──→ rejected
```

### 10.3 对公转账审核 `bank_transfer_review.review_status`

```
pending ──通过──→ approved
   │
   ├──驳回──→ rejected
   │
   └──挂起──→ suspended
```

### 10.4 佣金批次 `commission_batch.status`

```
auto_generated ──系统自动──→ pending_review ──FI-审核──→ approved ──导出──→ exported ──打款回标──→ paid
                                                       ──驳回──→ pending_review（可改）
```

### 10.5 资讯 `news.status`

```
draft ──提交审核──→ pending_publish ──双审通过──→ scheduled / published ──手动下架──→ offline
                                ──驳回──→ draft
```

### 10.6 留资 `consult_lead.status`

```
new ──分配──→ assigned ──销售认领──→ claimed ──跟进──→ following ──→ converted / closed
```

### 10.7 客户调拨申请 `customer_transfer_request.status`

```
pending ──双审通过──→ approved（生效）
   └──任一驳回──→ rejected
```

### 10.8 代登录会话 `impersonation_session`

```
开启 → 进行中（最长 2h）
        │
        ├──手动结束──→ ended (manual)
        ├──超时──→ ended (timeout)
        └──SU-强退──→ ended (forced)
```

---

## 十一、Beta1 权限口径（单角色）

Beta1 不做 R1 子角色权限矩阵。前端、菜单、验收统一按一个“官方管理员”角色实现。

| 模块 | 官方管理员 Beta1 可见能力 | 后置能力 |
|---|---|---|
| B1 仪表盘 | 待审对公、待开通、异常订单、待确认佣金 | 复杂 BI、监控告警入口 |
| B2 企业管理 | 企业列表、后台补录企业、企业详情、销售归属、席位摘要、订单与开通状态；新增后为待下单，不直接开通 | 代登录、批量暂停 / 恢复、关闭企业、高危操作 |
| B3 订单与账单 | 订单查看、对公审核、退款处理、开通任务关联 | 自动银行流水、复杂对账 |
| B4 销售管理 | 销售列表、销售详情、客户归属、销售继承 | 排行榜、客户调拨审批 |
| B5 佣金管理 | 基础佣金规则、佣金流水、pending / confirmed / paid 状态 | 发放批次、手工调整、申诉审批 |
| B6 套餐与价格 | 标准套餐和价格口径维护 | 政策码、复杂定制报价审批、套餐上下线双审 |
| B8 咨询留资池 | 留资列表、手动分配销售、状态追踪 | 自动分配规则、复杂 SLA |
| B10 内部员工账号 | 新增员工、基础角色、状态管理 | 权限矩阵、MFA、双人复核、细粒度授权 |
| B7 / B9 / B11 | 不进入 Beta1 导航和直达页面 | 资讯、角色权限、字典、通知模板、系统参数、审计、监控告警 |

---

## 十二、非目标（明确指向其他文档）

| 不做 | 在哪做 |
|---|---|
| 客户业务操作（Claw / 技能 / 用量） | 主 PRD § 六 A（R4 / R5） |
| 销售自助（创建链接、客户池 CRUD） | 销售 CRM PRD |
| 交付运维（IM 绑定 / 网络配置） | 主 PRD § 八 C |
| 火山底层基础设施 | 火山原生控制台 |
| 多级审批工作流引擎 / 双人复核 | Beta1 暂不引入 |
| 自定义角色 / 细粒度按钮编辑 | Beta1 不拆内部子角色，后续版本再做 |
| 完整工单系统 | 运维 PRD 承接；官方后台只看开通任务状态 |
| 财务系统对接 / 自动打款 | 暂走线下；T+1 打款 |
| **多级分销** | 全产品明确不做（代理只能挂销售，不能再挂代理）|
| 客户合同 / 法务文件管理 | 暂线下 |
| **代理镜像站后台的具体功能（自定义品牌、自管销售页面、自查报表等）** 🆕 v1.3 | **代理商-PRD.md（独立新增）**，本 PRD 只看官方管理对代理的动作 |
| **代理区域防串货 / 企查查接入** 🆕 v1.3 | **V2**，5/20 不上 |
| **代理钱包余额账户 / 代金券** 🆕 v1.3 | **V2**，5/20 不上 |
| **代理 30 天冷静期等高级佣金计算公式** 🆕 v1.3 | **V2**，且必须保证 5/20 上线数据不被破坏 |

---

## 十三、成功指标（首版 GA 3 个月内）

| 类别 | 指标 | 目标 |
|---|---|---|
| **效率** | 对公转账审核平均时长 | ≤ 8 小时 |
| | 开通任务生成成功率 | ≥ 95% |
| | 开通任务超过 24 小时未处理数量 | 每日可见 |
| | 佣金 pending 生成时效 | 企业开通后即时生成 mock 流水 |
| **质量** | 对公审核通过 / 驳回 / 挂起状态完整 | 100% |
| | 异常订单可见率 | 100% |
| | 销售归属可追溯率 | 100% |
| **合规** | 对公审核、开通任务、套餐变更基础留痕 | 100% |
| | 后置治理入口不在 Beta1 导航暴露 | 100% |
| **稳定** | 后台 P95 响应 | ≤ 1.5s |
| | 火山 API 不可用时只读功能可用率 | ≥ 95% |
| **运营** | 平台月活企业 / 累计企业 | ≥ 60% |
| | 平台月可用性 | ≥ 99.5% |

---

## 十四、测试要点 / 端到端验证

### 14.1 必测路径

1. **对公转账闭环**：客户上传凭证 → 官方管理员审核通过 → 生成开通任务 → 企业席位池开通 → 销售佣金生成
2. **开通任务闭环**：对公审核通过 → 任务进入待开通 → 系统 / 运维推进 → 待管理员激活 → 企业席位池可用
3. **销售归属闭环**：客户通过销售链接注册 → 官方后台企业详情可见归属 → 销售端开通跟进可见同一状态
4. **留资分配闭环**：咨询留资进入官方后台 → 分配销售 → 销售跟进 → 转客户。
5. **退款闭环**：创建退款单 → 审核通过 / 驳回 → 订单和佣金状态同步。
6. **佣金规则与流水闭环**：维护基础佣金规则 → 企业开通完成 → 官方后台佣金流水出现 pending → 销售端佣金明细同步可见。
7. **内部员工账号闭环**：新增内部员工 → 选择基础角色 → 员工账号进入可用 / 冻结状态。
8. **后置入口隐藏验证**：角色权限、排行榜、客户调拨审批、资讯、监控、代登录等入口不在 Beta1 导航暴露，直达路由回到主链路页。

### 14.2 边界测试

- 凭证 pHash 重复 → 提示 + 二次确认
- 异常订单阈值动态调整生效时间
- 系统参数修改前后值的版本快照
- 审计日志删除 SQL 执行 → 数据库返回 permission denied

### 14.3 现状校准

打开 `http://localhost:5160/admin/dashboard`，对照下表填补：

| 模块 | 原型 | PRD 对应 | 差距 |
|---|---|---|---|
| B1 仪表盘 | 🔄 | § 6.1 | 待开发对照填 |
| B2 企业 | 🔄 | § 6.2 | 待开发对照填 |
| B3 订单 | 🔄 | § 6.3 | 待开发对照填 |
| ... | | | |

---

## 十五、风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| **R1 内部员工权限滥用**（代登录窥客户、改佣金） | 严重信任 / 法律风险 | 双人复核 + MFA + 强审计 + 月度合规巡检 + 客户全程通知 |
| **代登录会话泄露**（cookie 被劫持） | 客户数据泄露 | 短会话（2h）+ IP 绑定 + 设备指纹 + 异常立即终止 |
| **对公凭证伪造** | 财务损失 | pHash + OCR + 银行对账 T+1 + 单笔阈值审核 |
| **资讯被错发 / 含违规内容** | 声誉 / 法律风险 | 双审 + 草稿不可外露 + 已发布只能下架不能删 |
| **价格调整误伤老订单** | 客户索赔 | 订单锁定 plan_history 快照；老订单不受影响 |
| **佣金月度发放延迟** | 销售投诉 | 1 日 00:30 自动跑 + 5 日发放 SLA + 系统监控 |
| **异常订单阈值过低 / 过高** | 误报 / 漏报 | 阈值在 B9 灵活调；首月每周复盘调整 |
| **审计日志被绕过** | 合规失效 | DB 层禁删 + 操作前置中间件强制写日志 + 自检任务每日比对 |
| **火山 API 不可用** | 多模块瘫痪 | B11 监控告警 + 本地缓存只读兜底 + 应急通知客户 |
| **客户调拨被滥用**（销售内部勾结） | 公平性 | 双人复核 + 全部审计 + 月度调拨次数 Top 巡检 |

---

## 十六、引用映射表

| 本 PRD 章节 | 来源 |
|---|---|
| § 2.1 模块定位 | 0423 会议 01:54-02:37 |
| § 3.1 R1 子角色拆分 | 本 PRD 新增（运营 / 财务 / 客户支持职能拆分） |
| § 5.6 代登录 | 主 PRD § 七 B2"以此企业管理员身份登录" |
| § 6.4 销售管理 | 主 PRD § 七 B4 + 销售 PRD § E1 / E7 |
| § 6.5 佣金 | 主 PRD § 七 B5 + 销售 PRD § 5.2 / E4 / E5 |
| § F1 代登录约束 | 本 PRD 新增 |
| § F2 退款分级 | 本 PRD 新增 |
| § F8 佣金月度发放 | 主 PRD § 七 B5"导出财务打款单" + 本 PRD 细化 |

---

## 十七、附录

### 17.1 术语表

| 术语 | 解释 |
|---|---|
| R1 / 超管 / 平台管理员 | 云脑智联内部员工，平台最高权限角色集合 |
| SU- / OP- / FI- / CS- | R1 内部子角色：超级管理员 / 平台运营 / 财务专员 / 客户支持 |
| 代登录 / Impersonate | R1 以客户企业管理员身份登录的支持能力 |
| 双人复核 | 同一操作必须由两个不同的 R1 用户先后批准 |
| 批次 | 佣金按月汇总的发放单元 |
| pHash | 图片感知哈希，用于识别"同一张凭证图" |
| MFA | 多因素认证（TOTP） |
| TOTP | Time-based One-Time Password |

### 17.2 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-04-24 | 首版，基于主 PRD § B + 0423 会议 + 销售 CRM PRD 关联设计 | Claude + 产品团队 |
| v1.1 | 2026-04-29 | Beta1 收敛：把 R1.0/R1.1/R1.2/R1.3 四子角色合并为"官方管理员"单角色；后置代登录、双人复核、MFA、权限矩阵、系统配置、监控告警等治理能力到 Beta2 | 产品团队 |
| v1.2 | 2026-05-08 | § 6.1 全局仪表盘重构：从"9 张 KPI 卡平铺 + 待办在中下"改为四区分层（告警 / 待办 / 经营 / 健康）；待办上移至最顶（仅在告警条下方）；每张卡新增"关联金额 + CTA 按钮"+ 经营卡新增"环比 ▲▼ %"；Top 10 → Top 5；平台健康默认折叠 + 异常时自动展开；新增分区刷新策略与空态首次引导。同步引用财务佣金结算 PRD 作为 § B5 详细执行参考 | Claude + 产品团队 |
| **v1.3** | **2026-05-15** | **来自 5/15 李磊快速会议**：① 术语清理（旧"代理"已统一改名为"销售"；新"代理"重新定义为拥有镜像站的合作伙伴）；② 新增 § 6.12 代理商管理模块（账号开通、进货、佣金、提现工单、镜像站配置入口）；③ § 6.4 销售管理补充直营 / 代理下属两类（agent_id 维度）；④ § 6.5 佣金管理明确销售佣金 vs 代理佣金两条线；⑤ § 6.6 套餐价格补充代理可自定义；⑥ § 2.2 In Scope 加 B12；⑦ § 12 非目标明确防串货 / 钱包 / 代金券进 V2；⑧ § 1.4 术语对齐加"代理 / 镜像站 / 直营 vs 代理体系" | **Claude + 产品团队（基于王世康 + 李磊 + 刘书言 5/15 会议）** |

### 17.3 sign-off 区

请运营 / 财务 / 法务三方分别确认：

#### 运营负责人 sign-off
- [ ] § 2.4 设计原则可执行
- [ ] § 3.1 R1 子角色拆分（4 子角色）合理
- [ ] § 6.2 企业管理高危操作清单完整
- [ ] § 6.7 资讯双审流程可接受
- [ ] § 6.8 留资分配 + SLA 合理
- [ ] § 13 KPI 可达

签字 / 日期：__________________________________

#### 财务负责人 sign-off
- [ ] § 5.2 退款流程闭环正确
- [ ] § 5.3 佣金月度发放流程可执行
- [ ] § 6.3 对公转账审核 SLA 合理
- [ ] § F2 退款金额分级（10w / 100w）合理
- [ ] § F8 佣金月度发放周期（1 日生成 / 5 日完成）合理
- [ ] § F10 高危操作 MFA 强制可接受

签字 / 日期：__________________________________

#### 法务 / 合规负责人 sign-off
- [ ] § F1 代登录约束（2h、客户通知、审计）满足合规
- [ ] § 6.9.5 审计日志保留 12 月不可删合规
- [ ] § 14 越权访问拦截 100% 强制
- [ ] § 15 风险应对方案完备
- [ ] 客户隐私 / 个保法相关条款已覆盖

签字 / 日期：__________________________________

---

**文档结束**
