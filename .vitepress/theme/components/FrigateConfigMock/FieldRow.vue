<script setup>
import { computed } from "vue";
import MockControl from "./MockControl.vue";
import FieldHint from "./FieldHint.vue";
import ObjectFieldRow from "./ObjectFieldRow.vue";
import RulesFieldRow from "./RulesFieldRow.vue";
import TrackFieldRow from "./TrackFieldRow.vue";
import LabelSwitchesFieldRow from "./LabelSwitchesFieldRow.vue";
import FiltersFieldRow from "./FiltersFieldRow.vue";
import GenaiRolesFieldRow from "./GenaiRolesFieldRow.vue";
import { humanizeKey } from "./helpers.js";

const props = defineProps({
    fieldKey: { type: String, required: true },
    field: { type: Object, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const focused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === props.fieldKey,
);

const fieldValue = computed(
    () => props.step.values?.[props.fieldKey] ?? props.field.default,
);

const isLabelSwitches = computed(
    () =>
        ["alerts.labels", "detections.labels"].includes(props.fieldKey) &&
        Array.isArray(fieldValue.value),
);

const isTrack = computed(
    () => props.fieldKey === "track" && Array.isArray(fieldValue.value),
);

const isFilters = computed(
    () =>
        props.fieldKey === "filters" &&
        fieldValue.value &&
        typeof fieldValue.value === "object",
);

const isObjectArray = computed(
    () =>
        props.field.widget === "tags" &&
        Array.isArray(fieldValue.value) &&
        fieldValue.value.some((item) => item && typeof item === "object"),
);

const isObject = computed(() => props.field.widget === "object");

const isGenaiRoles = computed(() => props.field.widget === "genaiRoles");
</script>

<template>
    <LabelSwitchesFieldRow v-if="isLabelSwitches" :field="field" :field-key="fieldKey" :step="step"
        :navigation="navigation" :focus-ref="focusRef" />

    <TrackFieldRow v-else-if="isTrack" :field="field" :field-key="fieldKey" :step="step" :navigation="navigation"
        :focus-ref="focusRef" />

    <FiltersFieldRow v-else-if="isFilters" :field="field" :field-key="fieldKey" :step="step" :navigation="navigation"
        :focus-ref="focusRef" />

    <RulesFieldRow v-else-if="isObjectArray" :field="field" :field-key="fieldKey" :step="step" :navigation="navigation"
        :focus-ref="focusRef" />

    <ObjectFieldRow v-else-if="isObject" :field="field" :field-key="fieldKey" :step="step" :navigation="navigation"
        :focus-ref="focusRef" />

    <GenaiRolesFieldRow v-else-if="isGenaiRoles" :field="field" :field-key="fieldKey" :step="step" :navigation="navigation"
        :focus-ref="focusRef" />

    <div v-else class="field" :class="{ focused: focused }"
        :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
        <div class="fieldCopy">
            <strong>{{ field.label }}</strong>
            <p v-if="field.description">{{ field.description }}</p>
        </div>
        <MockControl :field="field" :value="step.values?.[fieldKey]" />
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel" :title="field.label" />
    </div>
</template>
