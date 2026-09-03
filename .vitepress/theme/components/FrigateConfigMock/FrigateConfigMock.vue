<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import FocusedSettings from "./FocusedSettings.vue";
import LcIcon from "./LcIcon.vue";
import { manifest, normalizeStep, maskZoneLabels, humanizeKey } from "./helpers.js";

const props = defineProps({
    autoPlay: { type: Boolean, default: true },
    showNavigationSteps: { type: Boolean, default: true },
    section: { type: String, default: "" },
    level: { type: String, default: "global" },
    fields: { type: Array, default: null },
    values: { type: Object, default: null },
    focus: { type: String, default: "" },
    hint: { type: String, default: "" },
    label: { type: String, default: "" },
    cameraImage: { type: String, default: "/img/frigate-autotracking-example.gif" },
    cameraName: { type: String, default: "" },
    targets: { type: Array, default: null },
    steps: { type: Array, default: null },
});

const resolvedSteps = computed(() => {
    const base = {
        section: props.section,
        level: props.level ?? "global",
        fields: props.fields,
        values: props.values,
        focus: props.focus,
        hint: props.hint,
        label: props.label,
        cameraImage: props.cameraImage,
        cameraName: props.cameraName,
    };
    if (props.targets?.length) {
        return props.targets.map((target) =>
            normalizeStep(base, {
                focus: typeof target === "string" ? target : target.field,
                hint: typeof target === "string" ? undefined : target.hint,
            }),
        );
    }
    return props.steps?.length
        ? props.steps.flatMap((step) => {
            const page = normalizeStep(base, step);
            if (!step.targets?.length) return [page];
            return step.targets.map((target) =>
                normalizeStep(page, {
                    focus: typeof target === "string" ? target : target.field,
                    hint: typeof target === "string" ? undefined : target.hint,
                }),
            );
        })
        : [base];
});

const guideSteps = computed(() =>
    resolvedSteps.value.flatMap((step, index) => {
        const sectionData = manifest.levels[step.level]?.[step.section];
        const navigationGroup = manifest.navigation?.groups.find((group) =>
            group.items.some(
                (item) => item.section === step.section && item.level === step.level,
            ),
        );
        const navigationItem = navigationGroup?.items.find(
            (item) => item.section === step.section && item.level === step.level,
        );
        const fieldLabel =
            step.label ||
            maskZoneLabels[step.focus] ||
            sectionData?.fields?.[step.focus]?.label ||
            (step.focus ? humanizeKey(step.focus.split(".").at(-1)) : undefined);
        const previous = resolvedSteps.value[index - 1];
        const samePage =
            previous?.section === step.section && previous?.level === step.level;
        const stages = [];

        // camera_groups live on the LIVE page: pencil icon in the main rail
        // opens the group dialog (list → edit form), not the settings page.
        if (step.section === "camera_groups") {
            const groupFieldLabel =
                step.label ||
                (step.focus ? humanizeKey(step.focus.split(".").at(-1)) : undefined);
            if (!step.focus) {
                // No field focus: highlight the pencil trigger in the rail
                // while the group list dialog is open.
                stages.push({
                    ...step,
                    guidePhase: "group-trigger",
                    guideLabel: step.label || "点击铅笔图标",
                });
                return stages;
            }
            if (!samePage && props.showNavigationSteps) {
                stages.push({
                    ...step,
                    guidePhase: "group-trigger",
                    guideLabel: "点击铅笔图标",
                });
            }
            if (groupFieldLabel) {
                stages.push({
                    ...step,
                    guidePhase: "field",
                    guideLabel: step.label || `查找${groupFieldLabel}`,
                });
            } else {
                stages.push({
                    ...step,
                    guidePhase: "group-list",
                    guideLabel: "打开摄像头组",
                });
            }
            return stages;
        }

        if (!samePage && props.showNavigationSteps) {
            if (index === 0) {
                stages.push({
                    ...step,
                    guidePhase: "settings",
                    guideLabel: "打开设置",
                });
            }
            if (step.level === "camera") {
                stages.push({
                    ...step,
                    guidePhase: "menu-collapsed",
                    guideLabel: `查找${navigationGroup?.label ?? "摄像头设置"}`,
                    guideDetail: navigationGroup?.label,
                });
            }
            stages.push({
                ...step,
                guidePhase: "menu",
                guideLabel: `查找${navigationItem?.label ?? sectionData?.label ?? step.section}`,
                guideDetail: navigationGroup?.label,
            });
            if (step.level === "camera") {
                stages.push({
                    ...step,
                    guidePhase: "camera-switch",
                    guideLabel: "切换摄像头",
                });
            }
        }
        if (fieldLabel) {
            stages.push({
                ...step,
                guidePhase: "field",
                guideLabel: step.label || `查找${fieldLabel}`,
            });
        }
        return stages;
    }),
);

