<script setup lang="ts">
import { devices } from "../config";
import DeviceIcon from "./DeviceIcon.vue";

defineProps<{ selectedId: string }>();
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <section class="dcg-section">
    <h4>设备类型</h4>
    <div class="dcg-device-grid">
      <div
        v-for="device in devices"
        :key="device.id"
        class="dcg-device-card"
        :class="{ 'dcg-device-card--active': selectedId === device.id }"
        role="button"
        tabindex="0"
        @click="emit('select', device.id)"
        @keydown.enter="emit('select', device.id)"
        @keydown.space.prevent="emit('select', device.id)"
      >
        <DeviceIcon :device="device" />
        <div class="dcg-device-name">{{ device.name }}</div>
        <div class="dcg-device-desc">{{ device.description }}</div>
      </div>
    </div>
  </section>
</template>
