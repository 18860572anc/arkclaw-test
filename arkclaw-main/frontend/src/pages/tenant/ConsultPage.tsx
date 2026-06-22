import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import type { ChangeEvent } from 'react';
import { IconDelete, IconLink, IconSend, IconUpload } from '@arco-design/web-react/icon';
import AttachmentViewer from '../../components/AttachmentViewer';
import { mockApi } from '../../services/mockApi';
import type {
  OpsTicketListItem,
  OpsTicketStatusCode,
  OpsTicketTypeCode,
  TenantBusinessConsultRecord,
  TenantSupportRequestPayload,
} from '../../types/domain';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

const supportTypeMeta: Record<TenantSupportRequestPayload['type'], { label: string; description: string }> = {
  tech_support: { label: '技术支持', description: '适用于登录失败、页面报错、功能异常、使用受阻等问题。' },
  onboarding: { label: '开通/配置协助', description: '适用于企业初始化、IM 绑定、域名、网络或工作台配置协助。' },
  business_consult: { label: '席位/套餐咨询', description: '适用于增购、续费、升降配、套餐差价和商务政策咨询。' },
};

const ticketTypeLabel: Record<OpsTicketTypeCode, string> = {
  opening: '开通工单',
  im_binding: '开通/配置协助',
  network: '网络',
  tech_support: '技术支持',
  business_consult: '席位/套餐咨询',
  incident: '故障事件',
  data_export: '数据导出',
};

const ticketStatusMeta: Record<OpsTicketStatusCode, { color: string; text: string }> = {
  unfinished: { color: 'arcoblue', text: '未完成' },
  resolved: { color: 'green', text: '已解决' },
};

const businessConsultStatusMeta: Record<TenantBusinessConsultRecord['status'], { color: string; text: string }> = {
  pending_reply: { color: 'gold', text: '待代理回复' },
  replied: { color: 'green', text: '已回复' },
  completed: { color: 'gray', text: '已完结' },
};

const DAILY_TYPE_SUBMISSION_LIMIT = 3;

const supportRequestToTicketType: Record<TenantSupportRequestPayload['type'], OpsTicketTypeCode> = {
  tech_support: 'tech_support',
  onboarding: 'im_binding',
  business_consult: 'business_consult',
};

const normalizeRequestTitle = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

const NoWrapText = ({ children }: { children: string }) => (
  <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
);

const EllipsisText = ({ children }: { children: string }) => (
  <Tooltip content={children}>
    <span className="sales-ellipsis">{children}</span>
  </Tooltip>
);

