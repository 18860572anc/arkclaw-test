import { tenantSeatProducts, type MiniProgramSeatProduct, type MiniProgramSeatProductKey } from './consoleData';

export const checkoutStorageKey = 'arkclaw-miniapp-seat-checkout';
export const ordersStorageKey = 'arkclaw-miniapp-orders';

export type MiniProgramOrderStatus = 'pending_payment' | 'completed' | 'cancelled';
export type MiniProgramPaymentMethod = 'wechat' | 'wallet' | 'bank';
export type MiniProgramInvoiceStatus = 'pending' | 'issued' | 'rejected';

export interface MiniProgramInvoiceRecord {
  status: MiniProgramInvoiceStatus;
  type: 'electronic_vat_general';
  contentType: 'goods_detail';
  title: string;
  taxNo: string;
  receiverEmail: string;
  appliedAt: string;
  rejectReason?: string;
}

export interface CheckoutStorageItem {
  key: MiniProgramSeatProductKey;
  count: number;
}

export interface MiniProgramOrderItem {
  key: MiniProgramSeatProductKey;
  name: string;
  codingPlanName: string;
  unitAmount: number;
  count: number;
  amount: number;
  tone: MiniProgramSeatProduct['tone'];
}

export interface MiniProgramOrder {
  id: string;
  createdAt: number;
  expiresAt: number;
  status: MiniProgramOrderStatus;
  items: MiniProgramOrderItem[];
  totalAmount: number;
  totalCount: number;
  paymentMethod?: MiniProgramPaymentMethod;
  invoice?: MiniProgramInvoiceRecord;
}

export function readCheckoutItems() {
  const stored = uni.getStorageSync(checkoutStorageKey) as CheckoutStorageItem[] | '';
  const records = Array.isArray(stored) ? stored : [];

  return records
    .map((record) => {
      const product = tenantSeatProducts.find((item) => item.key === record.key);
      if (!product || record.count <= 0) return null;

      const unitAmount = product.monthlyPrice + product.codingPlanMonthlyPrice;

      return {
        key: product.key,
        product,
        count: record.count,
        unitAmount,
        amount: unitAmount * record.count,
      };
    })
    .filter((item): item is {
      key: MiniProgramSeatProductKey;
      product: MiniProgramSeatProduct;
      count: number;
      unitAmount: number;
      amount: number;
    } => item !== null);
}

export function writeCheckoutItems(items: CheckoutStorageItem[]) {
  uni.setStorageSync(
    checkoutStorageKey,
    items.filter((item) => item.count > 0),
  );
}

export function clearCheckoutItems() {
  uni.removeStorageSync(checkoutStorageKey);
}

export function readOrders(): MiniProgramOrder[] {
  const stored = uni.getStorageSync(ordersStorageKey) as MiniProgramOrder[] | '';
  const orders = Array.isArray(stored) ? stored : seedOrders();
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

export function writeOrders(orders: MiniProgramOrder[]) {
  uni.setStorageSync(ordersStorageKey, orders);
}

export function getOrder(orderId: string) {
  return readOrders().find((order) => order.id === orderId);
}

export function upsertOrder(order: MiniProgramOrder) {
  const orders = readOrders();
  const next = [order, ...orders.filter((item) => item.id !== order.id)];
  writeOrders(next);
}

export function updateOrder(orderId: string, patch: Partial<MiniProgramOrder>) {
  const orders = readOrders();
  const next = orders.map((order) => (order.id === orderId ? { ...order, ...patch } : order));
  writeOrders(next);
  return next.find((order) => order.id === orderId);
}

export function deleteOrder(orderId: string) {
  writeOrders(readOrders().filter((order) => order.id !== orderId));
}

export function createPendingOrderFromCheckout() {
  const checkoutItems = readCheckoutItems();
  if (!checkoutItems.length) return null;

  const createdAt = Date.now();
  const order: MiniProgramOrder = {
    id: createOrderId(createdAt),
    createdAt,
    expiresAt: createdAt + 15 * 60 * 1000,
    status: 'pending_payment',
    items: checkoutItems.map((item) => ({
      key: item.key,
      name: item.product.name,
      codingPlanName: item.product.codingPlanName,
      unitAmount: item.unitAmount,
      count: item.count,
      amount: item.amount,
      tone: item.product.tone,
    })),
    totalAmount: checkoutItems.reduce((sum, item) => sum + item.amount, 0),
    totalCount: checkoutItems.reduce((sum, item) => sum + item.count, 0),
  };

  upsertOrder(order);
  return order;
}

export function restoreCheckoutFromOrder(order: MiniProgramOrder) {
  writeCheckoutItems(order.items.map((item) => ({ key: item.key, count: item.count })));
}

function createOrderId(createdAt: number) {
  const date = new Date(createdAt);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = String(createdAt % 1000000).padStart(6, '0');
  return `ORD-${y}${m}${d}-${suffix}`;
}

function seedOrders(): MiniProgramOrder[] {
  const now = Date.now();
  const makeItem = (key: MiniProgramSeatProductKey, count: number): MiniProgramOrderItem => {
    const product = tenantSeatProducts.find((item) => item.key === key) ?? tenantSeatProducts[0];
    const unitAmount = product.monthlyPrice + product.codingPlanMonthlyPrice;
    return {
      key: product.key,
      name: product.name,
      codingPlanName: product.codingPlanName,
      unitAmount,
      count,
      amount: unitAmount * count,
      tone: product.tone,
    };
  };
  const pendingItems = [makeItem('pro', 1)];
  const completedItems = [makeItem('lite', 2)];
  const cancelledItems = [makeItem('standard', 1)];

  const orders: MiniProgramOrder[] = [
    {
      id: 'ORD-20260602-001',
      createdAt: now - 6 * 60 * 1000,
      expiresAt: now + 9 * 60 * 1000,
      status: 'pending_payment',
      items: pendingItems,
      totalAmount: pendingItems.reduce((sum, item) => sum + item.amount, 0),
      totalCount: pendingItems.reduce((sum, item) => sum + item.count, 0),
    },
    {
      id: 'ORD-20260601-018',
      createdAt: now - 22 * 60 * 60 * 1000,
      expiresAt: now - 21 * 60 * 60 * 1000,
      status: 'completed',
      paymentMethod: 'wechat',
      items: completedItems,
      totalAmount: completedItems.reduce((sum, item) => sum + item.amount, 0),
      totalCount: completedItems.reduce((sum, item) => sum + item.count, 0),
    },
    {
      id: 'ORD-20260530-006',
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      expiresAt: now - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000,
      status: 'cancelled',
      items: cancelledItems,
      totalAmount: cancelledItems.reduce((sum, item) => sum + item.amount, 0),
      totalCount: cancelledItems.reduce((sum, item) => sum + item.count, 0),
    },
  ];

  writeOrders(orders);
  return orders;
}
