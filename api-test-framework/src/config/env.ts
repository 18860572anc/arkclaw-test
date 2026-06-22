export interface UserAccount {
  phone: string;
  role: string;
}

export interface EnvConfig {
  baseUrl: string;
  apiKey: string;
  users: Record<string, UserAccount>;
  verificationCode: string;
}

export const getEnvConfig = (): EnvConfig => {
  const env = process.env.ENV || 'main';
  
  if (env === 'mirror') {
    return {
      baseUrl: process.env.MIRROR_BASE_URL || 'https://claw-test.brainlink.cloud',
      apiKey: process.env.MIRROR_API_KEY || '',
      users: {
        officialAdmin: { phone: process.env.MIRROR_OFFICIAL_ADMIN || '15622106916', role: '官方管理员' },
        business: { phone: process.env.MIRROR_BUSINESS_USER || '17727262532', role: '商务人员' },
        finance: { phone: process.env.MIRROR_FINANCE_USER || '16722635263', role: '财务人员' },
        tenantAdmin: { phone: process.env.MIRROR_TENANT_ADMIN || '19902928273', role: '企业客户管理员' },
      },
      verificationCode: process.env.VERIFICATION_CODE || '2026',
    };
  }
  
  return {
    baseUrl: process.env.MAIN_BASE_URL || 'https://claw-test-mirror2.brainlink.cloud',
    apiKey: process.env.MAIN_API_KEY || '',
    users: {
      officialAdmin: { phone: process.env.MAIN_OFFICIAL_ADMIN || '17630059309', role: '官方管理员' },
      business: { phone: process.env.MAIN_BUSINESS_USER || '18041109160', role: '商务人员' },
      opsAdmin: { phone: process.env.MAIN_OPS_ADMIN || '15035948715', role: '交付运维管理员' },
      ops: { phone: process.env.MAIN_OPS_USER || '15266352635', role: '交付运维' },
      finance: { phone: process.env.MAIN_FINANCE_USER || '18899283726', role: '财务人员' },
      tenantAdmin: { phone: process.env.MAIN_TENANT_ADMIN || '17772627362', role: '企业客户管理员' },
    },
    verificationCode: process.env.VERIFICATION_CODE || '2026',
  };
};

export const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);
export const TEST_RETRY = parseInt(process.env.TEST_RETRY || '2', 10);
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