export default function ConsultPage() {
  const [form] = Form.useForm<TenantSupportRequestPayload>();
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [tickets, setTickets] = useState<OpsTicketListItem[]>([]);
  const [activeTicket, setActiveTicket] = useState<OpsTicketListItem | null>(null);
  const [activeTicketDetail, setActiveTicketDetail] = useState<Awaited<ReturnType<typeof mockApi.getOpsTicketDetail>> | null>(null);
  const [activeTicketDetailLoading, setActiveTicketDetailLoading] = useState(false);
  const [businessConsultsLoading, setBusinessConsultsLoading] = useState(true);
  const [businessConsults, setBusinessConsults] = useState<TenantBusinessConsultRecord[]>([]);
  const [activeBusinessConsult, setActiveBusinessConsult] = useState<TenantBusinessConsultRecord | null>(null);
  const [attachments, setAttachments] = useState<Array<{ filename: string; size: string }>>([]);
  const [selectedType, setSelectedType] = useState<TenantSupportRequestPayload['type']>('tech_support');

  const getDailySupportSubmissionCount = (values: TenantSupportRequestPayload) => {
    const today = dayjs();
    return tickets.filter(
      (item) =>
        item.type === supportRequestToTicketType[values.type] &&
        dayjs(item.createdAt).isSame(today, 'day'),
    ).length;
  };

  const getDailyBusinessConsultSubmissionCount = () => {
    const today = dayjs();
    return businessConsults.filter((item) => dayjs(item.createdAt).isSame(today, 'day')).length;
  };

  const hasOpenDuplicateSupportTicket = (values: TenantSupportRequestPayload) => {
    const normalizedTitle = normalizeRequestTitle(values.title);
    return tickets.some(
      (item) =>
        item.status === 'unfinished' &&
        item.type === supportRequestToTicketType[values.type] &&
        normalizeRequestTitle(item.title) === normalizedTitle,
    );
  };

  const hasOpenDuplicateBusinessConsult = (values: TenantSupportRequestPayload) => {
    const normalizedTitle = normalizeRequestTitle(values.title);
    return businessConsults.some(
      (item) =>
        item.status !== 'completed' &&
        normalizeRequestTitle(item.title) === normalizedTitle,
    );
  };

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    const rows = await mockApi.getTenantSupportTickets();
    setTickets(rows);
    setTicketsLoading(false);
  };

  const loadBusinessConsults = async () => {
    setBusinessConsultsLoading(true);
    const rows = await mockApi.getTenantBusinessConsults();
    setBusinessConsults(rows);
    setBusinessConsultsLoading(false);
  };

  useEffect(() => {
    void loadTickets();
    void loadBusinessConsults();
  }, []);

  useEffect(() => {
    if (!activeTicket) {
      setActiveTicketDetail(null);
      return;
    }
    setActiveTicketDetailLoading(true);
    mockApi.getOpsTicketDetail(activeTicket.id).then((detail) => {
      setActiveTicketDetail(detail);
      setActiveTicketDetailLoading(false);
    });
  }, [activeTicket]);

  const handleSubmit = async () => {
    const values = await form.validate();
    if (values.type === 'business_consult' ? hasOpenDuplicateBusinessConsult(values) : hasOpenDuplicateSupportTicket(values)) {
      Message.warning('已有同标题的未完结记录，请在原工单/咨询中跟进，避免重复提交。');
      return;
    }
    const dailySubmissionCount = values.type === 'business_consult'
      ? getDailyBusinessConsultSubmissionCount()
      : getDailySupportSubmissionCount(values);
    if (dailySubmissionCount >= DAILY_TYPE_SUBMISSION_LIMIT) {
      Message.warning(`同类${values.type === 'business_consult' ? '咨询' : '工单'}每日最多提交 ${DAILY_TYPE_SUBMISSION_LIMIT} 次，请明天再提交或联系当前处理人。`);
      return;
    }

    setLoading(true);
    try {
      if (values.type === 'business_consult') {
        await mockApi.submitCustomerBusinessConsultOpportunity(values);
        Message.success('商务咨询已提交，归属代理将跟进处理');
        form.resetFields();
        setSelectedType('tech_support');
        setAttachments([]);
        await loadBusinessConsults();
        return;
      }

      await mockApi.submitTenantSupportRequest({ ...values, attachments });
      Message.success('支持工单已提交，交付运维将跟进处理');
      form.resetFields();
      setAttachments([]);
      await loadTickets();
    } catch (error) {
      Message.warning(error instanceof Error ? error.message : '提交失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setAttachments((current) => {
      const existing = new Set(current.map((item) => `${item.filename}-${item.size}`));
      const next = [...current];
      files.forEach((file) => {
        const normalized = { filename: file.name, size: formatFileSize(file.size) };
        const key = `${normalized.filename}-${normalized.size}`;
        if (!existing.has(key)) {
          existing.add(key);
          next.push(normalized);
        }
      });
      return next.slice(0, 5);
    });

    Message.success(`已选择 ${files.length} 个附件`);
    event.target.value = '';
  };

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>工单与咨询</Title>
          <Text type="secondary">技术支持和开通配置进入交付运维队列；席位/套餐咨询进入销售咨询池，由客户归属代理跟进。</Text>
        </div>
      </div>
      <Card bordered>
        <Row gutter={24}>
          <Col span={15}>
            <Form
              form={form}
              layout="vertical"
              className="consult-form"
              initialValues={{ type: 'tech_support' }}
              onValuesChange={(_, values) => setSelectedType(values.type ?? 'tech_support')}
            >
              <Alert
                className="consult-submit-alert"
                type="info"
                content={`同一问题已有未完结工单或咨询时，请优先在原记录中跟进；相同类型每日最多提交 ${DAILY_TYPE_SUBMISSION_LIMIT} 次。`}
              />
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="问题类型" field="type" rules={[{ required: true, message: '请选择问题类型' }]}>
                    <Select placeholder="请选择问题类型">
                      {Object.entries(supportTypeMeta).map(([value, item]) => (
                        <Select.Option key={value} value={value}>
                          {item.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="问题标题" field="title" rules={[{ required: true, message: '请输入问题标题' }]}>
                    <Input placeholder="请简要概括问题，例如：企微登录失败需要协助排查" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="问题描述" field="description" rules={[{ required: true, message: '请输入问题描述' }]}>
                    <Input.TextArea rows={6} placeholder="请补充问题现象、报错信息、影响范围、涉及页面，以及希望协助处理的事项。" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="附件（可选）">
                    <Space direction="vertical" size={10} className="full-width">
                      <input
                        id="tenant-support-attachments"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                        style={{ display: 'none' }}
                        onChange={handleSelectAttachment}
                      />
                      <Button icon={<IconUpload />} onClick={() => document.getElementById('tenant-support-attachments')?.click()}>
                        上传附件
                      </Button>
                      <Text type="secondary">可上传报错截图、问题录屏、导出文件或说明文档，最多 5 个。</Text>
                      {attachments.length ? (
                        <div className="ops-list-stack">
                          {attachments.map((item) => (
                            <div className="ops-list-row" key={`${item.filename}-${item.size}`}>
                              <div>
                                <strong>{item.filename}</strong>
                                <Text type="secondary">{item.size}</Text>
                              </div>
                              <Button
                                type="text"
                                size="mini"
                                icon={<IconDelete />}
                                onClick={() => setAttachments((current) => current.filter((entry) => entry !== item))}
                              >
                                移除
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" icon={<IconSend />} loading={loading} onClick={handleSubmit}>
                {selectedType === 'business_consult' ? '提交商务咨询' : '提交工单'}
              </Button>
            </Form>
          </Col>
          <Col span={9}>
            <div className="consult-aside">
              <Title heading={5}>提交前请确认</Title>
              <Text>请按实际诉求选择类型。技术/配置问题会进入交付运维队列，席位/套餐咨询会转给归属代理；同类问题当天最多提交 3 次，未完结问题请在原记录中跟进。</Text>
              <div className="consult-aside__list">
                <div>
                  <strong><IconLink /> 附件支持</strong>
                  <span>建议上传报错截图、录屏、配置页面或说明文档，方便处理人快速定位问题。</span>
                </div>
                {Object.values(supportTypeMeta).map((item) => (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      <Card
        title="我的支持工单"
        extra={(
          <Button size="small" onClick={() => { void loadTickets(); }}>
            刷新
          </Button>
        )}
        bordered
      >
        <Table
          rowKey="id"
          loading={ticketsLoading}
          data={tickets}
          pagination={false}
          scroll={{ x: 1180 }}
          columns={[
            { title: '工单号', dataIndex: 'id', width: 190, render: (value: string) => <NoWrapText>{value}</NoWrapText> },
            { title: '类型', dataIndex: 'type', width: 160, render: (value: OpsTicketTypeCode) => <NoWrapText>{ticketTypeLabel[value]}</NoWrapText> },
            { title: '标题', dataIndex: 'title', width: 360, render: (value: string) => <EllipsisText>{value}</EllipsisText> },
            {
              title: '状态',
              dataIndex: 'status',
              width: 130,
              render: (value: OpsTicketStatusCode) => <Tag color={ticketStatusMeta[value].color}>{ticketStatusMeta[value].text}</Tag>,
            },
            { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (value: string) => <NoWrapText>{value}</NoWrapText> },
            { title: '最新进展', width: 260, render: (_: unknown, row: OpsTicketListItem) => <EllipsisText>{`${row.updatedAt} · ${row.assignee}`}</EllipsisText> },
            {
              title: '操作',
              width: 90,
              render: (_: unknown, row: OpsTicketListItem) => (
                <Button type="text" size="mini" onClick={() => setActiveTicket(row)}>详情</Button>
              ),
            },
          ]}
        />
      </Card>
      <Card
        title="我的咨询"
        extra={(
          <Button size="small" onClick={() => { void loadBusinessConsults(); }}>
            刷新
          </Button>
        )}
        bordered
      >
        <Table
          rowKey="id"
          loading={businessConsultsLoading}
          data={businessConsults}
          pagination={false}
          scroll={{ x: 1180 }}
          columns={[
            { title: '咨询号', dataIndex: 'id', width: 190, render: (value: string) => <NoWrapText>{value}</NoWrapText> },
            { title: '归属代理', dataIndex: 'assignedSalesName', width: 160, render: (value: string) => <NoWrapText>{value}</NoWrapText> },
            { title: '标题', dataIndex: 'title', width: 360, render: (value: string) => <EllipsisText>{value}</EllipsisText> },
            {
              title: '状态',
              dataIndex: 'status',
              width: 130,
              render: (value: TenantBusinessConsultRecord['status']) => <Tag color={businessConsultStatusMeta[value].color}>{businessConsultStatusMeta[value].text}</Tag>,
            },
            { title: '提交时间', dataIndex: 'createdAt', width: 180, render: (value: string) => <NoWrapText>{value}</NoWrapText> },
            { title: '最新进展', width: 260, render: (_: unknown, row: TenantBusinessConsultRecord) => <EllipsisText>{row.status === 'completed' ? `${row.completedAt} · 咨询已完结` : row.latestReply ? `${row.latestReplyAt} · ${row.latestReply}` : '代理暂未回复'}</EllipsisText> },
            {
              title: '操作',
              width: 90,
              render: (_: unknown, row: TenantBusinessConsultRecord) => (
                <Button type="text" size="mini" onClick={() => setActiveBusinessConsult(row)}>详情</Button>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        width={620}
        title={activeTicket ? `${activeTicket.title} · 支持工单详情` : '支持工单详情'}
        visible={Boolean(activeTicket)}
        footer={null}
        onCancel={() => setActiveTicket(null)}
      >
        {activeTicket ? (
          <Space direction="vertical" size={18} className="full-width">
            <div className="sales-info-grid sales-info-grid--two">
              <div><span>工单号</span><strong>{activeTicket.id}</strong></div>
              <div><span>类型</span><strong>{ticketTypeLabel[activeTicket.type]}</strong></div>
              <div><span>状态</span><strong>{ticketStatusMeta[activeTicket.status].text}</strong></div>
              <div><span>处理人</span><strong>{activeTicket.assignee}</strong></div>
              <div><span>SLA</span><strong>{activeTicket.slaRemaining}</strong></div>
              <div><span>最后更新</span><strong>{activeTicket.updatedAt}</strong></div>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">工单标题</div>
              <Text>{activeTicket.title}</Text>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">处理说明</div>
              <Text type="secondary">交付运维会在支持工单队列中持续更新处理进展；如需补充材料，请优先联系当前处理人，避免重复开单影响排队效率。</Text>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">附件</div>
              {activeTicketDetailLoading ? (
                <Text type="secondary">加载附件中...</Text>
              ) : (
                <AttachmentViewer attachments={activeTicketDetail?.attachments ?? []} />
              )}
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">处理记录</div>
              {activeTicketDetailLoading ? (
                <Text type="secondary">加载记录中...</Text>
              ) : (activeTicketDetail?.events ?? []).filter((item) => !item.isInternal).length ? (
                <Timeline className="sales-timeline">
                  {(activeTicketDetail?.events ?? [])
                    .filter((item) => !item.isInternal)
                    .map((item) => (
                      <Timeline.Item key={item.id} label={item.createdAt}>
                        <Space direction="vertical" size={4} className="full-width">
                          <Text type="secondary">{item.actor}</Text>
                          <Text>{item.content}</Text>
                        </Space>
                      </Timeline.Item>
                    ))}
                </Timeline>
              ) : (
                <Text type="secondary">暂无客户可见的处理记录。</Text>
              )}
            </div>
          </Space>
        ) : null}
      </Drawer>
      <Drawer
        width={620}
        title={activeBusinessConsult ? `${activeBusinessConsult.title} · 咨询详情` : '咨询详情'}
        visible={Boolean(activeBusinessConsult)}
        footer={null}
        onCancel={() => setActiveBusinessConsult(null)}
      >
        {activeBusinessConsult ? (
          <Space direction="vertical" size={18} className="full-width">
            <div className="sales-info-grid sales-info-grid--two">
              <div><span>咨询号</span><strong>{activeBusinessConsult.id}</strong></div>
              <div><span>状态</span><strong>{businessConsultStatusMeta[activeBusinessConsult.status].text}</strong></div>
              <div><span>归属代理</span><strong>{activeBusinessConsult.assignedSalesName}</strong></div>
              <div><span>提交时间</span><strong>{activeBusinessConsult.createdAt}</strong></div>
              <div><span>完结时间</span><strong>{activeBusinessConsult.completedAt || '-'}</strong></div>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">咨询内容</div>
              <Text>{activeBusinessConsult.description}</Text>
            </div>
            <div className="sales-info-card">
              <div className="sales-detail-section__title">代理回复</div>
              {activeBusinessConsult.latestReply ? (
                <Space direction="vertical" size={8} className="full-width">
                  <Text type="secondary">{activeBusinessConsult.latestReplyAt}</Text>
                  <Text>{activeBusinessConsult.latestReply}</Text>
                </Space>
              ) : (
                <Text type="secondary">代理暂未回复，请稍后刷新查看。</Text>
              )}
            </div>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
