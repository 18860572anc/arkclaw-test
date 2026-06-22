import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  DatePicker,
  Empty,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Upload,
} from '@arco-design/web-react';
import {
  IconDownload,
  IconEdit,
  IconFilePdf,
  IconInfoCircle,
  IconLeft,
  IconLink,
  IconPlus,
  IconRefresh,
  IconSafe,
  IconSettings,
  IconUpload,
  IconUser,
} from '@arco-design/web-react/icon';
import type { UploadItem } from '@arco-design/web-react/es/Upload';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MetricCard from '../../components/MetricCard';
import OpeningProgressPanel, { normalizeOpeningProgressStatus } from '../../components/OpeningProgressPanel';
import { mockApi } from '../../services/mockApi';
import { couponBenefitTypeLabel, isDiscountCoupon, isVoucherCoupon } from '../../utils/couponDisplay';
import { orderBundleDetailLines, orderSummaryLabel } from '../../utils/orderDisplay';
import type {
  AdminAlertRule,
  AdminBankTransferReviewItem,
  AdminCommissionBatch,
  AdminCommissionDashboardSummary,
  AdminCommissionRule,
  AdminCommissionTransaction,
  AdminCommissionWithdrawRecord,
  AdminDashboardSummary,
  AdminDictionaryRecord,
  AdminLeadRecord,
  AdminLeadStatus,
  AdminAgentTenantDetail,
  AdminAgentTenantListItem,
  AdminAgentTenantStatus,
  AdminAgentTenantUpsertPayload,
  AdminNewsRecord,
  AdminNewsStatus,
  AdminOpeningTaskRecord,
  AdminOpeningTaskStatus,
  AdminPlanRecord,
  AdminRefundRequest,
  AdminRoleCode,
  AdminSalesDetail,
  AdminSalesListItem,
  AdminSalesTransferRequest,
  SalesBankAccount,
  AdminStaffInheritancePreview,
  AdminStaffRecord,
  AdminTenantDetail,
  AdminTenantListItem,
  AdminTenantStatus,
  AgentWebsiteConfig,
  AgentBalanceDashboardSummary,
  AgentBalanceLedgerQuery,
  AgentBalanceLedgerRecord,
  AgentBalanceLedgerType,
  AgentBalancePaymentMethod,
  AgentBalanceSummary,
  AgentProcurementOrderRecord,
  AgentProcurementPaymentMethod,
  BillingContractDraft,
  BillingContractRecord,
  BillingContractStatus,
  BillingContractType,
  BillingInvoiceDraft,
  BillingInvoiceRecord,
  CouponBenefitType,
  CouponRecord,
  CouponDiscountScope,
  CouponStatus,
  CouponUsageRecord,
  SalesAdminAccount,
  SalesCommissionStatus,
} from '../../types/domain';

const { Title, Text } = Typography;
const { Row, Col } = Grid;
const TabPane = Tabs.TabPane;
const agentTopupAmountOptions = [10000, 50000, 100000, 200000] as const;
type AgentTopupAmountMode = (typeof agentTopupAmountOptions)[number] | 'custom';
type AgentTopupStep = 'amount' | 'payment';

const money = (value: number) => `¥${value.toLocaleString()}`;
const downloadTextFile = (fileName: string, content: string, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
const compactMoney = (value: number) => {
  if (Math.abs(value) >= 10000) return `¥${(value / 10000).toFixed(1)}万`;
  return money(value);
};
const paymentMethodLabel = (value: string) =>
  value === 'bank_transfer' ? '对公转账' : value === 'wechat' ? '微信' : value === 'alipay' ? '支付宝' : value;
const escapeSvgText = (value: string | number | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildBankTransferProofPreview = (row: AdminBankTransferReviewItem) => {
  const items = [
    ['企业', row.tenantName],
    ['订单号', row.orderId],
    ['凭证文件', row.proofName],
    ['转账金额', money(row.uploadedAmount)],
    ['上传时间', row.uploadedAt],
  ];

  const rows = items
    .map(
      ([label, value], index) => `
        <text x="44" y="${136 + index * 56}" font-size="18" fill="#86909c">${escapeSvgText(label)}</text>
        <text x="220" y="${136 + index * 56}" font-size="20" fill="#1d2129">${escapeSvgText(value)}</text>
      `,
    )
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="920" height="620" viewBox="0 0 920 620">
      <rect width="920" height="620" rx="20" fill="#f7f8fa" />
      <rect x="24" y="24" width="872" height="572" rx="18" fill="#ffffff" stroke="#e5e8ef" />
      <rect x="44" y="44" width="832" height="68" rx="12" fill="#eef4ff" />
      <text x="72" y="86" font-size="28" font-weight="700" fill="#165dff">付款凭证预览</text>
      <text x="694" y="86" font-size="18" fill="#4e5969">模拟 PNG 视图</text>
      ${rows}
      <rect x="44" y="448" width="832" height="128" rx="14" fill="#fff7e8" stroke="#ffe7ba" />
      <text x="72" y="492" font-size="18" fill="#ad6800">银行流水号需以实际凭证为准</text>
      <text x="72" y="532" font-size="20" font-weight="700" fill="#1d2129">${escapeSvgText(row.bankSerialNo || '当前尚未录入银行流水号')}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const adminConsoleRoot = (pathname: string) => {
  if (pathname.startsWith('/agent/admin')) return '/agent/admin';
  if (pathname.startsWith('/agent/finance')) return '/agent/finance';
  if (pathname.startsWith('/ops-admin')) return '/ops-admin';
  if (pathname.startsWith('/ops')) return '/ops';
  if (pathname.startsWith('/finance')) return '/finance';
  return '/admin';
};
const adminConsolePath = (pathname: string, suffix = '') => `${adminConsoleRoot(pathname)}${suffix}`;

const tenantStatusMeta: Record<AdminTenantStatus, { color: string; text: string }> = {
  not_opened: { color: 'gold', text: '未开通' },
  active: { color: 'green', text: '正常' },
  suspended: { color: 'orangered', text: '已暂停' },
  closed: { color: 'gray', text: '已关闭' },
};

const agentTenantStatusMeta: Record<AdminAgentTenantStatus, { color: string; text: string }> = {
  active: { color: 'green', text: '运营中' },
  pending_setup: { color: 'orange', text: '待配置' },
  suspended: { color: 'orangered', text: '已暂停' },
};

const agentWebsiteStatusMeta: Record<AdminAgentTenantDetail['websiteStatus'], { color: string; text: string }> = {
  configured: { color: 'green', text: '已配置' },
  draft: { color: 'orange', text: '草稿中' },
  not_configured: { color: 'gray', text: '未开通' },
};

const agentStaffRoleLabel: Record<AdminAgentTenantDetail['staff'][number]['role'], string> = {
  agentAdmin: '超级管理员（代理）',
  agentSales: '代理销售',
  agentFinance: '代理财务',
};

const tenantBindingStatusMeta: Record<AdminTenantDetail['bindings'][number]['status'], { color: string; text: string }> = {
  active: { color: 'green', text: '正常' },
  pending: { color: 'orange', text: '待处理' },
  broken: { color: 'red', text: '异常' },
  unconfigured: { color: 'gray', text: '未配置' },
};

const tenantBindingTestMeta: Record<NonNullable<AdminTenantDetail['bindings'][number]['lastTestResult']>, { color: string; text: string }> = {
  pass: { color: 'green', text: '通过' },
  fail: { color: 'red', text: '失败' },
  untested: { color: 'gray', text: '未测试' },
};

const paymentStatusMeta = {
  pending: { color: 'gray', text: '待支付' },
  pending_review: { color: 'orange', text: '待审核' },
  paid: { color: 'green', text: '已支付' },
  refunded: { color: 'red', text: '已退款' },
  cancelled: { color: 'gray', text: '已取消' },
} as const;

const ADMIN_MOCK_NOW = dayjs('2026-05-15 10:00');
const adminPaymentDeadlineText = (order: { status: string; paymentExpiresAt?: string; paymentExpiredAt?: string }) => {
  if (order.status === 'cancelled' && order.paymentExpiredAt) return '支付超时取消';
  if (order.status !== 'pending' || !order.paymentExpiresAt) return '-';
  const minutes = dayjs(order.paymentExpiresAt).diff(ADMIN_MOCK_NOW, 'minute');
  if (minutes <= 0) return '已超时';
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${order.paymentExpiresAt}（剩余 ${hours}小时${restMinutes ? `${restMinutes}分钟` : ''}）`;
};
const priceAdjustmentText = (adjustment?: {
  beforeAmount: number;
  afterAmount: number;
  deltaAmount: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}) => {
  if (!adjustment) return '-';
  const deltaText = `${adjustment.deltaAmount > 0 ? '+' : adjustment.deltaAmount < 0 ? '-' : ''}${money(Math.abs(adjustment.deltaAmount))}`;
  return `${money(adjustment.beforeAmount)} → ${money(adjustment.afterAmount)}（${deltaText}） / ${adjustment.adjustedBy} / ${adjustment.adjustedAt} / ${adjustment.reason}`;
};

const couponStatusMeta: Record<CouponStatus, { color: string; text: string }> = {
  pending: { color: 'gray', text: '待生效' },
  active: { color: 'arcoblue', text: '生效中' },
  used: { color: 'gray', text: '已使用' },
  exhausted: { color: 'gray', text: '已用完' },
  expired: { color: 'orange', text: '已过期' },
  disabled: { color: 'red', text: '已作废' },
};

type CouponTemplateStatus = 'enabled' | 'disabled' | 'deleted';

interface CouponTemplateRecord {
  id: string;
  templateId: string;
  benefitType: CouponBenefitType;
  name: string;
  fixedName: string;
  ruleSummary: string;
  discountScope: CouponDiscountScope;
  discountRate: number;
  defaultQuota: number;
  defaultBenefit: string;
  defaultValidDays: number;
  defaultValidity: string;
  status: CouponTemplateStatus;
  createdBy: string;
  createdAt: string;
  remark: string;
}

const couponTemplateStatusMeta: Record<CouponTemplateStatus, { color: string; text: string }> = {
  enabled: { color: 'green', text: '启用中' },
  disabled: { color: 'orange', text: '已暂停' },
  deleted: { color: 'red', text: '已删除' },
};

const OTHER_COUPON_TEMPLATE_ID = 'tpl-custom-other';

const couponTemplateRows: CouponTemplateRecord[] = [
  {
    id: 'tpl-trial-7d',
    templateId: 'tpl-trial-7d',
    benefitType: 'voucher',
    name: '体验代金券模板',
    fixedName: '体验代金券',
    ruleSummary: '订单金额 100% 抵扣，默认体验 7 天，累计抵扣不超过额度',
    discountScope: 'order',
    discountRate: 0,
    defaultQuota: 10000,
    defaultBenefit: '100% 抵扣 / 0 元体验 1 周',
    defaultValidDays: 7,
    defaultValidity: '发放后 7 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:00',
    remark: '用于降低客户首次体验门槛，不参与订单折扣计算。',
  },
  {
    id: 'tpl-order-70',
    templateId: 'tpl-order-70',
    benefitType: 'voucher',
    name: '整单 7 折代金券模板',
    fixedName: '整单 7 折代金券',
    ruleSummary: '订单按 70% 折扣结算，差额计入代金券抵扣',
    discountScope: 'order',
    discountRate: 70,
    defaultQuota: 30000,
    defaultBenefit: '7 折',
    defaultValidDays: 90,
    defaultValidity: '发放后 90 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:15',
    remark: '适合中高金额订单，发放前需记录商务审批依据。',
  },
  {
    id: 'tpl-order-80',
    templateId: 'tpl-order-80',
    benefitType: 'voucher',
    name: '席位 8 折代金券模板',
    fixedName: '席位 8 折代金券',
    ruleSummary: '订单按 80% 折扣结算，差额计入代金券抵扣',
    discountScope: 'seat',
    discountRate: 80,
    defaultQuota: 20000,
    defaultBenefit: '8 折',
    defaultValidDays: 60,
    defaultValidity: '发放后 60 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:20',
    remark: '适合常规促销和扩容场景，可作为默认折扣类型。',
  },
  {
    id: OTHER_COUPON_TEMPLATE_ID,
    templateId: OTHER_COUPON_TEMPLATE_ID,
    benefitType: 'voucher',
    name: '其他代金券模板',
    fixedName: '其他代金券',
    ruleSummary: '按发放时填写的折扣规则抵扣，累计抵扣不超过额度',
    discountScope: 'order',
    discountRate: 80,
    defaultQuota: 10000,
    defaultBenefit: '8 折（发放时可调）',
    defaultValidDays: 30,
    defaultValidity: '发放后 30 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:30',
    remark: '用于临时商务政策，发放时可调整折扣规则。',
  },
  {
    id: 'tpl-coupon-order-70',
    templateId: 'tpl-coupon-order-70',
    benefitType: 'coupon',
    name: '整单 7 折优惠券模板',
    fixedName: '整单 7 折优惠券',
    ruleSummary: '订单按 70% 折扣结算，优惠券不设额度，单次使用后失效',
    discountScope: 'order',
    discountRate: 70,
    defaultQuota: 0,
    defaultBenefit: '7 折 / 不设额度',
    defaultValidDays: 30,
    defaultValidity: '发放后 30 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:35',
    remark: '适合客户首单转化，按张发放。',
  },
  {
    id: 'tpl-coupon-seat-80',
    templateId: 'tpl-coupon-seat-80',
    benefitType: 'coupon',
    name: '席位 8 折优惠券模板',
    fixedName: '席位 8 折优惠券',
    ruleSummary: '席位类套餐按 80% 折扣结算，优惠券不设额度，单次使用后失效',
    discountScope: 'seat',
    discountRate: 80,
    defaultQuota: 0,
    defaultBenefit: '8 折 / 不设额度',
    defaultValidDays: 60,
    defaultValidity: '发放后 60 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:40',
    remark: '适合席位套餐促销。',
  },
  {
    id: 'tpl-coupon-coding-plan-80',
    templateId: 'tpl-coupon-coding-plan-80',
    benefitType: 'coupon',
    name: 'CodingPlan 8 折优惠券模板',
    fixedName: 'CodingPlan 8 折优惠券',
    ruleSummary: 'CodingPlan 按 80% 折扣结算，优惠券不设额度，单次使用后失效',
    discountScope: 'coding_plan',
    discountRate: 80,
    defaultQuota: 0,
    defaultBenefit: '8 折 / 不设额度',
    defaultValidDays: 60,
    defaultValidity: '发放后 60 天内有效',
    status: 'enabled',
    createdBy: '王珊',
    createdAt: '2026-05-13 10:45',
    remark: '适合 CodingPlan 促销。',
  },
];

interface CouponIssueDraft {
  benefitType: CouponBenefitType;
  targetKind: 'tenant' | 'salesAdmin' | 'sales';
  tenantIds: string[];
  salesAdminIds: string[];
  salesIds: string[];
  templateId: string;
  name: string;
  discountScope: CouponDiscountScope;
  discountRate?: number;
  thresholdAmount: number;
  totalDiscountQuota: number;
  issueQuantity: number;
  effectiveAt: string;
  expiresAt: string;
  remark: string;
}

interface CouponTemplateDraft {
  benefitType: CouponBenefitType;
  name: string;
  discountScope: CouponDiscountScope;
  discountRate: number;
  defaultQuota: number;
  defaultValidDays: number;
  ruleSummary: string;
  remark: string;
}

const todayText = dayjs().format('YYYY-MM-DD');
const getCouponTemplateById = (templateId: string) => couponTemplateRows.find((item) => item.templateId === templateId);
const getEnabledCouponTemplateRowsByType = (benefitType: CouponBenefitType, templates = couponTemplateRows) =>
  templates.filter((item) => item.status === 'enabled' && item.benefitType === benefitType);
const isOtherCouponTemplate = (template?: CouponTemplateRecord) => template?.templateId === OTHER_COUPON_TEMPLATE_ID;
const couponDiscountRuleLabel = (discountRate: number) => (discountRate === 0 ? '100% 抵扣' : `${discountRate}% 折扣`);
const couponDiscountScopeLabel = (scope: CouponDiscountScope = 'order') =>
  scope === 'seat' ? '席位' : scope === 'coding_plan' ? 'CodingPlan' : '整单';
const couponRuleWithThresholdLabel = (coupon: Pick<CouponRecord, 'discountRate' | 'thresholdRule' | 'discountScope'>) =>
  `${couponDiscountScopeLabel(coupon.discountScope)} · ${couponDiscountRuleLabel(coupon.discountRate)} · ${coupon.thresholdRule ?? '满 ¥0.00 可用'}`;
const couponQuotaLabel = (coupon: CouponRecord) => (isVoucherCoupon(coupon) ? money(coupon.totalDiscountQuota) : '不设额度');
const couponUsedLabel = (coupon: CouponRecord) => (isVoucherCoupon(coupon) ? money(coupon.usedDiscountQuota) : coupon.status === 'used' ? '已使用' : '未使用');
const couponRemainingLabel = (coupon: CouponRecord) => (isVoucherCoupon(coupon) ? money(coupon.remainingDiscountQuota) : '单次使用');
const couponTemplateRuleLabel = (template?: CouponTemplateRecord) => {
  if (!template) return '-';
  const discountText = template.discountRate === 0 ? '100% 抵扣 / 0 元体验 1 周' : `${template.discountRate}% 折扣`;
  return `${couponDiscountScopeLabel(template.discountScope)} · ${discountText}`;
};
const couponTemplateBenefitLabel = (discountRate: number) => (discountRate === 0 ? '100% 抵扣 / 0 元体验 1 周' : `${discountRate / 10} 折`);
const couponTemplateTypeLabel = (benefitType: CouponBenefitType) => (benefitType === 'coupon' ? '优惠券模板' : '代金券模板');
const couponTemplateDefaultBenefitLabel = (template: Pick<CouponTemplateRecord, 'benefitType' | 'discountRate' | 'defaultQuota'>) =>
  template.benefitType === 'coupon'
    ? `${couponTemplateBenefitLabel(template.discountRate)} / 不设额度`
    : `${couponTemplateBenefitLabel(template.discountRate)} / ${money(template.defaultQuota)}`;
const couponTemplateValidityLabel = (days: number) => `发放后 ${days} 天内有效`;
const couponThresholdRuleLabel = (amount: number) => `满 ${money(amount)} 可用`;
const calculateCouponIssuePreviewDiscount = (draft: Pick<CouponIssueDraft, 'benefitType' | 'discountRate' | 'totalDiscountQuota'>, amount = 10000) => {
  if (draft.discountRate === undefined) return 0;
  const theoreticalDiscount = Math.round(amount * (100 - draft.discountRate) / 100);
  return draft.benefitType === 'coupon'
    ? Math.min(theoreticalDiscount, amount)
    : Math.min(theoreticalDiscount, draft.totalDiscountQuota, amount);
};
const couponBenefitTypeText = (benefitType: CouponBenefitType) => (benefitType === 'coupon' ? '优惠券' : '代金券');
const withCouponBenefitType = (
  draft: CouponIssueDraft,
  benefitType: CouponBenefitType,
  templates = couponTemplateRows,
): CouponIssueDraft => {
  const template = templates.find((item) => item.templateId === draft.templateId);
  const hasMismatchedTemplate = template && template.benefitType !== benefitType;
  const baseDraft = hasMismatchedTemplate ? applyCouponTemplateToDraft(draft, '', templates) : draft;
  if (benefitType === 'coupon') {
    return {
      ...baseDraft,
      benefitType,
      totalDiscountQuota: 0,
      issueQuantity: baseDraft.issueQuantity > 0 ? baseDraft.issueQuantity : 1,
    };
  }
  return {
    ...baseDraft,
    benefitType,
    totalDiscountQuota: baseDraft.totalDiscountQuota > 0 ? baseDraft.totalDiscountQuota : template?.defaultQuota ?? 0,
  };
};
const withCouponIssueTargetKind = (
  draft: CouponIssueDraft,
  targetKind: CouponIssueDraft['targetKind'],
  templates = couponTemplateRows,
): CouponIssueDraft => {
  const benefitType = targetKind === 'tenant' ? draft.benefitType : 'coupon';
  const nextDraft = {
    ...draft,
    targetKind,
    benefitType,
    tenantIds: targetKind === 'tenant' ? draft.tenantIds : [],
    salesAdminIds: targetKind === 'salesAdmin' ? draft.salesAdminIds : [],
    salesIds: targetKind === 'sales' ? draft.salesIds : [],
  };
  return withCouponBenefitType(nextDraft, benefitType, templates);
};
const getTenantPickerAvatarText = (name: string) => name.trim().slice(0, 1) || '企';
const createCouponTemplateDraft = (benefitType: CouponBenefitType = 'coupon'): CouponTemplateDraft => ({
  benefitType,
  name: '',
  discountScope: 'order',
  discountRate: 80,
  defaultQuota: benefitType === 'voucher' ? 20000 : 0,
  defaultValidDays: 60,
  ruleSummary: '',
  remark: '',
});
const templateToDraft = (template: CouponTemplateRecord): CouponTemplateDraft => ({
  benefitType: template.benefitType,
  name: template.name,
  discountScope: template.discountScope,
  discountRate: template.discountRate,
  defaultQuota: template.defaultQuota,
  defaultValidDays: template.defaultValidDays,
  ruleSummary: template.ruleSummary,
  remark: template.remark,
});
const createCouponIssueDraft = (tenantIds: string[] = []): CouponIssueDraft => ({
  benefitType: 'coupon',
  targetKind: 'tenant',
  tenantIds,
  salesAdminIds: [],
  salesIds: [],
  templateId: '',
  name: '',
  discountScope: 'order',
  discountRate: undefined,
  thresholdAmount: 0,
  totalDiscountQuota: 0,
  issueQuantity: 1,
  effectiveAt: todayText,
  expiresAt: '',
  remark: '',
});
const applyCouponTemplateToDraft = (draft: CouponIssueDraft, templateId: string, templates = couponTemplateRows): CouponIssueDraft => {
  const template = templates.find((item) => item.templateId === templateId);
  if (!template || template.benefitType !== draft.benefitType) {
    return {
      ...draft,
      templateId: '',
      name: '',
      discountRate: undefined,
      discountScope: 'order',
      thresholdAmount: 0,
      totalDiscountQuota: 0,
      issueQuantity: 1,
      expiresAt: '',
      remark: '',
    };
  }
  const effectiveAt = draft.effectiveAt || todayText;
  return {
    ...draft,
    benefitType: template.benefitType,
    templateId,
    name: template.fixedName,
    discountRate: template.discountRate,
    discountScope: template.discountScope,
    thresholdAmount: 0,
    totalDiscountQuota: draft.benefitType === 'voucher' ? template.defaultQuota : 0,
    effectiveAt,
    expiresAt: dayjs(effectiveAt).add(template.defaultValidDays, 'day').format('YYYY-MM-DD'),
    remark: `按「${template.fixedName}」模板发放：${template.ruleSummary}`,
  };
};

type AdminOrderInvoiceFilter = 'all' | 'none' | 'invoiceable' | 'not_invoiceable' | BillingInvoiceRecord['status'];

const refundStatusMeta = {
  pending: { color: 'orange', text: '待审批' },
  approved: { color: 'arcoblue', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
  processing: { color: 'arcoblue', text: '处理中' },
  completed: { color: 'green', text: '已完成' },
  failed: { color: 'red', text: '失败' },
} as const;

const bankReviewStatusMeta = {
  pending_delivery_review: { color: 'gold', text: '待交付核查' },
  pending_finance_review: { color: 'orange', text: '待财务审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
} as const;

const openingTaskStatusMeta: Record<AdminOpeningTaskStatus, { color: string; text: string }> = {
  pending_assign: { color: 'purple', text: '交付处理中' },
  pending_handle: { color: 'purple', text: '交付处理中' },
  purchasing: { color: 'purple', text: '交付处理中' },
  waiting_confirm: { color: 'purple', text: '交付处理中' },
  completed: { color: 'green', text: '已开通' },
  failed: { color: 'purple', text: '交付处理中' },
  cancelled: { color: 'gray', text: '已取消' },
};

const contractTypeMeta: Record<BillingContractType, string> = {
  quote: '产品报价合同',
  order: '订单合同',
};

const contractStatusMeta: Record<BillingContractStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待生效' },
  active: { color: 'green', text: '已生效' },
  expired: { color: 'gray', text: '已过期' },
  voided: { color: 'red', text: '已作废' },
};

const adminSeatLevelMeta: Record<AdminTenantDetail['plans'][number]['level'], { label: string; codingPlan?: string }> = {
  lite: { label: '轻量版', codingPlan: 'CodingPlan Team Lite' },
  standard: { label: '标准版', codingPlan: 'CodingPlan Team Lite' },
  pro: { label: '高级版', codingPlan: 'CodingPlan Team Pro' },
  ultimate: { label: '旗舰版', codingPlan: 'CodingPlan Team Pro' },
};

const salesStatusMeta = {
  active: { color: 'green', text: '在职' },
  left: { color: 'gray', text: '离职' },
} as const;

const commissionStatusMeta: Record<SalesCommissionStatus, { color: string; text: string }> = {
  estimated: { color: 'gold', text: '收益待释放' },
  withdrawable: { color: 'arcoblue', text: '可提现' },
  withdrawing: { color: 'orange', text: '提现处理中' },
  withdrawn: { color: 'green', text: '已到账' },
  invalid: { color: 'gray', text: '收益已取消' },
  pending: { color: 'orange', text: '待佣金核准' },
  pending_sales_confirm: { color: 'orangered', text: '待代理确认' },
  disputed: { color: 'red', text: '代理有异议' },
  confirmed: { color: 'arcoblue', text: '待生成打款单' },
  paid: { color: 'green', text: '已打款' },
};

const getCommissionFlowMeta = (row: AdminCommissionTransaction, batchStatus?: AdminCommissionBatch['status']) => {
  if (['estimated', 'withdrawable', 'withdrawing', 'withdrawn', 'invalid'].includes(row.status)) return commissionStatusMeta[row.status];
  if (row.status === 'pending') return commissionStatusMeta.pending;
  if (row.status === 'pending_sales_confirm') return commissionStatusMeta.pending_sales_confirm;
  if (row.status === 'disputed') return commissionStatusMeta.disputed;
  if (row.status === 'paid') return commissionStatusMeta.paid;
  if (batchStatus === 'exported') return { color: 'gold', text: '待打款确认' };
  return { color: 'arcoblue', text: '待生成打款单' };
};

type CommissionFlowFilter =
  | 'all'
  | 'estimated'
  | 'withdrawable'
  | 'withdrawing'
  | 'withdrawn'
  | 'invalid';

const commissionFlowFilterOptions: Array<{ value: CommissionFlowFilter; text: string }> = [
  { value: 'all', text: '全部状态' },
  { value: 'estimated', text: '收益待释放' },
  { value: 'withdrawable', text: '可提现' },
  { value: 'withdrawing', text: '提现处理中' },
  { value: 'withdrawn', text: '已到账' },
  { value: 'invalid', text: '收益已取消' },
];

const matchCommissionFlowFilter = (row: AdminCommissionTransaction, filter: CommissionFlowFilter, batchStatus?: AdminCommissionBatch['status']) => {
  if (filter === 'all') return true;
  if (filter === 'withdrawing') return row.status === 'withdrawing' || (row.status === 'confirmed' && batchStatus === 'exported');
  if (filter === 'withdrawn') return row.status === 'withdrawn' || row.status === 'paid';
  if (filter === 'estimated') return row.status === 'estimated' || row.status === 'pending';
  if (filter === 'withdrawable') return row.status === 'withdrawable' || row.status === 'pending_sales_confirm' || (row.status === 'confirmed' && batchStatus !== 'exported');
  if (filter === 'invalid') return row.status === 'invalid' || row.status === 'disputed';
  return true;
};

const commissionWithdrawStatusMeta: Record<AdminCommissionWithdrawRecord['status'], { color: string; text: string }> = {
  withdrawing: { color: 'orange', text: '提现处理中' },
  withdrawn: { color: 'green', text: '已到账' },
};

type CommissionWithdrawFilter = 'all' | AdminCommissionWithdrawRecord['status'];

const commissionWithdrawFilterOptions: Array<{ value: CommissionWithdrawFilter; text: string }> = [
  { value: 'all', text: '全部状态' },
  { value: 'withdrawing', text: '提现处理中' },
  { value: 'withdrawn', text: '已到账' },
];

const batchStatusMeta = {
  auto_generated: { color: 'gray', text: '自动生成' },
  pending_review: { color: 'orange', text: '待财务审批' },
  approved: { color: 'arcoblue', text: '已审批待导出' },
  exported: { color: 'gold', text: '打款单已生成' },
  paid: { color: 'green', text: '已打款' },
  closed: { color: 'gray', text: '已关闭' },
} as const;

const planStatusMeta = {
  draft: { color: 'gold', text: '草稿' },
  published: { color: 'green', text: '上架' },
  offline: { color: 'gray', text: '下架' },
} as const;

const planProductTypeMeta: Record<AdminPlanRecord['productType'], { color: string; text: string }> = {
  seat_sub: { color: 'arcoblue', text: '席位套餐' },
  coding_plan: { color: 'purple', text: 'CodingPlan' },
  expansion: { color: 'gray', text: '扩容产品' },
};

const newsStatusMeta: Record<AdminNewsStatus, { color: string; text: string }> = {
  draft: { color: 'gold', text: '草稿' },
  scheduled: { color: 'purple', text: '定时发布' },
  reviewing: { color: 'arcoblue', text: '审核中' },
  published: { color: 'green', text: '已发布' },
  offline: { color: 'gray', text: '已下架' },
  rejected: { color: 'red', text: '已驳回' },
};

const leadStatusMeta: Record<AdminLeadStatus, { color: string; text: string }> = {
  new: { color: 'red', text: '未分配' },
  assigned: { color: 'orange', text: '已分配' },
  claimed: { color: 'gold', text: '已认领' },
  following: { color: 'arcoblue', text: '跟进中' },
  converted: { color: 'green', text: '已转客户' },
  closed: { color: 'gray', text: '已关闭' },
};

const isLeadOverdue = (lead: AdminLeadRecord) => lead.status === 'new' && lead.slaHoursLeft <= 0;

const adminLeadStatusMeta = (lead: AdminLeadRecord) =>
  isLeadOverdue(lead) ? { color: 'red', text: '已超时' } : leadStatusMeta[lead.status];

const formatLeadSla = (hours: number) => {
  if (hours > 0) return `${hours}h`;
  const overdueHours = Math.abs(hours);
  if (overdueHours < 24) return `已超时 ${overdueHours}h`;
  const days = Math.floor(overdueHours / 24);
  const restHours = overdueHours % 24;
  return `已超时 ${days}天${restHours ? `${restHours}h` : ''}`;
};

const formatAdminLeadSla = (lead: AdminLeadRecord) => (
  lead.status === 'new' ? formatLeadSla(lead.slaHoursLeft) : '-'
);

const roleLabel: Record<AdminStaffRecord['roleCode'], string> = {
  'R1.0': '超级管理员',
  'R1.1': '超级管理员',
  'R1.2': '财务',
  'R1.3': '客户运维',
  'R2.0': '交付管理员',
  'R2.1': '交付运维',
  'R2.2': '交付运维',
  R2: '运维支持',
  R3: '销售',
};

const adminStaffRoleOptions: Array<{ value: AdminStaffRecord['roleCode']; label: string; description: string }> = [
  { value: 'R1.1', label: '超级管理员', description: '管理平台运营、订单、财务、客户和系统配置等后台能力' },
  { value: 'R1.2', label: '财务', description: '复用后台管理能力，聚焦订单账单、对公审核、开票和佣金结算；不包含内部员工账号和通知模板。' },
  { value: 'R3', label: '销售', description: '负责客户拓展、客户归属、分享链接和佣金相关工作' },
  { value: 'R2.0', label: '交付管理员', description: '负责工单分派、处理时限管控和交付队列统筹' },
  { value: 'R2.1', label: '交付运维', description: '负责实施配置、IM 绑定、网络配置、诊断排障和客户技术支持' },
];

type AdminStaffAccountRow = AdminStaffRecord & { bindings: AdminStaffRecord[] };
type AdminStaffAccountDraft = Partial<AdminStaffRecord> & {
  bindings?: AdminStaffRecord[];
  roleCodes: AdminStaffRecord['roleCode'][];
  defaultRoleCode?: AdminStaffRecord['roleCode'];
  initialPassword?: string;
  commissionRuleId?: string;
  baseCommissionRate?: number;
};
type AdminStaffPasswordResetDraft = {
  visible: boolean;
  row?: AdminStaffAccountRow;
  password: string;
};
type AdminStaffInheritanceDraft = {
  visible: boolean;
  row?: AdminStaffAccountRow;
  assignments: Record<string, string>;
  preview?: AdminStaffInheritancePreview;
  loading: boolean;
};
type AdminPasswordResult = {
  title: string;
  accountName: string;
  phone: string;
  roles: string[];
  password: string;
};
type TemporaryPasswordResult = {
  title: string;
  phone: string;
  roles: AdminStaffRecord['roleCode'][];
  password: string;
};

const isStaffInheritanceRole = (roleCode: AdminStaffRecord['roleCode']) => roleCode !== 'R1.0' && roleCode !== 'R1.1';

const generateStaffTemporaryPassword = () => {
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

const renderPasswordInputWithGenerator = (
  password: string,
  onPasswordChange: (password: string) => void,
  placeholder: string,
) => (
  <div className="admin-password-setting admin-password-setting--inline">
    <Input.Password
      value={password}
      onChange={onPasswordChange}
      placeholder={placeholder}
      addAfter={(
        <Button type="text" size="small" onClick={() => onPasswordChange(generateStaffTemporaryPassword())}>
          自动生成安全密码
        </Button>
      )}
    />
    <Text type="secondary">可手动输入，或点击右侧按钮生成包含大小写、数字和符号的安全密码。</Text>
  </div>
);

const createEmptyStaffDraft = (): AdminStaffAccountDraft => ({
  employeeNo: '',
  name: '',
  email: '',
  phone: '',
  roleCodes: ['R1.1'],
  defaultRoleCode: 'R1.1',
  hiredAt: '2026-05-05',
  initialPassword: '',
  commissionRuleId: '',
  baseCommissionRate: 0.05,
});

const INTERNAL_SALES_COMMISSION_RATE = 0.05;
const INTERNAL_SALES_COMMISSION_RULE_ID = 'rule-internal-sales-5';

type AdminSalesDraft = Pick<AdminSalesDetail, 'employeeNo' | 'name' | 'team' | 'hiredAt' | 'region' | 'phone' | 'email' | 'baseCommissionRate'> & {
  commissionRuleId: string;
  initialPassword: string;
};

const createEmptySalesDraft = (): AdminSalesDraft => ({
  employeeNo: '',
  name: '',
  team: '',
  hiredAt: '2026-05-05',
  region: '',
  phone: '',
  email: '',
  baseCommissionRate: INTERNAL_SALES_COMMISSION_RATE,
  commissionRuleId: INTERNAL_SALES_COMMISSION_RULE_ID,
  initialPassword: '',
});

const settlementRuleKindMeta: Record<AdminCommissionRule['kind'], { color: string; text: string }> = {
  commission: { color: 'arcoblue', text: '佣金规则' },
  procurement_discount: { color: 'green', text: '拿货折扣规则' },
};

const createEmptySettlementRuleDraft = (): Pick<AdminCommissionRule, 'name' | 'kind' | 'rate' | 'cycleMonths' | 'effectiveFrom' | 'effectiveTo' | 'status'> => ({
  name: '',
  kind: 'procurement_discount',
  rate: 0.7,
  cycleMonths: 12,
  effectiveFrom: '2026-05-01',
  effectiveTo: undefined,
  status: 'draft',
});

const formatSettlementRate = (value: number) => `${Number((value * 100).toFixed(2))}%`;
const formatRuleOptionLabel = (rule: AdminCommissionRule) => `${rule.name}（${formatSettlementRate(rule.rate)}）`;
const settlementRateLabel = (rule: Pick<AdminCommissionRule, 'kind'>) => (
  rule.kind === 'procurement_discount' ? '拿货折扣' : '佣金比例'
);
const agentAgreementLevels = ['S级代理', 'A级代理', 'B级代理', 'C级代理'];
const agentMirrorDisabledText = '未开通镜像站';

const findProcurementRuleForLevel = (rules: AdminCommissionRule[], level: string) =>
  rules.find((rule) => rule.kind === 'procurement_discount' && rule.status === 'active' && (rule.name.startsWith(level) || rule.scope.includes(level)))
  ?? rules.find((rule) => rule.kind === 'procurement_discount' && (rule.name.startsWith(level) || rule.scope.includes(level)));

const emptyAgentTenantDraft = (rules: AdminCommissionRule[] = []): AdminAgentTenantUpsertPayload => {
  const defaultLevel = 'A级代理';
  const defaultRule = findProcurementRuleForLevel(rules, defaultLevel);
  return {
    companyName: '',
    shortName: '',
    legalName: '',
    status: 'pending_setup',
    mirrorSiteEnabled: false,
    mirrorDomain: '',
    logoFileName: '',
    collectionQrFileName: '',
    collectionBankAccountName: '',
    collectionBankName: '',
    collectionBranchName: '',
    collectionAccountNo: '',
    collectionNote: '',
    adminName: '',
    adminPhone: '',
    contactEmail: '',
    agreementLevel: defaultLevel,
    procurementRuleId: defaultRule?.id ?? '',
  };
};

const syncAgentDraftAgreementLevel = (
  draft: AdminAgentTenantUpsertPayload,
  agreementLevel: string,
  rules: AdminCommissionRule[],
): AdminAgentTenantUpsertPayload => ({
  ...draft,
  agreementLevel,
  procurementRuleId: findProcurementRuleForLevel(rules, agreementLevel)?.id ?? '',
});

const agentTenantToDraft = (row: AdminAgentTenantListItem): AdminAgentTenantUpsertPayload => ({
  companyName: row.companyName,
  shortName: row.shortName,
  legalName: row.legalName,
  status: row.status,
  mirrorSiteEnabled: row.websiteStatus !== 'not_configured',
  mirrorDomain: row.mirrorDomain,
  logoFileName: row.logoFileName,
  collectionQrFileName: row.collectionQrFileName,
  collectionBankAccountName: row.collectionBankAccountName,
  collectionBankName: row.collectionBankName,
  collectionBranchName: row.collectionBranchName,
  collectionAccountNo: row.collectionAccountNo,
  collectionNote: row.collectionNote,
  adminName: row.adminName,
  adminPhone: row.adminPhone,
  contactEmail: row.contactEmail,
  agreementLevel: row.agreementLevel,
  procurementRuleId: row.procurementRuleId,
});

const normalizeAgentTenantPayload = (
  draft: AdminAgentTenantUpsertPayload,
  rules: AdminCommissionRule[],
): AdminAgentTenantUpsertPayload => {
  const payload = syncAgentDraftAgreementLevel(draft, draft.agreementLevel, rules);
  return {
    ...payload,
    mirrorDomain: payload.mirrorSiteEnabled ? payload.mirrorDomain.trim() : '',
  };
};

const renderAgentMirrorDomain = (row: Pick<AdminAgentTenantListItem, 'mirrorDomain' | 'websiteStatus'>) => (
  row.websiteStatus === 'not_configured' || !row.mirrorDomain
    ? <Text type="secondary">{agentMirrorDisabledText}</Text>
    : row.mirrorDomain
);

const createEmptyBankAccountDraft = (): Pick<SalesBankAccount, 'accountName' | 'bankName' | 'branchName' | 'accountNo'> => ({
  accountName: '',
  bankName: '',
  branchName: '',
  accountNo: '',
});

const maskBankAccountNo = (accountNo?: string) => {
  if (!accountNo) return '-';
  const normalized = accountNo.replace(/\s/g, '');
  if (normalized.length <= 4) return normalized;
  return `**** **** **** ${normalized.slice(-4)}`;
};

const buildCommissionReceiptPreview = (row: AdminCommissionWithdrawRecord) => {
  const items = [
    ['提现流水号', row.id],
    ['收款方', row.recipientAccount?.accountName || row.salesName],
    ['收款银行', row.recipientAccount?.bankName || '-'],
    ['收款账号', maskBankAccountNo(row.recipientAccount?.accountNo)],
    ['打款金额', money(row.totalAmount)],
    ['打款时间', row.paidAt || '-'],
    ['银行流水号', row.bankTransferNo || '-'],
  ];

  const rows = items
    .map(
      ([label, value], index) => `
        <text x="44" y="${136 + index * 48}" font-size="17" fill="#86909c">${escapeSvgText(label)}</text>
        <text x="220" y="${136 + index * 48}" font-size="19" fill="#1d2129">${escapeSvgText(value)}</text>
      `,
    )
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="920" height="640" viewBox="0 0 920 640">
      <rect width="920" height="640" rx="20" fill="#f7f8fa" />
      <rect x="24" y="24" width="872" height="592" rx="18" fill="#ffffff" stroke="#e5e8ef" />
      <rect x="44" y="44" width="832" height="68" rx="12" fill="#e8f7f0" />
      <text x="72" y="86" font-size="28" font-weight="700" fill="#00a870">银行回单</text>
      <text x="690" y="86" font-size="18" fill="#4e5969">模拟回单预览</text>
      ${rows}
      <rect x="44" y="510" width="832" height="72" rx="14" fill="#f2f3f5" />
      <text x="72" y="552" font-size="18" fill="#4e5969">本回单为前端 mock 原型，用于展示财务上传后的回单查看入口。</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const renderPayoutAccountDescriptions = (account?: AdminCommissionWithdrawRecord['payoutAccount']) => (
  <Descriptions column={1} data={[
    { label: '开户名', value: account?.accountName || '-' },
    { label: '开户银行', value: account?.bankName || '-' },
    { label: '开户支行', value: account?.branchName || '-' },
    { label: '银行账号', value: maskBankAccountNo(account?.accountNo) },
  ]} />
);

function AdminPageShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>
        {action}
      </div>
      {children}
    </Space>
  );
}

function AdminTablePanel({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-table-panel">
      {toolbar ? <div className="admin-table-panel__toolbar">{toolbar}</div> : null}
      {children}
    </div>
  );
}

function AdminDashboardPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-dashboard-panel">
      <header className="admin-dashboard-panel__header">
        <Text className="admin-dashboard-panel__title">{title}</Text>
        {action ? <div className="admin-dashboard-panel__action">{action}</div> : null}
      </header>
      <div className="admin-dashboard-panel__body">{children}</div>
    </section>
  );
}

function AdminDashboardTodoCard({
  item,
  onClick,
}: {
  item: AdminDashboardSummary['todoCards'][number];
  onClick: () => void;
}) {
  const disabled = item.count === 0;
  return (
    <button
      type="button"
      className={`admin-dashboard-todo admin-dashboard-todo--${item.tone} ${item.urgent ? 'admin-dashboard-todo--urgent' : ''} ${disabled ? 'admin-dashboard-todo--empty' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="admin-dashboard-todo__dot" />
      <span className="admin-dashboard-todo__label">{item.label}</span>
      <strong>{item.count} 笔</strong>
      <span className="admin-dashboard-todo__amount">{item.amountLabel}</span>
      <span className="admin-dashboard-todo__cta">{item.ctaLabel} →</span>
    </button>
  );
}

function AdminDashboardBusinessCard({
  item,
}: {
  item: AdminDashboardSummary['businessMetrics'][number];
}) {
  return (
    <div className="admin-dashboard-business-card">
      <Tooltip content={item.helpText}>
        <Button
          className="admin-dashboard-business-help"
          type="text"
          size="mini"
          shape="circle"
          icon={<IconInfoCircle />}
          aria-label={`${item.label}说明`}
        />
      </Tooltip>
      <span className="admin-dashboard-business-card__label">{item.label}</span>
      <strong>{item.value}</strong>
      <span className={`admin-dashboard-business-card__compare admin-dashboard-business-card__compare--${item.compareDirection}`}>
        {item.compareText}
      </span>
    </div>
  );
}

function AdminDashboardRankList({
  rows,
  type,
}: {
  rows: AdminDashboardSummary['topTenants'] | AdminDashboardSummary['topExternalAgents'] | AdminDashboardSummary['topDirectSales'];
  type: 'tenant' | 'sales';
}) {
  if (!rows.length) {
    return <Empty description="暂无业绩" />;
  }

  return (
    <div className="admin-dashboard-rank-list">
      {rows.map((row, index) => (
        <div key={row.id} className="admin-dashboard-rank-row">
          <span className="admin-dashboard-rank-row__index">{index + 1}</span>
          <span className="admin-dashboard-rank-row__main">
            <strong>{row.name}</strong>
            {type === 'tenant' ? <small>{`${'seats' in row ? row.seats : 0} 席 · 确认收入`}</small> : null}
          </span>
          <span className="admin-dashboard-rank-row__value">{money(row.gmv)}</span>
        </div>
      ))}
    </div>
  );
}

function AdminRevenueTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const totalRevenue = payload.reduce((sum, item) => sum + Number(item.value ?? 0), 0);

  return (
    <div className="admin-dashboard-tooltip">
      <strong>{label}</strong>
      <div><span>今日总成交额</span><b>{money(totalRevenue)}</b></div>
      {payload.map((item) => (
        <div key={item.name}>
          <span>{item.name}</span>
          <b>{money(Number(item.value ?? 0))}</b>
        </div>
      ))}
    </div>
  );
}

function MetaTag({ color, text }: { color: string; text: string }) {
  return <Tag color={color}>{text}</Tag>;
}

const invoiceStatusMeta: Record<BillingInvoiceRecord['status'], { color: string; text: string }> = {
  pending: { color: 'orange', text: '待开票' },
  issued: { color: 'green', text: '已开票' },
  rejected: { color: 'red', text: '已驳回' },
};

const invoiceSourceMeta: Record<BillingInvoiceRecord['source'], { color: string; text: string }> = {
  customer_request: { color: 'arcoblue', text: '客户申请' },
  finance_manual: { color: 'purple', text: '财务开票' },
};

const agentBalanceLedgerTypeMeta: Record<AgentBalanceLedgerType, { color: string; text: string }> = {
  topup: { color: 'arcoblue', text: '钱包充值' },
  deduct: { color: 'orange', text: '平台采购支付' },
  refund: { color: 'green', text: '退款回补' },
};

const agentProcurementStatusMeta: Record<AgentProcurementOrderRecord['status'], { color: string; text: string }> = {
  pending_customer_payment: { color: 'gray', text: '待镜像站订单完成' },
  pending_procurement: { color: 'orange', text: '待平台代理采购' },
  pending_finance_review: { color: 'gold', text: '待财务审核' },
  delivery_processing: { color: 'purple', text: '交付处理中' },
  completed: { color: 'green', text: '已完成' },
};

const agentProcurementPaymentMethodLabel = (value?: AgentProcurementPaymentMethod) =>
  value === 'wallet' ? '钱包余额' : value ? paymentMethodLabel(value) : '-';

function MockUploadField({
  fileName,
  onFileNameChange,
  buttonText,
  tip,
  placeholder,
}: {
  fileName: string;
  onFileNameChange: (value: string) => void;
  buttonText: string;
  tip: string;
  placeholder: string;
}) {
  const selectedFileList: UploadItem[] = fileName
    ? [{ uid: fileName, name: fileName, status: 'done' }]
    : [];

  return (
    <Space direction="vertical" size={8} className="full-width">
      <Upload
        accept=".pdf,.ofd,.png,.jpg,.jpeg"
        autoUpload={false}
        drag
        limit={1}
        fileList={selectedFileList}
        tip={tip}
        onChange={(_, file) => {
          const nextFileName = file.originFile?.name || file.name || '';
          onFileNameChange(nextFileName);
        }}
        onRemove={() => {
          onFileNameChange('');
        }}
      >
        <Button icon={<IconUpload />}>{buttonText}</Button>
      </Upload>
      <Input
        prefix={<IconFilePdf />}
        value={fileName}
        onChange={onFileNameChange}
        placeholder={placeholder}
      />
    </Space>
  );
}

function InvoiceUploadField({
  fileName,
  onFileNameChange,
}: {
  fileName: string;
  onFileNameChange: (value: string) => void;
}) {
  return (
    <MockUploadField
      fileName={fileName}
      onFileNameChange={onFileNameChange}
      buttonText="选择发票文件"
      tip="支持 PDF、OFD、PNG、JPG。当前为 mock 上传，选择文件后会记录文件名。"
      placeholder="上传后自动填入，也可输入 mock 文件名，例如 invoice_ORD-xxx.pdf"
    />
  );
}

function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: 'good' | 'warn' | 'danger' }>;
}) {
  return (
    <div className="admin-stat-strip">
      {items.map((item) => (
        <div className={`admin-stat-strip__item admin-stat-strip__item--${item.tone ?? 'good'}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function AgentBalanceSeatQuotaCard({
  seat,
}: {
  seat: AgentBalanceSummary['seatQuotaCards'][number];
}) {
  const percent = seat.quota ? Math.round((seat.used / seat.quota) * 100) : 0;

  return (
    <div className="seat-overview-card agent-balance-seat-card">
      <div className="seat-overview-card__head">
        <strong>{seat.name}</strong>
        <Text>总库存 {seat.quota}</Text>
      </div>
      <Progress percent={percent} size="small" showText={false} />
      <div className="seat-overview-card__row">
        <Text>已销售/总库存</Text>
        <span>{seat.used}/{seat.quota}</span>
        <Text>库存量 {seat.remaining}</Text>
      </div>
    </div>
  );
}

function AgentBalanceInventoryCard({
  seats,
  variant = 'compact',
  onTopup,
}: {
  seats: AgentBalanceSummary['seatQuotaCards'];
  variant?: 'compact' | 'hero';
  onTopup?: () => void;
}) {
  const inventoryLevels = [
    { level: 'lite' as const, label: adminSeatLevelMeta.lite.label },
    { level: 'standard' as const, label: adminSeatLevelMeta.standard.label },
    { level: 'pro' as const, label: adminSeatLevelMeta.pro.label },
    { level: 'ultimate' as const, label: adminSeatLevelMeta.ultimate.label },
    { level: 'lite' as const, label: 'Coding Plan Lite' },
    { level: 'pro' as const, label: 'Coding Plan Pro' },
  ];
  const items = inventoryLevels.map((level) => {
    const seat = seats.find((item) => item.level === level.level);
    return {
      label: level.label,
      value: seat?.remaining ?? 0,
    };
  });

  return (
    <Card
      className={`agent-balance-inventory-card agent-balance-inventory-card--${variant}`}
      bordered
      title="历史额度"
      extra={onTopup ? <Button type="primary" size="small" onClick={onTopup}>充值钱包</Button> : null}
    >
      <div className="agent-balance-inventory-card__body">
        <div className="agent-balance-inventory-card__grid">
          {items.map((item) => (
            <div key={item.label} className="agent-balance-inventory-card__item">
              <div className="agent-balance-inventory-card__item-main">
                <Text className="agent-balance-inventory-card__item-label">{item.label}</Text>
              </div>
              <div className="agent-balance-inventory-card__item-count">
                <strong className="agent-balance-inventory-card__item-value">{item.value}</strong>
                <Text className="agent-balance-inventory-card__item-unit">剩余</Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DetailHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string;
  subtitle: ReactNode;
  onBack: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="sales-detail-header">
      <Button type="text" onClick={onBack}>返回</Button>
      <div className="sales-detail-header__main">
        <Title heading={4}>{title}</Title>
        <Text type="secondary">{subtitle}</Text>
      </div>
      {actions ? <div className="sales-detail-header__actions">{actions}</div> : null}
    </div>
  );
}

function AgentAdminDashboardView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AgentBalanceDashboardSummary>();
  const [chartData, setChartData] = useState<AdminDashboardSummary>();
  const [procurementRows, setProcurementRows] = useState<AgentProcurementOrderRecord[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [dashboard, adminDashboard, procurements] = await Promise.all([
      mockApi.getAgentBalanceDashboard(adminConsoleRoot(location.pathname)),
      mockApi.getAdminDashboard(),
      mockApi.getAgentProcurementOrders(),
    ]);
    setData(dashboard);
    setChartData(adminDashboard);
    setProcurementRows(procurements);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data || !chartData) {
    return <Spin className="page-spin" tip="加载超级管理员（代理）工作台" />;
  }

  const rootPath = adminConsoleRoot(location.pathname);
  const procurementTotal = procurementRows.reduce((sum, item) => sum + item.protocolAmount, 0);
  const pendingProcurementRows = procurementRows.filter((item) => item.status === 'pending_procurement');
  const financeReviewRows = procurementRows.filter((item) => item.status === 'pending_finance_review');
  const deliveryRows = procurementRows.filter((item) => item.status === 'delivery_processing');
  const accountCards = [
    {
      label: '当前余额',
      value: money(data.account.currentBalance),
      trend: '当前可用于按协议价向平台采购',
      actionLabel: '采购与结算',
      onAction: () => navigate(`${rootPath}/balance`),
      actionType: 'primary' as const,
    },
    {
      label: '平台采购总额',
      value: money(procurementTotal),
      trend: '代理向平台采购订单的协议价合计',
      actionLabel: '钱包流水',
      onAction: () => navigate(`${rootPath}/balance?tab=ledger`),
      actionType: 'default' as const,
    },
    {
      label: '待平台代理采购',
      value: `${pendingProcurementRows.length} 笔`,
      trend: money(pendingProcurementRows.reduce((sum, item) => sum + item.protocolAmount, 0)),
    },
    {
      label: '待财务/交付',
      value: `${financeReviewRows.length + deliveryRows.length} 笔`,
      trend: `${financeReviewRows.length} 笔待审核，${deliveryRows.length} 笔待交付`,
    },
  ];

  return (
    <AdminPageShell
      title="超级管理员（代理）工作台"
      description="平台代理采购、财务审核与账户概览，待办请在通知中心查看"
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <section className="admin-dashboard-overview">
        <header className="admin-dashboard-overview__header">
          <Text className="admin-dashboard-panel__title">经营总览</Text>
        </header>
        <div className="admin-dashboard-business-grid">
          {data.businessMetrics.map((item) => (
            <AdminDashboardBusinessCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <AdminDashboardPanel title="近 30 天平台采购趋势">
        {chartData.revenueTrend.length ? (
          <div className="chart-box chart-box--large">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData.revenueTrend}>
                <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<AdminRevenueTrendTooltip />} />
                <Legend />
                <Bar name="代理侧平台采购额" dataKey="agentRevenue" stackId="revenue" fill="#165DFF" radius={[0, 0, 0, 0]} />
                <Bar name="平台直营收入" dataKey="directRevenue" stackId="revenue" fill="#14C9C9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="暂无平台采购数据，完成采购后开始统计" />
        )}
      </AdminDashboardPanel>

      <section className="admin-dashboard-overview">
        <header className="admin-dashboard-overview__header">
          <Text className="admin-dashboard-panel__title">我的账户</Text>
        </header>
        <Row gutter={[16, 16]}>
          {accountCards.map((card) => (
            <Col key={card.label} xs={24} sm={12} lg={6}>
              <div className="commission-metric-card-wrap">
                <MetricCard metric={{ label: card.label, value: card.value, trend: card.trend }} />
                {card.actionLabel && card.onAction ? (
                  <div className="commission-metric-action">
                    <Button
                      className={card.actionType === 'primary' ? 'commission-withdraw-action' : undefined}
                      size="mini"
                      type={card.actionType ?? 'default'}
                      onClick={card.onAction}
                    >
                      {card.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            </Col>
          ))}
        </Row>
      </section>
    </AdminPageShell>
  );
}

export function AdminDashboardPage() {
  const location = useLocation();
  return location.pathname.startsWith('/agent/admin') ? <AgentAdminDashboardView /> : <PlatformAdminDashboardView />;
}

function PlatformAdminDashboardView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardSummary>();

  const loadData = async () => {
    setLoading(true);
    const dashboard = await mockApi.getAdminDashboard();
    setData(dashboard);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return <Spin className="page-spin" tip="加载管理后台仪表盘" />;
  }
  const rootPath = adminConsoleRoot(location.pathname);
  const normalizeDashboardRoute = (route: string) => (rootPath === '/admin' ? route : route.replace('/admin', rootPath));

  return (
    <AdminPageShell
      title="全局仪表盘"
      description="超级管理员视角 · 平台运营全景与高优待办"
      action={
        <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
      }
    >
      <section className="admin-dashboard-overview">
        <header className="admin-dashboard-overview__header">
          <Text className="admin-dashboard-panel__title">经营总览</Text>
        </header>
        <div className="admin-dashboard-business-grid">
          {data.businessMetrics.map((item) => (
            <AdminDashboardBusinessCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      </section>

      <AdminDashboardPanel title="近 30 天成交额趋势">
        {data.revenueTrend.length ? (
          <div className="chart-box chart-box--large">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.revenueTrend}>
                <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<AdminRevenueTrendTooltip />} />
                <Legend />
                <Bar name="外部代理成交额" dataKey="agentRevenue" stackId="revenue" fill="#165DFF" radius={[0, 0, 0, 0]} />
                <Bar name="自销成交额" dataKey="directRevenue" stackId="revenue" fill="#14C9C9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="暂无确认收入数据，完成开通后开始统计" />
        )}
      </AdminDashboardPanel>

      <div className="admin-dashboard-rank-grid">
        <AdminDashboardPanel
          title="本月外部代理成交额 Top 5"
        >
          <AdminDashboardRankList rows={data.topExternalAgents} type="sales" />
        </AdminDashboardPanel>
        <AdminDashboardPanel
          title="本月内部销售成交额 Top 5"
        >
          <AdminDashboardRankList rows={data.topDirectSales} type="sales" />
        </AdminDashboardPanel>
      </div>

    </AdminPageShell>
  );
}

export function AgentBalancePage() {
  const location = useLocation();
  const isFinanceView = location.pathname.startsWith('/agent/finance');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AgentBalanceSummary>();
  const [procurementRows, setProcurementRows] = useState<AgentProcurementOrderRecord[]>([]);
  const [ledgerRows, setLedgerRows] = useState<AgentBalanceLedgerRecord[]>([]);
  const [ledgerQuery, setLedgerQuery] = useState<AgentBalanceLedgerQuery>({});
  const [activeBalanceTab, setActiveBalanceTab] = useState<'procurements' | 'ledger'>('procurements');
  const [ledgerDrawerVisible, setLedgerDrawerVisible] = useState(false);
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupStep, setTopupStep] = useState<AgentTopupStep>('amount');
  const [topupAmountMode, setTopupAmountMode] = useState<AgentTopupAmountMode>(10000);
  const [topupAmount, setTopupAmount] = useState<number>(10000);
  const [customTopupAmount, setCustomTopupAmount] = useState<number | undefined>();
  const [topupPaymentMethod, setTopupPaymentMethod] = useState<AgentBalancePaymentMethod>('wechat');
  const [topupProofFileName, setTopupProofFileName] = useState('');
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [procurementPaymentDraft, setProcurementPaymentDraft] = useState<{
    visible: boolean;
    order?: AgentProcurementOrderRecord;
    orderId: string;
    paymentMethod: AgentProcurementPaymentMethod;
    proofName: string;
    password: string;
    submitting: boolean;
  }>({ visible: false, orderId: '', paymentMethod: 'wallet', proofName: '', password: '', submitting: false });
  const loadLedger = async (query: AgentBalanceLedgerQuery = ledgerQuery) => {
    const rows = await mockApi.getAgentBalanceLedger(query);
    setLedgerRows(rows);
  };

  const loadProcurements = async () => {
    const rows = await mockApi.getAgentProcurementOrders();
    setProcurementRows(rows);
  };

  const effectiveTopupAmount = topupAmountMode === 'custom' ? Number(customTopupAmount) || 0 : topupAmount;
  const topupPaymentCodeLabel = `${topupPaymentMethod === 'alipay' ? '支付宝' : '微信'}充值付款码 TOPUP-${dayjs().format('YYYYMMDD')}-${String(effectiveTopupAmount || 0).padStart(6, '0')}`;

  const resetTopupDraft = () => {
    setTopupStep('amount');
    setTopupAmountMode(10000);
    setTopupAmount(10000);
    setCustomTopupAmount(undefined);
    setTopupPaymentMethod('wechat');
    setTopupProofFileName('');
  };

  const closeTopupModal = () => {
    setTopupModalVisible(false);
    resetTopupDraft();
  };

  const openTopupModal = () => {
    resetTopupDraft();
    setTopupModalVisible(true);
  };

  const handleTopupNext = () => {
    if (effectiveTopupAmount < 10000) {
      Message.error('单次钱包充值金额需至少 10,000 元');
      return;
    }
    setTopupStep('payment');
  };

  const handleTopupSubmit = async () => {
    if (effectiveTopupAmount < 10000) {
      Message.error('单次钱包充值金额需至少 10,000 元');
      return;
    }
    if (topupPaymentMethod === 'bank_transfer' && !topupProofFileName.trim()) {
      Message.error('对公转账充值需上传付款凭证');
      return;
    }
    setTopupSubmitting(true);
    try {
      const result = await mockApi.createAgentTopup({
        amount: effectiveTopupAmount,
        paymentMethod: topupPaymentMethod,
        remark: '平台采购钱包充值',
        proofFileName: topupPaymentMethod === 'bank_transfer' ? topupProofFileName.trim() || undefined : undefined,
      });
      setSummary(result.summary);
      await loadLedger();
      closeTopupModal();
      if (isFinanceView) {
        setActiveBalanceTab('ledger');
      } else {
        setLedgerDrawerVisible(true);
      }
      Message.success('钱包充值已入账');
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '钱包充值提交失败');
    } finally {
      setTopupSubmitting(false);
    }
  };

  const openProcurementModal = (order: AgentProcurementOrderRecord) => {
    setProcurementPaymentDraft({
      visible: true,
      order,
      orderId: order.id,
      paymentMethod: 'wallet',
      proofName: `agent_procurement_${order.id}.png`,
      password: '',
      submitting: false,
    });
  };

  const closeProcurementModal = () => {
    setProcurementPaymentDraft({ visible: false, orderId: '', paymentMethod: 'wallet', proofName: '', password: '', submitting: false });
  };

  const handleSubmitProcurementPayment = async () => {
    if (!procurementPaymentDraft.orderId) {
      Message.error('请选择要支付的采购订单');
      return;
    }
    if (procurementPaymentDraft.paymentMethod === 'wallet' && !procurementPaymentDraft.password.trim()) {
      Message.error('请输入支付密码');
      return;
    }
    if (procurementPaymentDraft.paymentMethod === 'wallet' && procurementPaymentDraft.password.trim().length < 6) {
      Message.error('支付密码至少 6 位');
      return;
    }
    if (procurementPaymentDraft.paymentMethod !== 'wallet' && !procurementPaymentDraft.proofName.trim()) {
      Message.error('请上传或填写平台代理采购支付凭证');
      return;
    }
    setProcurementPaymentDraft((current) => ({ ...current, submitting: true }));
    try {
      if (procurementPaymentDraft.paymentMethod === 'wallet') {
        const result = await mockApi.payAgentProcurementWithWallet(procurementPaymentDraft.orderId);
        if (result) {
          await Promise.all([loadProcurements(), loadLedger()]);
          setSummary(await mockApi.getAgentBalanceAccount());
          closeProcurementModal();
          Message.success('平台代理采购已使用钱包支付');
        }
        return;
      }
      await mockApi.submitAgentProcurementProof(procurementPaymentDraft.orderId, {
        paymentMethod: procurementPaymentDraft.paymentMethod,
        proofName: procurementPaymentDraft.proofName.trim(),
      });
      closeProcurementModal();
      await loadProcurements();
      Message.success('支付凭证已提交，等待平台财务审核');
    } catch (error) {
      Message.error(error instanceof Error ? error.message : procurementPaymentDraft.paymentMethod === 'wallet' ? '钱包支付失败' : '支付凭证提交失败');
    } finally {
      setProcurementPaymentDraft((current) => (
        current.visible ? { ...current, submitting: false } : current
      ));
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [account, procurementOrders, rows] = await Promise.all([
      mockApi.getAgentBalanceAccount(),
      mockApi.getAgentProcurementOrders(),
      mockApi.getAgentBalanceLedger(ledgerQuery),
    ]);
    setSummary(account);
    setProcurementRows(procurementOrders);
    setLedgerRows(rows);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('tab') !== 'ledger') return;
    if (isFinanceView) {
      setActiveBalanceTab('ledger');
    } else {
      setLedgerDrawerVisible(true);
    }
  }, [isFinanceView, location.search]);

  if (loading || !summary) {
    return <Spin className="page-spin" tip="加载订单总览" />;
  }

  const pendingProcurementRows = procurementRows.filter((item) => item.status === 'pending_procurement');
  const financeReviewRows = procurementRows.filter((item) => item.status === 'pending_finance_review');
  const completedProcurementRows = procurementRows.filter((item) => item.status === 'completed');
  const pendingProcurementMetric = {
    label: '待平台代理采购',
    value: `${pendingProcurementRows.length} 笔`,
    trend: money(pendingProcurementRows.reduce((total, item) => total + item.protocolAmount, 0)),
  };
  const financeReviewMetric = {
    label: '待财务审核',
    value: `${financeReviewRows.length} 笔`,
    trend: money(financeReviewRows.reduce((total, item) => total + item.protocolAmount, 0)),
  };
  const completedProcurementMetric = {
    label: '已完成采购',
    value: `${completedProcurementRows.length} 笔`,
    trend: money(completedProcurementRows.reduce((total, item) => total + item.protocolAmount, 0)),
  };
  const activeProcurementOrder = procurementPaymentDraft.order;

  const exportLedger = async () => {
    const result = await mockApi.exportAgentBalanceLedger(ledgerQuery);
    downloadTextFile(result.fileName, result.content);
    Message.success(`已生成 ${result.fileName}`);
  };

  const procurementColumns = [
    { title: '采购单号', dataIndex: 'id', width: 180 },
    { title: '终端客户', dataIndex: 'tenantName', width: 160 },
    { title: '订单内容', dataIndex: 'orderSummary', width: 240 },
    { title: '平台协议价', dataIndex: 'protocolAmount', width: 140, render: (value: number) => money(value) },
    { title: '支付方式', dataIndex: 'procurementPaymentMethod', width: 120, render: (value?: AgentProcurementPaymentMethod) => agentProcurementPaymentMethodLabel(value) },
    { title: '支付凭证', dataIndex: 'procurementProofName', width: 180, render: (value?: string) => value || '-' },
    { title: '状态', dataIndex: 'status', width: 140, render: (value: AgentProcurementOrderRecord['status']) => <Tag color={agentProcurementStatusMeta[value].color}>{agentProcurementStatusMeta[value].text}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, row: AgentProcurementOrderRecord) => (
        row.status === 'pending_procurement' && !isFinanceView ? (
          <Button type="text" size="mini" onClick={() => openProcurementModal(row)}>去采购</Button>
        ) : <Button type="text" size="mini" disabled>详情</Button>
      ),
    },
  ];

  const ledgerColumns = [
    { title: '流水号', dataIndex: 'id', width: 180 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (value: AgentBalanceLedgerRecord['type']) => (
        <Tag color={agentBalanceLedgerTypeMeta[value].color}>{agentBalanceLedgerTypeMeta[value].text}</Tag>
      ),
    },
    { title: '关联业务', dataIndex: 'businessLabel', width: 260 },
    {
      title: '金额变动',
      dataIndex: 'amount',
      width: 140,
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#00A870' : '#F53F3F', fontWeight: 600 }}>
          {value >= 0 ? '+' : ''}{money(value)}
        </Text>
      ),
    },
    {
      title: '余额（变动后）',
      dataIndex: 'balanceAfter',
      width: 150,
      render: (value: number) => money(value),
    },
    { title: '时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (_: unknown, row: AgentBalanceLedgerRecord) => (
        <Space direction="vertical" size={4}>
          <span>{row.remark}</span>
          {row.paymentMethod ? <Text type="secondary">支付方式：{paymentMethodLabel(row.paymentMethod)}</Text> : null}
          {row.proofFileName ? <Text type="secondary">凭证：{row.proofFileName}</Text> : null}
        </Space>
      ),
    },
  ];

  const procurementTablePanel = (
    <AdminTablePanel>
      <Table
        rowKey="id"
        columns={procurementColumns}
        data={procurementRows}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1260 }}
      />
    </AdminTablePanel>
  );

  const ledgerTablePanel = (
    <AdminTablePanel
      toolbar={(
        <div className="sales-filter-bar agent-balance-filter-bar">
          <DatePicker.RangePicker
            value={ledgerQuery.dateFrom && ledgerQuery.dateTo ? [ledgerQuery.dateFrom, ledgerQuery.dateTo] : []}
            onChange={(value) => setLedgerQuery((current) => ({
              ...current,
              dateFrom: value?.[0] || undefined,
              dateTo: value?.[1] || undefined,
            }))}
            placeholder={['开始日期', '结束日期']}
            style={{ width: 260 }}
          />
          <Select
            mode="multiple"
            allowClear
            value={ledgerQuery.types}
            onChange={(value) => setLedgerQuery((current) => ({ ...current, types: (value || []) as AgentBalanceLedgerType[] }))}
            placeholder="流水类型"
            style={{ width: 220 }}
          >
            {Object.entries(agentBalanceLedgerTypeMeta).map(([value, meta]) => (
              <Select.Option key={value} value={value}>{meta.text}</Select.Option>
            ))}
          </Select>
          <InputNumber
            className="agent-balance-filter-bar__amount"
            min={0}
            value={ledgerQuery.minAmount}
            onChange={(value) => setLedgerQuery((current) => ({ ...current, minAmount: typeof value === 'number' ? value : undefined }))}
            placeholder="最小金额"
          />
          <InputNumber
            className="agent-balance-filter-bar__amount"
            min={0}
            value={ledgerQuery.maxAmount}
            onChange={(value) => setLedgerQuery((current) => ({ ...current, maxAmount: typeof value === 'number' ? value : undefined }))}
            placeholder="最大金额"
          />
          <Button type="primary" onClick={() => loadLedger()}>筛选</Button>
          <Button onClick={() => {
            const emptyQuery: AgentBalanceLedgerQuery = {};
            setLedgerQuery(emptyQuery);
            loadLedger(emptyQuery);
          }}>重置</Button>
          <Button icon={<IconDownload />} onClick={exportLedger}>导出 CSV</Button>
        </div>
      )}
    >
      <Table
        rowKey="id"
        columns={ledgerColumns}
        data={ledgerRows}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1180 }}
      />
    </AdminTablePanel>
  );

  return (
    <AdminPageShell
      title="订单总览"
      description={isFinanceView ? '代理财务只读查看平台代理采购订单、钱包余额与钱包流水' : '平台代理采购订单、支付进度与钱包余额总览'}
      action={(
        <Space>
          <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
        </Space>
      )}
    >
      <Row gutter={[16, 16]} className="agent-balance-metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered className="agent-balance-summary-card">
            <div className="agent-balance-summary-card__body">
              <div className="agent-balance-summary-card__value">
                <span className="agent-balance-summary-card__value-label">平台支付钱包</span>
                <span className="agent-balance-summary-card__amount-line">
                  <span className="agent-balance-summary-card__value-amount">{money(summary.currentBalance)}</span>
                  {!isFinanceView ? (
                    <Space size={8} wrap>
                      <Button
                        className="agent-balance-summary-card__topup-action"
                        size="mini"
                        type="primary"
                        onClick={openTopupModal}
                      >
                        充值钱包
                      </Button>
                      <Button
                        className="agent-balance-summary-card__topup-action"
                        size="mini"
                        onClick={() => setLedgerDrawerVisible(true)}
                      >
                        钱包流水
                      </Button>
                    </Space>
                  ) : null}
                </span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard metric={pendingProcurementMetric} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard metric={financeReviewMetric} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard metric={completedProcurementMetric} />
        </Col>
      </Row>

      {isFinanceView ? (
        <Tabs
          activeTab={activeBalanceTab}
          onChange={(value) => setActiveBalanceTab(value as 'procurements' | 'ledger')}
          className="agent-balance-table-tabs"
        >
          <TabPane key="procurements" title="平台代理采购订单">
            {procurementTablePanel}
          </TabPane>
          <TabPane key="ledger" title="钱包流水">
            {ledgerTablePanel}
          </TabPane>
        </Tabs>
      ) : (
        procurementTablePanel
      )}

      <Drawer
        width={1080}
        title="钱包流水"
        visible={ledgerDrawerVisible}
        onCancel={() => setLedgerDrawerVisible(false)}
        footer={null}
      >
        {ledgerTablePanel}
      </Drawer>

      <Modal
        title="充值平台支付钱包"
        visible={topupModalVisible}
        onCancel={closeTopupModal}
        footer={(
          <Space>
            <Button onClick={topupStep === 'amount' ? closeTopupModal : () => setTopupStep('amount')}>
              {topupStep === 'amount' ? '取消' : '返回'}
            </Button>
            {topupStep === 'amount' ? (
              <Button type="primary" onClick={handleTopupNext}>下一步</Button>
            ) : (
              <Button type="primary" loading={topupSubmitting} onClick={handleTopupSubmit}>
                {topupPaymentMethod === 'bank_transfer' ? '提交付款凭证' : '模拟支付成功'}
              </Button>
            )}
          </Space>
        )}
        style={{ width: 720 }}
        confirmLoading={topupSubmitting}
      >
        {topupStep === 'amount' ? (
          <Space direction="vertical" size={16} className="full-width">
            <Text type="secondary">先选择本次要充值到平台支付钱包的金额。</Text>
            <div className="agent-topup-amount-grid">
              {agentTopupAmountOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`agent-topup-amount-card${topupAmountMode === amount ? ' agent-topup-amount-card--active' : ''}`}
                  onClick={() => {
                    setTopupAmountMode(amount);
                    setTopupAmount(amount);
                  }}
                >
                  <span>固定额度</span>
                  <strong>{money(amount)}</strong>
                </button>
              ))}
              <button
                type="button"
                className={`agent-topup-amount-card agent-topup-amount-card--custom${topupAmountMode === 'custom' ? ' agent-topup-amount-card--active' : ''}`}
                onClick={() => setTopupAmountMode('custom')}
              >
                <span>自定义金额</span>
                <InputNumber
                  min={10000}
                  value={customTopupAmount}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(value) => {
                    setTopupAmountMode('custom');
                    setCustomTopupAmount(typeof value === 'number' ? value : undefined);
                  }}
                  placeholder="最低 ¥10,000"
                  className="full-width"
                />
              </button>
            </div>
          </Space>
        ) : (
          <Space direction="vertical" size={16} className="full-width">
            <div className="agent-topup-payable">
              <span>充值金额</span>
              <strong>{money(effectiveTopupAmount)}</strong>
            </div>
            <Radio.Group
              value={topupPaymentMethod}
              onChange={(value) => {
                const nextPaymentMethod = value as AgentBalancePaymentMethod;
                setTopupPaymentMethod(nextPaymentMethod);
                if (nextPaymentMethod !== 'bank_transfer') {
                  setTopupProofFileName('');
                }
              }}
              direction="vertical"
              className="payment-method-list"
            >
              <Radio value="wechat">
                <div className="payment-method-row">
                  <span>微信</span>
                  {topupPaymentMethod === 'wechat' ? <strong>{money(effectiveTopupAmount)}</strong> : null}
                </div>
              </Radio>
              <Radio value="alipay">
                <div className="payment-method-row">
                  <span>支付宝</span>
                  {topupPaymentMethod === 'alipay' ? <strong>{money(effectiveTopupAmount)}</strong> : null}
                </div>
              </Radio>
              <Radio value="bank_transfer">
                <div className="payment-method-row">
                  <span>对公转账</span>
                  {topupPaymentMethod === 'bank_transfer' ? <strong>{money(effectiveTopupAmount)}</strong> : null}
                </div>
              </Radio>
            </Radio.Group>
            {topupPaymentMethod === 'bank_transfer' ? (
              <div className="payment-method-body">
                <Descriptions
                  title="对公转账信息"
                  column={1}
                  data={[
                    { label: '收款主体', value: summary.collectionAccount.companyName },
                    { label: '开户银行', value: `${summary.collectionAccount.bankName} ${summary.collectionAccount.branchName}` },
                    { label: '银行账号', value: summary.collectionAccount.accountNo },
                    { label: '唯一备注号', value: summary.collectionAccount.remarkCode },
                    { label: '转账金额', value: money(effectiveTopupAmount) },
                  ]}
                />
                <Alert type="info" content={summary.collectionAccount.note} />
                <MockUploadField
                  fileName={topupProofFileName}
                  onFileNameChange={setTopupProofFileName}
                  buttonText="上传付款凭证"
                  tip="对公转账需上传付款凭证，平台财务核对后入账。"
                  placeholder="上传后自动填入，也可输入 mock 文件名"
                />
              </div>
            ) : (
              <div className="payment-method-body">
                <div className="electronic-payment-panel electronic-payment-panel--stacked">
                  <div className="electronic-payment-qr">
                    <span>{topupPaymentMethod === 'alipay' ? '支付宝付款码' : '微信付款码'}</span>
                    <small>{topupPaymentCodeLabel} · {money(effectiveTopupAmount)}</small>
                  </div>
                  <Text type="secondary">打开{topupPaymentMethod === 'alipay' ? '支付宝' : '微信'}扫码完成钱包充值。</Text>
                </div>
              </div>
            )}
          </Space>
        )}
      </Modal>

      <Modal
        title="平台代理采购"
        visible={procurementPaymentDraft.visible}
        onCancel={closeProcurementModal}
        footer={(
          <Space>
            <Button onClick={closeProcurementModal}>取消</Button>
            <Button type="primary" loading={procurementPaymentDraft.submitting} onClick={handleSubmitProcurementPayment}>
              {procurementPaymentDraft.paymentMethod === 'wallet' ? '确认支付' : '提交凭证'}
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={16} className="full-width">
          {activeProcurementOrder ? (
            <Descriptions
              column={1}
              data={[
                { label: '采购单号', value: activeProcurementOrder.id },
                { label: '终端客户', value: activeProcurementOrder.tenantName },
                { label: '订单内容', value: activeProcurementOrder.orderSummary },
                { label: '平台协议价', value: money(activeProcurementOrder.protocolAmount) },
              ]}
            />
          ) : null}
          <label className="sales-field">
            <span>支付方式</span>
            <Select
              value={procurementPaymentDraft.paymentMethod}
              onChange={(value) => setProcurementPaymentDraft((current) => ({
                ...current,
                paymentMethod: value as AgentProcurementPaymentMethod,
                proofName: value === 'wallet' ? current.proofName : current.proofName || `agent_procurement_${current.orderId}.png`,
                password: value === 'wallet' ? current.password : '',
              }))}
            >
              <Select.Option value="wallet">钱包支付</Select.Option>
              <Select.Option value="bank_transfer">对公转账（上传凭证）</Select.Option>
              <Select.Option value="wechat">微信转账（上传凭证）</Select.Option>
            </Select>
          </label>
          {procurementPaymentDraft.paymentMethod === 'wallet' ? (
            <>
              {activeProcurementOrder ? (
                <Descriptions
                  column={1}
                  data={[
                    { label: '当前钱包余额', value: money(summary.currentBalance) },
                    { label: '支付后余额', value: money(summary.currentBalance - activeProcurementOrder.protocolAmount) },
                  ]}
                />
              ) : null}
              {activeProcurementOrder && summary.currentBalance < activeProcurementOrder.protocolAmount ? (
                <Alert type="warning" content="当前钱包余额不足，确认支付时将无法完成扣款。请先充值钱包或改用上传支付凭证。" />
              ) : null}
              <label className="sales-field">
                <span><i className="form-required">*</i>支付密码</span>
                <Input.Password
                  value={procurementPaymentDraft.password}
                  onChange={(password) => setProcurementPaymentDraft((current) => ({ ...current, password }))}
                  placeholder="请输入支付密码"
                />
              </label>
            </>
          ) : (
            <>
              {procurementPaymentDraft.paymentMethod === 'wechat' && activeProcurementOrder ? (
                <div className="payment-method-body">
                  <div className="electronic-payment-panel electronic-payment-panel--stacked">
                    <div className="electronic-payment-qr">
                      <span>微信采购付款码</span>
                      <small>微信采购付款码 PROCURE-{activeProcurementOrder.id}-{String(activeProcurementOrder.protocolAmount).padStart(6, '0')} · {money(activeProcurementOrder.protocolAmount)}</small>
                    </div>
                    <Text type="secondary">使用微信完成平台代理采购付款后，上传微信付款凭证供平台财务审核。</Text>
                  </div>
                </div>
              ) : null}
              {procurementPaymentDraft.paymentMethod === 'bank_transfer' && activeProcurementOrder ? (
                <div className="payment-method-body">
                  <Descriptions
                    title="对公转账信息"
                    column={1}
                    data={[
                      { label: '收款主体', value: summary.collectionAccount.companyName },
                      { label: '开户银行', value: `${summary.collectionAccount.bankName} ${summary.collectionAccount.branchName}` },
                      { label: '银行账号', value: summary.collectionAccount.accountNo },
                      { label: '唯一备注号', value: summary.collectionAccount.remarkCode },
                      { label: '转账金额', value: money(activeProcurementOrder.protocolAmount) },
                    ]}
                  />
                  <Alert type="info" content={summary.collectionAccount.note} />
                </div>
              ) : null}
              <div className="sales-field">
                <span><i className="form-required">*</i>{procurementPaymentDraft.paymentMethod === 'wechat' ? '微信付款凭证' : '对公转账凭证'}</span>
                <MockUploadField
                  fileName={procurementPaymentDraft.proofName}
                  onFileNameChange={(value) => setProcurementPaymentDraft((current) => ({ ...current, proofName: value }))}
                  buttonText={procurementPaymentDraft.paymentMethod === 'wechat' ? '上传微信付款凭证' : '上传对公转账凭证'}
                  tip="Mock 上传：提交后进入平台财务审核"
                  placeholder={procurementPaymentDraft.paymentMethod === 'wechat' ? '请输入或上传微信付款凭证文件名' : '请输入或上传对公转账凭证文件名'}
                />
              </div>
              <Alert type="info" content="这里是代理向平台采购付款，不是客户扫码支付入口。微信转账或对公转账完成后上传凭证，由平台财务审核。" />
            </>
          )}
        </Space>
      </Modal>

    </AdminPageShell>
  );
}

export function AgentWebsitePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<'companyName' | 'logoFileName' | 'contactItems' | 'wechatQrFileName' | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<AgentWebsiteConfig, 'updatedAt'>>({
    companyName: '',
    logoFileName: '',
    contactItems: [''],
    wechatQrFileName: '',
  });
  const [form, setForm] = useState<Omit<AgentWebsiteConfig, 'updatedAt'>>({
    companyName: '',
    logoFileName: '',
    contactItems: [''],
    wechatQrFileName: '',
  });
  const [updatedAt, setUpdatedAt] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await mockApi.getAgentWebsiteConfig();
    setForm({
      companyName: data.companyName,
      logoFileName: data.logoFileName,
      contactItems: data.contactItems.length ? data.contactItems : [''],
      wechatQrFileName: data.wechatQrFileName,
    });
    setUpdatedAt(data.updatedAt);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditDraftField = <K extends keyof typeof editDraft>(key: K, value: (typeof editDraft)[K]) => {
    setEditDraft((current) => ({ ...current, [key]: value }));
  };

  const updateContactItem = (index: number, value: string) => {
    setEditDraft((current) => ({
      ...current,
      contactItems: current.contactItems.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addContactItem = () => {
    setEditDraft((current) => ({ ...current, contactItems: [...current.contactItems, ''] }));
  };

  const removeContactItem = (index: number) => {
    setEditDraft((current) => ({
      ...current,
      contactItems: current.contactItems.length > 1
        ? current.contactItems.filter((_, itemIndex) => itemIndex !== index)
        : [''],
    }));
  };

  const openEditField = (field: typeof editingField) => {
    setEditDraft({
      companyName: form.companyName,
      logoFileName: form.logoFileName,
      contactItems: form.contactItems.length ? [...form.contactItems] : [''],
      wechatQrFileName: form.wechatQrFileName,
    });
    setEditingField(field);
  };

  const handleSaveWebsiteField = async () => {
    const contactItems = editDraft.contactItems.map((item) => item.trim()).filter(Boolean);
    if (!editDraft.companyName.trim()) {
      Message.warning('请输入企业名称');
      return;
    }
    if (!contactItems.length) {
      Message.warning('请至少添加一个联系方式');
      return;
    }
    setSaving(true);
    const saved = await mockApi.saveAgentWebsiteConfig({
      companyName: editDraft.companyName.trim(),
      logoFileName: editDraft.logoFileName.trim(),
      contactItems,
      wechatQrFileName: editDraft.wechatQrFileName.trim(),
    });
    setForm({
      companyName: saved.companyName,
      logoFileName: saved.logoFileName,
      contactItems: saved.contactItems.length ? saved.contactItems : [''],
      wechatQrFileName: saved.wechatQrFileName,
    });
    setUpdatedAt(saved.updatedAt);
    setSaving(false);
    setEditingField(null);
    Message.success('已保存网站信息');
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载网站管理" />;
  }

  return (
    <AdminPageShell
      title="网站管理"
      description="维护代理镜像站对外网站信息"
    >
      <Card bordered title="网站信息" className="agent-website-config-card">
        <div className="agent-website-config-grid">
          <div className="agent-website-info-card">
            <div className="agent-website-info-card__head">
              <span>企业名称</span>
              <Button icon={<IconEdit />} size="mini" onClick={() => openEditField('companyName')} />
            </div>
            <strong className="agent-website-info-card__title">{form.companyName || '-'}</strong>
          </div>
          <div className="agent-website-info-card">
            <div className="agent-website-info-card__head">
              <span>企业 Logo</span>
              <Button icon={<IconEdit />} size="mini" onClick={() => openEditField('logoFileName')} />
            </div>
            <div className="agent-website-logo-preview">
              {form.logoFileName ? (
                <>
                  <div className="agent-website-logo-preview__mark">{form.companyName.slice(0, 2) || 'LOGO'}</div>
                  <Text type="secondary">{form.logoFileName}</Text>
                </>
              ) : (
                <Text type="secondary">未上传</Text>
              )}
            </div>
          </div>
          <div className="agent-website-info-card">
            <div className="agent-website-info-card__head">
              <span>联系方式</span>
              <Button icon={<IconEdit />} size="mini" onClick={() => openEditField('contactItems')} />
            </div>
            <div className="agent-website-contact-list">
              {form.contactItems.filter(Boolean).map((item, index) => (
                <strong key={`${item}-${index}`}>{item}</strong>
              ))}
            </div>
          </div>
          <div className="agent-website-info-card">
            <div className="agent-website-info-card__head">
              <span>微信公众号二维码</span>
              <Button icon={<IconEdit />} size="mini" onClick={() => openEditField('wechatQrFileName')} />
            </div>
            <div className="agent-website-qr-field">
              <div className="agent-website-qr-preview">
                {form.wechatQrFileName ? (
                  <>
                    <div className="agent-website-qr-preview__grid" />
                    <Text type="secondary">{form.wechatQrFileName}</Text>
                  </>
                ) : (
                  <Text type="secondary">未上传</Text>
                )}
              </div>
            </div>
          </div>
          <Text type="secondary" className="agent-website-config-grid__footer">最近保存：{updatedAt || '-'}</Text>
        </div>
      </Card>

      <Modal
        title={editingField === 'companyName' ? '修改企业名称' : editingField === 'logoFileName' ? '修改企业 Logo' : editingField === 'contactItems' ? '修改联系方式' : '修改微信公众号二维码'}
        visible={Boolean(editingField)}
        onCancel={() => setEditingField(null)}
        onOk={handleSaveWebsiteField}
        confirmLoading={saving}
        okText="保存"
      >
        {editingField === 'companyName' ? (
          <label className="sales-field">
            <span><i className="form-required">*</i>企业名称</span>
            <Input
              maxLength={32}
              value={editDraft.companyName}
              onChange={(value) => updateEditDraftField('companyName', value)}
              placeholder="请输入对外展示的企业名称"
            />
          </label>
        ) : null}
        {editingField === 'logoFileName' ? (
          <label className="sales-field">
            <span>企业 Logo</span>
            <MockUploadField
              fileName={editDraft.logoFileName}
              onFileNameChange={(value) => updateEditDraftField('logoFileName', value)}
              buttonText="上传 Logo"
              tip="Mock 上传：仅记录文件名，支持 PNG/JPG"
              placeholder="请输入或上传 Logo 文件名"
            />
          </label>
        ) : null}
        {editingField === 'contactItems' ? (
          <div className="sales-field">
            <span><i className="form-required">*</i>联系方式</span>
            <Space direction="vertical" size={10} className="full-width">
              {editDraft.contactItems.map((item, index) => (
                <div className="agent-website-contact-row" key={index}>
                  <Input
                    value={item}
                    onChange={(value) => updateContactItem(index, value)}
                    placeholder={index === 0 ? '如：服务热线：400-800-2026' : '添加一个联系方式'}
                  />
                  <Button disabled={editDraft.contactItems.length === 1} onClick={() => removeContactItem(index)}>删除</Button>
                </div>
              ))}
              <Button icon={<IconPlus />} onClick={addContactItem}>添加联系方式</Button>
            </Space>
          </div>
        ) : null}
        {editingField === 'wechatQrFileName' ? (
          <label className="sales-field">
            <span>微信公众号二维码</span>
            <MockUploadField
              fileName={editDraft.wechatQrFileName}
              onFileNameChange={(value) => updateEditDraftField('wechatQrFileName', value)}
              buttonText="上传二维码"
              tip="Mock 上传：仅记录文件名，支持 PNG/JPG"
              placeholder="请输入或上传二维码文件名"
            />
          </label>
        ) : null}
      </Modal>
    </AdminPageShell>
  );
}

export function AdminAgentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminAgentTenantListItem[]>([]);
  const [settlementRules, setSettlementRules] = useState<AdminCommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAgentTenantStatus>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminAgentTenantUpsertPayload>(emptyAgentTenantDraft());
  const draftProcurementRule = findProcurementRuleForLevel(settlementRules, draft.agreementLevel);

  const loadData = async () => {
    setLoading(true);
    const [tenantData, ruleData] = await Promise.all([
      mockApi.getAdminAgentTenants(),
      mockApi.getAdminCommissionRules(),
    ]);
    setRows(tenantData);
    setSettlementRules(ruleData);
    setDraft((current) => (
      current.procurementRuleId || !ruleData.length
        ? current
        : emptyAgentTenantDraft(ruleData)
    ));
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyAgentTenantDraft(settlementRules));
    setDrawerVisible(true);
  };

  const openEdit = (row: AdminAgentTenantListItem) => {
    setEditingId(row.id);
    setDraft(agentTenantToDraft(row));
    setDrawerVisible(true);
  };

  const handleSaveAgent = async () => {
    const payload = normalizeAgentTenantPayload(draft, settlementRules);
    if (!payload.companyName || !payload.shortName || !payload.legalName || !payload.adminName || !payload.adminPhone || !payload.contactEmail || !payload.procurementRuleId) {
      Message.error('请填写完整外部代理信息，并确认该代理等级已有拿货规则');
      return;
    }
    if (payload.mirrorSiteEnabled && !payload.mirrorDomain) {
      Message.error('请填写镜像站域名，或关闭开通镜像站');
      return;
    }
    if (editingId) {
      await mockApi.updateAdminAgentTenant(editingId, payload);
      Message.success('外部代理已更新');
    } else {
      await mockApi.createAdminAgentTenant(payload);
      Message.success('外部代理已新增');
    }
    setDrawerVisible(false);
    setEditingId(null);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = rows.filter((item) => {
    const keywordMatched = `${item.companyName} ${item.shortName} ${item.mirrorDomain} ${item.adminName}`.toLowerCase().includes(query.toLowerCase());
    const statusMatched = statusFilter === 'all' || item.status === statusFilter;
    return keywordMatched && statusMatched;
  });

  return (
    <AdminPageShell
      title="外部代理管理"
      description="管理外部代理租户、可选镜像站、代理管理员和代理经营状态"
      action={<Button type="primary" icon={<IconPlus />} onClick={openCreate}>新增外部代理</Button>}
    >
      <AdminTablePanel
        toolbar={(
          <div className="sales-filter-bar">
            <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索代理公司、简称、管理员、镜像站域名" />
            <Select value={statusFilter} onChange={(value) => setStatusFilter(value as 'all' | AdminAgentTenantStatus)} className="sales-filter-select">
              <Select.Option value="all">全部状态</Select.Option>
              {Object.entries(agentTenantStatusMeta).map(([value, meta]) => (
                <Select.Option key={value} value={value}>{meta.text}</Select.Option>
              ))}
            </Select>
          </div>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            {
              title: '代理',
              dataIndex: 'shortName',
              render: (value: string, row: AdminAgentTenantListItem) => (
                <Button type="text" size="mini" onClick={() => navigate(`/admin/agents/${row.id}`)}>{value}</Button>
              ),
            },
            { title: '代理公司', dataIndex: 'companyName' },
            { title: '镜像站', render: (_: unknown, row: AdminAgentTenantListItem) => renderAgentMirrorDomain(row) },
            { title: '代理管理员', dataIndex: 'adminName' },
            { title: '状态', dataIndex: 'status', render: (value: AdminAgentTenantStatus) => <MetaTag {...agentTenantStatusMeta[value]} /> },
            { title: '代理等级/拿货折扣', render: (_: unknown, row: AdminAgentTenantListItem) => `${row.agreementLevel} / ${formatSettlementRate(row.procurementRate)}` },
            { title: '销售/财务', render: (_: unknown, row: AdminAgentTenantListItem) => `${row.salesCount} / ${row.financeCount}` },
            { title: '客户数', dataIndex: 'customerCount' },
            { title: '余额', dataIndex: 'currentBalance', render: (value: number) => money(value) },
            { title: '本月成交额', dataIndex: 'monthGmv', render: (value: number) => money(value) },
            {
              title: '操作',
              render: (_: unknown, row: AdminAgentTenantListItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`/admin/agents/${row.id}`)}>详情</Button>
                  <Button type="text" size="mini" onClick={() => openEdit(row)}>编辑</Button>
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Drawer
        width={760}
        title={editingId ? '编辑外部代理' : '新增外部代理'}
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={(
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveAgent}>保存</Button>
          </Space>
        )}
      >
        <div className="sales-form-grid sales-form-grid--single">
          <label><span><i className="form-required">*</i>代理公司</span><Input value={draft.companyName} onChange={(value) => setDraft((current) => ({ ...current, companyName: value }))} placeholder="请输入代理公司名称" /></label>
          <label><span><i className="form-required">*</i>代理简称</span><Input value={draft.shortName} onChange={(value) => setDraft((current) => ({ ...current, shortName: value }))} placeholder="列表和详情展示名称" /></label>
          <label><span><i className="form-required">*</i>工商主体</span><Input value={draft.legalName} onChange={(value) => setDraft((current) => ({ ...current, legalName: value }))} placeholder="合同签约主体" /></label>
          <div className="sales-field">
            <span>开通镜像站</span>
            <Switch
              checked={draft.mirrorSiteEnabled}
              onChange={(checked) => setDraft((current) => ({
                ...current,
                mirrorSiteEnabled: checked,
                mirrorDomain: checked ? current.mirrorDomain : '',
              }))}
            />
            <Text className="sales-form-hint">关闭后该外部代理不绑定镜像站，列表和详情展示为未开通镜像站。</Text>
          </div>
          {draft.mirrorSiteEnabled ? (
            <label><span><i className="form-required">*</i>镜像站域名</span><Input value={draft.mirrorDomain} onChange={(value) => setDraft((current) => ({ ...current, mirrorDomain: value }))} placeholder="例如 partner.ynzl-agent.com" /></label>
          ) : null}
          <div className="sales-field">
            <span>代理 Logo</span>
            <MockUploadField
              fileName={draft.logoFileName}
              onFileNameChange={(value) => setDraft((current) => ({ ...current, logoFileName: value }))}
              buttonText="上传 Logo"
              tip="Mock 上传：仅记录文件名，支持 PNG/JPG"
              placeholder="请输入或上传代理 Logo 文件名"
            />
          </div>
          <div className="sales-field">
            <span>客户收款二维码</span>
            <MockUploadField
              fileName={draft.collectionQrFileName}
              onFileNameChange={(value) => setDraft((current) => ({ ...current, collectionQrFileName: value }))}
              buttonText="上传收款码"
              tip="Mock 上传：用于镜像站客户付款页展示"
              placeholder="请输入或上传客户收款二维码文件名"
            />
          </div>
          <label><span>收款户名</span><Input value={draft.collectionBankAccountName} onChange={(value) => setDraft((current) => ({ ...current, collectionBankAccountName: value }))} placeholder="代理对公收款主体" /></label>
          <label><span>开户银行</span><Input value={draft.collectionBankName} onChange={(value) => setDraft((current) => ({ ...current, collectionBankName: value }))} placeholder="例如 招商银行" /></label>
          <label><span>开户支行</span><Input value={draft.collectionBranchName} onChange={(value) => setDraft((current) => ({ ...current, collectionBranchName: value }))} placeholder="例如 上海张江支行" /></label>
          <label><span>收款账号</span><Input value={draft.collectionAccountNo} onChange={(value) => setDraft((current) => ({ ...current, collectionAccountNo: value }))} placeholder="代理对公收款账号" /></label>
          <label><span>收款说明</span><Input.TextArea rows={3} value={draft.collectionNote} onChange={(value) => setDraft((current) => ({ ...current, collectionNote: value }))} placeholder="展示给客户的付款备注、核对要求" /></label>
          <label><span><i className="form-required">*</i>代理管理员</span><Input value={draft.adminName} onChange={(value) => setDraft((current) => ({ ...current, adminName: value }))} /></label>
          <label><span><i className="form-required">*</i>管理员手机号</span><Input value={draft.adminPhone} onChange={(value) => setDraft((current) => ({ ...current, adminPhone: value }))} /></label>
          <label><span><i className="form-required">*</i>联系邮箱</span><Input value={draft.contactEmail} onChange={(value) => setDraft((current) => ({ ...current, contactEmail: value }))} /></label>
          <label>
            <span><i className="form-required">*</i>代理等级</span>
            <Select value={draft.agreementLevel} onChange={(value) => setDraft((current) => syncAgentDraftAgreementLevel(current, value, settlementRules))}>
              {agentAgreementLevels.map((level) => (
                <Select.Option key={level} value={level}>{level}</Select.Option>
              ))}
            </Select>
            <Text className="sales-form-hint">
              {draftProcurementRule ? `自动匹配拿货折扣：${draftProcurementRule.name} / ${formatSettlementRate(draftProcurementRule.rate)}` : '该代理等级暂无可用拿货规则'}
            </Text>
          </label>
          <label>
            <span>状态</span>
            <Select value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as AdminAgentTenantStatus }))}>
              {Object.entries(agentTenantStatusMeta).map(([value, meta]) => (
                <Select.Option key={value} value={value}>{meta.text}</Select.Option>
              ))}
            </Select>
          </label>
        </div>
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminAgentDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<AdminAgentTenantDetail>();
  const [settlementRules, setSettlementRules] = useState<AdminCommissionRule[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<AdminAgentTenantUpsertPayload>(emptyAgentTenantDraft());
  const [loading, setLoading] = useState(true);
  const draftProcurementRule = findProcurementRuleForLevel(settlementRules, draft.agreementLevel);

  const loadDetail = async () => {
    setLoading(true);
    const [detailData, ruleData] = await Promise.all([
      mockApi.getAdminAgentTenantDetail(id),
      mockApi.getAdminCommissionRules(),
    ]);
    setDetail(detailData);
    setSettlementRules(ruleData);
    setDraft(agentTenantToDraft(detailData));
    setLoading(false);
  };

  const openEdit = () => {
    if (!detail) return;
    setDraft(agentTenantToDraft(detail));
    setDrawerVisible(true);
  };

  const handleSaveAgent = async () => {
    if (!detail) return;
    const payload = normalizeAgentTenantPayload(draft, settlementRules);
    if (!payload.companyName || !payload.shortName || !payload.legalName || !payload.adminName || !payload.adminPhone || !payload.contactEmail || !payload.procurementRuleId) {
      Message.error('请填写完整外部代理信息，并确认该代理等级已有拿货规则');
      return;
    }
    if (payload.mirrorSiteEnabled && !payload.mirrorDomain) {
      Message.error('请填写镜像站域名，或关闭开通镜像站');
      return;
    }
    const nextDetail = await mockApi.updateAdminAgentTenant(detail.id, payload);
    Message.success('外部代理已更新');
    setDetail(nextDetail);
    setDraft(agentTenantToDraft(nextDetail));
    setDrawerVisible(false);
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading || !detail) {
    return <Spin className="page-spin" tip="加载代理详情" />;
  }

  return (
    <div className="sales-detail-screen">
      <DetailHeader
        title={detail.shortName}
        subtitle={(
          <Space size={8}>
            <Text type="secondary">{detail.companyName}</Text>
            <MetaTag {...agentTenantStatusMeta[detail.status]} />
          </Space>
        )}
        onBack={() => navigate('/admin/agents')}
        actions={<Button type="primary" icon={<IconEdit />} onClick={openEdit}>编辑</Button>}
      />

      <div className="sales-detail-top-grid">
        <Card bordered className="sales-detail-summary" title="代理租户信息">
          <Descriptions column={2} data={[
            { label: '代理公司', value: detail.legalName },
            { label: '代理等级', value: detail.agreementLevel },
            { label: '镜像站域名', value: renderAgentMirrorDomain(detail) },
            { label: '代理 Logo', value: detail.logoFileName || '-' },
            { label: '客户收款码', value: detail.collectionQrFileName || '-' },
            { label: '收款户名', value: detail.collectionBankAccountName || '-' },
            { label: '开户银行', value: detail.collectionBankName || '-' },
            { label: '开户支行', value: detail.collectionBranchName || '-' },
            { label: '收款账号', value: detail.collectionAccountNo ? maskBankAccountNo(detail.collectionAccountNo) : '-' },
            { label: '收款说明', value: detail.collectionNote || '-' },
            { label: '网站状态', value: <MetaTag {...agentWebsiteStatusMeta[detail.websiteStatus]} /> },
            { label: '代理管理员', value: `${detail.adminName} / ${detail.adminPhone}` },
            { label: '联系邮箱', value: detail.contactEmail },
            { label: '拿货折扣', value: formatSettlementRate(detail.procurementRate) },
            { label: '开通时间', value: detail.createdAt },
          ]} />
        </Card>

        <Card bordered className="sales-detail-summary" title="经营概览">
          <div className="sales-info-grid">
            <div><span>当前余额</span><strong>{money(detail.currentBalance)}</strong></div>
            <div><span>累计钱包充值</span><strong>{money(detail.totalTopup)}</strong></div>
            <div><span>平台采购总额</span><strong>{money(detail.totalDeducted)}</strong></div>
            <div><span>本月成交额</span><strong>{money(detail.monthGmv)}</strong></div>
            <div><span>客户数</span><strong>{detail.customerCount}</strong></div>
            <div><span>销售 / 财务</span><strong>{detail.salesCount} / {detail.financeCount}</strong></div>
          </div>
        </Card>
      </div>

      <div className="admin-detail-tabs-panel">
        <Tabs>
          <TabPane key="staff" title="代理组织">
            <Table rowKey="id" pagination={false} data={detail.staff} columns={[
              { title: '姓名', dataIndex: 'name' },
              { title: '角色', dataIndex: 'role', render: (value: AdminAgentTenantDetail['staff'][number]['role']) => agentStaffRoleLabel[value] },
              { title: '手机号', dataIndex: 'phone' },
              { title: '状态', dataIndex: 'status', render: (value: AdminAgentTenantDetail['staff'][number]['status']) => (value === 'active' ? '正常' : value === 'invited' ? '已邀请' : '已停用') },
            ]} />
          </TabPane>
          <TabPane key="customers" title="最近客户">
            <Table rowKey="id" pagination={false} data={detail.recentCustomers} columns={[
              { title: '客户', dataIndex: 'name' },
              { title: '归属代理销售', dataIndex: 'ownerSales' },
              { title: '状态', dataIndex: 'status', render: (value: AdminTenantStatus) => <MetaTag {...tenantStatusMeta[value]} /> },
              { title: '本月成交额', dataIndex: 'monthGmv', render: (value: number) => money(value) },
            ]} />
          </TabPane>
          <TabPane key="orders" title="最近订单">
            <Table rowKey="id" pagination={false} data={detail.recentOrders} columns={[
              { title: '订单号', dataIndex: 'id' },
              { title: '客户', dataIndex: 'tenantName' },
              { title: '金额', dataIndex: 'amount', render: (value: number) => money(value) },
              { title: '状态', dataIndex: 'status', render: (value: AdminAgentTenantDetail['recentOrders'][number]['status']) => paymentStatusMeta[value]?.text ?? value },
              { title: '创建时间', dataIndex: 'createdAt' },
            ]} />
          </TabPane>
        </Tabs>
      </div>

      <Drawer
        width={760}
        title="编辑外部代理"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={(
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveAgent}>保存</Button>
          </Space>
        )}
      >
        <div className="sales-form-grid sales-form-grid--single">
          <label><span><i className="form-required">*</i>代理公司</span><Input value={draft.companyName} onChange={(value) => setDraft((current) => ({ ...current, companyName: value }))} /></label>
          <label><span><i className="form-required">*</i>代理简称</span><Input value={draft.shortName} onChange={(value) => setDraft((current) => ({ ...current, shortName: value }))} /></label>
          <label><span><i className="form-required">*</i>工商主体</span><Input value={draft.legalName} onChange={(value) => setDraft((current) => ({ ...current, legalName: value }))} /></label>
          <div className="sales-field">
            <span>开通镜像站</span>
            <Switch
              checked={draft.mirrorSiteEnabled}
              onChange={(checked) => setDraft((current) => ({
                ...current,
                mirrorSiteEnabled: checked,
                mirrorDomain: checked ? current.mirrorDomain : '',
              }))}
            />
            <Text className="sales-form-hint">关闭后该外部代理不绑定镜像站，列表和详情展示为未开通镜像站。</Text>
          </div>
          {draft.mirrorSiteEnabled ? (
            <label><span><i className="form-required">*</i>镜像站域名</span><Input value={draft.mirrorDomain} onChange={(value) => setDraft((current) => ({ ...current, mirrorDomain: value }))} placeholder="例如 partner.ynzl-agent.com" /></label>
          ) : null}
          <div className="sales-field">
            <span>代理 Logo</span>
            <MockUploadField
              fileName={draft.logoFileName}
              onFileNameChange={(value) => setDraft((current) => ({ ...current, logoFileName: value }))}
              buttonText="上传 Logo"
              tip="Mock 上传：仅记录文件名，支持 PNG/JPG"
              placeholder="请输入或上传代理 Logo 文件名"
            />
          </div>
          <div className="sales-field">
            <span>客户收款二维码</span>
            <MockUploadField
              fileName={draft.collectionQrFileName}
              onFileNameChange={(value) => setDraft((current) => ({ ...current, collectionQrFileName: value }))}
              buttonText="上传收款码"
              tip="Mock 上传：用于镜像站客户付款页展示"
              placeholder="请输入或上传客户收款二维码文件名"
            />
          </div>
          <label><span>收款户名</span><Input value={draft.collectionBankAccountName} onChange={(value) => setDraft((current) => ({ ...current, collectionBankAccountName: value }))} placeholder="代理对公收款主体" /></label>
          <label><span>开户银行</span><Input value={draft.collectionBankName} onChange={(value) => setDraft((current) => ({ ...current, collectionBankName: value }))} placeholder="例如 招商银行" /></label>
          <label><span>开户支行</span><Input value={draft.collectionBranchName} onChange={(value) => setDraft((current) => ({ ...current, collectionBranchName: value }))} placeholder="例如 上海张江支行" /></label>
          <label><span>收款账号</span><Input value={draft.collectionAccountNo} onChange={(value) => setDraft((current) => ({ ...current, collectionAccountNo: value }))} placeholder="代理对公收款账号" /></label>
          <label><span>收款说明</span><Input.TextArea rows={3} value={draft.collectionNote} onChange={(value) => setDraft((current) => ({ ...current, collectionNote: value }))} placeholder="展示给客户的付款备注、核对要求" /></label>
          <label><span><i className="form-required">*</i>代理管理员</span><Input value={draft.adminName} onChange={(value) => setDraft((current) => ({ ...current, adminName: value }))} /></label>
          <label><span><i className="form-required">*</i>管理员手机号</span><Input value={draft.adminPhone} onChange={(value) => setDraft((current) => ({ ...current, adminPhone: value }))} /></label>
          <label><span><i className="form-required">*</i>联系邮箱</span><Input value={draft.contactEmail} onChange={(value) => setDraft((current) => ({ ...current, contactEmail: value }))} /></label>
          <label>
            <span><i className="form-required">*</i>代理等级</span>
            <Select value={draft.agreementLevel} onChange={(value) => setDraft((current) => syncAgentDraftAgreementLevel(current, value, settlementRules))}>
              {agentAgreementLevels.map((level) => (
                <Select.Option key={level} value={level}>{level}</Select.Option>
              ))}
            </Select>
            <Text className="sales-form-hint">
              {draftProcurementRule ? `自动匹配拿货折扣：${draftProcurementRule.name} / ${formatSettlementRate(draftProcurementRule.rate)}` : '该代理等级暂无可用拿货规则'}
            </Text>
          </label>
          <label>
            <span>状态</span>
            <Select value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as AdminAgentTenantStatus }))}>
              {Object.entries(agentTenantStatusMeta).map(([value, meta]) => (
                <Select.Option key={value} value={value}>{meta.text}</Select.Option>
              ))}
            </Select>
          </label>
        </div>
      </Drawer>
    </div>
  );
}

export function AdminTenantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<AdminTenantListItem[]>([]);
  const [salesRows, setSalesRows] = useState<AdminSalesListItem[]>([]);
  const [staffRows, setStaffRows] = useState<AdminStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminTenantStatus>('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [opsFilter, setOpsFilter] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    uscc: '',
    industry: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    customerAdminInitialPassword: '',
    ownerSalesId: '',
    accountManagerId: '',
    source: '',
    address: '',
    website: '',
    remark: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [tenantData, salesData, staffData] = await Promise.all([mockApi.getAdminTenants(), mockApi.getAdminSales(), mockApi.getAdminStaff()]);
    setRows(tenantData);
    setSalesRows(salesData);
    setStaffRows(staffData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = rows.filter((item) => {
    const keywordMatched = `${item.name} ${item.uscc} ${item.ownerSales} ${item.accountManager}`.toLowerCase().includes(query.toLowerCase());
    const statusMatched = statusFilter === 'all' || item.status === statusFilter;
    const salesMatched = salesFilter === 'all' || item.ownerSales === salesFilter;
    const opsMatched = opsFilter === 'all' || item.accountManager === opsFilter;
    return keywordMatched && statusMatched && salesMatched && opsMatched;
  });
  const activeSalesRows = salesRows.filter((item) => item.status === 'active');
  const customerOpsRows = staffRows.filter((item) => item.roleCode === 'R1.3' && item.status === 'active');
  const tenantBasePath = adminConsolePath(location.pathname, '/tenants');
  const isFinanceView = location.pathname.startsWith('/finance') || location.pathname.startsWith('/agent/finance');
  const canCreateTenant = !location.pathname.startsWith('/ops/') && !isFinanceView;
  const resetDraft = () => {
    setDraft({
      name: '',
      uscc: '',
      industry: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      customerAdminInitialPassword: '',
      ownerSalesId: '',
      accountManagerId: '',
      source: '',
      address: '',
      website: '',
      remark: '',
    });
  };
  const createTenant = async () => {
    if (!canCreateTenant) {
      Message.error(isFinanceView ? '财务侧不能新增企业' : '普通交付运维不能新增企业');
      return;
    }
    if (
      !draft.name.trim() ||
      !draft.uscc.trim() ||
      !draft.source ||
      !draft.contactName.trim() ||
      !draft.contactPhone.trim() ||
      !draft.customerAdminInitialPassword
    ) {
      Message.error('请填写企业名称、统一社会信用代码、客户来源、客户管理员、手机号和初始密码');
      return;
    }
    if (draft.customerAdminInitialPassword.length < 8) {
      Message.error('客户管理员初始密码至少 8 位');
      return;
    }
    if (rows.some((item) => item.uscc === draft.uscc.trim())) {
      Message.error('该统一社会信用代码已存在');
      return;
    }
    const tenant = await mockApi.createAdminTenant(draft);
    Message.success('企业已保存');
    setDrawerVisible(false);
    resetDraft();
    await loadData();
    navigate(`${tenantBasePath}/${tenant.id}`);
  };

  return (
    <AdminPageShell
      title="企业管理"
      description="企业列表、代理归属、席位摘要和企业状态"
      action={<Space>{canCreateTenant ? <Button type="primary" icon={<IconPlus />} onClick={() => { resetDraft(); setDrawerVisible(true); }}>新增企业</Button> : null}<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button></Space>}
    >
      <AdminTablePanel
        toolbar={(
          <div className="sales-filter-bar">
            <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索企业、统一社会信用代码、归属销售、客户运维" />
            <Select value={statusFilter} onChange={setStatusFilter} className="sales-filter-select" options={[
              { label: '全部状态', value: 'all' },
              ...Object.entries(tenantStatusMeta).map(([value, meta]) => ({ label: meta.text, value })),
            ]} />
            <Select value={salesFilter} onChange={setSalesFilter} className="sales-filter-select" options={[
              { label: '全部代理', value: 'all' },
              ...Array.from(new Set(rows.map((item) => item.ownerSales).filter(Boolean))).map((value) => ({ label: value, value })),
            ]} />
            <Select value={opsFilter} onChange={setOpsFilter} className="sales-filter-select" options={[
              { label: '全部客户运维', value: 'all' },
              ...Array.from(new Set(rows.map((item) => item.accountManager).filter(Boolean))).map((value) => ({ label: value, value })),
            ]} />
          </div>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '企业名', dataIndex: 'name', render: (value: string, row: AdminTenantListItem) => <Button type="text" size="mini" onClick={() => navigate(`${tenantBasePath}/${row.id}`)}>{value}</Button> },
            { title: '统一社会信用代码', dataIndex: 'uscc' },
            { title: '行业', dataIndex: 'industry' },
            { title: '企业状态', dataIndex: 'status', render: (value: AdminTenantStatus) => <MetaTag {...tenantStatusMeta[value]} /> },
            { title: '归属销售', dataIndex: 'ownerSales' },
            { title: '客户运维', dataIndex: 'accountManager' },
            { title: '已购席位', dataIndex: 'seatSummary' },
            { title: '本月模型用量（Token）', dataIndex: 'monthToken', render: (value: number) => value.toLocaleString() },
            { title: '本月成交额', dataIndex: 'monthGmv', render: (value: number) => money(value) },
            { title: '创建时间', dataIndex: 'createdAt' },
            {
              title: '操作',
              render: (_: unknown, row: AdminTenantListItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`${tenantBasePath}/${row.id}`)}>详情</Button>
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Drawer
        width={760}
        title="新增企业"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={createTenant}>保存</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <Card bordered title="企业基础信息">
            <div className="sales-form-grid">
              <label><span><i className="form-required">*</i>企业名称</span><Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder="如 华东智能制造有限公司" /></label>
              <label><span><i className="form-required">*</i>统一社会信用代码</span><Input value={draft.uscc} onChange={(value) => setDraft((current) => ({ ...current, uscc: value }))} placeholder="18 位统一社会信用代码" /></label>
              <label><span>行业</span><Input value={draft.industry} onChange={(value) => setDraft((current) => ({ ...current, industry: value }))} placeholder="如 制造业 / 软件服务" /></label>
              <label><span><i className="form-required">*</i>客户来源</span><Select value={draft.source || undefined} placeholder="请选择客户来源" onChange={(value) => setDraft((current) => ({ ...current, source: value }))}><Select.Option value="线下签约">线下签约</Select.Option><Select.Option value="代理代录">代理代录</Select.Option><Select.Option value="官网自助注册">官网自助注册</Select.Option></Select></label>
              <label><span>企业地址</span><Input value={draft.address} onChange={(value) => setDraft((current) => ({ ...current, address: value }))} placeholder="选填" /></label>
              <label><span>官网</span><Input value={draft.website} onChange={(value) => setDraft((current) => ({ ...current, website: value }))} placeholder="选填" /></label>
            </div>
          </Card>
          <Card bordered title="客户管理员账号">
            <div className="sales-form-grid">
              <label><span><i className="form-required">*</i>客户管理员</span><Input value={draft.contactName} onChange={(value) => setDraft((current) => ({ ...current, contactName: value }))} placeholder="对外企业管理员姓名" /></label>
              <label><span><i className="form-required">*</i>手机号</span><Input value={draft.contactPhone} onChange={(value) => setDraft((current) => ({ ...current, contactPhone: value }))} /></label>
              <label><span>邮箱</span><Input value={draft.contactEmail} onChange={(value) => setDraft((current) => ({ ...current, contactEmail: value }))} /></label>
              <label>
                <span><i className="form-required">*</i>初始密码</span>
                {renderPasswordInputWithGenerator(
                  draft.customerAdminInitialPassword,
                  (customerAdminInitialPassword) => setDraft((current) => ({ ...current, customerAdminInitialPassword })),
                  '请输入至少 8 位初始密码',
                )}
              </label>
            </div>
          </Card>
          <Card bordered title="销售归属">
            <div className="sales-form-grid">
              <label><span>归属销售</span><Select value={draft.ownerSalesId || undefined} placeholder="请选择归属销售" allowClear onChange={(value) => setDraft((current) => ({ ...current, ownerSalesId: value || '' }))}>{activeSalesRows.map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}</Select></label>
              <label><span>客户运维</span><Select value={draft.accountManagerId || undefined} placeholder="请选择客户运维" allowClear onChange={(value) => setDraft((current) => ({ ...current, accountManagerId: value || '' }))}>{customerOpsRows.map((item) => <Select.Option key={item.id} value={item.id}>{item.name} / {item.team}</Select.Option>)}</Select></label>
            </div>
          </Card>
          <Card bordered title="补录说明">
            <Input.TextArea rows={4} value={draft.remark} onChange={(value) => setDraft((current) => ({ ...current, remark: value }))} placeholder="记录线下签约、官网自助注册或代理代录背景。保存后仍需生成订单、对公审核和开通工单。" />
          </Card>
        </Space>
	      </Drawer>

	    </AdminPageShell>
	  );
	}

export function AdminTenantDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminTenantDetail>();
  const [usage, setUsage] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contracts, setContracts] = useState<BillingContractRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [couponUsages, setCouponUsages] = useState<CouponUsageRecord[]>([]);
  const [salesRows, setSalesRows] = useState<AdminSalesListItem[]>([]);
  const [staffRows, setStaffRows] = useState<AdminStaffRecord[]>([]);
  const [couponDrawerVisible, setCouponDrawerVisible] = useState(false);
  const [couponDraft, setCouponDraft] = useState<CouponIssueDraft>(createCouponIssueDraft([id]));
  const [activeContract, setActiveContract] = useState<BillingContractRecord>();
  const [contractDrawerVisible, setContractDrawerVisible] = useState(false);
  const [voidContractModal, setVoidContractModal] = useState<{ visible: boolean; row?: BillingContractRecord; reason: string }>({
    visible: false,
    reason: '',
  });
  const [contractDraft, setContractDraft] = useState<BillingContractDraft>({
    contractNo: '',
    type: 'quote',
    name: '',
    validFrom: '',
    validTo: '',
    completedAt: '',
    status: 'active',
    remark: '',
    fileName: '',
  });
  const [adminPasswordReset, setAdminPasswordReset] = useState<{ visible: boolean; password: string }>({
    visible: false,
    password: '',
  });
  const [adminPasswordResult, setAdminPasswordResult] = useState<AdminPasswordResult | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    uscc: '',
    industry: '',
    address: '',
    accountManagerId: '',
    ownerSalesId: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [tenant, usageData, orderData, salesData, staffData] = await Promise.all([
      mockApi.getAdminTenantDetail(id),
      mockApi.getAdminTenantUsage(id),
      mockApi.getAdminTenantOrders(id),
      mockApi.getAdminSales(),
      mockApi.getAdminStaff(),
    ]);
    const [contractData, couponData, couponUsageData] = await Promise.all([
      mockApi.getAdminTenantContracts(id),
      mockApi.getAdminTenantCoupons(id),
      mockApi.getAdminCouponUsages(),
    ]);
    setDetail(tenant);
    setUsage(usageData);
    setOrders(orderData);
    setContracts(contractData);
    setCoupons(couponData);
    setCouponUsages(couponUsageData.filter((item: CouponUsageRecord) => item.tenantId === id));
    setSalesRows(salesData);
    setStaffRows(staffData);
    setDraft({
      name: tenant.name,
      uscc: tenant.uscc,
      industry: tenant.industry,
      address: tenant.address,
      accountManagerId: tenant.accountManagerId,
      ownerSalesId: tenant.ownerSalesId,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading || !detail) {
    return <Spin className="page-spin" tip="加载企业详情" />;
  }
  const tenantBasePath = adminConsolePath(location.pathname, '/tenants');
  const activeSalesRows = salesRows.filter((item) => item.status === 'active');
  const customerOpsRows = staffRows.filter((item) => item.roleCode === 'R1.3' && item.status === 'active');
  const adminAccount = detail.admins[0];
  const contractSummary = contracts.length
    ? `${contracts.filter((item) => item.status === 'active').length} 份生效中 / ${contracts.filter((item) => item.status === 'pending').length} 份待生效`
    : detail.contractStatus;
  const selectedCouponTemplate = getCouponTemplateById(couponDraft.templateId);
  const enabledCouponTemplateRowsByType = getEnabledCouponTemplateRowsByType(couponDraft.benefitType);

  const resetContractDraft = () => {
    setContractDraft({
      contractNo: '',
      type: 'quote',
      name: '',
      validFrom: '',
      validTo: '',
      completedAt: '',
      status: 'active',
      remark: '',
      fileName: '',
    });
  };

  const createContract = async () => {
    if (!contractDraft.contractNo.trim() || !contractDraft.name.trim() || !contractDraft.validFrom || !contractDraft.validTo || !contractDraft.fileName.trim()) {
      Message.error('请填写合同编号、合同名称、有效期和文件名');
      return;
    }
    const payload = {
      ...contractDraft,
      completedAt: contractDraft.completedAt || undefined,
      remark: contractDraft.remark || undefined,
    };
    await mockApi.createAdminTenantContract(detail.id, payload);
    Message.success('合同记录已新增');
    setContractDrawerVisible(false);
    resetContractDraft();
    loadData();
  };

  const voidContract = async () => {
    if (!voidContractModal.row || !voidContractModal.reason.trim()) {
      Message.error('请填写作废原因');
      return;
    }
    await mockApi.voidAdminTenantContract(voidContractModal.row.id, voidContractModal.reason.trim());
    Message.success('合同已作废');
    setVoidContractModal({ visible: false, reason: '' });
    loadData();
  };

  const resetCouponDraft = () => {
    setCouponDraft(createCouponIssueDraft([detail.id]));
  };

  const createCoupon = async () => {
    if (!selectedCouponTemplate) {
      Message.error('请选择券模板');
      return;
    }
    if (couponDraft.discountRate === undefined || couponDraft.discountRate < 0 || couponDraft.discountRate > 99) {
      Message.error('折扣规则需在 0 到 99 之间');
      return;
    }
    if (!couponDraft.name.trim() || !couponDraft.effectiveAt || !couponDraft.expiresAt) {
      Message.error('请填写券名称和有效期');
      return;
    }
    if (couponDraft.benefitType === 'voucher' && couponDraft.totalDiscountQuota <= 0) {
      Message.error('总代金券额度需大于 0');
      return;
    }
    if (couponDraft.benefitType === 'coupon' && couponDraft.targetKind !== 'tenant' && couponDraft.issueQuantity <= 0) {
      Message.error('优惠券发放数量需大于 0');
      return;
    }
    if (couponDraft.thresholdAmount < 0) {
      Message.error('使用限制不能小于 0');
      return;
    }
    if (couponDraft.expiresAt <= couponDraft.effectiveAt) {
      Message.error('失效时间必须晚于生效时间');
      return;
    }
    await mockApi.createAdminCoupon({
      benefitType: couponDraft.benefitType,
      tenantId: couponDraft.tenantIds[0] || detail.id,
      name: couponDraft.name,
      discountRate: couponDraft.discountRate,
      discountScope: couponDraft.discountScope,
      thresholdAmount: couponDraft.thresholdAmount,
      totalDiscountQuota: couponDraft.totalDiscountQuota,
      effectiveAt: couponDraft.effectiveAt,
      expiresAt: couponDraft.expiresAt,
      remark: couponDraft.remark,
    });
    Message.success(`${couponBenefitTypeText(couponDraft.benefitType)}已发放到企业账户`);
    setCouponDrawerVisible(false);
    resetCouponDraft();
    loadData();
  };

  const disableCoupon = async (couponId: string) => {
    await mockApi.disableAdminCoupon(couponId);
    Message.success('券已作废');
    loadData();
  };

  const resetTenantAdminPassword = async () => {
    if (!adminAccount) return;
    if (adminPasswordReset.password.length < 8) {
      Message.error('请设置至少 8 位新密码');
      return;
    }
    const result = await mockApi.resetTenantAdminPassword(detail.id, adminAccount.id, adminPasswordReset.password);
    setAdminPasswordResult({
      title: '密码已重置',
      accountName: adminAccount.name,
      phone: adminAccount.phone,
      roles: [adminAccount.role === 'R4' ? '客户管理员' : '企业成员'],
      password: result.temporaryPassword,
    });
    setAdminPasswordReset({ visible: false, password: '' });
  };

  const copyTenantAdminPassword = async () => {
    if (!adminPasswordResult) return;
    try {
      await navigator.clipboard.writeText(adminPasswordResult.password);
      Message.success('临时密码已复制');
    } catch {
      Message.warning('当前浏览器不支持自动复制，请手动复制临时密码');
    }
  };

  return (
    <div className="sales-detail-screen">
      <DetailHeader
        title={detail.name}
        subtitle={`企业状态：${tenantStatusMeta[detail.status].text} · 火山空间 ID：${detail.volcSpaceId}`}
        onBack={() => navigate(tenantBasePath)}
        actions={<MetaTag {...tenantStatusMeta[detail.status]} />}
      />

      <Card bordered className="sales-detail-summary">
        <div className="sales-info-grid">
          <div><span>统一社会信用代码</span><strong>{detail.uscc}</strong></div>
          <div><span>行业</span><strong>{detail.industry}</strong></div>
          <div><span>本月模型用量</span><strong>{detail.monthToken.toLocaleString()}</strong></div>
          <div><span>本月成交额</span><strong>{money(detail.monthGmv)}</strong></div>
          <div><span>活跃员工</span><strong>{detail.activeEmployees}</strong></div>
          <div><span>合同状态</span><strong>{contractSummary}</strong></div>
        </div>
      </Card>

      <div className="admin-detail-tabs-panel">
        <Tabs>
          <TabPane key="basic" title="基本信息">
            <div className="admin-tenant-basic-grid">
              <div className="sales-info-card">
                <div className="sales-detail-section__title">企业字段</div>
                <div className="sales-form-grid sales-form-grid--single">
                  <label>
                    <span>企业名称</span>
                    <Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
                  </label>
                  <label>
                    <span>统一社会信用代码</span>
                    <Input value={draft.uscc} onChange={(value) => setDraft((current) => ({ ...current, uscc: value }))} />
                  </label>
                  <label>
                    <span>行业</span>
                    <Input value={draft.industry} onChange={(value) => setDraft((current) => ({ ...current, industry: value }))} />
                  </label>
                  <label>
                    <span>企业地址</span>
                    <Input value={draft.address} onChange={(value) => setDraft((current) => ({ ...current, address: value }))} />
                  </label>
                  <Descriptions column={2} data={[
                    { label: '创建时间', value: detail.createdAt },
                  ]} />
                </div>
              </div>
              <div className="sales-info-card">
                <div className="sales-detail-section__title">运营维护字段</div>
                <div className="sales-form-grid sales-form-grid--single">
                  <label>
                    <span>归属销售</span>
                    <Select value={draft.ownerSalesId || undefined} placeholder="请选择归属销售" allowClear onChange={(value) => setDraft((current) => ({ ...current, ownerSalesId: value || '' }))}>
                      {activeSalesRows.map((item) => (
                        <Select.Option key={item.id} value={item.id}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </label>
                  <label>
                    <span>客户运维</span>
                    <Select value={draft.accountManagerId || undefined} placeholder="请选择客户运维" allowClear onChange={(value) => setDraft((current) => ({ ...current, accountManagerId: value || '' }))}>
                      {customerOpsRows.map((item) => (
                        <Select.Option key={item.id} value={item.id}>
                          {item.name} / {item.team}
                        </Select.Option>
                      ))}
                    </Select>
                  </label>
                  <Space>
                    <Button type="primary" onClick={async () => {
                      if (!draft.name.trim() || !draft.uscc.trim()) {
                        Message.error('请填写企业名称和统一社会信用代码');
                        return;
                      }
                      await mockApi.updateAdminTenant(detail.id, draft);
                      Message.success('企业信息已更新');
                      loadData();
                    }}>保存</Button>
                  </Space>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane key="plans" title="套餐与席位">
            <div className="admin-tenant-seat-overview">
              {detail.plans.map((plan) => {
                const meta = adminSeatLevelMeta[plan.level];
                const percent = plan.purchasedSeats ? Math.round((plan.assignedSeats / plan.purchasedSeats) * 100) : 0;
                return (
                  <div key={plan.id} className="seat-overview-card admin-tenant-seat-overview__card">
                    <div className="seat-overview-card__head">
                      <strong>{meta.label}{plan.includesCodingPlan ? `（含 ${plan.codingPlanName ?? meta.codingPlan}）` : ''}</strong>
                      <Text>{plan.quota ? `总配额 ${plan.quota}` : `${plan.cycle} · ${money(plan.price)}`}</Text>
                    </div>
                    <Progress percent={percent} size="small" showText={false} />
                    <div className="seat-overview-card__row">
                      <Text>已分配/已购买</Text>
                      <span>{plan.assignedSeats}/{plan.purchasedSeats}</span>
                      <Text>剩余 {plan.remainingSeats}</Text>
                    </div>
                    <div className="seat-overview-card__row">
                      <Text>{plan.includesCodingPlan ? 'CodingPlan' : '绑定能力'}</Text>
                      <span>{plan.includesCodingPlan ? '已包含' : meta.codingPlan ? `可绑 ${meta.codingPlan}` : '不适用'}</span>
                      <Text>{plan.status}</Text>
                    </div>
                    <div className="seat-overview-card__expire">到期时间 {plan.effectiveAt}</div>
                  </div>
                );
              })}
            </div>
          </TabPane>
          <TabPane key="orders" title="订单历史">
            <Table rowKey="id" pagination={false} data={orders} columns={[
              { title: '订单号', dataIndex: 'id' },
              { title: '类型', dataIndex: 'orderType', render: (value: string, row: any) => orderSummaryLabel(value, row.bundleLines) },
              { title: '订单原价', render: (_: unknown, row: any) => money(row.originalAmount ?? row.amount) },
              { title: '优惠金额', render: (_: unknown, row: any) => row.couponDiscountAmount ? `-${money(row.couponDiscountAmount)}` : '-' },
              { title: '实付金额', dataIndex: 'amount', render: (value: number) => money(value) },
              { title: '支付方式', dataIndex: 'paymentMethod', render: paymentMethodLabel },
              { title: '状态', dataIndex: 'status', render: (value: keyof typeof paymentStatusMeta) => <MetaTag {...paymentStatusMeta[value]} /> },
              { title: '付款时间', dataIndex: 'paidAt', render: (value?: string) => value || '-' },
            ]} />
          </TabPane>
          <TabPane key="coupons" title="券">
            <div className="admin-tenant-readonly-head">
              <div>
                <div className="sales-detail-section__title">企业券</div>
                <Text type="secondary">
                  代金券余额 {money(coupons.filter((item) => item.status === 'active' && isVoucherCoupon(item)).reduce((sum, item) => sum + item.remainingDiscountQuota, 0))}
                  {' '} / 累计抵扣 {money(couponUsages.filter((item) => item.status === 'confirmed').reduce((sum, item) => sum + item.discountAmount, 0))}
                </Text>
              </div>
              <Button type="primary" icon={<IconPlus />} onClick={() => { resetCouponDraft(); setCouponDrawerVisible(true); }}>
                发放券
              </Button>
            </div>
            <Table
              rowKey="id"
              pagination={false}
              data={coupons}
              columns={[
                { title: '券名称', dataIndex: 'name' },
                { title: '券类型', render: (_: unknown, row: CouponRecord) => <Tag color={isDiscountCoupon(row) ? 'purple' : 'arcoblue'}>{couponBenefitTypeLabel(row)}</Tag> },
                { title: '折扣规则', render: (_: unknown, row: CouponRecord) => couponRuleWithThresholdLabel(row) },
                { title: '总额度', render: (_: unknown, row: CouponRecord) => couponQuotaLabel(row) },
                {
                  title: '已用',
                  render: (_: unknown, row: CouponRecord) => (
                    <Space direction="vertical" size={4} className="full-width">
                      <span>{couponUsedLabel(row)}</span>
                      {isVoucherCoupon(row) ? <Progress percent={row.totalDiscountQuota ? Math.round((row.usedDiscountQuota / row.totalDiscountQuota) * 100) : 0} size="small" showText={false} /> : null}
                    </Space>
                  ),
                },
                { title: '剩余', render: (_: unknown, row: CouponRecord) => couponRemainingLabel(row) },
                { title: '有效期', render: (_: unknown, row: CouponRecord) => `${row.effectiveAt} ~ ${row.expiresAt}` },
                { title: '状态', dataIndex: 'status', render: (value: CouponStatus) => <MetaTag {...couponStatusMeta[value]} /> },
                {
                  title: '操作',
                  render: (_: unknown, row: CouponRecord) => (
                    <Space size={8}>
                      {row.status === 'active' ? (
                        <Button type="text" size="mini" status="danger" onClick={() => disableCoupon(row.id)}>作废</Button>
                      ) : null}
                    </Space>
                  ),
                },
              ]}
            />
            <Divider />
            <div className="sales-detail-section__title">使用记录</div>
            <Table
              rowKey="id"
              pagination={false}
              data={couponUsages}
              columns={[
                { title: '订单号', dataIndex: 'orderId' },
                { title: '订单原价', dataIndex: 'originalAmount', render: (value: number) => money(value) },
                { title: '优惠金额', dataIndex: 'discountAmount', render: (value: number) => `-${money(value)}` },
                { title: '实付金额', dataIndex: 'payableAmount', render: (value: number) => money(value) },
                { title: '使用时间', dataIndex: 'usedAt' },
                { title: '状态', dataIndex: 'status', render: (value: CouponUsageRecord['status']) => <MetaTag color={value === 'confirmed' ? 'green' : value === 'reserved' ? 'orange' : 'gray'} text={value === 'confirmed' ? '已抵扣' : value === 'reserved' ? '预占' : '已释放'} /> },
              ]}
            />
          </TabPane>
          <TabPane key="contracts" title="合同">
            <div className="admin-tenant-readonly-head">
              <div>
                <div className="sales-detail-section__title">企业合同</div>
                <Text type="secondary">由超级管理员或财务维护，客户管理员可在客户侧合同管理中查看和下载。</Text>
              </div>
              <Button type="primary" icon={<IconPlus />} onClick={() => { resetContractDraft(); setContractDrawerVisible(true); }}>
                新增合同
              </Button>
            </div>
            <Table
              rowKey="id"
              pagination={false}
              data={contracts}
              columns={[
                { title: '合同编号', dataIndex: 'contractNo' },
                { title: '合同名称', dataIndex: 'name' },
                { title: '类型', dataIndex: 'type', render: (value: BillingContractType) => contractTypeMeta[value] },
                { title: '价格有效期', render: (_: unknown, row: BillingContractRecord) => `${row.validFrom} ~ ${row.validTo}` },
                { title: '完成时间', dataIndex: 'completedAt', render: (value?: string) => value || '-' },
                { title: '状态', dataIndex: 'status', render: (value: BillingContractStatus) => <MetaTag {...contractStatusMeta[value]} /> },
                { title: '备注', dataIndex: 'remark', render: (value?: string) => value || '-' },
                { title: '作废信息', render: (_: unknown, row: BillingContractRecord) => row.status === 'voided' ? `${row.voidedBy || '-'} · ${row.voidedAt || '-'}` : '-' },
                {
                  title: '操作',
                  render: (_: unknown, row: BillingContractRecord) => (
                    <Space size={8}>
                      <Button type="text" size="mini" onClick={() => setActiveContract(row)}>查看</Button>
                      <Button type="text" size="mini" icon={<IconDownload />} onClick={() => Message.info(`模拟下载 ${row.fileName}`)}>下载</Button>
                      {row.status !== 'voided' ? (
                        <Button type="text" size="mini" status="danger" onClick={() => setVoidContractModal({ visible: true, row, reason: '' })}>作废</Button>
                      ) : null}
                    </Space>
                  ),
                },
              ]}
            />
          </TabPane>
          <TabPane key="usage" title="用量统计">
            <div className="chart-box chart-box--large">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={usage}>
                  <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="token" stroke="#165DFF" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="activeEmployees" stroke="#14C9C9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabPane>
          <TabPane key="admins" title="管理员账号">
            {adminAccount ? (
              <div className="sales-info-panels">
                <Card bordered className="sales-info-card">
                  <div className="sales-detail-section__title">客户管理员账号</div>
                  <Descriptions
                    column={2}
                    data={[
                      { label: '姓名', value: adminAccount.name },
                      { label: '手机号', value: adminAccount.phone },
                      { label: '邮箱', value: adminAccount.email || '-' },
                      { label: '角色', value: adminAccount.role === 'R4' ? '客户管理员' : '企业成员' },
                      { label: '状态', value: <MetaTag color={adminAccount.status === 'active' ? 'green' : 'red'} text={adminAccount.status === 'active' ? '正常' : '暂停'} /> },
                      { label: '最近登录', value: adminAccount.lastLoginAt },
                    ]}
                  />
                  <Space>
                    <Button type="text" size="mini" onClick={() => setAdminPasswordReset({ visible: true, password: '' })}>重置密码</Button>
                    <Button type="text" size="mini">暂停账号</Button>
                  </Space>
                </Card>
              </div>
            ) : (
              <Empty description="暂无客户管理员账号" />
            )}
          </TabPane>
          <TabPane key="bindings" title="绑定配置">
            <div className="admin-tenant-readonly-head">
              <div>
                <div className="sales-detail-section__title">技术配置状态</div>
                <Text type="secondary">只读摘要，完整配置、密钥、连通性测试和回滚在交付运维后台处理。</Text>
              </div>
              <Button type="primary" icon={<IconSettings />} onClick={() => navigate(`/ops/im-binding/${detail.id}`)}>
                前往运维配置
              </Button>
            </div>
            <Table rowKey="id" pagination={false} data={detail.bindings} columns={[
              { title: '配置项', dataIndex: 'channel' },
              { title: '范围', dataIndex: 'scope', render: (value: AdminTenantDetail['bindings'][number]['scope']) => (value === 'im' ? 'IM 绑定' : '网络配置') },
              { title: '状态', dataIndex: 'status', render: (value: AdminTenantDetail['bindings'][number]['status']) => <MetaTag {...tenantBindingStatusMeta[value]} /> },
              {
                title: '最近测试',
                render: (_: unknown, row: AdminTenantDetail['bindings'][number]) => (
                  <Space size={6}>
                    <MetaTag {...tenantBindingTestMeta[row.lastTestResult ?? 'untested']} />
                    <Text type="secondary">{row.lastTestAt || '-'}</Text>
                  </Space>
                ),
              },
              { title: '最后变更', render: (_: unknown, row: AdminTenantDetail['bindings'][number]) => row.lastChangedBy ? `${row.lastChangedBy} · ${row.lastChangedAt || '-'}` : '-' },
              { title: '关联工单', dataIndex: 'currentTicketId', render: (value?: string) => value || '-' },
              { title: '说明', dataIndex: 'hint' },
            ]} />
          </TabPane>
          <TabPane key="audit" title="审计日志">
            <div className="admin-tenant-readonly-head">
              <div>
                <div className="sales-detail-section__title">企业审计子集</div>
                <Text type="secondary">来自统一 audit_log，当前仅展示与本企业相关的写操作、代登录和高危动作。</Text>
              </div>
              <Button icon={<IconSafe />} onClick={() => navigate(adminConsolePath(location.pathname, '/system/audit'))}>
                查看全局审计
              </Button>
            </div>
            <Table rowKey="id" pagination={false} data={detail.audit} columns={[
              { title: '时间', dataIndex: 'createdAt' },
              { title: '操作者', dataIndex: 'actor' },
              { title: '动作', dataIndex: 'action' },
              { title: '操作对象', dataIndex: 'target' },
              { title: '结果', dataIndex: 'result', render: (value: string) => <MetaTag color={value === 'success' ? 'green' : 'red'} text={value === 'success' ? '成功' : '失败'} /> },
            ]} />
          </TabPane>
        </Tabs>
      </div>

      <Drawer
        width={620}
        title="新增合同"
        visible={contractDrawerVisible}
        onCancel={() => { setContractDrawerVisible(false); resetContractDraft(); }}
        footer={<Space><Button onClick={() => setContractDrawerVisible(false)}>取消</Button><Button type="primary" onClick={createContract}>保存</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <div className="sales-form-grid sales-form-grid--single">
            <label>
              <span><i className="form-required">*</i>合同编号</span>
              <Input value={contractDraft.contractNo} onChange={(value) => setContractDraft((current) => ({ ...current, contractNo: value }))} placeholder="如 CT20260428161503" />
            </label>
            <label>
              <span><i className="form-required">*</i>合同类型</span>
              <Select value={contractDraft.type} onChange={(value) => setContractDraft((current) => ({ ...current, type: value }))}>
                <Select.Option value="quote">产品报价合同</Select.Option>
                <Select.Option value="order">订单合同</Select.Option>
              </Select>
            </label>
            <label>
              <span><i className="form-required">*</i>合同名称</span>
              <Input value={contractDraft.name} onChange={(value) => setContractDraft((current) => ({ ...current, name: value }))} placeholder="如 云岭制造企业版混合席位报价合同" />
            </label>
            <label>
              <span><i className="form-required">*</i>价格有效期开始</span>
              <DatePicker showTime value={contractDraft.validFrom} onChange={(value) => setContractDraft((current) => ({ ...current, validFrom: value }))} className="full-width" />
            </label>
            <label>
              <span><i className="form-required">*</i>价格有效期结束</span>
              <DatePicker showTime value={contractDraft.validTo} onChange={(value) => setContractDraft((current) => ({ ...current, validTo: value }))} className="full-width" />
            </label>
            <label>
              <span>完成时间</span>
              <DatePicker showTime value={contractDraft.completedAt} onChange={(value) => setContractDraft((current) => ({ ...current, completedAt: value }))} className="full-width" />
            </label>
            <label>
              <span><i className="form-required">*</i>状态</span>
              <Select value={contractDraft.status} onChange={(value) => setContractDraft((current) => ({ ...current, status: value }))}>
                <Select.Option value="pending">待生效</Select.Option>
                <Select.Option value="active">已生效</Select.Option>
                <Select.Option value="expired">已过期</Select.Option>
              </Select>
            </label>
            <label>
              <span><i className="form-required">*</i>合同文件名</span>
              <Input value={contractDraft.fileName} onChange={(value) => setContractDraft((current) => ({ ...current, fileName: value }))} placeholder="如 CT20260428161503.pdf" />
            </label>
            <label>
              <span>备注</span>
              <Input.TextArea rows={4} value={contractDraft.remark} onChange={(value) => setContractDraft((current) => ({ ...current, remark: value }))} placeholder="选填，记录合同来源、关联订单或特殊说明" />
            </label>
          </div>
        </Space>
      </Drawer>

      <Drawer
        width={560}
        title={activeContract ? `合同详情 ${activeContract.contractNo}` : '合同详情'}
        visible={Boolean(activeContract)}
        footer={null}
        onCancel={() => setActiveContract(undefined)}
      >
        {activeContract ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '合同编号', value: activeContract.contractNo },
                { label: '合同名称', value: activeContract.name },
                { label: '合同类型', value: contractTypeMeta[activeContract.type] },
                { label: '价格有效期', value: `${activeContract.validFrom} ~ ${activeContract.validTo}` },
                { label: '创建时间', value: activeContract.createdAt },
                { label: '完成时间', value: activeContract.completedAt || '-' },
                { label: '状态', value: <MetaTag {...contractStatusMeta[activeContract.status]} /> },
                { label: '备注', value: activeContract.remark || '-' },
                { label: '作废时间', value: activeContract.voidedAt || '-' },
                { label: '作废人', value: activeContract.voidedBy || '-' },
                { label: '作废原因', value: activeContract.voidReason || '-' },
                { label: '合同文件', value: activeContract.fileName },
              ]}
            />
            <Button type="primary" icon={<IconDownload />} onClick={() => Message.info(`模拟下载 ${activeContract.fileName}`)}>下载合同</Button>
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        width={640}
        title="发放券"
        visible={couponDrawerVisible}
        onCancel={() => setCouponDrawerVisible(false)}
        footer={<Space><Button onClick={() => setCouponDrawerVisible(false)}>取消</Button><Button type="primary" onClick={createCoupon}>发放</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <Descriptions column={1} data={[
            { label: '发放企业', value: detail.name },
            { label: '发放方式', value: '直接发放到企业账户，不使用券码' },
          ]} />
          <div className="sales-form-grid sales-form-grid--single">
            <div className="sales-field">
              <span><i className="form-required">*</i>券类型</span>
              <Select
                value={couponDraft.benefitType}
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setCouponDraft((current) => withCouponBenefitType(current, value as CouponBenefitType))}
              >
                <Select.Option value="coupon">优惠券</Select.Option>
                <Select.Option value="voucher">代金券</Select.Option>
              </Select>
            </div>
            <div className="sales-field">
              <span><i className="form-required">*</i>绑定券模板</span>
              <Select
                value={couponDraft.templateId || undefined}
                placeholder="请选择券模板"
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setCouponDraft((current) => applyCouponTemplateToDraft(current, String(value)))}
              >
                {enabledCouponTemplateRowsByType.map((item) => (
                  <Select.Option key={item.templateId} value={item.templateId}>
                    {item.name} / {couponTemplateRuleLabel(item)}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <label><span><i className="form-required">*</i>券名称</span><Input value={couponDraft.name} onChange={(value) => setCouponDraft((current) => ({ ...current, name: value }))} maxLength={30} placeholder="选择模板后可调整名称" /></label>
            <Descriptions column={1} data={[
              { label: '绑定券模板', value: selectedCouponTemplate ? couponTemplateRuleLabel(selectedCouponTemplate) : '-' },
              { label: '本次发放规则', value: selectedCouponTemplate && couponDraft.discountRate !== undefined ? `${couponDiscountScopeLabel(couponDraft.discountScope)} · ${couponDiscountRuleLabel(couponDraft.discountRate)}` : '-' },
              { label: '使用限制', value: couponThresholdRuleLabel(couponDraft.thresholdAmount) },
              { label: '使用方式', value: couponDraft.benefitType === 'coupon' ? '优惠券不设余额，单次使用后失效' : '代金券按额度扣减，可多次使用直到余额耗尽' },
            ]} />
            {selectedCouponTemplate ? (
              <label>
                <span><i className="form-required">*</i>优惠范围</span>
                <Select
                  value={couponDraft.discountScope}
                  onChange={(value) => setCouponDraft((current) => ({ ...current, discountScope: value as CouponDiscountScope }))}
                  className="full-width"
                  getPopupContainer={() => document.body}
                  dropdownMenuClassName="admin-coupon-scope-dropdown"
                  triggerProps={{ popupStyle: { zIndex: 3000 } }}
                >
                  <Select.Option value="order">整单</Select.Option>
                  <Select.Option value="seat">席位</Select.Option>
                  <Select.Option value="coding_plan">CodingPlan</Select.Option>
                </Select>
              </label>
            ) : null}
            {selectedCouponTemplate ? (
              <label>
                <span><i className="form-required">*</i>折扣规则</span>
                <InputNumber
                  value={couponDraft.discountRate}
                  min={0}
                  max={99}
                  onChange={(value) => setCouponDraft((current) => ({ ...current, discountRate: value === undefined ? undefined : Number(value) }))}
                  className="full-width"
                  suffix="% 折扣"
                  placeholder="请填写折扣规则"
                />
              </label>
            ) : null}
            <label>
              <span><i className="form-required">*</i>使用限制（满多少可用）</span>
              <InputNumber
                value={couponDraft.thresholdAmount}
                min={0}
                onChange={(value) => setCouponDraft((current) => ({ ...current, thresholdAmount: Number(value) || 0 }))}
                className="full-width"
                suffix="元"
                placeholder="0 表示无门槛"
              />
            </label>
            {couponDraft.benefitType === 'voucher' ? (
              <label><span><i className="form-required">*</i>总代金券额度</span><InputNumber value={couponDraft.totalDiscountQuota} min={1} onChange={(value) => setCouponDraft((current) => ({ ...current, totalDiscountQuota: Number(value) || 0 }))} className="full-width" /></label>
            ) : null}
            {couponDraft.benefitType === 'coupon' && couponDraft.targetKind !== 'tenant' ? (
              <label><span><i className="form-required">*</i>发放数量</span><InputNumber value={couponDraft.issueQuantity} min={1} precision={0} onChange={(value) => setCouponDraft((current) => ({ ...current, issueQuantity: Number(value) || 0 }))} className="full-width" suffix="张" /></label>
            ) : null}
            <label><span><i className="form-required">*</i>生效时间</span><DatePicker value={couponDraft.effectiveAt || undefined} onChange={(value) => setCouponDraft((current) => ({ ...current, effectiveAt: value || '' }))} className="full-width" /></label>
            <label><span><i className="form-required">*</i>失效时间</span><DatePicker value={couponDraft.expiresAt || undefined} onChange={(value) => setCouponDraft((current) => ({ ...current, expiresAt: value || '' }))} className="full-width" /></label>
            <label><span>备注</span><Input.TextArea rows={4} value={couponDraft.remark} onChange={(value) => setCouponDraft((current) => ({ ...current, remark: value }))} placeholder="选填，记录商务政策、会议结论或合同约定" /></label>
          </div>
          <div className="billing-detail-hint">
            <strong>抵扣预览</strong>
            <p>
              例如订单原价 ¥10,000，
              优惠范围 {couponDiscountScopeLabel(couponDraft.discountScope)}，
              {selectedCouponTemplate && couponDraft.discountRate !== undefined ? couponDiscountRuleLabel(couponDraft.discountRate) : '填写折扣规则后'}
              预计抵扣 {money(selectedCouponTemplate && couponDraft.discountRate !== undefined ? calculateCouponIssuePreviewDiscount(couponDraft) : 0)}
              {couponDraft.benefitType === 'coupon' ? '，优惠券不设余额，使用一次后失效。' : '，但累计抵扣不会超过总代金券额度。'}
            </p>
          </div>
        </Space>
      </Drawer>

      <Modal
        title="重置客户管理员密码"
        visible={adminPasswordReset.visible}
        onCancel={() => setAdminPasswordReset({ visible: false, password: '' })}
        footer={(
          <Space>
            <Button onClick={() => setAdminPasswordReset({ visible: false, password: '' })}>取消</Button>
            <Button type="primary" onClick={resetTenantAdminPassword}>确认重置</Button>
          </Space>
        )}
      >
        <div className="admin-password-reset">
          {adminAccount ? (
            <div className="admin-password-reset__account">
              <div>
                <span>手机号账号</span>
                <strong>{adminAccount.phone}</strong>
              </div>
              <Space size={6} wrap>
                <Tag>{adminAccount.role === 'R4' ? '客户管理员' : '企业成员'}</Tag>
                <Tag>{adminAccount.name}</Tag>
              </Space>
            </div>
          ) : null}
          {renderPasswordInputWithGenerator(
            adminPasswordReset.password,
            (password) => setAdminPasswordReset((current) => ({ ...current, password })),
            '请输入至少 8 位新密码',
          )}
        </div>
      </Modal>

      <Modal
        title={adminPasswordResult?.title ?? '临时密码'}
        visible={Boolean(adminPasswordResult)}
        onCancel={() => setAdminPasswordResult(null)}
        footer={<Space><Button onClick={() => setAdminPasswordResult(null)}>关闭</Button><Button type="primary" onClick={copyTenantAdminPassword}>复制临时密码</Button></Space>}
      >
        {adminPasswordResult ? (
          <div className="admin-temp-password">
            <div className="admin-temp-password__row">
              <span>账号姓名</span>
              <strong>{adminPasswordResult.accountName}</strong>
            </div>
            <div className="admin-temp-password__row">
              <span>手机号账号</span>
              <strong>{adminPasswordResult.phone}</strong>
            </div>
            <div className="admin-temp-password__row">
              <span>绑定身份</span>
              <Space size={6} wrap>
                {adminPasswordResult.roles.map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </Space>
            </div>
            <div className="admin-temp-password__value">{adminPasswordResult.password}</div>
            <Text type="secondary">临时密码只展示一次，请复制后交给客户管理员并提醒首次登录后修改。</Text>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="作废合同"
        visible={voidContractModal.visible}
        onCancel={() => setVoidContractModal({ visible: false, reason: '' })}
        onOk={voidContract}
        okButtonProps={{ status: 'danger' }}
        okText="确认作废"
      >
        <Space direction="vertical" size={12} className="full-width">
          <Descriptions
            column={1}
            data={voidContractModal.row ? [
              { label: '合同编号', value: voidContractModal.row.contractNo },
              { label: '合同名称', value: voidContractModal.row.name },
              { label: '当前状态', value: contractStatusMeta[voidContractModal.row.status].text },
            ] : []}
          />
          <Text type="secondary">合同作废后不可恢复，客户侧仍会保留该合同记录并显示“已作废”。如需修正合同，请重新上传一份新合同。</Text>
          <Input.TextArea
            rows={4}
            value={voidContractModal.reason}
            onChange={(value) => setVoidContractModal((current) => ({ ...current, reason: value }))}
            placeholder="请填写作废原因，例如：合同内容有误，已重新上传新版合同"
          />
        </Space>
      </Modal>
    </div>
  );
}

export function AdminImpersonatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<AdminTenantDetail>();
  const [sessions, setSessions] = useState<any[]>([]);
  const [draft, setDraft] = useState({ targetUser: '', ticketNo: '', reason: '' });

  const loadData = async () => {
    setLoading(true);
    const [tenantData, sessionData] = await Promise.all([
      mockApi.getAdminTenantDetail(id),
      mockApi.getAdminImpersonationSessions(id),
    ]);
    setTenant(tenantData);
    setSessions(sessionData);
    setDraft((current) => ({ ...current, targetUser: tenantData.admins[0]?.name || '' }));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading || !tenant) {
    return <Spin className="page-spin" tip="加载代登录配置" />;
  }

  return (
    <div className="sales-detail-screen">
      <DetailHeader
        title={`代登录 · ${tenant.name}`}
        subtitle="单次代登录最长 2 小时，所有操作强制留痕"
        onBack={() => navigate(adminConsolePath(location.pathname, `/tenants/${tenant.id}`))}
      />

      <Card bordered className="admin-risk-card">
        <strong>⚠️ 代登录风险提示</strong>
        <Text type="secondary">开始代登录后，客户管理员将收到站内、邮件、短信通知；会话超时自动结束。</Text>
      </Card>

      <div className="sales-info-panels">
        <Card bordered>
          <div className="sales-detail-section__title">开启代登录会话</div>
          <div className="sales-form-grid sales-form-grid--single">
            <label>
              <span>目标管理员账号</span>
              <Select value={draft.targetUser} onChange={(value) => setDraft((current) => ({ ...current, targetUser: value }))}>
                {tenant.admins.map((admin) => (
                  <Select.Option key={admin.id} value={admin.name}>{admin.name}</Select.Option>
                ))}
              </Select>
            </label>
            <label>
              <span>工单号</span>
              <Input value={draft.ticketNo} onChange={(value) => setDraft((current) => ({ ...current, ticketNo: value }))} placeholder="如 TICKET-20260428-01" />
            </label>
            <label>
              <span>代登录原因</span>
              <Input.TextArea rows={4} value={draft.reason} onChange={(value) => setDraft((current) => ({ ...current, reason: value }))} placeholder="必须填写原因" />
            </label>
            <Button type="primary" onClick={async () => { if (!draft.ticketNo || !draft.reason) { Message.error('请填写工单号和原因'); return; } await mockApi.startAdminImpersonation(tenant.id, draft); Message.success('代登录会话已启动'); loadData(); }}>
              开始代登录
            </Button>
          </div>
        </Card>

        <Card bordered>
          <div className="sales-detail-section__title">会话记录</div>
          <Timeline>
            {sessions.length ? sessions.map((item) => (
              <Timeline.Item key={item.id} label={item.startedAt}>
                <div className="sales-followup-item">
                  <div className="sales-followup-item__head">
                    <Tag color={item.status === 'active' ? 'red' : 'green'}>{item.status === 'active' ? '进行中' : '已结束'}</Tag>
                    <Text type="secondary">{item.ticketNo}</Text>
                  </div>
                  <div>{item.reason}</div>
                  <div className="sales-inline-meta">
                    <Text>目标用户：{item.targetUser}</Text>
                    <Text>预计结束：{item.expectedEndAt}</Text>
                    {item.status === 'active' ? <Button size="mini" onClick={async () => { await mockApi.endAdminImpersonation(item.id); Message.success('代登录已结束'); loadData(); }}>结束代登录</Button> : null}
                  </div>
                </div>
              </Timeline.Item>
            )) : <Empty description="暂无代登录会话" />}
          </Timeline>
        </Card>
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const ordersBasePath = adminConsolePath(location.pathname, '/orders');
  const isAgentProcurementOrderView = location.pathname.startsWith('/agent/admin/orders') || location.pathname.startsWith('/agent/finance/orders');
  const isFinanceView = location.pathname.startsWith('/finance') || location.pathname.startsWith('/agent/finance');
  const isLegacyFinanceView = isFinanceView && !isAgentProcurementOrderView;
  const isDeliveryAdminView = location.pathname.startsWith('/ops-admin');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [openingTasks, setOpeningTasks] = useState<AdminOpeningTaskRecord[]>([]);
  const [query, setQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<keyof typeof paymentStatusMeta | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'wechat' | 'alipay' | 'bank_transfer'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<AdminOrderInvoiceFilter>('all');
  const [createdRange, setCreatedRange] = useState<string[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<any[]>([]);
  const [bankTransferReviews, setBankTransferReviews] = useState<AdminBankTransferReviewItem[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<BillingInvoiceRecord>();
  const [activeOrder, setActiveOrder] = useState<any>();
  const [priceAdjustDraft, setPriceAdjustDraft] = useState<{
    visible: boolean;
    order?: any;
    amount: number;
    reason: string;
    submitting: boolean;
  }>({ visible: false, amount: 0, reason: '', submitting: false });
  const [orderInvoiceVisible, setOrderInvoiceVisible] = useState(false);
  const [orderInvoiceDraft, setOrderInvoiceDraft] = useState<BillingInvoiceDraft & { fileName: string }>({
    orderId: '',
    title: '',
    taxNo: '',
    receiverEmail: '',
    fileName: '',
  });
  const [procurementPaymentDraft, setProcurementPaymentDraft] = useState<{
    visible: boolean;
    order?: AgentProcurementOrderRecord;
    orderId: string;
    paymentMethod: AgentProcurementPaymentMethod;
    proofName: string;
    password: string;
    submitting: boolean;
  }>({ visible: false, orderId: '', paymentMethod: 'wallet', proofName: '', password: '', submitting: false });
  const [walletPaymentSummary, setWalletPaymentSummary] = useState<AgentBalanceSummary>();

  const loadData = async () => {
    setLoading(true);
    const [orderData, openingTaskData, invoiceData, bankTransferReviewData, procurementData] = await Promise.all([
      isAgentProcurementOrderView ? Promise.resolve([]) : mockApi.getAdminOrders(),
      mockApi.getAdminOpeningTasks(),
      isAgentProcurementOrderView ? Promise.resolve([]) : mockApi.getAdminBillingInvoices(),
      isAgentProcurementOrderView ? Promise.resolve([]) : mockApi.getAdminBankTransferReviews(),
      isAgentProcurementOrderView ? mockApi.getAgentProcurementOrders() : Promise.resolve([]),
    ]);
    setRows(isAgentProcurementOrderView ? procurementData : orderData);
    setOpeningTasks(openingTaskData);
    setInvoiceRows(invoiceData);
    setBankTransferReviews(bankTransferReviewData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tenantUsccById = useMemo(
    () => new Map(rows.map((item) => [item.tenantId, item.tenantUscc || item.uscc || ''])),
    [rows],
  );
  const openingTaskByOrderId = useMemo(
    () => new Map(openingTasks.map((item) => [item.orderId, item])),
    [openingTasks],
  );
  const invoiceByOrderId = useMemo(() => new Map(invoiceRows.map((item) => [item.orderId, item])), [invoiceRows]);
  const bankTransferReviewByOrderId = useMemo(
    () => new Map(bankTransferReviews.map((item) => [item.orderId, item])),
    [bankTransferReviews],
  );
  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const [createdFrom, createdTo] = createdRange;
    return rows.filter((item) => {
      if (isAgentProcurementOrderView) {
        return !keyword || `${item.id} ${item.customerOrderId} ${item.tenantName} ${item.agentName} ${item.salesName} ${item.orderSummary}`.toLowerCase().includes(keyword);
      }
      const invoice = invoiceByOrderId.get(item.id) as BillingInvoiceRecord | undefined;
      const canIssue = (item.status === 'paid' || item.status === 'refunded') && !invoice;
      const matchKeyword = !keyword || `${item.id} ${item.tenantName} ${item.ownerSales}`.toLowerCase().includes(keyword);
      const matchStatus = !isLegacyFinanceView || orderStatusFilter === 'all' || item.status === orderStatusFilter;
      const matchPayment = !isLegacyFinanceView || paymentMethodFilter === 'all' || item.paymentMethod === paymentMethodFilter;
      const matchInvoice =
        !isLegacyFinanceView ||
        invoiceFilter === 'all' ||
        (invoiceFilter === 'none' && !invoice) ||
        (invoiceFilter === 'invoiceable' && canIssue) ||
        (invoiceFilter === 'not_invoiceable' && !invoice && !canIssue) ||
        (!!invoice && invoice.status === invoiceFilter);
      const createdDate = String(item.createdAt || '').slice(0, 10);
      const matchCreated = !isLegacyFinanceView || !createdFrom || !createdTo || (createdDate >= createdFrom && createdDate <= createdTo);
      return matchKeyword && matchStatus && matchPayment && matchInvoice && matchCreated;
    });
  }, [createdRange, invoiceByOrderId, invoiceFilter, isAgentProcurementOrderView, isLegacyFinanceView, orderStatusFilter, paymentMethodFilter, query, rows]);
  const openManualInvoiceForOrder = (order: any) => {
    setOrderInvoiceDraft({
      orderId: order.id,
      title: order.tenantName || '',
      taxNo: order.tenantUscc || order.uscc || tenantUsccById.get(order.tenantId) || '',
      receiverEmail: '',
      fileName: `invoice_${order.id}.pdf`,
    });
    setOrderInvoiceVisible(true);
  };
  const resetOrderInvoiceDraft = () => {
    setOrderInvoiceDraft({ orderId: '', title: '', taxNo: '', receiverEmail: '', fileName: '' });
  };
  const openProcurementModal = async (order: AgentProcurementOrderRecord) => {
    setProcurementPaymentDraft({
      visible: true,
      order,
      orderId: order.id,
      paymentMethod: 'wallet',
      proofName: `agent_procurement_${order.id}.png`,
      password: '',
      submitting: false,
    });
    try {
      setWalletPaymentSummary(await mockApi.getAgentBalanceAccount());
    } catch {
      setWalletPaymentSummary(undefined);
    }
  };

  const closeProcurementModal = () => {
    setProcurementPaymentDraft({ visible: false, orderId: '', paymentMethod: 'wallet', proofName: '', password: '', submitting: false });
  };

  const handleSubmitProcurementPayment = async () => {
    if (!procurementPaymentDraft.orderId) {
      Message.error('请选择要支付的采购订单');
      return;
    }
    if (procurementPaymentDraft.paymentMethod === 'wallet' && !procurementPaymentDraft.password.trim()) {
      Message.error('请输入支付密码');
      return;
    }
    if (procurementPaymentDraft.paymentMethod === 'wallet' && procurementPaymentDraft.password.trim().length < 6) {
      Message.error('支付密码至少 6 位');
      return;
    }
    if (procurementPaymentDraft.paymentMethod !== 'wallet' && !procurementPaymentDraft.proofName.trim()) {
      Message.error('请上传或填写平台代理采购支付凭证');
      return;
    }
    setProcurementPaymentDraft((current) => ({ ...current, submitting: true }));
    try {
      if (procurementPaymentDraft.paymentMethod === 'wallet') {
        const result = await mockApi.payAgentProcurementWithWallet(procurementPaymentDraft.orderId);
        if (result) {
          await loadData();
          closeProcurementModal();
          Message.success('平台代理采购已使用钱包支付');
        }
        return;
      }
      await mockApi.submitAgentProcurementProof(procurementPaymentDraft.orderId, {
        paymentMethod: procurementPaymentDraft.paymentMethod,
        proofName: procurementPaymentDraft.proofName.trim(),
      });
      closeProcurementModal();
      await loadData();
      Message.success('支付凭证已提交，等待平台财务审核');
    } catch (error) {
      Message.error(error instanceof Error ? error.message : procurementPaymentDraft.paymentMethod === 'wallet' ? '钱包支付失败' : '支付凭证提交失败');
    } finally {
      setProcurementPaymentDraft((current) => (
        current.visible ? { ...current, submitting: false } : current
      ));
    }
  };
  const archiveCancelledOrder = (order: any) => {
    Modal.confirm({
      title: '归档已取消订单',
      content: `归档后该订单将从订单总览隐藏：${order.id}`,
      okText: '归档',
      cancelText: '取消',
      onOk: async () => {
        const archived = await mockApi.archiveCancelledAdminOrder(order.id);
        if (!archived) {
          Message.error('仅已取消订单可以归档');
          return;
        }
        if (activeOrder?.id === order.id) {
          setActiveOrder(undefined);
        }
        await loadData();
        Message.success('已取消订单已归档');
      },
    });
  };
  const canAdjustPendingOrderPrice =
    !isAgentProcurementOrderView &&
    !isDeliveryAdminView &&
    (location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/finance/orders'));
  const openPriceAdjustModal = (order: any) => {
    setPriceAdjustDraft({
      visible: true,
      order,
      amount: order.amount,
      reason: '',
      submitting: false,
    });
  };
  const closePriceAdjustModal = () => {
    setPriceAdjustDraft({ visible: false, amount: 0, reason: '', submitting: false });
  };
  const submitPriceAdjustment = async () => {
    const order = priceAdjustDraft.order;
    if (!order) {
      Message.error('请选择要改价的订单');
      return;
    }
    const nextAmount = Math.round(Number(priceAdjustDraft.amount));
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      Message.error('请输入有效的新实付金额');
      return;
    }
    if (nextAmount === order.amount) {
      Message.error('新实付金额需要和当前金额不同');
      return;
    }
    if (!priceAdjustDraft.reason.trim()) {
      Message.error('请填写改价原因');
      return;
    }
    setPriceAdjustDraft((current) => ({ ...current, submitting: true }));
    try {
      const actor = isFinanceView ? '财务专员 姚楠' : '官方管理员 林涛';
      const role = isFinanceView ? 'R1.2' : 'R1.0';
      const updatedOrder = await mockApi.updateAdminPendingOrderPrice(order.id, {
        amount: nextAmount,
        reason: priceAdjustDraft.reason.trim(),
        actor,
        role,
      });
      if (!updatedOrder) {
        Message.error('仅待支付订单可以改价');
        return;
      }
      await loadData();
      if (activeOrder?.id === updatedOrder.id) {
        setActiveOrder(updatedOrder);
      }
      closePriceAdjustModal();
      Message.success('订单价格已调整，客户已收到通知');
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '订单改价失败');
    } finally {
      setPriceAdjustDraft((current) => (
        current.visible ? { ...current, submitting: false } : current
      ));
    }
  };
  const openingTicketsPath = isDeliveryAdminView ? '/ops-admin/tickets?type=opening&view=all' : isFinanceView ? '' : `${ordersBasePath}/opening-tasks`;
  const openingTaskByTaskId = new Map(openingTasks.map((item) => [item.id, item]));
  const agentProcurementColumns = [
    { title: '采购单号', dataIndex: 'id', width: 180 },
    { title: '终端客户', dataIndex: 'tenantName', width: 160 },
    { title: '订单内容', dataIndex: 'orderSummary', width: 240 },
    { title: '平台协议价', dataIndex: 'protocolAmount', width: 140, render: (value: number) => money(value) },
    { title: '支付方式', dataIndex: 'procurementPaymentMethod', width: 120, render: (value?: AgentProcurementPaymentMethod) => agentProcurementPaymentMethodLabel(value) },
    { title: '支付凭证', dataIndex: 'procurementProofName', width: 180, render: (value?: string) => value || '-' },
    { title: '状态', dataIndex: 'status', width: 150, render: (value: AgentProcurementOrderRecord['status']) => <Tag color={agentProcurementStatusMeta[value].color}>{agentProcurementStatusMeta[value].text}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, row: AgentProcurementOrderRecord) => (
        row.status === 'pending_procurement' && !isFinanceView ? (
          <Button type="text" size="mini" onClick={() => openProcurementModal(row)}>去采购</Button>
        ) : <Button type="text" size="mini" onClick={() => setActiveOrder(row)}>详情</Button>
      ),
    },
  ];
  return (
    <AdminPageShell
      title={isAgentProcurementOrderView ? '采购订单' : '订单与账单'}
      description={isAgentProcurementOrderView ? '平台代理采购订单、支付凭证与交付状态总览' : isFinanceView ? '订单、开票与对公审核入口' : isDeliveryAdminView ? '订单、对公审核与交付工单队列入口' : '订单、对公审核与开通工单进度入口'}
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <AdminTablePanel
        toolbar={(
          <Space direction="vertical" size={12} className="full-width">
            <div className="sales-filter-bar">
              <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索订单号、企业、代理" />
              {isLegacyFinanceView ? (
                <>
                  <Select value={orderStatusFilter} onChange={setOrderStatusFilter} placeholder="订单状态" className="admin-orders-filter-select" triggerProps={{ autoAlignPopupWidth: false }}>
                    <Select.Option value="all">全部订单状态</Select.Option>
                    <Select.Option value="pending">待支付</Select.Option>
                    <Select.Option value="pending_review">待审核</Select.Option>
                    <Select.Option value="paid">已支付</Select.Option>
                    <Select.Option value="refunded">已退款</Select.Option>
                    <Select.Option value="cancelled">已取消</Select.Option>
                  </Select>
                  <Select value={paymentMethodFilter} onChange={setPaymentMethodFilter} placeholder="支付方式" className="admin-orders-filter-select" triggerProps={{ autoAlignPopupWidth: false }}>
                    <Select.Option value="all">全部支付方式</Select.Option>
                    <Select.Option value="wechat">微信</Select.Option>
                    <Select.Option value="alipay">支付宝</Select.Option>
                    <Select.Option value="bank_transfer">对公转账</Select.Option>
                  </Select>
                  <Select value={invoiceFilter} onChange={setInvoiceFilter} placeholder="开票状态" className="admin-orders-filter-select" triggerProps={{ autoAlignPopupWidth: false }}>
                    <Select.Option value="all">全部开票状态</Select.Option>
                    <Select.Option value="none">未开票</Select.Option>
                    <Select.Option value="invoiceable">未开票可开票</Select.Option>
                    <Select.Option value="not_invoiceable">未开票不可开票</Select.Option>
                    <Select.Option value="pending">待开票</Select.Option>
                    <Select.Option value="issued">已开票</Select.Option>
                    <Select.Option value="rejected">已驳回</Select.Option>
                  </Select>
                  <DatePicker.RangePicker value={createdRange} onChange={(value) => setCreatedRange(value || [])} className="admin-orders-date-range" placeholder={['创建开始', '创建结束']} />
                </>
              ) : null}
              {!isFinanceView && isDeliveryAdminView ? <Button onClick={() => navigate(openingTicketsPath)}>交付工单队列</Button> : null}
            </div>
          </Space>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={isAgentProcurementOrderView ? agentProcurementColumns : [
            { title: '订单号', dataIndex: 'id' },
            { title: '企业', dataIndex: 'tenantName' },
            ...(!isDeliveryAdminView ? [{ title: '归属销售', dataIndex: 'ownerSales' }] : []),
            { title: '类型', dataIndex: 'orderType', render: (value: string, row: any) => orderSummaryLabel(value, row.bundleLines) },
            { title: '订单原价', render: (_: unknown, row: any) => money(row.originalAmount ?? row.amount) },
            { title: '优惠金额', render: (_: unknown, row: any) => row.couponDiscountAmount ? `-${money(row.couponDiscountAmount)}` : '-' },
            { title: '实付金额', dataIndex: 'amount', render: (value: number) => money(value) },
            { title: '支付方式', dataIndex: 'paymentMethod', render: paymentMethodLabel },
            {
              title: '状态',
              dataIndex: 'status',
              render: (value: keyof typeof paymentStatusMeta, row: any) => (
                <Space size={6}>
                  <MetaTag {...paymentStatusMeta[value]} />
                  {isFinanceView && value === 'pending_review' && bankTransferReviewByOrderId.get(row.id)?.reviewStatus === 'pending_finance_review' ? (
                    <Button
                      type="text"
                      size="mini"
                      onClick={() => navigate(`${ordersBasePath}/bank-transfer-review?orderId=${encodeURIComponent(row.id)}`)}
                    >
                      去处理
                    </Button>
                  ) : null}
                </Space>
              ),
            },
            ...(isFinanceView
              ? [{
                  title: '发票',
                  render: (_: unknown, row: any) => {
	                    const invoice = invoiceByOrderId.get(row.id) as BillingInvoiceRecord | undefined;
                      const invoiceEligible = row.status === 'paid' || row.status === 'refunded';
                      const canIssue = invoiceEligible && !invoice;
                      if (!invoiceEligible) {
                        return <MetaTag color="gray" text="未开票" />;
                      }
	                    if (!invoice) {
                        return canIssue ? (
                          <Space size={6}>
                            <MetaTag color="gray" text="未开票" />
                            <Button type="text" size="mini" onClick={() => openManualInvoiceForOrder(row)}>开票</Button>
                          </Space>
                        ) : <MetaTag color="gray" text="未开票" />;
                      }
	                    return (
	                      <Space size={6}>
	                        <MetaTag {...invoiceStatusMeta[invoice.status as BillingInvoiceRecord['status']]} />
                          {invoice.status === 'issued' ? (
                            <Button type="text" size="mini" onClick={() => setPreviewInvoice(invoice)}>查看</Button>
                          ) : (
                            <Button type="text" size="mini" onClick={() => navigate(`${ordersBasePath}/invoices?orderId=${encodeURIComponent(row.id)}`)}>
                              {invoice.status === 'pending' ? '去处理' : '查看记录'}
                            </Button>
                          )}
	                      </Space>
	                    );
                  },
                }]
              : []),
            {
              title: '开通状态',
              render: (_: unknown, row: any) => {
                const task = openingTaskByOrderId.get(row.id);
                if (!task) return row.status === 'paid' ? <Tag color="gray">无需开通</Tag> : <Tag color="gray">未生成</Tag>;
                return <MetaTag {...openingTaskStatusMeta[task.status]} />;
              },
            },
	            { title: '创建时间', dataIndex: 'createdAt' },
	            { title: '付款时间', dataIndex: 'paidAt', render: (value?: string) => value || '-' },
            {
              title: '操作',
              fixed: 'right' as const,
              width: 180,
              render: (_: unknown, row: any) => (
                <Space size={6}>
                  <Button type="text" size="mini" onClick={() => setActiveOrder(row)}>详情</Button>
                  {canAdjustPendingOrderPrice && row.status === 'pending' ? (
                    <Button type="text" size="mini" onClick={() => openPriceAdjustModal(row)}>改价</Button>
                  ) : null}
                  {row.status === 'cancelled' && !isAgentProcurementOrderView ? (
                    <Button type="text" size="mini" status="danger" onClick={() => archiveCancelledOrder(row)}>归档</Button>
                  ) : null}
                </Space>
              ),
            },
	          ]}
          scroll={{ x: isAgentProcurementOrderView ? 1260 : isFinanceView ? undefined : 1480 }}
        />
      </AdminTablePanel>

      <Drawer
        title={activeOrder ? `订单详情 ${activeOrder.id}` : '订单详情'}
        visible={Boolean(activeOrder)}
        width={720}
        footer={null}
        onCancel={() => setActiveOrder(undefined)}
      >
        {activeOrder ? (() => {
          const task = openingTaskByOrderId.get(activeOrder.id);
          const invoice = invoiceByOrderId.get(activeOrder.id) as BillingInvoiceRecord | undefined;
          const review = bankTransferReviewByOrderId.get(activeOrder.id);
          if (isAgentProcurementOrderView) {
            const procurementTask = activeOrder.openingTaskId ? openingTaskByTaskId.get(activeOrder.openingTaskId) : undefined;
            return (
              <Space direction="vertical" size={16} className="full-width">
                <Descriptions
                  column={1}
                  data={[
                    { label: '采购单号', value: activeOrder.id },
                    { label: '关联镜像站订单', value: activeOrder.customerOrderId },
                    { label: '终端客户', value: activeOrder.tenantName },
                    { label: '代理', value: activeOrder.agentName },
                    { label: '代理销售', value: activeOrder.salesName },
                    { label: '订单内容', value: activeOrder.orderSummary },
                    { label: '平台协议价', value: money(activeOrder.protocolAmount) },
                    { label: '支付方式', value: agentProcurementPaymentMethodLabel(activeOrder.procurementPaymentMethod) },
                    { label: '支付凭证', value: activeOrder.procurementProofName || '-' },
                    { label: '采购状态', value: <Tag color={agentProcurementStatusMeta[activeOrder.status as AgentProcurementOrderRecord['status']].color}>{agentProcurementStatusMeta[activeOrder.status as AgentProcurementOrderRecord['status']].text}</Tag> },
                    { label: '财务负责人', value: activeOrder.financeOwner || '-' },
                    { label: '交付负责人', value: activeOrder.deliveryOwner || '-' },
                    { label: '更新时间', value: activeOrder.updatedAt },
                  ]}
                />
                {procurementTask ? (
                  <OpeningProgressPanel
                    status={normalizeOpeningProgressStatus(procurementTask.status, activeOrder.status === 'completed' ? 'paid' : 'pending')}
                    orderId={activeOrder.id}
                    taskId={procurementTask.id}
                    owner={procurementTask.deliveryOwner}
                    updatedAt={procurementTask.updatedAt || activeOrder.updatedAt}
                    failureReason={procurementTask.failureReason}
                  />
                ) : null}
              </Space>
            );
          }
          return (
            <Space direction="vertical" size={16} className="full-width">
              <Descriptions
                column={1}
                data={[
                  { label: '企业', value: activeOrder.tenantName },
                  { label: '订单类型', value: orderSummaryLabel(activeOrder.orderType, activeOrder.bundleLines) },
                  {
                    label: '购买内容',
                    value: activeOrder.bundleLines?.length ? (
                      <div>
                        {orderBundleDetailLines(activeOrder.bundleLines).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                    ) : activeOrder.orderType,
                  },
                  { label: '订单原价', value: money(activeOrder.originalAmount ?? activeOrder.amount) },
                  { label: '优惠金额', value: activeOrder.couponDiscountAmount ? `-${money(activeOrder.couponDiscountAmount)}` : '-' },
                  { label: '实付金额', value: money(activeOrder.amount) },
                  ...(activeOrder.priceAdjustment
                    ? [{ label: '人工调价', value: priceAdjustmentText(activeOrder.priceAdjustment) }]
                    : []),
                  { label: '支付方式', value: paymentMethodLabel(activeOrder.paymentMethod) },
                  { label: '订单状态', value: <MetaTag {...paymentStatusMeta[activeOrder.status as keyof typeof paymentStatusMeta]} /> },
                  ...(activeOrder.status === 'pending' || activeOrder.paymentExpiredAt
                    ? [{ label: '支付截止', value: adminPaymentDeadlineText(activeOrder) }]
                    : []),
                  {
                    label: '对公审核',
                    value: activeOrder.paymentMethod === 'bank_transfer'
                      ? review?.reviewStatus ? <MetaTag {...bankReviewStatusMeta[review.reviewStatus]} /> : '未提交凭证'
                      : '不适用 / 自动确认',
                  },
                  { label: '发票状态', value: invoice ? <MetaTag {...invoiceStatusMeta[invoice.status as BillingInvoiceRecord['status']]} /> : '未开票' },
                ]}
              />
              <OpeningProgressPanel
                status={normalizeOpeningProgressStatus(task?.status, activeOrder.status)}
                orderId={activeOrder.id}
                taskId={task?.id}
                owner={task?.deliveryOwner}
                updatedAt={task?.updatedAt || activeOrder.paidAt || activeOrder.createdAt}
                failureReason={task?.failureReason}
              />
            </Space>
          );
        })() : null}
      </Drawer>

      <Modal
        title="修改未支付订单价格"
        visible={priceAdjustDraft.visible}
        onCancel={closePriceAdjustModal}
        footer={(
          <Space>
            <Button onClick={closePriceAdjustModal}>取消</Button>
            <Button type="primary" loading={priceAdjustDraft.submitting} onClick={submitPriceAdjustment}>确认改价</Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={16} className="full-width">
          {priceAdjustDraft.order ? (
            <Descriptions
              column={1}
              data={[
                { label: '订单号', value: priceAdjustDraft.order.id },
                { label: '企业', value: priceAdjustDraft.order.tenantName },
                { label: '当前实付金额', value: money(priceAdjustDraft.order.amount) },
                { label: '支付截止', value: adminPaymentDeadlineText(priceAdjustDraft.order) },
              ]}
            />
          ) : null}
          <label className="sales-field">
            <span>新实付金额</span>
            <InputNumber
              min={1}
              precision={0}
              prefix="¥"
              className="full-width"
              value={priceAdjustDraft.amount}
              onChange={(value) => setPriceAdjustDraft((current) => ({ ...current, amount: Number(value) || 0 }))}
            />
            {priceAdjustDraft.order && priceAdjustDraft.amount !== priceAdjustDraft.order.amount ? (
              <small className="sales-form-hint">
                调价差额：{priceAdjustDraft.amount > priceAdjustDraft.order.amount ? '+' : '-'}{money(Math.abs(priceAdjustDraft.amount - priceAdjustDraft.order.amount))}
              </small>
            ) : null}
          </label>
          <label className="sales-field">
            <span>改价原因</span>
            <Input.TextArea
              value={priceAdjustDraft.reason}
              onChange={(value) => setPriceAdjustDraft((current) => ({ ...current, reason: value }))}
              placeholder="例如：商务折扣确认、线下报价调整"
              maxLength={120}
              showWordLimit
            />
          </label>
          <Alert type="info" content="仅待支付订单可改价。改价后客户会收到通知，并按新的实付金额完成支付，支付截止时间不重置。" />
        </Space>
      </Modal>

      <Modal
        title="平台代理采购"
        visible={procurementPaymentDraft.visible}
        onCancel={closeProcurementModal}
        footer={(
          <Space>
            <Button onClick={closeProcurementModal}>取消</Button>
            <Button type="primary" loading={procurementPaymentDraft.submitting} onClick={handleSubmitProcurementPayment}>
              {procurementPaymentDraft.paymentMethod === 'wallet' ? '确认支付' : '提交凭证'}
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={16} className="full-width">
          {procurementPaymentDraft.order ? (
            <Descriptions
              column={1}
              data={[
                { label: '采购单号', value: procurementPaymentDraft.order.id },
                { label: '终端客户', value: procurementPaymentDraft.order.tenantName },
                { label: '订单内容', value: procurementPaymentDraft.order.orderSummary },
                { label: '平台协议价', value: money(procurementPaymentDraft.order.protocolAmount) },
              ]}
            />
          ) : null}
          <label className="sales-field">
            <span>支付方式</span>
            <Select
              value={procurementPaymentDraft.paymentMethod}
              onChange={(value) => setProcurementPaymentDraft((current) => ({
                ...current,
                paymentMethod: value as AgentProcurementPaymentMethod,
                proofName: value === 'wallet' ? current.proofName : current.proofName || `agent_procurement_${current.orderId}.png`,
                password: value === 'wallet' ? current.password : '',
              }))}
            >
              <Select.Option value="wallet">钱包支付</Select.Option>
              <Select.Option value="bank_transfer">对公转账（上传凭证）</Select.Option>
              <Select.Option value="wechat">微信转账（上传凭证）</Select.Option>
            </Select>
          </label>
          {procurementPaymentDraft.paymentMethod === 'wallet' ? (
            <>
              {procurementPaymentDraft.order ? (
                <Descriptions
                  column={1}
                  data={[
                    { label: '当前钱包余额', value: walletPaymentSummary ? money(walletPaymentSummary.currentBalance) : '读取中' },
                    {
                      label: '支付后余额',
                      value: walletPaymentSummary ? money(walletPaymentSummary.currentBalance - procurementPaymentDraft.order.protocolAmount) : '读取中',
                    },
                  ]}
                />
              ) : null}
              {walletPaymentSummary && procurementPaymentDraft.order && walletPaymentSummary.currentBalance < procurementPaymentDraft.order.protocolAmount ? (
                <Alert type="warning" content="当前钱包余额不足，确认支付时将无法完成扣款。请先充值钱包或改用上传支付凭证。" />
              ) : null}
              <label className="sales-field">
                <span><i className="form-required">*</i>支付密码</span>
                <Input.Password
                  value={procurementPaymentDraft.password}
                  onChange={(password) => setProcurementPaymentDraft((current) => ({ ...current, password }))}
                  placeholder="请输入支付密码"
                />
              </label>
            </>
          ) : (
            <>
              {procurementPaymentDraft.paymentMethod === 'wechat' && procurementPaymentDraft.order ? (
                <div className="payment-method-body">
                  <div className="electronic-payment-panel electronic-payment-panel--stacked">
                    <div className="electronic-payment-qr">
                      <span>微信采购付款码</span>
                      <small>微信采购付款码 PROCURE-{procurementPaymentDraft.order.id}-{String(procurementPaymentDraft.order.protocolAmount).padStart(6, '0')} · {money(procurementPaymentDraft.order.protocolAmount)}</small>
                    </div>
                    <Text type="secondary">使用微信完成平台代理采购付款后，上传微信付款凭证供平台财务审核。</Text>
                  </div>
                </div>
              ) : null}
              {procurementPaymentDraft.paymentMethod === 'bank_transfer' && procurementPaymentDraft.order ? (
                <div className="payment-method-body">
                  <Descriptions
                    title="对公转账信息"
                    column={1}
                    data={[
                      { label: '收款主体', value: walletPaymentSummary?.collectionAccount.companyName ?? '读取中' },
                      {
                        label: '开户银行',
                        value: walletPaymentSummary ? `${walletPaymentSummary.collectionAccount.bankName} ${walletPaymentSummary.collectionAccount.branchName}` : '读取中',
                      },
                      { label: '银行账号', value: walletPaymentSummary?.collectionAccount.accountNo ?? '读取中' },
                      { label: '唯一备注号', value: walletPaymentSummary?.collectionAccount.remarkCode ?? '读取中' },
                      { label: '转账金额', value: money(procurementPaymentDraft.order.protocolAmount) },
                    ]}
                  />
                  {walletPaymentSummary?.collectionAccount.note ? <Alert type="info" content={walletPaymentSummary.collectionAccount.note} /> : null}
                </div>
              ) : null}
              <div className="sales-field">
                <span><i className="form-required">*</i>{procurementPaymentDraft.paymentMethod === 'wechat' ? '微信付款凭证' : '对公转账凭证'}</span>
                <MockUploadField
                  fileName={procurementPaymentDraft.proofName}
                  onFileNameChange={(value) => setProcurementPaymentDraft((current) => ({ ...current, proofName: value }))}
                  buttonText={procurementPaymentDraft.paymentMethod === 'wechat' ? '上传微信付款凭证' : '上传对公转账凭证'}
                  tip="Mock 上传：提交后进入平台财务审核"
                  placeholder={procurementPaymentDraft.paymentMethod === 'wechat' ? '请输入或上传微信付款凭证文件名' : '请输入或上传对公转账凭证文件名'}
                />
              </div>
              <Alert type="info" content="这里是代理向平台采购付款，不是客户扫码支付入口。微信转账或对公转账完成后上传凭证，由平台财务审核。" />
            </>
          )}
        </Space>
      </Modal>

      <Modal
        title="开票"
        visible={orderInvoiceVisible}
        onCancel={() => { setOrderInvoiceVisible(false); resetOrderInvoiceDraft(); }}
        onOk={async () => {
          if (!orderInvoiceDraft.orderId || !orderInvoiceDraft.title.trim() || !orderInvoiceDraft.receiverEmail.trim() || !orderInvoiceDraft.fileName.trim()) {
            Message.error('请填写抬头、邮箱和发票文件名');
            return;
          }
          const linkedOrder = rows.find((item) => item.id === orderInvoiceDraft.orderId);
          const taxNo = orderInvoiceDraft.taxNo || linkedOrder?.tenantUscc || linkedOrder?.uscc || tenantUsccById.get(linkedOrder?.tenantId);
          if (!taxNo) {
            Message.error('企业统一社会信用代码缺失，无法开票');
            return;
          }
          await mockApi.createAndIssueBillingInvoice({
            ...orderInvoiceDraft,
            title: orderInvoiceDraft.title.trim(),
            taxNo: taxNo.trim(),
            receiverEmail: orderInvoiceDraft.receiverEmail.trim(),
            fileName: orderInvoiceDraft.fileName.trim(),
          });
          Message.success('发票已创建并上传');
          setOrderInvoiceVisible(false);
          resetOrderInvoiceDraft();
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Descriptions
            column={1}
            data={[
              { label: '订单号', value: orderInvoiceDraft.orderId || '-' },
              { label: '订单金额', value: money(rows.find((item) => item.id === orderInvoiceDraft.orderId)?.amount || 0) },
              { label: '纳税人识别号/统一社会信用代码', value: orderInvoiceDraft.taxNo || '-' },
            ]}
          />
          <Input value={orderInvoiceDraft.title} onChange={(value) => setOrderInvoiceDraft((current) => ({ ...current, title: value }))} placeholder="发票抬头" />
          <Input value={orderInvoiceDraft.receiverEmail} onChange={(value) => setOrderInvoiceDraft((current) => ({ ...current, receiverEmail: value }))} placeholder="接收邮箱" />
          <InvoiceUploadField
            fileName={orderInvoiceDraft.fileName}
            onFileNameChange={(value) => setOrderInvoiceDraft((current) => ({ ...current, fileName: value }))}
          />
        </Space>
      </Modal>

      <Drawer
        width={620}
        title={previewInvoice ? `发票详情 ${previewInvoice.id}` : '发票详情'}
        visible={Boolean(previewInvoice)}
        footer={null}
        onCancel={() => setPreviewInvoice(undefined)}
      >
        {previewInvoice ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '申请单号', value: previewInvoice.id },
                { label: '订单号', value: previewInvoice.orderId },
                { label: '企业', value: rows.find((item) => item.id === previewInvoice.orderId)?.tenantName ?? '-' },
                { label: '申请来源', value: invoiceSourceMeta[previewInvoice.source].text },
                { label: '状态', value: invoiceStatusMeta[previewInvoice.status].text },
                { label: '发票抬头', value: previewInvoice.title },
                { label: '纳税人识别号', value: previewInvoice.taxNo },
                { label: '金额', value: money(previewInvoice.amount) },
                { label: '接收邮箱', value: previewInvoice.receiverEmail },
                { label: '申请时间', value: previewInvoice.appliedAt },
                { label: '开票时间', value: previewInvoice.issuedAt || '-' },
                { label: '驳回原因', value: previewInvoice.rejectReason || '-' },
                { label: '文件名', value: previewInvoice.fileName || '-' },
              ]}
            />
            {previewInvoice.status === 'issued' ? (
              <>
                <Button
                  type="primary"
                  icon={<IconDownload />}
                  disabled={!previewInvoice.fileName}
                  onClick={() => Message.success(`开始下载 ${previewInvoice.fileName}`)}
                >
                  下载发票
                </Button>
                <div className="invoice-preview-card">
                  <div className="invoice-preview-card__title">电子发票模拟预览</div>
                  <div className="invoice-preview-card__file">{previewInvoice.fileName}</div>
                  <div className="invoice-preview-card__grid">
                    <span>购买方</span><strong>{previewInvoice.title}</strong>
                    <span>税号</span><strong>{previewInvoice.taxNo}</strong>
                    <span>价税合计</span><strong>{money(previewInvoice.amount)}</strong>
                    <span>关联订单</span><strong>{previewInvoice.orderId}</strong>
                  </div>
                </div>
              </>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

    </AdminPageShell>
  );
}

export function AdminInvoicesPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | BillingInvoiceRecord['status']>('all');
  const [query, setQuery] = useState('');
  const [issueModal, setIssueModal] = useState<{ visible: boolean; row?: BillingInvoiceRecord; fileName: string }>({
    visible: false,
    fileName: '',
  });
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; row?: BillingInvoiceRecord; reason: string }>({
    visible: false,
    reason: '',
  });
  const [manualVisible, setManualVisible] = useState(false);
  const [manualDraft, setManualDraft] = useState<BillingInvoiceDraft & { fileName: string }>({
    orderId: '',
    title: '',
    taxNo: '',
    receiverEmail: '',
    fileName: '',
  });
  const [previewInvoice, setPreviewInvoice] = useState<BillingInvoiceRecord>();

  const loadData = async () => {
    setLoading(true);
    const [orderData, invoiceData] = await Promise.all([
      mockApi.getAdminOrders(),
      mockApi.getAdminBillingInvoices(),
    ]);
    setOrders(orderData);
    setInvoices(invoiceData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(location.search).get('orderId');
    if (!orderId) return;
    setQuery(orderId);
    setStatusFilter('all');
  }, [location.search]);

  const orderById = useMemo(() => new Map(orders.map((item) => [item.id, item])), [orders]);
  const invoiceOrderIds = useMemo(() => new Set(invoices.map((item) => item.orderId)), [invoices]);
  const invoiceableOrders = useMemo(
    () => orders.filter((item) => (item.status === 'paid' || item.status === 'refunded') && !invoiceOrderIds.has(item.id)),
    [invoiceOrderIds, orders],
  );
  const filteredInvoices = useMemo(
    () =>
      invoices.filter((item) => {
        const order = orderById.get(item.orderId);
        const haystack = `${item.id} ${item.orderId} ${order?.tenantName ?? ''} ${item.title} ${item.taxNo}`.toLowerCase();
        return (statusFilter === 'all' || item.status === statusFilter) && haystack.includes(query.toLowerCase());
      }),
    [invoices, orderById, query, statusFilter],
  );
  const counters = useMemo(
    () => ({
      pending: invoices.filter((item) => item.status === 'pending').length,
      issued: invoices.filter((item) => item.status === 'issued').length,
      rejected: invoices.filter((item) => item.status === 'rejected').length,
    }),
    [invoices],
  );

  const resetManualDraft = () => {
    setManualDraft({ orderId: '', title: '', taxNo: '', receiverEmail: '', fileName: '' });
  };

  const resolveOrderTaxNo = (orderId: string) => {
    const order = orderById.get(orderId) as any;
    return order?.tenantUscc || order?.uscc || '';
  };

  return (
    <AdminPageShell
      title="发票管理"
      description="集中处理客户开票申请，也可对已支付订单开票"
      action={<Space><Button icon={<IconPlus />} type="primary" onClick={() => setManualVisible(true)}>开票</Button><Button icon={<IconRefresh />} onClick={loadData}>刷新</Button></Space>}
    >
      <AdminTablePanel
        toolbar={(
          <Space direction="vertical" size={12} className="full-width">
            <div className="sales-filter-bar">
              <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索申请单、订单号、企业、抬头、税号" />
              <Radio.Group type="button" value={statusFilter} onChange={setStatusFilter}>
                <Radio value="all">全部 {invoices.length}</Radio>
                <Radio value="pending">待开票 {counters.pending}</Radio>
                <Radio value="issued">已开票 {counters.issued}</Radio>
                <Radio value="rejected">已驳回 {counters.rejected}</Radio>
              </Radio.Group>
            </div>
          </Space>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={filteredInvoices}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '申请单号', dataIndex: 'id' },
            { title: '订单号', dataIndex: 'orderId' },
            { title: '企业', render: (_: unknown, row: BillingInvoiceRecord) => orderById.get(row.orderId)?.tenantName ?? '-' },
            { title: '金额', dataIndex: 'amount', render: (value: number) => money(value) },
            { title: '发票抬头', dataIndex: 'title' },
            { title: '税号', dataIndex: 'taxNo' },
            { title: '接收邮箱', dataIndex: 'receiverEmail' },
            { title: '申请时间', dataIndex: 'appliedAt' },
            { title: '开票时间', dataIndex: 'issuedAt', render: (value?: string) => value || '-' },
            { title: '状态', dataIndex: 'status', render: (value: BillingInvoiceRecord['status']) => <MetaTag {...invoiceStatusMeta[value]} /> },
            {
              title: '操作',
              render: (_: unknown, row: BillingInvoiceRecord) => (
                <Space size={6}>
                  {row.status === 'pending' ? (
                    <>
                      <Button type="text" size="mini" onClick={() => setIssueModal({ visible: true, row, fileName: row.fileName || `invoice_${row.orderId}.pdf` })}>上传</Button>
                      <Button type="text" size="mini" status="danger" onClick={() => setRejectModal({ visible: true, row, reason: row.rejectReason || '' })}>驳回</Button>
                    </>
                  ) : null}
	                  {row.status === 'issued' && row.fileName ? (
	                    <Button type="text" size="mini" onClick={() => setPreviewInvoice(row)}>查看</Button>
	                  ) : null}
                  {row.status === 'rejected' ? (
                    <Button type="text" size="mini" onClick={() => setPreviewInvoice(row)}>查看</Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

	      <Modal
        title="上传发票文件"
        visible={issueModal.visible}
        onCancel={() => setIssueModal({ visible: false, fileName: '' })}
        onOk={async () => {
          if (!issueModal.row || !issueModal.fileName.trim()) {
            Message.error('请输入发票文件名');
            return;
          }
          await mockApi.issueBillingInvoice({ id: issueModal.row.id, fileName: issueModal.fileName.trim() });
          Message.success('发票已上传');
          setIssueModal({ visible: false, fileName: '' });
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Descriptions
            column={1}
            data={issueModal.row ? [
              { label: '申请单号', value: issueModal.row.id },
              { label: '订单号', value: issueModal.row.orderId },
              { label: '企业', value: orderById.get(issueModal.row.orderId)?.tenantName ?? '-' },
              { label: '发票抬头', value: issueModal.row.title },
              { label: '金额', value: money(issueModal.row.amount) },
            ] : []}
          />
          <InvoiceUploadField
            fileName={issueModal.fileName}
            onFileNameChange={(value) => setIssueModal((current) => ({ ...current, fileName: value }))}
          />
        </Space>
      </Modal>

      <Modal
        title="驳回发票申请"
        visible={rejectModal.visible}
        onCancel={() => setRejectModal({ visible: false, reason: '' })}
        onOk={async () => {
          if (!rejectModal.row || !rejectModal.reason.trim()) {
            Message.error('请输入驳回原因');
            return;
          }
          await mockApi.rejectBillingInvoice({ id: rejectModal.row.id, reason: rejectModal.reason.trim() });
          Message.success('发票申请已驳回');
          setRejectModal({ visible: false, reason: '' });
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Text>驳回后客户侧会看到“已驳回”状态。</Text>
          <Input.TextArea rows={4} value={rejectModal.reason} onChange={(value) => setRejectModal((current) => ({ ...current, reason: value }))} placeholder="例如：发票抬头或税号与合同主体不一致" />
        </Space>
      </Modal>

      <Modal
        title="开票"
        visible={manualVisible}
        onCancel={() => { setManualVisible(false); resetManualDraft(); }}
        onOk={async () => {
          if (!manualDraft.orderId || !manualDraft.title.trim() || !manualDraft.receiverEmail.trim() || !manualDraft.fileName.trim()) {
            Message.error('请填写订单、抬头、邮箱和发票文件名');
            return;
          }
          const taxNo = manualDraft.taxNo || resolveOrderTaxNo(manualDraft.orderId);
          if (!taxNo) {
            Message.error('企业统一社会信用代码缺失，无法开票');
            return;
          }
          await mockApi.createAndIssueBillingInvoice({
            ...manualDraft,
            title: manualDraft.title.trim(),
            taxNo: taxNo.trim(),
            receiverEmail: manualDraft.receiverEmail.trim(),
            fileName: manualDraft.fileName.trim(),
          });
          Message.success('发票已创建并上传');
          setManualVisible(false);
          resetManualDraft();
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Select
            value={manualDraft.orderId || undefined}
            placeholder="选择已支付且未开票订单"
            onChange={(value) => {
              const order = orders.find((item) => item.id === value);
              setManualDraft((current) => ({
                ...current,
                orderId: value,
                title: order?.tenantName || current.title,
                taxNo: order?.tenantUscc || order?.uscc || '',
                fileName: current.fileName || `invoice_${value}.pdf`,
              }));
            }}
          >
            {invoiceableOrders.map((order) => (
              <Select.Option key={order.id} value={order.id}>
                {order.id} / {order.tenantName} / {money(order.amount)}
              </Select.Option>
            ))}
          </Select>
          <Descriptions column={1} data={[{ label: '纳税人识别号/统一社会信用代码', value: manualDraft.taxNo || '-' }]} />
          <Input value={manualDraft.title} onChange={(value) => setManualDraft((current) => ({ ...current, title: value }))} placeholder="发票抬头" />
          <Input value={manualDraft.receiverEmail} onChange={(value) => setManualDraft((current) => ({ ...current, receiverEmail: value }))} placeholder="接收邮箱" />
          <InvoiceUploadField
            fileName={manualDraft.fileName}
            onFileNameChange={(value) => setManualDraft((current) => ({ ...current, fileName: value }))}
          />
        </Space>
	      </Modal>

	      <Drawer
	        width={620}
	        title={previewInvoice ? `发票详情 ${previewInvoice.id}` : '发票详情'}
	        visible={Boolean(previewInvoice)}
	        footer={null}
	        onCancel={() => setPreviewInvoice(undefined)}
	      >
	        {previewInvoice ? (
	          <Space direction="vertical" size={16} className="full-width">
	            <Descriptions
	              column={1}
	              data={[
	                { label: '申请单号', value: previewInvoice.id },
	                { label: '订单号', value: previewInvoice.orderId },
	                { label: '企业', value: orderById.get(previewInvoice.orderId)?.tenantName ?? '-' },
	                { label: '申请来源', value: invoiceSourceMeta[previewInvoice.source].text },
	                { label: '状态', value: invoiceStatusMeta[previewInvoice.status].text },
	                { label: '发票抬头', value: previewInvoice.title },
	                { label: '纳税人识别号', value: previewInvoice.taxNo },
	                { label: '金额', value: money(previewInvoice.amount) },
	                { label: '接收邮箱', value: previewInvoice.receiverEmail },
	                { label: '申请时间', value: previewInvoice.appliedAt },
	                { label: '开票时间', value: previewInvoice.issuedAt || '-' },
	                { label: '驳回原因', value: previewInvoice.rejectReason || '-' },
	                { label: '文件名', value: previewInvoice.fileName || '-' },
	              ]}
	            />
	            {previewInvoice.status === 'issued' ? (
	              <>
	                <Button
	                  type="primary"
	                  icon={<IconDownload />}
	                  disabled={!previewInvoice.fileName}
	                  onClick={() => Message.success(`开始下载 ${previewInvoice.fileName}`)}
	                >
	                  下载发票
	                </Button>
	                <div className="invoice-preview-card">
	                  <div className="invoice-preview-card__title">电子发票模拟预览</div>
	                  <div className="invoice-preview-card__file">{previewInvoice.fileName}</div>
	                  <div className="invoice-preview-card__grid">
	                    <span>购买方</span><strong>{previewInvoice.title}</strong>
	                    <span>税号</span><strong>{previewInvoice.taxNo}</strong>
	                    <span>价税合计</span><strong>{money(previewInvoice.amount)}</strong>
	                    <span>关联订单</span><strong>{previewInvoice.orderId}</strong>
	                  </div>
	                </div>
	              </>
	            ) : null}
	          </Space>
	        ) : null}
	      </Drawer>
	    </AdminPageShell>
	  );
	}

export function AdminOpeningTasksPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPlatformAdminView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/agent/admin');
  const isDeliveryAdminView = location.pathname.startsWith('/ops-admin') || isPlatformAdminView;
  const isDeliveryOpsView = location.pathname.startsWith('/ops/');
  const [rows, setRows] = useState<AdminOpeningTaskRecord[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<AdminStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('orderId') || '');
  const [status, setStatus] = useState<AdminOpeningTaskStatus | 'all'>('all');
  const [activeTask, setActiveTask] = useState<AdminOpeningTaskRecord>();
  const [assignModal, setAssignModal] = useState<{ visible: boolean; row?: AdminOpeningTaskRecord; deliveryOwner: string }>({ visible: false, deliveryOwner: '' });

  const loadData = async () => {
    setLoading(true);
    const [data, staff] = await Promise.all([mockApi.getAdminOpeningTasks(), mockApi.getAdminStaff()]);
    setRows(data);
    setDeliveryStaff(staff.filter((item) => item.status === 'active' && (item.roleCode === 'R2.1' || item.roleCode === 'R2.2')));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = rows.filter((item) => {
    const matchedStatus = status === 'all' || item.status === status;
    const matchedQuery = `${item.id} ${item.orderId} ${item.tenantName} ${item.ownerSales}`.toLowerCase().includes(query.toLowerCase());
    return matchedStatus && matchedQuery;
  });

  const summary = {
    pendingAssign: rows.filter((item) => item.status === 'pending_assign').length,
    handling: rows.filter((item) => item.status === 'pending_handle' || item.status === 'purchasing').length,
    waiting: rows.filter((item) => item.status === 'waiting_confirm').length,
  };

  const runAction = async (message: string, action: () => Promise<unknown>) => {
    await action();
    Message.success(message);
    loadData();
  };

  const description = isDeliveryAdminView
    ? '支付确认后生成开通类交付工单，由交付管理员分配或改派交付运维办理官网代购'
    : isDeliveryOpsView
      ? '开通类工单已合并到我的工单，此页保留为兼容视图'
      : '查看支付后的开通工单进度、交付分配状态与最终开通结果';

  return (
    <AdminPageShell
      title={isDeliveryAdminView ? '开通工单分配' : isDeliveryOpsView ? '开通工单兼容视图' : '开通工单进度'}
      description={description}
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <StatStrip
        items={[
          { label: '待交付', value: `${summary.pendingAssign}`, tone: 'warn' },
          { label: '办理中', value: `${summary.handling}`, tone: 'good' },
          { label: '待生效确认', value: `${summary.waiting}`, tone: 'warn' },
        ]}
      />

      <AdminTablePanel
        toolbar={(
          <div className="sales-filter-bar">
            <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索工单号、订单号、企业、代理" />
            <Select value={status} onChange={(value) => setStatus(value as AdminOpeningTaskStatus | 'all')} className="compact-select">
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="pending_assign">待交付</Select.Option>
              <Select.Option value="pending_handle">交付处理中</Select.Option>
              <Select.Option value="purchasing">交付处理中</Select.Option>
              <Select.Option value="waiting_confirm">待生效确认</Select.Option>
              <Select.Option value="completed">已开通</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </div>
        )}
      >

        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '工单号', dataIndex: 'id', width: 170 },
            { title: '工单类型', width: 110, render: () => <MetaTag color="arcoblue" text="开通工单" /> },
            { title: '关联订单', dataIndex: 'orderId', width: 170 },
            { title: '企业', dataIndex: 'tenantName', width: 150 },
            { title: '交付办理人', dataIndex: 'deliveryOwner', width: 120, render: (value?: string) => value || '待分配' },
            {
              title: '购买组合',
              width: 260,
              render: (_: unknown, row: AdminOpeningTaskRecord) => orderSummaryLabel(row.planName, row.bundleLines),
            },
            { title: '金额', dataIndex: 'orderAmount', width: 110, render: (value: number) => money(value) },
            { title: '状态', dataIndex: 'status', width: 130, render: (value: AdminOpeningTaskStatus) => <MetaTag {...openingTaskStatusMeta[value]} /> },
            { title: '更新时间', dataIndex: 'updatedAt', width: 150 },
            {
              title: '操作',
              fixed: 'right' as const,
              width: 260,
              render: (_: unknown, row: AdminOpeningTaskRecord) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => setActiveTask(row)}>详情</Button>
                  {isDeliveryAdminView ? (
                    <Button
                      type="text"
                      size="mini"
                      disabled={row.status === 'completed' || row.status === 'cancelled'}
                      onClick={() => setAssignModal({ visible: true, row, deliveryOwner: row.deliveryOwner || deliveryStaff[0]?.name || '' })}
                    >
                      {row.deliveryOwner ? '改派' : '分配'}
                    </Button>
                  ) : null}
                  {isDeliveryOpsView ? (
                    <>
                      <Button
                        type="text"
                        size="mini"
                        disabled={!row.deliveryOwner || row.status === 'completed' || row.status === 'cancelled'}
                        onClick={() => runAction('已确认企业购买组合开通', () => mockApi.completeAdminOpeningTask(row.id))}
                      >
                        完成开通
                      </Button>
                    </>
                  ) : null}
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1580 }}
        />
      </AdminTablePanel>

      <Drawer
        title={activeTask ? `开通工单 ${activeTask.id}` : '开通工单详情'}
        visible={Boolean(activeTask)}
        width={620}
        onCancel={() => setActiveTask(undefined)}
        footer={null}
      >
        {activeTask ? (
          <Space direction="vertical" size={18} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '企业', value: activeTask.tenantName },
                { label: '工单类型', value: '开通工单' },
                { label: '关联订单', value: activeTask.orderId },
                { label: '交付办理人', value: activeTask.deliveryOwner || '待分配' },
                {
                  label: '购买组合',
                  value: (
                    <div>
                      {orderBundleDetailLines(activeTask.bundleLines).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  ),
                },
                { label: '状态', value: openingTaskStatusMeta[activeTask.status].text },
              ]}
            />
            <OpeningProgressPanel
              status={activeTask.status}
              orderId={activeTask.orderId}
              taskId={activeTask.id}
              owner={activeTask.deliveryOwner}
              updatedAt={activeTask.updatedAt}
              timeline={activeTask.timeline}
            />
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={assignModal.row?.deliveryOwner ? '改派交付办理人' : '分配交付办理人'}
        visible={assignModal.visible}
        onCancel={() => setAssignModal({ visible: false, deliveryOwner: '' })}
        onOk={async () => {
          if (!assignModal.row || !assignModal.deliveryOwner) {
            Message.error('请选择交付办理人');
            return;
          }
          await mockApi.assignAdminOpeningTask(assignModal.row.id, assignModal.deliveryOwner);
          Message.success(assignModal.row.deliveryOwner ? '工单已改派' : '工单已分配');
          setAssignModal({ visible: false, deliveryOwner: '' });
          loadData();
        }}
      >
        <Select value={assignModal.deliveryOwner} onChange={(value) => setAssignModal((current) => ({ ...current, deliveryOwner: value }))} className="full-width">
          {deliveryStaff.map((item) => (
            <Select.Option key={item.id} value={item.name}>{`${item.name} · ${roleLabel[item.roleCode]}`}</Select.Option>
          ))}
        </Select>
      </Modal>

    </AdminPageShell>
  );
}

export function AdminBankTransferReviewPage() {
  const location = useLocation();
  const isDeliveryView = location.pathname.startsWith('/ops-admin') || location.pathname.startsWith('/ops');
  const orderIdFilter = new URLSearchParams(location.search).get('orderId') ?? '';
  const [rows, setRows] = useState<AdminBankTransferReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofPreviewRow, setProofPreviewRow] = useState<AdminBankTransferReviewItem>();
  const [detailRow, setDetailRow] = useState<AdminBankTransferReviewItem>();
  const [approveModal, setApproveModal] = useState<{
    visible: boolean;
    row?: AdminBankTransferReviewItem;
    receivedAmount: number;
    receivedAt: string;
    financeRemark: string;
  }>({ visible: false, receivedAmount: 0, receivedAt: '', financeRemark: '' });
  const [reasonModal, setReasonModal] = useState<{ visible: boolean; row?: AdminBankTransferReviewItem; reason: string }>({ visible: false, reason: '' });
  const [serialModal, setSerialModal] = useState<{ visible: boolean; row?: AdminBankTransferReviewItem; bankSerialNo: string }>({ visible: false, bankSerialNo: '' });

  const loadData = async () => {
    setLoading(true);
    const data = await mockApi.getAdminBankTransferReviews();
    setRows(data.map((item) => ({
      ...item,
      attemptNo: item.attemptNo || 1,
      attempts: item.attempts?.length
        ? item.attempts
        : [{
            id: `${item.id}-a${item.attemptNo || 1}`,
            attemptNo: item.attemptNo || 1,
            proofName: item.proofName,
            uploadedAmount: item.uploadedAmount,
            uploadedAt: item.uploadedAt,
            reviewStatus: item.reviewStatus,
            bankSerialNo: item.bankSerialNo,
            deliveryReviewedAt: item.deliveryReviewedAt,
            financeReviewedAt: item.financeReviewedAt,
            reviewReason: item.reviewReason,
          }],
    })));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const scopedRows = rows.filter((item) => {
    const matchRole = isDeliveryView ? item.reviewStatus !== 'approved' && item.reviewStatus !== 'rejected' : item.reviewStatus !== 'pending_delivery_review';
    const matchOrder = !orderIdFilter || item.orderId === orderIdFilter;
    return matchRole && matchOrder;
  });

  return (
    <AdminPageShell
      title={isDeliveryView ? '对公凭证核查' : '对公转账终审'}
      description={isDeliveryView ? '客户上传凭证后，交付人员先核查凭证并录入银行流水号' : '财务结合银行流水号与凭证 PNG 做最终审核，通过后回到原交付人员开通'}
      action={(
        <Space>
          {orderIdFilter ? <Tag color="arcoblue">订单 {orderIdFilter}</Tag> : null}
          <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
        </Space>
      )}
    >
      <AdminTablePanel>
        <Table
          rowKey="id"
          loading={loading}
          data={scopedRows}
          pagination={false}
          columns={[
            { title: '订单号', dataIndex: 'orderId' },
            { title: '企业', dataIndex: 'tenantName' },
            { title: '金额', dataIndex: 'amount', render: (value: number) => money(value) },
            { title: '交付负责人', dataIndex: 'deliveryOwner' },
            {
              title: '凭证',
              dataIndex: 'proofName',
              render: (value: string, row: AdminBankTransferReviewItem) => (
                <Button type="text" size="mini" onClick={() => setProofPreviewRow(row)}>
                  {value}
                </Button>
              ),
            },
            { title: '上传金额', dataIndex: 'uploadedAmount', render: (value: number) => money(value) },
            { title: '上传次数', dataIndex: 'attemptNo', render: (value: number) => `第 ${value || 1} 次` },
            { title: '上传时间', dataIndex: 'uploadedAt' },
            { title: '银行流水号', dataIndex: 'bankSerialNo', render: (value?: string) => value || '-' },
            { title: '距上传天数', dataIndex: 'daysSinceUpload', render: (value: number) => `${value} 天` },
            { title: '状态', dataIndex: 'reviewStatus', render: (value: keyof typeof bankReviewStatusMeta) => <MetaTag {...bankReviewStatusMeta[value]} /> },
            {
              title: '操作',
              render: (_: unknown, row: AdminBankTransferReviewItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => setDetailRow(row)}>
                    详情
                  </Button>
                  {isDeliveryView ? (
                    <Button
                      type="text"
                      size="mini"
                      disabled={row.reviewStatus !== 'pending_delivery_review'}
                      onClick={() => setSerialModal({ visible: true, row, bankSerialNo: row.bankSerialNo || '' })}
                    >
                      录入流水号
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="text"
                        size="mini"
                        disabled={row.reviewStatus !== 'pending_finance_review'}
                        onClick={() => setApproveModal({
                          visible: true,
                          row,
                          receivedAmount: row.uploadedAmount,
                          receivedAt: new Date().toISOString().slice(0, 10),
                          financeRemark: '',
                        })}
                      >
                        确认到账
                      </Button>
                      <Button
                        type="text"
                        size="mini"
                        disabled={row.reviewStatus !== 'pending_finance_review'}
                        onClick={() => setReasonModal({ visible: true, row, reason: '' })}
                      >
                        驳回凭证
                      </Button>
                    </>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Modal
        title={proofPreviewRow ? `付款凭证 ${proofPreviewRow.proofName}` : '付款凭证'}
        visible={Boolean(proofPreviewRow)}
        footer={null}
        style={{ width: 760 }}
        onCancel={() => setProofPreviewRow(undefined)}
      >
        {proofPreviewRow ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={2}
              data={[
                { label: '企业', value: proofPreviewRow.tenantName },
                { label: '订单号', value: proofPreviewRow.orderId },
                { label: '凭证文件', value: proofPreviewRow.proofName },
                { label: '上传金额', value: money(proofPreviewRow.uploadedAmount) },
                { label: '银行流水号', value: proofPreviewRow.bankSerialNo || '未录入' },
              ]}
            />
            <div style={{ border: '1px solid #e5e8ef', borderRadius: 8, overflow: 'hidden', background: '#f7f8fa' }}>
              <img
                src={buildBankTransferProofPreview(proofPreviewRow)}
                alt={proofPreviewRow.proofName}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>
          </Space>
        ) : null}
      </Modal>

      <Drawer
        title={detailRow ? `${detailRow.orderId} 对公审核详情` : '对公审核详情'}
        visible={Boolean(detailRow)}
        width={820}
        footer={null}
        onCancel={() => setDetailRow(undefined)}
      >
        {detailRow ? (
          <Space direction="vertical" size={16} className="full-width">
            <Card bordered title="当前审核">
              <Descriptions
                column={2}
                data={[
                  { label: '企业', value: detailRow.tenantName },
                  { label: '订单金额', value: money(detailRow.amount) },
                  { label: '当前上传', value: `第 ${detailRow.attemptNo || 1} 次` },
                  { label: '当前状态', value: <MetaTag {...bankReviewStatusMeta[detailRow.reviewStatus]} /> },
                  { label: '当前凭证', value: detailRow.proofName },
                  { label: '上传金额', value: money(detailRow.uploadedAmount) },
                  { label: '银行流水号', value: detailRow.bankSerialNo || '-' },
                  { label: '交付负责人', value: detailRow.deliveryOwner },
                  { label: '交付核查时间', value: detailRow.deliveryReviewedAt || '-' },
                  { label: '财务审核时间', value: detailRow.financeReviewedAt || '-' },
                  { label: '审核说明', value: detailRow.reviewReason || '-' },
                ]}
              />
            </Card>
            <Card bordered title="当前凭证预览">
              <div style={{ border: '1px solid #e5e8ef', borderRadius: 8, overflow: 'hidden', background: '#f7f8fa' }}>
                <img
                  src={buildBankTransferProofPreview(detailRow)}
                  alt={detailRow.proofName}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </Card>
            <Card bordered title="凭证上传历史">
              <Table
                rowKey="id"
                pagination={false}
                data={detailRow.attempts ?? []}
                columns={[
                  { title: '次数', dataIndex: 'attemptNo', render: (value: number) => `第 ${value} 次` },
                  { title: '凭证', dataIndex: 'proofName' },
                  { title: '上传金额', dataIndex: 'uploadedAmount', render: (value: number) => money(value) },
                  { title: '上传时间', dataIndex: 'uploadedAt' },
                  { title: '状态', dataIndex: 'reviewStatus', render: (value: keyof typeof bankReviewStatusMeta) => <MetaTag {...bankReviewStatusMeta[value]} /> },
                  { title: '银行流水号', dataIndex: 'bankSerialNo', render: (value?: string) => value || '-' },
                  { title: '审核说明', dataIndex: 'reviewReason', render: (value?: string) => value || '-' },
                ]}
              />
            </Card>
            <Card bordered title="审核时间线">
              <Timeline mode="left">
                {(detailRow.attempts ?? []).flatMap((attempt) => [
                  { key: `${attempt.id}-upload`, time: attempt.uploadedAt, title: `第 ${attempt.attemptNo} 次上传凭证`, detail: `${attempt.proofName}，上传金额 ${money(attempt.uploadedAmount)}` },
                  attempt.deliveryReviewedAt ? { key: `${attempt.id}-delivery`, time: attempt.deliveryReviewedAt, title: '交付核查', detail: attempt.bankSerialNo ? `录入银行流水号 ${attempt.bankSerialNo}` : '完成交付核查' } : undefined,
                  attempt.financeReviewedAt ? { key: `${attempt.id}-finance`, time: attempt.financeReviewedAt, title: bankReviewStatusMeta[attempt.reviewStatus].text, detail: attempt.reviewReason || '财务完成审核' } : undefined,
                ].filter(Boolean) as Array<{ key: string; time: string; title: string; detail: string }>).map((item) => (
                  <Timeline.Item key={item.key} label={item.time}>
                    <div className="ops-timeline-item">
                      <strong>{item.title}</strong>
                    </div>
                    <Text>{item.detail}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="录入银行流水号"
        visible={serialModal.visible}
        onCancel={() => setSerialModal({ visible: false, bankSerialNo: '' })}
        onOk={async () => {
          if (!serialModal.row || !serialModal.bankSerialNo.trim()) {
            Message.error('请输入银行流水号');
            return;
          }
          await mockApi.submitDeliveryBankTransferSerial(serialModal.row.id, serialModal.bankSerialNo.trim());
          Message.success('已提交流水号，流转到财务最终审核');
          setSerialModal({ visible: false, bankSerialNo: '' });
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          {serialModal.row ? (
            <>
              <Text>交付人员完成首次核查后，需要先对照凭证，再录入凭证上的银行流水号。</Text>
              <div style={{ border: '1px solid #e5e8ef', borderRadius: 8, overflow: 'hidden', background: '#f7f8fa' }}>
                <img
                  src={buildBankTransferProofPreview(serialModal.row)}
                  alt={serialModal.row.proofName}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
              <Descriptions
                column={2}
                data={[
                  { label: '企业', value: serialModal.row.tenantName },
                  { label: '订单号', value: serialModal.row.orderId },
                  { label: '凭证文件', value: serialModal.row.proofName },
                  { label: '上传金额', value: money(serialModal.row.uploadedAmount) },
                ]}
              />
            </>
          ) : null}
          <Input value={serialModal.bankSerialNo} onChange={(value) => setSerialModal((current) => ({ ...current, bankSerialNo: value }))} placeholder="请输入银行流水号" />
        </Space>
      </Modal>

      <Modal
        title="确认对公到账"
        visible={approveModal.visible}
        okText="确认到账并通过"
        onCancel={() => setApproveModal({ visible: false, receivedAmount: 0, receivedAt: '', financeRemark: '' })}
        onOk={async () => {
          if (!approveModal.row) return;
          if (!approveModal.receivedAmount || !approveModal.receivedAt) {
            Message.error('请填写银行到账金额和到账日期');
            return;
          }
          if (approveModal.receivedAmount !== approveModal.row.amount) {
            Message.error('银行到账金额与订单金额不一致，请核实后驳回或暂不处理');
            return;
          }
          await mockApi.approveAdminBankTransfer(approveModal.row.id, {
            receivedAmount: approveModal.receivedAmount,
            receivedAt: approveModal.receivedAt,
            financeRemark: approveModal.financeRemark.trim(),
          });
          Message.success('已确认到账并通过');
          setApproveModal({ visible: false, receivedAmount: 0, receivedAt: '', financeRemark: '' });
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          {approveModal.row ? (
            <div style={{ border: '1px solid #e5e8ef', borderRadius: 8, overflow: 'hidden', background: '#f7f8fa' }}>
              <img
                src={buildBankTransferProofPreview(approveModal.row)}
                alt={approveModal.row.proofName}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>
          ) : null}
          <Descriptions
            column={1}
            data={[
              { label: '订单金额', value: money(approveModal.row?.amount || 0) },
              { label: '客户上传金额', value: money(approveModal.row?.uploadedAmount || 0) },
              { label: '银行流水号', value: approveModal.row?.bankSerialNo || '-' },
              { label: '凭证文件', value: approveModal.row?.proofName || '-' },
            ]}
          />
          <label>
            <span><i className="form-required">*</i>银行到账金额</span>
            <InputNumber
              value={approveModal.receivedAmount}
              onChange={(value) => setApproveModal((current) => ({ ...current, receivedAmount: Number(value) || 0 }))}
              className="full-width"
            />
          </label>
          <label>
            <span><i className="form-required">*</i>到账日期</span>
            <Input
              value={approveModal.receivedAt}
              onChange={(value) => setApproveModal((current) => ({ ...current, receivedAt: value }))}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label>
            <span>财务备注</span>
            <Input.TextArea
              rows={3}
              value={approveModal.financeRemark}
              onChange={(value) => setApproveModal((current) => ({ ...current, financeRemark: value }))}
              placeholder="可记录银行回单核对、到账账户等说明"
            />
          </label>
        </Space>
      </Modal>

      <Modal
        title="驳回对公凭证"
        visible={reasonModal.visible}
        okText="确认驳回"
        onCancel={() => setReasonModal({ visible: false, reason: '' })}
        onOk={async () => {
          if (!reasonModal.row || !reasonModal.reason.trim()) {
            Message.error('请输入驳回原因');
            return;
          }
          await mockApi.rejectAdminBankTransfer(reasonModal.row.id, reasonModal.reason);
          Message.success('已驳回，客户管理员将收到重新上传凭证通知');
          setReasonModal({ visible: false, reason: '' });
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width">
          {reasonModal.row ? (
            <>
              <div style={{ border: '1px solid #e5e8ef', borderRadius: 8, overflow: 'hidden', background: '#f7f8fa' }}>
                <img
                  src={buildBankTransferProofPreview(reasonModal.row)}
                  alt={reasonModal.row.proofName}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
              <Descriptions
                column={1}
                data={[
                  { label: '订单金额', value: money(reasonModal.row.amount) },
                  { label: '客户上传金额', value: money(reasonModal.row.uploadedAmount) },
                  { label: '银行流水号', value: reasonModal.row.bankSerialNo || '-' },
                  { label: '凭证文件', value: reasonModal.row.proofName },
                ]}
              />
            </>
          ) : null}
          <Text>驳回后订单会回到待付款状态，客户管理员需要在账单页重新上传付款凭证。</Text>
          <Input.TextArea rows={4} value={reasonModal.reason} onChange={(value) => setReasonModal((current) => ({ ...current, reason: value }))} placeholder="请输入驳回原因，客户管理员可见" />
        </Space>
      </Modal>
    </AdminPageShell>
  );
}

export function AdminRefundsPage() {
  const [rows, setRows] = useState<AdminRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; id: string; reason: string }>({ visible: false, id: '', reason: '' });
  const [draft, setDraft] = useState({ orderId: '', tenantName: '', originalAmount: 0, requestAmount: 0, reason: '' });

  const loadData = async () => {
    setLoading(true);
    const data = await mockApi.getAdminRefunds();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="退款审核" description="退款创建、双审和完成状态跟踪" action={<Button type="primary" icon={<IconPlus />} onClick={() => setDrawerVisible(true)}>创建退款单</Button>}>
      <AdminTablePanel>
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '退款单号', dataIndex: 'id' },
            { title: '订单号', dataIndex: 'orderId' },
            { title: '企业', dataIndex: 'tenantName' },
            { title: '原始金额', dataIndex: 'originalAmount', render: (value: number) => money(value) },
            { title: '退款金额', dataIndex: 'requestAmount', render: (value: number) => money(value) },
            { title: '原因', dataIndex: 'reason' },
            { title: '申请人', dataIndex: 'appliedBy' },
            { title: '状态', dataIndex: 'status', render: (value: keyof typeof refundStatusMeta) => <MetaTag {...refundStatusMeta[value]} /> },
            {
              title: '操作',
              render: (_: unknown, row: AdminRefundRequest) => (
                <Space size={8}>
                  <Button type="text" size="mini" disabled={row.status !== 'pending'} onClick={async () => { await mockApi.approveAdminRefund(row.id); Message.success('退款已审批'); loadData(); }}>通过</Button>
                  <Button type="text" size="mini" disabled={row.status !== 'pending'} onClick={() => setRejectModal({ visible: true, id: row.id, reason: '' })}>驳回</Button>
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Drawer
        width={720}
        title="创建退款单"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={async () => { if (!draft.orderId || !draft.tenantName || !draft.requestAmount || !draft.reason) { Message.error('请填写完整退款信息'); return; } await mockApi.createAdminRefund(draft as any); Message.success('退款单已创建'); setDrawerVisible(false); setDraft({ orderId: '', tenantName: '', originalAmount: 0, requestAmount: 0, reason: '' }); loadData(); }}>提交</Button></Space>}
      >
        <div className="sales-form-grid sales-form-grid--single">
          <label><span>订单号</span><Input value={draft.orderId} onChange={(value) => setDraft((current) => ({ ...current, orderId: value }))} /></label>
          <label><span>企业</span><Input value={draft.tenantName} onChange={(value) => setDraft((current) => ({ ...current, tenantName: value }))} /></label>
          <label><span>原始金额</span><InputNumber value={draft.originalAmount} onChange={(value) => setDraft((current) => ({ ...current, originalAmount: Number(value) || 0 }))} className="full-width" /></label>
          <label><span>退款金额</span><InputNumber value={draft.requestAmount} onChange={(value) => setDraft((current) => ({ ...current, requestAmount: Number(value) || 0 }))} className="full-width" /></label>
          <label><span>原因</span><Input.TextArea rows={4} value={draft.reason} onChange={(value) => setDraft((current) => ({ ...current, reason: value }))} /></label>
        </div>
      </Drawer>

      <Modal title="驳回退款" visible={rejectModal.visible} onCancel={() => setRejectModal({ visible: false, id: '', reason: '' })} onOk={async () => { if (!rejectModal.reason.trim()) { Message.error('请输入驳回原因'); return; } await mockApi.rejectAdminRefund(rejectModal.id, rejectModal.reason); Message.success('退款已驳回'); setRejectModal({ visible: false, id: '', reason: '' }); loadData(); }}>
        <Input.TextArea rows={4} value={rejectModal.reason} onChange={(value) => setRejectModal((current) => ({ ...current, reason: value }))} />
      </Modal>
    </AdminPageShell>
  );
}

export function AdminSalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<AdminSalesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminSalesListItem['status']>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<AdminSalesDraft>(createEmptySalesDraft());

  const loadData = async () => {
    setLoading(true);
    const salesData = await mockApi.getAdminSales();
    setRows(salesData);
    setLoading(false);
  };

  const resetDraft = () => {
    setDraft(createEmptySalesDraft());
  };
  const salesBasePath = adminConsolePath(location.pathname, '/sales');
  const isFinanceView = location.pathname.startsWith('/finance') || location.pathname.startsWith('/agent/finance');
  const isAgentAdminView = location.pathname.startsWith('/agent/admin');
  const canCreateSales = !isFinanceView;
  const pageTitle = isAgentAdminView ? '销售管理' : isFinanceView ? '销售账户' : '内部销售管理';
  const pageDescription = isAgentAdminView ? '销售档案、客户归属和销售状态' : isFinanceView ? '销售账户、佣金归属和状态查看' : '内部销售档案、客户归属和销售状态';
  const createButtonLabel = '新建销售';
  const filteredRows = rows.filter((item) => {
    const keywordMatched = `${item.employeeNo} ${item.name}`.toLowerCase().includes(query.toLowerCase());
    const statusMatched = statusFilter === 'all' || item.status === statusFilter;
    return keywordMatched && statusMatched;
  });

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell
      title={pageTitle}
      description={pageDescription}
      action={canCreateSales ? <Button type="primary" icon={<IconPlus />} onClick={() => { resetDraft(); setDrawerVisible(true); }}>{createButtonLabel}</Button> : null}
    >
      <AdminTablePanel
        toolbar={(
          <div className="sales-filter-bar">
            <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索工号、姓名" />
            <Select value={statusFilter} onChange={setStatusFilter} className="sales-filter-select" options={[
              { label: '全部状态', value: 'all' },
              ...Object.entries(salesStatusMeta).map(([value, meta]) => ({ label: meta.text, value })),
            ]} />
          </div>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '工号', dataIndex: 'employeeNo' },
            { title: '姓名', dataIndex: 'name', render: (value: string, row: AdminSalesListItem) => <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/${row.id}`)}>{value}</Button> },
            { title: '入职日期', dataIndex: 'hiredAt' },
            { title: '状态', dataIndex: 'status', render: (value: keyof typeof salesStatusMeta) => <MetaTag {...salesStatusMeta[value]} /> },
            { title: '本月新客', dataIndex: 'monthNewCustomers' },
            { title: '本月成交额', dataIndex: 'monthGmv', render: (value: number) => money(value) },
            { title: '本月佣金', dataIndex: 'monthCommission', render: (value: number) => money(value) },
            { title: '累计佣金', dataIndex: 'totalCommission', render: (value: number) => money(value) },
            {
              title: '操作',
              render: (_: unknown, row: AdminSalesListItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/${row.id}`)}>详情</Button>
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Drawer
        width={760}
        title="新建销售"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={(
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!canCreateSales) {
                  Message.error('财务侧不能新建销售');
                  return;
                }
                if (!draft.employeeNo || !draft.name || !draft.phone || !draft.hiredAt) {
                  Message.error('请填写工号、姓名、手机号和入职日期');
                  return;
                }
                if (!draft.initialPassword || draft.initialPassword.length < 8) {
                  Message.error('请设置至少 8 位初始密码');
                  return;
                }
                const { commissionRuleId, initialPassword, ...salesPayload } = {
                  ...draft,
                  baseCommissionRate: INTERNAL_SALES_COMMISSION_RATE,
                  commissionRuleId: INTERNAL_SALES_COMMISSION_RULE_ID,
                };
                void commissionRuleId;
                void initialPassword;
                await mockApi.createAdminSales(salesPayload);
                Message.success('销售已创建');
                setDrawerVisible(false);
                resetDraft();
                loadData();
              }}
            >
              保存
            </Button>
          </Space>
        )}
      >
        <div className="sales-form-grid sales-form-grid--single">
          <div className="sales-field">
            <span><i className="form-required">*</i>账户身份</span>
            <Select value="R3" disabled options={[{ label: '销售', value: 'R3' }]} />
          </div>
          <Text className="sales-form-hint">销售账号将同步出现在账号管理中，权限身份为销售。</Text>
          <label><span><i className="form-required">*</i>工号</span><Input value={draft.employeeNo} onChange={(value) => setDraft((current) => ({ ...current, employeeNo: value }))} placeholder="例如 R3-2049" /></label>
          <label><span><i className="form-required">*</i>姓名</span><Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} /></label>
          <label><span><i className="form-required">*</i>手机号</span><Input value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} /></label>
          <label><span>邮箱</span><Input value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} /></label>
          <label><span><i className="form-required">*</i>初始密码</span><Input.Password value={draft.initialPassword} onChange={(value) => setDraft((current) => ({ ...current, initialPassword: value }))} placeholder="至少 8 位" /></label>
          <label><span>负责区域</span><Input value={draft.region} onChange={(value) => setDraft((current) => ({ ...current, region: value }))} /></label>
          <label>
            <span><i className="form-required">*</i>入职日期</span>
            <DatePicker
              value={draft.hiredAt || undefined}
              onChange={(value) => setDraft((current) => ({ ...current, hiredAt: value }))}
              style={{ width: '100%' }}
            />
          </label>
          <div className="sales-field">
            <span>销售佣金</span>
            <Text className="sales-form-hint">内部销售固定 5% 佣金</Text>
          </div>
        </div>
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminSalesDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminSalesDetail>();
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [bankDrawerVisible, setBankDrawerVisible] = useState(false);
  const [bankDraft, setBankDraft] = useState(createEmptyBankAccountDraft());
  const [successorId, setSuccessorId] = useState('');
  const [allSales, setAllSales] = useState<AdminSalesListItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [sales, salesList] = await Promise.all([mockApi.getAdminSalesDetail(id), mockApi.getAdminSales()]);
    setDetail(sales);
    setAllSales(salesList);
    setSuccessorId(salesList.find((item) => item.id !== id && item.status === 'active')?.id || '');
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const salesBasePath = adminConsolePath(location.pathname, '/sales');
  const isPlatformSalesDetail = location.pathname.startsWith('/admin/sales') || location.pathname.startsWith('/agent/admin/sales');

  if (loading || !detail) {
    return <Spin className="page-spin" tip="加载销售详情" />;
  }
  const bankAccount = detail.bankAccount;
  const bankConfigured = bankAccount?.status === 'active';
  const performanceRows = detail.performance.map((item) => ({
    month: item.month,
    成交额: item.gmv,
    佣金: item.commission,
  }));

  const openBankDrawer = () => {
    setBankDraft({
      accountName: bankAccount?.accountName || detail.name,
      bankName: bankAccount?.bankName || '',
      branchName: bankAccount?.branchName || '',
      accountNo: bankAccount?.accountNo || '',
    });
    setBankDrawerVisible(true);
  };

  const saveBankAccount = async () => {
    if (!bankDraft.accountName.trim() || !bankDraft.bankName.trim() || !bankDraft.branchName.trim() || !bankDraft.accountNo.trim()) {
      Message.error('请填写完整收款账户信息');
      return;
    }
    if (bankDraft.accountNo.replace(/\s/g, '').length < 8) {
      Message.error('银行账号长度不能少于 8 位');
      return;
    }
    const updated = await mockApi.updateAdminSalesBankAccount(detail.id, bankDraft);
    setDetail(updated);
    setBankDrawerVisible(false);
    Message.success('收款账户已更新');
  };

  return (
    <div className="sales-detail-screen">
      <DetailHeader
        title={detail.name}
        subtitle={(
          <Space size={8}>
            <Text type="secondary">{detail.employeeNo}</Text>
            <MetaTag {...salesStatusMeta[detail.status]} />
          </Space>
        )}
        onBack={() => navigate(salesBasePath)}
        actions={(
          <Space>
            {isPlatformSalesDetail ? (
              <Button status="danger" disabled={detail.status !== 'active'} onClick={() => setLeaveVisible(true)}>标记离职</Button>
            ) : null}
          </Space>
        )}
      />

      <div className="sales-detail-top-grid">
        <Card bordered className="sales-detail-summary" title="销售个人信息">
          <div className="sales-info-grid">
            <div><span>手机号</span><strong>{detail.phone}</strong></div>
            <div><span>邮箱</span><strong>{detail.email}</strong></div>
            <div><span>佣金率</span><strong>{detail.baseCommissionRate * 100}%</strong></div>
            <div><span>本月成交额</span><strong>{money(detail.monthGmv)}</strong></div>
            <div><span>本月佣金</span><strong>{money(detail.monthCommission)}</strong></div>
            <div><span>累计佣金</span><strong>{money(detail.totalCommission)}</strong></div>
          </div>
        </Card>

        <Card
          bordered
          className="sales-detail-summary"
          title="佣金收款账户"
          extra={<Button type="text" size="small" onClick={openBankDrawer}>维护账户</Button>}
        >
          {bankConfigured ? (
            <div className="sales-info-grid">
              <div><span>开户名</span><strong>{bankAccount.accountName}</strong></div>
              <div><span>开户银行</span><strong>{bankAccount.bankName}</strong></div>
              <div><span>开户支行</span><strong>{bankAccount.branchName}</strong></div>
              <div><span>银行账号</span><strong>{maskBankAccountNo(bankAccount.accountNo)}</strong></div>
              <div><span>状态</span><strong>已配置</strong></div>
              <div><span>更新时间</span><strong>{bankAccount.updatedAt || '-'}</strong></div>
            </div>
          ) : (
            <Empty description="暂未配置收款账户" />
          )}
        </Card>
      </div>

      <div className="admin-detail-tabs-panel">
        <Tabs>
          <TabPane key="customers" title="客户列表">
            <Table rowKey="id" pagination={false} data={detail.customers} columns={[
              { title: '企业', dataIndex: 'name' },
              { title: '统一社会信用代码', dataIndex: 'uscc' },
              { title: '企业状态', dataIndex: 'status', render: (value: AdminTenantStatus) => <MetaTag {...tenantStatusMeta[value]} /> },
              { title: '席位详情', dataIndex: 'seatSummary' },
              { title: '本月成交额', dataIndex: 'monthGmv', render: (value: number) => money(value) },
            ]} />
          </TabPane>
          <TabPane key="performance" title="业绩历史">
            <div className="sales-performance-layout">
              <div className="chart-box chart-box--large">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={performanceRows}>
                    <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => compactMoney(value)} />
                    <ChartTooltip formatter={(value, name) => [money(Number(value) || 0), String(name)]} labelFormatter={(label) => `月份：${label}`} />
                    <Legend />
                    <Line type="monotone" dataKey="成交额" stroke="#165DFF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="佣金" stroke="#14C9C9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Table rowKey="month" pagination={false} data={performanceRows} columns={[
                { title: '月份', dataIndex: 'month' },
                { title: '成交额', dataIndex: '成交额', render: (value: number) => money(value) },
                { title: '佣金', dataIndex: '佣金', render: (value: number) => money(value) },
              ]} />
            </div>
          </TabPane>
          <TabPane key="commissions" title="佣金流水">
            <Table rowKey="id" pagination={false} data={detail.commissions} columns={[
              { title: '订单号', dataIndex: 'orderId' },
              { title: '企业', dataIndex: 'tenantName' },
              { title: '订单金额', dataIndex: 'amount', render: (value: number) => money(value) },
              { title: '佣金', dataIndex: 'commission', render: (value: number) => money(value) },
              { title: '状态', dataIndex: 'status', render: (value: SalesCommissionStatus) => <MetaTag {...commissionStatusMeta[value]} /> },
              { title: '生成时间', dataIndex: 'createdAt' },
            ]} />
          </TabPane>
          <TabPane key="invites" title="分享链接 / 邀请码">
            <Table rowKey="id" pagination={false} data={detail.invites} columns={[
              { title: '类型', dataIndex: 'type', render: (value: string) => (value === 'share_link' ? '分享链接' : '邀请码') },
              { title: '名称', dataIndex: 'name' },
              { title: '值', dataIndex: 'value' },
              { title: '状态', dataIndex: 'status' },
              { title: '已用', dataIndex: 'used' },
            ]} />
          </TabPane>
          <TabPane key="audit" title="操作日志">
            <Table rowKey="id" pagination={false} data={detail.audit} columns={[
              { title: '时间', dataIndex: 'createdAt' },
              { title: '动作', dataIndex: 'action' },
              { title: '目标', dataIndex: 'target' },
              { title: '结果', dataIndex: 'result' },
            ]} />
          </TabPane>
        </Tabs>
      </div>

      {isPlatformSalesDetail ? (
        <Modal title="标记销售离职" visible={leaveVisible} onCancel={() => setLeaveVisible(false)} onOk={async () => { if (!successorId) { Message.error('请选择接手销售'); return; } await mockApi.leaveAdminSales(detail.id, successorId); Message.success('销售已标记离职，客户继承已完成'); setLeaveVisible(false); navigate(salesBasePath); }}>
          <Space direction="vertical" size={14} className="full-width">
            <Text>离职会停用该销售，并将未来客户归属切给接手销售；历史佣金保持不动。</Text>
            <Select value={successorId} onChange={setSuccessorId}>
              {allSales.filter((item) => item.id !== detail.id && item.status === 'active').map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
              ))}
            </Select>
          </Space>
        </Modal>
      ) : null}

      <Drawer
        width={640}
        title="维护佣金收款账户"
        visible={bankDrawerVisible}
        onCancel={() => setBankDrawerVisible(false)}
        footer={<Space><Button onClick={() => setBankDrawerVisible(false)}>取消</Button><Button type="primary" onClick={saveBankAccount}>保存</Button></Space>}
      >
        <div className="sales-form-grid sales-form-grid--single">
          <label><span><i className="form-required">*</i>开户名</span><Input value={bankDraft.accountName} onChange={(accountName) => setBankDraft((current) => ({ ...current, accountName }))} /></label>
          <label><span><i className="form-required">*</i>开户银行</span><Input value={bankDraft.bankName} onChange={(bankName) => setBankDraft((current) => ({ ...current, bankName }))} placeholder="例如 招商银行" /></label>
          <label><span><i className="form-required">*</i>开户支行</span><Input value={bankDraft.branchName} onChange={(branchName) => setBankDraft((current) => ({ ...current, branchName }))} placeholder="例如 上海张江支行" /></label>
          <label><span><i className="form-required">*</i>银行账号</span><Input value={bankDraft.accountNo} onChange={(accountNo) => setBankDraft((current) => ({ ...current, accountNo }))} placeholder="请输入银行账号" /></label>
        </div>
      </Drawer>
    </div>
  );
}

export function AdminSalesLeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getAdminSalesLeaderboard().then((data: any) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell title="代理业绩排行榜" description="按成交额、新客和佣金观察代理表现">
      <Row gutter={16}>
        <Col span={12}>
          <Card title="本月成交额排名" bordered>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rows}>
                  <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="gmv" fill="#165DFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="排行榜列表" bordered>
            <Table rowKey="id" loading={loading} pagination={false} data={rows} columns={[
              { title: '代理', dataIndex: 'name' },
              { title: '本月成交额', dataIndex: 'gmv', render: (value: number) => money(value) },
              { title: '新客数', dataIndex: 'newCustomers' },
              { title: '续约率', dataIndex: 'renewalRate', render: (value: number) => `${value}%` },
            ]} />
          </Card>
        </Col>
      </Row>
    </AdminPageShell>
  );
}

export function AdminSalesTransfersPage() {
  const [rows, setRows] = useState<AdminSalesTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setRows(await mockApi.getAdminSalesTransfers());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="客户调拨" description="归属变更申请、双审和历史留痕">
      <Card bordered>
        <Table rowKey="id" loading={loading} data={rows} pagination={false} columns={[
          { title: '申请单号', dataIndex: 'id' },
          { title: '客户', dataIndex: 'tenantName' },
          { title: '原销售', dataIndex: 'fromSales' },
          { title: '新销售', dataIndex: 'toSales' },
          { title: '申请人', dataIndex: 'applicant' },
          { title: '申请时间', dataIndex: 'createdAt' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <MetaTag color={value === 'approved' ? 'green' : value === 'pending' ? 'orange' : 'red'} text={value === 'approved' ? '已通过' : value === 'pending' ? '待审批' : '已驳回'} /> },
          {
            title: '操作',
            render: (_: unknown, row: AdminSalesTransferRequest) => (
              <Space size={8}>
                <Button type="text" size="mini" disabled={row.status !== 'pending'} onClick={async () => { await mockApi.approveAdminSalesTransfer(row.id); Message.success('调拨已通过'); loadData(); }}>通过</Button>
                <Button type="text" size="mini" disabled={row.status !== 'pending'} onClick={async () => { await mockApi.rejectAdminSalesTransfer(row.id); Message.success('调拨已驳回'); loadData(); }}>驳回</Button>
              </Space>
            ),
          },
        ]} />
      </Card>
    </AdminPageShell>
  );
}

export function AdminCommissionRulesPage() {
  const [rows, setRows] = useState<AdminCommissionRule[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create');
  const [activeRule, setActiveRule] = useState<AdminCommissionRule | null>(null);
  const [draft, setDraft] = useState<Pick<AdminCommissionRule, 'name' | 'kind' | 'rate' | 'cycleMonths' | 'effectiveFrom' | 'effectiveTo' | 'status'>>(createEmptySettlementRuleDraft());

  const loadData = async () => {
    setRows(await mockApi.getAdminCommissionRules());
  };

  const resetDraft = () => {
    setDrawerMode('create');
    setActiveRule(null);
    setDraft(createEmptySettlementRuleDraft());
  };

  const openCreate = () => {
    resetDraft();
    setDrawerVisible(true);
  };

  const openView = (row: AdminCommissionRule) => {
    setDrawerMode('view');
    setActiveRule(row);
    setDraft({
      name: row.name,
      kind: row.kind,
      rate: row.rate,
      cycleMonths: row.cycleMonths,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      status: row.status,
    });
    setDrawerVisible(true);
  };

  const handleDisable = async (row: AdminCommissionRule) => {
    if (row.kind === 'commission') {
      Message.warning('内部销售佣金为固定 5% 系统规则，不能停用');
      return;
    }
    await mockApi.disableAdminCommissionRule(row.id);
    Message.success('规则已停用');
    loadData();
  };

  const handleSaveRule = async () => {
    if (!draft.name || !draft.rate || !draft.cycleMonths || !draft.effectiveFrom) {
      Message.error('请填写完整结算规则');
      return;
    }
    await mockApi.createAdminCommissionRule({
      ...draft,
      kind: 'procurement_discount',
      scope: '外部代理拿货',
    });
    Message.success('规则已创建');
    setDrawerVisible(false);
    resetDraft();
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="结算规则" description="内部销售佣金固定 5%；此处维护外部代理拿货折扣，历史流水按命中规则快照结算" action={<Button type="primary" icon={<IconPlus />} onClick={openCreate}>新增拿货规则</Button>}>
      <AdminTablePanel>
        <Table rowKey="id" pagination={false} data={rows} columns={[
          { title: '规则名称', dataIndex: 'name' },
          { title: '规则类型', dataIndex: 'kind', render: (value: AdminCommissionRule['kind']) => <MetaTag {...settlementRuleKindMeta[value]} /> },
          { title: '比例/折扣', render: (_: unknown, row: AdminCommissionRule) => `${settlementRateLabel(row)} ${formatSettlementRate(row.rate)}` },
          { title: '结算周期', dataIndex: 'cycleMonths', render: (value: number) => `${value} 个月` },
          { title: '生效日期', dataIndex: 'effectiveFrom' },
          { title: '失效日期', dataIndex: 'effectiveTo', render: (value?: string) => value || '-' },
          { title: '创建人', dataIndex: 'createdBy' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <MetaTag color={value === 'active' ? 'green' : value === 'draft' ? 'orange' : 'gray'} text={value === 'active' ? '生效中' : value === 'draft' ? '草稿' : '已过期'} /> },
          {
            title: '操作',
            render: (_: unknown, row: AdminCommissionRule) => (
              <Space size={6}>
                <Button type="text" size="mini" onClick={() => openView(row)}>查看</Button>
                {row.kind === 'procurement_discount' ? (
                  <Button type="text" size="mini" status="danger" disabled={row.status === 'expired'} onClick={() => handleDisable(row)}>停用</Button>
                ) : null}
              </Space>
            ),
          },
        ]} />
      </AdminTablePanel>

      <Drawer
        width={720}
        title={drawerMode === 'view' ? '查看结算规则' : '新增拿货规则'}
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={(
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>{drawerMode === 'view' ? '关闭' : '取消'}</Button>
            {drawerMode === 'create' ? <Button type="primary" onClick={handleSaveRule}>保存</Button> : null}
          </Space>
        )}
      >
        {drawerMode === 'view' ? (
          <Descriptions column={2} data={[
            { label: '规则名称', value: draft.name },
            { label: '规则类型', value: <MetaTag {...settlementRuleKindMeta[draft.kind]} /> },
            { label: settlementRateLabel(draft), value: formatSettlementRate(draft.rate) },
            { label: '结算周期', value: `${draft.cycleMonths} 个月` },
            { label: '生效日期', value: draft.effectiveFrom },
            { label: '失效日期', value: draft.effectiveTo || '-' },
            { label: '创建人', value: activeRule?.createdBy || '-' },
            { label: '状态', value: <MetaTag color={draft.status === 'active' ? 'green' : draft.status === 'draft' ? 'orange' : 'gray'} text={draft.status === 'active' ? '生效中' : draft.status === 'draft' ? '草稿' : '已过期'} /> },
          ]} />
        ) : (
          <div className="sales-form-grid sales-form-grid--single">
            <div className="sales-field">
              <span>规则类型</span>
              <Text>拿货折扣规则</Text>
            </div>
            <label><span><i className="form-required">*</i>规则名称</span><Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder="例如 A级代理拿货折扣" /></label>
            <label><span><i className="form-required">*</i>拿货折扣</span><InputNumber value={draft.rate} min={0} max={1} step={0.01} onChange={(value) => setDraft((current) => ({ ...current, rate: Number(value) || 0 }))} className="full-width" /></label>
            <label><span><i className="form-required">*</i>结算周期（月）</span><InputNumber value={draft.cycleMonths} min={1} onChange={(value) => setDraft((current) => ({ ...current, cycleMonths: Number(value) || 0 }))} className="full-width" /></label>
            <label><span><i className="form-required">*</i>生效日期</span><DatePicker value={draft.effectiveFrom || undefined} onChange={(value) => setDraft((current) => ({ ...current, effectiveFrom: value }))} style={{ width: '100%' }} /></label>
            <label><span>失效日期</span><DatePicker value={draft.effectiveTo || undefined} onChange={(value) => setDraft((current) => ({ ...current, effectiveTo: value || undefined }))} style={{ width: '100%' }} /></label>
            <div className="sales-field"><span>状态</span><Select value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))}><Select.Option value="draft">草稿</Select.Option><Select.Option value="active">生效中</Select.Option></Select></div>
          </div>
        )}
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminCommissionDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdminCommissionDashboardSummary>();
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setSummary(await mockApi.getAdminCommissionDashboardSummary());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !summary) return <Spin className="page-spin" tip="加载结算工作台" />;

  const metrics = [
    { label: '待财务核准', value: money(summary.pendingAmount), trend: `${summary.pendingCount} 笔流水` },
    { label: '待代理确认', value: money(summary.pendingSalesConfirmAmount), trend: `${summary.pendingSalesConfirmCount} 笔流水` },
    { label: '待生成打款单', value: money(summary.readyPayoutAmount), trend: `${summary.readyPayoutCount} 笔流水` },
    { label: '待打款确认', value: money(summary.exportedBatchAmount), trend: `${summary.exportedBatchCount} 笔流水` },
  ];

  return (
    <AdminPageShell
      title="佣金结算工作台"
      description="处理佣金流水确认、打款单生成与打款确认"
      action={(
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={loadData} aria-label="刷新" />
        </Tooltip>
      )}
    >
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col span={6} key={metric.label}>
            <MetricCard metric={metric} />
          </Col>
        ))}
      </Row>

      <section className="commission-dashboard-section">
        <div className="commission-dashboard-toolbar">
          <div>
            <Title heading={6}>核心待办</Title>
            <Text type="secondary">按财务处理顺序推进</Text>
          </div>
        </div>
        <Table
          rowKey="id"
          pagination={false}
          className="commission-dashboard-table"
          data={summary.todos}
          columns={[
            {
              title: '事项',
              dataIndex: 'title',
              render: (_: unknown, item) => (
                <Space direction="vertical" size={2}>
                  <Text bold>{item.title}</Text>
                  <Text type="secondary" className="text-ellipsis">{item.description}</Text>
                </Space>
              ),
            },
            {
              title: '金额 / 数量',
              dataIndex: 'amount',
              width: 180,
              render: (_: unknown, item) => <Text bold>{typeof item.amount === 'number' ? money(item.amount) : item.count}</Text>,
            },
            {
              title: '优先级',
              dataIndex: 'priority',
              width: 120,
              render: (value: AdminCommissionDashboardSummary['todos'][number]['priority']) => (
                <MetaTag color={value === 'high' ? 'red' : value === 'medium' ? 'orange' : 'gray'} text={value === 'high' ? '高' : value === 'medium' ? '中' : '低'} />
              ),
            },
            {
              title: '操作',
              width: 96,
              render: (_: unknown, item) => <Button type="text" size="small" onClick={() => navigate(item.route)}>去处理</Button>,
            },
          ]}
        />
      </section>
    </AdminPageShell>
  );
}

export function AdminCommissionTransactionsPage() {
  const [withdrawRows, setWithdrawRows] = useState<AdminCommissionWithdrawRecord[]>([]);
  const [transactionRows, setTransactionRows] = useState<AdminCommissionTransaction[]>([]);
  const [activeWithdraw, setActiveWithdraw] = useState<AdminCommissionWithdrawRecord | null>(null);
  const [detailRows, setDetailRows] = useState<AdminCommissionTransaction[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [receiptPreviewRow, setReceiptPreviewRow] = useState<AdminCommissionWithdrawRecord>();
  const [query, setQuery] = useState({ q: '', status: 'all' as CommissionWithdrawFilter });
  const [payModal, setPayModal] = useState<{ visible: boolean; row?: AdminCommissionWithdrawRecord; bankTransferNo: string; bankReceiptFileName: string }>({ visible: false, bankTransferNo: '', bankReceiptFileName: '' });

  const loadData = async () => {
    const [withdrawList, transactionList] = await Promise.all([
      mockApi.getAdminCommissionWithdrawRecords(),
      mockApi.getAdminCommissionTransactions(),
    ]);
    setWithdrawRows(withdrawList as AdminCommissionWithdrawRecord[]);
    setTransactionRows(transactionList as AdminCommissionTransaction[]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getWithdrawTransactions = (row: AdminCommissionWithdrawRecord) =>
    transactionRows.filter((item) => row.transactionIds.includes(item.id));

  const filteredRows = withdrawRows.filter((item) => {
    const transactions = getWithdrawTransactions(item);
    const keyword = query.q.trim().toLowerCase();
    if (keyword) {
      const searchText = `${item.id} ${item.salesName} ${transactions.map((transaction) => `${transaction.orderId} ${transaction.tenantName}`).join(' ')}`.toLowerCase();
      if (!searchText.includes(keyword)) return false;
    }
    if (query.status !== 'all' && item.status !== query.status) return false;
    return true;
  });

  const getWithdrawSummary = (items: AdminCommissionWithdrawRecord[]) => ({
    count: items.length,
    salesCount: new Set(items.map((item) => item.salesName)).size,
    amount: items.reduce((sum, item) => sum + item.totalAmount, 0),
    orderCount: items.reduce((sum, item) => sum + item.orderCount, 0),
  });

  const withdrawingSummary = getWithdrawSummary(withdrawRows.filter((item) => item.status === 'withdrawing'));
  const withdrawnSummary = getWithdrawSummary(withdrawRows.filter((item) => item.status === 'withdrawn'));
  const allWithdrawSummary = getWithdrawSummary(withdrawRows);

  const openDetail = async (row: AdminCommissionWithdrawRecord) => {
    setActiveWithdraw(row);
    const details = await mockApi.getAdminCommissionWithdrawTransactions(row.id);
    setDetailRows(details as AdminCommissionTransaction[]);
    setDetailVisible(true);
  };

  const handleMarkWithdrawPaid = async () => {
    if (!payModal.row) return;
    await mockApi.markAdminCommissionWithdrawPaid(payModal.row.id, {
      bankTransferNo: payModal.bankTransferNo.trim(),
      bankReceiptFileName: payModal.bankReceiptFileName.trim(),
    });
    Message.success(`已确认提现流水 ${payModal.row.id} 打款完成`);
    setPayModal({ visible: false, bankTransferNo: '', bankReceiptFileName: '' });
    const updatedWithdrawList = await mockApi.getAdminCommissionWithdrawRecords();
    setWithdrawRows(updatedWithdrawList as AdminCommissionWithdrawRecord[]);
    if (activeWithdraw?.id === payModal.row.id) {
      const updatedWithdraw = (updatedWithdrawList as AdminCommissionWithdrawRecord[]).find((item) => item.id === payModal.row?.id);
      setActiveWithdraw(updatedWithdraw ?? activeWithdraw);
      const details = await mockApi.getAdminCommissionWithdrawTransactions(payModal.row.id);
      setDetailRows(details as AdminCommissionTransaction[]);
    } else {
      const transactionList = await mockApi.getAdminCommissionTransactions();
      setTransactionRows(transactionList as AdminCommissionTransaction[]);
    }
  };

  return (
    <AdminPageShell title="提现流水管理" description="处理销售提现申请、打款确认，并在详情中查看本次提现包含的订单佣金明细。" action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}>
      <Row gutter={16}>
        <Col span={8}>
          <MetricCard metric={{ label: '提现处理中', value: money(withdrawingSummary.amount), trend: `${withdrawingSummary.count} 笔待财务打款` }} />
        </Col>
        <Col span={8}>
          <MetricCard metric={{ label: '已到账金额', value: money(withdrawnSummary.amount), trend: `${withdrawnSummary.count} 笔已完成打款` }} />
        </Col>
        <Col span={8}>
          <MetricCard metric={{ label: '提现订单数', value: String(allWithdrawSummary.orderCount), trend: `${allWithdrawSummary.salesCount} 位销售/代理` }} />
        </Col>
      </Row>

      <AdminTablePanel
        toolbar={(
          <Space direction="vertical" size={10} className="full-width">
            <div className="sales-filter-bar">
              <Input.Search value={query.q} onChange={(value) => setQuery((current) => ({ ...current, q: value }))} className="table-search table-search--wide" placeholder="搜索提现流水、销售、订单、企业" />
              <Select value={query.status} onChange={(value) => setQuery((current) => ({ ...current, status: value as CommissionWithdrawFilter }))} className="sales-filter-select">
                {commissionWithdrawFilterOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.text}</Select.Option>)}
              </Select>
            </div>
          </Space>
        )}
      >
        <Table rowKey="id" pagination={{ pageSize: 8, showTotal: true }} data={filteredRows} columns={[
          { title: '提现流水号', dataIndex: 'id', width: 170 },
          { title: '销售/代理', dataIndex: 'salesName' },
          { title: '提现订单数', dataIndex: 'orderCount', render: (value: number) => `${value} 笔` },
          { title: '提现金额', dataIndex: 'totalAmount', render: (value: number) => <Text bold>{money(value)}</Text> },
          { title: '状态', dataIndex: 'status', render: (value: AdminCommissionWithdrawRecord['status']) => <MetaTag {...commissionWithdrawStatusMeta[value]} /> },
          { title: '申请时间', dataIndex: 'requestedAt' },
          { title: '到账时间', dataIndex: 'paidAt', render: (value?: string) => value || '-' },
          { title: '银行流水号', dataIndex: 'bankTransferNo', render: (value?: string) => value || '-' },
          {
            title: '操作',
            width: 180,
            render: (_: unknown, row?: AdminCommissionWithdrawRecord) => row ? (
              <Space size={6}>
                <Button type="text" size="mini" onClick={() => openDetail(row)}>详情</Button>
                {row.status === 'withdrawing' ? (
                  <Button type="text" size="mini" onClick={() => setPayModal({ visible: true, row, bankTransferNo: '', bankReceiptFileName: '' })}>确认打款</Button>
                ) : null}
              </Space>
            ) : null,
          },
        ]} />
      </AdminTablePanel>

      <Drawer width={980} title={activeWithdraw ? `提现流水 ${activeWithdraw.id}` : '提现流水详情'} visible={detailVisible} onCancel={() => setDetailVisible(false)} footer={null}>
        {activeWithdraw ? (
          <Space direction="vertical" size={16} className="full-width">
            <Card title="提现信息" bordered={false} className="admin-detail-card">
              <Descriptions column={2} data={[
                { label: '提现流水号', value: activeWithdraw.id },
                { label: '销售/代理', value: activeWithdraw.salesName },
                { label: '状态', value: <MetaTag {...commissionWithdrawStatusMeta[activeWithdraw.status]} /> },
                { label: '提现订单数', value: `${activeWithdraw.orderCount} 笔` },
                { label: '提现金额', value: money(activeWithdraw.totalAmount) },
                { label: '申请时间', value: activeWithdraw.requestedAt },
                { label: '到账时间', value: activeWithdraw.paidAt || '-' },
              ]} />
            </Card>
            <Card title="财务打款凭证" bordered={false} className="admin-detail-card">
              <Space direction="vertical" size={14} className="full-width">
                <Descriptions column={2} data={[
                  {
                    label: '凭证状态',
                    value: activeWithdraw.bankTransferNo || activeWithdraw.bankReceiptFileName ? <Tag color="green">已上传</Tag> : <Tag color="gray">待上传</Tag>,
                  },
                  { label: '上传时间', value: activeWithdraw.paidAt || '-' },
                  { label: '银行流水号', value: activeWithdraw.bankTransferNo || '-' },
                  { label: '上传人', value: '财务' },
                ]} />
                {activeWithdraw.bankReceiptFileName ? (
                  <button className="commission-receipt-file" type="button" onClick={() => setReceiptPreviewRow(activeWithdraw)}>
                    <span className="commission-receipt-file__icon"><IconFilePdf /></span>
                    <span className="commission-receipt-file__main">
                      <span className="commission-receipt-file__label">银行回单</span>
                      <span className="commission-receipt-file__name">{activeWithdraw.bankReceiptFileName}</span>
                    </span>
                    <span className="commission-receipt-file__action">查看</span>
                  </button>
                ) : (
                  <div className="commission-receipt-empty">
                    财务确认打款后，银行回单会显示在这里。
                  </div>
                )}
              </Space>
            </Card>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="平台出款账户" bordered={false} className="admin-detail-card">
                  {renderPayoutAccountDescriptions(activeWithdraw.payoutAccount)}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="销售收款账户" bordered={false} className="admin-detail-card">
                  {renderPayoutAccountDescriptions(activeWithdraw.recipientAccount)}
                </Card>
              </Col>
            </Row>
            <Card title="关联订单佣金" bordered={false} className="admin-detail-card">
              <Table
                rowKey="id"
                data={detailRows}
                pagination={false}
                columns={[
                  { title: '订单号', dataIndex: 'orderId' },
                  { title: '客户', dataIndex: 'tenantName' },
                  { title: '实付金额', render: (_: unknown, row?: AdminCommissionTransaction) => row ? money(row.paidAmount ?? row.orderAmount) : '-' },
                  { title: '佣金比例', dataIndex: 'rate', render: (value?: number) => (typeof value === 'number' ? `${Math.round(value * 1000) / 10}%` : '-') },
                  { title: '佣金金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
                  { title: '佣金生成时间', dataIndex: 'activatedAt', render: (value?: string) => value || '-' },
                  { title: '可提现时间', dataIndex: 'withdrawableAt', render: (value?: string) => value || '-' },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={receiptPreviewRow ? `银行回单 ${receiptPreviewRow.bankReceiptFileName}` : '银行回单'}
        visible={Boolean(receiptPreviewRow)}
        footer={null}
        onCancel={() => setReceiptPreviewRow(undefined)}
        style={{ width: 760 }}
      >
        {receiptPreviewRow ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions column={2} data={[
              { label: '提现流水号', value: receiptPreviewRow.id },
              { label: '销售/代理', value: receiptPreviewRow.salesName },
              { label: '打款金额', value: money(receiptPreviewRow.totalAmount) },
              { label: '银行流水号', value: receiptPreviewRow.bankTransferNo || '-' },
              { label: '回单文件', value: receiptPreviewRow.bankReceiptFileName || '-' },
              { label: '打款时间', value: receiptPreviewRow.paidAt || '-' },
            ]} />
            <div className="proof-preview-frame">
              <img
                src={buildCommissionReceiptPreview(receiptPreviewRow)}
                alt={receiptPreviewRow.bankReceiptFileName || '银行回单'}
              />
            </div>
          </Space>
        ) : null}
      </Modal>

      <Modal title="确认提现打款" visible={payModal.visible} onCancel={() => setPayModal({ visible: false, bankTransferNo: '', bankReceiptFileName: '' })} onOk={handleMarkWithdrawPaid}>
        <Space direction="vertical" size={12} className="full-width">
          {payModal.row ? (
            <Descriptions column={1} data={[
              { label: '提现流水号', value: payModal.row.id },
              { label: '销售/代理', value: payModal.row.salesName },
              { label: '订单笔数', value: String(payModal.row.orderCount) },
              { label: '发放金额', value: money(payModal.row.totalAmount) },
            ]} />
          ) : null}
          <Text type="secondary">确认后该提现流水会标记为已到账，并同步将本次提现包含的订单佣金更新为已到账。银行流水号与银行回单会出现在提现详情的财务打款凭证中。</Text>
          <Space direction="vertical" size={6} className="full-width">
            <Text className="field-label">银行流水号</Text>
            <Input value={payModal.bankTransferNo} onChange={(bankTransferNo) => setPayModal((current) => ({ ...current, bankTransferNo }))} placeholder="请输入财务实际打款后的银行流水号" />
          </Space>
          <Space direction="vertical" size={6} className="full-width">
            <Text className="field-label">银行回单</Text>
            <MockUploadField
              fileName={payModal.bankReceiptFileName}
              onFileNameChange={(bankReceiptFileName) => setPayModal((current) => ({ ...current, bankReceiptFileName }))}
              buttonText="上传银行回单"
              tip="支持 PDF、PNG、JPG。当前为 mock 上传，选择文件后会记录文件名。"
              placeholder="上传后自动填入，也可输入 mock 文件名，例如 bank_receipt_202605.pdf"
            />
          </Space>
        </Space>
      </Modal>
    </AdminPageShell>
  );
}


export function AdminCommissionBatchesPage() {
  const [rows, setRows] = useState<AdminCommissionBatch[]>([]);
  const [transactions, setTransactions] = useState<AdminCommissionTransaction[]>([]);
  const [activeBatch, setActiveBatch] = useState<AdminCommissionBatch>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [payModal, setPayModal] = useState<{ visible: boolean; row?: AdminCommissionBatch; bankTransferNo: string; bankReceiptFileName: string }>({ visible: false, bankTransferNo: '', bankReceiptFileName: '' });

  const loadData = async () => {
    const [batchRows, transactionRows] = await Promise.all([
      mockApi.getAdminCommissionBatches(),
      mockApi.getAdminCommissionTransactions(),
    ]);
    setRows(batchRows);
    setTransactions(transactionRows);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshActiveBatch = async (batchId: string) => {
    const batchRows = await mockApi.getAdminCommissionBatches();
    setRows(batchRows);
    setActiveBatch(batchRows.find((item: AdminCommissionBatch) => item.id === batchId));
  };

  const batchTransactions = activeBatch?.transactionIds?.length
    ? transactions.filter((item) => activeBatch.transactionIds?.includes(item.id))
    : [];
  const canExportBatch = (row: AdminCommissionBatch) => {
    const items = transactions.filter((item) => row.transactionIds?.includes(item.id));
    return row.status === 'approved' && items.length > 0 && items.every((item) => item.status === 'confirmed');
  };

  const handleApproveBatch = async (row: AdminCommissionBatch) => {
    const reviewedCount = row.sampledItems.filter((item) => item.reviewed).length;
    if (reviewedCount < row.sampledItems.length) {
      Message.error('请先完成抽查明细');
      return;
    }
    await mockApi.approveAdminCommissionBatch(row.id);
    Message.success('批次已审批，已发送代理确认');
    loadData();
  };

  const handleMarkPaid = async () => {
    if (!payModal.row) return;
    await mockApi.markAdminCommissionBatchPaid(payModal.row.id, {
      bankTransferNo: payModal.bankTransferNo.trim(),
      bankReceiptFileName: payModal.bankReceiptFileName.trim(),
    });
    Message.success('已确认打款，销售对账单已推送');
    setPayModal({ visible: false, bankTransferNo: '', bankReceiptFileName: '' });
    loadData();
  };

  return (
    <AdminPageShell title="佣金结算单" description="按月汇总待财务核准流水，审批后发送代理确认，再进入打款发放" action={<Button type="primary" onClick={async () => { const transactions = await mockApi.getAdminCommissionTransactions(); const pendingCount = transactions.filter((item) => item.status === 'pending' && !item.batchId).length; if (!pendingCount) { Message.info('当前没有待财务核准流水'); return; } await mockApi.createAdminCommissionBatch(); Message.success('已生成本期结算单'); loadData(); }}>生成本期结算单</Button>}>
      <AdminTablePanel>
        <Table rowKey="id" data={rows} pagination={false} columns={[
          { title: '批次号', dataIndex: 'batchNo' },
          { title: '批次月份', dataIndex: 'period' },
          { title: '代理人数', dataIndex: 'salesCount' },
          { title: '流水条数', dataIndex: 'commissionCount' },
          { title: '金额合计', dataIndex: 'totalAmount', render: (value: number) => money(value) },
          { title: '状态', dataIndex: 'status', render: (value: keyof typeof batchStatusMeta) => <MetaTag {...batchStatusMeta[value]} /> },
          { title: '创建时间', dataIndex: 'createdAt' },
          { title: '审核时间', dataIndex: 'reviewedAt', render: (value?: string) => value || '-' },
          { title: '打款时间', dataIndex: 'paidAt', render: (value?: string) => value || '-' },
          { title: '银行流水号', dataIndex: 'bankTransferNo', render: (value?: string) => value || '-' },
          {
            title: '操作',
            render: (_: unknown, row: AdminCommissionBatch) => (
              <Space size={8}>
                <Button type="text" size="mini" onClick={() => { setActiveBatch(row); setDrawerVisible(true); }}>详情</Button>
                <Button type="text" size="mini" disabled={row.status !== 'pending_review' || row.sampledItems.some((item) => !item.reviewed)} onClick={() => handleApproveBatch(row)}>审批通过</Button>
                <Button type="text" size="mini" disabled={!canExportBatch(row)} onClick={async () => { const result = await mockApi.exportAdminCommissionBatch(row.id); if (result.blocked) { Message.error(`仍有 ${result.blockedCount} 笔流水未完成代理确认`); return; } Message.success(`已生成 ${result.fileName}`); loadData(); }}>生成打款单</Button>
                <Button type="text" size="mini" disabled={row.status !== 'exported'} onClick={() => setPayModal({ visible: true, row, bankTransferNo: '', bankReceiptFileName: '' })}>确认已打款</Button>
              </Space>
            ),
          },
        ]} />
      </AdminTablePanel>

      <Drawer width={960} title={`结算批次详情 · ${activeBatch?.batchNo ?? ''}`} visible={drawerVisible} onCancel={() => setDrawerVisible(false)}>
        {activeBatch ? (
          <Tabs>
            <TabPane key="overview" title="概览">
              <Descriptions column={2} data={[
                { label: '批次号', value: activeBatch.batchNo },
                { label: '批次月份', value: activeBatch.period },
                { label: '状态', value: <MetaTag {...batchStatusMeta[activeBatch.status]} /> },
                { label: '金额合计', value: money(activeBatch.totalAmount) },
                { label: '代理人数', value: activeBatch.salesCount },
                { label: '流水条数', value: activeBatch.commissionCount },
                { label: '抽查进度', value: `${activeBatch.sampledItems.filter((item) => item.reviewed).length}/${activeBatch.sampledItems.length}` },
                { label: '银行流水号', value: activeBatch.bankTransferNo || '-' },
                { label: '银行回单', value: activeBatch.bankReceiptFileName || '-' },
              ]} />
            </TabPane>
            <TabPane key="samples" title="抽查明细">
              <Table rowKey="id" data={activeBatch.sampledItems} pagination={false} columns={[
                { title: '订单号', dataIndex: 'orderId', render: (value?: string) => value || '-' },
                { title: '企业', dataIndex: 'tenantName' },
                { title: '代理', dataIndex: 'salesName' },
                { title: '订单金额', dataIndex: 'orderAmount', render: (value?: number) => (typeof value === 'number' ? money(value) : '-') },
                { title: '佣金金额', dataIndex: 'amount', render: (value: number) => money(value) },
                { title: '来源', dataIndex: 'sourceText', render: (value?: string) => value || '-' },
                { title: '核查状态', dataIndex: 'reviewed', render: (value: boolean) => <MetaTag color={value ? 'green' : 'orange'} text={value ? '已核查' : '待核查'} /> },
                { title: '操作', render: (_: unknown, row: any) => <Button type="text" size="mini" disabled={row.reviewed} onClick={async () => { await mockApi.markAdminBatchSampleReviewed(activeBatch.id, row.id); await refreshActiveBatch(activeBatch.id); Message.success('已确认该佣金明细无误'); }}>确认无误</Button> },
              ]} />
            </TabPane>
            <TabPane key="transactions" title="批次流水">
              <Table rowKey="id" data={batchTransactions} pagination={false} columns={[
                { title: '流水号', dataIndex: 'id' },
                { title: '企业', dataIndex: 'tenantName' },
                { title: '代理', dataIndex: 'salesName' },
                { title: '佣金金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
                { title: '状态', render: (_: unknown, transaction?: AdminCommissionTransaction) => transaction ? <MetaTag {...getCommissionFlowMeta(transaction, activeBatch.status)} /> : null },
              ]} />
            </TabPane>
          </Tabs>
        ) : null}
      </Drawer>

      <Modal title="确认已打款" visible={payModal.visible} onCancel={() => setPayModal({ visible: false, bankTransferNo: '', bankReceiptFileName: '' })} onOk={handleMarkPaid}>
        <Space direction="vertical" size={12} className="full-width">
          <Descriptions column={1} data={[
            { label: '批次号', value: payModal.row?.batchNo || '-' },
            { label: '应发金额', value: money(payModal.row?.totalAmount || 0) },
          ]} />
          <Input value={payModal.bankTransferNo} onChange={(bankTransferNo) => setPayModal((current) => ({ ...current, bankTransferNo }))} placeholder="银行流水号（选填）" />
          <MockUploadField
            fileName={payModal.bankReceiptFileName}
            onFileNameChange={(bankReceiptFileName) => setPayModal((current) => ({ ...current, bankReceiptFileName }))}
            buttonText="选择银行回单"
            tip="支持 PDF、PNG、JPG。当前为 mock 上传，选择文件后会记录文件名；不上传也可以确认已打款。"
            placeholder="上传后自动填入，也可输入 mock 文件名，例如 bank_receipt_202605.pdf"
          />
        </Space>
      </Modal>
    </AdminPageShell>
  );
}

export function AdminPlansPage() {
  const [rows, setRows] = useState<AdminPlanRecord[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<AdminPlanRecord | null>(null);
  const [draft, setDraft] = useState<Partial<AdminPlanRecord>>({ name: '', productType: 'seat_sub', specSummary: '', priceMonth: 0, priceQuarter: 0, priceYear: 0, status: 'draft', effectiveFrom: '2026-05-01' });

  const loadData = async () => {
    setRows(await mockApi.getAdminPlans());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="套餐与价格" description="席位、CodingPlan 和扩容产品管理" action={<Button type="primary" icon={<IconPlus />} onClick={() => { setActivePlan(null); setDraft({ name: '', productType: 'seat_sub', specSummary: '', priceMonth: 0, priceQuarter: 0, priceYear: 0, status: 'draft', effectiveFrom: '2026-05-01' }); setDrawerVisible(true); }}>新建套餐</Button>}>
      <AdminTablePanel>
        <Table rowKey="id" data={rows} pagination={false} columns={[
          { title: '套餐 ID', dataIndex: 'id' },
          { title: '名称', dataIndex: 'name' },
          { title: '产品类型', dataIndex: 'productType', render: (value: AdminPlanRecord['productType']) => <MetaTag {...planProductTypeMeta[value]} /> },
          { title: '规格', dataIndex: 'specSummary' },
          { title: '月价', dataIndex: 'priceMonth', render: (value?: number) => (value ? money(value) : '-') },
          { title: '季价', dataIndex: 'priceQuarter', render: (value?: number) => (value ? money(value) : '-') },
          { title: '年价', dataIndex: 'priceYear', render: (value?: number) => (value ? money(value) : '-') },
          { title: '状态', dataIndex: 'status', render: (value: keyof typeof planStatusMeta) => <MetaTag {...planStatusMeta[value]} /> },
          { title: '生效时间', dataIndex: 'effectiveFrom' },
          {
            title: '操作',
            render: (_: unknown, row: AdminPlanRecord) => (
              <Space size={8}>
                <Button type="text" size="mini" onClick={() => { setActivePlan(row); setDraft(row); setDrawerVisible(true); }}>编辑</Button>
                <Button type="text" size="mini" onClick={async () => { setHistoryRows(await mockApi.getAdminPlanHistory(row.id)); setHistoryVisible(true); }}>历史</Button>
                <Button type="text" size="mini" disabled={row.status === 'published'} onClick={async () => { await mockApi.publishAdminPlan(row.id); Message.success('套餐已上架'); loadData(); }}>上架</Button>
                <Button type="text" size="mini" disabled={row.status !== 'published'} onClick={async () => { await mockApi.offlineAdminPlan(row.id); Message.success('套餐已下架'); loadData(); }}>下架</Button>
              </Space>
            ),
          },
        ]} />
      </AdminTablePanel>

      <Drawer width={760} title={activePlan ? '编辑套餐' : '新建套餐'} visible={drawerVisible} onCancel={() => setDrawerVisible(false)} footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={async () => { if (!draft.name || !draft.specSummary) { Message.error('请填写套餐基本信息'); return; } if (activePlan) { await mockApi.updateAdminPlan(activePlan.id, draft); Message.success('套餐已更新'); } else { await mockApi.createAdminPlan(draft as AdminPlanRecord); Message.success('套餐已创建'); } setDrawerVisible(false); loadData(); }}>保存</Button></Space>}>
        <div className="sales-form-grid sales-form-grid--single">
          <label><span>名称</span><Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} /></label>
          <label><span>产品类型</span><Select value={draft.productType} onChange={(value) => setDraft((current) => ({ ...current, productType: value }))}><Select.Option value="seat_sub">席位套餐</Select.Option><Select.Option value="coding_plan">CodingPlan</Select.Option><Select.Option value="expansion">扩容产品</Select.Option></Select></label>
          <label><span>规格摘要</span><Input value={draft.specSummary} onChange={(value) => setDraft((current) => ({ ...current, specSummary: value }))} /></label>
          <label><span>月价</span><InputNumber value={draft.priceMonth} onChange={(value) => setDraft((current) => ({ ...current, priceMonth: Number(value) || 0 }))} className="full-width" /></label>
          <label><span>季价</span><InputNumber value={draft.priceQuarter} onChange={(value) => setDraft((current) => ({ ...current, priceQuarter: Number(value) || 0 }))} className="full-width" /></label>
          <label><span>年价</span><InputNumber value={draft.priceYear} onChange={(value) => setDraft((current) => ({ ...current, priceYear: Number(value) || 0 }))} className="full-width" /></label>
          <label><span>生效时间</span><Input value={draft.effectiveFrom} onChange={(value) => setDraft((current) => ({ ...current, effectiveFrom: value }))} /></label>
        </div>
      </Drawer>

      <Modal title="价格历史" visible={historyVisible} footer={null} onCancel={() => setHistoryVisible(false)}>
        <Table rowKey="id" pagination={false} data={historyRows} columns={[
          { title: '时间', dataIndex: 'changedAt' },
          { title: '操作人', dataIndex: 'changedBy' },
          { title: '摘要', dataIndex: 'summary' },
        ]} />
      </Modal>
    </AdminPageShell>
  );
}

export function AdminCouponsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<CouponRecord[]>([]);
  const [usageRows, setUsageRows] = useState<CouponUsageRecord[]>([]);
  const [tenantRows, setTenantRows] = useState<AdminTenantListItem[]>([]);
  const [salesRows, setSalesRows] = useState<AdminSalesListItem[]>([]);
  const [salesAdminRows, setSalesAdminRows] = useState<SalesAdminAccount[]>([]);
  const [templateRows, setTemplateRows] = useState<CouponTemplateRecord[]>(couponTemplateRows);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'issued' | 'templates'>('issued');
  const [activeTemplate, setActiveTemplate] = useState<CouponTemplateRecord>();
  const [templateDrawerVisible, setTemplateDrawerVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CouponTemplateRecord>();
  const [templateDraft, setTemplateDraft] = useState<CouponTemplateDraft>(createCouponTemplateDraft());
  const [couponDrawerVisible, setCouponDrawerVisible] = useState(false);
  const [couponDraft, setCouponDraft] = useState<CouponIssueDraft>(createCouponIssueDraft());
  const [tenantSourceSearch, setTenantSourceSearch] = useState('');
  const [tenantTargetSearch, setTenantTargetSearch] = useState('');
  const tenantBasePath = adminConsolePath(location.pathname, '/tenants');

  const loadData = async () => {
    const [couponData, usageData, tenantData, salesData, salesAdminData] = await Promise.all([
      mockApi.getAdminCoupons(),
      mockApi.getAdminCouponUsages(),
      mockApi.getAdminTenants(),
      mockApi.getAdminSales(),
      mockApi.getSalesAdmins(),
    ]);
    setRows(couponData);
    setUsageRows(usageData);
    setTenantRows(tenantData);
    setSalesRows(salesData.filter((item) => item.status !== 'left'));
    setSalesAdminRows(salesAdminData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = rows.filter((item) => {
    const keywordMatched = `${item.name} ${item.tenantName} ${item.id}`.toLowerCase().includes(query.toLowerCase());
    const statusMatched = statusFilter === 'all' || item.status === statusFilter;
    return keywordMatched && statusMatched;
  });
  const activeRows = rows.filter((item) => item.status === 'active' && (isDiscountCoupon(item) || item.remainingDiscountQuota > 0));
  const activeVoucherRows = rows.filter((item) => item.status === 'active' && isVoucherCoupon(item) && item.remainingDiscountQuota > 0);
  const availableBalance = activeVoucherRows.reduce((sum, item) => sum + item.remainingDiscountQuota, 0);
  const confirmedUsages = usageRows.filter((item) => item.status === 'confirmed');
  const expiringRows = activeRows.filter((item) => dayjs(item.expiresAt).diff(dayjs('2026-05-13'), 'day') <= 30);
  const visibleTemplateRows = templateRows.filter((item) => item.status !== 'deleted');
  const enabledTemplateCount = visibleTemplateRows.filter((item) => item.status === 'enabled').length;
  const enabledTemplateRows = templateRows.filter((item) => item.status === 'enabled');
  const enabledTemplateRowsByType = enabledTemplateRows.filter((item) => item.benefitType === couponDraft.benefitType);
  const selectedCouponTemplate = templateRows.find((item) => item.templateId === couponDraft.templateId);
  const filteredTenantSourceRows = useMemo(
    () =>
      tenantRows.filter((item) =>
        `${item.name}${item.uscc}${item.ownerSales}`.toLowerCase().includes(tenantSourceSearch.toLowerCase()),
      ),
    [tenantRows, tenantSourceSearch],
  );
  const tenantRowMap = useMemo(
    () => Object.fromEntries(tenantRows.map((item) => [item.id, item])),
    [tenantRows],
  );
  const filteredTenantTargetRows = useMemo(
    () =>
      couponDraft.tenantIds
        .map((id) => tenantRowMap[id])
        .filter((item): item is AdminTenantListItem => Boolean(item))
        .filter((item) =>
          `${item.name}${item.uscc}${item.ownerSales}`.toLowerCase().includes(tenantTargetSearch.toLowerCase()),
        ),
    [couponDraft.tenantIds, tenantRowMap, tenantTargetSearch],
  );
  const visibleTenantSourceIds = useMemo(
    () => filteredTenantSourceRows.map((item) => item.id),
    [filteredTenantSourceRows],
  );
  const allVisibleTenantsSelected = useMemo(
    () => visibleTenantSourceIds.length > 0 && visibleTenantSourceIds.every((id) => couponDraft.tenantIds.includes(id)),
    [couponDraft.tenantIds, visibleTenantSourceIds],
  );
  const selectedVisibleTenantCount = useMemo(
    () => visibleTenantSourceIds.filter((id) => couponDraft.tenantIds.includes(id)).length,
    [couponDraft.tenantIds, visibleTenantSourceIds],
  );
  const handleToggleTenant = (tenantId: string, checked: boolean) => {
    setCouponDraft((current) => ({
      ...current,
      tenantIds: checked
        ? current.tenantIds.includes(tenantId)
          ? current.tenantIds
          : [...current.tenantIds, tenantId]
        : current.tenantIds.filter((id) => id !== tenantId),
    }));
  };
  const handleToggleAllVisibleTenants = (checked: boolean) => {
    setCouponDraft((current) => ({
      ...current,
      tenantIds: checked
        ? Array.from(new Set([...current.tenantIds, ...visibleTenantSourceIds]))
        : current.tenantIds.filter((id) => !visibleTenantSourceIds.includes(id)),
    }));
  };
  const resetCouponDraft = () => {
    setCouponDraft(createCouponIssueDraft());
    setTenantSourceSearch('');
    setTenantTargetSearch('');
  };
  const openTemplateDrawer = (template?: CouponTemplateRecord, benefitType: CouponBenefitType = 'coupon') => {
    setEditingTemplate(template);
    setTemplateDraft(template ? templateToDraft(template) : createCouponTemplateDraft(benefitType));
    setTemplateDrawerVisible(true);
  };
  const saveTemplate = () => {
    if (!templateDraft.name.trim() || !templateDraft.ruleSummary.trim()) {
      Message.error('请填写模板名称和规则说明');
      return;
    }
    if (templateDraft.discountRate < 0 || templateDraft.discountRate > 99 || templateDraft.defaultValidDays <= 0) {
      Message.error('折扣规则需在 0-99 之间，有效期需大于 0');
      return;
    }
    if (templateDraft.benefitType === 'voucher' && templateDraft.defaultQuota <= 0) {
      Message.error('代金券模板默认额度需大于 0');
      return;
    }
    const nowText = dayjs().format('YYYY-MM-DD HH:mm');
    const defaultQuota = templateDraft.benefitType === 'voucher' ? templateDraft.defaultQuota : 0;
    const nextTemplate: CouponTemplateRecord = {
      id: editingTemplate?.id ?? `tpl-custom-${Date.now()}`,
      templateId: editingTemplate?.templateId ?? `tpl-custom-${Date.now()}`,
      benefitType: templateDraft.benefitType,
      name: templateDraft.name.trim(),
      fixedName: templateDraft.name.trim(),
      ruleSummary: templateDraft.ruleSummary.trim(),
      discountScope: templateDraft.discountScope,
      discountRate: templateDraft.discountRate,
      defaultQuota,
      defaultBenefit: couponTemplateDefaultBenefitLabel({ benefitType: templateDraft.benefitType, discountRate: templateDraft.discountRate, defaultQuota }),
      defaultValidDays: templateDraft.defaultValidDays,
      defaultValidity: couponTemplateValidityLabel(templateDraft.defaultValidDays),
      status: editingTemplate?.status === 'disabled' ? 'disabled' : 'enabled',
      createdBy: editingTemplate?.createdBy ?? '王珊',
      createdAt: editingTemplate?.createdAt ?? nowText,
      remark: templateDraft.remark.trim() || '-',
    };
    setTemplateRows((current) => editingTemplate
      ? current.map((item) => (item.templateId === editingTemplate.templateId ? nextTemplate : item))
      : [nextTemplate, ...current]);
    Message.success(editingTemplate ? '券模板已更新，已发放的券不受影响' : `${couponTemplateTypeLabel(templateDraft.benefitType)}已新增`);
    setTemplateDrawerVisible(false);
    setEditingTemplate(undefined);
    setTemplateDraft(createCouponTemplateDraft());
  };
  const updateTemplateStatus = (template: CouponTemplateRecord, status: CouponTemplateStatus) => {
    setTemplateRows((current) => current.map((item) => (item.templateId === template.templateId ? { ...item, status } : item)));
    if (couponDraft.templateId === template.templateId && status !== 'enabled') {
      setCouponDraft((current) => applyCouponTemplateToDraft(current, ''));
    }
    Message.success(status === 'enabled' ? '券模板已启用' : '券模板已暂停，已发放的券不受影响');
  };
  const deleteTemplate = (template: CouponTemplateRecord) => {
    Modal.confirm({
      title: '删除券模板',
      content: `删除后该模板将不再用于新发放，已发放的券不受影响：${template.name}`,
      okText: '删除',
      okButtonProps: { status: 'danger' },
      onOk: () => {
        setTemplateRows((current) => current.map((item) => (item.templateId === template.templateId ? { ...item, status: 'deleted' } : item)));
        if (couponDraft.templateId === template.templateId) {
          setCouponDraft((current) => applyCouponTemplateToDraft(current, ''));
        }
        Message.success('券模板已删除，已发放的券不受影响');
      },
    });
  };
  const createCoupon = async () => {
    if (couponDraft.targetKind === 'tenant' && !couponDraft.tenantIds.length) {
      Message.error('请至少选择 1 家发放企业');
      return;
    }
    if (couponDraft.targetKind === 'sales' && !couponDraft.salesIds.length) {
      Message.error('请至少选择 1 位销售');
      return;
    }
    if (couponDraft.targetKind === 'salesAdmin' && !couponDraft.salesAdminIds.length) {
      Message.error('请至少选择 1 位销售管理员');
      return;
    }
    if (!selectedCouponTemplate) {
      Message.error('请选择券模板');
      return;
    }
    if (couponDraft.discountRate === undefined || couponDraft.discountRate < 0 || couponDraft.discountRate > 99) {
      Message.error('折扣规则需在 0 到 99 之间');
      return;
    }
    if (!couponDraft.name.trim() || !couponDraft.effectiveAt || !couponDraft.expiresAt) {
      Message.error('请填写券名称和有效期');
      return;
    }
    if (couponDraft.benefitType === 'voucher' && couponDraft.totalDiscountQuota <= 0) {
      Message.error('总代金券额度需大于 0');
      return;
    }
    if (couponDraft.thresholdAmount < 0) {
      Message.error('使用限制不能小于 0');
      return;
    }
    if (couponDraft.expiresAt <= couponDraft.effectiveAt) {
      Message.error('失效时间必须晚于生效时间');
      return;
    }
    const discountRate = couponDraft.discountRate;
    if (couponDraft.targetKind === 'tenant') {
      await Promise.all(couponDraft.tenantIds.map((tenantId) => mockApi.createAdminCoupon({
        benefitType: couponDraft.benefitType,
        tenantId,
        name: couponDraft.name,
        discountRate,
        discountScope: couponDraft.discountScope,
        thresholdAmount: couponDraft.thresholdAmount,
        totalDiscountQuota: couponDraft.totalDiscountQuota,
        effectiveAt: couponDraft.effectiveAt,
        expiresAt: couponDraft.expiresAt,
        remark: couponDraft.remark,
      })));
      Message.success(`已向 ${couponDraft.tenantIds.length} 家企业发放${couponBenefitTypeText(couponDraft.benefitType)}`);
    } else if (couponDraft.targetKind === 'salesAdmin') {
      await Promise.all(couponDraft.salesAdminIds.map((salesAdminId) => mockApi.issueSalesCouponPool({
        benefitType: couponDraft.benefitType,
        ownerRole: 'salesAdmin',
        ownerId: salesAdminId,
        name: couponDraft.name,
        discountRate,
        discountScope: couponDraft.discountScope,
        totalQuota: couponDraft.benefitType === 'coupon' ? couponDraft.issueQuantity : couponDraft.totalDiscountQuota,
        effectiveAt: couponDraft.effectiveAt,
        expiresAt: couponDraft.expiresAt,
        remark: couponDraft.remark,
      })));
      Message.success(couponDraft.benefitType === 'coupon' ? `已向 ${couponDraft.salesAdminIds.length} 位销售管理员发放优惠券` : `已向 ${couponDraft.salesAdminIds.length} 位销售管理员发放代金券额度`);
    } else {
      await Promise.all(couponDraft.salesIds.map((salesId) => mockApi.issueSalesCouponPool({
        benefitType: couponDraft.benefitType,
        ownerRole: 'sales',
        ownerId: salesId,
        name: couponDraft.name,
        discountRate,
        discountScope: couponDraft.discountScope,
        totalQuota: couponDraft.benefitType === 'coupon' ? couponDraft.issueQuantity : couponDraft.totalDiscountQuota,
        effectiveAt: couponDraft.effectiveAt,
        expiresAt: couponDraft.expiresAt,
        remark: couponDraft.remark,
      })));
      Message.success(couponDraft.benefitType === 'coupon' ? `已向 ${couponDraft.salesIds.length} 位销售发放优惠券` : `已向 ${couponDraft.salesIds.length} 位销售发放代金券额度`);
    }
    setCouponDrawerVisible(false);
    resetCouponDraft();
    loadData();
  };

  return (
    <AdminPageShell
      title="代金券与优惠券"
      description="先维护券模板，再发放优惠券或代金券"
      action={(
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => { resetCouponDraft(); setActiveTab('issued'); setCouponDrawerVisible(true); }}>发放券</Button>
          <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
        </Space>
      )}
    >
      <Tabs activeTab={activeTab} onChange={(value) => setActiveTab(value as 'issued' | 'templates')} className="admin-coupon-tabs">
        <TabPane key="issued" title="发放记录">
          <div className="voucher-metric-grid admin-coupon-metric-grid">
            <Card bordered className="voucher-metric-card">
              <span>代金券余额</span>
              <strong>{money(availableBalance)}</strong>
              <small>仅统计可用且未用完的代金券</small>
            </Card>
            <Card bordered className="voucher-metric-card">
              <span>可用券数</span>
              <strong>{activeRows.length}</strong>
              <small>当前状态为生效中</small>
            </Card>
            <Card bordered className="voucher-metric-card">
              <span>即将过期数</span>
              <strong>{expiringRows.length}</strong>
              <small>30 天内到期且仍有余额</small>
            </Card>
            <Card bordered className="voucher-metric-card">
              <span>累计已抵扣</span>
              <strong>{money(confirmedUsages.reduce((sum, item) => sum + item.discountAmount, 0))}</strong>
              <small>已确认抵扣记录汇总</small>
            </Card>
          </div>
          <AdminTablePanel
            toolbar={(
              <div className="sales-filter-bar">
                <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="搜索券名称、企业、券 ID" />
                <Select value={statusFilter} onChange={setStatusFilter} className="sales-filter-select">
                  <Select.Option value="all">全部状态</Select.Option>
                  {Object.entries(couponStatusMeta).map(([value, meta]) => <Select.Option key={value} value={value}>{meta.text}</Select.Option>)}
                </Select>
              </div>
            )}
          >
            <Table
              rowKey="id"
              data={filteredRows}
              pagination={{ pageSize: 8, showTotal: true }}
              columns={[
                {
                  title: '券名称/ID',
                  width: 220,
                  render: (_: unknown, row: CouponRecord) => (
                    <Space direction="vertical" size={2}>
                      <Button type="text" size="mini" className="voucher-name-button" onClick={() => navigate(adminConsolePath(location.pathname, `/coupons/${row.id}`))}>
                        {row.name}
                      </Button>
                      <Text type="secondary">{row.id}</Text>
                    </Space>
                  ),
                },
                { title: '企业', dataIndex: 'tenantName', render: (value: string, row: CouponRecord) => <Button type="text" size="mini" onClick={() => navigate(`${tenantBasePath}/${row.tenantId}`)}>{value}</Button> },
                { title: '券类型', render: (_: unknown, row: CouponRecord) => <Tag color={isDiscountCoupon(row) ? 'purple' : 'arcoblue'}>{couponBenefitTypeLabel(row)}</Tag> },
                { title: '折扣规则', render: (_: unknown, row: CouponRecord) => couponRuleWithThresholdLabel(row) },
                { title: '总额度', render: (_: unknown, row: CouponRecord) => couponQuotaLabel(row) },
                {
                  title: '已用',
                  render: (_: unknown, row: CouponRecord) => (
                    <Space direction="vertical" size={4} className="full-width">
                      <span>{couponUsedLabel(row)}</span>
                      {isVoucherCoupon(row) ? <Progress percent={row.totalDiscountQuota ? Math.round((row.usedDiscountQuota / row.totalDiscountQuota) * 100) : 0} size="small" showText={false} /> : null}
                    </Space>
                  ),
                },
                { title: '剩余', render: (_: unknown, row: CouponRecord) => couponRemainingLabel(row) },
                { title: '有效期', render: (_: unknown, row: CouponRecord) => `${row.effectiveAt} ~ ${row.expiresAt}` },
                { title: '状态', dataIndex: 'status', render: (value: CouponStatus) => <MetaTag {...couponStatusMeta[value]} /> },
                { title: '发放人', dataIndex: 'issuedBy' },
                {
                  title: '操作',
                  render: (_: unknown, row: CouponRecord) => (
                    <Space size={8}>
                      <Button type="text" size="mini" onClick={() => navigate(adminConsolePath(location.pathname, `/coupons/${row.id}`))}>详情</Button>
                      {row.status === 'active' ? <Button type="text" size="mini" status="danger" onClick={async () => { await mockApi.disableAdminCoupon(row.id); Message.success('券已作废'); loadData(); }}>作废</Button> : null}
                    </Space>
                  ),
                },
              ]}
            />
          </AdminTablePanel>
        </TabPane>
        <TabPane key="templates" title="券模板">
          <div className="admin-coupon-template-metric-grid">
            <MetricCard metric={{ label: '模板数', value: visibleTemplateRows.length }} />
            <MetricCard metric={{ label: '优惠券模板', value: visibleTemplateRows.filter((item) => item.benefitType === 'coupon').length }} />
            <MetricCard metric={{ label: '代金券模板', value: visibleTemplateRows.filter((item) => item.benefitType === 'voucher').length }} />
            <MetricCard metric={{ label: '启用中', value: enabledTemplateCount }} />
          </div>
          <AdminTablePanel
            toolbar={(
              <div className="sales-filter-bar">
                <Button type="primary" icon={<IconPlus />} onClick={() => openTemplateDrawer()}>
                  新建券模板
                </Button>
              </div>
            )}
          >
            <Table
              rowKey="id"
              data={visibleTemplateRows}
              pagination={false}
              columns={[
                { title: '模板名称', dataIndex: 'name' },
                { title: '模板类型', render: (_: unknown, row: CouponTemplateRecord) => <Tag color={row.benefitType === 'coupon' ? 'purple' : 'arcoblue'}>{couponTemplateTypeLabel(row.benefitType)}</Tag> },
                { title: '优惠规则', dataIndex: 'ruleSummary', ellipsis: true, tooltip: true },
                { title: '默认规则', dataIndex: 'defaultBenefit' },
                { title: '默认有效期', dataIndex: 'defaultValidity' },
                { title: '状态', dataIndex: 'status', render: (value: CouponTemplateStatus) => <MetaTag {...couponTemplateStatusMeta[value]} /> },
                {
                  title: '操作',
                  render: (_: unknown, row: CouponTemplateRecord) => (
                    <Space size={8}>
                      <Button type="text" size="mini" onClick={() => setActiveTemplate(row)}>查看</Button>
                      <Button type="text" size="mini" onClick={() => openTemplateDrawer(row)}>编辑</Button>
                      {row.status === 'enabled' ? <Button type="text" size="mini" onClick={() => updateTemplateStatus(row, 'disabled')}>暂停</Button> : null}
                      {row.status === 'disabled' ? <Button type="text" size="mini" onClick={() => updateTemplateStatus(row, 'enabled')}>启用</Button> : null}
                      <Button type="text" size="mini" status="danger" onClick={() => deleteTemplate(row)}>删除</Button>
                    </Space>
                  ),
                },
              ]}
            />
          </AdminTablePanel>
        </TabPane>
      </Tabs>

      <Drawer
        title={activeTemplate ? `券模板 ${activeTemplate.name}` : '券模板'}
        width={560}
        visible={Boolean(activeTemplate)}
        footer={null}
        onCancel={() => setActiveTemplate(undefined)}
      >
        {activeTemplate ? (
          <Descriptions column={1} data={[
            { label: '模板名称', value: activeTemplate.name },
            { label: '模板类型', value: couponTemplateTypeLabel(activeTemplate.benefitType) },
            { label: '优惠规则', value: activeTemplate.ruleSummary },
            { label: '优惠范围', value: couponDiscountScopeLabel(activeTemplate.discountScope) },
            { label: '默认规则', value: activeTemplate.defaultBenefit },
            { label: '默认额度', value: activeTemplate.benefitType === 'voucher' ? money(activeTemplate.defaultQuota) : '不设额度' },
            { label: '默认有效期', value: activeTemplate.defaultValidity },
            { label: '状态', value: <MetaTag {...couponTemplateStatusMeta[activeTemplate.status]} /> },
            { label: '影响范围', value: '仅影响后续发放；已发放的券保留发放时快照，不会被模板编辑、暂停或删除改动。' },
            { label: '创建人', value: activeTemplate.createdBy },
            { label: '创建时间', value: activeTemplate.createdAt },
            { label: '备注', value: activeTemplate.remark },
          ]} />
        ) : null}
      </Drawer>

      <Drawer
        title={editingTemplate ? '编辑券模板' : '新建券模板'}
        width={640}
        visible={templateDrawerVisible}
        onCancel={() => { setTemplateDrawerVisible(false); setEditingTemplate(undefined); setTemplateDraft(createCouponTemplateDraft()); }}
        footer={<Space><Button onClick={() => setTemplateDrawerVisible(false)}>取消</Button><Button type="primary" onClick={saveTemplate}>保存</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <div className="sales-form-grid sales-form-grid--single">
            <label>
              <span><i className="form-required">*</i>模板类型</span>
              <Select
                value={templateDraft.benefitType}
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setTemplateDraft((current) => ({
                  ...current,
                  benefitType: value as CouponBenefitType,
                  defaultQuota: value === 'coupon' ? 0 : current.defaultQuota > 0 ? current.defaultQuota : 20000,
                }))}
              >
                <Select.Option value="coupon">优惠券模板</Select.Option>
                <Select.Option value="voucher">代金券模板</Select.Option>
              </Select>
            </label>
            <label><span><i className="form-required">*</i>模板名称</span><Input value={templateDraft.name} maxLength={30} onChange={(value) => setTemplateDraft((current) => ({ ...current, name: value }))} placeholder={templateDraft.benefitType === 'coupon' ? '例如 整单 7 折优惠券模板' : '例如 席位 8 折代金券模板'} /></label>
            <label>
              <span><i className="form-required">*</i>优惠范围</span>
              <Select
                value={templateDraft.discountScope}
                onChange={(value) => setTemplateDraft((current) => ({ ...current, discountScope: value as CouponDiscountScope }))}
                className="full-width"
                getPopupContainer={() => document.body}
                dropdownMenuClassName="admin-coupon-scope-dropdown"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
              >
                <Select.Option value="order">整单</Select.Option>
                <Select.Option value="seat">席位</Select.Option>
                <Select.Option value="coding_plan">CodingPlan</Select.Option>
              </Select>
            </label>
            <label><span><i className="form-required">*</i>默认折扣规则</span><InputNumber value={templateDraft.discountRate} min={0} max={99} onChange={(value) => setTemplateDraft((current) => ({ ...current, discountRate: Number(value) || 0 }))} className="full-width" /></label>
            {templateDraft.benefitType === 'voucher' ? (
              <label><span><i className="form-required">*</i>默认代金券额度</span><InputNumber value={templateDraft.defaultQuota} min={1} onChange={(value) => setTemplateDraft((current) => ({ ...current, defaultQuota: Number(value) || 0 }))} className="full-width" /></label>
            ) : null}
            <label><span><i className="form-required">*</i>默认有效期天数</span><InputNumber value={templateDraft.defaultValidDays} min={1} onChange={(value) => setTemplateDraft((current) => ({ ...current, defaultValidDays: Number(value) || 0 }))} className="full-width" /></label>
            <label><span><i className="form-required">*</i>优惠规则说明</span><Input.TextArea rows={3} value={templateDraft.ruleSummary} onChange={(value) => setTemplateDraft((current) => ({ ...current, ruleSummary: value }))} placeholder="说明该规则的抵扣范围和适用场景" /></label>
            <label><span>备注</span><Input.TextArea rows={3} value={templateDraft.remark} onChange={(value) => setTemplateDraft((current) => ({ ...current, remark: value }))} placeholder="选填，记录审批要求或运营说明" /></label>
          </div>
          <div className="billing-detail-hint">
            <strong>规则预览</strong>
            <p>
              {couponTemplateTypeLabel(templateDraft.benefitType)}，
              {couponDiscountScopeLabel(templateDraft.discountScope)} {couponTemplateBenefitLabel(templateDraft.discountRate)}，
              {templateDraft.benefitType === 'coupon' ? '不设额度，发放后按张使用' : `默认额度 ${money(templateDraft.defaultQuota || 0)}`}，
              {couponTemplateValidityLabel(templateDraft.defaultValidDays || 0)}。
            </p>
          </div>
        </Space>
      </Drawer>

      <Drawer
        title="发放券"
        width={748}
        visible={couponDrawerVisible}
        className="template-dispatch-drawer"
        onCancel={() => { setCouponDrawerVisible(false); resetCouponDraft(); }}
        footer={<Space><Button onClick={() => setCouponDrawerVisible(false)}>取消</Button><Button type="primary" onClick={createCoupon}>发放</Button></Space>}
      >
        <div className="template-drawer">
          <div className="sales-form-grid sales-form-grid--single">
            <div className="sales-field">
              <span><i className="form-required">*</i>券类型</span>
              <Select
                value={couponDraft.benefitType}
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setCouponDraft((current) => withCouponBenefitType(current, value as CouponBenefitType, templateRows))}
                disabled={couponDraft.targetKind !== 'tenant'}
              >
                <Select.Option value="coupon">优惠券</Select.Option>
                <Select.Option value="voucher">代金券</Select.Option>
              </Select>
            </div>
            <div className="sales-field">
              <span><i className="form-required">*</i>发放对象</span>
              <Select
                value={couponDraft.targetKind}
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setCouponDraft((current) => withCouponIssueTargetKind(current, value as CouponIssueDraft['targetKind'], templateRows))}
              >
                <Select.Option value="tenant">直接发给客户</Select.Option>
                <Select.Option value="salesAdmin">发给销售管理员</Select.Option>
                <Select.Option value="sales">直接发给普通销售</Select.Option>
              </Select>
            </div>
          </div>
          <Descriptions column={1} data={[
            {
              label: '发放方式',
              value: couponDraft.targetKind === 'tenant'
                ? '直接发放到客户账户，不使用券码'
                : couponDraft.targetKind === 'salesAdmin'
                  ? '发放为销售管理员可分配优惠券'
                  : '发放为普通销售可发客户优惠券',
            },
            ...(couponDraft.targetKind !== 'tenant' ? [{ label: '券类型限制', value: '销售链路只支持优惠券，不支持代金券' }] : []),
          ]} />
          {couponDraft.targetKind === 'tenant' ? <div className="template-drawer__field">
            <div className="template-drawer__label">发放企业</div>
            <div className="template-picker">
              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>全部：{tenantRows.length}项</strong>
                </div>
                <div className="template-picker__search">
                  <Input.Search
                    allowClear
                    placeholder="请输入企业名称或统一社会信用代码"
                    value={tenantSourceSearch}
                    onChange={setTenantSourceSearch}
                    className="table-search"
                  />
                </div>
                <div className="template-picker__list">
                  <label className="template-picker__item template-picker__item--selectall">
                    <Checkbox
                      checked={allVisibleTenantsSelected}
                      indeterminate={!allVisibleTenantsSelected && selectedVisibleTenantCount > 0}
                      onChange={handleToggleAllVisibleTenants}
                    />
                    <span>全选</span>
                  </label>
                  {filteredTenantSourceRows.length ? (
                    filteredTenantSourceRows.map((item) => (
                      <label className="template-picker__item" key={item.id}>
                        <Checkbox
                          checked={couponDraft.tenantIds.includes(item.id)}
                          onChange={(checked) => handleToggleTenant(item.id, checked)}
                        />
                        <Avatar size={26} className="template-picker__avatar">
                          {getTenantPickerAvatarText(item.name)}
                        </Avatar>
                        <div className="template-picker__item-body">
                          <strong>{item.name}</strong>
                          <span>{item.uscc || item.ownerSales || '-'}</span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="template-picker__empty">
                      <div className="template-picker__empty-icon" aria-hidden="true">
                        <span />
                      </div>
                      <div className="template-picker__empty-text">暂无数据</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>已选：{couponDraft.tenantIds.length}项</strong>
                  <Button type="text" size="mini" disabled={!couponDraft.tenantIds.length} onClick={() => setCouponDraft((current) => ({ ...current, tenantIds: [] }))}>
                    清空
                  </Button>
                </div>
                <div className="template-picker__search">
                  <Input.Search
                    allowClear
                    placeholder="请输入企业名称或统一社会信用代码"
                    value={tenantTargetSearch}
                    onChange={setTenantTargetSearch}
                    className="table-search"
                  />
                </div>
                <div className="template-picker__list">
                  {filteredTenantTargetRows.length ? (
                    filteredTenantTargetRows.map((item) => (
                      <div className="template-picker__item template-picker__item--selected" key={item.id}>
                        <Avatar size={26} className="template-picker__avatar">
                          {getTenantPickerAvatarText(item.name)}
                        </Avatar>
                        <div className="template-picker__item-body">
                          <strong>{item.name}</strong>
                          <span>{item.uscc || item.ownerSales || '-'}</span>
                        </div>
                        <Button
                          type="text"
                          size="mini"
                          className="template-picker__remove"
                          onClick={() => handleToggleTenant(item.id, false)}
                        >
                          移除
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="template-picker__empty">
                      <div className="template-picker__empty-icon" aria-hidden="true">
                        <span />
                      </div>
                      <div className="template-picker__empty-text">暂无数据</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div> : null}
          {couponDraft.targetKind === 'sales' ? (
            <div className="template-drawer__field">
              <div className="template-drawer__label">发放销售</div>
              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>全部：{salesRows.length}项</strong>
                  <Button type="text" size="mini" disabled={!couponDraft.salesIds.length} onClick={() => setCouponDraft((current) => ({ ...current, salesIds: [] }))}>
                    清空
                  </Button>
                </div>
                <div className="template-picker__list">
                  {salesRows.map((item) => (
                    <label className="template-picker__item" key={item.id}>
                      <Checkbox
                        checked={couponDraft.salesIds.includes(item.id)}
                        onChange={(checked) => setCouponDraft((current) => ({
                          ...current,
                          salesIds: checked
                            ? current.salesIds.includes(item.id)
                              ? current.salesIds
                              : [...current.salesIds, item.id]
                            : current.salesIds.filter((id) => id !== item.id),
                        }))}
                      />
                      <Avatar size={26} className="template-picker__avatar">
                        {item.name.slice(0, 1)}
                      </Avatar>
                      <div className="template-picker__item-body">
                        <strong>{item.name}</strong>
                        <span>{item.team} / {item.employeeNo}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {couponDraft.targetKind === 'salesAdmin' ? (
            <div className="template-drawer__field">
              <div className="template-drawer__label">发放销售管理员</div>
              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>全部：{salesAdminRows.length}项</strong>
                  <Button type="text" size="mini" disabled={!couponDraft.salesAdminIds.length} onClick={() => setCouponDraft((current) => ({ ...current, salesAdminIds: [] }))}>
                    清空
                  </Button>
                </div>
                <div className="template-picker__list">
                  {salesAdminRows.map((item) => (
                    <label className="template-picker__item" key={item.id}>
                      <Checkbox
                        checked={couponDraft.salesAdminIds.includes(item.id)}
                        onChange={(checked) => setCouponDraft((current) => ({
                          ...current,
                          salesAdminIds: checked
                            ? current.salesAdminIds.includes(item.id)
                              ? current.salesAdminIds
                              : [...current.salesAdminIds, item.id]
                            : current.salesAdminIds.filter((id) => id !== item.id),
                        }))}
                      />
                      <Avatar size={26} className="template-picker__avatar">
                        {item.name.slice(0, 1)}
                      </Avatar>
                      <div className="template-picker__item-body">
                        <strong>{item.name}</strong>
                        <span>{item.team}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="billing-detail-hint">
                <strong>销售管理员</strong>
                <p>本次券将发给所选销售管理员，由管理员继续分配给下属销售，或直接发给自己的客户。</p>
              </div>
            </div>
          ) : null}
          <div className="sales-form-grid sales-form-grid--single">
            <div className="sales-field">
              <span><i className="form-required">*</i>绑定券模板</span>
              <Select
                value={couponDraft.templateId || undefined}
                placeholder="请选择券模板"
                className="full-width"
                triggerProps={{ popupStyle: { zIndex: 3000 } }}
                onChange={(value) => setCouponDraft((current) => applyCouponTemplateToDraft(current, String(value), templateRows))}
              >
                {enabledTemplateRowsByType.map((item) => (
                  <Select.Option key={item.templateId} value={item.templateId}>
                    {item.name} / {couponTemplateRuleLabel(item)}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <label><span><i className="form-required">*</i>券名称</span><Input value={couponDraft.name} onChange={(value) => setCouponDraft((current) => ({ ...current, name: value }))} maxLength={30} placeholder="选择模板后可调整名称" /></label>
            <Descriptions column={1} data={[
              { label: '绑定券模板', value: selectedCouponTemplate ? couponTemplateRuleLabel(selectedCouponTemplate) : '-' },
              { label: '本次发放规则', value: selectedCouponTemplate && couponDraft.discountRate !== undefined ? `${couponDiscountScopeLabel(couponDraft.discountScope)} · ${couponDiscountRuleLabel(couponDraft.discountRate)}` : '-' },
              { label: '使用限制', value: couponThresholdRuleLabel(couponDraft.thresholdAmount) },
              { label: '使用方式', value: couponDraft.benefitType === 'coupon' ? '优惠券不设余额，单次使用后失效' : '代金券按额度扣减，可多次使用直到余额耗尽' },
            ]} />
            {selectedCouponTemplate ? (
              <label>
                <span><i className="form-required">*</i>优惠范围</span>
                <Select
                  value={couponDraft.discountScope}
                  onChange={(value) => setCouponDraft((current) => ({ ...current, discountScope: value as CouponDiscountScope }))}
                  className="full-width"
                  getPopupContainer={() => document.body}
                  dropdownMenuClassName="admin-coupon-scope-dropdown"
                  triggerProps={{ popupStyle: { zIndex: 3000 } }}
                >
                  <Select.Option value="order">整单</Select.Option>
                  <Select.Option value="seat">席位</Select.Option>
                  <Select.Option value="coding_plan">CodingPlan</Select.Option>
                </Select>
              </label>
            ) : null}
            {selectedCouponTemplate ? (
              <label>
                <span><i className="form-required">*</i>折扣规则</span>
                <InputNumber
                  value={couponDraft.discountRate}
                  min={0}
                  max={99}
                  onChange={(value) => setCouponDraft((current) => ({ ...current, discountRate: value === undefined ? undefined : Number(value) }))}
                  className="full-width"
                  suffix="% 折扣"
                  placeholder="请填写折扣规则"
                />
              </label>
            ) : null}
            <label>
              <span><i className="form-required">*</i>使用限制（满多少可用）</span>
              <InputNumber
                value={couponDraft.thresholdAmount}
                min={0}
                onChange={(value) => setCouponDraft((current) => ({ ...current, thresholdAmount: Number(value) || 0 }))}
                className="full-width"
                suffix="元"
                placeholder="0 表示无门槛"
              />
            </label>
            {couponDraft.benefitType === 'voucher' ? (
              <label><span><i className="form-required">*</i>总代金券额度</span><InputNumber value={couponDraft.totalDiscountQuota} min={1} onChange={(value) => setCouponDraft((current) => ({ ...current, totalDiscountQuota: Number(value) || 0 }))} className="full-width" /></label>
            ) : null}
            {couponDraft.benefitType === 'coupon' && couponDraft.targetKind !== 'tenant' ? (
              <label><span><i className="form-required">*</i>发放数量</span><InputNumber value={couponDraft.issueQuantity} min={1} precision={0} onChange={(value) => setCouponDraft((current) => ({ ...current, issueQuantity: Number(value) || 0 }))} className="full-width" suffix="张" /></label>
            ) : null}
            <label><span><i className="form-required">*</i>生效时间</span><DatePicker value={couponDraft.effectiveAt || undefined} onChange={(value) => setCouponDraft((current) => ({ ...current, effectiveAt: value || '' }))} className="full-width" /></label>
            <label><span><i className="form-required">*</i>失效时间</span><DatePicker value={couponDraft.expiresAt || undefined} onChange={(value) => setCouponDraft((current) => ({ ...current, expiresAt: value || '' }))} className="full-width" /></label>
            <label><span>备注</span><Input.TextArea rows={4} value={couponDraft.remark} onChange={(value) => setCouponDraft((current) => ({ ...current, remark: value }))} placeholder="选填，记录商务政策、会议结论或合同约定" /></label>
          </div>
          <div className="billing-detail-hint">
            <strong>抵扣预览</strong>
            <p>
              例如订单原价 ¥10,000，
              优惠范围 {couponDiscountScopeLabel(couponDraft.discountScope)}，
              {selectedCouponTemplate && couponDraft.discountRate !== undefined ? couponDiscountRuleLabel(couponDraft.discountRate) : '填写折扣规则后'}
              预计抵扣 {money(selectedCouponTemplate && couponDraft.discountRate !== undefined ? calculateCouponIssuePreviewDiscount(couponDraft) : 0)}
              {couponDraft.benefitType === 'coupon' ? '，优惠券不设余额，使用一次后失效。' : '，但累计抵扣不会超过总代金券额度。'}
            </p>
          </div>
        </div>
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminCouponDetailPage() {
  const navigate = useNavigate();
  const { couponId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CouponRecord[]>([]);
  const [usageRows, setUsageRows] = useState<CouponUsageRecord[]>([]);
  const [billingPeriod, setBillingPeriod] = useState('');
  const [changeType, setChangeType] = useState('all');

  const loadData = async () => {
    setLoading(true);
    const [couponData, usageData] = await Promise.all([mockApi.getAdminCoupons(), mockApi.getAdminCouponUsages()]);
    setRows(couponData);
    setUsageRows(usageData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const coupon = rows.find((item) => item.id === couponId);
  const couponUsages = usageRows.filter((item) => item.couponId === couponId);
  const changeTypeOptions = Array.from(new Set(couponUsages.flatMap((item) => item.changeType ? [item.changeType] : [])));
  const filteredUsages = couponUsages.filter((item) => {
    const matchesPeriod = !billingPeriod || item.billingPeriod === billingPeriod;
    const matchesType = changeType === 'all' || item.changeType === changeType;
    return matchesPeriod && matchesType;
  });

  if (loading) {
    return <Spin className="page-spin" tip="加载券详情" />;
  }

  if (!coupon) {
    return (
      <Card bordered className="voucher-empty-card">
        <Space direction="vertical" size={16} align="center" className="full-width">
          <Empty description="未找到该券" />
          <Button type="primary" onClick={() => navigate(adminConsolePath(location.pathname, '/coupons'))}>返回代金券与优惠券</Button>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-title-row">
        <div className="voucher-detail-title">
          <Button type="text" icon={<IconLeft />} onClick={() => navigate(adminConsolePath(location.pathname, '/coupons'))} />
          <Title heading={3}>券详情（{coupon.name} - {coupon.id}）</Title>
          <Tag color={isDiscountCoupon(coupon) ? 'purple' : 'arcoblue'}>{couponBenefitTypeLabel(coupon)}</Tag>
          <MetaTag {...couponStatusMeta[coupon.status]} />
        </div>
      </div>

      <div className="voucher-detail-card">
        <div className="voucher-detail-hero">
          <Space direction="vertical" size={12} className="full-width">
            <Space wrap>
              <Tag color="orangered">{coupon.thresholdRule ?? '满 ¥0.00 可用'}</Tag>
            </Space>
            <div className="voucher-detail-balance">
              <div className="voucher-detail-balance__amount">
                <span>{isDiscountCoupon(coupon) ? '使用状态' : '代金券余额'}</span>
                <strong>{isDiscountCoupon(coupon) ? couponUsedLabel(coupon) : money(coupon.remainingDiscountQuota)}</strong>
              </div>
              <span className="voucher-detail-balance__period">有效期（UTC+8） {coupon.effectiveAt} - {coupon.expiresAt}</span>
            </div>
          </Space>
        </div>
        <div className="voucher-detail-summary">
          <Descriptions
            column={3}
            data={[
              { label: '券类型', value: couponBenefitTypeLabel(coupon) },
              { label: '企业', value: coupon.tenantName },
              { label: '总额度', value: couponQuotaLabel(coupon) },
              { label: '规则', value: couponDiscountRuleLabel(coupon.discountRate) },
              { label: '已用', value: couponUsedLabel(coupon) },
              { label: '发放人', value: coupon.issuedBy },
              { label: '发放时间', value: coupon.issuedAt },
              { label: '备注', value: coupon.remark || '-' },
            ]}
          />
        </div>
      </div>

      <div className="voucher-record-section">
        <div className="voucher-record-title-row">
          <span className="tenant-data-panel__title">使用记录</span>
        </div>
        <div className="voucher-record-toolbar">
          <DatePicker.MonthPicker value={billingPeriod} onChange={setBillingPeriod} className="voucher-status-select" placeholder="账务账期" />
          <Select value={changeType} onChange={setChangeType} className="voucher-status-select">
            <Select.Option value="all">全部变动类型</Select.Option>
            {changeTypeOptions.map((item) => (
              <Select.Option key={item} value={item}>{item}</Select.Option>
            ))}
          </Select>
        </div>
        <div className="tenant-data-panel">
          <Table
            rowKey="id"
            data={filteredUsages}
            pagination={{ pageSize: 8, showTotal: true }}
            noDataElement={<Empty description="暂无券使用记录" />}
            columns={[
              { title: '时间', dataIndex: 'usedAt' },
              { title: '使用账号', dataIndex: 'accountId', render: (value?: string) => value || '-' },
              { title: '订单号/账单明细号', render: (_: unknown, row: CouponUsageRecord) => row.billDetailNo || row.orderId },
              { title: '账务账期', dataIndex: 'billingPeriod', render: (value?: string) => value || '-' },
              { title: '产品', dataIndex: 'productName', render: (value?: string) => value || '-' },
              { title: '变动类型', dataIndex: 'changeType', render: (value?: string) => value || '-' },
              { title: '订单原价', dataIndex: 'originalAmount', render: (value: number) => money(value) },
              { title: '抵扣金额', dataIndex: 'discountAmount', render: (value: number) => `-${money(value)}` },
              { title: '实付金额', dataIndex: 'payableAmount', render: (value: number) => money(value) },
              { title: '状态', dataIndex: 'status', render: (value: CouponUsageRecord['status']) => <MetaTag color={value === 'confirmed' ? 'green' : value === 'reserved' ? 'orange' : 'gray'} text={value === 'confirmed' ? '已抵扣' : value === 'reserved' ? '预占' : '已释放'} /> },
            ]}
          />
        </div>
      </div>
    </Space>
  );
}

export function AdminNewsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminNewsRecord[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getAdminNews());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="资讯管理" description="资讯草稿、审核、发布和统计" action={<Button type="primary" icon={<IconPlus />} onClick={() => navigate('/admin/news/create')}>新建资讯</Button>}>
      <Card bordered>
        <Table rowKey="id" pagination={false} data={rows} columns={[
          { title: '标题', dataIndex: 'title', render: (value: string, row: AdminNewsRecord) => <Button type="text" size="mini" onClick={() => navigate(`/admin/news/${row.id}/edit`)}>{value}</Button> },
          { title: '分类', dataIndex: 'category', render: (value: string) => <Tag>{value}</Tag> },
          { title: '标签', dataIndex: 'tags', render: (value: string[]) => value.join(' / ') },
          { title: '状态', dataIndex: 'status', render: (value: AdminNewsStatus) => <MetaTag {...newsStatusMeta[value]} /> },
          { title: '发布时间', dataIndex: 'publishedAt', render: (value?: string) => value || '-' },
          { title: '定时发布时间', dataIndex: 'scheduledAt', render: (value?: string) => value || '-' },
          { title: '阅读数', dataIndex: 'views' },
          { title: '作者', dataIndex: 'author' },
          { title: '更新时间', dataIndex: 'updatedAt' },
          {
            title: '操作',
            render: (_: unknown, row: AdminNewsRecord) => (
              <Space size={8}>
                <Button type="text" size="mini" onClick={() => navigate(`/admin/news/${row.id}/edit`)}>编辑</Button>
                <Button type="text" size="mini" disabled={row.status === 'published'} onClick={async () => { await mockApi.approveAdminNews(row.id); Message.success('资讯已发布'); loadData(); }}>发布</Button>
                <Button type="text" size="mini" disabled={row.status !== 'published'} onClick={async () => { await mockApi.offlineAdminNews(row.id); Message.success('资讯已下架'); loadData(); }}>下架</Button>
              </Space>
            ),
          },
        ]} />
      </Card>
    </AdminPageShell>
  );
}

export function AdminNewsEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [stats, setStats] = useState<any>();
  const [draft, setDraft] = useState({
    title: '',
    category: '产品动态' as AdminNewsRecord['category'],
    tags: '',
    summary: '',
    cover: '',
    content: '',
    scheduledAt: '',
    publishMode: 'draft' as 'draft' | 'reviewing' | 'published',
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([mockApi.getAdminNewsDetail(id), mockApi.getAdminNewsStats(id)]).then(([detail, stat]) => {
      if (detail) {
        setDraft({
          title: detail.title,
          category: detail.category,
          tags: detail.tags.join('、'),
          summary: detail.summary,
          cover: detail.cover || '',
          content: detail.content,
          scheduledAt: detail.scheduledAt || '',
          publishMode: detail.status === 'published' ? 'published' : detail.status === 'reviewing' ? 'reviewing' : 'draft',
        });
      }
      setStats(stat);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <Spin className="page-spin" tip="加载资讯编辑器" />;
  }

  return (
    <div className="sales-detail-screen">
      <DetailHeader
        title={isEdit ? '编辑资讯' : '新建资讯'}
        subtitle="支持草稿、提审和直接发布三种提交模式"
        onBack={() => navigate('/admin/news')}
      />

      {isEdit && stats ? (
        <Card bordered className="sales-detail-summary">
          <div className="sales-info-grid">
            <div><span>浏览数</span><strong>{stats.views}</strong></div>
            <div><span>点赞数</span><strong>{stats.likes}</strong></div>
            <div><span>关联咨询数</span><strong>{stats.consults}</strong></div>
          </div>
        </Card>
      ) : null}

      <div className="sales-detail-layout">
        <section className="sales-detail-section">
          <div className="sales-detail-section__title">基础信息</div>
          <div className="sales-form-grid">
            <label><span>标题</span><Input value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} /></label>
            <label><span>分类</span><Select value={draft.category} onChange={(value) => setDraft((current) => ({ ...current, category: value }))}><Select.Option value="产品动态">产品动态</Select.Option><Select.Option value="行业资讯">行业资讯</Select.Option><Select.Option value="最佳实践">最佳实践</Select.Option></Select></label>
            <label><span>标签</span><Input value={draft.tags} onChange={(value) => setDraft((current) => ({ ...current, tags: value }))} placeholder="多个标签用 、 分隔" /></label>
            <label><span>封面图</span><Input value={draft.cover} onChange={(value) => setDraft((current) => ({ ...current, cover: value }))} placeholder="mock 文件名" /></label>
            <label className="sales-form-grid--single"><span>摘要</span><Input.TextArea rows={3} value={draft.summary} onChange={(value) => setDraft((current) => ({ ...current, summary: value }))} /></label>
            <label><span>定时发布时间</span><Input value={draft.scheduledAt} onChange={(value) => setDraft((current) => ({ ...current, scheduledAt: value }))} placeholder="可选" /></label>
            <label><span>提交模式</span><Select value={draft.publishMode} onChange={(value) => setDraft((current) => ({ ...current, publishMode: value }))}><Select.Option value="draft">草稿</Select.Option><Select.Option value="reviewing">提交审核</Select.Option><Select.Option value="published">立即发布</Select.Option></Select></label>
          </div>
        </section>

        <section className="sales-detail-section">
          <div className="sales-detail-section__title">正文</div>
          <Input.TextArea rows={18} value={draft.content} onChange={(value) => setDraft((current) => ({ ...current, content: value }))} placeholder="富文本编辑器 mock：支持图片、代码块、表格等内容的文本录入" />
        </section>
      </div>

      <div className="sales-detail-footer">
        <Space>
          <Button onClick={() => navigate('/admin/news')}>取消</Button>
          <Button onClick={() => Message.info('预览为后续补充能力')}>预览</Button>
          <Button type="primary" onClick={async () => {
            if (!draft.title || !draft.summary || !draft.content) {
              Message.error('请完整填写资讯内容');
              return;
            }
            const payload = {
              title: draft.title,
              category: draft.category,
              tags: draft.tags.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
              summary: draft.summary,
              cover: draft.cover,
              content: draft.content,
              scheduledAt: draft.scheduledAt || undefined,
              publishMode: draft.publishMode,
            };
            if (isEdit && id) {
              await mockApi.updateAdminNews(id, {
                title: payload.title,
                category: payload.category,
                tags: payload.tags,
                summary: payload.summary,
                cover: payload.cover,
                content: payload.content,
                scheduledAt: payload.scheduledAt,
                status: payload.publishMode,
              });
              Message.success('资讯已更新');
            } else {
              await mockApi.createAdminNews(payload as any);
              Message.success('资讯已创建');
            }
            navigate('/admin/news');
          }}>保存</Button>
        </Space>
      </div>
    </div>
  );
}

export function AdminLeadsPage() {
  const [rows, setRows] = useState<AdminLeadRecord[]>([]);
  const [funnel, setFunnel] = useState<any>();
  const [assignModal, setAssignModal] = useState<{ visible: boolean; ids: string[]; salesName: string }>({ visible: false, ids: [], salesName: '陈默' });
  const [activeLead, setActiveLead] = useState<AdminLeadRecord>();

  const loadData = async () => {
    const [leadRows, funnelData] = await Promise.all([mockApi.getAdminLeads(), mockApi.getAdminLeadFunnel()]);
    setRows(leadRows);
    setFunnel(funnelData);
    setActiveLead((current) => current ? leadRows.find((item) => item.id === current.id) : undefined);
  };

	  useEffect(() => {
	    loadData();
	  }, []);

  const leadProgressItems = (lead: AdminLeadRecord) => [
    { key: 'created', time: lead.createdAt, title: '提交商机', detail: `${lead.source} · ${lead.company}` },
    lead.assignedAt ? { key: 'assigned', time: lead.assignedAt, title: '分配销售', detail: lead.assignedSales ? `已分配给 ${lead.assignedSales}` : '已分配' } : undefined,
    lead.claimedAt ? { key: 'claimed', time: lead.claimedAt, title: '销售认领', detail: lead.assignedSales ? `${lead.assignedSales} 已认领` : '销售已认领' } : undefined,
    lead.lastFollowupAt ? { key: 'followup', time: lead.lastFollowupAt, title: '最近跟进', detail: lead.latestFollowupSummary || '已记录跟进' } : undefined,
    lead.convertedAt ? { key: 'converted', time: lead.convertedAt, title: '转为客户', detail: lead.convertedTenantId ? `客户 ID：${lead.convertedTenantId}` : '已转入客户池' } : undefined,
    lead.closedAt ? { key: 'closed', time: lead.closedAt, title: '关闭商机', detail: lead.closeReason || '已关闭' } : undefined,
  ].filter(Boolean) as Array<{ key: string; time: string; title: string; detail: string }>;
  const canAssignLead = (lead: AdminLeadRecord) =>
    lead.opportunityType === 'external_consult' && lead.status !== 'converted' && lead.status !== 'closed';

  return (
    <AdminPageShell title="咨询留资管理" description="统一查看官网、活动页和资讯页进入后台的外部留资，不包含存量客户咨询。">
      <StatStrip items={[
        { label: '未分配', value: String(funnel?.newCount ?? 0), tone: 'danger' },
        { label: '已分配', value: String(funnel?.assignedCount ?? 0), tone: 'warn' },
        { label: '已认领/跟进', value: String(funnel?.claimedCount ?? 0), tone: 'good' },
        { label: '已转客户', value: String(funnel?.convertedCount ?? 0), tone: 'good' },
        { label: '转化率', value: `${funnel?.conversionRate ?? 0}%`, tone: 'good' },
      ]} />

      <AdminTablePanel>
        <Table
          rowKey="id"
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '咨询时间', dataIndex: 'createdAt' },
            { title: '企业名', dataIndex: 'company' },
            { title: '联系人', dataIndex: 'contact' },
            { title: '电话', dataIndex: 'phone' },
            { title: '需求摘要', dataIndex: 'requirement', render: (value: string) => <Tooltip content={value}><span className="sales-ellipsis">{value}</span></Tooltip> },
            { title: '状态', render: (_: unknown, row: AdminLeadRecord) => <MetaTag {...adminLeadStatusMeta(row)} /> },
            { title: '跟进时限倒计时', render: (_: unknown, row: AdminLeadRecord) => formatAdminLeadSla(row) },
            { title: '分配销售', dataIndex: 'assignedSales', render: (value?: string) => value || '-' },
            {
              title: '操作',
              render: (_: unknown, row: AdminLeadRecord) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => setActiveLead(row)}>详情</Button>
                  {canAssignLead(row) ? (
                    <Button type="text" size="mini" onClick={() => setAssignModal({ visible: true, ids: [row.id], salesName: row.assignedSales || '陈默' })}>
                      {row.assignedSales ? '修改分配' : '分配'}
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </AdminTablePanel>

      <Modal title={assignModal.ids.length === 1 && rows.find((item) => item.id === assignModal.ids[0])?.assignedSales ? '修改分配销售' : '分配销售'} visible={assignModal.visible} onCancel={() => setAssignModal({ visible: false, ids: [], salesName: '陈默' })} onOk={async () => { if (!assignModal.ids.length) return; await mockApi.assignAdminLead(assignModal.ids[0], assignModal.salesName); Message.success('留资分配已更新'); setAssignModal({ visible: false, ids: [], salesName: '陈默' }); loadData(); }}>
        <Select value={assignModal.salesName} onChange={(value) => setAssignModal((current) => ({ ...current, salesName: value }))} className="full-width">
          <Select.Option value="陈默">陈默</Select.Option>
          <Select.Option value="林嘉">林嘉</Select.Option>
          <Select.Option value="许宁">许宁</Select.Option>
        </Select>
      </Modal>

      <Drawer width={680} title={activeLead ? `${activeLead.company} · 商机详情` : '商机详情'} visible={Boolean(activeLead)} onCancel={() => setActiveLead(undefined)}>
        {activeLead ? (
          <Space direction="vertical" size={18} className="full-width">
            <div className="sales-lead-detail-head">
              <div>
                <Title heading={5}>{activeLead.company}</Title>
                <Text type="secondary">{activeLead.source} · {activeLead.createdAt}</Text>
              </div>
              <MetaTag {...adminLeadStatusMeta(activeLead)} />
            </div>
            <div className="sales-info-grid sales-info-grid--two">
              <div><span>联系人</span><strong>{activeLead.contact} / {activeLead.title}</strong></div>
              <div><span>电话</span><strong>{activeLead.phone}</strong></div>
              <div><span>邮箱</span><strong>{activeLead.email}</strong></div>
              <div><span>分配销售</span><strong>{activeLead.assignedSales || '未分配'}</strong></div>
              <div><span>跟进时限</span><strong>{formatAdminLeadSla(activeLead)}</strong></div>
              <div><span>客户 ID</span><strong>{activeLead.convertedTenantId || '-'}</strong></div>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">客户需求</div>
              <Text>{activeLead.requirement}</Text>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">进展记录</div>
              <Timeline className="sales-timeline">
                {leadProgressItems(activeLead).map((item) => (
                  <Timeline.Item key={item.key} label={item.time}>
                    <div className="sales-followup-item">
                      <div className="sales-followup-item__head">
                        <Tag>{item.title}</Tag>
                      </div>
                      <div>{item.detail}</div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
            <Space>
              {canAssignLead(activeLead) ? (
                <Button type="primary" onClick={() => setAssignModal({ visible: true, ids: [activeLead.id], salesName: activeLead.assignedSales || '陈默' })}>
                  {activeLead.assignedSales ? '修改分配' : '分配销售'}
                </Button>
              ) : null}
            </Space>
          </Space>
        ) : null}
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminSystemRolesPage() {
  const [rows, setRows] = useState<any[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getAdminRoleMatrix());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="角色权限矩阵" description="预置 R1 子角色权限点管理">
      <div className="admin-settings-stack">
        {rows.map((role) => (
          <Card key={role.role} title={`${role.role} · ${role.name}`} bordered>
            <div className="admin-permission-grid">
              {role.permissions.map((permission: any) => (
                <div className="sales-toggle-item" key={permission.key}>
                  <div>
                    <strong>{permission.label}</strong>
                    <Text type="secondary">{permission.key}</Text>
                  </div>
                  <Switch checked={permission.enabled} onChange={async (value) => { await mockApi.updateAdminRolePermission(role.role, permission.key, value); loadData(); }} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function AdminSystemDictionariesPage() {
  const [rows, setRows] = useState<AdminDictionaryRecord[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeCode, setActiveCode] = useState('');
  const [draft, setDraft] = useState({ label: '', value: '' });

  const loadData = async () => {
    setRows(await mockApi.getAdminDictionaries());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="字典管理" description="行业、商机关闭原因等字典配置">
      <div className="admin-settings-stack">
        {rows.map((dictionary) => (
          <Card
            key={dictionary.code}
            title={dictionary.name}
            bordered
            extra={<Button type="text" size="mini" onClick={() => { setActiveCode(dictionary.code); setDraft({ label: '', value: '' }); setDrawerVisible(true); }}>新增项</Button>}
          >
            <Table rowKey="id" pagination={false} data={dictionary.items} columns={[
              { title: '标签', dataIndex: 'label' },
              { title: '值', dataIndex: 'value' },
              { title: '顺序', dataIndex: 'order' },
              { title: '启用', dataIndex: 'enabled', render: (value: boolean) => <MetaTag color={value ? 'green' : 'gray'} text={value ? '启用' : '停用'} /> },
              { title: '操作', render: (_: unknown, row: any) => <Button type="text" size="mini" onClick={async () => { await mockApi.toggleAdminDictionaryItem(dictionary.code, row.id); loadData(); }}>切换</Button> },
            ]} />
          </Card>
        ))}
      </div>

      <Drawer width={680} title="新增字典项" visible={drawerVisible} onCancel={() => setDrawerVisible(false)} footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={async () => { if (!activeCode || !draft.label || !draft.value) { Message.error('请填写字典项'); return; } await mockApi.addAdminDictionaryItem(activeCode, draft); Message.success('字典项已新增'); setDrawerVisible(false); loadData(); }}>保存</Button></Space>}>
        <div className="sales-form-grid sales-form-grid--single">
          <label><span>标签</span><Input value={draft.label} onChange={(value) => setDraft((current) => ({ ...current, label: value }))} /></label>
          <label><span>值</span><Input value={draft.value} onChange={(value) => setDraft((current) => ({ ...current, value: value }))} /></label>
        </div>
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminSystemNotifyTemplatesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<any>();

  const loadData = async () => {
    const data = await mockApi.getAdminNotifyTemplates();
    setRows(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="通知模板" description="邮件、短信、站内信模板和变量占位">
      <AdminTablePanel>
        <Table rowKey="id" pagination={false} data={rows} columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '触发场景', dataIndex: 'trigger' },
          { title: '渠道', dataIndex: 'channels', render: (value: string[]) => value.join(' / ') },
          { title: '启用', dataIndex: 'enabled', render: (value: boolean) => <MetaTag color={value ? 'green' : 'gray'} text={value ? '启用' : '停用'} /> },
          { title: '操作', render: (_: unknown, row: any) => <Button type="text" size="mini" onClick={() => { setDraft(row); setDrawerVisible(true); }}>编辑</Button> },
        ]} />
      </AdminTablePanel>

      <Drawer width={760} title="编辑通知模板" visible={drawerVisible} onCancel={() => setDrawerVisible(false)} footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={async () => { await mockApi.updateAdminNotifyTemplate(draft.id, draft); Message.success('模板已更新'); setDrawerVisible(false); loadData(); }}>保存</Button></Space>}>
        {draft ? (
          <div className="sales-form-grid sales-form-grid--single">
            <label><span>名称</span><Input value={draft.name} onChange={(value) => setDraft((current: any) => ({ ...current, name: value }))} /></label>
            <label><span>主题</span><Input value={draft.subject} onChange={(value) => setDraft((current: any) => ({ ...current, subject: value }))} /></label>
            <label><span>正文</span><Input.TextArea rows={8} value={draft.content} onChange={(value) => setDraft((current: any) => ({ ...current, content: value }))} /></label>
            <label><span>启用</span><Switch checked={draft.enabled} onChange={(value) => setDraft((current: any) => ({ ...current, enabled: value }))} /></label>
          </div>
        ) : null}
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminSystemParamsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<any>();

  const loadData = async () => {
    setRows(await mockApi.getAdminSystemParams());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="系统参数" description="关键阈值、处理时限和安全参数管理">
      <Card bordered>
        <Table rowKey="key" pagination={false} data={rows} columns={[
          { title: 'Key', dataIndex: 'key' },
          { title: '值', dataIndex: 'value' },
          { title: '类型', dataIndex: 'valueType' },
          { title: '说明', dataIndex: 'description' },
          { title: '更新时间', dataIndex: 'updatedAt' },
          { title: '操作', render: (_: unknown, row: any) => <Button type="text" size="mini" onClick={() => { setDraft(row); setDrawerVisible(true); }}>编辑</Button> },
        ]} />
      </Card>

      <Drawer width={640} title="编辑系统参数" visible={drawerVisible} onCancel={() => setDrawerVisible(false)} footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={async () => { await mockApi.updateAdminSystemParam(draft.key, draft.value); Message.success('参数已更新'); setDrawerVisible(false); loadData(); }}>保存</Button></Space>}>
        {draft ? (
          <div className="sales-form-grid sales-form-grid--single">
            <label><span>Key</span><Input value={draft.key} disabled /></label>
            <label><span>值</span><Input value={draft.value} onChange={(value) => setDraft((current: any) => ({ ...current, value }))} /></label>
            <label><span>说明</span><Input value={draft.description} disabled /></label>
          </div>
        ) : null}
      </Drawer>
    </AdminPageShell>
  );
}

export function AdminSystemAuditPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    mockApi.getAdminGlobalAudit().then(setRows);
  }, []);

  return (
    <AdminPageShell title="全局审计日志" description="所有写操作、越权拦截和高危动作留痕">
      <AdminTablePanel>
        <Table rowKey="id" pagination={{ pageSize: 8, showTotal: true }} data={rows} columns={[
          { title: '时间', dataIndex: 'createdAt' },
          { title: '操作者', render: (_: unknown, row: any) => `${row.actor} / ${row.role}` },
          { title: '动作', dataIndex: 'action' },
          { title: '目标类型', dataIndex: 'targetType' },
          { title: '目标 ID', dataIndex: 'targetId' },
          { title: '关联企业', dataIndex: 'tenantName', render: (value?: string) => value || '-' },
          { title: 'IP', dataIndex: 'ip' },
          { title: '结果', dataIndex: 'result', render: (value: string) => <MetaTag color={value === 'success' ? 'green' : 'red'} text={value === 'success' ? '成功' : '失败'} /> },
          { title: '原因', dataIndex: 'reason', render: (value?: string) => value || '-' },
        ]} />
      </AdminTablePanel>
    </AdminPageShell>
  );
}

export function AdminStaffPage() {
  const location = useLocation();
  const [rows, setRows] = useState<AdminStaffRecord[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<AdminStaffAccountDraft>(createEmptyStaffDraft());
  const [resetDraft, setResetDraft] = useState<AdminStaffPasswordResetDraft>({
    visible: false,
    password: '',
  });
  const [inheritanceDraft, setInheritanceDraft] = useState<AdminStaffInheritanceDraft>({
    visible: false,
    assignments: {},
    loading: false,
  });
  const [passwordResult, setPasswordResult] = useState<TemporaryPasswordResult | null>(null);
  const isAgentAdminView = location.pathname.startsWith('/agent/admin/staff');
  const visibleRoleCodes = isAgentAdminView
    ? (['R1.0', 'R1.1', 'R1.2', 'R3'] as AdminStaffRecord['roleCode'][])
    : undefined;
  const visibleBindings = visibleRoleCodes ? rows.filter((item) => visibleRoleCodes.includes(item.roleCode)) : rows;
  const visibleRows = useMemo<AdminStaffAccountRow[]>(() => {
    const grouped = new Map<string, AdminStaffRecord[]>();
    visibleBindings.forEach((item) => {
      const key = item.accountId || item.phone;
      grouped.set(key, [...(grouped.get(key) || []), item]);
    });
    return Array.from(grouped.values()).map((bindings) => {
      const primary = bindings.find((item) => item.defaultRole) || bindings[0];
      return { ...primary, bindings };
    });
  }, [visibleBindings]);
  const visibleRoleOptions = visibleRoleCodes
    ? adminStaffRoleOptions.filter((role) => visibleRoleCodes.includes(role.value))
    : adminStaffRoleOptions;
  const pageDescription = isAgentAdminView
    ? '手机号是后台登录账号，一个账号可绑定超级管理员、财务、销售等多个身份'
    : '手机号是后台登录账号，一个账号可绑定超级管理员、财务、交付管理员、交付运维、销售等多个身份';
  const openAccountEditor = (row: AdminStaffAccountRow) => {
    setDraft({
      ...row,
      bindings: row.bindings,
      roleCodes: row.bindings.map((binding) => binding.roleCode),
      defaultRoleCode: row.bindings.find((binding) => binding.defaultRole)?.roleCode || row.roleCode,
      initialPassword: '',
      commissionRuleId: row.bindings.some((binding) => binding.roleCode === 'R3') ? INTERNAL_SALES_COMMISSION_RULE_ID : '',
      baseCommissionRate: INTERNAL_SALES_COMMISSION_RATE,
    });
    setDrawerVisible(true);
  };

  const handleSaveAccount = async () => {
    if (!draft.employeeNo || !draft.name || !draft.phone || !draft.hiredAt || !draft.roleCodes.length || !draft.defaultRoleCode) {
      Message.error('请填写工号、姓名、手机号、入职日期、绑定身份和默认身份');
      return;
    }
    if (!draft.id && (!draft.initialPassword || draft.initialPassword.length < 8)) {
      Message.error('请设置至少 8 位初始密码');
      return;
    }
    const result = await mockApi.upsertAdminStaffAccount({
      accountId: draft.accountId,
      bindings: draft.bindings,
      employeeNo: draft.employeeNo,
      name: draft.name,
      email: draft.email || '',
      phone: draft.phone,
      hiredAt: draft.hiredAt,
      mfaEnabled: draft.mfaEnabled ?? true,
      roleCodes: draft.roleCodes,
      defaultRoleCode: draft.defaultRoleCode,
      status: draft.status,
      lastLoginAt: draft.lastLoginAt,
      temporaryPassword: !draft.id ? draft.initialPassword : undefined,
      salesCommissionRuleId: draft.roleCodes.includes('R3') ? INTERNAL_SALES_COMMISSION_RULE_ID : undefined,
      salesBaseCommissionRate: draft.roleCodes.includes('R3') ? INTERNAL_SALES_COMMISSION_RATE : undefined,
    });
    Message.success(draft.id ? '账号已更新' : '账号已创建');
    if (result.temporaryPassword) {
      setPasswordResult({
        title: '账号已创建',
        phone: draft.phone,
        roles: draft.roleCodes,
        password: result.temporaryPassword,
      });
    }
    setDrawerVisible(false);
    loadData();
  };

  const copyTemporaryPassword = async () => {
    if (!passwordResult) return;
    try {
      await navigator.clipboard.writeText(passwordResult.password);
      Message.success('临时密码已复制');
    } catch {
      Message.warning('当前浏览器不支持自动复制，请手动复制临时密码');
    }
  };

  const handleResetPassword = (row: AdminStaffAccountRow) => {
    setResetDraft({
      visible: true,
      row,
      password: '',
    });
  };

  const handleSubmitResetPassword = async () => {
    if (!resetDraft.row) return;
    if (resetDraft.password.length < 8) {
      Message.error('请设置至少 8 位重置密码');
      return;
    }
    const result = await mockApi.resetAdminStaffPassword(resetDraft.row.id, resetDraft.password);
    setPasswordResult({
      title: '密码已重置',
      phone: resetDraft.row.phone,
      roles: resetDraft.row.bindings.map((binding) => binding.roleCode),
      password: result.temporaryPassword,
    });
    setResetDraft((current) => ({ ...current, visible: false }));
  };

  const openInheritanceModal = (row: AdminStaffAccountRow) => {
    const inheritableBindings = row.bindings.filter((binding) => isStaffInheritanceRole(binding.roleCode));
    setInheritanceDraft({
      visible: true,
      row,
      assignments: Object.fromEntries(inheritableBindings.map((binding) => [binding.roleCode, ''])),
      loading: false,
    });
  };

  const closeInheritanceModal = () => {
    setInheritanceDraft({ visible: false, assignments: {}, loading: false });
  };

  const buildInheritanceAssignments = () => {
    if (!inheritanceDraft.row) return [];
    return inheritanceDraft.row.bindings.filter((binding) => isStaffInheritanceRole(binding.roleCode)).map((binding) => ({
      roleCode: binding.roleCode,
      successorStaffId: inheritanceDraft.assignments[binding.roleCode],
    }));
  };

  const handlePreviewInheritance = async () => {
    if (!inheritanceDraft.row) return;
    const assignments = buildInheritanceAssignments();
    if (assignments.some((item) => !item.successorStaffId)) {
      Message.error('请为每个身份选择接手人');
      return;
    }
    setInheritanceDraft((current) => ({ ...current, loading: true }));
    const preview = await mockApi.previewAdminStaffInheritance(inheritanceDraft.row.accountId || inheritanceDraft.row.phone, assignments);
    setInheritanceDraft((current) => ({ ...current, preview, loading: false }));
  };

  const handleExecuteInheritance = async () => {
    if (!inheritanceDraft.row || !inheritanceDraft.preview) return;
    setInheritanceDraft((current) => ({ ...current, loading: true }));
    await mockApi.executeAdminStaffInheritance({
      accountId: inheritanceDraft.row.accountId || inheritanceDraft.row.phone,
      assignments: buildInheritanceAssignments(),
    });
    Message.success('离职继承已完成');
    closeInheritanceModal();
    loadData();
  };

  const staffColumns = [
    { title: '工号', dataIndex: 'employeeNo' },
    { title: '姓名', dataIndex: 'name' },
    { title: '手机号账号', dataIndex: 'phone' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '绑定身份',
      render: (_: unknown, row: AdminStaffAccountRow) => (
        <Space size={6} wrap>
          {row.bindings.map((binding) => (
            <Tag key={binding.id} color={binding.defaultRole ? 'arcoblue' : 'gray'}>
              {roleLabel[binding.roleCode] || binding.roleCode}
              {binding.defaultRole ? ' · 默认' : ''}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', render: (value: string) => <MetaTag color={value === 'active' ? 'green' : value === 'frozen' ? 'orange' : 'gray'} text={value === 'active' ? '正常' : value === 'frozen' ? '冻结' : '离职'} /> },
    { title: '最近登录', dataIndex: 'lastLoginAt', render: (value?: string) => value || '-' },
    {
      title: '操作',
      render: (_: unknown, row: AdminStaffAccountRow) => (
        <Space size={8}>
          <Button type="text" size="mini" onClick={() => openAccountEditor(row)}>编辑</Button>
          <Button type="text" size="mini" onClick={() => handleResetPassword(row)}>重置密码</Button>
          {row.bindings.some((binding) => isStaffInheritanceRole(binding.roleCode)) ? (
            <Button type="text" size="mini" status="danger" disabled={row.status === 'left'} onClick={() => openInheritanceModal(row)}>离职继承</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const loadData = async () => {
    const staffData = await mockApi.getAdminStaff();
    setRows(staffData);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="内部员工账号" description={pageDescription} action={<Button type="primary" icon={<IconPlus />} onClick={() => { setDraft(createEmptyStaffDraft()); setDrawerVisible(true); }}>新增账号</Button>}>
      <AdminTablePanel>
        <Table rowKey="id" pagination={{ pageSize: 8, showTotal: true }} data={visibleRows} columns={staffColumns} />
      </AdminTablePanel>

      <Drawer width={760} title={draft?.id ? '编辑账号' : '新增账号'} visible={drawerVisible} onCancel={() => setDrawerVisible(false)} footer={<Space><Button onClick={() => setDrawerVisible(false)}>取消</Button><Button type="primary" onClick={handleSaveAccount}>保存</Button></Space>}>
        <div className="sales-form-grid sales-form-grid--single">
          <div className="sales-field">
            <span><i className="form-required">*</i>绑定身份</span>
            <Select
              mode="multiple"
              allowClear
              value={draft.roleCodes}
              onChange={(value) => {
                const roleCodes = (value || []) as AdminStaffRecord['roleCode'][];
                setDraft((current) => ({
                  ...current,
                  roleCodes,
                  defaultRoleCode: roleCodes.includes(current.defaultRoleCode as AdminStaffRecord['roleCode'])
                    ? current.defaultRoleCode
                    : roleCodes[0],
                  commissionRuleId: roleCodes.includes('R3') ? INTERNAL_SALES_COMMISSION_RULE_ID : '',
                  baseCommissionRate: roleCodes.includes('R3') ? INTERNAL_SALES_COMMISSION_RATE : undefined,
                }));
              }}
              placeholder="请选择一个或多个身份"
            >
              {visibleRoleOptions.map((role) => (
                <Select.Option key={role.value} value={role.value}>{role.label}</Select.Option>
              ))}
            </Select>
          </div>
          <div className="sales-field">
            <span><i className="form-required">*</i>默认身份</span>
            <Select
              value={draft.defaultRoleCode}
              onChange={(value) => setDraft((current) => ({ ...current, defaultRoleCode: value as AdminStaffRecord['roleCode'] }))}
              placeholder="请选择默认身份"
            >
              {draft.roleCodes.map((roleCode) => (
                <Select.Option key={roleCode} value={roleCode}>{roleLabel[roleCode] || roleCode}</Select.Option>
              ))}
            </Select>
          </div>
          {draft.defaultRoleCode ? (
            <Text className="sales-form-hint">
              {visibleRoleOptions.find((role) => role.value === draft.defaultRoleCode)?.description}
            </Text>
          ) : null}
          {draft.roleCodes.includes('R3') ? (
            <div className="sales-field">
              <span>销售佣金</span>
              <Text className="sales-form-hint">内部销售固定 5% 佣金</Text>
            </div>
          ) : null}
          <label><span><i className="form-required">*</i>工号</span><Input value={draft.employeeNo} onChange={(value) => setDraft((current) => ({ ...current, employeeNo: value }))} /></label>
          <label><span><i className="form-required">*</i>姓名</span><Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} /></label>
          <label><span>邮箱</span><Input value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} /></label>
          <label><span><i className="form-required">*</i>手机号账号</span><Input value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} /></label>
          <label>
            <span><i className="form-required">*</i>入职日期</span>
            <DatePicker
              value={draft.hiredAt || undefined}
              onChange={(value) => setDraft((current) => ({ ...current, hiredAt: value }))}
              style={{ width: '100%' }}
            />
          </label>
          {!draft.id ? (
            <label>
              <span><i className="form-required">*</i>初始密码</span>
              {renderPasswordInputWithGenerator(
                draft.initialPassword || '',
                (initialPassword) => setDraft((current) => ({ ...current, initialPassword })),
                '请输入至少 8 位初始密码',
              )}
            </label>
          ) : null}
        </div>
      </Drawer>
      <Modal
        title="重置密码"
        visible={resetDraft.visible}
        onCancel={() => setResetDraft((current) => ({ ...current, visible: false }))}
        footer={(
          <Space>
            <Button onClick={() => setResetDraft((current) => ({ ...current, visible: false }))}>取消</Button>
            <Button type="primary" onClick={handleSubmitResetPassword}>确认重置</Button>
          </Space>
        )}
      >
        <div className="admin-password-reset">
          {resetDraft.row ? (
            <div className="admin-password-reset__account">
              <div>
                <span>手机号账号</span>
                <strong>{resetDraft.row.phone}</strong>
              </div>
              <Space size={6} wrap>
                {resetDraft.row.bindings.map((binding) => (
                  <Tag key={binding.id}>{roleLabel[binding.roleCode] || binding.roleCode}</Tag>
                ))}
              </Space>
            </div>
          ) : null}
          {renderPasswordInputWithGenerator(
            resetDraft.password,
            (password) => setResetDraft((current) => ({ ...current, password })),
            '请输入至少 8 位新密码',
          )}
        </div>
      </Modal>
      <Modal
        title="离职继承"
        visible={inheritanceDraft.visible}
        onCancel={closeInheritanceModal}
        style={{ width: 760 }}
        footer={(
          <Space>
            <Button onClick={closeInheritanceModal}>取消</Button>
            {inheritanceDraft.preview ? (
              <Button type="primary" status="danger" loading={inheritanceDraft.loading} onClick={handleExecuteInheritance}>确认继承并标记离职</Button>
            ) : (
              <Button type="primary" loading={inheritanceDraft.loading} onClick={handlePreviewInheritance}>预览影响</Button>
            )}
          </Space>
        )}
      >
        {inheritanceDraft.row ? (
          <Space direction="vertical" size={18} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '离职账号', value: `${inheritanceDraft.row.name} / ${inheritanceDraft.row.phone}` },
                { label: '工号', value: inheritanceDraft.row.employeeNo },
                { label: '绑定身份', value: inheritanceDraft.row.bindings.map((binding) => roleLabel[binding.roleCode] || binding.roleCode).join('、') },
              ]}
            />
            <div className="sales-form-grid sales-form-grid--single">
              {inheritanceDraft.row.bindings.filter((binding) => isStaffInheritanceRole(binding.roleCode)).map((binding) => {
                const candidates = rows.filter((item) =>
                  item.roleCode === binding.roleCode &&
                  item.status === 'active' &&
                  (item.accountId || item.phone) !== (inheritanceDraft.row?.accountId || inheritanceDraft.row?.phone),
                );
                return (
                  <label key={binding.id}>
                    <span><i className="form-required">*</i>{roleLabel[binding.roleCode] || binding.roleCode} 接手人</span>
                    <Select
                      value={inheritanceDraft.assignments[binding.roleCode] || undefined}
                      placeholder={candidates.length ? '请选择同身份接手人' : '暂无可接手同事'}
                      disabled={!candidates.length}
                      onChange={(value) => setInheritanceDraft((current) => ({
                        ...current,
                        preview: undefined,
                        assignments: { ...current.assignments, [binding.roleCode]: value },
                      }))}
                    >
                      {candidates.map((candidate) => (
                        <Select.Option key={candidate.id} value={candidate.id}>{candidate.name} / {candidate.team || candidate.employeeNo}</Select.Option>
                      ))}
                    </Select>
                  </label>
                );
              })}
            </div>
            {inheritanceDraft.preview ? (
              <Card bordered title="影响预览">
                <Space direction="vertical" size={14} className="full-width">
                  {inheritanceDraft.preview.items.map((item) => (
                    <div key={item.fromStaffId} className="admin-inheritance-preview">
                      <div className="admin-inheritance-preview__head">
                        <strong>{roleLabel[item.roleCode] || item.roleCode}</strong>
                        <Text type="secondary">{item.fromName} → {item.successorName || '-'}</Text>
                      </div>
                      <Table
                        rowKey="type"
                        pagination={false}
                        data={item.affected}
                        columns={[
                          { title: '对象', dataIndex: 'label' },
                          { title: '数量', dataIndex: 'count', width: 90 },
                          { title: '示例', dataIndex: 'examples', render: (examples: string[]) => examples.length ? examples.join('、') : '暂无个人负责人字段' },
                        ]}
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            ) : (
              <Text type="secondary">超级管理员身份不参与继承。选择接手人后点击“预览影响”，确认无误再执行离职继承。</Text>
            )}
          </Space>
        ) : null}
      </Modal>
      <Modal
        title={passwordResult?.title ?? '临时密码'}
        visible={Boolean(passwordResult)}
        onCancel={() => setPasswordResult(null)}
        footer={<Space><Button onClick={() => setPasswordResult(null)}>关闭</Button><Button type="primary" onClick={copyTemporaryPassword}>复制临时密码</Button></Space>}
      >
        {passwordResult ? (
          <div className="admin-temp-password">
            <div className="admin-temp-password__row">
              <span>手机号账号</span>
              <strong>{passwordResult.phone}</strong>
            </div>
            <div className="admin-temp-password__row">
              <span>绑定身份</span>
              <Space size={6} wrap>
                {passwordResult.roles.map((roleCode) => (
                  <Tag key={roleCode}>{roleLabel[roleCode] || roleCode}</Tag>
                ))}
              </Space>
            </div>
            <div className="admin-temp-password__value">{passwordResult.password}</div>
            <Text type="secondary">临时密码只展示一次，请复制后交给账号使用人并提醒首次登录后修改。</Text>
          </div>
        ) : null}
      </Modal>
    </AdminPageShell>
  );
}

export function AdminMonitoringPage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<any[]>([]);
  const [apiTrend, setApiTrend] = useState<any[]>([]);
  const [volcTrend, setVolcTrend] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      mockApi.getAdminMonitoringHealth(),
      mockApi.getAdminMonitoringApiStats(),
      mockApi.getAdminMonitoringVolcApiStats(),
    ]).then(([healthRows, apiRows, volcRows]) => {
      setHealth(healthRows);
      setApiTrend(apiRows);
      setVolcTrend(volcRows);
    });
  }, []);

  return (
    <AdminPageShell title="系统监控与告警" description="平台健康、API 健康和火山 API 健康总览" action={<Button onClick={() => navigate('/admin/monitoring/alerts')}>告警规则</Button>}>
      <StatStrip items={health.map((item) => ({ label: item.label, value: item.value, tone: item.status === 'good' ? 'good' : item.status === 'warn' ? 'warn' : 'danger' }))} />
      <Row gutter={16}>
        <Col span={12}>
          <Card title="平台 API 健康" bordered>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={apiTrend}>
                  <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="qps" stroke="#165DFF" strokeWidth={2} />
                  <Line type="monotone" dataKey="p95" stroke="#14C9C9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="火山 API 健康" bordered>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={volcTrend}>
                  <CartesianGrid stroke="#edf0f5" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="successRate" stroke="#00A870" strokeWidth={2} />
                  <Line type="monotone" dataKey="p95" stroke="#F7BA1E" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </AdminPageShell>
  );
}

export function AdminMonitoringAlertsPage() {
  const [rows, setRows] = useState<AdminAlertRule[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getAdminAlertRules());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageShell title="告警规则" description="平台、火山 API、订单和登录类告警阈值">
      <Card bordered>
        <Table rowKey="id" pagination={false} data={rows} columns={[
          { title: '规则', dataIndex: 'name' },
          { title: '阈值', dataIndex: 'threshold' },
          { title: '级别', dataIndex: 'level', render: (value: string) => <MetaTag color={value === 'P1' ? 'red' : value === 'P2' ? 'orange' : 'arcoblue'} text={value} /> },
          { title: '通知渠道', dataIndex: 'channels', render: (value: string[]) => value.join(' / ') },
          { title: '启用', dataIndex: 'enabled', render: (value: boolean, row: AdminAlertRule) => <Switch checked={value} onChange={async (next) => { await mockApi.updateAdminAlertRule(row.id, { enabled: next }); loadData(); }} /> },
        ]} />
      </Card>
    </AdminPageShell>
  );
}
