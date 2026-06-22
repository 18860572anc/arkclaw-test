import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { orderApi, type CreateOrderRequest } from '../api/orderApi';
import { logger } from '../utils/logger';

describe('订单管理接口测试', () => {
  let tenantId: string;
  let createdOrderId: string;

  beforeAll(async () => {
    logger.info('=== 开始订单管理接口测试 ===');
    await authApi.login();
    
    const tenants = await tenantApi.listTenants(1, 1);
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    }
  });

  afterAll(async () => {
    if (createdOrderId) {
      try {
        await orderApi.cancelOrder(createdOrderId, '测试清理');
        logger.info(`清理测试订单: ${createdOrderId}`);
      } catch (error) {
        logger.warn(`清理订单失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 订单管理接口测试完成 ===');
  });

  test('GET /api/orders - 获取订单列表', async () => {
    const orders = await orderApi.listOrders(1, 10);
    expect(orders).toBeDefined();
    expect(Array.isArray(orders)).toBe(true);
    logger.info(`获取到 ${orders.length} 个订单`);
  });

  test('POST /api/orders - 创建订单', async () => {
    if (!tenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        tenantId = tenants[0].id;
      }
    }

    const request: CreateOrderRequest = {
      tenantId,
      type: 'seat',
      paymentMethod: 'bank_transfer',
      items: [
        {
          name: '标准席位',
          quantity: 10,
          unitPrice: 2180,
        },
      ],
    };

    const order = await orderApi.createOrder(request);
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.tenantId).toBe(tenantId);
    expect(order.status).toBe('pending');
    expect(order.totalAmount).toBe(21800);
    createdOrderId = order.id;
    logger.info(`创建订单成功: ${order.id}`);
  });

  test('POST /api/orders/:id/confirm-payment - 确认支付（正常金额）', async () => {
    if (!createdOrderId) {
      const orders = await orderApi.listOrders(1, 1, 'pending');
      if (orders.length > 0) {
        createdOrderId = orders[0].id;
      }
    }

    const order = await orderApi.getOrder(createdOrderId);
    const confirmedOrder = await orderApi.confirmPayment(createdOrderId, order.totalAmount);
    expect(confirmedOrder).toBeDefined();
    expect(confirmedOrder.status).toBe('confirmed');
    expect(confirmedOrder.paidAmount).toBe(order.totalAmount);
    logger.info('确认支付成功（正常金额）');
  });

  test('POST /api/orders/:id/confirm-payment - 确认支付（超出金额限制应报错）', async () => {
    if (!createdOrderId) {
      const orders = await orderApi.listOrders(1, 1, 'pending');
      if (orders.length > 0) {
        createdOrderId = orders[0].id;
      }
    }

    const order = await orderApi.getOrder(createdOrderId);
    const excessiveAmount = order.totalAmount * 1.5;

    try {
      await orderApi.confirmPayment(createdOrderId, excessiveAmount);
      logger.warn('预期应该报错但未报错');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      logger.info(`确认支付失败（超出金额限制）: ${error.response?.data?.message || error.message}`);
    }
  });

  test('POST /api/orders/:id/cancel - 取消订单', async () => {
    if (!createdOrderId) {
      const orders = await orderApi.listOrders(1, 1, 'pending');
      if (orders.length > 0) {
        createdOrderId = orders[0].id;
      }
    }

    const cancelledOrder = await orderApi.cancelOrder(createdOrderId, '测试取消');
    expect(cancelledOrder).toBeDefined();
    expect(cancelledOrder.status).toBe('cancelled');
    logger.info('取消订单成功');
  });
});
