import dayjs from 'dayjs';
import { createNotification } from './notificationMockApi';
import type {
  AdminAlertRule,
  AdminCommissionBatch,
  AdminCommissionDashboardSummary,
  AdminCommissionRule,
  AdminCommissionTransaction,
  AdminCommissionWithdrawRecord,
  AdminDashboardSummary,
  AdminDictionaryRecord,
  AdminGlobalAuditRecord,
  AdminLeadFunnel,
  AdminLeadRecord,
  AdminAgentTenantDetail,
  AdminAgentTenantUpsertPayload,
  AdminMonitoringMetric,
  AdminNewsRecord,
  AdminNewsStats,
  AdminNotifyTemplate,
  AdminOpeningTaskRecord,
  AdminOrderDetail,
  AdminOrderRecord,
  AdminPlanHistoryRecord,
  AdminPlanRecord,
  AdminRefundRequest,
  AdminRolePermissionMatrix,
  AdminSalesDetail,
  AdminSalesTransferRequest,
  AdminStaffInheritancePayload,
  AdminStaffInheritancePreview,
  AdminStaffInheritancePreviewItem,
  AdminStaffInheritanceRoleAssignment,
  AdminStaffRecord,
  AdminSystemParam,
  AdminTenantDetail,
  AdminTenantOnboardingStatus,
  AdminTenantListItem,
  AdminTenantUsagePoint,
  AgentBalanceDashboardSummary,
  AgentBalanceLedgerQuery,
  AgentBalanceLedgerRecord,
  AgentBalancePaymentMethod,
  AgentBalanceSummary,
  AgentBalanceTopupOrder,
  AgentProcurementOrderRecord,
  AgentProcurementPaymentMethod,
  AdminBankTransferReviewItem,
  AdminAnomalyOrder,
  AdminRoleCode,
  BillingOrder,
  CouponBenefitType,
  CouponDiscountScope,
  CouponRecord,
  CouponUsageRecord,
  OrderBundleLine,
  SalesAssistedOrderResult,
  SalesCouponGrantRecord,
  SalesAdminAccount,
  SalesCouponOwnerRole,
  SalesCouponPoolRecord,
  SalesCouponTransferRecord,
  SalesCustomerCommissionRecord,
  SalesCustomerOrderRecord,
  SalesCommissionStatus,
  SalesOpeningTaskRecord,
  SalesOrderFollowupRecord,
  SalesOrderFollowupStatus,
  TenantSupportRequestPayload,
  TenantOpeningStatus,
} from '../types/domain';

const delay = <T,>(data: T, ms = 180) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), ms);
  });

const now = () => dayjs('2026-05-15 10:00');
const ORDER_PAYMENT_DEADLINE_HOURS = 24;

const money = (value: number) => `¥${value.toLocaleString()}`;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const getCouponBenefitType = (coupon?: Pick<CouponRecord, 'benefitType'>): CouponBenefitType =>
  coupon?.benefitType ?? 'voucher';
const isVoucherCoupon = (coupon?: Pick<CouponRecord, 'benefitType'>) => getCouponBenefitType(coupon) === 'voucher';
const isDiscountCoupon = (coupon?: Pick<CouponRecord, 'benefitType'>) => getCouponBenefitType(coupon) === 'coupon';

const SALES_ADMIN_ACCOUNTS: SalesAdminAccount[] = [
  {
    id: 'sales-admin-001',
    name: '周安',
    team: '华东代理一组',
  },
  {
    id: 'sales-admin-002',
    name: '孟琪',
    team: '华北代理组',
  },
];

const DEFAULT_SALES_ADMIN_ACCOUNT = SALES_ADMIN_ACCOUNTS[0];

const CURRENT_SALES_ACCOUNT = {
  id: 'sales-001',
  name: '陈默',
};

