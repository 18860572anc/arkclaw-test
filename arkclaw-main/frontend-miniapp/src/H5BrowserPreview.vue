<template>
  <div class="preview-shell">
    <section v-if="!activeRole" class="role-page">
      <div class="hero">
        <span class="eyebrow">ArkClaw 小程序</span>
        <h1>选择使用身份</h1>
        <p>H5 预览用于快速检查小程序 UI，最终以微信开发者工具为准。</p>
      </div>

      <div class="role-list">
        <button class="role-card" type="button" @click="activeRole = 'tenant'">
          <span class="role-icon">客</span>
          <span class="role-copy">
            <strong>客户管理员端</strong>
            <small>席位购买、充值、消费记录和通知。</small>
          </span>
          <span class="role-arrow">进入</span>
        </button>

        <button class="role-card" type="button" @click="activeRole = 'agent'">
          <span class="role-icon role-icon--agent">代</span>
          <span class="role-copy">
            <strong>代理管理员端</strong>
            <small>工作台、进货与余额、客户管理和通知。</small>
          </span>
          <span class="role-arrow">进入</span>
        </button>
      </div>
    </section>

    <section v-else class="console-page">
      <header class="page-head">
        <div>
          <h1>{{ activeModule.title }}</h1>
        </div>
        <button class="switch-button" type="button" @click="handleHeaderAction">{{ headerActionText }}</button>
      </header>

      <main v-if="activeModule.key === 'overview'" class="panel seat-overview-panel">
        <div class="seat-grid">
          <article v-for="seat in activeModule.seats" :key="seat.name" class="seat-card">
            <strong>{{ seat.name }}</strong>
            <div class="seat-progress">
              <span :style="{ width: seatProgress(seat.assigned, seat.purchased) }"></span>
            </div>
            <div class="seat-meta">
              <em>已开通/已购买</em>
              <span>
                <b>{{ seat.assigned }}/{{ seat.purchased }}</b>
                <small>剩余 {{ remainingSeats(seat.assigned, seat.purchased) }}</small>
              </span>
            </div>
          </article>
        </div>
      </main>

      <main v-else-if="activeModule.key === 'profile'" class="profile-panel">
        <section class="balance-panel">
          <span>账户余额</span>
          <strong>{{ walletBalanceText }}</strong>
          <p>{{ activeModule.balance?.tip }}</p>
        </section>
        <div class="metric-row metric-row--wrap">
          <article v-for="metric in activeModule.metrics" :key="metric.label" class="metric-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
      </main>

      <main v-else-if="activeModule.key === 'api-keys'" class="panel api-panel">
        <div class="summary-head">
          <span class="module-mark">A</span>
          <div>
            <strong>{{ activeModule.title }}</strong>
            <p>{{ activeModule.summary }}</p>
          </div>
        </div>
        <div class="metric-row metric-row--wrap">
          <article v-for="metric in activeModule.metrics" :key="metric.label" class="metric-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
        <div v-if="activeModule.alerts?.length" class="alert-list">
          <strong>风险提醒</strong>
          <p v-for="alert in activeModule.alerts" :key="alert">{{ alert }}</p>
        </div>
      </main>

      <main v-else class="panel">
        <div class="summary-head">
          <span class="module-mark">{{ activeModule.title.slice(0, 1) }}</span>
          <div>
            <strong>{{ activeModule.title }}</strong>
            <p>{{ activeModule.summary }}</p>
          </div>
        </div>
        <div class="metric-row">
          <article v-for="metric in activeModule.metrics" :key="metric.label" class="metric-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
      </main>

      <div v-if="activeModule.actions.length" class="quick-actions">
        <button
          v-for="(action, index) in activeModule.actions"
          :key="action"
          :class="{ primary: index === 0 }"
          type="button"
          @click="handleQuickAction(action)"
        >
          {{ action }}
        </button>
      </div>

      <section v-if="activeModule.key === 'api-keys'" class="panel list-panel">
        <div class="section-head">
          <span>{{ activeModule.listTitle }}</span>
          <span class="count-badge">{{ activeModule.apiKeys?.length ?? 0 }} 条</span>
        </div>
        <article v-for="item in activeModule.apiKeys" :key="item.keyPreview" class="api-key-card">
          <div class="api-key-head">
            <span>
              <strong>{{ item.name }}</strong>
              <small>{{ item.keyPreview }} / {{ item.group }}</small>
            </span>
            <b :class="{ muted: item.status !== '启用' }">{{ item.status }}</b>
          </div>
          <div class="api-key-grid">
            <span><em>今日费用</em><strong>{{ item.todayCost }}</strong></span>
            <span><em>近 30 天</em><strong>{{ item.monthCost }}</strong></span>
            <span><em>速率限制</em><strong>{{ item.rateLimit }}</strong></span>
            <span><em>额度限制</em><strong>{{ item.quotaLimit }}</strong></span>
            <span><em>过期时间</em><strong>{{ item.expiresAt }}</strong></span>
          </div>
          <p v-if="item.alert" class="api-key-alert">{{ item.alert }}</p>
          <button v-if="item.status === '启用'" class="danger-action" type="button" @click="openAction(`紧急禁用 ${item.name}`)">
            紧急禁用
          </button>
        </article>
      </section>

      <section v-else-if="activeModule.key === 'profile'" class="panel list-panel">
        <div class="section-head">
          <span>{{ activeModule.listTitle }}</span>
          <span class="count-badge">{{ activeModule.list.length }} 条</span>
        </div>
        <button v-for="item in activeModule.list" :key="`${item.title}-${item.meta}`" class="record-item" type="button" @click="openAction('查看详情')">
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.subtitle }}</small>
            <em>{{ item.meta }}</em>
          </span>
          <b>{{ item.status }}</b>
        </button>
        <div v-if="activeModule.notifications?.length" class="section-head section-head--stacked">
          <span>{{ activeModule.notificationTitle ?? '通知' }}</span>
          <span class="count-badge">{{ activeModule.notifications.length }} 条</span>
        </div>
        <button
          v-for="item in activeModule.notifications"
          :key="`${item.title}-${item.meta}`"
          class="record-item"
          type="button"
          @click="openAction('查看通知')"
        >
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.subtitle }}</small>
            <em>{{ item.meta }}</em>
          </span>
          <b>{{ item.status }}</b>
        </button>
      </section>

      <section v-else-if="activeModule.key !== 'overview'" class="panel list-panel">
        <div class="section-head">
          <span>{{ activeModule.listTitle }}</span>
          <span class="count-badge">{{ activeModule.list.length }} 条</span>
        </div>
        <button v-for="item in activeModule.list" :key="`${item.title}-${item.meta}`" class="record-item" type="button" @click="openAction('查看详情')">
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.subtitle }}</small>
            <em>{{ item.meta }}</em>
          </span>
          <b>{{ item.status }}</b>
        </button>
      </section>

      <nav class="bottom-tabs">
        <button v-for="item in modules" :key="item.key" :class="{ active: item.key === activeKey }" type="button" @click="activeKey = item.key">
          <span class="tab-icon">{{ tabIcon(item.key) }}</span>
          <span>{{ tabLabel(item.key, item.title) }}</span>
        </button>
      </nav>

      <div v-if="purchaseVisible" class="purchase-overlay">
        <header class="purchase-head">
          <strong>购买席位</strong>
          <button type="button" @click="closePurchase">×</button>
        </header>
        <main class="purchase-body">
          <div class="purchase-grid">
            <article
              v-for="product in tenantSeatProducts"
              :key="product.key"
              :class="['purchase-card', `purchase-card--${product.tone}`, purchaseCounts[product.key] > 0 ? 'is-selected' : '']"
            >
              <div class="purchase-visual">
                <span class="purchase-visual__screen"></span>
                <span class="purchase-visual__base"></span>
              </div>
              <strong>{{ product.name }}</strong>
              <p>{{ product.summary }}</p>
              <div class="purchase-card__foot">
                <span>
                  <b>¥ {{ product.monthlyPrice }}</b>
                  <em>/月</em>
                </span>
                <button v-if="purchaseCounts[product.key] === 0" class="purchase-cart" type="button" @click="incrementPurchase(product.key)">+</button>
                <span v-else class="purchase-stepper">
                  <button type="button" @click="decrementPurchase(product.key)">−</button>
                  <small>{{ purchaseCounts[product.key] }}</small>
                  <button type="button" @click="incrementPurchase(product.key)">+</button>
                </span>
              </div>
            </article>
          </div>
        </main>
        <footer class="purchase-bar">
          <strong>合计: ¥ {{ purchaseTotalAmountText }}</strong>
          <button class="purchase-submit" type="button" :disabled="purchaseTotalCount === 0" @click="openPurchaseConfirm">
            去结算（{{ purchaseTotalCount }}）
          </button>
        </footer>
      </div>

      <div v-if="actionVisible" class="sheet-mask" @click="closeAction">
        <section class="action-sheet" @click.stop>
          <header class="sheet-head">
            <strong>{{ actionTitle }}</strong>
            <button type="button" @click="closeAction">关闭</button>
          </header>

          <div v-if="actionTitle === '确认订单'" class="sheet-content">
            <div class="highlight-box">
              <strong>席位购买明细</strong>
              <p>当前为 H5 mock 下单，确认后提交购买申请。</p>
            </div>
            <div class="detail-list">
              <span v-for="item in selectedPurchaseItems" :key="item.product.key">
                <em>{{ item.product.name }} × {{ item.count }}</em>
                <b>¥{{ item.amount }}</b>
              </span>
              <span class="purchase-detail-total"><em>月付合计</em><b>¥{{ purchaseTotalAmountText }}</b></span>
            </div>
            <button class="sheet-primary" type="button" @click="confirmPurchase">确认提交</button>
          </div>

          <div v-else-if="activeRole === 'tenant' && activeModule.key === 'profile' && actionTitle === '充值'" class="sheet-content">
            <div class="highlight-box">
              <strong>账户钱包充值</strong>
              <p>先选择本次要充值到企业账户钱包的金额，下一步进入小程序收银台完成支付。</p>
            </div>
            <div class="topup-flow">
              <div class="detail-list">
                <span><em>当前余额</em><b>{{ walletBalanceText }}</b></span>
                <span><em>最低充值</em><b>¥100</b></span>
              </div>
              <div class="topup-amount-grid">
                <button
                  v-for="amount in topupAmountOptions"
                  :key="amount"
                  :class="['topup-amount-card', topupAmountMode === amount ? 'is-active' : '']"
                  type="button"
                  @click="selectTopupAmount(amount)"
                >
                  ¥{{ amount.toLocaleString() }}
                </button>
                <button :class="['topup-amount-card', topupAmountMode === 'custom' ? 'is-active' : '']" type="button" @click="selectCustomTopup">
                  自定义
                </button>
              </div>
              <label v-if="topupAmountMode === 'custom'" class="topup-input-row">
                <span>自选额度</span>
                <input v-model.number="customTopupAmount" type="number" placeholder="请输入充值金额" />
              </label>
              <button class="sheet-primary" type="button" @click="goTopupCashier">去支付</button>
            </div>
          </div>

          <div v-else-if="activeModule.key === 'api-keys' && actionTitle.startsWith('紧急禁用')" class="sheet-content">
            <div class="highlight-box highlight-box--danger">
              <strong>{{ actionTitle }}</strong>
              <p>禁用后该 Key 将立即停止调用。当前为 H5 mock 操作，完整密钥配置请前往 PC 后台。</p>
            </div>
            <button class="sheet-primary sheet-primary--danger" type="button" @click="submitAction('已提交紧急禁用 mock')">确认禁用</button>
          </div>

          <div v-else class="sheet-content">
            <div class="highlight-box">
              <strong>{{ activeModule.title }}</strong>
              <p>{{ actionTitle === '刷新状态' ? 'API 状态已刷新 mock。' : '当前为 H5 mock 操作。' }}</p>
            </div>
            <button class="sheet-primary" type="button" @click="submitAction('已完成 mock 操作')">确认</button>
          </div>
        </section>
      </div>

      <div v-if="toastMessage" class="h5-toast">{{ toastMessage }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  agentMiniProgramTabs,
  tenantMiniProgramTabs,
  tenantSeatProducts,
  type ConsoleRole,
  type MiniProgramSeatProductKey,
} from './data/consoleData';

