<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import FieldRow from "./FieldRow.vue";
import FieldHint from "./FieldHint.vue";
import ReviewSettingsLayout from "./ReviewSettingsLayout.vue";
import DetectorModelLayout from "./DetectorModelLayout.vue";
import MasksAndZonesLayout from "./MasksAndZonesLayout.vue";
import LcIcon from "./LcIcon.vue";
import { manifest } from "./helpers.js";

const props = defineProps({
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
});

const section = computed(
    () => manifest.levels[props.step.level]?.[props.step.section],
);

const viewportRef = ref(null);
const focusRef = ref({ current: null });
const pageRef = ref(null);

let timer;

const scrollToFocusedField = () => {
    const viewport = viewportRef.value;
    const target = focusRef.value.current;
    if (!viewport || !target) return;

    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const padding = 40;
    const isCovered =
        targetRect.top < viewportRect.top + padding ||
        targetRect.bottom > viewportRect.bottom - padding;
    if (!isCovered) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const targetIsTall = targetRect.height > viewportRect.height - padding * 2;

    let scrollTarget;
    if (targetIsTall) {
        scrollTarget = viewport.scrollTop + targetRect.top - viewportRect.top - padding;
    } else {
        scrollTarget =
            viewport.scrollTop +
            targetRect.top -
            viewportRect.top -
            (viewport.clientHeight / 2 - targetRect.height / 2);
    }
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

    viewport.scrollTo({
        top: scrollTarget,
        behavior: reduceMotion ? "auto" : "smooth",
    });
};

onMounted(() => {
    if (props.step.guidePhase === "field") {
        timer = window.setTimeout(scrollToFocusedField, 40);
    }
});

watch(
    () => props.step,
    () => {
        const viewport = viewportRef.value;
        if (!viewport) return;

        const page = `${props.step.level}:${props.step.section}`;
        const pageChanged = pageRef.value !== page;
        pageRef.value = page;
        if (pageChanged || props.step.guidePhase !== "field") {
            viewport.scrollTop = 0;
        }
        if (props.step.guidePhase !== "field") return;
        timer = window.setTimeout(scrollToFocusedField, 40);
    },
    { deep: true },
);

onUnmounted(() => window.clearTimeout(timer));

const orderedKeys = computed(() => {
    if (!section.value) return [];
    const keys = section.value.order.length
        ? section.value.order.filter((key) => section.value.fields[key])
        : Object.keys(section.value.fields);
    if (
        props.step.focus &&
        section.value.fields[props.step.focus] &&
        !keys.includes(props.step.focus)
    ) {
        keys.push(props.step.focus);
    }
    return keys;
});

const advancedKeys = computed(() =>
    orderedKeys.value.filter((key) => section.value?.fields[key]?.advanced),
);

const standardKeys = computed(() =>
    orderedKeys.value.filter((key) => !section.value?.fields[key]?.advanced),
);

const panels = computed(() => {
    if (!section.value) return [];
    const groupByField = new Map();
    (section.value.groups ?? []).forEach((group) => {
        group.fields.forEach((key) => groupByField.set(key, group));
    });
    const renderedGroups = new Set();
    const result = [];
    standardKeys.value.forEach((key) => {
        const group = groupByField.get(key);
        if (!group) {
            result.push({ type: "field", key, fields: [key] });
            return;
        }
        if (renderedGroups.has(group.key)) return;
        renderedGroups.add(group.key);
        result.push({
            type: "group",
            key: group.key,
            label: group.label,
            fields: group.fields.filter((fieldKey) =>
                standardKeys.value.includes(fieldKey),
            ),
        });
    });
    return result;
});

const focusIsAdvanced = computed(
    () =>
        props.step.guidePhase === "field" && advancedKeys.value.includes(props.step.focus),
);
</script>

<template>
    <!-- Masks and Zones special layout -->
    <main v-if="step.section === 'masksAndZones' && step.level === 'camera'" class="contentViewport" ref="viewportRef">
        <MasksAndZonesLayout :step="step" :navigation="navigation" :focus-ref="focusRef" />
    </main>

    <!-- Detector and model layout -->
    <main v-else-if="step.section === 'model' && step.level === 'global'" class="contentViewport" ref="viewportRef">
        <div class="scene">
            <div class="sectionHeader">
                <h3>检测器和模型</h3>
                <p>配置检测器后端及其使用的模型。</p>
            </div>
            <DetectorModelLayout :section="section" :step="step" :navigation="navigation" :focus-ref="focusRef" />
        </div>
    </main>

    <!-- Review settings layout -->
    <main v-else-if="step.section === 'review' && step.level === 'camera'" class="contentViewport" ref="viewportRef">
        <div class="scene">
            <div class="sectionHeader">
                <h3>{{ step.title ?? section.label }}</h3>
                <p v-if="section.description">{{ section.description }}</p>
                <span class="docsLink">阅读文档
                    <LcIcon name="external-link" :size="12" />
                </span>
            </div>
            <ReviewSettingsLayout :section="section" :step="step" :navigation="navigation" :focus-ref="focusRef" />
        </div>
    </main>

    <!-- Default settings layout -->
    <main v-else-if="section" class="contentViewport" ref="viewportRef">
        <div class="scene">
            <div class="sectionHeader">
                <h3>{{ step.title ?? section.label }}</h3>
                <p v-if="section.description">{{ section.description }}</p>
                <span v-if="section.docs" class="docsLink">阅读文档
                    <LcIcon name="external-link" :size="12" />
                </span>
            </div>
            <div class="panels">
                <template v-for="panel in panels" :key="panel.key">
                    <section v-if="panel.type === 'group'" class="group">
                        <div class="groupTitle">{{ panel.label }}</div>
                        <div class="fields">
                            <FieldRow v-for="key in panel.fields" :key="key" :field-key="key"
                                :field="section.fields[key]" :step="step" :navigation="navigation"
                                :focus-ref="focusRef" />
                        </div>
                    </section>
                    <div v-else class="standaloneField">
                        <FieldRow :field-key="panel.key" :field="section.fields[panel.key]" :step="step"
                            :navigation="navigation" :focus-ref="focusRef" />
                    </div>
                </template>

                <section v-if="advancedKeys.length > 0 && focusIsAdvanced" class="group">
                    <div class="groupTitle">高级设置 ({{ advancedKeys.length }})</div>
                    <div class="fields">
                        <FieldRow v-for="key in advancedKeys" :key="key" :field-key="key" :field="section.fields[key]"
                            :step="step" :navigation="navigation" :focus-ref="focusRef" />
                    </div>
                </section>
                <div v-else-if="advancedKeys.length > 0" class="advancedCollapsed">
                    <LcIcon name="chevron-right" :size="14" /> 高级设置 ({{ advancedKeys.length }})
                </div>
            </div>
        </div>
    </main>
</template>