const escapeCsvCell = (value: unknown) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (headers: string[], rows: Array<Array<string | number | undefined>>) =>
  `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;

const defaultCommissionRate = () => Number(systemParamsState.find((item) => item.key === 'commission.default_rate')?.value ?? 0.05);

const getCommissionRateForSales = (salesName: string) =>
  salesState.find((item) => item.name === salesName)?.baseCommissionRate ?? defaultCommissionRate();

const createBundleLine = (
  id: string,
  productType: OrderBundleLine['productType'],
  productName: string,
  quantity: number,
  unit: OrderBundleLine['unit'],
  amount: number,
  specLabel?: string,
  cycleMonths?: number,
): OrderBundleLine => ({
  id,
  productType,
  productName,
  specLabel,
  quantity,
  unit,
  cycleMonths,
  amount,
});

const summarizeBundleLines = (bundleLines: OrderBundleLine[]) =>
  bundleLines
    .map((line) => `${line.productName}${line.specLabel ? ` ${line.specLabel}` : ''} ${line.quantity}${line.unit}`)
    .join(' / ');

const defaultBundleLinesForOrder = (orderType: string, amount: number): OrderBundleLine[] => {
  if (orderType.includes('组合包') || orderType.includes('高级版')) {
    return [
      createBundleLine('bundle-pro', 'seat', '高级版', 2, '席', 1720 * 12, '年付', 12),
      createBundleLine('bundle-standard', 'seat', '标准版', 24, '席', 430 * 12 * 24, '年付', 12),
      createBundleLine('bundle-lite', 'seat', '轻量版', 8, '席', 210 * 12 * 8, '年付', 12),
      createBundleLine('bundle-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 600 * 12 * 2, '年付', 12),
    ];
  }
  if (orderType.includes('标准版')) {
    return [
      createBundleLine('bundle-standard', 'seat', '标准版', 12, '席', Math.round(amount * 0.78), '季付', 3),
      createBundleLine('bundle-code-lite', 'coding_plan', 'CodingPlan Team Lite', 12, '份', amount - Math.round(amount * 0.78), '季付', 3),
    ];
  }
  if (orderType.includes('试点包')) {
    return [
      createBundleLine('bundle-lite', 'seat', '轻量版', 3, '席', Math.round(amount * 0.45), '试点包', 1),
      createBundleLine('bundle-pro', 'seat', '高级版', 2, '席', Math.round(amount * 0.35), '试点包', 1),
      createBundleLine('bundle-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', amount - Math.round(amount * 0.8), '试点包', 1),
    ];
  }
  return [createBundleLine('bundle-default', 'seat', orderType, 1, '席', amount)];
};

const getOrderBundleLines = (order: AdminOrderDetail) => order.bundleLines ?? defaultBundleLinesForOrder(order.orderType, order.amount);

const getOrderSeatCount = (order: AdminOrderDetail) => {
  if (!isSeatOpeningOrder(order)) return 0;
  return getOrderBundleLines(order)
    .filter((line) => line.productType === 'seat')
    .reduce((sum, line) => sum + line.quantity, 0);
};

let currentAdminRole: AdminRoleCode = 'R1.0';

let tenantsState: AdminTenantDetail[] = [
  {
    id: 'tenant-001',
    name: '云岭制造',
    uscc: '91310115MA1K000001',
    industry: '制造业',
    status: 'active',
    onboardingStatus: 'completed',
    ownerSales: '陈默',
    accountManager: '周安',
    seatSummary: '轻8 标24 高2 旗34',
    monthToken: 920000,
    monthGmv: 32800,
    createdAt: '2025-08-12',
    volcSpaceId: 'space-ynzl-001',
    address: '上海市闵行区申滨南路 700 号',
    website: 'https://www.yuling.com',
    contractStatus: '年框履约中',
    activeEmployees: 68,
    ownerSalesId: 'sales-001',
    accountManagerId: 'am-001',
    plans: [
      {
        id: 'plan-001-lite',
        level: 'lite',
        name: '轻量版',
        codingPlanName: 'CodingPlan Team Lite',
        includesCodingPlan: true,
        purchasedSeats: 8,
        assignedSeats: 0,
        remainingSeats: 8,
        quota: 250,
        maxApplyPerEmployee: 1,
        cycle: '年付',
        price: 20160,
        status: '生效中',
        effectiveAt: '2026-01-01',
      },
      {
        id: 'plan-001-standard',
        level: 'standard',
        name: '标准版',
        codingPlanName: 'CodingPlan Team Lite',
        includesCodingPlan: false,
        purchasedSeats: 24,
        assignedSeats: 18,
        remainingSeats: 6,
        quota: 125,
        maxApplyPerEmployee: 1,
        cycle: '年付',
        price: 12384,
        status: '生效中',
        effectiveAt: '2026-01-01',
      },
      {
        id: 'plan-001-pro',
        level: 'pro',
        name: '高级版',
        codingPlanName: 'CodingPlan Team Pro',
        includesCodingPlan: true,
        purchasedSeats: 2,
        assignedSeats: 1,
        remainingSeats: 1,
        quota: 60,
        maxApplyPerEmployee: 1,
        cycle: '年付',
        price: 12640,
        status: '生效中',
        effectiveAt: '2026-01-01',
      },
      {
        id: 'plan-001-ultimate',
        level: 'ultimate',
        name: '旗舰版',
        codingPlanName: 'CodingPlan Team Pro',
        includesCodingPlan: false,
        purchasedSeats: 34,
        assignedSeats: 12,
        remainingSeats: 22,
        quota: 30,
        maxApplyPerEmployee: 1,
        cycle: '年付',
        price: 58480,
        status: '生效中',
        effectiveAt: '2026-01-01',
      },
    ],
    admins: [
      { id: 'ta-001', name: '赵欣', email: 'zhaoxin@yuling.com', phone: '13800001111', role: 'R4', status: 'active', lastLoginAt: '2026-04-28 09:14' },
    ],
    bindings: [
      { id: 'bind-001', channel: '企业微信', status: 'active', scope: 'im', source: 'ops_im_binding', currentTicketId: 'OPS-202604280001', lastTestAt: '2026-04-28 10:29', lastTestResult: 'pass', lastChangedBy: 'DE-12 王澈', lastChangedAt: '2026-04-28 10:31', hint: '组织同步、登录回调均正常' },
      { id: 'bind-002', channel: '公网入口', status: 'active', scope: 'network', source: 'ops_network', currentTicketId: 'OPS-202604170021', lastTestAt: '2026-04-25 16:10', lastTestResult: 'pass', lastChangedBy: 'DE-09 何宇', lastChangedAt: '2026-04-25 16:12', hint: '自定义域名 claw.yl-manufacture.com 已生效' },
    ],
    audit: [
      { id: 'taudit-001', createdAt: '2026-04-28 10:31', actor: 'DE-12 王澈', action: '修改绑定配置', target: '企业微信绑定 bind-001', result: 'success' },
      { id: 'taudit-002', createdAt: '2026-04-28 10:29', actor: 'DE-12 王澈', action: '执行连通性测试', target: '企业微信绑定 bind-001', result: 'success' },
      { id: 'taudit-003', createdAt: '2026-04-25 16:12', actor: 'DE-09 何宇', action: '修改网络配置', target: '公网入口 bind-002', result: 'success' },
      { id: 'taudit-004', createdAt: '2026-04-24 10:24', actor: 'OP-1008 王珊', action: '代开订单', target: '订单 ORD-20260424-001', result: 'success' },
      { id: 'taudit-005', createdAt: '2026-04-24 09:48', actor: 'FI-2002 姚楠', action: '通过对公审核', target: '对公审核 BTR-20260424-001', result: 'success' },
      { id: 'taudit-006', createdAt: '2026-04-22 18:10', actor: 'CS-3012 许岚', action: '开始代登录', target: '代登录会话 IMP-20260422-003', result: 'success' },
      { id: 'taudit-007', createdAt: '2026-04-22 19:02', actor: 'CS-3012 许岚', action: '结束代登录', target: '代登录会话 IMP-20260422-003', result: 'success' },
      { id: 'taudit-008', createdAt: '2026-04-20 14:10', actor: 'SU-0001 林涛', action: '重置 R4 密码', target: '客户管理员 赵欣', result: 'success' },
      { id: 'taudit-009', createdAt: '2026-04-18 11:36', actor: 'OP-1008 王珊', action: '修改企业基础信息', target: '租户 云岭制造', result: 'success' },
      { id: 'taudit-010', createdAt: '2026-04-18 11:20', actor: 'OP-1008 王珊', action: '调整归属代理', target: '归属代理 陈默', result: 'success' },
    ],
    highRiskNotes: ['欠费风险低', '对公审核无积压'],
  },
  {
    id: 'tenant-002',
    name: '北辰科技',
    uscc: '91310115MA1K000002',
    industry: '软件服务',
    status: 'active',
    onboardingStatus: 'pending_order',
    ownerSales: '沈南',
    accountManager: '孟琪',
    seatSummary: '轻0 标42 高0 旗0',
    monthToken: 760000,
    monthGmv: 45200,
    createdAt: '2025-06-02',
    volcSpaceId: 'space-ynzl-002',
    address: '北京市海淀区上地十街 18 号',
    website: 'https://www.beichen-tech.cn',
    contractStatus: '续费谈判中',
    activeEmployees: 42,
    ownerSalesId: 'sales-004',
    accountManagerId: 'am-002',
    plans: [
      {
        id: 'plan-002',
        level: 'standard',
        name: '标准版',
        codingPlanName: 'CodingPlan Team Lite',
        includesCodingPlan: false,
        purchasedSeats: 42,
        assignedSeats: 42,
        remainingSeats: 0,
        quota: 125,
        maxApplyPerEmployee: 1,
        cycle: '季付',
        price: 33200,
        status: '生效中',
        effectiveAt: '2026-04-02',
      },
    ],
    admins: [
      { id: 'ta-003', name: '唐凯', email: 'tangkai@beichen.com', phone: '13800002222', role: 'R4', status: 'active', lastLoginAt: '2026-04-28 08:41' },
    ],
    bindings: [
      { id: 'bind-003', channel: '飞书', status: 'broken', scope: 'im', source: 'ops_im_binding', currentTicketId: 'OPS-202604280013', lastTestAt: '2026-04-28 08:43', lastTestResult: 'fail', lastChangedBy: 'TS-05 朱玥', lastChangedAt: '2026-04-28 08:45', hint: '回调验签失败，需在交付运维后台处理' },
    ],
    audit: [
      { id: 'taudit-003', createdAt: '2026-04-18 09:18', actor: '许岚 / CS-', action: '代登录排障', target: '唐凯', result: 'success' },
    ],
    highRiskNotes: ['归属期将到期', '续费窗口在 5 月'],
  },
  {
    id: 'tenant-003',
    name: '星河财税',
    uscc: '91310115MA1K000003',
    industry: '企业服务',
    status: 'not_opened',
    onboardingStatus: 'pending_finance_review',
    ownerSales: '陈默',
    accountManager: '周安',
    seatSummary: '轻0 标12 高0 旗0',
    monthToken: 630000,
    monthGmv: 21800,
    createdAt: '2026-04-02',
    volcSpaceId: 'space-ynzl-003',
    address: '杭州市西湖区文三路 99 号',
    website: 'https://www.xinghe-tax.cn',
    contractStatus: '待回款',
    activeEmployees: 12,
    ownerSalesId: 'sales-001',
    accountManagerId: 'am-001',
    plans: [
      {
        id: 'plan-003',
        level: 'standard',
        name: '标准版',
        codingPlanName: 'CodingPlan Team Lite',
        includesCodingPlan: false,
        purchasedSeats: 12,
        assignedSeats: 12,
        remainingSeats: 0,
        quota: 60,
        maxApplyPerEmployee: 1,
        cycle: '季付',
        price: 21800,
        status: '待对公审核',
        effectiveAt: '2026-04-22',
      },
    ],
    admins: [
      { id: 'ta-004', name: '周琳', email: 'zhoulin@xinghe-tax.com', phone: '13800003333', role: 'R4', status: 'active', lastLoginAt: '2026-04-26 16:18' },
    ],
    bindings: [
      { id: 'bind-004', channel: '企业微信', status: 'pending', scope: 'im', source: 'ops_im_binding', currentTicketId: 'OPS-202604270091', lastTestResult: 'untested', lastChangedBy: 'DE-09 何宇', lastChangedAt: '2026-04-27 13:20', hint: '待对公审核完成后执行连通性测试' },
    ],
    audit: [
      { id: 'taudit-004', createdAt: '2026-04-22 09:31', actor: 'FI-02 余晨', action: '标记对公转账待财务审核', target: 'ORD-20260422-006', result: 'success' },
    ],
    highRiskNotes: ['当前欠费', '对公待财务审核'],
  },
  {
    id: 'tenant-004',
    name: '灵川生物',
    uscc: '91310115MA1K000004',
    industry: '生物医药',
    status: 'suspended',
    onboardingStatus: 'failed',
    ownerSales: '许宁',
    accountManager: '孟琪',
    seatSummary: '轻8 标0 高0 旗0',
    monthToken: 510000,
    monthGmv: 6800,
    createdAt: '2026-04-10',
    volcSpaceId: 'space-ynzl-004',
    address: '武汉市东湖高新区高新大道 18 号',
    website: 'https://www.lingchuanbio.com',
    contractStatus: '已暂停',
    activeEmployees: 8,
    ownerSalesId: 'sales-003',
    accountManagerId: 'am-002',
    plans: [
      {
        id: 'plan-004',
        level: 'lite',
        name: '轻量版',
        codingPlanName: 'CodingPlan Team Lite',
        includesCodingPlan: true,
        purchasedSeats: 8,
        assignedSeats: 8,
        remainingSeats: 0,
        quota: 30,
        maxApplyPerEmployee: 1,
        cycle: '月付',
        price: 6800,
        status: '已暂停',
        effectiveAt: '2026-04-18',
      },
    ],
    admins: [
      { id: 'ta-005', name: '赵敏', email: 'zhaomin@lingchuanbio.com', phone: '13800004444', role: 'R4', status: 'suspended', lastLoginAt: '2026-04-17 12:11' },
    ],
    bindings: [
      { id: 'bind-005', channel: '钉钉', status: 'unconfigured', scope: 'im', source: 'ops_im_binding', currentTicketId: 'OPS-202604180031', lastTestResult: 'untested', hint: '企业已暂停，暂不进行绑定配置' },
    ],
    audit: [
      { id: 'taudit-005', createdAt: '2026-04-18 15:09', actor: '姚楠 / FI-', action: '暂停企业服务', target: 'ORD-20260418-031', result: 'success' },
    ],
    highRiskNotes: ['企业已暂停', '恢复前需复核企业采购信息'],
  },
];

let tenantUsageState: Record<string, AdminTenantUsagePoint[]> = {
  'tenant-001': [
    { month: '2025-11', token: 320000, activeEmployees: 32 },
    { month: '2025-12', token: 410000, activeEmployees: 41 },
    { month: '2026-01', token: 520000, activeEmployees: 52 },
    { month: '2026-02', token: 610000, activeEmployees: 58 },
    { month: '2026-03', token: 780000, activeEmployees: 63 },
    { month: '2026-04', token: 920000, activeEmployees: 68 },
  ],
  'tenant-002': [
    { month: '2025-11', token: 180000, activeEmployees: 18 },
    { month: '2025-12', token: 260000, activeEmployees: 24 },
    { month: '2026-01', token: 390000, activeEmployees: 31 },
    { month: '2026-02', token: 520000, activeEmployees: 36 },
    { month: '2026-03', token: 680000, activeEmployees: 39 },
    { month: '2026-04', token: 760000, activeEmployees: 42 },
  ],
  'tenant-003': [
    { month: '2026-02', token: 0, activeEmployees: 0 },
    { month: '2026-03', token: 12000, activeEmployees: 3 },
    { month: '2026-04', token: 48000, activeEmployees: 6 },
  ],
  'tenant-004': [
    { month: '2026-03', token: 0, activeEmployees: 0 },
    { month: '2026-04', token: 22000, activeEmployees: 4 },
  ],
};

let ordersState: AdminOrderDetail[] = [
  {
    id: 'ORD-20260429-088',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-088-standard', 'seat', '标准版', 4, '席', 1720, '月付', 1),
      createBundleLine('ord-088-code-lite', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 480, '月付', 1),
      createBundleLine('ord-088-pro', 'seat', '高级版', 2, '席', 1720, '月付', 1),
      createBundleLine('ord-088-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 1200, '月付', 1),
    ],
    amount: 16800,
    originalAmount: 18800,
    couponId: 'CPN-20260513-004',
    couponName: '订单 7 折代金券',
    couponDiscountAmount: 2000,
    couponUsageStatus: 'applied',
    paymentMethod: 'wechat',
    status: 'pending',
    createdAt: now().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    volcSyncStatus: 'pending',
    volcReceipt: '等待客户完成支付，可在支付页切换微信、支付宝或对公转账',
    timeline: [
      { id: 'tl-029088-001', time: '2026-04-29 15:20', title: '订单创建', detail: '客户确认席位组合包订单，尚未完成支付' },
    ],
  },
  {
    id: 'ORD-20260428-015',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-015-standard', 'seat', '标准版', 2, '席', 860, '月付', 1),
      createBundleLine('ord-015-code-lite', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
      createBundleLine('ord-015-pro', 'seat', '高级版', 2, '席', 1720, '月付', 1),
      createBundleLine('ord-015-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 1200, '月付', 1),
      createBundleLine('ord-015-ultimate', 'seat', '旗舰版', 2, '席', 3440, '月付', 1),
      createBundleLine('ord-015-code-ultimate', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 1200, '月付', 1),
    ],
    amount: 52000,
    originalAmount: 62000,
    couponId: 'CPN-20260513-001',
    couponName: '首批客户 5 折权益券',
    couponDiscountAmount: 10000,
    couponUsageStatus: 'applied',
    paymentMethod: 'alipay',
    status: 'paid',
    createdAt: '2026-04-28 08:12',
    paidAt: '2026-04-28 08:13',
    volcSyncStatus: 'success',
    volcReceipt: '支付宝支付成功，已生成开通工单',
    commissionId: 'commission-005',
    timeline: [
      { id: 'tl-028015-001', time: '2026-04-28 08:12', title: '订单创建', detail: '客户选择支付宝扫码支付席位组合包' },
      { id: 'tl-028015-002', time: '2026-04-28 08:13', title: '支付成功', detail: '支付宝回调确认到账，生成开通工单' },
    ],
  },
  {
    id: 'ORD-20260427-021',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-021-lite', 'seat', '轻量版', 4, '席', 840, '月付', 1),
      createBundleLine('ord-021-code-lite', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 480, '月付', 1),
      createBundleLine('ord-021-standard', 'seat', '标准版', 4, '席', 1720, '月付', 1),
      createBundleLine('ord-021-code-standard', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 480, '月付', 1),
      createBundleLine('ord-021-pro', 'seat', '高级版', 2, '席', 1720, '月付', 1),
      createBundleLine('ord-021-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 1200, '月付', 1),
    ],
    amount: 26000,
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: '2026-04-27 14:18',
    paidAt: '2026-04-27 14:19',
    volcSyncStatus: 'success',
    volcReceipt: '微信支付成功，已生成开通工单',
    timeline: [
      { id: 'tl-027021-001', time: '2026-04-27 14:18', title: '订单创建', detail: '客户选择微信扫码支付席位组合包' },
      { id: 'tl-027021-002', time: '2026-04-27 14:19', title: '支付成功', detail: '微信回调确认到账，生成开通工单' },
    ],
  },
  {
    id: 'ORD-20260425-012',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-012-lite', 'seat', '轻量版', 2, '席', 420, '月付', 1),
      createBundleLine('ord-012-code-lite', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
      createBundleLine('ord-012-standard', 'seat', '标准版', 2, '席', 860, '月付', 1),
      createBundleLine('ord-012-code-standard', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
      createBundleLine('ord-012-pro', 'seat', '高级版', 2, '席', 1720, '月付', 1),
      createBundleLine('ord-012-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 1200, '月付', 1),
    ],
    amount: 9600,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    createdAt: '2026-04-25 15:40',
    paidAt: '2026-04-25 17:10',
    volcSyncStatus: 'success',
    volcReceipt: '对公到账确认，已生成开通工单',
    timeline: [
      { id: 'tl-025012-001', time: '2026-04-25 15:40', title: '订单创建', detail: '客户生成对公转账订单' },
      { id: 'tl-025012-002', time: '2026-04-25 16:05', title: '上传付款凭证', detail: '客户上传 proof_25012.png，等待财务确认' },
      { id: 'tl-025012-003', time: '2026-04-25 17:10', title: '财务审核通过', detail: '对公转账确认到账，生成开通工单' },
    ],
  },
  {
    id: 'ORD-20260428-009',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    ownerSales: '沈南',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-009-standard', 'seat', '标准版', 4, '席', 20640, '年付', 12),
      createBundleLine('ord-009-code-lite', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 5760, '年付', 12),
      createBundleLine('ord-009-pro', 'seat', '高级版', 4, '席', 41280, '年付', 12),
      createBundleLine('ord-009-code-pro', 'coding_plan', 'CodingPlan Team Pro', 4, '份', 28800, '年付', 12),
      createBundleLine('ord-009-ultimate', 'seat', '旗舰版', 2, '席', 41280, '年付', 12),
      createBundleLine('ord-009-code-ultimate', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 14400, '年付', 12),
    ],
    amount: 128000,
    originalAmount: 146000,
    couponId: 'CPN-20260513-002',
    couponName: '续费谈判 7 折券',
    couponDiscountAmount: 18000,
    couponUsageStatus: 'applied',
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: '2026-04-28 09:20',
    paidAt: '2026-04-28 09:21',
    volcSyncStatus: 'pending',
    volcReceipt: '微信支付成功，已生成开通工单，退款申请待财务审批',
    commissionId: 'commission-010',
    timeline: [
      { id: 'tl-028009-001', time: '2026-04-28 09:20', title: '订单创建', detail: '客户选择微信扫码支付旗舰版组合' },
      { id: 'tl-028009-002', time: '2026-04-28 09:21', title: '支付成功', detail: '微信支付回调确认到账' },
      { id: 'tl-028009-003', time: '2026-04-28 09:50', title: '退款申请', detail: '平台运营提交重复付款退款申请，等待财务审批' },
    ],
  },
  {
    id: 'ORD-20260426-031',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-031-lite', 'seat', '轻量版', 3, '席', 3000, '试点包', 1),
      createBundleLine('ord-031-code-lite', 'coding_plan', 'CodingPlan Team Lite', 3, '份', 1200, '试点包', 1),
      createBundleLine('ord-031-pro', 'seat', '高级版', 2, '席', 3600, '试点包', 1),
      createBundleLine('ord-031-code', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 2200, '试点包', 1),
    ],
    amount: 8800,
    paymentMethod: 'alipay',
    status: 'paid',
    createdAt: '2026-04-26 10:00',
    paidAt: '2026-04-26 10:30',
    volcSyncStatus: 'pending',
    volcReceipt: '支付宝支付成功，交付已提交官网购买，等待确认开通',
    commissionId: 'commission-006',
    timeline: [
      { id: 'tl-026031-001', time: '2026-04-26 10:00', title: '订单创建', detail: '客户选择支付宝扫码支付试点包' },
      { id: 'tl-026031-002', time: '2026-04-26 10:30', title: '支付成功', detail: '支付宝回调确认到账，生成开通工单' },
    ],
  },
  {
    id: 'ORD-20260426-002',
    tenantId: 'tenant-005',
    tenantName: '杭州数智财税',
    ownerSales: '林嘉',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-002-lite', 'seat', '轻量版', 6, '席', 7560, '半年付', 6),
      createBundleLine('ord-002-code-lite', 'coding_plan', 'CodingPlan Team Lite', 6, '份', 4320, '半年付', 6),
      createBundleLine('ord-002-standard', 'seat', '标准版', 8, '席', 20640, '半年付', 6),
      createBundleLine('ord-002-code-standard', 'coding_plan', 'CodingPlan Team Lite', 8, '份', 5760, '半年付', 6),
      createBundleLine('ord-002-pro', 'seat', '高级版', 4, '席', 20640, '半年付', 6),
      createBundleLine('ord-002-code-pro', 'coding_plan', 'CodingPlan Team Pro', 4, '份', 14400, '半年付', 6),
    ],
    amount: 12000,
    paymentMethod: 'bank_transfer',
    status: 'pending_review',
    createdAt: '2026-04-26 17:12',
    volcSyncStatus: 'pending',
    volcReceipt: '客户已上传付款凭证，等待交付核查银行流水号',
    timeline: [
      { id: 'tl-026002-001', time: '2026-04-26 17:12', title: '订单创建', detail: '客户生成对公转账订单' },
      { id: 'tl-026002-002', time: '2026-04-26 17:20', title: '上传付款凭证', detail: '客户上传 proof_2602.png，等待交付核查' },
    ],
  },
  {
    id: 'ORD-20260424-001',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-001-lite', 'seat', '轻量版', 8, '席', 20160, '年付', 12),
      createBundleLine('ord-001-standard', 'seat', '标准版', 24, '席', 12384, '年付', 12),
      createBundleLine('ord-001-pro', 'seat', '高级版', 2, '席', 12640, '年付', 12),
      createBundleLine('ord-001-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 3600, '年付', 12),
    ],
    amount: 32800,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    createdAt: '2026-04-24 10:24',
    paidAt: '2026-04-24 10:24',
    volcSyncStatus: 'success',
    volcReceipt: '交付已完成官网代购并确认企业组合开通',
    commissionId: 'commission-001',
    timeline: [
      { id: 'tl-001', time: '2026-04-24 10:24', title: '订单创建', detail: '客户上传对公转账凭证' },
      { id: 'tl-002', time: '2026-04-24 10:24', title: '开通工单', detail: '已生成开通类交付工单并分配交付处理官网代购' },
      { id: 'tl-003', time: '2026-04-24 10:25', title: '佣金生成', detail: '代理佣金 pending 1640 元' },
    ],
  },
  {
    id: 'ORD-20260422-006',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-006-lite', 'seat', '轻量版', 4, '席', 2520, '季付', 3),
      createBundleLine('ord-006-code-lite', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 1440, '季付', 3),
      createBundleLine('ord-006-standard', 'seat', '标准版', 6, '席', 7740, '季付', 3),
      createBundleLine('ord-006-code-standard', 'coding_plan', 'CodingPlan Team Lite', 6, '份', 2160, '季付', 3),
      createBundleLine('ord-006-pro', 'seat', '高级版', 2, '席', 5160, '季付', 3),
      createBundleLine('ord-006-code-pro', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 3600, '季付', 3),
    ],
    amount: 21800,
    paymentMethod: 'bank_transfer',
    status: 'pending_review',
    createdAt: '2026-04-22 09:31',
    volcSyncStatus: 'pending',
    volcReceipt: '等待财务审核通过后生成开通类交付工单',
    timeline: [
      { id: 'tl-004', time: '2026-04-22 09:31', title: '订单创建', detail: '客户上传对公转账凭证' },
      { id: 'tl-005', time: '2026-04-22 09:40', title: '审核挂起', detail: '凭证金额疑似与订单不一致' },
    ],
  },
  {
    id: 'ORD-20260418-031',
    tenantId: 'tenant-004',
    tenantName: '灵川生物',
    ownerSales: '许宁',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-031-cancel-lite', 'seat', '轻量版', 2, '席', 420, '月付', 1),
      createBundleLine('ord-031-cancel-code-lite', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
      createBundleLine('ord-031-cancel-standard', 'seat', '标准版', 2, '席', 860, '月付', 1),
      createBundleLine('ord-031-cancel-code-standard', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
    ],
    amount: 6800,
    paymentMethod: 'bank_transfer',
    status: 'cancelled',
    createdAt: '2026-04-18 15:09',
    paidAt: '2026-04-18 16:00',
    volcSyncStatus: 'success',
    volcReceipt: '订单已取消，已释放席位组合',
    commissionId: 'commission-004',
    timeline: [
      { id: 'tl-006', time: '2026-04-18 15:09', title: '对公到账', detail: '财务审核通过' },
      { id: 'tl-007', time: '2026-04-19 10:20', title: '订单取消', detail: '客户变更采购计划' },
      { id: 'tl-008', time: '2026-04-20 11:00', title: '订单取消', detail: '已释放席位组合' },
    ],
  },
  {
    id: 'ORD-20260416-006',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-016-lite', 'seat', '轻量版', 2, '席', 420, '月付', 1),
      createBundleLine('ord-016-code-lite', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
      createBundleLine('ord-016-standard', 'seat', '标准版', 2, '席', 860, '月付', 1),
      createBundleLine('ord-016-code-standard', 'coding_plan', 'CodingPlan Team Lite', 2, '份', 240, '月付', 1),
    ],
    amount: 6800,
    paymentMethod: 'bank_transfer',
    status: 'pending',
    createdAt: '2026-04-16 09:31',
    volcSyncStatus: 'pending',
    volcReceipt: '等待客户完成对公汇款并上传凭证',
    timeline: [
      { id: 'tl-016006-001', time: '2026-04-16 09:31', title: '订单创建', detail: '客户生成对公转账订单，尚未上传凭证' },
    ],
  },
  {
    id: 'ORD-20260412-018',
    tenantId: 'tenant-005',
    tenantName: '杭州数智财税',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-018-lite', 'seat', '轻量版', 6, '席', 7560, '半年付', 6),
      createBundleLine('ord-018-code-lite', 'coding_plan', 'CodingPlan Team Lite', 6, '份', 4320, '半年付', 6),
      createBundleLine('ord-018-standard', 'seat', '标准版', 4, '席', 10320, '半年付', 6),
      createBundleLine('ord-018-code-standard', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 2880, '半年付', 6),
    ],
    amount: 24800,
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: '2026-04-12 16:18',
    paidAt: '2026-04-12 16:20',
    volcSyncStatus: 'pending',
    volcReceipt: '微信支付成功，等待生成开通工单',
    timeline: [
      { id: 'tl-012018-001', time: '2026-04-12 16:18', title: '订单创建', detail: '客户选择微信扫码支付席位组合包' },
      { id: 'tl-012018-002', time: '2026-04-12 16:20', title: '付款确认', detail: '微信支付回调确认到账，等待交付生成开通工单' },
    ],
  },
  {
    id: 'ORD-20260411-007',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-011007-lite', 'seat', '轻量版', 5, '席', 5250, '季付', 3),
      createBundleLine('ord-011007-code-lite', 'coding_plan', 'CodingPlan Team Lite', 5, '份', 1800, '季付', 3),
      createBundleLine('ord-011007-standard', 'seat', '标准版', 3, '席', 3870, '季付', 3),
      createBundleLine('ord-011007-code-standard', 'coding_plan', 'CodingPlan Team Lite', 3, '份', 1080, '季付', 3),
    ],
    amount: 12800,
    paymentMethod: 'wechat',
    status: 'pending',
    createdAt: '2026-04-11 10:16',
    volcSyncStatus: 'pending',
    volcReceipt: '等待客户扫码支付',
    timeline: [
      { id: 'tl-011007-001', time: '2026-04-11 10:16', title: '订单创建', detail: '销售代客户生成微信扫码支付订单，等待客户完成支付' },
    ],
  },
  {
    id: 'ORD-20260410-016',
    tenantId: 'tenant-004',
    tenantName: '启明医疗器械',
    ownerSales: '陈默',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-016-qm-standard', 'seat', '标准版', 8, '席', 20640, '半年付', 6),
      createBundleLine('ord-016-qm-code-standard', 'coding_plan', 'CodingPlan Team Lite', 8, '份', 5760, '半年付', 6),
      createBundleLine('ord-016-qm-pro', 'seat', '高级版', 4, '席', 20640, '半年付', 6),
      createBundleLine('ord-016-qm-code-pro', 'coding_plan', 'CodingPlan Team Pro', 4, '份', 14400, '半年付', 6),
    ],
    amount: 36000,
    paymentMethod: 'bank_transfer',
    status: 'cancelled',
    createdAt: '2026-04-10 14:30',
    paidAt: '2026-04-10 15:10',
    volcSyncStatus: 'success',
    volcReceipt: '客户变更采购计划，订单已关闭',
    timeline: [
      { id: 'tl-010016-001', time: '2026-04-10 14:30', title: '订单创建', detail: '客户选择对公转账席位组合包' },
      { id: 'tl-010016-002', time: '2026-04-10 15:10', title: '订单关闭', detail: '客户变更采购计划，销售协助关闭订单' },
    ],
  },
  {
    id: 'ORD-20260401-014',
    tenantId: 'tenant-004',
    tenantName: '启明医疗器械',
    ownerSales: '许宁',
    orderType: '席位组合包',
    bundleLines: [
      createBundleLine('ord-014-standard', 'seat', '标准版', 4, '席', 10320, '半年付', 6),
      createBundleLine('ord-014-code-standard', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 2880, '半年付', 6),
      createBundleLine('ord-014-pro', 'seat', '高级版', 8, '席', 15200, '半年付', 6),
      createBundleLine('ord-014-code', 'coding_plan', 'CodingPlan Team Pro', 8, '份', 3600, '半年付', 6),
    ],
    amount: 18800,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    createdAt: '2026-04-01 14:20',
    paidAt: '2026-04-01 14:30',
    volcSyncStatus: 'pending',
    volcReceipt: '对公到账后生成开通工单，交付正在处理官网代购',
    commissionId: 'commission-011',
    timeline: [
      { id: 'tl-001014-001', time: '2026-04-01 14:20', title: '订单创建', detail: '客户上传对公转账凭证' },
      { id: 'tl-001014-002', time: '2026-04-01 14:30', title: '财务审核通过', detail: '对公转账确认到账，生成开通工单' },
      { id: 'tl-001014-003', time: '2026-04-01 14:40', title: '交付处理', detail: '交付人员正在处理官网代购、企业组合包开通和基础配置' },
    ],
  },
];

const orderOverviewMockIds = [
  'ORD-20260429-088',
  'ORD-20260416-006',
  'ORD-20260422-006',
  'ORD-20260411-007',
  'ORD-20260412-018',
  'ORD-20260426-031',
  'ORD-20260424-001',
  'ORD-20260410-016',
  'ORD-20260401-014',
];

ordersState = orderOverviewMockIds
  .map((id) => ordersState.find((order) => order.id === id))
  .filter(Boolean)
  .map((order) => {
    const current = order as AdminOrderDetail;
    if (current.id === 'ORD-20260416-006') {
      return {
        ...current,
        createdAt: '2026-04-29 09:10',
        timeline: [
          { id: 'tl-demo-pending-001', time: '2026-04-29 09:10', title: '订单创建', detail: '客户选择席位组合包并选择对公转账，等待上传付款凭证。' },
        ],
      };
    }
    if (current.id === 'ORD-20260422-006') {
      return {
        ...current,
        createdAt: '2026-04-29 10:20',
        timeline: [
          { id: 'tl-demo-review-001', time: '2026-04-29 10:20', title: '订单创建', detail: '客户提交席位组合包订单并选择对公转账。' },
          { id: 'tl-demo-review-002', time: '2026-04-29 10:36', title: '付款确认', detail: '客户已上传付款凭证，交付已核对银行流水号，等待财务终审确认到账。' },
        ],
      };
    }
    if (current.id === 'ORD-20260411-007') {
      return {
        ...current,
        createdAt: '2026-04-29 10:48',
        timeline: [
          { id: 'tl-demo-wechat-pending-001', time: '2026-04-29 10:48', title: '订单创建', detail: '销售代客户生成微信扫码支付订单，等待客户完成付款。' },
        ],
      };
    }
    if (current.id === 'ORD-20260426-031') {
      return {
        ...current,
        createdAt: '2026-04-29 11:00',
        paidAt: '2026-04-29 11:02',
        timeline: [
          { id: 'tl-demo-delivery-001', time: '2026-04-29 11:00', title: '订单创建', detail: '客户提交席位组合包订单并选择扫码支付。' },
          { id: 'tl-demo-delivery-002', time: '2026-04-29 11:02', title: '付款确认', detail: '支付宝支付回调确认到账，订单进入交付处理。' },
        ],
      };
    }
    if (current.id === 'ORD-20260412-018') {
      return {
        ...current,
        createdAt: '2026-04-29 12:20',
        paidAt: '2026-04-29 12:22',
        timeline: [
          { id: 'tl-demo-paid-waiting-001', time: '2026-04-29 12:20', title: '订单创建', detail: '客户提交席位组合包订单并选择扫码支付。' },
          { id: 'tl-demo-paid-waiting-002', time: '2026-04-29 12:22', title: '付款确认', detail: '微信支付回调确认到账，等待交付生成开通工单。' },
        ],
      };
    }
    if (current.id === 'ORD-20260424-001') {
      return {
        ...current,
        createdAt: '2026-04-29 13:30',
        paidAt: '2026-04-29 13:52',
        timeline: [
          { id: 'tl-demo-complete-001', time: '2026-04-29 13:30', title: '订单创建', detail: '客户提交席位组合包订单并上传对公付款凭证。' },
          { id: 'tl-demo-complete-002', time: '2026-04-29 13:52', title: '付款确认', detail: '交付核对流水号通过，财务确认对公到账。' },
        ],
      };
    }
    if (current.id === 'ORD-20260410-016') {
      return {
        ...current,
        createdAt: '2026-04-29 14:30',
        paidAt: '2026-04-29 15:10',
        timeline: [
          { id: 'tl-demo-closed-001', time: '2026-04-29 14:30', title: '订单创建', detail: '客户提交席位组合包订单并选择对公转账。' },
          { id: 'tl-demo-closed-002', time: '2026-04-29 15:10', title: '订单关闭', detail: '客户变更采购计划，销售协助关闭订单。' },
        ],
      };
    }
    return current;
  });

const orderPaymentExpiresAt = (order: Pick<AdminOrderDetail, 'createdAt' | 'paymentExpiresAt'>) =>
  order.paymentExpiresAt ?? dayjs(order.createdAt).add(ORDER_PAYMENT_DEADLINE_HOURS, 'hour').format('YYYY-MM-DD HH:mm');

const normalizePendingOrderExpirations = () => {
  const checkedAt = now();
  ordersState = ordersState.map((order) => {
    if (order.status !== 'pending') return order;
    const paymentExpiresAt = orderPaymentExpiresAt(order);
    if (!checkedAt.isAfter(dayjs(paymentExpiresAt))) {
      return { ...order, paymentExpiresAt };
    }
    const paymentExpiredAt = paymentExpiresAt;
    return {
      ...order,
      status: 'cancelled',
      paymentExpiresAt,
      paymentExpiredAt,
      couponUsageStatus: order.couponUsageStatus === 'applied' ? 'released' : order.couponUsageStatus,
      volcReceipt: '订单超过 24 小时未支付，系统已自动取消',
      timeline: order.timeline.some((item) => item.title === '支付超时自动取消')
        ? order.timeline
        : [
            ...order.timeline,
            {
              id: `tl-${order.id}-expired`,
              time: paymentExpiredAt,
              title: '支付超时自动取消',
              detail: '订单超过 24 小时未完成支付，系统自动取消并释放未确认优惠占用',
            },
          ],
    };
  });
};

let couponsState: CouponRecord[] = [
  {
    id: 'CPN-20260520-007',
    name: '首单 7 折优惠券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'order',
    discountRate: 70,
    totalDiscountQuota: 0,
    usedDiscountQuota: 0,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-05-20',
    expiresAt: '2026-08-20',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-20 10:12',
    remark: '按「订单 7 折」模板发放：优惠券不设额度，单次使用后失效',
    usageMode: '单次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购、增购',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '全部计费项', prepaidDurationLimit: '包月1月~12月可用、包年可用' },
      { productName: 'CodingPlan Team Pro', configuration: '全部配置', billingItem: '订阅费', prepaidDurationLimit: '随 ArkClaw 企业版订单一起抵扣' },
    ],
  },
  {
    id: 'CPN-20260508-008',
    name: '席位 8 折优惠券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'seat',
    discountRate: 80,
    totalDiscountQuota: 0,
    usedDiscountQuota: 2200,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-05-08',
    expiresAt: '2026-06-08',
    status: 'used',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-08 11:18',
    remark: '按「订单 8 折」模板发放：优惠券不设额度，已在订单中使用',
    usageMode: '单次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版 / 标准版', billingItem: '席位订阅费', prepaidDurationLimit: '包月1月~3月可用' },
    ],
  },
  {
    id: 'CPN-20260513-001',
    name: '体验代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountRate: 0,
    totalDiscountQuota: 10000,
    usedDiscountQuota: 10000,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-04-20',
    expiresAt: '2026-04-27',
    status: 'exhausted',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-04-20 19:37',
    remark: '按「体验代金券」模板发放：订单金额 100% 抵扣，默认体验 7 天，累计抵扣不超过额度',
    usageMode: '多次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购、转正、更配、续费、临时升配',
    applicableAccounts: ['2125082433', '2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '全部计费项', prepaidDurationLimit: '包年不可用、包月0月~1月可用、包天0天~31天可用' },
      { productName: '火山方舟订阅套餐', configuration: '全部配置', billingItem: '全部计费项', prepaidDurationLimit: '包年不可用、包月0月~1月可用、包天0天~31天可用' },
    ],
  },
  {
    id: 'CPN-20260513-004',
    name: '订单 7 折代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountScope: 'order',
    discountRate: 70,
    totalDiscountQuota: 30000,
    usedDiscountQuota: 10000,
    remainingDiscountQuota: 20000,
    effectiveAt: '2026-05-13',
    expiresAt: '2026-08-11',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-13 10:20',
    remark: '按「订单 7 折代金券」模板发放：订单按 70% 折扣结算，差额计入代金券抵扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购、续费、增购',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版 / 标准版 / 高级版', billingItem: '席位订阅费', prepaidDurationLimit: '包月1月~12月可用、包年可用' },
      { productName: 'CodingPlan Team Pro', configuration: '全部配置', billingItem: '订阅费', prepaidDurationLimit: '随 ArkClaw 企业版订单一起抵扣' },
    ],
  },
  {
    id: 'CPN-20260514-002',
    name: '续费 85 折代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountScope: 'seat',
    discountRate: 85,
    totalDiscountQuota: 18000,
    usedDiscountQuota: 3000,
    remainingDiscountQuota: 15000,
    effectiveAt: '2026-05-14',
    expiresAt: '2026-07-15',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-14 09:12',
    remark: '按「续费 85 折代金券」模板发放：适合续费场景，按 85% 折扣结算，差额计入代金券抵扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥3,000 可用',
    orderTypeSummary: '续费',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '标准版 / 高级版', billingItem: '席位订阅费', prepaidDurationLimit: '包月3月~12月可用、包年可用' },
    ],
  },
  {
    id: 'CPN-20260510-006',
    name: '限时 5 折体验券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountScope: 'coding_plan',
    discountRate: 50,
    totalDiscountQuota: 8000,
    usedDiscountQuota: 0,
    remainingDiscountQuota: 8000,
    effectiveAt: '2026-05-10',
    expiresAt: '2026-05-25',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-10 14:06',
    remark: '按「限时 5 折体验券」模板发放：短期促活使用，按 50% 折扣结算，差额计入代金券抵扣',
    usageMode: '单次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购、增购',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版 / 标准版', billingItem: '席位订阅费', prepaidDurationLimit: '包月1月~3月可用' },
    ],
  },
  {
    id: 'CPN-20260501-003',
    name: '95 折通用代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountRate: 95,
    totalDiscountQuota: 6000,
    usedDiscountQuota: 1000,
    remainingDiscountQuota: 5000,
    effectiveAt: '2026-05-01',
    expiresAt: '2026-06-30',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-01 11:20',
    remark: '按「95 折通用代金券」模板发放：适合常规报价补贴，按 95% 折扣结算，差额计入代金券抵扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥1,000 可用',
    orderTypeSummary: '新购、续费、增购',
    applicableAccounts: ['2125071513', '2125082433'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '全部计费项', prepaidDurationLimit: '包月1月~12月可用、包年可用' },
      { productName: 'CodingPlan Team Pro', configuration: '全部配置', billingItem: '订阅费', prepaidDurationLimit: '随 ArkClaw 企业版订单一起抵扣' },
    ],
  },
  {
    id: 'CPN-20260601-001',
    name: '订单 8 折代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountRate: 80,
    totalDiscountQuota: 12000,
    usedDiscountQuota: 0,
    remainingDiscountQuota: 12000,
    effectiveAt: '2026-06-01',
    expiresAt: '2026-07-31',
    status: 'pending',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-13 16:08',
    remark: '按「订单 8 折代金券」模板发放：订单按 80% 折扣结算，差额计入代金券抵扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥5,000 可用',
    orderTypeSummary: '增购、续费',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '高级版', billingItem: '席位订阅费', prepaidDurationLimit: '包月3月~12月可用、包年可用' },
    ],
  },
  {
    id: 'CPN-20260401-009',
    name: '其他代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountRate: 80,
    totalDiscountQuota: 10000,
    usedDiscountQuota: 10000,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-04-01',
    expiresAt: '2026-04-30',
    status: 'exhausted',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-04-01 09:20',
    remark: '按「其他代金券」模板发放：临时验收补偿，发放时调整为 80% 折扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购、增购',
    applicableAccounts: ['2125071513', '2125097781'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '全部计费项', prepaidDurationLimit: '包月0月~6月可用' },
    ],
  },
  {
    id: 'CPN-20260301-006',
    name: '体验代金券',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    type: 'quota_discount',
    discountRate: 0,
    totalDiscountQuota: 10000,
    usedDiscountQuota: 0,
    remainingDiscountQuota: 10000,
    effectiveAt: '2026-03-01',
    expiresAt: '2026-03-08',
    status: 'expired',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-03-01 11:30',
    remark: '按「体验代金券」模板发放：订单金额 100% 抵扣，默认体验 7 天，累计抵扣不超过额度',
    usageMode: '单次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购',
    applicableAccounts: ['2125071513'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版', billingItem: '席位订阅费', prepaidDurationLimit: '包月0月~1月可用' },
    ],
  },
  {
    id: 'CPN-20260513-002',
    name: '订单 7 折代金券',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    type: 'quota_discount',
    discountRate: 70,
    totalDiscountQuota: 30000,
    usedDiscountQuota: 18000,
    remainingDiscountQuota: 12000,
    effectiveAt: '2026-05-13',
    expiresAt: '2026-08-11',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-13 10:34',
    remark: '按「订单 7 折代金券」模板发放：订单按 70% 折扣结算，差额计入代金券抵扣',
    usageMode: '多次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '续费',
    applicableAccounts: ['2126010032'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '席位订阅费', prepaidDurationLimit: '包年可用' },
    ],
  },
  {
    id: 'CPN-20260513-003',
    name: '体验代金券',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    type: 'quota_discount',
    discountRate: 0,
    totalDiscountQuota: 10000,
    usedDiscountQuota: 10000,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-04-01',
    expiresAt: '2026-04-08',
    status: 'exhausted',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-04-01 09:30',
    remark: '按「体验代金券」模板发放：代理演示和试用成本支持',
    usageMode: '多次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '新购',
    applicableAccounts: ['2126010099'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版', billingItem: '席位订阅费', prepaidDurationLimit: '包月0月~3月可用' },
    ],
  },
  {
    id: 'CPN-20260515-101',
    name: '代理进货 8 折支持券',
    tenantId: 'agent-001',
    tenantName: '华东一级代理',
    type: 'quota_discount',
    discountRate: 80,
    totalDiscountQuota: 50000,
    usedDiscountQuota: 12000,
    remainingDiscountQuota: 38000,
    effectiveAt: '2026-05-15',
    expiresAt: '2026-08-31',
    status: 'active',
    issuedBy: '平台运营 王珊',
    issuedAt: '2026-05-15 10:10',
    remark: '平台发放给代理的阶段性进货支持，仅用于代理向平台采购时抵扣。',
    usageMode: '多次使用',
    thresholdRule: '满 ¥5,000 可用',
    orderTypeSummary: '代理进货、代理续费',
    applicableAccounts: ['AGT-CHENMO-001'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '全部配置', billingItem: '席位订阅费', prepaidDurationLimit: '包月1月~12月可用、包年可用' },
      { productName: 'CodingPlan Team Pro', configuration: '全部配置', billingItem: '订阅费', prepaidDurationLimit: '随 ArkClaw 企业版订单一起抵扣' },
    ],
  },
  {
    id: 'CPN-20260601-102',
    name: '代理季度激励券',
    tenantId: 'agent-001',
    tenantName: '华东一级代理',
    type: 'quota_discount',
    discountRate: 70,
    totalDiscountQuota: 30000,
    usedDiscountQuota: 0,
    remainingDiscountQuota: 30000,
    effectiveAt: '2026-06-01',
    expiresAt: '2026-09-30',
    status: 'pending',
    issuedBy: '平台运营 王珊',
    issuedAt: '2026-05-18 09:40',
    remark: '平台按季度达标奖励发放，生效后可用于代理采购订单抵扣。',
    usageMode: '多次使用',
    thresholdRule: '满 ¥10,000 可用',
    orderTypeSummary: '代理进货',
    applicableAccounts: ['AGT-CHENMO-001'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '标准版 / 高级版', billingItem: '席位订阅费', prepaidDurationLimit: '包月3月~12月可用、包年可用' },
    ],
  },
  {
    id: 'CPN-20260410-103',
    name: '代理试点补贴券',
    tenantId: 'agent-001',
    tenantName: '华东一级代理',
    type: 'quota_discount',
    discountRate: 0,
    totalDiscountQuota: 10000,
    usedDiscountQuota: 10000,
    remainingDiscountQuota: 0,
    effectiveAt: '2026-04-10',
    expiresAt: '2026-04-20',
    status: 'exhausted',
    issuedBy: '平台运营 王珊',
    issuedAt: '2026-04-10 15:05',
    remark: '平台给予代理试点项目的专项补贴，已全部使用完。',
    usageMode: '单次使用',
    thresholdRule: '满 ¥0.00 可用',
    orderTypeSummary: '代理进货',
    applicableAccounts: ['AGT-CHENMO-001'],
    applicableProducts: [
      { productName: 'ArkClaw企业版', configuration: '轻量版 / 标准版', billingItem: '席位订阅费', prepaidDurationLimit: '包月0月~3月可用' },
    ],
  },
];

let couponUsagesState: CouponUsageRecord[] = [
  {
    id: 'CPU-20260513-001',
    couponId: 'CPN-20260513-001',
    orderId: 'ORD-20260428-015',
    tenantId: 'tenant-001',
    originalAmount: 62000,
    discountAmount: 4440,
    payableAmount: 57560,
    status: 'confirmed',
    usedAt: '2026-04-28 08:13',
    accountId: '2125071513',
    billingPeriod: '2026-04',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061277634',
  },
  {
    id: 'CPU-20260421-001',
    couponId: 'CPN-20260513-001',
    orderId: 'ORD-20260421-018',
    tenantId: 'tenant-001',
    originalAmount: 3400,
    discountAmount: 3400,
    payableAmount: 0,
    status: 'confirmed',
    usedAt: '2026-04-21 14:46:42',
    accountId: '2125071513',
    billingPeriod: '2026-04',
    productName: 'ArkClaw 企业版',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061277634',
  },
  {
    id: 'CPU-20260421-002',
    couponId: 'CPN-20260513-001',
    orderId: 'ORD-20260421-019',
    tenantId: 'tenant-001',
    originalAmount: 2160,
    discountAmount: 2160,
    payableAmount: 0,
    status: 'confirmed',
    usedAt: '2026-04-21 14:46:42',
    accountId: '2125071513',
    billingPeriod: '2026-04',
    productName: '火山方舟订阅套餐',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061277602',
  },
  {
    id: 'CPU-20260419-001',
    couponId: 'CPN-20260401-009',
    orderId: 'ORD-20260419-006',
    tenantId: 'tenant-001',
    originalAmount: 12000,
    discountAmount: 10000,
    payableAmount: 2000,
    status: 'confirmed',
    usedAt: '2026-04-19 10:12:08',
    accountId: '2125097781',
    billingPeriod: '2026-04',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061270118',
  },
  {
    id: 'CPU-20260513-004',
    couponId: 'CPN-20260520-007',
    orderId: 'ORD-20260513-014',
    tenantId: 'tenant-001',
    originalAmount: 38000,
    discountAmount: 10000,
    payableAmount: 28000,
    status: 'confirmed',
    usedAt: '2026-05-13 15:40',
    accountId: '2125071513',
    billingPeriod: '2026-05',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061278004',
  },
  {
    id: 'CPU-20260513-002',
    couponId: 'CPN-20260513-002',
    orderId: 'ORD-20260428-009',
    tenantId: 'tenant-002',
    originalAmount: 146000,
    discountAmount: 18000,
    payableAmount: 128000,
    status: 'confirmed',
    usedAt: '2026-04-28 18:20',
  },
  {
    id: 'CPU-20260401-003',
    couponId: 'CPN-20260513-003',
    orderId: 'ORD-20260401-023',
    tenantId: 'tenant-003',
    originalAmount: 15800,
    discountAmount: 10000,
    payableAmount: 5800,
    status: 'confirmed',
    usedAt: '2026-04-01 16:10',
    accountId: '2126010099',
    billingPeriod: '2026-04',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'VP02513000078061270303',
  },
  {
    id: 'CPU-20260516-101',
    couponId: 'CPN-20260515-101',
    orderId: 'AGT-ORD-20260516-001',
    tenantId: 'agent-001',
    originalAmount: 42000,
    discountAmount: 8400,
    payableAmount: 33600,
    status: 'confirmed',
    usedAt: '2026-05-16 11:28:10',
    accountId: 'AGT-CHENMO-001',
    billingPeriod: '2026-05',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'AGBILL-20260516-001',
  },
  {
    id: 'CPU-20260517-102',
    couponId: 'CPN-20260515-101',
    orderId: 'AGT-ORD-20260517-002',
    tenantId: 'agent-001',
    originalAmount: 18000,
    discountAmount: 3600,
    payableAmount: 14400,
    status: 'confirmed',
    usedAt: '2026-05-17 16:42:25',
    accountId: 'AGT-CHENMO-001',
    billingPeriod: '2026-05',
    productName: 'CodingPlan Team Pro',
    changeType: '抵扣',
    billDetailNo: 'AGBILL-20260517-002',
  },
  {
    id: 'CPU-20260412-103',
    couponId: 'CPN-20260410-103',
    orderId: 'AGT-ORD-20260412-003',
    tenantId: 'agent-001',
    originalAmount: 10000,
    discountAmount: 10000,
    payableAmount: 0,
    status: 'confirmed',
    usedAt: '2026-04-12 09:16:33',
    accountId: 'AGT-CHENMO-001',
    billingPeriod: '2026-04',
    productName: 'ArkClaw企业版',
    changeType: '抵扣',
    billDetailNo: 'AGBILL-20260412-003',
  },
];

let salesCouponPoolsState: SalesCouponPoolRecord[] = [
  {
    id: 'SCP-20260515-001',
    name: '线下推广 8 折优惠券',
    ownerRole: 'salesAdmin',
    ownerId: DEFAULT_SALES_ADMIN_ACCOUNT.id,
    ownerName: DEFAULT_SALES_ADMIN_ACCOUNT.name,
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'seat',
    discountRate: 80,
    totalQuota: 50,
    allocatedQuota: 18,
    grantedQuota: 5,
    remainingQuota: 27,
    effectiveAt: '2026-05-15',
    expiresAt: '2026-08-31',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-15 10:20',
    remark: '官方管理员发放给销售管理员，用于线下推广客户转化。',
  },
  {
    id: 'SCP-20260515-002',
    name: '线下推广 8 折优惠券',
    ownerRole: 'sales',
    ownerId: CURRENT_SALES_ACCOUNT.id,
    ownerName: CURRENT_SALES_ACCOUNT.name,
    parentPoolId: 'SCP-20260515-001',
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'seat',
    discountRate: 80,
    totalQuota: 18,
    allocatedQuota: 0,
    grantedQuota: 5,
    remainingQuota: 13,
    effectiveAt: '2026-05-15',
    expiresAt: '2026-08-31',
    status: 'active',
    issuedBy: DEFAULT_SALES_ADMIN_ACCOUNT.name,
    issuedAt: '2026-05-15 11:00',
    remark: '销售管理员分配给陈默，用于线下客户推广。',
  },
  {
    id: 'SCP-20260516-003',
    name: '官方直发销售 7 折优惠券',
    ownerRole: 'sales',
    ownerId: 'sales-002',
    ownerName: '林嘉',
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'order',
    discountRate: 70,
    totalQuota: 12,
    allocatedQuota: 0,
    grantedQuota: 0,
    remainingQuota: 12,
    effectiveAt: '2026-05-16',
    expiresAt: '2026-07-31',
    status: 'active',
    issuedBy: '官方管理员 王珊',
    issuedAt: '2026-05-16 09:30',
    remark: '官方管理员直接发给普通销售的推广优惠券。',
  },
  {
    id: 'SCP-20260518-004',
    name: '华东渠道试点 75 折优惠券',
    ownerRole: 'sales',
    ownerId: 'sales-004',
    ownerName: '沈南',
    benefitType: 'coupon',
    type: 'quota_discount',
    discountScope: 'order',
    discountRate: 75,
    totalQuota: 10,
    allocatedQuota: 0,
    grantedQuota: 2,
    remainingQuota: 8,
    effectiveAt: '2026-05-18',
    expiresAt: '2026-08-18',
    status: 'active',
    issuedBy: '销售管理员 陈默',
    issuedAt: '2026-05-18 10:10',
    remark: '用于演示销售离职继承时，沈南名下仍有未用完的推广券池。',
  },
];

let salesCouponTransfersState: SalesCouponTransferRecord[] = [
  {
    id: 'SCT-20260515-001',
    poolId: 'SCP-20260515-001',
    fromRole: 'platformAdmin',
    fromName: '官方管理员 王珊',
    toRole: 'salesAdmin',
    toId: DEFAULT_SALES_ADMIN_ACCOUNT.id,
    toName: DEFAULT_SALES_ADMIN_ACCOUNT.name,
    amount: 50,
    createdAt: '2026-05-15 10:20',
    remark: '官方发放销售管理员推广优惠券',
  },
  {
    id: 'SCT-20260515-002',
    poolId: 'SCP-20260515-002',
    fromRole: 'salesAdmin',
    fromName: DEFAULT_SALES_ADMIN_ACCOUNT.name,
    toRole: 'sales',
    toId: CURRENT_SALES_ACCOUNT.id,
    toName: CURRENT_SALES_ACCOUNT.name,
    amount: 18,
    createdAt: '2026-05-15 11:00',
    remark: '销售管理员分配给下属销售',
  },
];

let salesCouponGrantsState: SalesCouponGrantRecord[] = [
  {
    id: 'SCG-20260515-001',
    poolId: 'SCP-20260515-002',
    salesId: CURRENT_SALES_ACCOUNT.id,
    salesName: CURRENT_SALES_ACCOUNT.name,
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    couponId: 'CPN-20260520-007',
    amount: 1,
    createdAt: '2026-05-15 15:30',
    remark: '线下推广跟进发放',
  },
];

let openingTasksState: AdminOpeningTaskRecord[] = [
  {
    id: 'OPEN-20260424-001',
    orderId: 'ORD-20260424-001',
    tenantId: 'tenant-001',
    tenantName: '云岭制造',
    ownerSales: '陈默',
    deliveryOwner: '周航',
    planName: '席位组合包',
    bundleLines: clone(ordersState[0].bundleLines ?? []),
    orderAmount: 32800,
    fulfillmentMode: 'manual_official_site',
    status: 'completed',
    createdAt: '2026-04-24 10:24',
    updatedAt: '2026-04-24 10:29',
    completedAt: '2026-04-24 10:29',
    timeline: [
      { id: 'ot-001', time: '2026-04-24 10:24', title: '生成开通工单', detail: '财务审核通过后生成手工代购工单' },
      { id: 'ot-002', time: '2026-04-24 10:25', title: '开始办理', detail: '周航开始在官网为客户代购混合组合' },
      { id: 'ot-003', time: '2026-04-24 10:27', title: '已提交购买', detail: '官网已完成下单，等待企业开通确认' },
      { id: 'ot-004', time: '2026-04-24 10:29', title: '完成开通', detail: '交付确认企业组合已生效，可进入席位管理继续分配' },
    ],
  },
  {
    id: 'OPEN-20260426-031',
    orderId: 'ORD-20260426-031',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    ownerSales: '陈默',
    deliveryOwner: '周航',
    planName: '席位组合包',
    bundleLines: [
      createBundleLine('open-031-lite', 'seat', '轻量版', 3, '席', 3000, '试点包', 1),
      createBundleLine('open-031-code-lite', 'coding_plan', 'CodingPlan Team Lite', 3, '份', 1200, '试点包', 1),
      createBundleLine('open-031-pro', 'seat', '高级版', 2, '席', 3600, '试点包', 1),
      createBundleLine('open-031-code', 'coding_plan', 'CodingPlan Team Pro', 2, '份', 2200, '试点包', 1),
    ],
    orderAmount: 8800,
    fulfillmentMode: 'manual_official_site',
    status: 'waiting_confirm',
    createdAt: '2026-04-26 10:30',
    updatedAt: '2026-04-26 10:36',
    timeline: [
      { id: 'ot-005', time: '2026-04-26 10:30', title: '生成开通工单', detail: '订单已确认到账，工单回到交付继续处理' },
      { id: 'ot-006', time: '2026-04-26 10:33', title: '开始办理', detail: '交付已进入官网代购流程' },
      { id: 'ot-007', time: '2026-04-26 10:36', title: '已提交购买', detail: '官网已下单，等待交付确认企业组合生效' },
    ],
  },
  {
    id: 'OPEN-20260401-014',
    orderId: 'ORD-20260401-014',
    tenantId: 'tenant-004',
    tenantName: '启明医疗器械',
    ownerSales: '许宁',
    deliveryOwner: '周航',
    planName: '席位组合包',
    bundleLines: [
      createBundleLine('open-014-standard', 'seat', '标准版', 4, '席', 10320, '半年付', 6),
      createBundleLine('open-014-code-standard', 'coding_plan', 'CodingPlan Team Lite', 4, '份', 2880, '半年付', 6),
      createBundleLine('open-014-pro', 'seat', '高级版', 8, '席', 15200, '半年付', 6),
      createBundleLine('open-014-code', 'coding_plan', 'CodingPlan Team Pro', 8, '份', 3600, '半年付', 6),
    ],
    orderAmount: 18800,
    fulfillmentMode: 'manual_official_site',
    status: 'purchasing',
    createdAt: '2026-04-01 14:30',
    updatedAt: '2026-04-01 14:40',
    timeline: [
      { id: 'ot-008', time: '2026-04-01 14:30', title: '生成开通工单', detail: '订单已确认到账，待交付处理官网代购' },
      { id: 'ot-009', time: '2026-04-01 14:35', title: '开始办理', detail: '交付进入官网代购流程' },
      { id: 'ot-010', time: '2026-04-01 14:40', title: '交付处理', detail: '交付人员正在处理官网代购、企业组合包开通和基础配置' },
    ],
  },
];

let bankTransferReviewsState: AdminBankTransferReviewItem[] = [
  {
    id: 'btr-001',
    orderId: 'ORD-20260422-006',
    tenantName: '星河财税',
    amount: 21800,
    attemptNo: 2,
    proofName: 'proof_2206.png',
    uploadedAmount: 21000,
    uploadedAt: '2026-04-22 09:31',
    daysSinceUpload: 6,
    reviewStatus: 'pending_finance_review',
    deliveryOwner: '周航',
    financeOwner: '沈南',
    bankSerialNo: 'BCM2026042209187765',
    deliveryReviewedAt: '2026-04-22 09:45',
    attempts: [
      {
        id: 'btr-001-a2',
        attemptNo: 2,
        proofName: 'proof_2206.png',
        uploadedAmount: 21000,
        uploadedAt: '2026-04-22 09:31',
        reviewStatus: 'pending_finance_review',
        bankSerialNo: 'BCM2026042209187765',
        deliveryReviewedAt: '2026-04-22 09:45',
      },
      {
        id: 'btr-001-a1',
        attemptNo: 1,
        proofName: 'proof_2206_first.png',
        uploadedAmount: 20500,
        uploadedAt: '2026-04-22 08:42',
        reviewStatus: 'rejected',
        bankSerialNo: 'BCM2026042208421066',
        deliveryReviewedAt: '2026-04-22 08:58',
        financeReviewedAt: '2026-04-22 09:12',
        reviewReason: '客户首次上传凭证金额与订单金额不一致，已驳回要求重新上传。',
      },
    ],
  },
  {
    id: 'btr-004',
    orderId: 'ORD-20260424-001',
    tenantName: '云岭制造',
    amount: 32800,
    attemptNo: 1,
    proofName: 'proof_2401.png',
    uploadedAmount: 32800,
    uploadedAt: '2026-04-24 10:18',
    daysSinceUpload: 4,
    reviewStatus: 'approved',
    deliveryOwner: 'DE-12 王澈',
    bankSerialNo: 'ICBC2026042410183001',
    deliveryReviewedAt: '2026-04-24 10:21',
    financeReviewedAt: '2026-04-24 10:24',
    reviewReason: '银行流水与订单金额一致，已确认到账。',
    attempts: [
      {
        id: 'btr-004-a1',
        attemptNo: 1,
        proofName: 'proof_2401.png',
        uploadedAmount: 32800,
        uploadedAt: '2026-04-24 10:18',
        reviewStatus: 'approved',
        bankSerialNo: 'ICBC2026042410183001',
        deliveryReviewedAt: '2026-04-24 10:21',
        financeReviewedAt: '2026-04-24 10:24',
        reviewReason: '银行流水与订单金额一致，已确认到账。',
      },
    ],
  },
  {
    id: 'btr-002',
    orderId: 'ORD-20260426-002',
    tenantName: '杭州数智财税',
    amount: 12000,
    attemptNo: 2,
    proofName: 'proof_2602.png',
    uploadedAmount: 12000,
    uploadedAt: '2026-04-26 17:20',
    daysSinceUpload: 2,
    reviewStatus: 'pending_delivery_review',
    deliveryOwner: '周航',
    attempts: [
      {
        id: 'btr-002-a2',
        attemptNo: 2,
        proofName: 'proof_2602.png',
        uploadedAmount: 12000,
        uploadedAt: '2026-04-26 17:20',
        reviewStatus: 'pending_delivery_review',
      },
      {
        id: 'btr-002-a1',
        attemptNo: 1,
        proofName: 'proof_2602_blur.png',
        uploadedAmount: 12000,
        uploadedAt: '2026-04-26 16:44',
        reviewStatus: 'rejected',
        financeReviewedAt: '2026-04-26 17:05',
        reviewReason: '付款凭证截图不清晰，无法识别银行流水号。',
      },
    ],
  },
  {
    id: 'btr-003',
    orderId: 'ORD-20260418-031',
    tenantName: '灵川生物',
    amount: 6800,
    attemptNo: 1,
    proofName: 'proof_1831.png',
    uploadedAmount: 6600,
    uploadedAt: '2026-04-18 15:22',
    daysSinceUpload: 10,
    reviewStatus: 'rejected',
    deliveryOwner: 'TS-08 刘启',
    bankSerialNo: 'CMB2026041815220198',
    deliveryReviewedAt: '2026-04-18 15:40',
    financeReviewedAt: '2026-04-18 16:00',
    reviewReason: '到账金额与订单金额不一致，已退回客户重新上传凭证。',
    attempts: [
      {
        id: 'btr-003-a1',
        attemptNo: 1,
        proofName: 'proof_1831.png',
        uploadedAmount: 6600,
        uploadedAt: '2026-04-18 15:22',
        reviewStatus: 'rejected',
        bankSerialNo: 'CMB2026041815220198',
        deliveryReviewedAt: '2026-04-18 15:40',
        financeReviewedAt: '2026-04-18 16:00',
        reviewReason: '到账金额与订单金额不一致，已退回客户重新上传凭证。',
      },
    ],
  },
];

const syncCurrentBankTransferAttempt = (
  review: AdminBankTransferReviewItem,
  patch: Partial<NonNullable<AdminBankTransferReviewItem['attempts']>[number]>,
) => {
  const attempts = review.attempts ?? [];
  const currentAttemptNo = review.attemptNo || Math.max(1, ...attempts.map((item) => item.attemptNo));
  return attempts.map((attempt) => (attempt.attemptNo === currentAttemptNo ? { ...attempt, ...patch } : attempt));
};

const createOpeningTaskFromOrder = (order: AdminOrderDetail, tenantName: string, deliveryOwner?: string): AdminOpeningTaskRecord => {
  const time = now().format('YYYY-MM-DD HH:mm');
  const bundleLines = clone(order.bundleLines ?? defaultBundleLinesForOrder(order.orderType, order.amount));
  const status: AdminOpeningTaskRecord['status'] = deliveryOwner ? 'pending_handle' : 'pending_assign';

  return {
    id: `OPEN-${order.id.replace('ORD-', '')}`,
    orderId: order.id,
    tenantId: order.tenantId,
    tenantName,
    ownerSales: order.ownerSales,
    deliveryOwner,
    planName: summarizeBundleLines(bundleLines),
    bundleLines,
    orderAmount: order.amount,
    fulfillmentMode: 'manual_official_site',
    status,
    createdAt: time,
    updatedAt: time,
    timeline: [
      {
        id: `ot-${Date.now()}`,
        time,
        title: '生成开通工单',
        detail: deliveryOwner
          ? `付款确认后自动生成，并回到交付人员 ${deliveryOwner} 办理官网代购`
          : '付款确认后自动生成，待交付管理员分配交付运维办理人',
      },
    ],
  };
};

let refundsState: AdminRefundRequest[] = [
  {
    id: 'rf-001',
    orderId: 'ORD-20260418-031',
    tenantName: '灵川生物',
    requestAmount: 6800,
    originalAmount: 6800,
    reason: '客户取消扩容项目',
    appliedBy: '赵敏',
    appliedRole: '客户管理员',
    status: 'completed',
    createdAt: '2026-04-19 10:20',
    reviewer1: '姚楠 / FI-',
  },
  {
    id: 'rf-002',
    orderId: 'ORD-20260428-009',
    tenantName: '北辰科技',
    requestAmount: 128000,
    originalAmount: 128000,
    reason: '重复付款申请退款',
    appliedBy: '孟琪',
    appliedRole: '平台运营',
    status: 'pending',
    createdAt: '2026-04-28 09:50',
  },
  {
    id: 'rf-003',
    orderId: 'ORD-20260401-014',
    tenantName: '启明医疗器械',
    requestAmount: 18800,
    originalAmount: 18800,
    reason: '客户采购计划调整，要求暂停采购并原路退款',
    appliedBy: '许宁',
    appliedRole: '代理',
    status: 'processing',
    createdAt: '2026-04-02 11:18',
    reviewer1: '姚楠 / FI-',
  },
];

let anomalyOrdersState: AdminAnomalyOrder[] = [
  { id: 'ao-001', orderId: 'ORD-20260426-002', tenantName: '杭州数智财税', triggerReason: '凭证 pHash 疑似重复', amount: 12000, createdAt: '2026-04-26 17:21', status: 'pending' },
  { id: 'ao-002', orderId: 'ORD-20260428-015', tenantName: '云岭制造', triggerReason: '同企业 1 小时内 3 笔订单', amount: 52000, createdAt: '2026-04-28 08:20', status: 'pending' },
];

let salesState: AdminSalesDetail[] = [
  {
    id: 'sales-001',
    employeeNo: 'CM2048',
    name: '陈默',
    team: '华东代理一组',
    hiredAt: '2024-06-15',
    status: 'active',
    monthNewCustomers: 3,
    monthGmv: 86200,
    monthCommission: 4300,
    totalCommission: 31200,
    region: '华东',
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
    customers: [],
    performance: [
      { month: '2025-11', gmv: 68000, commission: 3400, newCustomers: 2 },
      { month: '2025-12', gmv: 72000, commission: 3600, newCustomers: 3 },
      { month: '2026-01', gmv: 43000, commission: 2150, newCustomers: 1 },
      { month: '2026-02', gmv: 55000, commission: 2750, newCustomers: 2 },
      { month: '2026-03', gmv: 91800, commission: 4590, newCustomers: 4 },
      { month: '2026-04', gmv: 86200, commission: 4300, newCustomers: 3 },
    ],
    commissions: [],
    invites: [
      { id: 'iv-001', type: 'share_link', name: '默认分享链接', value: 'SC4Y8Q', status: 'active', used: 12 },
      { id: 'iv-002', type: 'invite_code', name: '默认邀请码', value: 'YZN8K2', status: 'active', used: 9 },
    ],
    audit: [
      { id: 'saudit-001', createdAt: '2026-04-24 10:25', actor: '系统', action: '佣金生成', target: 'ORD-20260424-001', result: 'success' },
      { id: 'saudit-002', createdAt: '2026-04-08 13:20', actor: '陈默', action: '新增客户', target: '星河财税', result: 'success' },
    ],
  },
  {
    id: 'sales-002',
    employeeNo: 'LJ1024',
    name: '林嘉',
    team: '华北代理组',
    hiredAt: '2024-03-18',
    status: 'active',
    monthNewCustomers: 2,
    monthGmv: 62800,
    monthCommission: 3140,
    totalCommission: 24800,
    region: '华北',
    phone: '13800138001',
    email: 'linjia@ynzl.com',
    baseCommissionRate: 0.05,
    bankAccount: {
      accountName: '林嘉',
      bankName: '中国工商银行',
      branchName: '北京中关村支行',
      accountNo: '6222020200123456789',
      status: 'active',
      updatedAt: '2026-04-18 14:20',
    },
    customers: [],
    performance: [
      { month: '2026-01', gmv: 42000, commission: 2100, newCustomers: 1 },
      { month: '2026-02', gmv: 58000, commission: 2900, newCustomers: 2 },
      { month: '2026-03', gmv: 60800, commission: 3040, newCustomers: 2 },
      { month: '2026-04', gmv: 62800, commission: 3140, newCustomers: 2 },
    ],
    commissions: [],
    invites: [{ id: 'iv-003', type: 'invite_code', name: '活动码', value: 'BC7P2Q', status: 'active', used: 18 }],
    audit: [],
  },
  {
    id: 'sales-003',
    employeeNo: 'XN8899',
    name: '许宁',
    team: '华南代理组',
    hiredAt: '2024-08-05',
    status: 'active',
    monthNewCustomers: 1,
    monthGmv: 38400,
    monthCommission: 1920,
    totalCommission: 14000,
    region: '华南',
    phone: '13800138002',
    email: 'xuning@ynzl.com',
    baseCommissionRate: 0.05,
    bankAccount: {
      accountName: '',
      bankName: '',
      branchName: '',
      accountNo: '',
      status: 'not_set',
    },
    customers: [],
    performance: [
      { month: '2026-03', gmv: 35200, commission: 1760, newCustomers: 1 },
      { month: '2026-04', gmv: 38400, commission: 1920, newCustomers: 1 },
    ],
    commissions: [],
    invites: [],
    audit: [],
  },
  {
    id: 'sales-004',
    employeeNo: 'SN0009',
    name: '沈南',
    team: '华东代理一组',
    hiredAt: '2023-12-01',
    status: 'left',
    monthNewCustomers: 0,
    monthGmv: 0,
    monthCommission: 0,
    totalCommission: 9200,
    region: '华东',
    phone: '13800138003',
    email: 'shennan@ynzl.com',
    baseCommissionRate: 0.05,
    bankAccount: {
      accountName: '沈南',
      bankName: '中国建设银行',
      branchName: '上海陆家嘴支行',
      accountNo: '6217000011122233',
      status: 'active',
      updatedAt: '2026-02-16 09:40',
    },
    customers: [],
    performance: [],
    commissions: [],
    invites: [],
    audit: [
      { id: 'saudit-004', createdAt: '2026-04-05 10:00', actor: '王珊 / SU-', action: '标记离职', target: '沈南', result: 'success' },
    ],
  },
];

const mockDirectSalesRows = [
  { id: 'direct-sales-001', name: '王珊', team: '内部销售', gmv: 26000, newCustomers: 2, channelLabel: '自销' as const },
  { id: 'direct-sales-002', name: '周安', team: '内部销售', gmv: 12800, newCustomers: 1, channelLabel: '自销' as const },
  { id: 'direct-sales-003', name: '许岚', team: '内部销售', gmv: 8000, newCustomers: 1, channelLabel: '自销' as const },
  { id: 'direct-sales-004', name: '姚楠', team: '内部销售', gmv: 6400, newCustomers: 1, channelLabel: '自销' as const },
  { id: 'direct-sales-005', name: '孟琪', team: '内部销售', gmv: 4200, newCustomers: 1, channelLabel: '自销' as const },
];

const mockExternalAgentRows = [
  { id: 'agent-tenant-001', name: '华东一级代理', team: 'A级代理租户', gmv: 120400, newCustomers: 4, channelLabel: '代理' as const },
  { id: 'agent-tenant-002', name: '北辰渠道中心', team: 'S级代理租户', gmv: 96800, newCustomers: 3, channelLabel: '代理' as const },
  { id: 'agent-tenant-003', name: '岭南数智伙伴', team: 'B级代理租户', gmv: 68400, newCustomers: 2, channelLabel: '代理' as const },
  { id: 'agent-tenant-004', name: '临港企业服务', team: 'C级代理租户', gmv: 42600, newCustomers: 1, channelLabel: '代理' as const },
  { id: 'agent-tenant-005', name: '唐雨渠道工作室', team: 'A级代理租户', gmv: 31800, newCustomers: 1, channelLabel: '代理' as const },
];

let agentTenantsState: AdminAgentTenantDetail[] = [
  {
    id: 'agent-tenant-001',
    companyName: '上海华东数智服务有限公司',
    shortName: '华东一级代理',
    legalName: '上海华东数智服务有限公司',
    status: 'active',
    mirrorDomain: 'huadong.ynzl-agent.com',
    logoFileName: 'huadong-agent-logo.png',
    collectionQrFileName: 'huadong-wechat-pay-qr.png',
    collectionBankAccountName: '上海华东数智服务有限公司',
    collectionBankName: '招商银行',
    collectionBranchName: '上海张江支行',
    collectionAccountNo: '7559020012340001',
    collectionNote: '客户付款后请联系代理销售确认开通信息。',
    adminName: '周子墨',
    adminPhone: '13800138110',
    contactEmail: 'admin@huadong-agent.com',
    agreementLevel: 'A级代理',
    procurementRuleId: 'rule-discount-a',
    procurementRuleName: 'A级代理拿货折扣',
    procurementRate: 0.7,
    salesCount: 8,
    financeCount: 2,
    customerCount: 42,
    currentBalance: 286000,
    totalTopup: 860000,
    totalDeducted: 574000,
    monthGmv: 120400,
    createdAt: '2026-03-01',
    websiteStatus: 'configured',
    staff: [
      { id: 'aga-001', name: '周子墨', role: 'agentAdmin', phone: '13800138110', status: 'active' },
      { id: 'ags-001', name: '陈默', role: 'agentSales', phone: '13800138111', status: 'active' },
      { id: 'agf-001', name: '陆佳', role: 'agentFinance', phone: '13800138112', status: 'active' },
    ],
    recentCustomers: [
      { id: 'tenant-004', name: '灵川生物', ownerSales: '陈默', status: 'active', monthGmv: 36000 },
      { id: 'tenant-002', name: '北辰科技', ownerSales: '陈默', status: 'not_opened', monthGmv: 24800 },
    ],
    recentOrders: [
      { id: 'ORD-20260424-001', tenantName: '云岭制造', amount: 32800, status: 'paid', createdAt: '2026-04-24 10:20' },
      { id: 'ORD-20260410-016', tenantName: '启明医疗器械', amount: 36000, status: 'paid', createdAt: '2026-04-10 14:30' },
    ],
  },
  {
    id: 'agent-tenant-002',
    companyName: '杭州北辰渠道服务有限公司',
    shortName: '北辰渠道中心',
    legalName: '杭州北辰渠道服务有限公司',
    status: 'pending_setup',
    mirrorDomain: 'beichen.ynzl-agent.com',
    logoFileName: 'beichen-channel-logo.png',
    collectionQrFileName: 'beichen-wechat-pay-qr.png',
    collectionBankAccountName: '杭州北辰渠道服务有限公司',
    collectionBankName: '杭州银行',
    collectionBranchName: '未来科技城支行',
    collectionAccountNo: '6222020012341102',
    collectionNote: '请备注企业名称和套餐周期，便于代理财务核对。',
    adminName: '林嘉',
    adminPhone: '13800138220',
    contactEmail: 'ops@beichen-agent.com',
    agreementLevel: 'S级代理',
    procurementRuleId: 'rule-discount-s',
    procurementRuleName: 'S级代理拿货折扣',
    procurementRate: 0.65,
    salesCount: 5,
    financeCount: 1,
    customerCount: 26,
    currentBalance: 158000,
    totalTopup: 520000,
    totalDeducted: 362000,
    monthGmv: 96800,
    createdAt: '2026-03-12',
    websiteStatus: 'draft',
    staff: [
      { id: 'aga-002', name: '林嘉', role: 'agentAdmin', phone: '13800138220', status: 'active' },
      { id: 'ags-002', name: '许宁', role: 'agentSales', phone: '13800138221', status: 'invited' },
      { id: 'agf-002', name: '韩晴', role: 'agentFinance', phone: '13800138222', status: 'active' },
    ],
    recentCustomers: [
      { id: 'tenant-003', name: '星河财税', ownerSales: '许宁', status: 'active', monthGmv: 18800 },
    ],
    recentOrders: [
      { id: 'ORD-20260412-018', tenantName: '杭州数智财税', amount: 24800, status: 'paid', createdAt: '2026-04-12 17:30' },
    ],
  },
  {
    id: 'agent-tenant-003',
    companyName: '广州岭南数智伙伴有限公司',
    shortName: '岭南数智伙伴',
    legalName: '广州岭南数智伙伴有限公司',
    status: 'suspended',
    mirrorDomain: 'lingnan.ynzl-agent.com',
    logoFileName: 'lingnan-partner-logo.png',
    collectionQrFileName: 'lingnan-wechat-pay-qr.png',
    collectionBankAccountName: '广州岭南数智伙伴有限公司',
    collectionBankName: '中国银行',
    collectionBranchName: '广州天河支行',
    collectionAccountNo: '6217000012343303',
    collectionNote: '暂停状态下仅用于历史客户续费回款核对。',
    adminName: '许宁',
    adminPhone: '13800138330',
    contactEmail: 'admin@lingnan-agent.com',
    agreementLevel: 'B级代理',
    procurementRuleId: 'rule-discount-b',
    procurementRuleName: 'B级代理拿货折扣',
    procurementRate: 0.75,
    salesCount: 3,
    financeCount: 1,
    customerCount: 12,
    currentBalance: 32000,
    totalTopup: 180000,
    totalDeducted: 148000,
    monthGmv: 68400,
    createdAt: '2026-02-18',
    websiteStatus: 'configured',
    staff: [
      { id: 'aga-003', name: '许宁', role: 'agentAdmin', phone: '13800138330', status: 'disabled' },
      { id: 'ags-003', name: '唐雨', role: 'agentSales', phone: '13800138331', status: 'disabled' },
    ],
    recentCustomers: [
      { id: 'tenant-001', name: '云岭制造', ownerSales: '唐雨', status: 'suspended', monthGmv: 0 },
    ],
    recentOrders: [
      { id: 'ORD-20260402-021', tenantName: '北辰科技', amount: 33200, status: 'paid', createdAt: '2026-04-02 12:06' },
    ],
  },
  {
    id: 'agent-tenant-004',
    companyName: '上海临港企业服务有限公司',
    shortName: '临港企业服务',
    legalName: '上海临港企业服务有限公司',
    status: 'active',
    mirrorDomain: '',
    logoFileName: 'lingang-agent-logo.png',
    collectionQrFileName: 'lingang-wechat-pay-qr.png',
    collectionBankAccountName: '上海临港企业服务有限公司',
    collectionBankName: '浦发银行',
    collectionBranchName: '临港新片区支行',
    collectionAccountNo: '6226000012344404',
    collectionNote: '无镜像站代理可由销售线下发送收款信息给客户。',
    adminName: '唐雨',
    adminPhone: '13800138440',
    contactEmail: 'admin@lingang-agent.com',
    agreementLevel: 'C级代理',
    procurementRuleId: 'rule-discount-c',
    procurementRuleName: 'C级代理拿货折扣',
    procurementRate: 0.8,
    salesCount: 2,
    financeCount: 1,
    customerCount: 9,
    currentBalance: 68000,
    totalTopup: 160000,
    totalDeducted: 92000,
    monthGmv: 31800,
    createdAt: '2026-04-08',
    websiteStatus: 'not_configured',
    staff: [
      { id: 'aga-004', name: '唐雨', role: 'agentAdmin', phone: '13800138440', status: 'active' },
      { id: 'ags-004', name: '沈南', role: 'agentSales', phone: '13800138441', status: 'active' },
    ],
    recentCustomers: [
      { id: 'tenant-006', name: '东岸新能源', ownerSales: '沈南', status: 'active', monthGmv: 31800 },
    ],
    recentOrders: [
      { id: 'ORD-20260505-003', tenantName: '东岸新能源', amount: 31000, status: 'paid', createdAt: '2026-05-05 13:20' },
    ],
  },
];

let transfersState: AdminSalesTransferRequest[] = [
  { id: 'tr-001', tenantName: '启明医疗器械', fromSales: '陈默', toSales: '林嘉', applicant: '王珊 / OP-', reason: '客户要求更换区域代理', createdAt: '2026-04-27 16:20', status: 'pending' },
  { id: 'tr-002', tenantName: '临港机器人', fromSales: '沈南', toSales: '陈默', applicant: '林涛 / SU-', reason: '代理离职继承', createdAt: '2026-04-05 10:10', status: 'approved', reviewer1: '林涛 / SU-', reviewer2: '韩冰 / SU-' },
];

const platformCommissionPayoutAccount = {
  accountName: '上海云账链数字科技有限公司',
  bankName: '招商银行',
  branchName: '上海张江支行',
  accountNo: '7559020012345678',
};

const getSalesCommissionRecipientAccount = (salesName: string) => {
  const account = salesState.find((item) => item.name === salesName)?.bankAccount;
  return {
    accountName: account?.accountName || salesName,
    bankName: account?.bankName || '-',
    branchName: account?.branchName || '-',
    accountNo: account?.accountNo || '',
  };
};

const enrichCommissionWithdrawRecord = (withdraw: AdminCommissionWithdrawRecord): AdminCommissionWithdrawRecord => ({
  ...withdraw,
  payoutGeneratedAt: withdraw.payoutGeneratedAt ?? withdraw.requestedAt,
  payoutAccount: withdraw.payoutAccount ?? platformCommissionPayoutAccount,
  recipientAccount: withdraw.recipientAccount ?? getSalesCommissionRecipientAccount(withdraw.salesName),
});

let commissionRulesState: AdminCommissionRule[] = [
  { id: 'rule-discount-s', name: 'S级代理拿货折扣', kind: 'procurement_discount', rate: 0.65, cycleMonths: 12, effectiveFrom: '2025-01-01', scope: 'S级外部代理', status: 'active', createdBy: '林涛' },
  { id: 'rule-discount-a', name: 'A级代理拿货折扣', kind: 'procurement_discount', rate: 0.7, cycleMonths: 12, effectiveFrom: '2025-01-01', scope: 'A级外部代理', status: 'active', createdBy: '林涛' },
  { id: 'rule-discount-b', name: 'B级代理拿货折扣', kind: 'procurement_discount', rate: 0.75, cycleMonths: 12, effectiveFrom: '2025-01-01', scope: 'B级外部代理', status: 'active', createdBy: '林涛' },
  { id: 'rule-discount-c', name: 'C级代理拿货折扣', kind: 'procurement_discount', rate: 0.8, cycleMonths: 12, effectiveFrom: '2025-01-01', scope: 'C级外部代理', status: 'active', createdBy: '林涛' },
  { id: 'rule-internal-sales-5', name: '内部销售固定佣金', kind: 'commission', rate: 0.05, cycleMonths: 12, effectiveFrom: '2025-01-01', scope: '内部销售', status: 'active', createdBy: '林涛' },
];

const getProcurementRuleById = (ruleId: string) =>
  commissionRulesState.find((item) => item.id === ruleId && item.kind === 'procurement_discount');

const agentStaffStatusFromTenantStatus = (status: AdminAgentTenantDetail['status']) => (
  status === 'active' ? 'active' : status === 'suspended' ? 'disabled' : 'invited'
) as AdminAgentTenantDetail['staff'][number]['status'];

const buildAgentTenantFromPayload = (payload: AdminAgentTenantUpsertPayload): AdminAgentTenantDetail => {
  const rule = getProcurementRuleById(payload.procurementRuleId);
  const id = `agent-tenant-${Date.now()}`;
  const { mirrorSiteEnabled, ...tenantPayload } = payload;
  return {
    id,
    ...tenantPayload,
    mirrorDomain: mirrorSiteEnabled ? payload.mirrorDomain.trim() : '',
    procurementRuleName: rule?.name ?? '未绑定拿货折扣规则',
    procurementRate: rule?.rate ?? 1,
    salesCount: 0,
    financeCount: 0,
    customerCount: 0,
    currentBalance: 0,
    totalTopup: 0,
    totalDeducted: 0,
    monthGmv: 0,
    createdAt: now().format('YYYY-MM-DD'),
    websiteStatus: mirrorSiteEnabled ? 'draft' : 'not_configured',
    staff: [
      {
        id: `aga-${Date.now()}`,
        name: payload.adminName,
        role: 'agentAdmin',
        phone: payload.adminPhone,
        status: agentStaffStatusFromTenantStatus(payload.status),
      },
    ],
    recentCustomers: [],
    recentOrders: [],
  };
};

let commissionTransactionsState: AdminCommissionTransaction[] = [
  { id: 'commission-001', orderId: 'ORD-20260424-001', tenantName: '云岭制造', salesName: '陈默', orderAmount: 32800, commissionAmount: 1640, rate: 0.05, sourceType: 'opening_completed', sourceText: '进入 2026-04 佣金批次，待财务核准', batchId: 'batch-2026-04-current', batchNo: 'CB-202604-CURRENT', status: 'pending', financeOwner: '姚楠', generatedAt: '2026-04-24 10:25' },
  { id: 'commission-002', orderId: 'ORD-20260312-015', tenantName: '北辰科技', salesName: '林嘉', orderAmount: 12000, commissionAmount: 600, rate: 0.05, sourceType: 'batch_paid', sourceText: '批次打款完成', batchId: 'batch-2026-03', batchNo: 'PAY-20260331-01', status: 'paid', generatedAt: '2026-03-12 16:11', financeReviewedAt: '2026-03-13 10:00', confirmedAt: '2026-03-14 11:30', paidAt: '2026-03-31 18:00' },
  { id: 'commission-003', orderId: 'ORD-20260402-021', tenantName: '北辰科技', salesName: '林嘉', orderAmount: 33200, commissionAmount: 1660, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '月度批次财务核准，待代理确认', batchId: 'batch-2026-04', batchNo: 'CB-202604', status: 'pending_sales_confirm', generatedAt: '2026-04-03 12:06', financeReviewedAt: '2026-04-04 09:30', confirmBasis: '月度批次审核确认' },
  { id: 'commission-005', orderId: 'ORD-20260428-015', tenantName: '云岭制造', salesName: '陈默', orderAmount: 52000, commissionAmount: 2600, rate: 0.05, sourceType: 'opening_completed', sourceText: '进入 2026-04 佣金批次，待财务核准', batchId: 'batch-2026-04-current', batchNo: 'CB-202604-CURRENT', status: 'pending', financeOwner: '姚楠', generatedAt: '2026-04-28 08:15' },
  { id: 'commission-006', orderId: 'ORD-20260426-031', tenantName: '星河财税', salesName: '陈默', orderAmount: 8800, commissionAmount: 440, rate: 0.05, sourceType: 'opening_completed', sourceText: '进入 2026-04 佣金批次，待财务核准', batchId: 'batch-2026-04-current', batchNo: 'CB-202604-CURRENT', status: 'pending', financeOwner: '姚楠', generatedAt: '2026-04-26 10:45' },
  { id: 'commission-007', orderId: 'ORD-20260412-018', tenantName: '杭州数智财税', salesName: '林嘉', orderAmount: 24800, commissionAmount: 1240, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '月度批次财务核准，待代理确认', batchId: 'batch-2026-04', batchNo: 'CB-202604', status: 'pending_sales_confirm', generatedAt: '2026-04-12 17:30', financeReviewedAt: '2026-05-02 09:20', confirmBasis: '月度结算单确认' },
  { id: 'commission-008', orderId: 'ORD-20260408-022', tenantName: '云岭制造', salesName: '陈默', orderAmount: 18800, commissionAmount: 940, rate: 0.05, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认', batchId: 'batch-2026-04-payroll', batchNo: 'PAY-20260430-02', status: 'confirmed', financeOwner: '姚楠', generatedAt: '2026-04-08 11:20', financeReviewedAt: '2026-04-29 09:30', confirmedAt: '2026-05-01 10:00', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-021', orderId: 'ORD-20260410-016', tenantName: '启明医疗器械', salesName: '陈默', orderAmount: 36000, commissionAmount: 1800, rate: 0.05, sourceType: 'batch_paid', sourceText: '销售已发起提现，提现流水 WD-20260430-001 等待后台确认打款', batchId: 'WD-20260430-001', batchNo: 'WD-20260430-001', status: 'confirmed', generatedAt: '2026-04-10 14:35', financeReviewedAt: '2026-04-29 09:40', confirmedAt: '2026-05-01 10:00', activatedAt: '2026-03-30 14:35', withdrawableAt: '2026-04-29 14:35', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-022', orderId: 'ORD-20260412-026', tenantName: '临港机器人', salesName: '陈默', orderAmount: 24600, commissionAmount: 1230, rate: 0.05, sourceType: 'batch_paid', sourceText: '销售已发起提现，提现流水 WD-20260430-001 等待后台确认打款', batchId: 'WD-20260430-001', batchNo: 'WD-20260430-001', status: 'confirmed', generatedAt: '2026-04-12 16:20', financeReviewedAt: '2026-04-29 09:45', confirmedAt: '2026-05-01 10:00', activatedAt: '2026-03-31 16:20', withdrawableAt: '2026-04-30 16:20', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-009', orderId: 'ORD-20260220-009', tenantName: '星河财税', salesName: '陈默', orderAmount: 42000, commissionAmount: 2100, rate: 0.05, sourceType: 'batch_paid', sourceText: '批次打款完成', batchId: 'batch-2026-02', batchNo: 'PAY-20260228-01', status: 'paid', generatedAt: '2026-02-20 15:10', financeReviewedAt: '2026-03-01 09:30', confirmedAt: '2026-03-02 10:15', paidAt: '2026-03-05 17:50' },
  { id: 'commission-010', orderId: 'ORD-20260428-009', tenantName: '北辰科技', salesName: '沈南', orderAmount: 128000, commissionAmount: 6400, rate: 0.05, sourceType: 'opening_completed', sourceText: '进入 2026-04 佣金批次，待财务核准', batchId: 'batch-2026-04-current', batchNo: 'CB-202604-CURRENT', status: 'pending', financeOwner: '沈南', generatedAt: '2026-04-28 09:25' },
  { id: 'commission-011', orderId: 'ORD-20260501-006', tenantName: '启明医疗器械', salesName: '许宁', orderAmount: 38400, commissionAmount: 1920, rate: 0.05, sourceType: 'sales_confirmed', sourceText: '代理已确认，可生成打款单', status: 'confirmed', generatedAt: '2026-05-01 09:10', financeReviewedAt: '2026-05-02 09:20', confirmedAt: '2026-05-02 14:30', confirmBasis: '订单已开通，客户付款已核对' },
  { id: 'commission-012', orderId: 'ORD-20260328-006', tenantName: '云岭制造', salesName: '陈默', orderAmount: 26800, commissionAmount: 1340, rate: 0.05, sourceType: 'batch_paid', sourceText: '批次打款完成', batchId: 'batch-2026-03', batchNo: 'PAY-20260331-01', status: 'paid', generatedAt: '2026-03-28 13:15', financeReviewedAt: '2026-04-02 09:20', confirmedAt: '2026-04-02 15:00', paidAt: '2026-04-05 18:00' },
  { id: 'commission-013', orderId: 'ORD-20260502-012', tenantName: '临港机器人', salesName: '沈南', orderAmount: 56000, commissionAmount: 2800, rate: 0.05, sourceType: 'sales_confirmed', sourceText: '代理已确认，可生成打款单', status: 'confirmed', generatedAt: '2026-05-02 11:45', financeReviewedAt: '2026-05-03 08:30', confirmedAt: '2026-05-03 09:20', confirmBasis: '线下合同与订单金额一致' },
  { id: 'commission-014', orderId: 'ORD-20260503-018', tenantName: '南山智能装备', salesName: '许宁', orderAmount: 46000, commissionAmount: 2300, rate: 0.05, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认', batchId: 'batch-2026-05-xuning', batchNo: 'PAY-20260506-01', status: 'confirmed', generatedAt: '2026-05-03 15:35', financeReviewedAt: '2026-05-04 09:10', confirmedAt: '2026-05-04 10:00', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-015', orderId: 'ORD-20260504-007', tenantName: '华睿教育科技', salesName: '许宁', orderAmount: 22000, commissionAmount: 1100, rate: 0.05, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认', batchId: 'batch-2026-05-xuning', batchNo: 'PAY-20260506-01', status: 'confirmed', generatedAt: '2026-05-04 10:05', financeReviewedAt: '2026-05-04 15:20', confirmedAt: '2026-05-04 16:10', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-016', orderId: 'ORD-20260505-003', tenantName: '东岸新能源', salesName: '沈南', orderAmount: 31000, commissionAmount: 1550, rate: 0.05, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认', batchId: 'batch-2026-05-shennan', batchNo: 'PAY-20260506-02', status: 'confirmed', generatedAt: '2026-05-05 13:20', financeReviewedAt: '2026-05-06 08:35', confirmedAt: '2026-05-06 09:15', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-017', orderId: 'ORD-20260506-021', tenantName: '云岭制造', salesName: '陈默', orderAmount: 41600, commissionAmount: 2080, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '财务已核准，待代理确认', status: 'pending_sales_confirm', generatedAt: '2026-05-06 11:20', financeReviewedAt: '2026-05-07 10:00', confirmBasis: '订单已开通，金额已核对' },
  { id: 'commission-018', orderId: 'ORD-20260505-014', tenantName: '北辰科技', salesName: '陈默', orderAmount: 26800, commissionAmount: 1340, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '已满 30 天且无退款，可发起提现', status: 'withdrawable', generatedAt: '2026-05-05 10:10', activatedAt: '2026-04-04 10:10', withdrawableAt: '2026-05-04 10:10', confirmBasis: '系统按 A级代理佣金规则自动计算' },
  { id: 'commission-019', orderId: 'ORD-20260504-011', tenantName: '星河财税', salesName: '陈默', orderAmount: 36000, commissionAmount: 1800, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '已满 30 天且无退款，可发起提现', status: 'withdrawable', generatedAt: '2026-05-04 09:40', activatedAt: '2026-04-03 09:40', withdrawableAt: '2026-05-03 09:40', confirmBasis: '系统按 A级代理佣金规则自动计算' },
  { id: 'commission-020', orderId: 'ORD-20260503-027', tenantName: '南山智能装备', salesName: '许宁', orderAmount: 46000, commissionAmount: 2300, rate: 0.05, sourceType: 'finance_reviewed', sourceText: '已满 30 天且无退款，可发起提现', status: 'withdrawable', generatedAt: '2026-05-03 15:35', activatedAt: '2026-04-02 15:35', withdrawableAt: '2026-05-02 15:35', confirmBasis: '系统按 B级代理佣金规则自动计算' },
];

const commissionRuleTypeBySales = (salesName: string): AdminCommissionTransaction['ruleType'] => {
  if (salesName === '林嘉') return 'S级代理';
  if (salesName === '陈默') return 'A级代理';
  if (salesName === '许宁') return 'B级代理';
  if (salesName === '沈南') return 'C级代理';
  return '内部销售';
};

const isExternalAgentRule = (ruleType: AdminCommissionTransaction['ruleType']) => ruleType !== '内部销售';

const normalizeCommissionTransaction = (item: AdminCommissionTransaction): AdminCommissionTransaction => {
  const specialAmounts: Record<string, { originalAmount: number; discountAmount: number; orderKind: AdminCommissionTransaction['orderKind'] }> = {
    'commission-005': { originalAmount: 62000, discountAmount: 10000, orderKind: '续约' },
    'commission-010': { originalAmount: 146000, discountAmount: 18000, orderKind: '增购' },
  };
  const amountMeta = specialAmounts[item.id] ?? {
    originalAmount: item.orderAmount,
    discountAmount: 0,
    orderKind: item.generatedAt < '2026-04-01' ? '续约' : '新增',
  };
  const paidAmount = amountMeta.originalAmount - amountMeta.discountAmount;
  const rate = typeof item.rate === 'number' ? item.rate : defaultCommissionRate();
  const ruleType = commissionRuleTypeBySales(item.salesName);
  const activatedAt = item.activatedAt ?? item.generatedAt;
  const withdrawableAt = item.withdrawableAt ?? dayjs(activatedAt).add(30, 'day').format('YYYY-MM-DD HH:mm');
  const status = (() => {
    if (item.status === 'pending') return 'estimated';
    if (item.status === 'pending_sales_confirm') return 'withdrawable';
    if (item.status === 'confirmed') return item.batchId || item.batchNo?.startsWith('PAY-') ? 'withdrawing' : 'withdrawable';
    if (item.status === 'paid') return 'withdrawn';
    if (item.status === 'disputed') return 'estimated';
    return item.status;
  })() as SalesCommissionStatus;
  const sourceText = (() => {
    if (status === 'estimated') return '工单已开通，佣金进入 30 天冻结期';
    if (status === 'withdrawable') return '已满 30 天且无退款，可发起提现';
    if (status === 'withdrawing') return '已发起提现，等待后台确认打款';
    if (status === 'withdrawn') return '提现打款已完成';
    if (status === 'invalid') return '订单退款或退订，收益已取消';
    return item.sourceText;
  })();
  return {
    ...item,
    orderKind: amountMeta.orderKind,
    originalAmount: amountMeta.originalAmount,
    discountAmount: amountMeta.discountAmount,
    paidAmount,
    orderAmount: paidAmount,
    commissionAmount: Math.round(paidAmount * rate * 100) / 100,
    rate,
    ruleName: `${ruleType}佣金规则`,
    ruleType,
    status,
    activatedAt,
    withdrawableAt,
    sourceText,
  };
};

commissionTransactionsState = commissionTransactionsState.map(normalizeCommissionTransaction);

let commissionWithdrawsState: AdminCommissionWithdrawRecord[] = [
  {
    id: 'WD-20260430-001',
    salesName: '陈默',
    transactionIds: ['commission-008', 'commission-021', 'commission-022'],
    orderCount: 3,
    totalAmount: 3970,
    status: 'withdrawing',
    financeOwner: '沈南',
    requestedAt: '2026-05-01 10:00',
  },
  {
    id: 'WD-20260331-001',
    salesName: '陈默',
    transactionIds: ['commission-009', 'commission-012'],
    orderCount: 2,
    totalAmount: 3440,
    status: 'withdrawn',
    requestedAt: '2026-03-31 11:30',
    paidAt: '2026-04-05 18:00',
    bankTransferNo: 'BANK-20260405-001',
    bankReceiptFileName: 'bank_receipt_20260405.pdf',
  },
];

commissionWithdrawsState = commissionWithdrawsState.map((withdraw) => {
  const transactions = commissionTransactionsState.filter((item) => withdraw.transactionIds.includes(item.id));
  return enrichCommissionWithdrawRecord({
    ...withdraw,
    orderCount: transactions.length || withdraw.orderCount,
    totalAmount: transactions.length ? transactions.reduce((sum, item) => sum + item.commissionAmount, 0) : withdraw.totalAmount,
  });
});

let agentBalanceState: AgentBalanceSummary = {
  currentBalance: 184000,
  totalTopup: 452000,
  deductedAmount: 267600,
  totalCommission: 31840,
  withdrawnAmount: 21400,
  withdrawableAmount: 10440,
  warningThreshold: 20000,
  alertLevel: 'warning',
  alertText: '',
  seatQuotaCards: [
    { level: 'lite', name: '轻量版（含 Team Lite）', quota: 8, assigned: 0, used: 0, remaining: 8 },
    { level: 'standard', name: '标准版', quota: 0, assigned: 0, used: 0, remaining: 0 },
    { level: 'pro', name: '高级版（含 Team Pro）', quota: 2, assigned: 1, used: 1, remaining: 1 },
    { level: 'ultimate', name: '旗舰版', quota: 0, assigned: 0, used: 0, remaining: 0 },
  ],
  collectionAccount: {
    companyName: '云能智联科技（上海）有限公司',
    bankName: '招商银行上海张江支行',
    branchName: '张江支行营业部',
    accountNo: '6214 8380 0021 9988',
    remarkCode: 'AGT-202605-0816',
    note: '对公转账请填写唯一备注号，平台财务将在到账后自动认账。',
  },
};

let agentBalanceLedgerState: AgentBalanceLedgerRecord[] = [
  {
    id: 'ABL-20260515-004',
    type: 'deduct',
    businessLabel: '平台代理采购 / 高级版 2 席',
    amount: -6000,
    balanceAfter: 18400,
    createdAt: '2026-05-15 09:40',
    remark: '代理使用钱包余额支付平台协议价',
  },
  {
    id: 'ABL-20260514-003',
    type: 'deduct',
    businessLabel: '平台代理采购 / Coding Plan Pro',
    amount: -26800,
    balanceAfter: 24600,
    createdAt: '2026-05-14 16:20',
    remark: '代理使用钱包余额支付平台协议价',
  },
  {
    id: 'ABL-20260511-002',
    type: 'topup',
    businessLabel: '钱包充值 / 微信',
    amount: 8000,
    balanceAfter: 51400,
    createdAt: '2026-05-11 10:08',
    remark: '充值成功，资金已入账',
    paymentMethod: 'wechat',
  },
  {
    id: 'ABL-20260502-000',
    type: 'topup',
    businessLabel: '钱包充值 / 对公转账',
    amount: 50000,
    balanceAfter: 50000,
    createdAt: '2026-05-02 14:12',
    remark: '凭证审核通过后入账',
    paymentMethod: 'bank_transfer',
    proofFileName: 'agent_topup_receipt_20260502.pdf',
  },
];

let agentTopupOrdersState: AgentBalanceTopupOrder[] = [
  {
    id: 'ATO-20260514-001',
    amount: 30000,
    paymentMethod: 'wechat',
    remark: '平台采购钱包充值',
    status: 'completed',
    createdAt: '2026-05-14 16:20',
    uniqueRemarkCode: 'AGT-202605-0815',
  },
  {
    id: 'ATO-20260502-001',
    amount: 50000,
    paymentMethod: 'bank_transfer',
    remark: '首批季度备货',
    status: 'completed',
    createdAt: '2026-05-02 14:12',
    proofFileName: 'agent_topup_receipt_20260502.pdf',
    uniqueRemarkCode: 'AGT-202605-0802',
  },
];

let agentProcurementOrdersState: AgentProcurementOrderRecord[] = [
  {
    id: 'APO-20260516-001',
    customerOrderId: 'AORD-20260516-001',
    tenantId: 'tenant-004',
    tenantName: '灵川生物',
    agentTenantId: 'agent-tenant-001',
    agentName: '华东一级代理',
    salesName: '陈默',
    orderSummary: '标准版 10 席 / 12个月',
    customerSaleAmount: 98000,
    platformListAmount: 120000,
    protocolRate: 0.7,
    protocolAmount: 84000,
    grossProfit: 14000,
    customerPaymentStatus: 'confirmed',
    status: 'pending_procurement',
    createdAt: '2026-05-16 10:20',
    updatedAt: '2026-05-16 10:35',
  },
  {
    id: 'APO-20260515-002',
    customerOrderId: 'AORD-20260515-002',
    tenantId: 'tenant-003',
    tenantName: '星河财税',
    agentTenantId: 'agent-tenant-002',
    agentName: '北辰渠道中心',
    salesName: '许宁',
    orderSummary: '高级版 4 席 + CodingPlan Pro / 12个月',
    customerSaleAmount: 76000,
    platformListAmount: 88000,
    protocolRate: 0.65,
    protocolAmount: 57200,
    grossProfit: 18800,
    customerPaymentStatus: 'confirmed',
    procurementPaymentMethod: 'bank_transfer',
    procurementProofName: 'agent_procurement_20260515.pdf',
    status: 'pending_finance_review',
    financeOwner: '姚楠',
    createdAt: '2026-05-15 15:40',
    updatedAt: '2026-05-15 16:10',
  },
  {
    id: 'APO-20260514-003',
    customerOrderId: 'AORD-20260514-003',
    tenantId: 'tenant-006',
    tenantName: '东岸新能源',
    agentTenantId: 'agent-tenant-004',
    agentName: '临港企业服务',
    salesName: '沈南',
    orderSummary: '轻量版 6 席 / 3个月',
    customerSaleAmount: 18000,
    platformListAmount: 24000,
    protocolRate: 0.8,
    protocolAmount: 19200,
    grossProfit: -1200,
    customerPaymentStatus: 'confirmed',
    procurementPaymentMethod: 'wallet',
    status: 'delivery_processing',
    deliveryOwner: '秦川',
    openingTaskId: 'OT-20260514-003',
    createdAt: '2026-05-14 09:20',
    updatedAt: '2026-05-14 11:00',
  },
  {
    id: 'APO-20260512-004',
    customerOrderId: 'AORD-20260512-004',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    agentTenantId: 'agent-tenant-001',
    agentName: '华东一级代理',
    salesName: '陈默',
    orderSummary: '旗舰版 2 席 / 12个月',
    customerSaleAmount: 56000,
    platformListAmount: 72000,
    protocolRate: 0.7,
    protocolAmount: 50400,
    grossProfit: 5600,
    customerPaymentStatus: 'confirmed',
    procurementPaymentMethod: 'wechat',
    procurementProofName: 'wechat-agent-pay-20260512.png',
    status: 'completed',
    financeOwner: '姚楠',
    deliveryOwner: '秦川',
    openingTaskId: 'OT-20260512-004',
    createdAt: '2026-05-12 13:25',
    updatedAt: '2026-05-13 18:00',
  },
];

let commissionBatchesState: AdminCommissionBatch[] = [
  {
    id: 'batch-2026-04-current',
    batchNo: 'CB-202604-CURRENT',
    period: '2026-04',
    salesCount: 2,
    commissionCount: 4,
    totalAmount: 11080,
    status: 'pending_review',
    financeOwner: '沈南',
    createdAt: '2026-05-01 00:30',
    transactionIds: ['commission-001', 'commission-005', 'commission-006', 'commission-010'],
    sampledItems: [
      { id: 'samp-current-001', transactionId: 'commission-005', orderId: 'ORD-20260428-015', tenantName: '云岭制造', salesName: '陈默', orderAmount: 52000, amount: 2600, rate: 0.05, sourceText: '权益入账自动生成', generatedAt: '2026-04-28 08:15', reviewed: false },
      { id: 'samp-current-002', transactionId: 'commission-010', orderId: 'ORD-20260428-009', tenantName: '北辰科技', salesName: '沈南', orderAmount: 128000, amount: 6400, rate: 0.05, sourceText: '付款完成自动生成', generatedAt: '2026-04-28 09:25', reviewed: false },
      { id: 'samp-current-003', transactionId: 'commission-006', orderId: 'ORD-20260426-031', tenantName: '星河财税', salesName: '陈默', orderAmount: 8800, amount: 440, rate: 0.05, sourceText: '开通完成自动生成', generatedAt: '2026-04-26 10:45', reviewed: false },
    ],
  },
  {
    id: 'batch-2026-04-payroll',
    batchNo: 'CB-202604-PAY',
    period: '2026-04',
    salesCount: 1,
    commissionCount: 1,
    totalAmount: 940,
    status: 'exported',
    financeOwner: '姚楠',
    createdAt: '2026-05-03 09:00',
    reviewedAt: '2026-05-03 10:20',
    exportedAt: '2026-05-03 11:10',
    transactionIds: ['commission-008'],
    sampledItems: [
      { id: 'samp-pay-001', transactionId: 'commission-008', orderId: 'ORD-20260408-022', tenantName: '云岭制造', salesName: '陈默', orderAmount: 18800, amount: 940, rate: 0.05, sourceText: '打款单已生成，等待打款确认', generatedAt: '2026-04-08 11:20', reviewed: true },
    ],
  },
  {
    id: 'batch-2026-03',
    batchNo: 'CB-202603',
    period: '2026-03',
    salesCount: 2,
    commissionCount: 2,
    totalAmount: 1940,
    status: 'paid',
    createdAt: '2026-04-01 00:30',
    reviewedAt: '2026-04-02 09:20',
    exportedAt: '2026-04-03 15:10',
    paidAt: '2026-04-05 18:00',
    transactionIds: ['commission-002', 'commission-012'],
    sampledItems: [
      { id: 'samp-001', transactionId: 'commission-002', orderId: 'ORD-20260312-015', tenantName: '北辰科技', salesName: '林嘉', orderAmount: 12000, amount: 600, rate: 0.05, sourceText: '批次打款完成', generatedAt: '2026-03-12 16:11', reviewed: true },
      { id: 'samp-002', transactionId: 'commission-012', orderId: 'ORD-20260328-006', tenantName: '云岭制造', salesName: '陈默', orderAmount: 26800, amount: 1340, rate: 0.05, sourceText: '批次打款完成', generatedAt: '2026-03-28 13:15', reviewed: true },
    ],
  },
  {
    id: 'batch-2026-02',
    batchNo: 'CB-202602',
    period: '2026-02',
    salesCount: 1,
    commissionCount: 1,
    totalAmount: 2100,
    status: 'paid',
    createdAt: '2026-03-01 00:30',
    reviewedAt: '2026-03-01 09:30',
    exportedAt: '2026-03-04 16:20',
    paidAt: '2026-03-05 17:50',
    transactionIds: ['commission-009'],
    sampledItems: [
      { id: 'samp-003', transactionId: 'commission-009', orderId: 'ORD-20260220-009', tenantName: '星河财税', salesName: '陈默', orderAmount: 42000, amount: 2100, rate: 0.05, sourceText: '批次打款完成', generatedAt: '2026-02-20 15:10', reviewed: true },
    ],
  },
  {
    id: 'batch-2026-04',
    batchNo: 'CB-202604',
    period: '2026-04',
    salesCount: 1,
    commissionCount: 2,
    totalAmount: 2900,
    status: 'approved',
    createdAt: '2026-05-01 00:30',
    reviewedAt: '2026-05-02 09:20',
    transactionIds: ['commission-003', 'commission-007'],
    sampledItems: [
      { id: 'samp-004', transactionId: 'commission-003', orderId: 'ORD-20260402-021', tenantName: '北辰科技', salesName: '林嘉', orderAmount: 33200, amount: 1660, rate: 0.05, sourceText: '月度批次审核确认', generatedAt: '2026-04-03 12:06', reviewed: true },
      { id: 'samp-005', transactionId: 'commission-007', orderId: 'ORD-20260412-018', tenantName: '杭州数智财税', salesName: '林嘉', orderAmount: 24800, amount: 1240, rate: 0.05, sourceText: '月度结算单确认', generatedAt: '2026-04-12 17:30', reviewed: true },
    ],
  },
];

const findCommissionTenantId = (transaction: Pick<AdminCommissionTransaction, 'orderId' | 'tenantName'>) =>
  ordersState.find((order) => order.id === transaction.orderId)?.tenantId
  ?? tenantsState.find((tenant) => tenant.name === transaction.tenantName)?.id
  ?? transaction.orderId;

const buildSalesCommissionRecord = (transaction: AdminCommissionTransaction): SalesCustomerCommissionRecord => {
  const rate = typeof transaction.rate === 'number' ? transaction.rate : defaultCommissionRate();
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    tenantId: findCommissionTenantId(transaction),
    tenantName: transaction.tenantName,
    orderKind: transaction.orderKind,
    originalAmount: transaction.originalAmount,
    discountAmount: transaction.discountAmount,
    paidAmount: transaction.paidAmount ?? transaction.orderAmount,
    orderAmount: transaction.orderAmount,
    commissionAmount: transaction.commissionAmount,
    rate,
    ruleName: transaction.ruleName,
    ruleType: transaction.ruleType,
    calcText: `${Math.round(rate * 1000) / 10}% × 实付${money(transaction.paidAmount ?? transaction.orderAmount)} = ${money(transaction.commissionAmount)}`,
    status: transaction.status,
    generatedAt: transaction.generatedAt,
    activatedAt: transaction.activatedAt,
    withdrawableAt: transaction.withdrawableAt,
    financeReviewedAt: transaction.financeReviewedAt,
    confirmedAt: transaction.confirmedAt,
    disputedAt: transaction.disputedAt,
    disputeReason: transaction.disputeReason,
    paidAt: transaction.paidAt,
    windowRemainingDays: 0,
  };
};

const getTransactionsByBatchId = (batchId: string) =>
  commissionTransactionsState.filter((item) => item.batchId === batchId);

const getCommissionBatchById = (batchId?: string) =>
  batchId ? commissionBatchesState.find((item) => item.id === batchId) : undefined;

const syncCommissionBatchAggregate = (batchId: string) => {
  const batch = commissionBatchesState.find((item) => item.id === batchId);
  if (!batch) return;
  const transactionIds = batch.transactionIds?.length
    ? batch.transactionIds.filter((transactionId) => commissionTransactionsState.some((item) => item.id === transactionId && item.batchId === batchId))
    : getTransactionsByBatchId(batchId).map((item) => item.id);
  const transactions = commissionTransactionsState.filter((item) => transactionIds.includes(item.id));
  if (!transactions.length) {
    commissionBatchesState = commissionBatchesState.filter((item) => item.id !== batchId);
    return;
  }
  const sampledItems: AdminCommissionBatch['sampledItems'] = batch.sampledItems.reduce<AdminCommissionBatch['sampledItems']>((result, sample) => {
    const transaction = sample.transactionId
      ? transactions.find((current) => current.id === sample.transactionId)
      : undefined;
    if (!transaction) {
      return result;
    }
    result.push({
      ...sample,
      orderId: transaction.orderId,
      tenantName: transaction.tenantName,
      salesName: transaction.salesName,
      orderAmount: transaction.orderAmount,
      amount: transaction.commissionAmount,
      rate: transaction.rate,
      sourceText: transaction.sourceText,
      generatedAt: transaction.generatedAt,
    });
    return result;
  }, []);
  commissionBatchesState = commissionBatchesState.map((item) =>
    item.id === batchId
      ? {
          ...item,
          transactionIds: transactions.map((transaction) => transaction.id),
          salesCount: new Set(transactions.map((transaction) => transaction.salesName)).size,
          commissionCount: transactions.length,
          totalAmount: transactions.reduce((sum, transaction) => sum + transaction.commissionAmount, 0),
          sampledItems,
        }
      : item,
  );
};

const notifySalesCommissionPendingConfirm = (transaction: AdminCommissionTransaction) => {
  createNotification({
    role: 'sales',
    category: 'commission',
    priority: 'high',
    title: '佣金待确认',
    summary: `${transaction.tenantName} 的佣金金额已完成财务核准，请确认后进入打款流程。`,
    todo: true,
    actionable: true,
    actionUrl: '/sales/commission',
    actionLabel: '确认金额',
    sourceType: 'commission',
    sourceId: transaction.id,
    templateTrigger: 'commission.sales_confirm_required',
  });
};

const notifyFinanceCommissionConfirmed = (transaction: AdminCommissionTransaction) => {
  createNotification({
    role: 'finance',
    category: 'commission',
    priority: 'medium',
    title: '佣金已确认，可生成打款单',
    summary: `${transaction.tenantName} 的佣金金额已由代理确认，可进入打款单流程。`,
    todo: true,
    actionable: true,
    actionUrl: '/finance/commission/transactions',
    actionLabel: '生成打款单',
    sourceType: 'commission',
    sourceId: transaction.id,
    templateTrigger: 'commission.sales_confirmed',
  });
};

const buildCommissionDashboardSummary = (): AdminCommissionDashboardSummary => {
  const pendingRows = commissionTransactionsState.filter((item) => item.status === 'pending');
  const pendingSalesConfirmRows = commissionTransactionsState.filter((item) => item.status === 'pending_sales_confirm');
  const readyPayoutRows = commissionTransactionsState.filter((item) => {
    if (item.status !== 'confirmed') return false;
    const batch = getCommissionBatchById(item.batchId);
    return !batch || batch.status !== 'exported';
  });
  const payableRows = commissionTransactionsState.filter((item) => item.status === 'confirmed' && getCommissionBatchById(item.batchId)?.status === 'exported');
  const disputedRows = commissionTransactionsState.filter((item) => item.status === 'disputed');
  const pendingAmount = pendingRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const pendingSalesConfirmAmount = pendingSalesConfirmRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const readyPayoutAmount = readyPayoutRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const exportedBatchAmount = payableRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const reconciliationDiffCount = payableRows.length ? 1 : 0;
  const alerts: AdminCommissionDashboardSummary['alerts'] = [];

  if (disputedRows.length) {
    alerts.push({
      id: 'alert-dispute',
      title: '代理异议待复核',
      description: `${disputedRows.length} 笔佣金被代理提出异议，需尽快复核金额基数。`,
      level: 'warning',
    });
  }
  if (payableRows.length) {
    alerts.push({
      id: 'alert-bank',
      title: '打款确认待处理',
      description: '存在已生成打款单但尚未确认已打款的佣金流水。',
      level: 'warning',
    });
  }

  return {
    pendingAmount,
    pendingCount: pendingRows.length,
    pendingSalesConfirmAmount,
    pendingSalesConfirmCount: pendingSalesConfirmRows.length,
    readyPayoutAmount,
    readyPayoutCount: readyPayoutRows.length,
    exportedBatchAmount,
    exportedBatchCount: payableRows.length,
    reconciliationDiffAmount: reconciliationDiffCount ? exportedBatchAmount : 0,
    reconciliationDiffCount,
    todos: [
      { id: 'todo-confirm', title: '待财务核准', description: `${pendingRows.length} 笔流水待财务核准`, amount: pendingAmount, count: pendingRows.length, route: '/finance/commission/transactions', priority: 'high' },
      { id: 'todo-sales-confirm', title: '待代理确认', description: `${pendingSalesConfirmRows.length} 笔流水已完成财务核准，等待代理确认`, amount: pendingSalesConfirmAmount, count: pendingSalesConfirmRows.length, route: '/finance/commission/transactions', priority: 'high' },
      { id: 'todo-payout', title: '待生成打款单', description: `${readyPayoutRows.length} 笔流水已完成代理确认，可生成打款单`, amount: readyPayoutAmount, count: readyPayoutRows.length, route: '/finance/commission/transactions', priority: 'medium' },
      { id: 'todo-pay', title: '待打款确认', description: `${payableRows.length} 笔流水已生成打款单，等待打款确认`, amount: exportedBatchAmount, count: payableRows.length, route: '/finance/commission/transactions', priority: 'medium' },
    ],
    alerts,
  };
};

let plansState: AdminPlanRecord[] = [
  { id: 'plan-seat-lite', name: '轻量版', productType: 'seat_sub', specSummary: '2 核 CPU / 4 GiB / 60 GiB 存储', priceMonth: 210, priceQuarter: 630, priceYear: 2520, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
  { id: 'plan-seat-standard', name: '标准版', productType: 'seat_sub', specSummary: '4 核 CPU / 8 GiB / 80 GiB 存储', priceMonth: 430, priceQuarter: 1290, priceYear: 5160, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
  { id: 'plan-seat-pro', name: '高级版', productType: 'seat_sub', specSummary: '8 核 CPU / 16 GiB / 160 GiB 存储', priceMonth: 860, priceQuarter: 2580, priceYear: 10320, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
  { id: 'plan-seat-ultimate', name: '旗舰版', productType: 'seat_sub', specSummary: '16 核 CPU / 32 GiB / 160 GiB 存储', priceMonth: 1720, priceQuarter: 5160, priceYear: 20640, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
  { id: 'plan-coding-lite', name: 'CodingPlan Team Lite', productType: 'coding_plan', specSummary: '适配轻量版/标准版，基础代码协作能力', priceMonth: 120, priceQuarter: 360, priceYear: 1440, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
  { id: 'plan-coding-pro', name: 'CodingPlan Team Pro', productType: 'coding_plan', specSummary: '适配高级版/旗舰版，团队级代码协作与管理', priceMonth: 600, priceQuarter: 1800, priceYear: 7200, status: 'published', effectiveFrom: '2026-01-01', createdBy: '王珊 / OP-' },
];

let planHistoryState: Record<string, AdminPlanHistoryRecord[]> = {
  'plan-seat-lite': [
    { id: 'ph-001', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布轻量版' },
  ],
  'plan-seat-standard': [
    { id: 'ph-003', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布标准版' },
  ],
  'plan-seat-pro': [
    { id: 'ph-004', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布高级版' },
  ],
  'plan-seat-ultimate': [
    { id: 'ph-005', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布旗舰版' },
  ],
  'plan-coding-lite': [
    { id: 'ph-006', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布 CodingPlan Team Lite' },
  ],
  'plan-coding-pro': [
    { id: 'ph-007', changedAt: '2026-01-01 09:00', changedBy: '王珊 / OP-', summary: '首次发布 CodingPlan Team Pro' },
  ],
};

let newsState: AdminNewsRecord[] = [
  {
    id: 'news-001',
    title: 'ArkClaw 企业版新增 ClawSentry 防护规则模板',
    category: '产品动态',
    tags: ['安全', 'ClawSentry'],
    status: 'published',
    publishedAt: '2026-04-23 19:10',
    views: 1820,
    author: '运营组',
    updatedAt: '2026-04-23 19:10',
    summary: '官方预置高危操作、敏感目录、机密模型三类规则模板。',
    cover: 'cover-001.png',
    content: 'ClawSentry 本次更新聚焦企业安全治理。',
  },
  {
    id: 'news-002',
    title: 'AI 代理平台在研发效能场景的落地路径',
    category: '最佳实践',
    tags: ['研发效能', '知识中心'],
    status: 'reviewing',
    scheduledAt: '2026-04-30 09:00',
    views: 920,
    author: '市场组',
    updatedAt: '2026-04-27 15:20',
    summary: '从模板、技能、知识库和可观测四个层面建立机制。',
    content: '研发场景建议先从模板中心沉淀标准助手。',
  },
];

let leadsState: AdminLeadRecord[] = [
  { id: 'lead-001', opportunityType: 'external_consult', company: '杭州数智财税', contact: '唐雨', title: '运营总监', phone: '13800006666', email: 'tangyu@szcai.com', requirement: '希望了解企业知识库和员工问答助手，预算 5-8 万。', source: '官网咨询', status: 'new', slaHoursLeft: -19, assignedSales: '陈默', assignedAt: '2026-04-27 15:20', createdAt: '2026-04-27 15:20' },
  { id: 'lead-004', opportunityType: 'external_consult', company: '宁波云帆零售', contact: '沈佳', title: '数字化经理', phone: '13800009999', email: 'shenjia@yunfan-retail.com', requirement: '希望了解门店知识库、客服问答助手和员工培训场景，预计先试点 20 人。', source: '官网咨询', status: 'assigned', slaHoursLeft: 6, assignedSales: '沈南', assignedAt: '2026-04-28 09:20', createdAt: '2026-04-28 09:10' },
  { id: 'lead-005', opportunityType: 'customer_business_consult', company: '云岭制造', contact: '赵欣', title: '客户管理员', phone: '13800001111', email: 'zhaoxin@yuling.com', requirement: '计划追加 10 个高级版席位，并咨询年度套餐折扣。', source: '控制台席位/套餐咨询', status: 'assigned', slaHoursLeft: 22, assignedSales: '陈默', assignedAt: '2026-04-28 08:40', createdAt: '2026-04-28 08:40' },
  { id: 'lead-002', opportunityType: 'external_consult', company: '苏州启明制造', contact: '梁晨', title: '信息化负责人', phone: '13800007777', email: 'liangchen@qiming-mfg.com', requirement: '需要接入企业微信和审批流，希望下周安排演示。', source: '资讯页跳转', status: 'assigned', slaHoursLeft: 18, assignedSales: '陈默', assignedAt: '2026-04-24 10:10', createdAt: '2026-04-24 09:20' },
  { id: 'lead-003', opportunityType: 'external_consult', company: '启明医疗器械', contact: '顾诚', title: '产品负责人', phone: '13800004444', email: 'gucheng@qiming-med.com', requirement: '关注文档安全和外网出入口配置。', source: '官网咨询', status: 'converted', slaHoursLeft: 0, assignedSales: '陈默', assignedAt: '2026-04-18 11:30', claimedAt: '2026-04-18 11:35', lastFollowupAt: '2026-04-20 18:20', latestFollowupSummary: '发送文档安全和外网入口说明，客户确认可转入客户池继续推进。', convertedAt: '2026-04-20 18:40', convertedTenantId: 'tenant-004', createdAt: '2026-04-18 11:00' },
];

const externalAdminLeads = () => leadsState.filter((lead) => lead.opportunityType === 'external_consult');

export const createAdminCustomerBusinessConsultOpportunity = (payload: TenantSupportRequestPayload) => {
  const createdAt = now().format('YYYY-MM-DD HH:mm');
  const record: AdminLeadRecord = {
    id: `lead-business-${Date.now()}`,
    opportunityType: 'customer_business_consult',
    company: '云岭制造',
    contact: '赵欣',
    title: '客户管理员',
    phone: '13800001111',
    email: 'zhaoxin@yuling.com',
    requirement: `${payload.title}：${payload.description}`,
    source: '控制台席位/套餐咨询',
    status: 'assigned',
    slaHoursLeft: 24,
    assignedSales: '陈默',
    assignedAt: createdAt,
    createdAt,
  };
  leadsState = [record, ...leadsState];
  createNotification({
    role: 'platformAdmin',
    category: 'lead',
    priority: 'medium',
    title: '存量客户商务咨询',
    summary: `${record.company} 提交了席位/套餐咨询，已进入咨询商机池。`,
    todo: true,
    actionable: true,
    actionUrl: '/admin/leads',
    actionLabel: '查看咨询商机池',
    sourceType: 'lead',
    sourceId: record.id,
    templateTrigger: 'opportunity.customer_business.created',
  });
  return clone(record);
};
const notifiedOverdueLeadIds = new Set<string>();

const notifyOverdueLeads = () => {
  leadsState
    .filter((lead) => lead.status === 'new' && lead.slaHoursLeft <= 0 && !notifiedOverdueLeadIds.has(lead.id))
    .forEach((lead) => {
      notifiedOverdueLeadIds.add(lead.id);
      if (lead.opportunityType === 'customer_business_consult') {
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
      }
      createNotification({
        role: 'platformAdmin',
        category: 'lead',
        priority: 'high',
        title: '商机 24h 未认领',
        summary: `${lead.company} 的咨询商机已超时，当前负责人：${lead.assignedSales || '未分配'}。`,
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

let roleMatrixState: AdminRolePermissionMatrix[] = [
  {
    role: 'R1.0',
    name: '超级管理员',
    permissions: [
      { key: 'b2.close', label: '关闭企业', enabled: true },
      { key: 'b5.rules', label: '结算规则', enabled: true },
      { key: 'b10.staff', label: '内部员工 CRUD', enabled: true },
    ],
  },
  {
    role: 'R1.1',
    name: '平台运营',
    permissions: [
      { key: 'b2.manage', label: '企业运营管理', enabled: true },
      { key: 'b4.transfer', label: '客户调拨初审', enabled: true },
      { key: 'b7.news', label: '资讯草稿与发布', enabled: true },
    ],
  },
  {
    role: 'R1.2',
    name: '财务专员',
    permissions: [
      { key: 'b3.bank-transfer', label: '对公审核', enabled: true },
      { key: 'b5.batch', label: '佣金批次审核', enabled: true },
    ],
  },
  {
    role: 'R1.3',
    name: '客户运维',
    permissions: [
      { key: 'b2.impersonate', label: '代登录', enabled: true },
      { key: 'b2.password', label: '重置客户密码', enabled: true },
      { key: 'b8.read', label: '商机只读', enabled: true },
    ],
  },
];

let dictionariesState: AdminDictionaryRecord[] = [
  { code: 'industry', name: '行业', items: [{ id: 'dic-001', label: '制造业', value: 'manufacture', enabled: true, order: 1 }, { id: 'dic-002', label: '软件服务', value: 'software', enabled: true, order: 2 }] },
  { code: 'lead_close_reason', name: '商机关闭原因', items: [{ id: 'dic-005', label: '不感兴趣', value: 'not_interested', enabled: true, order: 1 }] },
];

let notifyTemplatesState: AdminNotifyTemplate[] = [
  { id: 'tpl-001', name: '注册成功通知', trigger: 'register.success', channels: ['邮件', '站内信'], subject: '欢迎开通 ArkClaw 企业版', content: '你好 {{user.name}}，你的企业 {{tenant.name}} 已成功注册。', enabled: true },
  { id: 'tpl-002', name: '代登录开始通知', trigger: 'impersonate.started', channels: ['邮件', '短信', '站内信'], subject: '支持人员代登录提醒', content: '支持人员正在以你的身份登录处理工单 {{ticket.no}}。', enabled: true },
];

let systemParamsState: AdminSystemParam[] = [
  { key: 'commission.default_rate', value: '0.05', valueType: 'float', description: '默认佣金率', updatedAt: '2026-04-01 10:00' },
  { key: 'commission.cycle_months', value: '12', valueType: 'int', description: '归属期（月）', updatedAt: '2026-04-01 10:00' },
  { key: 'order.bank_transfer_review_sla_hours', value: '48', valueType: 'int', description: '对公审核处理时限小时数', updatedAt: '2026-04-10 09:20' },
  { key: 'lead.unclaimed_alert_hours', value: '24', valueType: 'int', description: '商机未认领告警小时数', updatedAt: '2026-04-10 09:20' },
  { key: 'anomaly.order_amount_threshold', value: '50000', valueType: 'int', description: '异常订单金额阈值', updatedAt: '2026-04-10 09:20' },
  { key: 'impersonate.max_duration_minutes', value: '120', valueType: 'int', description: '代登录最长时长（分钟）', updatedAt: '2026-04-10 09:20' },
];

let auditsState: AdminGlobalAuditRecord[] = [
  { id: 'ga-001', createdAt: '2026-04-28 09:50', actor: '姚楠', role: 'R1.2', action: '创建退款单', targetType: 'refund_request', targetId: 'rf-002', tenantName: '北辰科技', ip: '10.2.14.8', userAgent: 'Chrome / macOS', result: 'success', reason: '重复付款' },
  { id: 'ga-002', createdAt: '2026-04-27 16:20', actor: '王珊', role: 'R1.1', action: '创建客户调拨申请', targetType: 'customer_transfer_request', targetId: 'tr-001', tenantName: '启明医疗器械', ip: '10.2.14.3', userAgent: 'Chrome / macOS', result: 'success' },
];

let staffState: AdminStaffRecord[] = [
  { id: 'staff-001', accountId: 'acct-lintao', employeeNo: 'SU-0001', name: '林涛', email: 'lintao@ynzl.com', phone: '13800139000', roleCode: 'R1.0', defaultRole: true, team: '平台中台', status: 'active', hiredAt: '2023-01-10', lastLoginAt: '2026-04-28 09:10', mfaEnabled: true },
  { id: 'staff-002', accountId: 'acct-wangshan', employeeNo: 'OP-1008', name: '王珊', email: 'wangshan@ynzl.com', phone: '13800139001', roleCode: 'R1.1', defaultRole: true, team: '运营组', status: 'active', hiredAt: '2024-02-18', lastLoginAt: '2026-04-28 08:58', mfaEnabled: true },
  { id: 'staff-002-finance', accountId: 'acct-wangshan', employeeNo: 'OP-1008', name: '王珊', email: 'wangshan@ynzl.com', phone: '13800139001', roleCode: 'R1.2', defaultRole: false, team: '运营组', status: 'active', hiredAt: '2024-02-18', lastLoginAt: '2026-04-28 08:58', mfaEnabled: true },
  { id: 'staff-003', accountId: 'acct-yaonan', employeeNo: 'FI-2002', name: '姚楠', email: 'yaonan@ynzl.com', phone: '13800139002', roleCode: 'R1.2', defaultRole: true, team: '财务组', status: 'active', hiredAt: '2024-05-06', lastLoginAt: '2026-04-28 09:35', mfaEnabled: true },
  { id: 'am-001', accountId: 'acct-zhouan', employeeNo: 'CS-3001', name: '周安', email: 'zhouan@ynzl.com', phone: '13800139003', roleCode: 'R1.3', defaultRole: true, team: '客户运维组', status: 'active', hiredAt: '2024-06-18', lastLoginAt: '2026-04-28 09:12', mfaEnabled: true },
  { id: 'am-002', accountId: 'acct-mengqi', employeeNo: 'CS-3004', name: '孟琪', email: 'mengqi@ynzl.com', phone: '13800139004', roleCode: 'R1.3', defaultRole: true, team: '客户运维组', status: 'active', hiredAt: '2024-07-09', lastLoginAt: '2026-04-28 09:08', mfaEnabled: true },
  { id: 'staff-004', accountId: 'acct-xulan', employeeNo: 'CS-3006', name: '许岚', email: 'xulan@ynzl.com', phone: '13800139005', roleCode: 'R1.3', defaultRole: true, team: '客户运维组', status: 'active', hiredAt: '2024-08-20', lastLoginAt: '2026-04-28 09:22', mfaEnabled: false },
  { id: 'staff-005', accountId: 'acct-chenmo', employeeNo: 'R3-2048', name: '陈默', email: 'chenmo@ynzl.com', phone: '13800138000', roleCode: 'R3', defaultRole: true, team: '华东代理一组', status: 'active', hiredAt: '2024-06-15', lastLoginAt: '2026-04-28 09:02', mfaEnabled: true },
  { id: 'staff-005-admin', accountId: 'acct-chenmo', employeeNo: 'R3-2048', name: '陈默', email: 'chenmo@ynzl.com', phone: '13800138000', roleCode: 'R1.1', defaultRole: false, team: '华东代理一组', status: 'active', hiredAt: '2024-06-15', lastLoginAt: '2026-04-28 09:02', mfaEnabled: true },
  { id: 'staff-shennan-sales', accountId: 'acct-shennan', employeeNo: 'SN0009', name: '沈南', email: 'shennan@ynzl.com', phone: '13800138003', roleCode: 'R3', defaultRole: true, team: '华东代理一组', status: 'active', hiredAt: '2023-12-01', lastLoginAt: '2026-04-28 08:50', mfaEnabled: true },
  { id: 'staff-shennan-finance', accountId: 'acct-shennan', employeeNo: 'SN0009', name: '沈南', email: 'shennan@ynzl.com', phone: '13800138003', roleCode: 'R1.2', defaultRole: false, team: '华东代理一组', status: 'active', hiredAt: '2023-12-01', lastLoginAt: '2026-04-28 08:50', mfaEnabled: true },
  { id: 'staff-006', accountId: 'acct-songyuan', employeeNo: 'OL-03', name: '宋远', email: 'songyuan@ynzl.com', phone: '13800137000', roleCode: 'R2.0', defaultRole: true, team: '交付管理组', status: 'active', hiredAt: '2024-03-12', lastLoginAt: '2026-04-28 09:18', mfaEnabled: true },
  { id: 'staff-006-ops', accountId: 'acct-songyuan', employeeNo: 'OL-03', name: '宋远', email: 'songyuan@ynzl.com', phone: '13800137000', roleCode: 'R2.1', defaultRole: false, team: '交付管理组', status: 'active', hiredAt: '2024-03-12', lastLoginAt: '2026-04-28 09:18', mfaEnabled: true },
  { id: 'staff-007', accountId: 'acct-wangche', employeeNo: 'DE-12', name: '王澈', email: 'wangche@ynzl.com', phone: '13800137001', roleCode: 'R2.1', defaultRole: true, team: '交付运维组', status: 'active', hiredAt: '2024-09-12', lastLoginAt: '2026-04-28 08:46', mfaEnabled: true },
  { id: 'staff-008', accountId: 'acct-liuqi', employeeNo: 'TS-08', name: '刘启', email: 'liuqi@ynzl.com', phone: '13800137002', roleCode: 'R2.1', defaultRole: true, team: '交付运维组', status: 'active', hiredAt: '2024-10-08', lastLoginAt: '2026-04-28 08:31', mfaEnabled: true },
  { id: 'staff-009', accountId: 'acct-zhuyue', employeeNo: 'TS-05', name: '朱玥', email: 'zhuyue@ynzl.com', phone: '13800137003', roleCode: 'R2.1', defaultRole: true, team: '交付运维组', status: 'active', hiredAt: '2025-01-06', lastLoginAt: '2026-04-28 08:15', mfaEnabled: true },
];

const generateTemporaryPassword = () => {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*'];
  const chars = groups.join('');
  const password = [
    groups[0][Math.floor(Math.random() * groups[0].length)],
    groups[1][Math.floor(Math.random() * groups[1].length)],
    groups[2][Math.floor(Math.random() * groups[2].length)],
    groups[3][Math.floor(Math.random() * groups[3].length)],
    ...Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]),
  ];
  return password.sort(() => Math.random() - 0.5).join('');
};

let monitoringHealthState: AdminMonitoringMetric[] = [
  { id: 'mh-001', label: '平台 P95', value: '1.4s', trend: '-0.2s', status: 'good' },
  { id: 'mh-002', label: '月可用性', value: '99.7%', trend: '+0.1%', status: 'good' },
  { id: 'mh-003', label: '火山 API 成功率', value: '99.3%', trend: '-0.4%', status: 'warn' },
  { id: 'mh-004', label: 'DB 连接数', value: '61 / 120', trend: '稳定', status: 'good' },
  { id: 'mh-005', label: 'Redis 命中率', value: '96.2%', trend: '+0.4%', status: 'good' },
  { id: 'mh-006', label: '异常登录尖峰', value: '12 次', trend: '+5', status: 'warn' },
];

let alertRulesState: AdminAlertRule[] = [
  { id: 'ar-001', name: '火山 API 错误率 > 5% 持续 5 分钟', threshold: '> 5%', channels: ['站内', '邮件', '钉钉'], enabled: true, level: 'P1' },
  { id: 'ar-002', name: '平台 P95 > 5s 持续 10 分钟', threshold: '> 5s', channels: ['站内', '邮件'], enabled: true, level: 'P1' },
  { id: 'ar-003', name: '对公转账积压 > 10 笔', threshold: '> 10', channels: ['站内', '邮件'], enabled: true, level: 'P2' },
];

let impersonationSessionsState: Array<{
  id: string;
  tenantId: string;
  tenantName: string;
  adminUser: string;
  targetUser: string;
  ticketNo: string;
  reason: string;
  startedAt: string;
  expectedEndAt: string;
  endedAt?: string;
  status: 'active' | 'ended';
}> = [
  {
    id: 'imp-001',
    tenantId: 'tenant-002',
    tenantName: '北辰科技',
    adminUser: '许岚 / CS-',
    targetUser: '唐凯',
    ticketNo: 'TICKET-20260418-02',
    reason: '排查客户登录失败',
    startedAt: '2026-04-18 09:20',
    expectedEndAt: '2026-04-18 11:20',
    endedAt: '2026-04-18 10:05',
    status: 'ended' as const,
  },
];

const roleNames: Record<AdminRoleCode, string> = {
  'R1.0': '超级管理员',
  'R1.1': '平台运营',
  'R1.2': '财务专员',
  'R1.3': '客户运维',
};

const recordAudit = (entry: Omit<AdminGlobalAuditRecord, 'id' | 'createdAt' | 'ip' | 'userAgent'>) => {
  auditsState = [
    {
      id: `ga-${Date.now()}`,
      createdAt: now().format('YYYY-MM-DD HH:mm'),
      ip: '10.2.14.9',
      userAgent: 'Chrome / macOS',
      ...entry,
    },
    ...auditsState,
  ];
};

const getStaffAccountKey = (staff: Pick<AdminStaffRecord, 'accountId' | 'phone'>) => staff.accountId || staff.phone;
const getStaffAccountBindings = (accountId: string) =>
  staffState.filter((item) => getStaffAccountKey(item) === accountId || item.accountId === accountId || item.phone === accountId);
const getStaffById = (id?: string) => staffState.find((item) => item.id === id);
const getSalesByStaff = (staff?: AdminStaffRecord) => (staff ? salesState.find((item) => item.name === staff.name) : undefined);
const previewGroup = (type: string, label: string, examples: string[]) => ({
  type,
  label,
  count: examples.length,
  examples: examples.slice(0, 3),
});
const isDeliveryRole = (roleCode: AdminStaffRecord['roleCode']) => ['R2', 'R2.0', 'R2.1', 'R2.2'].includes(roleCode);
const isStaffInheritanceRole = (roleCode: AdminStaffRecord['roleCode']) => roleCode !== 'R1.0' && roleCode !== 'R1.1';

const buildInheritancePreviewItem = (
  fromStaff: AdminStaffRecord,
  assignment?: AdminStaffInheritanceRoleAssignment,
): AdminStaffInheritancePreviewItem => {
  const successor = getStaffById(assignment?.successorStaffId);
  const fromSales = getSalesByStaff(fromStaff);
  const affected: AdminStaffInheritancePreviewItem['affected'] = [];

  if (fromStaff.roleCode === 'R3' && fromSales) {
    affected.push(previewGroup('tenants', '客户归属', tenantsState.filter((item) => item.ownerSalesId === fromSales.id || item.ownerSales === fromSales.name).map((item) => item.name)));
    affected.push(previewGroup('orders', '订单归属', ordersState.filter((item) => item.ownerSales === fromSales.name).map((item) => item.id)));
    affected.push(previewGroup('leads', '线索/咨询', leadsState.filter((item) => item.assignedSales === fromSales.name).map((item) => item.company)));
    affected.push(previewGroup('sales_coupon_pools', '销售优惠券池', salesCouponPoolsState.filter((item) => item.ownerId === fromSales.id || item.ownerName === fromSales.name).map((item) => item.name)));
  }

  if (fromStaff.roleCode === 'R1.3') {
    affected.push(previewGroup('account_managed_tenants', '客户运维归属', tenantsState.filter((item) => item.accountManagerId === fromStaff.id || item.accountManager === fromStaff.name).map((item) => item.name)));
  }

  if (isDeliveryRole(fromStaff.roleCode)) {
    affected.push(previewGroup('opening_tasks', '开通工单办理人', openingTasksState.filter((item) => item.deliveryOwner === fromStaff.name).map((item) => item.id)));
    affected.push(previewGroup('bank_transfer_reviews', '对公凭证核对人', bankTransferReviewsState.filter((item) => item.deliveryOwner === fromStaff.name).map((item) => item.orderId)));
  }

  if (fromStaff.roleCode === 'R1.2') {
    affected.push(previewGroup('bank_transfer_finance_reviews', '对公转账财务审核', bankTransferReviewsState.filter((item) => item.financeOwner === fromStaff.name && item.reviewStatus === 'pending_finance_review').map((item) => item.orderId)));
    affected.push(previewGroup('commission_finance_reviews', '佣金待财务核准', commissionTransactionsState.filter((item) => item.financeOwner === fromStaff.name && item.status === 'pending').map((item) => item.id)));
    affected.push(previewGroup('commission_payout_batches', '佣金批次待发放', commissionBatchesState.filter((item) => item.financeOwner === fromStaff.name && ['pending_review', 'exported'].includes(item.status)).map((item) => item.batchNo)));
    affected.push(previewGroup('commission_withdraws', '佣金提现待打款', commissionWithdrawsState.filter((item) => item.financeOwner === fromStaff.name && item.status === 'withdrawing').map((item) => item.id)));
  }

  return {
    roleCode: fromStaff.roleCode,
    fromStaffId: fromStaff.id,
    fromName: fromStaff.name,
    successorStaffId: successor?.id,
    successorName: successor?.name,
    affected,
  };
};

const buildAdminStaffInheritancePreview = (
  accountId: string,
  assignments: AdminStaffInheritanceRoleAssignment[],
): AdminStaffInheritancePreview => {
  const bindings = getStaffAccountBindings(accountId).filter((binding) => isStaffInheritanceRole(binding.roleCode));
  const assignmentByRole = new Map(assignments.map((item) => [item.roleCode, item]));
  return {
    accountId,
    employeeName: bindings[0]?.name ?? '-',
    items: bindings.map((binding) => buildInheritancePreviewItem(binding, assignmentByRole.get(binding.roleCode))),
  };
};

const applyAdminStaffInheritance = (payload: AdminStaffInheritancePayload) => {
  const bindings = getStaffAccountBindings(payload.accountId);
  const assignmentByRole = new Map(payload.assignments.map((item) => [item.roleCode, item]));
  bindings.forEach((binding) => {
    const successor = getStaffById(assignmentByRole.get(binding.roleCode)?.successorStaffId);
    if (!successor) return;

    if (binding.roleCode === 'R3') {
      const fromSales = getSalesByStaff(binding);
      const toSales = getSalesByStaff(successor);
      if (fromSales && toSales) {
        tenantsState = tenantsState.map((tenant) =>
          tenant.ownerSalesId === fromSales.id || tenant.ownerSales === fromSales.name ? { ...tenant, ownerSalesId: toSales.id, ownerSales: toSales.name } : tenant,
        );
        ordersState = ordersState.map((order) => (order.ownerSales === fromSales.name ? { ...order, ownerSales: toSales.name } : order));
        openingTasksState = openingTasksState.map((task) => (task.ownerSales === fromSales.name ? { ...task, ownerSales: toSales.name } : task));
        leadsState = leadsState.map((lead) => (lead.assignedSales === fromSales.name ? { ...lead, assignedSales: toSales.name, assignedAt: now().format('YYYY-MM-DD HH:mm') } : lead));
        salesCouponPoolsState = salesCouponPoolsState.map((pool) =>
          pool.ownerId === fromSales.id || pool.ownerName === fromSales.name ? { ...pool, ownerId: toSales.id, ownerName: toSales.name } : pool,
        );
        salesState = salesState.map((item) => (item.id === fromSales.id ? { ...item, status: 'left' } : item));
      }
    }

    if (binding.roleCode === 'R1.3') {
      tenantsState = tenantsState.map((tenant) =>
        tenant.accountManagerId === binding.id || tenant.accountManager === binding.name ? { ...tenant, accountManagerId: successor.id, accountManager: successor.name } : tenant,
      );
    }

    if (isDeliveryRole(binding.roleCode)) {
      openingTasksState = openingTasksState.map((task) => (task.deliveryOwner === binding.name ? { ...task, deliveryOwner: successor.name } : task));
      bankTransferReviewsState = bankTransferReviewsState.map((review) => (review.deliveryOwner === binding.name ? { ...review, deliveryOwner: successor.name } : review));
    }

    if (binding.roleCode === 'R1.2') {
      bankTransferReviewsState = bankTransferReviewsState.map((review) =>
        review.financeOwner === binding.name && review.reviewStatus === 'pending_finance_review' ? { ...review, financeOwner: successor.name } : review,
      );
      commissionTransactionsState = commissionTransactionsState.map((item) =>
        item.financeOwner === binding.name && item.status === 'pending' ? { ...item, financeOwner: successor.name } : item,
      );
      commissionBatchesState = commissionBatchesState.map((item) =>
        item.financeOwner === binding.name && ['pending_review', 'exported'].includes(item.status) ? { ...item, financeOwner: successor.name } : item,
      );
      commissionWithdrawsState = commissionWithdrawsState.map((item) =>
        item.financeOwner === binding.name && item.status === 'withdrawing' ? { ...item, financeOwner: successor.name } : item,
      );
    }
  });

  staffState = staffState.map((item) => (bindings.some((binding) => binding.id === item.id) ? { ...item, status: 'left' } : item));
  syncSalesDerivedData();
  const preview = buildAdminStaffInheritancePreview(payload.accountId, payload.assignments);
  recordAudit({
    actor: '林涛',
    role: 'R1.0',
    action: '内部员工离职继承',
    targetType: 'staff_account',
    targetId: payload.accountId,
    result: 'success',
    reason: preview.items.map((item) => `${item.fromName}/${item.roleCode} -> ${item.successorName ?? '-'}`).join('；'),
  });
  return preview;
};

const syncSalesDerivedData = () => {
  salesState = salesState.map((sales) => ({
    ...sales,
    customers: tenantsState.filter((tenant) => tenant.ownerSales === sales.name),
    commissions: commissionTransactionsState
      .filter((item) => item.salesName === sales.name)
      .map((item) => ({
        id: item.id,
        orderId: item.orderId,
        tenantName: item.tenantName,
        amount: item.orderAmount,
        commission: item.commissionAmount,
        status: item.status,
        createdAt: item.generatedAt,
      })),
  }));
};

const syncOrderCommissionStatus = (commission: AdminCommissionTransaction) => {
  ordersState = ordersState.map((order) =>
    order.id === commission.orderId ? { ...order, commissionId: commission.id, commissionStatus: commission.status } : order,
  );
};

const buildNextAgentRemarkCode = () => `AGT-${now().format('YYYYMM')}-${String(agentTopupOrdersState.length + 816).padStart(4, '0')}`;

const decorateAgentBalanceSummary = (summary: AgentBalanceSummary): AgentBalanceSummary => {
  let alertLevel: AgentBalanceSummary['alertLevel'] = 'normal';
  let alertText = '钱包余额充足，可用于代理向平台支付协议价。';
  if (summary.currentBalance === 0) {
    alertLevel = 'blocked';
    alertText = '当前钱包余额为 0，如需余额支付平台代理采购请先充值。';
  } else if (summary.currentBalance < 5000) {
    alertLevel = 'danger';
    alertText = '当前钱包余额低于 5,000 元，建议优先使用微信或对公支付采购订单。';
  } else if (summary.currentBalance < summary.warningThreshold) {
    alertLevel = 'warning';
    alertText = `当前钱包余额低于预警阈值 ${money(summary.warningThreshold)}，可按需充值。`;
  }
  return {
    ...summary,
    alertLevel,
    alertText,
  };
};

const getAgentBalanceSummary = () => decorateAgentBalanceSummary(clone(agentBalanceState));

const filterAgentBalanceLedger = (query?: AgentBalanceLedgerQuery) =>
  agentBalanceLedgerState
    .filter((item) => {
      if (query?.types?.length && !query.types.includes(item.type)) return false;
      if (query?.dateFrom && dayjs(item.createdAt).isBefore(dayjs(query.dateFrom), 'day')) return false;
      if (query?.dateTo && dayjs(item.createdAt).isAfter(dayjs(query.dateTo), 'day')) return false;
      const absoluteAmount = Math.abs(item.amount);
      if (typeof query?.minAmount === 'number' && absoluteAmount < query.minAmount) return false;
      if (typeof query?.maxAmount === 'number' && absoluteAmount > query.maxAmount) return false;
      return true;
    })
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());

const buildAgentBalanceDashboard = (rootPath = '/agent/admin'): AgentBalanceDashboardSummary => {
  const account = getAgentBalanceSummary();
  const pendingOpeningCount = agentProcurementOrdersState.filter((item) =>
    ['pending_procurement', 'pending_finance_review', 'delivery_processing'].includes(item.status),
  ).length;
  const pendingFinanceReviewCount = agentProcurementOrdersState.filter((item) => item.status === 'pending_finance_review').length;
  const deliveryProcurementCount = agentProcurementOrdersState.filter((item) => item.status === 'delivery_processing').length;
  const recruitingSalesCount = salesState.filter((item) => item.status !== 'left' && dayjs(item.hiredAt).isSame(now(), 'month')).length || 2;
  const lowBalanceCount = account.currentBalance < account.warningThreshold ? 1 : 0;

  const confirmedExternalOrders = ordersState.filter((item) =>
    isConfirmedRevenueOrder(item) && isExternalAgentRule(commissionRuleTypeBySales(item.ownerSales)),
  );
  const confirmedExternalOrdersThisMonth = confirmedExternalOrders.filter((item) => dayjs(item.paidAt ?? item.createdAt).isSame(now(), 'month'));
  const totalSalesCount = salesState.filter((item) => item.status !== 'left').length;
  const newSalesThisMonth = salesState.filter((item) => item.status !== 'left' && dayjs(item.hiredAt).isSame(now(), 'month')).length;
  const totalCustomerCount = tenantsState.filter((item) => salesState.some((sales) => sales.name === item.ownerSales)).length;
  const confirmedExternalSeats = confirmedExternalOrders.reduce((sum, item) => sum + getOrderSeatCount(item), 0);
  const confirmedExternalSeatsThisMonth = confirmedExternalOrdersThisMonth.reduce((sum, item) => sum + getOrderSeatCount(item), 0);
  const totalProcurementAmount = agentProcurementOrdersState.reduce((sum, item) => sum + item.protocolAmount, 0);

  const monthDeductAmount = agentProcurementOrdersState
    .filter((item) => dayjs(item.createdAt).isSame(now(), 'month'))
    .reduce((sum, item) => sum + item.protocolAmount, 0);
  const lastMonthDeductAmount = 46200;

  const monthNewCustomers = tenantsState.filter((item) =>
    dayjs(item.createdAt).isSame(now(), 'month') && salesState.some((sales) => sales.name === item.ownerSales && sales.status !== 'left'),
  ).length;
  const lastMonthNewCustomers = 3;

  const buildCompare = (current: number, previous: number, formatter: (value: number) => string) => {
    const delta = current - previous;
    return {
      compareText: delta === 0
        ? '较上月持平'
        : `较上月${delta > 0 ? '增加' : '减少'} ${formatter(Math.abs(delta))}`,
      compareDirection: delta > 0 ? 'up' as const : delta < 0 ? 'down' as const : 'flat' as const,
    };
  };

  const deductCompare = buildCompare(monthDeductAmount, lastMonthDeductAmount, money);
  const newCustomersCompare = buildCompare(monthNewCustomers, lastMonthNewCustomers, (value) => `${value} 家`);

  return {
    todoCards: [
      {
        id: 'low-balance',
        label: '钱包预警',
        count: lowBalanceCount,
        description: lowBalanceCount
          ? `当前钱包余额 ${money(account.currentBalance)}，低于预警值 ${money(account.warningThreshold)}`
          : `当前钱包余额 ${money(account.currentBalance)}，高于预警值`,
        route: `${rootPath}/balance`,
        tone: account.alertLevel === 'danger' || account.alertLevel === 'blocked' ? 'danger' : 'warning',
      },
      {
        id: 'opening',
        label: '待平台代理采购',
        count: pendingOpeningCount,
        description: pendingOpeningCount ? `${pendingOpeningCount} 笔订单等待采购/审核/交付` : '暂无待采购订单',
        route: `${rootPath}/orders`,
        tone: 'blue',
      },
      {
        id: 'finance-review',
        label: '待财务审核',
        count: pendingFinanceReviewCount,
        description: pendingFinanceReviewCount ? `${pendingFinanceReviewCount} 笔平台代理采购凭证待审核` : '暂无待审核采购凭证',
        route: `${rootPath}/balance`,
        tone: 'orange',
      },
      {
        id: 'sales',
        label: '销售招募中',
        count: recruitingSalesCount,
        description: `本月新增 ${recruitingSalesCount} 位销售，可继续扩充团队`,
        route: `${rootPath}/sales`,
        tone: 'blue',
      },
    ],
    businessMetrics: [
      {
        id: 'customer-count',
        label: '客户总数',
        value: String(totalCustomerCount),
        compareText: `本月新增 ${monthNewCustomers || 5} 家`,
        compareDirection: 'up',
        helpText: '当前归属到代理名下、由销售团队持续跟进的全部客户数量。',
      },
      {
        id: 'sales-count',
        label: '销售人数',
        value: String(totalSalesCount),
        compareText: `本月新增 ${newSalesThisMonth || 2} 位`,
        compareDirection: 'up',
        helpText: '当前代理体系下有效销售账号数量，离职账号不计入。',
      },
      {
        id: 'total-seats',
        label: '累计开通席位',
        value: String(confirmedExternalSeats || 186),
        compareText: `本月新增 ${confirmedExternalSeatsThisMonth || 24} 席`,
        compareDirection: 'up',
        helpText: '代理名下已完成交付开通的席位总数。',
      },
      {
        id: 'total-procurement',
        label: '平台采购总额',
        value: money(totalProcurementAmount || account.deductedAmount),
        compareText: `本月 ${money(monthDeductAmount || 32800)}`,
        compareDirection: 'up',
        helpText: '代理按协议价向平台采购订单的累计金额。',
      },
      {
        id: 'month-procurement',
        label: '本月平台采购额',
        value: money(monthDeductAmount || 32800),
        compareText: deductCompare.compareText,
        compareDirection: deductCompare.compareDirection,
        helpText: '统计代理按协议价向平台采购客户订单的金额。',
      },
      {
        id: 'pending-finance-review',
        label: '待财务审核',
        value: `${pendingFinanceReviewCount} 笔`,
        compareText: '支付凭证审核后进入交付',
        compareDirection: pendingFinanceReviewCount > 0 ? 'up' : 'flat',
        helpText: '统计代理已上传平台代理采购支付凭证、等待平台财务审核的订单。',
      },
      {
        id: 'delivery-procurement',
        label: '待交付采购',
        value: `${deliveryProcurementCount} 笔`,
        compareText: '财务确认后分配交付',
        compareDirection: deliveryProcurementCount > 0 ? 'up' : 'flat',
        helpText: '统计已完成平台代理采购付款、等待或正在交付开通的订单。',
      },
      {
        id: 'month-customers',
        label: '本月新增客户',
        value: `${monthNewCustomers || 5} 家`,
        compareText: newCustomersCompare.compareText,
        compareDirection: newCustomersCompare.compareDirection,
        helpText: '统计本月新增签约并进入代理名下的客户数。',
      },
    ],
    account,
  };
};

export const getSalesCommissionsFromAdminMock = (salesName: string) =>
  commissionTransactionsState
    .filter((item) => item.salesName === salesName)
    .map(buildSalesCommissionRecord)
    .sort((left, right) => dayjs(right.generatedAt).valueOf() - dayjs(left.generatedAt).valueOf());

export const getSalesCustomerCommissionsFromAdminMock = (tenantId: string, salesName: string) =>
  getSalesCommissionsFromAdminMock(salesName).filter((item) => item.tenantId === tenantId);

export const confirmSalesCommissionFromAdminMock = (id: string, salesName: string) => {
  const time = now().format('YYYY-MM-DD HH:mm');
  let updatedTransaction: AdminCommissionTransaction | undefined;
  commissionTransactionsState = commissionTransactionsState.map((item) => {
    if (item.id !== id || item.salesName !== salesName || item.status !== 'pending_sales_confirm') {
      return item;
    }
    updatedTransaction = {
      ...item,
      status: 'confirmed',
      confirmedAt: time,
      sourceType: 'sales_confirmed',
      sourceText: item.batchId ? '代理已确认，待批次生成打款单' : '代理已确认，可生成打款单',
    };
    return updatedTransaction;
  });
  if (!updatedTransaction) {
    return delay(undefined);
  }
  syncOrderCommissionStatus(updatedTransaction);
  syncSalesDerivedData();
  notifyFinanceCommissionConfirmed(updatedTransaction);
  return delay(clone(buildSalesCommissionRecord(updatedTransaction)));
};

export const requestSalesCommissionWithdrawFromAdminMock = (salesName: string, ids?: string[]) => {
  const time = now().format('YYYY-MM-DD HH:mm');
  const targetTransactions = commissionTransactionsState.filter((item) =>
    item.salesName === salesName && item.status === 'withdrawable' && (!ids?.length || ids.includes(item.id)),
  );
  if (!targetTransactions.length) {
    return delay({ updatedCount: 0, amount: 0 });
  }
  const withdrawRecord: AdminCommissionWithdrawRecord = {
    id: `WD-${now().format('YYYYMMDD')}-${String(commissionWithdrawsState.length + 1).padStart(3, '0')}`,
    salesName,
    transactionIds: targetTransactions.map((item) => item.id),
    orderCount: targetTransactions.length,
    totalAmount: targetTransactions.reduce((sum, item) => sum + item.commissionAmount, 0),
    status: 'withdrawing',
    requestedAt: time,
    payoutGeneratedAt: time,
    payoutAccount: platformCommissionPayoutAccount,
    recipientAccount: getSalesCommissionRecipientAccount(salesName),
  };
  const updatedTransactions: AdminCommissionTransaction[] = [];
  commissionTransactionsState = commissionTransactionsState.map((item) => {
    const target = withdrawRecord.transactionIds.includes(item.id);
    if (!target) return item;
    const updatedItem: AdminCommissionTransaction = {
      ...item,
      status: 'withdrawing',
      sourceType: 'batch_paid',
      sourceText: `销售已发起提现，提现流水 ${withdrawRecord.id} 等待后台确认打款`,
      confirmedAt: item.confirmedAt ?? time,
      batchId: withdrawRecord.id,
      batchNo: withdrawRecord.id,
    };
    updatedTransactions.push(updatedItem);
    return updatedItem;
  });
  commissionWithdrawsState = [withdrawRecord, ...commissionWithdrawsState];
  updatedTransactions.forEach(syncOrderCommissionStatus);
  syncSalesDerivedData();
  return delay({
    updatedCount: updatedTransactions.length,
    amount: withdrawRecord.totalAmount,
    withdrawId: withdrawRecord.id,
  });
};

export const completeSalesCommissionWithdrawFromAdminMock = (ids: string[], payload?: { bankTransferNo?: string; bankReceiptFileName?: string }) => {
  const time = now().format('YYYY-MM-DD HH:mm');
  const updatedTransactions: AdminCommissionTransaction[] = [];
  commissionTransactionsState = commissionTransactionsState.map((item) => {
    if (!ids.includes(item.id) || item.status !== 'withdrawing') return item;
    const updatedItem: AdminCommissionTransaction = {
      ...item,
      status: 'withdrawn',
      sourceType: 'batch_paid',
      sourceText: '提现打款已完成',
      paidAt: time,
      bankTransferNo: payload?.bankTransferNo,
      bankReceiptFileName: payload?.bankReceiptFileName,
    };
    updatedTransactions.push(updatedItem);
    return updatedItem;
  });
  updatedTransactions.forEach(syncOrderCommissionStatus);
  syncSalesDerivedData();
  return delay({ updatedCount: updatedTransactions.length, bankReceiptFileName: payload?.bankReceiptFileName });
};

const buildDashboard = (): AdminDashboardSummary => {
  const pendingBankTransfers = bankTransferReviewsState.filter((item) =>
    ['pending_delivery_review', 'pending_finance_review'].includes(item.reviewStatus),
  );
  const pendingOpeningTasks = openingTasksState.filter((item) =>
    ['pending_assign', 'pending_handle', 'purchasing', 'waiting_confirm'].includes(item.status),
  );
  const pendingCommissions = commissionTransactionsState.filter((item) => item.status === 'pending');
  const confirmedOrders = ordersState.filter(isConfirmedRevenueOrder);
  const confirmedOrdersThisMonth = confirmedOrders.filter((item) => dayjs(item.paidAt ?? item.createdAt).isSame(now(), 'month'));
  const isExternalAgentOrder = (order: AdminOrderDetail) => isExternalAgentRule(commissionRuleTypeBySales(order.ownerSales));
  const tenantFirstRevenueAt = confirmedOrders.reduce<Record<string, number>>((acc, item) => {
    const paidAt = dayjs(item.paidAt ?? item.createdAt).valueOf();
    acc[item.tenantId] = Math.min(acc[item.tenantId] ?? paidAt, paidAt);
    return acc;
  }, {});
  const isNewRevenueOrder = (order: AdminOrderDetail) => dayjs(order.paidAt ?? order.createdAt).valueOf() === tenantFirstRevenueAt[order.tenantId];
  const mockDirectRevenue = 46800;
  const mockDirectRevenueThisMonth = 26000;
  const mockRevenueLastMonth = 128000;
  const bankTransferAmount = pendingBankTransfers.reduce((sum, item) => sum + item.amount, 0);
  const pendingCommissionAmount = pendingCommissions.reduce((sum, item) => sum + item.commissionAmount, 0);
  const monthCommissionAmount = commissionTransactionsState
    .filter((item) => dayjs(item.generatedAt).isSame(now(), 'month'))
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  const mockCommissionLastMonth = 13800;
  const monthCommissionDelta = monthCommissionAmount - mockCommissionLastMonth;
  const monthCommissionCompareText = monthCommissionDelta === 0
    ? '较上月持平'
    : `较上月${monthCommissionDelta > 0 ? '增加' : '减少'} ${money(Math.abs(monthCommissionDelta))}`;
  const monthCommissionCompareDirection: AdminDashboardSummary['businessMetrics'][number]['compareDirection'] = monthCommissionDelta > 0 ? 'up' : monthCommissionDelta < 0 ? 'down' : 'flat';
  const confirmedRevenue = confirmedOrders.reduce((sum, item) => sum + item.amount, 0);
  const confirmedRevenueThisMonth = confirmedOrdersThisMonth.reduce((sum, item) => sum + item.amount, 0);
  const externalAgentRevenue = confirmedOrders.filter(isExternalAgentOrder).reduce((sum, item) => sum + item.amount, 0);
  const externalAgentRevenueThisMonth = confirmedOrdersThisMonth.filter(isExternalAgentOrder).reduce((sum, item) => sum + item.amount, 0);
  const directRevenue = confirmedOrders.filter((item) => !isExternalAgentOrder(item)).reduce((sum, item) => sum + item.amount, 0) + mockDirectRevenue;
  const directRevenueThisMonth = confirmedOrdersThisMonth.filter((item) => !isExternalAgentOrder(item)).reduce((sum, item) => sum + item.amount, 0) + mockDirectRevenueThisMonth;
  const totalRevenue = confirmedRevenue + mockDirectRevenue;
  const monthRevenue = confirmedRevenueThisMonth + mockDirectRevenueThisMonth;
  const monthRevenueDelta = monthRevenue - mockRevenueLastMonth;
  const monthRevenueCompareText = monthRevenueDelta === 0
    ? '较上月持平'
    : `较上月${monthRevenueDelta > 0 ? '增加' : '减少'} ${money(Math.abs(monthRevenueDelta))}`;
  const monthRevenueCompareDirection: AdminDashboardSummary['businessMetrics'][number]['compareDirection'] = monthRevenueDelta > 0 ? 'up' : monthRevenueDelta < 0 ? 'down' : 'flat';
  const totalSeats = confirmedOrders.reduce((sum, item) => sum + getOrderSeatCount(item), 0);
  const monthSeats = confirmedOrdersThisMonth.reduce((sum, item) => sum + getOrderSeatCount(item), 0);
  const agentCount = salesState.filter((item) => item.status !== 'left' && isExternalAgentRule(commissionRuleTypeBySales(item.name))).length;
  const newAgentsThisMonth = salesState.filter((item) => item.status !== 'left' && isExternalAgentRule(commissionRuleTypeBySales(item.name)) && dayjs(item.hiredAt).isSame(now(), 'month')).length;
  const newTenantsThisMonth = tenantsState.filter((item) => dayjs(item.createdAt).isSame(now(), 'month')).length;
  const revenueTrend = Array.from({ length: 30 }).map((_, index) => {
    const date = now().subtract(29 - index, 'day');
    const orders = confirmedOrders.filter((item) => dayjs(item.paidAt ?? item.createdAt).isSame(date, 'day'));
    const mockAgentRevenue = 6800 + index * 260 + (index % 5) * 1800;
    const mockDirectRevenue = 4200 + index * 180 + (index % 4) * 1300;
    const actualAgentRevenue = orders.filter(isExternalAgentOrder).reduce((sum, item) => sum + item.amount, 0);
    const actualDirectRevenue = orders.filter((item) => !isExternalAgentOrder(item)).reduce((sum, item) => sum + item.amount, 0);
    const agentRevenueForDay = mockAgentRevenue + actualAgentRevenue;
    const directRevenueForDay = mockDirectRevenue + actualDirectRevenue;
    return {
      date: date.format('MM-DD'),
      agentRevenue: agentRevenueForDay,
      directRevenue: directRevenueForDay,
      newRevenue: Math.round((agentRevenueForDay + directRevenueForDay) * (index % 3 === 0 ? 0.64 : 0.48)),
      renewalRevenue: Math.round((agentRevenueForDay + directRevenueForDay) * (index % 3 === 0 ? 0.36 : 0.52)),
      seats: orders.reduce((sum, item) => sum + getOrderSeatCount(item), 0) || 6 + (index % 6) * 3,
      orders: orders.length || 2 + (index % 4),
    };
  });
  const tenantRevenueMap = confirmedOrders.reduce<Record<string, { gmv: number; seats: number }>>((acc, item) => {
    const current = acc[item.tenantId] ?? { gmv: 0, seats: 0 };
    acc[item.tenantId] = {
      gmv: current.gmv + item.amount,
      seats: current.seats + getOrderSeatCount(item),
    };
    return acc;
  }, {});
  const salesRevenueMap = confirmedOrders.reduce<Record<string, { gmv: number; newCustomers: Set<string> }>>((acc, item) => {
    const current = acc[item.ownerSales] ?? { gmv: 0, newCustomers: new Set<string>() };
    current.gmv += item.amount;
    if (dayjs(item.paidAt ?? item.createdAt).isSame(now(), 'month')) {
      current.newCustomers.add(item.tenantId);
    }
    acc[item.ownerSales] = current;
    return acc;
  }, {});

  return {
    banners: [
      ...(pendingOpeningTasks.length > 0
        ? [{ id: 'banner-001', level: 'warning' as const, text: `${pendingOpeningTasks.length} 个开通任务待跟进，请优先处理。`, route: '/admin/orders/opening-tasks' }]
        : []),
      ...(pendingBankTransfers.some((item) => item.daysSinceUpload >= 2)
        ? [{ id: 'banner-002', level: 'error' as const, text: `${pendingBankTransfers.filter((item) => item.daysSinceUpload >= 2).length} 笔对公转账超过 48 小时仍未审核。`, route: '/admin/orders/bank-transfer-review' }]
        : []),
    ],
    todoCards: [
      {
        id: 'bank-transfer-review',
        label: '待审对公',
        count: pendingBankTransfers.length,
        amount: bankTransferAmount,
        amountLabel: money(bankTransferAmount),
        route: '/admin/orders/bank-transfer-review',
        ctaLabel: '去审核',
        tone: 'danger',
        urgent: pendingBankTransfers.length >= 5,
      },
      {
        id: 'opening-tasks',
        label: '待开通任务',
        count: pendingOpeningTasks.length,
        amountLabel: '-',
        route: '/admin/orders/opening-tasks',
        ctaLabel: '去处理',
        tone: 'warning',
        urgent: false,
      },
      {
        id: 'commission-pending',
        label: '佣金待确认',
        count: pendingCommissions.length,
        amount: pendingCommissionAmount,
        amountLabel: money(pendingCommissionAmount),
        route: '/admin/commission/transactions',
        ctaLabel: '去核准',
        tone: 'blue',
        urgent: pendingCommissions.length >= 50,
      },
    ],
    businessMetrics: [
      { id: 'total-tenants', label: '企业总数', value: String(tenantsState.length), compareText: `本月新增 ${newTenantsThisMonth}`, compareDirection: 'up', helpText: '平台注册并进入企业管理的全部企业数，包含免费注册、代理代录和后台补录企业。' },
      { id: 'agent-count', label: '代理人数', value: String(agentCount), compareText: `本月新增 ${newAgentsThisMonth}`, compareDirection: 'flat', helpText: '当前有效外部代理账号数，仅统计 S/A/B/C 四种代理，离职账号不计入。' },
      { id: 'total-seats', label: '坐席总数', value: String(totalSeats), compareText: `本月新增 ${monthSeats}`, compareDirection: 'up', helpText: '已确认收入订单中的席位总数；待审、未开通或退款订单不计入。' },
      { id: 'total-revenue', label: '本年度成交额', value: money(totalRevenue), compareText: `本月 ${money(monthRevenue)}`, compareDirection: 'up', helpText: '本年度所有确认收入订单金额合计。席位类订单需交付确认开通后才计入。' },
      { id: 'month-revenue', label: '本月成交额', value: money(monthRevenue), compareText: monthRevenueCompareText, compareDirection: monthRevenueCompareDirection, helpText: '本月确认收入订单金额合计，不包含仅下单、上传凭证或仍在开通中的订单。' },
      { id: 'agent-revenue', label: '本月外部代理成交额', value: money(externalAgentRevenueThisMonth), compareText: `占比 ${monthRevenue ? Math.round((externalAgentRevenueThisMonth / monthRevenue) * 100) : 0}%`, compareDirection: 'up', helpText: 'S/A/B/C 四种外部代理归属订单的本月确认收入汇总。' },
      { id: 'direct-revenue', label: '本月自销成交额', value: money(directRevenueThisMonth), compareText: `占比 ${monthRevenue ? Math.round((directRevenueThisMonth / monthRevenue) * 100) : 0}%`, compareDirection: 'flat', helpText: '内部销售本月产生的确认收入金额，不包含 S/A/B/C 外部代理订单。' },
      { id: 'month-commission', label: '本月佣金金额', value: money(monthCommissionAmount), compareText: monthCommissionCompareText, compareDirection: monthCommissionCompareDirection, helpText: '本月系统按佣金规则生成的佣金金额汇总；环比上月展示佣金金额增加或减少。' },
    ],
    revenueTrend,
    topTenants: tenantsState
      .map((item) => ({
        id: item.id,
        name: item.name,
        token: item.monthToken,
        gmv: tenantRevenueMap[item.id]?.gmv ?? 0,
        seats: tenantRevenueMap[item.id]?.seats ?? item.plans.reduce((sum, plan) => sum + plan.purchasedSeats, 0),
        status: item.status,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5),
    topExternalAgents: mockExternalAgentRows
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5),
    topDirectSales: mockDirectSalesRows
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5),
  };
};

const getTenantById = (id: string) => {
  const tenant = tenantsState.find((item) => item.id === id);
  if (!tenant) {
    throw new Error('未找到企业');
  }
  return tenant;
};

const getSalesById = (id: string) => {
  const sales = salesState.find((item) => item.id === id);
  if (!sales) {
    throw new Error('未找到销售');
  }
  return sales;
};

const getAgentTenantById = (id: string) => {
  const agentTenant = agentTenantsState.find((item) => item.id === id);
  if (!agentTenant) {
    throw new Error('未找到代理租户');
  }
  return agentTenant;
};

const isSeatOpeningOrder = (order: Pick<AdminOrderDetail, 'orderType'>) =>
  order.orderType.includes('席位') || order.orderType.includes('套餐') || order.orderType.includes('试点包');

const isConfirmedRevenueOrder = (order: AdminOrderDetail) => {
  if (order.status !== 'paid') return false;
  if (isSeatOpeningOrder(order)) {
    return openingTasksState.some((task) => task.orderId === order.id && task.status === 'completed');
  }
  return order.volcSyncStatus === 'success';
};

const getBillingTypeFromOrder = (orderType: string): BillingOrder['type'] => {
  return 'seat_sub';
};

const getBillingStatusFromOrder = (status: AdminOrderDetail['status']): BillingOrder['status'] =>
  status;

const resolveTenantOnboardingStatus = (tenantId: string): AdminTenantOnboardingStatus => {
  const tenant = tenantsState.find((item) => item.id === tenantId);
  const openingOrders = ordersState
    .filter((item) => item.tenantId === tenantId && isSeatOpeningOrder(item))
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());
  const latestOrder = openingOrders[0];
  const latestTask = openingTasksState
    .filter((item) => item.tenantId === tenantId)
    .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf())[0];

  if (!latestOrder) {
    if (latestTask) {
      return latestTask.status === 'cancelled' ? 'failed' : latestTask.status;
    }
    if (tenant && (tenant.status === 'active' || tenant.activeEmployees > 0 || tenant.plans.some((plan) => plan.purchasedSeats > 0))) {
      return 'completed';
    }
    return 'pending_order';
  }

  const latestReview = bankTransferReviewsState.find((item) => item.orderId === latestOrder.id);
  if (latestReview?.reviewStatus === 'pending_delivery_review') return 'pending_delivery_review';
  if (latestReview?.reviewStatus === 'pending_finance_review' || latestOrder.status === 'pending_review') return 'pending_finance_review';
  if (latestReview?.reviewStatus === 'rejected') return 'failed';
  if (latestOrder.status === 'pending') return 'pending_payment';
  if (latestOrder.status === 'refunded' || latestOrder.status === 'cancelled') return 'failed';

  const task = openingTasksState.find((item) => item.orderId === latestOrder.id) ?? latestTask;

  if (!task) return 'pending_assign';
  if (task.status === 'cancelled') return 'failed';
  return task.status;
};

const tenantSeatSummaryLevels: Array<AdminTenantDetail['plans'][number]['level']> = ['lite', 'standard', 'pro', 'ultimate'];
const tenantSeatSummaryLabels: Record<AdminTenantDetail['plans'][number]['level'], string> = {
  lite: '轻',
  standard: '标',
  pro: '高',
  ultimate: '旗',
};

const buildTenantSeatSummary = (plans: AdminTenantDetail['plans']) => {
  const counters: Record<AdminTenantDetail['plans'][number]['level'], number> = {
    lite: 0,
    standard: 0,
    pro: 0,
    ultimate: 0,
  };

  plans.forEach((plan) => {
    counters[plan.level] += plan.purchasedSeats;
  });

  return tenantSeatSummaryLevels.map((level) => `${tenantSeatSummaryLabels[level]}${counters[level]}`).join(' / ');
};

const decorateTenant = (tenant: AdminTenantDetail): AdminTenantDetail => ({
  ...tenant,
  onboardingStatus: resolveTenantOnboardingStatus(tenant.id),
  seatSummary: buildTenantSeatSummary(tenant.plans),
  admins: tenant.admins.slice(0, 1),
});

const isCouponUsable = (coupon: CouponRecord) =>
  coupon.status === 'active' &&
  (!isVoucherCoupon(coupon) || coupon.remainingDiscountQuota > 0) &&
  !now().isBefore(dayjs(coupon.effectiveAt), 'day') &&
  !now().isAfter(dayjs(coupon.expiresAt), 'day');

const getCouponThresholdAmount = (coupon: CouponRecord) => {
  const matched = coupon.thresholdRule?.match(/满\s*¥?\s*([\d,]+(?:\.\d+)?)/);
  return matched ? Number(matched[1].replace(/,/g, '')) : 0;
};

const getCouponScopeLabel = (scope: CouponDiscountScope = 'order') => {
  if (scope === 'seat') return '席位';
  if (scope === 'coding_plan') return 'CodingPlan';
  return '整单';
};

const getEligibleAmountByScope = (
  originalAmount: number,
  discountScope: CouponDiscountScope = 'order',
  bundleLines?: OrderBundleLine[],
) => {
  if (discountScope === 'order' || !bundleLines?.length) return originalAmount;
  return bundleLines
    .filter((line) => line.productType === discountScope)
    .reduce((sum, line) => sum + line.amount, 0);
};

const isCouponThresholdMet = (coupon: CouponRecord, eligibleAmount: number) =>
  eligibleAmount >= getCouponThresholdAmount(coupon);

const calculateCouponDiscount = (coupon: CouponRecord, originalAmount: number, bundleLines?: OrderBundleLine[]) => {
  const eligibleAmount = getEligibleAmountByScope(originalAmount, coupon.discountScope, bundleLines);
  if (!eligibleAmount || !isCouponThresholdMet(coupon, eligibleAmount)) return 0;
  const discountRatio = Math.max(0, Math.min(100, 100 - coupon.discountRate)) / 100;
  const theoreticalDiscount = Math.round(eligibleAmount * discountRatio);
  return isDiscountCoupon(coupon)
    ? Math.min(theoreticalDiscount, eligibleAmount)
    : Math.min(theoreticalDiscount, coupon.remainingDiscountQuota, eligibleAmount);
};

const getCouponDiscountForOrder = (coupon: CouponRecord, originalAmount: number, bundleLines?: OrderBundleLine[]) => ({
  coupon,
  eligibleAmount: getEligibleAmountByScope(originalAmount, coupon.discountScope, bundleLines),
  discountAmount: calculateCouponDiscount(coupon, originalAmount, bundleLines),
});

const getBestCouponForOrder = (tenantId: string, originalAmount: number, bundleLines?: OrderBundleLine[]) =>
  couponsState
    .filter((coupon) => coupon.tenantId === tenantId && isCouponUsable(coupon))
    .map((coupon) => getCouponDiscountForOrder(coupon, originalAmount, bundleLines))
    .filter((item) => item.discountAmount > 0)
    .sort((left, right) => right.discountAmount - left.discountAmount)[0];

const getSalesCouponDiscountForOrder = (
  poolId: string,
  tenantId: string,
  originalAmount: number,
  bundleLines?: OrderBundleLine[],
) => {
  const pool = salesCouponPoolsState.find((item) => item.id === poolId);
  const tenant = getTenantById(tenantId);
  if (!pool || !tenant || (pool.benefitType ?? 'coupon') !== 'coupon' || pool.status !== 'active' || pool.remainingQuota <= 0) {
    return undefined;
  }
  const discountScope = pool.discountScope ?? 'order';
  const eligibleAmount = getEligibleAmountByScope(originalAmount, discountScope, bundleLines);
  const discountRatio = Math.max(0, Math.min(100, 100 - pool.discountRate)) / 100;
  const discountAmount = eligibleAmount > 0 ? Math.min(Math.round(eligibleAmount * discountRatio), eligibleAmount) : 0;
  if (discountAmount <= 0) return undefined;
  return {
    pool,
    tenant,
    amount: originalAmount - discountAmount,
    originalAmount,
    eligibleAmount,
    discountScope,
    payableAmount: originalAmount - discountAmount,
    couponId: pool.id,
    couponName: pool.name,
    couponDiscountAmount: discountAmount,
    couponUsageStatus: 'applied' as const,
  };
};

const applyCouponToOrderDraft = (
  tenantId: string,
  originalAmount: number,
  skipCoupon?: boolean,
  couponId?: string,
  bundleLines?: OrderBundleLine[],
) => {
  if (skipCoupon) {
    return {
      amount: originalAmount,
      originalAmount,
      payableAmount: originalAmount,
      couponDiscountAmount: 0,
      couponUsageStatus: 'none' as const,
    };
  }
  const selectedCoupon = couponId
    ? couponsState.find((coupon) =>
      coupon.id === couponId &&
      coupon.tenantId === tenantId &&
      isCouponUsable(coupon))
    : undefined;
  const best = couponId
    ? (selectedCoupon ? getCouponDiscountForOrder(selectedCoupon, originalAmount, bundleLines) : undefined)
    : getBestCouponForOrder(tenantId, originalAmount, bundleLines);
  if (!best) {
    return {
      amount: originalAmount,
      originalAmount,
      payableAmount: originalAmount,
      couponDiscountAmount: 0,
      couponUsageStatus: 'none' as const,
    };
  }
  return {
    amount: originalAmount - best.discountAmount,
    originalAmount,
    eligibleAmount: best.eligibleAmount,
    discountScope: best.coupon.discountScope ?? 'order',
    payableAmount: originalAmount - best.discountAmount,
    couponId: best.coupon.id,
    couponName: best.coupon.name,
    couponDiscountAmount: best.discountAmount,
    couponUsageStatus: 'applied' as const,
  };
};

const confirmCouponUsageForOrder = (order: AdminOrderDetail, usedAt: string) => {
  if (!order.couponId || !order.couponDiscountAmount) return;
  const existingUsage = couponUsagesState.find((item) => item.orderId === order.id && item.couponId === order.couponId);
  if (existingUsage?.status === 'confirmed') return;
  const coupon = couponsState.find((item) => item.id === order.couponId);
  if (!coupon) return;
  const discountAmount = isDiscountCoupon(coupon)
    ? order.couponDiscountAmount
    : Math.min(order.couponDiscountAmount, coupon.remainingDiscountQuota);
  couponsState = couponsState.map((item) => {
    if (item.id !== order.couponId) return item;
    if (isDiscountCoupon(item)) {
      return {
        ...item,
        usedDiscountQuota: discountAmount,
        remainingDiscountQuota: 0,
        status: 'used',
      };
    }
    const nextUsed = item.usedDiscountQuota + discountAmount;
    const nextRemaining = Math.max(item.totalDiscountQuota - nextUsed, 0);
    return {
      ...item,
      usedDiscountQuota: nextUsed,
      remainingDiscountQuota: nextRemaining,
      status: nextRemaining <= 0 ? 'exhausted' : item.status,
    };
  });
  const usage: CouponUsageRecord = {
    id: existingUsage?.id ?? `CPU-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
    couponId: order.couponId,
    orderId: order.id,
    tenantId: order.tenantId,
    originalAmount: order.originalAmount ?? order.amount + discountAmount,
    discountAmount,
    payableAmount: order.amount,
    status: 'confirmed',
    usedAt,
  };
  couponUsagesState = existingUsage
    ? couponUsagesState.map((item) => (item.id === existingUsage.id ? usage : item))
    : [usage, ...couponUsagesState];
};

