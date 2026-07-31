<script setup>
import LcIcon from "./LcIcon.vue";

defineProps({
    visible: { type: Boolean, default: false },
});

const groups = [
    {
        label: "系统",
        items: [
            { icon: "activity", label: "系统指标" },
            { icon: "list", label: "系统日志" },
        ],
    },
    {
        label: "配置",
        items: [
            { icon: "settings", label: "设置", target: true },
            { icon: "square-pen", label: "配置编辑器" },
        ],
    },
    {
        label: "外观",
        items: [
            { icon: "languages", label: "语言", submenu: true },
            { icon: "sun-moon", label: "深色模式", submenu: true },
            { icon: "sun-moon", label: "主题", submenu: true },
        ],
    },
    {
        label: "帮助",
        items: [
            { icon: "life-buoy", label: "文档" },
            { icon: "github", label: "GitHub" },
        ],
    },
];
</script>

<template>
    <div class="systemMenu" :class="{ systemMenuVisible: visible }" aria-hidden="true">
        <div v-for="group in groups" :key="group.label" class="systemMenuGroup">
            <strong>{{ group.label }}</strong>
            <div v-for="item in group.items" :key="item.label" class="systemMenuItem"
                :class="{ systemMenuTarget: item.target }">
                <span>
                    <LcIcon :name="item.icon" />
                </span>
                <b>{{ item.label }}</b>
                <i v-if="item.submenu">
                    <LcIcon name="chevron-right" :size="12" />
                </i>
            </div>
        </div>
        <div class="restartItem">
            <span>
                <LcIcon name="rotate-cw" />
            </span>
            <b>重启 Frigate</b>
        </div>
    </div>
</template>
