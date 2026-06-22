import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Grid,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MetricCard from '../../components/MetricCard';
import { mockApi } from '../../services/mockApi';
import type { SalesCustomer, SalesDashboard } from '../../types/domain';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

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

export default function SalesDashboardPage() {
  const [data, setData] = useState<SalesDashboard>();

  useEffect(() => {
    mockApi.getSalesDashboard().then(setData);
  }, []);

  if (!data) return null;

  const columns = [
    { title: '客户名', dataIndex: 'name' },
    { title: '统一社会信用代码', dataIndex: 'code' },
    { title: '联系人', dataIndex: 'contact' },
    { title: '行业', dataIndex: 'industry' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: SalesCustomer['status']) => {
        const color = value === '已成交' ? 'green' : value === '待跟进' ? 'orange' : value === '跟进中' ? 'arcoblue' : 'gray';
        return <Tag color={color}>{value}</Tag>;
      },
    },
    { title: '预估佣金', dataIndex: 'commission', render: (value: number) => `¥${value.toLocaleString()}` },
    { title: '操作', render: () => <Button type="text" size="mini">跟进</Button> },
  ];

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>销售工作台</Title>
          <Text type="secondary">客户池、分享链接与佣金预估</Text>
        </div>
        <Button icon={<IconRefresh />}>刷新</Button>
      </div>

      <Row gutter={16}>
        {data.metrics.map((metric) => (
          <Col span={6} key={metric.label}>
            <MetricCard metric={metric} />
          </Col>
        ))}
      </Row>

      <Row gutter={18}>
        <Col span={15}>
          <SalesPanel title="近 30 天回款趋势">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.trend}>
                  <defs>
                    <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#165DFF" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="gmv" stroke="#165DFF" fill="url(#gmvFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SalesPanel>
        </Col>
        <Col span={9}>
          <SalesPanel title="分享链接">
            <Space direction="vertical" size={14} className="full-width">
              <div className="invite-code">
                <Text type="secondary">注册链接</Text>
                <Title heading={5}>{data.inviteUrl}</Title>
              </div>
              <Text type="secondary">客户注册后自动建立销售归属。</Text>
            </Space>
          </SalesPanel>
        </Col>
      </Row>

      <SalesPanel title="我的客户池">
        <div className="table-toolbar">
          <Input.Search placeholder="搜索客户名、信用代码、联系人" className="table-search" />
          <Button type="primary">新增客户</Button>
        </div>
        <Table rowKey="id" columns={columns} data={data.customers} pagination={{ pageSize: 10, showTotal: true }} />
      </SalesPanel>
    </Space>
  );
}
