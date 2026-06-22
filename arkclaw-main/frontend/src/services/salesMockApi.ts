import dayjs from 'dayjs';
import {
  confirmSalesCommissionFromAdminMock,
  createAdminCustomerBusinessConsultOpportunity,
  getSalesCommissionsFromAdminMock,
  getSalesCustomerCommissionsFromAdminMock,
  getSalesCustomerOrdersFromAdminMock,
  getSalesOpeningTasksFromAdminMock,
  getSalesOrderFollowupsFromAdminMock,
  requestSalesCommissionWithdrawFromAdminMock,
} from './adminMockApi';
import { createNotification } from './notificationMockApi';
import type {
  AgentCommissionDistributionRecord,
  AgentCommissionQuery,
  AgentCommissionRecord,
  AgentCommissionRole,
  AgentCommissionSummary,
  AgentCommissionView,
  AgentCommissionWithdrawRecord,
  PublicInviteCodeCheckResult,
  PublicRegisterPayload,
  PublicRegisterRefCheckResult,
  PublicRegisterResult,
  SalesCommissionQuery,
  SalesCommissionSummary,
  SalesCustomerDetail,
  SalesCustomerFormPayload,
  SalesCustomerListItem,
  SalesCustomerLostPayload,
  SalesCustomerOrderRecord,
  SalesCustomerPatchPayload,
  SalesCustomerQuery,
  SalesCustomerSource,
  SalesCustomerStatus,
  SalesCustomerUsagePoint,
  SalesDashboardSummary,
  SalesDashboardTrendPoint,
  SalesFollowupPayload,
  SalesFollowupRecord,
  SalesInviteCodeRecord,
  SalesLeadClosePayload,
  SalesLeadFollowPayload,
  SalesLeadFollowupRecord,
  SalesLeadRecord,
  SalesOrderFollowupRecord,
  SalesOrderSeatStatus,
  SalesPerformancePoint,
  SalesProfileDetail,
  SalesProfileUpdatePayload,
  SalesRegistrationRecord,
  SalesShareCreatePayload,
  SalesShareLinkRecord,
  SalesTopCustomer,
  SalesUsccCheckResult,
  TenantBusinessConsultRecord,
  TenantSupportRequestPayload,
} from '../types/domain';

const delay = <T,>(data: T, ms = 180) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), ms);
  });

const normalizeCustomerRequestTitle = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

const CUSTOMER_DAILY_BUSINESS_CONSULT_LIMIT = 3;

const CURRENT_SALES = {
  id: 'sales-cm-001',
  name: '陈默',
  team: '华东销售一组',
  region: '华东',
  employeeNo: 'CM2048',
};

const currentDate = () => dayjs('2026-04-28 10:00');

const AGENT_PAYOUT_ACCOUNT = {
  accountName: '上海云岭代理服务有限公司',
  bankName: '招商银行上海徐汇支行',
  branchName: '招商银行上海徐汇支行营业部',
  accountNo: '6225888800003456',
  status: 'active',
  updatedAt: '2026-04-12 10:20',
} as const;

const agentCommissionStatuses = ['pending', 'confirmed', 'paid', 'reverted', 'withdrawable', 'withdrawing', 'processing'] as const;

let agentCommissionState: AgentCommissionRecord[] = [
  {
    id: 'agent-commission-001',
    orderId: 'ORD-20260428-015',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    orderAmount: 52000,
    paidAmount: 52000,
    commissionAmount: 15600,
    rate: 0.3,
    status: 'withdrawable',
    generatedAt: '2026-04-28 08:15',
    withdrawableAt: '2026-05-28 08:15',
    calcText: '平台返佣 = 客户实付 ¥52,000 × 30%',
    sourceLabel: '平台返佣',
    ruleName: 'A级代理协议 30%',
    settlementNote: '已过保护期，可申请提现',
  },
  {
    id: 'agent-commission-002',
    orderId: 'ORD-20260430-011',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    orderAmount: 46800,
    paidAmount: 46800,
    commissionAmount: 14040,
    rate: 0.3,
    status: 'confirmed',
    generatedAt: '2026-04-30 14:20',
    confirmedAt: '2026-05-01 09:10',
    calcText: '平台返佣 = 客户实付 ¥46,800 × 30%',
    sourceLabel: '平台返佣',
    ruleName: 'A级代理协议 30%',
    settlementNote: '代理财务已复核，等待平台打款',
  },
  {
    id: 'agent-commission-003',
    orderId: 'ORD-20260502-006',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    orderAmount: 36000,
    paidAmount: 36000,
    commissionAmount: 10800,
    rate: 0.3,
    status: 'pending',
    generatedAt: '2026-05-02 11:30',
    calcText: '平台返佣 = 客户实付 ¥36,000 × 30%',
    sourceLabel: '平台返佣',
    ruleName: 'A级代理协议 30%',
    settlementNote: '新入账，待代理财务确认',
  },
  {
    id: 'agent-commission-004',
    orderId: 'ORD-20260412-003',
    tenantId: 'tenant-004',
    tenantName: '临港机器人',
    orderAmount: 58000,
    paidAmount: 58000,
    commissionAmount: 17400,
    rate: 0.3,
    status: 'paid',
    generatedAt: '2026-04-12 16:20',
    confirmedAt: '2026-04-15 09:40',
    paidAt: '2026-04-18 18:10',
    calcText: '平台返佣 = 客户实付 ¥58,000 × 30%',
    sourceLabel: '平台返佣',
    ruleName: 'A级代理协议 30%',
    settlementNote: '平台财务已线下打款',
  },
  {
    id: 'agent-commission-005',
    orderId: 'ORD-20260318-021',
    tenantId: 'tenant-005',
    tenantName: '南山智能装备',
    orderAmount: 42000,
    paidAmount: 42000,
    commissionAmount: 12600,
    rate: 0.3,
    status: 'reverted',
    generatedAt: '2026-03-18 10:05',
    paidAt: '2026-03-25 17:20',
    calcText: '平台返佣 = 客户实付 ¥42,000 × 30%',
    sourceLabel: '平台返佣',
    ruleName: 'A级代理协议 30%',
    settlementNote: '客户退款后已冲销代理返佣',
  },
];

let agentCommissionDistributionState: AgentCommissionDistributionRecord[] = [
  {
    id: 'agent-dist-001',
    agentCommissionId: 'agent-commission-001',
    orderId: 'ORD-20260428-015',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    salesId: CURRENT_SALES.id,
    salesName: CURRENT_SALES.name,
    orderAmount: 52000,
    paidAmount: 52000,
    commissionAmount: 4680,
    rate: 0.09,
    status: 'processing',
    generatedAt: '2026-04-28 09:00',
    calcText: '内部销售分佣 = 客户实付 ¥52,000 × 9%',
    ruleName: '镜像站统一销售分佣 9%',
    settlementNote: '代理财务处理中',
  },
  {
    id: 'agent-dist-002',
    agentCommissionId: 'agent-commission-002',
    orderId: 'ORD-20260430-011',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    salesId: CURRENT_SALES.id,
    salesName: CURRENT_SALES.name,
    orderAmount: 46800,
    paidAmount: 46800,
    commissionAmount: 4212,
    rate: 0.09,
    status: 'pending',
    generatedAt: '2026-04-30 14:30',
    calcText: '内部销售分佣 = 客户实付 ¥46,800 × 9%',
    ruleName: '镜像站统一销售分佣 9%',
    settlementNote: '待代理财务发放',
  },
  {
    id: 'agent-dist-003',
    agentCommissionId: 'agent-commission-004',
    orderId: 'ORD-20260412-003',
    tenantId: 'tenant-004',
    tenantName: '临港机器人',
    salesId: CURRENT_SALES.id,
    salesName: CURRENT_SALES.name,
    orderAmount: 58000,
    paidAmount: 58000,
    commissionAmount: 5220,
    rate: 0.09,
    status: 'paid',
    generatedAt: '2026-04-12 17:10',
    paidAt: '2026-04-19 11:30',
    calcText: '内部销售分佣 = 客户实付 ¥58,000 × 9%',
    ruleName: '镜像站统一销售分佣 9%',
    settlementNote: '已随月度分佣批次打款',
  },
  {
    id: 'agent-dist-004',
    agentCommissionId: 'agent-commission-005',
    orderId: 'ORD-20260318-021',
    tenantId: 'tenant-005',
    tenantName: '南山智能装备',
    salesId: 'sales-lj-001',
    salesName: '林嘉',
    orderAmount: 42000,
    paidAmount: 42000,
    commissionAmount: 3780,
    rate: 0.09,
    status: 'reverted',
    generatedAt: '2026-03-18 10:20',
    paidAt: '2026-03-27 10:10',
    calcText: '内部销售分佣 = 客户实付 ¥42,000 × 9%',
    ruleName: '镜像站统一销售分佣 9%',
    settlementNote: '客户退款后冲销内部销售分佣',
  },
  {
    id: 'agent-dist-005',
    agentCommissionId: 'agent-commission-003',
    orderId: 'ORD-20260502-006',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    salesId: 'sales-sn-002',
    salesName: '沈南',
    orderAmount: 36000,
    paidAmount: 36000,
    commissionAmount: 3240,
    rate: 0.09,
    status: 'pending',
    generatedAt: '2026-05-02 12:00',
    calcText: '内部销售分佣 = 客户实付 ¥36,000 × 9%',
    ruleName: '镜像站统一销售分佣 9%',
    settlementNote: '待代理财务发放',
  },
];

const statusLabelMap = {
  pending_followup: '待跟进',
  following: '跟进中',
  converted: '已成交',
  lost: '已流失',
} as const;

const sourceLabelMap = {
  share_link: '分享链接',
  invite_code: '邀请码',
  manual: '手动录入',
  consult_lead: '咨询商机',
} as const;

interface InternalShareLink extends SalesShareLinkRecord {
  salesId: string;
  refToken: string;
}

interface InternalInviteCode extends SalesInviteCodeRecord {
  salesId: string;
}

interface InternalRegistration extends SalesRegistrationRecord {
  resourceId?: string;
}

