<script setup>
defineProps({
    path: { type: String, required: true },
});
</script>

<template>
    <span class="nav-path">{{ path }}</span>
</template>

<style scoped>
.nav-path {
    font-weight: 600;
    color: var(--vp-c-brand-1, #3451b2);
}
</style>
