import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCode,
  IconCopy,
  IconDelete,
  IconEdit,
  IconPlus,
  IconRefresh,
} from '@arco-design/web-react/icon';

const { Title, Text } = Typography;

type ApiKeyStatus = 'active' | 'disabled';

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPreview: string;
  group: string;
  serviceScope: string;
  todayCost: number;
  monthCost: number;
  rateLimit: string;
  quotaLimit: string;
  expiresAt: string;
  status: ApiKeyStatus;
  createdAt: string;
}

interface ApiKeyFormValues {
  name: string;
  group?: string;
  quotaMode?: 'unlimited' | 'limited';
  quotaLimit?: number;
  requestsPerMinute?: number;
  expiresAt?: string;
}

const initialRows: ApiKeyRecord[] = [
  {
    id: 'key-001',
    name: '招聘外呼自动化',
    keyPreview: 'sk-6ee...5959',
    group: '招聘项目组',
    serviceScope: '智能外呼',
    todayCost: 18.5,
    monthCost: 952.9,
    rateLimit: '60 req/min',
    quotaLimit: '¥2,000/月',
    expiresAt: '2026-12-31',
    status: 'active',
    createdAt: '2026-05-21 14:28',
  },
];

const groupOptions = ['默认分组', '招聘项目组', '运营自动化', '财务测试'];

const statusMeta: Record<ApiKeyStatus, readonly [string, string]> = {
  active: ['green', '启用'],
  disabled: ['gray', '禁用'],
};

