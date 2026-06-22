<template>
  <view class="orders-page">
    <view class="orders-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['orders-tab', activeTab === tab.key ? 'is-active' : '']"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </view>

    <view v-if="filteredOrders.length" class="orders-list">
      <view v-for="order in filteredOrders" :key="order.id" class="order-card">
        <view v-if="order.status === 'pending_payment'" class="order-countdown">
          <text>等待支付，还剩 {{ remainingText(order) }}</text>
        </view>

        <view class="order-card__body">
          <view class="order-card__head">
            <view class="order-shop">
              <text>ArkClaw 企业服务</text>
              <text class="order-arrow">›</text>
            </view>
            <text :class="['order-status', `order-status--${order.status}`]">{{ statusText(order.status) }}</text>
          </view>

          <view class="order-item">
            <view :class="['order-item__visual', `order-item__visual--${order.items[0]?.tone ?? 'blue'}`]">
              <view class="order-item__screen" />
              <view class="order-item__base" />
            </view>
            <view class="order-item__main">
              <text class="order-item__title">{{ orderTitle(order) }}</text>
              <text class="order-item__desc">{{ orderDesc(order) }}</text>
              <text class="order-item__id">{{ order.id }}</text>
            </view>
            <view class="order-item__side">
              <text class="order-item__amount">¥{{ amountText(order.totalAmount) }}</text>
              <text class="order-item__count">共{{ order.totalCount }}件</text>
            </view>
          </view>

          <view class="order-actions">
            <button
              v-if="order.status === 'pending_payment'"
              class="order-action order-action--ghost"
              @click="cancelOrder(order.id)"
            >
              取消订单
            </button>
            <button
              v-if="order.status === 'pending_payment'"
              class="order-action order-action--primary"
              @click="payOrder(order.id)"
            >
              去支付
            </button>
            <button
              v-if="order.status === 'completed'"
              :class="['order-action', order.invoice?.status === 'pending' ? 'order-action--disabled' : 'order-action--ghost']"
              :disabled="order.invoice?.status === 'pending'"
              @click="openInvoiceApply(order)"
            >
              {{ invoiceActionText(order) }}
            </button>
            <button
              v-if="order.status === 'cancelled'"
              class="order-action order-action--ghost"
              @click="confirmDeleteOrder(order.id)"
            >
              删除订单
            </button>
            <button
              v-if="order.status === 'completed' || order.status === 'cancelled'"
              class="order-action order-action--primary"
              @click="buyAgain(order)"
            >
              再次购买
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="orders-empty">
      <ArcoIcon name="clipboard" color="#b8c1d1" :size="42" />
      <text>暂无订单</text>
      <button @click="goPurchase">去购买席位</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ArcoIcon from './ArcoIcon.vue';
import {
  deleteOrder,
  readOrders,
  restoreCheckoutFromOrder,
  updateOrder,
  type MiniProgramOrder,
  type MiniProgramOrderStatus,
} from '../data/orderStore';
import { createMiniNotification } from '../data/notificationStore';

type OrderTabKey = 'all' | MiniProgramOrderStatus;

