<script setup>
import { computed } from "vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";
import { objectLabelOptions, humanizeKey } from "./helpers.js";

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

const selected = computed(
    () => props.step.values?.[props.fieldKey] ?? props.field.default ?? [],
);

const options = computed(() =>
    [...new Set([...objectLabelOptions, ...selected.value])].sort(),
);
</script>

<template>
    <div class="trackField" :class="{ focused: focused }"
        :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
        <div class="fieldCopy">
            <strong>{{ field.label }}</strong>
        </div>
        <div class="trackSummary">
            <LcIcon name="chevron-down" :size="14" />
            <span>{{ selected.length }} 种物体类型已选择</span>
        </div>
        <div class="trackSelector" aria-hidden="true">
            <span class="trackSearch">搜索...</span>
            <div class="trackOptions">
                <div v-for="option in options" :key="option" class="trackOption">
                    <span>{{ humanizeKey(option) }}</span>
                    <span class="switch" :class="{ switchOn: selected.includes(option) }">
                        <span />
                    </span>
                </div>
            </div>
        </div>
        <p v-if="field.description" class="trackDescription">{{ field.description }}</p>
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel" :title="field.label" />
    </div>
</template>
