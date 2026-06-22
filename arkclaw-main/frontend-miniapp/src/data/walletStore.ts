export type MiniProgramWalletPaymentMethod = 'wechat' | 'bank_transfer';
export type MiniProgramWalletTopupStatus = 'pending_payment' | 'pending_bank_transfer' | 'completed';

export interface MiniProgramWalletCollectionAccount {
  companyName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  remarkCode: string;
  note: string;
}

export interface MiniProgramWalletState {
  balance: number;
  totalTopup: number;
  collectionAccount: MiniProgramWalletCollectionAccount;
}

export interface MiniProgramWalletLedgerRecord {
  id: string;
  type: 'topup';
  businessLabel: string;
  amount: number;
  balanceAfter: number;
  createdAt: number;
  remark: string;
  paymentMethod: MiniProgramWalletPaymentMethod;
  proofFileName?: string;
  remarkCode?: string;
  paymentCodeLabel?: string;
  collectionAccount?: MiniProgramWalletCollectionAccount;
}

export interface MiniProgramWalletTopupOrder {
  id: string;
  amount: number;
  status: MiniProgramWalletTopupStatus;
  createdAt: number;
  expiresAt: number;
  uniqueRemarkCode: string;
  collectionAccount: MiniProgramWalletCollectionAccount;
  paymentMethod?: MiniProgramWalletPaymentMethod;
  completedAt?: number;
}

export const walletStorageKey = 'arkclaw-miniapp-wallet';
export const walletLedgerStorageKey = 'arkclaw-miniapp-wallet-ledger';
export const walletTopupOrdersStorageKey = 'arkclaw-miniapp-wallet-topup-orders';
export const walletMinTopupAmount = 100;
export const walletTopupAmountOptions = [100, 500, 1000, 5000] as const;

const initialWalletState: MiniProgramWalletState = {
  balance: 7412,
  totalTopup: 25000,
  collectionAccount: {
    companyName: '云脑智联科技有限公司',
    bankName: '招商银行',
    branchName: '上海分行营业部',
    accountNo: '6222 **** **** 2048',
    remarkCode: 'TENANT-202606-0102',
    note: '对公转账请务必填写唯一备注号，便于财务核对后入账。',
  },
};

export function formatMiniMoney(value: number) {
  return `¥${value.toLocaleString()}`;
}

export function readWalletState(): MiniProgramWalletState {
  const stored = uni.getStorageSync(walletStorageKey) as MiniProgramWalletState | '';
  if (stored && typeof stored.balance === 'number') return stored;
  writeWalletState(initialWalletState);
  return initialWalletState;
}

export function writeWalletState(state: MiniProgramWalletState) {
  uni.setStorageSync(walletStorageKey, state);
}

export function readWalletLedger(): MiniProgramWalletLedgerRecord[] {
  const stored = uni.getStorageSync(walletLedgerStorageKey) as MiniProgramWalletLedgerRecord[] | '';
  if (Array.isArray(stored)) return stored.sort((a, b) => b.createdAt - a.createdAt);
  const seed = seedWalletLedger();
  writeWalletLedger(seed);
  return seed;
}

export function writeWalletLedger(records: MiniProgramWalletLedgerRecord[]) {
  uni.setStorageSync(walletLedgerStorageKey, records);
}

export function readWalletTopupOrders(): MiniProgramWalletTopupOrder[] {
  const stored = uni.getStorageSync(walletTopupOrdersStorageKey) as MiniProgramWalletTopupOrder[] | '';
  return Array.isArray(stored) ? stored.sort((a, b) => b.createdAt - a.createdAt) : [];
}

export function writeWalletTopupOrders(records: MiniProgramWalletTopupOrder[]) {
  uni.setStorageSync(walletTopupOrdersStorageKey, records);
}

export function getWalletTopupOrder(topupId: string) {
  return readWalletTopupOrders().find((order) => order.id === topupId);
}

