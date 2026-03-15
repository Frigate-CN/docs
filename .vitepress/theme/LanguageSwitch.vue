<script setup lang="ts">
import { useRoute } from 'vitepress'
import { computed } from 'vue'

const route = useRoute()

const englishUrl = computed(() => {
  // 获取当前路径，移除开头的斜杠
  const path = route.path.replace(/^\//, '')
  return `https://docs.frigate.video/${path}`
})
</script>

<template>
  <div class="VPMenuLink">
    <a
      :href="englishUrl"
      target="_blank"
      class="VPLink vp-link lang-switch-link link vp-external-link-icon"
      rel="noreferrer"
    >
      English
    </a>
  </div>
</template>

<style scoped>
.lang-switch-link {
  display: block;
  border-radius: 6px;
  padding: 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  transition: background-color 0.25s, color 0.25s;
}

.lang-switch-link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}
</style>
