<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import LcIcon from "./LcIcon.vue";

const props = defineProps({
    navigation: { type: Object, required: true },
    title: { type: String, default: "" },
    text: { type: String, default: "" },
});

const hintRef = ref(null);
const placement = ref(null);
const revealed = ref(false);

let initialFrame;
let settledTimer;
let revealTimer;

const measure = () => {
    const hint = hintRef.value;
    const target = hint?.parentElement;
    const viewport = target?.closest(".contentViewport");
    if (!hint || !target || !viewport) return;

    const targetRect = target.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const hintHeight = hint.getBoundingClientRect().height;
    const spaceAbove = targetRect.top - viewportRect.top;
    const spaceBelow = viewportRect.bottom - targetRect.bottom;
    const requiredSpace = hintHeight + 18;

    if (spaceBelow >= requiredSpace) {
        placement.value = "below";
    } else if (spaceAbove >= requiredSpace) {
        placement.value = "above";
    } else {
        placement.value = "overlay";
    }
};

onMounted(() => {
    initialFrame = window.requestAnimationFrame(measure);
    settledTimer = window.setTimeout(measure, 200);
    revealTimer = window.setTimeout(() => (revealed.value = true), 240);
    const viewport = hintRef.value?.parentElement?.closest(".contentViewport");
    if (viewport) viewport.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
});

onUnmounted(() => {
    window.cancelAnimationFrame(initialFrame);
    window.clearTimeout(settledTimer);
    window.clearTimeout(revealTimer);
    const viewport = hintRef.value?.parentElement?.closest(".contentViewport");
    if (viewport) viewport.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
});
</script>

<template>
    <aside class="fieldHint" :class="{
        fieldHintAbove: placement === 'above',
        fieldHintOverlay: placement === 'overlay',
        fieldHintReady: placement && revealed,
        fieldHintMeasuring: !placement || !revealed,
    }" ref="hintRef">
        <span class="fieldHintIcon">
            <LcIcon name="info" />
        </span>
        <div>
            <strong>{{ title }}</strong>
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
