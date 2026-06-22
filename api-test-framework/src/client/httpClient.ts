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

        // 详细的请求日志
        const fullUrl = `${envConfig.baseUrl}${config.url}`;
        logger.info(`📤 [REQUEST] === ${config.method?.toUpperCase()} ${fullUrl}`);
        logger.info(`   ├─ Headers: ${JSON.stringify(config.headers)}`);
        
        if (config.params) {
          logger.info(`   ├─ Params: ${JSON.stringify(config.params)}`);
        }
        
        if (config.data) {
          logger.info(`   ├─ Body: ${JSON.stringify(config.data)}`);
        }
        
        logger.info(`   └─ Timeout: ${TEST_TIMEOUT}ms`);

        return config;
      },
      (error) => {
        logger.error(`❌ [REQUEST ERROR] === ${error.message}`);
        logger.error(`   └─ Details: ${JSON.stringify(error)}`);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = response.config.meta?.startTime || Date.now();
        const duration = Date.now() - startTime;

        // 详细的响应日志
        logger.info(`📥 [RESPONSE] === ${response.status} ${response.statusText}`);
        logger.info(`   ├─ URL: ${response.config.url}`);
        logger.info(`   ├─ Status: ${response.status} (${response.statusText})`);
        logger.info(`   ├─ Duration: ${duration}ms`);
        logger.info(`   ├─ Headers: ${JSON.stringify(response.headers)}`);
        logger.info(`   └─ Data: ${JSON.stringify(response.data)}`);

        return response;
      },
      (error) => {
        const startTime = error.config?.meta?.startTime || Date.now();
        const duration = Date.now() - startTime;
        
        // 详细的错误日志
        logger.error(`❌ [RESPONSE ERROR] === ${error.response?.status || error.code} ${error.message}`);
        logger.error(`   ├─ URL: ${error.config?.url}`);
        logger.error(`   ├─ Method: ${error.config?.method?.toUpperCase()}`);
        logger.error(`   ├─ Duration: ${duration}ms`);
        
        if (error.response) {
          logger.error(`   ├─ Status: ${error.response.status}`);
          logger.error(`   ├─ Headers: ${JSON.stringify(error.response.headers)}`);
          logger.error(`   ├─ Data: ${JSON.stringify(error.response.data)}`);
          logger.error(`   └─ Status Text: ${error.response.statusText}`);
        } else if (error.request) {
          logger.error(`   ├─ Request: ${JSON.stringify(error.request)}`);
          logger.error(`   └─ Note: 请求已发送但未收到响应（可能是网络问题或后端超时）`);
        } else {
          logger.error(`   └─ Config Error: ${error.message}`);
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
