import type {
  DeviceConfig,
  DeviceMapping,
  VolumeMapping,
} from "../config/types";
import { hardwareMap } from "../config";

/** 镜像来源：国内加速镜像 / 官方镜像 */
export type ImageSource = "cnb" | "official";

/** 网络模式：bridge 使用端口映射，host 直接使用宿主机网络 */
export type NetworkMode = "bridge" | "host";

/** 国内加速镜像地址 */
export const MIRROR_IMAGE_PREFIX = "docker.cnb.cool/frigate-cn/frigate";

/** 官方镜像地址 */
export const OFFICIAL_IMAGE_PREFIX = "ghcr.io/blakeblackshear/frigate";

// ---------------------------------------------------------------------------
// 输入
// ---------------------------------------------------------------------------

export interface GeneratorInput {
  device: DeviceConfig;
  /** 已勾选的硬件加速项 ID（调用方需自行过滤被设备禁用的项） */
  selectedHardware: string[];
  /** 已启用端口的完整 YAML 行（含缩进与注释） */
  enabledPorts: string[];
  configPath: string;
  mediaPath: string;
  rtspPassword?: string;
  timezone: string;
  shmSize: string;
  imageSource: ImageSource;
  networkMode: NetworkMode;
  nvidiaGpuCount?: string;
  nvidiaGpuDeviceId?: string;
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

function deviceLine(mapping: DeviceMapping): string {
  const target = mapping.container ?? mapping.host;
  const expr = mapping.host === target ? mapping.host : `${mapping.host}:${target}`;
  const comment = mapping.comment ? ` # ${mapping.comment}` : "";
  return `      - ${expr}${comment}`;
}

function volumeLine(mapping: VolumeMapping): string {
  const ro = mapping.readOnly ? ":ro" : "";
  const comment = mapping.comment ? ` # ${mapping.comment}` : "";
  return `      - ${mapping.host}:${mapping.container}${ro}${comment}`;
}

// ---------------------------------------------------------------------------
// YAML 各片段构建
// ---------------------------------------------------------------------------

function buildImage(device: DeviceConfig, imageSource: ImageSource): string[] {
  const tag = device.imageTagSuffix
    ? `${device.imageTag}${device.imageTagSuffix}`
    : device.imageTag;

  if (imageSource === "cnb") {
    return [
      `    image: ${MIRROR_IMAGE_PREFIX}:${tag} # 此处为国内镜像源地址，原地址为 ${OFFICIAL_IMAGE_PREFIX}:${tag}`,
    ];
  }
  return [`    image: ${OFFICIAL_IMAGE_PREFIX}:${tag}`];
}

function buildDevices(
  device: DeviceConfig,
  hwDevices: DeviceMapping[]
): string[] {
  const all: DeviceMapping[] = [...(device.devices ?? []), ...hwDevices];
  if (all.length === 0) return [];
  return ["    devices:", ...all.map(deviceLine)];
}

function buildVolumes(
  device: DeviceConfig,
  hwVolumes: VolumeMapping[],
  configPath: string,
  mediaPath: string
): string[] {
  const all: VolumeMapping[] = [...(device.volumes ?? []), ...hwVolumes];
  return [
    "    volumes:",
    "      - /etc/localtime:/etc/localtime:ro # 同步宿主机时间",
    `      - ${configPath}:/config # "${configPath}" 为你宿主机上存放配置文件的路径`,
    `      - ${mediaPath}:/media/frigate # "${mediaPath}" 为你宿主机上存放监控录像文件的路径`,
    "      - type: tmpfs # 使用 1GB 内存作为录制片段存储的临时存储",
    "        target: /tmp/cache",
    "        tmpfs:",
    "          size: 1000000000",
    ...all.map(volumeLine),
  ];
}

function buildNetwork(input: GeneratorInput): string[] {
  // host 网络模式与端口映射互斥，不能同时存在
  if (input.networkMode === "host") {
    return ["    network_mode: host"];
  }
  return ["    ports:", ...input.enabledPorts];
}

function buildDeploy(device: DeviceConfig, input: GeneratorInput): string[] {
  if (device.id !== "stable-tensorrt") return [];

  const count = input.nvidiaGpuCount || "all";
  const isAll = count === "all";
  const deviceId = input.nvidiaGpuDeviceId?.trim();

  const head = [
    "    deploy:",
    "      resources:",
    "        reservations:",
    "          devices:",
    "            - driver: nvidia",
  ];

  if (isAll) {
    return [
      ...head,
      "              count: all # 使用所有 GPU",
      "              capabilities: [gpu]",
    ];
  }

  if (deviceId) {
    const ids = deviceId
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `'${s}'`)
      .join(", ");
    return [
      ...head,
      `              device_ids: [${ids}] # GPU 设备 ID 列表`,
      `              count: ${count} # GPU 数量`,
      "              capabilities: [gpu]",
    ];
  }

