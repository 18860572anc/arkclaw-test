import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Grid,
  Input,
  InputNumber,
  Message,
  Radio,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconCheckCircle, IconCopy, IconDownload, IconUpload } from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import { couponBenefitTypeLabel, isVoucherCoupon } from '../../utils/couponDisplay';
import { orderBundleDetailLines, orderSummaryLabel } from '../../utils/orderDisplay';
import type { BillingOrder, CouponDiscountScope, CouponRecord, OrderAmountBreakdown, OrderBundleLine } from '../../types/domain';
import type { PurchaseDraft } from './PurchasePage';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const Step = Steps.Step;
const PURCHASE_DRAFT_STORAGE_KEY = 'arkclaw_purchase_draft';
const SALES_COUPON_PURCHASE_DRAFT_KEY = 'arkclaw_sales_coupon_purchase_draft';
const TENANT_COUPON_FEATURE_ENABLED = false;
const MOCK_NOW = dayjs('2026-05-15 10:00');
const BANK_TRANSFER_PAYEE = '云脑智联科技有限公司';
const BANK_TRANSFER_BANK = '招商银行上海分行营业部';
const BANK_TRANSFER_ACCOUNT = '6222 **** **** 2048';

type PaymentStep = 0 | 1 | 2;
type PaymentMode = 'scan' | 'bank_transfer';
type CouponSelection = 'auto' | 'none' | string;
type SalesCouponPurchaseDraft = PurchaseDraft & {
  tenantId: string;
  tenantName: string;
  poolId: string;
  poolName: string;
  sourcePath: string;
};

const money = (value: number) => `¥${value.toLocaleString()}`;
const priceAdjustmentText = (order: Pick<BillingOrder, 'priceAdjustment'>) => {
  const adjustment = order.priceAdjustment;
  if (!adjustment) return '';
  const deltaText = `${adjustment.deltaAmount > 0 ? '+' : adjustment.deltaAmount < 0 ? '-' : ''}${money(Math.abs(adjustment.deltaAmount))}`;
  return `${money(adjustment.beforeAmount)} → ${money(adjustment.afterAmount)}（${deltaText}）`;
};
const paymentDeadlineText = (paymentExpiresAt?: string) => {
  if (!paymentExpiresAt) return '请在 24 小时内完成支付';
  const minutes = dayjs(paymentExpiresAt).diff(MOCK_NOW, 'minute');
  if (minutes <= 0) return `${paymentExpiresAt} 已超时`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `请于 ${paymentExpiresAt} 前完成支付，剩余 ${hours}小时${restMinutes ? `${restMinutes}分钟` : ''}`;
};
const couponRuleLabel = (discountRate: number) => (discountRate === 0 ? '100% 抵扣' : `${discountRate}% 折扣`);
const couponDiscountScopeLabel = (scope: CouponDiscountScope = 'order') =>
  scope === 'seat' ? '席位' : scope === 'coding_plan' ? 'CodingPlan' : '整单';
const couponThresholdAmount = (coupon: CouponRecord) => {
  const matched = coupon.thresholdRule?.match(/满\s*¥?\s*([\d,]+(?:\.\d+)?)/);
  return matched ? Number(matched[1].replace(/,/g, '')) : 0;
};
const getEligibleAmountByScope = (amount: number, scope: CouponDiscountScope = 'order', bundleLines?: OrderBundleLine[]) => {
  if (scope === 'order' || !bundleLines?.length) return amount;
  return bundleLines
    .filter((line) => line.productType === scope)
    .reduce((sum, line) => sum + line.amount, 0);
};
const calculateCouponPreviewDiscount = (coupon: CouponRecord, amount: number, bundleLines?: OrderBundleLine[]) => {
  const eligibleAmount = getEligibleAmountByScope(amount, coupon.discountScope, bundleLines);
  if (eligibleAmount < couponThresholdAmount(coupon)) return 0;
  const discountRatio = Math.max(0, Math.min(100, 100 - coupon.discountRate)) / 100;
  const theoreticalDiscount = Math.round(eligibleAmount * discountRatio);
  return isVoucherCoupon(coupon)
    ? Math.min(theoreticalDiscount, coupon.remainingDiscountQuota, eligibleAmount)
    : Math.min(theoreticalDiscount, eligibleAmount);
};

const codingPlanPriceMap: Record<string, number> = {
  'CodingPlan Team Lite': 120,
  'CodingPlan Team Pro': 600,
};

