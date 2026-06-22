# 财务佣金结算管理 · 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 撰写日期 | 2026-05-08 |
| 模块代号 | 模块 F · 财务佣金结算（拆自超管 PRD § B5） |
| 父文档 | `/1-prd/PRD.md`（v1.0） |
| 兄弟文档 | `/1-prd-det/销售CRM-PRD.md`（v1.2）、`/1-prd-det/超级管理员后台-PRD.md`（v1.1）、`/1-prd-det/运维支持后台-PRD.md`（v1.0） |
| 目标读者 | 前端开发、后端开发、QA、财务结算负责人、销售业务负责人、PM |
| 范围 | 财务侧佣金结算闭环：单笔流水生命周期、月度批次、退款冲销、追回、对账、销售对账单 |
| 状态 | 待评审（财务 + 销售业务 + 运营 三方 sign-off） |

---

## 一、文档元信息

### 1.1 与兄弟 PRD 的引用映射

| 本 PRD 章节 | 兄弟 PRD 对应 |
|---|---|
| § 5.1 commission 生成 | 销售 PRD § 5.2 / § E4 / § E8（v1.2 口径） |
| § 5.2 状态扭转主链 | 销售 PRD § 5.2 + 超管 PRD § 5.3 |
| § 5.3 月度批次 | 超管 PRD § 5.3、§ 6.5.3 |
| § 5.4 退款冲销三分支 | 销售 PRD § E5（仅一句"已发放走待追回"，本 PRD 落地）|
| § 5.6 已发放追回 | 主 PRD § 七 B5"已发放冲销"（出超管 PRD 范围，本 PRD 落地） |
| § 5.7 销售离职 / 调拨 | 销售 PRD § E1 / § E7、超管 PRD § 5.4 / 5.5 |
| § 9 业务规则 F1-F12 | 销售 PRD § E4-E9、超管 PRD § F8 |

### 1.2 范围边界（与兄弟 PRD 的"不重不漏"）

```
                    ┌─────────────────────────────────────────────────┐
                    │ 销售 CRM PRD（销售视角，只读）                    │
                    │  - § D4 佣金明细查看                              │
                    │  - § E4-E9 业务规则（销售感知）                   │
                    └─────────────────────────────────────────────────┘
                                          │
                                          │ 数据来源
                                          ▼
┌──────────────────────┐    ┌─────────────────────────────────────────┐
│ 超管 PRD（运营视角）   │←─→│ ★ 本 PRD（财务结算闭环）★                │
│  - § B5 规则配置      │   │  - 单笔生命周期、批次、冲销、追回、对账   │
│  - § B3 订单 / 对公   │   │  - 销售对账单（月度）                     │
│  - § B4 销售档案      │   │  - 财务实际打款回写                        │
└──────────────────────┘    └─────────────────────────────────────────┘
```

### 1.3 引用资产

- `/1-prd/PRD.md` 主 PRD（§ 七 B5 / B3）
- `/1-prd-det/销售CRM-PRD.md` v1.2
- `/1-prd-det/超级管理员后台-PRD.md` v1.1
- `/0423会议.md`、`/0429评审会议-梳理.md`
- `http://localhost:5160/finance/commission/batches` 当前已实现的批次原型

### 1.4 术语对齐（详见 § 17.1）

- **commission（佣金条目 / 流水）**：一条 = 一笔订单触发的一笔应付销售金额
- **commission_batch（结算批次）**：一个月的所有 confirmed commission 聚合，作为打款单位
- **commission_recovery（追回单）**：已 paid commission 因退款产生的反向追回流水
- **commission_adjustment（调整单）**：财务手工修正某条 commission 的记录
- **结算 Settlement**：把 confirmed commission 通过批次实际打款给销售的全过程
- **冲销 Reverse**：因订单退款触发的佣金反向操作
- **追回 Recovery**：已 paid 佣金对应订单退款时，从销售处取回款项
- **对账单 Statement**：月度推送给销售本人的当月佣金汇总
- **平账 Reconciliation**：系统流水 vs 银行实际打款流水的比对

---

## 二、模块定位、目标与设计原则

### 2.1 模块定位

财务佣金结算是一条**只关心钱怎么准确发出去 / 准确收回来**的纵向闭环：

```
单笔 commission 生成
  ↓ (T+1 对账)
confirmed
  ↓ (月度批次)
打入批次 → 财务打款 → 回写流水号
  ↓
paid
  ↓ (订单退款时)
冲销 / 追回（按状态分支）
  ↓
对账完结（系统 = 银行 = 销售对账单）
```

它**不**关心：
- 佣金率怎么定（超管 § B5）
- 销售自己看自己拿多少（销售 PRD § D4）
- 订单怎么生成、对公审核（超管 § B3）

它**只**关心：
- **每一笔 commission 的状态扭转必须责任人明确、可追溯、不可丢**
- **退款发生时不同状态的 commission 各走一条清晰路径**
- **每月给销售推送一份"对账单"，让销售签字确认"我同意这个数"**
- **每月与银行对账，差异落到流水级别可定位**

### 2.2 本期目标（In Scope）

| # | 模块 | 核心能力 |
|---|---|---|
| F1 | 结算工作台 | 本月结算预览 + 待办 + 异常告警 |
| F2 | 佣金流水管理 | 全平台流水查询、筛选、手工调整 |
| F3 | 月度结算批次 | 自动生成、抽查、审批、导出打款单、回写 |
| F4 | 退款冲销 | pending / confirmed / paid 三分支处理 |
| F5 | 追回队列 | 已 paid 退款产生的追回单管理（三选一） |
| F6 | 销售月度对账单 | 自动生成 + 推送 + 销售确认 + 异议工单 |
| F7 | 财务对账 | 系统流水 vs 银行回单比对 |
| F8 | 历史结算归档 | 不可变 + 可查询 + 销售收款账户管理 |

### 2.3 非目标（Out of Scope，详见 § 12）

- ❌ 佣金率 / 代理商分级配置 → 超管 § B5
- ❌ 销售视角佣金明细查看 / 导出 → 销售 PRD § D4
- ❌ 订单 CRUD / 对公审核 / 退款发起 → 超管 § B3
- ❌ 销售档案 CRUD / 离职申请审批 → 超管 § B4
- ❌ 客户调拨审批本身 → 超管 § B4 / § 5.5
- ❌ 自动打款 API（接银行 / 第三方支付 SaaS）→ 暂线下
- ❌ 税务系统对接 / 个税代扣 → Beta2
- ❌ 工资条 / 提成方案 / HR 系统集成 → 出本 PRD

### 2.4 设计原则

1. **每一笔可追溯**：commission、batch、recovery、adjustment 任意条目都能从订单一路追到银行打款流水
2. **状态扭转责任人明确**：自动 vs 手工的边界清晰，财务能"显式确认"而不是"被自动跳"
3. **历史不可变**：commission_batch 一旦 paid 不可修改；冲销 / 追回都通过新写流水实现
4. **销售知情**：每月推对账单，销售确认或提异议，避免"私下扯皮"
5. **金额双轨核对**：系统流水合计 = 批次合计 = 银行打款合计，三轨任一不平触发告警
6. **灰度退路**：所有自动操作（cron 生成批次、自动 reverted）失败时不阻塞业务，转工单
7. **金额安全红线**：单笔 ≥ 10 万的手工调整 / 追回必须双人复核（与超管 § F2 对齐）
8. **Beta1 单角色，Beta2 拆 FI-Settle**：Beta1 归"官方管理员"统一执行，Beta2 拆出独立财务子角色

---

## 三、角色与权限边界

### 3.1 角色聚焦

| 角色 | Beta1 | Beta2 |
|---|---|---|
| 执行结算 | 官方管理员（统一）| **FI-Settle 财务结算专员**（独立子角色） |
| 双审第二人 | 官方管理员中另一个人 | SU- 超级管理员 |
| 销售（被结算对象） | R3 销售（接收对账单） | 同 |

### 3.2 与其他角色的接触面

| 接触场景 | 财务可做 | 财务不可做 |
|---|---|---|
| 佣金条目 | 状态扭转、手工调整（双审）、加备注 | 删除、改 sales_id、改 amount（必须走调整单） |
| commission_batch | 创建（自动）、审批、导出、回写 | 删除、改已 paid 批次 |
| 销售档案 | 仅查看姓名 / 工号 / 收款账户 | 改销售档案、改佣金率 |
| 订单 | 仅查看金额 / 状态 | 改订单、退款（属超管 § B3） |
| 销售对账单 | 生成 / 推送 / 关闭异议 | 私下改销售对账单内容 |
| 银行流水（对账面） | 上传 / 比对 / 标记差异 | 改银行原始流水 |
| 删除 audit_log / commission | **任何角色都不可** | 数据库层面禁删 |

