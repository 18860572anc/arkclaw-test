import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getEnvConfig, TEST_TIMEOUT } from '../config/env';
import { logger } from '../utils/logger';

const envConfig = getEnvConfig();

// 扩展 axios 请求配置类型，添加自定义 meta 属性
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    meta?: {
      startTime?: number;
    };
  }
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface SimpleResponse<T = unknown> {
  data: ApiResponse<T>;
  status: number;
  statusText: string;
}

// 安全序列化函数，避免循环引用
const safeStringify = (obj: any): string => {
  try {
    // 只提取关键信息，避免循环引用
    if (obj && typeof obj === 'object') {
      const safeObj: any = {};
      for (const key in obj) {
        if (key !== 'req' && key !== 'res' && typeof obj[key] !== 'function') {
          safeObj[key] = obj[key];
        }
      }
      return JSON.stringify(safeObj);
    }
    return JSON.stringify(obj);
  } catch (e) {
    return '[无法序列化]';
  }
};

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private token: string = '';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: envConfig.baseUrl,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': envConfig.apiKey,
      },
    });

    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const startTime = Date.now();
        config.meta = { startTime };
        
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // 简化的请求日志，避免序列化复杂对象
        const fullUrl = `${envConfig.baseUrl}${config.url}`;
        logger.info(`📤 [REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`);
        
        if (config.params) {
          logger.info(`   Params: ${JSON.stringify(config.params)}`);
        }
        
        if (config.data) {
          logger.info(`   Body: ${JSON.stringify(config.data)}`);
        }

        return config;
      },
      (error) => {
        logger.error(`❌ [REQUEST ERROR] ${error.message}`);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = response.config.meta?.startTime || Date.now();
        const duration = Date.now() - startTime;

        // 简化的响应日志
        logger.info(`📥 [RESPONSE] ${response.status} ${response.config.url} (${duration}ms)`);
        logger.info(`   Data: ${JSON.stringify(response.data)}`);

        return response;
      },
      (error) => {
        const startTime = error.config?.meta?.startTime || Date.now();
        const duration = Date.now() - startTime;
        
        // 简化的错误日志
        logger.error(`❌ [RESPONSE ERROR] ${error.response?.status || error.code} ${error.config?.url} (${duration}ms)`);
        
        if (error.response?.data) {
          logger.error(`   Error: ${JSON.stringify(error.response.data)}`);
        } else if (error.message) {
          logger.error(`   Message: ${error.message}`);
        }

        return Promise.reject(error);
      }
    );
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<SimpleResponse<T>> {
    logger.debug(`🔄 Executing GET ${url}`);
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return { data: response.data, status: response.status, statusText: response.statusText };
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<SimpleResponse<T>> {
    logger.debug(`🔄 Executing POST ${url}`);
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return { data: response.data, status: response.status, statusText: response.statusText };
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<SimpleResponse<T>> {
    logger.debug(`🔄 Executing PUT ${url}`);
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return { data: response.data, status: response.status, statusText: response.statusText };
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<SimpleResponse<T>> {
    logger.debug(`🔄 Executing DELETE ${url}`);
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return { data: response.data, status: response.status, statusText: response.statusText };
  }

  public getBaseUrl(): string {
    return envConfig.baseUrl;
  }
}

export const httpClient = new HttpClient();
