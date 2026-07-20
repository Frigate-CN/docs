<script setup>
import { ref, useSlots, computed } from "vue";

const props = defineProps({
    defaultTab: { type: String, default: "ui" },
});

const slots = useSlots();
const activeTab = ref(props.defaultTab);

// Extract tab items from default slot
const tabItems = computed(() => {
    const defaultSlot = slots.default?.() ?? [];
    // Flatten fragments
    const children = defaultSlot.flatMap((vnode) =>
        vnode.type === Symbol.for("v-fgt") ? vnode.children : vnode,
    );
    return children
        .filter((vnode) => vnode?.props?.value)
        .map((vnode) => ({
            value: vnode.props.value,
            label: vnode.props.label || vnode.props.value,
            vnode,
        }));
});
</script>

<template>
    <div class="config-tabs-wrapper">
        <div class="config-tabs">
            <button v-for="tab in tabItems" :key="tab.value" class="config-tab" :class="{
                'config-tab-active': activeTab === tab.value,
                'config-tab-ui': tab.value === 'ui',
                'config-tab-yaml': tab.value === 'yaml',
            }" @click="activeTab = tab.value">
                {{ tab.label }}
            </button>
        </div>
        <div class="config-tab-content">
            <template v-for="tab in tabItems" :key="tab.value">
                <div v-show="activeTab === tab.value" :class="`config-tab-panel config-tab-panel-${tab.value}`">
                    <component :is="tab.vnode" />
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.config-tabs-wrapper {
    margin: 16px 0;
}

.config-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid var(--vp-c-divider, #e2e8f0);
    padding: 0 4px;
}

.config-tab {
    padding: 8px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-2, #64748b);
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.2s, border-color 0.2s;
}

.config-tab:hover {
    color: var(--vp-c-text-1, #1e293b);
}

.config-tab-active {
    color: var(--vp-c-brand-1, #3451b2);
    border-bottom-color: var(--vp-c-brand-1, #3451b2);
}

.config-tab-content {
    padding: 16px 0;
}

.config-tab-panel {
    width: 100%;
}

/* Style the YAML tab panel to look like a code block */
.config-tab-panel-yaml :deep(div[class*="language-"]) {
    margin: 0;
}
</style>
