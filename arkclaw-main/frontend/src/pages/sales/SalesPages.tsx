import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Card, Grid, Input, Space, Table, Tag, Typography } from '@arco-design/web-react';
import { IconDownload, IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { CommissionRecord, SalesCustomer } from '../../types/domain';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

const money = (value: number) => `¥${value.toLocaleString()}`;

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>
        <Button icon={<IconRefresh />}>刷新</Button>
      </div>
      {children}
    </Space>
  );
}

export function SalesCustomersPage() {
  const [rows, setRows] = useState<SalesCustomer[]>([]);

  useEffect(() => {
    mockApi.getSalesDashboard().then((data) => setRows(data.customers));
  }, []);

  return (
    <PageShell title="我的客户池" description="客户去重、跟进记录、订单历史与佣金关联入口">
      <Card bordered>
        <div className="table-toolbar">
          <Input.Search placeholder="搜索客户名、信用代码、联系人" className="table-search" />
          <Button type="primary" icon={<IconPlus />}>新增客户</Button>
        </div>
        <Table
          rowKey="id"
          columns={[
            { title: '客户名', dataIndex: 'name' },
            { title: '统一社会信用代码', dataIndex: 'code' },
            { title: '联系人', dataIndex: 'contact' },
            { title: '行业', dataIndex: 'industry' },
            { title: '状态', dataIndex: 'status', render: (value: SalesCustomer['status']) => <Tag color={value === '已成交' ? 'green' : value === '待跟进' ? 'orange' : value === '跟进中' ? 'arcoblue' : 'gray'}>{value}</Tag> },
            { title: '最近跟进', dataIndex: 'contactAt' },
            { title: '消费额', dataIndex: 'consumedAmount', render: money },
            { title: '客户运维', dataIndex: 'accountManager' },
            { title: '操作', render: () => <Button type="text" size="mini">跟进</Button> },
          ]}
          data={rows}
          pagination={{ pageSize: 8, showTotal: true }}
        />
      </Card>
    </PageShell>
  );
}

export function SalesInvitesPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    mockApi.getSalesShareLinks().then(setRows);
  }, []);

  const active = rows.find((item) => item.status === '启用') ?? rows[0];

  return (
    <PageShell title="分享链接" description="生成专属短链，客户注册后自动建立销售归属">
      <Row gutter={16}>
        <Col span={8}>
          <Card title="当前主分享链接" bordered>
            <Space direction="vertical" size={14} className="full-width">
              <div className="invite-code">
                <Text type="secondary">短链标识</Text>
                <Title heading={2}>{active?.shortCode ?? '-'}</Title>
              </div>
              <Input value={active?.shortUrl ?? ''} readOnly />
              <Text type="secondary">客户通过该链接注册后会自动建立销售归属。</Text>
            </Space>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="分享链接列表" bordered>
            <Table
              rowKey="id"
              pagination={false}
              columns={[
                { title: '名称', dataIndex: 'name' },
                { title: '短链', dataIndex: 'shortUrl' },
                { title: '已使用', dataIndex: 'usedCount' },
                { title: '使用限制', dataIndex: 'maxUses', render: (value: number | null) => value ?? '不限' },
                { title: '到期时间', dataIndex: 'expiresAt' },
                { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === 'active' ? 'green' : 'gray'}>{value === 'active' ? '有效' : '停用'}</Tag> },
                { title: '操作', render: () => <Button type="text" size="mini">复制链接</Button> },
              ]}
              data={rows}
            />
          </Card>
        </Col>
      </Row>
    </PageShell>
  );
}

export function SalesCommissionsPage() {
  const [rows, setRows] = useState<CommissionRecord[]>([]);

  useEffect(() => {
    mockApi.getMyCommissions().then(setRows);
  }, []);

  return (
    <PageShell title="佣金明细" description="订单号、客户、佣金金额、计算依据与发放状态">
      <Card bordered>
        <div className="table-toolbar">
          <Input.Search placeholder="搜索订单号、客户" className="table-search" />
          <Button icon={<IconDownload />}>导出表格</Button>
        </div>
        <Table
          rowKey="id"
          columns={[
            { title: '订单号', dataIndex: 'orderId' },
            { title: '客户', dataIndex: 'tenant' },
            { title: '订单金额', dataIndex: 'amount', render: money },
            { title: '佣金金额', dataIndex: 'commission', render: money },
            { title: '计算依据', dataIndex: 'basis' },
            { title: '发放状态', dataIndex: 'status', render: (value: CommissionRecord['status']) => <Tag color={value === '已发放' ? 'green' : value === '未发放' ? 'orange' : 'gray'}>{value}</Tag> },
            { title: '时间', dataIndex: 'createdAt' },
          ]}
          data={rows}
          pagination={false}
        />
      </Card>
    </PageShell>
  );
}
