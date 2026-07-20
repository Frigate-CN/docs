<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import IconRail from "./IconRail.vue";
import SettingsNavigation from "./SettingsNavigation.vue";
import SettingsContent from "./SettingsContent.vue";
import SystemMenu from "./SystemMenu.vue";
import NavigationHint from "./NavigationHint.vue";

const props = defineProps({
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
});

const cameraReady = ref(false);

let timer;
onMounted(() => {
    timer = window.setTimeout(() => (cameraReady.value = true), 40);
});
onUnmounted(() => window.clearTimeout(timer));

const cameraClass = ref("cameraOverview");

watch(
    [cameraReady, () => props.step.guidePhase],
    () => {
        if (!cameraReady.value) {
            cameraClass.value = "cameraOverview";
            return;
        }
        if (props.step.guidePhase === "settings") {
            cameraClass.value = "cameraSettings";
        } else if (props.step.guidePhase === "menu") {
            cameraClass.value = "cameraMenu";
        } else {
            cameraClass.value = "cameraField";
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="appFrame" :class="cameraClass">
        <header class="appHeader">
            <div class="logoCell">
                <img src="/img/branding/logo-dark.svg" alt="" />
            </div>
            <div class="settingsTitle">设置</div>
        </header>
        <div class="appBody">
            <IconRail :phase="step.guidePhase" />
            <SettingsNavigation :step="step" />
            <SettingsContent :step="step" :navigation="navigation" />
            <SystemMenu :visible="cameraReady && step.guidePhase === 'settings'" />
            <NavigationHint v-if="step.guidePhase !== 'field'" :key="`${step.guidePhase}-${step.level}-${step.section}`"
                :navigation="navigation" :step="step" />
        </div>
    </div>
</template>
