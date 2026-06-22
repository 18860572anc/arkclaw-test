import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Descriptions, Message, Modal, Select, Space, Tag, Typography } from '@arco-design/web-react';
import { IconCheckCircle, IconLeft } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import { BillingGuideContent } from './TenantHelpPages';
import type { AdminPlanRecord, AdminTenantListItem, BillingOrder, SalesCouponPoolRecord } from '../../types/domain';

const { Title, Text } = Typography;
const PURCHASE_DRAFT_STORAGE_KEY = 'arkclaw_purchase_draft';
const SALES_COUPON_PURCHASE_DRAFT_KEY = 'arkclaw_sales_coupon_purchase_draft';

type PurchaseCycle = '1' | '3' | '12';
type PurchasePlanKey = string;

interface PurchasePlan {
  key: PurchasePlanKey;
  cnName: string;
  enName: string;
  price: number;
  priceQuarter?: number;
  priceYear?: number;
  tags: string[];
  bindLabel?: string;
  bindPrice?: number;
  specs: Array<{ label: string; value: string }>;
}

export interface PurchaseDraft {
  type: BillingOrder['type'];
  orderAction?: string;
  orderType: string;
  amount: number;
  cycleMonths: number;
  seats: number;
  lines: Array<{
    plan: string;
    count: number;
    bindCodingPlan: boolean;
    codingPlanName?: string;
    action?: string;
    amount?: number;
    unitLabel?: string;
    summary?: string;
  }>;
}

const purchasePlanCatalog: Record<string, Omit<PurchasePlan, 'price' | 'priceQuarter' | 'priceYear'>> = {
  轻量版: {
    key: 'lite',
    cnName: '轻量版',
    enName: 'Starter',
    tags: ['简单测试场景'],
    bindLabel: '绑定 CodingPlan Team Lite',
    bindPrice: 120,
    specs: [
      { label: '基础算力', value: '2 核 CPU | 4 GiB 运行内存' },
      { label: '60 GiB', value: '持久存储云盘空间' },
      { label: '企业网盘', value: '10 GB 空间配额，支持文件快传' },
      { label: '基础防护', value: '模型安全防火墙' },
      { label: 'IM 对接', value: '支持飞书、企微、钉钉登录' },
      { label: 'Skill 生成', value: '自然语言生成 Skill' },
    ],
  },
  标准版: {
    key: 'standard',
    cnName: '标准版',
    enName: 'Standard',
    tags: ['自动化办公场景', '流程审批场景', '知识检索场景'],
    bindLabel: '绑定 CodingPlan Team Lite',
    bindPrice: 120,
    specs: [
      { label: '基础算力', value: '4 核 CPU | 8 GiB 运行内存' },
      { label: '80 GiB', value: '持久存储云盘空间' },
      { label: '企业网盘', value: '20 GB 空间配额，支持文件快传' },
      { label: '进阶防控', value: 'Skills 风险扫描、防数据泄露' },
      { label: '企业对接', value: '企业 AD 体系打通' },
      { label: '网络互通', value: '打通出/入向企业私网，安全访问企业内部服务' },
      { label: '模型管理', value: '灵活切换，支持 Tokens 消耗管理' },
    ],
  },
  高级版: {
    key: 'pro',
    cnName: '高级版',
    enName: 'Premium',
    tags: ['大规模数据处理', '长文本解析', '视觉识别'],
    bindLabel: '绑定 CodingPlan Team Pro',
    bindPrice: 600,
    specs: [
      { label: '基础算力', value: '8 核 CPU | 16 GiB 运行内存' },
      { label: '160 GiB', value: '持久存储云盘空间' },
      { label: '企业网盘', value: '40 GB 空间配额，支持文件快传' },
      { label: '高阶防护', value: '零信任鉴权、Claw 安全可控' },
      { label: 'Skill 管理', value: '企业私有仓库，支持 Skill 录制 & 定制推荐' },
      { label: 'Claw Team', value: '群样式任务执行' },
      { label: '记忆管理', value: '个人、企业两级记忆隔离管理' },
      { label: '资源节省', value: '智能节省模型 Token 消耗' },
    ],
  },
  旗舰版: {
    key: 'ultimate',
    cnName: '旗舰版',
    enName: 'Ultimate',
    tags: ['多模态处理', '多智能体协同', '复杂循环任务'],
    bindLabel: '绑定 CodingPlan Team Pro',
    bindPrice: 600,
    specs: [
      { label: '基础算力', value: '16 核 CPU | 32 GiB 运行内存' },
      { label: '160 GiB', value: '持久存储云盘空间' },
      { label: '企业网盘', value: '80 GB 空间配额，支持文件快传' },
      { label: '企业安全', value: '访问监控审计' },
      { label: 'Skill 生态', value: '技能注册发现' },
      { label: '应用管理', value: '数字员工工厂，快速克隆' },
      { label: '免运维', value: '龙舟自动升级' },
      { label: '多模式切换', value: '问答/助理/Agent 自动切换' },
      { label: '多系统扩展', value: 'XUA 支持，多系统自动化扩展' },
    ],
  },
};

