# ArkClaw API 自动化测试框架

基于 Jest + TypeScript 构建的 ArkClaw 接口自动化测试框架，支持主站和镜像站测试。

## 🎯 功能特性

- ✅ **多环境支持**：支持主站和镜像站切换
- ✅ **API模块封装**：统一的API调用方式
- ✅ **测试报告生成**：HTML格式测试报告
- ✅ **代码覆盖率**：支持覆盖率统计
- ✅ **环境变量配置**：通过.env文件管理配置
- ✅ **自动重试机制**：失败重试支持

## 📁 项目结构

```
api-test-framework/
├── src/
│   ├── api/                    # API模块
│   │   ├── authApi.ts          # 认证接口
│   │   ├── tenantApi.ts        # 租户管理接口
│   │   ├── orderApi.ts         # 订单管理接口
│   │   ├── invoiceApi.ts       # 发票管理接口
│   │   ├── financeApi.ts       # 财务审核接口
│   │   ├── notificationApi.ts  # 通知中心接口
│   │   ├── opsApi.ts           # 运维工单接口
│   │   └── couponApi.ts        # 代金券接口
│   ├── client/
│   │   └── httpClient.ts       # HTTP客户端
│   ├── config/
│   │   └── env.ts              # 环境配置
│   ├── tests/                  # 测试用例
│   │   ├── auth.test.ts        # 认证测试
│   │   ├── tenant.test.ts      # 租户测试
│   │   ├── order.test.ts       # 订单测试
│   │   ├── invoice.test.ts     # 发票测试
│   │   ├── finance.test.ts     # 财务测试
│   │   ├── notification.test.ts# 通知测试
│   │   ├── ops.test.ts         # 运维测试
│   │   ├── coupon.test.ts      # 代金券测试
│   │   ├── boundary.test.ts    # 边界值测试
│   │   └── mirror.test.ts      # 镜像站测试
│   ├── utils/
│   │   ├── logger.ts           # 日志工具
│   │   └── reporter.ts         # 测试报告工具
│   └── index.ts                # 模块导出
├── .env                        # 环境变量
├── jest.config.js              # Jest配置
├── tsconfig.json               # TypeScript配置
└── package.json                # 项目配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd api-test-framework
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
# 主站配置
MAIN_BASE_URL=http://localhost:8080
MAIN_API_KEY=your-main-api-key
MAIN_USERNAME=admin
MAIN_PASSWORD=password

# 镜像站配置
MIRROR_BASE_URL=http://mirror.arkclaw.local:8081
MIRROR_API_KEY=your-mirror-api-key
MIRROR_USERNAME=mirror-admin
MIRROR_PASSWORD=password

# 测试配置
TEST_TIMEOUT=30000
TEST_RETRY=2
LOG_LEVEL=info
```

### 3. 运行测试

```bash
# 运行所有测试（主站）
npm test

# 运行镜像站测试
npm run test:mirror

# 生成测试报告
npm run test:report

# 生成覆盖率报告
npm run test:coverage

# 监听模式运行
npm run test:watch
```

## 🧪 测试用例说明

### 核心测试模块

| 模块 | 测试文件 | 测试内容 |
|------|---------|---------|
| 认证 | auth.test.ts | 登录、登出、获取用户信息 |
| 租户 | tenant.test.ts | 创建、查询、更新、激活租户 |
| 订单 | order.test.ts | 创建订单、确认支付、取消订单 |
| 发票 | invoice.test.ts | 发票申请、审批、开具 |
| 财务 | finance.test.ts | 对公审核、确认到账、拒绝申请 |
| 通知 | notification.test.ts | 通知列表、标记已读 |
| 运维 | ops.test.ts | 工单创建、处理、完成 |
| 代金券 | coupon.test.ts | 创建、激活、发放代金券 |
| 边界值 | boundary.test.ts | 金额边界值校验 |
| 镜像站 | mirror.test.ts | 镜像站完整流程 |

### 边界值测试覆盖

| 测试场景 | 预期结果 |
|---------|---------|
| 金额 = 订单金额 | 成功确认到账 |
| 金额 = 0 | 返回400错误 |
| 金额 < 0 | 返回400错误 |
| 金额 = 订单金额 × 1.05 | 成功确认到账（允许5%溢缴） |
| 金额 = 订单金额 × 1.5 | 返回400错误（超出限制） |
| 金额 = 订单金额 × 0.5 | 返回400错误（不足） |
| 金额 = 订单金额 × 1000 | 返回400错误（极大值） |
| 金额 = 0.01 | 返回400错误（极小值） |

## 🔧 技术栈

- **测试框架**: Jest 29
- **语言**: TypeScript 5
- **HTTP客户端**: Axios
- **报告生成**: jest-html-reporter
- **环境管理**: dotenv

## 📊 测试报告

运行 `npm run test:report` 后，报告生成在 `reports/test-report.html`。

## 📝 编码规范

- 使用 TypeScript 严格模式
- 测试用例使用 `describe` 和 `test` 组织
- API模块统一使用 `async/await`
- 测试前后使用 `beforeAll/afterAll` 清理资源

## 📄 许可证

MIT License
