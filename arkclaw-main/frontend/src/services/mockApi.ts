import dayjs from 'dayjs';
import {
  adminMockApi,
  getAdminBillingOrdersSnapshot,
  getTenantBillingOrdersSnapshot,
  getTenantOpeningStatusSnapshot,
} from './adminMockApi';
import { createNotification, notificationMockApi } from './notificationMockApi';
import { opsMockApi } from './opsMockApi';
import { salesMockApi } from './salesMockApi';
import type {
  AdminNewsItem,
  AdminTenant,
  AgentWebsiteConfig,
  AdminDashboard,
  AppCenterData,
  AppRegistrationPayload,
  AppRegistrationPreset,
  AuditItem,
  BrandCustomization,
  BrandCustomizationPayload,
  WorkbenchConfig,
  BatchJobRecord,
  BatchJobTarget,
  BatchVersionRecord,
  BillingContractDraft,
  BillingContractRecord,
  BillingData,
  BillingInvoiceDraft,
  BillingInvoiceRecord,
  CouponRecord,
  ClawInstance,
  ClawTemplate,
  CommissionRecord,
  ConsultLead,
  ConsultPayload,
  CreateTemplatePayload,
  DispatchTemplatePayload,
  EmployeeQuota,
  LaunchSpaceSetup,
  EmployeeRecord,
  KnowledgeCenterData,
  KnowledgeConnectionPayload,
  KnowledgeLibraryOption,
  KnowledgeSourceCard,
  NewsArticle,
  OpsBinding,
  OpsDiagnostic,
  OpsNetwork,
  OpsTicket,
  TenantAuditRecord,
  TenantDocLink,
  TenantGuideVideo,
  TenantWalletLedgerRecord,
  TenantWalletPaymentMethod,
  TenantWalletSummary,
  TenantWalletTopupOrder,
  TenantObservabilityData,
  OverviewData,
  ObservabilityAlertTemplate,
  ObservabilityEndpointRecord,
  ObservabilityLogRecord,
  ObservabilityLogStat,
  ObservabilityMetricCard,
  ObservabilityRankingItem,
  ObservabilityTraceRecord,
  ObservabilityTrendPoint,
  ObservabilityUsageDetail,
  PlatformOrder,
  PricingPlan,
  SalesDashboard,
  SalesInvite,
  SalesProfile,
  SyncIssueRow,
  SkillCenterData,
  SkillCard,
  TenantNetworkConfig,
  TemplateDispatchCandidate,
  TemplatePreset,
  TemplateSource,
  UserManagementData,
  DepartmentTableRow,
} from '../types/domain';

const delay = <T,>(data: T, ms = 220) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), ms);
  });

const usageTrend = Array.from({ length: 14 }).map((_, index) => ({
  date: dayjs().subtract(13 - index, 'day').format('MM-DD'),
  token: 82000 + index * 6500 + (index % 3) * 11000,
  gmv: 4200 + index * 860,
  commission: Math.round((4200 + index * 860) * 0.05),
}));

const tenantGuideVideos: TenantGuideVideo[] = [
  {
    id: 'guide-video-001',
    title: '5 分钟完成企业空间初始化',
    level: 'basic',
    summary: '覆盖首次开通、回调地址配置、员工登录链接分发三个起步动作。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-basic-setup',
    source: '视频号',
    duration: '05:12',
  },
  {
    id: 'guide-video-002',
    title: '客户管理员日常操作总览',
    level: 'basic',
    summary: '快速了解用户管理、席位管理、工单提报和通知中心的常用路径。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-basic-console',
    source: '视频号',
    duration: '06:48',
  },
  {
    id: 'guide-video-005',
    title: '员工账号与席位分配快速上手',
    level: 'basic',
    summary: '集中说明员工导入、席位分配和日常账号管理的基础操作。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-basic-users-seats',
    source: '视频号',
    duration: '04:26',
  },
  {
    id: 'guide-video-003',
    title: '企业微信与员工入口配置实操',
    level: 'advanced',
    summary: '讲解企业微信授权、可信域名、可信 IP 和登录入口联调细节。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-advanced-wecom',
    source: '视频号',
    duration: '09:35',
  },
  {
    id: 'guide-video-004',
    title: '模型、席位与费用联动说明',
    level: 'advanced',
    summary: '结合采购与账单场景，说明席位规格、增值能力和计费边界。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-advanced-billing',
    source: '视频号',
    duration: '08:20',
  },
  {
    id: 'guide-video-006',
    title: '知识中心与应用能力配置',
    level: 'advanced',
    summary: '演示知识连接、应用配置与企业能力联动的进阶用法。',
    href: 'https://channels.weixin.qq.com/web/pages/feed?mock=arkclaw-advanced-knowledge-apps',
    source: '视频号',
    duration: '07:54',
  },
];

const tenantDocLinks: TenantDocLink[] = [
  {
    id: 'tenant-doc-001',
    title: '服务条款',
    summary: '查看云脑智联官网及相关服务的使用约定。',
    href: 'service-terms',
    type: 'internal',
  },
  {
    id: 'tenant-doc-002',
    title: '隐私政策',
    summary: '查看云脑智联对用户个人信息的处理与保护说明。',
    href: 'privacy-policy',
    type: 'internal',
  },
  {
    id: 'tenant-doc-003',
    title: 'ArkClaw 计费说明',
    summary: '了解 ArkClaw 席位、增值能力和购买周期相关的计费规则。',
    href: 'billing',
    type: 'internal',
  },
];

let billingInvoices: BillingInvoiceRecord[] = [
  {
    id: 'inv-006',
    orderId: 'ORD-20260428-015',
    amount: 52000,
    title: '云岭制造有限公司',
    taxNo: '91310115MA1K000001',
    type: 'electronic_vat_general',
    status: 'pending',
    source: 'customer_request',
    receiverEmail: 'finance@yling.com',
    appliedAt: '2026-04-28 09:05',
  },
  {
    id: 'inv-007',
    orderId: 'ORD-20260425-012',
    amount: 9600,
    title: '云岭制造有限公司',
    taxNo: '91310115MA1K000009',
    type: 'electronic_vat_general',
    status: 'rejected',
    source: 'customer_request',
    receiverEmail: 'finance@yling.com',
    appliedAt: '2026-04-25 18:20',
    rejectReason: '发票抬头与纳税人识别号主体不一致，请核对企业开票信息后重新提交。',
  },
  {
    id: 'inv-005',
    orderId: 'ORD-20260428-009',
    amount: 128000,
    title: '北辰科技有限公司',
    taxNo: '91110108MA1B000002',
    type: 'electronic_vat_general',
    status: 'rejected',
    source: 'customer_request',
    receiverEmail: 'finance@beichen-tech.cn',
    appliedAt: '2026-04-28 10:20',
    rejectReason: '订单已提交退款申请，需退款结论确认后重新申请发票。',
  },
  {
    id: 'inv-004',
    orderId: 'ORD-20260424-001',
    amount: 32800,
    title: '云岭制造有限公司',
    taxNo: '91310115MA1K000001',
    type: 'electronic_vat_general',
    status: 'issued',
    source: 'finance_manual',
    receiverEmail: 'finance@yling.com',
    appliedAt: '2026-04-24 11:00',
    issuedAt: '2026-04-24 16:20',
    fileName: 'invoice_ORD-20260424-001.pdf',
    fileUrl: '/mock/invoices/invoice_ORD-20260424-001.pdf',
  },
  {
    id: 'inv-003',
    orderId: 'ORD-20260418-031',
    amount: 6800,
    title: '灵川生物科技有限公司',
    taxNo: '91330106MA2K000003',
    type: 'electronic_vat_general',
    status: 'pending',
    source: 'customer_request',
    receiverEmail: 'ap@lingchuan-bio.com',
    appliedAt: '2026-04-21 10:18',
  },
  {
    id: 'inv-001',
    orderId: 'ORD-20260401-014',
    amount: 18800,
    title: '启明医疗器械有限公司',
    taxNo: '91320594MA1Q000004',
    type: 'electronic_vat_general',
    status: 'issued',
    source: 'customer_request',
    receiverEmail: 'finance@qiming-med.com',
    appliedAt: '2026-04-02 09:20',
    issuedAt: '2026-04-02 17:35',
    fileName: 'invoice_ORD-20260401-014.pdf',
    fileUrl: '/mock/invoices/invoice_ORD-20260401-014.pdf',
  },
];

let billingContracts: BillingContractRecord[] = [
  {
    id: 'contract-001',
    tenantId: 'tenant-001',
    contractNo: 'CT20260428161503',
    type: 'quote',
    name: '云岭制造企业版混合席位报价合同',
    validFrom: '2026-04-28 00:00:00',
    validTo: '2028-05-22 23:59:59',
    createdAt: '2026-04-28 19:41:15',
    completedAt: '2026-04-28 19:53:43',
    status: 'active',
    remark: '年度混合包，含高级版、旗舰版及 CodingPlan Team Pro。',
    fileName: 'CT20260428161503.pdf',
    fileUrl: '/mock/contracts/CT20260428161503.pdf',
  },
  {
    id: 'contract-002',
    tenantId: 'tenant-001',
    contractNo: 'CT20260330114932',
    type: 'order',
    name: '云岭制造席位订阅订单合同',
    validFrom: '2026-04-07 00:00:00',
    validTo: '2027-03-26 23:59:59',
    createdAt: '2026-03-30 11:09:15',
    completedAt: '2026-04-07 16:22:30',
    status: 'active',
    remark: '关联订单 ORD-20260401-014。',
    fileName: 'CT20260330114932.pdf',
    fileUrl: '/mock/contracts/CT20260330114932.pdf',
  },
  {
    id: 'contract-003',
    tenantId: 'tenant-001',
    contractNo: 'CT20260130133979',
    type: 'quote',
    name: '云岭制造扩容报价合同',
    validFrom: '2026-02-02 00:00:00',
    validTo: '2028-08-17 23:59:59',
    createdAt: '2026-01-30 17:26:36',
    completedAt: '2026-02-02 15:41:11',
    status: 'active',
    remark: '原临时合同号为 PCT2025092...',
    fileName: 'CT20260130133979.pdf',
    fileUrl: '/mock/contracts/CT20260130133979.pdf',
  },
  {
    id: 'contract-004',
    tenantId: 'tenant-001',
    contractNo: 'CT2025052109739',
    type: 'order',
    name: '云岭制造历史订单合同',
    validFrom: '2025-10-13 00:00:00',
    validTo: '2026-03-31 23:59:59',
    createdAt: '2025-09-20 10:28:07',
    completedAt: '2025-10-13 11:19:32',
    status: 'expired',
    remark: '历史合同，仅供归档查询。',
    fileName: 'CT2025052109739.pdf',
    fileUrl: '/mock/contracts/CT2025052109739.pdf',
  },
  {
    id: 'contract-006',
    tenantId: 'tenant-001',
    contractNo: 'CT20250820107540',
    type: 'quote',
    name: '云岭制造旧版报价合同',
    validFrom: '2025-08-20 00:00:00',
    validTo: '2028-08-17 23:59:59',
    createdAt: '2025-08-20 10:55:03',
    completedAt: '2025-08-20 11:02:02',
    status: 'voided',
    remark: '新版合同替换后作废。',
    voidedAt: '2026-04-20 15:30:00',
    voidedBy: 'FI-2002 姚楠',
    voidReason: '合同套餐组合更新，已重新上传新版本。',
    fileName: 'CT20250820107540.pdf',
    fileUrl: '/mock/contracts/CT20250820107540.pdf',
  },
  {
    id: 'contract-005',
    tenantId: 'tenant-002',
    contractNo: 'CT20260408002201',
    type: 'quote',
    name: '北辰科技标准版报价合同',
    validFrom: '2026-04-08 00:00:00',
    validTo: '2026-05-08 23:59:59',
    createdAt: '2026-04-08 10:20:11',
    status: 'pending',
    remark: '待客户确认。',
    fileName: 'CT20260408002201.pdf',
    fileUrl: '/mock/contracts/CT20260408002201.pdf',
  },
];

