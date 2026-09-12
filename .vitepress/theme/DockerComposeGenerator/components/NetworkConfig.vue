<script setup lang="ts">
import { TkVpContainer } from "vitepress-theme-teek";
import { ports } from "../config";
import type { PortConfig } from "../config/types";
import type { NetworkMode } from "../generator";
import { renderMarkdown } from "../utils/markdown";

const props = defineProps<{
  networkMode: NetworkMode;
  portEnabled: Record<string, boolean>;
  portConfirmed: Record<string, boolean>;
  cooldowns: Record<string, number>;
}>();

const emit = defineEmits<{
  "update:networkMode": [mode: NetworkMode];
  toggle: [portId: string];
  confirm: [portId: string];
}>();

function showWarning(port: PortConfig): boolean {
  const enabled = !!props.portEnabled[port.id];
  if (port.warningWhen === "checked") return enabled;
  if (port.warningWhen === "unchecked") return !enabled;
  return enabled;
}
</script>

<template>
  <section class="dcg-section">
    <h4>网络配置</h4>
    <div class="dcg-radio-group">
      <label class="dcg-radio-label">
        <input
          type="radio"
          name="dcg-network-mode"
          :checked="networkMode === 'bridge'"
          @change="emit('update:networkMode', 'bridge')"
        />
        <span>端口映射（默认）</span>
      </label>
      <label class="dcg-radio-label">
        <input
          type="radio"
          name="dcg-network-mode"
          :checked="networkMode === 'host'"
          @change="emit('update:networkMode', 'host')"
        />
        <span>host 网络模式</span>
      </label>
    </div>

    <TkVpContainer type="tip">
      <template #title>备注</template>
      <p>如果你需要使用小米摄像头，你可能需要切换为 host 网络模式才能正常使用。这会导致 5000 端口默认开放，请注意配置防火墙。</p>
    </TkVpContainer>

    <div
      class="dcg-checkbox-grid"
      :class="{ 'dcg-checkbox-grid--disabled': networkMode === 'host' }"
    >
      <div v-for="port in ports" :key="port.id" class="dcg-checkbox-item">
        <label
          class="dcg-checkbox-label"
          :class="{
            'dcg-checkbox-label--disabled': port.locked || networkMode === 'host',
          }"
        >
          <input
            type="checkbox"
            :checked="!!portEnabled[port.id]"
            :disabled="port.locked || networkMode === 'host'"
            @change="emit('toggle', port.id)"
          />
          <span>
            {{ port.locked ? "🔒 " : "" }}端口 {{ port.host
            }}{{ port.protocol && port.protocol !== "tcp" ? `/${port.protocol}` : "" }}
          </span>
          <span v-if="port.badge" class="dcg-port-badge">{{ port.badge }}</span>
        </label>
        <div class="dcg-checkbox-desc">{{ port.description }}</div>

        <!-- 高风险端口：冷却倒计时 + 二次确认 -->
        <div
          v-if="
            networkMode === 'bridge' &&
            port.dangerConfirm &&
            portEnabled[port.id]
          "
          class="dcg-danger-confirm"
        >
          <TkVpContainer type="danger">
            <template #title>危险</template>
            <div v-html="renderMarkdown(port.warningContent || '')"></div>
            <label
              class="dcg-checkbox-label"
              :class="{
                'dcg-checkbox-label--disabled': (cooldowns[port.id] ?? 0) > 0,
              }"
            >
              <input
                type="checkbox"
                :checked="!!portConfirmed[port.id]"
                :disabled="(cooldowns[port.id] ?? 0) > 0"
                @change="emit('confirm', port.id)"
              />
              <span>
                我已知晓风险，并确认开启该端口<span
                  v-if="(cooldowns[port.id] ?? 0) > 0"
                >
                  （{{ cooldowns[port.id] }}s）</span
                >
              </span>
            </label>
          </TkVpContainer>
        </div>

        <!-- 普通提示 -->
        <TkVpContainer
          v-else-if="
            networkMode === 'bridge' && port.warningContent && showWarning(port)
          "
          :type="port.warningType || 'warning'"
        >
          <template #title>
            {{ port.warningType === "danger" ? "危险" : "警告" }}
          </template>
          <div v-html="renderMarkdown(port.warningContent)"></div>
        </TkVpContainer>
      </div>
    </div>
  </section>
</template>
