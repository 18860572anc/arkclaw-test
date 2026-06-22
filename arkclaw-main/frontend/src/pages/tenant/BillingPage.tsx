import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import dayjs from 'dayjs';
import { IconDownload, IconRefresh } from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import MetricCard from '../../components/MetricCard';
import OpeningProgressPanel, { normalizeOpeningProgressStatus } from '../../components/OpeningProgressPanel';
import { mockApi } from '../../services/mockApi';
import { couponBenefitTypeLabel, isVoucherCoupon } from '../../utils/couponDisplay';
import { orderBundleDetailLines, orderSummaryLabel } from '../../utils/orderDisplay';
import type { BillingData, BillingOrder, CouponDiscountScope, CouponRecord, OrderAmountBreakdown, OrderBundleLine, TenantWalletLedgerRecord, TenantWalletLedgerType, TenantWalletPaymentMethod } from '../../types/domain';
import type { BillingInvoiceDraft, BillingInvoiceRecord } from '../../types/domain';
import type { PurchaseDraft } from './PurchasePage';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
type PaymentMode = 'scan' | 'bank_transfer';
type ScanChannel = 'wechat' | 'alipay';
const PURCHASE_DRAFT_STORAGE_KEY = 'arkclaw_purchase_draft';
const TENANT_COUPON_FEATURE_ENABLED = false;
const TENANT_WALLET_MIN_TOPUP = 100;
const MOCK_NOW = dayjs('2026-05-15 10:00');
const tenantTopupAmountOptions = [100, 500, 1000, 5000] as const;
type TenantTopupAmountMode = (typeof tenantTopupAmountOptions)[number] | 'custom';
type TenantTopupStep = 'amount' | 'payment';
type TenantWalletLedgerQuery = {
  dateFrom?: string;
  dateTo?: string;
  types?: TenantWalletLedgerType[];
  minAmount?: number;
  maxAmount?: number;
};

const statusMap = {
  pending: ['orange', '待支付'],
  pending_review: ['arcoblue', '对公审核中'],
  paid: ['green', '已支付'],
  refunded: ['gray', '已取消'],
  cancelled: ['gray', '已取消'],
} as const;

const methodMap = {
  wechat: '微信扫码',
  alipay: '支付宝扫码',
  bank_transfer: '对公转账',
};

const tenantWalletLedgerTypeMeta: Record<TenantWalletLedgerType, { color: string; text: string }> = {
  topup: { color: 'arcoblue', text: '钱包充值' },
};

const downloadTextFile = (fileName: string, content: string, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const scanChannelMap: Record<ScanChannel, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
};
const couponRuleLabel = (discountRate: number) => (discountRate === 0 ? '100% 抵扣' : `${discountRate}% 折扣`);
const couponDiscountScopeLabel = (scope: CouponDiscountScope = 'order') =>
  scope === 'seat' ? '席位' : scope === 'coding_plan' ? 'CodingPlan' : '整单';
