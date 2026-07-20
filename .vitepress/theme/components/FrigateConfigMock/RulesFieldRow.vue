<script setup>
import { computed } from "vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";

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

const rules = computed(
    () => props.step.values?.[props.fieldKey] ?? props.field.default ?? [],
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
        <div v-if="focused" class="rulesContent" aria-hidden="true">
            <div class="rulesHeader">
                <span>正则表达式</span>
                <span>替换字符串</span>
            </div>
            <div class="rulesRows">
                <div v-for="(rule, index) in rules" :key="index" class="ruleRow">
                    <span class="objectInput">{{ rule.pattern }}</span>
                    <span class="objectInput">{{ rule.replacement }}</span>
                    <span class="objectDelete">
                        <LcIcon name="trash-2" :size="14" />
                    </span>
                </div>
            </div>
            <span class="objectAdd">
                <LcIcon name="plus" :size="12" /> 添加
            </span>
        </div>
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel" :title="field.label" />
    </div>
</template>