const toBillingOrder = (order: AdminOrderDetail): BillingOrder => {
  const review = bankTransferReviewsState.find((item) => item.orderId === order.id);
  const openingTask = openingTasksState.find((item) => item.orderId === order.id);
  return {
    id: order.id,
    type: getBillingTypeFromOrder(order.orderType),
    orderType: order.orderType,
    bundleLines: clone(order.bundleLines ?? []),
    amount: order.amount,
    originalAmount: order.originalAmount ?? order.amount,
    couponId: order.couponId,
    couponName: order.couponName,
    couponDiscountAmount: order.couponDiscountAmount ?? 0,
    couponUsageStatus: order.couponUsageStatus ?? 'none',
    paymentMethod: order.paymentMethod,
    status: getBillingStatusFromOrder(order.status),
    createdAt: order.createdAt,
    paymentExpiresAt: orderPaymentExpiresAt(order),
    paymentExpiredAt: order.paymentExpiredAt,
    priceAdjustment: order.priceAdjustment,
    proofName: review?.proofName,
    uploadedAmount: review?.uploadedAmount,
    reviewStatus: review?.reviewStatus,
    reviewReason: review?.reviewReason,
    bankSerialNo: review?.bankSerialNo,
    openingTaskId: openingTask?.id,
    openingStatus: openingTask?.status,
  };
};

