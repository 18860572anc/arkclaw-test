<template>
  <view class="invoice-detail-page">
    <view v-if="activeOrder && invoice" class="invoice-detail-card">
      <view class="invoice-detail-head">
        <text class="invoice-detail-status">{{ statusText(invoice.status) }}</text>
        <text class="invoice-detail-desc">电子普通发票 · 单位抬头</text>
      </view>

      <view class="invoice-detail-list">
        <view class="invoice-detail-row">
          <text>订单号</text>
          <text>{{ activeOrder.id }}</text>
        </view>
        <view class="invoice-detail-row">
          <text>开票金额</text>
          <text>¥{{ amountText(activeOrder.totalAmount) }}</text>
        </view>
        <view class="invoice-detail-row">
          <text>发票类型</text>
          <text>电子普通发票</text>
        </view>
        <view class="invoice-detail-row">
          <text>抬头类型</text>
          <text>单位</text>
        </view>
        <view class="invoice-detail-row">
          <text>抬头名称</text>
          <text>{{ invoice.title }}</text>
        </view>
        <view class="invoice-detail-row">
          <text>税号</text>
          <text>{{ invoice.taxNo }}</text>
        </view>
        <view class="invoice-detail-row">
          <text>收票邮箱</text>
          <text>{{ invoice.receiverEmail }}</text>
        </view>
        <view class="invoice-detail-row">
          <text>申请时间</text>
          <text>{{ invoice.appliedAt }}</text>
        </view>
      </view>
    </view>

    <button class="invoice-detail-back" @click="goOrders">返回订单</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getOrder, type MiniProgramInvoiceRecord, type MiniProgramOrder } from '../../data/orderStore';

const activeOrder = ref<MiniProgramOrder>();
const invoice = computed(() => activeOrder.value?.invoice);

function hydrate(orderId?: string) {
  const order = orderId ? getOrder(orderId) : undefined;
  if (!order?.invoice) {
    uni.showToast({ title: '发票申请不存在', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 180);
    return;
  }
  activeOrder.value = order;
}

function statusText(status: MiniProgramInvoiceRecord['status']) {
  const map: Record<MiniProgramInvoiceRecord['status'], string> = {
    pending: '待开票',
    issued: '已开票',
    rejected: '已驳回',
  };
  return map[status];
}

function amountText(amount: number) {
  return amount.toLocaleString();
}

function goOrders() {
  uni.redirectTo({ url: '/pages/tenant/orders' });
}

onLoad((query) => {
  hydrate(typeof query?.orderId === 'string' ? query.orderId : undefined);
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.invoice-detail-page {
  min-height: 100vh;
  padding: 22rpx 20rpx 44rpx;
  background: #f4f5f7;
}

.invoice-detail-card {
  overflow: hidden;
  border-radius: 20rpx;
  background: #ffffff;
}

.invoice-detail-head {
  padding: 34rpx 32rpx 30rpx;
  background: linear-gradient(118deg, #ff2f4b 0%, #ff5a35 100%);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.invoice-detail-status {
  color: #ffffff;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 48rpx;
}

.invoice-detail-desc {
  color: rgba(255, 255, 255, 0.84);
  font-size: 26rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.invoice-detail-list {
  padding: 0 30rpx;
}

.invoice-detail-row {
  min-height: 98rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28rpx;
  border-bottom: 1px solid #f1f2f4;
}

.invoice-detail-row:last-child {
  border-bottom: 0;
}

.invoice-detail-row text:first-child {
  width: 150rpx;
  flex: 0 0 auto;
  color: #9ca3af;
  font-size: 28rpx;
  font-weight: 700;
}

.invoice-detail-row text:last-child {
  min-width: 0;
  flex: 1;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 38rpx;
  text-align: right;
  word-break: break-all;
}

.invoice-detail-back {
  height: 84rpx;
  margin: 34rpx 36rpx 0;
  border-radius: 999rpx;
  background: #f31313;
  color: #ffffff;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 84rpx;
}

button::after {
  border: 0;
}
</style>
