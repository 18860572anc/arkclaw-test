<template>
  <view class="invoice-result-page">
    <view class="invoice-result-hero">
      <view class="invoice-result-hero__glow" />
      <text class="invoice-result-title">✓ 已申请</text>
    </view>

    <view class="invoice-result-panel">
      <view class="invoice-result-illustration">
        <view class="invoice-result-dog">
          <view class="invoice-result-dog__ear invoice-result-dog__ear--left" />
          <view class="invoice-result-dog__ear invoice-result-dog__ear--right" />
          <view class="invoice-result-dog__face">
            <view class="invoice-result-dog__eye invoice-result-dog__eye--left" />
            <view class="invoice-result-dog__eye invoice-result-dog__eye--right" />
            <view class="invoice-result-dog__nose" />
            <view class="invoice-result-dog__mouth" />
          </view>
          <view class="invoice-result-dog__paper" />
          <view class="invoice-result-dog__pen" />
          <view class="invoice-result-dog__check">✓</view>
        </view>
      </view>

      <text class="invoice-result-copy">
        发票将在申请通过后48小时内开具，请耐心等候。更多自助服务可在我的-客户服务查看并使用
      </text>

      <button class="invoice-result-detail" @click="goDetail">查看发票详情</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getOrder } from '../../data/orderStore';

const activeOrderId = ref('');

function hydrate(orderId?: string) {
  const order = orderId ? getOrder(orderId) : undefined;
  if (!order?.invoice) {
    uni.showToast({ title: '发票申请不存在', icon: 'none' });
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/tenant/orders' });
    }, 180);
    return;
  }
  activeOrderId.value = order.id;
}

function goDetail() {
  if (!activeOrderId.value) {
    uni.showToast({ title: '发票申请不存在', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/tenant/invoice-detail?orderId=${activeOrderId.value}` });
}

onLoad((query) => {
  hydrate(typeof query?.orderId === 'string' ? query.orderId : undefined);
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.invoice-result-page {
  min-height: 100vh;
  background: #ffffff;
}

.invoice-result-hero {
  position: relative;
  height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(118deg, #ff2f4b 0%, #ff393e 48%, #ff5a35 100%);
}

.invoice-result-hero__glow {
  position: absolute;
  right: 130rpx;
  top: -110rpx;
  width: 270rpx;
  height: 270rpx;
  border-radius: 50%;
  background: rgba(255, 126, 69, 0.42);
}

.invoice-result-title {
  position: relative;
  z-index: 1;
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 52rpx;
}

.invoice-result-panel {
  position: relative;
  min-height: calc(100vh - 150rpx);
  margin-top: -1rpx;
  padding: 190rpx 48rpx 80rpx;
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.invoice-result-illustration {
  width: 280rpx;
  height: 210rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invoice-result-dog {
  position: relative;
  width: 230rpx;
  height: 170rpx;
}

.invoice-result-dog__face {
  position: absolute;
  left: 66rpx;
  top: 12rpx;
  width: 104rpx;
  height: 92rpx;
  border-radius: 48% 48% 44% 44%;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(17, 24, 39, 0.14);
}

.invoice-result-dog__ear {
  position: absolute;
  top: 26rpx;
  width: 54rpx;
  height: 86rpx;
  border-radius: 42rpx;
  background: #eef0f4;
  box-shadow: inset 0 -12rpx 16rpx rgba(0, 0, 0, 0.06);
}

.invoice-result-dog__ear--left {
  left: 30rpx;
  transform: rotate(36deg);
}

.invoice-result-dog__ear--right {
  right: 26rpx;
  transform: rotate(-36deg);
}

.invoice-result-dog__eye {
  position: absolute;
  top: 30rpx;
  width: 10rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #111827;
}

.invoice-result-dog__eye--left {
  left: 26rpx;
  transform: rotate(18deg);
}

.invoice-result-dog__eye--right {
  right: 26rpx;
  transform: rotate(-18deg);
}

.invoice-result-dog__nose {
  position: absolute;
  left: 41rpx;
  top: 44rpx;
  width: 38rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #111827;
}

.invoice-result-dog__mouth {
  position: absolute;
  left: 24rpx;
  top: 62rpx;
  width: 58rpx;
  height: 22rpx;
  border-radius: 0 0 60rpx 60rpx;
  border-bottom: 12rpx solid #f31313;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
}

.invoice-result-dog__paper {
  position: absolute;
  left: 8rpx;
  top: 96rpx;
  width: 78rpx;
  height: 58rpx;
  border-radius: 8rpx;
  background: #f3f4f6;
  transform: rotate(-9deg);
  box-shadow: 0 10rpx 18rpx rgba(17, 24, 39, 0.08);
}

.invoice-result-dog__pen {
  position: absolute;
  left: 104rpx;
  top: 94rpx;
  width: 28rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #ff3b3b, #ff1d27);
  transform: rotate(-38deg);
  box-shadow: 0 12rpx 20rpx rgba(243, 19, 19, 0.18);
}

.invoice-result-dog__check {
  position: absolute;
  right: 12rpx;
  bottom: 18rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #ff3030;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 48rpx;
  text-align: center;
}

.invoice-result-copy {
  display: block;
  width: 100%;
  margin-top: 56rpx;
  color: #c2c6cd;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 44rpx;
  text-align: center;
}

.invoice-result-detail {
  width: 400rpx;
  height: 72rpx;
  margin-top: 86rpx;
  border: 2rpx solid #ff4d45;
  border-radius: 999rpx;
  background: #ffffff;
  color: #ff3939;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 68rpx;
}

button::after {
  border: 0;
}
</style>
