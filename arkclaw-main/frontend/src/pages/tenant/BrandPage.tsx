import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Message, Modal, Space, Spin, Table, Typography } from '@arco-design/web-react';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { BrandCustomization } from '../../types/domain';

const { Title } = Typography;

export default function BrandPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<BrandCustomization[]>([]);

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    const data = await mockApi.getBrandCustomizations();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handlePublish = async (record: BrandCustomization) => {
    await mockApi.publishBrandCustomization(record.id);
    Message.success(`已发布 ${record.name}`);
    loadData();
  };

  const handleDelete = (record: BrandCustomization) => {
    Modal.confirm({
      title: '删除品牌配置',
      content: `删除后将无法恢复：${record.name}`,
      okText: '删除',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        await mockApi.deleteBrandCustomization(record.id);
        Message.success('品牌配置已删除');
        loadData();
      },
    });
  };

  const columns = [
    {
      title: '名称描述',
      dataIndex: 'name',
      width: 104,
      ellipsis: true,
      render: (_: unknown, record: BrandCustomization) => <span className="brand-table-text">{record.name}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 84,
      render: (value: BrandCustomization['status']) => (
        <span className={`brand-status brand-status--${value}`}>
          <span className="brand-status__dot" />
          {value === 'active' ? '使用中' : '草稿'}
        </span>
      ),
    },
    {
      title: '企业品牌名',
      dataIndex: 'companyName',
      width: 124,
      ellipsis: true,
    },
    {
      title: '产品主 Slogan',
      dataIndex: 'primarySlogan',
      width: 156,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '产品副 Slogan',
      dataIndex: 'secondarySlogan',
      width: 220,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 148,
    },
    {
      title: '操作',
      width: 132,
      render: (_: unknown, record: BrandCustomization) => (
        <Space size={8}>
          <Button
            type="text"
            size="mini"
            disabled={record.status === 'active'}
            onClick={() => handlePublish(record)}
          >
            发布
          </Button>
          <Button type="text" size="mini" onClick={() => navigate(`/tenant/brand/${record.id}/edit`)}>
            编辑
          </Button>
          <Button type="text" size="mini" status="danger" onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <Spin className="page-spin" tip="加载品牌定制" />;
  }

  return (
    <div className="brand-page">
      <div className="brand-page__header">
        <Title heading={3}>品牌定制</Title>
      </div>

      <div className="brand-page__toolbar">
        <Button type="primary" icon={<IconPlus />} onClick={() => navigate('/tenant/brand/create')}>
          品牌定制信息
        </Button>
        <Button
          className="brand-page__refresh"
          icon={<IconRefresh />}
          aria-label="刷新品牌定制列表"
          onClick={() => loadData(true)}
        />
      </div>

      <div className="brand-table-wrap">
        <Table
          rowKey="id"
          className="brand-table"
          columns={columns}
          data={records}
          borderCell={false}
          pagination={false}
        />
      </div>
    </div>
  );
}