---

## 四、用户故事

| ID | As a | I want | So that |
|---|---|---|---|
| US-F01 | 财务 | 一个工作台看到本月待发批次、待审追回、未对账银行流水、待销售确认对账单 | 知道每天最重要的事 |
| US-F02 | 财务 | 月初看到系统自动生成的上月结算批次 | 不需要自己跑脚本 |
| US-F03 | 财务 | 抽查批次时系统强制点选 ≥ 7 条 | 防止草率审批 |
| US-F04 | 财务 | 把批次导出 CSV 拿去银行系统打款 | 衔接现有打款流程 |
| US-F05 | 财务 | 打款完成后回到系统，传银行回单 + 流水号，标记批次已发 | 闭环 |
| US-F06 | 财务 | 客户退款发生时，系统自动找到对应 commission 处理 | 不需要手动追踪 |
| US-F07 | 财务 | 已 paid 佣金对应订单退款时，看到一个"追回单" | 决定怎么追回（抵扣/自愿退/强制） |
| US-F08 | 财务 | 给某条 commission 做手工调整（如系统计算错） | 灵活兜底 |
| US-F09 | 销售业务负责人 | 月初销售收到对账单，能确认或提异议 | 减少私下争议 |
| US-F10 | 销售 | 在自己工作台看到本月对账单 PDF | 透明感 |
| US-F11 | 销售 | 对某条扣减项提"异议" | 走工单审 |
| US-F12 | 财务 | 上传银行月度流水，与系统佣金打款流水自动比对 | 差异列表化 |
| US-F13 | 财务 | 销售离职后，看到该销售名下未发佣金的处置队列 | 不漏不错 |
| US-F14 | 财务 | 客户被调拨给新销售后，看到佣金切割时点之前 / 之后归属变化 | 业务连续 |
| US-F15 | 运营负责人 | 看到本月结算 KPI（准时率、对账偏差） | 月度复盘 |

---

## 五、核心业务流程

### 5.1 单笔 commission 生成（v1.2 口径）

```
（前置：客户绑定销售 + 订单 paid + 对公审核通过 + 开通任务执行中）
        │
        ▼
开通任务推进至"企业席位池开通可用"
（事件：tenant.first_activated_at 落库）
        │
        ▼
系统订阅事件，查询 sales_customer 获取归属销售
        │
        ▼
判断 now() < bound_at + 12 months（归属期内）？
        ├─ 否 → 不生成，仅记日志 commission_log(reason=out_of_window)
        └─ 是
            │
            ▼
        查 commission_rule 当时生效版本，锁定 rate
            │
            ▼
        生成 commission(status=pending, amount=order.amount × rate, rule_id=...)
            │
            ▼
        销售仪表盘 / 财务工作台实时刷新
```

**关键变化**：
- v1.0 是 order.paid 触发；v1.2 调整为"开通可用"触发，避免"付款不开通也消耗归属期"
- rate 与 rule_id 在生成时锁定，未来调价不溯及既往

### 5.2 状态扭转主链

```
pending  ──[T+1 对账，财务显式确认]──→  confirmed
                                            │
                                            │ 月度批次纳入
                                            ▼
                                  入 commission_batch
                                            │
                                            │ 批次审批 → 导出 → 财务打款 → 回写流水号
                                            ▼
                                          paid
                                            
任意状态  ──[订单退款]──→  reverted（具体路径见 § 5.4）
```

**责任人与触发**：

| 跳点 | 触发方 | 是否自动 |
|---|---|---|
| (生成) → pending | 系统 | ✅ 自动 |
| pending → confirmed | 财务 | ❌ 显式确认（防自动跳错） |
| confirmed → paid | 财务回写 | ❌ 必须传银行流水号 |
| 任意 → reverted | 系统 | ✅ 自动（订单退款回调） |

> **关键**：v1.0 写"T+1 自动 confirmed"，本 PRD 调整为"财务显式确认"。理由：自动 confirmed 万一计算错很难撤销；显式确认让财务有"对完账再过线"的把关动作。

### 5.3 月度批次

```
每月 1 日 00:30  cron 自动跑
        │
        ▼
扫描上月所有 commission(status=confirmed)
        │
        ▼
按 sales_id 聚合，并入反向冲销条（amount 为负）
        │
        ▼
生成 commission_batch (status=auto_generated)
  · batch_no = SETTLE-{YYYYMM}-{seq}
  · sales_count, item_count, total_amount（含正负，自然平账）
        │
        ▼
工作台显示"待审" + 推送财务
        │
        ▼
财务进入批次详情 → 系统强制抽查弹窗（≥ 7 条强制点过）
        │
        ▼
点"通过审批"  →  status=approved
        │
        ▼
点"导出打款单"  →  生成 CSV（销售工号 / 姓名 / 收款户 / 应发金额 / 备注）
        │  · status=exported，记 exported_at
        │
        ▼
财务在银行系统线下打款（出系统）
        │
        ▼
财务回到批次 → "上传银行回单" + 录入实际打款流水号
        │  · 系统自动将批次内每条 commission 状态变 paid
        │  · 批次状态 → paid
        │  · 所有归属销售收到站内消息 + 推送月度对账单（§ 5.8）
```

#### 抽查规则（强制）

系统自动抽 7 条：
- 5 条系统随机
- 1 条：本批次金额 Top 1
- 1 条：本批次内反向冲销（如有）

财务必须**逐条点过**才能"通过审批"，跳过则按钮置灰。

#### 异常订单（确认审批前的兜底）

批次中若存在 status ≠ confirmed 的 commission（如 reverted）→ 自动从批次剔除，列入"批次异常列表"。

### 5.4 退款冲销三分支（**本 PRD 重点**）

```
订单 status: paid → refunded
        │
        ▼
查 commission WHERE order_id=X AND status IN (pending, confirmed, paid)
        │
   ┌────┼────┐
   │    │    │
pending confirmed  paid
   │    │    │
   ▼    ▼    ▼
 § 5.4a § 5.4b § 5.4c
```

#### 5.4a · pending 状态退款（无影响）

```
commission.status = reverted
commission.reverted_at = now()
commission.reverted_reason = "order_refunded"
（仅日志记录，无对账影响，因为还没打款）
```

#### 5.4b · confirmed 状态退款（写反向流水）

```
1. 原 commission：status=reverted
2. 写新流水：commission_negative
   - amount = -原条 amount
   - parent_commission_id = 原条 id
   - status = confirmed（直接进入下次批次）
3. 影响：下次月度批次 sum 时自然扣减
4. 销售当期对账单显示：扣减一行 -X 元
```

#### 5.4c · paid 状态退款（**最复杂，三选一**）

```
1. 系统自动创建 commission_recovery (status=pending)
   - origin_commission_id = 原 paid 条目
   - amount = 原条 amount（追回金额）
   - reason = "order_refunded"
2. 进入财务工作台"追回队列"
3. 财务联系销售，从三选一中选定：

   ┌─────────────────┬─────────────────┬────────────────────┐
   │ 选项 A 抵扣      │ 选项 B 自愿退还  │ 选项 C 强制扣减     │
   │ (offset)        │ (voluntary)     │ (enforced)         │
   ├─────────────────┼─────────────────┼────────────────────┤
   │ 销售当月仍有    │ 金额小、销售好  │ 销售离职 / 拒退    │
   │ 新发可抵扣      │ 配合            │                    │
   ├─────────────────┼─────────────────┼────────────────────┤
   │ 系统自动从下月  │ 销售在自助页    │ R1 双人复核        │
   │ 批次扣减        │ 确认 → 财务收款 │ → 标记 enforced     │
   │                │ → 银行入账验证  │ → 进工单            │
   ├─────────────────┼─────────────────┼────────────────────┤
   │ recovery        │ recovery        │ recovery           │
   │ status=offset   │ status=         │ status=enforced    │
   │                 │ completed       │                    │
   └─────────────────┴─────────────────┴────────────────────┘
4. 三种最终都让 recovery.status 进入 closed 态
5. 原 commission.status 不变（仍是 paid）；通过 recovery 在历史上"扣回"
6. 销售对账单显示一条"已发追回 -X 元"
```

> **关键设计**：已 paid 不能改回 reverted（破坏历史不可变），通过新写一条 recovery 实现"账面追回"，永远不能修改历史 paid 流水。

### 5.5 跨月切割

