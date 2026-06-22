<template>
  <view class="invoice-center-page">
    <view class="invoice-center-tabs">
      <button :class="['invoice-center-tab', activeTab === 'records' ? 'is-active' : '']" @click="activeTab = 'records'">
        申请记录
      </button>
      <button :class="['invoice-center-tab', activeTab === 'titles' ? 'is-active' : '']" @click="activeTab = 'titles'">
        抬头管理
      </button>
    </view>

    <button class="invoice-rule" @click="showRule">
      <view class="invoice-rule__icon">!</view>
      <text>发票补开、换开、抬头管理维护受到规则限制</text>
      <text class="invoice-rule__arrow">›</text>
    </button>

    <scroll-view class="invoice-center-scroll" scroll-y>
      <view v-if="activeTab === 'records'" class="invoice-record-list">
        <view v-if="invoiceOrders.length">
          <view v-for="order in invoiceOrders" :key="order.id" class="invoice-record-card">
            <view class="invoice-record-card__head">
              <text class="invoice-record-brand">ArkClaw</text>
              <text class="invoice-record-time">{{ order.invoice?.appliedAt }} 申请</text>
            </view>
            <view class="invoice-record-main">
              <view class="invoice-record-products">
                <view v-for="item in order.items.slice(0, 3)" :key="item.key" class="invoice-product-thumb">
                  <text>{{ item.name.slice(0, 1) }}</text>
                </view>
              </view>
              <view class="invoice-record-amount">
                <text>{{ invoiceStatusText(order.invoice?.status) }}</text>
                <text>¥{{ amountText(order.totalAmount) }}</text>
              </view>
            </view>
            <view class="invoice-record-meta">
              <text>数电普票-商品明细-单位</text>
              <text>抬头名称 {{ order.invoice?.title }}</text>
            </view>
            <view class="invoice-record-actions">
              <button @click="goInvoiceDetail(order.id)">查看详情</button>
            </view>
          </view>
        </view>

        <view v-else class="invoice-empty">
          <text>暂无申请记录</text>
          <button @click="goOrders">前往订单申请发票</button>
        </view>
      </view>

      <view v-else class="invoice-title-management">
        <view class="invoice-title-warning">
          <text>i</text>
          <text>抬头信息仅用于开具发票，请勿用于转账等其他用途，谨防受骗！</text>
        </view>

        <view class="invoice-title-card">
          <text class="invoice-title-card__title">普通发票抬头-单位</text>
          <view v-if="companyTitles.length" class="invoice-title-list">
            <view v-for="item in companyTitles" :key="item.id" class="invoice-title-row">
              <view>
                <text>{{ item.name }}</text>
                <text>{{ item.taxNo || '未填写税号' }}</text>
              </view>
              <button @click="goTitleEdit(item.id)">✎</button>
            </view>
          </view>
          <view v-else class="invoice-title-empty">暂无单位抬头</view>
        </view>

        <view class="invoice-title-card">
          <text class="invoice-title-card__title">普通发票抬头-个人</text>
          <view v-if="personalTitles.length" class="invoice-title-list">
            <view v-for="item in personalTitles" :key="item.id" class="invoice-title-row">
              <view>
                <text>{{ item.name }}</text>
              </view>
              <button @click="goTitleEdit(item.id)">✎</button>
            </view>
          </view>
          <view v-else class="invoice-title-empty">暂无个人抬头</view>
        </view>
      </view>
    </scroll-view>

    <view v-if="activeTab === 'titles'" class="invoice-title-submit-bar">
      <button @click="goTitleCreate">添加发票抬头</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { readOrders, type MiniProgramInvoiceStatus } from '../../data/orderStore';
import { readInvoiceTitles, type MiniInvoiceTitleRecord } from '../../data/invoiceTitleStore';

const activeTab = ref<'records' | 'titles'>('records');
const invoiceTitles = ref<MiniInvoiceTitleRecord[]>([]);

const invoiceOrders = computed(() => readOrders().filter((order) => Boolean(order.invoice)));
const companyTitles = computed(() => invoiceTitles.value.filter((item) => item.kind === 'company'));
const personalTitles = computed(() => invoiceTitles.value.filter((item) => item.kind === 'personal'));

function hydrateTitles() {
  invoiceTitles.value = readInvoiceTitles();
}

function invoiceStatusText(status?: MiniProgramInvoiceStatus) {
  const map: Record<MiniProgramInvoiceStatus, string> = {
    pending: '换开中',
    issued: '已开票',
    rejected: '已驳回',
  };
  return status ? map[status] : '待开票';
}

function amountText(amount: number) {
  return amount.toLocaleString();
}

function showRule() {
  uni.showToast({ title: '当前仅开放申请记录与抬头管理', icon: 'none' });
}

function goInvoiceDetail(orderId: string) {
  uni.navigateTo({ url: `/pages/tenant/invoice-detail?orderId=${orderId}` });
}

function goOrders() {
  uni.navigateTo({ url: '/pages/tenant/orders' });
}

function goTitleCreate() {
  uni.navigateTo({ url: '/pages/tenant/invoice-title-edit' });
}

