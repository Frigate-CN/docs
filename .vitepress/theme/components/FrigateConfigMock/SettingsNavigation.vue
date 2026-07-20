<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { manifest } from "./helpers.js";
import LcIcon from "./LcIcon.vue";

const props = defineProps({
    step: { type: Object, required: true },
});

const navigationRef = ref(null);
const activeItemRef = ref(null);

const groups = computed(() => manifest.navigation?.groups ?? []);

const activeGroup = computed(() =>
    groups.value.find((group) =>
        group.items.some(
            (item) => item.section === props.step.section && item.level === props.step.level,
        ),
    ),
);

let timer;

watch(
    () => [props.step.guidePhase, props.step.level, props.step.section],
    () => {
        if (props.step.guidePhase === "settings") {
            if (navigationRef.value) navigationRef.value.scrollTop = 0;
            return;
        }
        if (props.step.guidePhase !== "menu" || !activeItemRef.value) return;

        timer = window.setTimeout(() => {
            const target = activeItemRef.value;
            if (!target) return;
            const navigation = navigationRef.value;
            if (!navigation) return;
            const reduceMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            navigation.scrollTo({
                top:
                    target.offsetTop -
                    navigation.clientHeight / 2 +
                    target.offsetHeight / 2,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        }, 40);
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
                <div class="menuGroupLabel" :class="{ menuGroupLabelActive: group.key === activeGroup?.key }">
                    <span>{{ group.label }}</span>
                    <span>
                        <LcIcon :name="group.key === activeGroup?.key ? 'chevron-down' : 'chevron-right'" :size="14" />
                    </span>
                </div>
                <div v-if="group.key === activeGroup?.key && step.level === 'camera'" class="cameraName">
                    前门
                </div>
                <div v-if="group.key === activeGroup?.key" class="menuItems">
                    <div v-for="item in group.items" :key="item.key" class="menuItem" :class="{
                        menuItemActive: item.section === step.section && item.level === step.level,
                        navigationTarget: item.section === step.section && item.level === step.level && step.guidePhase === 'menu',
                    }" :ref="(el) => { if (item.section === step.section && item.level === step.level) activeItemRef = el }">
                        <span>{{ item.label }}</span>
                        <i v-if="item.section === step.section && item.level === step.level" />
                    </div>
                </div>
            </div>
        </template>
    </aside>
</template>
