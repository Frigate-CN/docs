<script setup lang="ts">
import { TkTransitionCollapse } from "vitepress-theme-teek";
import { ref } from "vue";

interface Props {
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "展开查看",
});

const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="collapse tk-collapse-container">
    <div
      class="tk-collapse-container__summary"
      :class="{ 'tk-collapse-container__summary--open': isOpen }"
      @click="toggle"
    >
      <span class="tk-collapse-container__title">{{ title }}</span>
      <span class="tk-collapse-container__icon" :class="{ 'tk-collapse-container__icon--open': isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <TkTransitionCollapse>
      <div v-show="isOpen" class="tk-collapse-container__content">
        <div class="tk-collapse-container__inner">
          <slot />
        </div>
      </div>
    </TkTransitionCollapse>
  </div>
</template>