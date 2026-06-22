# 销售 CRM 管理 · 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.2 |
| 撰写日期 | 2026-04-29（v1.0：2026-04-24） |
| 模块代号 | 模块 D · 销售后台（细化版） |
| 父文档 | `/1-prd/PRD.md`（v1.0） |
| 目标读者 | 前端开发、后端开发、QA、销售业务负责人、PM |
| 范围 | R3 销售角色全部可用功能；销售相关数据模型、接口、规则；**v1.2 调整：激活码改为企业开通跟进** |
| 状态 | 待评审（销售业务负责人 sign-off） |

---

## 📌 v1.2 重要变更（2026-04-29 实现讨论会后校准）

> 来源：`/0429评审会议-梳理.md`

| 变更 | 影响章节 |
|---|---|
| 废弃“每成员手动输入激活码 / 销售派码”作为主流程 | § 5.5、§ 6.6、§ E8-E9 |
| 将“激活码 / 激活链接”收敛为企业级订单激活入口，由客户管理员一次性完成 | § 5.5、§ 6.6 |
| 销售端 D6 从“激活码派发”调整为“开通跟进” | § 6.6、§ 8.8 |
| Beta1 购买路径以企业对公转账为主，微信 / 支付宝暂不作为主路径 | § 5.5、§ E4 |
| 佣金建议以“企业席位池开通可用”作为 pending 生成点 | § 5.2、§ E4 |

---

## 一、文档元信息

### 1.1 与主 PRD 的引用映射

| 本 PRD 章节 | 主 PRD 对应章节 |
|---|---|
| § 6.1 销售仪表盘 | § 九 D1 |
| § 6.2 我的客户池 | § 九 D2 |
| § 6.3 分享链接 & 注册邀请码（归因） | § 九 D3 |
| § 6.4 佣金明细 | § 九 D4 |
| § 6.5 咨询留资 Inbox | § 六 A8、§ 七 B8 |
| § 6.6 开通跟进（企业激活与席位池）**🆕 v1.2** | 主 PRD § A7 + § B3/B6 联动 |
| § 6.7 销售个人中心 | 主 PRD 未列，本 PRD 补全 |
| § 7 数据模型 | § 十二 |
| § 9 业务规则 E1-E9 | § 一 1.4、§ 十七 风险 |
| § 11 权限矩阵 | § 十一 |

### 1.2 引用资产
- `/1-prd/PRD.md` 主 PRD
- `/0423会议.md` 需求起源会议纪要
- `/0-assets/ArkClaw/` 火山控制台原型截图（销售 CRM 不直接复用，但视觉风格对齐）
- `http://localhost:5160/sales/dashboard` 当前已实现的销售工作台原型

### 1.3 术语对齐（详见 § 17 附录术语表）
- **销售（Sales）**：R3 角色；本文中"销售人员 / 销售员 / 销售"等价
- **客户（Customer）**：销售名下的下游企业，对应主 PRD 的 `tenant` 实体
- **归属（Binding）**：客户与销售的绑定关系，决定佣金归属
- **归属期（Attribution Window）**：客户首次可用起 12 个月，推荐以企业席位池开通成功时间为起点
- **USCC**：统一社会信用代码（Unified Social Credit Code），客户去重主键
- **分享链接（Share Link）🔵 归因层**：销售生成的 URL，客户通过此链接注册自动归销售名下
- **注册邀请码（Registration Code）🔵 归因层**：6 位字符，效果等同分享链接，便于口头 / 海报传播
- **企业激活入口（Activation Entry）🟢 开通层 🆕 v1.2**：客户对公确认后生成的企业级激活链接 / 码，只由客户管理员确认一次，不面向每个成员
- **归因层 vs 开通层**：分享链接 / 注册邀请码解决"客户算哪个销售的"；开通任务 / 企业激活入口解决"企业付款后如何可用"。两者并行但边界清晰

---

## 二、模块定位、目标与设计原则

### 2.1 模块定位

销售 CRM 管理是云脑智联 × ArkClaw 代理平台中**面向销售角色（R3）**的核心工作台，承载：

- **获客**：分享链接 / 邀请码 / 手动录入三条客户进入路径
- **维护**：客户池增删改查、跟进记录、客户详情多维数据查看
- **变现**：实时预估佣金、佣金明细查看、导出对账
- **协作**：从平台咨询留资池认领潜在客户

它与主 PRD 模块 A（客户侧）、B（官方管理后台）、C（交付运维）解耦：销售不接触客户内部数据（Claw 实例、Token 用量等业务数据），只看商务侧（合同金额、订单、佣金）。

### 2.2 本期目标（In Scope）

1. **D1 仪表盘**：实时业绩数据 + 待办聚合
2. **D2 客户池**：完整 CRUD + 去重校验 + 跟进记录 + 详情五 Tab
3. **D3 分享链接 / 邀请码**：生成、归因、防刷、落地页
4. **D4 佣金明细**：实时预估 + 已确认流水 + 导出
5. **D5 咨询留资 Inbox**：从 B8 认领、24h SLA、转客户池
6. **D6 销售个人中心**：业绩历史、月度报表、资料

### 2.3 非目标（Out of Scope，详见 § 12）

- ❌ 佣金规则配置 → 平台官方管理员后台 § B5
- ❌ 销售账号 CRUD → § B4
- ❌ 跨销售客户调拨 / 离职继承 → § B4 + 平台管理员审批
- ❌ 全局订单 / 退款审核 → § B3
- ❌ 多级分销 → 主 PRD 已明确不做

### 2.4 设计原则

1. **销售只看自己的数据**：列表、详情、导出、统计接口必须强制 `WHERE sales_id = current_user.sales_id`，应用层 + 数据库行级双保险
2. **归因一次且终身**：客户首次绑定销售后，归属期内不可变；归属期外允许管理员介入（出本 PRD 范围）
3. **佣金实时但有确认态**：对公确认后进入开通任务；企业席位池可用后生成 `pending` 佣金流水；T+1 财务对账后转 `confirmed`；退款触发 `reverted`
4. **去重以 USCC 为唯一主键**：联系人姓名、电话、邮箱仅作辅助提醒，不作硬约束
5. **接口幂等**：所有写操作支持 `Idempotency-Key` 头，避免重复绑定 / 重复扣款
6. **审计强制**：销售对客户的写操作（新增、修改、删除、备注）100% 进 `audit_log`

---

## 三、角色与权限边界

### 3.1 角色聚焦

本 PRD 仅面向 **R3 销售（Sales）**。其他角色（R1 官方管理员、R2 交付运维、R4/R5 客户侧）在本 PRD 中仅作为接口对端 / 数据来源出现。

### 3.2 销售之间的数据隔离

- 销售 A 不能看到 / 修改 / 导出销售 B 的客户、佣金、链接、邀请码、咨询留资
- 销售经理（暂归 R1，未来可能拆出 R3.5 子角色）能看到团队所有销售的数据 —— **本期不实现**，预留接口 `?as_manager_team=<team_id>`

### 3.3 销售与 R1 / R4 的接触面

| 接触场景 | 销售可做 | 销售不可做 |
|---|---|---|
| 客户企业基本信息 | 查看、修改销售备注 | 修改企业 USCC、企业管理员账号 |
| 客户订单 | 查看金额、状态 | 退款、修改订单 |
| 客户用量 | 查看月消耗汇总（脱敏） | 看具体 Claw 内容、Token 明细 |
| 客户咨询留资 | 认领归我的；转化为客户池条目 | 删除别人的留资 |
| 自己的销售档案 | 查看、改密码、改头像 | 改入职日期、佣金率、Team |

---

## 四、用户故事

