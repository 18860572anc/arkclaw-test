import { authApi } from '../api/authApi';
import { tenantApi, type CreateTenantRequest } from '../api/tenantApi';
import { orderApi, type CreateOrderRequest } from '../api/orderApi';
import { financeApi, type ConfirmTransferRequest } from '../api/financeApi';
import { invoiceApi, type CreateInvoiceRequest } from '../api/invoiceApi';
import { getEnvConfig } from '../config/env';
import { logger } from '../utils/logger';

describe('镜像站接口测试', () => {
  const envConfig = getEnvConfig();
  let tenantId: string;
  let orderId: string;

  beforeAll(async () => {
    logger.info('=== 开始镜像站接口测试 ===');
    logger.info(`测试环境: ${envConfig.baseUrl}`);
    await authApi.login();
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
    logger.info('=== 镜像站接口测试完成 ===');
  });

  test('镜像站 - 创建企业客户', async () => {
    const request: CreateTenantRequest = {
      name: `镜像站测试企业_${Date.now()}`,
      uscc: `91310000MB${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      adminName: '镜像站管理员',
      adminEmail: `mirror_${Date.now()}@example.com`,
      adminPhone: '13900139000',
    };

    const tenant = await tenantApi.createTenant(request);
    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.status).toBe('pending');
    tenantId = tenant.id;
    logger.info(`镜像站创建企业成功: ${tenant.id}`);
  });

  test('镜像站 - 创建对公转账订单', async () => {
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
        { name: '镜像站标准席位', quantity: 20, unitPrice: 1980 },
      ],
    };

    const order = await orderApi.createOrder(request);
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.paymentMethod).toBe('bank_transfer');
    expect(order.totalAmount).toBe(39600);
    orderId = order.id;
    logger.info(`镜像站创建订单成功: ${order.id}, 金额: ${order.totalAmount}`);
  });

  test('镜像站 - 财务确认到账', async () => {
    const transfers = await financeApi.listBankTransfers(1, 10);
    const transfer = transfers.find(t => t.orderId === orderId);
    
    if (transfer) {
      const confirmRequest: ConfirmTransferRequest = {
        actualAmount: transfer.orderAmount,
        bankName: '中国工商银行',
        transactionNo: `MIRROR-${Date.now()}`,
      };

      const confirmedTransfer = await financeApi.confirmBankTransfer(transfer.id, confirmRequest);
      expect(confirmedTransfer.status).toBe('confirmed');
      expect(confirmedTransfer.confirmedAt).toBeDefined();
      logger.info(`镜像站确认到账成功: ${transfer.id}`);
    } else {
      logger.warn('未找到对应的对公转账记录');
    }
  });

  test('镜像站 - 申请发票', async () => {
    if (!orderId) {
      const orders = await orderApi.listOrders(1, 1);
      if (orders.length > 0) {
        orderId = orders[0].id;
      }
    }

    const request: CreateInvoiceRequest = {
      orderId,
      type: 'special_vat',
      title: '镜像站测试企业有限公司',
      taxId: '91310000MB12345678',
      bankAccount: '9558801234567890123',
      bankName: '中国工商银行上海分行',
    };

    const invoice = await invoiceApi.createInvoice(request);
    expect(invoice).toBeDefined();
    expect(invoice.type).toBe('special_vat');
    logger.info(`镜像站申请发票成功: ${invoice.id}`);
  });

  test('镜像站 - 激活订单', async () => {
    if (!orderId) {
      const orders = await orderApi.listOrders(1, 1, 'confirmed');
      if (orders.length > 0) {
        orderId = orders[0].id;
      }
    }

    const activatedOrder = await orderApi.activateOrder(orderId);
    expect(activatedOrder).toBeDefined();
    expect(activatedOrder.status).toBe('activated');
    logger.info(`镜像站激活订单成功: ${orderId}`);
  });
});