| 场景 | 切割规则 |
|---|---|
| 月底 23:59 生成 pending | 算下月批次（commission.generated_at 决定，不是 order.paid_at） |
| 月初 1 日 00:30 批次已生成，发现遗漏 | **不可改本批次**；遗漏条目下月结算 |
| 月中退款 confirmed → 反向流水 | 反向流水 generated_at = 退款时间，归当月批次 |
| 月中退款 paid → recovery | recovery.created_at 记录，归 recovery 队列，不进批次（除非选 offset） |
| 月初 5 日批次已 exported 但未 paid，发现错条 | **此时仍可"驳回批次"** → 状态回 pending_review，修正后重审 |
| 批次已 paid，发现错条 | 走 commission_adjustment（手工调整单），不动批次 |

### 5.6 已发放追回（recovery 详细）

```
触发：5.4c 创建 recovery (status=pending)
        │
        ▼
财务联系销售（系统外）
        │
        ├─ 协商成 → 选选项 A/B/C
        │
        ▼
   ┌────┴────┬─────────┬──────────┐
   ▼         ▼         ▼          ▼
selected_offset  selected_voluntary  selected_enforced  abandoned
   │              │                  │                  │
   ▼              ▼                  ▼                  ▼
（系统自动      （销售自助确认 →   （R1 双审 →     （特殊情况：
执行下月扣减）  财务收款 → 银行    工单 → HR /    法务介入 / 
   │            到账校验）         合同追讨）      免追回，需 R1
   │              │                  │           SU- 批准）
   │              │                  │              │
   └─────┬────────┴─────────┬────────┘              │
         ▼                  ▼                        ▼
      completed          enforced                  waived
         │                  │                        │
         └────────┬─────────┴────────┬───────────────┘
                  ▼                                   
                closed
```

#### 选项 B（自愿退还）的银行入账校验

- 销售在自助页点"确认退还" → 系统提供我方收款账户信息 + 唯一备注号
- 销售线下转账给我方
- 财务在 7 个工作日内核对到账，标记 status=completed
- 7 个工作日未到账 → 自动转选项 C 强制流程

### 5.7 销售离职 / 客户调拨场景

#### 5.7.1 销售离职（归集队列）

触发：超管 § 5.4 销售离职操作

```
原销售名下 commission 处理：
  │
  ├─ status=pending 全部冻结 (frozen_due_to_left=true)
  │     → 财务工作台"离职冻结队列"
  │     → 接手销售只承接未来订单，不获得这些 pending
  │     → 由 R1 决定：① 转给接手销售（解冻 + 改 sales_id）
  │                 ② 作废（标记 reverted_due_to_left）
  │                 ③ 公司收回（不分配给任何销售，作为内部待结算）
  │
  ├─ status=confirmed 进入"离职待结算"队列
  │     → 仍需结算给原销售（或离职后约定的代收人）
  │     → 走正常月度批次，不冻结
  │     → 但每条标记 paid_to_left_employee=true 便于审计
  │
  └─ status=paid 不动（已发放，事实成立）
```

#### 5.7.2 客户调拨（切割时点）

触发：超管 § 5.5 客户调拨审批通过

```
切割时点 t = customer_transfer_request.effective_at

对该 tenant 的所有 commission：
  │
  ├─ generated_at < t → 归原销售（不变）
  │
  └─ generated_at >= t → 归新销售
       （未来订单触发的 commission 会按新归属生成）
```

> **重要**：调拨**不修改**历史已生成的 commission，只影响切割之后产生的新条目。

### 5.8 销售月度对账单

```
每月 1 日 02:00（在月度批次生成 90 分钟后） cron 自动跑
        │
        ▼
对每个 active 销售生成 sales_settlement_statement
        │
        ▼
内容：
  · 上月期初：累计已发金额
  · 本期新发（confirmed）：流水明细 + 合计
  · 本期反向冲销（confirmed 退款）：流水明细 + 合计
  · 本期已发追回（paid 退款触发的 recovery）：明细 + 合计
  · 本期实际打款（来自批次回写）：明细 + 合计
  · 本期期末：累计已发金额
        │
        ▼
生成 PDF + Excel
        │
        ▼
推送：站内消息 + 邮件附件
        │
        ▼
销售在销售工作台 § D7 个人中心查看
        │
        ├─ 销售点"确认无异议"→ statement.status=confirmed
        │
        └─ 销售点"提异议" → 创建工单 + statement.status=disputed
                          → 财务介入 → 解决后 status=resolved
```

#### 推送 SLA
- 月初 02:00 生成 → 02:30 完成全员推送
- 销售收到后 7 天内确认 / 提异议
- 7 天未操作 → 自动 status=auto_confirmed（视为默认认可）

### 5.9 财务对账（系统 vs 银行）

```
财务月底拿到银行月度流水（CSV / Excel）
        │
        ▼
在 § 6.6 上传银行流水文件
        │
        ▼
系统按"流水号 / 金额 / 日期"自动匹配 commission_batch
        │
        ▼
生成对账结果：
  · 完美匹配条数
  · 系统有 / 银行无（可能：财务漏打）
  · 银行有 / 系统无（可能：误打）
  · 金额不一致（可能：扣个税未在系统体现）
        │
        ▼
财务逐条处理差异：
  · 漏打 → 创建补打款工单
  · 误打 → 创建追回工单
  · 金额不一致 → 录入扣减原因（如代扣个税）→ 写 commission_adjustment
```

---

## 六、功能详解

> 标注约定：✅ 已实现 / ⚠️ 部分实现 / ❌ 待实现 / 🔄 待校准（基于 `localhost:5160/finance/commission/batches`）

### 6.1 F1 结算工作台（首页）

#### 路径
`/finance/dashboard`

#### 6.1.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│  本月结算预览                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │上月  │ │本月  │ │本月  │ │待审  │ │待追  │ │未对  │           │
│  │发放  │ │预生成│ │反向  │ │批次  │ │回单  │ │账流  │           │
│  │金额  │ │金额  │ │冲销  │ │      │ │      │ │水    │           │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │
├──────────────────────────────────────────────────────────────────┤
│  待办分组                                                        │
│  · 待审批批次（金额 + 销售数）                                    │
│  · 待回写打款（已 exported 未 paid 的批次）                      │
│  · 待处理追回（pending recovery 数）                              │
│  · 待销售确认对账单（disputed / 未确认数）                       │
│  · 银行对账差异（差异条数 + 金额）                                │
├──────────────────────────────────────────────────────────────────┤
│  异常告警                                                         │
│  · cron 任务失败（批次 / 对账单生成）                             │
│  · 批次审批超时（生成 > 3 天未审批）                              │
│  · 离职冻结队列堆积（> 30 天未处置）                              │
└──────────────────────────────────────────────────────────────────┘
```

#### 6.1.2 实现状态：🔄 待校准

---

### 6.2 F2 佣金流水管理

#### 路径
列表 `/finance/commissions`
详情 `/finance/commissions/:id`

#### 6.2.1 列表

##### 列定义

| 列 | 字段 | 说明 |
|---|---|---|
| 流水号 | commission.id | 前缀 COMM- |
| 类型 | normal / negative | negative 为反向冲销 |
| 销售 | sales.name + sales.employee_no |  |
| 客户 | tenant.name |  |
| 关联订单 | order.id | 跳订单 |
| 父流水 | parent_commission_id | 仅 negative 有 |
| 金额 | amount | 含正负 |
| 费率 | rate | 锁定时点 |
| 状态 | pending / confirmed / paid / reverted |  |
| 生成时间 | generated_at |  |
| 确认时间 | confirmed_at |  |
| 发放时间 | paid_at |  |
| 关联批次 | commission_batch.batch_no |  |

##### 筛选 / 搜索
- 时间范围（默认本月）
- 销售（多选）、客户搜索、订单号搜索
- 状态多选、金额范围（可包含负数）

##### 批量操作
- **批量确认**：pending → confirmed（强制录入"对账依据" 文本）
- 导出 CSV
- ❌ 不允许批量改 amount（只能逐条手工调整）

#### 6.2.2 流水详情

| 区块 | 内容 |
|---|---|
| 基本信息 | 流水号、类型、状态、金额、费率、计算依据 JSON |
| 关联业务 | 订单 + 客户 + 销售 + 批次（如已入） |
| 状态扭转时间线 | pending → confirmed → paid 各时间 + 操作人 |
| 调整记录 | 关联的 commission_adjustment 列表 |
| 反向流水（如有） | 该条因退款产生的 negative 条目链接 |

#### 6.2.3 手工调整（commission_adjustment）

入口：流水详情 → "调整"按钮

##### 表单
- 调整类型：金额修正 / 状态修正 / 销售归属修正
- 原值 → 新值（自动填）
- 调整原因（必填，≥ 30 字）
- 关联工单号（可选）
- 双审：金额变化 ≥ 10 万元自动转双审；< 10 万单审

##### 提交后
- 写 commission_adjustment 表
- 修改 commission 字段（如 amount）
- 留痕：commission 字段保留 `adjusted=true` 标记
- 销售收到站内通知

#### 6.2.4 实现状态：❌ 待实现

---

### 6.3 F3 月度结算批次

#### 路径
列表 `/finance/commission/batches`
详情 `/finance/commission/batches/:id`

#### 6.3.1 列表

| 列 | 字段 |
|---|---|
| 批次号 | batch_no（SETTLE-202604-0001） |
| 期 | period_year-period_month |
| 销售人数 | sales_count |
| 流水条数 | item_count（含正负） |
| 金额合计 | total_amount |
| 状态 | auto_generated / pending_review / approved / exported / paid / closed |
| 生成时间 | created_at |
| 审批人 | reviewer1_id |
| 审批时间 | reviewed_at |
| 导出时间 | exported_at |
| 打款时间 | paid_at |
| 操作 | 详情 / 审批 / 导出 / 上传回单 / 驳回 |

#### 6.3.2 批次详情

##### 4 个 Tab

| Tab | 内容 |
|---|---|
| 概览 | 销售人数、条数、合计、抽查进度、批次时间线 |
| 销售明细 | 按销售聚合：姓名 / 工号 / 收款户 / 应发 / 已抽查 / 备注 |
| 流水明细 | 全部 commission 列表（含正负），可下钻 |
| 异常剔除 | 因状态非 confirmed 被剔除的条目 |

#### 6.3.3 抽查规则强制

##### 弹窗交互

```
点"开始审批"
   ↓
