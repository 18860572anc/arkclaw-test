<template>
  <view class="profile-edit-page">
    <view class="profile-edit-card">
      <view class="profile-edit-head">
        <button class="profile-edit-avatar" @click="chooseAvatar">
          <image v-if="form.avatarUrl" :src="form.avatarUrl" mode="aspectFill" />
          <text v-else>{{ avatarText }}</text>
        </button>
        <view class="profile-edit-head__copy">
          <text>基础资料</text>
          <text>用于小程序账户展示和订单联系信息</text>
        </view>
      </view>

      <view class="profile-form">
        <view class="profile-field">
          <text>姓名</text>
          <input v-model="form.userName" placeholder="请输入姓名" />
        </view>
        <view class="profile-field">
          <text>手机号</text>
          <input v-model="form.phone" type="text" placeholder="请输入手机号" />
        </view>
        <view class="profile-field">
          <text>邮箱</text>
          <input v-model="form.email" type="text" placeholder="请输入邮箱" />
        </view>
        <view class="profile-field">
          <text>企业名称</text>
          <input v-model="form.companyName" placeholder="请输入企业名称" />
        </view>
        <view class="profile-field">
          <text>统一社会信用代码</text>
          <input v-model="form.uscc" type="text" maxlength="18" placeholder="请输入18位统一社会信用代码" @input="handleUsccInput" />
        </view>
      </view>
    </view>

    <view class="profile-save-bar">
      <button class="profile-save-button" @click="saveProfile">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { readProfileRecord, writeProfileRecord, type MiniProgramProfileRecord } from '../data/profileStore';
import { createMiniNotification } from '../data/notificationStore';

const form = reactive<MiniProgramProfileRecord>(readProfileRecord());

const avatarText = computed(() => (form.userName.trim() || '用').slice(0, 1));

function hydrateProfile() {
  Object.assign(form, readProfileRecord());
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const filePath = result.tempFilePaths[0];
      if (!filePath) return;
      form.avatarUrl = filePath;
    },
  });
}

function handleUsccInput(event: { detail?: { value?: string } }) {
  form.uscc = String(event.detail?.value ?? form.uscc)
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 18);
}

function saveProfile() {
  const uscc = form.uscc.trim().toUpperCase();
  if (uscc && !/^[0-9A-Z]{18}$/.test(uscc)) {
    uni.showToast({ title: '统一社会信用代码需为18位字母数字', icon: 'none' });
    return;
  }
  writeProfileRecord({
    userName: form.userName.trim() || '未命名用户',
    phone: form.phone.trim(),
    email: form.email.trim(),
    companyName: form.companyName.trim(),
    uscc,
    avatarUrl: form.avatarUrl,
  });
  createMiniNotification({
    category: 'system',
    priority: 'low',
    title: '资料已更新',
    summary: '你的个人资料已保存，头像和基础信息将在小程序中展示。',
    todo: false,
    actionable: false,
    actionUrl: '',
    actionLabel: '已完成',
    sourceType: 'profile',
    sourceId: 'tenant-profile',
  });
  uni.showToast({ title: '资料已保存', icon: 'none' });
  setTimeout(() => {
    uni.navigateBack();
  }, 180);
}

onLoad(() => {
  hydrateProfile();
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.profile-edit-page {
  min-height: 100vh;
  padding: 24rpx 20rpx calc(148rpx + env(safe-area-inset-bottom));
  background: #f5f6f8;
}

.profile-edit-card {
  padding: 30rpx;
  border-radius: 24rpx;
  background: #ffffff;
}

.profile-edit-head {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding-bottom: 28rpx;
  border-bottom: 2rpx solid #eef0f4;
}

.profile-edit-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(150deg, #1d2129, #4e5969);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
}

.profile-edit-avatar image {
  width: 96rpx;
  height: 96rpx;
}

.profile-edit-avatar text {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.profile-edit-head__copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-edit-head__copy text:first-child {
  color: #1d2129;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 46rpx;
}

.profile-edit-head__copy text:last-child {
  color: #86909c;
  font-size: 26rpx;
  line-height: 36rpx;
}

.profile-form {
  display: flex;
  flex-direction: column;
}

.profile-field {
  min-height: 108rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border-bottom: 2rpx solid #f1f3f6;
}

.profile-field:last-child {
  border-bottom: 0;
}

.profile-field text {
  width: 210rpx;
  flex: 0 0 auto;
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.profile-field input {
  min-width: 0;
  flex: 1;
  height: 76rpx;
  color: #1d2129;
  font-size: 30rpx;
  line-height: 76rpx;
  text-align: right;
}

.profile-save-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8rpx 28rpx rgba(29, 33, 41, 0.08);
}

.profile-save-button {
  height: 84rpx;
  border-radius: 999rpx;
  background: #ffc019;
  color: #111827;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 84rpx;
}
</style>
