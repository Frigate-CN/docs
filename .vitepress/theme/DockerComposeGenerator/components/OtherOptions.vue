<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  rtspPassword: string;
  timezone: string;
  shmSize: string;
  shmSizeError: boolean;
  onRtspPasswordChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  /** 返回过滤后的合法值，便于同步回输入框 */
  onShmSizeChange: (raw: string) => string;
}>();

const AUTO_TIMEZONE = "__auto__";

// 在客户端挂载后再计算时区列表，避免 SSR 与客户端不一致
const timezones = ref<string[]>([]);
const systemTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";

onMounted(() => {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  const supported = intl.supportedValuesOf?.("timeZone");
  timezones.value =
    supported && supported.length > 0 ? [...supported].sort() : [systemTimezone];
});

const selectedTimezone = computed(() => props.timezone || AUTO_TIMEZONE);

function handleTimezoneChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  props.onTimezoneChange(value === AUTO_TIMEZONE ? "" : value);
}

function handleShmSizeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const sanitized = props.onShmSizeChange(input.value);
  if (input.value !== sanitized) input.value = sanitized;
}
</script>

<template>
  <section class="dcg-section">
    <h4>其他配置</h4>
    <div class="dcg-form-grid">
      <div class="dcg-form-group">
        <label class="dcg-label" for="dcg-timezone">时区：</label>
        <select
          id="dcg-timezone"
          class="dcg-input dcg-select"
          :value="selectedTimezone"
          @change="handleTimezoneChange"
        >
          <option :value="AUTO_TIMEZONE">
            使用浏览器时区（{{ systemTimezone }}）
          </option>
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </div>
      <div class="dcg-form-group">
        <label class="dcg-label" for="dcg-shm-size">共享内存（SHM）：</label>
        <input
          id="dcg-shm-size"
          type="text"
          class="dcg-input"
          :class="{ 'dcg-input--error': shmSizeError }"
          :value="shmSize"
          placeholder="512mb"
          @input="handleShmSizeInput"
        />
        <p v-if="shmSizeError" class="dcg-help-text">
          ⚠️ 格式无效，请使用数字加单位的形式（如 512mb、1gb）
        </p>
        <p v-else class="dcg-help-text">
          请参阅
          <a href="./installation#calculating-required-shm-size">
            计算所需的共享内存大小（shm-size）
          </a>
          的计算结果来配置，单位为 MB
        </p>
      </div>
      <div class="dcg-form-group">
        <label class="dcg-label" for="dcg-rtsp-password">RTSP 密码：</label>
        <input
          id="dcg-rtsp-password"
          type="text"
          class="dcg-input"
          :value="rtspPassword"
          placeholder="password"
          @input="onRtspPasswordChange(($event.target as HTMLInputElement).value)"
        />
        <p class="dcg-help-text">
          可选。可在配置文件中使用 <code>{FRIGATE_RTSP_PASSWORD}</code> 变量引用该密码，
          供摄像头视频流使用以避免密码泄露。注意，这不是 Frigate 的登录密码。
        </p>
      </div>
    </div>
  </section>
</template>