const activeRole = ref<ConsoleRole | ''>('');
const activeKey = ref('overview');
const actionVisible = ref(false);
const actionTitle = ref('');
const toastMessage = ref('');
const purchaseVisible = ref(false);
const walletBalance = ref(7412);
const topupAmountOptions = [100, 500, 1000, 5000] as const;
const topupAmountMode = ref<(typeof topupAmountOptions)[number] | 'custom'>(100);
const selectedTopupAmount = ref(100);
const customTopupAmount = ref<number | undefined>();
const purchaseCounts = ref<Record<MiniProgramSeatProductKey, number>>({
  lite: 0,
  standard: 0,
  pro: 0,
  ultimate: 0,
});

const modules = computed(() => (activeRole.value === 'agent' ? agentMiniProgramTabs : tenantMiniProgramTabs));
const activeModule = computed(() => modules.value.find((item) => item.key === activeKey.value) ?? modules.value[0]);
const headerActionText = computed(() => (activeRole.value === 'tenant' && activeModule.value.key === 'overview' ? '立即购买' : '切换身份'));
const selectedPurchaseItems = computed(() =>
  tenantSeatProducts
    .map((product) => ({
      product,
      count: purchaseCounts.value[product.key],
      amount: product.monthlyPrice * purchaseCounts.value[product.key],
    }))
    .filter((item) => item.count > 0),
);
const purchaseTotalCount = computed(() => selectedPurchaseItems.value.reduce((sum, item) => sum + item.count, 0));
const purchaseTotalAmount = computed(() => selectedPurchaseItems.value.reduce((sum, item) => sum + item.amount, 0));
const purchaseTotalAmountText = computed(() => purchaseTotalAmount.value.toLocaleString());
const walletBalanceText = computed(() => formatMoney(walletBalance.value));
const effectiveTopupAmount = computed(() => topupAmountMode.value === 'custom' ? Number(customTopupAmount.value) || 0 : selectedTopupAmount.value);

