<script setup>
defineProps({
    value: { type: String, required: true },
    label: { type: String, default: "" },
});
</script>

<template>
    <div :data-tab-value="value">
        <slot />
    </div>
</template>
