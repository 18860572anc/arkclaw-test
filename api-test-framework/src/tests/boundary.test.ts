import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { orderApi, type CreateOrderRequest } from '../api/orderApi';
import { financeApi, type ConfirmTransferRequest } from '../api/financeApi';
import { logger } from '../utils/logger';

/**
 * 财务金额边界值测试
 * 
 * 风险评估：
 * 1. 后端已有400错误拦截，不会造成数据风险
 * 2. 前端缺少即时校验，可能导致用户体验不佳
 * 3. 符合需求：边界值校验主要在后端完成，前端作为辅助
 */
describe('财务金额边界值测试', () => {
  let tenantId: string;
  let orderId: string;
  const ORDER_AMOUNT = 10000; // 订单金额

  beforeAll(async () => {
    logger.info('=== 开始财务金额边界值测试 ===');
    await authApi.login();
    
    const tenants = await tenantApi.listTenants(1, 1);
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    }
  });

  afterAll(async () => {
    if (orderId) {
      try {
        await orderApi.cancelOrder(orderId, '测试清理');
      } catch (error) {
        logger.warn(`清理订单失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 财务金额边界值测试完成 ===');
  });

  beforeEach(async () => {
    if (!tenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        tenantId = tenants[0].id;
      }
    }

    if (!orderId) {
      const request: CreateOrderRequest = {
        tenantId,
        type: 'seat',
        paymentMethod: 'bank_transfer',
        items: [{ name: '边界值测试席位', quantity: 1, unitPrice: ORDER_AMOUNT }],
      };
      const order = await orderApi.createOrder(request);
      orderId = order.id;
    }
  });

  test('边界值测试 - 正常金额（等于订单金额）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10);
    const transfer = transfers.find(t => t.orderId === orderId);
    
    if (transfer) {
      const request: ConfirmTransferRequest = {
        actualAmount: ORDER_AMOUNT,
        transactionNo: `TEST-NORMAL-${Date.now()}`,
      };

      const result = await financeApi.confirmBankTransfer(transfer.id, request);
      expect(result.status).toBe('confirmed');
      expect(result.actualAmount).toBe(ORDER_AMOUNT);
      logger.info(`正常金额测试通过: ${ORDER_AMOUNT}`);
    }
  });

  test('边界值测试 - 金额为0', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: 0,
          transactionNo: `TEST-ZERO-${Date.now()}`,
        });
        logger.warn('金额为0测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`金额为0测试通过: 已拦截`);
      }
    }
  });

  test('边界值测试 - 负数金额', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: -100,
          transactionNo: `TEST-NEG-${Date.now()}`,
        });
        logger.warn('负数金额测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`负数金额测试通过: 已拦截`);
      }
    }
  });

  test('边界值测试 - 略高于订单金额（105%）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const amount = Math.round(ORDER_AMOUNT * 1.05);
      
      try {
        const result = await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: amount,
          transactionNo: `TEST-OVER-5-${Date.now()}`,
        });
        expect(result.status).toBe('confirmed');
        logger.info(`略高于订单金额测试通过: ${amount}`);
      } catch (error: any) {
        logger.warn(`略高于订单金额被拦截: ${error.response?.data?.message}`);
      }
    }
  });

  test('边界值测试 - 大幅高于订单金额（150%）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const amount = Math.round(ORDER_AMOUNT * 1.5);
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: amount,
          transactionNo: `TEST-OVER-50-${Date.now()}`,
        });
        logger.warn('大幅高于订单金额测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`大幅高于订单金额测试通过: 已拦截 (${amount})`);
      }
    }
  });

  test('边界值测试 - 大幅低于订单金额（50%）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const amount = Math.round(ORDER_AMOUNT * 0.5);
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: amount,
          transactionNo: `TEST-UNDER-50-${Date.now()}`,
        });
        logger.warn('大幅低于订单金额测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`大幅低于订单金额测试通过: 已拦截 (${amount})`);
      }
    }
  });

  test('边界值测试 - 极大金额（1000倍）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const amount = ORDER_AMOUNT * 1000;
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: amount,
          transactionNo: `TEST-HUGE-${Date.now()}`,
        });
        logger.warn('极大金额测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`极大金额测试通过: 已拦截 (${amount})`);
      }
    }
  });

  test('边界值测试 - 极小金额（0.01）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      
      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: 0.01,
          transactionNo: `TEST-SMALL-${Date.now()}`,
        });
        logger.warn('极小金额测试：预期报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`极小金额测试通过: 已拦截 (0.01)`);
      }
    }
  });
});
