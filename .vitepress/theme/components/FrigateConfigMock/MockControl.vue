<script setup>
import { formatValue } from "./helpers.js";

const props = defineProps({
    field: { type: Object, required: true },
    value: { type: [String, Number, Boolean, Array, Object], default: null },
});
</script>

<template>
    <span v-if="field.widget === 'switch'" class="switch" :class="{ switchOn: value ?? field.default }"
        aria-hidden="true">
        <span />
    </span>

    <div v-else-if="field.widget === 'range'" class="rangeControl" aria-hidden="true">
        <div class="rangeTrack">
            <span
                :style="{ width: `${Math.max(0, Math.min(100, ((Number(value ?? field.default ?? field.minimum ?? 0) - (field.minimum ?? 0)) / ((field.maximum ?? 100) - (field.minimum ?? 0))) * 100))}%` }" />
            <i
                :style="{ left: `${Math.max(0, Math.min(100, ((Number(value ?? field.default ?? field.minimum ?? 0) - (field.minimum ?? 0)) / ((field.maximum ?? 100) - (field.minimum ?? 0))) * 100))}%` }" />
        </div>
        <span class="rangeValue">{{ formatValue(value ?? field.default) }}</span>
    </div>

    <div v-else-if="field.widget === 'tags'" class="tags" aria-hidden="true">
        <span
            v-for="item in (Array.isArray(value ?? field.default) ? (value ?? field.default) : [value ?? field.default]).filter(Boolean)"
            :key="String(item)">{{ String(item) }}</span>
    </div>

    <span v-else class="input" aria-hidden="true">
        {{ formatValue(value ?? field.default) }}
        <span v-if="field.widget === 'select'" class="chevron">⌄</span>
    </span>
</template>