watch(activeRole, (role) => {
  closeAction();
  activeKey.value = role === 'agent' ? 'dashboard' : 'overview';
});

watch(activeKey, () => {
  closeAction();
});

function openAction(title: string) {
  if (activeRole.value === 'tenant' && activeModule.value.key === 'profile' && title === '充值') {
    resetTopupDraft();
  }
  actionTitle.value = title;
  actionVisible.value = true;
}

function handleHeaderAction() {
  if (activeRole.value === 'tenant' && activeModule.value.key === 'overview') {
    openPurchase();
    return;
  }
  activeRole.value = '';
}

function handleQuickAction(action: string) {
  openAction(action);
}

function openPurchase() {
  closeAction();
  purchaseVisible.value = true;
}

function closePurchase() {
  purchaseVisible.value = false;
  resetPurchaseCounts();
}

function resetPurchaseCounts() {
  purchaseCounts.value = tenantSeatProducts.reduce(
    (result, product) => ({ ...result, [product.key]: 0 }),
    {} as Record<MiniProgramSeatProductKey, number>,
  );
}

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

function openPurchaseConfirm() {
  if (purchaseTotalCount.value === 0) return;
  actionTitle.value = '确认订单';
  actionVisible.value = true;
}

function confirmPurchase() {
  closeAction();
  closePurchase();
  showToast('购买申请已提交');
}

