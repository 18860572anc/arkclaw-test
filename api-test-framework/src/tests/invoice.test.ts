import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { orderApi, type CreateOrderRequest } from '../api/orderApi';
import { invoiceApi, type CreateInvoiceRequest } from '../api/invoiceApi';
import { logger } from '../utils/logger';

describe('发票管理接口测试', () => {
  let tenantId: string;
  let orderId: string;
  let createdInvoiceId: string;

  beforeAll(async () => {
    logger.info('=== 开始发票管理接口测试 ===');
    await authApi.login();
    
    const tenants = await tenantApi.listTenants(1, 1);
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    }
  });

  afterAll(async () => {
    if (createdInvoiceId) {
      try {
        await invoiceApi.cancelInvoice(createdInvoiceId, '测试清理');
        logger.info(`清理测试发票: ${createdInvoiceId}`);
      } catch (error) {
        logger.warn(`清理发票失败: ${error}`);
      }
    }
    if (orderId) {
      try {
        await orderApi.cancelOrder(orderId, '测试清理');
        logger.info(`清理测试订单: ${orderId}`);
      } catch (error) {
        logger.warn(`清理订单失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 发票管理接口测试完成 ===');
  });

  test('GET /api/invoices - 获取发票列表', async () => {
    const invoices = await invoiceApi.listInvoices(1, 10);
    expect(invoices).toBeDefined();
    expect(Array.isArray(invoices)).toBe(true);
    logger.info(`获取到 ${invoices.length} 张发票`);
  });

  test('POST /api/invoices - 创建发票申请', async () => {
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
        items: [{ name: '测试席位', quantity: 1, unitPrice: 1000 }],
      };
      const order = await orderApi.createOrder(request);
      orderId = order.id;
      await orderApi.confirmPayment(orderId, 1000);
    }

    const request: CreateInvoiceRequest = {
      orderId,
      type: 'vat',
      title: '测试企业有限公司',
      taxId: '91310000MA12345678',
      bankAccount: '6222021234567890123',
      bankName: '招商银行上海分行',
      address: '上海市浦东新区',
      phone: '021-12345678',
    };

    const invoice = await invoiceApi.createInvoice(request);
    expect(invoice).toBeDefined();
    expect(invoice.id).toBeDefined();
    expect(invoice.orderId).toBe(orderId);
    expect(invoice.status).toBe('pending');
    createdInvoiceId = invoice.id;
    logger.info(`创建发票申请成功: ${invoice.id}`);
  });

  test('POST /api/invoices/:id/approve - 审批发票', async () => {
    if (!createdInvoiceId) {
      const invoices = await invoiceApi.listInvoices(1, 1, 'pending');
      if (invoices.length > 0) {
        createdInvoiceId = invoices[0].id;
      }
    }

    const approvedInvoice = await invoiceApi.approveInvoice(createdInvoiceId);
    expect(approvedInvoice).toBeDefined();
    expect(approvedInvoice.status).toBe('approved');
    logger.info('审批发票成功');
  });

  test('POST /api/invoices/:id/issue - 开具发票', async () => {
    if (!createdInvoiceId) {
      const invoices = await invoiceApi.listInvoices(1, 1, 'approved');
      if (invoices.length > 0) {
        createdInvoiceId = invoices[0].id;
      }
    }

    const issuedInvoice = await invoiceApi.issueInvoice(createdInvoiceId);
    expect(issuedInvoice).toBeDefined();
    expect(issuedInvoice.status).toBe('issued');
    expect(issuedInvoice.issuedAt).toBeDefined();
    logger.info('开具发票成功');
  });
});