| ID | As a | I want | So that |
|---|---|---|---|
| US-S01 | 新入职销售 | 第一次登录看到引导：先生成我的分享链接 | 我能立刻开始拓客 |
| US-S02 | 销售 | 把分享链接发给客户对接人 | 客户从这里注册自动绑定到我名下 |
| US-S03 | 销售 | 在客户池新增一个潜在客户 | 实时校验 USCC，避免和同事撞单 |
| US-S04 | 销售 | 看到一个客户从潜在到签约的全程 | 我能合理排优先级 |
| US-S05 | 销售 | 给客户加一条跟进记录（备注 + 下次跟进时间） | 我不会忘了回访 |
| US-S06 | 销售 | 一眼看到本月预估佣金 | 知道当月业绩进度 |
| US-S07 | 销售 | 下钻看到每笔佣金的计算依据 | 能解释给财务、解释给老板 |
| US-S08 | 销售 | 收到平台分给我的咨询留资通知 | 24h 内联系上潜在客户 |
| US-S09 | 销售 | 把已联系的留资转成客户池条目 | 流程闭环 |
| US-S10 | 销售 | 导出本月佣金明细 CSV | 给财务提佣金发放 |
| US-S11 | 销售 | 给一个客户分配客户经理（备注） | 多人协作时分工清晰 |
| US-S12 | 销售 | 销售试图二次绑定一个 USCC 已存在的客户 | 系统拦截并告诉我"该客户已有归属" |
| US-S13 | 销售 | 客户付款后我立刻看到佣金预估变化 | 体感成就反馈 |
| US-S14 | 销售 | 客户退款后看到佣金被回退 | 清楚知道实际可发放金额 |
| US-S15 | 销售经理（未来） | 看到我团队所有销售的业绩排名 | 做团队管理 |

---

## 五、核心业务流程

### 5.1 客户绑定的三条路径

```
路径 A · 分享链接                  路径 B · 邀请码                   路径 C · 手动录入
─────────────                    ─────────────                    ─────────────
销售生成链接                       销售生成 6 位邀请码                销售在客户池新增
   │                                │                                │
   ▼                                ▼                                ▼
客户点链接                          客户在注册页                       销售填表
   │                                输入邀请码                          │
   ▼                                │                                ▼
落地页（带 sales_id 加密参数）       ▼                              USCC 实时校验
   │                              校验码有效性                          │
   ▼                                │                                ├─ USCC 不存在 → 直接绑定
客户填注册表                         ▼                                └─ USCC 已存在
   │                              客户填注册表                              │
   ▼                                │                                      ▼
USCC 校验                            ▼                              已绑销售 X？
   │                              USCC 校验                                │
   ├─ 已存在 → 拒绝绑定（E3）          │                              ├─ X = 自己 → 提示已存在
   └─ 不存在 → 创建 tenant            └─ 同 ←                          └─ X ≠ 自己 → 拒绝（E2/E3）
              + sales_customer
              + 客户管理员账号
              + bound_source = "share_link"
```

### 5.2 佣金触发与状态扭转

```
订单 created (status=pending)
        │
        ▼
客户对公转账 / 官方后台确认到账
        │
        ▼
订单 status=paid
        │
        ▼
生成企业开通任务
        │
        ▼
企业席位池开通可用
        │
        ▼
查询 sales_customer 获取归属销售
        │
        ▼
判断是否在归属期内？
        ├─ 否 → 不生成佣金（仅记日志：out_of_window）
        └─ 是
            ▼
        生成 commission 流水 (status=pending, amount = order × 5%)
            │
            ▼
        销售仪表盘 / 佣金明细实时刷新
            │
            ▼
       T+1 财务对账
            │
            ▼
        commission status=confirmed
            │
       ┌────┴────┐
       │         │
       ▼         ▼
   月度发放    退款触发
   status=     ── 反向 ──→ 同 commission 写一条相反金额，
   paid        冲销         双方 status=reverted
```

### 5.3 客户跟进生命周期

```
潜在 (potential)
    │  销售首次跟进
    ▼
跟进中 (engaging)
    │  支付成功 → 自动迁移
    ▼
已签约 (signed)
    │
    ├─ 持续付款 → 留在 signed
    └─ 90 天无活跃 + 无续约 → 流失 (churned)
                                   │
                                   ▼
                              （销售可手动恢复至 engaging）
```

> 状态变更规则：手动迁移仅允许 potential ⇄ engaging；signed / churned 由系统根据订单与活跃度自动驱动，销售只能查看不能改。

### 5.4 咨询留资认领

```
客户在 A8 提交咨询表单
        │
        ▼
B8 留资池入库 (status=new)
        │
        ▼
R1 手动分配给某销售（首版手动，D8） → assigned_sales_id 写入
        │
        ▼
该销售收到站内消息 + 邮件
        │
        ▼
销售在 D5 Inbox 看到该条 → 点"认领"
        │  ├─ 24h 未认领 → 升级提醒至 R1
        ▼
status=claimed，记 claimed_at
        │
        ▼
销售跟进 → 客户愿意签约 → "转客户" → 创建 tenant + sales_customer
        │
        ▼
status=converted，跳到 § 5.1 路径 C
```

### 5.5 企业开通与席位池流程（🆕 v1.2）

> 与 § 5.1 客户绑定路径**独立**：归因解决"算谁的"，开通任务解决"企业付款后如何可用"。销售不再给每个成员派发激活码。

#### 标准套餐

```
客户经分享链接 / 邀请码 / 官网自然访问完成注册
        │
        ▼
系统创建企业账号，并完成销售归属或进入待分配
        │
        ▼
客户选择标准套餐
        │
        ▼
客户对公转账并上传凭证
        │
        ▼
官方后台确认到账
        │
        ▼
系统生成开通任务
        │
        ▼
火山资源映射 + 统一登录配置 + 企业席位池开通
        │
        ▼
客户管理员进入席位管理，邀请成员并分配席位
        │
        ▼
成员登录后自动启用席位
        │
        ▼
销售看到客户进入“已开通”，佣金进入 pending
```

#### 定制报价

```
销售与客户确认需求
        │
        ▼
销售提交报价信息
        │
        ▼
官方后台创建定制订单
        │
        ▼
客户确认订单内容
        │
        ▼
客户对公转账并上传凭证
        │
        ▼
官方后台确认到账
        │
        ▼
进入标准开通任务流程
```

#### 企业激活入口

企业激活入口可以是激活链接，也可以是备用激活码。它只用于客户管理员确认企业订单，不用于每个成员逐个激活。

| 入口 | 用法 | 销售侧职责 |
|---|---|---|
| 企业激活链接 | 客户管理员点击后确认激活企业订单 | 提醒客户管理员处理 |
| 企业激活码 | 链接不可用或线下合同场景下备用 | 只查看状态，不负责逐个派发给成员 |

#### 关键时序约束

| 节点 | 约束 |
|---|---|
| 对公审核通过 → 开通任务生成 | ≤ 1 分钟 |
| 开通任务生成 → 销售可见 | 站内即时 |
| 开通任务异常 → 销售 / 官方后台可见 | ≤ 1 分钟 |
| 企业席位池开通 → 客户管理员可分配席位 | ≤ 5 分钟，取决于火山接口能力 |
| 成员被分配席位 → 登录自动启用 | 实时 |

---

## 六、功能详解

> 标注约定：✅ 已实现 / ⚠️ 部分实现 / ❌ 待实现 / 🔄 待校准（需对照 `localhost:5160/sales/dashboard` 后由开发更新）

### 6.1 D1 销售仪表盘

#### 路径
`/sales/dashboard`