const activeStep = ref(0);
const playing = ref(props.autoPlay);
const isVisible = ref(false);
const mockRef = ref(null);
const guideStepsRef = ref(null);
const activeGuideStepRef = ref(null);

const current = computed(
    () => guideSteps.value[Math.min(activeStep.value, guideSteps.value.length - 1)],
);

let observer;
onMounted(() => {
    if (!mockRef.value) return;
    if (!("IntersectionObserver" in window)) {
        isVisible.value = true;
        return;
    }
    observer = new window.IntersectionObserver(
        ([entry]) => (isVisible.value = entry.intersectionRatio >= 0.35),
        { threshold: [0, 0.35] },
    );
    observer.observe(mockRef.value);
});

onUnmounted(() => observer?.disconnect());

let playTimer;
watch(
    [activeStep, () => current.value?.guidePhase, () => guideSteps.value.length, isVisible, playing],
    () => {
        window.clearTimeout(playTimer);
        if (
            !playing.value ||
            !isVisible.value ||
            activeStep.value >= guideSteps.value.length - 1
        ) {
            return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        playTimer = window.setTimeout(
            () => {
                activeStep.value = Math.min(
                    guideSteps.value.length - 1,
                    activeStep.value + 1,
                );
            },
            current.value.guidePhase === "settings" ? 3400 : 2600,
        );
    },
);

watch(
    [activeStep, () => guideSteps.value.length],
    () => {
        if (activeStep.value >= guideSteps.value.length - 1) playing.value = false;
    },
);

watch(activeStep, () => {
    const guide = guideStepsRef.value;
    const target = activeGuideStepRef.value;
    if (!guide || !target) return;

    if (activeStep.value <= 1) {
        guide.scrollLeft = 0;
        return;
    }

    const previous = guide.children[activeStep.value - 1];
    if (!previous) return;
    const guideRect = guide.getBoundingClientRect();
    const previousRect = previous.getBoundingClientRect();
    const previousContentLeft = guide.scrollLeft + previousRect.left - guideRect.left;
    guide.scrollLeft = Math.max(0, previousContentLeft - 14);
});

const selectStep = (index) => {
    playing.value = false;
    activeStep.value = index;
};

const navigation = computed(() => ({
    current: activeStep.value,
    total: guideSteps.value.length,
    previous: () => selectStep(Math.max(0, activeStep.value - 1)),
    next: () => selectStep(Math.min(guideSteps.value.length - 1, activeStep.value + 1)),
}));

const togglePlay = () => {
    if (!playing.value && activeStep.value === guideSteps.value.length - 1) {
        activeStep.value = 0;
    }
    playing.value = !playing.value;
};
</script>

<template>
    <div class="mock" ref="mockRef">
        <div class="guidePlayer">
            <div class="guideSteps" ref="guideStepsRef">
                <button v-for="(step, index) in guideSteps" :key="`${step.section}-${step.guidePhase}-${index}`"
                    class="guideStep" :class="{
                        guideStepActive: index === activeStep,
                        guideStepComplete: index < activeStep,
                    }" :ref="(el) => { if (index === activeStep) activeGuideStepRef = el }" type="button"
                    @click="selectStep(index)">
                    <span>{{ index + 1 }}</span>
                    <small>{{ step.guideLabel }}</small>
                </button>
            </div>
            <div class="stepBar">
                <div class="currentInstruction">
                    <span>步骤 {{ activeStep + 1 }} / {{ guideSteps.length }}</span>
                    <strong>{{ current.guideLabel }}</strong>
                    <small v-if="current.guideDetail">{{ current.guideDetail }}</small>
                </div>
                <div class="stepActions">
                    <button type="button" aria-label="上一步" :disabled="activeStep === 0"
                        @click="selectStep(Math.max(0, activeStep - 1))">
                        <LcIcon name="chevron-left" :size="16" />
                    </button>
                    <button type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay">
                        <LcIcon :name="playing ? 'pause' : 'play'" :size="16" />
                    </button>
                    <button type="button" aria-label="下一步" :disabled="activeStep === guideSteps.length - 1"
                        @click="selectStep(Math.min(guideSteps.length - 1, activeStep + 1))">
                        <LcIcon name="chevron-right" :size="16" />
                    </button>
                </div>
            </div>
        </div>
        <div class="viewport">
            <FocusedSettings :navigation="navigation" :step="current" />
        </div>
    </div>
</template>

<style src="./styles.css"></style>