const filterAgentCommissionRows = (
  rows: Array<AgentCommissionRecord | AgentCommissionDistributionRecord>,
  query: AgentCommissionQuery | undefined,
) => {
  let filteredRows = [...rows];
  const q = query?.q?.trim().toLowerCase();
  if (q) {
    filteredRows = filteredRows.filter((item) => `${item.orderId} ${item.tenantName}`.toLowerCase().includes(q));
  }
  if (query?.status?.length) {
    filteredRows = filteredRows.filter((item) => query.status?.includes(item.status));
  }
  if (query?.dateFrom) {
    filteredRows = filteredRows.filter((item) => dayjs(item.generatedAt).isAfter(dayjs(query.dateFrom).subtract(1, 'day')));
  }
  if (query?.dateTo) {
    filteredRows = filteredRows.filter((item) => dayjs(item.generatedAt).isBefore(dayjs(query.dateTo).add(1, 'day')));
  }
  filteredRows.sort((left, right) => dayjs(right.generatedAt).valueOf() - dayjs(left.generatedAt).valueOf());
  return filteredRows;
};

const getAgentCommissionRowsByView = (view: AgentCommissionView, role: AgentCommissionRole) => {
  if (view === 'distribution') {
    const rows = [...agentCommissionDistributionState];
    return role === 'agentSales' ? rows.filter((item) => item.salesId === CURRENT_SALES.id) : rows;
  }
  return [...agentCommissionState];
};

const buildAgentCommissionSummary = (
  rows: Array<AgentCommissionRecord | AgentCommissionDistributionRecord>,
): AgentCommissionSummary => ({
  totalOrderAmount: rows.reduce((sum, item) => sum + item.orderAmount, 0),
  totalCommissionAmount: rows.reduce((sum, item) => sum + item.commissionAmount, 0),
  pendingAmount: rows.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.commissionAmount, 0),
  confirmedAmount: rows.filter((item) => item.status === 'confirmed').reduce((sum, item) => sum + item.commissionAmount, 0),
  paidAmount: rows.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.commissionAmount, 0),
  revertedAmount: rows.filter((item) => item.status === 'reverted').reduce((sum, item) => sum + item.commissionAmount, 0),
  withdrawableAmount: rows.filter((item) => item.status === 'withdrawable').reduce((sum, item) => sum + item.commissionAmount, 0),
  withdrawingAmount: rows.filter((item) => item.status === 'withdrawing').reduce((sum, item) => sum + item.commissionAmount, 0),
  processingAmount: rows.filter((item) => item.status === 'processing').reduce((sum, item) => sum + item.commissionAmount, 0),
  byStatus: agentCommissionStatuses.map((status) => ({
    status,
    amount: rows.filter((item) => item.status === status).reduce((sum, item) => sum + item.commissionAmount, 0),
  })),
});

