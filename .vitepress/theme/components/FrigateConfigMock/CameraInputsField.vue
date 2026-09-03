<script setup>
import { computed } from "vue";
import LcIcon from "./LcIcon.vue";
import FfmpegArgsControl from "./FfmpegArgsControl.vue";
import FieldHint from "./FieldHint.vue";

/**
 * Mock of the real CameraInputsField (fields/CameraInputsField.tsx):
 * one collapsible card per input stream with
 *   - 转流传输（go2rtc）/ 手动输入路径 radio
 *   - go2rtc stream combobox (restream) or path input (manual)
 *   - 输入流功能 switches (detect / record / audio)
 *   - 输入参数 + 硬件加速参数 FfmpegArgsWidget (inherit/preset/manual)
 *
 * Rendered through the generic FieldRow pipeline: the manifest marks the
 * ffmpeg "inputs" field with widget "cameraInputs" and FieldRow mounts this
 * component. All values come from step.values.inputs (array), so every doc
 * page can pass its own streams without any bespoke layout component.
 */
const props = defineProps({
    field: { type: Object, required: true },
    fieldKey: { type: String, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const roleLabels = { detect: "检测", record: "录制", audio: "音频" };

const inputPresets = [
    { value: "preset-rtsp-restream", label: "RTSP - 从 go2rtc 转流" },
    { value: "preset-rtsp-restream-low-latency", label: "RTSP - 从 go2rtc 转流（低延迟）" },
    { value: "preset-rtsp-generic", label: "RTSP（通用）" },
    { value: "preset-rtsp-udp", label: "RTSP - UDP协议" },
    { value: "preset-rtmp-generic", label: "RTMP（通用）" },
    { value: "preset-http-mjpeg-generic", label: "HTTP MJPEG（通用）" },
];

const hwaccelPresets = [
    { value: "preset-vaapi", label: "VAAPI (Intel/AMD GPU)" },
    { value: "preset-intel-qsv-h264", label: "Intel QuickSync (H.264)" },
    { value: "preset-intel-qsv-h265", label: "Intel QuickSync (H.265)" },
    { value: "preset-nvidia", label: "NVIDIA GPU" },
    { value: "preset-rkmpp", label: "瑞芯微 RKMPP" },
];

const inputs = computed(() => {
    const raw = props.step.values?.[props.fieldKey];
    return Array.isArray(raw) && raw.length
        ? raw
        : [{ path: "", mode: "manual", stream: "", roles: [] }];
});

const focused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === props.fieldKey,
);
</script>

<template>
    <div class="cameraInputsField" :class="{ focused: focused }"
        :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
        <div class="fieldCopy">
            <strong>{{ field.label }}</strong>
            <p v-if="field.description">{{ field.description }}</p>
        </div>
        <div class="cameraInputsList" aria-hidden="true">
            <section v-for="(input, index) in inputs" :key="index" class="cameraInputCard">
                <header class="cameraInputHeader">
                    <div>
                        <span class="cameraInputTitle">{{ input.title ?? `视频流 ${index + 1}` }}</span>
                        <span v-if="input.path" class="cameraInputPath">{{ input.path }}</span>
                    </div>
                    <LcIcon name="chevron-down" :size="16" />
                </header>

                <div class="cameraInputBody">
                    <!-- source mode radio: restream / manual (StreamSourceSelector:
                         RadioGroup flex-col gap-2 sm:flex-row sm:gap-6) -->
                    <div class="radioGroup horizontal">
                        <span class="radioRow">
                            <span class="radio" :class="{ radioOn: input.mode !== 'manual' }"><i /></span>
                            <span class="radioLabel">转流传输（go2rtc）</span>
                        </span>
                        <span class="radioRow">
                            <span class="radio" :class="{ radioOn: input.mode === 'manual' }"><i /></span>
                            <span class="radioLabel">手动输入路径</span>
                        </span>
                    </div>

                    <!-- restream branch: Label + combobox (sm:max-w-xs) -->
                    <div v-if="input.mode !== 'manual'" class="cameraInputField">
                        <span class="cameraInputLabel">go2rtc 视频流</span>
                        <span class="input go2rtcSelect">
                            {{ input.stream || "选择 go2rtc 视频流" }}
                            <span class="chevron">
                                <LcIcon name="chevron-down" :size="14" />
                            </span>
                        </span>
                    </div>
                    <div v-else class="cameraInputField">
                        <span class="cameraInputLabel">视频流路径</span>
                        <span class="input go2rtcSelect">{{ input.path }}</span>
                    </div>

                    <!-- input roles switches (InputRolesWidget: rounded-lg border
                         bg-background_alt p-2 pr-0 md:max-w-md, rows px-3, full switch) -->
                    <div class="cameraInputField">
                        <span class="cameraInputLabel">输入流功能</span>
                        <div class="roleSwitches">
                            <span v-for="(label, role) in roleLabels" :key="role" class="roleSwitchRow">
                                <span>{{ label }}</span>
                                <span class="switch" :class="{ switchOn: (input.roles ?? []).includes(role) }">
                                    <span />
                                </span>
                            </span>
                        </div>
                        <p class="cameraInputDesc">定义该视频流的功能。</p>
                    </div>

                    <!-- input args: split two-column row
                         (FieldTemplate SPLIT_ROW: label+desc left, control right) -->
                    <div class="splitFieldRow">
                        <div class="splitFieldCopy">
                            <span class="cameraInputLabel">输入参数</span>
                            <p class="cameraInputDesc">该视频流特定的输入参数。</p>
                            <span class="docsLinkInline">阅读文档 <LcIcon name="external-link" :size="12" /></span>
                        </div>
                        <div class="splitFieldControl">
                            <FfmpegArgsControl :mode="input.inputArgMode ?? 'preset'"
                                :mode-labels="{ inherit: '继承摄像头设置' }"
                                :preset-value="input.inputArgPreset ?? 'preset-rtsp-restream'"
                                :preset-options="inputPresets" :manual-value="input.inputArgs ?? ''" />
                        </div>
                    </div>

                    <!-- hwaccel args: split row, only shown for detect streams -->
                    <div v-if="(input.roles ?? []).includes('detect')" class="splitFieldRow">
                        <div class="splitFieldCopy">
                            <span class="cameraInputLabel">硬件加速参数</span>
                            <p class="cameraInputDesc">读取该视频流的硬件加速参数。</p>
                            <span class="docsLinkInline">阅读文档 <LcIcon name="external-link" :size="12" /></span>
                        </div>
                        <div class="splitFieldControl">
                            <FfmpegArgsControl :mode="input.hwaccelMode ?? 'inherit'"
                                :mode-labels="{ inherit: '继承摄像头设置' }"
                                :preset-value="input.hwaccelPreset ?? 'preset-vaapi'"
                                :preset-options="hwaccelPresets" :manual-value="input.hwaccelArgs ?? ''" />
                        </div>
                    </div>

                    <div class="cameraInputFooter">
                        <span class="objectDelete">
                            <LcIcon name="trash-2" :size="15" />
                        </span>
                    </div>
                </div>
            </section>

            <span class="objectAdd">
                <LcIcon name="plus" :size="15" /> 添加
            </span>
        </div>
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel"
            :title="field.label" />
    </div>
</template>