const purchasePlanOrder = ['轻量版', '标准版', '高级版', '旗舰版'];
const fallbackCodingPlanPrices: Record<string, number> = {
  'CodingPlan Team Lite': 120,
  'CodingPlan Team Pro': 600,
};

const fallbackPlans: PurchasePlan[] = purchasePlanOrder.map((name) => ({
  ...purchasePlanCatalog[name],
  key: purchasePlanCatalog[name].key,
  price: ({ 轻量版: 210, 标准版: 430, 高级版: 860, 旗舰版: 1720 } as Record<string, number>)[name],
  bindPrice: purchasePlanCatalog[name].bindLabel
    ? fallbackCodingPlanPrices[purchasePlanCatalog[name].bindLabel.replace('绑定 ', '')]
    : undefined,
}));

const toPurchasePlan = (record: AdminPlanRecord, codingPlanPrices: Record<string, number>): PurchasePlan | null => {
  const meta = purchasePlanCatalog[record.name];
  if (!meta || record.productType !== 'seat_sub' || record.status !== 'published') return null;
  const bindName = meta.bindLabel?.replace('绑定 ', '');
  return {
    ...meta,
    key: meta.key,
    price: record.priceMonth ?? 0,
    priceQuarter: record.priceQuarter,
    priceYear: record.priceYear,
    bindPrice: bindName ? codingPlanPrices[bindName] ?? meta.bindPrice : undefined,
  };
};

const getCyclePrice = (plan: PurchasePlan, cycle: PurchaseCycle) => {
  if (cycle === '3') return plan.priceQuarter ?? plan.price * 3;
  if (cycle === '12') return plan.priceYear ?? plan.price * 12;
  return plan.price;
};

