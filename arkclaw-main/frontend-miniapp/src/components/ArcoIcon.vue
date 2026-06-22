<template>
  <image class="arco-icon" :src="iconSrc" mode="aspectFit" :style="iconStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name: string;
  size?: number;
  color?: string;
}>(), {
  size: 22,
  color: '#86909C',
});

const iconPaths: Record<string, string> = {
  apps: '<path stroke-linejoin="round" d="M7 7H20V20H7z"/><path stroke-linejoin="round" d="M28 7H41V20H28z"/><path stroke-linejoin="round" d="M7 28H20V41H7z"/><path stroke-linejoin="round" d="M28 28H41V41H28z"/>',
  book: '<path stroke-linejoin="round" d="M24 13 7 7v28l17 6 17-6V7l-17 6Zm0 0v27.5M29 18l7-2.5M29 25l7-2.5M29 32l7-2.5M19 18l-7-2.5m7 9.5-7-2.5m7 9.5-7-2.5"/>',
  clipboard: '<path stroke-linejoin="round" d="M17 9h14l2 5H15l2-5Z"/><path d="M13 13H9v29h30V13h-4"/><path stroke-linecap="round" d="M16 24h16M16 31h16M16 38h10"/>',
  cart: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 10h5l4 18h17l4-13H15"/><path stroke-linecap="round" d="M18 33h18"/><circle cx="19" cy="38" r="2.5"/><circle cx="34" cy="38" r="2.5"/>',
  dashboard: '<path d="M41.808 24c.118 4.63-1.486 9.333-5.21 13m5.21-13h-8.309m8.309 0c-.112-4.38-1.767-8.694-4.627-12M24 6c5.531 0 10.07 2.404 13.18 6M24 6c-5.724 0-10.384 2.574-13.5 6.38M24 6v7.5M37.18 12 31 17.5m-20.5-5.12L17 17.5m-6.5-5.12C6.99 16.662 5.44 22.508 6.53 28m4.872 9c-2.65-2.609-4.226-5.742-4.873-9m0 0 8.97-3.5"/><path stroke-linejoin="round" d="M24 32a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 0V19"/>',
  file: '<path d="M16 21h16m-16 8h10m11 13H11a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h21l7 7v27a2 2 0 0 1-2 2Z"/>',
  folder: '<path d="M6 15h14l4 5h18v20H6V15Z"/><path d="M6 20h36"/>',
  home: '<path d="M7 17 24 7l17 10v24H7V17Z"/><path d="M20 28h8v13h-8V28Z"/>',
  message: '<path d="M15 20h18m-18 9h9M7 41h17.63C33.67 41 41 33.67 41 24.63V24c0-9.389-7.611-17-17-17S7 14.611 7 24v17Z"/>',
  notification: '<path d="M24 9c7.18 0 13 5.82 13 13v13H11V22c0-7.18 5.82-13 13-13Zm0 0V4M6 35h36m-25 7h14"/>',
  receipt: '<path d="M10 7h28v34l-5-3-5 3-4-3-5 3-4-3-5 3V7Z"/><path stroke-linecap="round" d="M17 18h14M17 26h14M17 34h8"/>',
  safe: '<path d="m16.825 22.165 6 6 10-10M24 6c7 4 16 5 16 5v15s-2 12-16 16.027C10 38 8 26 8 26V11s9-1 16-5Z"/>',
  settings: '<path d="M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"/><path d="m17 7 3-3h8l3 3v4l4 2 4-1 4 7-2 4 2 4-4 7-4-1-4 2v4l-3 3h-8l-3-3v-4l-4-2-4 1-4-7 2-4-2-4 4-7 4 1 4-2V7Z"/>',
  storage: '<path d="M7 18h34v12H7V18ZM40 6H8a1 1 0 0 0-1 1v11h34V7a1 1 0 0 0-1-1ZM7 30h34v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V30Z"/><path d="M13.02 36H13v.02h.02V36Z"/><path d="M13.02 24H13v.02h.02V24Z"/>',
  userGroup: '<circle cx="18" cy="15" r="7"/><circle cx="34" cy="19" r="4"/><path d="M6 34a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v6H6v-6ZM34 30h4a4 4 0 0 1 4 4v4h-8"/>',
  wallet: '<path d="M8 13h32v26H8V13Z"/><path d="M34 22h8v10h-8a5 5 0 0 1 0-10Z"/><path d="M12 13 31 7l5 6"/><circle cx="35" cy="27" r="1.5"/>',
};

const svg = computed(() => {
  const paths = iconPaths[props.name] ?? iconPaths.apps;
  const color = encodeURIComponent(props.color);
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="4" viewBox="0 0 48 48">${paths}</svg>`;
});

const iconSrc = computed(() => `data:image/svg+xml;utf8,${svg.value}`);

const iconStyle = computed(() => {
  const size = `${props.size * 2}rpx`;
  return `width:${size};height:${size};`;
});
</script>

<style scoped>
.arco-icon {
  display: block;
  flex: 0 0 auto;
}
</style>
