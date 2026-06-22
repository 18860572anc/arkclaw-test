import { authApi } from '../api/authApi';
import { notificationApi } from '../api/notificationApi';
import { logger } from '../utils/logger';

describe('通知中心接口测试', () => {
  beforeAll(async () => {
    logger.info('=== 开始通知中心接口测试 ===');
    await authApi.login();
  });

  afterAll(async () => {
    await authApi.logout();
    logger.info('=== 通知中心接口测试完成 ===');
  });

  test('GET /api/notifications - 获取通知列表', async () => {
    const notifications = await notificationApi.listNotifications(undefined, 1, 10);
    expect(notifications).toBeDefined();
    expect(Array.isArray(notifications)).toBe(true);
    logger.info(`获取到 ${notifications.length} 条通知`);
  });

  test('GET /api/notifications - 获取未读通知', async () => {
    const notifications = await notificationApi.listNotifications({ status: 'unread' }, 1, 10);
    expect(notifications).toBeDefined();
    notifications.forEach(n => expect(n.status).toBe('unread'));
    logger.info(`获取到 ${notifications.length} 条未读通知`);
  });

  test('GET /api/notifications/unread-count - 获取未读数量', async () => {
    const count = await notificationApi.getUnreadCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
    logger.info(`未读通知数量: ${count}`);
  });

  test('POST /api/notifications/:id/read - 标记为已读', async () => {
    const notifications = await notificationApi.listNotifications({ status: 'unread' }, 1, 5);
    if (notifications.length > 0) {
      const notification = notifications[0];
      const result = await notificationApi.markAsRead(notification.id);
      expect(result.status).toBe('read');
      logger.info(`标记通知为已读: ${notification.id}`);
    } else {
      logger.warn('未找到未读通知，跳过测试');
    }
  });

  test('POST /api/notifications/read-all - 标记全部已读', async () => {
    await notificationApi.markAllAsRead();
    const count = await notificationApi.getUnreadCount();
    expect(count).toBe(0);
    logger.info('标记全部通知为已读');
  });
});