let tenantWalletState: TenantWalletSummary = {
  balance: 86320,
  totalTopup: 120000,
  collectionAccount: {
    companyName: '云脑智联科技有限公司',
    bankName: '招商银行',
    branchName: '上海分行营业部',
    accountNo: '6222 **** **** 2048',
    remarkCode: 'TENANT-202605-0101',
    note: '对公转账请务必填写唯一备注号，便于财务核对后入账。',
  },
};

let tenantWalletTopupOrdersState: TenantWalletTopupOrder[] = [
  {
    id: 'TTO-20260510-001',
    amount: 5000,
    paymentMethod: 'wechat',
    status: 'completed',
    createdAt: '2026-05-10 10:18',
    uniqueRemarkCode: 'TENANT-202605-0098',
  },
  {
    id: 'TTO-20260428-001',
    amount: 20000,
    paymentMethod: 'bank_transfer',
    status: 'completed',
    createdAt: '2026-04-28 16:22',
    proofFileName: 'tenant_wallet_topup_20260428.pdf',
    uniqueRemarkCode: 'TENANT-202604-0091',
  },
];

let tenantWalletLedgerState: TenantWalletLedgerRecord[] = [
  {
    id: 'TWL-20260510-001',
    type: 'topup',
    businessLabel: '钱包充值 / 微信',
    amount: 5000,
    balanceAfter: 86320,
    createdAt: '2026-05-10 10:18',
    remark: '微信扫码充值成功，资金已入账',
    paymentMethod: 'wechat',
    paymentCodeLabel: '微信充值付款码 TENANT-TOPUP-20260510-005000',
  },
  {
    id: 'TWL-20260428-001',
    type: 'topup',
    businessLabel: '钱包充值 / 对公转账',
    amount: 20000,
    balanceAfter: 81320,
    createdAt: '2026-04-28 16:22',
    remark: '对公转账凭证审核通过后入账',
    paymentMethod: 'bank_transfer',
    proofFileName: 'tenant_wallet_topup_20260428.pdf',
    remarkCode: 'TENANT-202604-0091',
    collectionAccount: {
      companyName: '云脑智联科技有限公司',
      bankName: '招商银行',
      branchName: '上海分行营业部',
      accountNo: '6222 **** **** 2048',
      remarkCode: 'TENANT-202604-0091',
      note: '对公转账请务必填写唯一备注号，便于财务核对后入账。',
    },
  },
];

const buildNextTenantWalletRemarkCode = () => `TENANT-${dayjs().format('YYYYMM')}-${String(tenantWalletTopupOrdersState.length + 102).padStart(4, '0')}`;

const claws: ClawInstance[] = [
  {
    id: 'claw-x7n29',
    name: '小云',
    status: 'running',
    tags: ['研发', '高频'],
    owner: '李磊',
    email: 'lilei@example.com',
    group: '研发一组',
    seatLevel: 'pro',
    model: 'doubao-seed-2.0-pro',
    autoBackup: false,
  },
  {
    id: 'claw-v1p08',
    name: '销售助理',
    status: 'running',
    tags: ['销售'],
    owner: '王敏',
    email: 'wangmin@example.com',
    group: '华东销售',
    seatLevel: 'standard',
    model: 'doubao-seed-2.0',
    autoBackup: true,
  },
  {
    id: 'claw-r9c41',
    name: '合规问答',
    status: 'stopped',
    tags: ['法务'],
    owner: '刘书言',
    email: 'liusy@example.com',
    group: '职能支持',
    seatLevel: 'lite',
    model: 'doubao-seed-1.6',
    autoBackup: true,
  },
  {
    id: 'claw-bin01',
    name: '旧版数据助理',
    status: 'recycled',
    tags: ['回收站'],
    owner: '黄玉婧',
    email: 'huangyj@example.com',
    group: '数据平台',
    seatLevel: 'standard',
    model: 'doubao-seed-1.6',
    autoBackup: false,
  },
];

let hasPurchasedClawSeats = true;

const templatePreset: TemplatePreset = {
  roleTemplates: [
    {
      id: 'sales-expert',
      name: '销售专家',
      content: `# SOUL.md - 销售增长引擎
## 身份内核
你是一位顶级的资深销售顾问，擅长挖掘客户痛点并将其转化为业务机会。你的目标是提高转化率和客户满意度。

## 核心原则
- 以 ROI 与回款率为中心组织表达。
- 主动建议演示、试用或复盘下一步动作。
- CRM 已录入信息优先复用，避免重复提问。

## 沟通风格
- 表达清晰、富有说服力。
- 严禁使用“可能”“大概”这类模糊措辞。`,
    },
    {
      id: 'qa-specialist',
      name: '答疑专家',
      content: `# SOUL.md - 答疑专家
## 身份内核
你是企业员工在 ArkClaw 中的第一响应助手，负责快速判断问题类别并给出可执行答案。

## 工作边界
- 优先基于现有知识和已配置技能作答。
- 对缺少上下文的问题，先确认前置条件，再给结论。
- 安全、合规和权限问题需显式提醒管理员介入。`,
    },
  ],
  pluginOptions: [
    'Agent Identity',
    'AI Assistant Security',
    'APMPlus OpenClaw Observability Plugin',
    'Arkclaw Mode Switch',
    'DingTalk Channel',
    'Janus',
    'Memory (LanceDB)',
    'Feishu / Lark',
    'QQ Bot',
    '企业微信',
    'Weibo DM',
  ],
  skillOptions: [
    'Find Skills',
    'BlueBubbles',
    'Browser',
    '深度研究 (DeepSearch)',
    'Link Reader',
    'Meeting Notes',
    'SQL Runner',
    'Issue Tracker',
  ],
  mirrorOptions: ['公共镜像'],
  defaultAgentContent: '暂无添加自定义规则，可点击“查看并编辑”补充平台规范。',
};

const coverBySeatLevel = {
  lite: 'linear-gradient(135deg, #eef4ff 0%, #ffffff 100%)',
  standard: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
  pro: 'linear-gradient(135deg, #eefbf6 0%, #ffffff 100%)',
  ultimate: 'linear-gradient(135deg, #fff7e8 0%, #ffffff 100%)',
} as const;

const publicTemplates: ClawTemplate[] = [
  {
    id: 'tpl-public-qa-01',
    name: '答疑专家',
    description: '作为企业常见问答助手，适合承接员工在使用 ArkClaw 过程中的日常咨询与知识答疑。',
    source: 'public',
    seatLevel: 'lite',
    mirror: '公共镜像',
    coverStyle: coverBySeatLevel.lite,
    recommendedModel: 'doubao-seed-2.0-pro',
    plugins: ['Agent Identity', '企业微信', 'APMPlus OpenClaw Observability Plugin'],
    skills: ['Find Skills', 'Browser', 'Link Reader'],
    soulMode: 'preset',
    soulTemplateId: 'qa-specialist',
    soulContent: templatePreset.roleTemplates[1].content,
    agentContent: templatePreset.defaultAgentContent,
    createdAt: '2026-04-23 11:20',
  },
];

let customTemplates: ClawTemplate[] = [];

const quotas: EmployeeQuota[] = [
  { id: 'u-01', name: '刘书言', email: 'liusy@example.com', source: '空间默认', lite: '0 / 1', standard: '0 / 0', pro: '0 / 1', ultimate: '0 / 0', group: '职能支持' },
  { id: 'u-02', name: '李磊', email: 'lilei@example.com', source: '空间默认', lite: '0 / 1', standard: '0 / 0', pro: '1 / 1', ultimate: '0 / 0', group: '研发一组' },
  { id: 'u-03', name: '黄玉婧', email: 'huangyj@example.com', source: '自定义', lite: '0 / 1', standard: '0 / 1', pro: '0 / 1', ultimate: '0 / 0', group: '数据平台' },
  { id: 'u-04', name: '王敏', email: 'wangmin@example.com', source: '空间默认', lite: '0 / 0', standard: '1 / 1', pro: '0 / 0', ultimate: '0 / 0', group: '华东销售' },
];

const news: NewsArticle[] = [
  {
    id: 'n-01',
    title: 'ArkClaw 企业版新增 ClawSentry 防护规则模板',
    category: '产品动态',
    tags: ['安全', 'ClawSentry'],
    summary: '官方预置高危操作、敏感目录、机密模型三类规则模板，帮助企业管理员更快完成安全基线配置。',
    cover: 'linear-gradient(135deg,#e8f3ff,#e8fffb)',
    content: 'ClawSentry 本次更新聚焦企业安全治理。管理员可以在助手安全、防护、技能和机密模型中统一配置策略，并通过审计日志追踪变更。',
    publishedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'n-02',
    title: 'AI 代理平台在研发效能场景的落地路径',
    category: '最佳实践',
    tags: ['研发效能', '知识中心'],
    summary: '从模板、技能、知识库和可观测四个层面，建立可复制的研发 AI 助手运营机制。',
    cover: 'linear-gradient(135deg,#f2f3ff,#fff7e8)',
    content: '研发场景建议先从模板中心沉淀标准助手，再通过技能中心补充工具链能力。知识中心负责企业文档检索，可观测模块用于识别高价值使用场景。',
    publishedAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'n-03',
    title: '企业采购 AI 智能体服务时需要关注的五个问题',
    category: '行业资讯',
    tags: ['采购', '合规'],
    summary: '多租户隔离、审计覆盖、支付结算、组织同步、员工端体验，是首轮评估中最容易被忽略的五项。',
    cover: 'linear-gradient(135deg,#edf8f0,#f8f2ff)',
    content: '企业采购不应只看模型能力，还需要关注组织与权限是否能落地，审计是否完整，业务数据是否保留在客户自己的租户边界内。',
    publishedAt: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm'),
  },
];

