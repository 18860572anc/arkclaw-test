import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from '@arco-design/web-react';
import {
  IconLink,
  IconRefresh,
  IconSafe,
  IconSettings,
} from '@arco-design/web-react/icon';
import AttachmentViewer from '../../components/AttachmentViewer';
import { mockApi } from '../../services/mockApi';
import type {
  OpsAlertRecord,
  OpsBindingHealthStatus,
  OpsChangeRecord,
  OpsCheckStatus,
  OpsCustomerOverview,
  OpsDiagnosisCheckItem,
  OpsDiagnosisDetail,
  OpsDiagnosisWorkspaceItem,
  OpsImBindingChannelDetail,
  OpsImBindingDetail,
  OpsImBindingTenantItem,
  OpsInspectionItemResult,
  OpsInspectionRule,
  OpsInspectionRun,
  OpsNetworkDetail,
  OpsNetworkWorkspaceItem,
  OpsPriority,
  OpsRemoteAssistSession,
  OpsRemarkRecord,
  OpsTicketDetail,
  OpsTicketEvent,
  OpsTicketQueueCode,
  OpsTicketListItem,
  OpsTicketSourceCode,
  OpsTicketStatusCode,
  OpsTicketTypeCode,
  OpsToolResult,
} from '../../types/domain';

const { Title, Text } = Typography;
const { Row, Col } = Grid;
const TabPane = Tabs.TabPane;

const detectQueueFromPath = (pathname: string): OpsTicketQueueCode | 'all' => {
  if (pathname.includes('/delivery-tickets')) return 'delivery';
  if (pathname.includes('/support-tickets')) return 'support';
  return 'all';
};

const getTicketsBasePath = (pathname: string) => {
  const queue = detectQueueFromPath(pathname);
  if (pathname.startsWith('/admin')) {
    if (queue === 'delivery') return '/admin/delivery-tickets';
    if (queue === 'support') return '/admin/support-tickets';
    return '/admin/tickets';
  }
  if (pathname.startsWith('/ops-admin')) {
    if (queue === 'delivery') return '/ops-admin/delivery-tickets';
    if (queue === 'support') return '/ops-admin/support-tickets';
    return '/ops-admin/tickets';
  }
  if (queue === 'delivery') return '/ops/delivery-tickets';
  if (queue === 'support') return '/ops/support-tickets';
  return '/ops/tickets';
};

const ticketTypeLabel: Record<OpsTicketTypeCode, string> = {
  opening: '开通工单',
  im_binding: 'IM 绑定',
  network: '网络',
  tech_support: '客户技术支持',
  business_consult: '商务咨询',
  incident: '故障事件',
  data_export: '数据导出',
};

const ticketStatusMeta: Record<OpsTicketStatusCode, { color: string; text: string }> = {
  unfinished: { color: 'arcoblue', text: '未完成' },
  resolved: { color: 'green', text: '已解决' },
};

const ticketSourceMeta: Record<OpsTicketSourceCode, { color: string; text: string }> = {
  system: { color: 'gray', text: '系统生成' },
  customer: { color: 'orange', text: '客户提交' },
};

const ticketQueueMeta: Record<OpsTicketQueueCode, { color: string; text: string }> = {
  delivery: { color: 'arcoblue', text: '交付工单' },
  support: { color: 'purple', text: '支持工单' },
};

const supportTicketTypeLabel: Partial<Record<OpsTicketTypeCode, string>> = {
  tech_support: '技术支持',
  im_binding: '开通/配置协助',
};

const currentDeliveryOpsAssignee = 'DE-12 王澈';
const currentDeliveryOpsAssigneeText = `我（${currentDeliveryOpsAssignee}）`;

const priorityMeta: Record<OpsPriority, { color: string; text: string }> = {
  P0: { color: 'red', text: 'P0' },
  P1: { color: 'orangered', text: 'P1' },
  P2: { color: 'gold', text: 'P2' },
  P3: { color: 'gray', text: 'P3' },
};

const bindingStatusMeta: Record<OpsBindingHealthStatus, { color: string; text: string }> = {
  active: { color: 'green', text: '已配置' },
  broken: { color: 'red', text: '失效' },
  disabled: { color: 'gray', text: '已停用' },
  unconfigured: { color: 'gray', text: '未配置' },
};

const checkStatusMeta: Record<OpsCheckStatus, { color: string; text: string }> = {
  pass: { color: 'green', text: '通过' },
  warn: { color: 'gold', text: '告警' },
  fail: { color: 'red', text: '失败' },
};

const networkHealthMeta = {
  good: { color: 'green', text: '稳定' },
  warn: { color: 'gold', text: '关注' },
  danger: { color: 'red', text: '异常' },
} as const;

const channelLabel = {
  feishu: '飞书',
  wecom: '企微',
  dingtalk: '钉钉',
  wechat: '微信',
} as const;

function MetaTag({ color, text }: { color: string; text: string }) {
  return <Tag color={color}>{text}</Tag>;
}

function getTicketTypeLabel(ticket: Pick<OpsTicketListItem, 'queue' | 'type'>) {
  if (ticket.queue === 'support') {
    return supportTicketTypeLabel[ticket.type] ?? ticketTypeLabel[ticket.type];
  }
  return ticketTypeLabel[ticket.type];
}

function OpsPageShell({
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
    <Space direction="vertical" size={16} className="full-width">
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

function OpsDetailHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="sales-detail-header">
      <Button type="text" onClick={onBack}>
        返回
      </Button>
      <div>
        <Title heading={4}>{title}</Title>
        <Text type="secondary">{subtitle}</Text>
      </div>
      {actions}
    </div>
  );
}

