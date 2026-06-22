import { authApi } from '../api/authApi';
import { tenantApi, type Tenant, type CreateTenantRequest } from '../api/tenantApi';
import { logger } from '../utils/logger';

describe('租户管理接口测试', () => {
  let createdTenantId: string;

  beforeAll(async () => {
    logger.info('=== 开始租户管理接口测试 ===');
    await authApi.login();
  });

  afterAll(async () => {
    if (createdTenantId) {
      try {
        await tenantApi.deleteTenant(createdTenantId);
        logger.info(`清理测试租户: ${createdTenantId}`);
      } catch (error) {
        logger.warn(`清理租户失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 租户管理接口测试完成 ===');
  });

  test('GET /api/tenants - 获取租户列表', async () => {
    const tenants = await tenantApi.listTenants(1, 10);
    expect(tenants).toBeDefined();
    expect(Array.isArray(tenants)).toBe(true);
    logger.info(`获取到 ${tenants.length} 个租户`);
  });

  test('POST /api/tenants - 创建租户', async () => {
    const request: CreateTenantRequest = {
      name: `测试企业_${Date.now()}`,
      uscc: `91310000MA${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      adminName: '测试管理员',
      adminEmail: `test_${Date.now()}@example.com`,
      adminPhone: '13800138000',
    };

    const tenant = await tenantApi.createTenant(request);
    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe(request.name);
    expect(tenant.uscc).toBe(request.uscc);
    expect(tenant.status).toBe('pending');
    createdTenantId = tenant.id;
    logger.info(`创建租户成功: ${tenant.id}`);
  });

  test('GET /api/tenants/:id - 获取租户详情', async () => {
    if (!createdTenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        createdTenantId = tenants[0].id;
      }
    }

    const tenant = await tenantApi.getTenant(createdTenantId);
    expect(tenant).toBeDefined();
    expect(tenant.id).toBe(createdTenantId);
    expect(tenant.name).toBeDefined();
    logger.info(`获取租户详情: ${tenant.name}`);
  });

  test('PUT /api/tenants/:id - 更新租户信息', async () => {
    if (!createdTenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        createdTenantId = tenants[0].id;
      }
    }

    const updatedTenant = await tenantApi.updateTenant(createdTenantId, {
      adminEmail: `updated_${Date.now()}@example.com`,
    });
    expect(updatedTenant).toBeDefined();
    expect(updatedTenant.adminEmail).toContain('updated_');
    logger.info('更新租户信息成功');
  });

  test('POST /api/tenants/:id/activate - 激活租户', async () => {
    if (!createdTenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        createdTenantId = tenants[0].id;
      }
    }

    const activatedTenant = await tenantApi.activateTenant(createdTenantId);
    expect(activatedTenant).toBeDefined();
    expect(activatedTenant.status).toBe('active');
    logger.info('租户激活成功');
  });
});
