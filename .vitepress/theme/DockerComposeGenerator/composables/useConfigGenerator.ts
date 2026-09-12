import { computed, onUnmounted, ref } from "vue";
import { deviceMap, devices, hardwareMap, portMap, ports } from "../config";
import { generateDockerCompose } from "../generator";
import type { GeneratorInput, ImageSource, NetworkMode } from "../generator";

/** 高风险端口冷却倒计时（秒） */
const DANGER_COOLDOWN_SECONDS = 10;

const SHM_SIZE_PATTERN = /^\d+(\.\d+)?[bkmgBKMG]{1,2}$/;
const PATH_PATTERN = /^[a-zA-Z0-9_\-/.]+$/;

function initialHardware(deviceId: string): Record<string, boolean> {
  const device = deviceMap.get(deviceId);
  const next: Record<string, boolean> = {};
  for (const hwId of device?.autoHardware ?? []) next[hwId] = true;
  return next;
}

function initialPorts(): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const port of ports) next[port.id] = port.defaultEnabled;
  return next;
}

/**
 * 生成器的核心状态与逻辑。
 * 所有 UI 组件共享同一份状态，最终输出由 `generatedYaml` 提供。
 */
export function useConfigGenerator() {
  // 设备与镜像
  const deviceId = ref("stable");
  const device = computed(() => deviceMap.get(deviceId.value) ?? devices[0]);
  const imageSource = ref<ImageSource>("cnb");

  // 硬件加速
  const hardwareEnabled = ref<Record<string, boolean>>(initialHardware("stable"));

  // 网络
  const networkMode = ref<NetworkMode>("bridge");
  const portEnabled = ref<Record<string, boolean>>(initialPorts());
  const portConfirmed = ref<Record<string, boolean>>({});
  const cooldowns = ref<Record<string, number>>({});
  const cooldownTimers: Record<string, number> = {};

  // NVIDIA
  const nvidiaGpuCount = ref("");
  const nvidiaGpuDeviceId = ref("");

  // 其他
  const configPath = ref("");
  const mediaPath = ref("");
  const rtspPassword = ref("");
  const timezone = ref("");
  const shmSize = ref("512mb");

  // 校验状态
  const shmSizeError = ref(false);
  const configPathError = ref(false);
  const mediaPathError = ref(false);

  /** GPU 数量为数字但未填写设备 ID 时报错 */
  const gpuDeviceIdError = computed(
    () =>
      nvidiaGpuCount.value !== "" && nvidiaGpuDeviceId.value.trim() === ""
  );

  // -------------------------------------------------------------------------
  // 设备
  // -------------------------------------------------------------------------

  function selectDevice(id: string) {
    if (!deviceMap.has(id)) return;
    deviceId.value = id;
    hardwareEnabled.value = initialHardware(id);
    nvidiaGpuCount.value = "";
    nvidiaGpuDeviceId.value = "";
  }

  function isHardwareDisabled(hwId: string): boolean {
    const option = hardwareMap.get(hwId);
    if (!option) return false;
    return option.disabledWhen?.includes(deviceId.value) ?? false;
  }

  function toggleHardware(hwId: string) {
    if (isHardwareDisabled(hwId)) return;
    hardwareEnabled.value = {
      ...hardwareEnabled.value,
      [hwId]: !hardwareEnabled.value[hwId],
    };
  }

  // -------------------------------------------------------------------------
  // 端口
  // -------------------------------------------------------------------------

  function stopCooldown(portId: string) {
    const timer = cooldownTimers[portId];
    if (timer !== undefined) {
      window.clearInterval(timer);
      delete cooldownTimers[portId];
    }
  }

  function startCooldown(portId: string) {
    stopCooldown(portId);
    cooldowns.value = { ...cooldowns.value, [portId]: DANGER_COOLDOWN_SECONDS };
    cooldownTimers[portId] = window.setInterval(() => {
      const remaining = (cooldowns.value[portId] ?? 0) - 1;
      cooldowns.value = { ...cooldowns.value, [portId]: Math.max(remaining, 0) };
      if (remaining <= 0) stopCooldown(portId);
    }, 1000);
  }

  function togglePort(portId: string) {
    const port = portMap.get(portId);
    if (!port || port.locked) return;

    const next = !portEnabled.value[portId];
    portEnabled.value = { ...portEnabled.value, [portId]: next };

    if (next && port.dangerConfirm) {
      portConfirmed.value = { ...portConfirmed.value, [portId]: false };
      startCooldown(portId);
    } else if (!next) {
      stopCooldown(portId);
      cooldowns.value = { ...cooldowns.value, [portId]: 0 };
      portConfirmed.value = { ...portConfirmed.value, [portId]: false };
    }
  }

  function confirmPort(portId: string) {
    const port = portMap.get(portId);
    if (!port?.dangerConfirm) return;
    if ((cooldowns.value[portId] ?? 0) > 0) return;
    portConfirmed.value = {
      ...portConfirmed.value,
      [portId]: !portConfirmed.value[portId],
    };
  }

  // -------------------------------------------------------------------------
  // 输入校验
  // -------------------------------------------------------------------------

  function setShmSize(raw: string): string {
    const filtered = raw.replace(/[^0-9.bkmgBKMG]/g, "");
    shmSize.value = filtered;
    shmSizeError.value = filtered !== "" && !SHM_SIZE_PATTERN.test(filtered);
    return filtered;
  }

  function setConfigPath(raw: string): string {
    const filtered = raw.replace(/[^a-zA-Z0-9_\-/.]/g, "");
    configPath.value = filtered;
    configPathError.value = filtered !== "" && !PATH_PATTERN.test(filtered);
    return filtered;
  }

  function setMediaPath(raw: string): string {
    const filtered = raw.replace(/[^a-zA-Z0-9_\-/.]/g, "");
    mediaPath.value = filtered;
    mediaPathError.value = filtered !== "" && !PATH_PATTERN.test(filtered);
    return filtered;
  }

  function setNvidiaGpuCount(raw: string): string {
    const filtered = raw.replace(/\D/g, "");
    nvidiaGpuCount.value = filtered;
    return filtered;
  }

  function setNvidiaGpuDeviceId(raw: string): string {
    nvidiaGpuDeviceId.value = raw;
    return raw;
  }

  // -------------------------------------------------------------------------
  // 派生数据
  // -------------------------------------------------------------------------

  const selectedHardwareIds = computed(() =>
    Object.entries(hardwareEnabled.value)
      .filter(([id, enabled]) => {
        if (!enabled) return false;
        const option = hardwareMap.get(id);
        if (!option) return false;
        return !(option.disabledWhen?.includes(deviceId.value) ?? false);
      })
      .map(([id]) => id)
  );

  const hasAnyHardware = computed(
    () =>
      selectedHardwareIds.value.length > 0 ||
      !!(device.value?.devices?.length)
  );

  /** 真正写入配置的端口 ID（高风险端口需要确认） */
  const activePortIds = computed(() =>
    ports
      .filter(
        (port) =>
          portEnabled.value[port.id] &&
          (!port.dangerConfirm || portConfirmed.value[port.id])
      )
      .map((port) => port.id)
  );

  const enabledPortLines = computed(() => {
    const lines: string[] = [];
    for (const id of activePortIds.value) {
      const port = portMap.get(id);
      if (!port) continue;
      const protocol =
        port.protocol && port.protocol !== "tcp" ? `/${port.protocol}` : "";
      const comment = port.description ? ` # ${port.description}` : "";
      lines.push(`      - "${port.host}:${port.container}${protocol}"${comment}`);
    }
    return lines;
  });

  const generatedYaml = computed(() => {
    const input: GeneratorInput = {
      device: device.value,
      selectedHardware: selectedHardwareIds.value,
      enabledPorts: enabledPortLines.value,
      configPath: configPath.value || "/home/frigate/config",
      mediaPath: mediaPath.value || "/home/frigate/video",
      rtspPassword: rtspPassword.value,
      timezone:
        timezone.value ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "Asia/Shanghai",
      shmSize: shmSize.value || "512mb",
      imageSource: imageSource.value,
      networkMode: networkMode.value,
      nvidiaGpuCount: nvidiaGpuCount.value,
      nvidiaGpuDeviceId: nvidiaGpuDeviceId.value,
    };
    return generateDockerCompose(input);
  });

  onUnmounted(() => {
    for (const id of Object.keys(cooldownTimers)) stopCooldown(id);
  });

  return {
    // 状态
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
    // 校验
    shmSizeError,
    gpuDeviceIdError,
    configPathError,
    mediaPathError,
    // 派生
    selectedHardwareIds,
    hasAnyHardware,
    activePortIds,
    generatedYaml,
    // 操作
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
  };
}