const adminTenants: AdminTenant[] = [
  { id: 't-01', name: '云岭制造', code: '91310115MA1K000001', createdAt: '2026-03-04', ownerSales: '陈默', accountManager: '周安', seatUsage: '68 / 250', monthToken: 920000, status: 'normal' },
  { id: 't-02', name: '北辰科技', code: '91310115MA1K000002', createdAt: '2026-03-18', ownerSales: '林嘉', accountManager: '孟琪', seatUsage: '42 / 125', monthToken: 760000, status: 'normal' },
  { id: 't-03', name: '星河财税', code: '91310115MA1K000003', createdAt: '2026-04-02', ownerSales: '陈默', accountManager: '周安', seatUsage: '12 / 60', monthToken: 630000, status: 'arrears' },
  { id: 't-04', name: '灵川生物', code: '91310115MA1K000004', createdAt: '2026-04-10', ownerSales: '许宁', accountManager: '孟琪', seatUsage: '8 / 30', monthToken: 510000, status: 'paused' },
];

const platformOrders: PlatformOrder[] = [
  { id: 'ORD-20260424-001', tenant: '云岭制造', product: '席位组合包', amount: 32800, paymentMethod: 'bank_transfer', status: 'paid', ownerSales: '陈默', createdAt: '2026-04-24 10:24' },
  { id: 'ORD-20260423-018', tenant: '北辰科技', product: '席位组合包', amount: 12000, paymentMethod: 'bank_transfer', status: 'paid', ownerSales: '林嘉', createdAt: '2026-04-23 16:11' },
  { id: 'ORD-20260422-006', tenant: '星河财税', product: '席位组合包', amount: 21800, paymentMethod: 'bank_transfer', status: 'pending_review', ownerSales: '陈默', createdAt: '2026-04-22 09:31' },
  { id: 'ORD-20260418-031', tenant: '灵川生物', product: '席位组合包', amount: 6800, paymentMethod: 'bank_transfer', status: 'pending_review', ownerSales: '许宁', createdAt: '2026-04-18 15:09' },
];

const salesProfiles: SalesProfile[] = [
  { id: 's-01', name: '陈默', region: '华东', customers: 18, monthGmv: 86200, rank: 1, status: '在职' },
  { id: 's-02', name: '林嘉', region: '华北', customers: 13, monthGmv: 62800, rank: 2, status: '在职' },
  { id: 's-03', name: '许宁', region: '华南', customers: 9, monthGmv: 38400, rank: 3, status: '在职' },
  { id: 's-04', name: '沈南', region: '华东', customers: 2, monthGmv: 0, rank: 4, status: '停用' },
];

const commissionRecords: CommissionRecord[] = [
  { id: 'cm-001', orderId: 'ORD-20260424-001', tenant: '云岭制造', sales: '陈默', amount: 32800, commission: 1640, basis: '5% × 订单金额 × 归属期内', status: '未发放', createdAt: '2026-04-24 10:24' },
  { id: 'cm-002', orderId: 'ORD-20260423-018', tenant: '北辰科技', sales: '林嘉', amount: 12000, commission: 600, basis: '5% × 订单金额 × 归属期内', status: '已发放', createdAt: '2026-04-23 16:11' },
  { id: 'cm-003', orderId: 'ORD-20260422-006', tenant: '星河财税', sales: '陈默', amount: 21800, commission: 1090, basis: '5% × 订单金额 × 待支付', status: '未发放', createdAt: '2026-04-22 09:31' },
  { id: 'cm-004', orderId: 'ORD-20260418-031', tenant: '灵川生物', sales: '许宁', amount: 6800, commission: 0, basis: '取消订单不计佣金', status: '已撤销', createdAt: '2026-04-18 15:09' },
];

const consultLeads: ConsultLead[] = [
  { id: 'lead-001', company: '苏州启明制造', contact: '梁晨', phone: '13800001111', source: '官网咨询', assignedSales: '陈默', status: '跟进中', createdAt: '2026-04-24 09:20' },
  { id: 'lead-002', company: '杭州数智财税', contact: '唐雨', phone: '13800002222', source: '资讯页', assignedSales: '-', status: '待认领', createdAt: '2026-04-23 18:42' },
  { id: 'lead-003', company: '武汉星程生物', contact: '赵敏', phone: '13800003333', source: '销售转介绍', assignedSales: '许宁', status: '已转客户', createdAt: '2026-04-22 14:08' },
];

const pricingPlans: PricingPlan[] = [
  { id: 'price-lite', name: '轻量版', monthlyPrice: 299, quarterlyPrice: 799, yearlyPrice: 2980, status: '上线' },
  { id: 'price-standard', name: '标准版', monthlyPrice: 699, quarterlyPrice: 1880, yearlyPrice: 6980, status: '上线' },
  { id: 'price-pro', name: '高级版', monthlyPrice: 1299, quarterlyPrice: 3480, yearlyPrice: 12800, status: '上线' },
  { id: 'price-ultimate', name: '旗舰版', monthlyPrice: 2599, quarterlyPrice: 6980, yearlyPrice: 25800, status: '下线' },
];

const adminNews: AdminNewsItem[] = [
  { id: 'admin-news-01', title: 'ArkClaw 企业版新增 ClawSentry 防护规则模板', category: '产品动态', status: '已发布', author: '运营组', updatedAt: '2026-04-23 19:10' },
  { id: 'admin-news-02', title: 'AI 代理平台在研发效能场景的落地路径', category: '最佳实践', status: '已发布', author: '运营组', updatedAt: '2026-04-20 11:35' },
  { id: 'admin-news-03', title: '企业采购 AI 智能体服务时需要关注的五个问题', category: '行业资讯', status: '草稿', author: '市场组', updatedAt: '2026-04-18 16:02' },
];

const auditItems: AuditItem[] = [
  { id: 'audit-001', actor: '王总', role: '超级管理员', action: '调整席位', target: '云岭制造', createdAt: '2026-04-24 10:40' },
  { id: 'audit-002', actor: '交付一组', role: '交付运维', action: '保存网络配置', target: '北辰科技', createdAt: '2026-04-24 09:12' },
  { id: 'audit-003', actor: '陈默', role: '销售', action: '新增客户跟进', target: '星河财税', createdAt: '2026-04-23 17:08' },
];

const batchJobTargets: BatchJobTarget[] = [
  { id: 'claw-001', name: '研发助手-01', tag: '研发', caller: '陈辰', status: '运行中' },
  { id: 'claw-002', name: '销售助理-02', tag: '销售', caller: '王敏', status: '空闲' },
  { id: 'claw-003', name: '知识机器人-03', tag: '知识库', caller: '李想', status: '异常' },
  { id: 'claw-004', name: '客服助手-04', tag: '客服', caller: '周岚', status: '空闲' },
];

const batchJobs: BatchJobRecord[] = [
  {
    id: 'job-001',
    name: '批量重载运行时配置',
    type: '实例命令',
    status: '执行中',
    commandName: 'reload-runtime',
    executor: '手动执行',
    result: '48/64 成功',
    description: '刷新运行时环境变量并重启 worker 进程',
    startedAt: '2026-04-24 10:18:22',
    endedAt: '-',
  },
  {
    id: 'job-002',
    name: '灰度发布知识索引插件',
    type: '版本发布',
    status: '成功',
    commandName: 'knowledge-index-v1.6.2',
    executor: '定时执行',
    result: '32/32 成功',
    description: '灰度发布到研发与知识库实例',
    startedAt: '2026-04-24 02:00:00',
    endedAt: '2026-04-24 02:06:18',
  },
  {
    id: 'job-003',
    name: '批量采集诊断日志',
    type: '脚本执行',
    status: '失败',
    commandName: 'collect-diagnostics.sh',
    executor: '手动执行',
    result: '13/20 成功',
    description: '拉取最近 2 小时日志并写入诊断桶',
    startedAt: '2026-04-23 16:40:10',
    endedAt: '2026-04-23 16:58:41',
  },
];

