<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { TkTransitionCollapse } from 'vitepress-theme-teek';

interface Props {
  title?: string;
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '详细信息',
  defaultOpen: false,
});

const isOpen = ref(props.defaultOpen);
const contentRef = ref<HTMLElement>();

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

// 检查目标锚点是否在组件内
const isTargetInComponent = (hash?: string) => {
  const targetHash = hash || window.location.hash;
  if (!targetHash) return false;

  const targetId = targetHash.replace('#', '');
  if (!targetId) return false;

  if (!contentRef.value) return false;

  // 检查内容区域是否包含该 ID 的元素
  const headers = contentRef.value.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
  for (const header of headers) {
    if (header.getAttribute('id') === targetId) {
      return true;
    }
  }

  return false;
};

// 滚动到目标锚点
const scrollToTarget = () => {
  const hash = window.location.hash;
  if (!hash) return;

  const targetId = hash.replace('#', '');
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    // 考虑导航栏高度的滚动
    const headerOffset = 64;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// 处理 hash 变化
const handleHashChange = () => {
  if (isTargetInComponent()) {
    if (!isOpen.value) {
      isOpen.value = true;
      nextTick(() => {
        setTimeout(() => {
          scrollToTarget();
        }, 400);
      });
    } else {
      // 已经展开，直接滚动
      setTimeout(() => {
        scrollToTarget();
      }, 50);
    }
  }
};

// 处理初始加载
onMounted(() => {
  // 初始加载时检查
  if (isTargetInComponent()) {
    isOpen.value = true;
    nextTick(() => {
      setTimeout(() => {
        scrollToTarget();
      }, 400);
    });
  }

  // 监听 hash 变化（仅在组件内有目标锚点时响应）
  window.addEventListener('hashchange', handleHashChange);
});

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange);
});
</script>

<template>
  <div class="details-collapse">
    <div
      class="details-collapse__summary"
      :class="{ 'details-collapse__summary--open': isOpen }"
      @click="toggleOpen"
    >
      <span class="details-collapse__title">{{ title }}</span>
      <span class="details-collapse__icon" :class="{ 'details-collapse__icon--open': isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <TkTransitionCollapse>
      <div v-show="isOpen" class="details-collapse__content" style="min-height: 0;">
        <div class="details-collapse__inner" ref="contentRef">
          <slot />
        </div>
      </div>
    </TkTransitionCollapse>
  </div>
</template>

<style scoped>
.details-collapse {
  margin: 1rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg);
}

.details-collapse__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background-color: var(--vp-c-bg-soft);
  transition: background-color 0.2s;
}

.details-collapse__summary:hover {
  background-color: var(--vp-c-bg-mute);
}

.details-collapse__title {
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.details-collapse__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--vp-c-text-2);
  transition: transform 0.2s;
}

.details-collapse__icon--open {
  transform: rotate(180deg);
}

.details-collapse__icon svg {
  width: 16px;
  height: 16px;
}

.details-collapse__content {
  border-top: 1px solid var(--vp-c-border);
}

.details-collapse__inner {
  padding: 16px;
  color: var(--vp-c-text-1);
}

/* 深色模式适配 */
.dark .details-collapse {
  border-color: var(--vp-c-divider);
}

.dark .details-collapse__summary {
  background-color: var(--vp-c-bg-soft);
}

.dark .details-collapse__summary:hover {
  background-color: var(--vp-c-bg-mute);
}

.dark .details-collapse__content {
  border-top-color: var(--vp-c-divider);
}
</style>
