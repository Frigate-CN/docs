<script setup lang="ts">
import { TkPopover } from 'vitepress-theme-teek';
interface Props {
  href?: string;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: '点击查看详情',
});
</script>

<template>
  <TkPopover placement="top-start" class="info-icon-wrapper">
    <template #reference>
      <span v-if="href" class="info-icon">
        <a :href="href" target="_blank" class="info-icon__circle">?</a>
      </span>
      <span v-else class="info-icon">
        <span class="info-icon__circle">?</span>
      </span>
    </template>
    <template #default>
      <div v-html="text"></div>
    </template>
  </TkPopover>
</template>

<style>
/* 非 scoped，覆盖 TkPopover 外层 div 样式 */
.info-icon-wrapper {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
}
</style>

<style scoped>
.info-icon {
  display: inline-flex;
  align-items: center;
}

.info-icon__circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.info-icon__circle:hover {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-brand);
}

.info-icon a.info-icon__circle {
  color: var(--vp-c-text-2);
}

.info-icon a.info-icon__circle:hover {
  color: var(--vp-c-bg);
}
</style>
