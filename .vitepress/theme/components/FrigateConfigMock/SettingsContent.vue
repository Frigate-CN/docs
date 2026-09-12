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

    // Multi-instance sections (e.g. genai) render all fields inside a single
    // instance card. The instance name appears as the topmost "key row"
    // (Provider name | instance input + delete), matching the real UI.
    if (section.value.multiInstance) {
        const mi = section.value.multiInstance;
        const allFields = (section.value.order ?? []).filter(
            (k) => section.value.fields?.[k] && !section.value.fields[k].advanced,
        );
        return [
            {
                type: "instance",
                key: mi.instanceKey,
                instanceKey: mi.instanceKey,
                fields: allFields,
            },
        ];
    }

    // Build a map from field key to its parent group.
    const groupByField = new Map();
    (section.value.groups ?? []).forEach((group) => {
        group.fields.forEach((key) => groupByField.set(key, group));
        (group.subGroups || []).forEach((sg) => {
            (sg.fields || []).forEach((key) => groupByField.set(key, group));
            (sg.subGroups || []).forEach((nsg) => {
                (nsg.fields || []).forEach((key) => groupByField.set(key, group));
            });
        });
    });

    const groups = section.value.groups ?? [];
    const result = [];
    const renderedGroups = new Set();

    // Render a group plus every group defined after it. This keeps the
    // relative order from the manifest stable regardless of which fields
    // are currently focused – e.g. focusing alerts.retain.days (inside
    // "events") still keeps "retention" right before "events".
    // All non-advanced fields belonging to a group are always shown inside
    // its card; we only exclude fields hidden from the manifest.
    const renderFrom = (startIndex) => {
        for (let i = startIndex; i < groups.length; i++) {
            const group = groups[i];
            if (renderedGroups.has(group.key)) continue;
            renderedGroups.add(group.key);
            result.push({
                type: "group",
                key: group.key,
                label: group.label,
                description: group.description,
                // Exclude advanced fields so they fall through to the
                // dedicated "Advanced settings" collapsible panel.
                fields: group.fields.filter(
                    (fk) => !section.value?.fields[fk]?.advanced,
                ),
                subGroups: group.subGroups ?? null,
            });
        }
    };

    // First pass: iterate through standardKeys in order so standalone fields
    // (e.g. "enabled") appear before groups, matching the real UI layout.
    standardKeys.value.forEach((key) => {
        const group = groupByField.get(key);
        if (!group) {
            result.push({ type: "field", key, fields: [key] });
            return;
        }
        if (renderedGroups.has(group.key)) return;
        const idx = groups.findIndex((g) => g.key === group.key);
        renderFrom(idx);
    });

    // Any groups not yet rendered (all their fields absent from the focus)
    // are appended in manifest order so they remain visible.
    renderFrom(0);

    return result;
});

/**
 * Check if a sub-group should be expanded.
 * A sub-group is expanded when the current focus field is one of its
 * direct fields or belongs to any of its nested sub-groups.
 */
function isSubGroupExpanded(sg) {
    if (!props.step.focus) return false;
    const focus = props.step.focus;
    // Check direct fields
    if (sg.fields.includes(focus)) return true;
    // Check nested sub-group fields
    for (const nsg of (sg.subGroups || [])) {
        if (nsg.fields.includes(focus)) return true;
    }
    return false;
}

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
                    <!-- Multi-instance section (e.g. genai providers) -->
                    <section v-if="panel.type === 'instance'" class="instanceCard">
                        <div class="instanceKeyRow">
                            <div class="instanceKeyLabel">
                                <strong>提供商名称</strong>
                                <p>每个提供者在配置中作为唯一键。</p>
                            </div>
                            <div class="instanceKeyInputWrap">
                                <input class="input" :value="panel.instanceKey" readonly />
                                <button type="button" class="removeButton" aria-label="移除">
                                    <LcIcon name="trash" :size="14" />
                                </button>
                            </div>
                        </div>
                        <div class="fields">
                            <FieldRow v-for="key in panel.fields" :key="key" :field-key="key"
                                :field="section.fields[key]" :step="step" :navigation="navigation"
                                :focus-ref="focusRef" />
                        </div>
                    </section>

                    <section v-else-if="panel.type === 'group'" class="group">
                        <div class="groupHeader">
                            <div class="groupTitle">{{ panel.label }}</div>
                            <p v-if="panel.description" class="groupDesc">{{ panel.description }}</p>
                        </div>
                        <div class="fields">
                            <!-- Plain (non-prefix) fields directly in the group -->
                            <FieldRow v-for="key in panel.fields" :key="key" :field-key="key"
                                :field="section.fields[key]" :step="step" :navigation="navigation"
                                :focus-ref="focusRef" />

                            <!-- Sub-groups (prefix-based like continuous, alerts, etc.) -->
                            <template v-for="sg in (panel.subGroups || [])" :key="sg.key">
                                <!-- Collapsible: has nested subGroups (e.g. 警报保留 → 事件保留) -->
                                <section v-if="sg.subGroups && sg.subGroups.length" class="subGroup collapsibleSubGroup"
                                    :class="{ collapsed: !isSubGroupExpanded(sg) }">
                                    <div class="subGroupHeader clickable">
                                        <span class="subGroupLabel">{{ sg.label }}</span>
                                        <LcIcon :name="isSubGroupExpanded(sg) ? 'chevron-down' : 'chevron-right'" :size="12" />
                                    </div>
                                    <p v-if="sg.description" class="subGroupDesc">{{ sg.description }}</p>
                                    <div v-show="isSubGroupExpanded(sg)" class="subGroupFields">
                                        <FieldRow v-for="key in sg.fields" :key="key" :field-key="key"
                                            :field="section.fields[key]" :step="step" :navigation="navigation"
                                            :focus-ref="focusRef" />

                                        <!-- Nested sub-groups (e.g. retain inside alerts) -->
                                        <template v-for="nsg in (sg.subGroups || [])" :key="nsg.key">
                                            <section class="nestedSubGroup collapsibleNested"
                                                :class="{ collapsed: !isSubGroupExpanded(nsg) }">
                                                <div class="nestedSubGroupHeader clickable">
                                                    <span>{{ nsg.label }}</span>
                                                    <LcIcon :name="isSubGroupExpanded(nsg) ? 'chevron-down' : 'chevron-right'" :size="12" />
                                                </div>
                                                <p v-if="nsg.description" class="nestedSubGroupDesc">{{ nsg.description }}</p>
                                                <div v-show="isSubGroupExpanded(nsg)" class="nestedSubGroupFields">
                                                    <FieldRow v-for="key in nsg.fields" :key="key" :field-key="key"
                                                        :field="section.fields[key]" :step="step" :navigation="navigation"
                                                        :focus-ref="focusRef" />
                                                </div>
                                            </section>
                                        </template>
                                    </div>
                                </section>

                                <!-- Non-collapsible: simple card (e.g. 持续保留, 画面变动录制保留) -->
                                <section v-else class="subGroup">
                                    <div class="subGroupHeader">
                                        <span class="subGroupLabel">{{ sg.label }}</span>
                                    </div>
                                    <p v-if="sg.description" class="subGroupDesc">{{ sg.description }}</p>
                                    <div class="subGroupFields">
                                        <FieldRow v-for="key in sg.fields" :key="key" :field-key="key"
                                            :field="section.fields[key]" :step="step" :navigation="navigation"
                                            :focus-ref="focusRef" />
                                    </div>
                                </section>
                            </template>
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
