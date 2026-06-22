<template>
  <view class="purchase-page">
    <view class="purchase-body">
      <view class="purchase-grid">
        <view
          v-for="product in tenantSeatProducts"
          :key="product.key"
          :class="['purchase-card', `purchase-card--${product.tone}`, purchaseCounts[product.key] > 0 ? 'is-selected' : '']"
        >
          <view class="purchase-visual">
            <view class="purchase-visual__screen" />
            <view class="purchase-visual__base" />
          </view>
          <text class="purchase-card__name">{{ product.name }} + {{ product.codingPlanName }}</text>
          <text class="purchase-card__summary">{{ product.summary }}</text>
          <view class="purchase-card__foot">
            <view class="purchase-card__price-wrap">
              <text class="purchase-card__price">¥ {{ product.monthlyPrice }}</text>
              <text class="purchase-card__unit">/月</text>
              <text class="purchase-card__price-plus">+</text>
              <text class="purchase-card__price">¥ {{ product.codingPlanMonthlyPrice }}</text>
              <text class="purchase-card__unit">/月</text>
            </view>
          </view>
          <view class="purchase-card__counter">
            <text class="purchase-card__counter-label">数量</text>
            <button v-if="purchaseCounts[product.key] === 0" class="purchase-card__add" @click="incrementPurchase(product.key)">+</button>
            <view v-else class="purchase-stepper">
              <button @click="decrementPurchase(product.key)">−</button>
              <text>{{ purchaseCounts[product.key] }}</text>
              <button @click="incrementPurchase(product.key)">+</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="cartDrawerVisible" class="cart-drawer">
      <view class="cart-drawer__handle" />
      <view class="cart-drawer__head">
        <text>购买详情</text>
        <button @click="closeCartDrawer">收起</button>
      </view>
      <view class="cart-sheet__body">
        <view v-for="item in selectedPurchaseItems" :key="item.product.key" class="cart-line">
          <view class="cart-line__main">
            <text class="cart-line__title">{{ item.product.name }} + {{ item.product.codingPlanName }}</text>
            <text class="cart-line__price">
              ¥{{ item.product.monthlyPrice }}/月 + ¥{{ item.product.codingPlanMonthlyPrice }}/月
            </text>
          </view>
          <view class="cart-line__side">
            <text class="cart-line__amount">¥{{ item.amount.toLocaleString() }}</text>
            <view class="purchase-stepper purchase-stepper--drawer">
              <button @click="decrementPurchase(item.product.key)">−</button>
              <text>{{ item.count }}</text>
              <button @click="incrementPurchase(item.product.key)">+</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="purchase-bar" :class="{ 'purchase-bar--raised': cartDrawerVisible }">
      <view
        class="purchase-total-group"
        :class="{ 'is-disabled': purchaseTotalCount === 0 }"
        @click="toggleCartDrawer"
      >
        <view
          class="cart-trigger"
          :class="{ 'is-disabled': purchaseTotalCount === 0, 'is-active': cartDrawerVisible }"
        >
          <ArcoIcon name="cart" :size="18" :color="purchaseTotalCount > 0 ? '#ff3b30' : '#b8c1d1'" />
          <view v-if="purchaseTotalCount > 0" class="cart-badge">
            <text>{{ purchaseTotalCount }}</text>
          </view>
        </view>
        <view class="purchase-total">
          <text class="purchase-total__label">合计</text>
          <text class="purchase-total__amount">¥ {{ purchaseTotalAmountText }}</text>
        </view>
      </view>
      <button class="purchase-submit" :disabled="purchaseTotalCount === 0" @click="openCheckoutPage">
        去结算（{{ purchaseTotalCount }}）
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ArcoIcon from './ArcoIcon.vue';
import { tenantSeatProducts, type MiniProgramSeatProductKey } from '../data/consoleData';
import { writeCheckoutItems } from '../data/orderStore';

const cartDrawerVisible = ref(false);
const purchaseCounts = ref<Record<MiniProgramSeatProductKey, number>>({
  lite: 0,
  standard: 0,
  pro: 0,
  ultimate: 0,
});

