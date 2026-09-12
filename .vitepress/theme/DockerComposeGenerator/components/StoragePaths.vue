<script setup lang="ts">
const props = defineProps<{
  configPath: string;
  mediaPath: string;
  configPathError: boolean;
  mediaPathError: boolean;
  /** 返回过滤后的合法值，便于同步回输入框 */
  onConfigPathChange: (raw: string) => string;
  onMediaPathChange: (raw: string) => string;
}>();

function handleInput(event: Event, setter: (raw: string) => string) {
  const input = event.target as HTMLInputElement;
  const sanitized = setter(input.value);
  if (input.value !== sanitized) input.value = sanitized;
}
</script>

<template>
  <section class="dcg-section">
    <h4>存储路径</h4>
    <div class="dcg-form-grid">
      <div class="dcg-form-group">
        <label class="dcg-label" for="dcg-config-path">
          配置文件 / 数据库 / 模型缓存目录（宿主机）：
        </label>
        <input
          id="dcg-config-path"
          type="text"
          class="dcg-input"
          :class="{ 'dcg-input--error': configPathError }"
          :value="configPath"
          placeholder="/home/frigate/config"
          @input="handleInput($event, props.onConfigPathChange)"
        />
        <p v-if="configPathError" class="dcg-help-text">
          ⚠️ 路径包含非法字符，仅允许字母、数字、下划线、连字符、斜杠和点
        </p>
      </div>
      <div class="dcg-form-group">
        <label class="dcg-label" for="dcg-media-path">
          录制文件目录（宿主机）：
        </label>
        <input
          id="dcg-media-path"
          type="text"
          class="dcg-input"
          :class="{ 'dcg-input--error': mediaPathError }"
          :value="mediaPath"
          placeholder="/home/frigate/video"
          @input="handleInput($event, props.onMediaPathChange)"
        />
        <p v-if="mediaPathError" class="dcg-help-text">
          ⚠️ 路径包含非法字符，仅允许字母、数字、下划线、连字符、斜杠和点
        </p>
      </div>
    </div>
  </section>
</template>
