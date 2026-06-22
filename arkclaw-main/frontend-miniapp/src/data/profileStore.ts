export const profileStorageKey = 'arkclaw-miniapp-profile';

export interface MiniProgramProfileRecord {
  userName: string;
  phone: string;
  email: string;
  companyName: string;
  uscc: string;
  avatarUrl: string;
}

export const defaultProfileRecord: MiniProgramProfileRecord = {
  userName: '李磊',
  phone: '138 0000 2026',
  email: 'lilei@arkclaw.example',
  companyName: '前海科兴天地',
  uscc: '',
  avatarUrl: '',
};

export function readProfileRecord(): MiniProgramProfileRecord {
  const stored = uni.getStorageSync(profileStorageKey) as Partial<MiniProgramProfileRecord> | '';
  const record = stored && typeof stored === 'object' ? stored : {};

  return {
    ...defaultProfileRecord,
    ...record,
  };
}

export function writeProfileRecord(record: MiniProgramProfileRecord) {
  uni.setStorageSync(profileStorageKey, record);
}
