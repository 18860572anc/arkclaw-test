<template>
  <view v-if="!activeRole" class="role-page">
    <view class="hero">
      <text class="eyebrow">ArkClaw 小程序</text>
      <text class="title">选择使用身份</text>
      <text class="subtitle">H5 预览用于快速检查小程序 UI，最终以微信开发者工具为准。</text>
    </view>

    <view class="role-list">
      <button class="role-card" @click="activeRole = 'tenant'">
          <view class="role-icon">客</view>
          <view class="role-copy">
            <text class="role-title">客户管理员端</text>
            <text class="role-desc">席位购买、充值、消费记录和通知。</text>
          </view>
          <text class="role-arrow">进入</text>
        </button>

      <button class="role-card" @click="activeRole = 'agent'">
        <view class="role-icon role-icon--agent">代</view>
        <view class="role-copy">
          <text class="role-title">代理管理员端</text>
          <text class="role-desc">工作台、进货与余额、客户管理和通知。</text>
        </view>
        <text class="role-arrow">进入</text>
      </button>
    </view>
  </view>

  <MiniProgramConsole
    v-else-if="activeRole === 'tenant'"
    role="tenant"
    role-title="客户管理员小程序"
    default-key="overview"
    :modules="tenantMiniProgramTabs"
    @switch-role="activeRole = ''"
  />

  <MiniProgramConsole
    v-else
    role="agent"
    role-title="代理管理员小程序"
    default-key="dashboard"
    :modules="agentMiniProgramTabs"
    @switch-role="activeRole = ''"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MiniProgramConsole from './components/MiniProgramConsole.vue';
import { agentMiniProgramTabs, tenantMiniProgramTabs, type ConsoleRole } from './data/consoleData';

const activeRole = ref<ConsoleRole | ''>('');
</script>

<style scoped>
.role-page {
  min-height: 100vh;
  padding: 72rpx 28rpx 40rpx;
  background: #f5f7fb;
}

.hero {
  margin-bottom: 44rpx;
}

.eyebrow,
.subtitle,
.role-desc {
  color: #6b778c;
}

.eyebrow {
  display: block;
  font-size: 24rpx;
  line-height: 34rpx;
}

.title {
  display: block;
  margin-top: 12rpx;
  color: #1d2129;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 56rpx;
}

.subtitle {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  line-height: 38rpx;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.role-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding: 30rpx;
  border: 1px solid #e5e8ef;
  border-radius: 8rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(29, 33, 41, 0.03);
  text-align: left;
}

.role-icon {
  width: 84rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 84rpx;
  border-radius: 8rpx;
  background: #eef4ff;
  color: #165dff;
  font-size: 34rpx;
  font-weight: 700;
}

.role-icon--agent {
  background: #e8ffea;
  color: #00a870;
}

.role-copy {
  min-width: 0;
  flex: 1;
}

.role-title {
  display: block;
  color: #1d2129;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 44rpx;
}

.role-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
}

.role-arrow {
  color: #165dff;
  font-size: 26rpx;
  font-weight: 600;
}
</style>
