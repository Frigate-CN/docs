<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { manifest } from "./helpers.js";
import LcIcon from "./LcIcon.vue";

const props = defineProps({
    step: { type: Object, required: true },
});

const navigationRef = ref(null);
const activeItemRef = ref(null);
const collapsedGroupRef = ref(null);

const groups = computed(() => manifest.navigation?.groups ?? []);

const activeGroup = computed(() =>
    groups.value.find((group) =>
        group.items.some(
            (item) => item.section === props.step.section && item.level === props.step.level,
        ),
    ),
);

const isExpanded = computed(
    () =>
        props.step.guidePhase !== "settings" &&
        props.step.guidePhase !== "menu-collapsed",
);

let timer;

const scrollTo = (target, container) => {
    if (!target || !container) return;
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeTop =
        targetRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({
        top:
            relativeTop -
            container.clientHeight / 2 +
            target.offsetHeight / 2,
        behavior: reduceMotion ? "auto" : "smooth",
    });
};

watch(
    () => [props.step.guidePhase, props.step.level, props.step.section],
    () => {
        if (props.step.guidePhase === "settings") {
            if (navigationRef.value) navigationRef.value.scrollTop = 0;
            return;
        }
        if (props.step.guidePhase === "menu-collapsed") {
            nextTick(() => {
                timer = window.setTimeout(() => {
                    scrollTo(collapsedGroupRef.value, navigationRef.value);
                }, 40);
            });
            return;
        }
        nextTick(() => {
            timer = window.setTimeout(() => {
                scrollTo(activeItemRef.value, navigationRef.value);
            }, 40);
        });
    },
);

onUnmounted(() => window.clearTimeout(timer));
</script>

<template>
    <aside class="settingsNav" aria-hidden="true" ref="navigationRef">
        <template v-for="group in groups" :key="group.key">
            <div v-if="group.items.length === 1" class="singleMenuItem">
                {{ group.items[0].label }}
            </div>
            <div v-else class="menuGroup">
                <div
                    class="menuGroupLabel"
                    :class="{
                        menuGroupLabelActive: group.key === activeGroup?.key && isExpanded,
                        navigationTarget:
                            group.key === activeGroup?.key &&
                            step.guidePhase === 'menu-collapsed',
                    }"
                    :ref="
                        (el) => {
                            if (
                                group.key === activeGroup?.key &&
                                step.guidePhase === 'menu-collapsed'
                            )
                                collapsedGroupRef = el;
                        }
                    "
                >
                    <span>{{ group.label }}</span>
                    <span>
                        <LcIcon
                            :name="
                                group.key === activeGroup?.key && isExpanded
                                    ? 'chevron-down'
                                    : 'chevron-right'
                            "
                            :size="14"
                        />
                    </span>
                </div>
                <div
                    v-if="group.key === activeGroup?.key && isExpanded && step.level === 'camera'"
                    class="cameraName"
                >
                    {{ step.cameraName ?? "前门" }}
                </div>
                <div v-if="group.key === activeGroup?.key && isExpanded" class="menuItems">
                    <div
                        v-for="item in group.items"
                        :key="item.key"
                        class="menuItem"
                        :class="{
                            menuItemActive:
                                item.section === step.section &&
                                item.level === step.level,
                            navigationTarget:
                                item.section === step.section &&
                                item.level === step.level &&
                                step.guidePhase === 'menu',
                        }"
                        :ref="
                            (el) => {
                                if (
                                    item.section === step.section &&
                                    item.level === step.level
                                )
                                    activeItemRef = el;
                            }
                        "
                    >
                        <span>{{ item.label }}</span>
                        <i
                            v-if="
                                item.section === step.section &&
                                item.level === step.level
                            "
                        />
                    </div>
                </div>
            </div>
        </template>
    </aside>
</template>
