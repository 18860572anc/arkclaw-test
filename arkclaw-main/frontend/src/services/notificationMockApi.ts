import dayjs from 'dayjs';
import type {
  NotificationCategory,
  NotificationFilterStatus,
  NotificationInboxItem,
  NotificationListQuery,
  NotificationListResult,
  NotificationPreference,
  NotificationRole,
} from '../types/domain';

const NOTIFICATION_CHANGE_EVENT = 'arkclaw:notifications-changed';

const delay = <T,>(data: T, ms = 120) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), ms);
  });

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const emitNotificationChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT));
  }
};

const roleUserKey = (role: NotificationRole) => role;

let notificationPreferencesState: Record<NotificationRole, NotificationPreference> = {
  tenantAdmin: {
    role: 'tenantAdmin',
    leadAssigned: true,
    customerPaid: true,
    commissionArrived: true,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  sales: {
    role: 'sales',
    leadAssigned: true,
    customerPaid: true,
    commissionArrived: true,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  salesAdmin: {
    role: 'salesAdmin',
    leadAssigned: true,
    customerPaid: true,
    commissionArrived: true,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  deliveryOps: {
    role: 'deliveryOps',
    leadAssigned: false,
    customerPaid: false,
    commissionArrived: false,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  deliveryAdmin: {
    role: 'deliveryAdmin',
    leadAssigned: false,
    customerPaid: false,
    commissionArrived: false,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  platformAdmin: {
    role: 'platformAdmin',
    leadAssigned: true,
    customerPaid: true,
    commissionArrived: true,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
  finance: {
    role: 'finance',
    leadAssigned: false,
    customerPaid: true,
    commissionArrived: true,
    maintenance: true,
    openingTask: true,
    securityAlert: true,
    updatedAt: '2026-04-30 09:00',
  },
};

let notificationsState: NotificationInboxItem[] = [
  {
    id: 'notif-tenant-order-paid',
    userKey: roleUserKey('tenantAdmin'),
    role: 'tenantAdmin',
    category: 'order',
    priority: 'medium',
    title: '订单支付成功',
    summary: '云岭制造的 ArkClaw 企业版订单已支付，平台将开始开通服务。',
    read: true,
    todo: false,
    actionable: true,
    actionUrl: '/tenant/billing',
    actionLabel: '查看订单',
    sourceType: 'order',
    sourceId: 'order-20260526001',
    templateTrigger: 'order.paid',
    createdAt: '2026-05-26 09:10',
    readAt: '2026-05-26 09:16',
  },
  {
    id: 'notif-tenant-bank-approved',
    userKey: roleUserKey('tenantAdmin'),
    role: 'tenantAdmin',
    category: 'review',
    priority: 'medium',
    title: '对公审核已通过',
    summary: '对公付款已确认，订单已进入 ArkClaw 开通流程。',
    read: true,
    todo: false,
    actionable: true,
    actionUrl: '/tenant/billing',
    actionLabel: '查看订单',
    sourceType: 'bank_transfer_review',
    sourceId: 'btr-20260526001',
    templateTrigger: 'order.bank_transfer.approved',
    createdAt: '2026-05-26 09:35',
    readAt: '2026-05-26 09:40',
  },
  {
    id: 'notif-tenant-bank-rejected',
    userKey: roleUserKey('tenantAdmin'),
    role: 'tenantAdmin',
    category: 'review',
    priority: 'high',
    title: '对公审核被驳回',
    summary: '付款信息与订单金额不一致，请前往账单页重新提交或补充凭证。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/tenant/billing',
    actionLabel: '重新提交',
    sourceType: 'bank_transfer_review',
    sourceId: 'btr-20260526002',
    templateTrigger: 'order.bank_transfer.rejected',
    createdAt: '2026-05-26 10:08',
  },
  {
    id: 'notif-tenant-opened',
    userKey: roleUserKey('tenantAdmin'),
    role: 'tenantAdmin',
    category: 'onboarding',
    priority: 'medium',
    title: 'ArkClaw 已开通',
    summary: '企业空间已完成开通，可以进入空间概览开始配置和使用。',
    read: false,
    todo: false,
    actionable: true,
    actionUrl: '/tenant/overview',
    actionLabel: '进入空间',
    sourceType: 'opening_task',
    sourceId: 'opening-20260526001',
    templateTrigger: 'tenant.opened',
    createdAt: '2026-05-26 10:26',
  },
  {
    id: 'notif-sales-lead-assigned',
    userKey: roleUserKey('sales'),
    role: 'sales',
    category: 'lead',
    priority: 'high',
    title: '新咨询留资已分配',
    summary: '杭州数智财税提交了套餐咨询，已分配给你跟进。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/sales/leads',
    actionLabel: '进入咨询工单池',
    sourceType: 'lead',
    sourceId: 'lead-20260526001',
    templateTrigger: 'lead.assigned',
    createdAt: '2026-05-26 09:50',
  },
  {
    id: 'notif-sales-customer-paid',
    userKey: roleUserKey('sales'),
    role: 'sales',
    category: 'order',
    priority: 'medium',
    title: '客户已付款',
    summary: '云岭制造已完成 ArkClaw 订单付款，可以关注后续开通进度。',
    read: false,
    todo: false,
    actionable: true,
    actionUrl: '/sales/customers',
    actionLabel: '查看客户',
    sourceType: 'order',
    sourceId: 'order-20260526001',
    templateTrigger: 'customer.order.paid',
    createdAt: '2026-05-26 10:02',
  },
  {
    id: 'notif-sales-tenant-opened',
    userKey: roleUserKey('sales'),
    role: 'sales',
    category: 'onboarding',
    priority: 'medium',
    title: '客户 ArkClaw 已开通',
    summary: '云岭制造的企业空间已开通完成。',
    read: true,
    todo: false,
    actionable: true,
    actionUrl: '/sales/customers',
    actionLabel: '查看客户',
    sourceType: 'tenant',
    sourceId: 'tenant-yunling',
    templateTrigger: 'customer.tenant.opened',
    createdAt: '2026-05-26 10:26',
    readAt: '2026-05-26 10:34',
  },
  {
    id: 'notif-sales-commission-arrived',
    userKey: roleUserKey('sales'),
    role: 'sales',
    category: 'commission',
    priority: 'medium',
    title: '佣金已到账',
    summary: '云岭制造订单佣金已入账，可在佣金明细中查看。',
    read: false,
    todo: false,
    actionable: true,
    actionUrl: '/sales/commission',
    actionLabel: '查看佣金',
    sourceType: 'commission',
    sourceId: 'commission-20260526001',
    templateTrigger: 'commission.arrived',
    createdAt: '2026-05-26 11:05',
  },
  {
    id: 'notif-sales-owner-changed',
    userKey: roleUserKey('sales'),
    role: 'sales',
    category: 'lead',
    priority: 'medium',
    title: '客户归属已变更',
    summary: '杭州数智财税已调整为你的客户，请在客户池中查看。',
    read: false,
    todo: false,
    actionable: true,
    actionUrl: '/sales/customers',
    actionLabel: '查看客户',
    sourceType: 'customer_owner',
    sourceId: 'customer-20260526001',
    templateTrigger: 'customer.owner.changed',
    createdAt: '2026-05-26 11:20',
  },
  {
    id: 'notif-sales-admin-coupon',
    userKey: roleUserKey('salesAdmin'),
    role: 'salesAdmin',
    category: 'system',
    priority: 'medium',
    title: '官方发放了销售优惠券',
    summary: '你收到一批线下推广优惠券，可分配给下属销售或直接发给客户。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/sales-admin/coupons',
    actionLabel: '去分配',
    sourceType: 'sales_coupon_pool',
    sourceId: 'SCP-20260515-001',
    templateTrigger: 'sales_coupon_pool.issued',
    createdAt: '2026-05-26 11:30',
  },
  {
    id: 'notif-ops-delivery-assigned',
    userKey: roleUserKey('deliveryOps'),
    role: 'deliveryOps',
    category: 'onboarding',
    priority: 'high',
    title: '交付工单已分配给你',
    summary: '云岭制造的新开 ArkClaw 交付工单需要处理。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops/delivery-tickets/OPS-202605260001',
    actionLabel: '进入工单',
    sourceType: 'delivery_ticket',
    sourceId: 'OPS-202605260001',
    templateTrigger: 'delivery_ticket.assigned',
    createdAt: '2026-05-26 09:42',
  },
  {
    id: 'notif-ops-support-assigned',
    userKey: roleUserKey('deliveryOps'),
    role: 'deliveryOps',
    category: 'system',
    priority: 'high',
    title: '支持工单已分配给你',
    summary: '你绑定的客户提交了技术支持工单，请及时跟进。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops/support-tickets/SUP-202605260002',
    actionLabel: '进入工单',
    sourceType: 'support_ticket',
    sourceId: 'SUP-202605260002',
    templateTrigger: 'support_ticket.assigned',
    createdAt: '2026-05-26 10:18',
  },
  {
    id: 'notif-ops-bank-serial',
    userKey: roleUserKey('deliveryOps'),
    role: 'deliveryOps',
    category: 'review',
    priority: 'high',
    title: '对公流水号待录入',
    summary: '云岭制造提交了对公审核，请先录入流水号和到账信息。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops/orders/bank-transfer-review',
    actionLabel: '录入流水号',
    sourceType: 'bank_transfer_review',
    sourceId: 'btr-20260526003',
    templateTrigger: 'bank_transfer.serial_input.assigned',
    createdAt: '2026-05-26 10:32',
  },
  {
    id: 'notif-ops-admin-delivery-assigned',
    userKey: roleUserKey('deliveryAdmin'),
    role: 'deliveryAdmin',
    category: 'onboarding',
    priority: 'high',
    title: '交付工单已分配给你',
    summary: '云岭制造的新开 ArkClaw 交付工单需要处理；如需调整可进行改派。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops-admin/delivery-tickets/OPS-202605260001',
    actionLabel: '进入工单',
    sourceType: 'delivery_ticket',
    sourceId: 'OPS-202605260001',
    templateTrigger: 'delivery_ticket.assigned',
    createdAt: '2026-05-26 09:44',
  },
  {
    id: 'notif-ops-admin-support-assigned',
    userKey: roleUserKey('deliveryAdmin'),
    role: 'deliveryAdmin',
    category: 'system',
    priority: 'high',
    title: '支持工单已分配给你',
    summary: '你绑定的客户提交了技术支持工单，请及时跟进；如需调整可进行改派。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops-admin/support-tickets/SUP-202605260002',
    actionLabel: '进入工单',
    sourceType: 'support_ticket',
    sourceId: 'SUP-202605260002',
    templateTrigger: 'support_ticket.assigned',
    createdAt: '2026-05-26 10:20',
  },
  {
    id: 'notif-ops-admin-bank-serial',
    userKey: roleUserKey('deliveryAdmin'),
    role: 'deliveryAdmin',
    category: 'review',
    priority: 'high',
    title: '对公流水号待录入',
    summary: '云岭制造提交了对公审核，请先录入流水号和到账信息；如需调整可进行改派。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/ops-admin/orders/bank-transfer-review',
    actionLabel: '录入流水号',
    sourceType: 'bank_transfer_review',
    sourceId: 'btr-20260526003',
    templateTrigger: 'bank_transfer.serial_input.assigned',
    createdAt: '2026-05-26 10:34',
  },
  {
    id: 'notif-admin-tenant-created',
    userKey: roleUserKey('platformAdmin'),
    role: 'platformAdmin',
    category: 'system',
    priority: 'medium',
    title: '新企业已注册',
    summary: '杭州数智财税完成企业账号注册，可在企业管理中查看。',
    read: false,
    todo: false,
    actionable: true,
    actionUrl: '/admin/tenants',
    actionLabel: '查看企业',
    sourceType: 'tenant',
    sourceId: 'tenant-hangzhou-finance',
    templateTrigger: 'tenant.registered',
    createdAt: '2026-05-26 09:25',
  },
  {
    id: 'notif-finance-bank-review',
    userKey: roleUserKey('finance'),
    role: 'finance',
    category: 'review',
    priority: 'high',
    title: '对公审核待财务复核',
    summary: '交付已录入流水号和到账信息，请财务确认到账。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/finance/orders/bank-transfer-review',
    actionLabel: '进入复核',
    sourceType: 'bank_transfer_review',
    sourceId: 'btr-20260526003',
    templateTrigger: 'bank_transfer.finance_review.required',
    createdAt: '2026-05-26 10:48',
  },
  {
    id: 'notif-finance-invoice',
    userKey: roleUserKey('finance'),
    role: 'finance',
    category: 'order',
    priority: 'medium',
    title: '发票申请待处理',
    summary: '杭州数智财税提交了发票申请，请核对开票信息。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/finance/orders/invoices',
    actionLabel: '处理发票',
    sourceType: 'invoice',
    sourceId: 'invoice-20260526001',
    templateTrigger: 'invoice.requested',
    createdAt: '2026-05-26 11:25',
  },
  {
    id: 'notif-finance-commission',
    userKey: roleUserKey('finance'),
    role: 'finance',
    category: 'commission',
    priority: 'medium',
    title: '佣金结算待处理',
    summary: '本期新增 3 笔待结算佣金，请完成财务处理。',
    read: false,
    todo: true,
    actionable: true,
    actionUrl: '/finance/commission/transactions',
    actionLabel: '处理结算',
    sourceType: 'commission',
    sourceId: 'commission-batch-20260526001',
    templateTrigger: 'commission.settlement.required',
    createdAt: '2026-05-26 11:40',
  },
];

const sortByCreatedAtDesc = (rows: NotificationInboxItem[]) =>
  [...rows].sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf());

const applyStatusFilter = (rows: NotificationInboxItem[], status: NotificationFilterStatus) => {
  if (status === 'unread') {
    return rows.filter((item) => !item.read);
  }
  if (status === 'todo') {
    return rows.filter((item) => item.todo);
  }
  return rows;
};

const applyCategoryFilter = (rows: NotificationInboxItem[], categories?: NotificationCategory[]) => {
  if (!categories?.length) {
    return rows;
  }
  return rows.filter((item) => categories.includes(item.category));
};

export const createNotification = (payload: Omit<NotificationInboxItem, 'id' | 'userKey' | 'createdAt' | 'read' | 'readAt'> & {
  createdAt?: string;
  read?: boolean;
}) => {
  const item: NotificationInboxItem = {
    ...payload,
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    userKey: roleUserKey(payload.role),
    createdAt: payload.createdAt ?? dayjs().format('YYYY-MM-DD HH:mm'),
    read: payload.read ?? false,
  };
  notificationsState = [item, ...notificationsState];
  emitNotificationChange();
  return clone(item);
};

export const getNotificationPreferencesForRole = (role: NotificationRole) => clone(notificationPreferencesState[role]);

export const updateNotificationPreferencesForRole = (
  role: NotificationRole,
  patch: Partial<Omit<NotificationPreference, 'role' | 'updatedAt'>>,
) => {
  notificationPreferencesState = {
    ...notificationPreferencesState,
    [role]: {
      ...notificationPreferencesState[role],
      ...patch,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    },
  };
  emitNotificationChange();
  return clone(notificationPreferencesState[role]);
};

export const notificationMockApi = {
  getNotificationUnreadCount(role: NotificationRole) {
    const count = notificationsState.filter((item) => item.role === role && !item.read).length;
    return delay({ count });
  },

  getRecentNotifications(role: NotificationRole, limit = 8) {
    const items = sortByCreatedAtDesc(notificationsState.filter((item) => item.role === role)).slice(0, limit);
    return delay(clone(items));
  },

  getNotifications(query: NotificationListQuery): Promise<NotificationListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const baseRows = notificationsState.filter((item) => item.role === query.role);
    const rows = applyCategoryFilter(
      applyStatusFilter(sortByCreatedAtDesc(baseRows), query.status ?? 'all'),
      query.categories,
    );
    return delay({
      items: clone(rows.slice((page - 1) * pageSize, page * pageSize)),
      total: rows.length,
      page,
      pageSize,
    });
  },

  markNotificationRead(id: string) {
    notificationsState = notificationsState.map((item) =>
      item.id === id && !item.read
        ? { ...item, read: true, readAt: dayjs().format('YYYY-MM-DD HH:mm') }
        : item,
    );
    emitNotificationChange();
    return delay(clone(notificationsState.find((item) => item.id === id)));
  },

  markAllNotificationsRead(role: NotificationRole) {
    notificationsState = notificationsState.map((item) =>
      item.role === role && !item.read
        ? { ...item, read: true, readAt: dayjs().format('YYYY-MM-DD HH:mm') }
        : item,
    );
    emitNotificationChange();
    return delay({ success: true });
  },

  getNotificationPreferences(role: NotificationRole) {
    return delay(getNotificationPreferencesForRole(role));
  },

  updateNotificationPreferences(
    role: NotificationRole,
    patch: Partial<Omit<NotificationPreference, 'role' | 'updatedAt'>>,
  ) {
    return delay(updateNotificationPreferencesForRole(role, patch));
  },
};

export { NOTIFICATION_CHANGE_EVENT };
