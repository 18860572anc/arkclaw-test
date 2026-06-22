import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Input,
  Pagination,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconDownload,
  IconFilter,
  IconRefresh,
} from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { ClawInstance } from '../../types/domain';

const { Title } = Typography;

const seatName = {
  lite: '轻量',
  standard: '标准',
  pro: '高级',
  ultimate: '旗舰',
};

const statusMeta = {
  running: { label: '运行中', tone: 'success' },
  stopped: { label: '已停用', tone: 'muted' },
} as const;

const ownerAvatarColors = ['#ffe4d1', '#eee0ff', '#e3edff', '#ddf3df', '#dff5ff'];
const rowSelectionWidth = 52;
const tableScrollX = 1432;
const sharedClawIds = new Set(['claw-v1p08']);

function FilterTitle({ children }: { children: string }) {
  return (
    <span className="claw-column-title">
      {children}
      <IconFilter />
    </span>
  );
}

function DisplayDash({ children }: { children?: string }) {
  return children ? <span>{children}</span> : <span className="claw-empty-value">-</span>;
}

function isActiveClawStatus(status: ClawInstance['status']): status is 'running' | 'stopped' {
  return status === 'running' || status === 'stopped';
}

export default function ClawListPage() {
  const navigate = useNavigate();
  const [listScope, setListScope] = useState<'employee' | 'shared'>('employee');
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<ClawInstance[]>([]);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    Promise.all([mockApi.getClaws(false), mockApi.getClawPurchaseStatus()]).then(([data, status]) => {
      setRows(data);
      setPurchased(status.purchased);
      setSelectedRowKeys([]);
      setCurrentPage(1);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowKeys([]);
  }, [listScope]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (item): item is ClawInstance & { status: 'running' | 'stopped' } =>
          isActiveClawStatus(item.status) &&
          (listScope === 'shared' ? sharedClawIds.has(item.id) : !sharedClawIds.has(item.id)) &&
          `${item.name}${item.id}${item.owner}${item.group}${item.email}`.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [keyword, listScope, rows],
  );

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const getRowVersion = (record: ClawInstance) => {
    const patch = Math.max(0, record.name.length % 3);
    return `1.${record.seatLevel === 'pro' ? 1 : 0}.${patch}`;
  };

  const getCreatedAt = (record: ClawInstance) =>
    dayjs('2026-05-25 14:06:00')
      .subtract(record.name.length * 3, 'day')
      .subtract(record.id.length * 11, 'minute')
      .format('YYYY-MM-DD HH:mm:ss');

  const activeColumns = [
    {
      title: '名称/ID',
      dataIndex: 'name',
      width: 230,
      render: (_: unknown, record: ClawInstance) => (
        <div className="claw-name-cell">
          <Button type="text" size="mini" className="claw-name-link" title={record.name}>
            {record.name}
          </Button>
          <div className="table-subtext">{record.id}</div>
        </div>
      ),
    },
    {
      title: <FilterTitle>状态</FilterTitle>,
      dataIndex: 'status',
      width: 100,
      render: (_: unknown, record: ClawInstance & { status: 'running' | 'stopped' }) => (
        <span className={`claw-status claw-status--${statusMeta[record.status].tone}`}>
          <span className="claw-status__dot" />
          {statusMeta[record.status].label}
        </span>
      ),
    },
    {
      title: '归属用户',
      dataIndex: 'owner',
      width: 150,
      render: (_: unknown, record: ClawInstance) => (
        <div className="claw-owner-cell">
          <Avatar
            size={22}
            className="claw-owner-avatar"
            style={{ backgroundColor: ownerAvatarColors[record.owner.length % ownerAvatarColors.length] }}
          >
            {record.owner.slice(0, 1)}
          </Avatar>
          <span>{record.owner}</span>
        </div>
      ),
    },
    {
      title: '用户邮箱',
      dataIndex: 'email',
      width: 170,
      render: (value: string) => <DisplayDash>{value}</DisplayDash>,
    },
    {
      title: <FilterTitle>席位等级</FilterTitle>,
      dataIndex: 'seatLevel',
      width: 110,
      render: (value: keyof typeof seatName) => <Tag className={`claw-seat-tag claw-seat-tag--${value}`}>{seatName[value]}</Tag>,
    },
    {
      title: '默认模型',
      dataIndex: 'model',
      width: 188,
      render: (value: string) => (
        <span className="claw-model-cell">
          <span className="model-dot" />
          {value}
        </span>
      ),
    },
    {
      title: <FilterTitle>当前版本</FilterTitle>,
      width: 110,
      render: (_: unknown, record: ClawInstance) => getRowVersion(record),
    },
    {
      title: '创建时间',
      width: 170,
      render: (_: unknown, record: ClawInstance) => getCreatedAt(record),
    },
    {
      title: '操作',
      width: 152,
      fixed: 'right' as const,
      render: (_: unknown, record: ClawInstance) => (
        <Space size={8} className="claw-actions">
          <Button type="text" size="mini">
            {record.status === 'running' ? '停用' : '启用'}
          </Button>
          <Button type="text" size="mini">
            自动修复
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="claw-page">
      <div className="claw-page__header">
        <Title heading={3}>Claw 列表</Title>
      </div>

      <div className="claw-list-shell">
        {!loading && !purchased ? (
          <div className="claw-purchase-empty">
            <div className="claw-purchase-empty__icon" aria-hidden="true">
              <div className="claw-purchase-empty__bubble">hi</div>
              <div className="claw-purchase-empty__badge">↘</div>
            </div>
            <p className="claw-purchase-empty__copy">欢迎使用 ArkClaw 企业版，请先完成席位购买</p>
            <Button className="dark-button claw-purchase-empty__button" onClick={() => navigate('/tenant/purchase')}>
              立即购买
            </Button>
          </div>
        ) : (
          <>
            <div className="claw-filterbar">
              <div className="claw-filterbar__left">
                <Radio.Group
                  type="button"
                  size="small"
                  value={listScope}
                  onChange={(value) => setListScope(value as 'employee' | 'shared')}
                  className="claw-scope-group"
                >
                  <Radio value="employee">员工 Claw</Radio>
                  <Radio value="shared">共享 Claw</Radio>
                </Radio.Group>
                <Input.Search
                  allowClear
                  placeholder="请选拣搜索类型"
                  value={keyword}
                  onChange={setKeyword}
                  className="table-search claw-list-search"
                />
              </div>
              <div className="claw-filterbar__right">
                <Button icon={<IconDownload />}>导出当前列表</Button>
                <Button className="claw-icon-button" icon={<IconRefresh />} />
              </div>
            </div>

            <div className="claw-table-wrap">
              <Table
                loading={loading}
                rowKey="id"
                columns={activeColumns}
                data={pagedRows}
                pagination={false}
                className="claw-table"
                scroll={{ x: tableScrollX }}
                rowSelection={{
                  columnWidth: rowSelectionWidth,
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
              />
            </div>

            <div className="claw-table-footer">
              <div className="claw-batchbar">
                <span className="claw-batchbar__count">已选中 {selectedRowKeys.length} 条</span>
              </div>

              <div className="claw-pagination">
                <span className="claw-pagination__total">共 {filteredRows.length} 条</span>
                <Pagination
                  size="small"
                  total={filteredRows.length}
                  current={currentPage}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  onPageSizeChange={(_, size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  showTotal={false}
                  sizeCanChange
                  pageSizeChangeResetCurrent
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
