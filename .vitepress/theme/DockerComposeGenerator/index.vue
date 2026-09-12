<script setup lang="ts">
import { TkVpContainer } from "vitepress-theme-teek";
import { useConfigGenerator } from "./composables/useConfigGenerator";
import type { NetworkMode } from "./generator";
import { renderInlineMarkdown } from "./utils/markdown";
import DeviceSelector from "./components/DeviceSelector.vue";
import HardwareOptions from "./components/HardwareOptions.vue";
import StoragePaths from "./components/StoragePaths.vue";
import NetworkConfig from "./components/NetworkConfig.vue";
import NvidiaGpuConfig from "./components/NvidiaGpuConfig.vue";
import OtherOptions from "./components/OtherOptions.vue";
import GeneratedOutput from "./components/GeneratedOutput.vue";
import "./style.css";

const {
  deviceId,
  device,
  imageSource,
  hardwareEnabled,
  networkMode,
  portEnabled,
  portConfirmed,
  cooldowns,
  nvidiaGpuCount,
  nvidiaGpuDeviceId,
  configPath,
  mediaPath,
  rtspPassword,
  timezone,
  shmSize,
  shmSizeError,
  gpuDeviceIdError,
  configPathError,
  mediaPathError,
  hasAnyHardware,
  generatedYaml,
  selectDevice,
  isHardwareDisabled,
  toggleHardware,
  togglePort,
  confirmPort,
  setShmSize,
  setConfigPath,
  setMediaPath,
  setNvidiaGpuCount,
  setNvidiaGpuDeviceId,
} = useConfigGenerator();

const helpTitleMap: Record<string, string> = {
  info: "提示",
  warning: "警告",
  danger: "危险",
};

function setImageSource(source: "cnb" | "official") {
  imageSource.value = source;
}

function setNetworkMode(mode: NetworkMode) {
  networkMode.value = mode;
}

function handleRtspPassword(value: string) {
  rtspPassword.value = value;
}

function handleTimezone(value: string) {
  timezone.value = value;
}
</script>

<template>
  <div class="dcg">
    <div class="dcg-card">
      <header class="dcg-header">
        <h3 class="dcg-title">Docker Compose 配置生成器</h3>
        <p class="dcg-description">
          根据你的硬件配置和需求自动生成 Frigate 的 Docker Compose 配置。
        </p>
      </header>

      <DeviceSelector :selected-id="deviceId" @select="selectDevice" />

      <TkVpContainer v-if="device.helpText" :type="device.helpType || 'info'">
        <template #title>{{ helpTitleMap[device.helpType || "info"] }}</template>
        <p v-html="renderInlineMarkdown(device.helpText)"></p>
      </TkVpContainer>

      <NvidiaGpuConfig
        v-if="device.needsNvidiaConfig"
        :gpu-count="nvidiaGpuCount"
        :gpu-device-id="nvidiaGpuDeviceId"
        :gpu-device-id-error="gpuDeviceIdError"
        :on-gpu-count-change="setNvidiaGpuCount"
        :on-gpu-device-id-change="setNvidiaGpuDeviceId"
      />

      <section class="dcg-section">
        <h4>镜像配置</h4>
        <div class="dcg-radio-group">
          <label class="dcg-radio-label">
            <input
              type="radio"
              name="dcg-image-source"
              value="cnb"
              :checked="imageSource === 'cnb'"
              @change="setImageSource('cnb')"
            />
            <span>使用国内镜像源加速（推荐）</span>
          </label>
          <label class="dcg-radio-label">
            <input
              type="radio"
              name="dcg-image-source"
              value="official"
              :checked="imageSource === 'official'"
              @change="setImageSource('official')"
            />
            <span>使用官方镜像</span>
          </label>
        </div>
        <TkVpContainer v-if="imageSource === 'official'" type="warning">
          <template #title>警告</template>
          <p>
            将不使用镜像源加速功能。这可能会对一些需要下载额外模型文件的功能产生影响，导致功能不可用。
          </p>
          <p>中国大陆地区用户强烈建议使用国内镜像源加速。</p>
        </TkVpContainer>
      </section>

      <HardwareOptions
        :device-id="deviceId"
        :hardware-enabled="hardwareEnabled"
        :is-disabled="isHardwareDisabled"
        @toggle="toggleHardware"
      />

      <StoragePaths
        :config-path="configPath"
        :media-path="mediaPath"
        :config-path-error="configPathError"
        :media-path-error="mediaPathError"
        :on-config-path-change="setConfigPath"
        :on-media-path-change="setMediaPath"
      />

      <NetworkConfig
        :network-mode="networkMode"
        :port-enabled="portEnabled"
        :port-confirmed="portConfirmed"
        :cooldowns="cooldowns"
        @update:network-mode="setNetworkMode"
        @toggle="togglePort"
        @confirm="confirmPort"
      />

      <OtherOptions
        :rtsp-password="rtspPassword"
        :timezone="timezone"
        :shm-size="shmSize"
        :shm-size-error="shmSizeError"
        :on-rtsp-password-change="handleRtspPassword"
        :on-timezone-change="handleTimezone"
        :on-shm-size-change="setShmSize"
      />

      <GeneratedOutput
        :yaml="generatedYaml"
        :config-path="configPath"
        :media-path="mediaPath"
        :has-any-hardware="hasAnyHardware"
        :device-id="deviceId"
      />
    </div>
  </div>
</template>
