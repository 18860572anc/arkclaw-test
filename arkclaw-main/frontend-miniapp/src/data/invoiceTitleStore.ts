import { readProfileRecord } from './profileStore';

export const invoiceTitlesStorageKey = 'arkclaw-miniapp-invoice-titles';

export type MiniInvoiceTitleKind = 'company' | 'personal';

export interface MiniInvoiceTitleRecord {
  id: string;
  kind: MiniInvoiceTitleKind;
  name: string;
  taxNo?: string;
  createdAt: string;
  updatedAt: string;
}

export function readInvoiceTitles(): MiniInvoiceTitleRecord[] {
  const stored = uni.getStorageSync(invoiceTitlesStorageKey) as MiniInvoiceTitleRecord[] | '';
  const records = Array.isArray(stored) ? stored : seedInvoiceTitles();
  return records.sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || b.updatedAt.localeCompare(a.updatedAt));
}

export function writeInvoiceTitles(records: MiniInvoiceTitleRecord[]) {
  uni.setStorageSync(invoiceTitlesStorageKey, records);
}

export function getInvoiceTitle(id: string) {
  return readInvoiceTitles().find((item) => item.id === id);
}

export function upsertInvoiceTitle(input: {
  id?: string;
  kind: MiniInvoiceTitleKind;
  name: string;
  taxNo?: string;
}) {
  const now = formatDateTime(Date.now());
  const current = input.id ? getInvoiceTitle(input.id) : undefined;
  const record: MiniInvoiceTitleRecord = {
    id: input.id || `mini-invoice-title-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kind: input.kind,
    name: input.name,
    taxNo: input.kind === 'company' ? input.taxNo : undefined,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };
  writeInvoiceTitles([record, ...readInvoiceTitles().filter((item) => item.id !== record.id)]);
  return record;
}

export function deleteInvoiceTitle(id: string) {
  writeInvoiceTitles(readInvoiceTitles().filter((item) => item.id !== id));
}

function seedInvoiceTitles(): MiniInvoiceTitleRecord[] {
  const profile = readProfileRecord();
  const now = formatDateTime(Date.now());
  const records: MiniInvoiceTitleRecord[] = [
    {
      id: 'mini-invoice-title-company-default',
      kind: 'company',
      name: profile.companyName || '企业抬头',
      taxNo: profile.uscc,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mini-invoice-title-personal-user',
      kind: 'personal',
      name: profile.userName || '个人',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mini-invoice-title-personal-default',
      kind: 'personal',
      name: '个人',
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeInvoiceTitles(records);
  return records;
}

function kindRank(kind: MiniInvoiceTitleKind) {
  return kind === 'company' ? 0 : 1;
}

function formatDateTime(value: number) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}
