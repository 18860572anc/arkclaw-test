import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Message,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconDownload, IconFilePdf, IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { BillingContractRecord, BillingContractStatus, BillingContractType } from '../../types/domain';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const RangePicker = DatePicker.RangePicker;

const contractTypeMap: Record<BillingContractType, string> = {
  quote: '产品报价合同',
  order: '订单合同',
};

const contractStatusMap: Record<BillingContractStatus, readonly [string, string]> = {
  pending: ['orange', '待生效'],
  active: ['green', '已生效'],
  expired: ['gray', '已过期'],
  voided: ['red', '已作废'],
};

type ContractTabKey = 'all' | BillingContractType;

export default function ContractPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BillingContractRecord[]>([]);
  const [activeTab, setActiveTab] = useState<ContractTabKey>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BillingContractStatus | 'all'>('all');
  const [range, setRange] = useState<string[]>([]);
  const [activeContract, setActiveContract] = useState<BillingContractRecord>();

  const loadContracts = async () => {
    setLoading(true);
    const data = await mockApi.getTenantBillingContracts();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const [start, end] = range;
    return rows.filter((item) => {
      const matchTab = activeTab === 'all' || item.type === activeTab;
      const matchStatus = status === 'all' || item.status === status;
      const matchKeyword = !keyword || [item.contractNo, item.name, item.remark].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
      const matchRange = !start || !end || (item.validFrom.slice(0, 10) <= end && item.validTo.slice(0, 10) >= start);
      return matchTab && matchStatus && matchKeyword && matchRange;
    });
  }, [activeTab, query, range, rows, status]);

  const activeCount = rows.filter((item) => item.status === 'active').length;
  const pendingCount = rows.filter((item) => item.status === 'pending').length;

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-title-row">
        <div>
          <Title heading={3}>合同管理</Title>
          <Text type="secondary">查看企业已生效和历史归档合同，支持按合同编号、有效期和状态筛选。</Text>
        </div>
        <Button icon={<IconRefresh />} onClick={loadContracts} title="刷新" aria-label="刷新" />
      </div>

      <div className="contract-stat-grid">
        <Card bordered>
          <Text type="secondary">合同总数</Text>
          <strong>{rows.length}</strong>
        </Card>
        <Card bordered>
          <Text type="secondary">已生效</Text>
          <strong>{activeCount}</strong>
        </Card>
        <Card bordered>
          <Text type="secondary">待生效</Text>
          <strong>{pendingCount}</strong>
        </Card>
      </div>

      <div className="tenant-data-panel">
        <div className="tenant-data-panel__tabs">
          <Tabs activeTab={activeTab} onChange={(key) => setActiveTab(key as ContractTabKey)}>
            <TabPane key="all" title="全部" />
            <TabPane key="quote" title="产品报价合同" />
            <TabPane key="order" title="订单合同" />
          </Tabs>
        </div>
        <div className="tenant-data-panel__notice">
          <IconFilePdf />
          <span>合同文件由平台财务或官方管理员上传。若合同内容有误，请通过工单与咨询联系服务人员处理。</span>
        </div>
        <div className="tenant-data-panel__toolbar">
          <div className="sales-filter-bar">
            <Input.Search value={query} onChange={setQuery} className="table-search table-search--wide" placeholder="请输入合同编号、合同名称或备注" />
            <Select value={status} onChange={(value) => setStatus(value)} className="contract-status-select" triggerProps={{ autoAlignPopupWidth: false }}>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="pending">待生效</Select.Option>
              <Select.Option value="active">已生效</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
              <Select.Option value="voided">已作废</Select.Option>
            </Select>
            <RangePicker value={range} onChange={(value) => setRange(value || [])} className="contract-range-picker" placeholder={['有效期开始', '有效期结束']} />
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          data={filteredRows}
          pagination={{ pageSize: 8, showTotal: true }}
          columns={[
            { title: '合同编号', dataIndex: 'contractNo' },
            { title: '合同类型', dataIndex: 'type', render: (value: BillingContractType) => contractTypeMap[value] },
            { title: '价格有效期', render: (_: unknown, row: BillingContractRecord) => `${row.validFrom} ~ ${row.validTo}` },
            { title: '创建时间', dataIndex: 'createdAt' },
            { title: '完成时间', dataIndex: 'completedAt', render: (value?: string) => value || '-' },
            { title: '状态', dataIndex: 'status', render: (value: BillingContractStatus) => <Tag color={contractStatusMap[value][0]}>{contractStatusMap[value][1]}</Tag> },
            { title: '备注', dataIndex: 'remark', render: (value?: string) => value || '-' },
            {
              title: '操作',
              render: (_: unknown, row: BillingContractRecord) => (
                <Space size={8}>
                  <Button type="text" size="mini" onClick={() => setActiveContract(row)}>查看</Button>
                  <Button type="text" size="mini" icon={<IconDownload />} onClick={() => Message.info(`模拟下载 ${row.fileName}`)}>下载</Button>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title={activeContract ? `合同详情 ${activeContract.contractNo}` : '合同详情'}
        visible={Boolean(activeContract)}
        width={560}
        footer={null}
        onCancel={() => setActiveContract(undefined)}
      >
        {activeContract ? (
          <Space direction="vertical" size={16} className="full-width">
            <Descriptions
              column={1}
              data={[
                { label: '合同编号', value: activeContract.contractNo },
                { label: '合同名称', value: activeContract.name },
                { label: '合同类型', value: contractTypeMap[activeContract.type] },
                { label: '价格有效期', value: `${activeContract.validFrom} ~ ${activeContract.validTo}` },
                { label: '创建时间', value: activeContract.createdAt },
                { label: '完成时间', value: activeContract.completedAt || '-' },
                { label: '状态', value: <Tag color={contractStatusMap[activeContract.status][0]}>{contractStatusMap[activeContract.status][1]}</Tag> },
                { label: '备注', value: activeContract.remark || '-' },
                { label: '作废时间', value: activeContract.voidedAt || '-' },
                { label: '作废人', value: activeContract.voidedBy || '-' },
                { label: '作废原因', value: activeContract.voidReason || '-' },
                { label: '合同文件', value: activeContract.fileName },
              ]}
            />
            <Button type="primary" icon={<IconDownload />} onClick={() => Message.info(`模拟下载 ${activeContract.fileName}`)}>下载合同</Button>
          </Space>
        ) : (
          <Empty />
        )}
      </Drawer>
    </Space>
  );
}