export const getTenantBillingOrdersSnapshot = (tenantId = 'tenant-001'): BillingOrder[] =>
  {
    normalizePendingOrderExpirations();
    return ordersState
      .filter((item) => item.tenantId === tenantId)
      .map(toBillingOrder)
      .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());
  };

export const getAdminBillingOrdersSnapshot = (): BillingOrder[] =>
  {
    normalizePendingOrderExpirations();
    return ordersState
      .map(toBillingOrder)
      .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());
  };

export const getTenantOpeningStatusSnapshot = (tenantId = 'tenant-001'): TenantOpeningStatus => {
  const openingOrders = ordersState
    .filter((item) => item.tenantId === tenantId && isSeatOpeningOrder(item))
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());
  const latestOrder = openingOrders[0];

  if (!latestOrder) {
    return {
      code: 'pending_payment',
      text: '待生成对公订单',
      orderId: '-',
      taskId: '-',
      updatedAt: now().format('YYYY-MM-DD HH:mm'),
      description: '客户管理员需要先在账单页生成席位订单，并完成对公付款凭证提交。',
    };
  }

  const task =
    openingTasksState.find((item) => item.orderId === latestOrder.id) ??
    openingTasksState
      .filter((item) => item.tenantId === tenantId)
      .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf())[0];
  const latestReview = bankTransferReviewsState.find((item) => item.orderId === latestOrder.id);

  if (latestReview?.reviewStatus === 'rejected') {
    return {
      code: 'failed',
      text: '付款凭证被驳回',
      orderId: latestOrder.id,
      taskId: '-',
      updatedAt: latestReview.uploadedAt,
      description: latestReview.reviewReason ?? '付款凭证未通过财务终审，请重新提交凭证或联系代理。',
      failureReason: latestReview.reviewReason ?? '付款凭证未通过财务终审，请重新提交凭证或联系代理。',
    };
  }

  if (latestOrder.status === 'pending') {
    return {
      code: 'pending_payment',
      text: '等待对公付款',
      orderId: latestOrder.id,
      taskId: '-',
      updatedAt: latestOrder.createdAt,
      description: '请完成对公汇款，并上传付款凭证。',
    };
  }

  if (latestOrder.status === 'pending_review') {
    return {
      code: 'pending_review',
      text: '对公审核中',
      orderId: latestOrder.id,
      taskId: '-',
      updatedAt: latestOrder.createdAt,
      description: '付款凭证已提交，等待官方后台确认到账；通过后会自动生成开通类交付工单。',
    };
  }

  if (latestOrder.status === 'refunded' || latestOrder.status === 'cancelled') {
    return {
      code: 'failed',
      text: '订单已终止',
      orderId: latestOrder.id,
      taskId: '-',
      updatedAt: latestOrder.paidAt ?? latestOrder.createdAt,
      description: '当前席位订单已取消，无法继续开通。',
    };
  }

  if (!task) {
    return {
      code: 'pending_assign',
      text: '等待生成开通工单',
      orderId: latestOrder.id,
      taskId: '-',
      updatedAt: latestOrder.paidAt ?? latestOrder.createdAt,
      description: '付款已确认，系统正在生成开通类交付工单。',
    };
  }

  const taskStatusMap: Record<AdminOpeningTaskRecord['status'], TenantOpeningStatus> = {
    pending_assign: {
      code: 'pending_assign',
      text: '待分配交付',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '付款已确认，等待交付管理员分配办理人。',
    },
    pending_handle: {
      code: 'pending_handle',
      text: '待交付办理',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '交付人员已接单，待开始在官网为企业办理购买。',
    },
    purchasing: {
      code: 'purchasing',
      text: '交付处理中',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '交付人员正在处理官网代购、企业组合包开通和基础配置。',
    },
    waiting_confirm: {
      code: 'waiting_confirm',
      text: '交付处理中',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '交付人员正在确认企业组合包和基础配置生效。',
    },
    completed: {
      code: 'completed',
      text: '企业已开通',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '企业购买组合已开通，客户管理员可继续邀请成员并分配席位。',
    },
    failed: {
      code: 'purchasing',
      text: '交付处理中',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '交付人员正在官网代购、开通企业组合包并完成基础配置。',
    },
    cancelled: {
      code: 'failed',
      text: '开通工单已取消',
      orderId: latestOrder.id,
      taskId: task.id,
      updatedAt: task.updatedAt,
      description: '开通工单已取消，需重新发起订单或联系代理。',
    },
  };

  return taskStatusMap[task.status];
};

