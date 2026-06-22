import { authApi } from '../api/authApi';
import { httpClient } from '../client/httpClient';
import { logger } from '../utils/logger';

describe('认证接口测试', () => {
  let token: string;

  beforeAll(async () => {
    logger.info('=== 开始认证接口测试 ===');
  });

  afterAll(async () => {
    logger.info('=== 认证接口测试完成 ===');
  });

  test('POST /api/auth/login - 官方管理员登录成功', async () => {
    try {
      const result = await authApi.login();
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.phone).toBeDefined();
      token = result.token;
      logger.info(`登录成功 - 用户ID: ${result.user.id}, 手机号: ${result.user.phone}`);
    } catch (error: any) {
      logger.error(`登录失败: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      throw error;
    }
  });

  test('GET /api/agent/profile - 获取当前用户信息', async () => {
    const user = await authApi.getCurrentUser();
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.phone).toBeDefined();
    logger.info(`当前用户 - 手机号: ${user.phone}, 姓名: ${user.name}`);
  });

  test('POST /api/auth/login - 以财务人员角色登录', async () => {
    const result = await authApi.loginAsRole('finance');
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    logger.info(`财务人员登录成功 - 手机号: ${result.user.phone}`);
  });

  test('POST /api/auth/login - 以商务人员角色登录', async () => {
    const result = await authApi.loginAsRole('business');
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    logger.info(`商务人员登录成功 - 手机号: ${result.user.phone}`);
  });

  test('POST /api/auth/login - 以交付运维管理员角色登录', async () => {
    const result = await authApi.loginAsRole('opsAdmin');
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    logger.info(`交付运维管理员登录成功 - 手机号: ${result.user.phone}`);
  });

  test('POST /api/auth/login - 以交付运维角色登录', async () => {
    const result = await authApi.loginAsRole('ops');
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    logger.info(`交付运维登录成功 - 手机号: ${result.user.phone}`);
  });
});
