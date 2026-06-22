<template>
  <view class="settings-page">
    <view class="settings-group">
      <button class="settings-item" @click="goProfileEdit">
        <text>编辑资料</text>
        <text class="settings-arrow">›</text>
      </button>
      <view class="settings-divider" />
      <button class="settings-item" @click="goLegal('privacy')">
        <text>隐私政策</text>
        <text class="settings-arrow">›</text>
      </button>
      <view class="settings-divider" />
      <button class="settings-item" @click="goLegal('terms')">
        <text>服务协议</text>
        <text class="settings-arrow">›</text>
      </button>
    </view>

    <view class="settings-group">
      <button class="settings-item" @click="confirmLogout">
        <text>退出登录</text>
        <text class="settings-arrow">›</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { clearAuthRecord } from '../../data/authStore';

onShow(() => {
  uni.hideHomeButton();
});

function goProfileEdit() {
  uni.navigateTo({ url: '/pages/tenant/profile-edit' });
}

function goLegal(type: 'privacy' | 'terms') {
  uni.navigateTo({ url: `/pages/tenant/legal?type=${type}` });
}

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '退出后需要重新授权手机号登录。',
    confirmText: '退出',
    cancelText: '取消',
    success: (result) => {
      if (!result.confirm) return;
      clearAuthRecord();
      uni.reLaunch({ url: '/pages/index/index' });
    },
  });
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 20rpx 20rpx 40rpx;
  background: #f7f7fb;
}

.settings-group {
  margin-top: 20rpx;
  padding: 0 28rpx;
  border-radius: 14rpx;
  background: #ffffff;
}

.settings-item {
  width: 100%;
  min-height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.settings-item text:first-child {
  color: #303642;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 42rpx;
}

.settings-arrow {
  color: #1d2129;
  font-size: 48rpx;
  font-weight: 300;
  line-height: 48rpx;
}

.settings-divider {
  height: 1px;
  background: #eef0f4;
}
</style>
