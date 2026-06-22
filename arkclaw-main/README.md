# ArkClaw

ArkClaw 是云脑智联代理火山 ArkClaw 的 B 端 SaaS 原型项目。当前仓库主要用于产品评审、流程验证和前端 mock 原型开发，不包含真实火山账号映射、真实 SSO、真实支付、真实银行流水或生产后端集成。

## 当前定位

- **阶段**：Beta1 原型 / Mock 页面开发。
- **目标**：跑通销售获客、客户注册、对公购买、官方后台审核、交付运维、企业开通、席位分配、成员进入工作台、销售佣金可见的主流程。
- **原则**：前端表达页面、状态和流程；真实火山 API、支付、SSO、银行流水、佣金发放等由后续技术集成承接。

## 核心角色

| 角色 | 当前原型范围 |
|---|---|
| 客户管理员 | 注册企业、提交对公订单、管理席位、配置员工工作台、分配成员 |
| 客户成员 | 进入 ArkClaw 工作台，完成席位启用后的使用入口 |
| 销售 | 客户池、分享链接 / 邀请码、开通跟进、佣金明细 |
| 交付运维 | 工单队列、工单详情、从工单进入客户侧页面协助处理 |
| 官方管理员 | 企业、订单、对公审核、退款、开通任务、销售、留资、佣金规则、佣金流水、套餐价格、内部员工账号 |

## 主要流程

```text
销售分享链接 / 手动录入客户
  -> 客户注册企业
  -> 客户生成对公订单并提交付款凭证
  -> 官方管理员审核对公到账
  -> 生成企业开通任务
  -> 运维通过工单协助处理
  -> 企业席位池可用
  -> 客户管理员分配席位
  -> 成员进入 ArkClaw 工作台
  -> 销售看到开通完成和佣金 pending
```

## 目录结构

```text
.
├── 0-assets/                         # 视觉稿、截图和参考素材
├── 1-prd/                            # 主 PRD
├── 1-prd-det/                        # 分模块 PRD、流程文档和页面分级清单
├── frontend/                         # React + Vite 前端 mock 原型
├── 20260429*.txt                     # 会议逐字稿
├── *.png                             # 流程图和过程图
└── README.md                         # 项目总说明
```

## 关键文档

| 文档 | 说明 |
|---|---|
| `1-prd/PRD.md` | 产品主 PRD |
| `1-prd-det/客户开户注册与席位激活流程-PRD.md` | 客户开户、对公、开通、席位激活主链路 |
| `1-prd-det/销售CRM-PRD.md` | 销售侧客户经营、分享链接、开通跟进、佣金 |
| `1-prd-det/超级管理员后台-PRD.md` | 官方管理员后台需求 |
| `1-prd-det/运维支持后台-PRD.md` | 交付运维后台需求 |
| `1-prd-det/Beta1页面分级清单-销售运维超管.md` | 15 天 Beta1 页面范围和后置范围 |
| `1-prd-det/开户注册-SSO核心模块清单.md` | 注册和 SSO 相关核心模块清单 |

## 前端项目

前端位于 `frontend/`，技术栈：

- React 18
- Vite
- TypeScript
- Arco Design
- Recharts
- React Router

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发环境

```bash
cd frontend
npm run dev
```

默认访问：

```text
http://localhost:5160/
```

如果 Vite 使用了其他端口，以终端输出为准。

### 构建

```bash
cd frontend
npm run build
```

### 预览构建产物

```bash
cd frontend
npm run preview
```

## 常用入口

| 模块 | 路由 |
|---|---|
| 客户注册 | `/register` |
| 客户侧空间 | `/tenant/overview` |
| 客户账单 / 对公 | `/tenant/billing` |
| 客户席位 | `/tenant/seats` |
| 客户工作台 | `/tenant/workbench` |
| 销售工作台 | `/sales/dashboard` |
| 销售开通跟进 | `/sales/opening-tasks` |
| 官方管理员后台 | `/admin/dashboard` |
| 企业管理 | `/admin/tenants` |
| 订单与账单 | `/admin/orders` |
| 对公审核 | `/admin/orders/bank-transfer-review` |
| 企业开通任务 | `/admin/orders/opening-tasks` |
| 留资管理 | `/admin/leads` |
| 佣金规则 | `/admin/commission/rules` |
| 佣金流水 | `/admin/commission/transactions` |
| 内部员工账号 | `/admin/staff` |
| 交付运维工单 | `/ops/tickets` |

## Beta1 范围说明

Beta1 必做：

- 销售：客户池、客户详情、分享链接 / 邀请码、开通跟进、佣金明细。
- 客户侧：注册、对公订单、席位管理、成员工作台承接。
- 官方管理员：企业补录、企业管理、订单、对公审核、退款、开通任务、销售管理、留资、佣金规则、佣金流水、套餐价格、内部员工账号。
- 运维：工单队列、工单详情、客户侧协助入口。

Beta1 后置：

- 真实火山资源映射控制台。
- 真实 SSO / OAuth / 企业微信 / 飞书集成。
- 真实支付、银行流水识别和财务系统对接。
- 销售排行榜、复杂客户调拨审批、复杂佣金结算批次。
- 角色权限矩阵、MFA、双人复核、系统参数、监控告警、代登录。
- 完整运维平台、巡检规则、自动化运维编排。

## Git 注意事项

仓库已配置 `.gitignore`，默认不提交：

- `node_modules/`
- `frontend/dist/`
- `.DS_Store`
- `*.tsbuildinfo`
- `.env*`
- 日志文件

提交前建议执行：

```bash
cd frontend
npm run build
```

## 远端仓库

```text
ssh://git@ynzl-sshgitlab.instaup.cn:8122/ztai_new/arkclaw.git
```
