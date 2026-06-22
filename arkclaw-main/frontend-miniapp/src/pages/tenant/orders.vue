<template>
  <MiniProgramOrders />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import MiniProgramOrders from '../../components/MiniProgramOrders.vue';

onShow(() => {
  uni.hideHomeButton();
});
</script>
