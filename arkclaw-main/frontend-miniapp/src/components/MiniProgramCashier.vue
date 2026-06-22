<template>
  <view class="cashier-page">
    <view class="cashier-hero">
      <text class="cashier-hero__label">{{ heroLabel }}</text>
      <text class="cashier-hero__amount">¥{{ totalAmountText }}</text>
    </view>

    <view class="cashier-panel">
      <view class="cashier-panel__head">
        <text>选择支付方式</text>
      </view>

      <view class="payment-list">
        <view
          v-for="method in paymentMethods"
          :key="method.key"
          class="payment-item"
          @click="selectedMethod = method.key"
        >
          <view :class="['payment-item__icon', `payment-item__icon--${method.key}`]">
            <text>{{ method.icon }}</text>
          </view>
          <view class="payment-item__main">
            <text class="payment-item__title">{{ method.name }}</text>
            <text v-if="method.desc" class="payment-item__desc">{{ method.desc }}</text>
          </view>
          <view :class="['payment-item__radio', selectedMethod === method.key ? 'is-active' : '']">
            <text v-if="selectedMethod === method.key">✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="cashier-bar">
      <button class="cashier-submit" @click="submitPayment">{{ submitLabel }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  clearCheckoutItems,
  getOrder,
  readCheckoutItems,
  updateOrder,
  type MiniProgramPaymentMethod,
} from '../data/orderStore';
import { createMiniNotification } from '../data/notificationStore';
import { completeWalletTopup, formatMiniMoney, getWalletTopupOrder, readWalletState } from '../data/walletStore';

type PaymentMethodKey = 'wechat' | 'wallet' | 'bank';
type CashierMode = 'order' | 'topup';

const orderPaymentMethods: Array<{
  key: PaymentMethodKey;
  name: string;
  desc: string;
  icon: string;
}> = [
  { key: 'wechat', name: '微信支付', desc: '推荐使用当前微信完成支付', icon: '微' },
  { key: 'wallet', name: '钱包支付', desc: '可用余额：¥0', icon: '钱' },
  { key: 'bank', name: '对公转账', desc: '线下转账后由人工审核入账', icon: '公' },
];

const topupPaymentMethods: Array<{
  key: Exclude<PaymentMethodKey, 'wallet'>;
  name: string;
  desc: string;
  icon: string;
}> = [
  { key: 'wechat', name: '微信支付', desc: '推荐使用当前微信完成充值', icon: '微' },
  { key: 'bank', name: '对公转账', desc: '线下转账后由财务审核入账', icon: '公' },
];

const cashierMode = ref<CashierMode>('order');
const selectedMethod = ref<PaymentMethodKey>('wechat');
const totalAmount = ref(0);
const activeOrderId = ref('');
const activeTopupId = ref('');

const heroLabel = computed(() => (cashierMode.value === 'topup' ? '充值金额' : '需支付'));
const totalAmountText = computed(() => totalAmount.value.toLocaleString());
const paymentMethods = computed(() => {
  if (cashierMode.value === 'topup') return topupPaymentMethods;
  const wallet = readWalletState();
  return orderPaymentMethods.map((method) =>
    method.key === 'wallet' ? { ...method, desc: `可用余额：${formatMiniMoney(wallet.balance)}` } : method,
  );
});
const submitLabel = computed(() => {
  if (cashierMode.value === 'topup') {
    if (selectedMethod.value === 'wechat') return '使用微信支付充值';
    return '查看对公转账信息';
  }
  if (selectedMethod.value === 'wechat') return '使用微信支付';
  if (selectedMethod.value === 'wallet') return '使用钱包支付';
  return '提交对公转账申请';
});

