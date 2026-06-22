import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconLeft, IconRefresh } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import { couponBenefitTypeLabel, isDiscountCoupon, isVoucherCoupon } from '../../utils/couponDisplay';
import type { CouponRecord, CouponStatus, CouponUsageRecord } from '../../types/domain';

const { Title, Text } = Typography;
const RangePicker = DatePicker.RangePicker;

const money = (value: number) => `¥${value.toLocaleString()}`;
const voucherRuleLabel = (discountRate: number) => (discountRate === 0 ? '100% 抵扣' : `${discountRate}% 折扣`);
const voucherRuleWithThresholdLabel = (voucher: Pick<CouponRecord, 'discountRate' | 'thresholdRule'>) =>
  `${voucherRuleLabel(voucher.discountRate)} · ${voucher.thresholdRule ?? '满 ¥0.00 可用'}`;
const voucherQuotaLabel = (voucher: CouponRecord) => (isVoucherCoupon(voucher) ? money(voucher.totalDiscountQuota) : '不设额度');
const voucherUsedLabel = (voucher: CouponRecord) => (isVoucherCoupon(voucher) ? money(voucher.usedDiscountQuota) : voucher.status === 'used' ? '已使用' : '未使用');
const voucherRemainingLabel = (voucher: CouponRecord) => (isVoucherCoupon(voucher) ? money(voucher.remainingDiscountQuota) : '单次使用');

const voucherStatusMap: Record<CouponStatus, readonly [string, string]> = {
  pending: ['gray', '待生效'],
  active: ['arcoblue', '生效中'],
  used: ['gray', '已使用'],
  exhausted: ['gray', '已用完'],
  expired: ['orange', '已过期'],
  disabled: ['red', '已作废'],
};

const voucherUsageStatusMap: Record<CouponUsageRecord['status'], readonly [string, string]> = {
  reserved: ['orange', '预占'],
  confirmed: ['green', '已抵扣'],
  released: ['gray', '已释放'],
};

const getVoucherPageContext = (pathname: string) => {
  if (pathname.startsWith('/agent/admin/coupons')) {
    return {
      ownerId: 'agent-001',
      listPath: '/agent/admin/coupons',
      title: '代金券与优惠券',
      description: '查看平台发放到当前代理账户下的优惠券和代金券、有效期和抵扣记录。',
    };
  }

  return {
    ownerId: 'tenant-001',
    listPath: '/tenant/vouchers',
    title: '我的券',
    description: '查看企业账户下已发放的优惠券和代金券、有效期和抵扣记录。',
  };
};