系统选定 7 条（5 随机 + 1 金额 Top + 1 反向冲销）
   ↓
弹窗 1/7：显示该条详情（流水号、销售、客户、订单、金额、计算依据）
   ↓
财务确认无误 → 点"确认 (1/7) → (2/7)"
   ↓
... 7 次 ...
   ↓
全部确认完毕 → "通过审批"按钮可点
```

跳过 / 关闭弹窗 → 抽查进度回 0，"通过审批"置灰。

#### 6.3.4 导出打款单

##### 字段
- 销售工号、姓名、身份证号（脱敏中间 6 位）
- 收款银行、账号、户名
- 应发金额、备注（批次号 + 期）

##### 文件名
`打款单_{batch_no}_{YYYYMMDD}.csv`

##### 导出后
- batch.status → exported
- 财务下载，进入下一步线下打款

#### 6.3.5 上传银行回单 / 回写

##### 表单
- 批次号（自动）
- 实际打款总金额（必须等于 batch.total_amount，否则拒绝）
- 实际打款时间
- 银行打款流水号（必填，唯一约束防重）
- 银行回单文件（PDF / 图片，必传）
- 备注

##### 提交后
- batch.status → paid
- 批次内每条 commission.status → paid，paid_at = 提交时点
- 自动触发销售对账单刷新（如本批次涉及对账单已生成）
- 销售收到站内消息"批次 X 已发放 Y 元"

#### 6.3.6 驳回批次（exported 之前可用）

- 状态 ∈ {auto_generated, pending_review, approved, exported}
- 驳回原因（必填）
- 状态回 pending_review
- 异常剔除 / 修正后重新走审批流

> **不可驳回**：status=paid 后批次永久不可改，只能通过 commission_adjustment 修正。

#### 6.3.7 实现状态：⚠️ 部分实现（基于现有原型，需校准抽查弹窗、回写流程）

---

### 6.4 F4 退款冲销

#### 路径
`/finance/refund-reverses`

> 触发：订单退款回调，由系统自动处理；本节是**事后查询 + 审计 + 异常处理**界面。

#### 6.4.1 列表

| 列 | 字段 |
|---|---|
| 冲销时间 | reverted_at |
| 退款单号 | refund_request.id |
| 订单号 | order.id |
| 销售 | sales.name |
| 原 commission | 原 amount + 状态 |
| 处理路径 | 5.4a / 5.4b / 5.4c |
| 反向流水（如有） | parent → child 链路 |
| recovery（如有） | 跳追回单 |

#### 6.4.2 实现状态：❌ 待实现

---

### 6.5 F5 追回队列（recovery）

#### 路径
`/finance/recoveries`

#### 6.5.1 列表

| 列 | 字段 |
|---|---|
| 追回单号 | id |
| 关联原 commission | id + amount |
| 关联订单 | order.id |
| 销售 | sales.name |
| 销售状态 | active / left |
| 追回金额 | amount |
| 处置选项 | offset / voluntary / enforced / waived（待选 / 已选） |
| 状态 | pending / selected_xxx / completed / closed |
| 创建时间 | created_at |
| 关闭时间 | closed_at |
| 操作 | 选项确认 / 完成 / 申请 waived |

#### 6.5.2 选项确认弹窗

```
点"选择处置"
   ↓
选项卡 4 选 1：A 抵扣 / B 自愿 / C 强制 / D 申请 waived（仅 R1 SU- 可见）
   ↓
A 抵扣：
  · 系统校验销售当月预估新发 ≥ 追回金额
  · 校验通过 → 自动写下月批次扣减项 → recovery.status=selected_offset → 完成时 closed
  · 校验失败 → 提示金额不足，请选 B 或 C

B 自愿：
  · 系统生成"我方收款账户 + 唯一备注号"
  · 推送销售自助页 → 销售点"我已转账"
  · 财务 7 工作日内核对到账 → 标记 completed → closed
  · 7 工作日超时 → 自动转 C

C 强制：
  · 必须 R1 双审（同 § 9 F12）
  · 通过 → status=enforced → 创建 HR / 法务工单（出本 PRD）
  · 系统侧：closed

D 申请 waived（豁免追回）：
  · 仅 R1 SU- 可发起
  · 双审通过 → status=waived → closed
  · 销售对账单不显示扣减
```

#### 6.5.3 实现状态：❌ 待实现

---

### 6.6 F6 销售月度对账单

#### 路径
列表 `/finance/statements`
详情 `/finance/statements/:id`

#### 6.6.1 列表

| 列 | 字段 |
|---|---|
| 对账单号 | statement_no |
| 期 | period_year-period_month |
| 销售 | sales.name |
| 期初余额 | 累计已发 |
| 本期新发 | + |
| 本期反向冲销 | - |
| 本期已发追回 | - |
| 本期实际打款 | + |
| 期末余额 | 累计已发 |
| 状态 | draft / published / confirmed / disputed / resolved / auto_confirmed |
| 推送时间 | published_at |
| 销售确认时间 | confirmed_at |
| 操作 | 详情 / 重发 / 关闭异议 |

#### 6.6.2 对账单详情（销售视角同此页面，但只读）

##### 区块
1. 销售基本信息（工号 / 姓名 / 收款账户）
2. 期初 → 期末汇总
3. 本期新发明细（commission 列表）
4. 本期反向冲销明细
5. 本期已发追回明细（关联 recovery）
6. 本期实际打款明细（关联 batch）
7. 调整记录（关联 commission_adjustment）

##### 文件
- 自动生成 PDF + Excel，永久存档

#### 6.6.3 销售异议处理

```
销售点"提异议" → 弹窗：
  · 异议条目（多选）
  · 异议原因（≥ 50 字）
  · 期望处理（金额修正 / 重新计算 / 其他）
   ↓
提交 → 创建工单（type=commission_dispute）+ statement.status=disputed
   ↓
财务在 § 6.6 看到 disputed 单 → 进入处理流程
   ↓
财务处理（可能涉及 commission_adjustment）→ 解释 / 修正
   ↓
