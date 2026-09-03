<script setup>
import { computed } from "vue";
import FfmpegArgsControl from "./FfmpegArgsControl.vue";
import FieldHint from "./FieldHint.vue";

/**
 * Mock of the camera level FFmpeg fields that use the real FfmpegArgsWidget:
 * 输入参数 / 硬件加速参数 / 输出参数 with 继承摄像头设置(或继承全局设置) /
 * 预设 / 手动参数 radios. Rendered through the generic FieldRow pipeline
 * (widget "ffmpegArgs").
 */
const props = defineProps({
    field: { type: Object, required: true },
    fieldKey: { type: String, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const inputPresets = [
    { value: "preset-rtsp-generic", label: "RTSP（通用）" },
    { value: "preset-rtsp-restream", label: "RTSP - 从 go2rtc 转流" },
    { value: "preset-rtsp-restream-low-latency", label: "RTSP - 从 go2rtc 转流（低延迟）" },
    { value: "preset-rtsp-udp", label: "RTSP - UDP协议" },
    { value: "preset-rtmp-generic", label: "RTMP（通用）" },
    { value: "preset-http-mjpeg-generic", label: "HTTP MJPEG（通用）" },
    { value: "preset-http-jpeg-generic", label: "HTTP JPEG（通用）" },
];

const hwaccelPresets = [
    { value: "preset-vaapi", label: "VAAPI (Intel/AMD GPU)" },
    { value: "preset-intel-qsv-h264", label: "Intel QuickSync (H.264)" },
    { value: "preset-intel-qsv-h265", label: "Intel QuickSync (H.265)" },
    { value: "preset-nvidia", label: "NVIDIA GPU" },
    { value: "preset-jetson-h264", label: "NVIDIA Jetson (H.264)" },
    { value: "preset-rkmpp", label: "瑞芯微 RKMPP" },
];

const recordPresets = [
    { value: "preset-record-generic", label: "录制（通用，无音频）" },
    { value: "preset-record-generic-audio-copy", label: "录制（通用，不转码音频）" },
    { value: "preset-record-generic-audio-aac", label: "录制（通用并将音频转码为 AAC）" },
    { value: "preset-record-mjpeg", label: "录制 - MJPEG 流摄像头" },
    { value: "preset-record-jpeg", label: "录制 - JPEG 流摄像头" },
];

const detectPresets = [
    { value: "-threads 2 -f rawvideo -pix_fmt yuv420p", label: "检测（通用）" },
];

const presetSets = {
    input_args: inputPresets,
    hwaccel_args: hwaccelPresets,
    "output_args.record": recordPresets,
    "output_args.detect": detectPresets,
};

const focused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === props.fieldKey,
);

const rawValue = computed(() => props.step.values?.[props.fieldKey]);

const state = computed(() => {
    const value = rawValue.value;
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return {
            mode: value.mode ?? "inherit",
            preset: value.preset ?? "",
            manual: value.manual ?? "",
        };
    }
    if (typeof value === "string" && value.startsWith("preset-")) {
        return { mode: "preset", preset: value, manual: "" };
    }
    if (typeof value === "string" && value.length > 0) {
        return { mode: "manual", preset: "", manual: value };
    }
    return { mode: "inherit", preset: "", manual: "" };
});

const presetOptions = computed(() => presetSets[props.fieldKey] ?? inputPresets);

const presetValue = computed(
    () =>
        state.value.preset ||
        presetOptions.value.find((option) => option.value === state.value.manual)?.value ||
        presetOptions.value[0]?.value ||
        "",
);
</script>

<template>
    <div class="field" :class="{ focused: focused }"
        :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
        <div class="fieldCopy">
            <strong>{{ field.label }}</strong>
            <p v-if="field.description">{{ field.description }}</p>
        </div>
        <FfmpegArgsControl aria-hidden="true" :mode="state.mode"
            :mode-labels="fieldKey.startsWith('output_args')
                ? { inherit: '继承全局设置' }
                : null"
            :preset-value="presetValue" :preset-options="presetOptions"
            :manual-value="state.manual" />
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel"
            :title="field.label" />
    </div>
</template>
