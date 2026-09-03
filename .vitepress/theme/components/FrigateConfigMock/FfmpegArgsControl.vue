<script setup>
import { computed } from "vue";
import LcIcon from "./LcIcon.vue";

/**
 * Mock of the real FfmpegArgsWidget (widgets/FfmpegArgsWidget.tsx):
 * a radio group 继承摄像头设置 / 预设 / 手动参数 with either a preset
 * <select> (mode = preset) or a plain input (mode = manual) below.
 *
 * Data driven purely from props — no section specific markup here.
 */
const props = defineProps({
    mode: { type: String, default: "inherit" }, // inherit | preset | manual
    modeLabels: { type: Object, default: null }, // { inherit, preset, manual }
    presetValue: { type: String, default: "" },
    presetOptions: { type: Array, default: null }, // [{ value, label }]
    manualValue: { type: String, default: "" },
    selectPlaceholder: { type: String, default: "选择预设" },
});

const labels = computed(() => ({
    inherit: "继承摄像头设置",
    preset: "预设",
    manual: "手动参数",
    ...(props.modeLabels ?? {}),
}));

const activePreset = computed(() => {
    const options = props.presetOptions ?? [];
    return (
        options.find((option) => option.value === props.presetValue) ??
        options[0] ?? { value: "", label: "" }
    );
});
</script>

<template>
    <div class="ffmpegArgs" aria-hidden="true">
        <div class="radioGroup">
            <span v-for="option in ['inherit', 'preset', 'manual']" :key="option"
                class="radioRow">
                <span class="radio" :class="{ radioOn: mode === option }">
                    <i />
                </span>
                <span class="radioLabel">{{ labels[option] }}</span>
            </span>
        </div>

        <span v-if="mode === 'preset'" class="input selectInput">
            {{ activePreset.label || selectPlaceholder }}
            <span class="chevron">
                <LcIcon name="chevron-down" :size="14" />
            </span>
        </span>
        <span v-else-if="mode === 'manual'" class="input">{{ manualValue }}</span>
    </div>
</template>
