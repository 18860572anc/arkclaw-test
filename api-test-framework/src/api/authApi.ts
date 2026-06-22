import { httpClient } from '../client/httpClient';
import { getEnvConfig } from '../config/env';
import { logger } from '../utils/logger';

export interface LoginResponse {
  token: string;
  expiresAt?: string;
  user: UserInfo;
  roles?: string[];
}

export interface UserInfo {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  domain: string;
}

export const authApi = {
  async login(phone?: string, password?: string): Promise<LoginResponse> {
    const envConfig = getEnvConfig();
    const loginPhone = phone || envConfig.users.officialAdmin.phone;
    const loginPassword = password || '12345qwe';
    const domain = new URL(envConfig.baseUrl).hostname;
    
    logger.info(`登录用户: ${loginPhone}, 域名: ${domain}`);
    
    const response = await httpClient.post<LoginResponse>('/api/auth/login', {
      username: loginPhone,
      password: loginPassword,
      domain: domain,
    });
    
    const result = response.data as unknown as LoginResponse;
    const token = result.token || '';
    httpClient.setToken(token.replace('Bearer ', ''));
    return result;
  },

  async loginAsRole(role: 'officialAdmin' | 'business' | 'opsAdmin' | 'ops' | 'finance' | 'tenantAdmin'): Promise<LoginResponse> {
    const envConfig = getEnvConfig();
    const user = envConfig.users[role];
    const domain = new URL(envConfig.baseUrl).hostname;
    
    if (!user) {
      throw new Error(`角色 ${role} 不存在`);
    }
    
    logger.info(`以角色登录: ${user.role} (${user.phone}), 域名: ${domain}`);
    
    const response = await httpClient.post<LoginResponse>('/api/auth/login', {
      username: user.phone,
      password: '12345qwe',
      domain: domain,
    });
    
    const result = response.data as unknown as LoginResponse;
    const token = result.token || '';
    httpClient.setToken(token.replace('Bearer ', ''));
    return result;
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (error) {
      logger.warn(`登出失败（可能未登录）: ${error}`);
    } finally {
      httpClient.setToken('');
    }
  },

  async getCurrentUser(): Promise<UserInfo> {
    const response = await httpClient.get<UserInfo>('/api/agent/profile');
    const result = response.data as unknown as UserInfo;
    return result;
  },
};
