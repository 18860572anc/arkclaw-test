import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
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
} from '@arco-design/web-react';
import {
  IconCopy,
  IconDownload,
  IconEdit,
  IconInfoCircle,
  IconLink,
  IconPlus,
  IconQrcode,
  IconRefresh,
  IconSafe,
  IconUpload,
  IconUser,
} from '@arco-design/web-react/icon';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AttachmentViewer from '../../components/AttachmentViewer';
import MetricCard from '../../components/MetricCard';
import OpeningProgressPanel, { normalizeOpeningProgressStatus } from '../../components/OpeningProgressPanel';
import { mockApi } from '../../services/mockApi';
import { orderBundleDetailLines, orderSummaryLabel } from '../../utils/orderDisplay';
import type {
  AgentCommissionDistributionRecord,
  AgentCommissionQuery,
  AgentCommissionRecord,
  AgentCommissionRole,
  AgentCommissionStatus,
  AgentCommissionSummary,
  AgentCommissionView,
  AdminSalesListItem,
  AdminTenantListItem,
  BillingOrder,
  CouponDiscountScope,
  CouponRecord,
  OrderAmountBreakdown,
  OrderBundleLine,
  Metric,
  SalesDashboardSummary,
  SalesCouponGrantRecord,
  SalesCouponPoolRecord,
  SalesCommissionStatus,
  SalesCustomerFormPayload,
  SalesCustomerListItem,
  SalesCustomerQuery,
  SalesCustomerStatus,
  SalesFollowupChannel,
  SalesInviteResourceStatus,
  SalesLeadCloseReason,
  SalesLeadFollowupRecord,
  SalesLeadRecord,
  SalesRegistrationRecord,
  SalesShareLinkRecord,
  SalesLeadStatus,
  SalesOpeningTaskRecord,
  SalesOpeningTaskStatus,
  SalesOrderFollowupRecord,
  SalesOrderFollowupStatus,
  AdminBankTransferReviewStatus,
  AdminPaymentStatus,
  ConsultOpportunityType,
  SalesShareCreatePayload,
  SalesProfileUpdatePayload,
  SalesBankAccount,
} from '../../types/domain';

const { Title, Text } = Typography;
const { Row, Col } = Grid;
const TabPane = Tabs.TabPane;
const RangePicker = DatePicker.RangePicker;

const money = (value: number) => `¥${value.toLocaleString()}`;
const BANK_TRANSFER_PAYEE = '云脑智联科技有限公司';
const BANK_TRANSFER_BANK = '招商银行上海分行营业部';
const BANK_TRANSFER_ACCOUNT = '6222 **** **** 2048';
const salesConsolePath = (pathname: string, suffix = '') => `${pathname.startsWith('/agent/sales') ? '/agent/sales' : '/sales'}${suffix}`;
const resolveAgentCommissionRole = (pathname: string): AgentCommissionRole =>
  pathname.startsWith('/agent/finance') ? 'agentFinance' : pathname.startsWith('/agent/sales') ? 'agentSales' : 'agentAdmin';
const paymentMethodLabel = (value: string) =>
  value === 'bank_transfer' ? '对公转账' : value === 'wechat' ? '微信' : value === 'alipay' ? '支付宝' : value;
const maskBankAccountNo = (accountNo?: string) => {
  if (!accountNo) return '-';
  const normalized = accountNo.replace(/\s/g, '');
  if (normalized.length <= 4) return normalized;
  return `**** **** **** ${normalized.slice(-4)}`;
};

const customerStatusMeta: Record<SalesCustomerStatus, { color: string; text: string }> = {
  pending_followup: { color: 'gold', text: '待跟进' },
  following: { color: 'arcoblue', text: '跟进中' },
  converted: { color: 'green', text: '已成交' },
  lost: { color: 'gray', text: '已流失' },
};

const commissionStatusMeta: Record<SalesCommissionStatus, { color: string; text: string }> = {
  estimated: { color: 'gold', text: '收益待释放' },
  withdrawable: { color: 'arcoblue', text: '可提现' },
  withdrawing: { color: 'orange', text: '提现处理中' },
  withdrawn: { color: 'green', text: '已到账' },
  invalid: { color: 'gray', text: '收益已取消' },
  pending: { color: 'gold', text: '待财务核准' },
  pending_sales_confirm: { color: 'orangered', text: '待我确认' },
  disputed: { color: 'red', text: '待财务复核' },
  confirmed: { color: 'arcoblue', text: '待打款' },
  paid: { color: 'green', text: '已打款' },
};

const salesCommissionStatusOptions: Array<{ value: SalesCommissionStatus; text: string }> = [
  { value: 'estimated', text: '收益待释放' },
  { value: 'withdrawable', text: '可提现' },
  { value: 'withdrawing', text: '提现处理中' },
  { value: 'withdrawn', text: '已到账' },
  { value: 'invalid', text: '收益已取消' },
];

const agentCommissionStatusMeta: Record<AgentCommissionStatus, { color: string; text: string }> = {
  pending: { color: 'gold', text: '待确认' },
  confirmed: { color: 'arcoblue', text: '待打款' },
  paid: { color: 'green', text: '已打款' },
  reverted: { color: 'gray', text: '已冲销' },
  withdrawable: { color: 'arcoblue', text: '可提现' },
  withdrawing: { color: 'orange', text: '提现处理中' },
  processing: { color: 'purple', text: '处理中' },
};

const agentCommissionStatusOptions: Array<{ value: AgentCommissionStatus; text: string }> = [
  { value: 'pending', text: '待确认' },
  { value: 'confirmed', text: '待打款' },
  { value: 'paid', text: '已打款' },
  { value: 'reverted', text: '已冲销' },
  { value: 'withdrawable', text: '可提现' },
  { value: 'withdrawing', text: '提现处理中' },
  { value: 'processing', text: '处理中' },
];

const inviteStatusMeta: Record<SalesInviteResourceStatus, { color: string; text: string }> = {
  active: { color: 'green', text: '有效' },
  disabled: { color: 'gray', text: '停用' },
  expired: { color: 'orangered', text: '已过期' },
  exhausted: { color: 'gold', text: '已耗尽' },
};

const leadStatusMeta: Record<SalesLeadStatus, { color: string; text: string }> = {
  new: { color: 'red', text: '待跟进' },
  claimed: { color: 'gold', text: '已分配' },
  following: { color: 'arcoblue', text: '跟进中' },
  converted: { color: 'green', text: '已转客户' },
  closed: { color: 'gray', text: '已关闭' },
};

const opportunityTypeMeta: Record<ConsultOpportunityType, { color: string; text: string }> = {
  external_consult: { color: 'arcoblue', text: '外部留咨' },
  customer_business_consult: { color: 'orange', text: '咨询工单' },
};

const customerConsultStatusMeta = {
  pending_reply: { color: 'gold', text: '待回复' },
  replied: { color: 'green', text: '已回复' },
  completed: { color: 'gray', text: '已完结' },
} as const;

const isSalesLeadOverdue = (lead: SalesLeadRecord) => {
  if (lead.status !== 'new') return false;
  return new Date(lead.slaDeadlineAt).getTime() <= new Date('2026-04-28T10:00:00').getTime();
};

const salesLeadStatusMeta = (lead: SalesLeadRecord) =>
  isSalesLeadOverdue(lead) ? { color: 'red', text: '已超时' } : leadStatusMeta[lead.status];

const salesOpportunityStatusMeta = (lead: SalesLeadRecord) => (
  lead.opportunityType === 'customer_business_consult'
    ? customerConsultStatusMeta[lead.customerConsultStatus ?? 'pending_reply']
    : salesLeadStatusMeta(lead)
);

const formatSalesLeadSla = (lead: SalesLeadRecord) => {
  if (lead.status !== 'new') return '-';
  const diffHours = Math.floor((new Date(lead.slaDeadlineAt).getTime() - new Date('2026-04-28T10:00:00').getTime()) / 3600000);
  if (diffHours > 0) return `${diffHours}h`;
  const overdueHours = Math.abs(diffHours);
  if (overdueHours < 24) return `已超时 ${overdueHours}h`;
  const days = Math.floor(overdueHours / 24);
  const restHours = overdueHours % 24;
  return `已超时 ${days}天${restHours ? `${restHours}h` : ''}`;
};

const openingTaskStatusMeta: Record<SalesOpeningTaskStatus, { color: string; text: string }> = {
  pending_assign: { color: 'purple', text: '交付处理中' },
  pending_handle: { color: 'purple', text: '交付处理中' },
  purchasing: { color: 'purple', text: '交付处理中' },
  waiting_confirm: { color: 'purple', text: '交付处理中' },
  completed: { color: 'green', text: '已开通' },
  failed: { color: 'purple', text: '交付处理中' },
  cancelled: { color: 'gray', text: '已取消' },
};

const orderStatusMeta: Record<AdminPaymentStatus, { color: string; text: string }> = {
  pending: { color: 'gold', text: '待付款' },
  pending_review: { color: 'arcoblue', text: '对公审核中' },
  paid: { color: 'green', text: '已支付' },
  refunded: { color: 'gray', text: '已退款' },
  cancelled: { color: 'gray', text: '已关闭' },
};

const orderFollowupStatusMeta: Record<SalesOrderFollowupStatus, { color: string; text: string }> = {
  pending_payment: { color: 'gold', text: '待付款' },
  payment_review: { color: 'arcoblue', text: '付款确认中' },
  paid_waiting_delivery: { color: 'purple', text: '待交付' },
  delivery_processing: { color: 'purple', text: '交付处理中' },
  completed: { color: 'green', text: '已开通' },
  closed: { color: 'gray', text: '已关闭' },
};

const bankReviewStatusMeta: Record<AdminBankTransferReviewStatus, { color: string; text: string }> = {
  pending_delivery_review: { color: 'gold', text: '待交付核对' },
  pending_finance_review: { color: 'arcoblue', text: '待财务终审' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
};

const seatStatusMeta: Record<string, string> = {
  inactive: '待开通',
  activating: '开通中',
  active: '已生效',
  released: '已释放',
};

const followupChannels: Array<{ value: SalesFollowupChannel; label: string }> = [
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'visit', label: '见面' },
  { value: 'email', label: '邮件' },
  { value: 'other', label: '其他' },
];

const customerSources = ['主动开发', '老客户介绍', '行业活动', '官网咨询', '其他'];

const closeReasons: SalesLeadCloseReason[] = ['不感兴趣', '已选友商', '联系不上', '其他'];

function maskPhone(value?: string) {
  if (!value) return '-';
  return value.length === 11 ? `${value.slice(0, 3)}****${value.slice(-4)}` : value;
}

function maskEmail(value?: string) {
  if (!value || !value.includes('@')) return value ?? '-';
  const [name, host] = value.split('@');
  return `${name.slice(0, 2)}***@${host}`;
}

function copyText(value: string, message = '已复制') {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(value);
  }
  Message.success(message);
}

function formatDateTime(value?: string) {
  return value || '-';
}

function calcDaysLabel(date?: string) {
  if (!date) return '-';
  const diff = Math.floor((new Date(date).getTime() - new Date('2026-04-28T10:00:00').getTime()) / 86400000);
  if (diff < 0) return `已过期 ${Math.abs(diff)} 天`;
  return `${diff} 天`;
}

function calcAttributionLabel(started?: boolean, date?: string) {
  if (!started) return '待开通';
  return calcDaysLabel(date);
}

function calcOverdueLabel(date?: string) {
  if (!date) return '未跟进';
  const diff = Math.floor((new Date('2026-04-28T10:00:00').getTime() - new Date(date).getTime()) / 86400000);
  return `${diff} 天前`;
}