export const getSalesOpeningTasksFromAdminMock = (): SalesOpeningTaskRecord[] =>
  openingTasksState
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      tenantId: item.tenantId,
      tenantName: item.tenantName,
      planName: item.planName,
      bundleLines: clone(item.bundleLines),
      orderAmount: item.orderAmount,
      deliveryOwner: item.deliveryOwner ?? '待分配',
      fulfillmentMode: item.fulfillmentMode,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      failureReason: item.failureReason,
    }))
    .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf());

const resolveSalesOrderFollowupStatus = (
  order: AdminOrderDetail,
  task?: AdminOpeningTaskRecord,
): SalesOrderFollowupStatus => {
  if (order.status === 'pending') return 'pending_payment';
  if (order.status === 'pending_review') return 'payment_review';
  if (order.status === 'refunded' || order.status === 'cancelled') return 'closed';
  if (order.status === 'paid' && task?.status === 'completed') return 'completed';
  if (order.status === 'paid' && task) return 'delivery_processing';
  return 'paid_waiting_delivery';
};

export const getSalesOrderFollowupsFromAdminMock = (salesName: string): SalesOrderFollowupRecord[] =>
  ordersState
    .filter((order) => order.ownerSales === salesName)
    .map((order) => {
      const task = openingTasksState.find((item) => item.orderId === order.id);
      const review = bankTransferReviewsState.find((item) => item.orderId === order.id);
      const updatedAt =
        task?.updatedAt ||
        review?.financeReviewedAt ||
        review?.deliveryReviewedAt ||
        review?.uploadedAt ||
        order.paidAt ||
        order.createdAt;

      return {
        id: order.id,
        orderId: order.id,
        tenantId: order.tenantId,
        tenantName: order.tenantName,
        planName: order.orderType,
        bundleLines: clone(order.bundleLines ?? []),
        orderAmount: order.amount,
        paymentMethod: order.paymentMethod,
        orderStatus: order.status,
        followupStatus: resolveSalesOrderFollowupStatus(order, task),
        bankReviewStatus: review?.reviewStatus,
        proofName: review?.proofName,
        bankSerialNo: review?.bankSerialNo,
        openingTaskId: task?.id,
        openingStatus: task?.status,
        deliveryOwner: task?.deliveryOwner ?? review?.deliveryOwner,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        updatedAt,
      };
    })
    .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf());

