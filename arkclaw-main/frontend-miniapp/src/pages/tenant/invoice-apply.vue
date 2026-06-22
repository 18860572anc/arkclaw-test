<template>
  <view class="invoice-page">
    <scroll-view class="invoice-scroll" scroll-y>
      <button class="invoice-notice" @click="showPolicyNotice">
        <view class="invoice-notice__icon">i</view>
        <text>根据现行税收政策，部分公司提供数电发票</text>
        <text class="invoice-notice__arrow">›</text>
      </button>

      <view class="invoice-card invoice-card--options">
        <view class="invoice-option-row">
          <text class="invoice-label">发票类型</text>
          <view class="invoice-choice-group">
            <button class="invoice-choice is-active">电子普通发票</button>
            <button class="invoice-choice is-disabled" disabled>专用发票</button>
          </view>
        </view>
        <view class="invoice-divider" />
        <view class="invoice-option-row">
          <text class="invoice-label">抬头类型</text>
          <view class="invoice-choice-group">
            <button class="invoice-choice is-active">单位</button>
          </view>
        </view>
        <view class="invoice-divider" />
        <view class="invoice-field-row">
          <text class="invoice-label">抬头名称</text>
          <input v-model="form.title" class="invoice-input" placeholder="请输入单位抬头" />
        </view>
        <view class="invoice-divider" />
        <view class="invoice-field-row">
          <text class="invoice-label">税号</text>
          <input
            v-model="form.taxNo"
            class="invoice-input"
            maxlength="18"
            placeholder="请输入18位统一社会信用代码"
            @input="handleTaxNoInput"
          />
        </view>
      </view>

      <view class="invoice-card">
        <view class="invoice-field-row">
          <text class="invoice-label">收票邮箱</text>
          <input v-model="form.receiverEmail" class="invoice-input" placeholder="请注意填写正确邮箱格式" />
        </view>
      </view>

      <view v-if="activeOrder" class="invoice-summary">
        <view class="invoice-summary__row">
          <text>关联订单</text>
          <text>{{ activeOrder.id }}</text>
        </view>
        <view class="invoice-summary__row">
          <text>开票金额</text>
          <text>¥{{ amountText(activeOrder.totalAmount) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="invoice-submit-bar">
      <button class="invoice-submit" @click="submitInvoice">申请开票</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getOrder, updateOrder, type MiniProgramOrder } from '../../data/orderStore';
import { createMiniNotification } from '../../data/notificationStore';
import { readProfileRecord } from '../../data/profileStore';

const activeOrder = ref<MiniProgramOrder>();
const form = reactive({
  title: '',
  taxNo: '',
  receiverEmail: '',
});

function hydrate(orderId?: string) {
  const order = orderId ? getOrder(orderId) : undefined;
  if (!order || order.status !== 'completed') {
    uni.showToast({ title: '订单不存在或暂不可开票', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 180);
    return;
  }

  if (order.invoice?.status === 'pending') {
    uni.showToast({ title: '发票申请已提交', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 180);
    return;
  }

  const profile = readProfileRecord();
  activeOrder.value = order;
  form.title = order.invoice?.title || profile.companyName;
  form.taxNo = order.invoice?.taxNo || profile.uscc;
  form.receiverEmail = order.invoice?.receiverEmail || profile.email;
}

function amountText(amount: number) {
  return amount.toLocaleString();
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

function handleTaxNoInput(event: { detail?: { value?: string } }) {
  form.taxNo = String(event.detail?.value ?? form.taxNo)
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 18);
}

function showPolicyNotice() {
  uni.showToast({ title: '当前支持电子普通发票申请', icon: 'none' });
}

function submitInvoice() {
  const order = activeOrder.value;
  const title = form.title.trim();
  const taxNo = form.taxNo.trim().toUpperCase();
  const receiverEmail = form.receiverEmail.trim();

  if (!order) {
    uni.showToast({ title: '订单不存在', icon: 'none' });
    return;
  }
  if (!title) {
    uni.showToast({ title: '请填写发票抬头', icon: 'none' });
    return;
  }
  if (!/^[0-9A-Z]{18}$/.test(taxNo)) {
    uni.showToast({ title: '税号需为18位字母数字', icon: 'none' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
    uni.showToast({ title: '请填写正确的收票邮箱', icon: 'none' });
    return;
  }

  updateOrder(order.id, {
    invoice: {
      status: 'pending',
      type: 'electronic_vat_general',
      contentType: 'goods_detail',
      title,
      taxNo,
      receiverEmail,
      appliedAt: formatDateTime(Date.now()),
    },
  });
  createMiniNotification({
    category: 'order',
    priority: 'medium',
    title: '发票申请已提交',
    summary: `订单 ${order.id} 的发票申请已提交，等待财务开票。`,
    todo: false,
    actionable: true,
    actionUrl: '/pages/tenant/orders',
    actionLabel: '查看订单',
    sourceType: 'invoice',
    sourceId: order.id,
  });

  uni.showToast({ title: '发票申请已提交', icon: 'none' });
  setTimeout(() => {
    uni.redirectTo({ url: `/pages/tenant/invoice-result?orderId=${order.id}` });
  }, 180);
}

onLoad((query) => {
  hydrate(typeof query?.orderId === 'string' ? query.orderId : undefined);
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.invoice-page {
  min-height: 100vh;
  background: #f4f5f7;
}

.invoice-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 18rpx 20rpx calc(132rpx + env(safe-area-inset-bottom));
}

.invoice-notice {
  width: 100%;
  min-height: 76rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 28rpx;
  border-radius: 0;
  background: #ffffff;
  text-align: left;
}

.invoice-notice__icon {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid #ff9a69;
  border-radius: 50%;
  color: #ff8b55;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 24rpx;
  text-align: center;
}

.invoice-notice text:nth-child(2) {
  min-width: 0;
  flex: 1;
  color: #4b5563;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 38rpx;
}

.invoice-notice__arrow {
  color: #ff9a69;
  font-size: 48rpx;
  line-height: 48rpx;
}

.invoice-card {
  margin-top: 22rpx;
  padding: 0 30rpx;
  border-radius: 18rpx;
  background: #ffffff;
}

.invoice-card--options {
  padding-top: 18rpx;
  padding-bottom: 18rpx;
}

.invoice-option-row,
.invoice-field-row {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.invoice-label {
  width: 160rpx;
  flex: 0 0 auto;
  color: #a3a8b1;
  font-size: 29rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.invoice-choice-group {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-wrap: wrap;
}

.invoice-choice {
  min-width: 114rpx;
  height: 54rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 27rpx;
  font-weight: 800;
  line-height: 50rpx;
}

.invoice-choice.is-active {
  border: 3rpx solid #ff7a73;
  background: #fff5f4;
  color: #ff6b64;
}

.invoice-choice.is-disabled {
  background: #f3f4f6;
  color: #a8adb5;
}

.invoice-input {
  min-width: 0;
  flex: 1;
  height: 78rpx;
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 78rpx;
  text-align: left;
}

.invoice-divider {
  height: 1px;
  margin-left: 160rpx;
  background: #f1f2f4;
}

.invoice-summary {
  margin-top: 22rpx;
  padding: 22rpx 30rpx;
  border-radius: 18rpx;
  background: #ffffff;
}

.invoice-summary__row {
  min-height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.invoice-summary__row text:first-child {
  color: #a3a8b1;
  font-size: 26rpx;
  font-weight: 700;
}

.invoice-summary__row text:last-child {
  color: #1f2937;
  font-size: 27rpx;
  font-weight: 700;
  text-align: right;
}

.invoice-submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 56rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
}

.invoice-submit {
  height: 84rpx;
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
