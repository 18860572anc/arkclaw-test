import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { opsApi, type CreateOpsTicketRequest } from '../api/opsApi';
import { logger } from '../utils/logger';

describe('运维工单接口测试', () => {
  let tenantId: string;
  let createdTicketId: string;

  beforeAll(async () => {
    logger.info('=== 开始运维工单接口测试 ===');
    await authApi.login();
    
    const tenants = await tenantApi.listTenants(1, 1);
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    }
  });

  afterAll(async () => {
    if (createdTicketId) {
      try {
        await opsApi.completeTicket(createdTicketId, '测试完成');
        logger.info(`完成测试工单: ${createdTicketId}`);
      } catch (error) {
        logger.warn(`完成工单失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 运维工单接口测试完成 ===');
  });

  test('GET /api/ops/tickets - 获取工单列表', async () => {
    const tickets = await opsApi.listTickets(1, 10);
    expect(tickets).toBeDefined();
    expect(Array.isArray(tickets)).toBe(true);
    logger.info(`获取到 ${tickets.length} 个工单`);
  });

  test('POST /api/ops/tickets - 创建工单', async () => {
    if (!tenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        tenantId = tenants[0].id;
      }
    }

    const request: CreateOpsTicketRequest = {
      type: 'activation',
      tenantId,
      title: '测试开通工单',
      description: '测试企业开通请求',
      priority: 'medium',
    };

    const ticket = await opsApi.createTicket(request);
    expect(ticket).toBeDefined();
    expect(ticket.id).toBeDefined();
    expect(ticket.type).toBe('activation');
    expect(ticket.status).toBe('pending');
    createdTicketId = ticket.id;
    logger.info(`创建工单成功: ${ticket.id}`);
  });

  test('POST /api/ops/tickets/:id/process - 处理工单', async () => {
    if (!createdTicketId) {
      const tickets = await opsApi.listTickets(1, 1, 'pending');
      if (tickets.length > 0) {
        createdTicketId = tickets[0].id;
      }
    }

    const processedTicket = await opsApi.processTicket(createdTicketId, '运维人员');
    expect(processedTicket.status).toBe('processing');
    expect(processedTicket.assignee).toBe('运维人员');
    logger.info(`处理工单成功: ${createdTicketId}`);
  });

  test('POST /api/ops/tickets/:id/complete - 完成工单', async () => {
    if (!createdTicketId) {
      const tickets = await opsApi.listTickets(1, 1, 'processing');
      if (tickets.length > 0) {
        createdTicketId = tickets[0].id;
      }
    }

    const completedTicket = await opsApi.completeTicket(createdTicketId, '测试完成');
    expect(completedTicket.status).toBe('completed');
    expect(completedTicket.completedAt).toBeDefined();
    logger.info(`完成工单成功: ${createdTicketId}`);
  });

  test('GET /api/ops/bindings - 获取绑定列表', async () => {
    const bindings = await opsApi.listBindings();
    expect(bindings).toBeDefined();
    expect(Array.isArray(bindings)).toBe(true);
    logger.info(`获取到 ${bindings.length} 个绑定`);
  });
});
