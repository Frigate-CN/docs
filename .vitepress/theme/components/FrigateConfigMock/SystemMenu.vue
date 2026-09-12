<script setup>
import LcIcon from "./LcIcon.vue";

defineProps({
    visible: { type: Boolean, default: false },
});

/**
 * Mirrors web/src/components/menu/GeneralSettings.tsx (desktop dropdown):
 *   系统: 系统指标 (LuActivity → /system#general), 系统日志 (LuList → /logs),
 *         配置模板 (LuLayers, submenu — only when profiles exist)
 *   配置: 设置 (LuSettings → /settings), 配置编辑器 (LuSquarePen → /config)
 *   外观: 语言 (LuLanguages, submenu), 深色模式 (LuSunMoon, submenu),
 *         主题 (LuSunMoon, submenu)
 *   帮助: 文档 (LuLifeBuoy), GitHub (LuGithub)
 *   尾部: 重启 (LuRotateCw) after a separator (admin only)
 * Content: w-72 (288px) rounded-md border bg-popover p-1 shadow-md;
 * label: px-2 py-1.5 text-sm font-semibold text-muted-foreground;
 * item: rounded-sm px-2 py-1.5 text-sm flex items-center, icon mr-2 size-4;
 * submenu item: ChevronRight ml-auto h-4 w-4.
 */
const groups = [
    {
        label: "系统",
        items: [
            { icon: "activity", label: "系统指标" },
            { icon: "list", label: "系统日志" },
            { icon: "layers", label: "配置模板", submenu: true },
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
        <template v-for="group in groups" :key="group.label">
            <div class="systemMenuLabel">{{ group.label }}</div>
            <div class="systemMenuSeparator" />
            <div class="systemMenuGroup">
                <div v-for="item in group.items" :key="item.label" class="systemMenuItem"
                    :class="{ systemMenuTarget: item.target }">
                    <span>
                        <LcIcon :name="item.icon" :size="16" />
                    </span>
                    <b>{{ item.label }}</b>
                    <i v-if="item.submenu">
                        <LcIcon name="chevron-right" :size="14" />
                    </i>
                </div>
            </div>
        </template>
        <div class="systemMenuSeparator systemMenuSeparatorGap" />
        <div class="restartItem">
            <span>
                <LcIcon name="rotate-cw" :size="16" />
            </span>
            <b>重启</b>
        </div>
    </div>
</template>
