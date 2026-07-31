<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import FieldHint from "./FieldHint.vue";
import LcIcon from "./LcIcon.vue";
import { maskZoneLabels, humanizeKey } from "./helpers.js";

const props = defineProps({
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const focus = computed(() => props.step.focus ?? "zones");
const layoutStep = computed(() => ({ ...props.step, maskZoneOverlay: true }));

const editorType = computed(() => {
    if (focus.value.startsWith("zone.") && focus.value !== "zone.add") return "zone";
    if (focus.value.startsWith("motionMask.") && focus.value !== "motionMask.add") return "motionMask";
    if (focus.value.startsWith("objectMask.") && focus.value !== "objectMask.add") return "objectMask";
    return null;
});

const polygonClass = computed(() => {
    if (editorType.value === "motionMask") return "motionMaskPolygon";
    if (editorType.value === "objectMask") return "objectMaskPolygon";
    return "zonePolygon";
});

const polygonPoints = computed(() => {
    if (editorType.value === "motionMask") return "15,16 625,16 625,78 15,78";
    if (editorType.value === "objectMask") return "400,75 560,82 600,205 470,235 380,165";
    return "80,270 240,150 525,175 595,325";
});

const polygonVertices = computed(() => {
    if (editorType.value === "motionMask")
        return [[15, 16], [625, 16], [625, 78], [15, 78]];
    if (editorType.value === "objectMask")
        return [[400, 75], [560, 82], [600, 205], [470, 235], [380, 165]];
    return [[80, 270], [240, 150], [525, 175], [595, 325]];
});

const editorTitle = computed(() => {
    if (editorType.value === "zone") return "编辑区域";
    if (editorType.value === "motionMask") return "编辑画面变动遮罩";
    if (editorType.value === "objectMask") return "编辑物体遮罩";
    return "";
});

const editorName = computed(() => {
    if (editorType.value === "zone") return "车道";
    if (editorType.value === "motionMask") return "时间戳区域";
    return "屋顶区域";
});

let timer;

const scrollSidebarToTarget = () => {
    const target = props.focusRef?.current;
    const sidebar = target?.closest(".polygonSidebar");
    if (!target || !sidebar) return;
    const sidebarRect = sidebar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const padding = 40;
    const isCovered =
        targetRect.top < sidebarRect.top + padding ||
        targetRect.bottom > sidebarRect.bottom - padding;
    if (!isCovered) return;

    let scrollTarget = sidebar.scrollTop + targetRect.top - sidebarRect.top - padding;
    const maxScroll = sidebar.scrollHeight - sidebar.clientHeight;
    scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

    sidebar.scrollTo({
        top: scrollTarget,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
    });
};

onMounted(() => {
    if (props.step.guidePhase === "field") {
        timer = window.setTimeout(scrollSidebarToTarget, 40);
    }
});

watch(
    () => [props.step.focus, props.step.guidePhase],
    () => {
        if (props.step.guidePhase !== "field") return;
        timer = window.setTimeout(scrollSidebarToTarget, 40);
    },
);

onUnmounted(() => window.clearTimeout(timer));

const setFocusRef = (el, id) => {
    if (props.step.guidePhase === "field" && props.step.focus === id && props.focusRef) {
        props.focusRef.current = el;
    }
};
</script>

<template>
    <div class="masksZonesLayout">
        <aside class="polygonSidebar">
            <div v-if="editorType" class="polygonEditor">
                <div class="polygonEditorHeader">
                    <strong>{{ editorTitle }}</strong>
                    <small>点击图片绘制多边形。</small>
                </div>
                <div class="polygonForm" :ref="(el) => setFocusRef(el, `${editorType}.options`)">
                    <div class="polygonFormField">
                        <strong>友好名称</strong>
                        <span class="polygonInput">{{ editorName }}</span>
                    </div>
                    <div class="polygonToggleRow">
                        <strong>已启用</strong>
                        <span class="switch switchOn"><span /></span>
                    </div>
                    <template v-if="editorType === 'zone'">
                        <div class="polygonFormField">
                            <strong>物体</strong>
                            <small>适用于此区域的物体类型。</small>
                            <span class="polygonInput">person, car</span>
                        </div>
                        <div class="polygonFormField">
                            <strong>徘徊时间</strong>
                            <span class="polygonInput">4</span>
                        </div>
                        <div class="polygonFormField">
                            <strong>惯性</strong>
                            <span class="polygonInput">3</span>
                        </div>
                        <div class="polygonFormField">
                            <strong>测速</strong>
                            <small>为四点区域的每条边输入距离。</small>
                            <div class="distanceGrid">
                                <span v-for="(value, index) in ['10', '12', '11', '13.5']" :key="index"
                                    class="polygonInput">
                                    线 {{ String.fromCharCode(65 + index) }}: {{ value }}
                                </span>
                            </div>
                        </div>
                        <div class="polygonFormField">
                            <strong>速度阈值 (km/h)</strong>
                            <span class="polygonInput">20</span>
                        </div>
                    </template>
                    <div v-if="editorType === 'objectMask'" class="polygonFormField">
                        <strong>物体</strong>
                        <span class="polygonInput">person</span>
                    </div>
                </div>
                <div class="polygonActions" :ref="(el) => setFocusRef(el, 'zone.save')">
                    <span>取消</span>
                    <b>保存</b>
                </div>
            </div>

            <div v-else class="polygonLists">
                <div class="polygonPageTitle">遮罩 / 区域</div>
                <section class="maskZoneListSection" :ref="(el) => setFocusRef(el, 'zones')">
                    <header>
                        <strong>区域</strong>
                        <span class="polygonAdd" :ref="(el) => setFocusRef(el, 'zone.add')">
                            <LcIcon name="plus" :size="14" />
                        </span>
                    </header>
                    <div class="polygonListItem">
                        <span>
                            <LcIcon name="draw-polygon" />
                        </span>
                        <span><b>车道</b><small>4 个点</small></span>
                        <span class="switch switchOn"><span /></span>
                    </div>
                </section>
                <section class="maskZoneListSection" :ref="(el) => setFocusRef(el, 'motionMasks')">
                    <header>
                        <strong>画面变动遮罩</strong>
                        <span class="polygonAdd" :ref="(el) => setFocusRef(el, 'motionMask.add')">
                            <LcIcon name="plus" :size="14" />
                        </span>
                    </header>
                    <div class="polygonListItem">
                        <span>
                            <LcIcon name="object-group" />
                        </span>
                        <span><b>时间戳区域</b><small>4 个点</small></span>
                        <span class="switch switchOn"><span /></span>
                    </div>
                </section>
                <section class="maskZoneListSection" :ref="(el) => setFocusRef(el, 'objectMasks')">
                    <header>
                        <strong>物体遮罩</strong>
                        <span class="polygonAdd" :ref="(el) => setFocusRef(el, 'objectMask.add')">
                            <LcIcon name="plus" :size="14" />
                        </span>
                    </header>
                    <div class="polygonListItem">
                        <span>
                            <LcIcon name="person-bounding-box" />
                        </span>
                        <span><b>屋顶区域</b><small>5 个点</small></span>
                        <span class="switch switchOn"><span /></span>
                    </div>
                </section>
            </div>
        </aside>

        <div :ref="(el) => setFocusRef(el, `${editorType}.canvas`)">
            <div class="polygonCanvas">
                <img alt="" loading="lazy" :src="step.cameraImage ?? '/img/frigate-autotracking-example.gif'" />
                <svg aria-hidden="true" viewBox="0 0 640 360">
                    <polygon :class="polygonClass" :points="polygonPoints" />
                    <circle v-for="([x, y], index) in polygonVertices" :key="index" :cx="x" :cy="y" r="6" />
                </svg>
                <div class="canvasBadge">前门</div>
                <div v-if="editorType" class="canvasTools">
                    <span>清除点</span>
                    <span>吸附点</span>
                </div>
            </div>
        </div>

        <aside v-if="step.guidePhase === 'field'" class="fieldHint maskZoneHint">
            <span class="fieldHintIcon">
                <LcIcon name="info" />
            </span>
            <div>
                <strong>{{ step.label ?? maskZoneLabels[step.focus] ?? humanizeKey(step.focus) }}</strong>
                <p>{{ step.hint ?? step.guideLabel }}</p>
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
    </div>
</template>
