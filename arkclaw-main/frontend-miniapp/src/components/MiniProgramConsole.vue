<template>
  <view class="mini-console">
    <view class="page-head">
      <view>
        <text class="page-title">{{ active.title }}</text>
      </view>
      <button class="switch-button" @click="handleHeaderAction">{{ headerActionText }}</button>
    </view>

    <view v-if="active.key === 'overview'" class="seat-overview-section">
      <view class="seat-card-grid">
        <view v-for="seat in active.seats" :key="seat.name" class="seat-card">
          <text class="seat-card__name">{{ seat.name }}</text>
          <view class="seat-card__bar">
            <view class="seat-card__bar-fill" :style="{ width: seatProgress(seat.assigned, seat.purchased) }" />
          </view>
          <view class="seat-card__meta">
            <text class="seat-card__label">已开通/已购买</text>
            <view class="seat-card__count">
              <text>{{ seat.assigned }}/{{ seat.purchased }}</text>
              <text class="seat-card__remain">剩余 {{ remainingSeats(seat.assigned, seat.purchased) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="active.key === 'profile'" class="profile-home">
      <view class="profile-user">
        <view class="profile-avatar">
          <image v-if="profileRecord.avatarUrl" :src="profileRecord.avatarUrl" mode="aspectFill" />
          <template v-else>
            <view class="profile-avatar__head" />
            <view class="profile-avatar__body" />
          </template>
        </view>
        <view class="profile-user__copy">
          <text class="profile-user__name">{{ profileRecord.userName }}</text>
          <button class="profile-user__welcome" @click="openAction('个人资料')">
            <text>{{ active.profile?.welcomeText }}</text>
            <text class="profile-arrow">›</text>
          </button>
        </view>
      </view>

      <view class="profile-wallet">
        <view class="profile-wallet__head">
          <view class="profile-wallet__title">
            <ArcoIcon name="wallet" color="#FFFFFF" :size="25" />
            <text>{{ active.profile?.walletTitle }}</text>
          </view>
          <button class="profile-wallet__action" @click="openAction('充值')">
            <text>{{ active.profile?.walletAction }}</text>
            <text>›</text>
          </button>
        </view>
        <view class="profile-wallet__amount">
          <text>{{ active.balance?.tip }}</text>
          <text>{{ walletBalanceText }}</text>
        </view>
        <view class="profile-wallet__art">
          <view class="profile-wallet__pocket" />
          <view class="profile-wallet__card profile-wallet__card--front" />
          <view class="profile-wallet__card profile-wallet__card--back" />
          <view class="profile-wallet__shield">✓</view>
        </view>
      </view>

      <view class="profile-shortcuts">
        <button
          v-for="(item, index) in active.profile?.quickActions"
          :key="item.title"
          :class="['profile-shortcut', index === 0 ? 'profile-shortcut--divider' : '']"
          @click="openAction(item.action)"
        >
          <ArcoIcon :name="item.icon" color="#1677FF" :size="28" />
          <view>
            <text>{{ item.title }}</text>
            <text>{{ quickActionSubtitle(item.action, item.subtitle) }}</text>
          </view>
        </button>
      </view>

      <view class="profile-menu-card">
        <button v-for="item in active.profile?.menuItems" :key="item.title" class="profile-menu-item" @click="openAction(item.action)">
          <ArcoIcon :name="item.icon" color="#1D2129" :size="25" />
          <text>{{ item.title }}</text>
          <text class="profile-menu-item__arrow">›</text>
        </button>
      </view>
    </view>

    <view v-else-if="active.key === 'api-keys'" class="api-dashboard">
      <view class="summary-card">
        <view class="summary-card__top">
          <view class="module-mark">A</view>
          <view class="summary-card__copy">
            <text class="module-title">{{ active.title }}</text>
            <text class="module-summary">{{ active.summary }}</text>
          </view>
        </view>
        <view class="metric-row metric-row--wrap">
          <view v-for="metric in active.metrics" :key="metric.label" :class="['metric-card', `metric-card--${metric.tone}`]">
            <text class="metric-card__label">{{ metric.label }}</text>
            <text class="metric-card__value">{{ metric.value }}</text>
          </view>
        </view>
      </view>

      <view v-if="active.alerts?.length" class="api-alert-card">
        <view class="section-head section-head--compact">
          <text>风险提醒</text>
          <text class="count-badge">{{ active.alerts.length }} 条</text>
        </view>
        <view v-for="alert in active.alerts" :key="alert" class="api-alert-item">{{ alert }}</view>
      </view>
    </view>

    <view v-else class="summary-card">
      <view class="summary-card__top">
        <view class="module-mark">{{ active.title.slice(0, 1) }}</view>
        <view class="summary-card__copy">
          <text class="module-title">{{ active.title }}</text>
          <text class="module-summary">{{ active.summary }}</text>
        </view>
      </view>
      <view class="metric-row">
        <view v-for="metric in active.metrics" :key="metric.label" :class="['metric-card', `metric-card--${metric.tone}`]">
          <text class="metric-card__label">{{ metric.label }}</text>
          <text class="metric-card__value">{{ metric.value }}</text>
        </view>
      </view>
    </view>

    <view v-if="active.actions.length" class="quick-actions">
      <button
        v-for="(action, index) in active.actions"
        :key="action"
        :class="index === 0 ? 'primary-action' : 'secondary-action'"
        @click="handleQuickAction(action)"
      >
        {{ action }}
      </button>
    </view>

    <view v-if="active.key === 'api-keys'" class="content-card">
      <view class="section-head">
        <text>{{ active.listTitle }}</text>
        <text class="count-badge">{{ active.apiKeys?.length ?? 0 }} 条</text>
      </view>
      <view class="record-list">
        <view v-for="item in active.apiKeys" :key="item.keyPreview" class="api-key-card">
          <view class="api-key-card__head">
            <view class="record-main">
              <text class="record-title">{{ item.name }}</text>
              <text class="record-desc">{{ item.keyPreview }} / {{ item.group }}</text>
            </view>
            <view :class="['record-status', item.status === '启用' ? '' : 'record-status--muted']">{{ item.status }}</view>
          </view>
          <view class="api-key-grid">
            <view><text>今日费用</text><text>{{ item.todayCost }}</text></view>
            <view><text>近 30 天</text><text>{{ item.monthCost }}</text></view>
            <view><text>速率限制</text><text>{{ item.rateLimit }}</text></view>
            <view><text>额度限制</text><text>{{ item.quotaLimit }}</text></view>
            <view><text>过期时间</text><text>{{ item.expiresAt }}</text></view>
          </view>
          <text v-if="item.alert" class="api-key-alert">{{ item.alert }}</text>
          <button v-if="item.status === '启用'" class="danger-action" @click="openAction(`紧急禁用 ${item.name}`)">紧急禁用</button>
        </view>
      </view>
    </view>

    <view v-else-if="active.key !== 'overview' && active.key !== 'profile'" class="content-card">
      <view class="section-head">
        <text>{{ active.listTitle }}</text>
        <text class="count-badge">{{ active.list.length }} 条</text>
      </view>
      <view class="record-list">
        <button v-for="item in active.list" :key="`${item.title}-${item.meta}`" class="record-item" @click="openAction('查看详情')">
          <view class="record-main">
            <text class="record-title">{{ item.title }}</text>
            <text class="record-desc">{{ item.subtitle }}</text>
            <text class="record-meta">{{ item.meta }}</text>
          </view>
          <view class="record-status">{{ item.status }}</view>
        </button>
      </view>
    </view>

    <view class="bottom-tabs">
      <button v-for="item in modules" :key="item.key" :class="{ active: item.key === active.key }" @click="switchModule(item.key)">
        <ArcoIcon :name="tabIconName(item.key)" :color="item.key === active.key ? '#165DFF' : '#86909C'" :size="20" />
        <text class="tab-label">{{ tabLabel(item.key, item.title) }}</text>
      </button>
    </view>

    <view v-if="actionVisible" class="sheet-mask" @click="closeAction">
      <view class="action-sheet" @click.stop>
        <view class="sheet-head">
          <text>{{ actionTitle }}</text>
          <button @click="closeAction">关闭</button>
        </view>

        <view v-if="role === 'tenant' && active.key === 'profile' && actionTitle === '充值'" class="sheet-content">
          <view class="highlight-box">
            <text class="highlight-title">账户钱包充值</text>
            <text class="highlight-desc">先选择本次要充值到企业账户钱包的金额，下一步进入小程序收银台完成支付。</text>
          </view>

          <view class="topup-flow">
            <view class="detail-list">
              <view><text>当前余额</text><text>{{ walletBalanceText }}</text></view>
              <view><text>最低充值</text><text>¥100</text></view>
            </view>
            <view class="topup-amount-grid">
              <button
                v-for="amount in topupAmountOptions"
                :key="amount"
                :class="['topup-amount-card', topupAmountMode === amount ? 'is-active' : '']"
                @click="selectTopupAmount(amount)"
              >
                <text>¥{{ amount.toLocaleString() }}</text>
              </button>
              <button
                :class="['topup-amount-card', topupAmountMode === 'custom' ? 'is-active' : '']"
                @click="selectCustomTopup"
              >
                <text>自定义</text>
              </button>
            </view>
            <view v-if="topupAmountMode === 'custom'" class="topup-input-row">
              <text>自选额度</text>
              <input v-model.number="customTopupAmount" type="number" placeholder="请输入充值金额" />
            </view>
            <button class="sheet-primary" @click="goTopupCashier">去支付</button>
          </view>
        </view>

        <view v-else-if="role === 'tenant' && active.key === 'api-keys' && actionTitle.startsWith('紧急禁用')" class="sheet-content">
          <view class="highlight-box highlight-box--danger">
            <text class="highlight-title">{{ actionTitle }}</text>
            <text class="highlight-desc">禁用后该 Key 将立即停止调用。当前为 mock 操作，完整密钥配置请前往 PC 后台。</text>
          </view>
          <button class="sheet-primary danger-primary" @click="submitAction('已提交紧急禁用 mock')">确认禁用</button>
        </view>

        <view v-else class="sheet-content">
          <view class="highlight-box">
            <text class="highlight-title">{{ active.title }}</text>
            <text class="highlight-desc">当前为微信小程序 mock 操作。</text>
          </view>
          <button class="sheet-primary" @click="submitAction('已完成 mock 操作')">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ArcoIcon from './ArcoIcon.vue';
import { type ConsoleRole, type MiniProgramModule } from '../data/consoleData';
import { readProfileRecord } from '../data/profileStore';
import { getMiniNotificationUnreadCount } from '../data/notificationStore';
import {
  createPendingWalletTopup,
  formatMiniMoney,
  readWalletState,
  walletMinTopupAmount,
  walletTopupAmountOptions,
} from '../data/walletStore';

const props = defineProps<{
  role: ConsoleRole;
  modules: MiniProgramModule[];
  defaultKey: string;
}>();
const emit = defineEmits<{
  switchRole: [];
}>();

const activeKey = ref(props.defaultKey);
const actionVisible = ref(false);
const actionTitle = ref('');
const profileRecord = ref(readProfileRecord());
const notificationUnreadCount = ref(getMiniNotificationUnreadCount());
const walletState = ref(readWalletState());
const topupAmountOptions = walletTopupAmountOptions;
const topupAmountMode = ref<(typeof walletTopupAmountOptions)[number] | 'custom'>(100);
const selectedTopupAmount = ref(100);
const customTopupAmount = ref<number | undefined>();

const active = computed(() => props.modules.find((item) => item.key === activeKey.value) ?? props.modules[0]);
const headerActionText = computed(() => (props.role === 'tenant' && active.value.key === 'overview' ? '立即购买' : '切换身份'));
const walletBalanceText = computed(() => formatMiniMoney(walletState.value.balance));
const effectiveTopupAmount = computed(() => topupAmountMode.value === 'custom' ? Number(customTopupAmount.value) || 0 : selectedTopupAmount.value);

const tabLabels: Record<string, string> = {
  overview: '席位概览',
  profile: '我的',
  'api-keys': 'API',
  consult: '工单',
  notifications: '通知',
  dashboard: '工作台',
  balance: '进货',
  tenants: '客户',
};

function tabLabel(key: string, title: string) {
  return tabLabels[key] ?? title.slice(0, 2);
}

function tabIconName(key: string) {
  const iconMap: Record<string, string> = {
    overview: 'apps',
    profile: 'userGroup',
    'api-keys': 'safe',
    consult: 'message',
    notifications: 'notification',
    dashboard: 'dashboard',
    balance: 'storage',
    tenants: 'userGroup',
  };
  return iconMap[key] ?? 'apps';
}

function remainingSeats(assigned: number, purchased: number) {
  return Math.max(purchased - assigned, 0);
}

function seatProgress(assigned: number, purchased: number) {
  if (purchased <= 0) return '0%';
  return `${Math.min(Math.round((assigned / purchased) * 100), 100)}%`;
}

function switchModule(key: string) {
  activeKey.value = key;
}

function handleHeaderAction() {
  if (props.role === 'tenant' && active.value.key === 'overview') {
    openPurchase();
    return;
  }
  switchRole();
}

function handleQuickAction(action: string) {
  openAction(action);
}

function openPurchase() {
  closeAction();
  uni.navigateTo({ url: '/pages/tenant/purchase' });
}

function openAction(title: string) {
  if (props.role === 'tenant' && title === '我的订单') {
    uni.navigateTo({ url: '/pages/tenant/orders' });
    return;
  }
  if (props.role === 'tenant' && title === '消息中心') {
    uni.navigateTo({ url: '/pages/tenant/notifications' });
    return;
  }
  if (props.role === 'tenant' && title === '个人资料') {
    uni.navigateTo({ url: '/pages/tenant/profile-edit' });
    return;
  }
  if (props.role === 'tenant' && title === '设置与帮助') {
    uni.navigateTo({ url: '/pages/tenant/settings' });
    return;
  }
  if (props.role === 'tenant' && title === '发票管理') {
    uni.navigateTo({ url: '/pages/tenant/invoice-center' });
    return;
  }
  if (props.role === 'tenant' && active.value.key === 'profile' && title === '充值') {
    resetTopupDraft();
  }
  actionTitle.value = title;
  actionVisible.value = true;
}

function closeAction() {
  actionVisible.value = false;
}

function resetTopupDraft() {
  topupAmountMode.value = 100;
  selectedTopupAmount.value = 100;
  customTopupAmount.value = undefined;
}

function selectTopupAmount(amount: (typeof walletTopupAmountOptions)[number]) {
  topupAmountMode.value = amount;
  selectedTopupAmount.value = amount;
}

function selectCustomTopup() {
  topupAmountMode.value = 'custom';
}

function goTopupCashier() {
  if (effectiveTopupAmount.value < walletMinTopupAmount) {
    uni.showToast({ title: '单次钱包充值金额需至少 100 元', icon: 'none' });
    return;
  }
  try {
    const order = createPendingWalletTopup(effectiveTopupAmount.value);
    closeAction();
    uni.navigateTo({ url: `/pages/tenant/cashier?topupId=${order.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '钱包充值单创建失败', icon: 'none' });
  }
}

function submitAction(message: string) {
  uni.showToast({ title: message, icon: 'none' });
  closeAction();
}

function switchRole() {
  // #ifdef H5
  emit('switchRole');
  return;
  // #endif
  // #ifndef H5
  uni.reLaunch({ url: '/pages/index/index?switch=1' });
  // #endif
}

function quickActionSubtitle(action: string, fallback: string) {
  if (action !== '消息中心') return fallback;
  return notificationUnreadCount.value > 0 ? `${notificationUnreadCount.value} 条未读通知` : '暂无未读通知';
}

onMounted(() => {
  profileRecord.value = readProfileRecord();
  notificationUnreadCount.value = getMiniNotificationUnreadCount();
  walletState.value = readWalletState();
});
</script>

<style scoped>
.mini-console {
  min-height: 100vh;
  padding: 24rpx 28rpx calc(124rpx + env(safe-area-inset-bottom));
  background: #f5f7fb;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.eyebrow,
.module-summary,
.record-desc,
.record-meta,
.highlight-desc,
.detail-list view text:first-child {
  color: #6b778c;
}

.eyebrow {
  display: block;
  font-size: 24rpx;
  line-height: 34rpx;
}

.page-title {
  display: block;
  color: #1d2129;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 52rpx;
}

.switch-button {
  min-width: 132rpx;
  height: 56rpx;
  border: 1px solid #dce3ee;
  border-radius: 8rpx;
  background: #ffffff;
  color: #165dff;
  font-size: 24rpx;
}

.summary-card,
.seat-card,
.content-card {
  border: 1px solid #e5e8ef;
  border-radius: 8rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(29, 33, 41, 0.03);
}

.seat-overview-section {
  padding: 0;
}

.seat-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20rpx;
}

.seat-card {
  width: 100%;
  min-height: 280rpx;
  padding: 34rpx 28rpx 30rpx;
  border-color: #dfe5ef;
  background: #ffffff;
  box-shadow: none;
}

.seat-card__name {
  display: block;
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.seat-card__bar {
  height: 10rpx;
  margin-top: 56rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #edf1f6;
}

.seat-card__bar-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #165dff;
}

.seat-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 36rpx;
}

.seat-card__label,
.seat-card__remain {
  color: #6b778c;
  font-size: 30rpx;
  line-height: 40rpx;
}

.seat-card__count {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
  color: #1d2129;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.summary-card {
  padding: 28rpx;
}

.summary-card__top {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.module-mark {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 68rpx;
  border-radius: 8rpx;
  background: #eef4ff;
  color: #165dff;
  font-size: 32rpx;
  font-weight: 700;
}

.summary-card__copy {
  min-width: 0;
  flex: 1;
}

.module-title {
  display: block;
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 46rpx;
}

.module-summary {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 38rpx;
}

.metric-row {
  display: flex;
  gap: 14rpx;
  margin-top: 28rpx;
}

.metric-row--wrap {
  flex-wrap: wrap;
}

.metric-row--wrap .metric-card {
  flex: 0 0 calc((100% - 14rpx) / 2);
}

.metric-card {
  min-width: 0;
  flex: 1;
  padding: 18rpx;
  border-radius: 8rpx;
  background: #f7f9fc;
}

.metric-card__label {
  display: block;
  color: #6b778c;
  font-size: 22rpx;
  line-height: 32rpx;
}

.metric-card__value {
  display: block;
  margin-top: 6rpx;
  color: #1d2129;
  font-size: 31rpx;
  font-weight: 700;
  line-height: 40rpx;
  word-break: break-all;
}

.metric-card--blue { background: #eef4ff; }
.metric-card--green { background: #e8ffea; }
.metric-card--orange { background: #fff7e8; }
.metric-card--purple { background: #f5efff; }

.api-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.profile-home {
  display: flex;
  flex-direction: column;
  gap: 34rpx;
}

.profile-user {
  display: flex;
  align-items: center;
  gap: 34rpx;
  padding: 28rpx 8rpx 12rpx;
}

.profile-avatar {
  position: relative;
  width: 128rpx;
  height: 128rpx;
  flex: 0 0 128rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #f0f1f4, #d7d9df);
}

.profile-avatar image {
  width: 128rpx;
  height: 128rpx;
}

.profile-avatar__head {
  position: absolute;
  left: 42rpx;
  top: 28rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #b8bac0;
}

.profile-avatar__body {
  position: absolute;
  left: 24rpx;
  bottom: -18rpx;
  width: 80rpx;
  height: 72rpx;
  border-radius: 70rpx 70rpx 0 0;
  background: #b8bac0;
}

.profile-user__copy {
  min-width: 0;
  flex: 1;
}

.profile-user__name {
  display: block;
  color: #111111;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 56rpx;
}

.profile-user__welcome {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  padding: 0;
  color: #777777;
  font-size: 28rpx;
  line-height: 38rpx;
  text-align: left;
}

.profile-arrow {
  color: #8a8a8a;
  font-size: 44rpx;
  line-height: 38rpx;
}

.profile-wallet {
  position: relative;
  min-height: 420rpx;
  overflow: hidden;
  padding: 54rpx 44rpx;
  border-radius: 26rpx;
  background: linear-gradient(135deg, #3191ff 0%, #1677ff 58%, #126cff 100%);
  box-shadow: 0 18rpx 34rpx rgba(22, 119, 255, 0.18);
}

.profile-wallet::before,
.profile-wallet::after {
  position: absolute;
  content: '';
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
}

.profile-wallet::before {
  left: -120rpx;
  top: -180rpx;
  width: 680rpx;
  height: 680rpx;
}

.profile-wallet::after {
  right: -180rpx;
  bottom: -260rpx;
  width: 640rpx;
  height: 640rpx;
}

.profile-wallet__head,
.profile-wallet__title,
.profile-wallet__action,
.profile-wallet__amount {
  position: relative;
  z-index: 2;
}

.profile-wallet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.profile-wallet__title {
  display: flex;
  align-items: center;
  gap: 18rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 46rpx;
}

.profile-wallet__action {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 34rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
}

.profile-wallet__amount {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 102rpx;
  color: #ffffff;
}

.profile-wallet__amount text:first-child {
  font-size: 28rpx;
  line-height: 38rpx;
}

.profile-wallet__amount text:last-child {
  font-size: 56rpx;
  font-weight: 800;
  line-height: 68rpx;
}

.profile-wallet__art {
  position: absolute;
  right: 48rpx;
  bottom: 54rpx;
  z-index: 1;
  width: 280rpx;
  height: 230rpx;
}

.profile-wallet__pocket {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 210rpx;
  height: 150rpx;
  border-radius: 24rpx 24rpx 34rpx 34rpx;
  background: linear-gradient(135deg, rgba(158, 208, 255, 0.92), rgba(77, 151, 255, 0.95));
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, 0.26);
}

.profile-wallet__pocket::after {
  position: absolute;
  right: -16rpx;
  top: 46rpx;
  width: 74rpx;
  height: 70rpx;
  content: '';
  border-radius: 34rpx 0 0 34rpx;
  background: rgba(116, 185, 255, 0.98);
}

.profile-wallet__card {
  position: absolute;
  width: 144rpx;
  height: 92rpx;
  border-radius: 14rpx;
  background: rgba(198, 226, 255, 0.85);
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, 0.34);
}

.profile-wallet__card--front {
  right: 42rpx;
  top: 14rpx;
  transform: rotate(-8deg);
}

.profile-wallet__card--back {
  right: -4rpx;
  top: 58rpx;
  opacity: 0.38;
  transform: rotate(14deg);
}

.profile-wallet__shield {
  position: absolute;
  left: 42rpx;
  bottom: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 70rpx;
  color: #ffffff;
  font-size: 38rpx;
  font-weight: 800;
  border-radius: 22rpx 22rpx 28rpx 28rpx;
  background: rgba(126, 191, 255, 0.94);
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, 0.35);
}

.profile-shortcuts,
.profile-menu-card {
  border: 1rpx solid #f0f2f5;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(29, 33, 41, 0.04);
}

.profile-shortcuts {
  display: flex;
  padding: 34rpx 0;
}

.profile-shortcut {
  position: relative;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 0 36rpx;
  text-align: left;
}

.profile-shortcut--divider::after {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1rpx;
  content: '';
  background: #e5e6eb;
}

.profile-shortcut view {
  min-width: 0;
  flex: 1;
}

.profile-shortcut text:first-child {
  display: block;
  color: #111111;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 40rpx;
}

.profile-shortcut text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #777777;
  font-size: 24rpx;
  line-height: 34rpx;
}

.profile-menu-card {
  padding: 30rpx 34rpx;
}

.profile-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 28rpx;
  min-height: 92rpx;
  color: #111111;
  text-align: left;
}

.profile-menu-item text:nth-child(2) {
  min-width: 0;
  flex: 1;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.profile-menu-item__arrow {
  flex: 0 0 auto;
  color: #b8b8b8;
  font-size: 50rpx;
  font-weight: 400;
}

.api-alert-card {
  padding: 24rpx;
  border: 1px solid #f7d8ba;
  border-radius: 8rpx;
  background: #fff7e8;
}

.section-head--compact {
  margin-bottom: 14rpx;
  font-size: 28rpx;
}

.api-alert-item {
  padding: 16rpx 0;
  border-top: 1px solid rgba(247, 186, 117, 0.45);
  color: #7a4b12;
  font-size: 24rpx;
  line-height: 36rpx;
}

.api-alert-item:first-of-type {
  border-top: 0;
}

.quick-actions {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
}

.primary-action,
.secondary-action,
.sheet-primary {
  height: 72rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.primary-action,
.secondary-action {
  flex: 1;
}

.primary-action,
.sheet-primary {
  background: #165dff;
  color: #ffffff;
}

.secondary-action {
  border: 1px solid #dce3ee;
  background: #ffffff;
  color: #165dff;
}

.content-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
}

.section-head--stacked {
  margin-top: 28rpx;
}

.count-badge,
.record-status {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #165dff;
  font-size: 22rpx;
  font-weight: 500;
  white-space: nowrap;
}

.record-status--muted {
  background: #edf0f5;
  color: #86909c;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 22rpx;
  border: 1px solid #edf0f5;
  border-radius: 8rpx;
  background: #fbfcff;
  text-align: left;
}

.record-main {
  min-width: 0;
  flex: 1;
}

.record-title,
.record-desc,
.record-meta {
  display: block;
}

.record-title {
  color: #1d2129;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.record-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 36rpx;
}

.record-meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 32rpx;
}

.api-key-card {
  padding: 22rpx;
  border: 1px solid #edf0f5;
  border-radius: 8rpx;
  background: #fbfcff;
}

.api-key-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.api-key-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.api-key-grid view {
  flex: 0 0 calc((100% - 10rpx) / 2);
  padding: 14rpx;
  border-radius: 8rpx;
  background: #ffffff;
}

.api-key-grid view:last-child {
  flex-basis: 100%;
}

.api-key-grid text {
  display: block;
}

.api-key-grid text:first-child {
  color: #6b778c;
  font-size: 22rpx;
  line-height: 32rpx;
}

.api-key-grid text:last-child {
  margin-top: 4rpx;
  color: #1d2129;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 34rpx;
}

.api-key-alert {
  display: block;
  margin-top: 16rpx;
  color: #a65f00;
  font-size: 24rpx;
  line-height: 36rpx;
}

.danger-action {
  width: 100%;
  height: 64rpx;
  margin-top: 18rpx;
  border: 1px solid #f53f3f;
  border-radius: 8rpx;
  background: #ffffff;
  color: #f53f3f;
  font-size: 24rpx;
  font-weight: 600;
}

.bottom-tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  padding: 12rpx 16rpx calc(12rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #edf0f5;
  background: rgba(255, 255, 255, 0.98);
}

.bottom-tabs button {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 8rpx 0;
  border-radius: 8rpx;
  color: #6b778c;
}

.bottom-tabs button.active {
  background: #eef4ff;
  color: #165dff;
}

.tab-label {
  font-size: 22rpx;
  line-height: 30rpx;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.42);
}

.action-sheet {
  width: 100vw;
  padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  color: #1d2129;
  font-size: 32rpx;
  font-weight: 700;
}

.sheet-head button {
  color: #165dff;
  font-size: 26rpx;
}

.sheet-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.highlight-box {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 22rpx;
  border-radius: 8rpx;
  background: #eef4ff;
}

.highlight-box--danger {
  background: #fff1f0;
}

.danger-primary {
  background: #f53f3f;
}

.highlight-title {
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.highlight-desc {
  font-size: 24rpx;
  line-height: 36rpx;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.detail-list view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 18rpx;
  border-radius: 8rpx;
  background: #f7f8fa;
}

.detail-list view text {
  min-width: 0;
  color: #1d2129;
  font-size: 26rpx;
  line-height: 38rpx;
  text-align: right;
}

.topup-flow {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.topup-amount-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.topup-amount-card {
  min-height: 92rpx;
  border: 2rpx solid #edf0f5;
  border-radius: 8rpx;
  background: #ffffff;
  color: #1d2129;
  font-size: 30rpx;
  font-weight: 700;
}

.topup-amount-card.is-active {
  border-color: #165dff;
  background: #eef4ff;
  color: #165dff;
}

.topup-input-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
  border-radius: 8rpx;
  background: #f7f8fa;
}

.topup-input-row text {
  flex: 0 0 auto;
  color: #6b778c;
  font-size: 26rpx;
  line-height: 38rpx;
}

.topup-input-row input {
  min-width: 0;
  flex: 1;
  height: 48rpx;
  color: #1d2129;
  font-size: 26rpx;
  text-align: right;
}

</style>
