import { httpClient } from '../client/httpClient';

export interface Order {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'seat' | 'package' | 'topup' | 'invoice';
  status: 'pending' | 'paid' | 'confirmed' | 'activated' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'alipay' | 'wechat' | 'bank_transfer' | 'coupon';
  createdAt: string;
  paidAt?: string;
  confirmedAt?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  tenantId: string;
  type: Order['type'];
  items: Omit<OrderItem, 'id' | 'totalPrice'>[];
  paymentMethod: Order['paymentMethod'];
}

export const orderApi = {
  async listOrders(page: number = 1, pageSize: number = 20, status?: string): Promise<Order[]> {
    let url = `/api/orders?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await httpClient.get<Order[]>(url);
    return response.data.data!;
  },

  async getOrder(id: string): Promise<Order> {
    const response = await httpClient.get<Order>(`/api/orders/${id}`);
    return response.data.data!;
  },

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await httpClient.post<Order>('/api/orders', data);
    return response.data.data!;
  },

  async confirmPayment(id: string, actualAmount: number): Promise<Order> {
    const response = await httpClient.post<Order>(`/api/orders/${id}/confirm-payment`, {
      actualAmount,
    });
    return response.data.data!;
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
    const response = await httpClient.post<Order>(`/api/orders/${id}/cancel`, { reason });
    return response.data.data!;
  },

  async activateOrder(id: string): Promise<Order> {
    const response = await httpClient.post<Order>(`/api/orders/${id}/activate`);
    return response.data.data!;
  },
};
