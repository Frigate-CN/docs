<script setup>
import { computed } from "vue";
import FieldRow from "./FieldRow.vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";
import { manifest, humanizeKey } from "./helpers.js";

const props = defineProps({
    section: { type: Object, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const detectors = computed(() => props.step.values?.detectors ?? {});

const detectorLabels = computed(() => [
    ...new Set(
        Object.values(detectors.value).map((detector) => {
            const type = detector.type ?? "cpu";
            return manifest.detectorTypes?.[type]?.label ?? humanizeKey(type);
        }),
    ),
]);

const detectorFocused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === "detectors",
);

const modelFocused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === "custom_model",
);

const orderedModelFields = computed(() =>
    props.section.order.filter((key) => props.section.fields[key]),
);

const standardModelFields = computed(() =>
    orderedModelFields.value.filter((key) => !props.section.fields[key].advanced),
);

const advancedModelFields = computed(() =>
    orderedModelFields.value.filter((key) => props.section.fields[key].advanced),
);
</script>

<template>
    <div class="detectorModelLayout">
        <section class="detectorHardwareCard" :class="{ focused: detectorFocused }"
            :ref="(el) => { if (detectorFocused && focusRef) focusRef.current = el }">
            <div class="detectorCardHeader">
                <div>
                    <strong>检测器硬件</strong>
                    <small>配置运行目标检测的检测器后端。</small>
                </div>
                <span>
                    <LcIcon name="chevron-down" :size="14" />
                </span>
            </div>
            <div class="detectorInstances">
                <div v-for="(detector, name) in detectors" :key="name" class="detectorInstance">
                    <div class="detectorInstanceHeader">
                        <span>
                            <LcIcon name="chevron-down" :size="14" />
                        </span>
                        <div>
                            <strong>{{ manifest.detectorTypes?.[detector.type ?? 'cpu']?.label ??
                                humanizeKey(detector.type ?? 'cpu') }}</strong>
                            <span>{{ name }}</span>
                            <small v-if="manifest.detectorTypes?.[detector.type ?? 'cpu']?.description">
                                {{ manifest.detectorTypes[detector.type ?? 'cpu'].description }}
                            </small>
                        </div>
                        <span>
                            <LcIcon name="trash-2" :size="14" />
                        </span>
                    </div>
                    <div class="detectorFields">
                        <div>
                            <span>ID</span>
                            <span class="input">{{ name }}</span>
                        </div>
                        <div>
                            <span>类型</span>
                            <span class="input">{{ manifest.detectorTypes?.[detector.type ?? 'cpu']?.label ??
                                humanizeKey(detector.type ?? 'cpu') }}</span>
                        </div>
                    </div>
                    <div class="detectorSpecificFields">
                        <div v-for="([key, value]) in Object.entries(detector).filter(([k]) => k !== 'type')" :key="key"
                            class="detectorSpecificField">
                            <div>
                                <strong>{{ manifest.detectorTypes?.[detector.type ?? 'cpu']?.fields?.[key]?.label ??
                                    humanizeKey(key) }}</strong>
                                <small
                                    v-if="manifest.detectorTypes?.[detector.type ?? 'cpu']?.fields?.[key]?.description">
                                    {{ manifest.detectorTypes[detector.type ?? 'cpu'].fields[key].description }}
                                </small>
                            </div>
                            <span class="input">{{
                                value === '' ? '' :
                                    (value && typeof value === 'object' ? JSON.stringify(value) : String(value))
                                }}</span>
                        </div>
                    </div>
                    <span class="objectAdd">
                        <LcIcon name="plus" :size="12" /> 添加自定义键
                    </span>
                </div>
                <div class="detectorAddPanel">
                    <span>添加检测器</span>
                    <div>
                        <span class="input">类型</span>
                        <span class="objectAdd">
                            <LcIcon name="plus" :size="12" /> 添加
                        </span>
                    </div>
                </div>
            </div>
            <FieldHint v-if="detectorFocused" :navigation="navigation"
                :text="step.hint ?? (detectorLabels.length ? `配置${detectorLabels.join('、')}检测器硬件。` : step.guideLabel)"
                title="检测器硬件" />
        </section>

        <section class="detectorHardwareCard" :class="{ focused: modelFocused }"
            :ref="(el) => { if (modelFocused && focusRef) focusRef.current = el }">
            <div class="detectorCardHeader">
                <div>
                    <strong>检测模型</strong>
                    <small>配置模型及其输入形状。</small>
                </div>
                <span>
                    <LcIcon name="chevron-down" :size="14" />
                </span>
            </div>
            <div class="detectorModelTabs">
                <span>Frigate+</span>
                <strong>自定义模型</strong>
            </div>
            <div class="fields">
                <FieldRow v-for="key in standardModelFields" :key="key" :field-key="key" :field="section.fields[key]"
                    :step="step" :navigation="navigation" :focus-ref="focusRef" />
            </div>
            <div class="detectorAdvancedHeader">
                <span>
                    <LcIcon name="chevron-down" :size="14" />
                </span>
                <span>高级设置 ({{ advancedModelFields.length }})</span>
            </div>
            <div class="detectorAdvancedFields">
                <FieldRow v-for="key in advancedModelFields" :key="key" :field-key="key" :field="section.fields[key]"
                    :step="step" :navigation="navigation" :focus-ref="focusRef" />
            </div>
            <FieldHint v-if="modelFocused" :navigation="navigation" :text="step.hint ?? step.guideLabel"
                title="自定义模型" />
        </section>
    </div>
</template>
