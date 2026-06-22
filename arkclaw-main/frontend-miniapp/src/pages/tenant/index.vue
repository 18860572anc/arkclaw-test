<template>
  <MiniProgramConsole
    role="tenant"
    default-key="overview"
    :modules="tenantModules"
  />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import MiniProgramConsole from '../../components/MiniProgramConsole.vue';
import { tenantMiniProgramTabs } from '../../data/consoleData';

const tenantModules = tenantMiniProgramTabs;

onShow(() => {
  uni.hideHomeButton();
});
</script>
