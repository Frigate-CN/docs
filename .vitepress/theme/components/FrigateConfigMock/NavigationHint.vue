<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { manifest } from "./helpers.js";
import LcIcon from "./LcIcon.vue";

const props = defineProps({
    navigation: { type: Object, required: true },
    step: { type: Object, required: true },
});

const hintRef = ref(null);
const position = ref(null);

const section = computed(
    () => manifest.levels[props.step.level]?.[props.step.section],
);

const text = computed(() => {
    if (props.step.guidePhase === "settings") {
        return "打开系统菜单并选择设置。";
    }
    return `从${props.step.guideDetail ?? "设置"}中选择${section.value?.label ?? props.step.section}。`;
});

let timer;

const measure = () => {
    const hint = hintRef.value;
    const container = hint?.closest(".appBody");
    if (!hint || !container) return;

    const selector =
        props.step.guidePhase === "settings"
            ? ".systemMenuTarget"
            : ".menuItem.navigationTarget";
    const target = container.querySelector(selector);
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const hintRect = hint.getBoundingClientRect();
    const gap = 12;
    let left = targetRect.right - containerRect.left + gap;
    if (left + hintRect.width > containerRect.width - gap) {
        left = targetRect.left - containerRect.left - hintRect.width - gap;
    }
    const top = Math.max(
        gap,
        Math.min(
            containerRect.height - hintRect.height - gap,
            targetRect.top -
            containerRect.top +
            targetRect.height / 2 -
            hintRect.height / 2,
        ),
    );
    position.value = { left, top };
};

watch(
    () => [props.step.guidePhase, props.step.level, props.step.section],
    () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(measure, 240);
    },
);

onMounted(() => {
    timer = window.setTimeout(measure, 240);
    window.addEventListener("resize", measure);
});

onUnmounted(() => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", measure);
});
</script>

<template>
    <aside class="fieldHint navigationHint" :class="{ navigationHintReady: position, fieldHintMeasuring: !position }"
        ref="hintRef" :style="position ?? undefined">
        <span class="fieldHintIcon">
            <LcIcon name="info" />
        </span>
        <div>
            <strong>{{ step.guideLabel }}</strong>
            <p>{{ text }}</p>
            <div class="fieldHintNavigation">
                <button type="button" aria-label="上一步" :disabled="navigation.current === 0"
                    @click="navigation.previous">
                    <LcIcon name="chevron-left" :size="14" />
                </button>
                <span>{{ navigation.current + 1 }} / {{ navigation.total }}</span>
                <button type="button" aria-label="下一步" :disabled="navigation.current === navigation.total - 1"
                    @click="navigation.next">
                    <LcIcon name="chevron-right" :size="14" />
                </button>
            </div>
        </div>
    </aside>
</template>
