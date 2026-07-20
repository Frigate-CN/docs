<script setup>
import { computed } from "vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";
import { humanizeKey, formatValue } from "./helpers.js";

const props = defineProps({
    field: { type: Object, required: true },
    fieldKey: { type: String, required: true },
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const focused = computed(
    () => props.step.guidePhase === "field" && props.step.focus === props.fieldKey,
);

const filters = computed(
    () => props.step.values?.[props.fieldKey] ?? props.field.default ?? {},
);
</script>

<template>
    <div class="objectField" :class="{ focused: focused }"
        :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
        <div class="objectFieldHeader">
            <div class="fieldCopy">
                <strong>{{ field.label }}</strong>
                <p v-if="field.description">{{ field.description }}</p>
            </div>
            <span v-if="focused">
                <LcIcon name="chevron-down" :size="14" />
            </span>
            <span v-else>
                <LcIcon name="chevron-right" :size="14" />
            </span>
        </div>
        <div v-if="focused" class="filtersContent" aria-hidden="true">
            <div v-for="(values, label) in filters" :key="label" class="filterCard">
                <div class="filterCardHeader">
                    <strong>{{ humanizeKey(label) }}</strong>
                    <span>⌄</span>
                </div>
                <div class="filterSettings">
                    <div v-for="(value, key) in values" :key="key" class="filterSetting">
                        <span>{{ humanizeKey(key) }}</span>
                        <span class="input">{{ formatValue(value) }}</span>
                    </div>
                </div>
            </div>
        </div>
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel" :title="field.label" />
    </div>
</template>