销售再确认 → status=resolved
```

#### 6.6.4 推送渠道

- 站内消息（强制）
- 邮件 + PDF 附件（强制）
- 短信（仅在销售连续 7 天未登录时发短信通知）

#### 6.6.5 实现状态：❌ 待实现

---

### 6.7 F7 财务对账（系统 vs 银行）

#### 路径
`/finance/reconciliation`

#### 6.7.1 上传银行流水

- 文件格式：CSV（标准银行导出）/ Excel
- 必含字段：交易时间、交易金额、对方户名、对方账号、流水号、用途备注
- 文件大小：≤ 10MB
- 文件留存：永久（OSS）

#### 6.7.2 自动比对

##### 匹配规则

按"流水号"精确匹配 commission_batch 中已 paid 的批次：
- 完美匹配：流水号 + 金额 + 时间窗口 ±2 工作日
- 系统有银行无：可能漏打
- 银行有系统无：可能误打 / 个税代扣 / 其他无关流水
- 金额不一致：可能扣个税未在系统体现

##### 输出
- 4 个 Tab：完美匹配 / 系统有银行无 / 银行有系统无 / 金额不一致
- 差异列表，可下钻

#### 6.7.3 差异处理

| 差异类型 | 处理 |
|---|---|
| 漏打 | 创建补打款工单，财务线下补 |
| 误打 | 创建追回工单，HR / 法务介入 |
| 金额不一致（扣个税） | 录入"扣减原因 + 金额" → 写 commission_adjustment（status 不变，仅记录） |
| 银行有系统无（无关流水） | 标记"忽略"，不影响 |

#### 6.7.4 实现状态：❌ 待实现

---

### 6.8 F8 历史结算归档 + 销售收款账户

#### 6.8.1 历史归档

##### 路径
`/finance/archive`

##### 内容
- 已 closed 的批次、对账单、追回单
- 永久保留（DB 层禁删）
- 仅可查询（按销售、按期、按金额）

#### 6.8.2 销售收款账户管理

##### 路径
`/finance/sales-payment-accounts`

##### 字段（敏感数据加密存储）

| 字段 | 必填 | 加密 |
|---|---|---|
| 销售关联 | ✅ | — |
| 收款户名 | ✅ | 部分 |
| 银行 | ✅ | 不 |
| 银行账号 | ✅ | KMS / Vault 加密 |
| 身份证号 | ✅ | KMS / Vault 加密 |
| 开户行支行 | ✅ | 不 |
| 默认账户 | — | — |

##### 操作
- 销售自助维护（在销售个人中心 § D7）
- 财务可查看（账号脱敏中间 6 位）
- 财务可禁用（如不再使用）
- 修改账户：销售自助 + MFA 二次验证 + 财务知会

#### 6.8.3 实现状态：❌ 待实现

---

## 七、数据模型

### 7.1 复用既有表（与超管 PRD § 7.4 一致）

```sql
-- commission（销售 PRD § 7.5 已定义，本 PRD 增字段）
ALTER TABLE commission
  ADD COLUMN parent_commission_id BIGINT REFERENCES commission(id),  -- 反向冲销关联
  ADD COLUMN type ENUM('normal','negative') NOT NULL DEFAULT 'normal',
  ADD COLUMN frozen_due_to_left BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN paid_to_left_employee BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN batch_id BIGINT REFERENCES commission_batch(id),
  ADD COLUMN bank_transfer_no VARCHAR(64),  -- paid 时由批次回写
  ADD COLUMN adjusted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD INDEX idx_parent (parent_commission_id),
  ADD INDEX idx_batch (batch_id);
```

```sql
-- commission_batch（超管 PRD § 7.4）+ 本 PRD 补字段
ALTER TABLE commission_batch
  ADD COLUMN inspect_progress JSON,  -- 抽查进度（7 条点选状态）
  ADD COLUMN bank_receipt_url VARCHAR(500),
  ADD COLUMN bank_transfer_no VARCHAR(64) UNIQUE,
  ADD COLUMN actual_paid_amount DECIMAL(14,2),
  ADD COLUMN rejected_reason VARCHAR(500),
  ADD COLUMN closed_at TIMESTAMP;
```

### 7.2 `commission_recovery`（**新增**）

```sql
CREATE TABLE commission_recovery (
  id              BIGINT PRIMARY KEY,
  recovery_no     VARCHAR(32) NOT NULL UNIQUE,         -- REC-202604-0001
  origin_commission_id BIGINT NOT NULL REFERENCES commission(id),
  refund_request_id BIGINT REFERENCES refund_request(id),
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  amount          DECIMAL(12,2) NOT NULL,              -- 追回金额（正数）
  
  -- 处置选项
  resolution      ENUM('offset','voluntary','enforced','waived'),
  resolution_chosen_at TIMESTAMP,
  resolution_chosen_by BIGINT REFERENCES admin_user(id),
  
  -- 状态
  status          ENUM('pending','selected_offset','selected_voluntary','selected_enforced',
                       'completed','closed','waived') NOT NULL DEFAULT 'pending',
  
  -- 选项 A 抵扣
  offset_target_batch_id BIGINT REFERENCES commission_batch(id),
  offset_applied_at TIMESTAMP,
  
  -- 选项 B 自愿
  voluntary_remit_no VARCHAR(64),                      -- 我方收款唯一备注号
  voluntary_received_at TIMESTAMP,
  voluntary_received_amount DECIMAL(12,2),
  
  -- 选项 C 强制
  enforced_ticket_no VARCHAR(64),                      -- 关联 HR / 法务工单
  
  -- 选项 D waived
  waived_reason   VARCHAR(500),
  waived_approver1_id BIGINT REFERENCES admin_user(id),
  waived_approver2_id BIGINT REFERENCES admin_user(id),
  
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  closed_at       TIMESTAMP,
  
  INDEX idx_sales (sales_id),
  INDEX idx_status (status),
  INDEX idx_origin (origin_commission_id)
);
```

### 7.3 `commission_adjustment`（**新增**）

```sql
CREATE TABLE commission_adjustment (
  id              BIGINT PRIMARY KEY,
  commission_id   BIGINT NOT NULL REFERENCES commission(id),
  adjust_type     ENUM('amount','status','sales_id','other') NOT NULL,
  field_name      VARCHAR(50) NOT NULL,
  old_value       TEXT,
  new_value       TEXT NOT NULL,
  reason          VARCHAR(1000) NOT NULL,              -- ≥ 30 字
  ticket_no       VARCHAR(64),
  
  -- 双审（金额变化 ≥ 10 万）
  needs_double_review BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer1_id    BIGINT NOT NULL REFERENCES admin_user(id),
  reviewer2_id    BIGINT REFERENCES admin_user(id),
  reviewer1_at    TIMESTAMP NOT NULL,
  reviewer2_at    TIMESTAMP,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  
  INDEX idx_commission (commission_id),
  INDEX idx_status (status)
);
```

### 7.4 `sales_settlement_statement`（**新增**）

```sql
CREATE TABLE sales_settlement_statement (
  id              BIGINT PRIMARY KEY,
  statement_no    VARCHAR(32) NOT NULL UNIQUE,         -- STMT-{sales_id}-{YYYYMM}
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  period_year     SMALLINT NOT NULL,
  period_month    TINYINT NOT NULL,
  
  -- 期初 → 期末
  opening_balance DECIMAL(14,2) NOT NULL,
  period_new      DECIMAL(14,2) NOT NULL,              -- 本期新发
  period_reverse  DECIMAL(14,2) NOT NULL,              -- 本期反向冲销（绝对值）
  period_recovery DECIMAL(14,2) NOT NULL,              -- 本期已发追回（绝对值）
  period_paid     DECIMAL(14,2) NOT NULL,              -- 本期实际打款
  closing_balance DECIMAL(14,2) NOT NULL,
  
  -- 文件
  pdf_url         VARCHAR(500),
  excel_url       VARCHAR(500),
  
  -- 状态
  status          ENUM('draft','published','confirmed','disputed','resolved','auto_confirmed') NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMP,
  confirmed_at    TIMESTAMP,
  dispute_ticket_no VARCHAR(64),
  resolved_at     TIMESTAMP,
  
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE KEY uk_sales_period (sales_id, period_year, period_month),
  INDEX idx_status (status)
);
```

### 7.5 `sales_payment_account`（**新增**，敏感字段加密）

```sql
CREATE TABLE sales_payment_account (
  id              BIGINT PRIMARY KEY,
  sales_id        BIGINT NOT NULL REFERENCES sales(id),
  account_holder_name VARCHAR(100) NOT NULL,
  bank_name       VARCHAR(100) NOT NULL,
  bank_account_encrypted VARBINARY(512) NOT NULL,      -- KMS / Vault 加密
  id_card_encrypted VARBINARY(512) NOT NULL,           -- KMS / Vault 加密
  branch_name     VARCHAR(200) NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  status          ENUM('active','disabled') NOT NULL DEFAULT 'active',
  
  -- 校验留痕
  last_verified_at TIMESTAMP,
  last_verified_by BIGINT,
  
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  
  INDEX idx_sales (sales_id),
  INDEX idx_default (sales_id, is_default)
);
```

### 7.6 `bank_reconciliation_run`（**新增**）

```sql
CREATE TABLE bank_reconciliation_run (
  id              BIGINT PRIMARY KEY,
  run_no          VARCHAR(32) NOT NULL UNIQUE,         -- RECON-202604-0001
  uploaded_file_url VARCHAR(500) NOT NULL,
  total_records   INT NOT NULL,
  matched_count   INT NOT NULL,
  sys_only_count  INT NOT NULL,
  bank_only_count INT NOT NULL,
  amount_mismatch_count INT NOT NULL,
  status          ENUM('parsing','completed','failed') NOT NULL DEFAULT 'parsing',
  uploaded_by     BIGINT NOT NULL REFERENCES admin_user(id),
  uploaded_at     TIMESTAMP NOT NULL DEFAULT now(),
  completed_at    TIMESTAMP
);

