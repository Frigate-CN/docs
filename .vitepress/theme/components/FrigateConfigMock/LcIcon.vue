<script setup>
import iconData from "./icons.json";

defineProps({
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
});

/**
 * Real icon path data (downloaded from Iconify — lucide, tabler,
 * material-symbols, mdi — the same icon sets Frigate's react-icons uses:
 * LuSettings → lucide/settings, FaVideo → lucide/video, MdVideoLibrary →
 * material-symbols/video-library-outline, IoSearch → lucide/search,
 * FaCompactDisc → lucide/disc, TbFaceId → tabler/face-id,
 * MdCategory → material-symbols/category-outline, MdChat →
 * material-symbols/chat-outline, VscAccount → mdi/account).
 * The <body> is a raw SVG fragment rendered via v-html so per-path fill /
 * stroke attributes (e.g. fill="currentColor" on Material icons) are
 * preserved exactly.
 */
</script>

<template>
    <svg :width="size" :height="size" :viewBox="iconData[name]?.viewBox ?? '0 0 24 24'"
        class="lc-icon" aria-hidden="true" v-html="iconData[name]?.body ?? ''" />
</template>

<style scoped>
.lc-icon {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>
