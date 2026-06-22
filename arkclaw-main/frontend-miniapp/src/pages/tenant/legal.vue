<template>
  <scroll-view class="legal-page" scroll-y>
    <view class="legal-card">
      <text class="legal-title">{{ pageTitle }}</text>
      <text class="legal-body">{{ pageText }}</text>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { privacyPolicyText } from '../../../../frontend/src/pages/public/privacyPolicy';
import { serviceTermsText } from '../../../../frontend/src/pages/public/serviceTerms';

type LegalType = 'privacy' | 'terms';

const legalType = ref<LegalType>('privacy');

const pageTitle = computed(() => (legalType.value === 'privacy' ? '隐私政策' : '服务协议'));
const pageText = computed(() => (legalType.value === 'privacy' ? privacyPolicyText : serviceTermsText));

onLoad((query) => {
  legalType.value = query?.type === 'terms' ? 'terms' : 'privacy';
  uni.setNavigationBarTitle({ title: pageTitle.value });
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.legal-page {
  height: 100vh;
  background: #f5f6f8;
}

.legal-card {
  margin: 20rpx;
  padding: 32rpx 28rpx 44rpx;
  border-radius: 18rpx;
  background: #ffffff;
}

.legal-title {
  display: block;
  margin-bottom: 24rpx;
  color: #1d2129;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.legal-body {
  display: block;
  white-space: pre-wrap;
  color: #303642;
  font-size: 28rpx;
  line-height: 48rpx;
}
</style>