const buildBundleLinesFromDraft = (purchaseDraft: PurchaseDraft) => purchaseDraft.lines.flatMap((line, index) => {
  const lineAmount = line.amount ?? 0;
  const codingAmount = line.bindCodingPlan && line.codingPlanName
    ? Math.min(lineAmount, (codingPlanPriceMap[line.codingPlanName] ?? 0) * purchaseDraft.cycleMonths * line.count)
    : 0;
  const seatAmount = Math.max(lineAmount - codingAmount, 0);
  const seatLine = {
    id: `payment-seat-${index}`,
    productType: 'seat' as const,
    productName: line.plan,
    quantity: line.count,
    unit: '席' as const,
    amount: seatAmount,
    specLabel: line.action,
    cycleMonths: purchaseDraft.cycleMonths,
  };
  if (!line.bindCodingPlan || !line.codingPlanName) return [seatLine];
  return [
    seatLine,
    {
      id: `payment-code-${index}`,
      productType: 'coding_plan' as const,
      productName: line.codingPlanName,
      quantity: line.count,
      unit: '份' as const,
      amount: codingAmount,
      specLabel: line.action,
      cycleMonths: purchaseDraft.cycleMonths,
    },
  ];
});

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingOrderId = new URLSearchParams(location.search).get('orderId');
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft>();
  const [salesCouponDraft, setSalesCouponDraft] = useState<SalesCouponPurchaseDraft>();
  const [existingPaymentOrder, setExistingPaymentOrder] = useState<BillingOrder>();
  const [existingPaymentLoading, setExistingPaymentLoading] = useState(Boolean(existingOrderId));
  const [existingPaymentMissing, setExistingPaymentMissing] = useState(false);
  const [step, setStep] = useState<PaymentStep>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('scan');
  const [scanChannel, setScanChannel] = useState<'wechat' | 'alipay'>('wechat');
  const [availableCoupons, setAvailableCoupons] = useState<CouponRecord[]>([]);
  const [couponSelection, setCouponSelection] = useState<CouponSelection>('auto');
  const [amountBreakdown, setAmountBreakdown] = useState<OrderAmountBreakdown>();
  const [electronicOrder, setElectronicOrder] = useState<{
    orderId: string;
    amount: number;
    paymentMethod: 'wechat' | 'alipay';
    qrCodeLabel: string;
    paymentExpiresAt?: string;
  }>();
  const [draftOrder, setDraftOrder] = useState<{ orderId: string; amount: number; paymentExpiresAt?: string }>();
  const [proofName, setProofName] = useState('bank-transfer-proof.png');
  const [uploadedAmount, setUploadedAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [finishText, setFinishText] = useState('支付已完成');
  const scanOrderKeyRef = useRef('');
  const bankOrderKeyRef = useRef('');
  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingOrderId) return;
    const stateDraft = (location.state as { purchaseDraft?: PurchaseDraft | SalesCouponPurchaseDraft } | null)?.purchaseDraft;
    const isSalesPayment = location.pathname.startsWith('/sales/coupons/payment') || location.pathname.startsWith('/sales-admin/coupons/payment');

    if (stateDraft && isSalesPayment && 'poolId' in stateDraft) {
      setSalesCouponDraft(stateDraft);
      setPurchaseDraft(stateDraft);
      setUploadedAmount(stateDraft.amount);
      window.sessionStorage.setItem(SALES_COUPON_PURCHASE_DRAFT_KEY, JSON.stringify(stateDraft));
      return;
    }

    if (stateDraft && !isSalesPayment) {
      setSalesCouponDraft(undefined);
      setPurchaseDraft(stateDraft);
      setUploadedAmount(stateDraft.amount);
      window.sessionStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(stateDraft));
      return;
    }

    if (isSalesPayment) {
      const rawSalesDraft = window.sessionStorage.getItem(SALES_COUPON_PURCHASE_DRAFT_KEY);
      if (!rawSalesDraft) return;
      try {
        const nextDraft = JSON.parse(rawSalesDraft) as SalesCouponPurchaseDraft;
        setSalesCouponDraft(nextDraft);
        setPurchaseDraft(nextDraft);
        setUploadedAmount(nextDraft.amount);
      } catch {
        window.sessionStorage.removeItem(SALES_COUPON_PURCHASE_DRAFT_KEY);
      }
      return;
    }

    const rawDraft = window.sessionStorage.getItem(PURCHASE_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;
    try {
      const nextDraft = JSON.parse(rawDraft) as PurchaseDraft;
      setSalesCouponDraft(undefined);
      setPurchaseDraft(nextDraft);
      setUploadedAmount(nextDraft.amount);
    } catch {
      window.sessionStorage.removeItem(PURCHASE_DRAFT_STORAGE_KEY);
    }
  }, [existingOrderId, location.pathname, location.state]);

  useEffect(() => {
    if (!existingOrderId) {
      setExistingPaymentOrder(undefined);
      setExistingPaymentMissing(false);
      setExistingPaymentLoading(false);
      return;
    }

    let cancelled = false;
    setExistingPaymentLoading(true);
    setExistingPaymentMissing(false);
    setSalesCouponDraft(undefined);
    setPurchaseDraft(undefined);
    setElectronicOrder(undefined);
    setDraftOrder(undefined);

    mockApi.getBilling().then((billing) => {
      if (cancelled) return;
      const order = billing.orders.find((item) => item.id === existingOrderId);
      setExistingPaymentOrder(order);
      setExistingPaymentMissing(!order);
      if (!order) return;

      setStep(1);
      setPaymentMode(order.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'scan');
      if (order.paymentMethod !== 'bank_transfer') {
        setScanChannel(order.paymentMethod);
      }
      setUploadedAmount(order.uploadedAmount ?? order.amount);
      setProofName(order.proofName ?? `proof_${order.id}.png`);
      if (order.paymentMethod === 'bank_transfer') {
        setDraftOrder({ orderId: order.id, amount: order.amount, paymentExpiresAt: order.paymentExpiresAt });
      } else {
        setElectronicOrder({
          orderId: order.id,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          qrCodeLabel: `${order.paymentMethod === 'alipay' ? '支付宝' : '微信'}支付码 ${order.id}`,
          paymentExpiresAt: order.paymentExpiresAt,
        });
      }
    }).finally(() => {
      if (!cancelled) setExistingPaymentLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [existingOrderId]);

  useEffect(() => {
    if (!TENANT_COUPON_FEATURE_ENABLED) {
      setAvailableCoupons([]);
      return;
    }
    let cancelled = false;
    mockApi.getTenantAvailableCoupons().then((coupons) => {
      if (cancelled) return;
      setAvailableCoupons(coupons ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!TENANT_COUPON_FEATURE_ENABLED) return;
    if (couponSelection !== 'auto' || !purchaseDraft || availableCoupons.length === 0) return;
    const bundleLines = buildBundleLinesFromDraft(purchaseDraft);
    const bestCoupon = availableCoupons
      .map((coupon) => ({ coupon, discountAmount: calculateCouponPreviewDiscount(coupon, purchaseDraft.amount, bundleLines) }))
      .filter((item) => item.discountAmount > 0)
      .sort((left, right) => right.discountAmount - left.discountAmount)[0]?.coupon;
    if (bestCoupon) {
      setCouponSelection(bestCoupon.id);
    }
  }, [availableCoupons, couponSelection, purchaseDraft]);

  useEffect(() => {
    setElectronicOrder(undefined);
    setDraftOrder(undefined);
    scanOrderKeyRef.current = '';
    bankOrderKeyRef.current = '';
    if (purchaseDraft) {
      setUploadedAmount(amountBreakdown?.payableAmount ?? purchaseDraft.amount);
    }
  }, [couponSelection, paymentMode, purchaseDraft]);

  useEffect(() => {
    if (purchaseDraft) {
      setUploadedAmount(amountBreakdown?.payableAmount ?? purchaseDraft.amount);
    }
  }, [amountBreakdown?.payableAmount, purchaseDraft]);

  useEffect(() => {
    if (!purchaseDraft) return;
    let cancelled = false;
    if (salesCouponDraft) {
      mockApi.previewSalesCouponOrder({
        tenantId: salesCouponDraft.tenantId,
        poolId: salesCouponDraft.poolId,
        amount: salesCouponDraft.amount,
        bundleLines: buildBundleLinesFromDraft(salesCouponDraft),
      }).then((result) => {
        if (cancelled) return;
        setAmountBreakdown(result);
        setUploadedAmount(result.payableAmount);
      });
      return () => {
        cancelled = true;
      };
    }
    const skipCoupon = !TENANT_COUPON_FEATURE_ENABLED || couponSelection === 'none';
    const couponId = TENANT_COUPON_FEATURE_ENABLED && couponSelection !== 'auto' && couponSelection !== 'none' ? couponSelection : undefined;
    mockApi.previewTenantBestCoupon({
      amount: purchaseDraft.amount,
      skipCoupon,
      couponId,
      bundleLines: buildBundleLinesFromDraft(purchaseDraft),
    }).then((result) => {
      if (cancelled) return;
      setAmountBreakdown(result);
      setUploadedAmount(result.payableAmount);
    });
    return () => {
      cancelled = true;
    };
  }, [couponSelection, purchaseDraft, salesCouponDraft]);

  useEffect(() => {
    if (!purchaseDraft || step !== 1) return;

    let cancelled = false;
    if (salesCouponDraft) {
      return;
    }

    const skipCoupon = !TENANT_COUPON_FEATURE_ENABLED || couponSelection === 'none';
    const couponId = TENANT_COUPON_FEATURE_ENABLED && couponSelection !== 'auto' && couponSelection !== 'none' ? couponSelection : undefined;
    if (paymentMode === 'scan') {
      const orderKey = `${purchaseDraft.orderType}-${purchaseDraft.amount}-${couponSelection}-scan`;
      if (electronicOrder || scanOrderKeyRef.current === orderKey) return;
      setSubmitting(true);
      mockApi.createTenantElectronicPaymentOrder({
        orderType: purchaseDraft.orderType,
        amount: purchaseDraft.amount,
        paymentMethod: 'wechat',
        skipCoupon,
        couponId,
        bundleLines: buildBundleLinesFromDraft(purchaseDraft),
      }).then((result) => {
        if (cancelled) return;
        scanOrderKeyRef.current = orderKey;
        setElectronicOrder({
          orderId: result.orderId,
          amount: result.amount,
          paymentMethod: result.paymentMethod,
          qrCodeLabel: result.qrCodeLabel,
          paymentExpiresAt: result.order.paymentExpiresAt,
        });
        setDraftOrder(undefined);
      }).finally(() => {
        if (!cancelled) setSubmitting(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const orderKey = `${purchaseDraft.orderType}-${purchaseDraft.amount}-${couponSelection}-bank_transfer`;
    if (draftOrder || bankOrderKeyRef.current === orderKey) return;
    setSubmitting(true);
    mockApi.createTenantBankTransferOrder({
      orderType: purchaseDraft.orderType,
      amount: purchaseDraft.amount,
      skipCoupon,
      couponId,
      bundleLines: buildBundleLinesFromDraft(purchaseDraft),
    }).then((result) => {
      if (cancelled) return;
      bankOrderKeyRef.current = orderKey;
      setDraftOrder({ orderId: result.orderId, amount: result.order.amount, paymentExpiresAt: result.order.paymentExpiresAt });
      setElectronicOrder(undefined);
      setProofName(`proof_${result.orderId}.png`);
      setUploadedAmount(result.order.amount);
    }).finally(() => {
      if (!cancelled) setSubmitting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [couponSelection, draftOrder, electronicOrder, paymentMode, purchaseDraft, salesCouponDraft, step]);

  const handleSelectProofFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    Message.success(`已选择凭证：${file.name}`);
    event.target.value = '';
  };

  const getSelectedExistingPaymentMethod = (): BillingOrder['paymentMethod'] =>
    paymentMode === 'bank_transfer' ? 'bank_transfer' : scanChannel;

  const syncExistingOrderPaymentMethod = async () => {
    if (!existingPaymentOrder) return undefined;
    const nextPaymentMethod = getSelectedExistingPaymentMethod();
    if (existingPaymentOrder.paymentMethod === nextPaymentMethod) return existingPaymentOrder;
    const nextOrder = await mockApi.updateTenantPendingOrderPaymentMethod(existingPaymentOrder.id, nextPaymentMethod);
    if (!nextOrder) {
      Message.error('订单状态已变化，无法切换支付方式');
      return undefined;
    }
    setExistingPaymentOrder(nextOrder);
    return nextOrder;
  };

  const handleCompleteExistingOrderPayment = async () => {
    if (!existingPaymentOrder || getSelectedExistingPaymentMethod() === 'bank_transfer') return;
    setSubmitting(true);
    try {
      const payableOrder = await syncExistingOrderPaymentMethod();
      if (!payableOrder) return;
      const nextOrder = await mockApi.completeTenantElectronicPayment(payableOrder.id);
      if (!nextOrder) {
        Message.error('订单已超时取消，无法继续支付');
        return;
      }
      if (nextOrder) setExistingPaymentOrder(nextOrder);
      setFinishText('扫码支付已完成，订单已进入开通流程');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExistingOrderProof = async () => {
    if (!existingPaymentOrder || getSelectedExistingPaymentMethod() !== 'bank_transfer') return;
    if (!proofName.trim()) {
      Message.warning('请输入付款凭证文件名');
      return;
    }
    setSubmitting(true);
    try {
      const payableOrder = await syncExistingOrderPaymentMethod();
      if (!payableOrder) return;
      const result = await mockApi.submitTenantBankTransferProof(payableOrder.id, {
        proofName: proofName.trim(),
        uploadedAmount,
      });
      if (!result?.order) {
        Message.error('订单已超时取消，无法提交凭证');
        return;
      }
      setExistingPaymentOrder(result.order);
      setFinishText('对公付款凭证已提交，等待官方审核确认');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  if (existingOrderId) {
    if (existingPaymentLoading) {
      return (
        <div className="payment-flow">
          <div className="payment-empty">
            <Empty description="正在加载待支付订单" />
          </div>
        </div>
      );
    }

    if (existingPaymentMissing || !existingPaymentOrder) {
      return (
        <div className="payment-flow">
          <div className="payment-empty">
            <Empty description="未找到该订单" />
            <Button type="primary" onClick={() => navigate('/tenant/billing')}>返回购买与账单</Button>
          </div>
        </div>
      );
    }

    const existingBundleLines = existingPaymentOrder.bundleLines ?? [];
    const existingOrderSummary = orderSummaryLabel(existingPaymentOrder.orderType || '席位订阅', existingBundleLines);
    const existingBundleDetailLines = existingBundleLines.length
      ? orderBundleDetailLines(existingBundleLines)
      : [existingOrderSummary];
    const isExistingOrderPending = existingPaymentOrder.status === 'pending';
    const selectedExistingPaymentMethod = getSelectedExistingPaymentMethod();
    const isExistingBankTransfer = selectedExistingPaymentMethod === 'bank_transfer';
    const existingPaymentMethodText = selectedExistingPaymentMethod === 'bank_transfer'
      ? '对公转账'
      : selectedExistingPaymentMethod === 'alipay' ? '支付宝扫码' : '微信扫码';

    return (
      <div className="payment-flow">
        <Steps current={step + 1} className="payment-steps">
          <Step title="确认订单信息" />
          <Step title="提交支付信息" />
          <Step title="支付完成" />
        </Steps>

        {step !== 2 && isExistingOrderPending ? (
          <div className="payment-submit-shell">
            <div className="payment-deadline-alert">{paymentDeadlineText(existingPaymentOrder.paymentExpiresAt)}，超时订单会自动取消。</div>
            <Row gutter={24} className="payment-submit-layout">
              <Col span={13}>
                <div className="payment-payable">
                  <div className="payment-section__title">待支付金额</div>
                  <Title heading={1}>{money(existingPaymentOrder.amount)}</Title>
                  <div className="payment-payable__summary">
                    <Text type="secondary">订单号：{existingPaymentOrder.id}</Text>
                    <Text type="secondary">原价金额：{money(existingPaymentOrder.originalAmount ?? existingPaymentOrder.amount)}</Text>
                    {existingPaymentOrder.priceAdjustment ? (
                      <Text type="secondary">人工调价：{priceAdjustmentText(existingPaymentOrder)}</Text>
                    ) : null}
                    <Text type="secondary">支付方式：{existingPaymentMethodText}</Text>
                  </div>
                </div>
                <div className="payment-detail">
                  <div className="payment-section__title">支付明细 <Tag size="small">{existingBundleDetailLines.length}</Tag></div>
                  <Title heading={6}>{existingOrderSummary}</Title>
                  <Descriptions
                    column={1}
                    data={[
                      { label: '订单内容', value: existingOrderSummary },
                      { label: '购买内容', value: existingBundleDetailLines.map((line) => <div key={line}>{line}</div>) },
                      ...(existingPaymentOrder.priceAdjustment
                        ? [{ label: '人工调价', value: `${priceAdjustmentText(existingPaymentOrder)}；原因：${existingPaymentOrder.priceAdjustment.reason}` }]
                        : []),
                      { label: '应付金额', value: money(existingPaymentOrder.amount) },
                    ]}
                  />
                </div>
              </Col>
              <Col span={11}>
                <Card className="payment-method-card" bordered>
                  <Title heading={6}>支付方式</Title>
                  <Radio.Group
                    value={selectedExistingPaymentMethod}
                    onChange={(value) => {
                      const nextPaymentMethod = value as BillingOrder['paymentMethod'];
                      if (nextPaymentMethod === 'bank_transfer') {
                        setPaymentMode('bank_transfer');
                        setProofName((current) => current || `proof_${existingPaymentOrder.id}.png`);
                      } else {
                        setPaymentMode('scan');
                        setScanChannel(nextPaymentMethod);
                      }
                    }}
                    direction="vertical"
                    className="payment-method-list"
                  >
                    <Radio value="wechat">
                      <div className="payment-method-row">
                        <span>微信扫码</span>
                        {selectedExistingPaymentMethod === 'wechat' ? <strong>{money(existingPaymentOrder.amount)}</strong> : null}
                      </div>
                    </Radio>
                    <Radio value="alipay">
                      <div className="payment-method-row">
                        <span>支付宝扫码</span>
                        {selectedExistingPaymentMethod === 'alipay' ? <strong>{money(existingPaymentOrder.amount)}</strong> : null}
                      </div>
                    </Radio>
                    <Radio value="bank_transfer">
                      <div className="payment-method-row">
                        <span>对公转账</span>
                        {selectedExistingPaymentMethod === 'bank_transfer' ? <strong>{money(existingPaymentOrder.amount)}</strong> : null}
                      </div>
                    </Radio>
                  </Radio.Group>

                  {isExistingBankTransfer ? (
                    <div className="payment-method-body">
                      <Descriptions
                        column={1}
                        data={[
                          { label: '收款主体', value: BANK_TRANSFER_PAYEE },
                          { label: '开户银行', value: BANK_TRANSFER_BANK },
                          { label: '银行账号', value: BANK_TRANSFER_ACCOUNT },
                          { label: '订单金额', value: money(existingPaymentOrder.amount) },
                        ]}
                      />
                      <div className="payment-proof-panel">
                        <Text className="field-label">上传支付凭证</Text>
                        <input
                          ref={proofInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={handleSelectProofFile}
                        />
                        <Space direction="vertical" size={8} className="full-width">
                          <Button icon={<IconUpload />} onClick={() => proofInputRef.current?.click()}>上传支付凭证</Button>
                          <Input value={proofName} onChange={setProofName} placeholder="例如 bank-proof.png" />
                        </Space>
                        <Text className="field-label">客户填写到账金额</Text>
                        <InputNumber value={uploadedAmount} onChange={(value) => setUploadedAmount(Number(value) || 0)} min={0} className="full-width" />
                        <Button long type="primary" loading={submitting} onClick={handleSubmitExistingOrderProof}>提交付款凭证</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="payment-method-body">
                      <div className="electronic-payment-panel electronic-payment-panel--stacked">
                        <div className="electronic-payment-qr">
                          <span>{selectedExistingPaymentMethod === 'alipay' ? '支付宝付款码' : '微信付款码'}</span>
                          <small>{selectedExistingPaymentMethod === 'alipay' ? '支付宝' : '微信'}支付码 {existingPaymentOrder.id} · {money(existingPaymentOrder.amount)}</small>
                        </div>
                        <Text type="secondary">打开{selectedExistingPaymentMethod === 'alipay' ? '支付宝' : '微信'}扫码支付</Text>
                        <Button type="primary" loading={submitting} onClick={handleCompleteExistingOrderPayment}>
                          {existingPaymentOrder.amount === 0 ? '确认订单' : '模拟支付成功'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ) : null}

        {step !== 2 && !isExistingOrderPending ? (
          <div className="payment-empty">
            <Empty description="该订单当前无需支付" />
            <Button type="primary" onClick={() => navigate('/tenant/billing')}>返回购买与账单</Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="payment-done">
            <IconCheckCircle />
            <Title heading={3}>{finishText}</Title>
            <Text type="secondary">席位类订单支付确认后会生成开通类交付工单，可在订单跟进中查看订单状态。</Text>
            <Space>
              <Button type="primary" onClick={() => navigate('/tenant/billing')}>查看购买与账单</Button>
              <Button onClick={() => navigate('/tenant/claws')}>返回 Claw 列表</Button>
            </Space>
          </div>
        ) : null}
      </div>
    );
  }

  if (!purchaseDraft) {
    return (
      <div className="payment-flow">
        <div className="payment-empty">
          <Empty description="暂无待支付订单" />
          <Button type="primary" onClick={() => navigate('/tenant/purchase')}>返回购买席位</Button>
        </div>
      </div>
    );
  }

  const isSalesCouponPayment = Boolean(salesCouponDraft);
  const payableAmount = TENANT_COUPON_FEATURE_ENABLED || isSalesCouponPayment ? amountBreakdown?.payableAmount ?? purchaseDraft.amount : purchaseDraft.amount;
  const couponDiscountAmount = TENANT_COUPON_FEATURE_ENABLED || isSalesCouponPayment ? amountBreakdown?.couponDiscountAmount ?? 0 : 0;
  const selectedCoupon = TENANT_COUPON_FEATURE_ENABLED
    ? availableCoupons.find((item) => item.id === amountBreakdown?.couponId)
    : undefined;
  const bundleLines = buildBundleLinesFromDraft(purchaseDraft);
  const couponOptions = availableCoupons
    .map((coupon) => ({
      coupon,
      discountAmount: calculateCouponPreviewDiscount(coupon, purchaseDraft.amount, bundleLines),
      eligibleAmount: getEligibleAmountByScope(purchaseDraft.amount, coupon.discountScope, bundleLines),
    }))
    .filter((item) => item.discountAmount > 0)
    .sort((left, right) => right.discountAmount - left.discountAmount);
  const hasUsableCoupon = TENANT_COUPON_FEATURE_ENABLED && couponOptions.length > 0;
  const orderSummary = orderSummaryLabel(purchaseDraft.orderType, bundleLines);
  const bundleDetailLines = orderBundleDetailLines(bundleLines);
  const appliedScope = TENANT_COUPON_FEATURE_ENABLED ? amountBreakdown?.discountScope ?? selectedCoupon?.discountScope ?? 'order' : 'order';
  const eligibleAmount = amountBreakdown?.eligibleAmount ?? getEligibleAmountByScope(purchaseDraft.amount, appliedScope, bundleLines);
  const eligibleLineIds = bundleLines
    .filter((line) => appliedScope === 'order' || line.productType === appliedScope)
    .map((line) => line.id);
  let remainingCouponDiscount = couponDiscountAmount;
  const orderRows = bundleLines.map((line, index) => {
    const isEligibleLine = eligibleLineIds.includes(line.id);
    const isLastEligibleLine = eligibleLineIds[eligibleLineIds.length - 1] === line.id;
    const couponOffset = isEligibleLine && couponDiscountAmount && eligibleAmount
      ? Math.min(line.amount, isLastEligibleLine
        ? remainingCouponDiscount
        : Math.round((couponDiscountAmount * line.amount) / eligibleAmount))
      : 0;
    remainingCouponDiscount -= couponOffset;
    return {
      id: `${line.id}-${index}`,
      orderType: line.specLabel ?? purchaseDraft.orderAction ?? '新增',
      product: line.productType === 'coding_plan' ? 'CodingPlan' : 'ArkClaw 企业版',
      config: bundleDetailLines[index] ?? line.productName,
      paymentType: '预付费',
      cycle: purchaseDraft.orderAction === '变更' ? '按本次变更计费' : `${purchaseDraft.cycleMonths} 个月`,
      count: `${line.quantity}${line.unit}`,
      originalAmount: line.amount,
      payableAmount: Math.max(line.amount - couponOffset, 0),
    };
  });

  const detailTitle = purchaseDraft.orderAction === '变更' ? 'ArkClaw 企业版变更订单' : 'ArkClaw 企业版新增订单';
  const detailTag = purchaseDraft.orderAction ?? '新增';
  const detailDescriptions = purchaseDraft.orderAction === '变更'
    ? [
        { label: '订单内容', value: orderSummary },
        { label: '变更席位', value: `${purchaseDraft.seats}` },
        { label: '计费方式', value: '按本次变更计费' },
        { label: '应付金额', value: money(payableAmount) },
      ]
    : [
        { label: '订单内容', value: orderSummary },
        { label: '购买时长', value: `${purchaseDraft.cycleMonths} 个月` },
        { label: '数量', value: purchaseDraft.seats },
        { label: '应付金额', value: money(payableAmount) },
      ];

  const handleSubmitBankTransferProof = async () => {
    if (!draftOrder) {
      Message.warning('对公转账订单生成中，请稍后');
      return;
    }
    if (!proofName.trim()) {
      Message.warning('请输入付款凭证文件名');
      return;
    }
    setSubmitting(true);
    if (salesCouponDraft) {
      const result = await mockApi.submitSalesAssistedBankTransferProof(draftOrder.orderId, {
        proofName: proofName.trim(),
        uploadedAmount,
      });
      if (!result) {
        Message.error('订单已超时取消，无法提交凭证');
        setSubmitting(false);
        return;
      }
    } else {
      const result = await mockApi.submitTenantBankTransferProof(draftOrder.orderId, {
        proofName: proofName.trim(),
        uploadedAmount,
      });
      if (!result) {
        Message.error('订单已超时取消，无法提交凭证');
        setSubmitting(false);
        return;
      }
    }
    setFinishText(salesCouponDraft ? '对公付款凭证已提交，可在销售订单跟进中查看审核状态' : '对公付款凭证已提交，等待官方审核确认');
    setStep(2);
    setSubmitting(false);
  };

  const handleGenerateSalesPaymentMethod = async () => {
    if (!salesCouponDraft) return;
    if (!couponDiscountAmount) {
      Message.warning('当前优惠券不可用，请返回调整套餐');
      return;
    }
    const orderKey = `${salesCouponDraft.orderType}-${salesCouponDraft.amount}-${salesCouponDraft.poolId}-${paymentMode}`;
    setSubmitting(true);
    try {
      if (paymentMode === 'scan') {
        const result = await mockApi.createSalesAssistedElectronicPaymentOrder({
          tenantId: salesCouponDraft.tenantId,
          poolId: salesCouponDraft.poolId,
          orderType: salesCouponDraft.orderType,
          amount: salesCouponDraft.amount,
          paymentMethod: 'wechat',
          bundleLines: buildBundleLinesFromDraft(salesCouponDraft),
        });
        if (!result) {
          Message.error('创建订单失败，请检查优惠券是否仍可用');
          return;
        }
        scanOrderKeyRef.current = orderKey;
        setElectronicOrder({
          orderId: result.orderId,
          amount: result.amount,
          paymentMethod: result.paymentMethod === 'alipay' ? 'alipay' : 'wechat',
          qrCodeLabel: result.qrCodeLabel ?? `微信支付码 ${result.orderId}`,
          paymentExpiresAt: result.order.paymentExpiresAt,
        });
        setDraftOrder(undefined);
        setStep(2);
        return;
      }

      const result = await mockApi.createSalesAssistedBankTransferOrder({
        tenantId: salesCouponDraft.tenantId,
        poolId: salesCouponDraft.poolId,
        orderType: salesCouponDraft.orderType,
        amount: salesCouponDraft.amount,
        bundleLines: buildBundleLinesFromDraft(salesCouponDraft),
      });
      if (!result) {
        Message.error('创建订单失败，请检查优惠券是否仍可用');
        return;
      }
      bankOrderKeyRef.current = orderKey;
      setDraftOrder({ orderId: result.orderId, amount: result.amount, paymentExpiresAt: result.order.paymentExpiresAt });
      setElectronicOrder(undefined);
      setUploadedAmount(result.amount);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteScanPayment = async () => {
    if (!electronicOrder) {
      Message.warning('扫码支付订单生成中，请稍后');
      return;
    }
    setSubmitting(true);
    const result = await mockApi.completeTenantElectronicPayment(electronicOrder.orderId);
    if (!result) {
      Message.error('订单已超时取消，无法继续支付');
      setSubmitting(false);
      return;
    }
    setFinishText(salesCouponDraft ? '扫码支付已完成，可在销售订单跟进中查看开通进度' : '扫码支付已完成，订单已进入开通流程');
    setStep(2);
    setSubmitting(false);
  };

  const copyText = async (text: string, label = '内容') => {
    try {
      await navigator.clipboard.writeText(text);
      Message.success(`${label}已复制`);
    } catch {
      Message.error('复制失败，请手动复制');
    }
  };

  const savePaymentCode = () => {
    if (!salesCouponDraft || !electronicOrder) return;
    const content = [
      `客户：${salesCouponDraft.tenantName}`,
      `订单号：${electronicOrder.orderId}`,
      `金额：${money(electronicOrder.amount)}`,
      `付款码：${electronicOrder.qrCodeLabel}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-code-${electronicOrder.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    Message.success('付款码已保存');
  };

  const finishPrimaryPath = salesCouponDraft?.sourcePath ?? '/tenant/billing';
  const finishPrimaryLabel = salesCouponDraft ? '返回销售优惠券' : '查看购买与账单';
  const finishSecondaryPath = salesCouponDraft ? '/sales/opening-tasks' : '/tenant/claws';
  const finishSecondaryLabel = salesCouponDraft ? '查看订单跟进' : '返回 Claw 列表';
  const salesScanPaymentText = salesCouponDraft && electronicOrder
    ? [
        `客户：${salesCouponDraft.tenantName}`,
        `订单号：${electronicOrder.orderId}`,
        `金额：${money(electronicOrder.amount)}`,
        `付款码：${electronicOrder.qrCodeLabel}`,
      ].join('\n')
    : '';
  const salesTransferText = salesCouponDraft && draftOrder
    ? [
        `客户：${salesCouponDraft.tenantName}`,
        `订单号：${draftOrder.orderId}`,
        `收款主体：${BANK_TRANSFER_PAYEE}`,
        `开户银行：${BANK_TRANSFER_BANK}`,
        `银行账号：${BANK_TRANSFER_ACCOUNT}`,
        `转账金额：${money(draftOrder.amount)}`,
      ].join('\n')
    : '';

  return (
    <div className="payment-flow">
      <Steps current={step + 1} className="payment-steps">
        <Step title="确认订单信息" />
        <Step title="提交支付信息" />
        <Step title={salesCouponDraft ? '生成付款方式' : '支付完成'} />
      </Steps>

      {step === 0 ? (
        <>
          {salesCouponDraft ? (
            <section className="payment-section">
              <div className="payment-section__title">销售代客户下单</div>
              <Descriptions
                column={3}
                data={[
                  { label: '客户', value: salesCouponDraft.tenantName },
                  { label: '优惠券', value: salesCouponDraft.poolName },
                  { label: '本次抵扣', value: couponDiscountAmount ? `-${money(couponDiscountAmount)}` : '不可用' },
                ]}
              />
            </section>
          ) : null}
          <section className="payment-section">
            <div className="payment-section__title">参数配置</div>
            <Table
              rowKey="id"
              pagination={false}
              data={orderRows}
              columns={[
                { title: '订单类型', render: () => orderSummary },
                { title: '产品', dataIndex: 'product' },
                { title: '配置详情', dataIndex: 'config' },
                { title: '付款方式', dataIndex: 'paymentType' },
                { title: '购买时长', dataIndex: 'cycle' },
                { title: '数量', dataIndex: 'count' },
                { title: '原价金额', dataIndex: 'originalAmount', render: (value: number) => `¥${value.toLocaleString()}` },
                { title: '应付金额', dataIndex: 'payableAmount', render: (value: number) => `¥${value.toLocaleString()}` },
              ]}
            />
          </section>
          {(TENANT_COUPON_FEATURE_ENABLED || salesCouponDraft) ? <section className="payment-section">
            <div className="payment-section__title">优惠抵扣</div>
            {salesCouponDraft ? (
              <Card bordered className="payment-coupon-card payment-coupon-card--plain">
                <Space direction="vertical" size={6}>
                  <strong>{salesCouponDraft.poolName}</strong>
                  <Text type="secondary">销售代客户使用优惠券，本单预计抵扣 {money(couponDiscountAmount)}</Text>
                  {amountBreakdown?.eligibleAmount ? <Text type="secondary">优惠范围：{couponDiscountScopeLabel(amountBreakdown.discountScope)} / 可优惠 {money(amountBreakdown.eligibleAmount)}</Text> : null}
                </Space>
              </Card>
            ) : hasUsableCoupon ? (
              <Radio.Group value={couponSelection} onChange={(value) => setCouponSelection(value as CouponSelection)} className="payment-coupon-list">
                {couponOptions.map(({ coupon, discountAmount, eligibleAmount }) => (
                  <Radio key={coupon.id} value={coupon.id} className="payment-coupon-option">
                    <div className="payment-coupon-card">
                      <div className="payment-coupon-card__main">
                        <div className="payment-coupon-card__discount">
                          <span>{couponRuleLabel(coupon.discountRate)}</span>
                        </div>
                        <div className="payment-coupon-card__content">
                          <strong>{coupon.name}</strong>
                          <Text type="secondary">{coupon.id}</Text>
                          <div className="payment-coupon-card__tags">
                            <Tag size="small" color={isVoucherCoupon(coupon) ? 'arcoblue' : 'purple'} bordered={false}>{couponBenefitTypeLabel(coupon)}</Tag>
                            <Tag size="small" color="green" bordered={false}>{couponDiscountScopeLabel(coupon.discountScope)}</Tag>
                            <Tag size="small" color="arcoblue" bordered={false}>{coupon.thresholdRule ?? '满 ¥0.00 可用'}</Tag>
                            {isVoucherCoupon(coupon) ? <Tag size="small" bordered={false}>余额 {money(coupon.remainingDiscountQuota)}</Tag> : <Tag size="small" bordered={false}>单次使用</Tag>}
                            <Tag size="small" bordered={false}>可优惠 {money(eligibleAmount)}</Tag>
                          </div>
                        </div>
                      </div>
                      <div className="payment-coupon-card__amount">
                        <Text type="secondary">本单预计抵扣</Text>
                        <strong>-{money(discountAmount)}</strong>
                        <Text type="secondary">{coupon.effectiveAt} - {coupon.expiresAt}</Text>
                      </div>
                    </div>
                  </Radio>
                ))}
                <Radio value="none" className="payment-coupon-option">
                  <div className="payment-coupon-card payment-coupon-card--plain">
                    <div className="payment-coupon-card__main">
                      <strong>本单不使用券</strong>
                      <Text type="secondary">按套餐原价支付</Text>
                    </div>
                  </div>
                </Radio>
              </Radio.Group>
            ) : (
              <div className="payment-coupon-empty">
                <Empty description="无可用券" />
              </div>
            )}
          </section> : null}
          <footer className="payment-footer">
            <Space>
              <Text>应付金额</Text>
              <strong>{money(payableAmount)}</strong>
              {couponDiscountAmount ? <Text type="secondary">已抵扣 {money(couponDiscountAmount)}</Text> : null}
              {couponDiscountAmount ? <Text type="secondary">优惠范围：{couponDiscountScopeLabel(appliedScope)}，可优惠金额 {money(eligibleAmount)}</Text> : null}
              <Text type="secondary">{purchaseDraft.orderAction === '变更' ? '本次按变更规则计费' : `购买时长：${purchaseDraft.cycleMonths} 个月`}</Text>
            </Space>
            <Button type="primary" disabled={Boolean(salesCouponDraft && !couponDiscountAmount)} onClick={() => setStep(1)}>下一步</Button>
          </footer>
        </>
      ) : null}

      {step === 1 ? (
        <div className="payment-submit-shell">
          <div className="payment-deadline-alert">{paymentDeadlineText(electronicOrder?.paymentExpiresAt ?? draftOrder?.paymentExpiresAt)}，超时订单会自动取消。</div>
          <Row gutter={24} className="payment-submit-layout">
            <Col span={13}>
              <div className="payment-payable">
                <div className="payment-section__title">待支付金额</div>
                <Title heading={1}>{money(payableAmount)}</Title>
                <div className="payment-payable__summary">
                  <Text type="secondary">原价金额：{money(purchaseDraft.amount)}</Text>
                  {(TENANT_COUPON_FEATURE_ENABLED || salesCouponDraft) ? <Text type="secondary">券抵扣：{money(couponDiscountAmount)}</Text> : null}
                  {(TENANT_COUPON_FEATURE_ENABLED || salesCouponDraft) && couponDiscountAmount ? <Text type="secondary">优惠范围：{couponDiscountScopeLabel(appliedScope)} / 可优惠 {money(eligibleAmount)}</Text> : null}
                </div>
                {salesCouponDraft ? <Text type="secondary" className="payment-payable__selected">客户：{salesCouponDraft.tenantName} / 优惠券：{salesCouponDraft.poolName}</Text> : null}
                {TENANT_COUPON_FEATURE_ENABLED && selectedCoupon && couponSelection !== 'none' ? (
                  <Text type="secondary" className="payment-payable__selected">已选择：{selectedCoupon.name}（{selectedCoupon.id}）</Text>
                ) : null}
              </div>
              <div className="payment-detail">
                <div className="payment-section__title">支付明细 <Tag size="small">{purchaseDraft.lines.length}</Tag></div>
                <Title heading={6}>{detailTitle} <Tag>{detailTag}</Tag></Title>
                <Descriptions column={1} data={detailDescriptions} />
              </div>
            </Col>
            <Col span={11}>
              <Card className="payment-method-card" bordered>
                <Title heading={6}>选择支付方式</Title>
                <Radio.Group value={paymentMode} onChange={(value) => setPaymentMode(value as PaymentMode)} direction="vertical" className="payment-method-list">
                  <Radio value="scan">
                    <div className="payment-method-row">
                      <span>扫码支付</span>
                      {paymentMode === 'scan' ? <strong>{money(payableAmount)}</strong> : null}
                    </div>
                  </Radio>
                  <Radio value="bank_transfer">
                    <div className="payment-method-row">
                      <span>对公转账</span>
                      {paymentMode === 'bank_transfer' ? <strong>{money(payableAmount)}</strong> : null}
                    </div>
                  </Radio>
                </Radio.Group>

                {paymentMode === 'scan' ? (
                  <div className="payment-method-body">
                    {salesCouponDraft ? (
                      <div className="electronic-payment-panel electronic-payment-panel--stacked">
                        <div className="electronic-payment-qr">
                          <span>付款码</span>
                          <small>点击后生成客户可扫码支付的付款码</small>
                        </div>
                        <Text type="secondary">生成后可复制或保存给客户，不会直接标记为支付完成。</Text>
                        <Button type="primary" loading={submitting} onClick={handleGenerateSalesPaymentMethod}>生成付款码</Button>
                      </div>
                    ) : (
                      <div className="electronic-payment-panel electronic-payment-panel--stacked">
                        <div className="electronic-payment-qr">
                          <span>扫码支付</span>
                          <small>{electronicOrder?.qrCodeLabel ?? '微信 / 支付宝支付码生成中'}</small>
                        </div>
                        <Text type="secondary">打开微信或支付宝扫码支付</Text>
                        <Button type="primary" loading={submitting} onClick={handleCompleteScanPayment}>模拟支付成功</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="payment-method-body">
                    <Descriptions
                      column={1}
                      data={[
                        { label: '收款主体', value: BANK_TRANSFER_PAYEE },
                        { label: '开户银行', value: BANK_TRANSFER_BANK },
                        { label: '银行账号', value: BANK_TRANSFER_ACCOUNT },
                        { label: '订单金额', value: money(payableAmount) },
                      ]}
                    />
                    {salesCouponDraft ? (
                      <Button long type="primary" loading={submitting} onClick={handleGenerateSalesPaymentMethod}>生成付款讯息</Button>
                    ) : (
                      <div className="payment-proof-panel">
                        <Text className="field-label">上传支付凭证</Text>
                        <input
                          ref={proofInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={handleSelectProofFile}
                          disabled={!draftOrder}
                        />
                        <Space direction="vertical" size={8} className="full-width">
                          <Button icon={<IconUpload />} onClick={() => proofInputRef.current?.click()} disabled={!draftOrder}>上传支付凭证</Button>
                          <Input value={proofName} onChange={setProofName} placeholder="例如 bank-proof.png" disabled={!draftOrder} />
                        </Space>
                        <Text className="field-label">客户填写到账金额</Text>
                        <InputNumber value={uploadedAmount} onChange={(value) => setUploadedAmount(Number(value) || 0)} min={0} className="full-width" disabled={!draftOrder} />
                        <Button long type="primary" loading={submitting} disabled={!draftOrder} onClick={handleSubmitBankTransferProof}>提交付款凭证</Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ) : null}

      {step === 2 && salesCouponDraft ? (
        <div className="payment-generated-method">
          <Title heading={3}>生成付款方式</Title>
          <Text type="secondary">将以下付款方式复制或保存给客户，客户完成付款后可在订单跟进中继续处理。</Text>
          {paymentMode === 'scan' && electronicOrder ? (
            <Card bordered className="payment-generated-method__card">
              <Space direction="vertical" size={14} className="full-width">
                <Descriptions
                  column={1}
                  data={[
                    { label: '客户', value: salesCouponDraft.tenantName },
                    { label: '订单号', value: electronicOrder.orderId },
                    { label: '金额', value: money(electronicOrder.amount) },
                    { label: '付款码', value: electronicOrder.qrCodeLabel },
                  ]}
                />
                <div className="electronic-payment-panel electronic-payment-panel--stacked">
                  <div className="electronic-payment-qr">
                    <span>{electronicOrder.paymentMethod === 'alipay' ? '支付宝' : '微信'}付款码</span>
                    <small>{electronicOrder.qrCodeLabel} · {money(electronicOrder.amount)}</small>
                  </div>
                </div>
                <Space>
                  <Button icon={<IconCopy />} onClick={() => copyText(salesScanPaymentText, '付款信息')}>复制给客户</Button>
                  <Button icon={<IconDownload />} onClick={savePaymentCode}>保存付款码</Button>
                </Space>
              </Space>
            </Card>
          ) : null}
          {paymentMode === 'bank_transfer' && draftOrder ? (
            <Card bordered className="payment-generated-method__card">
              <Space direction="vertical" size={14} className="full-width">
                <Descriptions
                  column={1}
                  data={[
                    { label: '客户', value: salesCouponDraft.tenantName },
                    { label: '订单号', value: draftOrder.orderId },
                    { label: '收款主体', value: BANK_TRANSFER_PAYEE },
                    { label: '开户银行', value: BANK_TRANSFER_BANK },
                    { label: '银行账号', value: BANK_TRANSFER_ACCOUNT },
                    { label: '转账金额', value: money(draftOrder.amount) },
                  ]}
                />
                <Button icon={<IconCopy />} onClick={() => copyText(salesTransferText, '转账信息')}>复制转账信息</Button>
              </Space>
            </Card>
          ) : null}
          <Space>
            <Button type="primary" onClick={() => navigate(finishPrimaryPath)}>{finishPrimaryLabel}</Button>
            <Button onClick={() => navigate(finishSecondaryPath)}>{finishSecondaryLabel}</Button>
          </Space>
        </div>
      ) : null}

      {step === 2 && !salesCouponDraft ? (
        <div className="payment-done">
          <IconCheckCircle />
          <Title heading={3}>{finishText}</Title>
          <Text type="secondary">席位类订单支付确认后会生成开通类交付工单，可在订单跟进中查看订单状态。</Text>
          <Space>
            <Button type="primary" onClick={() => navigate(finishPrimaryPath)}>{finishPrimaryLabel}</Button>
            <Button onClick={() => navigate(finishSecondaryPath)}>{finishSecondaryLabel}</Button>
          </Space>
        </div>
      ) : null}
    </div>
  );
}
