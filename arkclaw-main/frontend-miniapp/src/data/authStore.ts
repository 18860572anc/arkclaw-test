export const authStorageKey = 'arkclaw-miniapp-auth';

export type MiniProgramLoginMethod = 'phone_authorize' | 'sms_code';

export interface MiniProgramAuthRecord {
  loggedIn: boolean;
  phone: string;
  loginMethod: MiniProgramLoginMethod;
  loggedInAt: string;
}

export function readAuthRecord(): MiniProgramAuthRecord | undefined {
  const stored = uni.getStorageSync(authStorageKey) as Partial<MiniProgramAuthRecord> | '';
  if (!stored || typeof stored !== 'object' || !stored.loggedIn) return undefined;
  return {
    loggedIn: true,
    phone: stored.phone || '',
    loginMethod: stored.loginMethod === 'sms_code' ? 'sms_code' : 'phone_authorize',
    loggedInAt: stored.loggedInAt || '',
  };
}

export function writeAuthRecord(record: MiniProgramAuthRecord) {
  uni.setStorageSync(authStorageKey, record);
}

export function clearAuthRecord() {
  uni.removeStorageSync(authStorageKey);
}
