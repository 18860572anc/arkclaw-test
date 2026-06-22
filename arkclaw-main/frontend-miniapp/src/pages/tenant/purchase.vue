<template>
  <MiniProgramSeatPurchase />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import MiniProgramSeatPurchase from '../../components/MiniProgramSeatPurchase.vue';

onShow(() => {
  uni.hideHomeButton();
});
</script>