export default function VoucherManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CouponRecord[]>([]);
  const [usageRows, setUsageRows] = useState<CouponUsageRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CouponStatus | 'all'>('all');
  const [range, setRange] = useState<string[]>([]);
  const pageContext = getVoucherPageContext(location.pathname);

  const loadVouchers = async () => {
    setLoading(true);
    const data = await mockApi.getVoucherWallet(pageContext.ownerId);
    setRows(data.availableCoupons ?? []);
    setUsageRows(data.couponUsages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadVouchers();
  }, [pageContext.ownerId]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const [start, end] = range;

    return rows.filter((item) => {
      const matchesKeyword = !keyword || [item.name, item.id, item.remark]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesStatus = status === 'all' || item.status === status;
      const matchesRange = !start || !end || (item.effectiveAt <= end && item.expiresAt >= start);
      return matchesKeyword && matchesStatus && matchesRange;
    });
  }, [query, range, rows, status]);

  const activeRows = rows.filter((item) => item.status === 'active' && (isDiscountCoupon(item) || item.remainingDiscountQuota > 0));
  const activeVoucherRows = activeRows.filter((item) => isVoucherCoupon(item));
  const availableBalance = activeVoucherRows.reduce((sum, item) => sum + item.remainingDiscountQuota, 0);
  const expiringCount = activeRows.filter((item) =>
    dayjs(item.expiresAt).diff(dayjs(), 'day') <= 30,
  ).length;
  const confirmedUsageRows = usageRows.filter((item) => item.status === 'confirmed');
  const totalDiscountAmount = confirmedUsageRows.reduce((sum, item) => sum + item.discountAmount, 0);

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-title-row">
        <div>
          <Title heading={3}>{pageContext.title}</Title>
          <Text type="secondary">{pageContext.description}</Text>
        </div>
      </div>

      <div className="voucher-metric-grid">
        <Card bordered className="voucher-metric-card">
          <span>代金券余额</span>
          <strong>{money(availableBalance)}</strong>
          <small>仅统计可用且未用完的代金券</small>
        </Card>
        <Card bordered className="voucher-metric-card">
          <span>可用券数</span>
          <strong>{activeRows.length}</strong>
          <small>当前状态为可用</small>
        </Card>
        <Card bordered className="voucher-metric-card">
          <span>即将过期数</span>
          <strong>{expiringCount}</strong>
          <small>30 天内到期且仍有余额</small>
        </Card>
        <Card bordered className="voucher-metric-card">
          <span>累计已抵扣</span>
          <strong>{money(totalDiscountAmount)}</strong>
          <small>已确认抵扣记录汇总</small>
        </Card>
      </div>

      <div className="tenant-data-panel">
        <div className="tenant-data-panel__toolbar">
          <div className="voucher-toolbar">
            <div className="sales-filter-bar">
              <Input.Search
                value={query}
                onChange={setQuery}
                className="table-search voucher-search"
                placeholder="搜索券名称、ID、备注"
                allowClear
              />
              <Select value={status} onChange={setStatus} className="voucher-status-select" triggerProps={{ autoAlignPopupWidth: false }}>
                <Select.Option value="all">全部状态</Select.Option>
                {Object.entries(voucherStatusMap).map(([value, meta]) => (
                  <Select.Option key={value} value={value}>{meta[1]}</Select.Option>
                ))}
              </Select>
              <RangePicker value={range} onChange={setRange} className="voucher-date-range" placeholder={['生效开始', '生效结束']} />
            </div>
            <Button icon={<IconRefresh />} onClick={loadVouchers} loading={loading} title="刷新" aria-label="刷新" />
          </div>
        </div>

          <Table
            rowKey="id"
            loading={loading}
            data={filteredRows}
            pagination={{ pageSize: 8, showTotal: true }}
            noDataElement={<Empty description="暂无符合条件的券" />}
            columns={[
              {
                title: '券名称/ID',
                width: 220,
                render: (_: unknown, row: CouponRecord) => (
                  <Space direction="vertical" size={2}>
                    <Button type="text" size="mini" className="voucher-name-button" onClick={() => navigate(`${pageContext.listPath}/${row.id}`)}>
                      {row.name}
                    </Button>
                    <Text type="secondary">{row.id}</Text>
                  </Space>
                ),
              },
              { title: '券类型', render: (_: unknown, row: CouponRecord) => <Tag color={isDiscountCoupon(row) ? 'purple' : 'arcoblue'}>{couponBenefitTypeLabel(row)}</Tag> },
              { title: '总额度', render: (_: unknown, row: CouponRecord) => voucherQuotaLabel(row) },
              { title: '剩余', render: (_: unknown, row: CouponRecord) => voucherRemainingLabel(row) },
              {
                title: '已用',
                width: 180,
                render: (_: unknown, row: CouponRecord) => (
                  <Space direction="vertical" size={4} className="full-width">
                    <span>{voucherUsedLabel(row)}</span>
                    {isVoucherCoupon(row) ? <Progress
                      percent={row.totalDiscountQuota ? Math.round((row.usedDiscountQuota / row.totalDiscountQuota) * 100) : 0}
                      size="small"
                      showText={false}
                    /> : null}
                  </Space>
                ),
              },
              { title: '折扣规则', render: (_: unknown, row: CouponRecord) => voucherRuleWithThresholdLabel(row) },
              { title: '有效期', render: (_: unknown, row: CouponRecord) => `${row.effectiveAt} ~ ${row.expiresAt}` },
              {
                title: '状态',
                dataIndex: 'status',
                render: (value: CouponStatus) => <Tag color={voucherStatusMap[value][0]}>{voucherStatusMap[value][1]}</Tag>,
              },
              {
                title: '备注',
                dataIndex: 'remark',
                ellipsis: true,
                tooltip: true,
              },
              {
                title: '操作',
                width: 100,
                render: (_: unknown, row: CouponRecord) => (
                  <Button type="text" size="mini" onClick={() => navigate(`${pageContext.listPath}/${row.id}`)}>查看详情</Button>
                ),
              },
            ]}
          />
      </div>
    </Space>
  );
}

