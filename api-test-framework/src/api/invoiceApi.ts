import { httpClient } from '../client/httpClient';

export interface Invoice {
  id: string;
  orderId: string;
  tenantId: string;
  type: 'vat' | 'special_vat';
  status: 'pending' | 'approved' | 'issued' | 'cancelled';
  amount: number;
  title: string;
  taxId: string;
  bankAccount?: string;
  bankName?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  approvedAt?: string;
  issuedAt?: string;
}

export interface CreateInvoiceRequest {
  orderId: string;
  type: Invoice['type'];
  title: string;
  taxId: string;
  bankAccount?: string;
  bankName?: string;
  address?: string;
  phone?: string;
}

export const invoiceApi = {
  async listInvoices(page: number = 1, pageSize: number = 20, status?: string): Promise<Invoice[]> {
    let url = `/api/invoices?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await httpClient.get<Invoice[]>(url);
    return response.data.data!;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await httpClient.get<Invoice>(`/api/invoices/${id}`);
    return response.data.data!;
  },

  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await httpClient.post<Invoice>('/api/invoices', data);
    return response.data.data!;
  },

  async approveInvoice(id: string): Promise<Invoice> {
    const response = await httpClient.post<Invoice>(`/api/invoices/${id}/approve`);
    return response.data.data!;
  },

  async issueInvoice(id: string): Promise<Invoice> {
    const response = await httpClient.post<Invoice>(`/api/invoices/${id}/issue`);
    return response.data.data!;
  },

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    const response = await httpClient.post<Invoice>(`/api/invoices/${id}/cancel`, { reason });
    return response.data.data!;
  },
};
