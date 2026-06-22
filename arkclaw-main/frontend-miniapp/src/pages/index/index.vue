<template>
  <view class="login-page">
    <view class="login-nav">
      <button class="login-back" @click="handleBack">‹</button>
      <view class="login-capsule">
        <text>•••</text>
        <view />
        <text>◎</text>
      </view>
    </view>

    <view v-if="mode === 'quick'" class="quick-login">
      <text class="login-title">登录云脑Claw企业版</text>
      <view class="login-logo">
        <view class="login-logo__mark" />
      </view>

      <button class="login-primary" @click="handleQuickLogin">授权手机号快捷登录</button>
      <button class="login-link" @click="mode = 'sms'">短信验证码登录</button>
    </view>

    <view v-else class="sms-login">
      <text class="sms-title">验证码登录</text>
      <view class="sms-row">
        <input v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
        <button @click="useLocalPhone">使用本机号码</button>
      </view>
      <view v-if="codeSent" class="sms-row">
        <input v-model="smsCode" type="number" maxlength="6" placeholder="请输入验证码" />
        <button @click="mockFillCode">填入验证码</button>
      </view>
      <view class="sms-agreement">
        <button :class="['login-checkbox', agreed ? 'is-checked' : '']" @click="agreed = !agreed">✓</button>
        <text>我已阅读并同意</text>
        <button @click="showAgreement('用户协议')">用户协议</button>
        <text>和</text>
        <button @click="showAgreement('隐私协议')">隐私协议</button>
      </view>
      <button class="login-primary sms-primary" @click="handleSmsAction">
        {{ codeSent ? '登录' : '获取验证码' }}
      </button>
    </view>

    <view v-if="mode === 'quick'" class="login-agreement">
      <button :class="['login-checkbox', agreed ? 'is-checked' : '']" @click="agreed = !agreed">✓</button>
      <text>我已阅读并同意</text>
      <button @click="showAgreement('用户协议')">用户协议</button>
      <text>和</text>
      <button @click="showAgreement('隐私协议')">隐私协议</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { readAuthRecord, writeAuthRecord, type MiniProgramLoginMethod } from '../../data/authStore';
import { readProfileRecord, writeProfileRecord } from '../../data/profileStore';

const roleStorageKey = 'arkclaw-miniapp-role';
const mockLocalPhone = '13800002026';

const mode = ref<'quick' | 'sms'>('quick');
const agreed = ref(true);
const phone = ref('');
const smsCode = ref('');
const codeSent = ref(false);

onLoad((query) => {
  if (query?.switch === '1') return;
  if (readAuthRecord()) {
    goTenant();
  }
});

onShow(() => {
  uni.hideHomeButton();
});

function requireAgreement() {
  if (agreed.value) return true;
  uni.showToast({ title: '请先阅读并同意用户协议和隐私协议', icon: 'none' });
  return false;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function showAgreement(title: string) {
  uni.showToast({ title: `${title}为演示入口`, icon: 'none' });
}

function handleBack() {
  if (mode.value === 'sms') {
    mode.value = 'quick';
    return;
  }
  uni.showToast({ title: '当前为登录首页', icon: 'none' });
}

function useLocalPhone() {
  phone.value = mockLocalPhone;
}

function mockFillCode() {
  smsCode.value = '952706';
}

function handleQuickLogin() {
  if (!requireAgreement()) return;
  finishLogin(mockLocalPhone, 'phone_authorize');
}

function handleSmsAction() {
  if (!requireAgreement()) return;
  phone.value = normalizePhone(phone.value);
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入有效手机号', icon: 'none' });
    return;
  }
  if (!codeSent.value) {
    codeSent.value = true;
    uni.showToast({ title: '验证码已发送', icon: 'none' });
    return;
  }
  if (!/^\d{6}$/.test(smsCode.value)) {
    uni.showToast({ title: '请输入6位验证码', icon: 'none' });
    return;
  }
  finishLogin(phone.value, 'sms_code');
}

function finishLogin(loginPhone: string, loginMethod: MiniProgramLoginMethod) {
  writeAuthRecord({
    loggedIn: true,
    phone: loginPhone,
    loginMethod,
    loggedInAt: new Date().toISOString(),
  });
  const profile = readProfileRecord();
  writeProfileRecord({
    ...profile,
    phone: loginPhone,
  });
  uni.setStorageSync(roleStorageKey, 'tenant');
  goTenant();
}

function goTenant() {
  uni.redirectTo({ url: '/pages/tenant/index' });
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 112rpx 68rpx calc(116rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}

.login-nav {
  position: absolute;
  top: 64rpx;
  left: 34rpx;
  right: 34rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-back {
  width: 48rpx;
  height: 48rpx;
  color: #1d2129;
  font-size: 56rpx;
  line-height: 44rpx;
}

.login-capsule {
  width: 144rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  border: 1px solid #eef0f4;
  border-radius: 999rpx;
  color: #1d2129;
  font-size: 28rpx;
}

.login-capsule view {
  width: 1px;
  height: 28rpx;
  background: #eef0f4;
}

.quick-login {
  padding-top: 138rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  color: #2f3440;
  font-size: 42rpx;
  font-weight: 500;
  line-height: 58rpx;
}

.login-logo {
  width: 84rpx;
  height: 84rpx;
  margin-top: 52rpx;
  border-radius: 50%;
  background: #ffc72e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo__mark {
  width: 48rpx;
  height: 32rpx;
  border: 14rpx solid #242936;
  border-bottom: 0;
  border-radius: 48rpx 48rpx 0 0;
  position: relative;
}

.login-logo__mark::after {
  content: "";
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  bottom: -20rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #242936;
}

.login-primary {
  width: 100%;
  height: 72rpx;
  margin-top: 66rpx;
  border-radius: 4rpx;
  background: #ffc72e;
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 72rpx;
}

.login-link {
  align-self: flex-end;
  margin-top: 38rpx;
  color: #8a8f99;
  font-size: 24rpx;
  line-height: 34rpx;
}

.login-agreement {
  position: absolute;
  left: 68rpx;
  right: 68rpx;
  bottom: calc(54rpx + env(safe-area-inset-bottom));
}

.login-agreement,
.sms-agreement {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #4e5969;
  font-size: 26rpx;
  line-height: 36rpx;
}

.login-agreement button,
.sms-agreement button {
  color: #3b8cff;
  font-size: 26rpx;
  line-height: 36rpx;
}

.login-checkbox {
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid #e5e8ef;
  border-radius: 4rpx;
  color: transparent !important;
  line-height: 26rpx !important;
  text-align: center;
  font-size: 22rpx !important;
}

.login-checkbox.is-checked {
  border-color: #ffc72e;
  background: #ffc72e;
  color: #1d2129 !important;
}

.sms-login {
  padding-top: 140rpx;
}

.sms-title {
  display: block;
  color: #2f3440;
  font-size: 42rpx;
  font-weight: 500;
  line-height: 58rpx;
}

.sms-row {
  min-height: 76rpx;
  margin-top: 28rpx;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eef0f4;
}

.sms-row input {
  min-width: 0;
  flex: 1;
  height: 76rpx;
  color: #1d2129;
  font-size: 28rpx;
  line-height: 76rpx;
}

.sms-row button {
  flex: 0 0 auto;
  color: #2f77ff;
  font-size: 26rpx;
  line-height: 36rpx;
}

.sms-agreement {
  margin-top: 88rpx;
}

.sms-primary {
  margin-top: 14rpx;
}
</style>