export const getSalesCustomerOrdersFromAdminMock = (tenantId: string): SalesCustomerOrderRecord[] =>
  ordersState
    .filter((item) => item.tenantId === tenantId)
    .map((item) => {
      const task = openingTasksState.find((openingTask) => openingTask.orderId === item.id);
      const commission = commissionTransactionsState.find((commissionItem) => commissionItem.orderId === item.id);
      const seatStatus: SalesCustomerOrderRecord['seatStatus'] =
        item.status === 'refunded' || item.status === 'cancelled' ? 'released' : task?.status === 'completed' ? 'active' : 'inactive';
      return {
        id: item.id,
        tenantId: item.tenantId,
        type: item.orderType,
        planName: item.orderType,
        bundleLines: clone(item.bundleLines ?? []),
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        status: getBillingStatusFromOrder(item.status),
        seatStatus,
        createdAt: item.createdAt,
        paidAt: item.paidAt,
        activatedAt: task?.completedAt,
        openingTaskId: task?.id,
        openingStatus: task?.status,
        commissionId: commission?.id ?? item.commissionId,
        commissionStatus: commission?.status,
      };
    })
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());

const getSalesCouponPoolStatus = (effectiveAt: string, expiresAt: string, remainingQuota: number): SalesCouponPoolRecord['status'] => {
  if (remainingQuota <= 0) return 'exhausted';
  if (dayjs(effectiveAt).isAfter(now(), 'day')) return 'pending';
  if (dayjs(expiresAt).isBefore(now(), 'day')) return 'expired';
  return 'active';
};

const findSalesOwner = (ownerId: string) =>
  salesState.find((item) => item.id === ownerId) ??
  SALES_ADMIN_ACCOUNTS.find((item) => item.id === ownerId);

const updateSalesCouponPoolUsage = (
  poolId: string,
  patch: Partial<Pick<SalesCouponPoolRecord, 'allocatedQuota' | 'grantedQuota' | 'remainingQuota'>>,
) => {
  salesCouponPoolsState = salesCouponPoolsState.map((item) => {
    if (item.id !== poolId) return item;
    const next = { ...item, ...patch };
    return {
      ...next,
      status: getSalesCouponPoolStatus(next.effectiveAt, next.expiresAt, next.remainingQuota),
    };
  });
};

