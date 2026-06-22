<template>
  <MiniProgramConsole
    role="agent"
    default-key="dashboard"
    :modules="agentModules"
  />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import MiniProgramConsole from '../../components/MiniProgramConsole.vue';
import { agentMiniProgramTabs } from '../../data/consoleData';

const agentModules = agentMiniProgramTabs;

onShow(() => {
  uni.hideHomeButton();
});
</script>