#### 6.1.1 页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  顶部欢迎条：你好，<姓名>！本月已新增 X 个客户，加油 💪          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  │我的 │ │本月 │ │本月 │ │本月 │ │归属期│ │累计 │            │
│  │客户 │ │新增 │ │回款 │ │预估 │ │内客户│ │佣金 │            │
│  │ 23  │ │  4  │ │¥85k│ │¥4.3k│ │ 18  │ │¥31k│            │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │
├─────────────────────────────────────────────────────────────┤
│  近 30 天回款趋势图（折线）                                   │
├─────────────────────────────────────────────────────────────┤
│  Top 10 客户消耗（柱状）        |  待办（标签 + 数量）         │
│                                  |  · 待认领咨询 3 条           │
│                                  |  · 超时未跟进 5 个客户        │
│                                  |  · 即将到期归属 2 个客户       │
└─────────────────────────────────────────────────────────────┘
```

#### 6.1.2 卡片定义

| 卡片名 | 计算口径 | 数据源 | 刷新频率 |
|---|---|---|---|
| 我的客户数 | `count(sales_customer WHERE sales_id=me)` | 实时 | 进入页刷新 |
| 本月新增 | 当月新建 sales_customer 数 | 实时 | 进入页 |
| 本月回款 | 当月归我客户 `order.status=paid` 金额合计 | 实时 | 进入页 |
| 本月预估佣金 | 当月归我 `commission` 金额合计（含 pending） | 实时 | 进入页 |
| 归属期内客户数 | `now() - first_paid_at < 12 months` 的客户数 | 实时 | 进入页 |
| 累计佣金 | 入职至今 `commission.status IN (confirmed, paid)` 合计 | 实时 | 进入页 |

#### 6.1.3 待办分组

| 标签 | 计算 | 点击跳转 |
|---|---|---|
| 待认领咨询 | `consult_lead.assigned_sales_id=me AND status=new` | D5 Inbox |
| 超时未跟进 | 客户 last_followup_at > 14 天前 | D2 客户池筛选 "超时未跟进" |
| 即将到期归属 | 归属期剩余 < 30 天的客户 | D2 客户池筛选 "归属期将到" |
| 待对账佣金 | `commission.status=pending` 金额 | D4 佣金明细 |

#### 6.1.4 实现状态

🔄 待校准（基于 `localhost:5160/sales/dashboard` 的现有原型，开发对照后更新）

#### 6.1.5 错误态 / 空态

- 新销售 0 客户：欢迎条变为"开始你的第一单！" + CTA 按钮跳 D3 生成链接
- 数据接口失败：卡片显示"—"，配 toast 提示重试

---

### 6.2 D2 我的客户池

#### 路径
列表 `/sales/customers`
新增 `/sales/customers/new`
详情 `/sales/customers/:id`

#### 6.2.1 列表页

##### 列定义

| 列 | 字段 | 说明 |
|---|---|---|
| 客户名 | `tenant.name` | 点击进详情 |
| USCC | `tenant.unified_social_credit_code` | 18 位 |
| 联系人 | `tenant.primary_contact_name` |  |
| 电话 | `tenant.primary_contact_phone` | 隐私脱敏中间 4 位 |
| 行业 | `tenant.industry` | 字典 |
| 状态 | `customer_status` | potential/engaging/signed/churned |
| 归属时间 | `sales_customer.bound_at` |  |
| 归属剩余 | 12 月 - 已经过 | < 30 天高亮黄色 |
| 最近跟进 | `last_followup_at` | > 14 天高亮红色 |
| 累计回款 | sum(orders) |  |
| 累计佣金 | sum(commissions) |  |
| 客户经理 | `account_manager_note` | 销售自填备注 |
| 操作 | 编辑 / 跟进 / 详情 |  |

##### 筛选 / 搜索

- 全文搜索：客户名、USCC、联系人姓名、电话
- 高级筛选：状态、行业、归属时间区间、归属期是否将到、是否超时未跟进
- 排序：默认按 `bound_at desc`；可切 累计回款 / 累计佣金 / 最近跟进

##### 批量操作

- 导出选中（CSV）
- 批量"标记为流失"（仅 engaging → churned）
- 批量分配客户经理备注

##### 实现状态：❌ 待实现

#### 6.2.2 新增客户

##### 表单字段

| 字段 | 必填 | 类型 | 校验 |
|---|---|---|---|
| 客户名 | ✅ | text | 2-50 字 |
| USCC | ✅ | text | 18 位字母数字、正则校验、**实时去重** |
| 联系人姓名 | ✅ | text | 2-20 字 |
| 联系电话 | ✅ | tel | 中国手机号正则 |
| 联系邮箱 |  | email | RFC 5322 |
| 行业 | ✅ | select | 字典 25 项 |
| 客户来源 | ✅ | select | 主动开发 / 老客户介绍 / 行业活动 / 其他 |
| 客户经理（备注） |  | text | 最长 50 字 |
| 备注 |  | textarea | 最长 500 字 |

##### USCC 实时校验交互

```
用户输入 USCC（防抖 500ms）
        │
        ▼
调 GET /api/sales/customers/check-uscc?uscc=xxx
        │
        ├─ 200 { available: true }
        │     → 输入框右侧 ✓ 绿勾
        │
        └─ 200 { available: false, reason: "owned_by_other" }
              → 红色提示："该客户已被他人录入，不可重复添加"
              → 提交按钮置灰
        
        └─ 200 { available: false, reason: "owned_by_self" }
              → 黄色提示："该客户已在你的客户池中"
              → 提供"跳转到该客户"链接
```

> **隐私边界**：当 `owned_by_other` 时不暴露具体销售姓名，仅显示通用提示。

##### 实现状态：❌ 待实现

#### 6.2.3 客户详情（5 Tab）

##### Tab 1 · 基本信息
- 企业基本信息（USCC、行业、地址等，由 R4 客户管理员维护）只读
- 销售可编辑：客户经理备注、销售备注、自定义标签
- 归属信息：归属销售（自己）、绑定时间、绑定来源、归属剩余天数

##### Tab 2 · 订单历史
- 订单列表：订单号、类型、金额、支付方式、状态、付款时间
- 点击订单查看明细（金额构成、关联佣金）
- 仅显示金额与状态，**不显示客户业务消耗内容**

##### Tab 3 · 消耗趋势（脱敏）
- 月度 Token 消耗折线图（数值，不展示具体 Claw / 用户）
- 月度活跃员工数
- 用于销售判断客户健康度，决定续约策略

##### Tab 4 · 跟进记录
- 时间线展示：每条 = 跟进时间 + 跟进方式（电话 / 微信 / 见面 / 邮件）+ 内容 + 下次跟进时间
- "新增跟进"按钮 → 弹窗表单
- 仅自己可见自己的跟进记录

##### Tab 5 · 佣金流水
- 该客户产生的所有佣金记录
- 列：订单号、订单金额、佣金金额、状态、生成时间、确认时间
- 与 D4 子集（按客户筛选）

##### 实现状态：❌ 待实现

#### 6.2.4 跟进记录新增弹窗

| 字段 | 必填 | 类型 |
|---|---|---|
| 跟进方式 | ✅ | select：电话 / 微信 / 见面 / 邮件 / 其他 |
| 跟进内容 | ✅ | textarea，最长 1000 字 |
| 下次跟进时间 |  | date |
| 是否提醒 |  | checkbox（生成 7 天前 / 1 天前的站内消息） |
| 客户当前状态 |  | select（同步更新 customer_status） |

##### 实现状态：❌ 待实现

---

### 6.3 D3 分享链接 & 注册邀请码（归因层）

> ⚠️ **v1.2 重要说明**：本节"邀请码"专指**注册邀请码（Registration Code）**，作用是**注册时归因到销售**，与第 6.6 节"开通跟进 / 企业激活入口"是**两个不同概念**。
> - 本节邀请码 = 让客户注册时绑定到我（销售）名下
> - 6.6 节开通跟进 = 客户付款后跟进企业开通、管理员激活和席位池状态

#### 路径
`/sales/share`

#### 6.3.1 分享链接

##### 生成表单

| 字段 | 必填 | 默认 | 说明 |
|---|---|---|---|
| 链接名 | ✅ | "默认分享链接" | 自己识别用 |
| 有效期 |  | 永久 | 可选 7 天 / 30 天 / 90 天 / 永久 |
| 最大注册次数 |  | 不限 | 1 / 5 / 10 / 50 / 不限 |
| 关联备注 |  | — | 比如"2026 春糖会议" |

##### 链接结构

```
https://<我司域名>/r/<short_code>
       ↓ 短链跳转
https://<我司域名>/register?ref=<encrypted_payload>
       payload = base64(JSON.stringify({
         sales_id: <id>,
         link_id: <id>,
         issued_at: <ts>,
         signature: HMAC_SHA256(secret, sales_id+link_id+issued_at)
       }))