const selectedPurchaseItems = computed(() =>
  tenantSeatProducts
    .map((product) => ({
      product,
      count: purchaseCounts.value[product.key],
      amount: (product.monthlyPrice + product.codingPlanMonthlyPrice) * purchaseCounts.value[product.key],
    }))
    .filter((item) => item.count > 0),
);

const purchaseTotalCount = computed(() => selectedPurchaseItems.value.reduce((sum, item) => sum + item.count, 0));
const purchaseTotalAmount = computed(() => selectedPurchaseItems.value.reduce((sum, item) => sum + item.amount, 0));
const purchaseTotalAmountText = computed(() => purchaseTotalAmount.value.toLocaleString());

watch(purchaseTotalCount, (count) => {
  if (count === 0) {
    cartDrawerVisible.value = false;
  }
});

function setPurchaseCount(key: MiniProgramSeatProductKey, count: number) {
  purchaseCounts.value = {
    ...purchaseCounts.value,
    [key]: Math.max(count, 0),
  };
}

function incrementPurchase(key: MiniProgramSeatProductKey) {
  setPurchaseCount(key, purchaseCounts.value[key] + 1);
}

function decrementPurchase(key: MiniProgramSeatProductKey) {
  setPurchaseCount(key, purchaseCounts.value[key] - 1);
}

function toggleCartDrawer() {
  if (purchaseTotalCount.value === 0) return;
  cartDrawerVisible.value = !cartDrawerVisible.value;
}

function closeCartDrawer() {
  cartDrawerVisible.value = false;
}

function openCheckoutPage() {
  if (purchaseTotalCount.value === 0) return;
  cartDrawerVisible.value = false;
  writeCheckoutItems(selectedPurchaseItems.value.map((item) => ({ key: item.product.key, count: item.count })));
  uni.navigateTo({ url: '/pages/tenant/checkout' });
}
</script>

<style scoped>
.purchase-page {
  min-height: 100vh;
  padding-bottom: calc(184rpx + env(safe-area-inset-bottom));
  background: #f5f5f5;
}

.purchase-body {
  padding: 14rpx 12rpx 24rpx;
}

.purchase-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8rpx;
}

.purchase-card {
  min-height: 348rpx;
  display: flex;
  flex-direction: column;
  padding: 18rpx 18rpx 16rpx;
  border: 2rpx solid transparent;
  background: #ffffff;
}

.purchase-card.is-selected {
  border-color: #ff3b30;
}

.purchase-visual {
  position: relative;
  height: 146rpx;
  margin: 18rpx 0 20rpx;
}