function closeAction() {
  actionVisible.value = false;
}

function submitAction(message: string) {
  showToast(message);
  window.setTimeout(closeAction, 450);
}

function resetTopupDraft() {
  topupAmountMode.value = 100;
  selectedTopupAmount.value = 100;
  customTopupAmount.value = undefined;
}

function selectTopupAmount(amount: (typeof topupAmountOptions)[number]) {
  topupAmountMode.value = amount;
  selectedTopupAmount.value = amount;
}

function selectCustomTopup() {
  topupAmountMode.value = 'custom';
}

function goTopupCashier() {
  if (effectiveTopupAmount.value < 100) {
    showToast('单次钱包充值金额需至少 100 元');
    return;
  }
  showToast(`已创建充值单 ${formatMoney(effectiveTopupAmount.value)}，进入收银台选择微信支付或对公转账`);
  window.setTimeout(closeAction, 450);
}

function showToast(message: string) {
  toastMessage.value = message;
  window.setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = '';
    }
  }, 1600);
}

function tabLabel(key: string, title: string) {
  const labels: Record<string, string> = {
    overview: '席位概览',
    profile: '我的',
    'api-keys': 'API',
    consult: '工单',
    notifications: '通知',
    dashboard: '工作台',
    balance: '进货',
    tenants: '客户',
  };
  return labels[key] ?? title.slice(0, 2);
}