const createSalesAssistedOrder = (payload: {
  tenantId: string;
  poolId: string;
  orderType: string;
  amount: number;
  paymentMethod: BillingOrder['paymentMethod'];
  bundleLines?: OrderBundleLine[];
}): SalesAssistedOrderResult | undefined => {
  const time = now().format('YYYY-MM-DD HH:mm');
  const orderId = `ORD-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`;
  const bundleLines = clone(payload.bundleLines ?? defaultBundleLinesForOrder(payload.orderType, payload.amount));
  const breakdown = getSalesCouponDiscountForOrder(payload.poolId, payload.tenantId, payload.amount, bundleLines);
  if (!breakdown) return undefined;
  const order: AdminOrderDetail = {
    id: orderId,
    tenantId: breakdown.tenant.id,
    tenantName: breakdown.tenant.name,
    ownerSales: breakdown.tenant.ownerSales,
    orderType: payload.orderType,
    bundleLines,
    amount: breakdown.amount,
    originalAmount: breakdown.originalAmount,
    couponId: breakdown.couponId,
    couponName: breakdown.couponName,
    couponDiscountAmount: breakdown.couponDiscountAmount,
    couponUsageStatus: breakdown.couponUsageStatus,
    paymentMethod: payload.paymentMethod,
    status: 'pending',
    createdAt: time,
    paymentExpiresAt: dayjs(time).add(ORDER_PAYMENT_DEADLINE_HOURS, 'hour').format('YYYY-MM-DD HH:mm'),
    volcSyncStatus: 'pending',
    volcReceipt: payload.paymentMethod === 'bank_transfer' ? '等待销售代客户提交对公付款凭证' : '等待客户完成扫码支付',
    timeline: [
      {
        id: `tl-${Date.now()}`,
        time,
        title: '销售代客户创建订单',
        detail: `${breakdown.pool.ownerName} 使用优惠券 ${breakdown.pool.name} 为 ${breakdown.tenant.name} 创建订单`,
      },
    ],
  };
  ordersState = [order, ...ordersState];
  updateSalesCouponPoolUsage(breakdown.pool.id, {
    grantedQuota: breakdown.pool.grantedQuota + 1,
    remainingQuota: breakdown.pool.remainingQuota - 1,
  });
  const grant: SalesCouponGrantRecord = {
    id: `SCG-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
    poolId: breakdown.pool.id,
    salesId: breakdown.pool.ownerId,
    salesName: breakdown.pool.ownerName,
    tenantId: breakdown.tenant.id,
    tenantName: breakdown.tenant.name,
    couponId: order.id,
    amount: 1,
    createdAt: time,
    remark: `销售代客户使用优惠券下单，抵扣 ${money(breakdown.couponDiscountAmount)}`,
  };
  salesCouponGrantsState = [grant, ...salesCouponGrantsState];
  recordAudit({
    actor: breakdown.pool.ownerName,
    role: breakdown.pool.ownerRole === 'salesAdmin' ? 'salesAdmin' : 'sales',
    action: '销售代客户使用优惠券下单',
    targetType: 'order',
    targetId: orderId,
    tenantName: breakdown.tenant.name,
    result: 'success',
  });
  return clone({
    order: toBillingOrder(order),
    orderId,
    amount: breakdown.amount,
    paymentMethod: payload.paymentMethod,
    tenantName: breakdown.tenant.name,
    couponName: breakdown.pool.name,
    discountAmount: breakdown.couponDiscountAmount,
    payableAmount: breakdown.payableAmount,
    qrCodeLabel: payload.paymentMethod === 'bank_transfer' ? undefined : `${payload.paymentMethod === 'wechat' ? '微信' : '支付宝'}支付码 ${orderId}`,
  });
};

syncSalesDerivedData();

export const adminMockApi = {
  getAdminCurrentRole() {
    return delay({ code: currentAdminRole, name: roleNames[currentAdminRole] });
  },

  setAdminCurrentRole(role: AdminRoleCode) {
    currentAdminRole = role;
    return delay({ code: role, name: roleNames[role] });
  },

  getAdminDashboard() {
    return delay(buildDashboard());
  },

  getAdminAgentTenants() {
    return delay(clone(agentTenantsState));
  },

  getAdminAgentTenantDetail(id: string) {
    return delay(clone(getAgentTenantById(id)));
  },

  createAdminAgentTenant(payload: AdminAgentTenantUpsertPayload) {
    const tenant = buildAgentTenantFromPayload(payload);
    agentTenantsState = [tenant, ...agentTenantsState];
    return delay(clone(tenant));
  },

  updateAdminAgentTenant(id: string, payload: AdminAgentTenantUpsertPayload) {
    const rule = getProcurementRuleById(payload.procurementRuleId);
    const { mirrorSiteEnabled, ...tenantPayload } = payload;
    agentTenantsState = agentTenantsState.map((item) => {
      if (item.id !== id) return item;
      const nextWebsiteStatus = mirrorSiteEnabled
        ? item.websiteStatus === 'configured' ? 'configured' : 'draft'
        : 'not_configured';
      return {
        ...item,
        ...tenantPayload,
        mirrorDomain: mirrorSiteEnabled ? payload.mirrorDomain.trim() : '',
        websiteStatus: nextWebsiteStatus,
        procurementRuleName: rule?.name ?? item.procurementRuleName,
        procurementRate: rule?.rate ?? item.procurementRate,
        staff: item.staff.map((staffItem) => (
          staffItem.role === 'agentAdmin'
            ? {
              ...staffItem,
              name: payload.adminName,
              phone: payload.adminPhone,
              status: agentStaffStatusFromTenantStatus(payload.status),
            }
            : staffItem
        )),
      };
    });
    return delay(clone(getAgentTenantById(id)));
  },

  getAgentBalanceDashboard(rootPath = '/agent/admin') {
    return delay(buildAgentBalanceDashboard(rootPath));
  },

  getAgentBalanceAccount() {
    return delay(getAgentBalanceSummary());
  },

  getAgentBalanceLedger(query?: AgentBalanceLedgerQuery) {
    return delay(clone(filterAgentBalanceLedger(query)));
  },

  getAgentProcurementOrders() {
    return delay(clone(agentProcurementOrdersState.sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf())));
  },

  createAgentCustomerOrder(payload: {
    tenantName: string;
    orderSummary: string;
    customerSaleAmount: number;
    platformListAmount: number;
    protocolRate: number;
  }) {
    const createdAt = now().format('YYYY-MM-DD HH:mm');
    const protocolAmount = Math.round(payload.platformListAmount * payload.protocolRate * 100) / 100;
    const order: AgentProcurementOrderRecord = {
      id: `APO-${now().format('YYYYMMDD')}-${String(agentProcurementOrdersState.length + 1).padStart(3, '0')}`,
      customerOrderId: `AORD-${now().format('YYYYMMDD')}-${String(agentProcurementOrdersState.length + 1).padStart(3, '0')}`,
      tenantId: `tenant-agent-${Date.now()}`,
      tenantName: payload.tenantName,
      agentTenantId: 'agent-tenant-001',
      agentName: '华东一级代理',
      salesName: '陈默',
      orderSummary: payload.orderSummary,
      customerSaleAmount: payload.customerSaleAmount,
      platformListAmount: payload.platformListAmount,
      protocolRate: payload.protocolRate,
      protocolAmount,
      grossProfit: payload.customerSaleAmount - protocolAmount,
      customerPaymentStatus: 'pending',
      status: 'pending_customer_payment',
      createdAt,
      updatedAt: createdAt,
    };
    agentProcurementOrdersState = [order, ...agentProcurementOrdersState];
    return delay(clone(order));
  },

  confirmAgentCustomerPayment(orderId: string) {
    const confirmedAt = now().format('YYYY-MM-DD HH:mm');
    agentProcurementOrdersState = agentProcurementOrdersState.map((item) =>
      item.id === orderId
        ? { ...item, customerPaymentStatus: 'confirmed', status: 'pending_procurement', updatedAt: confirmedAt }
        : item,
    );
    return delay(clone(agentProcurementOrdersState.find((item) => item.id === orderId)));
  },

  payAgentProcurementWithWallet(orderId: string) {
    const paidAt = now().format('YYYY-MM-DD HH:mm');
    const order = agentProcurementOrdersState.find((item) => item.id === orderId);
    if (!order) return delay(undefined);
    if (agentBalanceState.currentBalance < order.protocolAmount) {
      throw new Error('钱包余额不足，请改用微信或对公转账');
    }
    agentBalanceState = {
      ...agentBalanceState,
      currentBalance: agentBalanceState.currentBalance - order.protocolAmount,
      deductedAmount: agentBalanceState.deductedAmount + order.protocolAmount,
    };
    agentBalanceLedgerState = [
      {
        id: `ABL-${now().format('YYYYMMDD')}-${String(agentBalanceLedgerState.length + 1).padStart(3, '0')}`,
        type: 'deduct',
        businessLabel: `平台代理采购 / ${order.tenantName}`,
        amount: -order.protocolAmount,
        balanceAfter: agentBalanceState.currentBalance,
        createdAt: paidAt,
        remark: `钱包支付平台代理采购订单 ${order.id}`,
      },
      ...agentBalanceLedgerState,
    ];
    agentProcurementOrdersState = agentProcurementOrdersState.map((item) =>
      item.id === orderId
        ? { ...item, procurementPaymentMethod: 'wallet', status: 'delivery_processing', updatedAt: paidAt }
        : item,
    );
    return delay(clone(agentProcurementOrdersState.find((item) => item.id === orderId)));
  },

  submitAgentProcurementProof(orderId: string, payload: { paymentMethod: Exclude<AgentProcurementPaymentMethod, 'wallet'>; proofName: string }) {
    const submittedAt = now().format('YYYY-MM-DD HH:mm');
    agentProcurementOrdersState = agentProcurementOrdersState.map((item) =>
      item.id === orderId
        ? {
          ...item,
          procurementPaymentMethod: payload.paymentMethod,
          procurementProofName: payload.proofName,
          status: 'pending_finance_review',
          financeOwner: item.financeOwner ?? '姚楠',
          updatedAt: submittedAt,
        }
        : item,
    );
    return delay(clone(agentProcurementOrdersState.find((item) => item.id === orderId)));
  },

  createAgentTopup(payload: {
    amount: number;
    paymentMethod: AgentBalancePaymentMethod;
    remark?: string;
    proofFileName?: string;
  }) {
    if (payload.amount < 10000) {
      throw new Error('单次钱包充值金额需至少 10,000 元');
    }
    const createdAt = now().format('YYYY-MM-DD HH:mm');
    const uniqueRemarkCode = agentBalanceState.collectionAccount.remarkCode;
    const order: AgentBalanceTopupOrder = {
      id: `ATO-${now().format('YYYYMMDD')}-${String(agentTopupOrdersState.length + 1).padStart(3, '0')}`,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      remark: payload.remark?.trim() || '平台采购钱包充值',
      status: 'completed',
      createdAt,
      proofFileName: payload.proofFileName,
      uniqueRemarkCode,
    };
    agentTopupOrdersState = [order, ...agentTopupOrdersState];
    agentBalanceState = {
      ...agentBalanceState,
      currentBalance: agentBalanceState.currentBalance + payload.amount,
      totalTopup: agentBalanceState.totalTopup + payload.amount,
      collectionAccount: {
        ...agentBalanceState.collectionAccount,
        remarkCode: buildNextAgentRemarkCode(),
      },
    };
    agentBalanceLedgerState = [
      {
        id: `ABL-${now().format('YYYYMMDD')}-${String(agentBalanceLedgerState.length + 1).padStart(3, '0')}`,
        type: 'topup',
        businessLabel: `钱包充值 / ${payload.paymentMethod === 'bank_transfer' ? '对公转账' : payload.paymentMethod === 'wechat' ? '微信' : '支付宝'}`,
        amount: payload.amount,
        balanceAfter: agentBalanceState.currentBalance,
        createdAt,
        remark: payload.remark?.trim() || '充值成功，资金已入账',
        paymentMethod: payload.paymentMethod,
        proofFileName: payload.proofFileName,
      },
      ...agentBalanceLedgerState,
    ];
    return delay({
      order: clone(order),
      summary: getAgentBalanceSummary(),
    });
  },

  updateAgentBalanceThreshold(value: number) {
    agentBalanceState = {
      ...agentBalanceState,
      warningThreshold: value,
    };
    return delay(getAgentBalanceSummary());
  },

  exportAgentBalanceLedger(query?: AgentBalanceLedgerQuery) {
    const rows = filterAgentBalanceLedger(query);
    return delay({
      fileName: `agent-balance-ledger-${now().format('YYYYMMDD')}.csv`,
      content: toCsv(
        ['流水号', '类型', '关联业务', '金额变动', '变动后余额', '时间', '备注'],
        rows.map((item) => [
          item.id,
          item.type,
          item.businessLabel,
          item.amount,
          item.balanceAfter,
          item.createdAt,
          item.remark,
        ]),
      ),
    });
  },

  getAdminTenants() {
    return delay(clone(tenantsState.map(decorateTenant)));
  },

  getAdminTenantDetail(id: string) {
    return delay(clone(decorateTenant(getTenantById(id))));
  },

  getAdminTenantUsage(id: string) {
    return delay(clone(tenantUsageState[id] ?? []));
  },

  getAdminTenantOrders(id: string) {
    return delay(clone(ordersState.filter((item) => item.tenantId === id)));
  },

  createAdminTenant(payload: {
    name: string;
    uscc: string;
    industry?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    customerAdminInitialPassword?: string;
    ownerSalesId?: string;
    accountManagerId?: string;
    source?: string;
    address?: string;
    website?: string;
    remark?: string;
  }) {
    const ownerSales = salesState.find((item) => item.id === payload.ownerSalesId);
    const customerOps = staffState.find((item) => item.id === payload.accountManagerId && item.roleCode === 'R1.3');
    if (tenantsState.some((tenant) => tenant.uscc === payload.uscc.trim())) {
      throw new Error('该统一社会信用代码已存在');
    }
    const createdAt = now().format('YYYY-MM-DD');
    const createdAtTime = now().format('YYYY-MM-DD HH:mm');
    const tenant: AdminTenantDetail = {
      id: `tenant-${Date.now()}`,
      name: payload.name.trim(),
      uscc: payload.uscc.trim(),
      industry: payload.industry?.trim() || '待完善',
      status: 'not_opened',
      onboardingStatus: 'pending_order',
      ownerSales: ownerSales?.name || '未分配',
      accountManager: customerOps?.name || '待分配',
      seatSummary: buildTenantSeatSummary([]),
      monthToken: 0,
      monthGmv: 0,
      createdAt,
      volcSpaceId: '待生成',
      address: payload.address?.trim() || '待完善',
      website: payload.website?.trim() || undefined,
      contractStatus: '待下单',
      activeEmployees: 0,
      ownerSalesId: ownerSales?.id || '',
      accountManagerId: customerOps?.id || '',
      plans: [],
      admins: [{
        id: `ta-${Date.now()}`,
        name: payload.contactName.trim(),
        email: payload.contactEmail?.trim() || '-',
        phone: payload.contactPhone.trim(),
        role: 'R4',
        status: 'suspended',
        lastLoginAt: '待邀请',
      }],
      bindings: [],
      audit: [{
        id: `taudit-${Date.now()}`,
        createdAt: createdAtTime,
        actor: '王珊 / 超级管理员',
        action: '后台补录企业',
        target: payload.source ? `${payload.source} · ${payload.remark || '无备注'}` : payload.remark || '无备注',
        result: 'success',
      }],
      highRiskNotes: ['后台补录企业，需生成订单并完成对公审核后才能开通席位'],
    };
    tenantsState = [tenant, ...tenantsState];
    tenantUsageState[tenant.id] = [];
    syncSalesDerivedData();
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '后台补录企业',
      targetType: 'tenant',
      targetId: tenant.id,
      tenantName: tenant.name,
      result: 'success',
      reason: payload.remark || payload.source,
    });
    return delay(clone(decorateTenant(tenant)));
  },

  updateAdminTenant(id: string, patch: Partial<Pick<AdminTenantDetail, 'name' | 'uscc' | 'industry' | 'address' | 'website'>> & { ownerSalesId?: string; accountManagerId?: string }) {
    const ownerSales = patch.ownerSalesId ? salesState.find((item) => item.id === patch.ownerSalesId) : undefined;
    const customerOps = patch.accountManagerId ? staffState.find((item) => item.id === patch.accountManagerId && item.roleCode === 'R1.3') : undefined;
    tenantsState = tenantsState.map((tenant) => (
      tenant.id === id
        ? {
            ...tenant,
            ...patch,
            ownerSalesId: patch.ownerSalesId !== undefined ? patch.ownerSalesId : tenant.ownerSalesId,
            ownerSales: patch.ownerSalesId !== undefined ? (ownerSales?.name || '未分配') : tenant.ownerSales,
            accountManagerId: patch.accountManagerId !== undefined ? patch.accountManagerId : tenant.accountManagerId,
            accountManager: patch.accountManagerId !== undefined ? (customerOps?.name || '待分配') : tenant.accountManager,
          }
        : tenant
    ));
    syncSalesDerivedData();
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '修改企业基础信息',
      targetType: 'tenant',
      targetId: id,
      tenantName: getTenantById(id).name,
      result: 'success',
    });
    return delay(clone(decorateTenant(getTenantById(id))));
  },

  resetTenantAdminPassword(tenantId: string, adminId: string, temporaryPassword?: string) {
    const tenant = getTenantById(tenantId);
    const admin = tenant.admins.find((item) => item.id === adminId);
    const resetAt = now().format('YYYY-MM-DD HH:mm');
    tenantsState = tenantsState.map((item) => (
      item.id === tenantId
        ? {
            ...item,
            audit: [
              {
                id: `taudit-${Date.now()}`,
                createdAt: resetAt,
                actor: '王珊 / 超级管理员',
                action: '重置客户管理员密码',
                target: admin ? `${admin.name} / ${admin.phone}` : adminId,
                result: 'success' as const,
              },
              ...item.audit,
            ],
          }
        : item
    ));
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '重置客户管理员密码',
      targetType: 'tenant',
      targetId: tenantId,
      tenantName: tenant.name,
      result: 'success',
      reason: admin ? `${admin.name} / ${admin.phone}` : adminId,
    });
    return delay({ success: true, temporaryPassword: temporaryPassword || generateTemporaryPassword() });
  },

  suspendAdminTenant(id: string) {
    tenantsState = tenantsState.map((tenant) => (tenant.id === id ? { ...tenant, status: 'suspended' } : tenant));
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '暂停企业',
      targetType: 'tenant',
      targetId: id,
      tenantName: getTenantById(id).name,
      result: 'success',
      reason: '平台侧手动暂停',
    });
    return delay(clone(decorateTenant(getTenantById(id))));
  },

  resumeAdminTenant(id: string) {
    tenantsState = tenantsState.map((tenant) => (tenant.id === id ? { ...tenant, status: 'active' } : tenant));
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '恢复企业',
      targetType: 'tenant',
      targetId: id,
      tenantName: getTenantById(id).name,
      result: 'success',
    });
    return delay(clone(decorateTenant(getTenantById(id))));
  },

  getAdminImpersonationSessions(tenantId: string) {
    return delay(clone(impersonationSessionsState.filter((item) => item.tenantId === tenantId)));
  },

  startAdminImpersonation(tenantId: string, payload: { targetUser: string; ticketNo: string; reason: string }) {
    const tenant = getTenantById(tenantId);
    const startedAt = now().format('YYYY-MM-DD HH:mm');
    const session = {
      id: `imp-${Date.now()}`,
      tenantId,
      tenantName: tenant.name,
      adminUser: '许岚 / CS-',
      targetUser: payload.targetUser,
      ticketNo: payload.ticketNo,
      reason: payload.reason,
      startedAt,
      expectedEndAt: now().add(2, 'hour').format('YYYY-MM-DD HH:mm'),
      status: 'active' as const,
    };
    impersonationSessionsState = [session, ...impersonationSessionsState];
    recordAudit({
      actor: '许岚',
      role: 'R1.3',
      action: '开始代登录',
      targetType: 'impersonation_session',
      targetId: session.id,
      tenantName: tenant.name,
      result: 'success',
      reason: payload.reason,
    });
    return delay(clone(session));
  },

  endAdminImpersonation(sessionId: string) {
    impersonationSessionsState = impersonationSessionsState.map((item) =>
      item.id === sessionId
        ? { ...item, status: 'ended' as const, endedAt: now().format('YYYY-MM-DD HH:mm') }
        : item,
    );
    const target = impersonationSessionsState.find((item) => item.id === sessionId);
    if (target) {
      recordAudit({
        actor: '许岚',
        role: 'R1.3',
        action: '结束代登录',
        targetType: 'impersonation_session',
        targetId: sessionId,
        tenantName: target.tenantName,
        result: 'success',
      });
    }
    return delay(clone(target));
  },

  getAdminCoupons() {
    return delay(clone(couponsState));
  },

  getAdminTenantCoupons(tenantId: string) {
    return delay(clone(couponsState.filter((item) => item.tenantId === tenantId)));
  },

  getAdminCouponUsages(couponId?: string) {
    const rows = couponId ? couponUsagesState.filter((item) => item.couponId === couponId) : couponUsagesState;
    return delay(clone(rows));
  },

  getTenantAvailableCoupons(tenantId = 'tenant-001') {
    return delay(clone(couponsState.filter((item) => item.tenantId === tenantId && isCouponUsable(item))));
  },

  previewTenantBestCoupon(payload: { tenantId?: string; amount: number; skipCoupon?: boolean; couponId?: string; bundleLines?: OrderBundleLine[] }) {
    const tenantId = payload.tenantId ?? 'tenant-001';
    const breakdown = applyCouponToOrderDraft(tenantId, payload.amount, payload.skipCoupon, payload.couponId, payload.bundleLines);
    return delay(clone(breakdown));
  },

  createAdminCoupon(payload: {
    benefitType?: CouponBenefitType;
    tenantId: string;
    name: string;
    discountRate: number;
    discountScope?: CouponDiscountScope;
    thresholdAmount: number;
    totalDiscountQuota: number;
    effectiveAt: string;
    expiresAt: string;
    remark: string;
  }) {
    const tenant = getTenantById(payload.tenantId);
    const issuedAt = now().format('YYYY-MM-DD HH:mm');
    const status: CouponRecord['status'] = dayjs(payload.effectiveAt).isAfter(now(), 'day') ? 'pending' : 'active';
    const benefitType: CouponBenefitType = payload.benefitType ?? 'coupon';
    const isCoupon = benefitType === 'coupon';
    const totalDiscountQuota = isCoupon ? 0 : payload.totalDiscountQuota;
    const coupon: CouponRecord = {
      id: `CPN-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
      name: payload.name.trim(),
      tenantId: tenant.id,
      tenantName: tenant.name,
      benefitType,
      type: 'quota_discount',
      discountScope: payload.discountScope ?? 'order',
      discountRate: payload.discountRate,
      totalDiscountQuota,
      usedDiscountQuota: 0,
      remainingDiscountQuota: totalDiscountQuota,
      effectiveAt: payload.effectiveAt,
      expiresAt: payload.expiresAt,
      status,
      issuedBy: '官方管理员 王珊',
      issuedAt,
      remark: payload.remark.trim(),
      usageMode: isCoupon ? '单次使用' : '多次使用',
      thresholdRule: `满 ${money(payload.thresholdAmount)} 可用`,
    };
    couponsState = [coupon, ...couponsState];
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: isCoupon ? '发放优惠券' : '发放代金券',
      targetType: 'coupon',
      targetId: coupon.id,
      tenantName: tenant.name,
      result: 'success',
      reason: coupon.remark,
    });
    return delay(clone(coupon));
  },

  getSalesCouponPools(ownerRole?: SalesCouponOwnerRole) {
    const rows = ownerRole ? salesCouponPoolsState.filter((item) => item.ownerRole === ownerRole) : salesCouponPoolsState;
    return delay(clone(rows));
  },

  getSalesCouponTransfers() {
    return delay(clone(salesCouponTransfersState));
  },

  getSalesCouponGrants() {
    return delay(clone(salesCouponGrantsState));
  },

  issueSalesCouponPool(payload: {
    benefitType?: CouponBenefitType;
    ownerRole: SalesCouponOwnerRole;
    ownerId: string;
    name: string;
    discountRate: number;
    discountScope?: CouponDiscountScope;
    totalQuota: number;
    effectiveAt: string;
    expiresAt: string;
    remark: string;
  }) {
    const owner = findSalesOwner(payload.ownerId);
    const issuedAt = now().format('YYYY-MM-DD HH:mm');
    const benefitType: CouponBenefitType = 'coupon';
    const pool: SalesCouponPoolRecord = {
      id: `SCP-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
      name: payload.name.trim(),
      ownerRole: payload.ownerRole,
      ownerId: owner?.id ?? payload.ownerId,
      ownerName: owner?.name ?? payload.ownerId,
      benefitType,
      type: 'quota_discount',
      discountScope: payload.discountScope ?? 'order',
      discountRate: payload.discountRate,
      totalQuota: payload.totalQuota,
      allocatedQuota: 0,
      grantedQuota: 0,
      remainingQuota: payload.totalQuota,
      effectiveAt: payload.effectiveAt,
      expiresAt: payload.expiresAt,
      status: getSalesCouponPoolStatus(payload.effectiveAt, payload.expiresAt, payload.totalQuota),
      issuedBy: '官方管理员 王珊',
      issuedAt,
      remark: payload.remark.trim(),
    };
    salesCouponPoolsState = [pool, ...salesCouponPoolsState];
    salesCouponTransfersState = [
      {
        id: `SCT-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
        poolId: pool.id,
        fromRole: 'platformAdmin',
        fromName: '官方管理员 王珊',
        toRole: payload.ownerRole,
        toId: pool.ownerId,
        toName: pool.ownerName,
        amount: payload.totalQuota,
        createdAt: issuedAt,
        remark: payload.remark.trim() || '官方管理员发放销售推广优惠券',
      },
      ...salesCouponTransfersState,
    ];
    return delay(clone(pool));
  },

  assignSalesCouponPool(payload: {
    sourcePoolId: string;
    salesId: string;
    amount: number;
    remark: string;
  }) {
    const source = salesCouponPoolsState.find((item) => item.id === payload.sourcePoolId);
    const sales = salesState.find((item) => item.id === payload.salesId);
    if (!source || !sales || (source.benefitType ?? 'coupon') !== 'coupon' || payload.amount <= 0 || source.remainingQuota < payload.amount) {
      return delay(undefined);
    }
    const createdAt = now().format('YYYY-MM-DD HH:mm');
    const childPool: SalesCouponPoolRecord = {
      id: `SCP-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
      name: source.name,
      ownerRole: 'sales',
      ownerId: sales.id,
      ownerName: sales.name,
      parentPoolId: source.id,
      templateId: source.templateId,
      benefitType: source.benefitType,
      type: 'quota_discount',
      discountScope: source.discountScope ?? 'order',
      discountRate: source.discountRate,
      totalQuota: payload.amount,
      allocatedQuota: 0,
      grantedQuota: 0,
      remainingQuota: payload.amount,
      effectiveAt: source.effectiveAt,
      expiresAt: source.expiresAt,
      status: getSalesCouponPoolStatus(source.effectiveAt, source.expiresAt, payload.amount),
      issuedBy: source.ownerName,
      issuedAt: createdAt,
      remark: payload.remark.trim() || `由${source.ownerName}分配给${sales.name}`,
    };
    updateSalesCouponPoolUsage(source.id, {
      allocatedQuota: source.allocatedQuota + payload.amount,
      remainingQuota: source.remainingQuota - payload.amount,
    });
    salesCouponPoolsState = [childPool, ...salesCouponPoolsState];
    salesCouponTransfersState = [
      {
        id: `SCT-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
        poolId: childPool.id,
        fromRole: 'salesAdmin',
        fromName: source.ownerName,
        toRole: 'sales',
        toId: sales.id,
        toName: sales.name,
        amount: payload.amount,
        createdAt,
        remark: payload.remark.trim() || '销售管理员分配给下属销售',
      },
      ...salesCouponTransfersState,
    ];
    return delay(clone(childPool));
  },

  grantSalesCouponToTenant(payload: {
    poolId: string;
    tenantId: string;
    amount: number;
    remark: string;
  }) {
    const pool = salesCouponPoolsState.find((item) => item.id === payload.poolId);
    const tenant = getTenantById(payload.tenantId);
    const grantCount = 1;
    if (!pool || !tenant || (pool.benefitType ?? 'coupon') !== 'coupon' || pool.remainingQuota < grantCount) {
      return delay(undefined);
    }
    const createdAt = now().format('YYYY-MM-DD HH:mm');
    const benefitType: CouponBenefitType = 'coupon';
    const totalDiscountQuota = 0;
    const coupon: CouponRecord = {
      id: `CPN-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
      name: pool.name,
      tenantId: tenant.id,
      tenantName: tenant.name,
      benefitType,
      type: 'quota_discount',
      discountScope: pool.discountScope ?? 'order',
      discountRate: pool.discountRate,
      totalDiscountQuota,
      usedDiscountQuota: 0,
      remainingDiscountQuota: totalDiscountQuota,
      effectiveAt: pool.effectiveAt,
      expiresAt: pool.expiresAt,
      status: getSalesCouponPoolStatus(pool.effectiveAt, pool.expiresAt, payload.amount),
      issuedBy: pool.ownerName,
      issuedAt: createdAt,
      remark: payload.remark.trim() || '销售线下推广发放给客户',
      usageMode: '单次使用',
      thresholdRule: '满 ¥0.00 可用',
    };
    couponsState = [coupon, ...couponsState];
    updateSalesCouponPoolUsage(pool.id, {
      grantedQuota: pool.grantedQuota + grantCount,
      remainingQuota: pool.remainingQuota - grantCount,
    });
    const grant: SalesCouponGrantRecord = {
      id: `SCG-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
      poolId: pool.id,
      salesId: pool.ownerId,
      salesName: pool.ownerName,
      tenantId: tenant.id,
      tenantName: tenant.name,
      couponId: coupon.id,
      amount: grantCount,
      createdAt,
      remark: payload.remark.trim() || '销售线下推广发放给客户',
    };
    salesCouponGrantsState = [grant, ...salesCouponGrantsState];
    salesCouponTransfersState = [
      {
        id: `SCT-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`,
        poolId: pool.id,
        fromRole: pool.ownerRole,
        fromName: pool.ownerName,
        toRole: 'tenant',
        toId: tenant.id,
        toName: tenant.name,
        amount: grantCount,
        createdAt,
        remark: grant.remark,
      },
      ...salesCouponTransfersState,
    ];
    return delay(clone(coupon));
  },

  previewSalesCouponOrder(payload: {
    tenantId: string;
    poolId: string;
    amount: number;
    bundleLines?: OrderBundleLine[];
  }) {
    const breakdown = getSalesCouponDiscountForOrder(payload.poolId, payload.tenantId, payload.amount, payload.bundleLines);
    if (!breakdown) {
      return delay({
        originalAmount: payload.amount,
        payableAmount: payload.amount,
        couponDiscountAmount: 0,
        couponUsageStatus: 'none' as const,
      });
    }
    return delay(clone({
      originalAmount: breakdown.originalAmount,
      eligibleAmount: breakdown.eligibleAmount,
      discountScope: breakdown.discountScope,
      couponId: breakdown.couponId,
      couponName: breakdown.couponName,
      couponDiscountAmount: breakdown.couponDiscountAmount,
      payableAmount: breakdown.payableAmount,
      couponUsageStatus: breakdown.couponUsageStatus,
    }));
  },

  createSalesAssistedElectronicPaymentOrder(payload: {
    tenantId: string;
    poolId: string;
    orderType: string;
    amount: number;
    paymentMethod: 'wechat' | 'alipay';
    bundleLines?: OrderBundleLine[];
  }) {
    return delay(createSalesAssistedOrder(payload));
  },

  createSalesAssistedBankTransferOrder(payload: {
    tenantId: string;
    poolId: string;
    orderType: string;
    amount: number;
    bundleLines?: OrderBundleLine[];
  }) {
    return delay(createSalesAssistedOrder({ ...payload, paymentMethod: 'bank_transfer' }));
  },

  submitSalesAssistedBankTransferProof(orderId: string, payload: { proofName: string; uploadedAmount: number }) {
    return this.submitTenantBankTransferProof(orderId, payload);
  },

  disableAdminCoupon(couponId: string) {
    const disabledAt = now().format('YYYY-MM-DD HH:mm');
    couponsState = couponsState.map((item) =>
      item.id === couponId
        ? { ...item, status: 'disabled' as const, disabledBy: '官方管理员 王珊', disabledAt }
        : item,
    );
    const coupon = couponsState.find((item) => item.id === couponId);
    if (coupon) {
      recordAudit({
        actor: '王珊',
        role: 'R1.1',
        action: '停用优惠券',
        targetType: 'coupon',
        targetId: coupon.id,
        tenantName: coupon.tenantName,
        result: 'success',
      });
    }
    return delay(clone(coupon));
  },

  createTenantBankTransferOrder(payload: {
    tenantId?: string;
    orderType: string;
    amount: number;
    skipCoupon?: boolean;
    couponId?: string;
    bundleLines?: OrderBundleLine[];
  }) {
    const tenant = getTenantById(payload.tenantId ?? 'tenant-001');
    const time = now().format('YYYY-MM-DD HH:mm');
    const orderId = `ORD-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`;
    const bundleLines = clone(payload.bundleLines ?? defaultBundleLinesForOrder(payload.orderType, payload.amount));
    const amountBreakdown = applyCouponToOrderDraft(tenant.id, payload.amount, payload.skipCoupon, payload.couponId, bundleLines);
    const order: AdminOrderDetail = {
      id: orderId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      ownerSales: tenant.ownerSales,
      orderType: payload.orderType,
      bundleLines,
      amount: amountBreakdown.amount,
      originalAmount: amountBreakdown.originalAmount,
      couponId: amountBreakdown.couponId,
      couponName: amountBreakdown.couponName,
      couponDiscountAmount: amountBreakdown.couponDiscountAmount,
      couponUsageStatus: amountBreakdown.couponUsageStatus,
      paymentMethod: 'bank_transfer',
      status: 'pending',
      createdAt: time,
      paymentExpiresAt: dayjs(time).add(ORDER_PAYMENT_DEADLINE_HOURS, 'hour').format('YYYY-MM-DD HH:mm'),
      volcSyncStatus: 'pending',
      volcReceipt: '等待客户完成对公付款并提交凭证',
      timeline: [
        { id: `tl-${Date.now()}`, time, title: '订单创建', detail: '客户生成对公订单，等待完成对公付款' },
      ],
    };
    ordersState = [order, ...ordersState];
    recordAudit({
      actor: '客户管理员',
      role: 'R4',
      action: '生成对公订单',
      targetType: 'order',
      targetId: orderId,
      tenantName: tenant.name,
      result: 'success',
    });
    return delay(clone({ order: toBillingOrder(order), orderId }));
  },

  createTenantElectronicPaymentOrder(payload: {
    tenantId?: string;
    orderType: string;
    amount: number;
    paymentMethod: 'wechat' | 'alipay';
    skipCoupon?: boolean;
    couponId?: string;
    bundleLines?: OrderBundleLine[];
  }) {
    const tenant = getTenantById(payload.tenantId ?? 'tenant-001');
    const time = now().format('YYYY-MM-DD HH:mm');
    const orderId = `ORD-${now().format('YYYYMMDD')}-${String(Date.now()).slice(-4)}`;
    const bundleLines = clone(payload.bundleLines ?? defaultBundleLinesForOrder(payload.orderType, payload.amount));
    const amountBreakdown = applyCouponToOrderDraft(tenant.id, payload.amount, payload.skipCoupon, payload.couponId, bundleLines);
    const order: AdminOrderDetail = {
      id: orderId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      ownerSales: tenant.ownerSales,
      orderType: payload.orderType,
      bundleLines,
      amount: amountBreakdown.amount,
      originalAmount: amountBreakdown.originalAmount,
      couponId: amountBreakdown.couponId,
      couponName: amountBreakdown.couponName,
      couponDiscountAmount: amountBreakdown.couponDiscountAmount,
      couponUsageStatus: amountBreakdown.couponUsageStatus,
      paymentMethod: payload.paymentMethod,
      status: 'pending',
      createdAt: time,
      paymentExpiresAt: dayjs(time).add(ORDER_PAYMENT_DEADLINE_HOURS, 'hour').format('YYYY-MM-DD HH:mm'),
      volcSyncStatus: 'pending',
      volcReceipt: '等待客户完成扫码支付',
      timeline: [
        { id: `tl-${Date.now()}`, time, title: '订单创建', detail: `客户生成${payload.paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付订单` },
      ],
    };
    ordersState = [order, ...ordersState];
    recordAudit({
      actor: '客户管理员',
      role: 'R4',
      action: '生成扫码支付订单',
      targetType: 'order',
      targetId: orderId,
      tenantName: tenant.name,
      result: 'success',
    });
    return delay(clone({
      order: toBillingOrder(order),
      orderId,
      amount: amountBreakdown.amount,
      paymentMethod: payload.paymentMethod,
      qrCodeLabel: `${payload.paymentMethod === 'wechat' ? '微信' : '支付宝'}支付码 ${orderId}`,
    }));
  },

  updateTenantPendingOrderPaymentMethod(orderId: string, paymentMethod: BillingOrder['paymentMethod']) {
    normalizePendingOrderExpirations();
    const order = ordersState.find((item) => item.id === orderId);
    if (!order || order.status !== 'pending') return delay(undefined);

    const time = now().format('YYYY-MM-DD HH:mm');
    const paymentLabel = paymentMethod === 'bank_transfer' ? '对公转账' : paymentMethod === 'alipay' ? '支付宝扫码' : '微信扫码';
    ordersState = ordersState.map((item) =>
      item.id === orderId
        ? {
            ...item,
            paymentMethod,
            volcReceipt: paymentMethod === 'bank_transfer' ? '等待客户完成对公付款并提交凭证' : '等待客户完成扫码支付',
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '切换支付方式', detail: `客户切换为${paymentLabel}` },
            ],
          }
        : item,
    );
    recordAudit({
      actor: '客户管理员',
      role: 'R4',
      action: '切换订单支付方式',
      targetType: 'order',
      targetId: orderId,
      tenantName: order.tenantName,
      result: 'success',
    });
    const nextOrder = ordersState.find((item) => item.id === orderId);
    return delay(clone(nextOrder ? toBillingOrder(nextOrder) : undefined));
  },

  completeTenantElectronicPayment(orderId: string) {
    normalizePendingOrderExpirations();
    const order = ordersState.find((item) => item.id === orderId);
    if (!order || order.status !== 'pending') return delay(undefined);

    const time = now().format('YYYY-MM-DD HH:mm');
    confirmCouponUsageForOrder(order, time);
    if (isSeatOpeningOrder(order) && !openingTasksState.some((item) => item.orderId === order.id)) {
      openingTasksState = [createOpeningTaskFromOrder(order, order.tenantName), ...openingTasksState];
    }
    ordersState = ordersState.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: 'paid',
            paidAt: time,
            volcSyncStatus: isSeatOpeningOrder(item) ? 'pending' : 'success',
            volcReceipt: isSeatOpeningOrder(item) ? '扫码支付成功，已生成开通类交付工单，待交付管理员分配' : '扫码支付成功，权益已入账',
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '扫码支付成功', detail: `${item.paymentMethod === 'wechat' ? '微信' : '支付宝'}支付已确认到账` },
            ],
          }
        : item,
    );
    syncSalesDerivedData();
    createNotification({
      role: 'tenantAdmin',
      category: 'order',
      priority: 'medium',
      title: '订单支付成功',
      summary: `${order.orderType} 已支付成功${isSeatOpeningOrder(order) ? '，订单已进入交付开通流程' : '。'}`,
      todo: isSeatOpeningOrder(order),
      actionable: true,
      actionUrl: '/tenant/billing',
      actionLabel: '查看订单',
      sourceType: 'order',
      sourceId: orderId,
      templateTrigger: 'order.electronic_payment.paid',
    });
    const nextOrder = ordersState.find((item) => item.id === orderId);
    return delay(clone(nextOrder ? toBillingOrder(nextOrder) : undefined));
  },

  submitTenantBankTransferProof(orderId: string, payload: { proofName: string; uploadedAmount: number }) {
    normalizePendingOrderExpirations();
    const order = ordersState.find((item) => item.id === orderId);
    if (!order || order.status !== 'pending') return delay(undefined);

    const time = now().format('YYYY-MM-DD HH:mm');
    confirmCouponUsageForOrder(order, time);
    const existingReview = bankTransferReviewsState.find((item) => item.orderId === orderId);
    const previousAttempts = existingReview?.attempts ?? (existingReview
      ? [{
          id: `${existingReview.id}-a${existingReview.attemptNo || 1}`,
          attemptNo: existingReview.attemptNo || 1,
          proofName: existingReview.proofName,
          uploadedAmount: existingReview.uploadedAmount,
          uploadedAt: existingReview.uploadedAt,
          reviewStatus: existingReview.reviewStatus,
          bankSerialNo: existingReview.bankSerialNo,
          deliveryReviewedAt: existingReview.deliveryReviewedAt,
          financeReviewedAt: existingReview.financeReviewedAt,
          reviewReason: existingReview.reviewReason,
        }]
      : []);
    const attemptNo = Math.max(0, ...previousAttempts.map((item) => item.attemptNo)) + 1;
    const reviewId = existingReview?.id ?? `btr-${Date.now()}`;
    const review: AdminBankTransferReviewItem = {
      id: reviewId,
      orderId,
      tenantName: order.tenantName,
      amount: order.amount,
      attemptNo,
      proofName: payload.proofName,
      uploadedAmount: payload.uploadedAmount,
      uploadedAt: time,
      daysSinceUpload: 0,
      reviewStatus: 'pending_delivery_review',
      deliveryOwner: '周航',
      attempts: [
        {
          id: `${reviewId}-a${attemptNo}`,
          attemptNo,
          proofName: payload.proofName,
          uploadedAmount: payload.uploadedAmount,
          uploadedAt: time,
          reviewStatus: 'pending_delivery_review',
        },
        ...previousAttempts,
      ],
    };

    bankTransferReviewsState = [
      review,
      ...bankTransferReviewsState.filter((item) => item.orderId !== orderId),
    ];
    ordersState = ordersState.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: 'pending_review',
            volcReceipt: '客户已提交付款凭证，等待交付核查流水号',
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '上传付款凭证', detail: `${payload.proofName}，客户填写金额 ${money(payload.uploadedAmount)}` },
            ],
          }
        : item,
    );
    recordAudit({
      actor: '客户管理员',
      role: 'R4',
      action: '提交对公凭证',
      targetType: 'bank_transfer_review',
      targetId: reviewId,
      tenantName: order.tenantName,
      result: 'success',
    });
    return delay(clone({ order: toBillingOrder({ ...order, status: 'pending_review' }), review }));
  },

  getAdminOpeningTasks() {
    return delay(clone(openingTasksState));
  },

  assignAdminOpeningTask(id: string, deliveryOwner: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            deliveryOwner,
            status: 'pending_handle',
            updatedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: item.deliveryOwner ? '改派处理人' : '分配处理人', detail: `已分配给 ${deliveryOwner} 负责官网代购开通` },
            ],
          }
        : item,
    );
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  startAdminOpeningTask(id: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'purchasing',
            updatedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: '开始办理', detail: '交付人员开始在官网为客户代购购买组合' },
            ],
          }
        : item,
    );
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  markAdminOpeningTaskPurchased(id: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'waiting_confirm',
            updatedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: '已提交购买', detail: '官网已下单，等待交付确认企业组合已生效' },
            ],
          }
        : item,
    );
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  completeAdminOpeningTask(id: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const task = openingTasksState.find((item) => item.id === id);
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'completed',
            updatedAt: time,
            completedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: '完成开通', detail: '交付确认企业购买组合已生效，可进入席位管理继续分配' },
            ],
          }
        : item,
    );
    ordersState = ordersState.map((item) =>
      task && item.id === task.orderId
        ? {
            ...item,
            volcSyncStatus: 'success',
            volcReceipt: '交付确认企业购买组合已生效',
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '开通完成', detail: '企业购买组合已开通，满足佣金 pending 生成条件' },
            ],
          }
        : item,
    );
    if (task && !commissionTransactionsState.some((item) => item.orderId === task.orderId)) {
      const commissionId = `commission-${Date.now()}`;
      const rate = getCommissionRateForSales(task.ownerSales);
      commissionTransactionsState = [
        {
          id: commissionId,
          orderId: task.orderId,
          tenantName: task.tenantName,
          salesName: task.ownerSales,
          orderAmount: task.orderAmount,
          commissionAmount: Math.round(task.orderAmount * rate),
          rate,
          sourceType: 'opening_completed',
          sourceText: '开通完成自动生成',
          status: 'pending',
          generatedAt: time,
        },
        ...commissionTransactionsState,
      ];
      ordersState = ordersState.map((item) => (item.id === task.orderId ? { ...item, commissionId, commissionStatus: 'pending' } : item));
      syncSalesDerivedData();
    }
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  failAdminOpeningTask(id: string, reason?: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const note = reason?.trim() || '交付处理中，需继续跟进';
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'purchasing',
            failureReason: undefined,
            updatedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: '交付处理', detail: note },
            ],
          }
        : item,
    );
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  retryAdminOpeningTask(id: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    openingTasksState = openingTasksState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.deliveryOwner ? 'pending_handle' : 'pending_assign',
            failureReason: undefined,
            updatedAt: time,
            timeline: [
              ...item.timeline,
              { id: `ot-${Date.now()}`, time, title: '重新办理', detail: '已退回待处理队列，重新发起官网代购办理' },
            ],
          }
        : item,
    );
    return delay(clone(openingTasksState.find((item) => item.id === id)));
  },

  getAdminOrders() {
    normalizePendingOrderExpirations();
    return delay(clone(ordersState
      .filter((order) => !order.archivedAt)
      .map((order) => ({
        ...order,
        paymentExpiresAt: orderPaymentExpiresAt(order),
        tenantUscc: tenantsState.find((tenant) => tenant.id === order.tenantId)?.uscc ?? '',
      }))));
  },

  getAdminOrderDetail(id: string) {
    normalizePendingOrderExpirations();
    const order = ordersState.find((item) => item.id === id);
    return delay(clone(order ? { ...order, paymentExpiresAt: orderPaymentExpiresAt(order) } : undefined));
  },

  updateAdminPendingOrderPrice(id: string, payload: { amount: number; reason: string; actor?: string; role?: string }) {
    normalizePendingOrderExpirations();
    const order = ordersState.find((item) => item.id === id);
    if (!order || order.status !== 'pending') {
      return delay(undefined);
    }
    const nextAmount = Math.round(Number(payload.amount));
    const reason = payload.reason.trim();
    if (!Number.isFinite(nextAmount) || nextAmount <= 0 || nextAmount === order.amount || !reason) {
      return delay(undefined);
    }

    const adjustedAt = now().format('YYYY-MM-DD HH:mm');
    const adjustedBy = payload.actor || '官方管理员 林涛';
    const adjustedRole = payload.role || 'R1.0';
    const priceAdjustment = {
      beforeAmount: order.amount,
      afterAmount: nextAmount,
      deltaAmount: nextAmount - order.amount,
      reason,
      adjustedBy,
      adjustedRole,
      adjustedAt,
    };

    ordersState = ordersState.map((item) =>
      item.id === id
        ? {
            ...item,
            amount: nextAmount,
            priceAdjustment,
            volcReceipt: `订单待支付金额已调整为 ${money(nextAmount)}，等待客户按新金额支付`,
            timeline: [
              ...item.timeline,
              {
                id: `tl-${Date.now()}`,
                time: adjustedAt,
                title: '订单人工调价',
                detail: `${adjustedBy} 将实付金额由 ${money(order.amount)} 调整为 ${money(nextAmount)}，原因：${reason}`,
              },
            ],
          }
        : item,
    );
    recordAudit({
      actor: adjustedBy,
      role: adjustedRole,
      action: '修改未支付订单价格',
      targetType: 'order',
      targetId: id,
      tenantName: order.tenantName,
      result: 'success',
      reason: `${money(order.amount)} -> ${money(nextAmount)}；${reason}`,
    });
    createNotification({
      role: 'tenantAdmin',
      category: 'order',
      priority: 'high',
      title: '订单金额已调整',
      summary: `${order.orderType} 订单待支付金额已由 ${money(order.amount)} 调整为 ${money(nextAmount)}，请按新金额完成支付。`,
      todo: true,
      actionable: true,
      actionUrl: `/tenant/payment?orderId=${encodeURIComponent(id)}`,
      actionLabel: '去支付',
      sourceType: 'order',
      sourceId: id,
      templateTrigger: 'order.price_adjusted',
      createdAt: adjustedAt,
    });
    const nextOrder = ordersState.find((item) => item.id === id);
    return delay(clone(nextOrder ? { ...nextOrder, paymentExpiresAt: orderPaymentExpiresAt(nextOrder) } : undefined));
  },

  archiveCancelledAdminOrder(id: string) {
    const order = ordersState.find((item) => item.id === id);
    if (!order || order.status !== 'cancelled') return delay(undefined);
    const archivedAt = now().format('YYYY-MM-DD HH:mm');
    ordersState = ordersState.map((item) =>
      item.id === id
        ? {
            ...item,
            archivedAt,
            archivedBy: '官方管理员 王珊',
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time: archivedAt, title: '订单归档', detail: '已取消订单已从订单总览归档隐藏' },
            ],
          }
        : item,
    );
    recordAudit({
      actor: '官方管理员',
      role: 'R1',
      action: '归档已取消订单',
      targetType: 'order',
      targetId: id,
      tenantName: order.tenantName,
      result: 'success',
    });
    const nextOrder = ordersState.find((item) => item.id === id);
    return delay(clone(nextOrder));
  },

  getAdminBankTransferReviews() {
    return delay(clone(bankTransferReviewsState));
  },

  submitDeliveryBankTransferSerial(id: string, bankSerialNo: string) {
    const review = bankTransferReviewsState.find((item) => item.id === id);
    if (!review) return delay(undefined);
    const time = now().format('YYYY-MM-DD HH:mm');
    bankTransferReviewsState = bankTransferReviewsState.map((item) =>
      item.id === id
        ? {
            ...item,
            reviewStatus: 'pending_finance_review',
            bankSerialNo,
            deliveryReviewedAt: time,
            attempts: syncCurrentBankTransferAttempt(item, {
              reviewStatus: 'pending_finance_review',
              bankSerialNo,
              deliveryReviewedAt: time,
            }),
          }
        : item,
    );
    ordersState = ordersState.map((item) =>
      item.id === review.orderId
        ? {
            ...item,
            status: 'pending_review',
            volcReceipt: `交付已核查凭证并录入流水号 ${bankSerialNo}，等待财务最终审核`,
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '交付完成首次核查', detail: `已录入银行流水号 ${bankSerialNo}，转财务最终审核` },
            ],
          }
        : item,
    );
    recordAudit({
      actor: review.deliveryOwner,
      role: 'R2.1',
      action: '录入对公流水号',
      targetType: 'bank_transfer_review',
      targetId: id,
      tenantName: review.tenantName,
      result: 'success',
    });
    return delay(clone(bankTransferReviewsState.find((item) => item.id === id)));
  },

  approveAdminBankTransfer(
    id: string,
    payload: { receivedAmount: number; receivedAt: string; financeRemark?: string },
  ) {
    const review = bankTransferReviewsState.find((item) => item.id === id);
    if (!review) return delay(undefined);
    const order = ordersState.find((item) => item.id === review.orderId);
    if (order && isSeatOpeningOrder(order) && !openingTasksState.some((item) => item.orderId === order.id)) {
      openingTasksState = [createOpeningTaskFromOrder(order, review.tenantName, review.deliveryOwner), ...openingTasksState];
    }
    bankTransferReviewsState = bankTransferReviewsState.map((item) =>
      item.id === id
        ? {
            ...item,
            reviewStatus: 'approved',
            uploadedAmount: payload.receivedAmount,
            financeReviewedAt: now().format('YYYY-MM-DD HH:mm'),
            reviewReason: payload.financeRemark,
            attempts: syncCurrentBankTransferAttempt(item, {
              reviewStatus: 'approved',
              uploadedAmount: payload.receivedAmount,
              financeReviewedAt: now().format('YYYY-MM-DD HH:mm'),
              reviewReason: payload.financeRemark,
            }),
          }
        : item,
    );
    ordersState = ordersState.map((item) =>
      item.id === review.orderId
        ? {
            ...item,
            status: 'paid',
            paidAt: now().format('YYYY-MM-DD HH:mm'),
            volcSyncStatus: 'pending',
            volcReceipt: `财务审核通过，已回派 ${review.deliveryOwner} 处理企业组合开通`,
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time: now().format('YYYY-MM-DD HH:mm'), title: '财务审核通过', detail: `对公转账已通过，订单转 paid，并回到 ${review.deliveryOwner} 处理开通工单` },
            ],
          }
        : item,
    );
    syncSalesDerivedData();
    recordAudit({
      actor: '姚楠',
      role: 'R1.2',
      action: '通过对公审核',
      targetType: 'bank_transfer_review',
      targetId: id,
      tenantName: review.tenantName,
      result: 'success',
    });
    createNotification({
      role: 'tenantAdmin',
      category: 'review',
      priority: 'high',
      title: '对公审核已通过',
      summary: `${review.tenantName} 的付款已确认到账，订单已进入开通流程。`,
      todo: true,
      actionable: true,
      actionUrl: '/tenant/billing',
      actionLabel: '查看订单',
      sourceType: 'bank_transfer_review',
      sourceId: id,
      templateTrigger: 'order.bank_transfer.approved',
    });
    return delay(clone(bankTransferReviewsState.find((item) => item.id === id)));
  },

  rejectAdminBankTransfer(id: string, reason: string) {
    const review = bankTransferReviewsState.find((item) => item.id === id);
    if (!review) return delay(undefined);
    const time = now().format('YYYY-MM-DD HH:mm');
    bankTransferReviewsState = bankTransferReviewsState.map((item) =>
      item.id === id
        ? {
            ...item,
            reviewStatus: 'rejected',
            reviewReason: reason,
            financeReviewedAt: time,
            attempts: syncCurrentBankTransferAttempt(item, {
              reviewStatus: 'rejected',
              reviewReason: reason,
              financeReviewedAt: time,
            }),
          }
        : item,
    );
    ordersState = ordersState.map((item) =>
      item.id === review.orderId
        ? {
            ...item,
            status: 'pending',
            volcReceipt: `付款凭证被驳回：${reason}`,
            timeline: [
              ...item.timeline,
              { id: `tl-${Date.now()}`, time, title: '付款凭证被驳回', detail: '客户管理员需重新上传付款凭证' },
            ],
          }
        : item,
    );
    recordAudit({
      actor: '姚楠',
      role: 'R1.2',
      action: '驳回对公凭证',
      targetType: 'bank_transfer_review',
      targetId: id,
      tenantName: review.tenantName,
      result: 'success',
      reason,
    });
    createNotification({
      role: 'tenantAdmin',
      category: 'review',
      priority: 'high',
      title: '付款凭证被驳回',
      summary: `${review.tenantName} 的付款凭证未通过财务终审，请重新上传：${reason}`,
      todo: true,
      actionable: true,
      actionUrl: '/tenant/billing',
      actionLabel: '重新上传凭证',
      sourceType: 'bank_transfer_review',
      sourceId: id,
      templateTrigger: 'order.bank_transfer.rejected',
    });
    return delay({ success: true });
  },

  getAdminRefunds() {
    return delay(clone(refundsState));
  },

  createAdminRefund(payload: { orderId: string; tenantName: string; requestAmount: number; originalAmount: number; reason: string }) {
    const refund: AdminRefundRequest = {
      id: `rf-${Date.now()}`,
      orderId: payload.orderId,
      tenantName: payload.tenantName,
      requestAmount: payload.requestAmount,
      originalAmount: payload.originalAmount,
      reason: payload.reason,
      appliedBy: '王珊',
      appliedRole: '平台运营',
      status: 'pending',
      createdAt: now().format('YYYY-MM-DD HH:mm'),
    };
    refundsState = [refund, ...refundsState];
    recordAudit({
      actor: '王珊',
      role: 'R1.1',
      action: '创建退款单',
      targetType: 'refund_request',
      targetId: refund.id,
      tenantName: payload.tenantName,
      result: 'success',
      reason: payload.reason,
    });
    return delay(clone(refund));
  },

  approveAdminRefund(id: string) {
    let approvedRefund: AdminRefundRequest | undefined;
    refundsState = refundsState.map((item) =>
      item.id === id
        ? (approvedRefund = {
            ...item,
            status: item.requestAmount >= 100000 ? 'approved' : 'completed',
            reviewer1: item.reviewer1 ?? '姚楠 / FI-',
            reviewer2: item.requestAmount >= 100000 ? '林涛 / SU-' : item.reviewer2,
          })
        : item,
    );
    recordAudit({
      actor: '姚楠',
      role: 'R1.2',
      action: '审批退款',
      targetType: 'refund_request',
      targetId: id,
      result: 'success',
    });
    return delay(clone(refundsState.find((item) => item.id === id)));
  },

  rejectAdminRefund(id: string, reason: string) {
    refundsState = refundsState.map((item) => (item.id === id ? { ...item, status: 'rejected', rejectReason: reason } : item));
    recordAudit({
      actor: '姚楠',
      role: 'R1.2',
      action: '驳回退款',
      targetType: 'refund_request',
      targetId: id,
      result: 'success',
      reason,
    });
    return delay(clone(refundsState.find((item) => item.id === id)));
  },

  getAdminAnomalyOrders() {
    return delay(clone(anomalyOrdersState));
  },

  markAdminAnomalyHandled(id: string) {
    anomalyOrdersState = anomalyOrdersState.map((item) => (item.id === id ? { ...item, status: 'handled' } : item));
    return delay(clone(anomalyOrdersState.find((item) => item.id === id)));
  },

  getAdminSales() {
    syncSalesDerivedData();
    return delay(clone(salesState));
  },

  getSalesAdmins() {
    return delay(clone(SALES_ADMIN_ACCOUNTS));
  },

  getAdminSalesDetail(id: string) {
    syncSalesDerivedData();
    return delay(clone(getSalesById(id)));
  },

  createAdminSales(payload: Pick<AdminSalesDetail, 'employeeNo' | 'name' | 'team' | 'hiredAt' | 'region' | 'phone' | 'email' | 'baseCommissionRate'>) {
    const staffRecord: AdminStaffRecord = {
      id: `staff-${Date.now()}`,
      employeeNo: payload.employeeNo,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      roleCode: 'R3',
      team: payload.team,
      status: 'active',
      hiredAt: payload.hiredAt,
      lastLoginAt: undefined,
      mfaEnabled: true,
    };
    const record: AdminSalesDetail = {
      ...payload,
      id: `sales-${Date.now()}`,
      status: 'active',
      monthNewCustomers: 0,
      monthGmv: 0,
      monthCommission: 0,
      totalCommission: 0,
      bankAccount: {
        accountName: '',
        bankName: '',
        branchName: '',
        accountNo: '',
        status: 'not_set',
      },
      customers: [],
      performance: [],
      commissions: [],
      invites: [],
      audit: [
        { id: `saudit-${Date.now()}`, createdAt: now().format('YYYY-MM-DD HH:mm'), actor: '林涛 / SU-', action: '新建代理', target: payload.name, result: 'success' },
      ],
    };
    salesState = [record, ...salesState];
    staffState = [staffRecord, ...staffState.filter((item) => item.employeeNo !== payload.employeeNo)];
    recordAudit({
      actor: '林涛',
      role: 'R1.0',
      action: '新建代理',
      targetType: 'sales',
      targetId: record.id,
      result: 'success',
      reason: payload.name,
    });
    return delay(clone(record));
  },

  updateAdminSalesBankAccount(id: string, payload: Pick<NonNullable<AdminSalesDetail['bankAccount']>, 'accountName' | 'bankName' | 'branchName' | 'accountNo'>) {
    const accountNo = payload.accountNo.replace(/\s/g, '');
    const bankAccount: NonNullable<AdminSalesDetail['bankAccount']> = {
      accountName: payload.accountName.trim(),
      bankName: payload.bankName.trim(),
      branchName: payload.branchName.trim(),
      accountNo,
      status: 'active',
      updatedAt: now().format('YYYY-MM-DD HH:mm'),
    };
    salesState = salesState.map((item) => (item.id === id ? { ...item, bankAccount } : item));
    recordAudit({
      actor: '林涛',
      role: 'R1.0',
      action: '维护代理收款账户',
      targetType: 'sales',
      targetId: id,
      result: 'success',
      reason: `${bankAccount.bankName} ${bankAccount.branchName}`,
    });
    return delay(clone(getSalesById(id)));
  },

  leaveAdminSales(id: string, successorId: string) {
    const sales = getSalesById(id);
    const successor = getSalesById(successorId);
    tenantsState = tenantsState.map((tenant) =>
      tenant.ownerSalesId === id ? { ...tenant, ownerSalesId: successorId, ownerSales: successor.name } : tenant,
    );
    salesState = salesState.map((item) => (item.id === id ? { ...item, status: 'left' } : item));
    syncSalesDerivedData();
    recordAudit({
      actor: '林涛',
      role: 'R1.0',
      action: '标记代理离职并完成继承',
      targetType: 'sales',
      targetId: id,
      result: 'success',
      reason: `${sales.name} -> ${successor.name}`,
    });
    return delay({ salesId: id, successorId });
  },

  getAdminSalesLeaderboard() {
    return delay(
      clone(
        salesState
          .map((item) => ({
            id: item.id,
            name: item.name,
            team: item.team,
            gmv: item.monthGmv,
            commission: item.monthCommission,
            newCustomers: item.monthNewCustomers,
            renewalRate: 62 + (item.monthNewCustomers % 3) * 7,
          }))
          .sort((a, b) => b.gmv - a.gmv),
      ),
    );
  },

  getAdminSalesTransfers() {
    return delay(clone(transfersState));
  },

  approveAdminSalesTransfer(id: string) {
    const request = transfersState.find((item) => item.id === id);
    if (!request) return delay(undefined);
    transfersState = transfersState.map((item) =>
      item.id === id ? { ...item, status: 'approved', reviewer1: '王珊 / OP-', reviewer2: '林涛 / SU-' } : item,
    );
    tenantsState = tenantsState.map((tenant) =>
      tenant.name === request.tenantName ? { ...tenant, ownerSales: request.toSales, ownerSalesId: salesState.find((item) => item.name === request.toSales)?.id ?? tenant.ownerSalesId } : tenant,
    );
    syncSalesDerivedData();
    return delay(clone(transfersState.find((item) => item.id === id)));
  },

  rejectAdminSalesTransfer(id: string) {
    transfersState = transfersState.map((item) => (item.id === id ? { ...item, status: 'rejected', reviewer1: '王珊 / OP-', reviewer2: '林涛 / SU-' } : item));
    return delay(clone(transfersState.find((item) => item.id === id)));
  },

  getAdminCommissionRules() {
    return delay(clone(commissionRulesState));
  },

  createAdminCommissionRule(payload: { name: string; kind: AdminCommissionRule['kind']; rate: number; cycleMonths: number; effectiveFrom: string; effectiveTo?: string; scope: string; status?: AdminCommissionRule['status'] }) {
    const rule: AdminCommissionRule = {
      id: `rule-${Date.now()}`,
      name: payload.name,
      kind: payload.kind,
      rate: payload.rate,
      cycleMonths: payload.cycleMonths,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
      scope: payload.scope,
      status: payload.status ?? 'draft',
      createdBy: '林涛',
    };
    commissionRulesState = [rule, ...commissionRulesState];
    return delay(clone(rule));
  },

  disableAdminCommissionRule(id: string) {
    const today = now().format('YYYY-MM-DD');
    commissionRulesState = commissionRulesState.map((item) =>
      item.id === id ? { ...item, status: 'expired', effectiveTo: item.effectiveTo ?? today } : item,
    );
    return delay(clone(commissionRulesState.find((item) => item.id === id)));
  },

  updateAdminCommissionRule(id: string, patch: Partial<Pick<AdminCommissionRule, 'name' | 'kind' | 'rate' | 'cycleMonths' | 'effectiveFrom' | 'scope' | 'status'>>) {
    commissionRulesState = commissionRulesState.map((item) => (item.id === id ? { ...item, ...patch } : item));
    return delay(clone(commissionRulesState.find((item) => item.id === id)));
  },

  getAdminCommissionDashboardSummary() {
    return delay(clone(buildCommissionDashboardSummary()));
  },

  getAdminCommissionTransactions() {
    return delay(clone(commissionTransactionsState));
  },

  getAdminCommissionWithdrawRecords() {
    const rows = commissionWithdrawsState.map((withdraw) => {
      const transactions = commissionTransactionsState.filter((item) => withdraw.transactionIds.includes(item.id));
      return {
        ...withdraw,
        orderCount: transactions.length || withdraw.orderCount,
        totalAmount: transactions.length ? transactions.reduce((sum, item) => sum + item.commissionAmount, 0) : withdraw.totalAmount,
      };
    });
    return delay(clone(rows.map(enrichCommissionWithdrawRecord)));
  },

  getAdminCommissionWithdrawTransactions(id: string) {
    const withdraw = commissionWithdrawsState.find((item) => item.id === id);
    const transactions = withdraw
      ? commissionTransactionsState.filter((item) => withdraw.transactionIds.includes(item.id))
      : [];
    return delay(clone(transactions));
  },

  confirmAdminCommissionTransactions(ids: string[], basis: string, adjustment?: { id: string; commissionAmount: number; reason?: string }) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const updatedTransactions: AdminCommissionTransaction[] = [];
    const touchedBatchIds = new Set<string>();
    commissionTransactionsState = commissionTransactionsState.map((item) => {
      if (!ids.includes(item.id) || !['pending', 'disputed', 'estimated', 'invalid'].includes(item.status)) {
        return item;
      }
      const updatedItem = {
        ...item,
        status: 'withdrawable' as const,
        commissionAmount: adjustment?.id === item.id ? adjustment.commissionAmount : item.commissionAmount,
        financeReviewedAt: time,
        confirmedAt: undefined,
        confirmBasis: basis,
        adjustReason: adjustment?.id === item.id ? adjustment.reason : item.adjustReason,
        adjusted: adjustment?.id === item.id ? true : item.adjusted,
        sourceType: 'finance_reviewed' as const,
        sourceText: adjustment?.id === item.id ? '后台复核后调整金额，可提现' : '后台已复核，可提现',
      };
      if (updatedItem.batchId) {
        touchedBatchIds.add(updatedItem.batchId);
      }
      updatedTransactions.push(updatedItem);
      return updatedItem;
    });
    touchedBatchIds.forEach(syncCommissionBatchAggregate);
    updatedTransactions.forEach((item) => {
      syncOrderCommissionStatus(item);
      notifySalesCommissionPendingConfirm(item);
    });
    syncSalesDerivedData();
    return delay({ updatedCount: updatedTransactions.length });
  },

  cancelAdminCommissionTransactions(ids: string[], reason: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const cancelReason = reason.trim() || '订单退款/退订，收益取消';
    const updatedTransactions: AdminCommissionTransaction[] = [];
    const touchedBatchIds = new Set<string>();
    commissionTransactionsState = commissionTransactionsState.map((item) => {
      if (!ids.includes(item.id) || ['withdrawn', 'paid'].includes(item.status)) {
        return item;
      }
      if (item.batchId) touchedBatchIds.add(item.batchId);
      const updatedItem: AdminCommissionTransaction = {
        ...item,
        status: 'invalid',
        batchId: undefined,
        batchNo: undefined,
        adjustReason: cancelReason,
        financeReviewedAt: time,
        sourceType: 'manual_adjust',
        sourceText: `收益已取消：${cancelReason}`,
      };
      updatedTransactions.push(updatedItem);
      return updatedItem;
    });
    touchedBatchIds.forEach(syncCommissionBatchAggregate);
    updatedTransactions.forEach(syncOrderCommissionStatus);
    syncSalesDerivedData();
    return delay({ updatedCount: updatedTransactions.length });
  },

  exportAdminCommissionTransactions(ids: string[]) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const exportableItems = commissionTransactionsState.filter((item) => ids.includes(item.id) && (item.status === 'withdrawable' || item.status === 'confirmed') && !item.batchId);
    const batchId = `batch-${Date.now()}`;
    const batchNo = `PAY-${now().format('YYYYMMDD')}-${String(commissionBatchesState.length + 1).padStart(2, '0')}`;
    const payoutRows = exportableItems.map((item) => {
      const sales = salesState.find((salesItem) => salesItem.name === item.salesName);
      return {
        ...item,
        bankAccount: sales?.bankAccount,
      };
    });
    const csvContent = toCsv(
      ['打款单号', '订单号', '企业', '代理', '开户名', '开户银行', '开户支行', '银行账号', '订单金额', '打款金额', '佣金流水ID', '生成时间'],
      payoutRows.map((item) => [
        batchNo,
        item.orderId,
        item.tenantName,
        item.salesName,
        item.bankAccount?.accountName || item.salesName,
        item.bankAccount?.bankName || '',
        item.bankAccount?.branchName || '',
        item.bankAccount?.accountNo || '',
        item.orderAmount,
        item.commissionAmount,
        item.id,
        time,
      ]),
    );
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      exportableItems.some((exportable) => exportable.id === item.id)
        ? { ...item, status: 'withdrawing', batchId, batchNo, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认' }
        : item,
    );
    commissionBatchesState = [
      {
        id: batchId,
        batchNo,
        period: now().format('YYYY-MM'),
        salesCount: new Set(exportableItems.map((item) => item.salesName)).size,
        commissionCount: exportableItems.length,
        totalAmount: exportableItems.reduce((sum, item) => sum + item.commissionAmount, 0),
        status: 'exported',
        createdAt: time,
        reviewedAt: time,
        exportedAt: time,
        transactionIds: exportableItems.map((item) => item.id),
        sampledItems: [],
      },
      ...commissionBatchesState,
    ];
    return delay({ fileName: `佣金打款单_${batchNo}.csv`, batchId, batchNo, exportedCount: exportableItems.length, csvContent });
  },

  markAdminCommissionTransactionsPaid(ids: string[], payload?: { bankTransferNo?: string; bankReceiptFileName?: string }) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const touchedBatchIds = new Set<string>();
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      ids.includes(item.id) && (item.status === 'withdrawing' || (item.status === 'confirmed' && getCommissionBatchById(item.batchId)?.status === 'exported'))
        ? (item.batchId && touchedBatchIds.add(item.batchId), { ...item, status: 'withdrawn', sourceType: 'batch_paid', sourceText: '已确认打款，销售对账单已推送', paidAt: time, bankTransferNo: payload?.bankTransferNo, bankReceiptFileName: payload?.bankReceiptFileName })
        : item,
    );
    commissionBatchesState = commissionBatchesState.map((batch) => {
      if (!touchedBatchIds.has(batch.id)) return batch;
      const remainingConfirmed = commissionTransactionsState.some((item) => item.batchId === batch.id && (item.status === 'confirmed' || item.status === 'withdrawing'));
      return remainingConfirmed
        ? batch
        : { ...batch, status: 'paid', paidAt: time, bankTransferNo: payload?.bankTransferNo, bankReceiptFileName: payload?.bankReceiptFileName };
    });
    commissionTransactionsState.filter((item) => ids.includes(item.id)).forEach(syncOrderCommissionStatus);
    syncSalesDerivedData();
    return delay({ updatedCount: ids.length, bankReceiptFileName: payload?.bankReceiptFileName });
  },

  markAdminCommissionWithdrawPaid(id: string, payload?: { bankTransferNo?: string; bankReceiptFileName?: string }) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const withdraw = commissionWithdrawsState.find((item) => item.id === id);
    if (!withdraw || withdraw.status !== 'withdrawing') {
      return delay({ updatedCount: 0, bankReceiptFileName: payload?.bankReceiptFileName });
    }
    commissionWithdrawsState = commissionWithdrawsState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'withdrawn',
            paidAt: time,
            bankTransferNo: payload?.bankTransferNo,
            bankReceiptFileName: payload?.bankReceiptFileName,
          }
        : item,
    );
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      withdraw.transactionIds.includes(item.id) && item.status === 'withdrawing'
        ? {
            ...item,
            status: 'withdrawn',
            sourceType: 'batch_paid',
            sourceText: `提现流水 ${id} 已确认打款`,
            paidAt: time,
            bankTransferNo: payload?.bankTransferNo,
            bankReceiptFileName: payload?.bankReceiptFileName,
          }
        : item,
    );
    commissionTransactionsState.filter((item) => withdraw.transactionIds.includes(item.id)).forEach(syncOrderCommissionStatus);
    syncSalesDerivedData();
    return delay({ updatedCount: withdraw.transactionIds.length, bankReceiptFileName: payload?.bankReceiptFileName });
  },

  getAdminCommissionBatches() {
    return delay(clone(commissionBatchesState));
  },

  createAdminCommissionBatch() {
    const pendingItems = commissionTransactionsState.filter((item) => item.status === 'pending' && !item.batchId);
    const batchId = `batch-${Date.now()}`;
    const period = now().subtract(1, 'month').format('YYYY-MM');
    const batchNo = `CB-${now().format('YYYYMM')}-${String(commissionBatchesState.length + 1).padStart(2, '0')}`;
    const batch: AdminCommissionBatch = {
      id: batchId,
      batchNo,
      period,
      salesCount: new Set(pendingItems.map((item) => item.salesName)).size,
      commissionCount: pendingItems.length,
      totalAmount: pendingItems.reduce((sum, item) => sum + item.commissionAmount, 0),
      status: 'pending_review',
      createdAt: now().format('YYYY-MM-DD HH:mm'),
      transactionIds: pendingItems.map((item) => item.id),
      sampledItems: pendingItems.slice(0, 3).map((item, index) => ({
        id: `samp-${Date.now() + index}`,
        transactionId: item.id,
        orderId: item.orderId,
        tenantName: item.tenantName,
        salesName: item.salesName,
        orderAmount: item.orderAmount,
        amount: item.commissionAmount,
        rate: item.rate,
        sourceText: item.sourceText,
        generatedAt: item.generatedAt,
        reviewed: false,
      })),
    };
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      pendingItems.some((pendingItem) => pendingItem.id === item.id)
        ? { ...item, batchId, batchNo, sourceText: `进入 ${period} 佣金批次，待财务核准` }
        : item,
    );
    commissionBatchesState = [batch, ...commissionBatchesState];
    return delay(clone(batch));
  },

  markAdminBatchSampleReviewed(batchId: string, sampleId: string) {
    commissionBatchesState = commissionBatchesState.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            sampledItems: batch.sampledItems.map((item) => (item.id === sampleId ? { ...item, reviewed: true } : item)),
          }
        : batch,
    );
    return delay(clone(commissionBatchesState.find((item) => item.id === batchId)));
  },

  approveAdminCommissionBatch(id: string) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const batch = commissionBatchesState.find((item) => item.id === id);
    const transactionIds = batch?.transactionIds ?? [];
    const updatedTransactions: AdminCommissionTransaction[] = [];
    commissionBatchesState = commissionBatchesState.map((batch) =>
      batch.id === id ? { ...batch, status: 'approved', reviewedAt: time } : batch,
    );
    commissionTransactionsState = commissionTransactionsState.map((item) => {
      if (!transactionIds.includes(item.id) || item.status !== 'pending') {
        return item;
      }
      const updatedItem = {
        ...item,
        status: 'pending_sales_confirm' as const,
        financeReviewedAt: time,
        confirmedAt: undefined,
        sourceType: 'finance_reviewed' as const,
        sourceText: '月度批次财务核准，待代理确认',
        confirmBasis: item.confirmBasis || '月度批次审核确认',
      };
      updatedTransactions.push(updatedItem);
      return updatedItem;
    });
    updatedTransactions.forEach((item) => {
      syncOrderCommissionStatus(item);
      notifySalesCommissionPendingConfirm(item);
    });
    syncSalesDerivedData();
    return delay(clone(commissionBatchesState.find((item) => item.id === id)));
  },

  exportAdminCommissionBatch(id: string) {
    const batch = commissionBatchesState.find((item) => item.id === id);
    const transactionIds = batch?.transactionIds ?? [];
    const batchTransactions = commissionTransactionsState.filter((item) => transactionIds.includes(item.id));
    const unconfirmedCount = batchTransactions.filter((item) => item.status !== 'confirmed').length;
    if (unconfirmedCount) {
      return delay({ fileName: `打款单_${id}.csv`, blocked: true, blockedCount: unconfirmedCount });
    }
    const time = now().format('YYYY-MM-DD HH:mm');
    commissionBatchesState = commissionBatchesState.map((batch) =>
      batch.id === id ? { ...batch, status: 'exported', exportedAt: time } : batch,
    );
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      transactionIds.includes(item.id) && item.status === 'confirmed'
        ? { ...item, sourceType: 'batch_paid', sourceText: '打款单已生成，等待打款确认' }
        : item,
    );
    return delay({ fileName: `打款单_${id}.csv`, blocked: false, blockedCount: 0 });
  },

  markAdminCommissionBatchPaid(id: string, payload?: { bankTransferNo?: string; bankReceiptFileName?: string }) {
    const time = now().format('YYYY-MM-DD HH:mm');
    const batch = commissionBatchesState.find((item) => item.id === id);
    const transactionIds = batch?.transactionIds ?? [];
    const changedTransactionIds: string[] = [];
    commissionBatchesState = commissionBatchesState.map((batch) =>
      batch.id === id ? { ...batch, status: 'paid', paidAt: time, bankTransferNo: payload?.bankTransferNo, bankReceiptFileName: payload?.bankReceiptFileName } : batch,
    );
    commissionTransactionsState = commissionTransactionsState.map((item) =>
      transactionIds.includes(item.id) && item.status === 'confirmed'
        ? (changedTransactionIds.push(item.id), { ...item, status: 'paid', sourceType: 'batch_paid', sourceText: '批次打款完成，销售对账单已推送', paidAt: time, bankTransferNo: payload?.bankTransferNo })
        : item,
    );
    commissionTransactionsState.filter((item) => changedTransactionIds.includes(item.id)).forEach(syncOrderCommissionStatus);
    syncSalesDerivedData();
    return delay(clone(commissionBatchesState.find((item) => item.id === id)));
  },

  getAdminPlans() {
    return delay(clone(plansState));
  },

  createAdminPlan(payload: Omit<AdminPlanRecord, 'id' | 'createdBy'>) {
    const record: AdminPlanRecord = {
      ...payload,
      id: `plan-${Date.now()}`,
      createdBy: '王珊 / OP-',
    };
    plansState = [record, ...plansState];
    return delay(clone(record));
  },

  updateAdminPlan(id: string, patch: Partial<AdminPlanRecord>) {
    plansState = plansState.map((item) => (item.id === id ? { ...item, ...patch } : item));
    return delay(clone(plansState.find((item) => item.id === id)));
  },

  publishAdminPlan(id: string) {
    plansState = plansState.map((item) => (item.id === id ? { ...item, status: 'published' } : item));
    return delay(clone(plansState.find((item) => item.id === id)));
  },

  offlineAdminPlan(id: string) {
    plansState = plansState.map((item) => (item.id === id ? { ...item, status: 'offline' } : item));
    return delay(clone(plansState.find((item) => item.id === id)));
  },

  getAdminPlanHistory(id: string) {
    return delay(clone(planHistoryState[id] ?? []));
  },

  getAdminNews() {
    return delay(clone(newsState));
  },

  getAdminNewsDetail(id: string) {
    return delay(clone(newsState.find((item) => item.id === id)));
  },

  createAdminNews(payload: Omit<AdminNewsRecord, 'id' | 'views' | 'author' | 'updatedAt' | 'status'> & { publishMode: 'draft' | 'reviewing' | 'published' }) {
    const record: AdminNewsRecord = {
      id: `news-${Date.now()}`,
      title: payload.title,
      category: payload.category,
      tags: payload.tags,
      status: payload.publishMode === 'published' ? 'published' : payload.publishMode,
      views: 0,
      author: '王珊 / OP-',
      updatedAt: now().format('YYYY-MM-DD HH:mm'),
      summary: payload.summary,
      cover: payload.cover,
      content: payload.content,
      publishedAt: payload.publishMode === 'published' ? now().format('YYYY-MM-DD HH:mm') : undefined,
      scheduledAt: payload.scheduledAt,
    };
    newsState = [record, ...newsState];
    return delay(clone(record));
  },

  updateAdminNews(id: string, patch: Partial<AdminNewsRecord>) {
    newsState = newsState.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: now().format('YYYY-MM-DD HH:mm') } : item));
    return delay(clone(newsState.find((item) => item.id === id)));
  },

  submitAdminNewsReview(id: string) {
    newsState = newsState.map((item) => (item.id === id ? { ...item, status: 'reviewing', updatedAt: now().format('YYYY-MM-DD HH:mm') } : item));
    return delay(clone(newsState.find((item) => item.id === id)));
  },

  approveAdminNews(id: string) {
    newsState = newsState.map((item) =>
      item.id === id ? { ...item, status: 'published', publishedAt: now().format('YYYY-MM-DD HH:mm'), updatedAt: now().format('YYYY-MM-DD HH:mm') } : item,
    );
    return delay(clone(newsState.find((item) => item.id === id)));
  },

  offlineAdminNews(id: string) {
    newsState = newsState.map((item) => (item.id === id ? { ...item, status: 'offline', updatedAt: now().format('YYYY-MM-DD HH:mm') } : item));
    return delay(clone(newsState.find((item) => item.id === id)));
  },

  getAdminNewsStats(id: string): Promise<AdminNewsStats> {
    const article = newsState.find((item) => item.id === id);
    return delay({
      views: article?.views ?? 0,
      likes: Math.floor((article?.views ?? 0) * 0.08),
      consults: Math.floor((article?.views ?? 0) * 0.03),
    });
  },

  getAdminLeads() {
    notifyOverdueLeads();
    return delay(clone(externalAdminLeads()));
  },

  assignAdminLead(id: string, salesName: string) {
    const assignedAt = now().format('YYYY-MM-DD HH:mm');
    leadsState = leadsState.map((lead) =>
      lead.id === id ? { ...lead, assignedSales: salesName, assignedAt, status: 'assigned', slaHoursLeft: 24 } : lead,
    );
    const lead = leadsState.find((item) => item.id === id);
    if (lead?.opportunityType === 'customer_business_consult') {
      createNotification({
        role: 'sales',
        category: 'lead',
        priority: 'high',
        title: '咨询工单已分配',
        summary: `${lead.company} 的咨询工单已分配给你，请尽快跟进。`,
        todo: true,
        actionable: true,
        actionUrl: '/sales/leads',
        actionLabel: '进入咨询工单池',
        sourceType: 'lead',
        sourceId: id,
        templateTrigger: 'lead.assigned',
      });
    }
    return delay(clone(lead));
  },

  batchAssignAdminLeads(ids: string[], salesName: string) {
    const assignedAt = now().format('YYYY-MM-DD HH:mm');
    leadsState = leadsState.map((lead) =>
      ids.includes(lead.id) ? { ...lead, assignedSales: salesName, assignedAt, status: 'assigned', slaHoursLeft: 24 } : lead,
    );
    const assignableSalesIds = leadsState
      .filter((lead) => ids.includes(lead.id) && lead.opportunityType === 'customer_business_consult')
      .map((lead) => lead.id);
    if (assignableSalesIds.length) {
      createNotification({
        role: 'sales',
        category: 'lead',
        priority: 'high',
        title: '批量咨询工单已分配',
        summary: `${assignableSalesIds.length} 条咨询工单已分配给你，请优先处理待回复客户。`,
        todo: true,
        actionable: true,
        actionUrl: '/sales/leads',
        actionLabel: '进入咨询工单池',
        sourceType: 'lead_batch',
        sourceId: assignableSalesIds.join(','),
        templateTrigger: 'lead.assigned.batch',
      });
    }
    return delay({ count: ids.length });
  },

  getAdminLeadFunnel(): Promise<AdminLeadFunnel> {
    const visibleLeads = externalAdminLeads();
    const assignedCount = visibleLeads.filter((item) => item.status === 'assigned').length;
    const claimedCount = visibleLeads.filter((item) => item.status === 'claimed' || item.status === 'following').length;
    const convertedCount = visibleLeads.filter((item) => item.status === 'converted').length;
    return delay({
      newCount: visibleLeads.filter((item) => item.status === 'new').length,
      assignedCount,
      claimedCount,
      convertedCount,
      conversionRate: Number(((convertedCount / Math.max(visibleLeads.length, 1)) * 100).toFixed(1)),
    });
  },

  getAdminRoleMatrix() {
    return delay(clone(roleMatrixState));
  },

  updateAdminRolePermission(role: AdminRoleCode, key: string, enabled: boolean) {
    roleMatrixState = roleMatrixState.map((item) =>
      item.role === role
        ? {
            ...item,
            permissions: item.permissions.map((permission) => (permission.key === key ? { ...permission, enabled } : permission)),
          }
        : item,
    );
    return delay(clone(roleMatrixState.find((item) => item.role === role)));
  },

  getAdminDictionaries() {
    return delay(clone(dictionariesState));
  },

  addAdminDictionaryItem(code: string, payload: { label: string; value: string }) {
    dictionariesState = dictionariesState.map((dictionary) =>
      dictionary.code === code
        ? {
            ...dictionary,
            items: [
              ...dictionary.items,
              {
                id: `dic-${Date.now()}`,
                label: payload.label,
                value: payload.value,
                enabled: true,
                order: dictionary.items.length + 1,
              },
            ],
          }
        : dictionary,
    );
    return delay(clone(dictionariesState.find((item) => item.code === code)));
  },

  toggleAdminDictionaryItem(code: string, itemId: string) {
    dictionariesState = dictionariesState.map((dictionary) =>
      dictionary.code === code
        ? {
            ...dictionary,
            items: dictionary.items.map((item) => (item.id === itemId ? { ...item, enabled: !item.enabled } : item)),
          }
        : dictionary,
    );
    return delay(clone(dictionariesState.find((item) => item.code === code)));
  },

  getAdminNotifyTemplates() {
    return delay(clone(notifyTemplatesState));
  },

  updateAdminNotifyTemplate(id: string, patch: Partial<AdminNotifyTemplate>) {
    notifyTemplatesState = notifyTemplatesState.map((item) => (item.id === id ? { ...item, ...patch } : item));
    const updated = notifyTemplatesState.find((item) => item.id === id);
    if (updated) {
      createNotification({
        role: 'platformAdmin',
        category: 'system',
        priority: 'low',
        title: '通知模板已更新',
        summary: `${updated.name} 已保存，建议抽查模板变量与触发场景。`,
        todo: false,
        actionable: true,
        actionUrl: '/admin/notifications',
        actionLabel: '查看通知',
        sourceType: 'notify_template',
        sourceId: id,
        templateTrigger: 'notify_template.updated',
      });
    }
    return delay(clone(updated));
  },

  getAdminSystemParams() {
    return delay(clone(systemParamsState));
  },

  updateAdminSystemParam(key: string, value: string) {
    systemParamsState = systemParamsState.map((item) => (item.key === key ? { ...item, value, updatedAt: now().format('YYYY-MM-DD HH:mm') } : item));
    return delay(clone(systemParamsState.find((item) => item.key === key)));
  },

  getAdminGlobalAudit() {
    return delay(clone(auditsState));
  },

  getAdminStaff() {
    return delay(clone(staffState));
  },

  createAdminStaff(payload: Omit<AdminStaffRecord, 'id' | 'lastLoginAt' | 'status'>) {
    const record: AdminStaffRecord = {
      ...payload,
      accountId: payload.accountId ?? `acct-${payload.phone}`,
      defaultRole: payload.defaultRole ?? !staffState.some((item) => item.phone === payload.phone && item.status === 'active'),
      id: `staff-${Date.now()}`,
      status: 'active',
      lastLoginAt: undefined,
    };
    staffState = [record, ...staffState];
    return delay(clone(record));
  },

  upsertAdminStaffAccount(payload: Omit<AdminStaffRecord, 'id' | 'roleCode' | 'defaultRole' | 'lastLoginAt' | 'status'> & {
    id?: string;
    bindings?: AdminStaffRecord[];
    roleCodes: AdminStaffRecord['roleCode'][];
    defaultRoleCode: AdminStaffRecord['roleCode'];
    status?: AdminStaffRecord['status'];
    lastLoginAt?: string;
    temporaryPassword?: string;
    salesCommissionRuleId?: string;
    salesBaseCommissionRate?: number;
  }) {
    const accountId = payload.accountId ?? payload.bindings?.[0]?.accountId ?? `acct-${payload.phone}`;
    const isNewAccount = !payload.bindings?.length;
    const existingBindings = payload.bindings?.length
      ? payload.bindings
      : staffState.filter((item) => (item.accountId || item.phone) === accountId || item.phone === payload.phone);
    const existingByRole = new Map(existingBindings.map((item) => [item.roleCode, item]));
    const status = payload.status ?? existingBindings[0]?.status ?? 'active';
    const lastLoginAt = payload.lastLoginAt ?? existingBindings[0]?.lastLoginAt;
    const nextBindings = payload.roleCodes.map((roleCode) => {
      const existing = existingByRole.get(roleCode);
      return {
        ...(existing || {}),
        id: existing?.id ?? `staff-${Date.now()}-${roleCode}`,
        accountId,
        employeeNo: payload.employeeNo,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        roleCode,
        defaultRole: roleCode === payload.defaultRoleCode,
        status,
        hiredAt: payload.hiredAt,
        lastLoginAt,
        mfaEnabled: payload.mfaEnabled ?? existing?.mfaEnabled ?? true,
      } as AdminStaffRecord;
    });
    const existingIds = new Set(existingBindings.map((item) => item.id));
    staffState = [...nextBindings, ...staffState.filter((item) => !existingIds.has(item.id))];
    if (payload.roleCodes.includes('R3')) {
      const existingSales = salesState.find((item) => item.employeeNo === payload.employeeNo || item.phone === payload.phone || item.name === payload.name);
      const baseCommissionRate = payload.salesBaseCommissionRate ?? defaultCommissionRate();
      const nextSales: AdminSalesDetail = {
        ...(existingSales || {
          id: `sales-${Date.now()}`,
          status: 'active' as const,
          monthNewCustomers: 0,
          monthGmv: 0,
          monthCommission: 0,
          totalCommission: 0,
          bankAccount: {
            accountName: '',
            bankName: '',
            branchName: '',
            accountNo: '',
            status: 'not_set' as const,
          },
          customers: [],
          performance: [],
          commissions: [],
          invites: [],
          audit: [],
        }),
        employeeNo: payload.employeeNo,
        name: payload.name,
        team: payload.team || existingSales?.team || '销售组',
        hiredAt: payload.hiredAt,
        region: existingSales?.region || '未设置',
        phone: payload.phone,
        email: payload.email,
        baseCommissionRate,
        status: payload.status === 'left' ? 'left' : 'active',
        audit: [
          { id: `saudit-${Date.now()}`, createdAt: now().format('YYYY-MM-DD HH:mm'), actor: '林涛 / SU-', action: existingSales ? '同步销售账号' : '新建销售账号', target: payload.name, result: 'success' },
          ...(existingSales?.audit || []),
        ],
      };
      salesState = existingSales
        ? salesState.map((item) => (item.id === existingSales.id ? nextSales : item))
        : [nextSales, ...salesState];
      syncSalesDerivedData();
    }
    return delay({
      items: clone(nextBindings),
      temporaryPassword: isNewAccount ? payload.temporaryPassword || generateTemporaryPassword() : undefined,
    });
  },

  updateAdminStaff(id: string, patch: Partial<AdminStaffRecord>) {
    staffState = staffState.map((item) => (item.id === id ? { ...item, ...patch } : item));
    return delay(clone(staffState.find((item) => item.id === id)));
  },

  freezeAdminStaff(id: string) {
    staffState = staffState.map((item) => (item.id === id ? { ...item, status: 'frozen' } : item));
    return delay(clone(staffState.find((item) => item.id === id)));
  },

  leaveAdminStaff(id: string) {
    staffState = staffState.map((item) => (item.id === id ? { ...item, status: 'left' } : item));
    return delay(clone(staffState.find((item) => item.id === id)));
  },

  previewAdminStaffInheritance(accountId: string, assignments: AdminStaffInheritanceRoleAssignment[]) {
    return delay(clone(buildAdminStaffInheritancePreview(accountId, assignments)));
  },

  executeAdminStaffInheritance(payload: AdminStaffInheritancePayload) {
    return delay(clone(applyAdminStaffInheritance(payload)));
  },

  resetAdminStaffPassword(id: string, temporaryPassword?: string) {
    void id;
    return delay({ success: true, temporaryPassword: temporaryPassword || generateTemporaryPassword() });
  },

  getAdminMonitoringHealth() {
    return delay(clone(monitoringHealthState));
  },

  getAdminMonitoringApiStats() {
    return delay(
      Array.from({ length: 7 }).map((_, index) => ({
        time: now().subtract(6 - index, 'hour').format('HH:mm'),
        qps: 420 + index * 12,
        p95: 1200 + (index % 3) * 180,
        errorRate: 0.6 + (index % 2) * 0.4,
      })),
    );
  },

  getAdminMonitoringVolcApiStats() {
    return delay(
      Array.from({ length: 7 }).map((_, index) => ({
        time: now().subtract(6 - index, 'hour').format('HH:mm'),
        successRate: 99.6 - (index % 3) * 0.2,
        p95: 260 + index * 18,
      })),
    );
  },

  getAdminAlertRules() {
    return delay(clone(alertRulesState));
  },

  updateAdminAlertRule(id: string, patch: Partial<AdminAlertRule>) {
    alertRulesState = alertRulesState.map((item) => (item.id === id ? { ...item, ...patch } : item));
    return delay(clone(alertRulesState.find((item) => item.id === id)));
  },
};