.purchase-visual__screen {
  position: absolute;
  left: 50%;
  top: 18rpx;
  width: 126rpx;
  height: 86rpx;
  border-radius: 8rpx 8rpx 3rpx 3rpx;
  background: linear-gradient(135deg, #2d3444, #0b1020 56%, #40485b);
  box-shadow: 0 12rpx 24rpx rgba(29, 33, 41, 0.18);
  transform: translateX(-44%) skewX(-10deg);
}

.purchase-visual__base {
  position: absolute;
  left: 50%;
  top: 104rpx;
  width: 178rpx;
  height: 28rpx;
  border-radius: 3rpx 3rpx 16rpx 16rpx;
  background: linear-gradient(160deg, #f4f7fb, #b8c2d1);
  box-shadow: 0 8rpx 18rpx rgba(29, 33, 41, 0.12);
  transform: translateX(-52%) skewX(-18deg);
}

.purchase-card--blue .purchase-visual__base { background: linear-gradient(160deg, #eef4ff, #b9cffd); }
.purchase-card--green .purchase-visual__base { background: linear-gradient(160deg, #effff5, #b6e8ca); }
.purchase-card--orange .purchase-visual__base { background: linear-gradient(160deg, #fff5e8, #ffd1a6); }
.purchase-card--purple .purchase-visual__base { background: linear-gradient(160deg, #f6f0ff, #d6c4ff); }

.purchase-card__name {
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.purchase-card__summary {
  min-height: 64rpx;
  margin-top: 8rpx;
  color: #6b778c;
  font-size: 22rpx;
  line-height: 32rpx;
}

.purchase-card__foot {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  margin-top: auto;
}

.purchase-card__price-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4rpx;
}

.purchase-card__price {
  color: #ff0000;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 38rpx;
}

.purchase-card__unit {
  color: #ff0000;
  font-size: 20rpx;
}

.purchase-card__price-plus {
  margin: 0 2rpx;
  color: #ff0000;
  font-size: 24rpx;
  font-weight: 700;
}

.purchase-card__counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid #edf1f6;
}

.purchase-card__counter-label {
  color: #6b778c;
  font-size: 24rpx;
  line-height: 34rpx;
}

.purchase-card__add {
  min-width: 88rpx;
  height: 52rpx;
  padding: 0 20rpx;
  border: 2rpx solid #ff6b5f;
  border-radius: 999rpx;
  color: #ff3b30;
  font-size: 36rpx;
  line-height: 46rpx;
}

.purchase-stepper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 4rpx;
  border-radius: 999rpx;
  background: #fff5f4;
}

.purchase-stepper button {
  width: 48rpx;
  height: 48rpx;
  border: 2rpx solid #ff3b30;
  border-radius: 50%;
  background: #ffffff;
  color: #ff3b30;
  font-size: 30rpx;
  line-height: 42rpx;
}

.purchase-stepper text {
  min-width: 36rpx;
  color: #1d2129;
  font-size: 26rpx;
  font-weight: 700;
  text-align: center;
}

.cart-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 58;
  max-height: 68vh;
  padding: 18rpx 28rpx calc(164rpx + env(safe-area-inset-bottom));
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
  box-shadow: 0 -12rpx 30rpx rgba(29, 33, 41, 0.12);
}

.cart-drawer__handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 18rpx;
  border-radius: 999rpx;
  background: #d5dbe5;
}

.cart-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.cart-drawer__head text {
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
}

.cart-drawer__head button {
  color: #165dff;
  font-size: 24rpx;
}

.cart-sheet__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #edf1f6;
}

.cart-line:last-child {
  border-bottom: 0;
}

.cart-line__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cart-line__title {
  color: #1d2129;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 36rpx;
}

.cart-line__price {
  color: #6b778c;
  font-size: 22rpx;
  line-height: 32rpx;
}

.cart-line__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14rpx;
}

.cart-line__amount {
  color: #ff3b30;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 34rpx;
}

.purchase-stepper--drawer {
  padding: 2rpx 4rpx;
}

.purchase-bar {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  z-index: 66;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(29, 33, 41, 0.12);
}

.purchase-bar--raised {
  box-shadow: 0 14rpx 34rpx rgba(29, 33, 41, 0.16);
}

.purchase-total-group {
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 18rpx;
  padding-right: 8rpx;
}

.purchase-total-group.is-disabled {
  opacity: 0.72;
}

.cart-trigger {
  position: relative;
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: #fff5f4;
  box-shadow: inset 0 0 0 2rpx rgba(255, 59, 48, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-trigger.is-active {
  transform: translateY(-4rpx);
}

.cart-trigger.is-disabled {
  background: #f3f5f8;
  box-shadow: inset 0 0 0 2rpx rgba(184, 193, 209, 0.18);
}

.cart-badge {
  position: absolute;
  top: 8rpx;
  right: 4rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-badge text {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1;
}

.purchase-total {
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: baseline;
  gap: 10rpx;
}

.purchase-total__label {
  color: #6b778c;
  font-size: 24rpx;
  line-height: 32rpx;
}

.purchase-total__amount {
  color: #ff4d4f;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.purchase-submit {
  min-width: 210rpx;
  height: 76rpx;
  padding: 0 30rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff6a5f, #ff2f2f);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
}

.purchase-submit[disabled] {
  opacity: 0.45;
}
</style>
