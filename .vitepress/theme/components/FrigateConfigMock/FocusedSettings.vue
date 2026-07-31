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
        } else if (
            props.step.guidePhase === "camera-switch" ||
            props.step.guidePhase === "menu-collapsed" ||
            props.step.guidePhase === "menu"
        ) {
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
            <div
                v-if="step.level === 'camera'"
                class="cameraSwitcher"
                :class="{ cameraSwitcherTarget: step.guidePhase === 'camera-switch' }"
            >
                <svg
                    stroke="currentColor"
                    fill="currentColor"
                    stroke-width="0"
                    viewBox="0 0 576 512"
                    height="20"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z"
                    />
                </svg>
                <span>前门</span>
            </div>
        </header>
        <div class="appBody">
            <IconRail :phase="step.guidePhase" />
            <SettingsNavigation :step="step" />
            <SettingsContent :step="step" :navigation="navigation" />
            <SystemMenu :visible="cameraReady && step.guidePhase === 'settings'" />
            <NavigationHint
                v-if="step.guidePhase !== 'field' && step.guidePhase !== 'camera-switch'"
                :key="`${step.guidePhase}-${step.level}-${step.section}`"
                :navigation="navigation"
                :step="step"
            />
        </div>
        <NavigationHint
            v-if="step.guidePhase === 'camera-switch'"
            :navigation="navigation"
            :step="step"
        />
    </div>
</template>
