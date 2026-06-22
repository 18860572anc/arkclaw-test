import { httpClient } from '../client/httpClient';

export interface Tenant {
  id: string;
  name: string;
  uscc: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  createdAt: string;
  updatedAt: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

export interface CreateTenantRequest {
  name: string;
  uscc: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

export interface TenantDetail extends Tenant {
  address?: string;
  industry?: string;
  scale?: 'small' | 'medium' | 'large';
  employees?: number;
}

export const tenantApi = {
  async listTenants(page: number = 1, pageSize: number = 20): Promise<Tenant[]> {
    const response = await httpClient.get<Tenant[]>(`/api/tenants?page=${page}&pageSize=${pageSize}`);
    return response.data.data!;
  },

  async getTenant(id: string): Promise<TenantDetail> {
    const response = await httpClient.get<TenantDetail>(`/api/tenants/${id}`);
    return response.data.data!;
  },

  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    const response = await httpClient.post<Tenant>('/api/tenants', data);
    return response.data.data!;
  },

  async updateTenant(id: string, data: Partial<CreateTenantRequest>): Promise<Tenant> {
    const response = await httpClient.put<Tenant>(`/api/tenants/${id}`, data);
    return response.data.data!;
  },

  async deleteTenant(id: string): Promise<void> {
    await httpClient.delete(`/api/tenants/${id}`);
  },

  async activateTenant(id: string): Promise<Tenant> {
    const response = await httpClient.post<Tenant>(`/api/tenants/${id}/activate`);
    return response.data.data!;
  },

  async suspendTenant(id: string, reason: string): Promise<Tenant> {
    const response = await httpClient.post<Tenant>(`/api/tenants/${id}/suspend`, { reason });
    return response.data.data!;
  },
};
