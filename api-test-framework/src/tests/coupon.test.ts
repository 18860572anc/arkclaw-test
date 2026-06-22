import { authApi } from '../api/authApi';
import { tenantApi } from '../api/tenantApi';
import { couponApi, type CreateCouponRequest } from '../api/couponApi';
import { logger } from '../utils/logger';
import dayjs from 'dayjs';

describe('代金券接口测试', () => {
  let tenantId: string;
  let createdCouponId: string;

  beforeAll(async () => {
    logger.info('=== 开始代金券接口测试 ===');
    await authApi.login();
    
    const tenants = await tenantApi.listTenants(1, 1);
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
    }
  });

  afterAll(async () => {
    if (createdCouponId) {
      try {
        await couponApi.deactivateCoupon(createdCouponId);
        logger.info(`停用测试代金券: ${createdCouponId}`);
      } catch (error) {
        logger.warn(`停用代金券失败: ${error}`);
      }
    }
    await authApi.logout();
    logger.info('=== 代金券接口测试完成 ===');
  });

  test('GET /api/coupons - 获取代金券列表', async () => {
    const coupons = await couponApi.listCoupons(1, 10);
    expect(coupons).toBeDefined();
    expect(Array.isArray(coupons)).toBe(true);
    logger.info(`获取到 ${coupons.length} 张代金券`);
  });

  test('POST /api/coupons - 创建固定金额代金券', async () => {
    const request: CreateCouponRequest = {
      name: `测试固定券_${Date.now()}`,
      type: 'fixed',
      value: 1000,
      minAmount: 5000,
      totalCount: 100,
      validFrom: dayjs().format('YYYY-MM-DD'),
      validTo: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    };

    const coupon = await couponApi.createCoupon(request);
    expect(coupon).toBeDefined();
    expect(coupon.id).toBeDefined();
    expect(coupon.type).toBe('fixed');
    expect(coupon.value).toBe(1000);
    expect(coupon.status).toBe('inactive');
    createdCouponId = coupon.id;
    logger.info(`创建代金券成功: ${coupon.id}`);
  });

  test('POST /api/coupons - 创建百分比代金券', async () => {
    const request: CreateCouponRequest = {
      name: `测试折扣券_${Date.now()}`,
      type: 'percent',
      value: 10,
      minAmount: 1000,
      maxDiscount: 5000,
      totalCount: 50,
      validFrom: dayjs().format('YYYY-MM-DD'),
      validTo: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    };

    const coupon = await couponApi.createCoupon(request);
    expect(coupon).toBeDefined();
    expect(coupon.type).toBe('percent');
    expect(coupon.value).toBe(10);
    logger.info(`创建折扣券成功: ${coupon.id}`);
  });

  test('POST /api/coupons/:id/activate - 激活代金券', async () => {
    if (!createdCouponId) {
      const coupons = await couponApi.listCoupons(1, 1, 'inactive');
      if (coupons.length > 0) {
        createdCouponId = coupons[0].id;
      }
    }

    const activatedCoupon = await couponApi.activateCoupon(createdCouponId);
    expect(activatedCoupon.status).toBe('active');
    logger.info(`激活代金券成功: ${createdCouponId}`);
  });

  test('POST /api/coupons/:id/issue - 发放代金券给租户', async () => {
    if (!createdCouponId) {
      const coupons = await couponApi.listCoupons(1, 1, 'active');
      if (coupons.length > 0) {
        createdCouponId = coupons[0].id;
      }
    }

    if (!tenantId) {
      const tenants = await tenantApi.listTenants(1, 1);
      if (tenants.length > 0) {
        tenantId = tenants[0].id;
      }
    }

    await couponApi.issueCouponToTenant(createdCouponId, tenantId);
    const usages = await couponApi.listUsages(createdCouponId, tenantId);
    expect(usages.length).toBeGreaterThanOrEqual(1);
    logger.info(`发放代金券成功: ${createdCouponId} -> ${tenantId}`);
  });

  test('GET /api/coupons/usages - 获取代金券使用记录', async () => {
    const usages = await couponApi.listUsages();
    expect(usages).toBeDefined();
    expect(Array.isArray(usages)).toBe(true);
    logger.info(`获取到 ${usages.length} 条代金券使用记录`);
  });
});
