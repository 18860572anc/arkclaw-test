import { httpClient } from '../client/httpClient';

export interface Notification {
  id: string;
  type: 'order' | 'invoice' | 'system' | 'alert';
  title: string;
  content: string;
  status: 'unread' | 'read' | 'processed';
  tenantId?: string;
  orderId?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationFilter {
  type?: Notification['type'];
  status?: Notification['status'];
  tenantId?: string;
}

export const notificationApi = {
  async listNotifications(filter?: NotificationFilter, page: number = 1, pageSize: number = 20): Promise<Notification[]> {
    let url = `/api/notifications?page=${page}&pageSize=${pageSize}`;
    if (filter?.type) url += `&type=${filter.type}`;
    if (filter?.status) url += `&status=${filter.status}`;
    if (filter?.tenantId) url += `&tenantId=${filter.tenantId}`;
    
    const response = await httpClient.get<Notification[]>(url);
    return response.data.data!;
  },

  async getNotification(id: string): Promise<Notification> {
    const response = await httpClient.get<Notification>(`/api/notifications/${id}`);
    return response.data.data!;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await httpClient.post<Notification>(`/api/notifications/${id}/read`);
    return response.data.data!;
  },

  async markAllAsRead(): Promise<void> {
    await httpClient.post('/api/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await httpClient.delete(`/api/notifications/${id}`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await httpClient.get<{ count: number }>('/api/notifications/unread-count');
    return response.data.data?.count || 0;
  },
};