function tabIcon(key: string) {
  const icons: Record<string, string> = {
    overview: '▦',
    profile: '◎',
    'api-keys': '◇',
    consult: '◌',
    notifications: '◈',
    dashboard: '▤',
    balance: '▥',
    tenants: '◎',
  };
  return icons[key] ?? '▦';
}

function remainingSeats(assigned: number, purchased: number) {
  return Math.max(purchased - assigned, 0);
}

function seatProgress(assigned: number, purchased: number) {
  if (purchased <= 0) return '0%';
  return `${Math.min(Math.round((assigned / purchased) * 100), 100)}%`;
}

function formatMoney(value: number) {
  return `¥${value.toLocaleString()}`;
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

button {
  border: 0;
  font: inherit;
}

.preview-shell {
  min-height: 100vh;
  background: #f5f7fb;
  color: #1d2129;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

.role-page,
.console-page {
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 36px 14px 84px;
  background: #f5f7fb;
}

.hero {
  margin-bottom: 22px;
}

.eyebrow,
.hero p,
.role-copy small,
.summary-head p,
.record-item small,
.record-item em,
.metric-card span {
  color: #6b778c;
}

.eyebrow {
  display: block;
  font-size: 12px;
  line-height: 17px;
}

h1 {
  margin: 4px 0 0;
  font-size: 20px;
  line-height: 28px;
}

.hero h1 {
  margin-top: 6px;
}

.hero p {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 19px;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.role-card,
.panel,
.seat-card {
  border: 1px solid #e5e8ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(29, 33, 41, 0.03);
}

.seat-overview-panel {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.role-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 15px;
  text-align: left;
}

.role-icon,
.module-mark {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  border-radius: 8px;
  background: #eef4ff;
  color: #165dff;
  font-size: 17px;
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

.role-copy strong,
.role-copy small,
.record-item strong,
.record-item small,
.record-item em {
  display: block;
}

.role-copy strong {
  font-size: 16px;
  line-height: 22px;
}

.role-copy small {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
}

.role-arrow {
  color: #165dff;
  font-size: 13px;
  font-weight: 600;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.switch-button {
  min-width: 66px;
  height: 28px;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  background: #ffffff;
  color: #165dff;
  font-size: 12px;
}

.panel {
  padding: 14px;
}

.panel.seat-overview-panel {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
}

.section-head--stacked {
  margin-top: 14px;
}

.seat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.seat-card {
  min-height: 140px;
  padding: 17px 14px 15px;
  background: #ffffff;
  box-shadow: none;
}

.seat-card > strong {
  display: block;
  color: #1d2129;
  font-size: 15px;
  line-height: 21px;
}

.seat-progress {
  height: 5px;
  margin-top: 28px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf1f6;
}

.seat-progress span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #165dff;
}

.seat-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.seat-meta em,
.seat-meta small {
  color: #6b778c;
  font-size: 15px;
  font-style: normal;
  line-height: 20px;
}

.seat-meta span {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #1d2129;
}

.seat-meta b {
  font-size: 16px;
  line-height: 21px;
}

.summary-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.summary-head strong {
  display: block;
  font-size: 15px;
  line-height: 23px;
}

.summary-head p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 19px;
}

.metric-row {
  display: flex;
  gap: 7px;
  margin-top: 14px;
}

.metric-row--wrap {
  flex-wrap: wrap;
}

.metric-row--wrap .metric-card {
  flex: 0 0 calc((100% - 7px) / 2);
}

.metric-card {
  min-width: 0;
  flex: 1;
  padding: 9px;
  border-radius: 8px;
  background: #f7f9fc;
}

.metric-card span,
.metric-card strong {
  display: block;
}

.metric-card span {
  font-size: 11px;
  line-height: 16px;
}

.metric-card strong {
  margin-top: 3px;
  font-size: 16px;
  line-height: 20px;
  word-break: break-word;
}

.profile-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.balance-panel {
  padding: 15px;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  background: #eef4ff;
}

.balance-panel span,
.balance-panel p {
  display: block;
  color: #4e5969;
}

.balance-panel span {
  font-size: 12px;
  line-height: 17px;
}

.balance-panel strong {
  display: block;
  margin-top: 3px;
  color: #165dff;
  font-size: 28px;
  line-height: 33px;
}

.balance-panel p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 18px;
}

.alert-list {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background: #fff7e8;
}

.alert-list > strong {
  display: block;
  color: #1d2129;
  font-size: 13px;
  line-height: 18px;
}

.alert-list p {
  margin: 8px 0 0;
  color: #7a4b12;
  font-size: 12px;
  line-height: 18px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.quick-actions button {
  flex: 1;
  height: 36px;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  background: #ffffff;
  color: #165dff;
  font-size: 13px;
  font-weight: 600;
}

.quick-actions button.primary {
  border-color: #165dff;
  background: #165dff;
  color: #ffffff;
}

.list-panel {
  margin-top: 12px;
}

.count-badge,
.record-item > b {
  padding: 3px 7px;
  border-radius: 999px;
  background: #eef4ff;
  color: #165dff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.record-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 9px;
  padding: 11px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcff;
  text-align: left;
}

.record-item + .record-item {
  margin-top: 8px;
}

.record-item span {
  min-width: 0;
  flex: 1;
}

.record-item strong {
  font-size: 14px;
  line-height: 20px;
}

.record-item small {
  margin-top: 3px;
  font-size: 12px;
  line-height: 18px;
}

.record-item em {
  margin-top: 2px;
  font-size: 11px;
  font-style: normal;
  line-height: 16px;
}

.api-key-card {
  padding: 11px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcff;
}

.api-key-card + .api-key-card {
  margin-top: 8px;
}

.api-key-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 9px;
}

.api-key-head span {
  min-width: 0;
  flex: 1;
}

.api-key-head strong,
.api-key-head small {
  display: block;
}

.api-key-head strong {
  font-size: 14px;
  line-height: 20px;
}

.api-key-head small {
  margin-top: 3px;
  color: #6b778c;
  font-size: 12px;
  line-height: 18px;
}

.api-key-head b {
  padding: 3px 7px;
  border-radius: 999px;
  background: #eef4ff;
  color: #165dff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.api-key-head b.muted {
  background: #edf0f5;
  color: #86909c;
}

.api-key-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin-top: 9px;
}

.api-key-grid span {
  min-width: 0;
  padding: 7px;
  border-radius: 8px;
  background: #ffffff;
}

.api-key-grid span:last-child {
  grid-column: 1 / -1;
}

.api-key-grid em,
.api-key-grid strong {
  display: block;
}

.api-key-grid em {
  color: #6b778c;
  font-size: 11px;
  font-style: normal;
  line-height: 16px;
}

.api-key-grid strong {
  margin-top: 2px;
  font-size: 12px;
  line-height: 17px;
}

.api-key-alert {
  margin: 8px 0 0;
  color: #a65f00;
  font-size: 12px;
  line-height: 18px;
}

.danger-action {
  width: 100%;
  height: 32px;
  margin-top: 9px;
  border: 1px solid #f53f3f;
  border-radius: 8px;
  background: #ffffff;
  color: #f53f3f;
  font-size: 12px;
  font-weight: 600;
}

.bottom-tabs {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 30;
  width: min(430px, 100vw);
  display: flex;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  border-top: 1px solid #edf0f5;
  background: rgba(255, 255, 255, 0.98);
  transform: translateX(-50%);
}

.bottom-tabs button {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  border-radius: 8px;
  background: transparent;
  color: #86909c;
  font-size: 11px;
  line-height: 15px;
}

.bottom-tabs button.active {
  background: #eef4ff;
  color: #165dff;
}

.tab-icon {
  height: 18px;
  font-size: 17px;
  line-height: 18px;
}

.purchase-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  width: min(430px, 100vw);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.purchase-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 14px 10px;
  background: #ffffff;
}