const tabs: Array<{ key: OrderTabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const activeTab = ref<OrderTabKey>('all');
const orders = ref<MiniProgramOrder[]>([]);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

const filteredOrders = computed(() =>
  activeTab.value === 'all' ? orders.value : orders.value.filter((order) => order.status === activeTab.value),
);

function refreshOrders() {
  orders.value = readOrders();
}

function statusText(status: MiniProgramOrderStatus) {
  const map: Record<MiniProgramOrderStatus, string> = {
    pending_payment: '待支付',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status];
}

function amountText(amount: number) {
  return amount.toLocaleString();
}

function orderTitle(order: MiniProgramOrder) {
  const first = order.items[0];
  if (!first) return 'ArkClaw 服务订单';
  return order.items.length > 1 ? `${first.name} 等${order.items.length}项` : `${first.name} + ${first.codingPlanName}`;
}

function orderDesc(order: MiniProgramOrder) {
  return order.items.map((item) => `${item.name} ×${item.count}`).join(' + ');
}

function remainingText(order: MiniProgramOrder) {
  const remaining = Math.max(order.expiresAt - now.value, 0);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function cancelOrder(orderId: string) {
  updateOrder(orderId, { status: 'cancelled' });
  createMiniNotification({
    category: 'order',
    priority: 'low',
    title: '订单已取消',
    summary: `订单 ${orderId} 已取消，如需继续购买可在订单页点击再次购买。`,
    todo: false,
    actionable: true,
    actionUrl: '/pages/tenant/orders',
    actionLabel: '查看订单',
    sourceType: 'order',
    sourceId: orderId,
  });
  refreshOrders();
  uni.showToast({ title: '订单已取消', icon: 'none' });
}

function payOrder(orderId: string) {
  uni.navigateTo({ url: `/pages/tenant/cashier?orderId=${orderId}` });
}

function invoiceActionText(order: MiniProgramOrder) {
  if (order.invoice?.status === 'pending') return '发票处理中';
  if (order.invoice?.status === 'issued') return '已开票';
  if (order.invoice?.status === 'rejected') return '重新申请发票';
  return '申请发票';
}

function openInvoiceApply(order: MiniProgramOrder) {
  if (order.invoice?.status === 'pending') return;
  if (order.invoice?.status === 'issued') {
    uni.showToast({ title: '电子发票已开具', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/tenant/invoice-apply?orderId=${order.id}` });
}

function buyAgain(order: MiniProgramOrder) {
  restoreCheckoutFromOrder(order);
  uni.navigateTo({ url: '/pages/tenant/checkout' });
}

function confirmDeleteOrder(orderId: string) {
  uni.showModal({
    title: '删除订单',
    content: '删除后该订单将不再显示，确认删除吗？',
    confirmText: '删除',
    confirmColor: '#e60012',
    success: (result) => {
      if (!result.confirm) return;
      deleteOrder(orderId);
      refreshOrders();
      uni.showToast({ title: '订单已删除', icon: 'none' });
    },
  });
}

function goPurchase() {
  uni.navigateTo({ url: '/pages/tenant/purchase' });
}

onMounted(() => {
  refreshOrders();
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  padding: 20rpx 20rpx 44rpx;
  background: #f1f1f1;
}

.orders-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 28rpx;
  padding: 10rpx 0 22rpx;
  background: #f1f1f1;
  overflow-x: auto;
  white-space: nowrap;
}

.orders-tab {
  position: relative;
  height: 58rpx;
  padding: 0;
  background: transparent;
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 58rpx;
}

.orders-tab.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #ffc019;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
}

.order-countdown {
  display: flex;
  justify-content: center;
  padding: 18rpx 20rpx;
  background: #fff6dc;
}

.order-countdown text {
  color: #8f5a00;
  font-size: 28rpx;
  font-weight: 600;
}

.order-card__body {
  padding: 28rpx 30rpx 24rpx;
}

.order-card__head,
.order-shop,
.order-actions {
  display: flex;
  align-items: center;
}

.order-card__head {
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.order-shop {
  min-width: 0;
  gap: 8rpx;
}

.order-shop text:first-child {
  overflow: hidden;
  color: #1d2129;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 42rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-arrow {
  color: #1d2129;
  font-size: 42rpx;
  line-height: 42rpx;
}

.order-status {
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 29rpx;
  font-weight: 700;
}

.order-status--pending_payment {
  color: #e60012;
}

.order-item {
  display: flex;
  gap: 20rpx;
  padding-bottom: 26rpx;
  border-bottom: 2rpx dashed #eef0f4;
}

.order-item__visual {
  position: relative;
  width: 122rpx;
  height: 104rpx;
  flex: 0 0 auto;
}

.order-item__screen {
  position: absolute;
  left: 18rpx;
  top: 10rpx;
  width: 82rpx;
  height: 58rpx;
  border-radius: 8rpx 8rpx 3rpx 3rpx;
  background: linear-gradient(135deg, #2d3444, #0b1020 56%, #40485b);
  transform: skewX(-10deg);
}

.order-item__base {
  position: absolute;
  left: 8rpx;
  top: 70rpx;
  width: 108rpx;
  height: 20rpx;
  border-radius: 4rpx 4rpx 14rpx 14rpx;
  background: linear-gradient(160deg, #eef4ff, #b9cffd);
  transform: skewX(-18deg);
}

.order-item__visual--green .order-item__base { background: linear-gradient(160deg, #effff5, #b6e8ca); }
.order-item__visual--orange .order-item__base { background: linear-gradient(160deg, #fff5e8, #ffd1a6); }
.order-item__visual--purple .order-item__base { background: linear-gradient(160deg, #f6f0ff, #d6c4ff); }

.order-item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.order-item__title {
  color: #111827;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.order-item__desc,
.order-item__id,
.order-item__count {
  color: #8b8f97;
  font-size: 25rpx;
  line-height: 34rpx;
}

.order-item__side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
}

.order-item__amount {
  color: #1d2129;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 40rpx;
}

.order-actions {
  justify-content: flex-end;
  gap: 18rpx;
  padding-top: 24rpx;
}

.order-action {
  min-width: 150rpx;
  height: 62rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 62rpx;
}

.order-action--ghost {
  border: 2rpx solid #6b7280;
  background: #ffffff;
  color: #1f2937;
}

.order-action--primary {
  background: #ffc019;
  color: #111827;
}

.order-action--disabled {
  background: #f2f3f5;
  color: #a6abb3;
}

.orders-empty {
  min-height: 560rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  color: #86909c;
  font-size: 30rpx;
}

.orders-empty button {
  min-width: 220rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #ffc019;
  color: #111827;
  font-size: 29rpx;
  font-weight: 700;
}
</style>
