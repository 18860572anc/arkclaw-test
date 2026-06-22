import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconEdit, IconLeft, IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { SyncIssueRow } from '../../types/domain';

const { Text } = Typography;

export default function UserSyncResultsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SyncIssueRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    mockApi.getSyncIssues().then(setRows);
  }, []);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, pageSize, rows]);

  const columns = [
    {
      title: '姓名/ID',
      dataIndex: 'name',
      width: 160,
      render: (_: unknown, record: SyncIssueRow) => (
        <div className="users-table-name">
          <strong>{record.name}</strong>
          <span>{record.id}</span>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
      render: (value: string) => (
        <div className="users-sync-cell users-sync-cell--danger">
          <span>{value}</span>
          <IconEdit />
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 160,
      render: (value: string) => (
        <div className="users-sync-cell users-sync-cell--danger">
          <span>{value}</span>
          <IconEdit />
        </div>
      ),
    },
    {
      title: '信息状态',
      dataIndex: 'status',
      width: 120,
      render: (value: SyncIssueRow['status']) => (
        <Tag className="users-status-tag" color="gold">
          {value}
        </Tag>
      ),
    },
    {
      title: '最新登录方式',
      dataIndex: 'loginType',
      width: 130,
      render: (value: string) => (
        <span className="users-login-type">
          {value}
        </span>
      ),
    },
    { title: '案例', dataIndex: 'example' },
  ];

  return (
    <div className="users-sync-page">
      <div className="users-sync-page__header">
        <button type="button" className="users-sync-page__back" onClick={() => navigate('/tenant/users', { state: { tab: 'employees' } })}>
          <IconLeft />
          <span>更新员工数据</span>
        </button>
        <Button icon={<IconRefresh />} />
      </div>

      <div className="users-subheading users-subheading--sync">
        <strong>异常员工数据</strong>
      </div>

      <div className="users-table-wrap">
        <Table
          className="users-table users-table--sync"
          borderCell={false}
          columns={columns}
          data={pagedRows}
          rowKey="id"
          pagination={false}
        />
        <div className="users-sync-pagination">
          <Text>共 {rows.length} 条</Text>
          <Pagination
            size="small"
            total={rows.length}
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
          <Select
            value={String(pageSize)}
            className="users-page-size"
            onChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <Select.Option value="10">10 条/页</Select.Option>
            <Select.Option value="20">20 条/页</Select.Option>
          </Select>
        </div>
      </div>
    </div>
  );
}