.purchase-head strong {
  color: #1d2129;
  font-size: 17px;
  line-height: 24px;
}

.purchase-head button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d8d8d8;
  color: #ffffff;
  font-size: 19px;
  line-height: 22px;
}

.purchase-body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 7px 6px 76px;
}

.purchase-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.purchase-card {
  position: relative;
  min-height: 174px;
  display: flex;
  flex-direction: column;
  padding: 9px 9px 8px;
  border: 1px solid transparent;
  background: #ffffff;
}

.purchase-card.is-selected {
  border-color: #ff3b30;
}

.purchase-visual {
  position: relative;
  height: 73px;
  margin: 9px 0 10px;
}

.purchase-visual__screen {
  position: absolute;
  left: 50%;
  top: 9px;
  width: 63px;
  height: 43px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(135deg, #2d3444, #0b1020 56%, #40485b);
  box-shadow: 0 6px 12px rgba(29, 33, 41, 0.18);
  transform: translateX(-44%) skewX(-10deg);
}

.purchase-visual__base {
  position: absolute;
  left: 50%;
  top: 52px;
  width: 89px;
  height: 14px;
  border-radius: 2px 2px 8px 8px;
  background: linear-gradient(160deg, #f4f7fb, #b8c2d1);
  box-shadow: 0 4px 9px rgba(29, 33, 41, 0.12);
  transform: translateX(-52%) skewX(-18deg);
}

.purchase-card--blue .purchase-visual__base {
  background: linear-gradient(160deg, #eef4ff, #b9cffd);
}

.purchase-card--green .purchase-visual__base {
  background: linear-gradient(160deg, #effff5, #b6e8ca);
}

.purchase-card--orange .purchase-visual__base {
  background: linear-gradient(160deg, #fff5e8, #ffd1a6);
}

.purchase-card--purple .purchase-visual__base {
  background: linear-gradient(160deg, #f6f0ff, #d6c4ff);
}

.purchase-card > strong {
  color: #1d2129;
  font-size: 14px;
  line-height: 19px;
}

.purchase-card > p {
  min-height: 32px;
  margin: 2px 0 0;
  color: #1d2129;
  font-size: 12px;
  line-height: 16px;
}

.purchase-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 5px;
  margin-top: auto;
}

.purchase-card__foot span:first-child {
  min-width: 0;
}

.purchase-card__foot b {
  color: #ff0000;
  font-size: 15px;
  line-height: 19px;
}

.purchase-card__foot em {
  margin-left: 2px;
  color: #ff0000;
  font-size: 10px;
  font-style: normal;
}

.purchase-cart {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border: 1px solid #ff6b5f;
  border-radius: 50%;
  background: transparent;
  color: #ff3b30;
  font-size: 18px;
  line-height: 21px;
}

.purchase-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.purchase-stepper button {
  width: 21px;
  height: 21px;
  border: 1px solid #ff3b30;
  border-radius: 50%;
  background: transparent;
  color: #ff3b30;
  font-size: 15px;
  line-height: 18px;
}

.purchase-stepper small {
  min-width: 14px;
  color: #1d2129;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.purchase-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 61;
  width: min(430px, 100vw);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -4px 11px rgba(29, 33, 41, 0.06);
  transform: translateX(-50%);
}

.purchase-bar > strong {
  min-width: 0;
  flex: 1;
  color: #1d2129;
  font-size: 13px;
  line-height: 18px;
  text-align: left;
  white-space: nowrap;
}

.purchase-submit {
  min-width: 95px;
  height: 36px;
  padding: 0 13px;
  border-radius: 999px;
  background: #ff0000;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.purchase-submit:disabled {
  opacity: 0.45;
}

.purchase-detail-total {
  background: #fff1f0 !important;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.42);
}

.action-sheet {
  width: min(430px, 100vw);
  max-height: 78vh;
  overflow: auto;
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: #ffffff;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.sheet-head strong {
  min-width: 0;
  color: #1d2129;
  font-size: 16px;
  line-height: 22px;
}

.sheet-head button {
  color: #165dff;
  background: transparent;
  font-size: 13px;
}

.sheet-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.highlight-box {
  padding: 11px;
  border-radius: 8px;
  background: #eef4ff;
}

.highlight-box strong,
.highlight-box p {
  display: block;
}

.highlight-box strong {
  color: #1d2129;
  font-size: 15px;
  line-height: 21px;
}

.highlight-box p {
  margin: 4px 0 0;
  color: #6b778c;
  font-size: 12px;
  line-height: 18px;
}

.highlight-box--danger {
  background: #fff1f0;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-list span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px;
  border-radius: 8px;
  background: #f7f8fa;
}

.detail-list em,
.detail-list b {
  min-width: 0;
  font-size: 13px;
  line-height: 19px;
}

.detail-list em {
  color: #6b778c;
  font-style: normal;
}

.detail-list b {
  color: #1d2129;
  text-align: right;
}

.sheet-primary {
  height: 36px;
  border-radius: 8px;
  background: #165dff;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.sheet-primary--danger {
  background: #f53f3f;
}

.topup-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topup-amount-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.topup-amount-card {
  min-height: 46px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #ffffff;
  color: #1d2129;
  font-size: 15px;
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
  gap: 9px;
  padding: 9px;
  border-radius: 8px;
  background: #f7f8fa;
}

.topup-input-row span {
  color: #6b778c;
  font-size: 13px;
}

.topup-input-row input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #1d2129;
  font-size: 13px;
  text-align: right;
}

.secondary-action {
  height: 36px;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  background: #ffffff;
  color: #165dff;
  font-size: 13px;
  font-weight: 600;
}

.h5-toast {
  position: fixed;
  left: 50%;
  bottom: 92px;
  z-index: 90;
  max-width: min(320px, calc(100vw - 40px));
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(29, 33, 41, 0.88);
  color: #ffffff;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
  transform: translateX(-50%);
}
</style>