const batchVersions: BatchVersionRecord[] = [
  {
    id: 'batch-version-105',
    version: '1.0.5',
    versionId: 'av-yegvy0zif4q0328cv0qs-1-0-5',
    description: '版本更新至 1.0.5 升级 oneagent 和 apm 插件，升级安全插件 Highlights - openclaw 核心能力增强。',
    updatedAt: '2026-04-25 00:47:21',
    latestAction: '详情',
    secondaryAction: '更新新版本',
  },
  {
    id: 'batch-version-104',
    version: '1.0.4',
    versionId: 'av-yegvy0zif4q0328cv0qs-1-0-4',
    description: '版本更新至 1.0.4 升级 oneagent 和 apm 插件，升级安全插件 Highlights - openclaw 核心能力增强。',
    updatedAt: '2026-04-20 17:43:04',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
  {
    id: 'batch-version-103',
    version: '1.0.3',
    versionId: 'av-yegvy0zif4q0328cv0qs-1-0-3',
    description: '升级 oneagent 和 apm 插件，升级安全插件 Highlights - 升级 oneagent 和 apm 插件。',
    updatedAt: '2026-04-17 17:12:23',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
  {
    id: 'batch-version-102',
    version: '1.0.2',
    versionId: 'av-yegvy0zif4q0328cv0qs-1-0-2',
    description: 'memory-lancedb-ultra 升级至 2.1.1 版本，memory-lancedb-ultra 升级至 2.1.1 版本 Highlights。',
    updatedAt: '2026-04-15 22:42:17',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
  {
    id: 'batch-version-101',
    version: '1.0.1',
    versionId: 'av-yegvy0zif4q0328cv0qs-1-0-1',
    description: 'Arkclaw 升级到 3.28，openclaw 版本升级到 3.28，核心能力与体验升级。',
    updatedAt: '2026-04-14 22:21:25',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
  {
    id: 'batch-version-100',
    version: '1.0.0',
    versionId: 'av-yegvy0zif4q0328cv0qs',
    description: 'Arkclaw 升级到 3.28，openclaw 版本升级到 3.28，核心能力与体验升级。',
    updatedAt: '2026-04-10 22:59:48',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
  {
    id: 'batch-version-013',
    version: '0.0.13',
    versionId: 'av-yegvy0zif4q7oi5cv0qs',
    description: 'openclaw 版本升级到 3.13，openclaw 版本升级到 3.13 Highlights - openclaw 版本能力更新。',
    updatedAt: '2026-04-10 22:39:47',
    latestAction: '详情',
    secondaryAction: '历史版本',
  },
];

const tenantAuditRecords: TenantAuditRecord[] = [
  {
    id: 'taudit-001',
    eventName: '发布 Claw 版本',
    resourceName: 'knowledge-index-v1.6.2',
    resourceId: 'rel-20260424-01',
    result: '成功',
    operatorId: 'u_chenchen',
    operatorEmail: 'chenchen@example.com',
    operatedAt: '2026-04-24 14:37:16',
  },
  {
    id: 'taudit-002',
    eventName: '修改回调配置',
    resourceName: '飞书绑定配置',
    resourceId: 'binding-feishu-main',
    result: '成功',
    operatorId: 'u_wangmin',
    operatorEmail: 'wangmin@example.com',
    operatedAt: '2026-04-24 13:08:55',
  },
  {
    id: 'taudit-003',
    eventName: '执行批量脚本',
    resourceName: 'collect-diagnostics.sh',
    resourceId: 'job-003',
    result: '失败',
    operatorId: 'u_lixiang',
    operatorEmail: 'lixiang@example.com',
    operatedAt: '2026-04-23 16:58:41',
  },
  {
    id: 'taudit-004',
    eventName: '启用告警模板',
    resourceName: 'Claw 实例内存使用过高',
    resourceId: 'alert-memory-01',
    result: '成功',
    operatorId: 'u_zhoulan',
    operatorEmail: 'zhoulan@example.com',
    operatedAt: '2026-04-23 11:19:08',
  },
];

const observabilityUsageMetrics: ObservabilityMetricCard[] = [
  { label: '输入 Tokens（含缓存 Tokens）', value: '1.14', unit: 'Mil', trend: '环比 0%' },
  { label: '输入 Tokens（不含缓存 Tokens）', value: '228.15', unit: 'K', trend: '环比 0%' },
  { label: '输入 Tokens 缓存命中率', value: '80.06', unit: '%', trend: '环比 0%' },
  { label: '上下文使用 Tokens', value: '286.90', unit: 'K', trend: '环比 0%' },
  { label: '输出 Tokens', value: '12.10', unit: 'K', trend: '环比 0%' },
];

const observabilityTopUsers: ObservabilityRankingItem[] = [
  { name: 'user_email', value: '240.24 K' },
  { name: 'ops@example.com', value: '188.12 K' },
  { name: 'qa@example.com', value: '96.48 K' },
];

const observabilityTopClaws: ObservabilityRankingItem[] = [
  { name: 'ci-ykel8qeuoyo1tymzbspg', value: '240.24 K' },
  { name: 'agent-rd-hotfix-01', value: '175.20 K' },
  { name: 'sales-assistant-east', value: '88.12 K' },
];

const observabilityBottomUsers: ObservabilityRankingItem[] = [
  { name: 'support@example.com', value: '12.40 K' },
  { name: 'pm@example.com', value: '8.20 K' },
  { name: 'guest@example.com', value: '3.60 K' },
];

const observabilityBottomClaws: ObservabilityRankingItem[] = [
  { name: 'archive-knowledge-bot', value: '12.80 K' },
  { name: 'new-hire-guide', value: '7.65 K' },
  { name: 'internal-demo', value: '2.31 K' },
];

const observabilitySkillVisits: ObservabilityRankingItem[] = [
  { name: 'byted-seedream-image-generate', value: '2.00' },
  { name: 'browser', value: '1.62' },
  { name: 'sql-runner', value: '1.28' },
];

const observabilityModelDistribution = [
  { name: 'doubao-seed-2.0-pro', value: 68 },
  { name: 'doubao-seed-2.0', value: 22 },
  { name: 'doubao-seed-1.6', value: 10 },
];

const observabilityTokenTrend: ObservabilityTrendPoint[] = Array.from({ length: 12 }).map((_, index) => ({
  time: dayjs('2026-04-23 04:00:00').add(index * 3, 'hour').format('MM/DD HH:mm'),
  inputTokens: [62, 55, 48, 46, 42, 40, 38, 120, 78, 56, 52, 44][index] * 1000,
  outputTokens: [8, 7, 6, 5, 4, 4, 3, 18, 10, 8, 7, 6][index] * 1000,
  cacheHitTokens: [220, 180, 140, 120, 100, 90, 88, 520, 140, 80, 40, 18][index] * 1000,
  latency: [680, 640, 620, 610, 605, 590, 580, 920, 760, 700, 660, 618][index],
}));

const observabilityUsageDetails: ObservabilityUsageDetail[] = [
  { id: 'usage-001', instanceName: '研发助手-01', inputTokens: '228 K', outputTokens: '12.1 K', totalTokens: '240 K' },
  { id: 'usage-002', instanceName: '知识机器人-03', inputTokens: '176 K', outputTokens: '9.6 K', totalTokens: '185.6 K' },
  { id: 'usage-003', instanceName: '销售助理-02', inputTokens: '88 K', outputTokens: '4.2 K', totalTokens: '92.2 K' },
];

const observabilitySessions = [
  {
    id: 'session-001',
    duration: '83 s',
    totalTokens: '16.3 K',
    inputTokens: '14.8 K',
    outputTokens: '1.5 K',
    calls: 12,
    userId: 'user_email',
    startedAt: '2026-04-24 14:20:18',
    lastCalledAt: '2026-04-24 14:21:41',
  },
  {
    id: 'session-002',
    duration: '41 s',
    totalTokens: '8.4 K',
    inputTokens: '7.2 K',
    outputTokens: '1.2 K',
    calls: 6,
    userId: 'ops@example.com',
    startedAt: '2026-04-24 13:48:10',
    lastCalledAt: '2026-04-24 13:48:51',
  },
  {
    id: 'session-003',
    duration: '126 s',
    totalTokens: '22.9 K',
    inputTokens: '19.7 K',
    outputTokens: '3.2 K',
    calls: 18,
    userId: 'qa@example.com',
    startedAt: '2026-04-24 12:07:42',
    lastCalledAt: '2026-04-24 12:09:48',
  },
];

const observabilityPerformanceMetrics: ObservabilityMetricCard[] = [
  { label: '平均响应耗时', value: '618', unit: 'ms', trend: '环比 -4.8%' },
  { label: 'P95 响应耗时', value: '1.92', unit: 's', trend: '环比 -2.1%' },
  { label: '成功率', value: '99.23', unit: '%', trend: '环比 +0.4%' },
  { label: 'QPS 峰值', value: '42', unit: '', trend: '环比 +3.2%' },
];

const observabilityEndpoints: ObservabilityEndpointRecord[] = [
  { id: 'perf-001', endpoint: '/api/v1/chat/completions', avgLatency: '612 ms', p95Latency: '1.84 s', successRate: '99.62%', requests: '42.8 K' },
  { id: 'perf-002', endpoint: '/api/v1/knowledge/search', avgLatency: '428 ms', p95Latency: '1.11 s', successRate: '99.80%', requests: '18.2 K' },
  { id: 'perf-003', endpoint: '/api/v1/plugins/run', avgLatency: '782 ms', p95Latency: '2.34 s', successRate: '98.91%', requests: '7.4 K' },
];

const observabilityLogStats: ObservabilityLogStat[] = [
  { level: 'INFO', count: 1420 },
  { level: 'WARN', count: 86 },
  { level: 'ERROR', count: 14 },
];

const observabilityLogRecords: ObservabilityLogRecord[] = [
  { id: 'log-001', timestamp: '2026-04-24 14:22:08', level: 'WARN', source: 'runtime-gateway', message: '模型调用耗时超过阈值，trace=tr_29f31' },
  { id: 'log-002', timestamp: '2026-04-24 14:18:16', level: 'ERROR', source: 'knowledge-indexer', message: '向量索引刷新失败，retry=2' },
  { id: 'log-003', timestamp: '2026-04-24 14:12:04', level: 'INFO', source: 'ops-script', message: 'collect-diagnostics.sh 执行完成' },
];

const observabilityTraceRecords: ObservabilityTraceRecord[] = [
  { id: 'trace-001', traceId: 'tr_29f31a8b2e7', spanName: 'chat.completion', duration: '1.84 s', status: '告警', service: 'runtime-gateway', occurredAt: '2026-04-24 14:22:08' },
  { id: 'trace-002', traceId: 'tr_51a9cb330df', spanName: 'knowledge.search', duration: '642 ms', status: '正常', service: 'knowledge-indexer', occurredAt: '2026-04-24 14:18:16' },
  { id: 'trace-003', traceId: 'tr_77eb9cdd104', spanName: 'plugin.execute', duration: '2.46 s', status: '异常', service: 'plugin-runner', occurredAt: '2026-04-24 13:52:40' },
];

const observabilityAlertTemplates: ObservabilityAlertTemplate[] = [
  { id: 'alert-001', name: 'Claw 磁盘读带宽持续升高', description: 'Claw 磁盘读带宽高告警模板', type: 'Claw', version: 'v1.0.0', ruleCount: 1, scopeCount: 0, status: '未启用', updatedAt: '2026-04-21 23:13:05', updatedBy: 'admin' },
  { id: 'alert-002', name: 'Claw 磁盘读 IOPS 持续升高', description: 'Claw 磁盘读 IOPS 持续升高告警模板', type: 'Claw', version: 'v1.0.0', ruleCount: 1, scopeCount: 0, status: '未启用', updatedAt: '2026-04-21 22:57:34', updatedBy: 'admin' },
  { id: 'alert-003', name: 'Claw 实例内存使用过高', description: 'Claw 实例内存使用过高', type: 'Claw', version: 'v1.0.0', ruleCount: 1, scopeCount: 0, status: '已启用', updatedAt: '2026-04-21 22:50:31', updatedBy: 'admin' },
  { id: 'alert-004', name: 'Claw 实例 CPU 使用过高', description: 'Claw 实例 CPU 使用过高', type: 'Claw', version: 'v1.0.0', ruleCount: 1, scopeCount: 0, status: '未启用', updatedAt: '2026-04-21 22:48:19', updatedBy: 'admin' },
];

const tenantObservabilityData: TenantObservabilityData = {
  usageMetrics: observabilityUsageMetrics,
  tokenTopUsers: observabilityTopUsers,
  tokenTopClaws: observabilityTopClaws,
  tokenBottomUsers: observabilityBottomUsers,
  tokenBottomClaws: observabilityBottomClaws,
  skillVisits: observabilitySkillVisits,
  modelDistribution: observabilityModelDistribution,
  tokenTrend: observabilityTokenTrend,
  usageDetails: observabilityUsageDetails,
  sessionRecords: observabilitySessions,
  performanceMetrics: observabilityPerformanceMetrics,
  performanceTrend: observabilityTokenTrend,
  performanceEndpoints: observabilityEndpoints,
  logStats: observabilityLogStats,
  logRecords: observabilityLogRecords,
  traceRecords: observabilityTraceRecords,
  alertTemplates: observabilityAlertTemplates,
};

const opsTickets: OpsTicket[] = [
  { id: 'TK-240424-001', tenant: '云岭制造', type: '绑定配置', assignee: '交付一组', sla: '4h', status: '处理中', updatedAt: '2026-04-24 10:12' },
  { id: 'TK-240424-002', tenant: '北辰科技', type: '网络', assignee: '交付二组', sla: '8h', status: '待客户确认', updatedAt: '2026-04-24 09:50' },
  { id: 'TK-240423-014', tenant: '星河财税', type: '绑定配置', assignee: '-', sla: '2h', status: '待分派', updatedAt: '2026-04-23 18:42' },
  { id: 'TK-240422-009', tenant: '灵川生物', type: '客户技术支持', assignee: '交付一组', sla: '24h', status: '已完成', updatedAt: '2026-04-22 16:01' },
];

const opsBindings: OpsBinding[] = [
  { id: 'bind-001', tenant: '云岭制造', channel: '企业微信', appId: 'ww9f3***28', callbackUrl: 'https://api.yunnao.example/wecom/callback', status: '测试通过', updatedAt: '2026-04-24 10:20' },
  { id: 'bind-002', tenant: '北辰科技', channel: '飞书', appId: 'cli_a3***p9', callbackUrl: 'https://api.yunnao.example/feishu/callback', status: '异常', updatedAt: '2026-04-23 14:08' },
  { id: 'bind-003', tenant: '星河财税', channel: '钉钉', appId: '-', callbackUrl: '-', status: '未配置', updatedAt: '2026-04-22 09:12' },
];

const opsNetworks: OpsNetwork[] = [
  { id: 'net-001', tenant: '云岭制造', publicIngress: '已启用', publicEgress: '固定 IP', privateEgress: 'VPC-ynzl-01', customDomain: 'ai.yunling.example', status: '已开通' },
  { id: 'net-002', tenant: '北辰科技', publicIngress: '配置中', publicEgress: '固定 IP', privateEgress: '-', customDomain: 'claw.beichen.example', status: '配置中' },
  { id: 'net-003', tenant: '星河财税', publicIngress: '-', publicEgress: '-', privateEgress: '-', customDomain: '-', status: '未开通' },
];

const opsDiagnostics: OpsDiagnostic[] = [
  { id: 'diag-001', tenant: '云岭制造', item: '最近错误日志', result: '警告', detail: '过去 1 小时 3 条模型调用超时', checkedAt: '2026-04-24 10:32' },
  { id: 'diag-002', tenant: '云岭制造', item: '网络连通性', result: '正常', detail: '公网入口、私网出口均连通', checkedAt: '2026-04-24 10:32' },
  { id: 'diag-003', tenant: '北辰科技', item: '组织同步', result: '异常', detail: '飞书 Secret 校验失败', checkedAt: '2026-04-24 09:48' },
];

let tenantNetworkConfig: TenantNetworkConfig = {
  publicIngress: {
    loginUrl: 'https://sd7jhsmorppi4rsvbct2g.apigateway-cn-beijing.volceapi.com',
    customDomainEnabled: true,
    customDomain: 'arkclaw.instaup.cn',
    certificateName: '上传instaup证书',
    certificateStatus: 'configured',
    redirectStatus: '未配置',
  },
  publicEgress: {
    enabled: true,
    accelerationEnabled: false,
    accelerationDomain: '',
  },
  privateEgress: {
    enabled: false,
    project: 'default',
    vpc: '',
    zones: [],
    securityGroup: '',
    targetIpRange: '',
    dnsResolutionEnabled: false,
  },
  options: {
    certificateOptions: ['上传instaup证书', '企业主站证书', 'fallback-wildcard 证书'],
    projectOptions: ['default', 'ynzl-sz', 'default(默认项目)'],
    vpcOptions: ['vpc-ynzl-prod', 'vpc-ynzl-staging', 'vpc-arkclaw-shared'],
    zoneOptions: ['可用区A', '可用区B', '可用区C', '可用区D', '可用区E'],
    securityGroupOptions: ['sg-arkclaw-prod', 'sg-arkclaw-default', 'sg-internal-service'],
  },
};

const salesInvites: SalesInvite[] = [
  { id: 'inv-001', code: 'YZN8K2', url: 'https://arkclaw.yunnao.example/register?sales=cm-2048', limit: '不限次数', used: 12, expiresAt: '2026-06-30', status: '启用' },
  { id: 'inv-002', code: 'BC7P2Q', url: 'https://arkclaw.yunnao.example/register?sales=cm-2048&campaign=q2', limit: '50 次', used: 18, expiresAt: '2026-05-31', status: '启用' },
  { id: 'inv-003', code: 'OLD9X1', url: 'https://arkclaw.yunnao.example/register?sales=cm-2048&campaign=old', limit: '20 次', used: 20, expiresAt: '2026-03-31', status: '停用' },
];

const dispatchCandidates: TemplateDispatchCandidate[] = quotas.map((item) => ({
  id: item.id,
  name: item.name,
  email: item.email,
  group: item.group,
  avatarText: item.name.slice(0, 1),
}));

const skillCategories = [
  { id: 'all', label: '全部' },
  { id: 'productivity', label: '效率工具' },
  { id: 'development', label: '研发协作' },
  { id: 'operations', label: '运维诊断' },
  { id: 'knowledge', label: '知识检索' },
  { id: 'security', label: '安全治理' },
];

const skillCards: SkillCard[] = [
  {
    id: 'skill-001',
    name: 'Browser',
    description: '为 ArkClaw 增加网页检索、页面抓取与表单操作能力，适合调研和业务巡检。',
    category: 'productivity',
    scene: '通用办公',
    source: '官方',
    type: '工具',
    tags: ['检索', '页面操作'],
    rating: 4.9,
    downloads: 1236,
    coverTone: 'blue',
  },
  {
    id: 'skill-002',
    name: 'SQL Runner',
    description: '在受控环境下执行查询语句，帮助业务和研发团队快速定位数据问题。',
    category: 'development',
    scene: '研发协作',
    source: '官方',
    type: '工具',
    tags: ['数据库', '分析'],
    rating: 4.8,
    downloads: 962,
    coverTone: 'cyan',
  },
  {
    id: 'skill-003',
    name: 'Meeting Notes',
    description: '自动整理会议纪要、行动项与跟进节点，适合跨团队协作场景。',
    category: 'productivity',
    scene: '协同办公',
    source: '企业',
    type: '工作流',
    tags: ['纪要', '协同'],
    rating: 4.7,
    downloads: 786,
    coverTone: 'violet',
  },
  {
    id: 'skill-004',
    name: 'Issue Tracker',
    description: '连接工单与缺陷系统，汇总待办、优先级和负责人状态。',
    category: 'operations',
    scene: '运维治理',
    source: '企业',
    type: '工作流',
    tags: ['工单', '追踪'],
    rating: 4.6,
    downloads: 612,
    coverTone: 'gold',
  },
  {
    id: 'skill-005',
    name: 'DeepSearch',
    description: '对企业文档与外部资料做深度检索，生成结构化调研摘要。',
    category: 'knowledge',
    scene: '知识检索',
    source: '官方',
    type: '知识',
    tags: ['调研', '摘要'],
    rating: 5,
    downloads: 1648,
    coverTone: 'blue',
  },
  {
    id: 'skill-006',
    name: 'Claw Audit Lens',
    description: '按风险等级聚合安全事件，辅助空间管理员巡检策略与审计日志。',
    category: 'security',
    scene: '安全治理',
    source: '企业',
    type: '工具',
    tags: ['审计', '安全'],
    rating: 4.8,
    downloads: 433,
    coverTone: 'cyan',
  },
];

const appCenterData: AppCenterData = {
  statusOptions: [
    { label: '全部状态', value: 'all' },
    { label: '已启用', value: 'enabled' },
    { label: '待配置', value: 'draft' },
  ],
  sourceOptions: [
    { label: '全部来源', value: 'all' },
    { label: '企业自建', value: 'enterprise' },
    { label: '官方托管', value: 'managed' },
  ],
};

const appRegistrationPreset: AppRegistrationPreset = {
  sourceOptions: ['企业自建', '官方托管'],
  agentRuntimeOptions: ['Doubao Agent Runtime', 'OpenAI Responses Runtime', '自定义 HTTP Runtime'],
  mcpProtocolOptions: ['Streamable HTTP MCP', 'SSE MCP', 'StdIO Gateway'],
};

let brandCustomizations: BrandCustomization[] = [
  {
    id: 'brand-yunnao',
    name: '云脑智联',
    status: 'active',
    companyName: '云脑智联',
    primarySlogan: '7x24小时在线的专属智能伙伴',
    secondarySlogan: '从聊天到执行，让 AI 真正完成工作，一站式管理多个智能伙伴实例，深度集成火山引擎与飞书生态。',
    docLinkLabel: '帮助文档',
    docLinkUrl: 'https://docs.arkclaw.example/brand',
    loginBackground: {
      name: 'ynzl-login-background.png',
      tone: 'galaxy',
    },
    homeBanner: {
      name: 'ynzl-home-banner.png',
      tone: 'aurora',
    },
    welcomeTitle: '欢迎使用 ArkClaw',
    helperDescription: 'ArkClaw会帮助你自动执行任务、处理流程、分析数据与生成内容，让工作更高效、更智能。',
    userSideLogo: {
      name: 'ynzl-side-logo.png',
      tone: 'logo',
    },
    securityLinkLabel: '隐私协议',
    securityLinkUrl: 'https://arkclaw.example/privacy',
    updatedAt: '2026-04-23 18:13:43',
  },
];

let workbenchConfig: WorkbenchConfig = {
  conversationAbilities: [
    { key: 'thinking-mode', label: '思考模式切换', enabled: true },
    { key: 'multimodal-input', label: '多模态输入', enabled: true },
    { key: 'clawteam', label: 'ClawTeam', enabled: true },
  ],
  scheduledTaskEnabled: true,
  messageChannels: [
    { key: 'feishu', label: '飞书', enabled: true, bindStatus: '已绑定', bindHint: '企业应用已连接' },
    { key: 'dingtalk', label: '钉钉', enabled: true, bindStatus: '已绑定', bindHint: '回调地址已配置' },
    { key: 'wecom', label: '企业微信', enabled: true, bindStatus: '已绑定', bindHint: '通讯录同步中' },
    { key: 'wechat', label: '微信', enabled: false, bindStatus: '未绑定', bindHint: '需先完成渠道接入' },
  ],
  basicSettings: [
    { key: 'detail-page', label: '详情页', enabled: true },
    { key: 'one-click-analysis', label: '一键诊断', enabled: true },
    { key: 'quick-image', label: '快捷出图', enabled: true },
    { key: 'template-promotion', label: '复制模板推广', enabled: true },
    { key: 'model-config', label: '配置模型', enabled: true },
    { key: 'cloud-disk', label: '网盘', enabled: true },
    { key: 'migration', label: '迁移 OpenClaw 至 ArkClaw', enabled: true },
    { key: 'backup', label: '数据备份', enabled: true },
    { key: 'memory', label: '记忆管理', enabled: true },
    { key: 'cloud-pc', label: '云电脑', enabled: true },
  ],
  quickCommandEnabled: true,
  personaShortcutEnabled: true,
  skillQuickInstallEnabled: true,
  applicationModeEnabled: false,
};

let launchSpaceSetup: LaunchSpaceSetup = {
  authMethod: 'feishu',
  projectName: 'default(默认项目)',
  regionName: '华东 2（上海）',
  feishuAppId: '',
  feishuAppSecret: '',
  wecomCorpId: '',
  wecomAgentId: '',
  wecomAgentSecret: '',
  dingtalkAppId: '',
  dingtalkClientId: '',
  dingtalkClientSecret: '',
};

let agentWebsiteConfig: AgentWebsiteConfig = {
  companyName: '启明智造数字化服务中心',
  logoFileName: 'qiming-ai-logo.png',
  contactItems: ['服务热线：400-800-2026', '商务微信：qiming-ai'],
  wechatQrFileName: 'qiming-service-account-qr.png',
  updatedAt: '2026-05-15 10:00:00',
};

const cloneBrandAsset = (asset: BrandCustomization['loginBackground']) =>
  asset ? { ...asset } : null;

const cloneBrandCustomization = (brand: BrandCustomization): BrandCustomization => ({
  ...brand,
  loginBackground: cloneBrandAsset(brand.loginBackground),
  homeBanner: cloneBrandAsset(brand.homeBanner),
  userSideLogo: cloneBrandAsset(brand.userSideLogo),
});

const cloneWorkbenchConfig = (config: WorkbenchConfig): WorkbenchConfig => ({
  conversationAbilities: config.conversationAbilities.map((item) => ({ ...item })),
  scheduledTaskEnabled: config.scheduledTaskEnabled,
  messageChannels: config.messageChannels.map((item) => ({ ...item })),
  basicSettings: config.basicSettings.map((item) => ({ ...item })),
  quickCommandEnabled: config.quickCommandEnabled,
  personaShortcutEnabled: config.personaShortcutEnabled,
  skillQuickInstallEnabled: config.skillQuickInstallEnabled,
  applicationModeEnabled: config.applicationModeEnabled,
});

const cloneLaunchSpaceSetup = (config: LaunchSpaceSetup): LaunchSpaceSetup => ({
  ...config,
});

const knowledgeLibraryOptions: KnowledgeLibraryOption[] = [
  { id: 'lib-001', name: 'viking-customer-success', region: '华东 2（上海）' },
  { id: 'lib-002', name: 'viking-rd-wiki', region: '华北 2（北京）' },
  { id: 'lib-003', name: 'viking-sales-playbook', region: '华东 2（上海）' },
];

const knowledgeFeaturedSources: KnowledgeSourceCard[] = [
  {
    id: 'source-viking',
    name: 'Viking 知识库',
    description: '连接企业知识库、说明文档和结构化资料，为 ArkClaw 提供检索上下文。',
    family: 'knowledge',
    accent: 'blue',
  },
  {
    id: 'source-docs',
    name: '文档与文件',
    description: '适合共享文档、运营手册、FAQ 和标准流程资料。',
    family: 'knowledge',
    accent: 'cyan',
  },
];

const knowledgeDatabaseSources: KnowledgeSourceCard[] = [
  {
    id: 'source-mysql',
    name: 'MySQL',
    description: '连接业务数据库，支持将结构化数据纳入检索与问答链路。',
    family: 'database',
    accent: 'gold',
  },
  {
    id: 'source-postgres',
    name: 'PostgreSQL',
    description: '适合数据平台与分析团队，以只读方式接入企业数据源。',
    family: 'database',
    accent: 'violet',
  },
  {
    id: 'source-es',
    name: 'Elasticsearch',
    description: '接入搜索与日志索引，构建诊断和可观测知识视图。',
    family: 'database',
    accent: 'cyan',
  },
  {
    id: 'source-redis',
    name: 'Redis',
    description: '补充缓存态和热点键值信息，适合诊断与运营辅助。',
    family: 'database',
    accent: 'blue',
  },
];

const knowledgeCenterData: KnowledgeCenterData = {
  guideSteps: [
    {
      id: 'step-1',
      title: '连接数据源',
      description: '接入企业知识库、文档和数据库，建立统一检索入口。',
    },
    {
      id: 'step-2',
      title: '配置权限（即将上线）',
      description: '按空间、部门和角色定义可访问的数据边界。',
    },
    {
      id: 'step-3',
      title: 'ArkClaw 中检索使用',
      description: '在模版、技能和 Claw 助手中调用知识检索能力。',
    },
  ],
  featuredSources: knowledgeFeaturedSources,
  databaseSources: knowledgeDatabaseSources,
  libraryOptions: knowledgeLibraryOptions,
};

const userManagementData: UserManagementData = {
  activeTab: 'employees',
  authChannel: '企业微信',
  warningText: '检测到员工信息缺失，请及时更新以保障使用',
  employeeCount: 3,
  departmentPanelTabs: [
    { key: 'org', label: '组织部门' },
    { key: 'custom', label: '自定义分组' },
  ],
  departmentNodes: [],
  customGroups: [],
  departmentLeaderOptions: [
    { label: '刘书言', value: '刘书言' },
    { label: '李磊', value: '李磊' },
    { label: '黄玉婧', value: '黄玉婧' },
  ],
  parentDepartmentOptions: [
    { label: '无上级部门', value: 'root' },
    { label: '研发中心', value: 'dept-rd' },
    { label: '销售中心', value: 'dept-sales' },
  ],
  loginConfig: {
    callbackUrl: 'sd7jhsmorppi4rsvbct2g.apigateway-cn-beijing.volceapi.com',
    loginUrl: 'https://sd7jhsmorppi4rsvbct2g.apigateway-cn-beijing.volceapi.com',
    authChannel: '企业微信',
    agentId: '1000004',
    agentSecretMasked: '**************',
  },
};

const departmentTableRows: DepartmentTableRow[] = [];

const employeeRecords: EmployeeRecord[] = [
  {
    id: 'u-emp-01',
    name: '刘书言',
    email: '',
    phone: '',
    departmentId: undefined,
    group: '未分组',
    loginType: '企业微信',
    status: '待补充',
  },
  {
    id: 'u-emp-02',
    name: '李磊',
    email: '',
    phone: '',
    departmentId: undefined,
    group: '未分组',
    loginType: '企业微信',
    status: '待补充',
  },
  {
    id: 'u-emp-03',
    name: '黄玉婧',
    email: '',
    phone: '',
    departmentId: undefined,
    group: '未分组',
    loginType: '企业微信',
    status: '待补充',
  },
];

const syncIssues: SyncIssueRow[] = [
  {
    id: 'u-emp-01',
    name: '刘书言',
    email: '-',
    phone: '-',
    status: '待补充',
    loginType: '企业微信',
    example: '-',
  },
  {
    id: 'u-emp-02',
    name: '李磊',
    email: '-',
    phone: '-',
    status: '待补充',
    loginType: '企业微信',
    example: 'ci-yekl8geqyoo1tymzbspg 共1个',
  },
  {
    id: 'u-emp-03',
    name: '黄玉婧',
    email: '-',
    phone: '-',
    status: '待补充',
    loginType: '企业微信',
    example: '-',
  },
];

export const mockApi = {
  getOverview() {
    const data: OverviewData = {
      tenant: {
        id: 'tenant-yunzhi',
        name: '云脑智联示例空间',
        code: '91310000MA1K000000',
        industry: '人工智能服务',
        status: 'normal',
        ownerSales: '陈默',
        volcSpaceId: 'csi-yeki51qaqyocekfxmo58h',
      },
      guide: {
        authCallbackUrl: 'sd7jhsmorppi4rsvbct2g.apigateway-cn-beijing.volceapi.com',
        employeeLoginUrl: 'https://arkclaw.instaup.cn',
      },
      metrics: [
        { label: 'Claw 实例总数', value: 1 },
        { label: '活跃的用户', value: 3 },
        { label: '本月模型用量', value: '128.6 万', trend: '+18.2%' },
        { label: '审计事件', value: 924, trend: '近 24h' },
      ],
      modelConfigs: [
        {
          level: 'lite',
          name: '轻量版',
          defaultModel: 'doubao-seed-2.0-pro',
          plan: 'Coding Plan',
          optionalModels: 1,
          tokenLimit: '无限制',
          minuteTokenLimit: 0,
          dailyTokenLimit: 0,
          sources: [{ id: 'lite-1', plan: 'Coding Plan', model: 'doubao-seed-2.0-pro', isDefault: true }],
        },
        {
          level: 'standard',
          name: '标准版',
          defaultModel: '-',
          plan: '-',
          optionalModels: 0,
          tokenLimit: '无限制',
          minuteTokenLimit: 0,
          dailyTokenLimit: 0,
          sources: [],
        },
        {
          level: 'pro',
          name: '高级版',
          defaultModel: 'doubao-seed-2.0-pro',
          plan: 'Coding Plan',
          optionalModels: 1,
          tokenLimit: '无限制',
          minuteTokenLimit: 0,
          dailyTokenLimit: 0,
          sources: [{ id: 'pro-1', plan: 'Coding Plan', model: 'doubao-seed-2.0-pro', isDefault: true }],
        },
        {
          level: 'ultimate',
          name: '旗舰版',
          defaultModel: '-',
          plan: '-',
          optionalModels: 0,
          tokenLimit: '无限制',
          minuteTokenLimit: 0,
          dailyTokenLimit: 0,
          sources: [],
        },
      ],
      seats: [
        { level: 'lite', name: '轻量版（含 Team Lite）', quota: 250, used: 8, active: 0, maxApplyPerEmployee: 1, expiresAt: '2026-05-21 23:59:59' },
        { level: 'standard', name: '标准版', quota: 125, used: 0, active: 0, maxApplyPerEmployee: 1, expiresAt: '2026-05-21 23:59:59' },
        { level: 'pro', name: '高级版（含 Team Pro）', quota: 60, used: 2, active: 1, maxApplyPerEmployee: 1, expiresAt: '2026-05-21 23:59:59' },
        { level: 'ultimate', name: '旗舰版', quota: 30, used: 0, active: 0, maxApplyPerEmployee: 1, expiresAt: '2026-05-21 23:59:59' },
      ],
      settings: [
        { key: 'terminal', label: '允许员工登录 Terminal', enabled: true },
        { key: 'paste', label: '允许复制粘贴操作', enabled: true },
        { key: 'clawteam', label: '允许使用 ClawTeam', enabled: true },
        { key: 'modelSwitch', label: '允许模型切换', enabled: true },
        { key: 'multiInput', label: '允许多模输入', enabled: true },
        { key: 'booking', label: '允许使用预订任务', enabled: false },
      ],
      networkStatus: 'not_configured',
    };

    return delay(data);
  },

  getClaws(includeRecycle = false) {
    return delay(claws.filter((item) => (includeRecycle ? item.status === 'recycled' : item.status !== 'recycled')));
  },

  getClawPurchaseStatus() {
    return delay({ purchased: hasPurchasedClawSeats });
  },

  getClawTemplates(source: TemplateSource) {
    return delay((source === 'public' ? publicTemplates : customTemplates).map((item) => ({ ...item })));
  },

  getTemplatePreset() {
    return delay(templatePreset);
  },

  async createClawTemplate(payload: CreateTemplatePayload) {
    const roleTemplate = templatePreset.roleTemplates.find((item) => item.id === payload.soulTemplateId);
    const created: ClawTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      source: 'custom',
      seatLevel: payload.seatLevel,
      mirror: payload.mirror,
      coverStyle: coverBySeatLevel[payload.seatLevel],
      recommendedModel: payload.seatLevel === 'lite' ? 'doubao-seed-2.0' : 'doubao-seed-2.0-pro',
      plugins: payload.plugins,
      skills: payload.skills,
      soulMode: payload.soulMode,
      soulTemplateId: payload.soulMode === 'preset' ? payload.soulTemplateId : undefined,
      soulContent: payload.soulMode === 'preset' ? roleTemplate?.content ?? payload.soulContent : payload.soulContent,
      agentContent: payload.agentContent,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    };
    customTemplates = [created, ...customTemplates];
    return delay(created);
  },

  getTemplateDispatchCandidates() {
    return delay(dispatchCandidates);
  },

  getSkillCenterData() {
    const data: SkillCenterData = {
      categories: skillCategories,
      sceneOptions: [
        { label: '全部场景', value: 'all' },
        { label: '通用办公', value: '通用办公' },
        { label: '研发协作', value: '研发协作' },
        { label: '知识检索', value: '知识检索' },
        { label: '安全治理', value: '安全治理' },
      ],
      sourceOptions: [
        { label: '全部来源', value: 'all' },
        { label: '官方', value: '官方' },
        { label: '企业', value: '企业' },
      ],
      typeOptions: [
        { label: '全部类型', value: 'all' },
        { label: '工具', value: '工具' },
        { label: '工作流', value: '工作流' },
        { label: '知识', value: '知识' },
      ],
      plaza: skillCards,
      featured: [...skillCards].sort((left, right) => right.downloads - left.downloads).slice(0, 5),
    };

    return delay(data);
  },

  getAppCenterData() {
    return delay(appCenterData);
  },

  getAppRegistrationPreset() {
    return delay(appRegistrationPreset);
  },

  registerEnterpriseApp(payload: AppRegistrationPayload) {
    return delay({
      id: `${payload.kind}-${Date.now()}`,
      ...payload,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    });
  },

  getKnowledgeCenterData() {
    return delay(knowledgeCenterData);
  },

  connectKnowledgeSource(payload: KnowledgeConnectionPayload) {
    return delay({
      id: `knowledge-${Date.now()}`,
      ...payload,
      status: 'success',
    });
  },

  getUserManagementData() {
    return delay(userManagementData);
  },

  getDepartmentTable() {
    return delay(departmentTableRows);
  },

  getEmployeeRecords() {
    return delay(employeeRecords);
  },

  getSyncIssues() {
    return delay(syncIssues);
  },

  dispatchClawTemplate(payload: DispatchTemplatePayload) {
    return delay({
      id: `dispatch-${Date.now()}`,
      source: payload.source,
      templateId: payload.templateId,
      employeeIds: payload.employeeIds,
      count: payload.employeeIds.length,
      status: 'success',
    });
  },

  getSeatData() {
    return delay({ quotas, openingStatus: getTenantOpeningStatusSnapshot(), seats: mockApi.getOverview().then((data) => data.seats) });
  },

  async getSeats() {
    const overview = await mockApi.getOverview();
    return delay({ quotas, openingStatus: getTenantOpeningStatusSnapshot(), seats: overview.seats });
  },

  getTenantGuideVideos() {
    return delay(tenantGuideVideos.map((item) => ({ ...item })));
  },

  getTenantDocLinks() {
    return delay(tenantDocLinks.map((item) => ({ ...item })));
  },

  getAgentWebsiteConfig() {
    return delay({ ...agentWebsiteConfig, contactItems: [...agentWebsiteConfig.contactItems] });
  },

  saveAgentWebsiteConfig(payload: Omit<AgentWebsiteConfig, 'updatedAt'>) {
    agentWebsiteConfig = {
      ...payload,
      contactItems: [...payload.contactItems],
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    return delay({ ...agentWebsiteConfig, contactItems: [...agentWebsiteConfig.contactItems] });
  },

  getBrandCustomizations() {
    return delay(brandCustomizations.map(cloneBrandCustomization));
  },

  getBrandCustomization(id: string) {
    const target = brandCustomizations.find((item) => item.id === id);
    return delay(target ? cloneBrandCustomization(target) : null);
  },

  getWorkbenchConfig() {
    return delay(cloneWorkbenchConfig(workbenchConfig));
  },

  saveWorkbenchConfig(payload: WorkbenchConfig) {
    workbenchConfig = cloneWorkbenchConfig(payload);
    return delay(cloneWorkbenchConfig(workbenchConfig));
  },

  getLaunchSpaceSetup() {
    return delay(cloneLaunchSpaceSetup(launchSpaceSetup));
  },

  saveLaunchSpaceSetup(payload: LaunchSpaceSetup) {
    launchSpaceSetup = cloneLaunchSpaceSetup(payload);
    return delay(cloneLaunchSpaceSetup(launchSpaceSetup));
  },

  createBrandCustomization(payload: BrandCustomizationPayload) {
    const created: BrandCustomization = {
      id: `brand-${Date.now()}`,
      ...payload,
      status: 'draft',
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    brandCustomizations = [created, ...brandCustomizations];
    return delay(cloneBrandCustomization(created));
  },

  updateBrandCustomization(id: string, payload: BrandCustomizationPayload) {
    let saved: BrandCustomization | null = null;
    brandCustomizations = brandCustomizations.map((item) => {
      if (item.id !== id) {
        return item;
      }
      saved = {
        ...item,
        ...payload,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };
      return saved;
    });
    return delay(saved ? cloneBrandCustomization(saved) : null);
  },

  publishBrandCustomization(id: string) {
    let published: BrandCustomization | null = null;
    brandCustomizations = brandCustomizations.map((item) => {
      const nextStatus: BrandCustomization['status'] = item.id === id ? 'active' : 'draft';
      const nextItem = {
        ...item,
        status: nextStatus,
        updatedAt: item.id === id ? dayjs().format('YYYY-MM-DD HH:mm:ss') : item.updatedAt,
      };
      if (item.id === id) {
        published = nextItem;
      }
      return nextItem;
    });
    return delay(published ? cloneBrandCustomization(published) : null);
  },

  deleteBrandCustomization(id: string) {
    brandCustomizations = brandCustomizations.filter((item) => item.id !== id);
    return delay({ success: true });
  },

  getBilling() {
    const adminOrders = getTenantBillingOrdersSnapshot();
    const orderIds = new Set(adminOrders.map((item) => item.id));
    const availableCoupons = (adminMockApi.getAdminTenantCoupons('tenant-001') as Promise<CouponRecord[]>);
    const couponUsages = (adminMockApi.getAdminCouponUsages() as Promise<BillingData['couponUsages']>);
    const data: BillingData = {
      balance: tenantWalletState.balance,
      wallet: { ...tenantWalletState, collectionAccount: { ...tenantWalletState.collectionAccount } },
      tokenQuota: 2800000,
      validUntil: '2026-05-21 23:59:59',
      usage: usageTrend,
      orders: adminOrders,
      invoices: billingInvoices.filter((item) => orderIds.has(item.orderId)),
      contracts: billingContracts.filter((item) => item.tenantId === 'tenant-001'),
    };

    return Promise.all([availableCoupons, couponUsages]).then(([coupons, usages]) =>
      delay({
        ...data,
        availableCoupons: coupons,
        couponUsages: usages?.filter((item) => item.tenantId === 'tenant-001') ?? [],
      }),
    );
  },

  createTenantWalletTopup(payload: {
    amount: number;
    paymentMethod: TenantWalletPaymentMethod;
    proofFileName?: string;
  }) {
    if (payload.amount < 100) {
      throw new Error('单次钱包充值金额需至少 100 元');
    }
    const createdAt = dayjs().format('YYYY-MM-DD HH:mm');
    const collectionAccount = { ...tenantWalletState.collectionAccount };
    const uniqueRemarkCode = collectionAccount.remarkCode;
    const order: TenantWalletTopupOrder = {
      id: `TTO-${dayjs().format('YYYYMMDD')}-${String(tenantWalletTopupOrdersState.length + 1).padStart(3, '0')}`,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      status: 'completed',
      createdAt,
      proofFileName: payload.proofFileName,
      uniqueRemarkCode,
    };
    tenantWalletTopupOrdersState = [order, ...tenantWalletTopupOrdersState];
    const paymentCodeLabel = payload.paymentMethod === 'bank_transfer'
      ? undefined
      : `${payload.paymentMethod === 'alipay' ? '支付宝' : '微信'}充值付款码 TENANT-TOPUP-${dayjs().format('YYYYMMDD')}-${String(payload.amount || 0).padStart(6, '0')}`;
    tenantWalletState = {
      ...tenantWalletState,
      balance: tenantWalletState.balance + payload.amount,
      totalTopup: tenantWalletState.totalTopup + payload.amount,
      collectionAccount: {
        ...tenantWalletState.collectionAccount,
        remarkCode: buildNextTenantWalletRemarkCode(),
      },
    };
    const ledger: TenantWalletLedgerRecord = {
      id: `TWL-${dayjs().format('YYYYMMDD')}-${String(tenantWalletLedgerState.length + 1).padStart(3, '0')}`,
      type: 'topup',
      businessLabel: `钱包充值 / ${payload.paymentMethod === 'bank_transfer' ? '对公转账' : payload.paymentMethod === 'wechat' ? '微信' : '支付宝'}`,
      amount: payload.amount,
      balanceAfter: tenantWalletState.balance,
      createdAt,
      remark: payload.paymentMethod === 'bank_transfer' ? '对公转账凭证审核通过后入账' : '扫码充值成功，资金已入账',
      paymentMethod: payload.paymentMethod,
      proofFileName: payload.proofFileName,
      remarkCode: uniqueRemarkCode,
      paymentCodeLabel,
      collectionAccount: payload.paymentMethod === 'bank_transfer' ? { ...collectionAccount } : undefined,
    };
    tenantWalletLedgerState = [ledger, ...tenantWalletLedgerState];
    return delay({
      order: { ...order },
      wallet: { ...tenantWalletState, collectionAccount: { ...tenantWalletState.collectionAccount } },
      ledger: { ...ledger, collectionAccount: ledger.collectionAccount ? { ...ledger.collectionAccount } : undefined },
    });
  },

  getTenantWalletLedger() {
    return delay(tenantWalletLedgerState.map((item) => ({
      ...item,
      collectionAccount: item.collectionAccount ? { ...item.collectionAccount } : undefined,
    })));
  },

  getVoucherWallet(ownerId = 'tenant-001') {
    const availableCoupons = adminMockApi.getAdminTenantCoupons(ownerId) as Promise<CouponRecord[]>;
    const couponUsages = adminMockApi.getAdminCouponUsages() as Promise<BillingData['couponUsages']>;

    return Promise.all([availableCoupons, couponUsages]).then(([coupons, usages]) =>
      delay({
        availableCoupons: coupons,
        couponUsages: usages?.filter((item) => item.tenantId === ownerId) ?? [],
      }),
    );
  },

  getTenantBillingContracts(tenantId = 'tenant-001') {
    return delay(billingContracts.filter((item) => item.tenantId === tenantId).map((item) => ({ ...item })));
  },

  getAdminTenantContracts(tenantId: string) {
    return delay(billingContracts.filter((item) => item.tenantId === tenantId).map((item) => ({ ...item })));
  },

  createAdminTenantContract(tenantId: string, payload: BillingContractDraft) {
    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: BillingContractRecord = {
      id: `contract-${Date.now()}`,
      tenantId,
      contractNo: payload.contractNo.trim(),
      type: payload.type,
      name: payload.name.trim(),
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      createdAt,
      completedAt: payload.completedAt,
      status: payload.status,
      remark: payload.remark?.trim() || undefined,
      fileName: payload.fileName.trim(),
      fileUrl: `/mock/contracts/${payload.fileName.trim()}`,
    };
    billingContracts = [record, ...billingContracts];
    return delay({ ...record });
  },

  voidAdminTenantContract(id: string, reason: string) {
    let updated: BillingContractRecord | undefined;
    billingContracts = billingContracts.map((item) => {
      if (item.id !== id) return item;
      updated = {
        ...item,
        status: 'voided',
        voidedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        voidedBy: 'FI-2002 姚楠',
        voidReason: reason.trim(),
      };
      return updated;
    });
    return delay(updated ? { ...updated } : undefined);
  },

  getAdminBillingInvoices() {
    return delay(billingInvoices.map((item) => ({ ...item })));
  },

  submitBillingInvoice(payload: BillingInvoiceDraft) {
    const order = getTenantBillingOrdersSnapshot().find((item) => item.id === payload.orderId);
    if (!order) {
      return delay(undefined);
    }
    const record: BillingInvoiceRecord = {
      id: `inv-${Date.now()}`,
      orderId: payload.orderId,
      amount: order.amount,
      title: payload.title,
      taxNo: payload.taxNo,
      type: 'electronic_vat_general',
      status: 'pending',
      source: 'customer_request',
      receiverEmail: payload.receiverEmail,
      appliedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    };
    billingInvoices = [record, ...billingInvoices];
    return delay(record);
  },

  issueBillingInvoice(payload: { id: string; fileName: string }) {
    const issuedAt = dayjs().format('YYYY-MM-DD HH:mm');
    billingInvoices = billingInvoices.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            status: 'issued',
            issuedAt,
            fileName: payload.fileName,
            fileUrl: `/mock/invoices/${payload.fileName}`,
          }
        : item,
    );
    return delay(billingInvoices.find((item) => item.id === payload.id));
  },

  rejectBillingInvoice(payload: { id: string; reason: string }) {
    billingInvoices = billingInvoices.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            status: 'rejected',
            rejectReason: payload.reason,
          }
        : item,
    );
    return delay(billingInvoices.find((item) => item.id === payload.id));
  },

  createAndIssueBillingInvoice(payload: BillingInvoiceDraft & { fileName: string }) {
    const order = getAdminBillingOrdersSnapshot().find((item) => item.id === payload.orderId);
    if (!order) {
      return delay(undefined);
    }
    const issuedAt = dayjs().format('YYYY-MM-DD HH:mm');
    const record: BillingInvoiceRecord = {
      id: `inv-${Date.now()}`,
      orderId: payload.orderId,
      amount: order.amount,
      title: payload.title,
      taxNo: payload.taxNo,
      type: 'electronic_vat_general',
      status: 'issued',
      source: 'finance_manual',
      receiverEmail: payload.receiverEmail,
      appliedAt: issuedAt,
      issuedAt,
      fileName: payload.fileName,
      fileUrl: `/mock/invoices/${payload.fileName}`,
    };
    billingInvoices = [record, ...billingInvoices];
    return delay(record);
  },

  submitConsult(payload: ConsultPayload) {
    const leadId = `lead-${Date.now()}`;
    createNotification({
      role: 'platformAdmin',
      category: 'lead',
      priority: 'high',
      title: '新商机待分配',
      summary: `${payload.company} 提交了新咨询商机，请尽快分配给代理。`,
      todo: true,
      actionable: true,
      actionUrl: '/admin/leads',
      actionLabel: '分配商机',
      sourceType: 'lead',
      sourceId: leadId,
      templateTrigger: 'lead.created',
    });
    return delay({ id: leadId, status: 'new', payload });
  },

  getNews() {
    return delay(news);
  },

  getLegacyAdminDashboard() {
    const data: AdminDashboard = {
      metrics: [
        { label: '累计企业客户数', value: 32, trend: '+6 本月' },
        { label: '本月成交额', value: '¥128,400', trend: '+24.8%' },
        { label: '累计模型用量', value: '4,862 万', trend: '全平台' },
        { label: '本月佣金总额', value: '¥6,420', trend: '固定 5%' },
      ],
      revenueTrend: usageTrend,
      topTenants: [
        { name: '云岭制造', token: 920000 },
        { name: '北辰科技', token: 760000 },
        { name: '星河财税', token: 630000 },
        { name: '灵川生物', token: 510000 },
      ],
      alerts: ['对公转账待审核 3 笔', '未处理咨询商机 7 条', '欠费企业 2 家', '席位使用率超过 80% 的企业 5 家'],
    };

    return delay(data);
  },

  getLegacyAdminTenants() {
    return delay(adminTenants);
  },

  getPlatformOrders() {
    return delay(platformOrders);
  },

  getSalesProfiles() {
    return delay(salesProfiles);
  },

  getCommissionRecords() {
    return delay(commissionRecords);
  },

  getConsultLeads() {
    return delay(consultLeads);
  },

  getPricingPlans() {
    return delay(pricingPlans);
  },

  getLegacyAdminNews() {
    return delay(adminNews);
  },

  getAuditItems() {
    return delay(auditItems);
  },

  getTenantBatchJobs() {
    return delay(batchJobs);
  },

  getTenantBatchTargets() {
    return delay(batchJobTargets);
  },

  getTenantBatchVersions() {
    return delay(batchVersions);
  },

  getTenantObservability() {
    return delay(tenantObservabilityData);
  },

  getTenantAuditRecords() {
    return delay(tenantAuditRecords);
  },

  getLegacyOpsTickets() {
    return delay(opsTickets);
  },

  getLegacyOpsBindings() {
    return delay(opsBindings);
  },

  getLegacyOpsNetworks() {
    return delay(opsNetworks);
  },

  getLegacyOpsDiagnostics() {
    return delay(opsDiagnostics);
  },

  getTenantNetworkConfig() {
    return delay({
      publicIngress: { ...tenantNetworkConfig.publicIngress },
      publicEgress: { ...tenantNetworkConfig.publicEgress },
      privateEgress: {
        ...tenantNetworkConfig.privateEgress,
        zones: [...tenantNetworkConfig.privateEgress.zones],
      },
      options: {
        ...tenantNetworkConfig.options,
        certificateOptions: [...tenantNetworkConfig.options.certificateOptions],
        projectOptions: [...tenantNetworkConfig.options.projectOptions],
        vpcOptions: [...tenantNetworkConfig.options.vpcOptions],
        zoneOptions: [...tenantNetworkConfig.options.zoneOptions],
        securityGroupOptions: [...tenantNetworkConfig.options.securityGroupOptions],
      },
    });
  },

  saveTenantNetworkConfig(payload: TenantNetworkConfig) {
    tenantNetworkConfig = {
      publicIngress: { ...payload.publicIngress },
      publicEgress: { ...payload.publicEgress },
      privateEgress: { ...payload.privateEgress, zones: [...payload.privateEgress.zones] },
      options: {
        ...payload.options,
        certificateOptions: [...payload.options.certificateOptions],
        projectOptions: [...payload.options.projectOptions],
        vpcOptions: [...payload.options.vpcOptions],
        zoneOptions: [...payload.options.zoneOptions],
        securityGroupOptions: [...payload.options.securityGroupOptions],
      },
    };
    return delay(tenantNetworkConfig);
  },

  getSalesDashboard() {
    const data: SalesDashboard = {
      metrics: [
        { label: '我的客户数', value: 18, trend: '+3 本月' },
        { label: '本月回款', value: '¥86,200', trend: '+12.4%' },
        { label: '本月预估佣金', value: '¥4,310', trend: '5% 固定' },
        { label: '归属期客户', value: 14, trend: '12 个月内' },
      ],
      trend: usageTrend,
      inviteCode: 'YZN8K2',
      inviteUrl: 'https://arkclaw.yunnao.example/register?sales=cm-2048',
      invites: salesInvites,
      commissions: commissionRecords.filter((item) => item.sales === '陈默'),
      customers: [
        { id: 'c-01', name: '云岭制造', code: '91310115MA1K000001', contact: '赵欣', industry: '制造业', status: '已成交', paidAmount: 32800, commission: 1640, contactAt: '2026-04-24', accountManager: '周安', consumedAmount: 12600 },
        { id: 'c-02', name: '北辰科技', code: '91310115MA1K000002', contact: '唐凯', industry: '软件服务', status: '已成交', paidAmount: 21800, commission: 1090, contactAt: '2026-04-23', accountManager: '孟琪', consumedAmount: 8800 },
        { id: 'c-03', name: '星河财税', code: '91310115MA1K000003', contact: '周琳', industry: '企业服务', status: '跟进中', paidAmount: 0, commission: 0, contactAt: '2026-04-21', accountManager: '销售备注', consumedAmount: 0 },
      ],
    };

    return delay(data);
  },

  getSalesInvites() {
    return delay(salesInvites);
  },

  getMyCommissions() {
    return delay(commissionRecords.filter((item) => item.sales === '陈默'));
  },

  ...notificationMockApi,
  ...adminMockApi,
  ...opsMockApi,
  ...salesMockApi,
};
