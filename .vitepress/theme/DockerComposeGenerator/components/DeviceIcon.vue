<script setup lang="ts">
import { computed } from "vue";
import type { DeviceConfig } from "../config/types";

const props = defineProps<{ device: DeviceConfig }>();

type IconType = "svg" | "image" | "emoji";
type DeviceStyle = Record<string, string> | undefined;

function getIconType(icon: string): IconType {
  const value = icon.trim();
  if (value.startsWith("<svg")) return "svg";
  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return "image";
  }
  return "emoji";
}

function hasBackgroundProps(style: DeviceStyle): boolean {
  if (!style) return false;
  return Object.keys(style).some((key) => {
    const normalized = key.toLowerCase().replace(/-/g, "");
    return (
      normalized === "backgroundsize" ||
      normalized === "backgroundposition" ||
      normalized === "backgroundrepeat" ||
      normalized === "backgroundimage"
    );
  });
}

/** 将样式对象转换为 CSS 变量，供内部 `<svg>` 使用（如 { width } → { --svg-width }） */
function toSvgVars(style: DeviceStyle): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!style) return vars;
  for (const [key, value] of Object.entries(style)) {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    vars[`--svg-${cssKey}`] = value;
  }
  return vars;
}

function buildContainerStyle(
  icon: string,
  iconStyle: DeviceStyle,
  svgStyle: DeviceStyle,
  type: IconType,
  asBackground: boolean
): Record<string, string> {
  if (type === "svg") {
    return { ...(iconStyle ?? {}), ...toSvgVars(svgStyle) };
  }
  if (type === "image" && asBackground) {
    return {
      backgroundImage: `url(${icon})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "contain",
      ...(iconStyle ?? {}),
    };
  }
  return { ...(iconStyle ?? {}) };
}

/**
 * 同时渲染浅色与深色图标，通过 `html.dark` 的 CSS 规则切换，
 * 避免因主题状态导致的 SSR 水合不一致。
 */
const variants = computed(() => {
  const list = props.device.iconDark
    ? [
        {
          visibility: "light",
          icon: props.device.icon,
          iconStyle: props.device.iconStyle,
          svgStyle: props.device.svgStyle,
        },
        {
          visibility: "dark",
          icon: props.device.iconDark,
          iconStyle: props.device.iconDarkStyle ?? props.device.iconStyle,
          svgStyle: props.device.svgDarkStyle ?? props.device.svgStyle,
        },
      ]
    : [
        {
          visibility: "both",
          icon: props.device.icon,
          iconStyle: props.device.iconStyle,
          svgStyle: props.device.svgStyle,
        },
      ];

  return list.map((variant) => {
    const type = getIconType(variant.icon);
    const asBackground = type === "image" && hasBackgroundProps(variant.iconStyle);
    const visibilityClass =
      variant.visibility === "light"
        ? "dcg-only-light"
        : variant.visibility === "dark"
          ? "dcg-only-dark"
          : "";
    return {
      icon: variant.icon,
      type,
      asBackground,
      visibilityClass,
      style: buildContainerStyle(
        variant.icon,
        variant.iconStyle,
        variant.svgStyle,
        type,
        asBackground
      ),
    };
  });
});
</script>

<template>
  <template v-for="(variant, index) in variants" :key="index">
    <div
      v-if="variant.type === 'svg'"
      class="dcg-device-icon dcg-device-icon--svg"
      :class="variant.visibilityClass"
      :style="variant.style"
      v-html="variant.icon"
    ></div>
    <div
      v-else-if="variant.type === 'image'"
      class="dcg-device-icon dcg-device-icon--image"
      :class="variant.visibilityClass"
      :style="variant.asBackground ? variant.style : undefined"
    >
      <img
        v-if="!variant.asBackground"
        :src="variant.icon"
        :alt="device.name"
        :style="variant.style"
      />
    </div>
    <div
      v-else
      class="dcg-device-icon"
      :class="variant.visibilityClass"
      :style="variant.style"
    >
      {{ variant.icon }}
    </div>
  </template>
</template>
