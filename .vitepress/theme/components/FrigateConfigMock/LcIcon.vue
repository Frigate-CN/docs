<script setup>
defineProps({
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
});
</script>

<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" class="lc-icon" aria-hidden="true">
        <!-- Lucide icons (https://lucide.dev) -->
        <template v-if="name === 'activity'">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </template>
        <template v-else-if="name === 'chevron-down'">
            <path d="m6 9 6 6 6-6" />
        </template>
        <template v-else-if="name === 'chevron-left'">
            <path d="m15 18-6-6 6-6" />
        </template>
        <template v-else-if="name === 'chevron-right'">
            <path d="m9 18 6-6-6-6" />
        </template>
        <template v-else-if="name === 'external-link'">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </template>
        <template v-else-if="name === 'github'">
            <path
                d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </template>
        <template v-else-if="name === 'info'">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </template>
        <template v-else-if="name === 'languages'">
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
        </template>
        <template v-else-if="name === 'life-buoy'">
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 4.24 4.24" />
            <path d="m14.83 9.17 4.24-4.24" />
            <path d="m14.83 14.83 4.24 4.24" />
            <path d="m9.17 14.83-4.24 4.24" />
            <circle cx="12" cy="12" r="4" />
        </template>
        <template v-else-if="name === 'list'">
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
            <path d="M3 6h.01" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M8 6h13" />
        </template>
        <template v-else-if="name === 'pause'">
            <rect x="14" y="4" width="4" height="16" rx="1" />
            <rect x="6" y="4" width="4" height="16" rx="1" />
        </template>
        <template v-else-if="name === 'play'">
            <polygon points="6 3 20 12 6 21 6 3" />
        </template>
        <template v-else-if="name === 'plus'">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </template>
        <template v-else-if="name === 'rotate-cw'">
            <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
            <path d="M21 3v5h-5" />
        </template>
        <template v-else-if="name === 'settings'">
            <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </template>
        <template v-else-if="name === 'square-pen'">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path
                d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </template>
        <template v-else-if="name === 'sun-moon'">
            <path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </template>
        <template v-else-if="name === 'trash-2'">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
        </template>

        <!-- Font Awesome icons (simplified SVG paths) -->
        <template v-else-if="name === 'video'">
            <path d="m22 8-6 4 6 4V8Z" />
            <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
        </template>
        <template v-else-if="name === 'compact-disc'">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
        </template>
        <template v-else-if="name === 'video-library'">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="m22 8-6 4 6 4V8Z" />
            <path d="M2 2h20" />
            <path d="M2 2v20" />
        </template>
        <template v-else-if="name === 'search'">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </template>
        <template v-else-if="name === 'category'">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </template>
        <template v-else-if="name === 'face-id'">
            <path d="M6 4v16" />
            <path d="M18 4v16" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="3" />
        </template>
        <template v-else-if="name === 'draw-polygon'">
            <polygon points="6 4 18 4 22 12 18 20 6 20 2 12 6 4" />
            <circle cx="6" cy="4" r="2" />
            <circle cx="18" cy="4" r="2" />
            <circle cx="22" cy="12" r="2" />
            <circle cx="18" cy="20" r="2" />
            <circle cx="6" cy="20" r="2" />
            <circle cx="2" cy="12" r="2" />
        </template>
        <template v-else-if="name === 'object-group'">
            <rect x="2" y="2" width="6" height="6" />
            <rect x="16" y="16" width="6" height="6" />
            <path d="M8 4h8a4 4 0 0 1 4 4v8" />
            <path d="M16 20H8a4 4 0 0 1-4-4V8" />
        </template>
        <template v-else-if="name === 'person-bounding-box'">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="9" r="3" />
            <path d="M8 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" />
        </template>
    </svg>
</template>

<style scoped>
.lc-icon {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>
