import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Grid,
  Input,
  InputNumber,
  Message,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconArrowLeft,
  IconPlus,
  IconRefresh,
} from '@arco-design/web-react/icon';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { mockApi } from '../../services/mockApi';
import type {
  BatchJobRecord,
  BatchJobTarget,
  BatchVersionRecord,
  ObservabilityAlertTemplate,
  ObservabilityEndpointRecord,
  ObservabilityLogRecord,
  ObservabilityLogStat,
  ObservabilityMetricCard,
  ObservabilityRankingItem,
  ObservabilityTraceRecord,
  ObservabilityUsageDetail,
  TenantAuditRecord,
  TenantObservabilityData,
} from '../../types/domain';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;
const metricPieColors = ['#165DFF', '#14C9C9', '#94B5FF'];

type BatchOpsTabKey = 'jobs' | 'versions';

export function TenantOpsRedirectPage() {
  return <Navigate replace to="/tenant/observability" />;
}

export function TenantBatchOpsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BatchOpsTabKey>('jobs');
  const [rows, setRows] = useState<BatchJobRecord[]>([]);
  const [versions, setVersions] = useState<BatchVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | BatchJobRecord['type']>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    Promise.all([mockApi.getTenantBatchJobs(), mockApi.getTenantBatchVersions()]).then(([jobRows, versionRows]) => {
      setRows(jobRows);
      setVersions(versionRows);
      setLoading(false);
    });
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const matchType = typeFilter === 'all' || item.type === typeFilter;
      const matchKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword.toLowerCase()) ||
        item.commandName.toLowerCase().includes(keyword.toLowerCase());
      return matchType && matchKeyword;
    });
  }, [keyword, rows, typeFilter]);

  return (
    <div className="tenant-ops-page tenant-ops-page--batch">
      <div className="tenant-ops-page__header">
        <Title heading={3}>批量运维</Title>
      </div>

      <Tabs activeTab={activeTab} className="tenant-ops-tabs" onChange={(value) => setActiveTab(value as BatchOpsTabKey)}>
        <TabPane key="jobs" title="作业列表" />
        <TabPane key="versions" title="版本管理" />
      </Tabs>

      {activeTab === 'jobs' ? (
        <>
          <div className="tenant-ops-toolbar">
            <Space size={8}>
              <Button type="primary" icon={<IconPlus />} onClick={() => navigate('/tenant/batch-ops/create')}>
                创建作业
              </Button>
              <Select
                value={typeFilter}
                className="compact-select"
                onChange={(value) => setTypeFilter(value as 'all' | BatchJobRecord['type'])}
              >
                <Select.Option value="all">作业名称</Select.Option>
                <Select.Option value="实例命令">实例命令</Select.Option>
                <Select.Option value="脚本执行">脚本执行</Select.Option>
                <Select.Option value="版本发布">版本发布</Select.Option>
              </Select>
              <Input.Search
                value={keyword}
                onChange={setKeyword}
                placeholder="搜索作业名称"
                className="table-search"
              />
            </Space>
            <Button icon={<IconRefresh />} />
          </div>

          <div className="tenant-ops-table-wrap">
            <Table
              rowKey="id"
              loading={loading}
              className="tenant-ops-table"
              borderCell={false}
              pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
              data={filteredRows}
              columns={[
                { title: '作业名称', dataIndex: 'name', width: 136, ellipsis: true },
                { title: '作业类型', dataIndex: 'type', width: 88, ellipsis: true },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 76,
                  render: (value: BatchJobRecord['status']) => (
                    <Tag color={value === '成功' ? 'green' : value === '失败' ? 'red' : value === '执行中' ? 'arcoblue' : 'gray'}>
                      {value}
                    </Tag>
                  ),
                },
                { title: '命令名称', dataIndex: 'commandName', width: 112, ellipsis: true },
                { title: '执行方式', dataIndex: 'executor', width: 96, ellipsis: true },
                { title: '执行结果', dataIndex: 'result', width: 92, ellipsis: true },
                { title: '描述', dataIndex: 'description', width: 196, ellipsis: true },
                { title: '开始时间', dataIndex: 'startedAt', width: 116, ellipsis: true },
                { title: '结束时间', dataIndex: 'endedAt', width: 116, ellipsis: true },
                {
                  title: '操作',
                  width: 60,
                  render: () => (
                    <Button type="text" size="mini">
                      查看
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </>
      ) : (
        <div className="tenant-ops-table-wrap">
          <Table
            rowKey="id"
            loading={loading}
            className="tenant-ops-table tenant-ops-table--versions"
            borderCell={false}
            pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
            data={versions}
            columns={[
              {
                title: '版本号/ID',
                dataIndex: 'version',
                width: 190,
                render: (_: unknown, record: BatchVersionRecord) => (
                  <div className="batch-version-cell">
                    <button
                      className="batch-version-cell__link"
                      type="button"
                      onClick={() => Message.info(`查看版本 ${record.version}`)}
                    >
                      {record.version}
                    </button>
                    <Text type="secondary">{record.versionId}</Text>
                  </div>
                ),
              },
              { title: '描述', dataIndex: 'description', width: 420, ellipsis: true },
              { title: '更新时间', dataIndex: 'updatedAt', width: 168, ellipsis: true },
              {
                title: '操作',
                width: 124,
                render: (_: unknown, record: BatchVersionRecord) => (
                  <div className="batch-version-actions">
                    <Button type="text" size="mini" onClick={() => Message.info(`${record.latestAction}：${record.version}`)}>
                      {record.latestAction}
                    </Button>
                    <Button
                      type="text"
                      size="mini"
                      className={record.secondaryAction === '历史版本' ? 'batch-version-actions__secondary' : undefined}
                      onClick={() => Message.info(`${record.secondaryAction}：${record.version}`)}
                    >
                      {record.secondaryAction}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export function TenantBatchOpsCreatePage() {
  const navigate = useNavigate();
  const [allTargets, setAllTargets] = useState<BatchJobTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<BatchJobTarget[]>([]);
  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');
  const [commandType, setCommandType] = useState('linux-shell');
  const [commandDetail, setCommandDetail] = useState(
    '#!/bin/bash\n# 批量运维下发命令示例\nexport HOME=/root\nexport XDG_RUNTIME_DIR=/run/user/$(id -u)\n',
  );
  const [hours, setHours] = useState<number | undefined>(2);
  const [minutes, setMinutes] = useState<number | undefined>(0);
  const [seconds, setSeconds] = useState<number | undefined>(0);
  const [targetKeyword, setTargetKeyword] = useState('');

  useEffect(() => {
    mockApi.getTenantBatchTargets().then(setAllTargets);
  }, []);

  const availableTargets = useMemo(() => {
    const selectedIds = new Set(selectedTargets.map((item) => item.id));
    return allTargets.filter((item) => !selectedIds.has(item.id));
  }, [allTargets, selectedTargets]);

  const filteredTargets = useMemo(() => {
    return selectedTargets.filter((item) => item.name.toLowerCase().includes(targetKeyword.toLowerCase()));
  }, [selectedTargets, targetKeyword]);

  const handleAddTarget = () => {
    const nextTarget = availableTargets[0];
    if (!nextTarget) {
      Message.info('没有更多可添加的执行对象');
      return;
    }
    setSelectedTargets((current) => [...current, nextTarget]);
  };

  const handleRemoveTarget = (targetId: string) => {
    setSelectedTargets((current) => current.filter((item) => item.id !== targetId));
  };

  const handleSubmit = () => {
    if (!jobName.trim()) {
      Message.error('请输入作业名称');
      return;
    }
    Message.success('批量作业已创建');
    navigate('/tenant/batch-ops');
  };

  return (
    <div className="batch-job-detail-page detail-control-shell">
      <button className="model-edit-title" type="button" onClick={() => navigate('/tenant/batch-ops')}>
        <IconArrowLeft />
        <span>创建作业</span>
      </button>

      <div className="batch-job-detail-page__content">
        <div className="batch-job-detail-page__main">
          <SectionTitle title="基本信息" />
          <div className="app-detail-form">
            <div className="batch-form-item">
              <label>作业名称</label>
              <Input
                value={jobName}
                maxLength={64}
                showWordLimit
                placeholder="请输入名称，长度 3-64 字符，首字符需为中文、字母、下划线。"
                onChange={setJobName}
              />
            </div>
            <div className="batch-form-item">
              <label>描述</label>
              <Input.TextArea
                value={description}
                maxLength={256}
                showWordLimit
                autoSize={{ minRows: 3, maxRows: 5 }}
                placeholder="请输入"
                onChange={setDescription}
              />
            </div>
          </div>

          <SectionTitle title="执行命令" />
          <div className="app-detail-form">
            <div className="batch-form-item">
              <label>命令类型</label>
              <Radio.Group type="button" value={commandType} onChange={setCommandType}>
                <Radio value="linux-shell">linux shell</Radio>
              </Radio.Group>
            </div>
            <div className="batch-form-item">
              <label>命令详情</label>
              <Input.TextArea
                value={commandDetail}
                autoSize={{ minRows: 10, maxRows: 16 }}
                placeholder="请输入命令"
                onChange={setCommandDetail}
              />
            </div>
            <div className="batch-form-item">
              <label>任务超时时间</label>
              <div className="batch-time-inputs">
                <InputNumber min={0} value={hours} onChange={(value) => setHours(Number(value ?? 0))} />
                <span>时</span>
                <InputNumber min={0} value={minutes} onChange={(value) => setMinutes(Number(value ?? 0))} />
                <span>分</span>
                <InputNumber min={0} value={seconds} onChange={(value) => setSeconds(Number(value ?? 0))} />
                <span>秒</span>
              </div>
              <Text type="secondary" className="batch-form-hint">
                默认执行命令的任务超时后，云助手将强制终止任务进程，取值范围为 30 秒 - 24 小时。
              </Text>
            </div>
          </div>
        </div>

        <div className="batch-job-detail-page__side">
          <SectionTitle title="执行对象" />
          <div className="batch-target-panel">
            <div className="batch-target-panel__toolbar">
              <Button icon={<IconPlus />} onClick={handleAddTarget}>
                添加
              </Button>
              <Select defaultValue="name" className="compact-select">
                <Select.Option value="name">名称</Select.Option>
              </Select>
              <Input.Search
                value={targetKeyword}
                onChange={setTargetKeyword}
                placeholder="搜索名称"
                className="table-search"
              />
              <Button disabled={selectedTargets.length === 0}>全部移除</Button>
            </div>

            <Table
              rowKey="id"
              className="tenant-ops-table"
              borderCell={false}
              pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
              data={filteredTargets}
              columns={[
                { title: '名称 ID', dataIndex: 'name', width: 160, render: (_: unknown, record: BatchJobTarget) => (
                  <div className="batch-target-name">
                    <strong>{record.name}</strong>
                    <Text type="secondary">{record.id}</Text>
                  </div>
                ) },
                { title: '标签', dataIndex: 'tag', width: 88 },
                { title: '归属用户', dataIndex: 'caller', width: 100 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 88,
                  render: (value: BatchJobTarget['status']) => (
                    <Tag color={value === '运行中' ? 'arcoblue' : value === '异常' ? 'red' : 'green'}>{value}</Tag>
                  ),
                },
                {
                  title: '操作',
                  width: 72,
                  render: (_: unknown, record: BatchJobTarget) => (
                    <Button type="text" size="mini" onClick={() => handleRemoveTarget(record.id)}>
                      移除
                    </Button>
                  ),
                },
              ]}
              scroll={{ x: 560 }}
            />
          </div>
        </div>
      </div>

      <div className="app-detail-footer">
        <Space size={10}>
          <Button onClick={() => navigate('/tenant/batch-ops')}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      </div>
    </div>
  );
}

export function TenantObservabilityPage() {
  const [data, setData] = useState<TenantObservabilityData>();

  useEffect(() => {
    mockApi.getTenantObservability().then(setData);
  }, []);

  if (!data) {
    return <Spin className="page-spin" tip="加载用量中心" />;
  }

  return (
    <div className="tenant-ops-page">
      <div className="tenant-ops-page__header">
        <Title heading={3}>用量中心</Title>
      </div>

      <UsageAnalysisTab data={data} />
    </div>
  );
}

export function TenantAuditLogPage() {
  const [rows, setRows] = useState<TenantAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getTenantAuditRecords().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="tenant-ops-page">
      <div className="tenant-ops-page__header">
        <Title heading={3}>审计日志</Title>
      </div>

      <div className="audit-log-toolbar audit-log-toolbar--top">
        <Space size={8}>
          <TimeShortcut label="1小时" active />
          <TimeShortcut label="3小时" />
          <TimeShortcut label="6小时" />
          <TimeShortcut label="12小时" />
          <TimeShortcut label="1天" />
          <TimeShortcut label="3天" />
          <TimeShortcut label="7天" />
        </Space>
        <Space size={8}>
          <DatePicker.RangePicker className="audit-log-range" />
          <Button icon={<IconRefresh />} />
        </Space>
      </div>

      <div className="audit-log-toolbar">
        <Space size={8}>
          <Select defaultValue="event" className="compact-select compact-select--wide">
            <Select.Option value="event">选择事件名称</Select.Option>
          </Select>
          <Input.Search placeholder="请输入资源 ID" className="table-search" />
        </Space>
      </div>

      <div className="tenant-ops-table-wrap">
        <Table
          rowKey="id"
          loading={loading}
          className="tenant-ops-table"
          borderCell={false}
          pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
          data={rows}
          columns={[
            { title: '事件名称', dataIndex: 'eventName', width: 180 },
            { title: '资源名称', dataIndex: 'resourceName', width: 220 },
            { title: '资源 ID', dataIndex: 'resourceId', width: 180 },
            {
              title: '结果',
              dataIndex: 'result',
              width: 88,
              render: (value: TenantAuditRecord['result']) => (
                <Tag color={value === '成功' ? 'green' : 'red'}>{value}</Tag>
              ),
            },
            { title: '操作者 ID', dataIndex: 'operatorId', width: 140 },
            { title: '操作者邮箱', dataIndex: 'operatorEmail', width: 220 },
            { title: '操作时间', dataIndex: 'operatedAt', width: 168 },
          ]}
          scroll={{ x: 1180 }}
        />
      </div>
    </div>
  );
}

function UsageAnalysisTab({ data }: { data: TenantObservabilityData }) {
  return (
    <div className="observability-panel">
      <div className="tenant-ops-toolbar tenant-ops-toolbar--wrapped">
        <Space size={8}>
          <Select defaultValue="userEmail" className="compact-select compact-select--wide">
            <Select.Option value="userEmail">用户邮箱</Select.Option>
          </Select>
          <Select defaultValue="allUsers" className="compact-select compact-select--wide">
            <Select.Option value="allUsers">全部用户</Select.Option>
          </Select>
          <Select defaultValue="userId" className="compact-select compact-select--wide">
            <Select.Option value="userId">用户 ID</Select.Option>
          </Select>
          <Select defaultValue="allIds" className="compact-select compact-select--wide">
            <Select.Option value="allIds">全部 ID</Select.Option>
          </Select>
        </Space>
        <Space size={8}>
          <Button>过去 3 天</Button>
          <Button>手动刷新</Button>
          <Button icon={<IconRefresh />} />
        </Space>
      </div>

      <div className="observability-metrics">
        {data.usageMetrics.map((item) => (
          <MetricTile key={item.label} item={item} />
        ))}
      </div>

      <div className="observability-grid">
        <RankingCard title="模型调用量前 50 用户" items={data.tokenTopUsers} />
        <RankingCard title="模型调用量前 50 ArkClaw" items={data.tokenTopClaws} />
        <RankingCard title="模型调用量后 50 用户" items={data.tokenBottomUsers} />
        <RankingCard title="模型调用量后 50 ArkClaw" items={data.tokenBottomClaws} />
      </div>

      <div className="observability-grid observability-grid--second">
        <RankingCard title="Skill 访问前 50" items={data.skillVisits} />
        <Card bordered={false} className="observability-card">
          <div className="observability-card__title">模型调用量分布</div>
          <div className="observability-pie">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.modelDistribution} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={2}>
                  {data.modelDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={metricPieColors[index % metricPieColors.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card bordered={false} className="observability-card observability-card--wide">
          <div className="observability-card__title">模型用量趋势图</div>
          <div className="observability-line-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.tokenTrend}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#86909c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#86909c' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inputTokens" stroke="#165DFF" dot={false} strokeWidth={2} name="输入用量" />
                <Line type="monotone" dataKey="outputTokens" stroke="#14C9C9" dot={false} strokeWidth={2} name="输出用量" />
                <Line type="monotone" dataKey="cacheHitTokens" stroke="#FF7D00" dot={false} strokeWidth={2} name="缓存命中用量" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="tenant-ops-table-wrap">
        <Table
          rowKey="id"
          className="tenant-ops-table"
          borderCell={false}
          pagination={false}
          data={data.usageDetails}
          columns={[
            { title: 'Claw 实例', dataIndex: 'instanceName' },
            { title: '输入用量', dataIndex: 'inputTokens' },
            { title: '输出用量', dataIndex: 'outputTokens' },
            { title: '总用量', dataIndex: 'totalTokens' },
          ]}
        />
      </div>
    </div>
  );
}

function PerformanceTab({ data }: { data: TenantObservabilityData }) {
  return (
    <div className="observability-panel">
      <div className="observability-metrics observability-metrics--compact">
        {data.performanceMetrics.map((item) => (
          <MetricTile key={item.label} item={item} />
        ))}
      </div>
      <Row gutter={16}>
        <Col span={14}>
          <Card bordered={false} className="observability-card observability-card--tall">
            <div className="observability-card__title">接口耗时趋势</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.performanceTrend}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#86909c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#86909c' }} />
                <Tooltip />
                <Line type="monotone" dataKey="latency" stroke="#165DFF" dot={false} strokeWidth={2} name="平均耗时(ms)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card bordered={false} className="observability-card observability-card--tall">
            <div className="observability-card__title">接口性能明细</div>
            <Table
              rowKey="id"
              borderCell={false}
              pagination={false}
              data={data.performanceEndpoints}
              columns={[
                { title: '接口', dataIndex: 'endpoint' },
                { title: '平均耗时', dataIndex: 'avgLatency' },
                { title: 'P95', dataIndex: 'p95Latency' },
                { title: '成功率', dataIndex: 'successRate' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function LogStatsTab({ data }: { data: TenantObservabilityData }) {
  const totalCount = data.logStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="observability-panel">
      <div className="observability-metrics observability-metrics--compact">
        {data.logStats.map((item) => (
          <div className="observability-metric-card observability-metric-card--log" key={item.level}>
            <div className="observability-metric-card__label">{item.level}</div>
            <div className="observability-metric-card__value">
              {item.count}
              <span>条</span>
            </div>
            <div className="observability-metric-card__trend">
              占比 {Math.round((item.count / totalCount) * 100)}%
            </div>
          </div>
        ))}
      </div>
      <div className="tenant-ops-table-wrap">
        <Table
          rowKey="id"
          className="tenant-ops-table"
          borderCell={false}
          pagination={false}
          data={data.logRecords}
          columns={[
            { title: '时间', dataIndex: 'timestamp', width: 168 },
            {
              title: '级别',
              dataIndex: 'level',
              width: 96,
              render: (value: ObservabilityLogRecord['level']) => (
                <Tag color={value === 'ERROR' ? 'red' : value === 'WARN' ? 'orange' : 'arcoblue'}>{value}</Tag>
              ),
            },
            { title: '来源', dataIndex: 'source', width: 160 },
            { title: '日志内容', dataIndex: 'message' },
          ]}
        />
      </div>
    </div>
  );
}

function SessionTab({ data }: { data: TenantObservabilityData }) {
  return (
    <div className="observability-panel">
      <div className="tenant-ops-toolbar tenant-ops-toolbar--wrapped">
        <Space size={8}>
          <Select defaultValue="recent" className="compact-select">
            <Select.Option value="recent">最近</Select.Option>
          </Select>
          <Select defaultValue="hour" className="compact-select">
            <Select.Option value="hour">1小时</Select.Option>
          </Select>
          <Button icon={<IconRefresh />} />
          <Checkbox>自动刷新</Checkbox>
        </Space>
        <Button>标签筛选</Button>
      </div>

      <div className="session-layout">
        <Card bordered={false} className="session-filter-card">
          <SessionFilterBlock title="ArkClaw 实例 ID" />
          <SessionFilterBlock title="会话 ID" />
          <SessionFilterBlock title="用户 ID" />
          <SessionRangeBlock title="耗时" />
          <SessionRangeBlock title="总用量" />
          <SessionRangeBlock title="输入用量" />
          <SessionRangeBlock title="输出用量" />
          <SessionRangeBlock title="调用链数" />
        </Card>
        <div className="tenant-ops-table-wrap tenant-ops-table-wrap--fill">
          <Table
            rowKey="id"
            className="tenant-ops-table"
            borderCell={false}
            pagination={false}
            data={data.sessionRecords}
            columns={[
              { title: '会话 ID', dataIndex: 'id', width: 156 },
              { title: '耗时', dataIndex: 'duration', width: 90 },
              { title: '总用量', dataIndex: 'totalTokens', width: 112 },
              { title: '输入用量', dataIndex: 'inputTokens', width: 112 },
              { title: '输出用量', dataIndex: 'outputTokens', width: 112 },
              { title: '调用链数', dataIndex: 'calls', width: 88 },
              { title: '用户 ID', dataIndex: 'userId', width: 140 },
              { title: '开始时间', dataIndex: 'startedAt', width: 168 },
              { title: '最近调用时间', dataIndex: 'lastCalledAt', width: 168 },
              {
                title: '操作',
                width: 72,
                render: () => (
                  <Button type="text" size="mini">
                    详情
                  </Button>
                ),
              },
            ]}
            scroll={{ x: 1220 }}
          />
        </div>
      </div>
    </div>
  );
}

function TraceTab({ data }: { data: TenantObservabilityData }) {
  return (
    <div className="observability-panel">
      <div className="tenant-ops-toolbar">
        <Space size={8}>
          <Input.Search placeholder="搜索 Trace ID 或 Span 名称" className="table-search" />
          <Select defaultValue="all" className="compact-select">
            <Select.Option value="all">全部状态</Select.Option>
          </Select>
        </Space>
      </div>
      <div className="tenant-ops-table-wrap">
        <Table
          rowKey="id"
          className="tenant-ops-table"
          borderCell={false}
          pagination={false}
          data={data.traceRecords}
          columns={[
            { title: 'Trace ID', dataIndex: 'traceId', width: 180 },
            { title: 'Span 名称', dataIndex: 'spanName', width: 180 },
            { title: '耗时', dataIndex: 'duration', width: 96 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 88,
              render: (value: ObservabilityTraceRecord['status']) => (
                <Tag color={value === '正常' ? 'green' : value === '告警' ? 'orange' : 'red'}>{value}</Tag>
              ),
            },
            { title: '服务', dataIndex: 'service', width: 160 },
            { title: '发生时间', dataIndex: 'occurredAt', width: 168 },
          ]}
        />
      </div>
    </div>
  );
}

function LogAnalysisTab({ data }: { data: TenantObservabilityData }) {
  return (
    <div className="observability-panel">
      <div className="tenant-ops-toolbar">
        <Space size={8}>
          <Select defaultValue="warn+" className="compact-select">
            <Select.Option value="warn+">WARN 及以上</Select.Option>
          </Select>
          <Input.Search placeholder="搜索日志内容、来源或 Trace ID" className="table-search table-search--wide" />
        </Space>
      </div>
      <div className="observability-log-list">
        {data.logRecords.map((item) => (
          <div className="observability-log-item" key={item.id}>
            <div className="observability-log-item__meta">
              <Tag color={item.level === 'ERROR' ? 'red' : item.level === 'WARN' ? 'orange' : 'arcoblue'}>{item.level}</Tag>
              <span>{item.source}</span>
              <span>{item.timestamp}</span>
            </div>
            <div className="observability-log-item__message">{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertTemplateTab({ rows }: { rows: ObservabilityAlertTemplate[] }) {
  return (
    <div className="observability-panel">
      <Tabs activeTab="preset" className="tenant-ops-subtabs">
        <TabPane key="templates" title="告警模板" />
        <TabPane key="preset" title="预置告警模板" />
      </Tabs>

      <div className="tenant-ops-toolbar">
        <Space size={8}>
          <Input.Search placeholder="搜索模板名称" className="table-search table-search--wide" />
        </Space>
        <Button icon={<IconRefresh />} />
      </div>

      <div className="tenant-ops-table-wrap">
        <Table
          rowKey="id"
          className="tenant-ops-table"
          borderCell={false}
          pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
          data={rows}
          columns={[
            { title: '模板名称', dataIndex: 'name', width: 240 },
            { title: '描述', dataIndex: 'description', width: 240 },
            { title: '告警类型', dataIndex: 'type', width: 96 },
            { title: '版本号', dataIndex: 'version', width: 96 },
            { title: '告警规则', dataIndex: 'ruleCount', width: 88 },
            { title: '应用范围', dataIndex: 'scopeCount', width: 88 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 96,
              render: (value: ObservabilityAlertTemplate['status']) => (
                <Tag color={value === '已启用' ? 'green' : 'gray'}>{value}</Tag>
              ),
            },
            {
              title: '更新时间',
              dataIndex: 'updatedAt',
              width: 168,
              render: (value: string, record: ObservabilityAlertTemplate) => (
                <div className="alert-template-time">
                  <strong>{value}</strong>
                  <Text type="secondary">由 {record.updatedBy} 更改</Text>
                </div>
              ),
            },
            {
              title: '操作',
              width: 100,
              render: () => (
                <Space size={8}>
                  <Button type="text" size="mini">
                    应用
                  </Button>
                  <Button type="text" size="mini">
                    复制
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1400 }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="ops-section-title">
      <span />
      <strong>{title}</strong>
    </div>
  );
}

function MetricTile({ item }: { item: ObservabilityMetricCard }) {
  return (
    <div className="observability-metric-card">
      <div className="observability-metric-card__label">{item.label}</div>
      <div className="observability-metric-card__value">
        {item.value}
        <span>{item.unit}</span>
      </div>
      <div className="observability-metric-card__trend">{item.trend}</div>
    </div>
  );
}

function RankingCard({ title, items }: { title: string; items: ObservabilityRankingItem[] }) {
  return (
    <Card bordered={false} className="observability-card">
      <div className="observability-card__title">{title}</div>
      <div className="ranking-list">
        {items.map((item) => (
          <div className="ranking-list__item" key={`${title}-${item.name}`}>
            <div className="ranking-list__value">{item.value}</div>
            <div className="ranking-list__meta">
              <span>{item.name}</span>
              <div className="ranking-list__bar">
                <span />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SessionFilterBlock({ title }: { title: string }) {
  return (
    <div className="session-filter-block">
      <label>{title}</label>
      <Select defaultValue="contains" className="compact-select compact-select--full">
        <Select.Option value="contains">包含</Select.Option>
      </Select>
      <Select defaultValue="all" className="compact-select compact-select--full">
        <Select.Option value="all">请选择或回车输入</Select.Option>
      </Select>
    </div>
  );
}

function SessionRangeBlock({ title }: { title: string }) {
  return (
    <div className="session-filter-block">
      <label>{title}</label>
      <div className="session-range-row">
        <Input placeholder="0" />
        <span>-</span>
        <Input placeholder="0" />
      </div>
    </div>
  );
}

function TimeShortcut({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button className={`audit-shortcut ${active ? 'audit-shortcut--active' : ''}`} type="button">
      {label}
    </button>
  );
}
