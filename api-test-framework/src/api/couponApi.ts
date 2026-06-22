import { httpClient } from '../client/httpClient';

export interface Coupon {
  id: string;
  name: string;
  type: 'fixed' | 'percent';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  status: 'active' | 'inactive' | 'expired';
  totalCount: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface CreateCouponRequest {
  name: string;
  type: Coupon['type'];
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  totalCount: number;
  validFrom: string;
  validTo: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponName: string;
  tenantId: string;
  tenantName: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

export const couponApi = {
  async listCoupons(page: number = 1, pageSize: number = 20, status?: string): Promise<Coupon[]> {
    let url = `/api/coupons?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    const response = await httpClient.get<Coupon[]>(url);
    return response.data.data!;
  },

  async getCoupon(id: string): Promise<Coupon> {
    const response = await httpClient.get<Coupon>(`/api/coupons/${id}`);
    return response.data.data!;
  },

  async createCoupon(data: CreateCouponRequest): Promise<Coupon> {
    const response = await httpClient.post<Coupon>('/api/coupons', data);
    return response.data.data!;
  },

  async updateCoupon(id: string, data: Partial<CreateCouponRequest>): Promise<Coupon> {
    const response = await httpClient.put<Coupon>(`/api/coupons/${id}`, data);
    return response.data.data!;
  },

  async activateCoupon(id: string): Promise<Coupon> {
    const response = await httpClient.post<Coupon>(`/api/coupons/${id}/activate`);
    return response.data.data!;
  },

  async deactivateCoupon(id: string): Promise<Coupon> {
    const response = await httpClient.post<Coupon>(`/api/coupons/${id}/deactivate`);
    return response.data.data!;
  },

  async listUsages(couponId?: string, tenantId?: string): Promise<CouponUsage[]> {
    let url = '/api/coupons/usages';
    const params: string[] = [];
    if (couponId) params.push(`couponId=${couponId}`);
    if (tenantId) params.push(`tenantId=${tenantId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await httpClient.get<CouponUsage[]>(url);
    return response.data.data!;
  },

  async issueCouponToTenant(couponId: string, tenantId: string): Promise<void> {
    await httpClient.post(`/api/coupons/${couponId}/issue`, { tenantId });
  },
};
