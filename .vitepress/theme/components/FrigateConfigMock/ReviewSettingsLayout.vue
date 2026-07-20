<script setup>
import { computed } from "vue";
import FieldRow from "./FieldRow.vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";

const props = defineProps({
    section: { type: Object, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const valueFor = (key) =>
    props.step.values?.[key] ?? props.section.fields?.[key]?.default ?? false;

const defaultZones = ["前门", "车道", "侧院"];

const configuredZones = computed(() => [
    ...(Array.isArray(valueFor("alerts.required_zones"))
        ? valueFor("alerts.required_zones")
        : []),
    ...(Array.isArray(valueFor("detections.required_zones"))
        ? valueFor("detections.required_zones")
        : []),
]);

const zones = computed(() =>
    configuredZones.value.length
        ? [...new Set(configuredZones.value)]
        : defaultZones,
);

const configGroups = [
    { title: "警报配置", fields: ["alerts.enabled", "alerts.labels"] },
    { title: "检测配置", fields: ["detections.enabled", "detections.labels"] },
];
</script>

<template>
    <div class="reviewLayout">
        <section class="reviewRuntimeSection">
            <h4>摄像头核查设置</h4>
            <div class="reviewToggle">
                <span class="switch" :class="{ switchOn: Boolean(valueFor('alerts.enabled')) }" aria-hidden="true">
                    <span />
                </span>
                <strong>警报</strong>
            </div>
            <div class="reviewToggle">
                <span class="switch" :class="{ switchOn: Boolean(valueFor('detections.enabled')) }" aria-hidden="true">
                    <span />
                </span>
                <strong>检测</strong>
            </div>
            <p>临时启用或禁用此摄像头的警报和检测，直到 Frigate 重启。</p>
        </section>

        <section class="reviewRuntimeSection">
            <h4>生成式 AI 核查描述</h4>
            <div class="reviewToggle">
                <span class="switch" :class="{ switchOn: Boolean(valueFor('genai.enabled')) }" aria-hidden="true">
                    <span />
                </span>
                <strong>已启用</strong>
            </div>
            <p>临时启用或禁用此摄像头的生成式 AI 核查描述，直到 Frigate 重启。</p>
        </section>

        <section class="reviewClassification">
            <h4>核查分类</h4>
            <p>配置哪些区域将核查项分类为警报和检测。</p>
            <span class="docsLink">阅读文档
                <LcIcon name="external-link" :size="12" />
            </span>
            <div class="reviewClassificationGrid">
                <div v-for="col in [
                    { fieldKey: 'alerts.required_zones', label: '警报', description: '选择警报区域' },
                    { fieldKey: 'detections.required_zones', label: '检测', description: '选择检测区域' },
                ]" :key="col.fieldKey" class="reviewZoneColumn"
                    :class="{ focused: step.guidePhase === 'field' && step.focus === col.fieldKey }"
                    :ref="(el) => { if (step.guidePhase === 'field' && step.focus === col.fieldKey && focusRef) focusRef.current = el }">
                    <strong>{{ col.label }}</strong>
                    <small>{{ col.description }}</small>
                    <div class="reviewZones">
                        <span v-for="zone in zones" :key="zone">
                            <i
                                :class="{ reviewCheckboxChecked: (Array.isArray(valueFor(col.fieldKey)) ? valueFor(col.fieldKey) : []).includes(zone) }" />
                            {{ zone }}
                        </span>
                    </div>
                    <FieldHint v-if="step.guidePhase === 'field' && step.focus === col.fieldKey"
                        :navigation="navigation" :text="step.hint ?? step.guideLabel"
                        :title="section.fields[col.fieldKey]?.label ?? col.label" />
                </div>
            </div>
        </section>

        <section v-for="group in configGroups" :key="group.title" class="reviewConfigCard">
            <div class="reviewConfigHeader">
                <div>
                    <strong>{{ group.title }}</strong>
                    <small>配置此摄像头的核查生成和保留。</small>
                </div>
                <span>
                    <LcIcon name="chevron-down" :size="14" />
                </span>
            </div>
            <div class="fields">
                <FieldRow v-for="key in group.fields" :key="key" :field-key="key" :field="section.fields[key]"
                    :step="step" :navigation="navigation" :focus-ref="focusRef" />
            </div>
        </section>
    </div>
</template>