function hydrateAmount(orderId?: string, topupId?: string) {
  if (topupId) {
    const order = getWalletTopupOrder(topupId);
    activeOrderId.value = '';
    activeTopupId.value = topupId;
    cashierMode.value = 'topup';
    selectedMethod.value = 'wechat';
    totalAmount.value = order?.amount ?? 0;
    if (!order || totalAmount.value <= 0) {
      uni.showToast({ title: '请先确认充值金额', icon: 'none' });
      setTimeout(() => {
        uni.navigateBack();
      }, 150);
    }
    return;
  }

  activeOrderId.value = orderId ?? '';
  activeTopupId.value = '';
  cashierMode.value = 'order';
  selectedMethod.value = 'wechat';
  const order = activeOrderId.value ? getOrder(activeOrderId.value) : undefined;
  totalAmount.value = order?.totalAmount ?? readCheckoutItems().reduce((sum, item) => sum + item.amount, 0);

  if (totalAmount.value <= 0) {
    uni.showToast({ title: '请先确认订单', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 150);
  }
}

function clearCheckoutStorage() {
  clearCheckoutItems();
}

function submitPayment() {
  if (cashierMode.value === 'topup') {
    submitTopupPayment();
    return;
  }

  if (selectedMethod.value === 'bank') {
    uni.navigateTo({ url: activeOrderId.value ? `/pages/tenant/bank-transfer?orderId=${activeOrderId.value}` : '/pages/tenant/bank-transfer' });
    return;
  }

  const messageMap: Record<PaymentMethodKey, string> = {
    wechat: '已发起微信支付',
    wallet: '钱包支付申请已提交',
    bank: '对公转账信息已提交',
  };

  uni.showToast({ title: messageMap[selectedMethod.value], icon: 'none' });
  if (activeOrderId.value) {
    updateOrder(activeOrderId.value, {
      status: 'completed',
      paymentMethod: selectedMethod.value as MiniProgramPaymentMethod,
    });
    createMiniNotification({
      category: 'order',
      priority: 'medium',
      title: '订单支付成功',
      summary: `订单 ${activeOrderId.value} 已完成支付，平台将开始开通服务。`,
      todo: false,
      actionable: true,
      actionUrl: '/pages/tenant/orders',
      actionLabel: '查看订单',
      sourceType: 'order',
      sourceId: activeOrderId.value,
    });
  }
  clearCheckoutStorage();
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/tenant/orders' });
  }, 180);
}

function submitTopupPayment() {
  if (!activeTopupId.value) {
    uni.showToast({ title: '充值单不存在', icon: 'none' });
    return;
  }
  if (selectedMethod.value === 'bank') {
    completeWalletTopup(activeTopupId.value, 'bank_transfer');
    createMiniNotification({
      category: 'review',
      priority: 'medium',
      title: '钱包充值待对公转账',
      summary: `充值单 ${activeTopupId.value} 已生成，请按页面转账信息完成汇款。`,
      todo: true,
      actionable: true,
      actionUrl: `/pages/tenant/bank-transfer?topupId=${activeTopupId.value}`,
      actionLabel: '查看转账信息',
      sourceType: 'wallet_topup',
      sourceId: activeTopupId.value,
    });
    uni.navigateTo({ url: `/pages/tenant/bank-transfer?topupId=${activeTopupId.value}` });
    return;
  }

  const result = completeWalletTopup(activeTopupId.value, 'wechat');
  createMiniNotification({
    category: 'order',
    priority: 'medium',
    title: '钱包充值已入账',
    summary: `微信支付充值 ${formatMiniMoney(totalAmount.value)} 已进入账户钱包。`,
    todo: false,
    actionable: true,
    actionUrl: '/pages/tenant/index',
    actionLabel: '查看钱包',
    sourceType: 'wallet_topup',
    sourceId: result.ledger?.id ?? activeTopupId.value,
  });
  uni.showToast({ title: '钱包充值已入账', icon: 'none' });
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/tenant/index' });
  }, 180);
}

onLoad((query) => {
  hydrateAmount(
    typeof query?.orderId === 'string' ? query.orderId : undefined,
    typeof query?.topupId === 'string' ? query.topupId : undefined,
  );
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.cashier-page {
  min-height: 100vh;
  padding: 56rpx 24rpx calc(164rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.cashier-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 40rpx 0 52rpx;
  border-bottom: 2rpx solid #edf1f6;
}

.cashier-hero__label {
  color: #6b778c;
  font-size: 28rpx;
  line-height: 38rpx;
}

.cashier-hero__amount {
  color: #1d2129;
  font-size: 72rpx;
  font-weight: 800;
  line-height: 80rpx;
}

.cashier-panel {
  padding-top: 56rpx;
}

.cashier-panel__head {
  padding-bottom: 28rpx;
}

.cashier-panel__head text {
  color: #6b778c;
  font-size: 30rpx;
  line-height: 42rpx;
}

.payment-list {
  display: flex;
  flex-direction: column;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 26rpx 4rpx;
}

.payment-item__icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-item__icon text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
}

.payment-item__icon--wechat {
  background: #1aad19;
}

.payment-item__icon--wallet {
  background: #ff4d4f;
}

.payment-item__icon--bank {
  background: #165dff;
}

.payment-item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.payment-item__title {
  color: #1d2129;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.payment-item__desc {
  color: #86909c;
  font-size: 24rpx;
  line-height: 32rpx;
}

.payment-item__radio {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: #f2f3f5;
  box-shadow: inset 0 0 0 2rpx #d9dde4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-item__radio.is-active {
  background: #ffb800;
  box-shadow: none;
}

.payment-item__radio text {
  color: #1d2129;
  font-size: 22rpx;
  font-weight: 700;
}

.cashier-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.cashier-submit {
  height: 84rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ffd75e, #ffb800);
  color: #1d2129;
  font-size: 34rpx;
  font-weight: 700;
}
</style>
