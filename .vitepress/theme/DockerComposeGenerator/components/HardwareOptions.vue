<script setup lang="ts">
import { hardwareOptions } from "../config";
import { renderInlineMarkdown } from "../utils/markdown";

defineProps<{
  deviceId: string;
  hardwareEnabled: Record<string, boolean>;
  isDisabled: (hwId: string) => boolean;
}>();

const emit = defineEmits<{ toggle: [hwId: string] }>();
</script>

<template>
  <section class="dcg-section">
    <h4>硬件加速</h4>
    <p v-if="deviceId !== 'stable'" class="dcg-help-text">
      部分选项已根据设备类型自动配置。
    </p>
    <div class="dcg-checkbox-grid">
      <div v-for="option in hardwareOptions" :key="option.id" class="dcg-checkbox-item">
        <label
          class="dcg-checkbox-label"
          :class="{ 'dcg-checkbox-label--disabled': isDisabled(option.id) }"
        >
          <input
            type="checkbox"
            :checked="!isDisabled(option.id) && !!hardwareEnabled[option.id]"
            :disabled="isDisabled(option.id)"
            @change="emit('toggle', option.id)"
          />
          <span>{{ option.label }}</span>
        </label>
        <div
          v-if="!isDisabled(option.id) && hardwareEnabled[option.id] && option.description"
          class="dcg-checkbox-desc"
          v-html="renderInlineMarkdown(option.description)"
        ></div>
      </div>
    </div>
  </section>
</template>