export function createPendingWalletTopup(amount: number) {
  if (amount < walletMinTopupAmount) {
    throw new Error('单次钱包充值金额需至少 100 元');
  }

  const createdAt = Date.now();
  const wallet = readWalletState();
  const order: MiniProgramWalletTopupOrder = {
    id: createTopupOrderId(createdAt),
    amount,
    status: 'pending_payment',
    createdAt,
    expiresAt: createdAt + 15 * 60 * 1000,
    uniqueRemarkCode: buildNextRemarkCode(createdAt),
    collectionAccount: { ...wallet.collectionAccount },
  };
  writeWalletTopupOrders([order, ...readWalletTopupOrders()]);
  return order;
}

export function completeWalletTopup(topupId: string, paymentMethod: MiniProgramWalletPaymentMethod) {
  const order = getWalletTopupOrder(topupId);
  if (!order) {
    throw new Error('充值单不存在');
  }
  if (order.status === 'completed') {
    return { wallet: readWalletState(), order, ledger: readWalletLedger().find((item) => item.id === order.id) };
  }
  if (paymentMethod === 'bank_transfer') {
    const nextOrder = updateWalletTopupOrder(topupId, {
      status: 'pending_bank_transfer',
      paymentMethod,
    });
    return { wallet: readWalletState(), order: nextOrder };
  }

  const wallet = readWalletState();
  const collectionAccount = { ...wallet.collectionAccount };
  const completedAt = Date.now();
  const nextWallet: MiniProgramWalletState = {
    ...wallet,
    balance: wallet.balance + order.amount,
    totalTopup: wallet.totalTopup + order.amount,
    collectionAccount: {
      ...wallet.collectionAccount,
      remarkCode: buildNextRemarkCode(completedAt),
    },
  };
  writeWalletState(nextWallet);

  const ledger: MiniProgramWalletLedgerRecord = {
    id: createLedgerId(completedAt),
    type: 'topup',
    businessLabel: `钱包充值 / ${paymentMethodLabel(paymentMethod)}`,
    amount: order.amount,
    balanceAfter: nextWallet.balance,
    createdAt: completedAt,
    remark: '微信支付充值成功，资金已入账',
    paymentMethod,
    remarkCode: collectionAccount.remarkCode,
  };
  writeWalletLedger([ledger, ...readWalletLedger()]);
  const nextOrder = updateWalletTopupOrder(topupId, {
    status: 'completed',
    paymentMethod,
    completedAt,
  });
  return { wallet: nextWallet, order: nextOrder, ledger };
}

export function updateWalletTopupOrder(topupId: string, patch: Partial<MiniProgramWalletTopupOrder>) {
  let nextOrder: MiniProgramWalletTopupOrder | undefined;
  const next = readWalletTopupOrders().map((order) => {
    if (order.id !== topupId) return order;
    nextOrder = { ...order, ...patch };
    return nextOrder;
  });
  writeWalletTopupOrders(next);
  if (!nextOrder) {
    throw new Error('充值单不存在');
  }
  return nextOrder;
}

export function paymentMethodLabel(method: MiniProgramWalletPaymentMethod) {
  if (method === 'wechat') return '微信';
  return '对公转账';
}

function seedWalletLedger(): MiniProgramWalletLedgerRecord[] {
  const wallet = readWalletState();
  const createdAt = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return [
    {
      id: 'TWL-20260601-001',
      type: 'topup',
      businessLabel: '钱包充值 / 微信',
      amount: 5000,
      balanceAfter: wallet.balance,
      createdAt,
      remark: '微信支付充值成功，资金已入账',
      paymentMethod: 'wechat',
    },
  ];
}

function createTopupOrderId(createdAt: number) {
  return `TTO-${formatDateKey(createdAt)}-${String(createdAt % 1000000).padStart(6, '0')}`;
}

function buildNextRemarkCode(time: number) {
  return `TENANT-${formatMonthKey(time)}-${String((time % 9000) + 1000).padStart(4, '0')}`;
}

function createLedgerId(time: number) {
  return `TWL-${formatDateKey(time)}-${String(time % 1000).padStart(3, '0')}`;
}

function formatDateKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonthKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}