```

##### 展示组件
- 二维码（256×256，扫码即跳）
- 短链文本 + "复制"按钮
- 二维码"下载 PNG"按钮
- 链接已使用次数 / 总次数 / 已注册客户数（点击展开列表，跳客户池筛选）

##### 防刷规则

| 规则 | 阈值 | 触发动作 |
|---|---|---|
| 单 IP 1 小时内注册尝试 | > 5 次 | 该 IP 24h 内禁止注册 |
| 单手机号 | 全平台仅一次有效绑定 | 后续再用同号注册被拒 |
| 单 USCC | 全平台仅一次有效绑定 | E3 规则，拒绝并提示 |
| 链接到达最大次数 / 过期 | — | 落地页显示"链接已失效" |
| 人机验证 | 落地页强制 | 滑块 / 极验 |

##### 实现状态：❌ 待实现

#### 6.3.2 邀请码

##### 与分享链接的差异
- 适用于客户已经在我们的官网，主动找销售要邀请码的场景
- 6 位字母数字，去除易混字符（0/O、1/I/l），如 `K3F9XQ`
- 客户在通用注册页填邀请码，效果同分享链接

##### 生成参数（同分享链接）
- 备注、有效期、最大次数

##### 列表
- 我的邀请码：码、有效期、已用 / 总数、状态（有效 / 已耗尽 / 已过期）、操作（停用）

##### 实现状态：❌ 待实现

#### 6.3.3 落地页（注册）

##### 路径
`/register?ref=<payload>` 或 `/register`（手填邀请码）

##### 字段
- 客户名、USCC（实时去重，参考 6.2.2）
- 联系人姓名、电话、邮箱
- 设置管理员密码（≥ 8 位，含字母数字）
- 同意 EULA / 隐私政策（必勾）
- 滑块人机验证

##### 提交后时序

```
1. 校验 USCC 唯一性（E3）→ 失败立即返回错
2. 校验 ref payload signature → 失败按"普通注册"处理（无销售归属）
3. 创建 user + tenant + tenant_user(role=R4)
4. 创建 sales_customer(sales_id, tenant_id, bound_source, bound_at)
5. 调火山 OpenAPI 创建空间（异步，进度展示在欢迎页）
6. 发送欢迎邮件 + 短信（含登录链接、初始密码已设置提醒）
7. 跳转客户首页（A0）
```

##### 实现状态：❌ 待实现

---

### 6.4 D4 佣金明细

#### 路径
`/sales/commission`

#### 6.4.1 列表

| 列 | 字段 | 说明 |
|---|---|---|
| 订单号 | `order.id` | 点击展开订单详情 |
| 客户 | `tenant.name` | 跳客户详情 |
| 订单金额 | `order.amount` |  |
| 佣金金额 | `commission.amount` | = order × 5% |
| 计算依据 | 展开按钮 | 弹窗显示：5% × ¥X = ¥Y，归属期剩余 N 天 |
| 状态 | `commission.status` | pending / confirmed / paid / reverted |
| 生成时间 | `generated_at` |  |
| 确认时间 | `confirmed_at` |  |
| 发放时间 | `paid_at` |  |

#### 6.4.2 状态语义

| 状态 | 含义 | 销售操作 |
|---|---|---|
| pending | 订单已支付，待财务对账 | 仅查看 |
| confirmed | 财务已对账，待月度发放 | 仅查看 |
| paid | 已发放（打款 / 月薪附加） | 仅查看 |
| reverted | 因退款冲销 | 仅查看，标红 |

#### 6.4.3 筛选

- 时间区间（默认本月）
- 状态多选
- 客户搜索
- 金额范围

#### 6.4.4 汇总条
- 选中条目合计：订单金额、佣金金额
- 按状态分组合计

#### 6.4.5 导出

- 导出 CSV，列同表格 + 销售姓名 + 销售工号
- 文件名：`佣金明细_<销售姓名>_<起止日期>.csv`
- 异步任务：> 1000 行走异步生成，完成后站内消息通知下载

#### 6.4.6 实现状态：❌ 待实现

---

### 6.5 D5 咨询留资 Inbox

#### 路径
`/sales/leads`

#### 6.5.1 列表

| 列 | 字段 |
|---|---|
| 留资时间 | `created_at` |
| 客户名 | `consult_lead.company` |
| 联系人 | `name` + `title` |
| 电话 / 邮箱 | 脱敏 |
| 需求摘要 | `requirement` 截前 50 字 |
| 期望沟通方式 | `preferred_channel` |
| 期望回电时间 | `preferred_time` |
| 状态 | new / claimed / following / converted / closed |
| SLA 倒计时 | 距分配时间 24h 倒计时（new 状态显示） |
| 操作 | 认领 / 标记跟进 / 转客户 / 关闭 |

#### 6.5.2 关键交互

- **认领**：`new → claimed`，写 `claimed_at`，关掉 SLA 倒计时
- **跟进**：在留资详情写跟进备注（同 6.2.4 跟进表单结构）
- **转客户**：跳到 6.2.2 新增客户表单，自动预填字段，提交后留资 status → `converted`
- **关闭**：手动关单需选择关闭原因（不感兴趣 / 已选友商 / 联系不上 / 其他）

#### 6.5.3 通知

- 留资被分配：站内消息 + 邮件
- 留资 24h 未认领：站内升级提醒；同时通知 R1
- 留资 72h 未跟进：升级到销售经理（暂等同 R1）

#### 6.5.4 实现状态：❌ 待实现

---

### 6.6 D6 开通跟进（企业激活与席位池）🆕 v1.2

#### 路径
列表 `/sales/activation-codes`，页面名称调整为“开通跟进”。

> 保留当前路由是为了降低改造成本；产品语义不再是“销售派发激活码”，而是销售跟进客户付款后的企业开通状态。

#### 6.6.1 销售视角能做的事

销售需要：

1. 查看自己客户的订单确认、对公到账、开通任务、企业激活、席位池状态。
2. 识别客户卡在哪一步：待付款、待财务确认、开通中、待管理员激活、可分配席位、开通异常。
3. 提醒客户管理员完成企业级激活或进入席位管理分配成员。
4. 对开通异常发起内部跟进，不直接操作火山资源或席位底层映射。

销售不需要：

1. 给每个成员生成或派发激活码。
2. 处理激活码过期重发。
3. 修改开通任务、火山映射或统一登录配置。

#### 6.6.2 开通跟进列表

| 列 | 字段 | 说明 |
|---|---|---|
| 订单号 | order.id | 跳订单详情 |
| 客户 | tenant.name | 跳客户详情 |
| 套餐 | plan.name | 展示标准套餐或定制方案 |
| 订单金额 | order.amount | 对公确认金额 |
| 企业激活入口 | activation_entry.masked_value | 激活链接 / 备用激活码，默认脱敏 |
| 开通状态 | opening_task.status | 待开通 / 开通中 / 待管理员激活 / 已开通 / 开通异常 |
| 席位池 | seat_pool.summary | 已购、已分配、剩余 |
| 最近更新时间 | opening_task.updated_at | 用于判断是否超 SLA |
| 操作 | remind / view_seats / contact_admin | 提醒客户、查看席位、联系后台 |

#### 6.6.3 操作规则

| 状态 | 销售可执行动作 |
|---|---|
| 待开通 | 查看订单与对公确认结果 |
| 开通中 | 查看进度，不能催客户 |
| 待管理员激活 | 提醒客户管理员完成企业激活 |
| 已开通 | 引导客户管理员进入席位管理分配成员 |
| 开通异常 | 联系官方后台 / 创建内部跟进 |

#### 6.6.4 企业激活入口语义

企业激活入口只绑定企业和订单，不绑定成员。

| 类型 | 含义 |
|---|---|
| 激活链接 | 推荐主方式，客户管理员点击后确认企业订单 |
| 备用激活码 | 链接不可用或线下交付场景备用，由客户管理员输入一次 |

#### 6.6.5 实现状态：⚠️ 部分实现，需改造

当前原型已有“激活码列表、状态、发送、复制、重发”能力，但方向需要调整：

- 删除“销售派发激活码给客户输入”的主动作。
- 页面标题和文案改为“开通跟进”。
- 列表从“激活码状态”改成“开通状态 + 企业激活状态 + 席位池状态”。
- 操作从“发送 / 复制 / 申请重发”改成“提醒管理员 / 查看席位管理 / 联系后台”。

---

### 6.7 D7 销售个人中心

#### 路径
`/sales/profile`

#### 子页

| 子页 | 内容 |
|---|---|
| 基本资料 | 姓名、工号、入职日期、Team、头像（自传 / 改） |
| 业绩历史 | 月度 GMV、月度佣金、月度新客数表格 + 图表 |
| 月度报表 | 每月初自动生成上月报表 PDF，可下载 |
| 安全 | 修改密码、绑定 / 解绑 MFA、登录历史 |
| 通知设置 | 是否接收：留资分配 / 客户付款 / 佣金到账 / 系统维护 |

#### 实现状态：❌ 待实现

---

## 七、数据模型（销售相关表）

> 与主 PRD § 十二保持一致，本节补充字段约束、索引、生命周期。

### 7.1 `sales`

```sql
CREATE TABLE sales (
  id              BIGINT PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES user(id),
  employee_no     VARCHAR(32) NOT NULL UNIQUE,        -- 工号
  team            VARCHAR(64),                         -- 团队
  hired_at        DATE NOT NULL,                       -- 入职日期
  base_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0500,  -- 默认 5%
  status          ENUM('active','frozen','left') NOT NULL DEFAULT 'active',
  manager_id      BIGINT REFERENCES sales(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_team ON sales(team);
CREATE INDEX idx_sales_status ON sales(status);
```

### 7.2 `sales_customer`

```sql
CREATE TABLE sales_customer (
  id              BIGINT PRIMARY KEY,
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  bound_at        TIMESTAMP NOT NULL,
  bound_source    ENUM('share_link','invite_code','manual','consult_lead') NOT NULL,
  bound_link_id   BIGINT REFERENCES invite_link(id),       -- 仅 share_link 来源
  bound_code_id   BIGINT REFERENCES invite_code(id),       -- 仅 invite_code 来源
  bound_lead_id   BIGINT REFERENCES consult_lead(id),      -- 仅 consult_lead 来源
  valid_until     TIMESTAMP NOT NULL,                       -- bound_at + 12 months
  customer_status ENUM('potential','engaging','signed','churned') NOT NULL DEFAULT 'potential',
  account_manager_note VARCHAR(50),
  sales_remark    TEXT,
  custom_tags     JSON,
  last_followup_at TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),

  UNIQUE KEY uk_tenant (tenant_id),                         -- 一个客户全局只能绑一个销售
  INDEX idx_sales (sales_id),
  INDEX idx_status (customer_status),
  INDEX idx_valid_until (valid_until)
);
```

> **关键约束**：`UNIQUE KEY uk_tenant` 是 E3 规则的硬保障，数据库级唯一约束，应用层做不到强一致时它兜底。

### 7.3 `invite_link`

```sql
CREATE TABLE invite_link (
  id              BIGINT PRIMARY KEY,
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  short_code      VARCHAR(16) NOT NULL UNIQUE,
  name            VARCHAR(100),
  max_uses        INT,                                       -- NULL = 不限
  used_count      INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMP,                                 -- NULL = 永久
  status          ENUM('active','disabled','expired','exhausted') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.4 `invite_code`

```sql
CREATE TABLE invite_code (
  id              BIGINT PRIMARY KEY,
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  code            VARCHAR(6) NOT NULL UNIQUE,                -- 大写字母+数字，去除 0/O/1/I/L
  name            VARCHAR(100),
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMP,
  status          ENUM('active','disabled','expired','exhausted') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.5 `commission`

```sql
CREATE TABLE commission (
  id              BIGINT PRIMARY KEY,
  order_id        BIGINT NOT NULL UNIQUE REFERENCES `order`(id),
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  amount          DECIMAL(12,2) NOT NULL,                    -- 佣金金额
  rate            DECIMAL(5,4) NOT NULL,                     -- 当时锁定的费率（默认 0.0500）
  rule_id         BIGINT NOT NULL REFERENCES commission_rule(id),
  calc_basis      JSON NOT NULL,                             -- 计算依据快照
  status          ENUM('pending','confirmed','paid','reverted') NOT NULL DEFAULT 'pending',
  generated_at    TIMESTAMP NOT NULL DEFAULT now(),
  confirmed_at    TIMESTAMP,
  paid_at         TIMESTAMP,
  reverted_at     TIMESTAMP,
  reverted_reason VARCHAR(200),

  INDEX idx_sales_status (sales_id, status),
  INDEX idx_generated_at (generated_at)
);
```

### 7.6 `customer_followup`（新增表，主 PRD 未列）

```sql
CREATE TABLE customer_followup (
  id              BIGINT PRIMARY KEY,
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
  channel         ENUM('phone','wechat','visit','email','other') NOT NULL,
  content         TEXT NOT NULL,
  next_followup_at TIMESTAMP,
  remind          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),

  INDEX idx_sales_tenant (sales_id, tenant_id),
  INDEX idx_next (next_followup_at)
);
```

### 7.7 `consult_lead`（与主 PRD 一致，本 PRD 补充字段）

```sql
ALTER TABLE consult_lead
  ADD COLUMN claimed_at TIMESTAMP,
  ADD COLUMN converted_tenant_id BIGINT REFERENCES tenant(id),
  ADD COLUMN closed_reason VARCHAR(50),
  ADD COLUMN closed_at TIMESTAMP;
```

### 7.8 `opening_task` / `activation_entry` 🆕 v1.2（企业开通任务）

```sql
CREATE TABLE opening_task (
  id              BIGINT PRIMARY KEY,
  order_id        BIGINT UNIQUE REFERENCES `order`(id),
  tenant_id       BIGINT REFERENCES tenant(id),
  sales_id        BIGINT REFERENCES sales(id),
  plan_snapshot   JSON NOT NULL,
  status          ENUM('pending','provisioning','waiting_admin_activation','active','failed','cancelled') NOT NULL DEFAULT 'pending',
  volc_status     ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  sso_status      ENUM('pending','configured','failed') NOT NULL DEFAULT 'pending',
  seat_pool_status ENUM('pending','active','failed') NOT NULL DEFAULT 'pending',
  failure_reason  VARCHAR(500),
  activated_at    TIMESTAMP,
  activated_by    BIGINT REFERENCES user(id),
  completed_at    TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_status (status),
  INDEX idx_sales_status (sales_id, status),
  INDEX idx_tenant (tenant_id)
);

CREATE TABLE activation_entry (
  id              BIGINT PRIMARY KEY,
  opening_task_id BIGINT UNIQUE REFERENCES opening_task(id),
  type            ENUM('link','code') NOT NULL DEFAULT 'link',
  token_hash      VARCHAR(128) NOT NULL UNIQUE,
  masked_value    VARCHAR(80) NOT NULL,
  expires_at      TIMESTAMP,
  used_at         TIMESTAMP,
  used_by         BIGINT REFERENCES user(id),
  status          ENUM('available','used','expired','revoked') NOT NULL DEFAULT 'available',
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

> **关键约束**：
> - 一个订单最多对应一个开通任务。
> - 企业激活入口只绑定订单和企业，不绑定单个成员。
> - 销售只查看开通状态和提醒客户，不修改开通任务。
> - status 状态机参 § 10.5。

### 7.9 `order` 表新增字段（v1.2）

```sql
ALTER TABLE `order`
  ADD COLUMN opening_task_id BIGINT REFERENCES opening_task(id),
  ADD COLUMN seat_pool_status ENUM('none','pending','active','released') NOT NULL DEFAULT 'none',
  ADD COLUMN activated_at TIMESTAMP;
```

> 含义：付款仅完成购买确认；企业席位池开通后客户才可分配成员席位。佣金归属期建议以 `opening_task.completed_at` 或 `order.activated_at` 为起点（参 § E8）。

---

## 八、接口清单

> 所有接口前缀 `/api/sales/`。鉴权：JWT Bearer + role=R3。响应格式 `{ code, message, data }`。错误码统一编码（详见 § 8.10）。

### 8.1 仪表盘

#### `GET /api/sales/dashboard/summary`

**Response**
```json
{
  "code": 0,
  "data": {
    "my_customer_count": 23,
    "month_new_count": 4,
    "month_paid_amount": "85000.00",
    "month_estimated_commission": "4250.00",
    "in_window_customer_count": 18,
    "total_commission": "31200.00",
    "todos": {
      "unclaimed_leads": 3,
      "overdue_followup": 5,
      "expiring_attribution": 2,
      "pending_commission_amount": "1200.00"
    }
  }
}
```

#### `GET /api/sales/dashboard/revenue-trend?days=30`

#### `GET /api/sales/dashboard/top-customers?limit=10`

### 8.2 客户池

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/sales/customers` | 列表，支持 `q`、`status`、`industry`、分页 |
| POST | `/api/sales/customers` | 新增客户（手动） |
| GET | `/api/sales/customers/check-uscc?uscc=xxx` | USCC 实时去重 |
| GET | `/api/sales/customers/:id` | 详情 |
| PATCH | `/api/sales/customers/:id` | 修改销售备注、客户经理备注、自定义标签 |
| GET | `/api/sales/customers/:id/orders` | Tab 2 订单 |
| GET | `/api/sales/customers/:id/usage` | Tab 3 消耗趋势 |
| GET | `/api/sales/customers/:id/followups` | Tab 4 跟进列表 |
| POST | `/api/sales/customers/:id/followups` | 新增跟进 |
| GET | `/api/sales/customers/:id/commissions` | Tab 5 佣金 |
| POST | `/api/sales/customers/export` | 异步导出 CSV |

#### USCC 校验响应示例
```json
{
  "code": 0,
  "data": { "available": true }
}
// 或
{
  "code": 0,
  "data": { "available": false, "reason": "owned_by_other" }
}
// 或
{
  "code": 0,
  "data": { "available": false, "reason": "owned_by_self", "tenant_id": 12345 }
}
```

### 8.3 分享链接

| Method | Path |
|---|---|
| GET | `/api/sales/share/links` |
| POST | `/api/sales/share/links` |
| PATCH | `/api/sales/share/links/:id` |
| POST | `/api/sales/share/links/:id/disable` |
| GET | `/api/sales/share/links/:id/registrations` |

### 8.4 邀请码

| Method | Path |
|---|---|
| GET | `/api/sales/share/codes` |
| POST | `/api/sales/share/codes`（生成） |
| POST | `/api/sales/share/codes/:id/disable` |

### 8.5 落地页注册（公开接口，无鉴权）

| Method | Path |
|---|---|
| GET | `/api/public/register/check-ref?payload=xxx` |
| POST | `/api/public/register` |
| POST | `/api/public/register/check-uscc` |
| POST | `/api/public/register/check-invite-code` |

### 8.6 佣金

| Method | Path |
|---|---|
| GET | `/api/sales/commissions` |
| GET | `/api/sales/commissions/:id` |
| GET | `/api/sales/commissions/summary?period=month` |
| POST | `/api/sales/commissions/export` |

### 8.7 咨询留资

| Method | Path |
|---|---|
| GET | `/api/sales/leads` |
| POST | `/api/sales/leads/:id/claim` |
| POST | `/api/sales/leads/:id/follow` |
| POST | `/api/sales/leads/:id/convert` |
| POST | `/api/sales/leads/:id/close` |

### 8.8 开通跟进（销售视角）🆕 v1.2

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/sales/opening-tasks` | 我名下客户的开通跟进列表 |
| GET | `/api/sales/opening-tasks/:id` | 开通详情 |
| POST | `/api/sales/opening-tasks/:id/remind-admin` | 提醒客户管理员完成企业激活或席位分配 |
| POST | `/api/sales/opening-tasks/:id/contact-admin` | 向官方后台提交开通异常跟进 |

**典型响应：开通详情**

```json
{
  "code": 0,
  "data": {
    "id": "task-12345",
    "order_id": "ORD-20260429-001",
    "tenant_name": "云岭制造",
    "status": "waiting_admin_activation",
    "activation_entry_type": "link",
    "activation_entry_masked": "https://arkclaw.example/activate/****",
    "seat_pool": {
      "purchased": 10,
      "assigned": 3,
      "remaining": 7
    },
    "updated_at": "2026-04-29T15:23:00Z"
  }
}
```

### 8.9 企业激活入口（客户管理员使用）

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/public/activation/check` | 校验企业激活入口合法性（不消费） |
| POST | `/api/public/activation/redeem` | 客户管理员确认企业订单激活 |

**redeem 响应错误码（与 § 8.10 对齐）**

| Code | 含义 |
|---|---|
| 40911 | 企业激活入口不存在 |
| 40912 | 企业激活入口已使用 |
| 40913 | 企业激活入口已过期 |
| 40914 | 企业激活入口已作废 |
| 40915 | 激活入口不归属当前企业 |
| 40916 | 订单与企业不匹配 |

### 8.8 个人中心

| Method | Path |
|---|---|
| GET | `/api/sales/profile` |
| PATCH | `/api/sales/profile` |
| GET | `/api/sales/profile/performance?period=month` |
| GET | `/api/sales/profile/reports` |

### 8.9 通用错误码

| Code | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 越权访问 |
| 40901 | USCC 已被他人录入 |
| 40902 | USCC 已在你的客户池 |
| 40903 | 邀请码无效 / 已耗尽 / 已过期 |
| 40904 | 分享链接 payload 验签失败 |
| 40905 | 注册防刷拦截 |
| 50001 | 火山 API 调用失败 |
| 50002 | 内部错误 |

---

## 九、业务规则细则（关键边界，需 sign-off）

### E1 销售离职 / 客户继承

- 销售 `status=left` 后，其名下所有客户的 `sales_customer` 不动；新订单触发的佣金**不再发放**
- 由 R1 平台管理员在 § B4 后台手动迁移到接手销售；归属期 / 首次付款时间不变
- **本 PRD 不涉及迁移操作**，只声明数据语义

### E2 同客户被两销售并行追单（USCC 未录入）

- 数据库 `UNIQUE(tenant_id)` 在 `sales_customer` 强约束 → 谁先 INSERT 谁拥有
- 两个销售并发提交：用乐观锁（`INSERT IGNORE` + 后续 `SELECT` 判断 sales_id 是否是自己）
- 后到的销售获得 USCC 占用错误，前端展示"该客户已被他人录入"

### E3 客户跨销售二次注册

- 通过销售 A 链接注册成功 → tenant + sales_customer(A) 已建立
- 客户后续再通过销售 B 链接 / 邀请码访问注册页 → USCC 校验拒绝
- 数据库返回 `40901`，落地页显示"贵公司已在我们平台注册过，请联系您的客户经理"

### E4 佣金触发时点

- **v1.2 推荐规则**：以“企业席位池开通可用”为 pending 佣金触发点。
- 对公转账：官方后台审核通过后，订单进入 paid，但只生成开通任务，不立即确认佣金。
- 开通任务完成：火山资源映射、统一登录、企业席位池均可用后，写 `commission(status=pending)`。
- T+1 财务对账批次后，pending 转 `confirmed`。

### E5 退款 → 佣金回退

- 任意 `order.status` 由 paid → refunded
- 系统自动找到对应 `commission`：
  - status=pending → 直接 `reverted`
  - status=confirmed → 写一笔反向 commission 流水，原条 status → `reverted`
  - status=paid → 不可单边撤销，进入"待财务追回"队列（出本 PRD 范围）

### E6 邀请码与分享链接同时使用

- 客户在落地页同时来自 `?ref=链接payload` + 输入了一个邀请码：
  - 若两者归属同一销售 → 用链接 payload（取消邀请码）
  - 若不同销售 → **优先采用 URL ref（链接）**，邀请码视为失效输入
  - 提示客户："已通过分享链接归属，邀请码本次未使用"

### E7 销售在归属期内变更归属

- 系统不允许销售自助变更
- 客户主动要求换销售 → 工单到 R1 → R1 在 § B4 后台审批 → 历史佣金不动，未来订单按新归属
- **本 PRD 不开放变更入口**

### E8 佣金归属期起点（v1.2 调整）🆕

- **v1.0 规则**：归属期起点 = `tenant.first_paid_at`（首次付款时间）。
- **v1.1 规则**：归属期起点 = `tenant.first_activated_at`（首次激活时间）。
- **v1.2 推荐规则**：归属期起点 = `opening_task.completed_at` 或 `tenant.first_available_at`（企业席位池首次可用时间）。
- **理由**：付款仅代表商业确认；客户真正获得服务发生在企业席位池可分配之后。
- 退款时若企业已开通 → 走 § E5 反向冲销；若企业尚未开通 → 取消开通任务，不生成佣金。

### E9 企业开通任务生命周期 🆕

- **生成**：官方后台确认对公到账后自动生成。
- **处理**：系统或交付处理火山资源映射、统一登录配置、企业席位池开通。
- **客户确认**：如需要客户管理员确认，则生成企业激活入口，入口只使用一次。
- **完成**：企业席位池可用后，客户管理员进入 `/tenant/seats` 分配成员。
- **异常**：火山接口、SSO 或席位池任一失败，任务进入 failed，销售端展示“开通异常”，官方后台处理重试。
- **取消**：退款或订单作废时，任务进入 cancelled。

---

## 十、状态机

### 10.1 客户状态（`sales_customer.customer_status`）

```
       手动
       ┌──┐
       ▼  │
   potential ──手动──→ engaging
                          │
                          │ 订单 paid
                          ▼
                       signed
                          │
                          │ 90 天无活跃 + 无续约
                          ▼
                       churned ──手动──→ engaging
```

### 10.2 留资状态（`consult_lead.status`）

```
new ──认领──→ claimed ──跟进──→ following
                                  │
                            ┌─────┼─────┐
                            ▼           ▼
                       converted     closed
```

### 10.3 佣金状态（`commission.status`）

```
pending ──财务对账──→ confirmed ──月度发放──→ paid
   │                     │
   │ 退款                  │ 退款
   ▼                     ▼
reverted              （写反向流水 + 原条 reverted）
```

### 10.4 链接 / 邀请码状态

```
active ──手动停用──→ disabled
   │
   │ 到达 max_uses
   ▼
exhausted

active ──过期──→ expired
```

### 10.5 开通任务状态（🆕 v1.2）

```
pending ──开始处理──→ provisioning
                         │
                         ├─需客户管理员确认──→ waiting_admin_activation
                         │                         │
                         │                         └─管理员确认──→ active
                         │
                         ├─系统直接完成────────────→ active
                         │
                         └─火山 / SSO / 席位池失败──→ failed ──重试──→ provisioning

pending / provisioning / waiting_admin_activation ──退款或作废──→ cancelled
```

### 10.6 订单席位池状态（🆕 v1.2）

```
none ──对公确认──→ pending ──开通任务完成──→ active
                         └──开通失败──→ pending（任务 failed，等待重试）

active ──退款 / 关闭企业──→ released
pending ──退款 / 取消订单──→ released
```

---

## 十一、权限矩阵

| 资源 / 操作 | R3（自己的） | R3（别人的） | R1 |
|---|---|---|---|
| 仪表盘数据 | ✅ | ❌ | ✅（看团队） |
| 客户池列表 / 详情 | ✅ | ❌ | ✅（全平台） |
| 客户新增 / 编辑（销售备注） | ✅ | ❌ | ✅ |
| 客户编辑（USCC、企业基本信息） | ❌ | ❌ | ❌（属于 R4） |
| 客户跟进记录新增 / 查看 | ✅ | ❌ | ✅ |
| 分享链接 / 注册邀请码 CRUD | ✅ | ❌ | ✅ |
| 佣金明细查看 | ✅ | ❌ | ✅ |
| 佣金状态变更 | ❌ | ❌ | ✅ |
| 咨询留资认领 | ✅（已分配给我） | ❌ | ✅（分配） |
| 留资关闭 / 转客户 | ✅ | ❌ | ✅ |
| **开通任务：查看状态 🆕 v1.2** | ✅（自己客户） | ❌ | ✅ |
| **开通任务：提醒客户管理员 🆕 v1.2** | ✅（自己客户） | ❌ | ✅ |
| **开通任务：异常跟进 🆕 v1.2** | ✅（提交跟进） | ❌ | ✅（处理） |
| **开通任务：修改火山映射 / 席位池 🆕 v1.2** | ❌ | ❌ | ✅（R1 / 交付） |
| 个人中心 | ✅ | ❌ | ✅（看） |
| 修改自己的工号 / 入职日期 / 佣金率 | ❌ | ❌ | ✅ |

> 应用层 RBAC 中间件强制按 `current_user.sales_id` 过滤；数据库行级 `WHERE sales_id = ?` 双保险；越权访问 → 401 + 审计告警。

---

## 十二、非目标（明确指向其他 PRD）

| 不做 | 在哪做 |
|---|---|
| 佣金费率配置（5% 改为阶梯 / 代理商分级） | 主 PRD § B5（R1）+ 超管 PRD v1.1 |
| 销售账号开 / 关 / 改工号 | 主 PRD § B4（R1） |
| 销售经理团队视图 | 未来版本，预留 `?as_manager_team=` 接口 |
| 跨销售客户调拨 | 主 PRD § B4 + 工单 |
| 全局订单 / 退款审核 | 主 PRD § B3 |
| 留资分配规则（自动分配） | 主 PRD § B8（D8 决议：首版手动） |
| 客户企业内部用户 / Claw / 用量明细 | 主 PRD § A1-A5（R4 / R5 视角） |
| 多级分销 | 全产品明确不做 |
| 销售 KPI 设定 / 提成方案变更 | 财务 / HR 系统 |
| **开通任务处理 / 火山资源映射 🆕 v1.2** | 超管 PRD § B3/B6 + 运维 PRD |
| **企业激活入口生成 / 作废 🆕 v1.2** | 超管 PRD § B6 |
| **成员席位分配 🆕 v1.2** | 客户侧 `/tenant/seats` |

---

## 十三、成功指标（销售视角 KPI，首版 GA 3 个月内）

| 指标 | 计算 | 目标 |
|---|---|---|
| 销售人均月新客 | 月新增 sales_customer / 销售数 | ≥ 3 |
| 分享链接转化率 | 通过链接到达落地页 → 注册成功 | ≥ 30% |
| 留资 24h 认领率 | 已认领留资 / 已分配留资 | ≥ 95% |
| 客户首单转化率（30 天内） | 30 天内付款客户 / 同期新客户 | ≥ 35% |
| 归属期内续约率 | 12 月内多次付款客户 / 总付款客户 | ≥ 50% |
| 佣金预估准确率 | abs(预估 - 实际) / 实际 | ≤ 5% |
| 销售工作台 P95 响应 | — | ≤ 1.5s |

---

## 十四、测试要点 / 端到端验证

### 14.1 必测路径

1. **路径 A 全链路（标准套餐）**：销售 A 生成链接 → 客户扫码 → 注册 → 客户对公转账 → 官方后台确认到账 → 生成开通任务 → 企业席位池开通 → 客户管理员进入 `/tenant/seats` 分配成员 → 成员登录自动启用 → 销售 A 佣金明细出现 1 条 pending → T+1 转 confirmed → 月底转 paid
2. **路径 B 注册邀请码 + 开通任务**：销售 B 生成 6 位注册码 → 客户在通用注册页输入码 → 注册成功（绑定生效）→ 客户购买 → 对公确认 → 走开通任务流程
3. **路径 C 手动 + 去重**：销售 C 输入已被销售 D 录入的 USCC → 实时校验返回 `owned_by_other` → 提交按钮置灰
4. **退款回退（已开通）**：路径 A 客户 100 元订单退款 → commission 状态 reverted → 仪表盘金额减 5 元 → 席位池 status=released
5. **退款回退（未开通）🆕**：客户付款 → 开通任务未完成 → 退款 → 开通任务 cancelled + 席位池 released + commission 不生成
6. **越权拦截**：销售 A 调 `/api/sales/customers/:id`，传销售 B 客户的 ID → 401 + 审计日志记录
7. **客户管理员未激活 🆕**：开通任务进入 waiting_admin_activation 超 SLA → 销售收到提醒 → 跟进客户管理员完成企业激活
8. **开通异常 🆕**：火山资源映射失败 → 销售端展示开通异常 → 官方后台处理重试
9. **企业激活入口重复使用 🆕**：同一入口并发确认两次 → 第二次失败（数据库唯一锁 + 状态校验）

### 14.2 边界测试

- 大并发：100 个客户 1 秒内通过同一链接注册（去重 + 计数原子）
- 链接耗尽：max_uses=10，第 11 次注册被拒绝
- payload 篡改：手动改 ref 中 sales_id → 验签失败 → 走"无销售归属"路径
- 跨日切换：23:59 创建 commission，凌晨财务对账：跨日归集到正确账期
- 长 USCC（含字母）：18 位字母数字混合，正则放行
- 客户经理备注 emoji：UTF8mb4 字段，可存
- **开通任务重复生成 🆕**：同一订单并发生成任务，只允许一条 opening_task
- **企业激活入口过期 🆕**：入口过期后客户管理员确认失败，官方后台可重新生成入口
- **席位池状态不一致 🆕**：火山映射成功但我方席位池失败，任务进入 failed，禁止生成佣金

### 14.3 现状校准

打开 `http://localhost:5160/sales/dashboard`，按以下表格核对：

| 功能 | 在原型中 | PRD 是否覆盖 | 差距 |
|---|---|---|---|
| 仪表盘卡片 | 🔄 | § 6.1 | 待开发对照填 |
| 客户池列表 | 🔄 | § 6.2 | 待开发对照填 |
| ... | | | |

---

## 十五、风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| **销售归因争议**：客户声称是另一个销售先联系的 | 内部冲突 | USCC + 首次绑定时间为系统硬规则；线下争议由销售经理仲裁，系统不调整 |
| **防刷被绕过**（用代理 IP + 多手机号） | 邀请奖刷量 | 落地页必过人机验证 + 设备指纹；月度异常注册抽查 |
| **佣金对账偏差**：财务核账与系统不一致 | 销售投诉 | T+1 对账后 `commission_rule.calc_basis_json` 永久存档；提供"差异查询"工具（B5 范畴） |
| **客户跨销售二次注册被拒后离开** | 客户体验差 | 落地页拒绝时给出"联系原销售"通用引导 + 客服热线 |
| **链接被截屏批量分发** | 被反向利用 | 链接最多 50 次默认上限；销售可手动停用；防刷按 IP / 手机号闸门 |
| **客户管理员后台改了 USCC** | 归因失效 | USCC 改动需走客户管理员强校验 + R1 审批（属 R4 流程，本 PRD 不实现）；本 PRD 接口校验 USCC 不可被销售改 |
| **佣金率历史一致性**：未来调阶梯，但老订单仍按 5% | 数据一致性 | `commission.rate` 与 `rule_id` 在生成时锁定，不溯及既往 |
| **大客户被多个销售合作开发** | 现实痛点 | 系统只允许 1:1 归属；多人协作通过"客户经理备注"软记录，分成方案在线下分配 |
| **企业激活入口外泄 🆕 v1.2** | 被非管理员尝试确认企业订单 | 入口绑定 tenant + order + admin 权限；确认时必须登录客户管理员账号 |
| **客户长期未完成企业激活 🆕 v1.2** | 开通后仍无法分配席位 | 销售端待办提醒；入口超 SLA 后官方后台可重新发送 |
| **开通任务失败 🆕 v1.2** | 客户付款后无法使用 | 任务 failed 后销售端可见，官方后台重试或人工处理；未完成不生成佣金 |
| **火山能力与我方套餐不一致 🆕 v1.2** | 客户可用权益与购买权益不一致 | opening_task 固化订单快照，开通后校验席位池和权益配置 |
| **客户付款后久未开通 🆕 v1.2** | 客户体验差 | 开通任务 SLA 告警 + 销售待办置顶 + 官方后台处理记录 |

---

## 十六、引用映射表

| 本 PRD 章节 | 来源 |
|---|---|
| § 1.4 设计原则之"归因一次且终身" | 0423 会议 04:44-05:47 |
| § 5.2 5% / 12 月规则 | 主 PRD D2 决议（编号 D1、D2） |
| § 5.3 客户状态自动迁移 | 本 PRD 新增设计 |
| § 6.2.2 USCC 实时去重 | 0423 会议 05:04（"咱们做一个校验"） |
| § 6.3 分享链接 | 0423 会议 05:04（"做一个分享链接"） |
| § 6.5 咨询留资认领 | 主 PRD A8、B8 |
| § 7.2 sales_customer 唯一约束 | 主 PRD § 十二 + 本 PRD E2/E3 |
| § E1-E7 边界规则 | 本 PRD 新增（待 sign-off） |

---

## 十七、附录

### 17.1 术语表

| 术语 | 解释 |
|---|---|
| R3 / 销售 | 云脑智联销售员，本 PRD 主角色 |
| 客户 / 租户 / Tenant | 销售名下的下游企业，对应 `tenant` 表 |
| 归属 / 绑定 | 销售与客户的 1:1 关系，由 `sales_customer` 表表达 |
| 归属期 | 客户首次付款起 12 个月，期内付款给销售分佣 |
| USCC | 统一社会信用代码，企业唯一标识，去重主键 |
| GMV | Gross Merchandise Volume，本 PRD 指销售名下客户付款总额 |
| SLA | Service Level Agreement，咨询留资 24h 认领是 SLA 指标 |
| 留资 / Lead | 客户在 A8 提交的咨询表单条目 |

### 17.2 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-04-24 | 首版，基于主 PRD § D 模块 + 0423 会议销售相关诉求拆解 | Claude + 产品团队 |
| **v1.1** | **2026-04-29** | **基于 0429 评审会议：① 新增激活码概念（§ 5.5、§ 6.6、§ 7.8、§ 8.8、§ E8-E9、§ 10.5）；② 明确归因层 vs 激活层边界（§ 1.3、§ 6.3）；③ 佣金归属期起点改为首次激活时间（§ E8）；④ 数据模型新增 `activation_code` / `activation_code_batch` + `order` 加 seat_status 字段；⑤ 测试 / 风险新增激活相关边界** | **Claude + 产品团队（基于王世康在 4/29 评审会议提出的激活码机制要求）** |
| **v1.2** | **2026-04-29** | **基于 0429 实现讨论会：① 废弃每成员手动激活码主流程；② 销售端 D6 改为开通跟进；③ 新增 opening_task / activation_entry；④ Beta1 购买主路径调整为对公确认；⑤ 佣金触发点调整为企业席位池可用** | **OpenAI + 产品团队** |

### 17.3 sign-off 区（销售业务负责人 / 老板逐条确认）

请在确认后打勾：

**v1.0 项**
- [ ] § 1.4 业务规则 D1-D9 已对齐，本 PRD 不冲突
- [ ] § E1 销售离职后客户由 R1 后台手动迁移，归属期不变
- [ ] § E2 USCC 未录入并发追单 → 先录先得（数据库唯一约束兜底）
- [ ] § E3 USCC 已存在 → 拒绝跨销售二次注册
- [ ] § E4 佣金触发：order.status=paid 即触发，不等开票
- [ ] § E5 退款冲销规则：pending/confirmed 直接 reverted，paid 走"待追回"
- [ ] § E6 链接与邀请码冲突：链接优先，邀请码当本次失效
- [ ] § E7 归属期内变更归属 → 销售不可自助，必须 R1 审批

**v1.2 新增项 🆕（4/29 实现讨论会后校准）**
- [ ] § 1.3 归因层（分享链接 + 注册邀请码）vs 开通层（开通任务 + 企业激活入口）边界清晰
- [ ] § 5.5 标准套餐和定制报价都进入开通任务流程
- [ ] § 6.6 销售视角改为开通跟进，不再派发成员激活码
- [ ] § E8 佣金归属期起点改为企业席位池首次可用时间
- [ ] § E9 开通任务生命周期和异常重试流程清晰
- [ ] § 7.8 opening_task / activation_entry 数据模型设计清晰
- [ ] § 14.1 路径 7-9 必测项（管理员未激活 / 开通异常 / 入口并发确认）

**通用**
- [ ] § 13 KPI 目标合理可达
- [ ] 文档可作为开发开工依据

签字 / 日期：__________________________________

---

**文档结束**
