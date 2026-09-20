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
const flipped = ref(false);

// `hint` passed from the docs page describes the *field* step (what value to
// change and what it does). Navigation stages (settings menu → section →
// camera switcher) must not reuse it, otherwise every step shows the same
// sentence. Only the field stage consumes the docs copy.
const fieldHint = computed(() => (props.step.guidePhase === "field" ? props.step.hint : null));

const styleBinding = computed(() => {
    const p = position.value;
    if (!p) return undefined;
    return { left: p.left + "px", top: p.top + "px" };
});

const section = computed(
    () => manifest.levels[props.step.level]?.[props.step.section],
);

const text = computed(() => {
    // docs pages may pass a per-step hint; it describes the field step and
    // wins over the generic copy there only.
    if (fieldHint.value) {
        return fieldHint.value;
    }
    if (props.step.guidePhase === "settings") {
        return "打开系统菜单并选择设置。";
    }
    if (props.step.guidePhase === "camera-switch") {
        return "点击摄像头选择器切换至目标摄像头。";
    }
    if (props.step.guidePhase === "menu-collapsed") {
        return "摄像头设置是分组菜单，先展开它。";
    }
    return `在设置菜单中找到并打开「${section.value?.label ?? props.step.section}」。`;
});

let timer;

const measure = () => {
    const hint = hintRef.value;
    if (!hint) return;

    let selector;
    let targetContainer;
    if (props.step.guidePhase === "camera-switch") {
        selector = ".cameraSwitcherTarget";
        targetContainer = hint.closest(".appFrame");
    } else if (props.step.guidePhase === "group-trigger") {
        // camera-group flow: point at the rail pencil inside the live scene
        selector = ".navigationTarget";
        targetContainer = hint.closest(".liveGroupsScene");
    } else {
        const container = hint.closest(".appBody");
        if (!container) return;
        if (props.step.guidePhase === "settings") {
            selector = ".systemMenuTarget";
        } else if (props.step.guidePhase === "menu-collapsed") {
            selector = ".menuGroupLabel.navigationTarget";
        } else {
            selector = ".menuItem.navigationTarget";
        }
        targetContainer = container;
    }
    const target = targetContainer?.querySelector(selector);
    if (!target) return;

    const containerRect = targetContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const hintRect = hint.getBoundingClientRect();
    const gap = 12;
    let left = targetRect.right - containerRect.left + gap;
    let isFlipped = false;
    if (left + hintRect.width > containerRect.width - gap) {
        left = targetRect.left - containerRect.left - hintRect.width - gap;
        isFlipped = true;
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
    flipped.value = isFlipped;
};

watch(
    () => [props.step.guidePhase, props.step.level, props.step.section, props.step.hint],
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
    <aside class="fieldHint navigationHint" :class="{ navigationHintReady: position, fieldHintMeasuring: !position, navigationHintFlipped: flipped }"
        ref="hintRef" :style="styleBinding">
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