CREATE TABLE bank_reconciliation_diff (
  id              BIGINT PRIMARY KEY,
  run_id          BIGINT NOT NULL REFERENCES bank_reconciliation_run(id),
  diff_type       ENUM('matched','sys_only','bank_only','amount_mismatch') NOT NULL,
  bank_record     JSON,                                 -- 原始银行流水
  matched_batch_id BIGINT REFERENCES commission_batch(id),
  matched_commission_ids JSON,                          -- 匹配到的 commission id 列表
  amount_diff     DECIMAL(12,2),
  resolution      ENUM('pending','resolved','ignored') NOT NULL DEFAULT 'pending',
  resolution_remark VARCHAR(500),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMP,
  INDEX idx_run (run_id),
  INDEX idx_resolution (resolution)
);
```

---

## 八、接口清单

> 所有接口前缀 `/api/finance/`。鉴权：JWT + role ∈ {官方管理员（Beta1）/ FI-Settle / SU-（Beta2）}。

### 8.1 工作台

| Method | Path |
|---|---|
| GET | `/api/finance/dashboard/preview` |
| GET | `/api/finance/dashboard/todos` |
| GET | `/api/finance/dashboard/alerts` |

### 8.2 流水

| Method | Path |
|---|---|
| GET | `/api/finance/commissions` |
| GET | `/api/finance/commissions/:id` |
| POST | `/api/finance/commissions/batch-confirm`（pending → confirmed） |
| POST | `/api/finance/commissions/:id/adjust` |
| POST | `/api/finance/commissions/export` |

### 8.3 批次

| Method | Path |
|---|---|
| GET | `/api/finance/commission/batches` |
| POST | `/api/finance/commission/batches/manual`（手动触发，应急） |
| GET | `/api/finance/commission/batches/:id` |
| POST | `/api/finance/commission/batches/:id/inspect-tick`（抽查点选） |
| POST | `/api/finance/commission/batches/:id/approve` |
| POST | `/api/finance/commission/batches/:id/reject` |
| POST | `/api/finance/commission/batches/:id/export` |
| POST | `/api/finance/commission/batches/:id/upload-receipt`（上传回单 + 流水号） |
| GET | `/api/finance/commission/batches/:id/items` |

### 8.4 退款冲销与追回

| Method | Path |
|---|---|
| GET | `/api/finance/refund-reverses` |
| GET | `/api/finance/recoveries` |
| GET | `/api/finance/recoveries/:id` |
| POST | `/api/finance/recoveries/:id/select-resolution` |
| POST | `/api/finance/recoveries/:id/voluntary-confirm-receipt` |
| POST | `/api/finance/recoveries/:id/enforce-approve` |
| POST | `/api/finance/recoveries/:id/waive-approve` |

### 8.5 销售对账单

| Method | Path |
|---|---|
| GET | `/api/finance/statements` |
| GET | `/api/finance/statements/:id` |
| POST | `/api/finance/statements/:id/republish` |
| GET | `/api/finance/statements/:id/pdf`（销售也可调） |
| POST | `/api/finance/statements/:id/dispute-respond`（财务回应异议） |

#### 销售自助接口（与销售 PRD 协同）

| Method | Path |
|---|---|
| GET | `/api/sales/statements`（自己的列表） |
| GET | `/api/sales/statements/:id` |
| POST | `/api/sales/statements/:id/confirm` |
| POST | `/api/sales/statements/:id/dispute` |

### 8.6 财务对账

| Method | Path |
|---|---|
| POST | `/api/finance/reconciliation/upload`（上传银行流水） |
| GET | `/api/finance/reconciliation/runs` |
| GET | `/api/finance/reconciliation/runs/:id/diffs` |
| POST | `/api/finance/reconciliation/diffs/:id/resolve` |

### 8.7 销售收款账户

| Method | Path |
|---|---|
| GET | `/api/finance/sales-payment-accounts`（财务视角，账号脱敏） |
| GET | `/api/sales/payment-accounts`（销售自助视角） |
| POST | `/api/sales/payment-accounts`（新增，需 MFA） |
| PATCH | `/api/sales/payment-accounts/:id` |
| POST | `/api/sales/payment-accounts/:id/set-default` |

### 8.8 错误码

| Code | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 角色无权 |
| 40302 | 需双人复核 |
| 40303 | 需 MFA 二次验证 |
| 40901 | 批次状态不允许此操作（如 paid 后驳回） |
| 40902 | 抽查未完成 |
| 40903 | 实际打款金额与批次合计不一致 |
| 40904 | 银行流水号已存在（防重） |
| 40905 | 追回金额超出销售下月预估新发（offset 不可行） |
| 40906 | 销售离职状态下无法选 offset |
| 40907 | commission 状态不允许调整（如已 reverted） |
| 40908 | 自愿退款超时未到账 |
| 50001 | 内部错误 |

---

## 九、业务规则细则（**关键，需 sign-off**）

### F1 commission 生成时点（v1.2 口径）

- 触发事件：`tenant.first_activated_at` 落库（开通任务"企业席位池开通可用"）
- **不**在 order.paid 时触发
- **不**在激活码 redeem 时触发（v1.2 已废激活码主流程）
- 归属销售：`sales_customer.sales_id` 当时值
- 归属期判断：`now() < sales_customer.bound_at + 12 months`
- 费率与规则：commission_rule 当时生效版本，写 `commission.rate` 和 `commission.rule_id` 锁定
- 不生成情况记日志，不抛错

### F2 confirmed 时点（财务显式确认）

- 财务在 § 6.2 看到 pending 流水，**T+1 后**显式批量"确认"
- 不自动跳转（v1.0 是自动，本 PRD 改为手工，避免错算难撤）
- 确认时强制录入"对账依据"（如银行流水号、订单编号、客户回执）
- 确认后：commission.status=confirmed，confirmed_at=now()

### F3 paid 时点（强制银行流水号）

- batch 上传银行回单时强制录入 bank_transfer_no（唯一约束防重）
- batch 内每条 commission：status=paid，paid_at=回单时间，bank_transfer_no=批次的流水号
- 不允许"空回写"或"伪流水号"
- 流水号由系统二次校验（与上次成功打款不重）

### F4 月度批次生成时点

- cron 每月 1 日 00:30 执行（系统时区为上海 +08:00）
- 扫描上月所有 status=confirmed 且 batch_id IS NULL 的 commission
- 失败时不阻塞业务，转工单 + R1 告警，财务可手工触发 `/api/finance/commission/batches/manual`
- 批次 batch_no 格式：`SETTLE-{YYYYMM}-{seq}`，seq 从 0001 起

### F5 抽查强制（防草率审批）

系统选定 7 条：
- 5 条：commission 内随机
- 1 条：本批次金额 Top 1
- 1 条：本批次内反向冲销（如有）；如本批次没有反向冲销，再随机抽 1 条

财务在批次详情**逐条点过**才能"通过审批"。前端禁止跳过（按钮置灰），后端校验 `inspect_progress` JSON 完整性。

### F6 退款冲销三分支（**核心**）

#### F6a · pending 状态退款（无对账影响）

- commission.status = reverted
- 不写反向流水（因为还没打款，无需对账）
- 销售对账单仍然显示该条（标 reverted，不计金额）

#### F6b · confirmed 状态退款（写反向流水）

- 原条 status=reverted
- 写新流水 commission（type=negative, amount=-原条 amount, parent_commission_id=原条 id, status=confirmed）
- 反向流水进入下次月度批次，自然扣减
- 销售对账单本期：- 反向冲销金额

#### F6c · paid 状态退款（追回三选一）

- **不**改原 commission（保护历史不可变）
- 创建 commission_recovery (status=pending)
- 进入财务追回队列（§ 6.5）
- 财务联系销售从三选一选定：
  - **A 抵扣**（offset）：销售当月预估新发 ≥ 追回金额时可选；自动从下月批次扣减
  - **B 自愿**（voluntary）：销售自助页确认 → 我方银行收款 + 唯一备注号 → 7 工作日核对到账
  - **C 强制**（enforced）：双人复核 → HR / 法务工单
- 特殊：**D 申请豁免（waived）**——仅 R1 SU- 可发起，双审通过后追回作废，销售对账单不显示扣减；用于销售已离职 + 金额小、追讨成本高的场景

### F7 跨月切割

- 以 `commission.generated_at` 为切割时点（**不是** order.paid_at）
- 月底 23:59:59 生成的 pending 算入下月批次
- 本批次已生成（auto_generated）但发现遗漏：**不可改本批次**；遗漏条目自然进入下下次批次
- 月初批次已 paid 后发现错条：走 commission_adjustment（**不动批次**）

### F8 销售离职

- 触发：超管 § 5.4 销售离职操作
- pending：全部 frozen_due_to_left=true，进入"离职冻结队列"
  - R1 决定：① 转给接手销售（解冻 + 改 sales_id + 走正常流程）
            ② 作废（标记 reverted_due_to_left）
            ③ 公司收回（不分配，作内部待结算）
- confirmed 未 paid：标记 paid_to_left_employee=true，进入"离职待结算"队列，仍走正常月度批次发放（或定向给离职后约定的代收人）
- paid：不动（事实成立）

### F9 客户调拨

- 触发：超管 § 5.5 客户调拨审批通过，effective_at=t
- 对该 tenant 的所有 commission：
  - generated_at < t → 归原销售（不动）
  - generated_at ≥ t → 归新销售（未来订单触发的 commission 按新归属生成）
- **不修改**已生成的 commission

### F10 历史不可变

- commission_batch.status=paid 后**永久不可改**
- commission.status=paid 后**仅可通过 commission_adjustment 添加调整记录**，原字段不改
- 反向冲销已 paid 条目通过 commission_recovery 实现，不动原 commission
- DB 层禁删 commission / commission_batch / commission_recovery

### F11 不溯及既往（费率历史一致性）

- commission 生成时锁定 rate 与 rule_id
- 未来 rule 变更（如 5% → 8%、引入代理商分级）不影响历史 commission
- commission_rule 历史版本永久保留

### F12 双人复核

| 操作 | 单审 | 双审 |
|---|---|---|
| commission_adjustment 金额变化 | < 10 万 | ≥ 10 万 |
| commission_recovery 选项 C 强制 | — | 必须双审 |
| commission_recovery 选项 D 豁免 | — | 必须双审 |
| commission_batch 驳回 | 任意 | 否 |
| commission_batch upload-receipt | 任意 | 否（但流水号唯一约束兜底） |

双审两人不能是同一人，时间间隔 ≥ 1 分钟。

---

## 十、状态机

### 10.1 commission

```
（开通可用事件触发）
        │
        ▼
   pending  ─[财务确认]─→  confirmed  ─[批次 paid]─→  paid
       │                       │                        │
       │ 退款                   │ 退款                    │ 退款
       ▼                       ▼                        ▼
   reverted              reverted + 写              （创建 recovery，
   (5.4a)                negative 流水              不改原状态，
                         (5.4b)                     5.4c）