function SalesPageShell({
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

function SalesPanel({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="sales-panel">
      <header className="sales-panel__header">
        <Text className="sales-panel__title">{title}</Text>
        {extra ? <div className="sales-panel__extra">{extra}</div> : null}
      </header>
      <div className="sales-panel__body">{children}</div>
    </section>
  );
}

function SalesTablePanel({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="sales-table-panel">
      {toolbar ? <div className="sales-table-panel__toolbar">{toolbar}</div> : null}
      {children}
    </section>
  );
}

function CommissionMetricCard({
  metric,
  help,
  action,
}: {
  metric: Metric;
  help: string;
  action?: ReactNode;
}) {
  return (
    <div className="commission-metric-card-wrap">
      <MetricCard metric={metric} />
      <Tooltip content={help}>
        <Button
          className="commission-metric-help"
          type="text"
          size="mini"
          shape="circle"
          icon={<IconInfoCircle />}
          aria-label={`${metric.label}说明`}
        />
      </Tooltip>
      {action ? <div className="commission-metric-action">{action}</div> : null}
    </div>
  );
}

function SalesTabsPanel({ children }: { children: ReactNode }) {
  return <section className="sales-tabs-panel">{children}</section>;
}

function CustomerStatusTag({ status }: { status: SalesCustomerStatus }) {
  const meta = customerStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function canMarkCustomerLost(status: SalesCustomerStatus) {
  return status === 'pending_followup' || status === 'following';
}

function CommissionStatusTag({ status }: { status: SalesCommissionStatus }) {
  const meta = commissionStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function AgentCommissionStatusTag({ status }: { status: AgentCommissionStatus }) {
  const meta = agentCommissionStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function InviteStatusTag({ status }: { status: SalesInviteResourceStatus }) {
  const meta = inviteStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function LeadStatusTag({ status }: { status: SalesLeadStatus }) {
  const meta = leadStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function SalesMetaTag({ color, text }: { color: string; text: string }) {
  return <Tag color={color}>{text}</Tag>;
}

function OpeningTaskStatusTag({ status }: { status: SalesOpeningTaskStatus }) {
  const meta = openingTaskStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function OrderStatusTag({ status }: { status: AdminPaymentStatus }) {
  const meta = orderStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function OrderFollowupStatusTag({ status }: { status: SalesOrderFollowupStatus }) {
  const meta = orderFollowupStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

function BankReviewStatusTag({ status }: { status: AdminBankTransferReviewStatus }) {
  const meta = bankReviewStatusMeta[status];
  return <Tag color={meta.color}>{meta.text}</Tag>;
}

export function SalesCustomersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const salesBasePath = salesConsolePath(location.pathname);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesCustomerListItem[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [query, setQuery] = useState<SalesCustomerQuery & {
    q: string;
    status: SalesCustomerStatus | 'all';
    industry: string | 'all';
    sortBy: 'bound_at_desc' | 'commission_desc' | 'followup_desc';
    boundDateFrom: string;
    boundDateTo: string;
  }>({
    q: '',
    status: 'all',
    industry: 'all',
    sortBy: 'bound_at_desc',
    boundDateFrom: '',
    boundDateTo: '',
  });
  const [activeCustomer, setActiveCustomer] = useState<SalesCustomerListItem | null>(null);
  const [followVisible, setFollowVisible] = useState(false);
  const [followForm, setFollowForm] = useState({
    channel: 'phone',
    content: '',
    nextFollowupAt: '',
    remind: true,
  });
  const [lostVisible, setLostVisible] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [customerRows, industryRows] = await Promise.all([
      mockApi.getSalesCustomers(query as any),
      mockApi.getSalesIndustries(),
    ]);
    setRows(customerRows);
    setIndustries(industryRows);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [query.q, query.status, query.industry, query.sortBy, query.boundDateFrom, query.boundDateTo]);

  const openFollowModal = (customer: SalesCustomerListItem) => {
    setActiveCustomer(customer);
    setFollowForm({
      channel: 'phone',
      content: '',
      nextFollowupAt: '',
      remind: true,
    });
    setFollowVisible(true);
  };

  const handleCreateFollowup = async () => {
    if (!activeCustomer) return;
    if (!followForm.content.trim()) {
      Message.error('请输入跟进内容');
      return;
    }
    await mockApi.createSalesCustomerFollowup(activeCustomer.id, {
      channel: followForm.channel as SalesFollowupChannel,
      content: followForm.content,
      nextFollowupAt: followForm.nextFollowupAt || undefined,
      remind: followForm.remind,
    });
    Message.success('跟进已记录');
    setFollowVisible(false);
    setActiveCustomer(null);
    loadData();
  };

  const openLostModal = (customer: SalesCustomerListItem) => {
    setActiveCustomer(customer);
    setLostReason('');
    setLostVisible(true);
  };

  const handleMarkLost = async () => {
    if (!activeCustomer) return;
    if (!lostReason.trim()) {
      Message.error('请输入流失原因');
      return;
    }
    await mockApi.markSalesCustomerLost(activeCustomer.id, { reason: lostReason });
    Message.success('已标记为流失');
    setLostVisible(false);
    setActiveCustomer(null);
    loadData();
  };

  return (
    <SalesPageShell
      title="我的客户池"
      description="完整客户列表、去重校验、跟进和佣金追踪入口"
      action={
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => navigate(`${salesBasePath}/customers/new`)}>新增客户</Button>
        </Space>
      }
    >
      <SalesTablePanel
        toolbar={(
          <>
            <div className="sales-filter-bar">
              <Input.Search
                placeholder="搜索客户名、统一社会信用代码、联系人、电话"
                className="table-search table-search--wide"
                value={query.q}
                onChange={(value) => setQuery((current) => ({ ...current, q: value }))}
              />
              <Select value={query.status} onChange={(value) => setQuery((current) => ({ ...current, status: value }))} placeholder="状态" style={{ width: 140 }}>
                <Select.Option value="all">全部状态</Select.Option>
                {Object.entries(customerStatusMeta).map(([value, meta]) => (
                  <Select.Option key={value} value={value}>{meta.text}</Select.Option>
                ))}
              </Select>
              <Select value={query.industry} onChange={(value) => setQuery((current) => ({ ...current, industry: value }))} placeholder="行业" style={{ width: 160 }}>
                <Select.Option value="all">全部行业</Select.Option>
                {industries.map((industry) => (
                  <Select.Option key={industry} value={industry}>{industry}</Select.Option>
                ))}
              </Select>
              <RangePicker
                value={query.boundDateFrom || query.boundDateTo ? [query.boundDateFrom, query.boundDateTo] : []}
                onChange={(value) => setQuery((current) => ({
                  ...current,
                  boundDateFrom: value?.[0] || '',
                  boundDateTo: value?.[1] || '',
                }))}
                style={{ width: 260 }}
                placeholder={['归属开始日期', '归属结束日期']}
              />
              <Select value={query.sortBy} onChange={(value) => setQuery((current) => ({ ...current, sortBy: value }))} placeholder="排序" style={{ width: 180 }}>
                <Select.Option value="bound_at_desc">默认排序</Select.Option>
                <Select.Option value="commission_desc">累计佣金</Select.Option>
                <Select.Option value="followup_desc">最近跟进</Select.Option>
              </Select>
            </div>

          </>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            {
              title: '客户名',
              dataIndex: 'tenantName',
              render: (value: string, row: SalesCustomerListItem) => (
                <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/customers/${row.id}`)}>
                  {value}
                </Button>
              ),
            },
            { title: '统一社会信用代码', dataIndex: 'uscc' },
            { title: '联系人', dataIndex: 'primaryContactName' },
            { title: '电话', dataIndex: 'primaryContactPhone', render: maskPhone },
            { title: '行业', dataIndex: 'industry' },
            { title: '状态', dataIndex: 'customerStatus', render: (value: SalesCustomerStatus) => <CustomerStatusTag status={value} /> },
            { title: '归属时间', dataIndex: 'boundAt' },
            {
              title: '归属剩余',
              render: (_: unknown, row: SalesCustomerListItem) => {
                const label = calcAttributionLabel(row.attributionStarted, row.attributionValidUntil);
                return <span className={row.attributionStarted && label.includes('天') && Number.parseInt(label, 10) < 30 ? 'sales-cell--warn' : ''}>{label}</span>;
              },
            },
            { title: '最近跟进', dataIndex: 'lastFollowupAt', render: (value?: string) => <span className={value && calcOverdueLabel(value).includes('天前') && Number.parseInt(calcOverdueLabel(value), 10) > 14 ? 'sales-cell--danger' : ''}>{calcOverdueLabel(value)}</span> },
            { title: '累计佣金', dataIndex: 'totalCommissionAmount', render: (value: number) => money(value) },
            { title: '客户运维', dataIndex: 'accountManagerName', render: (value?: string) => value || '-' },
            {
              title: '操作',
              render: (_: unknown, row: SalesCustomerListItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/customers/${row.id}`)}>详情</Button>
                  <Button type="text" size="mini" onClick={() => openFollowModal(row)}>新增跟进</Button>
                  {canMarkCustomerLost(row.customerStatus) ? (
                    <Button type="text" size="mini" status="danger" onClick={() => openLostModal(row)}>标记流失</Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </SalesTablePanel>

      <Modal
        title={activeCustomer ? `${activeCustomer.tenantName} · 新增跟进` : '新增跟进'}
        visible={followVisible}
        onCancel={() => setFollowVisible(false)}
        onOk={handleCreateFollowup}
      >
        <Space direction="vertical" size={14} className="full-width">
          <Select value={followForm.channel} onChange={(value) => setFollowForm((current) => ({ ...current, channel: value }))}>
            {followupChannels.map((channel) => (
              <Select.Option key={channel.value} value={channel.value}>{channel.label}</Select.Option>
            ))}
          </Select>
          <Input.TextArea
            rows={5}
            value={followForm.content}
            onChange={(value) => setFollowForm((current) => ({ ...current, content: value }))}
            placeholder="记录本次沟通结果和下步动作"
          />
          <Input
            value={followForm.nextFollowupAt}
            onChange={(value) => setFollowForm((current) => ({ ...current, nextFollowupAt: value }))}
            placeholder="下次跟进时间，如 2026-05-06 10:00"
          />
          <Checkbox checked={followForm.remind} onChange={(value) => setFollowForm((current) => ({ ...current, remind: value }))}>
            启用提醒
          </Checkbox>
        </Space>
      </Modal>

      <Modal
        title={activeCustomer ? `${activeCustomer.tenantName} · 标记流失` : '标记流失'}
        visible={lostVisible}
        onCancel={() => setLostVisible(false)}
        onOk={handleMarkLost}
      >
        <Input.TextArea
          rows={4}
          value={lostReason}
          onChange={setLostReason}
          placeholder="填写流失原因，如预算取消、长期无响应、已选友商"
        />
      </Modal>
    </SalesPageShell>
  );
}

export function SalesCustomerCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const salesBasePath = salesConsolePath(location.pathname);
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<string[]>([]);
  const [usccState, setUsccState] = useState<any>();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SalesCustomerFormPayload>({
    tenantName: '',
    uscc: '',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    industry: '',
    source: leadId ? '官网咨询' : '主动开发',
    salesRemark: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [industryRows, leadRows] = await Promise.all([mockApi.getSalesIndustries(), mockApi.getSalesLeads()]);
      setIndustries(industryRows);
      if (leadId) {
        const matchedLead = leadRows.find((item: SalesLeadRecord) => item.id === leadId);
        if (matchedLead) {
          setDraft({
            tenantName: matchedLead.company,
            uscc: '',
            primaryContactName: matchedLead.name,
            primaryContactPhone: matchedLead.phone,
            primaryContactEmail: matchedLead.email,
            industry: industryRows[2] || '企业服务',
            source: '官网咨询',
            salesRemark: matchedLead.requirement,
          });
        }
      }
      setLoading(false);
    };
    loadData();
  }, [leadId]);

  useEffect(() => {
    if (!draft.uscc.trim()) {
      setUsccState(undefined);
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await mockApi.checkSalesCustomerUscc(draft.uscc);
      setUsccState(result);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft.uscc]);

  const updateDraft = (key: keyof SalesCustomerFormPayload, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!draft.tenantName.trim() || !draft.uscc.trim() || !draft.primaryContactName.trim() || !draft.primaryContactPhone.trim() || !draft.industry) {
      Message.error('请完整填写必填字段');
      return;
    }
    if (!/^[0-9A-Z]{18}$/.test(draft.uscc.trim().toUpperCase())) {
      Message.error('统一社会信用代码需为 18 位字母数字');
      return;
    }
    if (!/^1\d{10}$/.test(draft.primaryContactPhone.trim())) {
      Message.error('请输入有效的中国手机号');
      return;
    }
    if (draft.primaryContactEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.primaryContactEmail.trim())) {
      Message.error('请输入有效邮箱');
      return;
    }
    if (usccState && !usccState.available) {
      Message.error(usccState.reason === 'owned_by_self' ? '该客户已在你的客户池中' : '该客户已被他人录入');
      return;
    }
    setSaving(true);
    const result = leadId ? await mockApi.convertSalesLead(leadId, draft) : await mockApi.createSalesCustomer(draft);
    setSaving(false);
    Message.success(leadId ? '商机已转客户' : '客户已创建');
    navigate(`${salesBasePath}/customers/${result.id}`);
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载客户表单" />;
  }

  return (
    <div className="sales-detail-screen">
      <div className="sales-detail-header">
        <Button type="text" onClick={() => navigate(`${salesBasePath}/customers`)}>返回客户池</Button>
        <Title heading={4}>{leadId ? '转客户' : '新增客户'}</Title>
      </div>

      <div className="sales-detail-layout">
        <section className="sales-detail-section">
          <div className="sales-detail-section__title">基础信息</div>
          <div className="sales-form-grid">
            <label>
              <span>客户名</span>
              <div className="detail-control-shell">
                <Input value={draft.tenantName} onChange={(value) => updateDraft('tenantName', value)} placeholder="请输入客户名称" />
              </div>
            </label>
            <label>
              <span>统一社会信用代码</span>
              <div className="detail-control-shell">
                <Input value={draft.uscc} onChange={(value) => updateDraft('uscc', value)} placeholder="18 位统一社会信用代码" />
              </div>
              {usccState?.available ? <small className="sales-form-hint sales-form-hint--success">可用</small> : null}
              {usccState?.reason === 'owned_by_self' ? (
                <small className="sales-form-hint sales-form-hint--warn">
                  该客户已在你的客户池中
                  <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/customers/${usccState.tenantId}`)}>跳转</Button>
                </small>
              ) : null}
              {usccState?.reason === 'owned_by_other' ? <small className="sales-form-hint sales-form-hint--danger">该客户已被他人录入，不可重复添加</small> : null}
            </label>
            <label>
              <span>联系人姓名</span>
              <div className="detail-control-shell">
                <Input value={draft.primaryContactName} onChange={(value) => updateDraft('primaryContactName', value)} placeholder="请输入联系人姓名" />
              </div>
            </label>
            <label>
              <span>联系电话</span>
              <div className="detail-control-shell">
                <Input value={draft.primaryContactPhone} onChange={(value) => updateDraft('primaryContactPhone', value)} placeholder="请输入手机号" />
              </div>
            </label>
            <label>
              <span>联系邮箱</span>
              <div className="detail-control-shell">
                <Input value={draft.primaryContactEmail} onChange={(value) => updateDraft('primaryContactEmail', value)} placeholder="可选" />
              </div>
            </label>
            <label>
              <span>行业</span>
              <div className="detail-control-shell">
                <Select value={draft.industry} onChange={(value) => updateDraft('industry', value)}>
                  {industries.map((industry) => (
                    <Select.Option key={industry} value={industry}>{industry}</Select.Option>
                  ))}
                </Select>
              </div>
            </label>
            <label>
              <span>客户来源</span>
              <div className="detail-control-shell">
                <Select value={draft.source} onChange={(value) => updateDraft('source', value)}>
                  {customerSources.map((item) => (
                    <Select.Option key={item} value={item}>{item}</Select.Option>
                  ))}
                </Select>
              </div>
            </label>
          </div>
        </section>

        <section className="sales-detail-section">
          <div className="sales-detail-section__title">销售备注</div>
          <div className="detail-control-shell">
            <Input.TextArea
              rows={6}
              value={draft.salesRemark}
              onChange={(value) => updateDraft('salesRemark', value)}
              placeholder="记录当前跟进背景、关键阻塞和下次动作"
            />
          </div>
        </section>
      </div>

      <div className="sales-detail-footer">
        <Space>
          <Button onClick={() => navigate(`${salesBasePath}/customers`)}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>保存客户</Button>
        </Space>
      </div>
    </div>
  );
}

export function SalesCustomerDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const salesBasePath = salesConsolePath(location.pathname);
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'basic');
  const [detail, setDetail] = useState<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [followVisible, setFollowVisible] = useState(false);
  const [followForm, setFollowForm] = useState({
    channel: 'phone',
    content: '',
    nextFollowupAt: '',
    remind: true,
  });
  const [lostVisible, setLostVisible] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [draft, setDraft] = useState({
    accountManagerNote: '',
    salesRemark: '',
    customTags: '',
  });

  const tenantId = params.id as string;

  const loadData = async () => {
    setLoading(true);
    const [detailData, ordersData, usageData, followupsData, commissionData] = await Promise.all([
      mockApi.getSalesCustomerDetail(tenantId),
      mockApi.getSalesCustomerOrders(tenantId),
      mockApi.getSalesCustomerUsage(tenantId),
      mockApi.getSalesCustomerFollowups(tenantId),
      mockApi.getSalesCustomerCommissions(tenantId),
    ]);
    setDetail(detailData);
    setOrders(ordersData);
    setUsage(usageData);
    setFollowups(followupsData);
    setCommissions(commissionData);
    setDraft({
      accountManagerNote: detailData.accountManagerNote || '',
      salesRemark: detailData.salesRemark || '',
      customTags: detailData.customTags.join('、'),
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleSave = async () => {
    await mockApi.updateSalesCustomer(tenantId, {
      accountManagerNote: draft.accountManagerNote,
      salesRemark: draft.salesRemark,
      customTags: draft.customTags.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
    });
    Message.success('客户备注已更新');
    loadData();
  };

  const handleCreateFollowup = async () => {
    if (!followForm.content.trim()) {
      Message.error('请输入跟进内容');
      return;
    }
    await mockApi.createSalesCustomerFollowup(tenantId, {
      channel: followForm.channel as SalesFollowupChannel,
      content: followForm.content,
      nextFollowupAt: followForm.nextFollowupAt || undefined,
      remind: followForm.remind,
    });
    Message.success('跟进已记录');
    setFollowVisible(false);
    setFollowForm({
      channel: 'phone',
      content: '',
      nextFollowupAt: '',
      remind: true,
    });
    loadData();
    setActiveTab('followups');
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) {
      Message.error('请输入流失原因');
      return;
    }
    await mockApi.markSalesCustomerLost(tenantId, { reason: lostReason });
    Message.success('已标记为流失');
    setLostVisible(false);
    setLostReason('');
    loadData();
    setActiveTab('followups');
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载客户详情" />;
  }

  return (
    <div className="sales-detail-screen">
      <div className="sales-detail-header">
        <Button type="text" onClick={() => navigate(`${salesBasePath}/customers`)}>返回客户池</Button>
        <div className="sales-detail-header__main">
          <Title heading={4}>{detail.tenantName}</Title>
          <Text type="secondary">绑定来源：{detail.bindingSourceLabel} · 归属剩余 {calcAttributionLabel(detail.attributionStarted, detail.attributionValidUntil)}</Text>
        </div>
        <Space className="sales-detail-header__actions">
          <CustomerStatusTag status={detail.customerStatus} />
          <Button type="primary" onClick={() => setFollowVisible(true)}>新增跟进</Button>
          {canMarkCustomerLost(detail.customerStatus) ? (
            <Button status="danger" onClick={() => setLostVisible(true)}>标记流失</Button>
          ) : null}
        </Space>
      </div>

      <Card bordered className="sales-detail-summary">
        <div className="sales-info-grid">
          <div><span>统一社会信用代码</span><strong>{detail.uscc}</strong></div>
          <div><span>行业</span><strong>{detail.industry}</strong></div>
          <div><span>联系人</span><strong>{detail.primaryContactName}</strong></div>
          <div><span>电话</span><strong>{maskPhone(detail.primaryContactPhone)}</strong></div>
          <div><span>首次开通</span><strong>{detail.firstActivatedAt || '待开通'}</strong></div>
          <div><span>归属窗口</span><strong>{calcAttributionLabel(detail.attributionStarted, detail.attributionValidUntil)}</strong></div>
          <div><span>累计回款</span><strong>{money(detail.totalPaidAmount)}</strong></div>
          <div><span>累计佣金</span><strong>{money(detail.totalCommissionAmount)}</strong></div>
        </div>
      </Card>

      <SalesTabsPanel>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <TabPane key="basic" title="基本信息">
            <div className="sales-info-panels">
              <div className="sales-info-card">
                <div className="sales-detail-section__title">企业信息</div>
                <div className="sales-info-grid sales-info-grid--two">
                  <div><span>企业管理员</span><strong>{detail.adminName}</strong></div>
                  <div><span>管理员邮箱</span><strong>{detail.adminEmail}</strong></div>
                  <div><span>企业地址</span><strong>{detail.address}</strong></div>
                  <div><span>公司规模</span><strong>{detail.companySize}</strong></div>
                  <div><span>阶段</span><strong>{detail.companyStage}</strong></div>
                  <div><span>活跃员工数</span><strong>{detail.activeEmployeeCount}</strong></div>
                  <div><span>归属开始</span><strong>{detail.firstActivatedAt || '待开通'}</strong></div>
                  <div><span>归属到期</span><strong>{detail.attributionValidUntil || '待开通'}</strong></div>
                </div>
              </div>

              <div className="sales-info-card">
                <div className="sales-detail-section__title">销售维护字段</div>
                <div className="sales-form-grid sales-form-grid--single">
                  <label>
                    <span>客户运维备注</span>
                    <Input value={draft.accountManagerNote} onChange={(value) => setDraft((current) => ({ ...current, accountManagerNote: value }))} />
                  </label>
                  <label>
                    <span>自定义标签</span>
                    <Input value={draft.customTags} onChange={(value) => setDraft((current) => ({ ...current, customTags: value }))} placeholder="用 、 分隔" />
                  </label>
                  <label>
                    <span>销售备注</span>
                    <Input.TextArea rows={5} value={draft.salesRemark} onChange={(value) => setDraft((current) => ({ ...current, salesRemark: value }))} />
                  </label>
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane key="orders" title="订单历史">
            <Table
              rowKey="id"
              pagination={false}
              data={orders}
              columns={[
                { title: '订单号', dataIndex: 'id' },
                { title: '类型', dataIndex: 'type' },
                { title: '套餐', dataIndex: 'planName' },
                { title: '金额', dataIndex: 'amount', render: (value: number) => money(value) },
                { title: '支付方式', dataIndex: 'paymentMethod', render: paymentMethodLabel },
                { title: '状态', dataIndex: 'status' },
                { title: '席位状态', dataIndex: 'seatStatus', render: (value: string) => seatStatusMeta[value] || value },
                { title: '开通状态', dataIndex: 'openingStatus', render: (value?: SalesOpeningTaskStatus) => (value ? <OpeningTaskStatusTag status={value} /> : '-') },
                { title: '付款时间', dataIndex: 'paidAt', render: formatDateTime },
                { title: '激活时间', dataIndex: 'activatedAt', render: formatDateTime },
                { title: '关联佣金', dataIndex: 'commissionStatus', render: (value?: SalesCommissionStatus) => (value ? <CommissionStatusTag status={value} /> : '-') },
              ]}
            />
          </TabPane>

          <TabPane key="usage" title="消耗趋势">
            <div className="chart-box chart-box--large">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={usage}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="tokenConsumed" stroke="#165DFF" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="activeEmployees" stroke="#14C9C9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabPane>

          <TabPane key="followups" title="跟进记录">
            {followups.length ? (
              <Timeline className="sales-timeline">
                {followups.map((item) => (
                  <Timeline.Item key={item.id} label={item.createdAt}>
                    <div className="sales-followup-item">
                      <div className="sales-followup-item__head">
                        <Tag>{followupChannels.find((channel) => channel.value === item.channel)?.label || item.channel}</Tag>
                        <Text type="secondary">{item.nextFollowupAt ? `下次跟进：${item.nextFollowupAt}` : '未设置下次跟进'}</Text>
                      </div>
                      <div>{item.content}</div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无跟进记录" />
            )}
          </TabPane>

          <TabPane key="commissions" title="佣金流水">
            <Table
              rowKey="id"
              pagination={false}
              data={commissions}
              columns={[
                { title: '订单号', dataIndex: 'orderId' },
                { title: '订单金额', dataIndex: 'orderAmount', render: (value: number) => money(value) },
                { title: '佣金金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
                { title: '状态', dataIndex: 'status', render: (value: SalesCommissionStatus) => <CommissionStatusTag status={value} /> },
                { title: '生成时间', dataIndex: 'generatedAt' },
              ]}
            />
          </TabPane>
        </Tabs>
      </SalesTabsPanel>

      <div className="sales-detail-footer">
        <Space>
          <Button onClick={() => navigate(`${salesBasePath}/customers`)}>返回</Button>
          <Button type="primary" onClick={handleSave}>保存备注</Button>
        </Space>
      </div>

      <Modal
        title="新增跟进"
        visible={followVisible}
        onCancel={() => setFollowVisible(false)}
        onOk={handleCreateFollowup}
      >
        <Space direction="vertical" size={14} className="full-width">
          <Select value={followForm.channel} onChange={(value) => setFollowForm((current) => ({ ...current, channel: value }))}>
            {followupChannels.map((channel) => (
              <Select.Option key={channel.value} value={channel.value}>{channel.label}</Select.Option>
            ))}
          </Select>
          <Input.TextArea
            rows={5}
            value={followForm.content}
            onChange={(value) => setFollowForm((current) => ({ ...current, content: value }))}
            placeholder="记录这次沟通结果和下步动作"
          />
          <Input
            value={followForm.nextFollowupAt}
            onChange={(value) => setFollowForm((current) => ({ ...current, nextFollowupAt: value }))}
            placeholder="下次跟进时间，如 2026-05-06 10:00"
          />
          <Checkbox checked={followForm.remind} onChange={(value) => setFollowForm((current) => ({ ...current, remind: value }))}>
            启用提醒
          </Checkbox>
        </Space>
      </Modal>

      <Modal
        title="标记流失"
        visible={lostVisible}
        onCancel={() => setLostVisible(false)}
        onOk={handleMarkLost}
      >
        <Input.TextArea
          rows={4}
          value={lostReason}
          onChange={setLostReason}
          placeholder="填写流失原因，如预算取消、长期无响应、已选友商"
        />
      </Modal>
    </div>
  );
}

export function SalesSharePage() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<SalesShareLinkRecord[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'link' | 'registrations'>('link');
  const [registrations, setRegistrations] = useState<SalesRegistrationRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState({
    name: '',
    expiresInDays: undefined as number | undefined,
    maxUses: undefined as number | undefined,
    remark: '',
  });

  const loadData = async () => {
    setLoading(true);
    const linkRows = await mockApi.getSalesShareLinks();
    setLinks(linkRows);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentLink = useMemo(
    () => links.find((item) => item.status === 'active') ?? links[0],
    [links],
  );

  const filteredLinks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return links;
    }
    return links.filter((item) =>
      [item.name, item.shortCode, item.shortUrl, item.remark]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedKeyword)),
    );
  }, [keyword, links]);

  const metrics = useMemo<Metric[]>(() => {
    const activeCount = links.filter((item) => item.status === 'active').length;
    const totalRegistrations = links.reduce((sum, item) => sum + item.usedCount, 0);
    const expiringCount = links.filter((item) => {
      if (item.status !== 'active' || !item.expiresAt) {
        return false;
      }
      const diff = new Date(item.expiresAt).getTime() - Date.now();
      const days = Math.ceil(diff / 86400000);
      return days >= 0 && days <= 7;
    }).length;
    const unavailableCount = links.filter((item) => item.status !== 'active').length;

    return [
      { label: '生效链接', value: activeCount, trend: '当前可继续归因' },
      { label: '累计注册', value: totalRegistrations, trend: '按链接注册次数累计' },
      { label: '7 日内到期', value: expiringCount, trend: '建议提前续期或补链' },
      { label: '不可用链接', value: unavailableCount, trend: '停用 / 过期 / 耗尽' },
    ];
  }, [links]);

  const openCreator = () => {
    setDraft({ name: '', expiresInDays: undefined, maxUses: undefined, remark: '' });
    setDrawerMode('link');
    setDrawerVisible(true);
  };

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      Message.error('请输入名称');
      return;
    }
    await mockApi.createSalesShareLink(draft);
    Message.success('分享链接已生成');
    setDrawerVisible(false);
    loadData();
  };

  const openRegistrations = async (linkId: string) => {
    const items = await mockApi.getSalesShareLinkRegistrations(linkId);
    setRegistrations(items);
    setDrawerMode('registrations');
    setDrawerVisible(true);
  };

  return (
    <SalesPageShell
      title="分享链接"
      description="管理注册链接、归因效果和注册转化，不承担付款后的席位激活"
      action={(
        <Space>
          <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<IconPlus />} onClick={openCreator}>生成链接</Button>
        </Space>
      )}
    >
      <Spin loading={loading}>
        <Row gutter={16}>
          {metrics.map((metric) => (
            <Col xs={24} sm={12} xl={6} key={metric.label}>
              <MetricCard metric={metric} />
            </Col>
          ))}
        </Row>

        <Row gutter={18}>
          <Col xs={24} lg={10} xl={9}>
            <SalesPanel title="当前主分享链接">
              {currentLink ? (
                <div className="sales-share-primary">
                  <div className="sales-share-primary__head">
                    <div className="sales-share-primary__identity">
                      <Text type="secondary">默认注册链接</Text>
                      <div className="sales-share-primary__code">{currentLink.shortCode}</div>
                      <Text>{currentLink.name}</Text>
                    </div>
                    <InviteStatusTag status={currentLink.status} />
                  </div>
                  <label className="sales-field">
                    <span>分享地址</span>
                    <Input
                      value={currentLink.shortUrl}
                      readOnly
                      addAfter={(
                        <Button
                          type="text"
                          icon={<IconCopy />}
                          onClick={() => copyText(currentLink.shortUrl)}
                        >
                          复制
                        </Button>
                      )}
                    />
                  </label>
                  <div className="sales-info-grid sales-info-grid--two sales-share-primary__meta">
                    <div>
                      <span>累计注册</span>
                      <strong>{currentLink.usedCount}</strong>
                    </div>
                    <div>
                      <span>注册上限</span>
                      <strong>{currentLink.maxUses ?? '不限'}</strong>
                    </div>
                    <div>
                      <span>到期时间</span>
                      <strong>{formatDateTime(currentLink.expiresAt)}</strong>
                    </div>
                    <div>
                      <span>创建时间</span>
                      <strong>{formatDateTime(currentLink.createdAt)}</strong>
                    </div>
                    <div className="sales-share-primary__meta-item sales-share-primary__meta-item--full">
                      <span>归因备注</span>
                      <strong>{currentLink.remark || '未填写'}</strong>
                    </div>
                  </div>
                  <div className="sales-share-actions">
                    <Button icon={<IconQrcode />} onClick={() => Message.success('二维码 PNG 已生成')}>下载二维码</Button>
                    <Button icon={<IconLink />} onClick={() => openRegistrations(currentLink.id)}>查看注册明细</Button>
                  </div>
                  <Text type="secondary" className="sales-share-primary__hint">
                    客户通过该链接完成注册后，会自动归因到当前销售名下。
                  </Text>
                </div>
              ) : (
                <Empty description="暂无分享链接" />
              )}
            </SalesPanel>
          </Col>
          <Col xs={24} lg={14} xl={15}>
            <SalesPanel title="全部分享链接">
              <div className="sales-filter-bar sales-share-filter-bar">
                <Input.Search
                  value={keyword}
                  onChange={setKeyword}
                  placeholder="搜索链接名称、短码、地址"
                  className="table-search table-search--wide"
                />
                <Text type="secondary">共 {filteredLinks.length} 条</Text>
              </div>
              <Table
                rowKey="id"
                pagination={false}
                data={filteredLinks}
                columns={[
                  { title: '名称', dataIndex: 'name' },
                  { title: '短码', dataIndex: 'shortCode', width: 108 },
                  {
                    title: '短链地址',
                    dataIndex: 'shortUrl',
                    render: (value: string) => (
                      <Tooltip content={value}>
                        <span className="sales-ellipsis">{value}</span>
                      </Tooltip>
                    ),
                  },
                  { title: '已使用', dataIndex: 'usedCount', width: 88 },
                  { title: '上限', dataIndex: 'maxUses', width: 88, render: (value: number | null) => value ?? '不限' },
                  { title: '到期', dataIndex: 'expiresAt', width: 144, render: formatDateTime },
                  { title: '状态', dataIndex: 'status', width: 96, render: (value: SalesInviteResourceStatus) => <InviteStatusTag status={value} /> },
                  {
                    title: '操作',
                    width: 160,
                    render: (_: unknown, row: SalesShareLinkRecord) => (
                      <Space size={8}>
                        <Button type="text" size="mini" onClick={() => copyText(row.shortUrl)}>复制</Button>
                        <Button type="text" size="mini" onClick={() => openRegistrations(row.id)}>注册</Button>
                        <Button
                          type="text"
                          size="mini"
                          disabled={row.status !== 'active'}
                          onClick={async () => {
                            await mockApi.disableSalesShareLink(row.id);
                            Message.success('链接已停用');
                            void loadData();
                          }}
                        >
                          停用
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </SalesPanel>
          </Col>
        </Row>
      </Spin>

      <Drawer
        width={720}
        className="sales-share-drawer"
        title={drawerMode === 'registrations' ? '注册明细' : '生成分享链接'}
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        footer={
          drawerMode === 'registrations' ? null : (
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleCreate}>保存</Button>
            </Space>
          )
        }
      >
        {drawerMode === 'registrations' ? (
          <Table
            rowKey="id"
            pagination={false}
            data={registrations}
            columns={[
              { title: '客户名', dataIndex: 'tenantName' },
              { title: '统一社会信用代码', dataIndex: 'uscc' },
              { title: '联系人', dataIndex: 'contactName' },
              { title: '时间', dataIndex: 'createdAt' },
              { title: '来源', dataIndex: 'sourceLabel' },
            ]}
          />
        ) : (
          <Space direction="vertical" size={18} className="full-width">
            <label className="sales-field">
              <span>名称</span>
              <Input value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder="例如：默认分享链接" />
            </label>
            <label className="sales-field">
              <span>有效期（天）</span>
              <InputNumber
                value={draft.expiresInDays}
                onChange={(value) => setDraft((current) => ({ ...current, expiresInDays: Number(value) || undefined }))}
                placeholder="留空为永久"
                style={{ width: '100%' }}
              />
            </label>
            <label className="sales-field">
              <span>最大注册次数</span>
              <InputNumber
                value={draft.maxUses}
                onChange={(value) => setDraft((current) => ({ ...current, maxUses: Number(value) || undefined }))}
                placeholder="留空为不限"
                style={{ width: '100%' }}
              />
            </label>
            <label className="sales-field">
              <span>关联备注</span>
              <Input.TextArea
                value={draft.remark}
                onChange={(value) => setDraft((current) => ({ ...current, remark: value }))}
                rows={4}
                placeholder="例如：会场地推、合作渠道、区域归因说明"
              />
            </label>
          </Space>
        )}
      </Drawer>
    </SalesPageShell>
  );
}

export function SalesOpeningTasksPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesOrderFollowupRecord[]>([]);
  const [activeOrder, setActiveOrder] = useState<SalesOrderFollowupRecord>();
  const [proofOrder, setProofOrder] = useState<SalesOrderFollowupRecord>();
  const [proofName, setProofName] = useState('');
  const [proofAmount, setProofAmount] = useState(0);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await mockApi.getSalesOrderFollowups();
    setRows(data);
    setActiveOrder((current) => (current ? data.find((item) => item.id === current.id) ?? current : undefined));
    setLoading(false);
    return data;
  };

  const canUploadProof = (row: SalesOrderFollowupRecord) =>
    row.paymentMethod === 'bank_transfer' &&
    row.orderStatus === 'pending' &&
    row.followupStatus === 'pending_payment';
  const isPendingPayment = (row: SalesOrderFollowupRecord) =>
    row.orderStatus === 'pending' && row.followupStatus === 'pending_payment';
  const getPaymentCodeLabel = (row: SalesOrderFollowupRecord) =>
    `${row.paymentMethod === 'alipay' ? '支付宝' : '微信'}支付码 ${row.orderId}`;
  const getPendingPaymentText = (row: SalesOrderFollowupRecord) => {
    if (row.paymentMethod === 'bank_transfer') {
      return [
        `客户：${row.tenantName}`,
        `订单号：${row.orderId}`,
        `收款主体：${BANK_TRANSFER_PAYEE}`,
        `开户银行：${BANK_TRANSFER_BANK}`,
        `银行账号：${BANK_TRANSFER_ACCOUNT}`,
        `转账金额：${money(row.orderAmount)}`,
      ].join('\n');
    }
    return [
      `客户：${row.tenantName}`,
      `订单号：${row.orderId}`,
      `金额：${money(row.orderAmount)}`,
      `付款码：${getPaymentCodeLabel(row)}`,
    ].join('\n');
  };

  const savePaymentCode = (row: SalesOrderFollowupRecord) => {
    const blob = new Blob([getPendingPaymentText(row)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-code-${row.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    Message.success('付款码已保存');
  };

  const openProofModal = (row: SalesOrderFollowupRecord) => {
    setProofOrder(row);
    setProofName(`proof_${row.orderId}.png`);
    setProofAmount(row.orderAmount);
  };

  const closeProofModal = () => {
    setProofOrder(undefined);
    setProofName('');
    setProofAmount(0);
  };

  const handleSelectProofFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    Message.success(`已选择凭证：${file.name}`);
    event.target.value = '';
  };

  const submitProof = async () => {
    if (!proofOrder) return;
    if (!proofName.trim()) {
      Message.warning('请输入付款凭证文件名');
      return;
    }
    if (!proofAmount) {
      Message.warning('请输入到账金额');
      return;
    }
    setProofSubmitting(true);
    try {
      await mockApi.submitSalesAssistedBankTransferProof(proofOrder.orderId, {
        proofName: proofName.trim(),
        uploadedAmount: proofAmount,
      });
      Message.success('支付凭证已提交，等待对公审核');
      closeProofModal();
      await loadData();
    } finally {
      setProofSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SalesPageShell
      title="订单跟进"
      description="跟进客户订单付款、对公审核和交付开通进度"
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <SalesTablePanel>
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '订单号', dataIndex: 'orderId' },
            { title: '客户', dataIndex: 'tenantName' },
            {
              title: '订单类型',
              render: (_: unknown, row: SalesOrderFollowupRecord) => orderSummaryLabel(row.planName, row.bundleLines),
            },
            { title: '订单金额', dataIndex: 'orderAmount', render: (value: number) => money(value) },
            { title: '支付方式', dataIndex: 'paymentMethod', render: paymentMethodLabel },
            {
              title: '订单状态',
              dataIndex: 'orderStatus',
              render: (value: AdminPaymentStatus) => <OrderStatusTag status={value} />,
            },
            {
              title: '开通进度',
              dataIndex: 'followupStatus',
              render: (value: SalesOrderFollowupStatus) => <OrderFollowupStatusTag status={value} />,
            },
            {
              title: '最近更新',
              dataIndex: 'updatedAt',
              render: formatDateTime,
            },
            {
              title: '操作',
              render: (_: unknown, row: SalesOrderFollowupRecord) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => setActiveOrder(row)}>
                    详情
                  </Button>
                  {canUploadProof(row) ? (
                    <Button type="text" size="mini" onClick={() => openProofModal(row)}>
                      代上传支付凭证
                    </Button>
                  ) : null}
                  <Button
                    type="text"
                    size="mini"
                    disabled={!['paid_waiting_delivery', 'delivery_processing'].includes(row.followupStatus)}
                    onClick={() => Message.success('已提醒交付负责人跟进订单')}
                  >
                    提醒交付
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </SalesTablePanel>
      <Drawer
        title={activeOrder ? `订单跟进 ${activeOrder.orderId}` : '订单跟进'}
        visible={Boolean(activeOrder)}
        width={620}
        footer={null}
        onCancel={() => setActiveOrder(undefined)}
      >
        {activeOrder ? (
          <Space direction="vertical" size={16} className="full-width">
            <OpeningProgressPanel
              status={normalizeOpeningProgressStatus(activeOrder.openingStatus, activeOrder.orderStatus)}
              orderId={activeOrder.orderId}
              taskId={activeOrder.openingTaskId}
              owner={activeOrder.deliveryOwner}
              updatedAt={formatDateTime(activeOrder.updatedAt)}
            />
            <Descriptions
              column={1}
              data={[
                { label: '客户', value: activeOrder.tenantName },
                { label: '订单号', value: activeOrder.orderId },
                {
                  label: '订单类型',
                  value: orderSummaryLabel(activeOrder.planName, activeOrder.bundleLines),
                },
                {
                  label: '购买内容',
                  value: (
                    <div>
                      {orderBundleDetailLines(activeOrder.bundleLines).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  ),
                },
                { label: '订单金额', value: money(activeOrder.orderAmount) },
                { label: '支付方式', value: paymentMethodLabel(activeOrder.paymentMethod) },
                { label: '订单状态', value: <OrderStatusTag status={activeOrder.orderStatus} /> },
                ...(activeOrder.paymentMethod === 'bank_transfer'
                  ? [
                      { label: '付款凭证', value: activeOrder.proofName || '-' },
                      {
                        label: '对公审核',
                        value: activeOrder.bankReviewStatus ? <BankReviewStatusTag status={activeOrder.bankReviewStatus} /> : '-',
                      },
                      { label: '银行流水号', value: activeOrder.bankSerialNo || '-' },
                    ]
                  : []),
                { label: '交付负责人', value: activeOrder.deliveryOwner || '待分配' },
              ]}
            />
            {isPendingPayment(activeOrder) ? (
              <Card bordered title="待付款方式">
                {activeOrder.paymentMethod === 'bank_transfer' ? (
                  <Space direction="vertical" size={14} className="full-width">
                    <Descriptions
                      column={1}
                      data={[
                        { label: '客户', value: activeOrder.tenantName },
                        { label: '订单号', value: activeOrder.orderId },
                        { label: '收款主体', value: BANK_TRANSFER_PAYEE },
                        { label: '开户银行', value: BANK_TRANSFER_BANK },
                        { label: '银行账号', value: BANK_TRANSFER_ACCOUNT },
                        { label: '转账金额', value: money(activeOrder.orderAmount) },
                      ]}
                    />
                    <Space>
                      <Button icon={<IconCopy />} onClick={() => copyText(getPendingPaymentText(activeOrder), '转账信息已复制')}>复制转账信息</Button>
                      {canUploadProof(activeOrder) ? <Button icon={<IconUpload />} onClick={() => openProofModal(activeOrder)}>代上传支付凭证</Button> : null}
                    </Space>
                  </Space>
                ) : (
                  <Space direction="vertical" size={14} className="full-width">
                    <Descriptions
                      column={1}
                      data={[
                        { label: '客户', value: activeOrder.tenantName },
                        { label: '订单号', value: activeOrder.orderId },
                        { label: '金额', value: money(activeOrder.orderAmount) },
                        { label: '付款码', value: getPaymentCodeLabel(activeOrder) },
                      ]}
                    />
                    <div className="electronic-payment-panel electronic-payment-panel--stacked">
                      <div className="electronic-payment-qr">
                        <span>{activeOrder.paymentMethod === 'alipay' ? '支付宝' : '微信'}付款码</span>
                        <small>{getPaymentCodeLabel(activeOrder)} · {money(activeOrder.orderAmount)}</small>
                      </div>
                    </div>
                    <Space>
                      <Button icon={<IconDownload />} onClick={() => savePaymentCode(activeOrder)}>保存付款码</Button>
                    </Space>
                  </Space>
                )}
              </Card>
            ) : null}
          </Space>
        ) : null}
      </Drawer>
      <Modal
        title="代上传支付凭证"
        visible={Boolean(proofOrder)}
        onCancel={closeProofModal}
        confirmLoading={proofSubmitting}
        onOk={submitProof}
        okText="提交支付凭证"
        cancelText="取消"
      >
        {proofOrder ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '客户', value: proofOrder.tenantName },
                { label: '订单号', value: proofOrder.orderId },
                { label: '订单金额', value: money(proofOrder.orderAmount) },
              ]}
            />
            <div className="payment-proof-panel">
              <Text className="field-label">支付凭证</Text>
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleSelectProofFile}
              />
              <Space direction="vertical" size={8} className="full-width">
                <Button icon={<IconUpload />} onClick={() => proofInputRef.current?.click()}>选择凭证文件</Button>
                <Input value={proofName} onChange={setProofName} placeholder="例如 bank-proof.png" />
              </Space>
              <Text className="field-label">到账金额</Text>
              <InputNumber value={proofAmount} onChange={(value) => setProofAmount(Number(value) || 0)} min={0} className="full-width" />
            </div>
          </Space>
        ) : null}
      </Modal>
    </SalesPageShell>
  );
}

export function AgentCommissionPage() {
  const location = useLocation();
  const role = resolveAgentCommissionRole(location.pathname);
  const isSalesRole = role === 'agentSales';
  const isAgentAdminRole = role === 'agentAdmin';
  const onlyDistributionView = isSalesRole || isAgentAdminRole;
  const [view, setView] = useState<AgentCommissionView>(onlyDistributionView ? 'distribution' : 'agent');
  const activeView: AgentCommissionView = onlyDistributionView ? 'distribution' : view;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<AgentCommissionSummary>();
  const [bankAccount, setBankAccount] = useState<SalesBankAccount | undefined>();
  const [query, setQuery] = useState<AgentCommissionQuery>({
    q: '',
    status: [],
    dateFrom: '',
    dateTo: '',
  });
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (onlyDistributionView) {
      setView('distribution');
    }
  }, [onlyDistributionView]);

  const loadData = async () => {
    setLoading(true);
    const [commissionRows, summaryRow, payoutAccount] = await Promise.all([
      mockApi.getAgentCommissions(activeView, query, role),
      mockApi.getAgentCommissionSummary(activeView, query, role),
      mockApi.getAgentCommissionPayoutAccount(),
    ]);
    setRows(commissionRows);
    setSummary(summaryRow);
    setBankAccount(payoutAccount);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [activeView, role, query.q, query.status, query.dateFrom, query.dateTo]);

  const withdrawableRows = activeView === 'agent' ? rows.filter((item) => item.status === 'withdrawable') as AgentCommissionRecord[] : [];
  const withdrawableAmount = withdrawableRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const bankConfigured = bankAccount?.status === 'active';
  const canWithdraw = !onlyDistributionView && activeView === 'agent';

  const pageTitle = isSalesRole ? '我的销售分佣' : isAgentAdminRole ? '销售分佣' : '佣金管理';
  const pageDescription = isSalesRole
    ? '查看内部发给我的销售分佣流水、状态和月度发放进度'
    : isAgentAdminRole
      ? '查看代理内部发给销售的分佣流水、状态和月度发放进度'
      : role === 'agentFinance'
      ? '区分平台返给代理的佣金与代理内部发给销售的分佣，便于对账、处理和跟进打款'
      : '区分平台返给代理的佣金与代理内部发给销售的分佣，便于经营查看、提现申请和结算跟进';

  const handleWithdraw = async () => {
    if (!withdrawableRows.length) {
      Message.info('当前没有可提现代理佣金');
      return;
    }
    if (!bankConfigured) {
      Message.error('暂未配置收款账户，请联系平台管理员维护');
      return;
    }
    setWithdrawLoading(true);
    const result = await mockApi.requestAgentCommissionWithdraw(withdrawableRows.map((item) => item.id));
    if (!result?.updatedCount) {
      Message.info('当前没有可提现代理佣金');
      setWithdrawLoading(false);
      return;
    }
    Message.success(`已发起 ${result.updatedCount} 笔代理佣金提现，金额 ${money(result.amount)}`);
    setWithdrawModalVisible(false);
    setWithdrawLoading(false);
    void loadData();
  };

  const viewMetrics = activeView === 'agent'
    ? [
        { label: '待确认代理佣金', value: money(summary?.pendingAmount ?? 0), trend: '待代理财务确认', help: '平台返给代理的佣金，进入待确认后表示已入账但还未完成代理侧复核。' },
        { label: '累计已打款', value: money(summary?.paidAmount ?? 0), trend: '平台已完成返佣', help: '平台已线下打给代理的返佣总额，用于核对历史已到账款项。' },
        { label: '提现处理中', value: money(summary?.withdrawingAmount ?? 0), trend: '等待平台财务打款', help: '代理已经发起提现申请，平台财务正在处理线下打款。' },
        { label: '可提现代理佣金', value: money(summary?.withdrawableAmount ?? 0), trend: '可发起代理提现', help: '当前已经确认且可发起提现的代理佣金总额。' },
      ]
    : [
        { label: isSalesRole ? '待发放分佣' : '待发放销售分佣', value: money(summary?.pendingAmount ?? 0), trend: '待代理财务发放', help: '已生成但尚未进入发放流程的内部销售分佣。' },
        { label: '处理中分佣', value: money(summary?.processingAmount ?? 0), trend: '代理财务处理中', help: '代理财务已开始处理，但尚未最终打款的内部销售分佣。' },
        { label: '累计已发放', value: money(summary?.paidAmount ?? 0), trend: '历史已发给销售', help: '代理已经完成打款的内部销售分佣总额。' },
        { label: '已冲销分佣', value: money(summary?.revertedAmount ?? 0), trend: '退款后回退', help: '对应客户退款或订单冲销后，被回退的内部销售分佣。' },
      ];

  const activeStatusOptions = activeView === 'agent' ? agentCommissionStatusOptions.filter((item) => item.value !== 'processing') : agentCommissionStatusOptions.filter((item) => item.value !== 'confirmed' && item.value !== 'withdrawable' && item.value !== 'withdrawing');

  return (
    <SalesPageShell
      title={pageTitle}
      description={pageDescription}
    >
      {onlyDistributionView ? null : (
        <Tabs activeTab={view} onChange={(value) => setView(value as AgentCommissionView)}>
          <TabPane key="agent" title="代理佣金" />
          <TabPane key="distribution" title="销售分佣" />
        </Tabs>
      )}

      <Row gutter={16}>
        {viewMetrics.map((item) => (
          <Col key={item.label} span={6}>
            <CommissionMetricCard
              metric={{ label: item.label, value: item.value, trend: item.trend }}
              help={item.help}
              action={item.label === '可提现代理佣金' && canWithdraw ? (
                <Button
                  className="commission-withdraw-action"
                  size="mini"
                  type="primary"
                  loading={withdrawLoading}
                  disabled={!summary?.withdrawableAmount}
                  onClick={() => setWithdrawModalVisible(true)}
                >
                  申请提现
                </Button>
              ) : null}
            />
          </Col>
        ))}
      </Row>

      <SalesTablePanel
        toolbar={(
          <div className="commission-table-toolbar">
            <div className="sales-filter-bar">
              <Input.Search value={query.q} onChange={(value) => setQuery((current) => ({ ...current, q: value }))} placeholder="搜索订单号、客户" className="table-search table-search--wide" />
              <Select
                allowClear
                value={query.status?.[0]}
                onChange={(status) => setQuery((current) => ({ ...current, status: status ? [status as AgentCommissionStatus] : [] }))}
                placeholder="流水状态"
                className="commission-status-filter"
              >
                {activeStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.text}</Select.Option>)}
              </Select>
              <RangePicker
                value={query.dateFrom && query.dateTo ? [query.dateFrom, query.dateTo] : []}
                onChange={(value) => setQuery((current) => ({
                  ...current,
                  dateFrom: value?.[0] || '',
                  dateTo: value?.[1] || '',
                }))}
                style={{ width: 260 }}
                placeholder={['开始日期', '结束日期']}
              />
            </div>
            <Button icon={<IconDownload />} onClick={async () => { const result = await mockApi.exportAgentCommissions(activeView, role); Message.success(`已生成 ${result.fileName}`); }}>导出表格</Button>
          </div>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={
            activeView === 'agent'
              ? ([
                  { title: '订单号', dataIndex: 'orderId' },
                  { title: '客户', dataIndex: 'tenantName' },
                  { title: '实付金额', dataIndex: 'paidAmount', render: (value: number) => money(value) },
                  { title: '代理佣金率', dataIndex: 'rate', render: (value: number) => `${Math.round(value * 1000) / 10}%` },
                  { title: '代理佣金', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
                  { title: '状态', dataIndex: 'status', render: (value: AgentCommissionStatus) => <AgentCommissionStatusTag status={value} /> },
                  { title: '可提现时间', dataIndex: 'withdrawableAt', render: (value?: string) => formatDateTime(value) },
                  { title: '操作', width: 120, render: (_: unknown, row?: AgentCommissionRecord) => row ? <Button type="text" size="mini" onClick={() => setDetailRow(row)}>详情</Button> : null },
                ] as any)
              : ([
                  { title: '订单号', dataIndex: 'orderId' },
                  { title: '客户', dataIndex: 'tenantName' },
                  ...(isSalesRole ? [] : [{ title: '销售', dataIndex: 'salesName' }]),
                  { title: '实付金额', dataIndex: 'paidAmount', render: (value: number) => money(value) },
                  { title: '分佣率', dataIndex: 'rate', render: (value: number) => `${Math.round(value * 1000) / 10}%` },
                  { title: '分佣金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
                  { title: '状态', dataIndex: 'status', render: (value: AgentCommissionStatus) => <AgentCommissionStatusTag status={value} /> },
                  { title: '发放时间', dataIndex: 'paidAt', render: (value?: string) => formatDateTime(value) },
                  { title: '操作', width: 120, render: (_: unknown, row?: AgentCommissionDistributionRecord) => row ? <Button type="text" size="mini" onClick={() => setDetailRow(row)}>详情</Button> : null },
                ] as any)
          }
        />
      </SalesTablePanel>

      <Modal
        title={activeView === 'agent' ? '代理佣金详情' : '销售分佣详情'}
        visible={Boolean(detailRow)}
        footer={null}
        onCancel={() => setDetailRow(null)}
        style={{ width: 820 }}
      >
        {detailRow ? (
          <Space direction="vertical" size={16} className="full-width">
            <Card title="订单信息" bordered={false} className="admin-detail-card">
              <Descriptions
                column={2}
                data={[
                  { label: '订单号', value: detailRow.orderId },
                  { label: '客户', value: detailRow.tenantName },
                  { label: '实付金额', value: money(detailRow.paidAmount ?? detailRow.orderAmount) },
                  { label: '生成时间', value: formatDateTime(detailRow.generatedAt) },
                ]}
              />
            </Card>
            <Card title={activeView === 'agent' ? '代理返佣信息' : '销售分佣信息'} bordered={false} className="admin-detail-card">
              <Descriptions
                column={2}
                data={[
                  { label: '状态', value: <AgentCommissionStatusTag status={detailRow.status as AgentCommissionStatus} /> },
                  { label: activeView === 'agent' ? '代理佣金金额' : '销售分佣金额', value: <Text bold>{money(detailRow.commissionAmount)}</Text> },
                  { label: activeView === 'agent' ? '代理佣金率' : '销售分佣率', value: typeof detailRow.rate === 'number' ? `${Math.round(detailRow.rate * 1000) / 10}%` : '-' },
                  { label: '规则', value: detailRow.ruleName || '-' },
                  { label: '已打款时间', value: formatDateTime(detailRow.paidAt) },
                  { label: activeView === 'agent' ? '可提现时间' : '处理备注', value: activeView === 'agent' ? formatDateTime(detailRow.withdrawableAt) : detailRow.settlementNote || '-' },
                  ...(activeView === 'distribution' && !isSalesRole ? [{ label: '销售', value: detailRow.salesName }] : []),
                ]}
              />
            </Card>
            <Card title="规则说明" bordered={false} className="admin-detail-card">
              <Descriptions
                column={1}
                data={[
                  { label: '计算方式', value: detailRow.calcText || '按订单实付金额 × 佣金率计算' },
                  { label: '补充说明', value: detailRow.settlementNote || (activeView === 'agent' ? '平台返给代理的返佣流水。' : '代理内部发给销售的分佣流水。') },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="确认代理佣金提现"
        visible={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        onOk={handleWithdraw}
        confirmLoading={withdrawLoading}
        okButtonProps={{ disabled: !withdrawableRows.length || !bankConfigured }}
        style={{ width: 860 }}
      >
        <Space direction="vertical" size={16} className="full-width">
          <Descriptions
            column={2}
            data={[
              { label: '收款账户', value: bankAccount?.accountName || '-' },
              { label: '开户银行', value: bankAccount?.bankName || '-' },
              { label: '开户支行', value: bankAccount?.branchName || '-' },
              { label: '银行账号', value: maskBankAccountNo(bankAccount?.accountNo) },
              { label: '账户状态', value: bankConfigured ? <Tag color="green">已配置</Tag> : <Tag color="orange">未配置</Tag> },
              { label: '提现合计', value: <Text bold>{money(withdrawableAmount)}</Text> },
            ]}
          />
          {!bankConfigured ? <Text type="warning">暂未配置可用收款账户，请联系平台管理员维护后再提现。</Text> : null}
          <Table
            rowKey="id"
            data={withdrawableRows}
            pagination={{ pageSize: 5, showTotal: true }}
            columns={[
              { title: '订单号', dataIndex: 'orderId' },
              { title: '客户', dataIndex: 'tenantName' },
              { title: '实付金额', dataIndex: 'paidAmount', render: (value: number) => money(value) },
              { title: '代理佣金', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
              { title: '可提现时间', dataIndex: 'withdrawableAt', render: (value?: string) => formatDateTime(value) },
            ]}
          />
        </Space>
      </Modal>
    </SalesPageShell>
  );
}

export function SalesCommissionPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>();
  const [bankAccount, setBankAccount] = useState<SalesBankAccount | undefined>();
  const [query, setQuery] = useState({
    q: '',
    status: [] as SalesCommissionStatus[],
    dateFrom: '',
    dateTo: '',
  });
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [commissionRows, summaryRow, profileRow] = await Promise.all([
      mockApi.getSalesCommissions(query),
      mockApi.getSalesCommissionSummary(query),
      mockApi.getSalesProfile(),
    ]);
    setRows(commissionRows);
    setSummary(summaryRow);
    setBankAccount(profileRow.bankAccount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [query.q, query.status, query.dateFrom, query.dateTo]);

  const withdrawableRows = rows.filter((item) => item.status === 'withdrawable');
  const withdrawableAmount = withdrawableRows.reduce((sum, item) => sum + item.commissionAmount, 0);
  const bankConfigured = bankAccount?.status === 'active';

  const handleWithdraw = async () => {
    if (!withdrawableRows.length) {
      Message.info('当前没有可提现佣金');
      return;
    }
    if (!bankConfigured) {
      Message.error('暂未配置收款账户，请联系平台管理员维护');
      return;
    }
    setWithdrawLoading(true);
    const ids = withdrawableRows.map((item) => item.id);
    const result = await mockApi.requestSalesCommissionWithdraw(ids);
    if (!result?.updatedCount) {
      Message.info('当前没有可提现佣金');
      setWithdrawLoading(false);
      return;
    }
    Message.success(`已发起 ${result.updatedCount} 笔提现，金额 ${money(result.amount)}`);
    setWithdrawModalVisible(false);
    setWithdrawLoading(false);
    loadData();
  };

  return (
    <SalesPageShell
      title="佣金明细"
      description="订单支付并完成开通后先进入预计佣金，满 30 天且无退款/退订后转为可提现"
    >
      <Row gutter={16}>
        <Col span={6}>
          <CommissionMetricCard
            metric={{ label: '预计佣金', value: money(summary?.estimatedAmount ?? 0), trend: '成交收益持续入账中' }}
            help="订单完成开通后进入 30 天保护期，期间计入预计佣金；满 30 天且无退款、退订后，会释放为可提现佣金。"
          />
        </Col>
        <Col span={6}>
          <CommissionMetricCard
            metric={{ label: '累计提现', value: money(summary?.withdrawnAmount ?? 0), trend: '已完成打款' }}
            help="历史已经完成打款并已到账的佣金总额，可用于核对已到账收益。"
          />
        </Col>
        <Col span={6}>
          <CommissionMetricCard
            metric={{ label: '提现中佣金', value: money(summary?.withdrawingAmount ?? 0), trend: '财务打款中' }}
            help="已发起提现申请，正在等待财务确认打款；打款完成后会进入累计提现。"
          />
        </Col>
        <Col span={6}>
          <CommissionMetricCard
            metric={{ label: '可提现佣金', value: money(summary?.withdrawableAmount ?? 0), trend: '无退款/退订后可提' }}
            help="已过保护期且没有退款、退订的佣金，可直接发起提现。"
            action={(
              <Button
                className="commission-withdraw-action"
                size="mini"
                type="primary"
                loading={withdrawLoading}
                disabled={!summary?.withdrawableAmount}
                onClick={() => setWithdrawModalVisible(true)}
              >
                一键提现
              </Button>
            )}
          />
        </Col>
      </Row>

      <SalesTablePanel
        toolbar={(
          <div className="commission-table-toolbar">
            <div className="sales-filter-bar">
              <Input.Search value={query.q} onChange={(value) => setQuery((current) => ({ ...current, q: value }))} placeholder="搜索订单号、客户" className="table-search table-search--wide" />
              <Select
                allowClear
                value={query.status[0]}
                onChange={(status) => setQuery((current) => ({ ...current, status: status ? [status as SalesCommissionStatus] : [] }))}
                placeholder="佣金状态"
                className="commission-status-filter"
              >
                {salesCommissionStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.text}</Select.Option>)}
              </Select>
              <RangePicker
                value={query.dateFrom || query.dateTo ? [query.dateFrom, query.dateTo] : []}
                onChange={(value) => setQuery((current) => ({
                  ...current,
                  dateFrom: value?.[0] || '',
                  dateTo: value?.[1] || '',
                }))}
                style={{ width: 260 }}
                placeholder={['开始日期', '结束日期']}
              />
            </div>
            <Button icon={<IconDownload />} onClick={async () => { const result = await mockApi.exportSalesCommissions(); Message.success(`已生成 ${result.fileName}`); }}>导出表格</Button>
          </div>
        )}
      >
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '订单号', dataIndex: 'orderId' },
            { title: '客户', dataIndex: 'tenantName' },
            { title: '实付金额', dataIndex: 'paidAmount', render: (value: number, row: any) => money(value ?? row.orderAmount) },
            { title: '佣金率', dataIndex: 'rate', render: (value: number) => `${Math.round(value * 1000) / 10}%` },
            { title: '佣金金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
            { title: '状态', dataIndex: 'status', render: (value: SalesCommissionStatus) => <CommissionStatusTag status={value} /> },
            { title: '佣金生成时间', dataIndex: 'activatedAt', render: (value?: string) => formatDateTime(value) },
            {
              title: '操作',
              width: 180,
              render: (_: unknown, row?: any) => row ? (
                <Space size={6}>
                  <Button type="text" size="mini" onClick={() => setDetailRow(row)}>详情</Button>
                </Space>
              ) : null,
            },
          ]}
        />
      </SalesTablePanel>

      <Modal
        title="佣金详情"
        visible={Boolean(detailRow)}
        footer={null}
        onCancel={() => setDetailRow(null)}
        style={{ width: 820 }}
      >
        {detailRow ? (
          <Space direction="vertical" size={16} className="full-width">
            <Card title="订单信息" bordered={false} className="admin-detail-card">
              <Descriptions
                column={2}
                data={[
                  { label: '订单号', value: detailRow.orderId },
                  { label: '客户', value: detailRow.tenantName },
                  { label: '实付金额', value: money(detailRow.paidAmount ?? detailRow.orderAmount) },
                  { label: '佣金生成时间', value: formatDateTime(detailRow.activatedAt) },
                ]}
              />
            </Card>
            <Card title="佣金信息" bordered={false} className="admin-detail-card">
              <Descriptions
                column={2}
                data={[
                  { label: '状态', value: <CommissionStatusTag status={detailRow.status as SalesCommissionStatus} /> },
                  {
                    label: '佣金金额',
                    value: (
                      <Space size={6}>
                        <Text bold>{money(detailRow.commissionAmount)}</Text>
                        <Tooltip content="如对佣金金额有异议，可直接联系管理员或财务处理。">
                          <Button type="text" size="mini" icon={<IconInfoCircle />} />
                        </Tooltip>
                      </Space>
                    ),
                  },
                  { label: '佣金率', value: typeof detailRow.rate === 'number' ? `${Math.round(detailRow.rate * 1000) / 10}%` : '-' },
                  { label: '佣金规则', value: detailRow.ruleType || detailRow.ruleName ? `${detailRow.ruleType || '-'} / ${detailRow.ruleName || '-'}` : '-' },
                  { label: '可提现时间', value: formatDateTime(detailRow.withdrawableAt) },
                  { label: '提现完成时间', value: formatDateTime(detailRow.paidAt) },
                ]}
              />
            </Card>
            <Card title="规则说明" bordered={false} className="admin-detail-card">
              <Descriptions
                column={1}
                data={[
                  { label: '计算方式', value: detailRow.calcText || '按订单实付金额 × 佣金率计算' },
                  { label: '释放说明', value: '订单开通后进入 30 天收益待释放期；期内无退款、退订，满 30 天后进入可提现。' },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="确认提现"
        visible={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        onOk={handleWithdraw}
        confirmLoading={withdrawLoading}
        okButtonProps={{ disabled: !withdrawableRows.length || !bankConfigured }}
        style={{ width: 860 }}
      >
        <Space direction="vertical" size={16} className="full-width">
          <Descriptions
            column={2}
            data={[
              { label: '收款账户', value: bankAccount?.accountName || '-' },
              { label: '开户银行', value: bankAccount?.bankName || '-' },
              { label: '开户支行', value: bankAccount?.branchName || '-' },
              { label: '银行账号', value: maskBankAccountNo(bankAccount?.accountNo) },
              { label: '账户状态', value: bankConfigured ? <Tag color="green">已配置</Tag> : <Tag color="orange">未配置</Tag> },
              { label: '提现合计', value: <Text bold>{money(withdrawableAmount)}</Text> },
            ]}
          />
          {!bankConfigured ? <Text type="warning">暂未配置可用收款账户，请联系平台管理员维护后再提现。</Text> : null}
          <Table
            rowKey="id"
            data={withdrawableRows}
            pagination={{ pageSize: 5, showTotal: true }}
            columns={[
              { title: '订单号', dataIndex: 'orderId' },
              { title: '客户', dataIndex: 'tenantName' },
              { title: '实付金额', render: (_: unknown, row?: any) => row ? money(row.paidAmount ?? row.orderAmount) : '-' },
              { title: '佣金金额', dataIndex: 'commissionAmount', render: (value: number) => money(value) },
            ]}
          />
          <Text type="secondary">确认后会将以上可提现佣金合并生成一条提现流水，等待财务确认打款。</Text>
        </Space>
      </Modal>

    </SalesPageShell>
  );
}

export function SalesLeadsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const salesBasePath = salesConsolePath(location.pathname);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesLeadRecord[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [followVisible, setFollowVisible] = useState(false);
  const [leadFollowups, setLeadFollowups] = useState<SalesLeadFollowupRecord[]>([]);
  const [leadFollowupsLoading, setLeadFollowupsLoading] = useState(false);
  const [closeVisible, setCloseVisible] = useState(false);
  const [activeLead, setActiveLead] = useState<SalesLeadRecord | null>(null);
  const [followDraft, setFollowDraft] = useState({
    channel: 'phone',
    content: '',
    nextFollowupAt: '',
  });
  const [closeDraft, setCloseDraft] = useState({
    reason: '不感兴趣',
    note: '',
  });
  const [replyDraft, setReplyDraft] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await mockApi.getSalesLeads();
    setRows(data);
    setLoading(false);
  };

  const openLeadDetail = async (lead: SalesLeadRecord) => {
    setActiveLead(lead);
    setDetailVisible(true);
    setLeadFollowupsLoading(true);
    const followups = await mockApi.getSalesLeadFollowups(lead.id);
    setLeadFollowups(followups);
    setLeadFollowupsLoading(false);
  };

  const openFollowModal = (lead: SalesLeadRecord) => {
    setActiveLead(lead);
    setFollowVisible(true);
  };

  const isCustomerBusinessConsult = (lead: SalesLeadRecord) => lead.opportunityType === 'customer_business_consult';
  const isCustomerBusinessConsultCompleted = (lead: SalesLeadRecord) =>
    isCustomerBusinessConsult(lead) && lead.customerConsultStatus === 'completed';

  const refreshActiveLead = async (leadId: string) => {
    const [leadRows, followups] = await Promise.all([
      mockApi.getSalesLeads(),
      mockApi.getSalesLeadFollowups(leadId),
    ]);
    setRows(leadRows);
    setActiveLead(leadRows.find((item: SalesLeadRecord) => item.id === leadId) ?? null);
    setLeadFollowups(followups);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFollow = async () => {
    if (!activeLead || !followDraft.content.trim()) {
      Message.error('请输入跟进内容');
      return;
    }
    await mockApi.followSalesLead(activeLead.id, followDraft as any);
    Message.success('跟进已记录');
    setFollowVisible(false);
    setFollowDraft({ channel: 'phone', content: '', nextFollowupAt: '' });
    await refreshActiveLead(activeLead.id);
  };

  const handleClose = async () => {
    if (!activeLead) return;
    await mockApi.closeSalesLead(activeLead.id, closeDraft as any);
    Message.success('商机已关闭');
    setCloseVisible(false);
    await refreshActiveLead(activeLead.id);
  };

  const handleReplyCustomer = async () => {
    if (!activeLead || !replyDraft.trim()) {
      Message.error('请输入回复内容');
      return;
    }
    await mockApi.replyCustomerBusinessConsultOpportunity(activeLead.id, { content: replyDraft });
    Message.success('回复已发送给客户');
    setReplyDraft('');
    await refreshActiveLead(activeLead.id);
  };

  const handleCompleteCustomerConsult = async () => {
    if (!activeLead) return;
    await mockApi.completeCustomerBusinessConsultOpportunity(activeLead.id);
    Message.success('咨询已完结');
    await refreshActiveLead(activeLead.id);
  };

  return (
    <SalesPageShell
      title="咨询工单池"
      description="仅承接存量客户席位/套餐咨询工单，支持回复、跟进和完结闭环"
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <SalesTablePanel>
        <Table
          rowKey="id"
          loading={loading}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '工单时间', dataIndex: 'createdAt' },
            { title: '客户名', dataIndex: 'company' },
            { title: '联系人', dataIndex: 'name' },
	            { title: '电话', render: (_: unknown, row: SalesLeadRecord) => maskPhone(row.phone) },
	            { title: '需求摘要', dataIndex: 'requirement', render: (value: string) => <Tooltip content={value}><span className="sales-ellipsis">{value}</span></Tooltip> },
	            { title: '状态', render: (_: unknown, row: SalesLeadRecord) => <SalesMetaTag {...salesOpportunityStatusMeta(row)} /> },
	            { title: '处理时限倒计时', render: (_: unknown, row: SalesLeadRecord) => formatSalesLeadSla(row) },
            {
	              title: '操作',
	              render: (_: unknown, row: SalesLeadRecord) => (
		                <Space size={8}>
		                  <Button type="text" size="mini" onClick={() => openLeadDetail(row)}>详情</Button>
		                  {isCustomerBusinessConsult(row) ? (
		                    <Button type="text" size="mini" onClick={() => openLeadDetail(row)}>{isCustomerBusinessConsultCompleted(row) ? '详情' : '回复'}</Button>
		                  ) : row.status !== 'closed' && row.status !== 'converted' ? (
		                    <Button type="text" size="mini" onClick={() => openFollowModal(row)}>跟进</Button>
		                  ) : null}
		                  {!isCustomerBusinessConsult(row) && (row.status === 'claimed' || row.status === 'following' || row.status === 'new') ? (
	                    <Button type="text" size="mini" onClick={() => navigate(`${salesBasePath}/customers/new?leadId=${row.id}`)}>转客户</Button>
	                  ) : null}
	                  {!isCustomerBusinessConsult(row) && row.status !== 'closed' && row.status !== 'converted' ? (
	                    <Button type="text" size="mini" onClick={() => { setActiveLead(row); setCloseVisible(true); }}>关闭</Button>
	                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </SalesTablePanel>

	      <Drawer
	        title={activeLead ? `${activeLead.company} · 工单详情` : '工单详情'}
	        visible={detailVisible}
	        width={640}
	        footer={null}
	        onCancel={() => setDetailVisible(false)}
	      >
	        {activeLead ? (
	          <Space direction="vertical" size={18} className="full-width">
	            <div className="sales-lead-detail-head">
	              <div>
	                <Title heading={5}>{activeLead.company}</Title>
	              <Text type="secondary">{opportunityTypeMeta[activeLead.opportunityType].text} · {activeLead.source} · {activeLead.createdAt}</Text>
	              </div>
	              <SalesMetaTag {...salesOpportunityStatusMeta(activeLead)} />
	            </div>

	            <div className="sales-info-grid sales-info-grid--two">
	              <div><span>联系人</span><strong>{activeLead.name} / {activeLead.title}</strong></div>
	              <div><span>电话</span><strong>{maskPhone(activeLead.phone)}</strong></div>
	              <div><span>邮箱</span><strong>{activeLead.email || '-'}</strong></div>
	              <div><span>归属销售</span><strong>{activeLead.assignedSalesName || '-'}</strong></div>
	              <div><span>工单类型</span><strong>{opportunityTypeMeta[activeLead.opportunityType].text}</strong></div>
	              <div><span>处理时限</span><strong>{formatSalesLeadSla(activeLead)}</strong></div>
	            </div>

	            <div className="sales-info-card">
	              <div className="sales-detail-section__title">客户需求</div>
	              <Text>{activeLead.requirement}</Text>
	            </div>

	            <div className="sales-info-card">
	              <div className="sales-detail-section__title">附件</div>
	              <AttachmentViewer attachments={activeLead.attachments ?? []} />
	            </div>

	            {isCustomerBusinessConsult(activeLead) ? (
	              <div className="sales-info-card">
	                <div className="sales-detail-section__title">回复客户</div>
	                {isCustomerBusinessConsultCompleted(activeLead) ? (
	                  <Text type="secondary">该咨询已完结，如需继续沟通请由客户重新提交咨询。</Text>
	                ) : (
	                  <Space direction="vertical" size={12} className="full-width">
	                    <Input.TextArea rows={5} value={replyDraft} onChange={setReplyDraft} placeholder="请输入给客户可见的回复，例如报价口径、下一步沟通安排或需要客户补充的信息" />
	                    <Space>
	                      <Button type="primary" onClick={handleReplyCustomer}>发送回复</Button>
	                      <Button onClick={handleCompleteCustomerConsult}>完结咨询</Button>
	                    </Space>
	                  </Space>
	                )}
	              </div>
	            ) : activeLead.status !== 'closed' && activeLead.status !== 'converted' ? (
	              <div className="sales-info-card">
	                <div className="sales-detail-section__title">新增跟进</div>
	                <Space direction="vertical" size={12} className="full-width">
	                  <Select value={followDraft.channel} onChange={(value) => setFollowDraft((current) => ({ ...current, channel: value }))}>
	                    {followupChannels.map((item) => (
	                      <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
	                    ))}
	                  </Select>
	                  <Input.TextArea rows={4} value={followDraft.content} onChange={(value) => setFollowDraft((current) => ({ ...current, content: value }))} placeholder="记录本次商机联系结果" />
	                  <Input value={followDraft.nextFollowupAt} onChange={(value) => setFollowDraft((current) => ({ ...current, nextFollowupAt: value }))} placeholder="下次跟进时间，如 2026-05-03 14:00" />
	                  <Space>
	                    <Button type="primary" onClick={handleFollow}>保存跟进</Button>
	                    <Button onClick={() => navigate(`${salesBasePath}/customers/new?leadId=${activeLead.id}`)}>转客户</Button>
	                    <Button status="danger" onClick={() => setCloseVisible(true)}>关闭商机</Button>
	                  </Space>
	                </Space>
	              </div>
	            ) : null}

	            <div className="sales-info-card">
	              <div className="sales-detail-section__title">{isCustomerBusinessConsult(activeLead) ? '回复记录' : '跟进记录'}</div>
	              {leadFollowupsLoading ? (
	                <Spin tip="加载跟进记录" />
	              ) : leadFollowups.length ? (
	                <Timeline className="sales-timeline">
	                  {leadFollowups.map((item) => (
	                    <Timeline.Item key={item.id} label={item.createdAt}>
	                      <div className="sales-followup-item">
	                        <div className="sales-followup-item__head">
	                          <Tag>{followupChannels.find((channel) => channel.value === item.channel)?.label || item.channel}</Tag>
	                          <Text type="secondary">{item.creatorName}</Text>
	                          <Text type="secondary">{item.nextFollowupAt ? `下次跟进：${item.nextFollowupAt}` : '未设置下次跟进'}</Text>
	                        </div>
	                        <div>{item.content}</div>
	                      </div>
	                    </Timeline.Item>
	                  ))}
	                </Timeline>
	              ) : (
	                <Empty description="暂无跟进记录" />
	              )}
	            </div>
	          </Space>
	        ) : null}
	      </Drawer>

	      <Modal title={activeLead ? `${activeLead.company} · 新增跟进` : '新增跟进'} visible={followVisible} onCancel={() => setFollowVisible(false)} onOk={handleFollow}>
	        <Space direction="vertical" size={14} className="full-width">
	          <Select value={followDraft.channel} onChange={(value) => setFollowDraft((current) => ({ ...current, channel: value }))}>
	            {followupChannels.map((item) => (
	              <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
	            ))}
	          </Select>
	          <Input.TextArea rows={5} value={followDraft.content} onChange={(value) => setFollowDraft((current) => ({ ...current, content: value }))} placeholder="记录本次商机联系结果" />
	          <Input value={followDraft.nextFollowupAt} onChange={(value) => setFollowDraft((current) => ({ ...current, nextFollowupAt: value }))} placeholder="下次跟进时间，如 2026-05-03 14:00" />
	        </Space>
	      </Modal>

      <Modal title="关闭商机" visible={closeVisible} onCancel={() => setCloseVisible(false)} onOk={handleClose}>
        <Space direction="vertical" size={14} className="full-width">
          <Select value={closeDraft.reason} onChange={(value) => setCloseDraft((current) => ({ ...current, reason: value }))}>
            {closeReasons.map((item) => (
              <Select.Option key={item} value={item}>{item}</Select.Option>
            ))}
          </Select>
          <Input.TextArea rows={4} value={closeDraft.note} onChange={(value) => setCloseDraft((current) => ({ ...current, note: value }))} placeholder="补充关闭原因" />
        </Space>
      </Modal>
    </SalesPageShell>
  );
}

const salesCouponStatusMeta: Record<SalesCouponPoolRecord['status'], { color: string; text: string }> = {
  pending: { color: 'gray', text: '未生效' },
  active: { color: 'green', text: '可用' },
  used: { color: 'gray', text: '已使用' },
  exhausted: { color: 'gray', text: '已用完' },
  expired: { color: 'orange', text: '已过期' },
  disabled: { color: 'red', text: '已停用' },
};

const salesCouponDiscountLabel = (discountRate: number) =>
  discountRate === 0 ? '100% 抵扣' : `${discountRate}% 折扣`;
const salesCouponScopeLabel = (scope: CouponDiscountScope = 'order') =>
  scope === 'seat' ? '席位' : scope === 'coding_plan' ? 'CodingPlan' : '整单';
const couponCount = (value: number) => `${value.toLocaleString()} 张`;

type SalesCouponPaymentMode = 'scan' | 'bank_transfer';
type SalesCouponScanChannel = 'wechat' | 'alipay';
type SalesCouponCycle = '1' | '3' | '12';

interface SalesCouponPurchaseDraft {
  tenantId: string;
  tenantName: string;
  poolId: string;
  poolName: string;
  sourcePath: string;
  type: BillingOrder['type'];
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

const SALES_COUPON_PURCHASE_DRAFT_KEY = 'arkclaw_sales_coupon_purchase_draft';

const salesCouponPlanCatalog: Record<string, { key: string; cnName: string; price: number; bindLabel?: string; bindPrice?: number }> = {
  轻量版: { key: 'lite', cnName: '轻量版', price: 210, bindLabel: 'CodingPlan Team Lite', bindPrice: 120 },
  标准版: { key: 'standard', cnName: '标准版', price: 430, bindLabel: 'CodingPlan Team Lite', bindPrice: 120 },
  高级版: { key: 'pro', cnName: '高级版', price: 860, bindLabel: 'CodingPlan Team Pro', bindPrice: 600 },
  旗舰版: { key: 'ultimate', cnName: '旗舰版', price: 1720, bindLabel: 'CodingPlan Team Pro', bindPrice: 600 },
};

const salesCouponPlanOrder = ['轻量版', '标准版', '高级版', '旗舰版'];

const salesCouponBuildBundleLines = (draft: SalesCouponPurchaseDraft): OrderBundleLine[] =>
  draft.lines.flatMap((line, index) => {
    const lineAmount = line.amount ?? 0;
    const codingAmount = line.bindCodingPlan && line.codingPlanName
      ? Math.min(lineAmount, ((line.codingPlanName.includes('Pro') ? 600 : 120) * draft.cycleMonths * line.count))
      : 0;
    const seatAmount = Math.max(lineAmount - codingAmount, 0);
    const seatLine: OrderBundleLine = {
      id: `sales-coupon-seat-${index}`,
      productType: 'seat',
      productName: line.plan,
      quantity: line.count,
      unit: '席',
      amount: seatAmount,
      specLabel: line.action,
      cycleMonths: draft.cycleMonths,
    };
    if (!line.bindCodingPlan || !line.codingPlanName) return [seatLine];
    return [
      seatLine,
      {
        id: `sales-coupon-code-${index}`,
        productType: 'coding_plan',
        productName: line.codingPlanName,
        quantity: line.count,
        unit: '份',
        amount: codingAmount,
        specLabel: line.action,
        cycleMonths: draft.cycleMonths,
      },
    ];
  });

const salesCouponPaymentPath = (sourcePath: string) =>
  sourcePath.startsWith('/sales-admin')
    ? '/sales-admin/coupons/payment'
    : sourcePath.startsWith('/agent/sales')
      ? '/agent/sales/coupons/payment'
      : '/sales/coupons/payment';

const salesCouponUsePath = (sourcePath: string) =>
  sourcePath.startsWith('/sales-admin')
    ? '/sales-admin/coupons/use'
    : sourcePath.startsWith('/agent/sales')
      ? '/agent/sales/coupons/use'
      : '/sales/coupons/use';

const salesCouponListPath = (sourcePath: string) =>
  sourcePath.startsWith('/sales-admin')
    ? '/sales-admin/coupons'
    : sourcePath.startsWith('/agent/sales')
      ? '/agent/sales/coupons'
      : '/sales/coupons';

export function SalesCouponsPage({ mode = 'sales' }: { mode?: 'sales' | 'salesAdmin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<SalesCouponPoolRecord[]>([]);
  const [grants, setGrants] = useState<SalesCouponGrantRecord[]>([]);
  const [salesRows, setSalesRows] = useState<AdminSalesListItem[]>([]);
  const [tenantRows, setTenantRows] = useState<AdminTenantListItem[]>([]);
  const [assignVisible, setAssignVisible] = useState(false);
  const [grantVisible, setGrantVisible] = useState(false);
  const [activePool, setActivePool] = useState<SalesCouponPoolRecord>();
  const [assignDraft, setAssignDraft] = useState({ poolId: '', salesId: '', amount: 0, remark: '' });
  const [grantDraft, setGrantDraft] = useState({ poolId: '', tenantId: '', remark: '' });

  const isSalesAdmin = mode === 'salesAdmin';
  const currentSalesId = 'sales-001';
  const pageTitle = isSalesAdmin ? '销售优惠券分配' : '销售优惠券';
  const pageDescription = isSalesAdmin
    ? '接收官方发放的优惠券，分配给下属销售，或代客户使用优惠券下单'
    : '查看可用推广优惠券，并代客户使用优惠券下单';

  const loadData = async () => {
    setLoading(true);
    const [poolData, grantData, salesData, tenantData] = await Promise.all([
      mockApi.getSalesCouponPools(),
      mockApi.getSalesCouponGrants(),
      mockApi.getAdminSales(),
      mockApi.getAdminTenants(),
    ]);
    setPools(poolData);
    setGrants(grantData);
    setSalesRows(salesData.filter((item) => item.status !== 'left'));
    setTenantRows(tenantData);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const couponPools = pools.filter((item) => (item.benefitType ?? 'coupon') === 'coupon');
  const visiblePools = couponPools.filter((item) =>
    isSalesAdmin ? item.ownerRole === 'salesAdmin' : item.ownerRole === 'sales' && item.ownerId === currentSalesId,
  );
  const grantablePools = visiblePools.filter((item) => item.status === 'active' && item.remainingQuota > 0);
  const salesPools = couponPools.filter((item) => item.ownerRole === 'sales');
  const confirmedGrants = grants.filter((item) =>
    isSalesAdmin
      ? visiblePools.some((pool) => pool.id === item.poolId) || salesPools.some((pool) => pool.parentPoolId && visiblePools.some((parent) => parent.id === pool.parentPoolId) && pool.id === item.poolId)
      : item.salesId === currentSalesId,
  );
  const totalQuota = visiblePools.reduce((sum, item) => sum + item.totalQuota, 0);
  const remainingQuota = visiblePools.reduce((sum, item) => sum + item.remainingQuota, 0);
  const allocatedQuota = visiblePools.reduce((sum, item) => sum + item.allocatedQuota, 0);
  const grantedQuota = visiblePools.reduce((sum, item) => sum + item.grantedQuota, 0);

  const resetAssignDraft = () => setAssignDraft({ poolId: grantablePools[0]?.id ?? '', salesId: salesRows[0]?.id ?? '', amount: 0, remark: '' });
  const resetGrantDraft = () => setGrantDraft({ poolId: grantablePools[0]?.id ?? '', tenantId: tenantRows[0]?.id ?? '', remark: '' });

  const submitAssign = async () => {
    if (!assignDraft.poolId || !assignDraft.salesId || assignDraft.amount <= 0) {
      Message.error('请选择优惠券、销售并填写分配数量');
      return;
    }
    const result = await mockApi.assignSalesCouponPool({
      sourcePoolId: assignDraft.poolId,
      salesId: assignDraft.salesId,
      amount: assignDraft.amount,
      remark: assignDraft.remark,
    });
    if (!result) {
      Message.error('分配失败，请检查剩余数量');
      return;
    }
    Message.success('已分配给销售');
    setAssignVisible(false);
    resetAssignDraft();
    await loadData();
  };

  const submitGrant = async () => {
    if (!grantDraft.poolId || !grantDraft.tenantId) {
      Message.error('请选择优惠券和客户');
      return;
    }
    const pool = grantablePools.find((item) => item.id === grantDraft.poolId);
    const tenant = tenantRows.find((item) => item.id === grantDraft.tenantId);
    if (!pool || !tenant) {
      Message.error('请选择有效的优惠券和客户');
      return;
    }
    setGrantVisible(false);
    navigate(`${salesCouponUsePath(location.pathname)}?poolId=${encodeURIComponent(pool.id)}&tenantId=${encodeURIComponent(tenant.id)}`);
  };

  return (
    <SalesPageShell
      title={pageTitle}
      description={pageDescription}
      action={(
        <Space>
          {isSalesAdmin ? (
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => {
                resetAssignDraft();
                setAssignVisible(true);
              }}
            >
              分配给销售
            </Button>
          ) : null}
          <Button
            type={isSalesAdmin ? 'outline' : 'primary'}
            icon={<IconQrcode />}
            onClick={() => {
              resetGrantDraft();
              setGrantVisible(true);
            }}
          >
            代客户使用
          </Button>
          <Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>
        </Space>
      )}
    >
      <Spin loading={loading} className="full-width">
        <div className="voucher-metric-grid admin-coupon-metric-grid">
          <Card bordered className="voucher-metric-card">
            <span>优惠券总数</span>
            <strong>{couponCount(totalQuota)}</strong>
            <small>{isSalesAdmin ? '官方分配给我的优惠券' : '我可用于客户推广的优惠券'}</small>
          </Card>
          <Card bordered className="voucher-metric-card">
            <span>剩余数量</span>
            <strong>{couponCount(remainingQuota)}</strong>
            <small>可继续分配或使用</small>
          </Card>
          <Card bordered className="voucher-metric-card">
            <span>{isSalesAdmin ? '已分配销售' : '已使用'}</span>
            <strong>{couponCount(isSalesAdmin ? allocatedQuota : grantedQuota)}</strong>
            <small>{isSalesAdmin ? '分配给下属销售的优惠券' : '已代客户使用的优惠券'}</small>
          </Card>
          <Card bordered className="voucher-metric-card">
            <span>客户使用记录</span>
            <strong>{confirmedGrants.length}</strong>
            <small>销售代客户下单记录</small>
          </Card>
        </div>

        <Tabs defaultActiveTab="pools" className="admin-coupon-tabs">
          <Tabs.TabPane key="pools" title="我的优惠券">
            <Table
              rowKey="id"
              data={visiblePools}
              pagination={{ pageSize: 8, showTotal: true }}
              columns={[
                { title: '优惠券名称', dataIndex: 'name' },
                { title: '归属人', dataIndex: 'ownerName' },
                { title: '优惠范围', render: (_: unknown, row: SalesCouponPoolRecord) => salesCouponScopeLabel(row.discountScope) },
                { title: '折扣规则', render: (_: unknown, row: SalesCouponPoolRecord) => salesCouponDiscountLabel(row.discountRate) },
                { title: '总数量', dataIndex: 'totalQuota', render: (value: number) => couponCount(value) },
                { title: '已分配', dataIndex: 'allocatedQuota', render: (value: number) => couponCount(value) },
                { title: '已使用', dataIndex: 'grantedQuota', render: (value: number) => couponCount(value) },
                { title: '剩余数量', dataIndex: 'remainingQuota', render: (value: number) => couponCount(value) },
                { title: '有效期', render: (_: unknown, row: SalesCouponPoolRecord) => `${row.effectiveAt} ~ ${row.expiresAt}` },
                { title: '状态', dataIndex: 'status', render: (value: SalesCouponPoolRecord['status']) => <Tag color={salesCouponStatusMeta[value].color}>{salesCouponStatusMeta[value].text}</Tag> },
                { title: '操作', render: (_: unknown, row: SalesCouponPoolRecord) => <Button type="text" size="mini" onClick={() => setActivePool(row)}>详情</Button> },
              ]}
            />
          </Tabs.TabPane>
          {isSalesAdmin ? (
            <Tabs.TabPane key="sales" title="销售优惠券">
              <Table
                rowKey="id"
                data={salesPools}
                pagination={{ pageSize: 8, showTotal: true }}
                columns={[
                  { title: '销售', dataIndex: 'ownerName' },
                  { title: '优惠券名称', dataIndex: 'name' },
                  { title: '来源', dataIndex: 'issuedBy' },
                  { title: '优惠范围', render: (_: unknown, row: SalesCouponPoolRecord) => salesCouponScopeLabel(row.discountScope) },
                  { title: '折扣规则', render: (_: unknown, row: SalesCouponPoolRecord) => salesCouponDiscountLabel(row.discountRate) },
                  { title: '总数量', dataIndex: 'totalQuota', render: (value: number) => couponCount(value) },
                  { title: '已使用', dataIndex: 'grantedQuota', render: (value: number) => couponCount(value) },
                  { title: '剩余数量', dataIndex: 'remainingQuota', render: (value: number) => couponCount(value) },
                  { title: '状态', dataIndex: 'status', render: (value: SalesCouponPoolRecord['status']) => <Tag color={salesCouponStatusMeta[value].color}>{salesCouponStatusMeta[value].text}</Tag> },
                  { title: '操作', render: (_: unknown, row: SalesCouponPoolRecord) => <Button type="text" size="mini" onClick={() => setActivePool(row)}>详情</Button> },
                ]}
              />
            </Tabs.TabPane>
          ) : null}
          <Tabs.TabPane key="grants" title="客户使用记录">
            <Table
              rowKey="id"
              data={confirmedGrants}
              pagination={{ pageSize: 8, showTotal: true }}
              columns={[
                { title: '客户', dataIndex: 'tenantName' },
                { title: '销售', dataIndex: 'salesName' },
                { title: '使用数量', dataIndex: 'amount', render: (value: number) => couponCount(value) },
                { title: '关联订单', dataIndex: 'couponId' },
                { title: '使用时间', dataIndex: 'createdAt' },
                { title: '备注', dataIndex: 'remark', ellipsis: true, tooltip: true },
              ]}
            />
          </Tabs.TabPane>
        </Tabs>
      </Spin>

      <Drawer
        title={activePool ? `优惠券详情 · ${activePool.name}` : '优惠券详情'}
        width={560}
        visible={Boolean(activePool)}
        onCancel={() => setActivePool(undefined)}
        footer={null}
      >
        {activePool ? (
          <Descriptions
            column={1}
            data={[
              { label: '优惠券名称', value: activePool.name },
              { label: '归属人', value: activePool.ownerName },
              { label: '来源', value: activePool.issuedBy },
              { label: '优惠范围', value: salesCouponScopeLabel(activePool.discountScope) },
              { label: '折扣规则', value: salesCouponDiscountLabel(activePool.discountRate) },
              { label: '总数量', value: couponCount(activePool.totalQuota) },
              { label: '已分配', value: couponCount(activePool.allocatedQuota) },
              { label: '已使用', value: couponCount(activePool.grantedQuota) },
              { label: '剩余数量', value: couponCount(activePool.remainingQuota) },
              { label: '有效期', value: `${activePool.effectiveAt} ~ ${activePool.expiresAt}` },
              { label: '状态', value: <Tag color={salesCouponStatusMeta[activePool.status].color}>{salesCouponStatusMeta[activePool.status].text}</Tag> },
              { label: '发放时间', value: activePool.issuedAt },
              { label: '备注', value: activePool.remark || '-' },
            ]}
          />
        ) : null}
      </Drawer>

      <Drawer
        title="分配给销售"
        width={520}
        visible={assignVisible}
        onCancel={() => setAssignVisible(false)}
        footer={<Space><Button onClick={() => setAssignVisible(false)}>取消</Button><Button type="primary" onClick={submitAssign}>分配</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <label className="sales-field">
            <span>选择优惠券</span>
            <Select value={assignDraft.poolId || undefined} onChange={(value) => setAssignDraft((current) => ({ ...current, poolId: String(value) }))} className="full-width">
              {grantablePools.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name} / 剩余 {couponCount(item.remainingQuota)}</Select.Option>
              ))}
            </Select>
          </label>
          <label className="sales-field">
            <span>下属销售</span>
            <Select value={assignDraft.salesId || undefined} onChange={(value) => setAssignDraft((current) => ({ ...current, salesId: String(value) }))} className="full-width">
              {salesRows.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name} / {item.team}</Select.Option>
              ))}
            </Select>
          </label>
          <label className="sales-field">
            <span>分配数量</span>
            <InputNumber min={1} precision={0} suffix="张" value={assignDraft.amount} onChange={(value) => setAssignDraft((current) => ({ ...current, amount: Number(value) || 0 }))} className="full-width" />
          </label>
          <label className="sales-field">
            <span>备注</span>
            <Input.TextArea rows={3} value={assignDraft.remark} onChange={(value) => setAssignDraft((current) => ({ ...current, remark: value }))} placeholder="例如 华东线下沙龙客户转化" />
          </label>
        </Space>
      </Drawer>

      <Drawer
        title="使用优惠券"
        width={520}
        visible={grantVisible}
        onCancel={() => setGrantVisible(false)}
        footer={<Space><Button onClick={() => setGrantVisible(false)}>取消</Button><Button type="primary" onClick={submitGrant}>使用</Button></Space>}
      >
        <Space direction="vertical" size={16} className="full-width">
          <label className="sales-field">
            <span>选择优惠券</span>
            <Select value={grantDraft.poolId || undefined} onChange={(value) => setGrantDraft((current) => ({ ...current, poolId: String(value) }))} className="full-width">
              {grantablePools.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name} / 剩余 {couponCount(item.remainingQuota)}</Select.Option>
              ))}
            </Select>
          </label>
          <label className="sales-field">
            <span>客户</span>
            <Select value={grantDraft.tenantId || undefined} onChange={(value) => setGrantDraft((current) => ({ ...current, tenantId: String(value) }))} className="full-width">
              {tenantRows.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name} / {item.ownerSales}</Select.Option>
              ))}
            </Select>
          </label>
          <label className="sales-field">
            <span>备注</span>
            <Input.TextArea rows={3} value={grantDraft.remark} onChange={(value) => setGrantDraft((current) => ({ ...current, remark: value }))} placeholder="例如 线下拜访成交支持" />
          </label>
        </Space>
      </Drawer>
    </SalesPageShell>
  );
}

export function SalesCouponUsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<SalesCouponPoolRecord>();
  const [tenant, setTenant] = useState<AdminTenantListItem>();
  const [counts, setCounts] = useState<Record<string, number>>({ lite: 0, standard: 0, pro: 0, ultimate: 0 });
  const [bindings, setBindings] = useState<Record<string, boolean>>({ lite: false, standard: false, pro: false, ultimate: false });
  const [cycle, setCycle] = useState<SalesCouponCycle>('1');
  const sourcePath = salesCouponListPath(location.pathname);
  const poolId = searchParams.get('poolId') ?? '';
  const tenantId = searchParams.get('tenantId') ?? '';
  const planRows = salesCouponPlanOrder.map((name) => salesCouponPlanCatalog[name]);

  useEffect(() => {
    let mounted = true;
    Promise.all([mockApi.getSalesCouponPools(), mockApi.getAdminTenants()]).then(([poolRows, tenantRows]) => {
      if (!mounted) return;
      setPool(poolRows.find((item) => item.id === poolId));
      setTenant(tenantRows.find((item) => item.id === tenantId));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [poolId, tenantId]);

  const totals = useMemo(() => {
    return planRows.reduce((result, plan) => {
      const count = counts[plan.key] ?? 0;
      const bindAmount = bindings[plan.key] ? plan.bindPrice ?? 0 : 0;
      return {
        seats: result.seats + count,
        amount: result.amount + (plan.price + bindAmount) * Number(cycle) * count,
      };
    }, { seats: 0, amount: 0 });
  }, [bindings, counts, cycle, planRows]);

  const updateCount = (key: string, delta: number) => {
    setCounts((current) => ({ ...current, [key]: Math.max((current[key] ?? 0) + delta, 0) }));
  };

  const handleNext = () => {
    if (!pool || !tenant) {
      Message.error('请选择有效的优惠券和客户');
      return;
    }
    if (!totals.seats) {
      Message.warning('请选择至少 1 个席位');
      return;
    }
    const selected = planRows
      .filter((plan) => (counts[plan.key] ?? 0) > 0)
      .map((plan) => ({
        plan: plan.cnName,
        count: counts[plan.key] ?? 0,
        bindCodingPlan: bindings[plan.key] ?? false,
        codingPlanName: plan.bindLabel,
        amount: (plan.price + ((bindings[plan.key] ? plan.bindPrice ?? 0 : 0))) * Number(cycle) * (counts[plan.key] ?? 0),
        action: '新增',
        unitLabel: '席',
        summary: `${plan.cnName}${counts[plan.key] ?? 0}席${bindings[plan.key] ? '+CodingPlan' : ''}`,
      }));
    const orderType = selected.map((item) => item.summary).join('、');
    const draft: SalesCouponPurchaseDraft = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      poolId: pool.id,
      poolName: pool.name,
      sourcePath,
      type: 'seat_sub',
      orderType: `${orderType} / ${cycle}个月`,
      amount: totals.amount,
      cycleMonths: Number(cycle),
      seats: totals.seats,
      lines: selected,
    };
    window.sessionStorage.setItem(SALES_COUPON_PURCHASE_DRAFT_KEY, JSON.stringify(draft));
    navigate(salesCouponPaymentPath(sourcePath), { state: { purchaseDraft: draft } });
  };

  if (loading) return <Spin loading className="full-width" />;

  if (!pool || !tenant) {
    return (
      <SalesPageShell title="使用优惠券" description="选择有效优惠券和客户后才能下单">
        <Card bordered className="voucher-empty-card">
          <Space direction="vertical" size={16} align="center" className="full-width">
            <Empty description="未找到可用的优惠券或客户" />
            <Button type="primary" onClick={() => navigate(sourcePath)}>返回优惠券</Button>
          </Space>
        </Card>
      </SalesPageShell>
    );
  }

  return (
    <SalesPageShell
      title="使用优惠券下单"
      description="销售代客户选择套餐并使用优惠券创建订单"
      action={<Button onClick={() => navigate(sourcePath)}>返回优惠券</Button>}
    >
      <Space direction="vertical" size={18} className="full-width">
        <Card bordered>
          <Descriptions
            column={3}
            data={[
              { label: '客户', value: tenant.name },
              { label: '优惠券', value: pool.name },
              { label: '折扣规则', value: `${salesCouponScopeLabel(pool.discountScope)} / ${salesCouponDiscountLabel(pool.discountRate)}` },
              { label: '剩余数量', value: couponCount(pool.remainingQuota) },
              { label: '有效期', value: `${pool.effectiveAt} ~ ${pool.expiresAt}` },
              { label: '归属销售', value: pool.ownerName },
            ]}
          />
        </Card>
        <div className="purchase-plans">
          {planRows.map((plan) => (
            <article className="purchase-plan-card" key={plan.key}>
              <div className="purchase-plan-card__head">
                <strong>{plan.cnName}</strong>
                <span>ArkClaw 企业版</span>
              </div>
              <div className="purchase-plan-card__price">
                <strong>{plan.price}</strong>
                <span>元/月</span>
              </div>
              {plan.bindLabel ? (
                <label className="purchase-bind">
                  <Checkbox checked={bindings[plan.key]} onChange={(checked) => setBindings((current) => ({ ...current, [plan.key]: checked }))} />
                  <span>绑定 <strong>{plan.bindLabel}</strong> ¥{plan.bindPrice}/月</span>
                </label>
              ) : null}
              <div className="purchase-stepper">
                <button type="button" onClick={() => updateCount(plan.key, -1)}>-</button>
                <span>{counts[plan.key] ?? 0}</span>
                <button type="button" onClick={() => updateCount(plan.key, 1)}>+</button>
              </div>
            </article>
          ))}
        </div>
        <footer className="purchase-bar">
          <Space size={12} className="purchase-bar__term">
            <span>时长</span>
            <Select value={cycle} className="purchase-cycle-select" onChange={(value) => setCycle(value as SalesCouponCycle)}>
              <Select.Option value="1">1个月</Select.Option>
              <Select.Option value="3">3个月</Select.Option>
              <Select.Option value="12">1年</Select.Option>
            </Select>
          </Space>
          <Space size={14} className="purchase-bar__pay">
            <span>订单原价</span>
            <strong className="purchase-total">{money(totals.amount)}</strong>
            <Text type="secondary">优惠将在下一步支付确认页抵扣</Text>
            <Button type="primary" disabled={!totals.seats} onClick={handleNext}>下一步</Button>
          </Space>
        </footer>
      </Space>
    </SalesPageShell>
  );
}

export function SalesCouponPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [draft, setDraft] = useState<SalesCouponPurchaseDraft>();
  const [paymentMode, setPaymentMode] = useState<SalesCouponPaymentMode>('scan');
  const [scanChannel, setScanChannel] = useState<SalesCouponScanChannel>('wechat');
  const [breakdown, setBreakdown] = useState<OrderAmountBreakdown>();
  const [order, setOrder] = useState<{ orderId: string; amount: number; qrCodeLabel?: string; paymentMethod?: BillingOrder['paymentMethod'] }>();
  const [proofName, setProofName] = useState('bank-transfer-proof.png');
  const [uploadedAmount, setUploadedAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const stateDraft = (location.state as { purchaseDraft?: SalesCouponPurchaseDraft } | null)?.purchaseDraft;

  useEffect(() => {
    if (stateDraft) {
      setDraft(stateDraft);
      window.sessionStorage.setItem(SALES_COUPON_PURCHASE_DRAFT_KEY, JSON.stringify(stateDraft));
      return;
    }
    const raw = window.sessionStorage.getItem(SALES_COUPON_PURCHASE_DRAFT_KEY);
    if (!raw) return;
    try {
      setDraft(JSON.parse(raw) as SalesCouponPurchaseDraft);
    } catch {
      window.sessionStorage.removeItem(SALES_COUPON_PURCHASE_DRAFT_KEY);
    }
  }, [stateDraft]);

  const bundleLines = useMemo(() => (draft ? salesCouponBuildBundleLines(draft) : []), [draft]);

  useEffect(() => {
    if (!draft) return;
    let mounted = true;
    mockApi.previewSalesCouponOrder({
      tenantId: draft.tenantId,
      poolId: draft.poolId,
      amount: draft.amount,
      bundleLines,
    }).then((result) => {
      if (!mounted) return;
      setBreakdown(result);
      setUploadedAmount(result.payableAmount);
    });
    return () => {
      mounted = false;
    };
  }, [bundleLines, draft]);

  useEffect(() => {
    setOrder(undefined);
  }, [paymentMode, scanChannel]);

  const payableAmount = breakdown?.payableAmount ?? draft?.amount ?? 0;
  const discountAmount = breakdown?.couponDiscountAmount ?? 0;

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    Message.success('已复制给剪贴板');
  };

  const savePaymentCode = () => {
    if (!order || !draft) return;
    const text = `客户：${draft.tenantName}\n订单：${order.orderId}\n金额：${money(order.amount)}\n付款码：${order.qrCodeLabel ?? '-'}`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${order.orderId}-payment-code.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const createOrder = async () => {
    if (!draft || !discountAmount) {
      Message.error('当前订单无法使用该优惠券');
      return;
    }
    setSubmitting(true);
    const payload = {
      tenantId: draft.tenantId,
      poolId: draft.poolId,
      orderType: draft.orderType,
      amount: draft.amount,
      bundleLines,
    };
    const result = paymentMode === 'bank_transfer'
      ? await mockApi.createSalesAssistedBankTransferOrder(payload)
      : await mockApi.createSalesAssistedElectronicPaymentOrder({ ...payload, paymentMethod: scanChannel });
    setSubmitting(false);
    if (!result) {
      Message.error('创建订单失败，请检查优惠券是否仍可用');
      return;
    }
    setOrder({
      orderId: result.orderId,
      amount: result.amount,
      qrCodeLabel: result.qrCodeLabel,
      paymentMethod: result.paymentMethod,
    });
    setUploadedAmount(result.amount);
    setProofName(`proof_${result.orderId}.png`);
    Message.success('订单已创建');
  };

  const submitProof = async () => {
    if (!order) {
      Message.warning('请先生成对公订单');
      return;
    }
    if (!proofName.trim()) {
      Message.warning('请输入付款凭证文件名');
      return;
    }
    setSubmitting(true);
    await mockApi.submitSalesAssistedBankTransferProof(order.orderId, { proofName: proofName.trim(), uploadedAmount });
    setSubmitting(false);
    Message.success('付款凭证已提交');
    navigate(draft?.sourcePath ?? '/sales/coupons');
  };

  const handleSelectProofFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    event.target.value = '';
  };

  if (!draft) {
    return (
      <SalesPageShell title="销售代客户支付" description="请先选择优惠券和客户">
        <Card bordered className="voucher-empty-card">
          <Space direction="vertical" size={16} align="center" className="full-width">
            <Empty description="暂无待支付订单" />
            <Button type="primary" onClick={() => navigate(salesCouponListPath(location.pathname))}>返回优惠券</Button>
          </Space>
        </Card>
      </SalesPageShell>
    );
  }

  const transferText = `客户：${draft.tenantName}\n订单：${order?.orderId ?? '待生成'}\n收款主体：云脑智联科技有限公司\n开户银行：招商银行上海分行营业部\n银行账号：6222 **** **** 2048\n应转金额：${money(payableAmount)}`;

  return (
    <SalesPageShell
      title="销售代客户支付"
      description="保存扫码支付信息给客户，或代客户提交对公付款凭证"
      action={<Button onClick={() => navigate(salesCouponUsePath(draft.sourcePath) + `?poolId=${draft.poolId}&tenantId=${draft.tenantId}`)}>返回修改</Button>}
    >
      <Row gutter={20}>
        <Col span={10}>
          <Card bordered title="订单确认">
            <Descriptions
              column={1}
              data={[
                { label: '客户', value: draft.tenantName },
                { label: '优惠券', value: draft.poolName },
                { label: '订单内容', value: draft.orderType },
                { label: '订单原价', value: money(draft.amount) },
                { label: '本次优惠', value: discountAmount ? `-${money(discountAmount)}` : '不可用' },
                ...(breakdown?.eligibleAmount ? [{ label: '优惠范围', value: `${salesCouponScopeLabel(breakdown.discountScope)} / 可优惠 ${money(breakdown.eligibleAmount)}` }] : []),
                { label: '应付金额', value: money(payableAmount) },
              ]}
            />
            {!discountAmount ? <Text type="secondary">当前套餐不满足该优惠券使用条件，请返回调整套餐。</Text> : null}
          </Card>
        </Col>
        <Col span={14}>
          <Card bordered title="支付信息">
            <Space direction="vertical" size={16} className="full-width">
              <Radio.Group value={paymentMode} onChange={(value) => setPaymentMode(value as SalesCouponPaymentMode)}>
                <Radio value="scan">扫码支付</Radio>
                <Radio value="bank_transfer">对公转账</Radio>
              </Radio.Group>
              {paymentMode === 'scan' ? (
                <>
                  <Radio.Group value={scanChannel} onChange={(value) => setScanChannel(value as SalesCouponScanChannel)}>
                    <Radio value="wechat">微信</Radio>
                    <Radio value="alipay">支付宝</Radio>
                  </Radio.Group>
                  <Button type="primary" loading={submitting} disabled={!discountAmount || Boolean(order)} onClick={createOrder}>生成付款码</Button>
                  {order ? (
                    <div className="electronic-payment-panel electronic-payment-panel--stacked">
                      <div className="electronic-payment-qr">
                        <span>{order.paymentMethod === 'alipay' ? '支付宝' : '微信'}付款码</span>
                        <small>{order.qrCodeLabel} · {money(order.amount)}</small>
                      </div>
                      <Space>
                        <Button icon={<IconCopy />} onClick={() => copyText(`客户：${draft.tenantName}\n订单：${order.orderId}\n金额：${money(order.amount)}\n付款码：${order.qrCodeLabel}`)}>复制给客户</Button>
                        <Button icon={<IconDownload />} onClick={savePaymentCode}>保存付款码</Button>
                      </Space>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <Button type="primary" loading={submitting} disabled={!discountAmount || Boolean(order)} onClick={createOrder}>生成对公订单</Button>
                  <Descriptions
                    column={1}
                    data={[
                      { label: '收款主体', value: '云脑智联科技有限公司' },
                      { label: '开户银行', value: '招商银行上海分行营业部' },
                      { label: '银行账号', value: '6222 **** **** 2048' },
                      { label: '应转金额', value: money(order?.amount ?? payableAmount) },
                    ]}
                  />
                  <Button icon={<IconCopy />} onClick={() => copyText(transferText)}>复制转账信息</Button>
                  <div className="payment-proof-panel">
                    <Text className="field-label">上传支付凭证</Text>
                    <input ref={proofInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleSelectProofFile} disabled={!order} />
                    <Button icon={<IconUpload />} onClick={() => proofInputRef.current?.click()} disabled={!order}>选择凭证文件</Button>
                    <Input value={proofName} onChange={setProofName} disabled={!order} />
                    <Text className="field-label">客户填写到账金额</Text>
                    <InputNumber value={uploadedAmount} onChange={(value) => setUploadedAmount(Number(value) || 0)} min={0} className="full-width" disabled={!order} />
                    <Button long type="primary" loading={submitting} disabled={!order} onClick={submitProof}>提交付款凭证</Button>
                  </div>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </SalesPageShell>
  );
}

export function SalesProfilePage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>();
  const [performance, setPerformance] = useState<any[]>([]);
  const [summary, setSummary] = useState<SalesDashboardSummary>();
  const [profileDraft, setProfileDraft] = useState<SalesProfileUpdatePayload>({
    phone: '',
    email: '',
  });
  const [editingProfileField, setEditingProfileField] = useState<'phone' | 'email' | null>(null);
  const [links, setLinks] = useState<SalesShareLinkRecord[]>([]);
  const [shareDrawerVisible, setShareDrawerVisible] = useState(false);
  const [registrations, setRegistrations] = useState<SalesRegistrationRecord[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [profileData, performanceData, shareLinks, summaryData] = await Promise.all([
      mockApi.getSalesProfile(),
      mockApi.getSalesPerformance(),
      mockApi.getSalesShareLinks(),
      mockApi.getSalesDashboardSummary(),
    ]);
    setProfile(profileData);
    setPerformance(performanceData);
    setLinks(shareLinks);
    setSummary(summaryData);
    setProfileDraft({
      phone: profileData.phone,
      email: profileData.email,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveField = async (fieldLabel: string) => {
    await mockApi.updateSalesProfile(profileDraft);
    Message.success(`${fieldLabel}已更新`);
    setEditingProfileField(null);
    void loadData();
  };

  const currentLink = useMemo(
    () => links.find((item) => item.status === 'active') ?? links[0],
    [links],
  );

  const openRegistrations = async (linkId: string) => {
    const items = await mockApi.getSalesShareLinkRegistrations(linkId);
    setRegistrations(items);
    setShareDrawerVisible(true);
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载个人中心" />;
  }
  const isAgentSalesConsole = location.pathname.startsWith('/agent/sales');
  const bankAccount = profile.bankAccount;
  const bankConfigured = bankAccount?.status === 'active';

  return (
    <SalesPageShell
      title={isAgentSalesConsole ? '销售工作台' : '销售个人中心'}
      description="查看基础信息、业绩概览与佣金账户"
    >
      <div className="sales-profile-hero">
        <div className="sales-profile-hero__identity">
          <Avatar size={64}>{profile.avatarText}</Avatar>
          <div>
            <Title heading={4}>{profile.name}</Title>
            <Text type="secondary">{profile.team} · {profile.employeeNo}</Text>
          </div>
        </div>
        <div className="sales-profile-hero__stats">
          <div className="sales-profile-hero__stat">
            <div className="sales-profile-hero__label">客户数</div>
            <strong>{summary?.myCustomerCount ?? 0}</strong>
          </div>
          <div className="sales-profile-hero__stat">
            <div className="sales-profile-hero__label">佣金率</div>
            <strong>{profile.baseCommissionRate * 100}%</strong>
          </div>
          <label className="sales-profile-hero__field">
            <div className="sales-profile-hero__label sales-profile-hero__label--editable">
              手机号
              <Button
                size="mini"
                type="text"
                icon={<IconEdit />}
                onClick={() => setEditingProfileField('phone')}
              />
            </div>
            {editingProfileField === 'phone' ? (
              <Input
                value={profileDraft.phone}
                onChange={(value) => setProfileDraft((current) => ({ ...current, phone: value }))}
                addAfter={<Button type="text" onClick={() => handleSaveField('手机号')}>保存</Button>}
              />
            ) : (
              <strong>{profile.phone}</strong>
            )}
          </label>
          <label className="sales-profile-hero__field">
            <div className="sales-profile-hero__label sales-profile-hero__label--editable">
              邮箱
              <Button
                size="mini"
                type="text"
                icon={<IconEdit />}
                onClick={() => setEditingProfileField('email')}
              />
            </div>
            {editingProfileField === 'email' ? (
              <Input
                value={profileDraft.email}
                onChange={(value) => setProfileDraft((current) => ({ ...current, email: value }))}
                addAfter={<Button type="text" onClick={() => handleSaveField('邮箱')}>保存</Button>}
              />
            ) : (
              <strong>{profile.email}</strong>
            )}
          </label>
        </div>
      </div>

      <div className="sales-profile-main-layout">
        <SalesPanel title="业绩概览">
          <div className="sales-profile-metrics">
            <div className="sales-profile-metric">
              <span>本月成交额</span>
              <strong>{money(summary?.monthPaidAmount ?? 0)}</strong>
            </div>
            <div className="sales-profile-metric">
              <span>本月佣金</span>
              <strong>{money(summary?.monthEstimatedCommission ?? 0)}</strong>
            </div>
            <div className="sales-profile-metric">
              <span>本月新客</span>
              <strong>{summary?.monthNewCount ?? 0}</strong>
            </div>
          </div>
          <div className="chart-box chart-box--large">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip />
                <Legend verticalAlign="bottom" height={32} formatter={(value) => (value === 'gmv' ? '成交额' : value === 'commission' ? '佣金' : value)} />
                <Line type="monotone" dataKey="gmv" name="成交额" stroke="#165DFF" strokeWidth={2} />
                <Line type="monotone" dataKey="commission" name="佣金" stroke="#14C9C9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SalesPanel>

        <div className="sales-profile-side-stack">
          <SalesPanel
            title="分享链接"
            extra={currentLink ? <Button size="small" type="text" icon={<IconLink />} onClick={() => openRegistrations(currentLink.id)}>查看注册明细</Button> : null}
          >
            {currentLink ? (
              <div className="sales-share-card">
                <div className="sales-share-card__content">
                  <Text type="secondary">每位销售固定维护一个分享链接和一个分享二维码，客户点击后直接进入注册流程。</Text>
                  <label className="sales-field">
                    <span>分享地址</span>
                    <Input
                      value={currentLink.shortUrl}
                      readOnly
                      addAfter={(
                        <Button
                          type="text"
                          icon={<IconCopy />}
                          onClick={() => copyText(currentLink.shortUrl)}
                        >
                          复制链接
                        </Button>
                      )}
                    />
                  </label>
                </div>
                <div className="sales-share-card__qr">
                  <div className="sales-share-card__qr-title">分享二维码</div>
                  <div className="sales-share-qr-mock" aria-label="分享二维码预览">
                    <div className="sales-share-qr-mock__code">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <Text type="secondary" className="sales-share-qr-mock__hint">扫码进入注册</Text>
                  </div>
                  <Button icon={<IconQrcode />} onClick={() => Message.success('分享二维码已下载')}>下载二维码</Button>
                </div>
              </div>
            ) : (
              <Empty description="暂未配置销售分享链接，请联系管理员处理。" />
            )}
          </SalesPanel>

          <SalesPanel title="佣金收款账户">
            <Text type="secondary" className="sales-profile-note">由平台管理员维护</Text>
            {bankConfigured ? (
              <div className="sales-info-grid sales-info-grid--two">
                <div><span>开户名</span><strong>{bankAccount.accountName}</strong></div>
                <div><span>开户银行</span><strong>{bankAccount.bankName}</strong></div>
                <div><span>开户支行</span><strong>{bankAccount.branchName}</strong></div>
                <div><span>银行账号</span><strong>{maskBankAccountNo(bankAccount.accountNo)}</strong></div>
                <div><span>状态</span><strong>已配置</strong></div>
                <div><span>更新时间</span><strong>{bankAccount.updatedAt || '-'}</strong></div>
              </div>
            ) : (
              <Empty description="暂未配置收款账户，请联系平台管理员维护。" />
            )}
          </SalesPanel>
        </div>
      </div>

      <Drawer
        width={720}
        className="sales-share-drawer"
        title="注册明细"
        visible={shareDrawerVisible}
        onCancel={() => setShareDrawerVisible(false)}
        footer={null}
      >
        <div className="sales-share-registration-summary">
          <Text type="secondary">累计注册</Text>
          <strong>{registrations.length}</strong>
        </div>
        <Table
          rowKey="id"
          pagination={false}
          data={registrations}
          columns={[
            { title: '客户名', dataIndex: 'tenantName' },
            { title: '统一社会信用代码', dataIndex: 'uscc' },
            { title: '联系人', dataIndex: 'contactName' },
            { title: '注册时间', dataIndex: 'createdAt' },
            { title: '来源', dataIndex: 'sourceLabel' },
          ]}
        />
      </Drawer>
    </SalesPageShell>
  );
}