interface OwnershipRecord {
  owner: 'self' | 'other' | 'public';
  tenantId?: string;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const industryOptions = ['制造业', '软件服务', '企业服务', '生物医药', '能源化工', '零售电商', '金融', '其他'];
const commissionStatuses = ['estimated', 'withdrawable', 'withdrawing', 'withdrawn', 'invalid'] as const;

let salesCustomersState: SalesCustomerDetail[] = [
  {
    id: 'tenant-001',
    tenantName: '云岭制造',
    uscc: '91310115MA1K000001',
    primaryContactName: '赵欣',
    primaryContactPhone: '13800001111',
    primaryContactEmail: 'zhaoxin@yuling.com',
    industry: '制造业',
    customerStatus: 'converted',
    boundAt: '2025-08-12 10:16',
    firstActivatedAt: '2025-08-12 10:30',
    attributionValidUntil: '2026-08-12 10:30',
    attributionStarted: true,
    lastFollowupAt: '2026-04-26 16:30',
    totalPaidAmount: 32800,
    totalCommissionAmount: 1640,
    accountManagerName: '周安',
    accountManagerNote: '续约前需确认 6 月扩容方案',
    salesRemark: '已进入续约铺垫阶段，关注 6 月扩容需求。',
    customTags: ['高价值', '续约中'],
    boundSource: 'share_link',
    address: '上海市闵行区申滨南路 700 号',
    website: 'https://www.yuling.com',
    companySize: '500-1000 人',
    companyStage: '年框客户',
    adminName: '赵欣',
    adminPhone: '13800001111',
    adminEmail: 'zhaoxin@yuling.com',
    bindingSourceLabel: '分享链接',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 68,
    latestOrderAt: '2026-04-24 10:24',
  },
  {
    id: 'tenant-002',
    tenantName: '北辰科技',
    uscc: '91310115MA1K000002',
    primaryContactName: '唐凯',
    primaryContactPhone: '13800002222',
    primaryContactEmail: 'tangkai@beichen.com',
    industry: '软件服务',
    customerStatus: 'converted',
    boundAt: '2025-05-02 14:40',
    firstActivatedAt: '2025-05-02 15:10',
    attributionValidUntil: '2026-05-02 15:10',
    attributionStarted: true,
    lastFollowupAt: '2026-04-10 09:45',
    totalPaidAmount: 45200,
    totalCommissionAmount: 2260,
    accountManagerName: '孟琪',
    accountManagerNote: '归属期临近到期，需同步续费窗口',
    salesRemark: '归属期即将到期，5 月内完成续费锁定。',
    customTags: ['归属将到期'],
    boundSource: 'invite_code',
    address: '北京市海淀区上地十街 18 号',
    website: 'https://www.beichen-tech.cn',
    companySize: '200-500 人',
    companyStage: '季度扩容',
    adminName: '唐凯',
    adminPhone: '13800002222',
    adminEmail: 'tangkai@beichen.com',
    bindingSourceLabel: '邀请码',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 42,
    latestOrderAt: '2026-04-23 16:11',
  },
  {
    id: 'tenant-003',
    tenantName: '星河财税',
    uscc: '91310115MA1K000003',
    primaryContactName: '周琳',
    primaryContactPhone: '13800003333',
    primaryContactEmail: 'zhoulin@xinghe-tax.com',
    industry: '企业服务',
    customerStatus: 'following',
    boundAt: '2026-04-08 13:20',
    attributionStarted: false,
    lastFollowupAt: '2026-04-09 11:30',
    totalPaidAmount: 0,
    totalCommissionAmount: 0,
    accountManagerName: '待分配',
    accountManagerNote: '待确认采购链路',
    salesRemark: '财务负责人有意向，需推进试用总结会。',
    customTags: ['试用中'],
    boundSource: 'manual',
    address: '杭州市西湖区文三路 99 号',
    companySize: '50-200 人',
    companyStage: '试用推进',
    adminName: '周琳',
    adminPhone: '13800003333',
    adminEmail: 'zhoulin@xinghe-tax.com',
    bindingSourceLabel: '手动录入',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 0,
  },
  {
    id: 'tenant-004',
    tenantName: '启明医疗器械',
    uscc: '91310115MA1K000004',
    primaryContactName: '顾诚',
    primaryContactPhone: '13800004444',
    primaryContactEmail: 'gucheng@qiming-med.com',
    industry: '生物医药',
    customerStatus: 'converted',
    boundAt: '2026-04-18 15:40',
    attributionStarted: false,
    lastFollowupAt: '2026-04-20 18:20',
    totalPaidAmount: 18800,
    totalCommissionAmount: 0,
    accountManagerName: '许岚',
    accountManagerNote: '交付处理中，待确认组合包生效',
    salesRemark: '客户已付款，交付团队正在处理官网代购和基础配置。',
    customTags: ['展会', '待演示'],
    boundSource: 'consult_lead',
    address: '苏州市工业园区星湖街 88 号',
    companySize: '200-500 人',
    companyStage: '方案沟通',
    adminName: '顾诚',
    adminPhone: '13800004444',
    adminEmail: 'gucheng@qiming-med.com',
    bindingSourceLabel: '咨询商机',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 0,
  },
  {
    id: 'tenant-006',
    tenantName: '南京云舟物流',
    uscc: '91310115MA1K000006',
    primaryContactName: '赵源',
    primaryContactPhone: '13800006666',
    primaryContactEmail: 'zhaoyuan@yzhou-log.com',
    industry: '企业服务',
    customerStatus: 'pending_followup',
    boundAt: '2026-04-28 09:10',
    attributionStarted: false,
    totalPaidAmount: 0,
    totalCommissionAmount: 0,
    accountManagerName: '待分配',
    accountManagerNote: '待首次触达',
    salesRemark: '刚从分享链接注册，需确认采购意向和预算。',
    customTags: ['新客户'],
    boundSource: 'share_link',
    address: '南京市建邺区江东中路 88 号',
    companySize: '50-200 人',
    companyStage: '待确认',
    adminName: '赵源',
    adminPhone: '13800006666',
    adminEmail: 'zhaoyuan@yzhou-log.com',
    bindingSourceLabel: '分享链接',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 0,
  },
  {
    id: 'tenant-005',
    tenantName: '临港机器人',
    uscc: '91310115MA1K000005',
    primaryContactName: '林澈',
    primaryContactPhone: '13800005555',
    primaryContactEmail: 'linche@robot-link.cn',
    industry: '制造业',
    customerStatus: 'lost',
    boundAt: '2025-09-02 12:12',
    firstActivatedAt: '2025-09-02 12:30',
    attributionValidUntil: '2026-09-02 12:30',
    attributionStarted: true,
    lastFollowupAt: '2026-01-18 10:20',
    totalPaidAmount: 9600,
    totalCommissionAmount: 480,
    accountManagerName: '周安',
    accountManagerNote: '需重新唤醒',
    salesRemark: '90 天无活跃，待 618 前重新激活。',
    customTags: ['沉睡'],
    boundSource: 'share_link',
    address: '上海市浦东新区海港大道 66 号',
    companySize: '50-200 人',
    companyStage: '待唤醒',
    adminName: '林澈',
    adminPhone: '13800005555',
    adminEmail: 'linche@robot-link.cn',
    bindingSourceLabel: '分享链接',
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 6,
    latestOrderAt: '2026-01-08 10:00',
  },
];

let salesOrdersState: SalesCustomerOrderRecord[] = [
  { id: 'ORD-20260424-001', tenantId: 'tenant-001', type: '席位组合包', planName: '席位组合包', amount: 32800, paymentMethod: 'bank_transfer', status: 'paid', seatStatus: 'active', createdAt: '2026-04-24 10:24', paidAt: '2026-04-24 10:24', activatedAt: '2026-04-24 10:29', openingTaskId: 'OPEN-20260424-001', openingStatus: 'completed', commissionId: 'commission-001', commissionStatus: 'pending' },
  { id: 'ORD-20260312-015', tenantId: 'tenant-002', type: '席位组合包', planName: '席位组合包', amount: 12000, paymentMethod: 'bank_transfer', status: 'paid', seatStatus: 'active', createdAt: '2026-03-12 16:11', paidAt: '2026-03-12 16:11', activatedAt: '2026-03-13 09:20', commissionId: 'commission-002', commissionStatus: 'paid' },
  { id: 'ORD-20260402-021', tenantId: 'tenant-002', type: '席位组合包', planName: '席位组合包', amount: 33200, paymentMethod: 'bank_transfer', status: 'paid', seatStatus: 'inactive', createdAt: '2026-04-02 09:31', paidAt: '2026-04-03 12:06', openingTaskId: 'OPEN-20260402-021', openingStatus: 'waiting_confirm' },
  { id: 'ORD-20260426-031', tenantId: 'tenant-003', type: '席位组合包', planName: '席位组合包', amount: 8800, paymentMethod: 'bank_transfer', status: 'paid', seatStatus: 'inactive', createdAt: '2026-04-26 10:00', paidAt: '2026-04-26 10:30', openingTaskId: 'OPEN-20260426-031', openingStatus: 'pending_assign' },
  { id: 'ORD-20260401-014', tenantId: 'tenant-004', type: '席位组合包', planName: '席位组合包', amount: 18800, paymentMethod: 'bank_transfer', status: 'paid', seatStatus: 'inactive', createdAt: '2026-04-01 14:20', paidAt: '2026-04-01 14:30', openingTaskId: 'OPEN-20260401-014', openingStatus: 'purchasing' },
  { id: 'ORD-20260108-008', tenantId: 'tenant-005', type: '席位组合包', planName: '席位组合包', amount: 9600, paymentMethod: 'bank_transfer', status: 'pending', seatStatus: 'released', createdAt: '2026-01-08 10:00', paidAt: '2026-01-08 10:20', openingTaskId: 'OPEN-20260108-008', openingStatus: 'cancelled' },
];

let salesUsageState: Record<string, SalesCustomerUsagePoint[]> = {
  'tenant-001': [
    { month: '2025-11', tokenConsumed: 320000, activeEmployees: 32 },
    { month: '2025-12', tokenConsumed: 410000, activeEmployees: 41 },
    { month: '2026-01', tokenConsumed: 520000, activeEmployees: 52 },
    { month: '2026-02', tokenConsumed: 610000, activeEmployees: 58 },
    { month: '2026-03', tokenConsumed: 780000, activeEmployees: 63 },
    { month: '2026-04', tokenConsumed: 920000, activeEmployees: 68 },
  ],
  'tenant-002': [
    { month: '2025-11', tokenConsumed: 180000, activeEmployees: 18 },
    { month: '2025-12', tokenConsumed: 260000, activeEmployees: 24 },
    { month: '2026-01', tokenConsumed: 390000, activeEmployees: 31 },
    { month: '2026-02', tokenConsumed: 520000, activeEmployees: 36 },
    { month: '2026-03', tokenConsumed: 680000, activeEmployees: 39 },
    { month: '2026-04', tokenConsumed: 760000, activeEmployees: 42 },
  ],
  'tenant-003': [
    { month: '2026-02', tokenConsumed: 0, activeEmployees: 0 },
    { month: '2026-03', tokenConsumed: 12000, activeEmployees: 3 },
    { month: '2026-04', tokenConsumed: 48000, activeEmployees: 6 },
  ],
  'tenant-004': [
    { month: '2026-03', tokenConsumed: 0, activeEmployees: 0 },
    { month: '2026-04', tokenConsumed: 22000, activeEmployees: 4 },
  ],
  'tenant-005': [
    { month: '2025-11', tokenConsumed: 210000, activeEmployees: 12 },
    { month: '2025-12', tokenConsumed: 180000, activeEmployees: 10 },
    { month: '2026-01', tokenConsumed: 90000, activeEmployees: 6 },
    { month: '2026-02', tokenConsumed: 14000, activeEmployees: 2 },
    { month: '2026-03', tokenConsumed: 0, activeEmployees: 0 },
    { month: '2026-04', tokenConsumed: 0, activeEmployees: 0 },
  ],
};

let salesFollowupsState: SalesFollowupRecord[] = [
  { id: 'followup-001', tenantId: 'tenant-001', salesId: CURRENT_SALES.id, channel: 'visit', content: '现场复盘试点效果，客户计划 6 月扩容 30 个席位。', nextFollowupAt: '2026-05-18 10:00', remind: true, createdAt: '2026-04-26 16:30', creatorName: CURRENT_SALES.name },
  { id: 'followup-002', tenantId: 'tenant-002', salesId: CURRENT_SALES.id, channel: 'wechat', content: '沟通续费预算，法务正在确认框架合同。', nextFollowupAt: '2026-04-30 15:00', remind: true, createdAt: '2026-04-10 09:45', creatorName: CURRENT_SALES.name },
  { id: 'followup-003', tenantId: 'tenant-003', salesId: CURRENT_SALES.id, channel: 'phone', content: '客户希望先看知识库接入效果，安排下周演示。', nextFollowupAt: '2026-04-16 14:00', remind: true, createdAt: '2026-04-09 11:30', creatorName: CURRENT_SALES.name },
  { id: 'followup-004', tenantId: 'tenant-004', salesId: CURRENT_SALES.id, channel: 'email', content: '发送了案例材料和报价区间，等待产品负责人回复。', nextFollowupAt: '2026-05-06 10:00', remind: false, createdAt: '2026-04-20 18:20', creatorName: CURRENT_SALES.name },
];

let salesShareLinksState: InternalShareLink[] = [
  { id: 'link-001', salesId: CURRENT_SALES.id, name: '默认分享链接', shortCode: 'SC4Y8Q', shortUrl: 'https://arkclaw.yunnao.example/register?ref=ref-share-east-01', qrUrl: 'https://arkclaw.yunnao.example/register?ref=ref-share-east-01', remark: '日常拓客', maxUses: null, usedCount: 12, expiresAt: undefined, status: 'active', createdAt: '2026-03-01 10:00', refToken: 'ref-share-east-01' },
  { id: 'link-002', salesId: CURRENT_SALES.id, name: '2026 春糖会议', shortCode: 'SC6M2N', shortUrl: 'https://arkclaw.yunnao.example/register?ref=ref-share-event-02', qrUrl: 'https://arkclaw.yunnao.example/register?ref=ref-share-event-02', remark: '会场地推', maxUses: 10, usedCount: 4, expiresAt: '2026-05-31 23:59', status: 'active', createdAt: '2026-04-12 08:30', refToken: 'ref-share-event-02' },
];

let salesInviteCodesState: InternalInviteCode[] = [
  { id: 'code-001', salesId: CURRENT_SALES.id, name: '默认邀请码', code: 'YZN8K2', remark: '官网自助咨询', maxUses: null, usedCount: 9, expiresAt: undefined, status: 'active', createdAt: '2026-03-02 11:00' },
  { id: 'code-002', salesId: CURRENT_SALES.id, name: '行业沙龙', code: 'BC7P2Q', remark: '活动获客', maxUses: 50, usedCount: 18, expiresAt: '2026-05-31 23:59', status: 'active', createdAt: '2026-04-01 09:00' },
  { id: 'code-003', salesId: CURRENT_SALES.id, name: '老活动停用', code: 'OLD9X1', remark: '已停用', maxUses: 20, usedCount: 20, expiresAt: '2026-03-31 23:59', status: 'disabled', createdAt: '2026-02-10 09:00' },
];

let salesRegistrationsState: InternalRegistration[] = [
  { id: 'registration-001', tenantId: 'tenant-001', tenantName: '云岭制造', uscc: '91310115MA1K000001', contactName: '赵欣', createdAt: '2025-08-12 10:16', source: 'share_link', sourceLabel: '默认分享链接', resourceId: 'link-001' },
  { id: 'registration-002', tenantId: 'tenant-002', tenantName: '北辰科技', uscc: '91310115MA1K000002', contactName: '唐凯', createdAt: '2025-06-02 14:40', source: 'invite_code', sourceLabel: '默认邀请码', resourceId: 'code-001' },
  { id: 'registration-003', tenantId: 'tenant-005', tenantName: '临港机器人', uscc: '91310115MA1K000005', contactName: '林澈', createdAt: '2025-09-02 12:12', source: 'share_link', sourceLabel: '默认分享链接', resourceId: 'link-001' },
];

let salesLeadsState: SalesLeadRecord[] = [
  { id: 'lead-001', opportunityType: 'external_consult', company: '杭州数智财税', name: '唐雨', title: '运营总监', phone: '13800006666', email: 'tangyu@szcai.com', requirement: '希望了解企业知识库和员工问答助手，预算 5-8 万。', preferredChannel: '电话', preferredTime: '工作日下午', status: 'new', source: '官网咨询', createdAt: '2026-04-27 15:20', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, followupCount: 0, slaDeadlineAt: '2026-04-27 15:20' },
  { id: 'lead-005', opportunityType: 'customer_business_consult', customerConsultStatus: 'pending_reply', company: '云岭制造', name: '赵欣', title: '客户管理员', phone: '13800001111', email: 'zhaoxin@yuling.com', requirement: '计划追加 10 个高级版席位，并咨询年度套餐折扣。', preferredChannel: '电话', preferredTime: '工作日', status: 'new', source: '控制台席位/套餐咨询', createdAt: '2026-04-28 08:40', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, followupCount: 0, slaDeadlineAt: '2026-04-29 08:40', attachments: [{ id: 'lead-att-005-1', filename: '增购席位预算说明.png', size: '386 KB' }] },
  { id: 'lead-006', opportunityType: 'customer_business_consult', customerConsultStatus: 'completed', company: '云岭制造', name: '赵欣', title: '客户管理员', phone: '13800001111', email: 'zhaoxin@yuling.com', requirement: '咨询标准版席位到期前续费和升配到高级版的差价。', preferredChannel: '电话', preferredTime: '工作日', status: 'following', source: '控制台席位/套餐咨询', createdAt: '2026-04-26 13:20', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, followupCount: 1, lastFollowupAt: '2026-04-26 16:10', latestFollowupSummary: '已说明续费和升配差价口径，客户确认暂不调整。', slaDeadlineAt: '2026-04-27 13:20', attachments: [{ id: 'lead-att-006-1', filename: '续费升级测算截图-1.png', size: '124 KB' }, { id: 'lead-att-006-2', filename: '客户咨询截图-2.png', size: '512 KB' }] },
  { id: 'lead-002', opportunityType: 'external_consult', company: '苏州启明制造', name: '梁晨', title: '信息化负责人', phone: '13800007777', email: 'liangchen@qiming-mfg.com', requirement: '需要接入企业微信和审批流，希望下周安排演示。', preferredChannel: '微信', preferredTime: '本周内', status: 'following', source: '资讯页', createdAt: '2026-04-24 09:20', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, claimedAt: '2026-04-24 10:10', followupCount: 2, lastFollowupAt: '2026-04-26 17:30', latestFollowupSummary: '已确定周三演示。', slaDeadlineAt: '2026-04-25 09:20' },
  { id: 'lead-003', opportunityType: 'external_consult', company: '启明医疗器械', name: '顾诚', title: '产品负责人', phone: '13800004444', email: 'gucheng@qiming-med.com', requirement: '关注文档安全和外网出入口配置。', preferredChannel: '邮件', preferredTime: '工作日上午', status: 'converted', source: '官网咨询', createdAt: '2026-04-18 11:00', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, claimedAt: '2026-04-18 11:30', convertedTenantId: 'tenant-004', followupCount: 1, lastFollowupAt: '2026-04-20 18:20', latestFollowupSummary: '已转客户池。', slaDeadlineAt: '2026-04-19 11:00' },
  { id: 'lead-004', opportunityType: 'external_consult', company: '南京云舟物流', name: '赵源', title: '采购经理', phone: '13800008888', email: 'zhaoyuan@yzhou-log.com', requirement: '想对比几家代理平台。', preferredChannel: '电话', preferredTime: '工作日上午', status: 'closed', source: '代理转介绍', createdAt: '2026-04-12 14:08', assignedSalesId: CURRENT_SALES.id, assignedSalesName: CURRENT_SALES.name, claimedAt: '2026-04-12 15:00', closeReason: '已选友商', closedAt: '2026-04-16 18:10', followupCount: 2, lastFollowupAt: '2026-04-15 16:20', latestFollowupSummary: '客户已签约友商。', slaDeadlineAt: '2026-04-13 14:08' },
];
const notifiedOverdueSalesLeadIds = new Set<string>();

const notifyOverdueSalesLeads = () => {
  salesLeadsState
    .filter(
      (lead) =>
        lead.opportunityType === 'customer_business_consult' &&
        lead.status === 'new' &&
        dayjs(lead.slaDeadlineAt).isBefore(currentDate()) &&
        !notifiedOverdueSalesLeadIds.has(lead.id),
    )
    .forEach((lead) => {
      notifiedOverdueSalesLeadIds.add(lead.id);
      createNotification({
        role: 'sales',
        category: 'lead',
        priority: 'high',
        title: '咨询工单跟进已超时',
        summary: `${lead.company} 的咨询工单 24h 未处理，请立即跟进。`,
        todo: true,
        actionable: true,
        actionUrl: '/sales/leads',
        actionLabel: '进入咨询工单池',
        sourceType: 'lead',
        sourceId: lead.id,
        templateTrigger: 'lead.unclaimed.overdue',
      });
      createNotification({
        role: 'platformAdmin',
        category: 'lead',
        priority: 'high',
        title: '咨询工单 24h 未处理',
        summary: `${lead.company} 的咨询工单已超时，当前负责人：${lead.assignedSalesName || CURRENT_SALES.name}。`,
        todo: true,
        actionable: true,
        actionUrl: '/admin/leads',
        actionLabel: '查看咨询商机池',
        sourceType: 'lead',
        sourceId: lead.id,
        templateTrigger: 'lead.unclaimed.overdue',
      });
    });
};

let salesLeadFollowupsState: SalesLeadFollowupRecord[] = [
  { id: 'lead-follow-001', leadId: 'lead-002', salesId: CURRENT_SALES.id, channel: 'phone', content: '首次电话沟通，客户希望重点了解企业微信登录、审批流接入和知识库问答能力。', nextFollowupAt: '2026-04-26 16:30', createdAt: '2026-04-24 10:35', creatorName: CURRENT_SALES.name },
  { id: 'lead-follow-002', leadId: 'lead-002', salesId: CURRENT_SALES.id, channel: 'wechat', content: '已确定周三演示，需准备制造业审批流案例和报价区间。', nextFollowupAt: '2026-04-30 10:00', createdAt: '2026-04-26 17:30', creatorName: CURRENT_SALES.name },
  { id: 'lead-follow-003', leadId: 'lead-003', salesId: CURRENT_SALES.id, channel: 'email', content: '发送文档安全和外网入口说明，客户确认可转入客户池继续推进。', nextFollowupAt: '2026-04-22 10:00', createdAt: '2026-04-20 18:20', creatorName: CURRENT_SALES.name },
  { id: 'lead-follow-004', leadId: 'lead-004', salesId: CURRENT_SALES.id, channel: 'phone', content: '客户主要在比较友商报价，暂未明确采购时间。', nextFollowupAt: '2026-04-15 16:00', createdAt: '2026-04-12 15:30', creatorName: CURRENT_SALES.name },
  { id: 'lead-follow-005', leadId: 'lead-004', salesId: CURRENT_SALES.id, channel: 'wechat', content: '客户反馈已签约友商，本条商机关闭。', createdAt: '2026-04-15 16:20', creatorName: CURRENT_SALES.name },
  { id: 'lead-reply-006', leadId: 'lead-006', salesId: CURRENT_SALES.id, channel: 'other', content: '已说明标准版续费与高级版升配的差价口径，客户确认本周期暂不调整，咨询已完结。', createdAt: '2026-04-26 16:10', creatorName: CURRENT_SALES.name },
];

let tenantBusinessConsultsState: TenantBusinessConsultRecord[] = [
  {
    id: 'lead-006',
    title: '续费与升配差价咨询',
    description: '咨询标准版席位到期前续费和升配到高级版的差价。',
    status: 'completed',
    assignedSalesName: CURRENT_SALES.name,
    createdAt: '2026-04-26 13:20',
    updatedAt: '2026-04-26 16:30',
    latestReply: '已说明标准版续费与高级版升配的差价口径，客户确认本周期暂不调整，咨询已完结。',
    latestReplyAt: '2026-04-26 16:10',
    completedAt: '2026-04-26 16:30',
  },
  {
    id: 'lead-005',
    title: '追加高级版席位咨询',
    description: '计划追加 10 个高级版席位，并咨询年度套餐折扣。',
    status: 'pending_reply',
    assignedSalesName: CURRENT_SALES.name,
    createdAt: '2026-04-28 08:40',
    updatedAt: '2026-04-28 08:40',
  },
];

let salesProfileState: SalesProfileDetail = {
  id: CURRENT_SALES.id,
  name: CURRENT_SALES.name,
  employeeNo: CURRENT_SALES.employeeNo,
  team: CURRENT_SALES.team,
  region: CURRENT_SALES.region,
  hiredAt: '2024-06-15',
  avatarText: '陈',
  phone: '13800138000',
  email: 'chenmo@ynzl.com',
  baseCommissionRate: 0.05,
  bankAccount: {
    accountName: '陈默',
    bankName: '招商银行',
    branchName: '上海张江支行',
    accountNo: '6225880012345678',
    status: 'active',
    updatedAt: '2026-04-20 10:30',
  },
  security: {
    lastPasswordUpdatedAt: '2026-03-02 09:12',
  },
};

const salesPerformanceState: SalesPerformancePoint[] = [
  { month: '2025-11', gmv: 68000, commission: 3400, newCustomers: 2 },
  { month: '2025-12', gmv: 72000, commission: 3600, newCustomers: 3 },
  { month: '2026-01', gmv: 43000, commission: 2150, newCustomers: 1 },
  { month: '2026-02', gmv: 55000, commission: 2750, newCustomers: 2 },
  { month: '2026-03', gmv: 91800, commission: 4590, newCustomers: 4 },
  { month: '2026-04', gmv: 86200, commission: 4300, newCustomers: 3 },
];

const externalOwnershipRegistry = new Map<string, OwnershipRecord>([
  ['91310115MA1K000099', { owner: 'other', tenantId: 'tenant-other-001' }],
  ['91310115MA1K000888', { owner: 'public', tenantId: 'tenant-public-001' }],
]);

const normalizeUscc = (value: string) => value.trim().toUpperCase();

const maskPhone = (value: string) =>
  value.length === 11 ? `${value.slice(0, 3)}****${value.slice(-4)}` : value;

const calcAttributionRemainingDays = (customer: Pick<SalesCustomerDetail, 'attributionStarted' | 'attributionValidUntil'>) => {
  if (!customer.attributionStarted || !customer.attributionValidUntil) {
    return null;
  }
  return dayjs(customer.attributionValidUntil).diff(currentDate(), 'day');
};

const resolveCustomerStatus = (customer: SalesCustomerDetail): SalesCustomerStatus => {
  if (customer.customerStatus === 'lost') return 'lost';
  const orders = salesOrdersState.filter((item) => item.tenantId === customer.id);
  const hasConvertedOrder = orders.some((item) => item.status === 'paid' || item.openingStatus === 'completed');
  if (hasConvertedOrder || customer.totalPaidAmount > 0 || customer.firstActivatedAt) {
    return 'converted';
  }
  return customer.lastFollowupAt ? 'following' : 'pending_followup';
};

const buildOwnershipRegistry = () => {
  const registry = new Map<string, OwnershipRecord>();
  salesCustomersState.forEach((customer) => {
    registry.set(normalizeUscc(customer.uscc), { owner: 'self', tenantId: customer.id });
  });
  externalOwnershipRegistry.forEach((value, key) => registry.set(key, value));
  return registry;
};

const resolveResourceStatus = <T extends { status: 'active' | 'disabled' | 'expired' | 'exhausted'; expiresAt?: string; maxUses: number | null; usedCount: number }>(
  item: T,
) => {
  if (item.status === 'disabled') return item.status;
  if (item.maxUses !== null && item.usedCount >= item.maxUses) return 'exhausted' as const;
  if (item.expiresAt && dayjs(item.expiresAt).isBefore(currentDate())) return 'expired' as const;
  return 'active' as const;
};

const findCustomer = (tenantId: string) => {
  const customer = salesCustomersState.find((item) => item.id === tenantId);
  if (!customer) {
    throw new Error('客户不存在');
  }
  return customer;
};

const buildDashboardSummary = (): SalesDashboardSummary => {
  const now = currentDate();
  const monthStart = now.startOf('month');
  const myCustomers = salesCustomersState;
  const myCommissions = getSalesCommissionsFromAdminMock(CURRENT_SALES.name);
  const monthPaidAmount = salesOrdersState
    .filter((item) => dayjs(item.paidAt ?? item.createdAt).isAfter(monthStart))
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const monthEstimatedCommission = myCommissions
    .filter((item) => dayjs(item.generatedAt).isAfter(monthStart))
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  const totalCommission = myCommissions
    .filter((item) => ['withdrawable', 'withdrawing', 'withdrawn'].includes(item.status))
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  const pendingCommissionAmount = myCommissions
    .filter((item) => item.status === 'estimated')
    .reduce((sum, item) => sum + item.commissionAmount, 0);

  return {
    greeting: `你好，${CURRENT_SALES.name}！本月已新增 ${myCustomers.filter((item) => dayjs(item.boundAt).isAfter(monthStart)).length} 个客户。`,
    monthNewCount: myCustomers.filter((item) => dayjs(item.boundAt).isAfter(monthStart)).length,
    myCustomerCount: myCustomers.length,
    monthPaidAmount,
    monthEstimatedCommission,
    inWindowCustomerCount: myCustomers.filter((item) => item.attributionStarted && item.attributionValidUntil && dayjs(item.attributionValidUntil).isAfter(now)).length,
    totalCommission,
    pendingCommissionAmount,
    unclaimedLeadCount: salesLeadsState.filter((item) => item.status === 'new' && item.assignedSalesId === CURRENT_SALES.id).length,
    overdueFollowupCount: myCustomers.filter((item) => item.lastFollowupAt && now.diff(dayjs(item.lastFollowupAt), 'day') > 14).length,
    expiringAttributionCount: myCustomers.filter((item) => {
      const diff = calcAttributionRemainingDays(item);
      if (diff === null) return false;
      return diff >= 0 && diff < 30;
    }).length,
  };
};

const buildTrend = (days = 30): SalesDashboardTrendPoint[] => {
  const now = currentDate();
  const myCommissions = getSalesCommissionsFromAdminMock(CURRENT_SALES.name);
  return Array.from({ length: days }).map((_, index) => {
    const date = now.subtract(days - 1 - index, 'day');
    const orders = salesOrdersState.filter((item) => item.status === 'paid' && dayjs(item.paidAt ?? item.createdAt).isSame(date, 'day'));
    const commissions = myCommissions.filter((item) => dayjs(item.generatedAt).isSame(date, 'day'));
    return {
      date: date.format('MM-DD'),
      paidAmount: orders.reduce((sum, item) => sum + item.amount, 0),
      estimatedCommission: commissions.reduce((sum, item) => sum + item.commissionAmount, 0),
    };
  });
};

const buildTopCustomers = (limit = 10): SalesTopCustomer[] =>
  salesCustomersState
    .map((customer) => {
      const latestUsage = salesUsageState[customer.id]?.[salesUsageState[customer.id].length - 1];
      const previousUsage = salesUsageState[customer.id]?.[salesUsageState[customer.id].length - 2];
      return {
        tenantId: customer.id,
        customerName: customer.tenantName,
        monthToken: latestUsage?.tokenConsumed ?? 0,
        monthActiveEmployees: latestUsage?.activeEmployees ?? 0,
        customerStatus: resolveCustomerStatus(customer),
        growth: previousUsage ? Math.round((((latestUsage?.tokenConsumed ?? 0) - previousUsage.tokenConsumed) / Math.max(previousUsage.tokenConsumed, 1)) * 100) : 0,
      };
    })
    .sort((left, right) => right.monthToken - left.monthToken)
    .slice(0, limit);

const getUsccAvailability = (uscc: string): SalesUsccCheckResult => {
  const normalized = normalizeUscc(uscc);
  if (!normalized) {
    return { available: true };
  }
  const ownership = buildOwnershipRegistry().get(normalized);
  if (!ownership) {
    return { available: true };
  }
  if (ownership.owner === 'self') {
    return { available: false, reason: 'owned_by_self', tenantId: ownership.tenantId };
  }
  return { available: false, reason: 'owned_by_other' };
};

const mapCustomerListItem = (customer: SalesCustomerDetail): SalesCustomerListItem => ({
  id: customer.id,
  tenantName: customer.tenantName,
  uscc: customer.uscc,
  primaryContactName: customer.primaryContactName,
  primaryContactPhone: customer.primaryContactPhone,
  primaryContactEmail: customer.primaryContactEmail,
  industry: customer.industry,
  customerStatus: resolveCustomerStatus(customer),
  boundAt: customer.boundAt,
  firstActivatedAt: customer.firstActivatedAt,
  attributionValidUntil: customer.attributionValidUntil,
  attributionStarted: customer.attributionStarted,
  lastFollowupAt: customer.lastFollowupAt,
  totalPaidAmount: customer.totalPaidAmount,
  totalCommissionAmount: customer.totalCommissionAmount,
  accountManagerName: customer.accountManagerName,
  accountManagerNote: customer.accountManagerNote,
  salesRemark: customer.salesRemark,
  customTags: [...customer.customTags],
  boundSource: customer.boundSource,
});

const filterCustomers = (query: SalesCustomerQuery = {}) => {
  const now = currentDate();
  const q = query.q?.trim().toLowerCase();
  let rows = salesCustomersState.filter((customer) => {
    if (!q) return true;
    return [
      customer.tenantName,
      customer.uscc,
      customer.primaryContactName,
      customer.primaryContactPhone,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  if (query.status && query.status !== 'all') {
    rows = rows.filter((item) => resolveCustomerStatus(item) === query.status);
  }
  if (query.industry && query.industry !== 'all') {
    rows = rows.filter((item) => item.industry === query.industry);
  }
  if (query.boundDateFrom) {
    rows = rows.filter((item) => dayjs(item.boundAt).isAfter(dayjs(query.boundDateFrom).subtract(1, 'day')));
  }
  if (query.boundDateTo) {
    rows = rows.filter((item) => dayjs(item.boundAt).isBefore(dayjs(query.boundDateTo).add(1, 'day')));
  }
  if (query.attention === 'overdue') {
    rows = rows.filter((item) => item.lastFollowupAt && now.diff(dayjs(item.lastFollowupAt), 'day') > 14);
  }
  if (query.attention === 'expiring') {
    rows = rows.filter((item) => {
      const days = calcAttributionRemainingDays(item);
      if (days === null) return false;
      return days >= 0 && days < 30;
    });
  }

  const sortBy = query.sortBy ?? 'bound_at_desc';
  rows = rows.sort((left, right) => {
    if (sortBy === 'commission_desc') return right.totalCommissionAmount - left.totalCommissionAmount;
    if (sortBy === 'followup_desc') return dayjs(right.lastFollowupAt ?? 0).valueOf() - dayjs(left.lastFollowupAt ?? 0).valueOf();
    return dayjs(right.boundAt).valueOf() - dayjs(left.boundAt).valueOf();
  });

  return rows.map(mapCustomerListItem);
};

const createCustomerRecord = (
  payload: SalesCustomerFormPayload,
  boundSource: 'share_link' | 'invite_code' | 'manual' | 'consult_lead',
  options?: { status?: 'pending_followup' | 'following'; resourceId?: string; leadId?: string; sourceLabel?: string },
) => {
  const createdAt = currentDate().format('YYYY-MM-DD HH:mm');
  const id = `tenant-${Date.now()}`;
  const detail: SalesCustomerDetail = {
    id,
    tenantName: payload.tenantName.trim(),
    uscc: normalizeUscc(payload.uscc),
    primaryContactName: payload.primaryContactName.trim(),
    primaryContactPhone: payload.primaryContactPhone.trim(),
    primaryContactEmail: payload.primaryContactEmail?.trim(),
    industry: payload.industry,
    customerStatus: options?.status ?? 'pending_followup',
    boundAt: createdAt,
    attributionStarted: false,
    lastFollowupAt: undefined,
    totalPaidAmount: 0,
    totalCommissionAmount: 0,
    accountManagerName: undefined,
    accountManagerNote: payload.accountManagerNote?.trim(),
    salesRemark: payload.salesRemark?.trim(),
    customTags: payload.source ? [payload.source] : [],
    boundSource,
    address: payload.address?.trim() || '待客户补充',
    website: payload.website?.trim() || undefined,
    companySize: '待确认',
    companyStage: '新线索',
    adminName: payload.primaryContactName.trim(),
    adminPhone: payload.primaryContactPhone.trim(),
    adminEmail: payload.primaryContactEmail?.trim() ?? '',
    bindingSourceLabel: options?.sourceLabel ?? sourceLabelMap[boundSource],
    ownerSalesName: CURRENT_SALES.name,
    activeEmployeeCount: 0,
  };
  salesCustomersState = [detail, ...salesCustomersState];
  salesUsageState[id] = [
    { month: currentDate().subtract(1, 'month').format('YYYY-MM'), tokenConsumed: 0, activeEmployees: 0 },
    { month: currentDate().format('YYYY-MM'), tokenConsumed: 0, activeEmployees: 0 },
  ];

  if (options?.resourceId) {
    salesRegistrationsState = [
      {
        id: `registration-${Date.now()}`,
        tenantId: id,
        tenantName: detail.tenantName,
        uscc: detail.uscc,
        contactName: detail.primaryContactName,
        createdAt,
        source: boundSource,
        sourceLabel: options.sourceLabel ?? sourceLabelMap[boundSource],
        resourceId: options.resourceId,
      },
      ...salesRegistrationsState,
    ];
  }

  if (options?.leadId) {
    salesLeadsState = salesLeadsState.map((lead) =>
      lead.id === options.leadId
        ? {
            ...lead,
            status: 'converted',
            convertedTenantId: id,
            lastFollowupAt: createdAt,
            latestFollowupSummary: '已转客户池。',
          }
        : lead,
    );
  }

  return detail;
};

const resolveRefToken = (payload?: string) => {
  if (!payload) return undefined;
  return salesShareLinksState.find((item) => item.refToken === payload && resolveResourceStatus(item) === 'active');
};

const resolveInviteCode = (code?: string) => {
  if (!code) return undefined;
  return salesInviteCodesState.find((item) => item.code === code.trim().toUpperCase() && resolveResourceStatus(item) === 'active');
};

export const salesMockApi = {
  getSalesDashboardSummary() {
    return delay(buildDashboardSummary());
  },

  getSalesDashboardRevenueTrend(days = 30) {
    return delay(buildTrend(days));
  },

  getSalesDashboardTopCustomers(limit = 10) {
    return delay(buildTopCustomers(limit));
  },

  getSalesCustomers(query?: SalesCustomerQuery) {
    return delay(filterCustomers(query));
  },

  getSalesIndustries() {
    return delay([...industryOptions]);
  },

  checkSalesCustomerUscc(uscc: string) {
    return delay(getUsccAvailability(uscc));
  },

  createSalesCustomer(payload: SalesCustomerFormPayload) {
    const availability = getUsccAvailability(payload.uscc);
    if (!availability.available) {
      throw new Error(availability.reason === 'owned_by_self' ? '该客户已在你的客户池中' : '该客户已被他人录入，不可重复添加');
    }
    return delay(createCustomerRecord(payload, 'manual'));
  },

  convertSalesLead(leadId: string, payload: SalesCustomerFormPayload) {
    const availability = getUsccAvailability(payload.uscc);
    if (!availability.available) {
      throw new Error(availability.reason === 'owned_by_self' ? '该客户已在你的客户池中' : '该客户已被他人录入，不可重复添加');
    }
    return delay(createCustomerRecord(payload, 'consult_lead', { leadId, sourceLabel: '咨询商机' }));
  },

  getSalesCustomerDetail(tenantId: string) {
    const customer = findCustomer(tenantId);
    return delay(clone({ ...customer, customerStatus: resolveCustomerStatus(customer) }));
  },

  updateSalesCustomer(tenantId: string, patch: SalesCustomerPatchPayload) {
    salesCustomersState = salesCustomersState.map((item) =>
      item.id === tenantId
        ? {
            ...item,
            accountManagerNote: patch.accountManagerNote ?? item.accountManagerNote,
            salesRemark: patch.salesRemark ?? item.salesRemark,
            customTags: patch.customTags ? [...patch.customTags] : item.customTags,
          }
        : item,
    );
    return delay(clone(findCustomer(tenantId)));
  },

  batchUpdateSalesCustomerManagerNote(tenantIds: string[], accountManagerNote: string) {
    const normalized = accountManagerNote.trim();
    salesCustomersState = salesCustomersState.map((item) =>
      tenantIds.includes(item.id)
        ? {
            ...item,
            accountManagerNote: normalized || undefined,
          }
        : item,
    );
    return delay({ updatedCount: tenantIds.length });
  },

  getSalesCustomerOrders(tenantId: string) {
    const adminOrders = getSalesCustomerOrdersFromAdminMock(tenantId);
    const adminOrderIds = new Set(adminOrders.map((item) => item.id));
    return delay(clone([...adminOrders, ...salesOrdersState.filter((item) => item.tenantId === tenantId && !adminOrderIds.has(item.id))]));
  },

  getSalesCustomerUsage(tenantId: string) {
    return delay(clone(salesUsageState[tenantId] ?? []));
  },

  getSalesCustomerFollowups(tenantId: string) {
    return delay(clone(salesFollowupsState.filter((item) => item.tenantId === tenantId).sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf())));
  },

  createSalesCustomerFollowup(tenantId: string, payload: SalesFollowupPayload) {
    const createdAt = currentDate().format('YYYY-MM-DD HH:mm');
    const followup: SalesFollowupRecord = {
      id: `followup-${Date.now()}`,
      tenantId,
      salesId: CURRENT_SALES.id,
      channel: payload.channel,
      content: payload.content.trim(),
      nextFollowupAt: payload.nextFollowupAt,
      remind: payload.remind,
      createdAt,
      creatorName: CURRENT_SALES.name,
    };
    salesFollowupsState = [followup, ...salesFollowupsState];
    salesCustomersState = salesCustomersState.map((item) => {
      if (item.id !== tenantId) return item;
      const resolvedStatus = resolveCustomerStatus(item);
      const nextStatus: SalesCustomerStatus = resolvedStatus === 'converted' ? 'converted' : 'following';
      return {
        ...item,
        customerStatus: nextStatus,
        lastFollowupAt: createdAt,
      };
    });
    return delay(clone(followup));
  },

  markSalesCustomerLost(tenantId: string, payload: SalesCustomerLostPayload) {
    const customer = findCustomer(tenantId);
    const createdAt = currentDate().format('YYYY-MM-DD HH:mm');
    const reason = payload.reason.trim();
    const followup: SalesFollowupRecord = {
      id: `followup-${Date.now()}`,
      tenantId,
      salesId: CURRENT_SALES.id,
      channel: 'other',
      content: reason ? `人工标记流失：${reason}` : '人工标记流失',
      remind: false,
      createdAt,
      creatorName: CURRENT_SALES.name,
    };
    salesFollowupsState = [followup, ...salesFollowupsState];
    salesCustomersState = salesCustomersState.map((item) =>
      item.id === tenantId
        ? {
            ...item,
            customerStatus: 'lost',
            lastFollowupAt: createdAt,
            salesRemark: reason ? `${item.salesRemark || ''}${item.salesRemark ? '\n' : ''}流失原因：${reason}` : item.salesRemark,
          }
        : item,
    );
    return delay(clone({ ...customer, customerStatus: 'lost', lastFollowupAt: createdAt }));
  },

  getSalesCustomerCommissions(tenantId: string) {
    return delay(clone(getSalesCustomerCommissionsFromAdminMock(tenantId, CURRENT_SALES.name)));
  },

  exportSalesCustomers(customerIds?: string[]) {
    const rows = customerIds?.length
      ? salesCustomersState.filter((item) => customerIds.includes(item.id))
      : salesCustomersState;
    return delay({
      fileName: `客户池导出_${CURRENT_SALES.name}_${currentDate().format('YYYYMMDD_HHmm')}.csv`,
      rowCount: rows.length,
    });
  },

  getSalesOpeningTasks() {
    return delay(clone(getSalesOpeningTasksFromAdminMock()));
  },

  getSalesOpeningTaskDetail(id: string) {
    return delay(clone(getSalesOpeningTasksFromAdminMock().find((item) => item.id === id)));
  },

  getSalesOrderFollowups(): Promise<SalesOrderFollowupRecord[]> {
    return delay(clone(getSalesOrderFollowupsFromAdminMock(CURRENT_SALES.name)));
  },

  getSalesShareLinks() {
    return delay(
      clone(
        salesShareLinksState.map((item) => ({
          ...item,
          status: resolveResourceStatus(item),
        })),
      ),
    );
  },

  createSalesShareLink(payload: SalesShareCreatePayload) {
    const id = `link-${Date.now()}`;
    const token = `ref-${Date.now()}`;
    const link: InternalShareLink = {
      id,
      salesId: CURRENT_SALES.id,
      name: payload.name.trim(),
      shortCode: `SC${String(Date.now()).slice(-4)}`,
      shortUrl: `https://arkclaw.yunnao.example/register?ref=${token}`,
      qrUrl: `https://arkclaw.yunnao.example/register?ref=${token}`,
      remark: payload.remark?.trim(),
      maxUses: payload.maxUses ?? null,
      usedCount: 0,
      expiresAt: payload.expiresInDays ? currentDate().add(payload.expiresInDays, 'day').format('YYYY-MM-DD HH:mm') : undefined,
      status: 'active',
      createdAt: currentDate().format('YYYY-MM-DD HH:mm'),
      refToken: token,
    };
    salesShareLinksState = [link, ...salesShareLinksState];
    return delay(clone(link));
  },

  disableSalesShareLink(linkId: string) {
    salesShareLinksState = salesShareLinksState.map((item) => (item.id === linkId ? { ...item, status: 'disabled' } : item));
    return delay(clone(salesShareLinksState.find((item) => item.id === linkId)));
  },

  getSalesShareLinkRegistrations(linkId: string) {
    return delay(clone(salesRegistrationsState.filter((item) => item.resourceId === linkId)));
  },

  getSalesInviteCodes() {
    return delay(
      clone(
        salesInviteCodesState.map((item) => ({
          ...item,
          status: resolveResourceStatus(item),
        })),
      ),
    );
  },

  createSalesInviteCode(payload: SalesShareCreatePayload) {
    const code = `K${String(Date.now()).slice(-5)}`.replace(/0/g, '8');
    const record: InternalInviteCode = {
      id: `code-${Date.now()}`,
      salesId: CURRENT_SALES.id,
      name: payload.name.trim(),
      code,
      remark: payload.remark?.trim(),
      maxUses: payload.maxUses ?? null,
      usedCount: 0,
      expiresAt: payload.expiresInDays ? currentDate().add(payload.expiresInDays, 'day').format('YYYY-MM-DD HH:mm') : undefined,
      status: 'active',
      createdAt: currentDate().format('YYYY-MM-DD HH:mm'),
    };
    salesInviteCodesState = [record, ...salesInviteCodesState];
    return delay(clone(record));
  },

  disableSalesInviteCode(codeId: string) {
    salesInviteCodesState = salesInviteCodesState.map((item) => (item.id === codeId ? { ...item, status: 'disabled' } : item));
    return delay(clone(salesInviteCodesState.find((item) => item.id === codeId)));
  },

  getSalesCommissions(query?: SalesCommissionQuery) {
    let rows = [...getSalesCommissionsFromAdminMock(CURRENT_SALES.name)];
    const q = query?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter((item) => `${item.orderId} ${item.tenantName}`.toLowerCase().includes(q));
    }
    if (query?.status?.length) {
      rows = rows.filter((item) => query.status?.includes(item.status));
    }
    if (typeof query?.minAmount === 'number') {
      rows = rows.filter((item) => item.commissionAmount >= query.minAmount!);
    }
    if (typeof query?.maxAmount === 'number') {
      rows = rows.filter((item) => item.commissionAmount <= query.maxAmount!);
    }
    if (query?.dateFrom) {
      rows = rows.filter((item) => dayjs(item.generatedAt).isAfter(dayjs(query.dateFrom).subtract(1, 'day')));
    }
    if (query?.dateTo) {
      rows = rows.filter((item) => dayjs(item.generatedAt).isBefore(dayjs(query.dateTo).add(1, 'day')));
    }
    rows.sort((left, right) => dayjs(right.generatedAt).valueOf() - dayjs(left.generatedAt).valueOf());
    return delay(clone(rows));
  },

  getSalesCommissionSummary(query?: SalesCommissionQuery): Promise<SalesCommissionSummary> {
    let filteredRows = [...getSalesCommissionsFromAdminMock(CURRENT_SALES.name)];
    const q = query?.q?.trim().toLowerCase();
    if (q) {
      filteredRows = filteredRows.filter((item) => `${item.orderId} ${item.tenantName}`.toLowerCase().includes(q));
    }
    if (query?.status?.length) {
      filteredRows = filteredRows.filter((item) => query.status?.includes(item.status));
    }
    if (typeof query?.minAmount === 'number') {
      filteredRows = filteredRows.filter((item) => item.commissionAmount >= query.minAmount!);
    }
    if (typeof query?.maxAmount === 'number') {
      filteredRows = filteredRows.filter((item) => item.commissionAmount <= query.maxAmount!);
    }
    if (query?.dateFrom) {
      filteredRows = filteredRows.filter((item) => dayjs(item.generatedAt).isAfter(dayjs(query.dateFrom).subtract(1, 'day')));
    }
    if (query?.dateTo) {
      filteredRows = filteredRows.filter((item) => dayjs(item.generatedAt).isBefore(dayjs(query.dateTo).add(1, 'day')));
    }
    const summary: SalesCommissionSummary = {
      totalOrderAmount: filteredRows.reduce((sum, item) => sum + item.orderAmount, 0),
      totalCommissionAmount: filteredRows.reduce((sum, item) => sum + item.commissionAmount, 0),
      estimatedAmount: filteredRows.filter((item) => item.status === 'estimated').reduce((sum, item) => sum + item.commissionAmount, 0),
      withdrawableAmount: filteredRows.filter((item) => item.status === 'withdrawable').reduce((sum, item) => sum + item.commissionAmount, 0),
      withdrawingAmount: filteredRows.filter((item) => item.status === 'withdrawing').reduce((sum, item) => sum + item.commissionAmount, 0),
      withdrawnAmount: filteredRows.filter((item) => item.status === 'withdrawn').reduce((sum, item) => sum + item.commissionAmount, 0),
      monthNewEstimatedAmount: filteredRows
        .filter((item) => dayjs(item.generatedAt).isSame(currentDate(), 'month'))
        .filter((item) => item.status === 'estimated')
        .reduce((sum, item) => sum + item.commissionAmount, 0),
      byStatus: commissionStatuses.map((status) => ({
        status,
        amount: filteredRows.filter((item) => item.status === status).reduce((sum, item) => sum + item.commissionAmount, 0),
      })),
    };
    return delay(summary);
  },

  exportSalesCommissions() {
    const rows = getSalesCommissionsFromAdminMock(CURRENT_SALES.name);
    return delay({
      fileName: `佣金明细_${CURRENT_SALES.name}_${currentDate().format('YYYYMMDD_HHmm')}.csv`,
      rowCount: rows.length,
    });
  },

  confirmSalesCommission(id: string) {
    return confirmSalesCommissionFromAdminMock(id, CURRENT_SALES.name);
  },

  requestSalesCommissionWithdraw(ids?: string[]) {
    return requestSalesCommissionWithdrawFromAdminMock(CURRENT_SALES.name, ids);
  },

  getAgentCommissions(view: AgentCommissionView, query?: AgentCommissionQuery, role: AgentCommissionRole = 'agentAdmin') {
    const rows = getAgentCommissionRowsByView(view, role);
    return delay(clone(filterAgentCommissionRows(rows, query)));
  },

  getAgentCommissionSummary(view: AgentCommissionView, query?: AgentCommissionQuery, role: AgentCommissionRole = 'agentAdmin') {
    const rows = getAgentCommissionRowsByView(view, role);
    return delay(clone(buildAgentCommissionSummary(filterAgentCommissionRows(rows, query))));
  },

  getAgentCommissionDetail(id: string, view: AgentCommissionView, role: AgentCommissionRole = 'agentAdmin') {
    const rows = getAgentCommissionRowsByView(view, role);
    return delay(clone(rows.find((item) => item.id === id)));
  },

  getAgentCommissionPayoutAccount() {
    return delay(clone(AGENT_PAYOUT_ACCOUNT));
  },

  requestAgentCommissionWithdraw(ids?: string[]) {
    const time = currentDate().format('YYYY-MM-DD HH:mm');
    const targetRows = agentCommissionState.filter((item) => item.status === 'withdrawable' && (!ids?.length || ids.includes(item.id)));
    if (!targetRows.length) {
      return delay<AgentCommissionWithdrawRecord>({
        id: `AGW-${currentDate().format('YYYYMMDD')}-000`,
        amount: 0,
        updatedCount: 0,
        status: 'withdrawing',
        requestedAt: time,
        accountName: AGENT_PAYOUT_ACCOUNT.accountName,
        bankName: AGENT_PAYOUT_ACCOUNT.bankName,
        branchName: AGENT_PAYOUT_ACCOUNT.branchName,
        accountNo: AGENT_PAYOUT_ACCOUNT.accountNo,
      });
    }
    agentCommissionState = agentCommissionState.map((item) =>
      targetRows.some((target) => target.id === item.id)
        ? {
            ...item,
            status: 'withdrawing',
            settlementNote: `已发起代理提现申请，等待平台财务线下打款（${time}）`,
          }
        : item,
    );
    return delay<AgentCommissionWithdrawRecord>({
      id: `AGW-${currentDate().format('YYYYMMDD')}-${String(targetRows.length).padStart(3, '0')}`,
      amount: targetRows.reduce((sum, item) => sum + item.commissionAmount, 0),
      updatedCount: targetRows.length,
      status: 'withdrawing',
      requestedAt: time,
      accountName: AGENT_PAYOUT_ACCOUNT.accountName,
      bankName: AGENT_PAYOUT_ACCOUNT.bankName,
      branchName: AGENT_PAYOUT_ACCOUNT.branchName,
      accountNo: AGENT_PAYOUT_ACCOUNT.accountNo,
    });
  },

  exportAgentCommissions(view: AgentCommissionView, role: AgentCommissionRole = 'agentAdmin') {
    const rows = getAgentCommissionRowsByView(view, role);
    const suffix = view === 'agent' ? '代理佣金' : '销售分佣';
    return delay({
      fileName: `${suffix}_${currentDate().format('YYYYMMDD_HHmm')}.csv`,
      rowCount: rows.length,
    });
  },

  submitCustomerBusinessConsultOpportunity(payload: TenantSupportRequestPayload) {
    const normalizedTitle = normalizeCustomerRequestTitle(payload.title);
    const duplicateConsult = tenantBusinessConsultsState.find(
      (item) =>
        item.status !== 'completed' &&
        normalizeCustomerRequestTitle(item.title) === normalizedTitle,
    );
    if (duplicateConsult) {
      throw new Error(`已有未完结的相同咨询 ${duplicateConsult.id}，请等待归属代理回复或在原咨询中跟进。`);
    }
    const now = currentDate();
    const dailyConsultCount = tenantBusinessConsultsState.filter((item) => dayjs(item.createdAt).isSame(now, 'day')).length;
    if (dailyConsultCount >= CUSTOMER_DAILY_BUSINESS_CONSULT_LIMIT) {
      throw new Error(`同类咨询每日最多提交 ${CUSTOMER_DAILY_BUSINESS_CONSULT_LIMIT} 次，请明天再提交或联系归属代理。`);
    }

    const adminLead = createAdminCustomerBusinessConsultOpportunity(payload);
    const deadlineAt = now.add(24, 'hour').format('YYYY-MM-DD HH:mm');
    const createdAt = adminLead.createdAt;
    const record: SalesLeadRecord = {
      id: adminLead.id,
      opportunityType: 'customer_business_consult',
      customerConsultStatus: 'pending_reply',
      company: adminLead.company,
      name: adminLead.contact,
      title: adminLead.title,
      phone: adminLead.phone,
      email: adminLead.email,
      requirement: adminLead.requirement,
      preferredChannel: '电话',
      preferredTime: '工作日',
      status: 'new',
      source: adminLead.source,
      createdAt,
      assignedSalesId: CURRENT_SALES.id,
      assignedSalesName: CURRENT_SALES.name,
      followupCount: 0,
      slaDeadlineAt: deadlineAt,
    };
    salesLeadsState = [record, ...salesLeadsState];
    tenantBusinessConsultsState = [
      {
        id: record.id,
        title: payload.title,
        description: payload.description,
        status: 'pending_reply',
        assignedSalesName: CURRENT_SALES.name,
        createdAt,
        updatedAt: createdAt,
      },
      ...tenantBusinessConsultsState,
    ];
    createNotification({
      role: 'sales',
      category: 'lead',
      priority: 'high',
      title: '新咨询工单待跟进',
      summary: `${record.company} 提交了席位/套餐咨询，请尽快联系客户。`,
      todo: true,
      actionable: true,
      actionUrl: '/sales/leads',
      actionLabel: '进入咨询工单池',
      sourceType: 'lead',
      sourceId: record.id,
      templateTrigger: 'opportunity.customer_business.assigned',
    });
    return delay(clone(record));
  },

  getTenantBusinessConsults() {
    return delay(clone(tenantBusinessConsultsState.sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf())));
  },

  replyCustomerBusinessConsultOpportunity(leadId: string, payload: { content: string }) {
    const content = payload.content.trim();
    const repliedAt = currentDate().format('YYYY-MM-DD HH:mm');
    if (!content) {
      return delay(undefined);
    }
    const followup: SalesLeadFollowupRecord = {
      id: `lead-reply-${Date.now()}`,
      leadId,
      salesId: CURRENT_SALES.id,
      channel: 'other',
      content,
      createdAt: repliedAt,
      creatorName: CURRENT_SALES.name,
    };
    salesLeadFollowupsState = [followup, ...salesLeadFollowupsState];
    salesLeadsState = salesLeadsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'following',
            customerConsultStatus: 'replied',
            followupCount: item.followupCount + 1,
            lastFollowupAt: repliedAt,
            latestFollowupSummary: content,
          }
        : item,
    );
    tenantBusinessConsultsState = tenantBusinessConsultsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'replied',
            latestReply: content,
            latestReplyAt: repliedAt,
            updatedAt: repliedAt,
          }
        : item,
    );
    createNotification({
      role: 'tenantAdmin',
      category: 'lead',
      priority: 'medium',
      title: '商务咨询已回复',
      summary: `${CURRENT_SALES.name} 已回复你的席位/套餐咨询。`,
      todo: true,
      actionable: true,
      actionUrl: '/tenant/consult',
      actionLabel: '查看回复',
      sourceType: 'lead',
      sourceId: leadId,
      templateTrigger: 'opportunity.customer_business.replied',
    });
    return delay(clone(salesLeadsState.find((item) => item.id === leadId)));
  },

  completeCustomerBusinessConsultOpportunity(leadId: string) {
    const completedAt = currentDate().format('YYYY-MM-DD HH:mm');
    salesLeadsState = salesLeadsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            customerConsultStatus: 'completed',
            latestFollowupSummary: item.latestFollowupSummary || '咨询已完结',
          }
        : item,
    );
    tenantBusinessConsultsState = tenantBusinessConsultsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'completed',
            completedAt,
            updatedAt: completedAt,
          }
        : item,
    );
    createNotification({
      role: 'tenantAdmin',
      category: 'lead',
      priority: 'low',
      title: '商务咨询已完结',
      summary: `${CURRENT_SALES.name} 已完结你的席位/套餐咨询。`,
      todo: false,
      actionable: true,
      actionUrl: '/tenant/consult',
      actionLabel: '查看咨询',
      sourceType: 'lead',
      sourceId: leadId,
      templateTrigger: 'opportunity.customer_business.completed',
    });
    return delay(clone(salesLeadsState.find((item) => item.id === leadId)));
  },

  getSalesLeads() {
    notifyOverdueSalesLeads();
    return delay(
      clone(
        salesLeadsState
          .filter((item) => item.opportunityType === 'customer_business_consult')
          .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf()),
      ),
    );
  },

  getSalesLeadFollowups(leadId: string) {
    return delay(clone(salesLeadFollowupsState.filter((item) => item.leadId === leadId).sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf())));
  },

  claimSalesLead(leadId: string) {
    const claimedAt = currentDate().format('YYYY-MM-DD HH:mm');
    salesLeadsState = salesLeadsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'claimed',
            assignedSalesId: CURRENT_SALES.id,
            assignedSalesName: CURRENT_SALES.name,
            claimedAt,
          }
        : item,
    );
    return delay(clone(salesLeadsState.find((item) => item.id === leadId)));
  },

  followSalesLead(leadId: string, payload: SalesLeadFollowPayload) {
    const followedAt = currentDate().format('YYYY-MM-DD HH:mm');
    const followup: SalesLeadFollowupRecord = {
      id: `lead-follow-${Date.now()}`,
      leadId,
      salesId: CURRENT_SALES.id,
      channel: payload.channel,
      content: payload.content.trim(),
      nextFollowupAt: payload.nextFollowupAt,
      createdAt: followedAt,
      creatorName: CURRENT_SALES.name,
    };
    salesLeadFollowupsState = [followup, ...salesLeadFollowupsState];
    salesLeadsState = salesLeadsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'following',
            followupCount: item.followupCount + 1,
            lastFollowupAt: followedAt,
            latestFollowupSummary: payload.content.trim(),
          }
        : item,
    );
    return delay(clone(salesLeadsState.find((item) => item.id === leadId)));
  },

  closeSalesLead(leadId: string, payload: SalesLeadClosePayload) {
    const closedAt = currentDate().format('YYYY-MM-DD HH:mm');
    salesLeadsState = salesLeadsState.map((item) =>
      item.id === leadId
        ? {
            ...item,
            status: 'closed',
            closeReason: payload.reason,
            closedAt,
            latestFollowupSummary: payload.note?.trim() || item.latestFollowupSummary,
          }
        : item,
    );
    return delay(clone(salesLeadsState.find((item) => item.id === leadId)));
  },

  getSalesProfile() {
    return delay(clone(salesProfileState));
  },

  updateSalesProfile(payload: SalesProfileUpdatePayload) {
    salesProfileState = {
      ...salesProfileState,
      phone: payload.phone.trim(),
      email: payload.email.trim(),
    };
    return delay(clone(salesProfileState));
  },

  updateSalesPassword() {
    salesProfileState = {
      ...salesProfileState,
      security: {
        ...salesProfileState.security,
        lastPasswordUpdatedAt: currentDate().format('YYYY-MM-DD HH:mm'),
      },
    };
    return delay({ updatedAt: salesProfileState.security.lastPasswordUpdatedAt });
  },

  getSalesPerformance() {
    return delay(clone(salesPerformanceState));
  },

  checkPublicRegisterRef(payload?: string): Promise<PublicRegisterRefCheckResult> {
    const link = resolveRefToken(payload);
    if (!payload) {
      return delay({ valid: false, tip: '未检测到代理分享链接，可继续普通注册。' });
    }
    if (!link) {
      return delay({ valid: false, tip: '分享链接已失效，将按普通注册处理。' });
    }
    return delay({
      valid: true,
      salesId: CURRENT_SALES.id,
      salesName: CURRENT_SALES.name,
      sourceType: 'share_link',
      sourceName: link.name,
      tip: `已通过 ${CURRENT_SALES.name} 的分享链接进入注册流程。`,
    });
  },

  checkPublicRegisterUscc(uscc: string) {
    return delay(getUsccAvailability(uscc));
  },

  checkPublicRegisterInviteCode(code?: string): Promise<PublicInviteCodeCheckResult> {
    if (!code?.trim()) {
      return delay({ valid: false, reason: 'invalid' });
    }
    const record = salesInviteCodesState.find((item) => item.code === code.trim().toUpperCase());
    if (!record) {
      return delay({ valid: false, reason: 'invalid' });
    }
    const status = resolveResourceStatus(record);
    if (status !== 'active') {
      return delay({ valid: false, reason: status as 'expired' | 'disabled' | 'exhausted' });
    }
    return delay({
      valid: true,
      codeId: record.id,
      salesId: CURRENT_SALES.id,
      salesName: CURRENT_SALES.name,
    });
  },

  publicRegister(payload: PublicRegisterPayload): Promise<PublicRegisterResult> {
    if (!payload.agree || !payload.verificationPassed) {
      throw new Error('请完成协议勾选和人机验证');
    }
    const availability = getUsccAvailability(payload.uscc);
    if (!availability.available) {
      throw new Error(availability.reason === 'owned_by_self' ? '该客户已在你的客户池中' : '贵公司已在平台注册过，请联系您的客户经理');
    }

    const link = resolveRefToken(payload.refPayload);
    const inviteCode = resolveInviteCode(payload.inviteCode);
    let bound = false;
    let salesName: string | undefined;
    let tenantId = `public-${Date.now()}`;

    if (link) {
      const customer = createCustomerRecord(
        {
          tenantName: payload.companyName,
          uscc: payload.uscc,
          primaryContactName: payload.contactName,
          primaryContactPhone: payload.phone,
          primaryContactEmail: payload.email,
          industry: payload.industry?.trim() || '企业服务',
          source: '官网咨询',
          address: payload.address,
          website: payload.website,
        },
        'share_link',
        { resourceId: link.id, sourceLabel: link.name },
      );
      salesShareLinksState = salesShareLinksState.map((item) => (item.id === link.id ? { ...item, usedCount: item.usedCount + 1 } : item));
      bound = true;
      salesName = CURRENT_SALES.name;
      tenantId = customer.id;
    } else if (inviteCode) {
      const customer = createCustomerRecord(
        {
          tenantName: payload.companyName,
          uscc: payload.uscc,
          primaryContactName: payload.contactName,
          primaryContactPhone: payload.phone,
          primaryContactEmail: payload.email,
          industry: payload.industry?.trim() || '企业服务',
          source: '官网咨询',
          address: payload.address,
          website: payload.website,
        },
        'invite_code',
        { resourceId: inviteCode.id, sourceLabel: inviteCode.name },
      );
      salesInviteCodesState = salesInviteCodesState.map((item) => (item.id === inviteCode.id ? { ...item, usedCount: item.usedCount + 1 } : item));
      bound = true;
      salesName = CURRENT_SALES.name;
      tenantId = customer.id;
    } else {
      externalOwnershipRegistry.set(normalizeUscc(payload.uscc), {
        owner: 'public',
        tenantId,
      });
    }

    return delay({
      tenantId,
      tenantName: payload.companyName.trim(),
      bound,
      salesName,
    });
  },

  getSalesStatusMeta() {
    return delay({
      statusLabelMap,
      sourceLabelMap,
      maskPhone,
    });
  },
};