function goTitleEdit(id: string) {
  uni.navigateTo({ url: `/pages/tenant/invoice-title-edit?id=${id}` });
}

onLoad((query) => {
  activeTab.value = query?.tab === 'titles' ? 'titles' : 'records';
});

onShow(() => {
  uni.hideHomeButton();
  hydrateTitles();
});
</script>

<style scoped>
.invoice-center-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.invoice-center-tabs {
  height: 86rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #ffffff;
}

.invoice-center-tab {
  position: relative;
  height: 86rpx;
  padding: 0 18rpx;
  background: transparent;
  color: #111827;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 86rpx;
}

.invoice-center-tab.is-active {
  color: #f31313;
}

.invoice-center-tab.is-active::after {
  content: '';
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 8rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: #f31313;
}

.invoice-rule {
  width: 100%;
  height: 72rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 28rpx;
  background: #fff7df;
  text-align: left;
}

.invoice-rule__icon {
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid #d8912b;
  border-radius: 50%;
  color: #d8912b;
  font-size: 20rpx;
  line-height: 28rpx;
  text-align: center;
}

.invoice-rule text:nth-child(2) {
  min-width: 0;
  flex: 1;
  color: #c47d18;
  font-size: 27rpx;
  font-weight: 700;
}

.invoice-rule__arrow {
  color: #d8912b;
  font-size: 44rpx;
}

.invoice-center-scroll {
  height: calc(100vh - 158rpx);
}

.invoice-record-list,
.invoice-title-management {
  padding: 20rpx;
}

.invoice-record-card {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: #ffffff;
}

.invoice-record-card__head,
.invoice-record-main,
.invoice-record-meta,
.invoice-record-actions {
  display: flex;
  align-items: center;
}

.invoice-record-card__head {
  justify-content: space-between;
  gap: 20rpx;
}

.invoice-record-brand {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
}

.invoice-record-time {
  color: #9ca3af;
  font-size: 26rpx;
  font-weight: 700;
}

.invoice-record-main {
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 20rpx;
}

.invoice-record-products {
  display: flex;
  gap: 14rpx;
}

.invoice-product-thumb {
  width: 86rpx;
  height: 86rpx;
  border-radius: 8rpx;
  background: #f2f4f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invoice-product-thumb text {
  color: #6b7280;
  font-size: 34rpx;
  font-weight: 900;
}

.invoice-record-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.invoice-record-amount text:first-child {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 800;
}

.invoice-record-amount text:last-child {
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
}

.invoice-record-meta {
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 18rpx;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  background: #f4f5f8;
}

.invoice-record-meta text {
  min-width: 0;
  color: #6b7280;
  font-size: 26rpx;
  font-weight: 700;
}

.invoice-record-actions {
  justify-content: flex-end;
  margin-top: 18rpx;
}

.invoice-record-actions button {
  min-width: 150rpx;
  height: 66rpx;
  border-radius: 8rpx;
  background: #f4f5f8;
  color: #374151;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 66rpx;
}

.invoice-empty,
.invoice-title-empty {
  color: #9ca3af;
  font-size: 28rpx;
  font-weight: 700;
  text-align: center;
}

.invoice-empty {
  min-height: 520rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.invoice-empty button {
  min-width: 240rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #f31313;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 72rpx;
}

.invoice-title-warning {
  display: flex;
  gap: 14rpx;
  padding: 0 22rpx 22rpx;
}

.invoice-title-warning text:first-child {
  width: 30rpx;
  height: 30rpx;
  flex: 0 0 auto;
  border: 2rpx solid #ff3838;
  border-radius: 50%;
  color: #ff3838;
  font-size: 20rpx;
  line-height: 28rpx;
  text-align: center;
}

.invoice-title-warning text:last-child {
  color: #ff3838;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 38rpx;
}

.invoice-title-card {
  margin-bottom: 18rpx;
  padding: 24rpx 30rpx 10rpx;
  border-radius: 20rpx;
  background: #ffffff;
}

.invoice-title-card__title {
  display: block;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f1f2f4;
  color: #111827;
  font-size: 29rpx;
  font-weight: 900;
}

.invoice-title-row {
  min-height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  border-bottom: 1px solid #f1f2f4;
}

.invoice-title-row:last-child {
  border-bottom: 0;
}

.invoice-title-row view {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.invoice-title-row view text:first-child {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 40rpx;
}

.invoice-title-row view text:last-child {
  color: #9ca3af;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 34rpx;
}

.invoice-title-row button {
  width: 60rpx;
  height: 60rpx;
  background: transparent;
  color: #374151;
  font-size: 38rpx;
  line-height: 60rpx;
}

.invoice-title-submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 56rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
}

.invoice-title-submit-bar button {
  height: 84rpx;
  border-radius: 999rpx;
  background: linear-gradient(110deg, #ff1616, #ff5a1f);
  color: #ffffff;
  font-size: 31rpx;
  font-weight: 900;
  line-height: 84rpx;
}

button::after {
  border: 0;
}
</style>
