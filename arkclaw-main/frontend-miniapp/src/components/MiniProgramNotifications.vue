<template>
  <view class="notifications-page">
    <view class="notifications-head">
      <view>
        <text>消息中心</text>
        <text>{{ unreadCount }} 条未读</text>
      </view>
      <button :disabled="unreadCount === 0" @click="readAll">全部已读</button>
    </view>

    <view class="notification-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['notification-tab', activeFilter === tab.key ? 'is-active' : '']"
        @click="switchFilter(tab.key)"
      >
        {{ tab.label }}
      </button>
    </view>

    <view v-if="filteredNotifications.length" class="notification-list">
      <view
        v-for="item in filteredNotifications"
        :key="item.id"
        :class="['notification-card', item.read ? '' : 'is-unread']"
      >
        <view class="notification-card__head">
          <view class="notification-tags">
            <text :class="['notification-tag', `notification-tag--${item.category}`]">{{ categoryText(item.category) }}</text>
            <text v-if="item.todo" class="notification-tag notification-tag--todo">待处理</text>
            <text v-if="!item.read" class="notification-tag notification-tag--unread">未读</text>
          </view>
          <text :class="['notification-priority', `notification-priority--${item.priority}`]">{{ priorityText(item.priority) }}</text>
        </view>

        <view class="notification-card__body">
          <text class="notification-title">{{ item.title }}</text>
          <text class="notification-summary">{{ item.summary }}</text>
        </view>

        <view class="notification-card__foot">
          <text>{{ item.createdAt }}</text>
          <button
            v-if="item.actionable && item.actionUrl && item.actionLabel"
            :class="item.read ? 'notification-action--ghost' : 'notification-action--primary'"
            @click="openNotification(item)"
          >
            {{ item.actionLabel }}
          </button>
        </view>
      </view>
    </view>

    <view v-else class="notifications-empty">
      <ArcoIcon name="notification" color="#b8c1d1" :size="42" />
      <text>暂无通知</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ArcoIcon from './ArcoIcon.vue';
import {
  getMiniNotificationUnreadCount,
  getMiniNotifications,
  markAllMiniNotificationsRead,
  markMiniNotificationRead,
  type MiniNotificationCategory,
  type MiniNotificationItem,
  type MiniNotificationPriority,
  type MiniNotificationStatusFilter,
} from '../data/notificationStore';

const tabs: Array<{ key: MiniNotificationStatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'todo', label: '待处理' },
];

const activeFilter = ref<MiniNotificationStatusFilter>('all');
const notifications = ref<MiniNotificationItem[]>([]);
const unreadCount = ref(0);

const filteredNotifications = computed(() => notifications.value);

function refreshNotifications() {
  notifications.value = getMiniNotifications(activeFilter.value);
  unreadCount.value = getMiniNotificationUnreadCount();
}

function switchFilter(filter: MiniNotificationStatusFilter) {
  activeFilter.value = filter;
  refreshNotifications();
}

function categoryText(category: MiniNotificationCategory) {
  const map: Record<MiniNotificationCategory, string> = {
    order: '订单',
    review: '审核',
    onboarding: '开通',
    lead: '留资',
    commission: '佣金',
    system: '系统',
  };
  return map[category];
}

function priorityText(priority: MiniNotificationPriority) {
  const map: Record<MiniNotificationPriority, string> = {
    high: '高优先级',
    medium: '重要',
    low: '提示',
  };
  return map[priority];
}

function openNotification(item: MiniNotificationItem) {
  if (!item.read) {
    markMiniNotificationRead(item.id);
    refreshNotifications();
  }

  if (!item.actionable || !item.actionUrl) {
    uni.showToast({ title: '已查看通知', icon: 'none' });
    return;
  }

  uni.navigateTo({ url: item.actionUrl });
}

function readAll() {
  markAllMiniNotificationsRead();
  refreshNotifications();
  uni.showToast({ title: '已全部标记已读', icon: 'none' });
}

onShow(() => {
  uni.hideHomeButton();
  refreshNotifications();
});
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  padding: 24rpx 20rpx 44rpx;
  background: #f5f6f8;
}

.notifications-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
}

.notifications-head view {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.notifications-head view text:first-child {
  color: #1d2129;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 50rpx;
}

.notifications-head view text:last-child {
  color: #86909c;
  font-size: 26rpx;
  line-height: 36rpx;
}

.notifications-head button {
  min-width: 152rpx;
  height: 62rpx;
  border-radius: 999rpx;
  background: #ffc019;
  color: #111827;
  font-size: 27rpx;
  font-weight: 800;
  line-height: 62rpx;
}

.notifications-head button[disabled] {
  background: #eef0f4;
  color: #b8c1d1;
}

.notification-tabs {
  display: flex;
  gap: 18rpx;
  padding: 22rpx 0;
}

.notification-tab {
  min-width: 112rpx;
  height: 60rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #4e5969;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 60rpx;
}

.notification-tab.is-active {
  background: #1d2129;
  color: #ffffff;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.notification-card {
  padding: 24rpx;
  border-radius: 22rpx;
  background: #ffffff;
}

.notification-card.is-unread {
  box-shadow: inset 6rpx 0 0 #1677ff;
}

.notification-card__head,
.notification-tags,
.notification-card__foot {
  display: flex;
  align-items: center;
}

.notification-card__head,
.notification-card__foot {
  justify-content: space-between;
  gap: 18rpx;
}

.notification-tags {
  gap: 10rpx;
  flex-wrap: wrap;
}

.notification-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #165dff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 30rpx;
}

.notification-tag--review,
.notification-tag--todo {
  background: #fff3e8;
  color: #d25f00;
}

.notification-tag--onboarding {
  background: #e8fff1;
  color: #1f9d55;
}

.notification-tag--system {
  background: #ffecec;
  color: #d93026;
}

.notification-tag--unread {
  background: #e8f3ff;
  color: #1677ff;
}

.notification-priority {
  flex: 0 0 auto;
  font-size: 24rpx;
  font-weight: 700;
}

.notification-priority--high { color: #f53f3f; }
.notification-priority--medium { color: #ff7d00; }
.notification-priority--low { color: #86909c; }

.notification-card__body {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 0;
}

.notification-title {
  color: #1d2129;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.notification-summary {
  color: #6b7280;
  font-size: 27rpx;
  line-height: 40rpx;
}

.notification-card__foot text {
  color: #9ca3af;
  font-size: 24rpx;
  line-height: 34rpx;
}

.notification-card__foot button {
  min-width: 148rpx;
  height: 58rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 58rpx;
}

.notification-action--primary {
  background: #ffc019;
  color: #111827;
}

.notification-action--ghost {
  border: 2rpx solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.notifications-empty {
  min-height: 560rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: #86909c;
  font-size: 30rpx;
}
</style>