const paymentDeadlineText = (order: Pick<BillingOrder, 'status' | 'paymentExpiresAt' | 'paymentExpiredAt'>) => {
  if (order.status === 'cancelled' && order.paymentExpiredAt) return '支付超时取消';
  if (order.status !== 'pending' || !order.paymentExpiresAt) return '-';
  const minutes = dayjs(order.paymentExpiresAt).diff(MOCK_NOW, 'minute');
  if (minutes <= 0) return '已超时';
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${order.paymentExpiresAt}（剩余 ${hours}小时${restMinutes ? `${restMinutes}分钟` : ''}）`;
};
const priceAdjustmentText = (order: Pick<BillingOrder, 'priceAdjustment'>) => {
  const adjustment = order.priceAdjustment;
  if (!adjustment) return '-';
  const deltaText = `${adjustment.deltaAmount > 0 ? '+' : adjustment.deltaAmount < 0 ? '-' : ''}${money(Math.abs(adjustment.deltaAmount))}`;
  return `${money(adjustment.beforeAmount)} → ${money(adjustment.afterAmount)}（${deltaText}）`;
};
const priceAdjustmentDetailText = (order: Pick<BillingOrder, 'priceAdjustment'>) => {
  const adjustment = order.priceAdjustment;
  if (!adjustment) return '-';
  return `${priceAdjustmentText(order)}；${adjustment.adjustedAt}；原因：${adjustment.reason}`;
};

const codingPlanPriceMap: Record<string, number> = {
  'CodingPlan Team Lite': 120,
  'CodingPlan Team Pro': 600,
};

const buildBundleLinesFromDraft = (purchaseDraft?: PurchaseDraft): OrderBundleLine[] | undefined => {
  if (!purchaseDraft) return undefined;
  return purchaseDraft.lines.flatMap((line, index) => {
    const lineAmount = line.amount ?? 0;
    const codingAmount = line.bindCodingPlan && line.codingPlanName
      ? Math.min(lineAmount, (codingPlanPriceMap[line.codingPlanName] ?? 0) * purchaseDraft.cycleMonths * line.count)
      : 0;
    const seatAmount = Math.max(lineAmount - codingAmount, 0);
    const seatLine: OrderBundleLine = {
      id: `billing-seat-${index}`,
      productType: 'seat',
      productName: line.plan,
      quantity: line.count,
      unit: '席',
      amount: seatAmount,
      specLabel: line.action,
      cycleMonths: purchaseDraft.cycleMonths,
    };
    if (!line.bindCodingPlan || !line.codingPlanName) return [seatLine];
    return [
      seatLine,
      {
        id: `billing-code-${index}`,
        productType: 'coding_plan',
        productName: line.codingPlanName,
        quantity: line.count,
        unit: '份',
        amount: codingAmount,
        specLabel: line.action,
        cycleMonths: purchaseDraft.cycleMonths,
      },
    ];
  });
};

const typeMap = {
  seat_sub: '席位订阅',
};

const invoiceStatusMap = {
  pending: ['orange', '待开票'],
  issued: ['green', '已开票'],
  rejected: ['red', '已驳回'],
} as const;

const invoiceEmptyStatus = ['gray', '未申请'] as const;

const money = (value: number) => `¥${value.toLocaleString()}`;

const reviewStatusMap = {
  pending_delivery_review: ['orange', '待交付审核'],
  pending_finance_review: ['arcoblue', '待财务审核'],
  approved: ['green', '已通过'],
  rejected: ['red', '已驳回'],
} as const;

const openingStatusMap = {
  pending_assign: ['purple', '交付处理中'],
  pending_handle: ['purple', '交付处理中'],
  purchasing: ['purple', '交付处理中'],
  waiting_confirm: ['purple', '交付处理中'],
  completed: ['green', '已开通'],
  failed: ['purple', '交付处理中'],
  cancelled: ['gray', '已取消'],
} as const;

export default function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [storedPurchaseDraft, setStoredPurchaseDraft] = useState<PurchaseDraft>();
  const statePurchaseDraft = (location.state as { purchaseDraft?: PurchaseDraft } | null)?.purchaseDraft;
  const checkoutMode = new URLSearchParams(location.search).get('checkout') === '1';
  const purchaseDraft = statePurchaseDraft ?? (checkoutMode ? storedPurchaseDraft : undefined);
  const [data, setData] = useState<BillingData>();
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupStep, setTopupStep] = useState<TenantTopupStep>('amount');
  const [topupAmountMode, setTopupAmountMode] = useState<TenantTopupAmountMode>(100);
  const [topupAmount, setTopupAmount] = useState<number>(100);
  const [customTopupAmount, setCustomTopupAmount] = useState<number | undefined>();
  const [topupPaymentMethod, setTopupPaymentMethod] = useState<TenantWalletPaymentMethod>('wechat');
  const [topupProofFileName, setTopupProofFileName] = useState('');
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [walletLedgerVisible, setWalletLedgerVisible] = useState(false);
  const [walletLedgerRows, setWalletLedgerRows] = useState<TenantWalletLedgerRecord[]>([]);
  const [walletLedgerQuery, setWalletLedgerQuery] = useState<TenantWalletLedgerQuery>({});
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('scan');
  const [scanChannel, setScanChannel] = useState<ScanChannel>('wechat');
  const [draftOrder, setDraftOrder] = useState<{ orderId: string; amount: number }>();
  const [electronicOrder, setElectronicOrder] = useState<{
    orderId: string;
    amount: number;
    paymentMethod: 'wechat' | 'alipay';
    qrCodeLabel: string;
  }>();
  const [proofName, setProofName] = useState('bank-transfer-proof.png');
  const [uploadedAmount, setUploadedAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [skipCoupon, setSkipCoupon] = useState(false);
  const [amountBreakdown, setAmountBreakdown] = useState<OrderAmountBreakdown>();
  const [activeOrder, setActiveOrder] = useState<BillingOrder>();
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<BillingInvoiceRecord>();
  const [invoiceDraft, setInvoiceDraft] = useState<BillingInvoiceDraft>({
    orderId: '',
    title: '云岭制造有限公司',
    taxNo: '91310115MA1K000001',
    receiverEmail: 'finance@yling.com',
  });
  const checkoutBundleLines = useMemo(() => buildBundleLinesFromDraft(purchaseDraft), [purchaseDraft]);
  const currentPlan = purchaseDraft
    ? {
        orderType: purchaseDraft.orderType,
        amount: purchaseDraft.amount,
        hint: `已选择 ${purchaseDraft.seats} 个席位，周期 ${purchaseDraft.cycleMonths} 个月。支付确认后进入企业开通流程。`,
      }
    : undefined;
  const selectedCoupon = useMemo<CouponRecord | undefined>(
    () => TENANT_COUPON_FEATURE_ENABLED
      ? data?.availableCoupons?.find((item) => item.id === amountBreakdown?.couponId)
      : undefined,
    [amountBreakdown?.couponId, data?.availableCoupons],
  );
  const payableAmount = TENANT_COUPON_FEATURE_ENABLED ? amountBreakdown?.payableAmount ?? currentPlan?.amount ?? 0 : currentPlan?.amount ?? 0;
  const discountAmount = TENANT_COUPON_FEATURE_ENABLED ? amountBreakdown?.couponDiscountAmount ?? 0 : 0;
  const loadBilling = async () => {
    const nextData = await mockApi.getBilling();
    setData(nextData);
    return nextData;
  };
  const loadWalletLedger = async () => {
    const rows = await mockApi.getTenantWalletLedger();
    setWalletLedgerRows(rows);
  };
  const openWalletLedger = async () => {
    await loadWalletLedger();
    setWalletLedgerVisible(true);
  };
  const effectiveTopupAmount = topupAmountMode === 'custom' ? Number(customTopupAmount) || 0 : topupAmount;
  const topupPaymentCodeLabel = `${topupPaymentMethod === 'alipay' ? '支付宝' : '微信'}充值付款码 TENANT-TOPUP-${dayjs().format('YYYYMMDD')}-${String(effectiveTopupAmount || 0).padStart(6, '0')}`;

  const resetTopupDraft = () => {
    setTopupStep('amount');
    setTopupAmountMode(100);
    setTopupAmount(100);
    setCustomTopupAmount(undefined);
    setTopupPaymentMethod('wechat');
    setTopupProofFileName('');
  };

  const openTopupModal = () => {
    resetTopupDraft();
    setTopupModalVisible(true);
  };

  const closeTopupModal = () => {
    setTopupModalVisible(false);
    resetTopupDraft();
  };

  const handleTopupNext = () => {
    if (effectiveTopupAmount < TENANT_WALLET_MIN_TOPUP) {
      Message.error('单次钱包充值金额需至少 100 元');
      return;
    }
    setTopupStep('payment');
  };

  const handleTopupSubmit = async () => {
    if (effectiveTopupAmount < TENANT_WALLET_MIN_TOPUP) {
      Message.error('单次钱包充值金额需至少 100 元');
      return;
    }
    if (topupPaymentMethod === 'bank_transfer' && !topupProofFileName.trim()) {
      Message.error('对公转账充值需上传付款凭证');
      return;
    }
    setTopupSubmitting(true);
    try {
      await mockApi.createTenantWalletTopup({
        amount: effectiveTopupAmount,
        paymentMethod: topupPaymentMethod,
        proofFileName: topupPaymentMethod === 'bank_transfer' ? topupProofFileName.trim() || undefined : undefined,
      });
      await Promise.all([loadBilling(), loadWalletLedger()]);
      closeTopupModal();
      setWalletLedgerVisible(true);
      Message.success('钱包充值已入账');
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '钱包充值提交失败');
    } finally {
      setTopupSubmitting(false);
    }
  };

  useEffect(() => {
    loadBilling();
    loadWalletLedger();
  }, []);

  useEffect(() => {
    if (statePurchaseDraft) {
      setStoredPurchaseDraft(statePurchaseDraft);
      window.sessionStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(statePurchaseDraft));
      return;
    }
    if (!checkoutMode) {
      setStoredPurchaseDraft(undefined);
      return;
    }
    const rawDraft = window.sessionStorage.getItem(PURCHASE_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;
    try {
      setStoredPurchaseDraft(JSON.parse(rawDraft) as PurchaseDraft);
    } catch {
      window.sessionStorage.removeItem(PURCHASE_DRAFT_STORAGE_KEY);
    }
  }, [location.search, statePurchaseDraft]);

  useEffect(() => {
    let mounted = true;
    if (!currentPlan) {
      setAmountBreakdown(undefined);
      return;
    }
    mockApi.previewTenantBestCoupon({
      amount: currentPlan.amount,
      skipCoupon: !TENANT_COUPON_FEATURE_ENABLED || skipCoupon,
      bundleLines: checkoutBundleLines,
    }).then((result) => {
      if (mounted) setAmountBreakdown(result);
    });
    return () => {
      mounted = false;
    };
  }, [checkoutBundleLines, currentPlan?.amount, skipCoupon]);

  useEffect(() => {
    if (!draftOrder && currentPlan) {
      setUploadedAmount(payableAmount);
    }
    setDraftOrder(undefined);
    setElectronicOrder(undefined);
  }, [paymentMode, scanChannel, currentPlan?.amount, payableAmount]);

  const handleCreateOrder = async () => {
    if (!currentPlan) {
      Message.error('请先从购买页选择席位套餐');
      return;
    }
    setSubmitting(true);
    if (paymentMode === 'bank_transfer') {
      const result = await mockApi.createTenantBankTransferOrder({
        orderType: currentPlan.orderType,
        amount: currentPlan.amount,
        skipCoupon: !TENANT_COUPON_FEATURE_ENABLED || skipCoupon,
        bundleLines: checkoutBundleLines,
      });
      setDraftOrder({ orderId: result.orderId, amount: result.order.amount });
      setElectronicOrder(undefined);
      setUploadedAmount(result.order.amount);
      setProofName(`proof_${result.orderId}.png`);
      Message.success('已生成对公订单，请完成汇款后提交凭证');
    } else {
      const result = await mockApi.createTenantElectronicPaymentOrder({
        orderType: currentPlan.orderType,
        amount: currentPlan.amount,
        skipCoupon: !TENANT_COUPON_FEATURE_ENABLED || skipCoupon,
        paymentMethod: scanChannel,
        bundleLines: checkoutBundleLines,
      });
      setElectronicOrder({
        orderId: result.orderId,
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        qrCodeLabel: result.qrCodeLabel,
      });
      setDraftOrder(undefined);
      Message.success('已生成扫码支付订单，请扫码完成支付');
    }
    await loadBilling();
    setSubmitting(false);
  };

  const handleSubmitProof = async () => {
    if (!currentPlan) {
      Message.error('请先从购买页选择席位套餐');
      return;
    }
    if (!draftOrder) {
      Message.error('请先生成对公订单');
      return;
    }
    if (!proofName.trim()) {
      Message.error('请输入凭证文件名');
      return;
    }
    setSubmitting(true);
    await mockApi.submitTenantBankTransferProof(draftOrder.orderId, {
      proofName: proofName.trim(),
      uploadedAmount,
    });
    await loadBilling();
    setSubmitting(false);
    Message.success('付款凭证已提交，后台对公审核列表会出现该订单');
  };

  const handleCompleteElectronicPayment = async () => {
    if (!currentPlan) {
      Message.error('请先从购买页选择席位套餐');
      return;
    }
    if (!electronicOrder) {
      Message.error('请先生成支付订单');
      return;
    }
    setSubmitting(true);
    await mockApi.completeTenantElectronicPayment(electronicOrder.orderId);
    setElectronicOrder(undefined);
    await loadBilling();
    setSubmitting(false);
    Message.success('支付成功，订单已确认');
  };

  const openPendingOrderPayment = (order: BillingOrder) => {
    navigate(`/tenant/payment?orderId=${encodeURIComponent(order.id)}`);
  };

  const getLatestInvoiceForOrder = (orderId: string) =>
    data?.invoices
      .filter((item) => item.orderId === orderId)
      .sort((left, right) => right.appliedAt.localeCompare(left.appliedAt))[0];

  const openInvoiceApply = (orderId: string) => {
    setInvoiceDraft((current) => ({ ...current, orderId }));
    setInvoiceVisible(true);
  };

  const renderInvoiceStatus = (invoice?: BillingInvoiceRecord) =>
    invoice ? (
      <Tag color={invoiceStatusMap[invoice.status][0]}>{invoiceStatusMap[invoice.status][1]}</Tag>
    ) : (
      <Tag color={invoiceEmptyStatus[0]}>{invoiceEmptyStatus[1]}</Tag>
    );

  const columns = useMemo(
    () => [
      { title: '订单号', dataIndex: 'id' },
      { title: '类型', dataIndex: 'type', render: (value: keyof typeof typeMap) => typeMap[value] },
      { title: TENANT_COUPON_FEATURE_ENABLED ? '订单原价' : '订单金额', render: (_: unknown, row: BillingOrder) => money(row.originalAmount ?? row.amount) },
      ...(TENANT_COUPON_FEATURE_ENABLED
        ? [{ title: '优惠金额', render: (_: unknown, row: BillingOrder) => row.couponDiscountAmount ? `-${money(row.couponDiscountAmount)}` : '-' }]
        : []),
      { title: '实付金额', dataIndex: 'amount', render: (value: number) => money(value) },
      { title: '人工调价', render: (_: unknown, row: BillingOrder) => priceAdjustmentText(row) },
      { title: '付款凭证', dataIndex: 'proofName', render: (value?: string) => value || '-' },
      {
        title: '审核状态',
        dataIndex: 'reviewStatus',
        render: (value?: BillingOrder['reviewStatus']) =>
          value ? <Tag color={reviewStatusMap[value][0]}>{reviewStatusMap[value][1]}</Tag> : '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value: BillingOrder['status']) => <Tag color={statusMap[value][0]}>{statusMap[value][1]}</Tag>,
      },
      { title: '支付截止', render: (_: unknown, row: BillingOrder) => paymentDeadlineText(row) },
      {
        title: '发票状态',
        render: (_: unknown, row: BillingOrder) => renderInvoiceStatus(getLatestInvoiceForOrder(row.id)),
      },
      { title: '创建时间', dataIndex: 'createdAt' },
      {
        title: '操作',
        width: 150,
        render: (_: unknown, row: BillingOrder) => (
          <Space size={6}>
            {row.status === 'pending' ? (
              <Button type="text" size="mini" onClick={() => openPendingOrderPayment(row)}>
                去支付
              </Button>
            ) : null}
            <Button type="text" size="mini" onClick={() => setActiveOrder(row)}>
              查看
            </Button>
          </Space>
        ),
      },
    ],
    [data?.invoices],
  );

  const invoiceColumns = useMemo(
    () => [
      { title: '申请单号', dataIndex: 'id' },
      { title: '关联订单', dataIndex: 'orderId' },
      { title: '发票抬头', dataIndex: 'title' },
      { title: '金额', dataIndex: 'amount', render: (value: number) => money(value) },
      { title: '接收邮箱', dataIndex: 'receiverEmail' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value: BillingInvoiceRecord['status']) => <Tag color={invoiceStatusMap[value][0]}>{invoiceStatusMap[value][1]}</Tag>,
      },
      { title: '申请时间', dataIndex: 'appliedAt' },
      {
        title: '操作',
        width: 100,
        render: (_: unknown, row: BillingInvoiceRecord) => (
          <Button type="text" size="mini" onClick={() => setActiveInvoice(row)}>
            查看
          </Button>
        ),
      },
    ],
    [],
  );

  const filteredWalletLedgerRows = useMemo(
    () => walletLedgerRows.filter((item) => {
      const dateMatched = (!walletLedgerQuery.dateFrom || item.createdAt.slice(0, 10) >= walletLedgerQuery.dateFrom)
        && (!walletLedgerQuery.dateTo || item.createdAt.slice(0, 10) <= walletLedgerQuery.dateTo);
      const typeMatched = !walletLedgerQuery.types?.length || walletLedgerQuery.types.includes(item.type);
      const amountValue = Math.abs(item.amount);
      const minMatched = walletLedgerQuery.minAmount === undefined || amountValue >= walletLedgerQuery.minAmount;
      const maxMatched = walletLedgerQuery.maxAmount === undefined || amountValue <= walletLedgerQuery.maxAmount;
      return dateMatched && typeMatched && minMatched && maxMatched;
    }),
    [walletLedgerQuery, walletLedgerRows],
  );

  const exportWalletLedger = () => {
    const header = ['流水号', '类型', '关联业务', '金额变动', '变动后余额', '时间', '备注'];
    const rows = filteredWalletLedgerRows.map((item) => [
      item.id,
      tenantWalletLedgerTypeMeta[item.type].text,
      item.businessLabel,
      item.amount,
      item.balanceAfter,
      item.createdAt,
      item.remark,
    ]);
    downloadTextFile(
      `tenant-wallet-ledger-${dayjs().format('YYYYMMDD')}.csv`,
      [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'),
    );
    Message.success('已生成钱包流水 CSV');
  };

  const walletLedgerColumns = useMemo(
    () => [
      { title: '流水号', dataIndex: 'id', width: 180 },
      {
        title: '类型',
        dataIndex: 'type',
        width: 120,
        render: (value: TenantWalletLedgerType) => <Tag color={tenantWalletLedgerTypeMeta[value].color}>{tenantWalletLedgerTypeMeta[value].text}</Tag>,
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
      { title: '余额（变动后）', dataIndex: 'balanceAfter', width: 150, render: (value: number) => money(value) },
      { title: '时间', dataIndex: 'createdAt', width: 180 },
      {
        title: '备注',
        dataIndex: 'remark',
        render: (_: unknown, row: TenantWalletLedgerRecord) => (
          <Space direction="vertical" size={4}>
            <span>{row.remark}</span>
            {row.paymentMethod ? <Text type="secondary">支付方式：{methodMap[row.paymentMethod]}</Text> : null}
            {row.proofFileName ? <Text type="secondary">凭证：{row.proofFileName}</Text> : null}
          </Space>
        ),
      },
    ],
    [],
  );

  const billingWalletMetrics = useMemo(() => {
    const orders = data?.orders ?? [];
    const pendingOrders = orders.filter((item) => item.status === 'pending');
    const pendingReviewOrders = orders.filter((item) => item.status === 'pending_review');
    const pendingAmount = pendingOrders.reduce((sum, item) => sum + item.amount, 0);
    const pendingReviewAmount = pendingReviewOrders.reduce((sum, item) => sum + item.amount, 0);
    const latestTopup = walletLedgerRows
      .filter((item) => item.type === 'topup')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return [
      {
        label: '账户钱包',
        value: money(data?.balance ?? 0),
        trend: '可用于席位购买、续费与账单抵扣',
      },
      {
        label: '待支付订单',
        value: pendingOrders.length,
        trend: pendingOrders.length ? `待支付 ${money(pendingAmount)}` : '暂无待支付订单',
      },
      {
        label: '对公审核中',
        value: pendingReviewOrders.length,
        trend: pendingReviewOrders.length ? `${money(pendingReviewAmount)} 等待财务确认` : '暂无对公审核',
      },
      {
        label: '最近充值',
        value: latestTopup ? money(latestTopup.amount) : money(0),
        trend: latestTopup ? latestTopup.createdAt : '暂无充值记录',
      },
    ];
  }, [data?.balance, data?.orders, walletLedgerRows]);

  const selectedInvoiceOrder = data?.orders.find((item) => item.id === invoiceDraft.orderId);

  const handleSubmitInvoice = async () => {
    if (!invoiceDraft.orderId || !invoiceDraft.title.trim() || !invoiceDraft.taxNo.trim() || !invoiceDraft.receiverEmail.trim()) {
      Message.error('请填写关联订单、发票抬头、税号和接收邮箱');
      return;
    }
    setInvoiceSubmitting(true);
    await mockApi.submitBillingInvoice({
      ...invoiceDraft,
      title: invoiceDraft.title.trim(),
      taxNo: invoiceDraft.taxNo.trim(),
      receiverEmail: invoiceDraft.receiverEmail.trim(),
    });
    await loadBilling();
    setInvoiceSubmitting(false);
    setInvoiceVisible(false);
    Message.success('发票申请已提交');
  };

  if (!data) return null;

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>购买与账单</Title>
          <Text type="secondary">
            {purchaseDraft ? '确认订单并选择支付方式' : '订单、支付记录、对公审核和开通状态'}
          </Text>
        </div>
        <Space>
          <Button icon={<IconRefresh />} onClick={loadBilling}>刷新</Button>
          <Button type="primary" onClick={() => navigate('/tenant/purchase')}>购买席位</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="agent-balance-metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered className="agent-balance-summary-card">
            <div className="agent-balance-summary-card__body">
              <div className="agent-balance-summary-card__value">
                <span className="agent-balance-summary-card__value-label">{billingWalletMetrics[0].label}</span>
                <span className="agent-balance-summary-card__amount-line">
                  <span className="agent-balance-summary-card__value-amount">{billingWalletMetrics[0].value}</span>
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
                      onClick={openWalletLedger}
                    >
                      钱包流水
                    </Button>
                  </Space>
                </span>
              </div>
            </div>
          </Card>
        </Col>
        {billingWalletMetrics.slice(1).map((metric) => (
          <Col xs={24} sm={12} lg={6} key={metric.label}>
            <MetricCard metric={metric} />
          </Col>
        ))}
      </Row>

      {currentPlan ? (
        <Card title="待支付订单确认" bordered>
          <Row gutter={20}>
            <Col span={8}>
              <Space direction="vertical" size={14} className="full-width">
                <Descriptions
                  column={1}
                  data={purchaseDraft?.orderAction === '变更'
                    ? [
                        { label: '订单内容', value: currentPlan.orderType },
                        { label: '变更席位', value: `${purchaseDraft.seats} 个` },
                        { label: '计费方式', value: '按本次变更计费' },
                        { label: '订单原价', value: money(currentPlan.amount) },
                        ...(TENANT_COUPON_FEATURE_ENABLED ? [
                          { label: '本次优惠', value: discountAmount ? `-${money(discountAmount)}` : '无' },
                          ...(discountAmount ? [{ label: '优惠范围', value: `${couponDiscountScopeLabel(amountBreakdown?.discountScope)} / 可优惠 ${money(amountBreakdown?.eligibleAmount ?? currentPlan.amount)}` }] : []),
                        ] : []),
                        { label: '实付金额', value: money(payableAmount) },
                      ]
                    : [
                        { label: '订单内容', value: currentPlan.orderType },
                        { label: '席位数量', value: `${purchaseDraft?.seats ?? 0} 个` },
                        { label: '购买周期', value: `${purchaseDraft?.cycleMonths ?? 0} 个月` },
                        { label: '订单原价', value: money(currentPlan.amount) },
                        ...(TENANT_COUPON_FEATURE_ENABLED ? [
                          { label: '本次优惠', value: discountAmount ? `-${money(discountAmount)}` : '无' },
                          ...(discountAmount ? [{ label: '优惠范围', value: `${couponDiscountScopeLabel(amountBreakdown?.discountScope)} / 可优惠 ${money(amountBreakdown?.eligibleAmount ?? currentPlan.amount)}` }] : []),
                        ] : []),
                        { label: '实付金额', value: money(payableAmount) },
                      ]}
                />
                {TENANT_COUPON_FEATURE_ENABLED ? <div className="payment-proof-panel">
                  <Text className="field-label">优惠抵扣</Text>
                  {selectedCoupon && !skipCoupon ? (
                    <Space direction="vertical" size={6} className="full-width">
                      <Space wrap size={6}>
                        <Tag color={isVoucherCoupon(selectedCoupon) ? 'arcoblue' : 'purple'}>{couponBenefitTypeLabel(selectedCoupon)}</Tag>
                        <Tag color="arcoblue">{selectedCoupon.name}</Tag>
                      </Space>
                      <Text type="secondary">
                        {couponDiscountScopeLabel(selectedCoupon.discountScope)} · {couponRuleLabel(selectedCoupon.discountRate)}
                        {isVoucherCoupon(selectedCoupon) ? ` · 剩余额度 ${money(selectedCoupon.remainingDiscountQuota)}` : ' · 单次使用'}
                      </Text>
                      <Text type="secondary">已自动选择本单优惠金额最高的券。</Text>
                    </Space>
                  ) : skipCoupon ? (
                    <Text type="secondary">本单已选择不使用券，按套餐原价支付。</Text>
                  ) : (
                    <Text type="secondary">暂无可用券，本单按套餐原价支付。</Text>
                  )}
                  <Space size={8}>
                    <Switch checked={skipCoupon} onChange={setSkipCoupon} />
                    <Text>本单不使用券</Text>
                  </Space>
                </div> : null}
                <div className="billing-purchase-lines">
                  {purchaseDraft?.lines.map((line) => (
                    <div key={`${line.plan}-${line.count}-${line.bindCodingPlan}`}>
                      <span>{line.plan}</span>
                      <strong>{line.summary ?? `${line.count} ${line.unitLabel ?? '席'}${line.bindCodingPlan ? ' + CodingPlan' : ''}`}</strong>
                    </div>
                  ))}
                </div>
                <Text className="field-label">支付方式</Text>
                <Radio.Group value={paymentMode} onChange={(value) => setPaymentMode(value as PaymentMode)} direction="vertical">
                  <Radio value="scan">扫码支付</Radio>
                  <Radio value="bank_transfer">对公转账</Radio>
                </Radio.Group>
                {paymentMode === 'scan' ? (
                  <>
                    <Text className="field-label">扫码渠道</Text>
                    <Radio.Group value={scanChannel} onChange={(value) => setScanChannel(value as ScanChannel)}>
                      <Radio value="wechat">微信</Radio>
                      <Radio value="alipay">支付宝</Radio>
                    </Radio.Group>
                  </>
                ) : null}
                <Text type="secondary">扫码支付成功后直接进入开通流程；对公转账需上传凭证并等待官方确认。</Text>
              </Space>
            </Col>
            <Col span={16}>
              <div className="payment-panel">
                {paymentMode === 'bank_transfer' ? (
                  <>
                    <Descriptions
                      title="对公转账信息"
                      column={1}
                      data={[
                        { label: '收款主体', value: '云脑智联科技有限公司' },
                        { label: '开户银行', value: '招商银行上海分行营业部' },
                        { label: '银行账号', value: '6222 **** **** 2048' },
                        { label: '本次购买', value: currentPlan.orderType },
                        { label: '订单原价', value: money(currentPlan.amount) },
                        ...(TENANT_COUPON_FEATURE_ENABLED ? [
                          { label: '优惠抵扣', value: selectedCoupon && !skipCoupon ? `${couponBenefitTypeLabel(selectedCoupon)} · ${selectedCoupon.name}` : '未使用' },
                          { label: '本次优惠', value: discountAmount ? `-${money(discountAmount)}` : '无' },
                          ...(discountAmount ? [{ label: '优惠范围', value: `${couponDiscountScopeLabel(amountBreakdown?.discountScope)} / 可优惠 ${money(amountBreakdown?.eligibleAmount ?? currentPlan.amount)}` }] : []),
                        ] : []),
                        { label: '应转金额', value: money(payableAmount) },
                        { label: '开通说明', value: currentPlan.hint },
                      ]}
                    />
                    <Space direction="vertical" size={12} className="full-width">
                      <Space>
                        <Button type="primary" loading={submitting} onClick={handleCreateOrder}>生成对公订单</Button>
                        {draftOrder ? <Tag color="arcoblue">当前订单 {draftOrder.orderId}</Tag> : null}
                      </Space>
                      {draftOrder ? (
                        <div className="payment-proof-panel">
                          <Text className="field-label">模拟上传付款凭证</Text>
                          <Input value={proofName} onChange={setProofName} placeholder="例如 bank-proof.png" />
                          <Text className="field-label">客户填写到账金额</Text>
                          <InputNumber value={uploadedAmount} onChange={(value) => setUploadedAmount(Number(value) || 0)} min={0} className="full-width" />
                          <Button loading={submitting} onClick={handleSubmitProof}>提交付款凭证，进入后台审核</Button>
                        </div>
                      ) : null}
                    </Space>
                  </>
                ) : (
                  <>
                    <Descriptions
                      title="扫码支付订单"
                      column={1}
                      data={[
                        { label: '本次购买', value: currentPlan.orderType },
                        { label: '订单原价', value: money(currentPlan.amount) },
                        ...(TENANT_COUPON_FEATURE_ENABLED ? [
                          { label: '优惠抵扣', value: selectedCoupon && !skipCoupon ? `${couponBenefitTypeLabel(selectedCoupon)} · ${selectedCoupon.name}` : '未使用' },
                          { label: '本次优惠', value: discountAmount ? `-${money(discountAmount)}` : '无' },
                          ...(discountAmount ? [{ label: '优惠范围', value: `${couponDiscountScopeLabel(amountBreakdown?.discountScope)} / 可优惠 ${money(amountBreakdown?.eligibleAmount ?? currentPlan.amount)}` }] : []),
                        ] : []),
                        { label: '扫码金额', value: money(payableAmount) },
                        { label: '支付渠道', value: scanChannelMap[scanChannel] },
                        { label: '开通说明', value: currentPlan.hint },
                      ]}
                    />
                    <Space direction="vertical" size={12} className="full-width">
                      <Space>
                        <Button type="primary" loading={submitting} onClick={handleCreateOrder}>生成扫码支付订单</Button>
                        {electronicOrder ? <Tag color="arcoblue">当前订单 {electronicOrder.orderId}</Tag> : null}
                      </Space>
                      {electronicOrder ? (
                        <div className="electronic-payment-panel">
                          <div className="electronic-payment-qr">
                            <span>{scanChannelMap[electronicOrder.paymentMethod]}</span>
                            <small>{electronicOrder.qrCodeLabel} · {money(electronicOrder.amount)}</small>
                          </div>
                          <div>
                            <Text className="field-label">模拟扫码支付</Text>
                            <p>客户扫码完成支付后，订单会直接确认已支付，并进入后续开通流程。</p>
                            <Button type="primary" loading={submitting} onClick={handleCompleteElectronicPayment}>
                              {electronicOrder.amount === 0 ? '确认订单' : '模拟支付成功'}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </Space>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Modal
        title="充值账户钱包"
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
            <Text type="secondary">先选择本次要充值到企业账户钱包的金额。</Text>
            <div className="agent-topup-amount-grid">
              {tenantTopupAmountOptions.map((amount) => (
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
                  min={TENANT_WALLET_MIN_TOPUP}
                  value={customTopupAmount}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(value) => {
                    setTopupAmountMode('custom');
                    setCustomTopupAmount(typeof value === 'number' ? value : undefined);
                  }}
                  placeholder="最低 ¥100"
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
                const nextPaymentMethod = value as TenantWalletPaymentMethod;
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
                    { label: '收款主体', value: data.wallet.collectionAccount.companyName },
                    { label: '开户银行', value: `${data.wallet.collectionAccount.bankName} ${data.wallet.collectionAccount.branchName}` },
                    { label: '银行账号', value: data.wallet.collectionAccount.accountNo },
                    { label: '唯一备注号', value: data.wallet.collectionAccount.remarkCode },
                    { label: '转账金额', value: money(effectiveTopupAmount) },
                  ]}
                />
                <Alert type="info" content={data.wallet.collectionAccount.note} />
                <Space direction="vertical" size={8} className="full-width">
                  <Text className="field-label">付款凭证</Text>
                  <Input value={topupProofFileName} onChange={setTopupProofFileName} placeholder="上传后自动填入，也可输入 mock 文件名" />
                  <Text type="secondary">对公转账需上传付款凭证，平台财务核对后入账。</Text>
                </Space>
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

      <Drawer
        title="钱包流水"
        visible={walletLedgerVisible}
        width={1080}
        footer={null}
        onCancel={() => setWalletLedgerVisible(false)}
      >
        <div className="admin-table-panel">
          <div className="admin-table-panel__toolbar">
            <div className="sales-filter-bar agent-balance-filter-bar">
              <DatePicker.RangePicker
                value={walletLedgerQuery.dateFrom && walletLedgerQuery.dateTo ? [walletLedgerQuery.dateFrom, walletLedgerQuery.dateTo] : []}
                onChange={(value) => setWalletLedgerQuery((current) => ({
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
                value={walletLedgerQuery.types}
                onChange={(value) => setWalletLedgerQuery((current) => ({ ...current, types: (value || []) as TenantWalletLedgerType[] }))}
                placeholder="流水类型"
                style={{ width: 220 }}
              >
                {Object.entries(tenantWalletLedgerTypeMeta).map(([value, meta]) => (
                  <Select.Option key={value} value={value}>{meta.text}</Select.Option>
                ))}
              </Select>
              <InputNumber
                className="agent-balance-filter-bar__amount"
                min={0}
                value={walletLedgerQuery.minAmount}
                onChange={(value) => setWalletLedgerQuery((current) => ({ ...current, minAmount: typeof value === 'number' ? value : undefined }))}
                placeholder="最小金额"
              />
              <InputNumber
                className="agent-balance-filter-bar__amount"
                min={0}
                value={walletLedgerQuery.maxAmount}
                onChange={(value) => setWalletLedgerQuery((current) => ({ ...current, maxAmount: typeof value === 'number' ? value : undefined }))}
                placeholder="最大金额"
              />
              <Button type="primary" onClick={() => loadWalletLedger()}>筛选</Button>
              <Button onClick={() => {
                setWalletLedgerQuery({});
                loadWalletLedger();
              }}>重置</Button>
              <Button icon={<IconDownload />} onClick={exportWalletLedger}>导出 CSV</Button>
            </div>
          </div>
          <Table
            rowKey="id"
            columns={walletLedgerColumns}
            data={filteredWalletLedgerRows}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1180 }}
          />
        </div>
      </Drawer>

      <Card title="订单明细" bordered>
        <Table rowKey="id" columns={columns} data={data.orders} pagination={false} />
      </Card>

      <Card title="发票记录" bordered>
        <Table rowKey="id" columns={invoiceColumns} data={data.invoices} pagination={false} />
      </Card>

      <Drawer
        title={activeOrder ? `订单详情 ${activeOrder.id}` : '订单详情'}
        visible={Boolean(activeOrder)}
        width={520}
        footer={null}
        onCancel={() => setActiveOrder(undefined)}
      >
        {activeOrder ? (() => {
          const latestInvoice = getLatestInvoiceForOrder(activeOrder.id);
          const discountValue = TENANT_COUPON_FEATURE_ENABLED && activeOrder.couponDiscountAmount
            ? `-${money(activeOrder.couponDiscountAmount)}${activeOrder.couponName ? `（${activeOrder.couponName}）` : ''}`
            : '-';
          const isActiveOrderPaidFlow = activeOrder.status !== 'pending';
          return (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '订单类型', value: orderSummaryLabel(activeOrder.orderType || typeMap[activeOrder.type], activeOrder.bundleLines) },
                ...(activeOrder.bundleLines?.length ? [{
                  label: '购买内容',
                  value: (
                    <div>
                      {orderBundleDetailLines(activeOrder.bundleLines).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  ),
                }] : []),
                { label: TENANT_COUPON_FEATURE_ENABLED ? '订单原价' : '订单金额', value: money(activeOrder.originalAmount ?? activeOrder.amount) },
                ...(TENANT_COUPON_FEATURE_ENABLED ? [{ label: '优惠金额', value: discountValue }] : []),
                ...(activeOrder.priceAdjustment ? [{ label: '人工调价', value: priceAdjustmentDetailText(activeOrder) }] : []),
                { label: '实付金额', value: money(activeOrder.amount) },
                ...(isActiveOrderPaidFlow ? [{ label: '支付方式', value: methodMap[activeOrder.paymentMethod] }] : []),
                ...(isActiveOrderPaidFlow && activeOrder.paymentMethod === 'bank_transfer'
                  ? [
                      { label: '付款凭证', value: activeOrder.proofName ?? '未提交' },
                    ]
                  : isActiveOrderPaidFlow ? [
                      { label: '支付说明', value: activeOrder.status === 'paid' ? '扫码支付已确认到账' : '等待客户扫码支付' },
                    ] : []),
                {
                  label: '订单状态',
                  value: <Tag color={statusMap[activeOrder.status][0]}>{statusMap[activeOrder.status][1]}</Tag>,
                },
                ...(activeOrder.status === 'pending' || activeOrder.paymentExpiredAt
                  ? [{ label: '支付截止', value: paymentDeadlineText(activeOrder) }]
                  : []),
                ...(isActiveOrderPaidFlow && activeOrder.paymentMethod === 'bank_transfer'
                  ? [
                      {
                        label: '对公审核',
                        value: activeOrder.reviewStatus ? (
                          <Tag color={reviewStatusMap[activeOrder.reviewStatus][0]}>{reviewStatusMap[activeOrder.reviewStatus][1]}</Tag>
                        ) : '未提交凭证',
                      },
                    ]
                  : []),
                {
                  label: '发票状态',
                  value: renderInvoiceStatus(latestInvoice),
                },
                ...(latestInvoice?.status === 'issued' && latestInvoice.fileName
                  ? [
                      {
                        label: '发票文件',
                        value: (
                          <Button type="text" size="mini" onClick={() => setActiveInvoice(latestInvoice)}>
                            {latestInvoice.fileName}
                          </Button>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            {isActiveOrderPaidFlow && activeOrder.paymentMethod === 'bank_transfer' ? (
              <Card bordered title="对公付款详情">
                <Descriptions
                  column={1}
                  data={[
                    { label: '收款主体', value: '云脑智联科技有限公司' },
                    { label: '开户银行', value: '招商银行上海分行营业部' },
                    { label: '银行账号', value: '6222 **** **** 2048' },
                    { label: '订单金额', value: money(activeOrder.amount) },
                    { label: '客户上传金额', value: activeOrder.uploadedAmount !== undefined ? money(activeOrder.uploadedAmount) : '-' },
                    { label: '付款凭证', value: activeOrder.proofName ?? '未提交' },
                    { label: '银行流水号', value: activeOrder.bankSerialNo ?? '-' },
                    {
                      label: '审核状态',
                      value: activeOrder.reviewStatus ? (
                        <Tag color={reviewStatusMap[activeOrder.reviewStatus][0]}>{reviewStatusMap[activeOrder.reviewStatus][1]}</Tag>
                      ) : '未提交凭证',
                    },
                    { label: '审核说明', value: activeOrder.reviewReason ?? '-' },
                  ]}
                />
              </Card>
            ) : null}
            <OpeningProgressPanel
              compact
              status={normalizeOpeningProgressStatus(activeOrder.openingStatus, activeOrder.status)}
              orderId={activeOrder.id}
              taskId={activeOrder.openingTaskId}
              updatedAt={activeOrder.createdAt}
            />
            {activeOrder.status === 'paid' && (!latestInvoice || latestInvoice.status === 'rejected') ? (
              <Button type="primary" onClick={() => openInvoiceApply(activeOrder.id)}>
                {latestInvoice?.status === 'rejected' ? '重新申请发票' : '申请发票'}
              </Button>
            ) : null}
            {activeOrder.status === 'pending' ? (
              <Button type="primary" onClick={() => openPendingOrderPayment(activeOrder)}>
                去支付
              </Button>
            ) : null}
          </Space>
          );
        })() : null}
      </Drawer>

      <Drawer
        title={activeInvoice ? `发票详情 ${activeInvoice.id}` : '发票详情'}
        visible={Boolean(activeInvoice)}
        width={520}
        footer={null}
        onCancel={() => setActiveInvoice(undefined)}
      >
        {activeInvoice ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '关联订单', value: activeInvoice.orderId },
                { label: '发票抬头', value: activeInvoice.title },
                { label: '纳税人识别号', value: activeInvoice.taxNo },
                { label: '金额', value: `¥${activeInvoice.amount.toLocaleString()}` },
                { label: '接收邮箱', value: activeInvoice.receiverEmail },
                { label: '状态', value: <Tag color={invoiceStatusMap[activeInvoice.status][0]}>{invoiceStatusMap[activeInvoice.status][1]}</Tag> },
                { label: '申请时间', value: activeInvoice.appliedAt },
                { label: '开票时间', value: activeInvoice.issuedAt ?? '-' },
                ...(activeInvoice.status === 'rejected'
                  ? [{ label: '驳回原因', value: activeInvoice.rejectReason ?? '请联系财务确认原因' }]
                  : []),
                { label: '发票文件', value: activeInvoice.fileName ?? '待财务上传' },
              ]}
            />
            {activeInvoice.status === 'rejected' ? (
              <Space direction="vertical" size={8} className="full-width">
                <Text type="secondary">请修正开票信息后重新提交申请。</Text>
                <Button
                  type="primary"
                  onClick={() => {
                    openInvoiceApply(activeInvoice.orderId);
                    setActiveInvoice(undefined);
                  }}
                >
                  重新申请发票
                </Button>
              </Space>
            ) : activeInvoice.status !== 'issued' ? (
              <Text type="secondary">发票申请已提交，等待财务开票并上传电子发票文件。</Text>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        title="申请发票"
        visible={invoiceVisible}
        width={520}
        onCancel={() => setInvoiceVisible(false)}
        footer={(
          <Space>
            <Button onClick={() => setInvoiceVisible(false)}>取消</Button>
            <Button type="primary" loading={invoiceSubmitting} onClick={handleSubmitInvoice}>提交申请</Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={14} className="full-width">
          <div>
            <Text className="field-label">关联订单</Text>
            <Descriptions
              column={1}
              data={selectedInvoiceOrder
                ? [
                    { label: '订单号', value: selectedInvoiceOrder.id },
                    { label: '订单类型', value: typeMap[selectedInvoiceOrder.type] },
                    { label: '订单金额', value: money(selectedInvoiceOrder.amount) },
                  ]
                : [{ label: '订单', value: '请从订单明细进入申请发票' }]}
            />
          </div>
          <div>
            <Text className="field-label">发票抬头</Text>
            <Input value={invoiceDraft.title} onChange={(value) => setInvoiceDraft((current) => ({ ...current, title: value }))} />
          </div>
          <div>
            <Text className="field-label">纳税人识别号</Text>
            <Input value={invoiceDraft.taxNo} onChange={(value) => setInvoiceDraft((current) => ({ ...current, taxNo: value }))} />
          </div>
          <div>
            <Text className="field-label">接收邮箱</Text>
            <Input value={invoiceDraft.receiverEmail} onChange={(value) => setInvoiceDraft((current) => ({ ...current, receiverEmail: value }))} />
          </div>
          <Text type="secondary">当前为电子普票申请，提交后进入开票处理队列。</Text>
        </Space>
      </Drawer>
    </Space>
  );
}
