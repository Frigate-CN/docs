<script setup>
import LcIcon from "./LcIcon.vue";

defineProps({
    phase: { type: String, default: "" },
});
</script>

<template>
    <aside class="iconRail" aria-hidden="true">
        <span class="railIcon">
            <LcIcon name="video" />
        </span>
        <span class="railIcon">
            <LcIcon name="video-library" />
        </span>
        <span class="railIcon">
            <LcIcon name="search" />
        </span>
        <span class="railIcon">
            <LcIcon name="compact-disc" />
        </span>
        <span class="railIcon">
            <LcIcon name="face-id" />
        </span>
        <span class="railIcon">
            <LcIcon name="category" />
        </span>
        <span class="railSpacer" />
        <span class="railIcon settingsIcon" :class="{ navigationTarget: phase === 'settings' }">
            <LcIcon name="settings" />
        </span>
    </aside>
</template>
