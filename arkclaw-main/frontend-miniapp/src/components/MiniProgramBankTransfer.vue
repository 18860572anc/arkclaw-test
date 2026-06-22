<template>
  <view class="bank-page">
    <view class="bank-hero">
      <view class="bank-hero__bubble bank-hero__bubble--left" />
      <view class="bank-hero__bubble bank-hero__bubble--right" />
      <view class="bank-hero__city bank-hero__city--left" />
      <view class="bank-hero__city bank-hero__city--right" />
      <view class="bank-hero__mark">
        <text>✓</text>
      </view>
      <text class="bank-hero__title">{{ heroTitle }}</text>
      <view class="bank-hero__amount">
        <text>{{ amountLabel }}</text>
        <text>¥{{ totalAmountText }}</text>
      </view>
      <button class="bank-hero__home" @click="goBackTarget">{{ backButtonText }}</button>
      <view class="bank-mascot">
        <view class="bank-mascot__antenna bank-mascot__antenna--left" />
        <view class="bank-mascot__antenna bank-mascot__antenna--right" />
        <view class="bank-mascot__face">
          <view class="bank-mascot__eye bank-mascot__eye--left" />
          <view class="bank-mascot__eye bank-mascot__eye--right" />
          <view class="bank-mascot__smile" />
        </view>
        <view class="bank-mascot__body" />
        <view class="bank-mascot__thumb">👍</view>
      </view>
    </view>

    <view class="bank-card">
      <view class="bank-card__head bank-card__head--row">
        <text>线下转账信息</text>
        <button class="bank-copy" @click="copyTransferInfo">复制</button>
      </view>

      <view class="bank-info-list">
        <view v-for="item in transferInfo" :key="item.label" class="bank-info-row">
          <text class="bank-info-row__label">{{ item.label }}</text>
          <text class="bank-info-row__value">{{ item.value }}</text>
        </view>
      </view>

      <button class="bank-notice" @click="showNotice">
        <view class="bank-notice__icon">!</view>
        <text>线下电汇注意事项</text>
        <text class="bank-notice__arrow">›</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { clearCheckoutItems, getOrder, readCheckoutItems } from '../data/orderStore';
import { getWalletTopupOrder } from '../data/walletStore';

const totalAmount = ref(0);
const transferMode = ref<'order' | 'topup'>('order');
const activeTopupId = ref('');

const heroTitle = computed(() => (transferMode.value === 'topup' ? '充值申请已提交' : '下单成功'));
const amountLabel = computed(() => (transferMode.value === 'topup' ? '对公转账充值' : '对公转账'));
const backButtonText = computed(() => (transferMode.value === 'topup' ? '回首页' : '回订单'));
const totalAmountText = computed(() => totalAmount.value.toLocaleString());
const transferInfo = computed(() => {
  if (transferMode.value === 'topup') {
    const topupOrder = activeTopupId.value ? getWalletTopupOrder(activeTopupId.value) : undefined;
    const account = topupOrder?.collectionAccount;
    return [
      { label: '户名', value: account?.companyName ?? '云脑智联科技有限公司' },
      { label: '账号', value: account?.accountNo ?? '6222 **** **** 2048' },
      { label: '开户行', value: account ? `${account.bankName}${account.branchName ? ` ${account.branchName}` : ''}` : '招商银行 上海分行营业部' },
      { label: '汇款识别码', value: topupOrder?.uniqueRemarkCode ?? `TENANT-${String(totalAmount.value).replace(/\D/g, '') || '0000'}` },
    ];
  }
  return [
    { label: '户名', value: '上海爪爪科技有限公司' },
    { label: '账号', value: '11050123456789012345' },
    { label: '开户行', value: '招商银行股份有限公司上海张江支行' },
    { label: '联行号', value: '308290005721（非必填）' },
    { label: '汇款识别码', value: `AC${String(totalAmount.value).replace(/\D/g, '') || '0000'}2026` },
  ];
});