const money = (value: number) => `¥${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const buildKeyPreview = (plainKey: string) => {
  const head = plainKey.slice(0, 6);
  const tail = plainKey.slice(-4);
  return `${head}...${tail}`;
};

const generateApiKey = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const chunks = Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `sk-${chunks.slice(0, 8)}-${chunks.slice(8, 20)}-${chunks.slice(20)}`;
};

export default function ApiKeyManagementPage() {
  const [form] = Form.useForm<ApiKeyFormValues>();
  const [rows, setRows] = useState<ApiKeyRecord[]>(initialRows);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState<ApiKeyStatus | 'all'>('all');
  const [createVisible, setCreateVisible] = useState(false);
  const [createdPlainKey, setCreatedPlainKey] = useState('');
  const [createdKeyName, setCreatedKeyName] = useState('');

  const activeRows = rows.filter((item) => item.status === 'active');
  const todayCost = rows.reduce((sum, item) => sum + item.todayCost, 0);
  const monthCost = rows.reduce((sum, item) => sum + item.monthCost, 0);
  const balance = 7412.32;

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.name, item.keyPreview, item.group, item.serviceScope]
          .some((value) => value.toLowerCase().includes(keyword));
      const matchesGroup = group === 'all' || item.group === group;
      const matchesStatus = status === 'all' || item.status === status;
      return matchesKeyword && matchesGroup && matchesStatus;
    });
  }, [group, query, rows, status]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      group: '默认分组',
      quotaMode: 'unlimited',
      quotaLimit: undefined,
      requestsPerMinute: 60,
    });
    setCreatedPlainKey('');
    setCreatedKeyName('');
    setCreateVisible(true);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Message.success(`${label}已复制`);
    } catch {
      Message.warning('复制失败，请手动选择文本复制');
    }
  };

  const handleCreate = async () => {
    const values = await form.validate();
    const plainKey = generateApiKey();
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextRow: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name: values.name.trim(),
      keyPreview: buildKeyPreview(plainKey),
      group: values.group ?? '默认分组',
      serviceScope: '智能外呼',
      todayCost: 0,
      monthCost: 0,
      rateLimit: `${values.requestsPerMinute} req/min`,
      quotaLimit: values.quotaMode === 'limited' && values.quotaLimit ? `¥${values.quotaLimit.toLocaleString()}/月` : '无限制',
      expiresAt: values.expiresAt ?? '-',
      status: 'active',
      createdAt,
    };

    setRows((current) => [nextRow, ...current]);
    setCreatedPlainKey(plainKey);
    setCreatedKeyName(nextRow.name);
    Message.success('API 密钥已创建');
  };

  const handleCloseCreateModal = () => {
    setCreateVisible(false);
    setCreatedPlainKey('');
    setCreatedKeyName('');
  };

  const toggleStatus = (id: string) => {
    setRows((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'disabled' : 'active' }
          : item,
      ),
    );
  };

  const deleteRow = (id: string) => {
    setRows((current) => current.filter((item) => item.id !== id));
    Message.success('密钥已删除');
  };

  return (
    <Space direction="vertical" size={18} className="full-width api-key-page">
      <div className="page-title-row">
        <div>
          <Title heading={3}>API 密钥</Title>
          <Text type="secondary">为企业自动化任务创建访问密钥，并按 Key 查看外呼接口消耗。</Text>
        </div>
        <Space>
          <Button icon={<IconRefresh />} onClick={() => Message.success('已刷新 mock 数据')} title="刷新" aria-label="刷新" />
          <Button type="primary" icon={<IconPlus />} onClick={openCreateModal}>创建密钥</Button>
        </Space>
      </div>

      <div className="api-key-metrics">
        <Card bordered className="api-key-metric-card">
          <span>API 可用余额</span>
          <strong>{money(balance)}</strong>
          <small>共用企业账单余额</small>
        </Card>
        <Card bordered className="api-key-metric-card">
          <span>启用密钥</span>
          <strong>{activeRows.length}</strong>
          <small>当前可用于接口调用</small>
        </Card>
        <Card bordered className="api-key-metric-card">
          <span>今日费用</span>
          <strong>{money(todayCost)}</strong>
          <small>智能外呼按次扣费</small>
        </Card>
        <Card bordered className="api-key-metric-card">
          <span>近 30 天费用</span>
          <strong>{money(monthCost)}</strong>
          <small>按 Key 聚合展示</small>
        </Card>
      </div>

      <div className="tenant-data-panel">
        <div className="tenant-data-panel__toolbar">
          <div className="sales-filter-bar api-key-toolbar">
            <Input.Search
              value={query}
              onChange={setQuery}
              className="api-key-search"
              allowClear
              placeholder="搜索名称、Key、分组"
            />
            <Select value={group} onChange={setGroup} className="api-key-select" triggerProps={{ autoAlignPopupWidth: false }}>
              <Select.Option value="all">全部分组</Select.Option>
              {groupOptions.map((item) => (
                <Select.Option key={item} value={item}>{item}</Select.Option>
              ))}
            </Select>
            <Select value={status} onChange={setStatus} className="api-key-select" triggerProps={{ autoAlignPopupWidth: false }}>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="disabled">禁用</Select.Option>
            </Select>
            <div className="api-endpoint-pill">
              <span>API Endpoint</span>
              <code>https://api.arkclaw.cn</code>
              <Button
                type="text"
                size="mini"
                icon={<IconCopy />}
                onClick={() => copyText('https://api.arkclaw.cn', 'API Endpoint')}
                title="复制 API Endpoint"
                aria-label="复制 API Endpoint"
              />
            </div>
          </div>
        </div>

        <Table
          rowKey="id"
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              width: 180,
              render: (value: string, row: ApiKeyRecord) => (
                <Space direction="vertical" size={2}>
                  <strong>{value}</strong>
                  <Text type="secondary">{row.createdAt}</Text>
                </Space>
              ),
            },
            {
              title: 'API 密钥',
              dataIndex: 'keyPreview',
              width: 170,
              render: (value: string) => (
                <Space size={6}>
                  <Tag color="arcoblue" className="api-key-preview">{value}</Tag>
                  <Tooltip content="创建后仅展示一次明文">
                    <IconCode className="api-key-muted-icon" />
                  </Tooltip>
                </Space>
              ),
            },
            { title: '分组', dataIndex: 'group', width: 140 },
            { title: '服务权限', dataIndex: 'serviceScope', width: 130 },
            {
              title: '用量',
              width: 170,
              render: (_: unknown, row: ApiKeyRecord) => (
                <Space direction="vertical" size={2}>
                  <span>今日：{money(row.todayCost)}</span>
                  <Text type="secondary">近30天：{money(row.monthCost)}</Text>
                </Space>
              ),
            },
            { title: '速率限制', dataIndex: 'rateLimit', width: 120 },
            { title: '额度限制', dataIndex: 'quotaLimit', width: 130 },
            { title: '过期时间', dataIndex: 'expiresAt', width: 130 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value: ApiKeyStatus) => <Tag color={statusMeta[value][0]}>{statusMeta[value][1]}</Tag>,
            },
            {
              title: '操作',
              width: 220,
              fixed: 'right' as const,
              render: (_: unknown, row: ApiKeyRecord) => (
                <Space size={4}>
                  <Button type="text" size="mini" icon={<IconEdit />} onClick={() => Message.info('编辑能力为 mock 占位')}>编辑</Button>
                  <Button type="text" size="mini" onClick={() => toggleStatus(row.id)}>
                    {row.status === 'active' ? '禁用' : '启用'}
                  </Button>
                  <Button
                    type="text"
                    status="danger"
                    size="mini"
                    icon={<IconDelete />}
                    onClick={() => deleteRow(row.id)}
                  >
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={createdPlainKey ? '密钥已创建' : '创建密钥'}
        visible={createVisible}
        onCancel={handleCloseCreateModal}
        footer={createdPlainKey ? (
          <Space>
            <Button onClick={handleCloseCreateModal}>关闭</Button>
            <Button type="primary" icon={<IconCopy />} onClick={() => copyText(createdPlainKey, 'API Key')}>复制密钥</Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={handleCloseCreateModal}>取消</Button>
            <Button type="primary" onClick={handleCreate}>创建</Button>
          </Space>
        )}
        className="api-key-create-modal"
      >
        {createdPlainKey ? (
          <Space direction="vertical" size={16} className="full-width">
            <div className="api-key-created-box">
              <Text type="secondary">{createdKeyName}</Text>
              <div className="api-key-created-secret">{createdPlainKey}</div>
              <Text type="secondary">关闭后将无法再次查看明文，请立即复制并保存。</Text>
            </div>
          </Space>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              group: '默认分组',
              quotaMode: 'unlimited',
              quotaLimit: undefined,
              requestsPerMinute: 60,
            }}
          >
            <Form.Item label="名称" field="name" rules={[{ required: true, message: '请输入密钥名称' }]}>
              <Input placeholder="例如：招聘外呼自动化" />
            </Form.Item>
            <Form.Item label="分组" field="group">
              <Select placeholder="选择分组">
                {groupOptions.map((item) => (
                  <Select.Option key={item} value={item}>{item}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="速率限制" field="requestsPerMinute" rules={[{ required: true, message: '请配置每分钟请求数' }]}>
              <InputNumber min={1} precision={0} className="full-width" suffix="req/min" placeholder="请输入每分钟请求数" />
            </Form.Item>

            <Form.Item label="密钥有效期" field="expiresAt" rules={[{ required: true, message: '请选择密钥有效期' }]}>
              <DatePicker className="full-width" />
            </Form.Item>

            <Form.Item label="额度限制" field="quotaMode" rules={[{ required: true, message: '请选择额度限制' }]}>
              <Select placeholder="请选择额度限制">
                <Select.Option value="unlimited">无限制</Select.Option>
                <Select.Option value="limited">有上限</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {(values: ApiKeyFormValues) => (
                values.quotaMode === 'limited' ? (
                  <Form.Item
                    label="月额度上限"
                    field="quotaLimit"
                    rules={[{ required: true, message: '请输入月额度上限' }]}
                  >
                    <InputNumber min={1} precision={0} prefix="¥" className="full-width" placeholder="请输入每月额度上限" />
                  </Form.Item>
                ) : null
              )}
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Space>
  );
}
