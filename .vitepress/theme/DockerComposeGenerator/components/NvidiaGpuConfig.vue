<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  gpuCount: string;
  gpuDeviceId: string;
  gpuDeviceIdError: boolean;
  onGpuCountChange: (value: string) => string;
  onGpuDeviceIdChange: (value: string) => string;
}>();

const showDeviceId = computed(() => props.gpuCount !== "");

function handleCountInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const sanitized = props.onGpuCountChange(input.value);
  if (input.value !== sanitized) input.value = sanitized;
}

function handleDeviceIdInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const sanitized = props.onGpuDeviceIdChange(input.value);
  if (input.value !== sanitized) input.value = sanitized;
}
</script>

<template>
  <div class="dcg-nvidia">
    <div class="dcg-form-group">
      <label class="dcg-label" for="dcg-gpu-count">GPU 数量：</label>
      <input
        id="dcg-gpu-count"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        class="dcg-input"
        :value="gpuCount"
        placeholder="all"
        @input="handleCountInput"
      />
      <p class="dcg-help-text">
        留空表示使用所有 GPU；也可以填写具体数量（如 1、2、3）
      </p>
    </div>
    <div v-if="showDeviceId" class="dcg-form-group">
      <label class="dcg-label" for="dcg-gpu-device-id">
        GPU 设备 ID（必填，逗号分隔）：
      </label>
      <input
        id="dcg-gpu-device-id"
        type="text"
        class="dcg-input"
        :class="{ 'dcg-input--error': gpuDeviceIdError }"
        :value="gpuDeviceId"
        placeholder="0"
        @input="handleDeviceIdInput"
      />
      <p v-if="gpuDeviceIdError" class="dcg-help-text">
        ⚠️ 当 GPU 数量为数字时，必须输入 GPU 设备 ID
      </p>
      <p v-else class="dcg-help-text">单个 GPU 输入：0；多个 GPU 输入：0,1,2</p>
    </div>
  </div>
</template>