  return [
    ...head,
    `              count: ${count} # GPU 数量`,
    "              capabilities: [gpu]",
  ];
}

function buildRuntime(device: DeviceConfig): string[] {
  return device.runtime ? [`    runtime: ${device.runtime}`] : [];
}

function buildExtraHosts(device: DeviceConfig): string[] {
  if (!device.extraHosts?.length) return [];
  return [
    "    extra_hosts:",
    "      # 此项配置至关重要",
    "      # 允许 Frigate 通过 Apple Silicon Detector 访问苹果芯片的 NPU",
    ...device.extraHosts.map(
      (host) => `      - "${host}" # 访问 NPU 检测器的必要配置`
    ),
  ];
}

function buildSecurityOpt(device: DeviceConfig): string[] {
  if (!device.securityOpt?.length) return [];
  return [
    "    security_opt:",
    ...device.securityOpt.map((opt) => `      - ${opt}`),
  ];
}

function buildEnvironment(
  device: DeviceConfig,
  hwEnv: Record<string, string>,
  input: GeneratorInput
): string[] {
  const lines: string[] = ["    environment:"];

  if (input.rtspPassword) {
    lines.push(
      `      FRIGATE_RTSP_PASSWORD: "${input.rtspPassword}" # RTSP 的密码，请修改为你期望的密码`
    );
  }

  lines.push(`      TZ: "${input.timezone}" # 设置为中国 +8 时区 [!code highlight]`);

  if (input.imageSource === "cnb") {
    lines.push(
      '      HF_ENDPOINT: "https://huggingface.mirror.frigate-cn.video" # 由我们提供的 Huggingface 国内镜像源，提供 Frigate 需要用到的部分模型加速下载 [!code highlight]'
    );
    lines.push(
      '      GITHUB_ENDPOINT: "https://github.mirror.frigate-cn.video" # 由我们提供的 GitHub 国内镜像源，提供 Frigate 需要用到的部分模型加速下载 [!code highlight]'
    );
    lines.push(
      "      TF_KERAS_MOBILENET_V2_WEIGHTS_URL: https://cnb.cool/frigate-cn/mirrors/storage.googleapis/-/git/raw/main/tensorflow/keras-applications/mobilenet_v2/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_0.35_224_no_top.h5 # 分类模型需要的权重文件 [!code highlight]"
    );
  }

  const allEnv: Record<string, string> = {
    ...hwEnv,
    ...(device.env ?? {}),
  };
  for (const [key, value] of Object.entries(allEnv)) {
    lines.push(`      ${key}: "${value}"`);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// 对外 API
// ---------------------------------------------------------------------------

/**
 * 根据当前选择生成 docker-compose YAML 字符串。
 * 输出为纯 YAML（带行内注释），其中 `[!code highlight]` 供 Shiki 高亮使用。
 */
export function generateDockerCompose(input: GeneratorInput): string {
  const { device } = input;

  const hwDevices: DeviceMapping[] = [];
  const hwVolumes: VolumeMapping[] = [];
  const hwEnv: Record<string, string> = {};

  for (const hwId of input.selectedHardware) {
    const option = hardwareMap.get(hwId);
    if (!option) continue;
    // tensorrt 镜像通过 deploy 使用 GPU，无需再映射 /dev/dri
    if (option.id === "gpu" && device.imageTag === "stable-tensorrt") continue;
    hwDevices.push(...(option.devices ?? []));
    hwVolumes.push(...(option.volumes ?? []));
    Object.assign(hwEnv, option.env ?? {});
  }

  const lines: string[] = [
    "services:",
    "  frigate:",
    "    container_name: frigate",
    "    privileged: true # 使用特权模式",
    "    restart: unless-stopped",
    "    stop_grace_period: 30s # 为各服务提供足够的关闭时间",
    ...buildImage(device, input.imageSource),
    `    shm_size: "${input.shmSize || "512mb"}" # 根据上述计算结果为你的摄像头更新此值`,
    ...buildRuntime(device),
    ...buildDeploy(device, input),
    ...buildExtraHosts(device),
    ...buildSecurityOpt(device),
    ...buildDevices(device, hwDevices),
    ...buildVolumes(device, hwVolumes, input.configPath, input.mediaPath),
    ...buildNetwork(input),
    ...buildEnvironment(device, hwEnv, input),
  ];

  return lines.join("\n");
}

/** 移除 Shiki 高亮标记，得到可直接复制的纯 YAML */
export function stripHighlightNotation(yaml: string): string {
  return yaml.replace(/\s*\[!code[^\]]*\]/g, "");
}
