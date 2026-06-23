import { orderApi } from '../api/orderApi';
import { tenantApi } from '../api/tenantApi';
import { logger } from '../utils/logger';

describe('Mock API Tests', () => {
  describe('/api/tenants 接口测试', () => {
    test('GET /api/tenants - 列表查询', async () => {
      logger.info('测试 GET /api/tenants');
      const tenants = await tenantApi.listTenants(1, 10);
      expect(tenants).toBeDefined();
      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBeGreaterThan(0);
      logger.info(`获取到 ${tenants.length} 个企业`);
    });

    test('GET /api/tenants/:id - 详情查询', async () => {
      logger.info('测试 GET /api/tenants/:id');
      const tenant = await tenantApi.getTenant('tenant-001');
      expect(tenant).toBeDefined();
      expect(tenant.id).toBe('tenant-001');
      expect(tenant.name).toBe('测试企业有限公司');
      logger.info(`获取企业详情: ${tenant.name}`);
    });

    test('POST /api/tenants - 创建企业', async () => {
      logger.info('测试 POST /api/tenants');
      const newTenant = await tenantApi.createTenant({
        name: '新测试企业',
        uscc: '91310101MA1G899999',
        adminName: '测试管理员',
        adminEmail: 'test@example.com',
        adminPhone: '13800138000'
      });
      expect(newTenant).toBeDefined();
      expect(newTenant.id).toBeDefined();
      expect(newTenant.status).toBe('pending');
      logger.info(`创建企业成功: ${newTenant.id}`);
    });
  });

  describe('/api/orders 接口测试', () => {
    test('GET /api/orders - 列表查询', async () => {
      logger.info('测试 GET /api/orders');
      const orders = await orderApi.listOrders(1, 10);
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      logger.info(`获取到 ${orders.length} 个订单`);
    });

    test('GET /api/orders - 按状态筛选', async () => {
      logger.info('测试 GET /api/orders?status=paid');
      const orders = await orderApi.listOrders(1, 10, 'paid');
      expect(orders).toBeDefined();
      orders.forEach(order => {
        expect(order.status).toBe('paid');
      });
      logger.info(`获取到 ${orders.length} 个已支付订单`);
    });

    test('GET /api/orders/:id - 详情查询', async () => {
      logger.info('测试 GET /api/orders/:id');
      const order = await orderApi.getOrder('order-001');
      expect(order).toBeDefined();
      expect(order.id).toBe('order-001');
      expect(order.tenantId).toBe('tenant-001');
      logger.info(`获取订单详情: ${order.id}, 金额: ${order.totalAmount}`);
    });

    test('POST /api/orders - 创建订单', async () => {
      logger.info('测试 POST /api/orders');
      const newOrder = await orderApi.createOrder({
        tenantId: 'tenant-001',
        type: 'seat',
        paymentMethod: 'bank_transfer',
        items: [
          { name: '测试席位', quantity: 5, unitPrice: 1000 }
        ]
      });
      expect(newOrder).toBeDefined();
      expect(newOrder.id).toBeDefined();
      expect(newOrder.status).toBe('pending');
      expect(newOrder.totalAmount).toBe(5000);
      logger.info(`创建订单成功: ${newOrder.id}`);
    });

    test('POST /api/orders/:id/confirm-payment - 确认支付', async () => {
      logger.info('测试 POST /api/orders/:id/confirm-payment');
      const order = await orderApi.confirmPayment('order-003', 5000);
      expect(order).toBeDefined();
      expect(order.status).toBe('confirmed');
      expect(order.paidAmount).toBe(5000);
      logger.info(`确认支付成功: ${order.id}`);
    });

    test('POST /api/orders/:id/activate - 开通服务', async () => {
      logger.info('测试 POST /api/orders/:id/activate');
      // 先确认支付
      await orderApi.confirmPayment('order-004', 3000);
      const order = await orderApi.activateOrder('order-004');
      expect(order).toBeDefined();
      expect(order.status).toBe('activated');
      logger.info(`服务开通成功: ${order.id}`);
    });

    test('边界值测试 - 负数金额应报错', async () => {
      logger.info('测试边界值 - 负数金额');
      try {
        await orderApi.confirmPayment('order-001', -100);
        expect(true).toBe(false); // 应该抛出错误
      } catch (error: any) {
        expect(error.response?.data?.code).toBe(400);
        logger.info('负数金额测试通过，正确返回400错误');
      }
    });

    test('边界值测试 - 超额金额应报错', async () => {
      logger.info('测试边界值 - 超额金额');
      try {
        // 订单金额为5000，尝试支付8000（超过150%）
        await orderApi.confirmPayment('order-003', 8000);
        expect(true).toBe(false); // 应该抛出错误
      } catch (error: any) {
        expect(error.response?.data?.code).toBe(400);
        logger.info('超额金额测试通过，正确返回400错误');
      }
    });
  });
});
