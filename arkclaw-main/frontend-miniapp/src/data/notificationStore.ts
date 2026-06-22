export const miniNotificationsStorageKey = 'arkclaw-miniapp-notifications';

export type MiniNotificationCategory = 'order' | 'review' | 'onboarding' | 'lead' | 'commission' | 'system';
export type MiniNotificationPriority = 'high' | 'medium' | 'low';
export type MiniNotificationStatusFilter = 'all' | 'unread' | 'todo';

export interface MiniNotificationItem {
  id: string;
  category: MiniNotificationCategory;
  priority: MiniNotificationPriority;
  title: string;
  summary: string;
  read: boolean;
  todo: boolean;
  actionable: boolean;
  actionUrl: string;
  actionLabel: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  readAt?: string;
}

export type MiniNotificationCreatePayload = Omit<MiniNotificationItem, 'id' | 'read' | 'createdAt' | 'readAt'> & {
  read?: boolean;
};

export function readMiniNotifications(): MiniNotificationItem[] {
  const stored = uni.getStorageSync(miniNotificationsStorageKey) as MiniNotificationItem[] | '';
  const rows = Array.isArray(stored) ? stored : seedMiniNotifications();
  return sortNotifications(rows.map(normalizeMiniNotification));
}

export function writeMiniNotifications(items: MiniNotificationItem[]) {
  uni.setStorageSync(miniNotificationsStorageKey, sortNotifications(items));
}

export function getMiniNotificationUnreadCount() {
  return readMiniNotifications().filter((item) => !item.read).length;
}

export function getMiniNotifications(filter: MiniNotificationStatusFilter) {
  const rows = readMiniNotifications();
  if (filter === 'unread') return rows.filter((item) => !item.read);
  if (filter === 'todo') return rows.filter((item) => item.todo);
  return rows;
}

export function markMiniNotificationRead(id: string) {
  writeMiniNotifications(
    readMiniNotifications().map((item) =>
      item.id === id && !item.read
        ? { ...item, read: true, readAt: formatDateTime(Date.now()) }
        : item,
    ),
  );
}

export function markAllMiniNotificationsRead() {
  writeMiniNotifications(
    readMiniNotifications().map((item) =>
      item.read ? item : { ...item, read: true, readAt: formatDateTime(Date.now()) },
    ),
  );
}

export function createMiniNotification(payload: MiniNotificationCreatePayload) {
  const now = Date.now();
  const item: MiniNotificationItem = {
    ...payload,
    id: `mini-notif-${now}-${Math.floor(Math.random() * 1000)}`,
    read: payload.read ?? false,
    createdAt: formatDateTime(now),
  };

  writeMiniNotifications([item, ...readMiniNotifications()]);
  return item;
}

function sortNotifications(items: MiniNotificationItem[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeMiniNotification(item: MiniNotificationItem): MiniNotificationItem {
  if (item.actionLabel === '进入空间' || item.actionUrl === '/pages/tenant/index') {
    return {
      ...item,
      actionable: false,
      actionUrl: '',
      actionLabel: '',
    };
  }

  return item;
}

function formatDateTime(value: number) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function seedMiniNotifications(): MiniNotificationItem[] {
  const rows: MiniNotificationItem[] = [
    {
      id: 'mini-notif-tenant-bank-rejected',
      category: 'review',
      priority: 'high',
      title: '对公审核被驳回',
      summary: '付款信息与订单金额不一致，请前往订单页重新确认付款方式。',
      read: false,
      todo: true,
      actionable: true,
      actionUrl: '/pages/tenant/orders',
      actionLabel: '查看订单',
      sourceType: 'bank_transfer_review',
      sourceId: 'btr-20260526002',
      createdAt: '2026-05-26 10:08',
    },
    {
      id: 'mini-notif-tenant-opened',
      category: 'onboarding',
      priority: 'medium',
      title: 'ArkClaw 已开通',
      summary: '企业空间已完成开通，可以进入席位概览开始配置和使用。',
      read: false,
      todo: false,
      actionable: false,
      actionUrl: '',
      actionLabel: '',
      sourceType: 'opening_task',
      sourceId: 'opening-20260526001',
      createdAt: '2026-05-26 10:26',
    },
    {
      id: 'mini-notif-tenant-order-paid',
      category: 'order',
      priority: 'medium',
      title: '订单支付成功',
      summary: 'ArkClaw 席位订单已支付，平台将开始开通服务。',
      read: true,
      todo: false,
      actionable: true,
      actionUrl: '/pages/tenant/orders',
      actionLabel: '查看订单',
      sourceType: 'order',
      sourceId: 'order-20260526001',
      createdAt: '2026-05-26 09:10',
      readAt: '2026-05-26 09:16',
    },
  ];

  writeMiniNotifications(rows);
  return rows;
}
