import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import manifest from "./manifest.json";

// --- Static configuration data ---

const objectLabelOptions = [
  "bicycle",
  "bus",
  "car",
  "cat",
  "dog",
  "license_plate",
  "motorcycle",
  "person",
];

const reviewLabelOptions = [
  "bark",
  "bicycle",
  "bird",
  "car",
  "cat",
  "dog",
  "face",
  "fire_alarm",
  "license_plate",
  "motorcycle",
  "person",
];

const maskZoneLabels = {
  zones: "区域",
  "zone.add": "添加区域",
  "zone.canvas": "绘制区域",
  "zone.options": "区域选项",
  "zone.objects": "物体",
  "zone.loitering_time": "徘徊时间",
  "zone.inertia": "惯性",
  "zone.speed": "测速",
  "zone.speed_threshold": "速度阈值",
  "zone.save": "保存",
  motionMasks: "画面变动遮罩",
  "motionMask.add": "新建画面变动遮罩",
  "motionMask.canvas": "绘制画面变动遮罩",
  "motionMask.options": "画面变动遮罩选项",
  objectMasks: "物体遮罩",
  "objectMask.add": "新建物体遮罩",
  "objectMask.canvas": "绘制物体遮罩",
  "objectMask.options": "物体遮罩选项",
  "objectMask.objects": "物体",
};

// --- Helpers ---

const humanizeKey = (value) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "未设置";
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

function normalizeStep(base, step) {
  return {
    level: step.level ?? base.level ?? "global",
    section: step.section ?? base.section,
    fields: step.fields ?? base.fields,
    values: { ...(base.values ?? {}), ...(step.values ?? {}) },
    focus: step.focus ?? base.focus,
    hint: step.hint ?? base.hint,
    label: step.label ?? base.label,
    cameraImage: step.cameraImage ?? base.cameraImage,
    title: step.title,
  };
}

export {
  manifest,
  objectLabelOptions,
  reviewLabelOptions,
  maskZoneLabels,
  humanizeKey,
  formatValue,
  normalizeStep,
};
