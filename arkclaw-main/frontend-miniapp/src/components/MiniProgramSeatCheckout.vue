<template>
  <view class="checkout-page">
    <view class="checkout-section">
      <view class="checkout-section__head">
        <text>订单详情</text>
      </view>

      <view class="checkout-list">
        <view v-for="item in checkoutItems" :key="item.product.key" class="checkout-item">
          <view :class="['checkout-item__visual', `checkout-item__visual--${item.product.tone}`]">
            <view class="checkout-item__screen" />
            <view class="checkout-item__base" />
          </view>
          <view class="checkout-item__main">
            <text class="checkout-item__title">{{ item.product.name }} + {{ item.product.codingPlanName }}</text>
            <text class="checkout-item__price">
              ¥{{ item.product.monthlyPrice }}/月 + ¥{{ item.product.codingPlanMonthlyPrice }}/月
            </text>
            <view class="checkout-item__meta">
              <text>数量 {{ item.count }}</text>
              <text>小计 ¥{{ item.amount.toLocaleString() }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="checkout-section checkout-section--summary">
      <view class="checkout-summary-row">
        <text>商品小计</text>
        <text>¥{{ totalAmountText }}</text>
      </view>
      <view class="checkout-summary-row">
        <text>席位数量</text>
        <text>{{ totalCount }}</text>
      </view>
    </view>

    <view class="checkout-bar">
      <view class="checkout-bar__total">
        <text>合计</text>
        <text>¥ {{ totalAmountText }}</text>
      </view>
      <button class="checkout-submit" @click="goToCashier">去支付</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { type MiniProgramSeatProduct } from '../data/consoleData';
import { createPendingOrderFromCheckout, readCheckoutItems } from '../data/orderStore';

interface CheckoutItem {
  product: MiniProgramSeatProduct;
  count: number;
  amount: number;
}

const checkoutItems = ref<CheckoutItem[]>([]);

const totalCount = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.count, 0));
const totalAmount = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.amount, 0));
const totalAmountText = computed(() => totalAmount.value.toLocaleString());

function hydrateCheckout() {
  checkoutItems.value = readCheckoutItems().map((item) => ({
    product: item.product,
    count: item.count,
    amount: item.amount,
  }));

  if (!checkoutItems.value.length) {
    uni.showToast({ title: '请先选择席位', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 150);
  }
}

function goToCashier() {
  const order = createPendingOrderFromCheckout();
  if (!order) {
    uni.showToast({ title: '请先选择席位', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/tenant/cashier?orderId=${order.id}` });
}

onLoad(() => {
  hydrateCheckout();
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  padding: 20rpx 20rpx calc(164rpx + env(safe-area-inset-bottom));
  background: #f5f5f5;
}

.checkout-section {
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
}

.checkout-section__head {
  padding-bottom: 18rpx;
  border-bottom: 2rpx solid #edf1f6;
}

.checkout-section__head text {
  color: #1d2129;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 52rpx;
}

.checkout-list {
  display: flex;
  flex-direction: column;
}

.checkout-item {
  display: flex;
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f0f3f8;
}

.checkout-item:last-child {
  border-bottom: 0;
}

.checkout-item__visual {
  position: relative;
  width: 132rpx;
  height: 104rpx;
  flex: 0 0 auto;
}

.checkout-item__screen {
  position: absolute;
  left: 22rpx;
  top: 10rpx;
  width: 88rpx;
  height: 58rpx;
  border-radius: 8rpx 8rpx 3rpx 3rpx;
  background: linear-gradient(135deg, #2d3444, #0b1020 56%, #40485b);
  transform: skewX(-10deg);
}

.checkout-item__base {
  position: absolute;
  left: 10rpx;
  top: 70rpx;
  width: 112rpx;
  height: 20rpx;
  border-radius: 4rpx 4rpx 14rpx 14rpx;
  background: linear-gradient(160deg, #f4f7fb, #b8c2d1);
  transform: skewX(-18deg);
}

.checkout-item__visual--blue .checkout-item__base { background: linear-gradient(160deg, #eef4ff, #b9cffd); }
.checkout-item__visual--green .checkout-item__base { background: linear-gradient(160deg, #effff5, #b6e8ca); }
.checkout-item__visual--orange .checkout-item__base { background: linear-gradient(160deg, #fff5e8, #ffd1a6); }
.checkout-item__visual--purple .checkout-item__base { background: linear-gradient(160deg, #f6f0ff, #d6c4ff); }

.checkout-item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.checkout-item__title {
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.checkout-item__price {
  color: #6b778c;
  font-size: 24rpx;
  line-height: 34rpx;
}

.checkout-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 6rpx;
}

.checkout-item__meta text:first-child {
  color: #6b778c;
  font-size: 24rpx;
}

.checkout-item__meta text:last-child {
  color: #ff3b30;
  font-size: 28rpx;
  font-weight: 700;
}

.checkout-section--summary {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.checkout-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.checkout-summary-row text:first-child {
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 600;
}

.checkout-summary-row text:last-child {
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 700;
}

.checkout-bar {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 28rpx;
  background: #2b2f36;
  box-shadow: 0 14rpx 34rpx rgba(29, 33, 41, 0.2);
}

.checkout-bar__total {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.checkout-bar__total text:first-child {
  color: rgba(255, 255, 255, 0.78);
  font-size: 24rpx;
}

.checkout-bar__total text:last-child {
  color: #ffffff;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.checkout-submit {
  min-width: 220rpx;
  height: 80rpx;
  padding: 0 30rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ffd75e, #ffb800);
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