```

### 10.2 commission_batch

```
auto_generated  ─[系统生成]─→  pending_review  ─[抽查通过]─→  approved
                                      │                          │
                                      │ 驳回                       │ 导出 CSV
                                      ▼                          ▼
                                  pending_review              exported
                                                                 │
                                                                 │ 上传银行回单
                                                                 ▼
                                                               paid
                                                                 │
                                                                 │ 30 天后归档
                                                                 ▼
                                                              closed
```

### 10.3 commission_recovery

```
pending ─[选项 A]─→ selected_offset ──→ completed ──→ closed
   │
   ├──[选项 B]──→ selected_voluntary ──[到账]──→ completed ──→ closed
   │                                  └──[超时 7 工作日]──→ selected_enforced
   │
   ├──[选项 C 双审]──→ selected_enforced ──[工单创建]──→ closed (enforced)
   │
   └──[选项 D 双审]──→ waived ──→ closed
```

### 10.4 sales_settlement_statement

```
draft ─[系统生成完成]─→ published ─[销售确认]─→ confirmed
                            │
                            ├─[销售提异议]─→ disputed ─[财务处理]─→ resolved
                            │
                            └─[7 天未操作]─→ auto_confirmed
```

### 10.5 commission_adjustment

```
pending ─[审批通过]─→ approved ─[字段已生效]─→ (终态)
   │
   └─[审批驳回]─→ rejected
```

---

## 十一、权限矩阵

| 操作 | Beta1 官方管理员 | Beta2 FI-Settle | Beta2 SU- |
|---|---|---|---|
| 工作台查看 | ✅ | ✅ | ✅ |
| 流水查看 | ✅ | ✅ | ✅ |
| 流水批量确认 (pending → confirmed) | ✅ | ✅ | ✅ |
| 流水手工调整 < 10 万 | ✅ | ✅ | ✅ |
| 流水手工调整 ≥ 10 万（双审第二人） | ✅ | ❌ | ✅ |
| 批次审批 / 抽查 | ✅ | ✅ | ✅ |
| 批次驳回 | ✅ | ✅ | ✅ |
| 批次导出 / 上传回单 | ✅ | ✅ | ✅ |
| 退款冲销查看 | ✅ | ✅ | ✅ |
| 追回单查看 | ✅ | ✅ | ✅ |
| 追回选项 A/B 选定 | ✅ | ✅ | ✅ |
| 追回选项 C 强制双审 | ✅ | ❌ | ✅ |
| 追回选项 D 豁免发起 | ❌ | ❌ | ✅ |
| 追回选项 D 豁免审批 | ❌ | ❌ | ✅（双审第二人） |
| 销售对账单生成 / 推送 | ✅ | ✅ | ✅ |
| 销售对账单异议处理 | ✅ | ✅ | ✅ |
| 银行对账上传 / 处理差异 | ✅ | ✅ | ✅ |
| 销售收款账户查看（脱敏） | ✅ | ✅ | ✅ |
| 销售收款账户启停 | ❌ | ❌ | ✅ |
| 删除任意流水 / 批次 | ❌ | ❌ | ❌（DB 层禁删） |

---

## 十二、非目标（指向其他文档）

| 不做 | 在哪做 |
|---|---|
| 佣金率配置 / 代理商分级 | 超管 PRD § B5 |
| 销售视角佣金明细 | 销售 PRD § D4 |
| 订单 / 对公审核 / 退款发起 | 超管 PRD § B3 |
| 销售档案 / 离职申请 | 超管 PRD § B4 |
| 客户调拨审批 | 超管 PRD § 5.5 |
| 自动打款 API（接银行 / 第三方支付） | Beta2 |
| 个税代扣计算 / 税务系统 | Beta2，本期通过 commission_adjustment 录入 |
| 工资条生成 / HR 系统集成 | 出本 PRD |
| 多级审批工作流引擎 | 暂不引入，单 / 双审够用 |

---

## 十三、成功指标（首版 GA 3 个月内）

| 类别 | 指标 | 目标 |
|---|---|---|
| **效率** | 月度批次生成 → 实际打款时长 | ≤ 5 工作日 |
| | 销售对账单按时推送率（每月 1 日 02:30 前） | ≥ 99% |
| | 银行对账偏差解决时长 | ≤ 3 工作日 |
| **质量** | commission 状态扭转 100% 走规范流程 | 100% |
| | 批次审批抽查执行率 | 100% |
| | 销售对账单 7 天内确认率 | ≥ 90% |
| | 销售异议工单处理时长 | ≤ 5 工作日 |
| **合规** | 高金额操作 100% 双审 | 100% |
| | 历史 paid 数据 0 篡改 | 100% |
| | 审计日志覆盖（所有写操作） | 100% |
| **稳定** | 后台 P95 响应 | ≤ 1.5s |
| | cron 任务（批次 / 对账单）按时执行率 | ≥ 99% |

---

## 十四、测试要点 / 端到端验证

### 14.1 必测路径（≥ 12 条）

1. **正向闭环**：开通可用 → pending → 财务确认 → confirmed → 月度批次 → 抽查 → 审批 → 导出 → 上传回单 → paid → 销售对账单本期已发显示
2. **F6a pending 退款**：客户付款 → 开通 → pending → 客户退款 → 该条 reverted（无反向流水）→ 销售对账单本期反向冲销 0
3. **F6b confirmed 退款**：客户付款 → 开通 → pending → 财务确认 → confirmed → 客户退款 → 原条 reverted + 写 negative 流水 → 下次批次合计自然扣减
4. **F6c paid 退款 + 选项 A 抵扣**：客户付款 → 走完 paid → 客户退款 → 创建 recovery → 财务选 A 抵扣 → 下月批次扣减 → recovery closed
5. **F6c + 选项 B 自愿**：同上但选 B → 销售自助确认 → 7 工作日内系统校到账 → completed
6. **F6c + 选项 B 超时**：同上但 7 工作日未到账 → 自动转 selected_enforced → 双审 → 工单
7. **F6c + 选项 C 强制**：选 C → 双审 → enforced → 工单创建
8. **F6c + 选项 D 豁免**：SU- 发起 → 双审 → waived → recovery closed
9. **跨月切割**：月底 23:59 paid → 当月批次；凌晨 00:00 paid → 下月批次
10. **批次驳回**：批次 exported → 发现错条 → 驳回 → 修正 → 重新审批
11. **批次 paid 后错条**：通过 commission_adjustment 修正，不动批次
12. **销售离职 + pending**：超管标记离职 → pending 全部 frozen → R1 选转移 → 接手销售名下
13. **销售离职 + confirmed**：confirmed 进入"离职待结算"队列 → 仍正常发放 + 标记 paid_to_left_employee
14. **客户调拨**：t 时点之前 commission 不动；之后归新销售
15. **销售对账单异议**：销售提异议 → 工单 → 财务调整 → 销售再确认 → resolved
16. **批次抽查跳过**：尝试不抽满 7 条直接审批 → 后端拒绝 + 前端按钮置灰
17. **流水号防重**：上传回单时使用已存在的 bank_transfer_no → 拒绝
18. **越权拦截**：销售调财务接口 → 401 + 审计

### 14.2 边界测试

- 月底 23:59:59.999 vs 00:00:00.001 跨秒精度
- commission 同时触发退款（refund 并发）→ 行锁
- 批次合计为 0（全部反向冲销时）→ 不导出 / 跳过打款
- 销售对账单期初余额连续性（上月期末 = 本月期初）
- 银行流水号格式校验（防 SQL 注入 / 特殊字符）
- 大批量销售（500 销售 × 10 条 / 销售）批次生成性能 ≤ 30s
- 销售在 statement.published 后立即在新一笔 commission 生成 → 不影响本期对账单

### 14.3 现状校准

打开 `http://localhost:5160/finance/commission/batches`，对照下表：

