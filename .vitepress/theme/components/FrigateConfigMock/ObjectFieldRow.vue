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

const objectValue = computed(
    () => props.step.values?.[props.fieldKey] ?? props.field.default ?? {},
);

const displayedEntries = computed(() => {
    const entries = Object.entries(objectValue.value);
    return entries.length ? entries : [["", [""]]];
});
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
        <div v-if="focused" class="objectFieldContent" aria-hidden="true">
            <div v-for="([key, rawValues], entryIndex) in displayedEntries" :key="key || entryIndex"
                class="objectEntry">
                <div class="objectEntryHeader">
                    <span class="objectInput">{{ key || "例如：妻子的车" }}</span>
                    <span class="objectDelete">
                        <LcIcon name="trash-2" :size="14" />
                    </span>
                </div>
                <div class="objectValues">
                    <span
                        v-for="(item, valueIndex) in (Array.isArray(rawValues) ? rawValues : [JSON.stringify(rawValues)])"
                        :key="`${String(item)}-${valueIndex}`" class="objectInput">{{ item || "车牌号或正则表达式" }}</span>
                    <span class="objectAdd">
                        <LcIcon name="plus" :size="12" /> 添加
                    </span>
                </div>
            </div>
            <span class="objectAdd">+ 添加</span>
        </div>
        <FieldHint v-if="focused" :navigation="navigation" :text="step.hint ?? step.guideLabel" :title="field.label" />
    </div>
</template>
