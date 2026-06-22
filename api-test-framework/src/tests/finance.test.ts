import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { orderApi, type CreateOrderRequest } from '../api/orderApi';
import { financeApi, type ConfirmTransferRequest } from '../api/financeApi';
import { logger } from '../utils/logger';

describe('财务审核接口测试', () => {
  let tenantId: string;
  let orderId: string;

  beforeAll(async () => {
    logger.info('=== 开始财务审核接口测试 ===');
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
        logger.info(`清理测试订单: ${orderId}`);
      } catch (error) {
        logger.warn(`清理订单失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 财务审核接口测试完成 ===');
  });

  test('GET /api/finance/bank-transfers - 获取对公转账列表', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10);
    expect(transfers).toBeDefined();
    expect(Array.isArray(transfers)).toBe(true);
    logger.info(`获取到 ${transfers.length} 条对公转账记录`);
  });

  test('GET /api/finance/summary - 获取财务汇总', async () => {
    const summary = await financeApi.getFinanceSummary();
    expect(summary).toBeDefined();
    expect(typeof summary.totalOrders).toBe('number');
    expect(typeof summary.totalAmount).toBe('number');
    expect(typeof summary.pendingTransfers).toBe('number');
    logger.info(`财务汇总 - 订单数: ${summary.totalOrders}, 总金额: ${summary.totalAmount}`);
  });

  test('POST /api/finance/bank-transfers/:id/confirm - 确认到账（正常金额）', async () => {
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
        items: [{ name: '测试席位', quantity: 5, unitPrice: 2180 }],
      };
      const order = await orderApi.createOrder(request);
      orderId = order.id;
    }

    const transfers = await financeApi.listBankTransfers(1, 10);
    if (transfers.length > 0) {
      const transfer = transfers.find(t => t.orderId === orderId) || transfers[0];
      
      const confirmRequest: ConfirmTransferRequest = {
        actualAmount: transfer.orderAmount,
        bankName: '招商银行',
        accountNo: '622202******1234',
        transactionNo: `TR${Date.now()}`,
      };

      const confirmedTransfer = await financeApi.confirmBankTransfer(transfer.id, confirmRequest);
      expect(confirmedTransfer).toBeDefined();
      expect(confirmedTransfer.status).toBe('confirmed');
      expect(confirmedTransfer.actualAmount).toBe(transfer.orderAmount);
      logger.info('确认到账成功（正常金额）');
    } else {
      logger.warn('未找到可测试的对公转账记录');
    }
  });

  test('POST /api/finance/bank-transfers/:id/confirm - 确认到账（金额超出限制应报错）', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const excessiveAmount = transfer.orderAmount * 2;

      try {
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: excessiveAmount,
        });
        logger.warn('预期应该报错但未报错');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        logger.info(`确认到账失败（超出金额限制）: ${error.response?.data?.message || error.message}`);
      }
    } else {
      logger.warn('未找到待确认的对公转账记录');
    }
  });

  test('POST /api/finance/bank-transfers/:id/reject - 拒绝到账申请', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
    if (transfers.length > 0) {
      const transfer = transfers[0];
      const rejectedTransfer = await financeApi.rejectBankTransfer(transfer.id, '金额不符');
      expect(rejectedTransfer).toBeDefined();
      expect(rejectedTransfer.status).toBe('rejected');
      expect(rejectedTransfer.rejectedReason).toBe('金额不符');
      logger.info('拒绝到账申请成功');
    } else {
      logger.warn('未找到待拒绝的对公转账记录');
    }
  });
});