| 模块 | 原型 | PRD 对应 | 差距 |
|---|---|---|---|
| F1 工作台 | 🔄 | § 6.1 | 待开发对照填 |
| F2 流水 | 🔄 | § 6.2 | 待开发对照填 |
| F3 批次 | 🔄 | § 6.3 | 待开发对照填 |
| F4 退款冲销 | 🔄 | § 6.4 | 待开发对照填 |
| F5 追回 | 🔄 | § 6.5 | 待开发对照填 |
| F6 对账单 | 🔄 | § 6.6 | 待开发对照填 |
| F7 财务对账 | 🔄 | § 6.7 | 待开发对照填 |
| F8 收款账户 | 🔄 | § 6.8 | 待开发对照填 |

---

## 十五、风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| **退款回调失败导致 commission 状态未同步** | 销售拿了不该拿的钱 | 退款回调幂等 + 死信队列重试 + 每日对账任务巡检（订单 refunded 但 commission 未 reverted 的列表） |
| **财务回写空流水号 / 假流水号** | 历史不可信 | 强制流水号 + 唯一约束 + 银行对账 T+1 比对 |
| **批次抽查被绕过**（前端被改） | 草率审批 | 后端校验 inspect_progress 完整性，缺一不可 |
| **跨月时点切割误差**（NTP 漂移、时区错配） | 归错月 | 全系统时区固定 +08:00；使用 generated_at 而不是 paid_at；月底凌晨任务设置缓冲 1 分钟 |
| **销售对账单生成失败** | 销售不知道发了多少 | 失败重试 + 人工兜底 + 站内告警 |
| **追回选项 B 自愿到账难校验** | 销售骗系统 | 唯一备注号 + 7 工作日校验 + 银行对账自动比对 |
| **离职后未发佣金归属争议** | 法务风险 | F8 三选一规则 + R1 决策留痕 + 劳动合同条款支持 |
| **客户调拨争议**（销售认为切割时点不公） | 内部冲突 | F9 切割以 effective_at 为准；调拨审批留痕；不重算历史 commission |
| **销售收款账户被攻击** | 资金被盗 | KMS / Vault 加密 + MFA 二次验证 + 修改后 24 小时冷静期 |
| **银行对账文件格式变化**（银行升级系统） | 解析失败 | 多格式适配 + 失败重试 + 人工导入兜底 |
| **commission_adjustment 滥用** | 操纵销售业绩 | 调整原因强制 ≥ 30 字 + ≥ 10 万双审 + 月度审计 + 销售对账单显示调整明细 |
| **大金额异常订单** | 财务损失 | 异常订单识别（超管 § B3.5）+ 退款冲销 P0 优先级 |

---

## 十六、引用映射表

| 本 PRD 章节 | 来源 |
|---|---|
| § 5.1 commission 生成 | 销售 PRD § 5.2 + § E8（v1.2） |
| § 5.4 三分支 | 销售 PRD § E5（仅一句"已发放走待追回"，本 PRD 落地） |
| § 5.6 已发放追回 | 主 PRD § 七 B5 + 超管 PRD § F8 |
| § 5.7 离职 / 调拨 | 销售 PRD § E1 / E7、超管 PRD § 5.4-5.5 |
| § 5.8 销售对账单 | 本 PRD 新增 |
| § F6c 三选一 | 本 PRD 新增（销售 PRD 留白部分） |
| § F12 双审 | 超管 PRD § F2 |
| § 7.x 数据模型 | 销售 PRD § 7.5 + 超管 PRD § 7.4 |

---

## 十七、附录

### 17.1 术语表

| 术语 | 解释 |
|---|---|
| commission | 佣金条目 / 流水（一条 = 一笔订单触发的应付销售金额） |
| commission_batch | 月度结算批次（一个月所有 confirmed 聚合） |
| commission_recovery | 已发追回单（已 paid commission 因退款产生的反向追回流水） |
| commission_adjustment | 手工调整单（财务对某条 commission 的修正） |
| 结算 (Settlement) | 把 confirmed commission 通过批次实际打款给销售的全过程 |
| 冲销 (Reverse) | 因订单退款触发的佣金反向操作 |
| 追回 (Recovery) | 已 paid 佣金对应订单退款时的款项取回 |
| 对账单 (Statement) | 月度推送给销售本人的当月佣金汇总 |
| 平账 (Reconciliation) | 系统流水 vs 银行实际打款流水的比对 |
| FI-Settle | Beta2 拆出的财务结算专员子角色 |
| 切割时点 | 客户调拨 / 销售离职等场景下的归属归集时间点 |
| 双审 | 双人复核，两个不同 R1 用户先后批准 |
| MFA | 多因素认证（TOTP） |

### 17.2 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-05-08 | 首版，从超管 PRD § B5 + 销售 PRD § E4-E9 拆出，把"结算闭环"独立成一份 PRD；新增退款三分支、追回三选一、销售对账单、银行对账等模块 | Claude + 产品团队 |

### 17.3 sign-off 区（三方逐条确认）

#### 财务负责人 sign-off

- [ ] § 5.1 commission 生成以"开通可用"为时点（v1.2）
- [ ] § 5.2 状态扭转主链：财务显式确认（不自动跳）
- [ ] § 5.3 月度批次抽查 7 条强制
- [ ] § 5.4 退款冲销三分支
- [ ] § 5.6 追回三选一（offset / voluntary / enforced + waived）
- [ ] § 5.9 银行对账流程合理
- [ ] § F2 confirmed 时点：T+1 财务显式确认
- [ ] § F3 paid 时点：强制银行流水号
- [ ] § F12 双审阈值（10 万）合理
- [ ] § 13 KPI 可达

签字 / 日期：__________________________________

#### 销售业务负责人 sign-off

- [ ] § 5.7.1 销售离职佣金处理（pending 冻结、confirmed 仍发放）
- [ ] § 5.7.2 客户调拨切割规则
- [ ] § 5.8 销售月度对账单（自动推送 + 异议处理）
- [ ] § F6c 三选一适用场景合理（业务可接受）
- [ ] § F6c 选项 D 豁免规则（避免追讨成本过高）

签字 / 日期：__________________________________

#### 运营负责人 sign-off

- [ ] § 2.4 设计原则可执行
- [ ] § 11 权限矩阵 Beta1 单角色合理
- [ ] § F10 历史不可变 + DB 禁删合规
- [ ] § F11 不溯及既往（费率版本）合规
- [ ] § 15 风险应对方案完备

签字 / 日期：__________________________________

---

**文档结束**
