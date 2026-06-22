<template>
  <view class="invoice-title-edit-page">
    <view class="invoice-title-edit-card">
      <view class="invoice-title-type">
        <button :class="form.kind === 'company' ? 'is-active' : ''" @click="form.kind = 'company'">单位</button>
        <button :class="form.kind === 'personal' ? 'is-active' : ''" @click="form.kind = 'personal'">个人</button>
      </view>

      <view class="invoice-title-field">
        <text>抬头名称</text>
        <input v-model="form.name" placeholder="请输入发票抬头" />
      </view>

      <view v-if="form.kind === 'company'" class="invoice-title-field">
        <text>税号</text>
        <input
          v-model="form.taxNo"
          maxlength="18"
          placeholder="请输入18位统一社会信用代码"
          @input="handleTaxNoInput"
        />
      </view>
    </view>

    <button v-if="editingId" class="invoice-title-delete" @click="confirmDelete">删除抬头</button>

    <view class="invoice-title-edit-bar">
      <button @click="saveTitle">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  deleteInvoiceTitle,
  getInvoiceTitle,
  upsertInvoiceTitle,
  type MiniInvoiceTitleKind,
} from '../../data/invoiceTitleStore';

const editingId = ref('');
const form = reactive<{
  kind: MiniInvoiceTitleKind;
  name: string;
  taxNo: string;
}>({
  kind: 'company',
  name: '',
  taxNo: '',
});

function hydrate(id?: string) {
  if (!id) return;
  const record = getInvoiceTitle(id);
  if (!record) {
    uni.showToast({ title: '抬头不存在', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 180);
    return;
  }
  editingId.value = record.id;
  form.kind = record.kind;
  form.name = record.name;
  form.taxNo = record.taxNo || '';
}

function handleTaxNoInput(event: { detail?: { value?: string } }) {
  form.taxNo = String(event.detail?.value ?? form.taxNo)
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 18);
}

function saveTitle() {
  const name = form.name.trim();
  const taxNo = form.taxNo.trim().toUpperCase();
  if (!name) {
    uni.showToast({ title: '请填写抬头名称', icon: 'none' });
    return;
  }
  if (form.kind === 'company' && !/^[0-9A-Z]{18}$/.test(taxNo)) {
    uni.showToast({ title: '税号需为18位字母数字', icon: 'none' });
    return;
  }
  upsertInvoiceTitle({
    id: editingId.value || undefined,
    kind: form.kind,
    name,
    taxNo,
  });
  uni.showToast({ title: '抬头已保存', icon: 'none' });
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/tenant/invoice-center?tab=titles' });
  }, 180);
}

function confirmDelete() {
  uni.showModal({
    title: '删除抬头',
    content: '删除后该发票抬头将不再显示，确认删除吗？',
    confirmText: '删除',
    confirmColor: '#f31313',
    success: (result) => {
      if (!result.confirm || !editingId.value) return;
      deleteInvoiceTitle(editingId.value);
      uni.showToast({ title: '抬头已删除', icon: 'none' });
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/tenant/invoice-center?tab=titles' });
      }, 180);
    },
  });
}

onLoad((query) => {
  hydrate(typeof query?.id === 'string' ? query.id : undefined);
});

onShow(() => {
  uni.hideHomeButton();
});
</script>

<style scoped>
.invoice-title-edit-page {
  min-height: 100vh;
  padding: 22rpx 20rpx calc(132rpx + env(safe-area-inset-bottom));
  background: #f5f5f5;
}

.invoice-title-edit-card {
  padding: 28rpx 30rpx 0;
  border-radius: 20rpx;
  background: #ffffff;
}

.invoice-title-type {
  display: flex;
  gap: 20rpx;
  padding-bottom: 26rpx;
  border-bottom: 1px solid #f1f2f4;
}

.invoice-title-type button {
  min-width: 132rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 58rpx;
}

.invoice-title-type button.is-active {
  border: 2rpx solid #ff4d45;
  background: #fff5f4;
  color: #f31313;
}

.invoice-title-field {
  min-height: 108rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  border-bottom: 1px solid #f1f2f4;
}

.invoice-title-field:last-child {
  border-bottom: 0;
}

.invoice-title-field text {
  width: 150rpx;
  flex: 0 0 auto;
  color: #1f2937;
  font-size: 29rpx;
  font-weight: 800;
}

.invoice-title-field input {
  min-width: 0;
  flex: 1;
  height: 76rpx;
  color: #1f2937;
  font-size: 29rpx;
  font-weight: 700;
  line-height: 76rpx;
  text-align: right;
}

.invoice-title-delete {
  height: 84rpx;
  margin-top: 22rpx;
  border-radius: 18rpx;
  background: #ffffff;
  color: #f31313;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 84rpx;
}

.invoice-title-edit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 56rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
}

.invoice-title-edit-bar button {
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