function hydrateAmount(orderId?: string, topupId?: string) {
  if (topupId) {
    const topupOrder = getWalletTopupOrder(topupId);
    transferMode.value = 'topup';
    activeTopupId.value = topupId;
    totalAmount.value = topupOrder?.amount ?? 0;
    if (!topupOrder || totalAmount.value <= 0) {
      uni.showToast({ title: '请先确认充值金额', icon: 'none' });
      setTimeout(() => {
        uni.navigateBack();
      }, 150);
    }
    return;
  }

  const order = orderId ? getOrder(orderId) : undefined;
  transferMode.value = 'order';
  activeTopupId.value = '';
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

function copyTransferInfo() {
  const text = transferInfo.value.map((item) => `${item.label}：${item.value}`).join('\n');
  uni.setClipboardData({ data: text, showToast: false });
  uni.showToast({ title: '转账信息已复制', icon: 'none' });
}

function showNotice() {
  uni.showToast({ title: transferMode.value === 'topup' ? '请备注充值识别码后再转账' : '请备注汇款识别码后再转账', icon: 'none' });
}

function goBackTarget() {
  if (transferMode.value === 'order') {
    clearCheckoutStorage();
    uni.reLaunch({ url: '/pages/tenant/orders' });
    return;
  }
  uni.reLaunch({ url: '/pages/tenant/index' });
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
.bank-page {
  min-height: 100vh;
  padding: 0 24rpx 56rpx;
  background: linear-gradient(180deg, #eef6ff 0%, #ffffff 48%, #f5f9ff 100%);
}

.bank-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 520rpx;
  margin: 0 -24rpx;
  padding: 94rpx 48rpx 70rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 46% 18%, rgba(255, 255, 255, 0.96) 0, rgba(255, 255, 255, 0.52) 30%, rgba(255, 255, 255, 0) 58%),
    linear-gradient(135deg, #e5f2ff 0%, #f7fbff 44%, #d7ebff 100%);
}

.bank-hero::after {
  content: '';
  position: absolute;
  left: -8%;
  right: -8%;
  bottom: -56rpx;
  height: 150rpx;
  border-radius: 50% 50% 0 0;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(-2deg);
}

.bank-hero__mark {
  position: relative;
  z-index: 2;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #2680ff, #075eea);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18rpx 34rpx rgba(22, 93, 255, 0.24);
}

.bank-hero__mark text {
  color: #ffffff;
  font-size: 54rpx;
  font-weight: 800;
  line-height: 64rpx;
}

.bank-hero__title {
  position: relative;
  z-index: 2;
  margin-top: 42rpx;
  color: #101828;
  font-size: 64rpx;
  font-weight: 900;
  line-height: 76rpx;
}

.bank-hero__amount {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: baseline;
  gap: 18rpx;
  margin-top: 20rpx;
}

.bank-hero__amount text:first-child {
  color: #1f2937;
  font-size: 36rpx;
  line-height: 48rpx;
}

.bank-hero__amount text:last-child {
  color: #1268f3;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 50rpx;
}

.bank-hero__home {
  position: relative;
  z-index: 2;
  width: 280rpx;
  height: 82rpx;
  margin-top: 42rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #3c8dff, #1169f5);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 82rpx;
  box-shadow: 0 18rpx 34rpx rgba(22, 93, 255, 0.22);
}

.bank-hero__bubble {
  position: absolute;
  z-index: 1;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, #ffffff, rgba(119, 198, 255, 0.42) 58%, rgba(61, 139, 255, 0.12));
  box-shadow: inset 0 0 14rpx rgba(255, 255, 255, 0.8);
}

.bank-hero__bubble--left {
  left: 92rpx;
  top: 200rpx;
}

.bank-hero__bubble--right {
  right: 110rpx;
  top: 118rpx;
  width: 46rpx;
  height: 46rpx;
}

.bank-hero__city {
  position: absolute;
  z-index: 1;
  bottom: 98rpx;
  opacity: 0.22;
  background: linear-gradient(180deg, #7db5ff, #d9edff);
}

.bank-hero__city--left {
  left: 38rpx;
  width: 180rpx;
  height: 150rpx;
  clip-path: polygon(0 100%, 0 38%, 18% 38%, 18% 12%, 28% 38%, 46% 38%, 46% 0, 64% 38%, 82% 38%, 82% 72%, 100% 72%, 100% 100%);
}

.bank-hero__city--right {
  right: 56rpx;
  width: 150rpx;
  height: 118rpx;
  clip-path: polygon(0 100%, 0 42%, 18% 42%, 18% 18%, 32% 42%, 52% 42%, 52% 0, 70% 42%, 100% 42%, 100% 100%);
}

.bank-mascot {
  position: absolute;
  z-index: 2;
  right: 30rpx;
  bottom: 46rpx;
  width: 170rpx;
  height: 190rpx;
}

.bank-mascot__antenna {
  position: absolute;
  top: 0;
  width: 8rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: #1677ff;
  transform-origin: bottom center;
}

.bank-mascot__antenna--left {
  left: 48rpx;
  transform: rotate(-26deg);
}

.bank-mascot__antenna--right {
  right: 54rpx;
  transform: rotate(28deg);
}

.bank-mascot__face {
  position: absolute;
  left: 30rpx;
  top: 36rpx;
  width: 112rpx;
  height: 104rpx;
  border-radius: 46% 46% 50% 50%;
  background: linear-gradient(145deg, #9ae0ff, #2889ff);
  box-shadow: 0 12rpx 24rpx rgba(22, 93, 255, 0.22);
}

.bank-mascot__eye {
  position: absolute;
  top: 36rpx;
  width: 26rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #ffffff;
}

.bank-mascot__eye::after {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  width: 12rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #0a4fc7;
}

.bank-mascot__eye--left {
  left: 22rpx;
}

.bank-mascot__eye--right {
  right: 22rpx;
}

.bank-mascot__smile {
  position: absolute;
  left: 42rpx;
  top: 76rpx;
  width: 28rpx;
  height: 12rpx;
  border-bottom: 4rpx solid #0a4fc7;
  border-radius: 0 0 999rpx 999rpx;
}

.bank-mascot__body {
  position: absolute;
  left: 38rpx;
  bottom: 0;
  width: 106rpx;
  height: 82rpx;
  border-radius: 30rpx 30rpx 12rpx 12rpx;
  background: linear-gradient(145deg, #2484ff, #055ad9);
}

.bank-mascot__thumb {
  position: absolute;
  right: 2rpx;
  bottom: 72rpx;
  font-size: 42rpx;
  line-height: 42rpx;
}

.bank-card {
  position: relative;
  z-index: 3;
  margin-top: 4rpx;
  padding: 44rpx 40rpx 42rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 46rpx rgba(23, 66, 129, 0.1);
}

.bank-card__head {
  margin-bottom: 34rpx;
}

.bank-card__head text {
  color: #101828;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 52rpx;
}

.bank-card__head--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bank-copy {
  padding: 0;
  color: #1677ff;
  font-size: 30rpx;
  font-weight: 800;
  background: transparent;
}

.bank-info-list {
  display: flex;
  flex-direction: column;
}

.bank-info-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #edf1f6;
}

.bank-info-row__label {
  width: 150rpx;
  flex: 0 0 auto;
  color: #8492a6;
  font-size: 31rpx;
  line-height: 44rpx;
}

.bank-info-row__value {
  flex: 1;
  color: #1f2937;
  font-size: 31rpx;
  line-height: 44rpx;
}

.bank-notice {
  height: 110rpx;
  margin-top: 34rpx;
  padding: 0 32rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f3f8ff, #edf5ff);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.bank-notice__icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: linear-gradient(145deg, #3c8dff, #1268f3);
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 56rpx;
  text-align: center;
}

.bank-notice text:nth-child(2) {
  flex: 1;
  color: #1677ff;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 44rpx;
}

.bank-notice__arrow {
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 52rpx;
  line-height: 52rpx;
}
</style>
