import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from '@arco-design/web-react';
import type {
  NotificationCategory,
  NotificationFilterStatus,
  NotificationInboxItem,
  NotificationRole,
} from '../../types/domain';
import { mockApi } from '../../services/mockApi';
import { NOTIFICATION_CHANGE_EVENT } from '../../services/notificationMockApi';

const { Title, Text } = Typography;

const categoryMeta: Record<NotificationCategory, { color: string; text: string }> = {
  order: { color: 'arcoblue', text: '订单' },
  review: { color: 'orange', text: '审核' },
  onboarding: { color: 'green', text: '开通' },
  lead: { color: 'purple', text: '留资' },
  commission: { color: 'gold', text: '佣金' },
  system: { color: 'red', text: '系统' },
};

const priorityMeta = {
  high: { color: '#f53f3f', text: '高优先级' },
  medium: { color: '#ff7d00', text: '重要' },
  low: { color: '#86909c', text: '提示' },
} as const;

const roleDescription: Record<NotificationRole, string> = {
  tenantAdmin: '查看订单、对公审核、ArkClaw 开通和系统维护提醒',
  salesAdmin: '查看销售优惠券分配、咨询留资、客户付款、开通完成和佣金到账提醒',
  sales: '查看咨询留资、客户付款、开通完成和佣金到账提醒',
  deliveryAdmin: '查看交付工单、支持工单和对公流水录入任务',
  deliveryOps: '查看交付工单、支持工单和对公流水录入任务',
  platformAdmin: '查看新企业注册提醒',
  finance: '查看对公复核、退款、发票和佣金结算提醒',
};

const categoryOptions: Array<{ label: string; value: 'all' | NotificationCategory }> = [
  { label: '全部类型', value: 'all' },
  { label: '订单', value: 'order' },
  { label: '审核', value: 'review' },
  { label: '开通', value: 'onboarding' },
  { label: '咨询留资', value: 'lead' },
  { label: '佣金', value: 'commission' },
  { label: '系统', value: 'system' },
];

const statusOptions: Array<{ label: string; value: NotificationFilterStatus }> = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '待处理', value: 'todo' },
];

export default function NotificationsPage({ role }: { role: NotificationRole }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rows, setRows] = useState<NotificationInboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationFilterStatus>('all');
  const [category, setCategory] = useState<'all' | NotificationCategory>('all');

  const pageSize = 20;

  const title = useMemo(() => '通知中心', []);

  const loadData = async () => {
    setLoading(true);
    const result = await mockApi.getNotifications({
      role,
      status,
      categories: category === 'all' ? [] : [category],
      page,
      pageSize,
    });
    setRows(result.items);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [role, status, page, category]);

  useEffect(() => {
    const handleNotificationChanged = () => {
      void loadData();
    };
    window.addEventListener(NOTIFICATION_CHANGE_EVENT, handleNotificationChanged);
    return () => window.removeEventListener(NOTIFICATION_CHANGE_EVENT, handleNotificationChanged);
  }, [role, status, page, category]);

  const handleOpen = async (item: NotificationInboxItem) => {
    setProcessing(true);
    if (!item.read) {
      await mockApi.markNotificationRead(item.id);
    }
    setProcessing(false);
    if (item.actionable) {
      navigate(item.actionUrl);
    }
  };

  const handleReadAll = async () => {
    setProcessing(true);
    await mockApi.markAllNotificationsRead(role);
    setProcessing(false);
    await loadData();
  };

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>{title}</Title>
          <Text type="secondary">{roleDescription[role]}</Text>
        </div>
        <Button onClick={handleReadAll} loading={processing}>
          全部标记已读
        </Button>
      </div>

      <div className="sales-filter-bar notification-filter-bar">
        <Select
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value as NotificationFilterStatus);
          }}
          className="compact-select"
        >
          {statusOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(value) => {
            setPage(1);
            setCategory(value as 'all' | NotificationCategory);
          }}
          className="compact-select compact-select--wide"
        >
          {categoryOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Card bordered>
        {loading ? (
          <Spin className="page-spin" tip="加载通知中" />
        ) : rows.length ? (
          <div className="notification-feed">
            {rows.map((item) => (
              <article key={item.id} className={`notification-card ${item.read ? '' : 'is-unread'}`}>
                <div className="notification-card__head">
                  <Space size={8}>
                    <Tag color={categoryMeta[item.category].color}>{categoryMeta[item.category].text}</Tag>
                    {item.todo ? <Tag color="red">待处理</Tag> : null}
                    {!item.read ? <Tag color="arcoblue">未读</Tag> : null}
                  </Space>
                  <span
                    className="notification-card__priority"
                    style={{ color: priorityMeta[item.priority].color }}
                  >
                    {priorityMeta[item.priority].text}
                  </span>
                </div>
                <div className="notification-card__body">
                  <div className="notification-card__title">{item.title}</div>
                  <div className="notification-card__summary">{item.summary}</div>
                </div>
                <div className="notification-card__foot">
                  <Text type="secondary">{item.createdAt}</Text>
                  <Button
                    size="small"
                    type={item.read ? 'outline' : 'primary'}
                    onClick={() => {
                      void handleOpen(item);
                    }}
                    disabled={processing || !item.actionable}
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              </article>
            ))}
            <div className="notification-pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                sizeCanChange={false}
                onChange={(nextPage) => setPage(nextPage)}
              />
            </div>
          </div>
        ) : (
          <Empty description="暂无通知记录" />
        )}
      </Card>
    </Space>
  );
}
