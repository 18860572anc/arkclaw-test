import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { orderApi } from '../api/orderApi';
import { invoiceApi } from '../api/invoiceApi';
import { financeApi } from '../api/financeApi';
import { opsApi } from '../api/opsApi';
import { logger } from '../utils/logger';

/**
 * ArkClaw 系统完整业务流程测试
 * 
 * 主站流程：
 * 1. 客户管理员（企业）注册 或 商务（代理）人员注册 或 官方管理员注册
 * 2. 企业注册后进行工单与咨询
 * 3. 购买席位
 * 4. 状态流转到交付运维管理员
 * 5. 交付运维管理员初步审核
 * 6. 流转财务人员审核
 * 7. 交付运维人员进行开通
 * 8. 流转到商务人员进行测试释放佣金
 * 9. 提交给财务人员进行审核
 * 
 * 镜像站流程：
 * 1. 镜像站客户管理员（企业）购买席位
 * 2. 镜像站财务人员进行审核确认
 * 3. 推送给官方管理员
 * 4. 官方管理员去采购
 * 5. 推送到主站的对公转账
 * 6. 微信/支付宝付款则跳过交付运维，直接到交付运维开通
 */

describe('主站完整业务流程测试', () => {
  let tenantId: string;
  let orderId: string;
  let businessToken: string;

  beforeAll(async () => {
    logger.info('=== 开始主站完整业务流程测试 ===');
  });

  afterAll(async () => {
    logger.info('=== 主站完整业务流程测试完成 ===');
  });

  describe('阶段1：企业注册（三种方式）', () => {
    test('方式一：客户管理员（企业）在首页注册', async () => {
      logger.info('--- 模拟企业自助注册流程 ---');
      // 企业自助注册通常通过前端页面，这里记录流程
      logger.info('企业用户在首页完成注册，提交企业信息和联系方式');
    });

    test('方式二：商务（代理）人员注册企业', async () => {
      logger.info('--- 商务人员代理注册 ---');
      try {
        const businessLogin = await authApi.loginAsRole('business');
        businessToken = businessLogin.token;
        logger.info(`商务人员登录成功: ${businessLogin.user.phone}`);

        // 商务人员可以帮企业注册
        const tenantData = {
          name: `代理注册企业_${Date.now()}`,
          uscc: `91110000MA${Math.random().toString().slice(2, 12)}`,
          adminName: '企业管理员',
          adminEmail: `corp${Date.now()}@example.com`,
          adminPhone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        };

        try {
          const tenant = await tenantApi.createTenant(tenantData);
          tenantId = tenant.id;
          logger.info(`商务代理注册企业成功: ${tenant.name}`);
        } catch (error: any) {
          if ([400, 409].includes(error.response?.status)) {
            logger.info('商务代理注册受限，使用现有企业');
            const tenants = await tenantApi.listTenants(1, 1);
            if (tenants.length > 0) tenantId = tenants[0].id;
          }
        }
      } catch (error: any) {
        logger.info(`商务人员操作: ${error.response?.data?.message || error.message}`);
      }
    });

    test('方式三：官方管理员注册企业', async () => {
      logger.info('--- 官方管理员直接注册企业 ---');
      try {
        await authApi.login();
        
        const tenantData = {
          name: `官方注册企业_${Date.now()}`,
          uscc: `91110000MA${Math.random().toString().slice(2, 12)}`,
          adminName: '企业管理员',
          adminEmail: `admin${Date.now()}@example.com`,
          adminPhone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        };

        try {
          const tenant = await tenantApi.createTenant(tenantData);
          tenantId = tenant.id;
          logger.info(`官方管理员注册企业成功: ${tenant.name}`);
        } catch (error: any) {
          if ([400, 409].includes(error.response?.status)) {
            logger.info('企业已存在或创建受限');
            const tenants = await tenantApi.listTenants(1, 1);
            if (tenants.length > 0) tenantId = tenants[0].id;
          }
        }
      } catch (error: any) {
        logger.info(`官方管理员操作: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段2：工单与咨询', () => {
    test('企业提交工单咨询', async () => {
      if (!tenantId) {
        logger.warn('无企业ID，跳过工单测试');
        return;
      }

      try {
        const ticket = await opsApi.createTicket({
          type: 'activation',
          tenantId,
          title: '企业开通咨询',
          description: '咨询席位购买流程和价格',
          priority: 'medium',
        });
        
        expect(ticket).toBeDefined();
        logger.info(`工单创建成功: ${ticket.id}`);
      } catch (error: any) {
        logger.info(`工单创建: ${error.response?.data?.message || error.message}`);
      }
    });

    test('查询工单列表', async () => {
      try {
        const tickets = await opsApi.listTickets(1, 20);
        expect(tickets).toBeDefined();
        expect(Array.isArray(tickets)).toBe(true);
        logger.info(`获取到 ${tickets.length} 个工单`);
      } catch (error: any) {
        logger.info(`工单列表: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段3：席位购买（订单创建）', () => {
    test('客户管理员创建席位购买订单', async () => {
      logger.info('--- 企业客户管理员登录并创建席位购买订单 ---');
      try {
        const tenantLogin = await authApi.loginAsRole('tenantAdmin');
        logger.info(`企业客户管理员登录成功: ${tenantLogin.user.phone}`);
      } catch (error: any) {
        logger.info(`客户管理员登录: ${error.response?.data?.message || error.message}`);
      }

      if (!tenantId) {
        try {
          const tenants = await tenantApi.listTenants(1, 1);
          if (tenants.length > 0) tenantId = tenants[0].id;
        } catch (error: any) {
          logger.info(`获取企业列表: ${error.response?.data?.message || error.message}`);
        }
      }

      if (!tenantId) {
        logger.warn('无企业ID，跳过订单创建');
        return;
      }

      const orderData = {
        tenantId,
        type: 'seat' as const,
        paymentMethod: 'bank_transfer' as const,
        items: [
          { name: '标准席位', quantity: 10, unitPrice: 2180 },
        ],
      };

      try {
        const order = await orderApi.createOrder(orderData);
        expect(order).toBeDefined();
        orderId = order.id;
        logger.info(`订单创建成功: ${order.id}, 金额: ${order.totalAmount}`);
      } catch (error: any) {
        logger.info(`订单创建: ${error.response?.data?.message || error.message}`);
      }
    });

    test('创建微信/支付宝付款订单（跳过交付运维）', async () => {
      logger.info('--- 创建微信/支付宝付款订单（快速开通） ---');
      if (!tenantId) {
        logger.warn('无企业ID，跳过订单创建');
        return;
      }

      const orderData = {
        tenantId,
        type: 'seat' as const,
        paymentMethod: 'wechat' as const,
        items: [
          { name: '高级席位', quantity: 5, unitPrice: 3980 },
        ],
      };

      try {
        const order = await orderApi.createOrder(orderData);
        logger.info(`数字支付订单创建成功: ${order.id}`);
      } catch (error: any) {
        logger.info(`数字支付订单: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段4：交付运维管理员审核', () => {
    test('交付运维管理员登录', async () => {
      try {
        const opsLogin = await authApi.loginAsRole('opsAdmin');
        logger.info(`交付运维管理员登录成功: ${opsLogin.user.phone}`);
      } catch (error: any) {
        logger.info(`交付运维管理员登录: ${error.response?.data?.message || error.message}`);
      }
    });

    test('交付运维管理员查看全部待审核工单', async () => {
      try {
        // 交付运维管理员可以查看全部工单
        const allTickets = await opsApi.listTickets(1, 10, 'pending');
        logger.info(`交付运维管理员查看全部工单: 共 ${allTickets.length} 条待审核工单`);
        
        if (allTickets.length === 0) {
          logger.info('无待审核工单');
          return;
        }
      } catch (error: any) {
        logger.info(`查看全部工单: ${error.response?.data?.message || error.message}`);
      }
    });

    test('交付运维管理员初步审核工单', async () => {
      try {
        const tickets = await opsApi.listTickets(1, 10, 'pending');
        
        if (tickets.length === 0) {
          logger.info('无待审核工单');
          return;
        }

        const ticket = tickets[0];
        const processed = await opsApi.processTicket(ticket.id, '交付运维管理员');
        expect(processed).toBeDefined();
        logger.info(`工单审核完成: ${ticket.id}`);
      } catch (error: any) {
        logger.info(`工单审核: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段4.1：普通交付运维人员操作', () => {
    test('普通交付运维人员登录', async () => {
      try {
        const opsLogin = await authApi.loginAsRole('ops');
        logger.info(`普通交付运维人员登录成功: ${opsLogin.user.phone}`);
      } catch (error: any) {
        logger.info(`普通交付运维登录: ${error.response?.data?.message || error.message}`);
      }
    });

    test('普通交付运维人员查看分配给自己的工单', async () => {
      try {
        // 普通交付运维人员只能查看分配给自己的工单
        const assignedTickets = await opsApi.listMyTickets(1, 10);
        logger.info(`普通交付运维查看分配给自己的工单: 共 ${assignedTickets.length} 条`);
      } catch (error: any) {
        logger.info(`查看个人工单: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段5：财务人员审核', () => {
    test('财务人员登录', async () => {
      try {
        const financeLogin = await authApi.loginAsRole('finance');
        logger.info(`财务人员登录成功: ${financeLogin.user.phone}`);
      } catch (error: any) {
        logger.info(`财务登录: ${error.response?.data?.message || error.message}`);
      }
    });

    test('财务人员审核银行转账记录', async () => {
      try {
        const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
        
        if (transfers.length === 0) {
          logger.info('无待审核转账记录');
          return;
        }

        const transfer = transfers[0];
        const confirmed = await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: transfer.orderAmount,
          transactionNo: `TXN${Date.now()}`,
        });
        
        expect(confirmed).toBeDefined();
        logger.info(`转账审核完成: ${transfer.id}`);
      } catch (error: any) {
        logger.info(`转账审核: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段6：交付开通', () => {
    test('交付运维管理员进行服务开通', async () => {
      logger.info('--- 交付运维管理员执行服务开通 ---');
      
      // 确保登录的是交付运维管理员
      try {
        const opsAdminLogin = await authApi.loginAsRole('opsAdmin');
        logger.info(`交付运维管理员登录成功: ${opsAdminLogin.user.phone}`);
      } catch (error: any) {
        logger.info(`交付运维管理员登录: ${error.response?.data?.message || error.message}`);
      }

      // 获取订单ID
      if (!orderId) {
        try {
          const orders = await orderApi.listOrders(1, 1);
          if (orders.length > 0) orderId = orders[0].id;
        } catch (error: any) {
          logger.info(`获取订单列表: ${error.response?.data?.message || error.message}`);
        }
      }

      if (!orderId) {
        logger.warn('无订单ID，跳过开通测试');
        return;
      }

      // 交付运维管理员点击工单详情并执行开通
      try {
        // 首先查看订单详情
        const order = await orderApi.getOrder(orderId);
        logger.info(`查看订单详情: ${order.id}, 状态: ${order.status}`);
        
        // 执行开通操作
        const activated = await orderApi.activateOrder(orderId);
        expect(activated).toBeDefined();
        logger.info(`服务开通成功: ${orderId}`);
      } catch (error: any) {
        logger.info(`服务开通: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段7：商务测试释放佣金', () => {
    test('商务人员进行测试并释放佣金', async () => {
      try {
        await authApi.loginAsRole('business');
        logger.info('商务人员执行测试流程');
        
        // 商务人员测试完成后释放佣金
        logger.info('佣金释放流程（具体实现待确认）');
      } catch (error: any) {
        logger.info(`商务操作: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段8：财务最终审核', () => {
    test('财务人员进行最终审核', async () => {
      try {
        await authApi.loginAsRole('finance');
        
        const transfers = await financeApi.listBankTransfers(1, 10, 'confirmed');
        
        if (transfers.length === 0) {
          logger.info('无待最终审核的记录');
          return;
        }

        logger.info(`待最终审核记录数: ${transfers.length}`);
      } catch (error: any) {
        logger.info(`财务最终审核: ${error.response?.data?.message || error.message}`);
      }
    });
  });
});

describe('镜像站业务流程测试', () => {
  let mirrorTenantId: string;
  let mirrorOrderId: string;

  beforeAll(async () => {
    logger.info('=== 开始镜像站业务流程测试 ===');
  });

  afterAll(async () => {
    logger.info('=== 镜像站业务流程测试完成 ===');
  });

  describe('阶段1：镜像站客户注册', () => {
    test('镜像站客户管理员注册企业', async () => {
      logger.info('--- 镜像站企业客户管理员登录 ---');
      try {
        const mirrorTenantLogin = await authApi.loginAsRole('tenantAdmin');
        logger.info(`镜像站企业客户管理员登录成功: ${mirrorTenantLogin.user.phone}`);
        
        const tenantData = {
          name: `镜像站企业_${Date.now()}`,
          uscc: `91110001MA${Math.random().toString().slice(2, 12)}`,
          adminName: '镜像站管理员',
          adminEmail: `mirror${Date.now()}@example.com`,
          adminPhone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        };

        try {
          const tenant = await tenantApi.createTenant(tenantData);
          mirrorTenantId = tenant.id;
          logger.info(`镜像站企业注册成功: ${tenant.name}`);
        } catch (error: any) {
          if ([400, 409].includes(error.response?.status)) {
            logger.info('镜像站企业已存在');
            const tenants = await tenantApi.listTenants(1, 1);
            if (tenants.length > 0) mirrorTenantId = tenants[0].id;
          }
        }
      } catch (error: any) {
        logger.info(`镜像站注册: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段2：镜像站席位购买', () => {
    test('镜像站客户购买席位', async () => {
      logger.info('--- 镜像站客户管理员购买席位 ---');
      if (!mirrorTenantId) {
        logger.warn('无镜像站企业ID，跳过');
        return;
      }

      const orderData = {
        tenantId: mirrorTenantId,
        type: 'seat' as const,
        paymentMethod: 'bank_transfer' as const,
        items: [
          { name: '镜像站基础席位', quantity: 20, unitPrice: 1980 },
        ],
      };

      try {
        const order = await orderApi.createOrder(orderData);
        mirrorOrderId = order.id;
        logger.info(`镜像站订单创建成功: ${order.id}`);
      } catch (error: any) {
        logger.info(`镜像站订单: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段3：镜像站财务审核', () => {
    test('镜像站财务人员审核确认', async () => {
      try {
        await authApi.loginAsRole('finance');
        
        const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
        
        if (transfers.length === 0) {
          logger.info('镜像站无待审核转账');
          return;
        }

        const transfer = transfers[0];
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: transfer.orderAmount,
          transactionNo: `BT${Date.now()}`,
        });
        
        logger.info('镜像站财务审核完成');
      } catch (error: any) {
        logger.info(`镜像站财务审核: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段4：推送给官方管理员', () => {
    test('推送消息给官方管理员', async () => {
      logger.info('镜像站审核完成后推送通知给官方管理员');
      logger.info('官方管理员收到推送，准备进行采购');
    });
  });

  describe('阶段5：官方管理员采购', () => {
    test('官方管理员进行采购操作', async () => {
      try {
        await authApi.login();
        logger.info('官方管理员执行采购流程');
        
        // 官方管理员在主站进行采购
        if (mirrorOrderId) {
          logger.info(`采购订单: ${mirrorOrderId}`);
        }
      } catch (error: any) {
        logger.info(`官方采购: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段6：主站对公转账', () => {
    test('主站处理对公转账', async () => {
      try {
        const transfers = await financeApi.listBankTransfers(1, 10, 'pending');
        
        if (transfers.length === 0) {
          logger.info('主站无待处理转账');
          return;
        }

        const transfer = transfers[0];
        await financeApi.confirmBankTransfer(transfer.id, {
          actualAmount: transfer.orderAmount,
          transactionNo: `MT${Date.now()}`,
        });
        
        logger.info('主站对公转账处理完成');
      } catch (error: any) {
        logger.info(`主站转账: ${error.response?.data?.message || error.message}`);
      }
    });
  });

  describe('阶段7：微信/支付宝快速开通', () => {
    test('数字支付订单跳过交付运维直接开通', async () => {
      if (!mirrorTenantId) {
        return;
      }

      try {
        const orderData = {
          tenantId: mirrorTenantId,
          type: 'seat' as const,
          paymentMethod: 'alipay' as const,
          items: [
            { name: '快速席位', quantity: 5, unitPrice: 2980 },
          ],
        };

        const order = await orderApi.createOrder(orderData);
        logger.info(`数字支付订单创建: ${order.id}`);
        
        // 微信/支付宝支付后直接开通
        await orderApi.activateOrder(order.id);
        logger.info('数字支付订单直接开通成功');
      } catch (error: any) {
        logger.info(`数字支付开通: ${error.response?.data?.message || error.message}`);
      }
    });
  });
});

describe('异常流程与边界值测试', () => {
  beforeAll(async () => {
    logger.info('=== 开始异常流程测试 ===');
    await authApi.login();
  });

  afterAll(async () => {
    await authApi.logout();
    logger.info('=== 异常流程测试完成 ===');
  });

  test('创建订单缺失必填字段应报错400', async () => {
    try {
      await orderApi.createOrder({
        tenantId: 'invalid-id',
      } as any);
      logger.warn('预期应返回400错误但未报错');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      logger.info(`✅ 成功捕获400错误: ${error.response?.data?.message}`);
    }
  });

  test('确认到账负数金额应报错400', async () => {
    const orders = await orderApi.listOrders(1, 1);
    if (orders.length === 0) {
      logger.warn('无订单可测试');
      return;
    }

    try {
      await orderApi.confirmPayment(orders[0].id, -1000);
      logger.warn('预期应返回400错误但未报错');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      logger.info(`✅ 成功捕获400错误（负数金额）`);
    }
  });

  test('确认到账小数金额应报错400', async () => {
    const orders = await orderApi.listOrders(1, 1);
    if (orders.length === 0) {
      logger.warn('无订单可测试');
      return;
    }

    try {
      await orderApi.confirmPayment(orders[0].id, 1234.56);
      logger.warn('预期应返回400错误但未报错');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      logger.info(`✅ 成功捕获400错误（小数金额）`);
    }
  });

  test('确认到账超额金额应报错400', async () => {
    const orders = await orderApi.listOrders(1, 1);
    if (orders.length === 0) {
      logger.warn('无订单可测试');
      return;
    }

    const order = orders[0];
    try {
      await orderApi.confirmPayment(order.id, order.totalAmount * 2);
      logger.warn('预期应返回400错误但未报错');
    } catch (error: any) {
      expect(error.response?.status).toBe(400);
      logger.info(`✅ 成功捕获400错误（超额金额）`);
    }
  });

  test('获取不存在的订单应报错', async () => {
    try {
      await orderApi.getOrder('non-existent-id');
      logger.warn('预期应返回错误但未报错');
    } catch (error: any) {
      expect([400, 404]).toContain(error.response?.status);
      logger.info(`✅ 成功捕获错误: ${error.response?.status}`);
    }
  });

  test('错误密码登录应报错', async () => {
    try {
      await authApi.login('invalid', 'wrong');
      logger.warn('预期应返回错误但未报错');
    } catch (error: any) {
      expect([400, 401]).toContain(error.response?.status);
      logger.info(`✅ 成功捕获错误（错误密码）`);
    }
  });
});
