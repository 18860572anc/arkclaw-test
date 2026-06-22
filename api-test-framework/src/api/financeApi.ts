import { httpClient } from '../client/httpClient';

export interface BankTransferRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  orderAmount: number;
  actualAmount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  bankName?: string;
  accountNo?: string;
  transactionNo?: string;
  receiptUrl?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface ConfirmTransferRequest {
  actualAmount: number;
  bankName?: string;
  accountNo?: string;
  transactionNo?: string;
  receiptUrl?: string;
}

export interface FinanceSummary {
  totalOrders: number;
  totalAmount: number;
  pendingTransfers: number;
  pendingAmount: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const financeApi = {
  async listBankTransfers(page: number = 1, pageSize: number = 20, status?: string): Promise<BankTransferRecord[]> {
    let url = `/api/finance/bank-transfers?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await httpClient.get<BankTransferRecord[]>(url);
    return response.data.data!;
  },

  async getBankTransfer(id: string): Promise<BankTransferRecord> {
    const response = await httpClient.get<BankTransferRecord>(`/api/finance/bank-transfers/${id}`);
    return response.data.data!;
  },

  async confirmBankTransfer(id: string, data: ConfirmTransferRequest): Promise<BankTransferRecord> {
    const response = await httpClient.post<BankTransferRecord>(
      `/api/finance/bank-transfers/${id}/confirm`,
      data
    );
    return response.data.data!;
  },

  async rejectBankTransfer(id: string, reason: string): Promise<BankTransferRecord> {
    const response = await httpClient.post<BankTransferRecord>(
      `/api/finance/bank-transfers/${id}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  async getFinanceSummary(): Promise<FinanceSummary> {
    const response = await httpClient.get<FinanceSummary>('/api/finance/summary');
    return response.data.data!;
  },
};