export default function PurchasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [salesCouponPool, setSalesCouponPool] = useState<SalesCouponPoolRecord>();
  const [salesCouponTenant, setSalesCouponTenant] = useState<AdminTenantListItem>();
  const salesCouponPoolId = searchParams.get('poolId') ?? '';
  const salesCouponTenantId = searchParams.get('tenantId') ?? '';
  const isSalesCouponPurchase = Boolean(salesCouponPoolId && salesCouponTenantId && (location.pathname.startsWith('/sales/coupons') || location.pathname.startsWith('/sales-admin/coupons')));
  const salesCouponSourcePath = location.pathname.startsWith('/sales-admin') ? '/sales-admin/coupons' : '/sales/coupons';
  const salesCouponPaymentPath = location.pathname.startsWith('/sales-admin') ? '/sales-admin/coupons/payment' : '/sales/coupons/payment';
  const [plans, setPlans] = useState<PurchasePlan[]>(fallbackPlans);
  const [counts, setCounts] = useState<Record<PurchasePlanKey, number>>({
    lite: 0,
    standard: 0,
    pro: 0,
    ultimate: 0,
  });
  const [bindings, setBindings] = useState<Record<PurchasePlanKey, boolean>>({
    lite: false,
    standard: false,
    pro: false,
    ultimate: false,
  });
  const [cycle, setCycle] = useState<PurchaseCycle>('1');
  const [autoRenew, setAutoRenew] = useState(false);
  const [billingGuideVisible, setBillingGuideVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    mockApi.getAdminPlans().then((rows) => {
      if (!mounted) return;
      const codingPlanPrices = rows.reduce<Record<string, number>>((result, row) => {
        if (row.productType === 'coding_plan' && row.status === 'published' && row.priceMonth) {
          result[row.name] = row.priceMonth;
        }
        return result;
      }, { ...fallbackCodingPlanPrices });
      const seatPlans = rows
        .map((row) => toPurchasePlan(row, codingPlanPrices))
        .filter((plan): plan is PurchasePlan => Boolean(plan))
        .sort((a, b) => purchasePlanOrder.indexOf(a.cnName) - purchasePlanOrder.indexOf(b.cnName));
      setPlans(seatPlans.length ? seatPlans : fallbackPlans);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSalesCouponPurchase) return;
    let mounted = true;
    Promise.all([mockApi.getSalesCouponPools(), mockApi.getAdminTenants()]).then(([poolRows, tenantRows]) => {
      if (!mounted) return;
      setSalesCouponPool(poolRows.find((item) => item.id === salesCouponPoolId));
      setSalesCouponTenant(tenantRows.find((item) => item.id === salesCouponTenantId));
    });
    return () => {
      mounted = false;
    };
  }, [isSalesCouponPurchase, salesCouponPoolId, salesCouponTenantId]);

  const totals = useMemo(() => {
    return plans.reduce(
      (result, plan) => {
        const count = counts[plan.key];
        const bindAmount = bindings[plan.key] ? plan.bindPrice ?? 0 : 0;
        return {
          seats: result.seats + count,
          amount: result.amount + (getCyclePrice(plan, cycle) + bindAmount * Number(cycle)) * count,
        };
      },
      { seats: 0, amount: 0 },
    );
  }, [bindings, counts, cycle, plans]);
  const formattedAmount = totals.amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const updateCount = (key: PurchasePlanKey, delta: number) => {
    setCounts((current) => ({ ...current, [key]: Math.max(current[key] + delta, 0) }));
  };

  const handlePurchase = () => {
    if (!totals.seats) {
      Message.warning('请选择至少 1 个席位');
      return;
    }

    const selected = plans
      .filter((plan) => counts[plan.key] > 0)
      .map((plan) => ({
        plan: plan.cnName,
        count: counts[plan.key],
        bindCodingPlan: bindings[plan.key],
        codingPlanName: plan.bindLabel?.replace('绑定 ', ''),
      }));

    const orderType = selected
      .map((item) => `${item.plan}${item.count}席${item.bindCodingPlan ? '+CodingPlan' : ''}`)
      .join('、');

    const draft: PurchaseDraft = {
      type: 'seat_sub',
      orderType: `${orderType} / ${cycle}个月`,
      amount: totals.amount,
      cycleMonths: Number(cycle),
      seats: totals.seats,
      lines: selected.map((item) => {
        const plan = plans.find((current) => current.cnName === item.plan);
        const seatAmount = plan ? getCyclePrice(plan, cycle) * item.count : 0;
        const codingAmount = item.bindCodingPlan ? ((plan?.bindPrice ?? 0) * Number(cycle) * item.count) : 0;
        return {
          ...item,
          action: '新增',
          amount: seatAmount + codingAmount,
          unitLabel: '席',
          summary: `${item.plan}${item.count}席${item.bindCodingPlan ? '+CodingPlan' : ''}`,
        };
      }),
    };

    if (isSalesCouponPurchase) {
      if (!salesCouponPool || !salesCouponTenant) {
        Message.error('请选择有效的优惠券和客户');
        return;
      }
      const salesDraft = {
        ...draft,
        tenantId: salesCouponTenant.id,
        tenantName: salesCouponTenant.name,
        poolId: salesCouponPool.id,
        poolName: salesCouponPool.name,
        sourcePath: salesCouponSourcePath,
      };
      window.sessionStorage.setItem(SALES_COUPON_PURCHASE_DRAFT_KEY, JSON.stringify(salesDraft));
      navigate(salesCouponPaymentPath, { state: { purchaseDraft: salesDraft } });
      return;
    }

    window.sessionStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    navigate('/tenant/payment', { state: { purchaseDraft: draft } });
  };

  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <Button
          className="purchase-header__back"
          icon={<IconLeft />}
          type="text"
          aria-label="返回"
          onClick={() => navigate(-1)}
        />
        <button className="purchase-header__back-text" type="button" onClick={() => navigate(-1)}>
          返回
        </button>
        <Button
          className="purchase-billing-guide-entry"
          type="text"
          onClick={() => setBillingGuideVisible(true)}
        >
          计费说明
        </Button>
      </div>

      <header className="purchase-hero">
        <div>
          <Title heading={2}>购买席位，立刻使用 ArkClaw 企业版</Title>
          <Text type="secondary">
            ArkClaw 企业版是您团队可信赖的“能力副驾”，提供一站式企业级智能解决方案，
            <br />
            开箱即用，让每位员工轻松拥有专属智能助手。
          </Text>
        </div>
        <img className="purchase-mascot" src="/arkclaw-mascot.png" alt="" />
      </header>

      {isSalesCouponPurchase ? (
        <section className="purchase-sales-context">
          <Card bordered>
            <div className="purchase-sales-context__title">
              <strong>销售代客户下单</strong>
              <Text type="secondary">沿用客户管理员下单流程，下一步进入同款支付确认页。</Text>
            </div>
            <Descriptions
              column={3}
              data={[
                { label: '代下单客户', value: salesCouponTenant?.name ?? '加载中' },
                { label: '使用优惠券', value: salesCouponPool?.name ?? '加载中' },
                { label: '优惠规则', value: salesCouponPool ? `${salesCouponPool.discountScope === 'seat' ? '席位' : salesCouponPool.discountScope === 'coding_plan' ? 'CodingPlan' : '整单'} / ${salesCouponPool.discountRate === 0 ? '100% 抵扣' : `${salesCouponPool.discountRate}% 折扣`}` : '-' },
                { label: '剩余数量', value: salesCouponPool ? `${salesCouponPool.remainingQuota.toLocaleString()} 张` : '-' },
                { label: '有效期', value: salesCouponPool ? `${salesCouponPool.effectiveAt} ~ ${salesCouponPool.expiresAt}` : '-' },
                { label: '归属销售', value: salesCouponPool?.ownerName ?? '-' },
              ]}
            />
          </Card>
        </section>
      ) : null}

      <section className="purchase-plans">
        {plans.map((plan) => (
          <article className="purchase-plan-card" key={plan.key}>
            <div className="purchase-plan-card__head">
              <strong>{plan.cnName}</strong>
              <span>{plan.enName}</span>
            </div>
            <div className="purchase-plan-card__tags">
              {plan.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="purchase-plan-card__price">
              <strong>{plan.price}</strong>
              <span>元/月</span>
            </div>
            {plan.bindLabel ? (
              <label className="purchase-bind">
                <Checkbox checked={bindings[plan.key]} onChange={(checked) => setBindings((current) => ({ ...current, [plan.key]: checked }))} />
                <span>绑定 <strong>{plan.bindLabel.replace('绑定 ', '')}</strong> ¥{plan.bindPrice}/月</span>
                <em>后续无法取消或重新绑定</em>
              </label>
            ) : null}
            <div className="purchase-stepper">
              <button type="button" onClick={() => updateCount(plan.key, -1)}>-</button>
              <span>{counts[plan.key]}</span>
              <button type="button" onClick={() => updateCount(plan.key, 1)}>+</button>
            </div>
            <ul className="purchase-specs">
              {plan.specs.map((item) => (
                <li key={item.label}>
                  <IconCheckCircle />
                  <span><strong>{item.label}：</strong>{item.value}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <footer className="purchase-bar">
        <Space size={12} className="purchase-bar__term">
          <span>时长</span>
          <Select value={cycle} className="purchase-cycle-select" onChange={(value) => setCycle(value as PurchaseCycle)}>
            <Select.Option value="1">1个月</Select.Option>
            <Select.Option value="3">3个月</Select.Option>
            <Select.Option value="12">1年</Select.Option>
          </Select>
          <Checkbox checked={autoRenew} onChange={setAutoRenew}>到期自动续费</Checkbox>
        </Space>
        <Space size={14} className="purchase-bar__pay">
          <span>预计应付金额</span>
          <strong className="purchase-total">¥ {formattedAmount}</strong>
          <Text type="secondary">具体收费情况请以购买页为准</Text>
          <Button type="primary" disabled={!totals.seats} onClick={handlePurchase}>{isSalesCouponPurchase ? '下一步' : '购买'}</Button>
        </Space>
      </footer>

      <Modal
        className="purchase-billing-guide-modal"
        title="ArkClaw 计费说明"
        visible={billingGuideVisible}
        footer={null}
        onCancel={() => setBillingGuideVisible(false)}
      >
        <BillingGuideContent />
      </Modal>
    </div>
  );
}