function StatusStrip({
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

function OpsTablePanel({
  tabs,
  toolbar,
  children,
}: {
  tabs?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ops-table-panel">
      {tabs ? <div className="ops-table-panel__tabs">{tabs}</div> : null}
      {toolbar ? <div className="ops-table-panel__toolbar">{toolbar}</div> : null}
      {children}
    </div>
  );
}

function renderChannelStatus(statuses: OpsImBindingTenantItem['statuses']) {
  return (
    <div className="ops-status-cluster">
      {Object.entries(statuses).map(([key, value]) => (
        <span className="ops-status-chip" key={key}>
          <Text type="secondary">{channelLabel[key as keyof typeof channelLabel]}</Text>
          <MetaTag {...bindingStatusMeta[value]} />
        </span>
      ))}
    </div>
  );
}

export function OpsTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminTicketView = location.pathname.startsWith('/ops-admin') || location.pathname.startsWith('/admin');
  const routeQueue = detectQueueFromPath(location.pathname);
  const ticketsBasePath = getTicketsBasePath(location.pathname);
  const [rows, setRows] = useState<OpsTicketListItem[]>([]);
  const [assignees, setAssignees] = useState<Array<{ label: string; roleName: string }>>([]);
  const [view, setView] = useState<'all' | 'mine'>('all');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpsTicketTypeCode | undefined>();
  const [statusFilter, setStatusFilter] = useState<OpsTicketStatusCode | undefined>();
  const [assignState, setAssignState] = useState<{ visible: boolean; ticketId: string; assignee: string }>({ visible: false, ticketId: '', assignee: '' });

  const loadData = async () => {
    const [ticketData, assigneeData] = await Promise.all([mockApi.getOpsTickets(), mockApi.getOpsAssignableUsers()]);
    setRows(ticketData);
    setAssignees(assigneeData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const myTickets = useMemo(
    () => rows.filter((item) => item.assignee === currentDeliveryOpsAssignee),
    [rows],
  );

  const isSupportPage = routeQueue === 'support';
  const scopedRows = useMemo(() => {
    const baseRows = isAdminTicketView
      ? (view === 'mine' ? myTickets : rows)
      : myTickets;
    if (routeQueue === 'all') {
      return baseRows;
    }
    return baseRows.filter((item) => {
      if (routeQueue === 'delivery') {
        return item.queue === 'delivery' && item.type === 'opening';
      }
      return item.queue === 'support';
    });
  }, [isAdminTicketView, myTickets, routeQueue, rows, view]);

  const filtered = useMemo(() => {
    return scopedRows.filter((item) => {
      const matchedSearch = `${item.id} ${item.title} ${item.tenantName} ${item.relatedOrderId ?? ''}`.toLowerCase().includes(searchText.toLowerCase());
      const matchedType = !typeFilter || item.type === typeFilter;
      const matchedStatus = !statusFilter || item.status === statusFilter;
      return matchedSearch && matchedType && matchedStatus;
    });
  }, [scopedRows, searchText, statusFilter, typeFilter]);

  const summaryRows = scopedRows;
  const typeOptions = scopedRows;
  const availableTypeEntries = Array.from(new Set(typeOptions.map((item) => item.type))).map((type) => ({
    value: type,
    label: getTicketTypeLabel({ queue: typeOptions.find((item) => item.type === type)?.queue ?? 'delivery', type }),
  }));
  const pageTitle = isSupportPage ? '支持工单' : '交付工单';
  const pageDescription = isAdminTicketView
    ? (isSupportPage ? '查看客户管理员提交的支持工单，集中跟进技术支持与开通配置协助。' : '查看系统生成的交付工单，处理开通、绑定、网络与交付事项。')
    : (isSupportPage ? '处理客户管理员提交的支持工单，包括技术支持和开通/配置协助。' : '处理分配给我的交付工单，包括开通、绑定、网络等实施任务。');
  const assigneeColumn = isAdminTicketView
    ? { title: '经办人', dataIndex: 'assignee' as const }
    : { title: '经办人', dataIndex: 'assignee' as const, render: () => currentDeliveryOpsAssigneeText };
  const actionColumn = isAdminTicketView
    ? {
        title: '操作',
        render: (_: unknown, row: OpsTicketListItem) => (
          <Space size={8}>
            <Button type="text" size="mini" onClick={() => navigate(`${ticketsBasePath}/${row.id}`)}>
              详情
            </Button>
            {view === 'all' ? (
              <Button type="text" size="mini" onClick={() => setAssignState({ visible: true, ticketId: row.id, assignee: row.assignee })}>
                改派
              </Button>
            ) : null}
          </Space>
        ),
      }
    : {
        title: '操作',
        render: (_: unknown, row: OpsTicketListItem) => (
          <Button type="text" size="mini" onClick={() => navigate(`${ticketsBasePath}/${row.id}`)}>
            详情
          </Button>
        ),
      };
  const commonColumns = [
    { title: '工单号', dataIndex: 'id' as const },
    { title: '类型', render: (_: unknown, row: OpsTicketListItem) => <MetaTag color="arcoblue" text={getTicketTypeLabel(row)} /> },
    {
      title: '标题',
      dataIndex: 'title' as const,
      render: (value: string, row: OpsTicketListItem) => (
        <Button type="text" size="mini" onClick={() => navigate(`${ticketsBasePath}/${row.id}`)}>
          {value}
        </Button>
      ),
    },
    { title: '客户', dataIndex: 'tenantName' as const },
    ...(!isSupportPage ? [{ title: '关联订单', dataIndex: 'relatedOrderId' as const, render: (value?: string) => value || '-' }] : []),
    { title: '状态', dataIndex: 'status' as const, render: (value: OpsTicketStatusCode) => <MetaTag {...ticketStatusMeta[value]} /> },
    assigneeColumn,
    { title: '处理时限剩余', dataIndex: 'slaRemaining' as const },
    { title: '最后更新', dataIndex: 'updatedAt' as const },
    actionColumn,
  ];

  return (
    <OpsPageShell
      title={pageTitle}
      description={pageDescription}
      action={
        <Button icon={<IconRefresh />} onClick={loadData}>
          刷新
        </Button>
      }
    >
      <StatusStrip
        items={[
          { label: '未完成', value: `${summaryRows.filter((item) => item.status === 'unfinished').length}`, tone: 'warn' },
          { label: '已解决', value: `${summaryRows.filter((item) => item.status === 'resolved').length}`, tone: 'good' },
          { label: '全部工单', value: `${summaryRows.length}`, tone: 'good' },
        ]}
      />

      <OpsTablePanel
        tabs={location.pathname.startsWith('/ops-admin') ? (
          <Tabs activeTab={view} onChange={(value) => setView(value as 'all' | 'mine')} className="ops-top-tabs">
            <TabPane key="all" title="全部" />
            <TabPane key="mine" title="我的" />
          </Tabs>
        ) : undefined}
        toolbar={(
          <div className="sales-filter-bar">
            <Input.Search
              value={searchText}
              onChange={setSearchText}
              placeholder="搜索工单号、标题、客户、订单"
              className="table-search"
            />
            <Select value={typeFilter} placeholder="类型" style={{ width: 160 }} allowClear onChange={(value) => setTypeFilter(value as OpsTicketTypeCode | undefined)}>
              {availableTypeEntries.map((item) => (
                <Select.Option value={item.value} key={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
            <Select value={statusFilter} placeholder="状态" style={{ width: 130 }} allowClear onChange={(value) => setStatusFilter(value as OpsTicketStatusCode | undefined)}>
              {Object.entries(ticketStatusMeta).map(([key, item]) => (
                <Select.Option value={key} key={key}>
                  {item.text}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      >
        <Table
          rowKey="id"
          pagination={false}
          data={filtered}
          columns={commonColumns}
        />
      </OpsTablePanel>
      {isAdminTicketView ? (
        <Modal
          title="改派交付工单"
          visible={assignState.visible}
          onCancel={() => setAssignState({ visible: false, ticketId: '', assignee: '' })}
          onOk={async () => {
            if (!assignState.assignee) {
              Message.error('请选择经办人');
              return;
            }
            await mockApi.assignOpsTicket(assignState.ticketId, assignState.assignee);
            Message.success('工单已改派');
            setAssignState({ visible: false, ticketId: '', assignee: '' });
            loadData();
          }}
        >
          <Space direction="vertical" size={12} className="full-width">
            <Text type="secondary">工单默认由系统轮询分派。仅在全部队列中，由交付管理员按需要改派给其他交付运维。</Text>
            <Select
              value={assignState.assignee}
              placeholder="请选择经办人"
              onChange={(value) => setAssignState((current) => ({ ...current, assignee: value }))}
            >
              {assignees.map((item) => (
                <Select.Option value={item.label} key={item.label}>
                  {item.label} / {item.roleName}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Modal>
      ) : null}
    </OpsPageShell>
  );
}

export function OpsTicketDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminTicketView = location.pathname.startsWith('/ops-admin') || location.pathname.startsWith('/admin');
  const ticketsBasePath = getTicketsBasePath(location.pathname);
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<OpsTicketDetail>();
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentVisible, setCommentVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const ticketDetail = await mockApi.getOpsTicketDetail(id);
    setDetail(!isAdminTicketView && ticketDetail?.assignee !== currentDeliveryOpsAssignee ? undefined : ticketDetail);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <Spin className="page-spin" tip="加载工单详情" />;
  }

  if (!detail) {
    return <Empty className="page-card page-card--empty" description="未找到工单" />;
  }

  const timelineData = detail.events;
  const canResolve = detail.status === 'unfinished';
  const basicInfoItems = [
    { label: '工单分类', value: ticketQueueMeta[detail.queue].text },
    { label: '工单类型', value: getTicketTypeLabel(detail) },
    { label: '来源', value: ticketSourceMeta[detail.source].text },
    { label: '处理时限剩余', value: detail.slaRemaining },
    { label: '经办人', value: !isAdminTicketView && detail.assignee === currentDeliveryOpsAssignee ? currentDeliveryOpsAssigneeText : detail.assignee },
    { label: '创建时间', value: detail.createdAt },
    { label: '最近更新', value: detail.updatedAt },
    { label: '客户可见', value: detail.customerVisible ? '是' : '否' },
  ];
  const customerInfoItems = [
    { label: '企业', value: detail.tenantName },
    { label: '统一社会信用代码', value: detail.uscc },
    { label: '归属代理', value: detail.salesOwner },
    { label: '交付运维', value: detail.accountManager },
    ...(detail.queue === 'delivery' ? [{ label: '关联订单', value: detail.relatedOrderId || '-' }] : []),
  ];
  const commentPlaceholder = detail.queue === 'delivery'
    ? '补充交付进展、排查结论或需要协同的信息'
    : '补充支持处理进展、客户反馈或后续动作';

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader
        title={detail.title}
        subtitle={`${detail.id} · ${detail.tenantName} · ${ticketStatusMeta[detail.status].text}`}
        onBack={() => navigate(ticketsBasePath)}
        actions={
          <Space>
            <MetaTag {...ticketStatusMeta[detail.status]} />
          </Space>
        }
      />

      <div className="ops-detail-grid">
        <div className="sales-info-panels">
          <Card bordered>
            <Descriptions column={2} title="基本信息" data={basicInfoItems} />
          </Card>

          <Card bordered title="客户卡片">
            <div className="sales-info-grid sales-info-grid--two">
              {customerInfoItems.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered title="问题描述">
            <Text>{detail.description}</Text>
          </Card>

          <Card bordered title="附件">
            <AttachmentViewer attachments={detail.attachments} />
          </Card>

          <Card bordered title="处理动作">
            <Space wrap>
              {canResolve ? (
                <Button
                  className="ops-comment-card__button"
                  onClick={() => setCommentVisible(true)}
                >
                  添加评论
                </Button>
              ) : null}
              {canResolve ? <Button type="primary" onClick={async () => { await mockApi.resolveOpsTicket(detail.id); Message.success('工单已标记解决'); loadData(); }}>标记已解决</Button> : null}
              {!canResolve ? <Text type="secondary">该工单已解决，无需继续处理，也不能继续添加评论。</Text> : null}
            </Space>
          </Card>
        </div>

        <Card
          bordered
          className="ops-timeline-card"
          title="交付记录"
        >
          <Timeline mode="left">
            {timelineData.map((item: OpsTicketEvent) => (
              <Timeline.Item key={item.id} label={item.createdAt}>
                <div className="ops-timeline-item">
                  <strong>{item.actor}</strong>
                  <Text type="secondary">{item.actorRole}</Text>
                </div>
                <Text>{item.content}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </div>
      <Modal
        title="添加评论"
        visible={commentVisible}
        onCancel={() => {
          setCommentVisible(false);
          setComment('');
        }}
        onOk={async () => {
          if (!comment.trim()) {
            Message.error('请填写评论内容');
            return;
          }
          await mockApi.addOpsTicketComment(detail.id, { content: comment.trim(), isInternal: false });
          Message.success('评论已添加');
          setComment('');
          setCommentVisible(false);
          loadData();
        }}
      >
        <Space direction="vertical" size={12} className="full-width ops-comment-card detail-control-shell">
          <Input.TextArea
            value={comment}
            onChange={setComment}
            rows={5}
            placeholder={commentPlaceholder}
          />
        </Space>
      </Modal>
    </div>
  );
}

export function OpsImBindingWorkspacePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsImBindingTenantItem[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getOpsBindingWorkspace());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <OpsPageShell
      title="IM 绑定"
      description="飞书 / 企微 / 钉钉 / 微信的录入、测试、员工同步与历史回滚"
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <StatusStrip
        items={[
          { label: '已配置客户', value: `${rows.filter((row) => Object.values(row.statuses).some((item) => item === 'active')).length}`, tone: 'good' },
          { label: '失效绑定', value: `${rows.filter((row) => Object.values(row.statuses).some((item) => item === 'broken')).length}`, tone: 'danger' },
          { label: '待交付工单', value: `${rows.length}`, tone: 'warn' },
        ]}
      />
      <Card bordered>
        <div className="sales-filter-bar">
          <Input.Search placeholder="搜索企业名、统一社会信用代码、工单号" className="table-search" />
        </div>
        <Table
          rowKey="tenantId"
          pagination={false}
          data={rows}
          columns={[
            {
              title: '企业',
              dataIndex: 'tenantName',
              render: (value: string, row: OpsImBindingTenantItem) => (
                <Button type="text" size="mini" onClick={() => navigate(`/ops/im-binding/${row.tenantId}`)}>
                  {value}
                </Button>
              ),
            },
            { title: '统一社会信用代码', dataIndex: 'uscc' },
            { title: '当前工单', dataIndex: 'currentTicketId' },
            { title: '负责人', dataIndex: 'owner' },
            { title: '绑定状态', render: (_: unknown, row: OpsImBindingTenantItem) => renderChannelStatus(row.statuses) },
            { title: '更新时间', dataIndex: 'updatedAt' },
            {
              title: '操作',
              render: (_: unknown, row: OpsImBindingTenantItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`/ops/im-binding/${row.tenantId}`)}>进入配置</Button>
                  <Button type="text" size="mini" onClick={() => navigate(`/ops/customers/${row.tenantId}`)}>客户档案</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </OpsPageShell>
  );
}

export function OpsImBindingDetailPage() {
  const navigate = useNavigate();
  const { tenantId = '' } = useParams();
  const [detail, setDetail] = useState<OpsImBindingDetail>();
  const [activeChannel, setActiveChannel] = useState<string>('wecom');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const next = await mockApi.getOpsImBindingDetail(tenantId);
    setDetail(next);
    const firstChannel = next?.channels?.[0];
    setActiveChannel(firstChannel?.channel || 'wecom');
    setDraft(firstChannel?.config || {});
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const currentChannel = useMemo(
    () => detail?.channels?.find((item: OpsImBindingChannelDetail) => item.channel === activeChannel),
    [detail, activeChannel],
  );

  useEffect(() => {
    if (currentChannel) {
      setDraft(currentChannel.config);
    }
  }, [currentChannel]);

  if (loading) {
    return <Spin className="page-spin" tip="加载 IM 绑定详情" />;
  }

  if (!detail || !currentChannel) {
    return <Empty className="page-card page-card--empty" description="未找到绑定数据" />;
  }

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader
        title={`${detail.tenantName} · IM 绑定`}
        subtitle={`当前工单 ${detail.currentTicketId} · ${channelLabel[currentChannel.channel]}`}
        onBack={() => navigate('/ops/im-binding')}
        actions={
          <Space>
            <MetaTag {...bindingStatusMeta[currentChannel.status]} />
            <Button onClick={() => navigate(`/ops/customers/${detail.tenantId}`)}>客户档案</Button>
          </Space>
        }
      />

      <Tabs activeTab={activeChannel} onChange={setActiveChannel} className="ops-top-tabs">
        {detail.channels.map((channel: OpsImBindingChannelDetail) => (
          <TabPane key={channel.channel} title={channelLabel[channel.channel]} />
        ))}
      </Tabs>

      <div className="sales-info-panels">
        <Card bordered title="配置向导">
          <div className="sales-form-grid">
            {currentChannel.fields.map((field: any) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <Input
                  value={draft[field.key] || ''}
                  disabled={field.readonly}
                  placeholder={field.required ? '必填' : '可选'}
                  onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                />
              </label>
            ))}
            <label>
              <span>可信域名</span>
              <Input value={currentChannel.trustedDomain} readOnly />
            </label>
            <label>
              <span>回调 URL</span>
              <Input value={currentChannel.callbackUrl} readOnly />
            </label>
          </div>
          <div className="sales-detail-footer">
            <Space>
              <Button onClick={async () => { await mockApi.testOpsImBinding(detail.tenantId, currentChannel.channel); Message.success('测试连通通过'); loadData(); }}>测试连通</Button>
              <Button type="primary" onClick={async () => { await mockApi.saveOpsImBinding(detail.tenantId, currentChannel.channel, draft); Message.success('绑定版本已保存'); loadData(); }}>保存配置</Button>
              <Button onClick={async () => { const result = await mockApi.syncOpsBindingEmployees(); Message.success(`已触发员工同步，预计同步 ${result.synced} 人`); }}>触发员工同步</Button>
            </Space>
          </div>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card bordered title="最近测试">
              <div className="ops-list-stack">
                {currentChannel.checks.length ? currentChannel.checks.map((item) => (
                  <div className="ops-list-row" key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      <Text type="secondary">{item.detail}</Text>
                    </div>
                    <MetaTag {...checkStatusMeta[item.status]} />
                  </div>
                )) : <Empty description="尚未测试" />}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered title="历史快照">
              <Table
                rowKey="id"
                pagination={false}
                data={detail.history.filter((item: any) => item.channel === currentChannel.channel)}
                columns={[
                  { title: '时间', dataIndex: 'changedAt' },
                  { title: '操作人', dataIndex: 'changedBy' },
                  { title: '变更类型', dataIndex: 'changeType' },
                  { title: '测试结果', dataIndex: 'testResult', render: (value: 'pass' | 'fail') => <MetaTag {...checkStatusMeta[value === 'pass' ? 'pass' : 'fail']} /> },
                  { title: '摘要', dataIndex: 'summary' },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export function OpsNetworkPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsNetworkWorkspaceItem[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getOpsNetworkWorkspace());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <OpsPageShell
      title="网络配置"
      description="公网入口、公网出口、私网出口的客户级工作台；所有写操作要求绑定工单"
      action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}
    >
      <StatusStrip
        items={[
          { label: '已启用自定义域名', value: `${rows.filter((item) => item.customDomain).length}`, tone: 'good' },
          { label: '需关注客户', value: `${rows.filter((item) => item.health !== 'good').length}`, tone: 'warn' },
          { label: '私网直连客户', value: `${rows.filter((item) => item.vpcStatus === 'active').length}`, tone: 'danger' },
        ]}
      />
      <Card bordered>
        <div className="sales-filter-bar">
          <Input.Search placeholder="搜索企业、域名、VPC" className="table-search" />
          <Select placeholder="健康状态" style={{ width: 140 }} allowClear>
            <Select.Option value="good">稳定</Select.Option>
            <Select.Option value="warn">关注</Select.Option>
            <Select.Option value="danger">异常</Select.Option>
          </Select>
        </div>
        <Table
          rowKey="tenantId"
          pagination={false}
          data={rows}
          columns={[
            {
              title: '企业',
              dataIndex: 'tenantName',
              render: (value: string, row: OpsNetworkWorkspaceItem) => (
                <Button type="text" size="mini" onClick={() => navigate(`/ops/network/${row.tenantId}`)}>
                  {value}
                </Button>
              ),
            },
            { title: '自定义域名', dataIndex: 'customDomain', render: (value: string) => value || '-' },
            { title: '公网入口', dataIndex: 'ingressStatus' },
            { title: '公网出口', dataIndex: 'egressStatus' },
            { title: '私网出口', dataIndex: 'vpcStatus' },
            { title: '负责人', dataIndex: 'owner' },
            { title: '健康状态', dataIndex: 'health', render: (value: keyof typeof networkHealthMeta) => <MetaTag {...networkHealthMeta[value]} /> },
            { title: '更新时间', dataIndex: 'updatedAt' },
            {
              title: '操作',
              render: (_: unknown, row: OpsNetworkWorkspaceItem) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => navigate(`/ops/network/${row.tenantId}`)}>
                    编辑
                  </Button>
                  <Button type="text" size="mini" onClick={() => navigate(`/ops/diagnosis/${row.tenantId}`)}>
                    诊断
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </OpsPageShell>
  );
}

export function OpsNetworkDetailPage() {
  const navigate = useNavigate();
  const { tenantId = '' } = useParams();
  const [detail, setDetail] = useState<OpsNetworkDetail>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingress' | 'egress' | 'vpc'>('ingress');
  const [draft, setDraft] = useState<any>();

  const loadData = async () => {
    setLoading(true);
    const next = await mockApi.getOpsNetworkDetail(tenantId);
    setDetail(next);
    setDraft(next);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  if (loading) {
    return <Spin className="page-spin" tip="加载网络配置" />;
  }

  if (!detail || !draft) {
    return <Empty className="page-card page-card--empty" description="未找到网络配置" />;
  }

  const tests = activeTab === 'ingress' ? detail.ingressTests : activeTab === 'egress' ? detail.egressTests : detail.vpcTests;

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader
        title={`${detail.tenantName} · 网络配置`}
        subtitle={`工单 ${detail.currentTicketId} · ${detail.customDomain || detail.defaultLoginUrl}`}
        onBack={() => navigate('/ops/network')}
        actions={
          <Space>
            <Button icon={<IconLink />} onClick={() => navigate(`/ops/customers/${detail.tenantId}`)}>客户档案</Button>
            <Button icon={<IconSafe />} onClick={() => navigate(`/ops/diagnosis/${detail.tenantId}`)}>诊断</Button>
          </Space>
        }
      />

      <Tabs activeTab={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)} className="ops-top-tabs">
        <TabPane key="ingress" title="公网入口" />
        <TabPane key="egress" title="公网出口" />
        <TabPane key="vpc" title="私网出口" />
      </Tabs>

      <div className="sales-info-panels">
        <Card bordered title="配置表单">
          {activeTab === 'ingress' ? (
            <div className="sales-form-grid">
              <label><span>系统默认登录链接</span><Input value={draft.defaultLoginUrl} readOnly /></label>
              <label><span>启用自定义域名</span><Switch checked={Boolean(draft.customDomainEnabled)} onChange={(value) => setDraft((current: any) => ({ ...current, customDomainEnabled: value }))} /></label>
              <label><span>自定义域名</span><Input value={draft.customDomain} onChange={(value) => setDraft((current: any) => ({ ...current, customDomain: value }))} /></label>
              <label><span>证书模式</span><Select value={draft.certMode} onChange={(value) => setDraft((current: any) => ({ ...current, certMode: value }))}><Select.Option value="upload">上传证书</Select.Option><Select.Option value="acme">ACME 自动签</Select.Option></Select></label>
              <label><span>证书有效期</span><Input value={draft.certExpiresAt} onChange={(value) => setDraft((current: any) => ({ ...current, certExpiresAt: value }))} /></label>
              <label><span>跳转策略</span><Select value={draft.redirectStrategy} onChange={(value) => setDraft((current: any) => ({ ...current, redirectStrategy: value }))}><Select.Option value="默认页">默认页</Select.Option><Select.Option value="跳转外部 SSO">跳转外部 SSO</Select.Option></Select></label>
            </div>
          ) : null}

          {activeTab === 'egress' ? (
            <div className="sales-form-grid">
              <label><span>启用公网出口</span><Switch checked={Boolean(draft.egressEnabled)} onChange={(value) => setDraft((current: any) => ({ ...current, egressEnabled: value }))} /></label>
              <label><span>跨境加速</span><Switch checked={Boolean(draft.egressAcceleration)} onChange={(value) => setDraft((current: any) => ({ ...current, egressAcceleration: value }))} /></label>
              <label><span>加速节点</span><Select value={draft.egressNode} onChange={(value) => setDraft((current: any) => ({ ...current, egressNode: value }))}><Select.Option value="未启用">未启用</Select.Option><Select.Option value="北美">北美</Select.Option><Select.Option value="欧洲">欧洲</Select.Option><Select.Option value="东南亚">东南亚</Select.Option></Select></label>
              <label><span>加速域名白名单</span><Input.TextArea value={draft.egressWhitelist.join('\n')} rows={4} onChange={(value) => setDraft((current: any) => ({ ...current, egressWhitelist: value.split('\n').filter(Boolean) }))} /></label>
              <label><span>出口 IP 白名单</span><Input.TextArea value={draft.egressIpWhitelist.join('\n')} rows={4} onChange={(value) => setDraft((current: any) => ({ ...current, egressIpWhitelist: value.split('\n').filter(Boolean) }))} /></label>
              <label><span>出口限速</span><Input value={draft.egressRateLimit} onChange={(value) => setDraft((current: any) => ({ ...current, egressRateLimit: value }))} /></label>
            </div>
          ) : null}

          {activeTab === 'vpc' ? (
            <div className="sales-form-grid">
              <label><span>启用私网出口</span><Switch checked={Boolean(draft.vpcEnabled)} onChange={(value) => setDraft((current: any) => ({ ...current, vpcEnabled: value }))} /></label>
              <label><span>接入方式</span><Select value={draft.vpcMethod} onChange={(value) => setDraft((current: any) => ({ ...current, vpcMethod: value }))}><Select.Option value="direct">专线</Select.Option><Select.Option value="vpn">VPN</Select.Option><Select.Option value="ccn">云联网</Select.Option></Select></label>
              <label><span>客户 VPC ID</span><Input value={draft.vpcId} onChange={(value) => setDraft((current: any) => ({ ...current, vpcId: value }))} /></label>
              <label><span>客户子网 CIDR</span><Input value={draft.vpcSubnet} onChange={(value) => setDraft((current: any) => ({ ...current, vpcSubnet: value }))} /></label>
              <label><span>客户网关 IP</span><Input value={draft.vpcGateway} onChange={(value) => setDraft((current: any) => ({ ...current, vpcGateway: value }))} /></label>
              <label><span>我方分配 CIDR</span><Input value={draft.ourCidr} onChange={(value) => setDraft((current: any) => ({ ...current, ourCidr: value }))} /></label>
            </div>
          ) : null}

          <div className="sales-detail-footer">
            <Space>
              <Button onClick={async () => { await mockApi.testOpsNetwork(detail.tenantId); Message.success('测试已完成'); loadData(); }}>运行测试</Button>
              <Button type="primary" onClick={async () => { await mockApi.saveOpsNetwork(detail.tenantId, draft); Message.success('网络配置已保存'); loadData(); }}>保存配置</Button>
              {detail.requiresApproval ? <Text type="secondary">当前客户存在高危变更，保存前需 OL- 审批。</Text> : null}
            </Space>
          </div>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card bordered title="最近测试结果">
              <div className="ops-list-stack">
                {tests.map((item) => (
                  <div className="ops-list-row" key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      <Text type="secondary">{item.detail}</Text>
                    </div>
                    <MetaTag {...checkStatusMeta[item.status]} />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered title="历史快照">
              <Table
                rowKey="id"
                pagination={false}
                data={detail.history}
                columns={[
                  { title: '时间', dataIndex: 'changedAt' },
                  { title: '操作人', dataIndex: 'changedBy' },
                  { title: '类型', dataIndex: 'changeType' },
                  { title: '工单', dataIndex: 'ticketId' },
                  { title: '摘要', dataIndex: 'summary' },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export function OpsDiagnosisPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsDiagnosisWorkspaceItem[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getOpsDiagnosisWorkspace());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <OpsPageShell title="客户诊断与支持" description="一键诊断、错误日志、网络工具与远程协助入口" action={<Button icon={<IconRefresh />} onClick={loadData}>刷新</Button>}>
      <StatusStrip
        items={[
          { label: '活跃告警客户', value: `${rows.filter((item) => item.activeAlerts > 0).length}`, tone: 'danger' },
          { label: '建议立即处理', value: `${rows.filter((item) => item.recommendedAction).length}`, tone: 'warn' },
        ]}
      />
      <Card bordered>
        <div className="sales-filter-bar">
          <Input.Search placeholder="搜索企业、Trace ID、工单号" className="table-search" />
        </div>
        <Table
          rowKey="tenantId"
          pagination={false}
          data={rows}
          columns={[
            {
              title: '企业',
              dataIndex: 'tenantName',
              render: (value: string, row: OpsDiagnosisWorkspaceItem) => (
                <Button type="text" size="mini" onClick={() => navigate(`/ops/diagnosis/${row.tenantId}`)}>
                  {value}
                </Button>
              ),
            },
            { title: '活跃告警', dataIndex: 'activeAlerts' },
            { title: '最近故障', dataIndex: 'lastIncidentAt' },
            { title: '最近 1h 错误率', dataIndex: 'lastErrorRate' },
            { title: '建议动作', dataIndex: 'recommendedAction' },
            { title: '操作', render: (_: unknown, row: OpsDiagnosisWorkspaceItem) => <Button type="text" size="mini" onClick={() => navigate(`/ops/diagnosis/${row.tenantId}`)}>开始诊断</Button> },
          ]}
        />
      </Card>
    </OpsPageShell>
  );
}

export function OpsDiagnosisDetailPage() {
  const navigate = useNavigate();
  const { tenantId = '' } = useParams();
  const [detail, setDetail] = useState<OpsDiagnosisDetail>();
  const [loading, setLoading] = useState(true);
  const [remoteVisible, setRemoteVisible] = useState(false);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setDetail(await mockApi.getOpsDiagnosisDetail(tenantId));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  if (loading) {
    return <Spin className="page-spin" tip="加载诊断面板" />;
  }

  if (!detail) {
    return <Empty className="page-card page-card--empty" description="未找到诊断数据" />;
  }

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader
        title={`${detail.tenantName} · 诊断面板`}
        subtitle={`关联工单 ${detail.currentTicketId}`}
        onBack={() => navigate('/ops/diagnosis')}
        actions={
          <Space>
            <Button onClick={async () => { await mockApi.runOpsDiagnosisQuick(detail.tenantId); Message.success('一键诊断已完成'); loadData(); }}>一键诊断</Button>
            <Button type="primary" onClick={() => setRemoteVisible(true)}>申请远程协助</Button>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col span={12}>
          <Card bordered title="诊断检查项">
            <div className="ops-list-stack">
              {detail.checks.map((item: OpsDiagnosisCheckItem) => (
                <div className="ops-list-row" key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <Text type="secondary">{item.detail}</Text>
                    <Text type="secondary">{item.suggestion}</Text>
                  </div>
                  <MetaTag {...checkStatusMeta[item.status]} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered title="活跃告警">
            <div className="ops-list-stack">
              {detail.alerts.map((item: OpsAlertRecord) => (
                <div className="ops-list-row" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <Text type="secondary">{item.source} · {item.createdAt}</Text>
                  </div>
                  <Space>
                    <MetaTag {...priorityMeta[item.level]} />
                    <Button size="mini" onClick={async () => { await mockApi.closeOpsAlert(detail.tenantId, item.id); Message.success('告警已关闭'); loadData(); }}>关闭</Button>
                    <Button size="mini" onClick={async () => { await mockApi.suppressOpsAlert(detail.tenantId, item.id); Message.success('告警已抑制'); loadData(); }}>抑制</Button>
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card bordered title="错误日志">
            <Table
              rowKey="id"
              pagination={false}
              data={detail.logs}
              columns={[
                { title: '时间', dataIndex: 'time' },
                { title: '错误码', dataIndex: 'code' },
                { title: '用户', dataIndex: 'user' },
                { title: 'Skill', dataIndex: 'skill' },
                { title: 'Trace ID', dataIndex: 'traceId' },
                { title: '描述', dataIndex: 'description' },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card bordered title="工具结果">
            <div className="ops-list-stack">
              {detail.tools.map((item: OpsToolResult) => (
                <div className="ops-list-row" key={item.id}>
                  <div>
                    <strong>{item.tool}</strong>
                    <Text type="secondary">{item.target} · {item.summary}</Text>
                    <Text type="secondary">{item.checkedAt}</Text>
                  </div>
                  <MetaTag {...checkStatusMeta[item.status]} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card bordered title="远程协助记录">
        <Table
          rowKey="id"
          pagination={false}
          data={detail.sessions}
          columns={[
            { title: '会话 ID', dataIndex: 'id' },
            { title: '工单', dataIndex: 'ticketId' },
            { title: '操作人', dataIndex: 'operator' },
            { title: '原因', dataIndex: 'reason' },
            { title: '开始时间', dataIndex: 'startedAt' },
            { title: '预计结束', dataIndex: 'expectedEndAt' },
            { title: '状态', dataIndex: 'status', render: (value: string) => <MetaTag color={value === 'active' ? 'red' : 'gray'} text={value === 'active' ? '进行中' : '已结束'} /> },
            { title: '操作', render: (_: unknown, row: OpsRemoteAssistSession) => row.status === 'active' ? <Button type="text" size="mini" onClick={async () => { await mockApi.endOpsRemoteAssist(detail.tenantId, row.id); Message.success('远程协助已结束'); loadData(); }}>结束</Button> : '-' },
          ]}
        />
      </Card>

      <Modal
        title="申请远程协助"
        visible={remoteVisible}
        onCancel={() => setRemoteVisible(false)}
        onOk={async () => {
          if (!reason.trim()) {
            Message.error('请填写排查原因');
            return;
          }
          await mockApi.startOpsRemoteAssist(detail.tenantId, { ticketId: detail.currentTicketId, reason: reason.trim() });
          Message.success('远程协助会话已启动');
          setReason('');
          setRemoteVisible(false);
          loadData();
        }}
      >
        <Input.TextArea value={reason} rows={4} onChange={setReason} placeholder="填写工单号、客户授权说明与本次排查目标" />
      </Modal>
    </div>
  );
}

export function OpsInspectionPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsInspectionRun[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getOpsInspectionRuns());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <OpsPageShell
      title="健康巡检"
      description="日 / 周 / 月巡检执行记录、失败项跟踪与规则配置"
      action={
        <Space>
          <Button onClick={async () => { await mockApi.triggerOpsInspectionManual(); Message.success('已触发一次手动巡检'); loadData(); }}>手动执行</Button>
          <Button icon={<IconSettings />} onClick={() => navigate('/ops/inspection/rules')}>巡检规则</Button>
        </Space>
      }
    >
      <StatusStrip
        items={[
          { label: '近 3 次巡检', value: `${rows.length}`, tone: 'good' },
          { label: '生成工单', value: `${rows.reduce((sum, item) => sum + item.generatedTickets, 0)}`, tone: 'warn' },
          { label: '失败检查项', value: `${rows.reduce((sum, item) => sum + item.failedItems, 0)}`, tone: 'danger' },
        ]}
      />
      <Card bordered>
        <Table
          rowKey="id"
          pagination={false}
          data={rows}
          columns={[
            {
              title: '巡检 ID',
              dataIndex: 'id',
              render: (value: string, row: OpsInspectionRun) => (
                <Button type="text" size="mini" onClick={() => navigate(`/ops/inspection/${row.id}`)}>
                  {value}
                </Button>
              ),
            },
            { title: '类型', dataIndex: 'runType' },
            { title: '计划时间', dataIndex: 'scheduledAt' },
            { title: '扫描客户数', dataIndex: 'scannedTenants' },
            { title: '异常数', dataIndex: 'failedItems' },
            { title: '自动建工单数', dataIndex: 'generatedTickets' },
            { title: '状态', dataIndex: 'status' },
          ]}
        />
      </Card>
    </OpsPageShell>
  );
}

export function OpsInspectionRunDetailPage() {
  const navigate = useNavigate();
  const { runId = '' } = useParams();
  const [rows, setRows] = useState<OpsInspectionItemResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    mockApi.getOpsInspectionRunDetail(runId).then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, [runId]);

  if (loading) {
    return <Spin className="page-spin" tip="加载巡检明细" />;
  }

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader title={`巡检执行明细`} subtitle={runId} onBack={() => navigate('/ops/inspection')} />
      <Card bordered>
        <Table
          rowKey="id"
          pagination={false}
          data={rows}
          columns={[
            { title: '客户', dataIndex: 'tenantName' },
            { title: '检查项', dataIndex: 'itemName' },
            { title: '结果', dataIndex: 'result', render: (value: OpsCheckStatus) => <MetaTag {...checkStatusMeta[value]} /> },
            { title: '详情', dataIndex: 'detail' },
            { title: '生成工单', dataIndex: 'generatedTicketId', render: (value?: string) => value || '-' },
            { title: '检查时间', dataIndex: 'checkedAt' },
          ]}
        />
      </Card>
    </div>
  );
}

export function OpsInspectionRulesPage() {
  const [rows, setRows] = useState<OpsInspectionRule[]>([]);

  const loadData = async () => {
    setRows(await mockApi.getOpsInspectionRules());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <OpsPageShell title="巡检规则" description="仅 OL- 可维护检查项频率、阈值与自动建单策略">
      <Card bordered>
        <Table
          rowKey="id"
          pagination={false}
          data={rows}
          columns={[
            { title: '规则', dataIndex: 'name' },
            { title: '说明', dataIndex: 'description' },
            { title: '频率', dataIndex: 'frequency' },
            { title: '阈值', dataIndex: 'threshold' },
            { title: '建单', dataIndex: 'autoCreateTicket', render: (value: boolean) => <MetaTag color={value ? 'green' : 'gray'} text={value ? '自动建单' : '仅告警'} /> },
            { title: '优先级', dataIndex: 'priority', render: (value: OpsPriority) => <MetaTag {...priorityMeta[value]} /> },
            { title: '启用', dataIndex: 'enabled', render: (value: boolean, row: OpsInspectionRule) => <Switch checked={value} onChange={async (next) => { await mockApi.updateOpsInspectionRule(row.id, { enabled: next }); loadData(); }} /> },
          ]}
        />
      </Card>
    </OpsPageShell>
  );
}

export function OpsCustomerArchivePage() {
  const navigate = useNavigate();
  const { tenantId = '' } = useParams();
  const [overview, setOverview] = useState<OpsCustomerOverview>();
  const [tickets, setTickets] = useState<OpsTicketListItem[]>([]);
  const [changes, setChanges] = useState<OpsChangeRecord[]>([]);
  const [sessions, setSessions] = useState<OpsRemoteAssistSession[]>([]);
  const [remarks, setRemarks] = useState<OpsRemarkRecord[]>([]);
  const [remarkVisible, setRemarkVisible] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [overviewData, ticketRows, changeRows, sessionRows, remarkRows] = await Promise.all([
      mockApi.getOpsCustomerOverview(tenantId),
      mockApi.getOpsCustomerTickets(tenantId),
      mockApi.getOpsCustomerChanges(tenantId),
      mockApi.getOpsCustomerImpersonations(tenantId),
      mockApi.getOpsCustomerRemarks(tenantId),
    ]);
    setOverview(overviewData);
    setTickets(ticketRows);
    setChanges(changeRows);
    setSessions(sessionRows);
    setRemarks(remarkRows);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  if (loading) {
    return <Spin className="page-spin" tip="加载客户运维档案" />;
  }

  if (!overview) {
    return <Empty className="page-card page-card--empty" description="未找到客户档案" />;
  }

  return (
    <div className="sales-detail-screen">
      <OpsDetailHeader
        title={`${overview.tenantName} · 客户运维档案`}
        subtitle={`${overview.uscc} · ${networkHealthMeta[overview.health].text}`}
        onBack={() => navigate('/ops/delivery-tickets')}
        actions={<Button onClick={() => setRemarkVisible(true)}>新增备注</Button>}
      />

      <Tabs defaultActiveTab="overview" className="ops-top-tabs">
        <TabPane key="overview" title="概况">
          <Row gutter={16}>
            <Col span={12}>
              <Card bordered>
                <Descriptions column={1} data={[
                  { label: '归属代理', value: overview.salesOwner },
                  { label: '客户经理', value: overview.accountManager },
                  { label: 'IM 配置摘要', value: overview.bindingSummary },
                  { label: '网络摘要', value: overview.networkSummary },
                  { label: '最近巡检', value: overview.latestInspection },
                  { label: '运维提醒', value: overview.note },
                ]} />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered title="快捷入口">
                <Space direction="vertical" className="full-width">
                  <Button long onClick={() => navigate(`/ops/im-binding/${tenantId}`)}>进入 IM 绑定</Button>
                  <Button long onClick={() => navigate(`/ops/network/${tenantId}`)}>进入网络配置</Button>
                  <Button long onClick={() => navigate(`/ops/diagnosis/${tenantId}`)}>进入诊断面板</Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane key="tickets" title="历史工单">
          <Card bordered>
            <Table rowKey="id" pagination={false} data={tickets} columns={[
              { title: '工单号', dataIndex: 'id' },
              { title: '标题', dataIndex: 'title' },
              { title: '类型', dataIndex: 'type', render: (value: OpsTicketTypeCode) => ticketTypeLabel[value] },
              { title: '状态', dataIndex: 'status', render: (value: OpsTicketStatusCode) => <MetaTag {...ticketStatusMeta[value]} /> },
              { title: '更新时间', dataIndex: 'updatedAt' },
            ]} />
          </Card>
        </TabPane>
        <TabPane key="changes" title="配置变更日志">
          <Card bordered>
            <Table rowKey="id" pagination={false} data={changes} columns={[
              { title: '时间', dataIndex: 'createdAt' },
              { title: '类型', dataIndex: 'type' },
              { title: '摘要', dataIndex: 'summary' },
              { title: '操作人', dataIndex: 'operator' },
            ]} />
          </Card>
        </TabPane>
        <TabPane key="sessions" title="远程协助记录">
          <Card bordered>
            <Table rowKey="id" pagination={false} data={sessions} columns={[
              { title: '会话 ID', dataIndex: 'id' },
              { title: '原因', dataIndex: 'reason' },
              { title: '操作人', dataIndex: 'operator' },
              { title: '开始时间', dataIndex: 'startedAt' },
              { title: '结束时间', dataIndex: 'endedAt', render: (value?: string) => value || '-' },
            ]} />
          </Card>
        </TabPane>
        <TabPane key="remarks" title="运维备注">
          <Card bordered>
            <div className="ops-list-stack">
              {remarks.map((item) => (
                <div className="ops-note-card" key={item.id}>
                  <strong>{item.author}</strong>
                  <Text type="secondary">{item.createdAt}</Text>
                  <Text>{item.content}</Text>
                </div>
              ))}
            </div>
          </Card>
        </TabPane>
      </Tabs>

      <Drawer
        width={420}
        title="新增运维备注"
        visible={remarkVisible}
        onCancel={() => setRemarkVisible(false)}
        onOk={async () => {
          if (!remarkDraft.trim()) {
            Message.error('请填写备注内容');
            return;
          }
          await mockApi.addOpsCustomerRemark(tenantId, remarkDraft.trim());
          Message.success('备注已保存');
          setRemarkDraft('');
          setRemarkVisible(false);
          loadData();
        }}
      >
        <Input.TextArea value={remarkDraft} rows={8} onChange={setRemarkDraft} placeholder="沉淀网络细节、客户协作偏好或排障经验" />
      </Drawer>
    </div>
  );
}
