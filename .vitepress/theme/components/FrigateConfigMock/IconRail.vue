<script setup>
import LcIcon from "./LcIcon.vue";

/**
 * Shared left icon rail for EVERY mock scene (settings pages and the live
 * camera-groups dialog) so the chrome stays identical everywhere.
 *
 * Mirrors web/src/components/navigation/Sidebar.tsx + NavItem.tsx:
 *   aside w-[52px] bg-background_alt py-4 border-r, Logo h-8 w-8 mb-6,
 *   NavItem rounded-lg p-[6px] mx-[10px] mb-4, icon size-5 (20px),
 *   inactive: text-secondary-foreground bg-secondary,
 *   active: font-bold text-white bg-selected.
 *   Bottom: GeneralSettings + AccountSettings inside mb-8 flex-col gap-4.
 *
 * variant="live" reproduces the LIVE page rail: the Live NavItem is active
 * and, only on that page, the CameraGroupSelector cluster appears directly
 * below it (mb-2 above / mb-4 below). The cluster holds
 *   所有摄像头 (MdHome) + one button per user group + 编辑铅笔 (LuPencil),
 * each a smaller 24x24 size-sm button per filter/CameraGroupSelector.tsx.
 */
defineProps({
    phase: { type: String, default: "" },
    // "settings" — plain nav rail used by settings pages
    // "live" — LIVE page rail with active Live item + camera-group cluster
    variant: { type: String, default: "settings" },
    focusRef: { type: Object, default: null },
});

const navItems = [
    { icon: "video", active: false },
    { icon: "video-library-outline", active: false },
    { icon: "search", active: false },
    { icon: "disc", active: false },
    { icon: "face-id", active: false },
    { icon: "category-outline", active: false },
];
</script>

<template>
    <aside class="iconRail" aria-hidden="true">
        <span class="railLogo">
            <svg viewBox="0 0 512 512" class="railLogoSvg" fill="currentColor">
                <path
                    d="M130 446.5C131.6 459.3 145 468 137 470C129 472 94 406.5 86 378.5C78 350.5 73.5 319 75.5 301C77.4999 283 181 255 181 247.5C181 240 147.5 247 146 241C144.5 235 171.3 238.6 178.5 229C189.75 214 204 216.5 213 208.5C222 200.5 233 170 235 157C237 144 215 129 209 119C203 109 222 102 268 83C314 64 460 22 462 27C464 32 414 53 379 66C344 79 287 104 287 111C287 118 290 123.5 288 139.5C286 155.5 285.76 162.971 282 173.5C279.5 180.5 277 197 282 212C286 224 299 233 305 235C310 235.333 323.8 235.8 339 235C358 234 385 236 385 241C385 246 344 243 344 250C344 257 386 249 385 256C384 263 350 260 332 260C317.6 260 296.333 259.333 287 256L285 263C281.667 263 274.7 265 267.5 265C258.5 265 258 268 241.5 268C225 268 230 267 215 266C200 265 144 308 134 322C124 336 130 370 130 385.5C130 399.428 128 430.5 130 446.5Z" />
            </svg>
        </span>

        <!-- LIVE variant: active Live NavItem followed by the
             CameraGroupSelector sub-cluster of smaller size-sm buttons
             (所有摄像头 → 用户分组 → 编辑铅笔), only visible on the live page. -->
        <template v-if="variant === 'live'">
            <span class="railIcon railIconActive railClusterGap">
                <LcIcon name="video" :size="20" />
            </span>
            <span class="railSubItem">
                <LcIcon name="videocam" :size="16" />
            </span>
            <span class="railSubItem">
                <LcIcon name="car" :size="16" />
            </span>
            <span class="railSubItem railClusterLast"
                :class="{ navigationTarget: phase === 'group-trigger' }"
                :ref="(el) => { if (phase === 'group-trigger' && focusRef) focusRef.current = el }">
                <LcIcon name="pencil" :size="16" />
            </span>
            <span v-for="item in navItems.slice(1)" :key="item.icon" class="railIcon">
                <LcIcon :name="item.icon" :size="20" />
            </span>
        </template>
        <template v-else>
            <span v-for="item in navItems" :key="item.icon" class="railIcon"
                :class="{ railIconActive: item.active }">
                <LcIcon :name="item.icon" :size="20" />
            </span>
        </template>

        <span class="railSpacer" />
        <span class="railActions">
            <span class="railButton" :class="{ navigationTarget: phase === 'settings' }">
                <LcIcon name="settings" :size="20" />
            </span>
            <span class="railButton">
                <LcIcon name="account" :size="20" />
            </span>
        </span>
    </aside>
</template>
