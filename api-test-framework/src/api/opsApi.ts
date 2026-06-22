import { httpClient } from '../client/httpClient';

export interface OpsTicket {
  id: string;
  type: 'activation' | 'binding' | 'network' | 'security' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateOpsTicketRequest {
  type: OpsTicket['type'];
  tenantId: string;
  title: string;
  description: string;
  priority?: OpsTicket['priority'];
}

export interface OpsBinding {
  id: string;
  tenantId: string;
  channel: 'wechat' | 'dingtalk' | 'feishu' | 'slack';
  status: 'pending' | 'active' | 'disabled';
  config: BindingConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BindingConfig {
  corpId?: string;
  agentId?: string;
  secret?: string;
  callbackUrl?: string;
}

export const opsApi = {
  async listTickets(page: number = 1, pageSize: number = 20, status?: string): Promise<OpsTicket[]> {
    let url = `/api/ops/tickets?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    const response = await httpClient.get<OpsTicket[]>(url);
    return response.data.data!;
  },

  async listMyTickets(page: number = 1, pageSize: number = 20): Promise<OpsTicket[]> {
    const url = `/api/ops/tickets/my?page=${page}&pageSize=${pageSize}`;
    const response = await httpClient.get<OpsTicket[]>(url);
    return response.data.data!;
  },

  async getTicket(id: string): Promise<OpsTicket> {
    const response = await httpClient.get<OpsTicket>(`/api/ops/tickets/${id}`);
    return response.data.data!;
  },

  async createTicket(data: CreateOpsTicketRequest): Promise<OpsTicket> {
    const response = await httpClient.post<OpsTicket>('/api/ops/tickets', data);
    return response.data.data!;
  },

  async updateTicket(id: string, data: Partial<CreateOpsTicketRequest>): Promise<OpsTicket> {
    const response = await httpClient.put<OpsTicket>(`/api/ops/tickets/${id}`, data);
    return response.data.data!;
  },

  async processTicket(id: string, assignee: string): Promise<OpsTicket> {
    const response = await httpClient.post<OpsTicket>(`/api/ops/tickets/${id}/process`, { assignee });
    return response.data.data!;
  },

  async completeTicket(id: string, note?: string): Promise<OpsTicket> {
    const response = await httpClient.post<OpsTicket>(`/api/ops/tickets/${id}/complete`, { note });
    return response.data.data!;
  },

  async listBindings(tenantId?: string): Promise<OpsBinding[]> {
    let url = '/api/ops/bindings';
    if (tenantId) url += `?tenantId=${tenantId}`;
    const response = await httpClient.get<OpsBinding[]>(url);
    return response.data.data!;
  },

  async getBinding(id: string): Promise<OpsBinding> {
    const response = await httpClient.get<OpsBinding>(`/api/ops/bindings/${id}`);
    return response.data.data!;
  },

  async createBinding(tenantId: string, channel: OpsBinding['channel'], config: BindingConfig): Promise<OpsBinding> {
    const response = await httpClient.post<OpsBinding>('/api/ops/bindings', { tenantId, channel, config });
    return response.data.data!;
  },

  async deleteBinding(id: string): Promise<void> {
    await httpClient.delete(`/api/ops/bindings/${id}`);
  },
};