export function VoucherDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { voucherId } = useParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CouponRecord[]>([]);
  const [usageRows, setUsageRows] = useState<CouponUsageRecord[]>([]);
  const [billingPeriod, setBillingPeriod] = useState('');
  const [changeType, setChangeType] = useState('all');
  const pageContext = getVoucherPageContext(location.pathname);

  const loadVoucher = async () => {
    setLoading(true);
    const data = await mockApi.getVoucherWallet(pageContext.ownerId);
    setRows(data.availableCoupons ?? []);
    setUsageRows(data.couponUsages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadVoucher();
  }, [pageContext.ownerId]);

  const voucher = rows.find((item) => item.id === voucherId);
  const voucherUsages = usageRows.filter((item) => item.couponId === voucherId);
  const changeTypeOptions = Array.from(new Set(voucherUsages.flatMap((item) => item.changeType ? [item.changeType] : [])));
  const filteredUsages = voucherUsages.filter((item) => {
    const matchesPeriod = !billingPeriod || item.billingPeriod === billingPeriod;
    const matchesType = changeType === 'all' || item.changeType === changeType;
    return matchesPeriod && matchesType;
  });

  if (!loading && !voucher) {
    return (
      <Card bordered className="voucher-empty-card">
        <Space direction="vertical" size={16} align="center" className="full-width">
          <Empty description="未找到该券" />
          <Button type="primary" onClick={() => navigate(pageContext.listPath)}>返回券列表</Button>
        </Space>
      </Card>
    );
  }

  if (!voucher) return null;

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-title-row">
        <div className="voucher-detail-title">
          <Button type="text" icon={<IconLeft />} onClick={() => navigate(pageContext.listPath)} />
          <Title heading={3}>券详情（{voucher.name} - {voucher.id}）</Title>
          <Tag color={isDiscountCoupon(voucher) ? 'purple' : 'arcoblue'}>{couponBenefitTypeLabel(voucher)}</Tag>
          <Tag color={voucherStatusMap[voucher.status][0]}>{voucherStatusMap[voucher.status][1]}</Tag>
        </div>
      </div>

      <div className="voucher-detail-card">
        <div className="voucher-detail-hero">
          <Space direction="vertical" size={12} className="full-width">
            <Space wrap>
              <Tag color="orangered">{voucher.thresholdRule ?? '满 ¥0.00 可用'}</Tag>
            </Space>
            <div className="voucher-detail-balance">
              <div className="voucher-detail-balance__amount">
                <span>{isDiscountCoupon(voucher) ? '使用状态' : '代金券余额'}</span>
                <strong>{isDiscountCoupon(voucher) ? voucherUsedLabel(voucher) : money(voucher.remainingDiscountQuota)}</strong>
              </div>
              <span className="voucher-detail-balance__period">有效期（UTC+8） {voucher.effectiveAt} - {voucher.expiresAt}</span>
            </div>
          </Space>
        </div>
        <div className="voucher-detail-summary">
          <Descriptions
            column={3}
            data={[
              { label: '券类型', value: couponBenefitTypeLabel(voucher) },
              { label: '总额度', value: voucherQuotaLabel(voucher) },
              { label: '规则', value: voucherRuleLabel(voucher.discountRate) },
              { label: '已用', value: voucherUsedLabel(voucher) },
              { label: '备注', value: voucher.remark || '-' },
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
              { title: '变更金额', dataIndex: 'discountAmount', render: (value: number) => money(value) },
            ]}
          />
        </div>
      </div>
    </Space>
  );
}
