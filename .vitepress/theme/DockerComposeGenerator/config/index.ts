import type { DeviceConfig, HardwareOption, PortConfig } from "./types";

/**
 * 统一的 Docker Compose 生成器配置。
 *
 * 新增设备 / 硬件加速项 / 端口时，只需要在这里追加一条配置，
 * 生成逻辑与 UI 会自动适配。
 */

/** 图标使用 CSS background-image 时的公共样式 */
const backgroundIcon = (
  size: string,
  position = "center",
  repeat = "no-repeat"
): Record<string, string> => ({
  backgroundSize: size,
  backgroundPosition: position,
  backgroundRepeat: repeat,
});

const APPLE_LOGO =
  '<svg viewBox="0 0 14 44" xmlns="http://www.w3.org/2000/svg"><path d="m13.0729 17.6825a3.61 3.61 0 0 0 -1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1 -1.0948 2.2618c-.6816.9812-1.3943 1.9623-2.4787 1.9623s-1.3633-.63-2.613-.63c-1.2187 0-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842 9.7842 0 0 1 -1.6628-5.2776c0-3.0984 2.014-4.7405 3.9969-4.7405 1.0535 0 1.9314.6919 2.5924.6919.63 0 1.6112-.7333 2.8092-.7333a3.7579 3.7579 0 0 1 3.1604 1.5802zm-3.7284-2.8918a3.5615 3.5615 0 0 0 .8469-2.22 1.5353 1.5353 0 0 0 -.031-.32 3.5686 3.5686 0 0 0 -2.3445 1.2084 3.4629 3.4629 0 0 0 -.8779 2.1585 1.419 1.419 0 0 0 .031.2892 1.19 1.19 0 0 0 .2169.0207 3.0935 3.0935 0 0 0 2.1586-1.1368z"></path></svg>';

// ---------------------------------------------------------------------------
// 设备
// ---------------------------------------------------------------------------

export const devices: DeviceConfig[] = [
  {
    id: "stable",
    name: "标准 x86_64",
    description: "通用 PC / 服务器",
    icon: "💻",
    imageTag: "stable",
    autoHardware: [],
  },
  {
    id: "intel",
    name: "Intel 设备",
    description: "Intel GPU / NPU",
    icon: "/assets/intel-header-logo.svg",
    iconDark: "/assets/intel-header-logo-homepage.svg",
    iconStyle: backgroundIcon("90% 55%"),
    iconDarkStyle: backgroundIcon("90% 55%"),
    imageTag: "stable",
    autoHardware: ["gpu", "intelNpu"],
    helpText: "Intel 设备会自动配置 /dev/dri 与 /dev/accel 设备映射。",
    helpType: "info",
  },
  {
    id: "stable-tensorrt",
    name: "NVIDIA GPU",
    description: "TensorRT 加速",
    icon: "/assets/nvidia.png",
    iconStyle: backgroundIcon("100% 120%"),
    imageTag: "stable-tensorrt",
    autoHardware: [],
    helpText:
      "需要安装 [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker) 才能正常运行。使用 NVIDIA GPU 时会自动配置 GPU 部署参数（deploy.resources）。",
    helpType: "warning",
    needsNvidiaConfig: true,
  },
  {
    id: "stable-tensorrt-jp6",
    name: "NVIDIA Jetson",
    description: "Jetson 开发板",
    icon: "/assets/nvidia.png",
    iconStyle: backgroundIcon("100% 120%"),
    imageTag: "stable-tensorrt-jp6",
    autoHardware: [],
    helpText: "NVIDIA Jetson 设备会自动配置 runtime: nvidia。",
    helpType: "info",
    runtime: "nvidia",
  },
  {
    id: "stable-rocm",
    name: "AMD GPU",
    description: "ROCm 加速",
    icon: "/assets/AMD_E_Blk_RGB.png",
    iconDark: "/assets/AMD_E_Wh_RGB.png",
    iconStyle: backgroundIcon("365% 95%", "right center"),
    iconDarkStyle: backgroundIcon("365% 95%", "right center"),
    imageTag: "stable-rocm",
    autoHardware: ["gpu"],
    helpText:
      "AMD GPU 会自动配置 LIBVA_DRIVER_NAME 环境变量和 /dev/dri 设备映射。",
    helpType: "info",
    env: {
      LIBVA_DRIVER_NAME: "radeonsi",
    },
  },
  {
    id: "apple-silicon",
    name: "Apple Silicon",
    description: "Mac M 系列处理器",
    icon: APPLE_LOGO,
    svgStyle: { width: "18px", height: "40px" },
    imageTag: "stable",
    imageTagSuffix: "-standard-arm64",
    autoHardware: [],
    helpText:
      "Apple Silicon（M 系列处理器）需要额外安装使用[外部检测器](/configuration/object_detectors#apple-silicon-detector)。",
    helpType: "warning",
    extraHosts: ["host.docker.internal:host-gateway"],
  },
  {
    id: "raspberry-pi",
    name: "树莓派",
    description: "ARM 设备",
    icon: "🍓",
    imageTag: "stable",
    imageTagSuffix: "-standard-arm64",
    autoHardware: ["video11"],
    helpText: "树莓派会自动配置 video11 设备（树莓派 4B）并使用 arm64 镜像。",
    helpType: "info",
  },
  {
    id: "stable-rk",
    name: "RockChip",
    description: "瑞芯微开发板",
    icon: "/assets/rockchip.png",
    iconStyle: backgroundIcon("contain"),
    imageTag: "stable-rk",
    autoHardware: ["gpu"],
    helpText: "瑞芯微设备会自动配置 /dev/dri 等设备映射。",
    helpType: "info",
    devices: [
      { host: "/dev/dma_heap", comment: "RockChip DMA 堆" },
      { host: "/dev/rga", comment: "RockChip RGA" },
      { host: "/dev/mpp_service", comment: "RockChip MPP 服务" },
    ],
    volumes: [
      {
        host: "/sys/",
        container: "/sys/",
        readOnly: true,
        comment: "RockChip 系统信息",
      },
    ],
    securityOpt: ["apparmor=unconfined", "systempaths=unconfined"],
  },
  {
    id: "stable-synaptics",
    name: "昇锐 Synaptics",
    description: "Synaptics NPU",
    icon: "/assets/synaptics.png",
    iconStyle: backgroundIcon("contain"),
    imageTag: "stable-synaptics",
    autoHardware: [],
    helpText: "Synaptics 设备会自动配置 /dev/synap 和视频设备。",
    helpType: "info",
    devices: [
      { host: "/dev/synap", comment: "Synaptics NPU" },
      { host: "/dev/video0", comment: "视频设备 0" },
      { host: "/dev/video1", comment: "视频设备 1" },
    ],
  },
];

/** 按 ID 快速查找设备 */
export const deviceMap: Map<string, DeviceConfig> = new Map(
  devices.map((device) => [device.id, device])
);

// ---------------------------------------------------------------------------
// 通用硬件加速项
// ---------------------------------------------------------------------------

export const hardwareOptions: HardwareOption[] = [
  {
    id: "usbCoral",
    label: "USB Coral (TPU)",
    description:
      "如果你有使用 Google Coral USB 版 TPU，请启用此选项。其他 Coral 版本需要不同的设备路径。",
    disabledWhen: ["apple-silicon", "stable-synaptics"],
    devices: [
      {
        host: "/dev/bus/usb",
        container: "/dev/bus/usb",
        comment: "用于 USB Coral，其他版本需要修改",
      },
    ],
  },
  {
    id: "pcieCoral",
    label: "PCIe Coral (TPU)",
    description:
      "如果你有使用 Google Coral PCIe/M.2 版 TPU，请启用此选项。还需要额外[安装驱动](https://github.com/jnicolson/gasket-builder)。",
    disabledWhen: ["apple-silicon", "stable-synaptics"],
    devices: [
      {
        host: "/dev/apex_0",
        container: "/dev/apex_0",
        comment:
          "用于 PCIe Coral，请按照此处的驱动说明操作 https://github.com/jnicolson/gasket-builder",
      },
    ],
  },
  {
    id: "gpu",
    label: "GPU 加速 (/dev/dri)",
    description: "映射 /dev/dri 以启用 Intel/AMD GPU 硬件加速。",
    disabledWhen: ["stable-tensorrt-jp6", "apple-silicon"],
    devices: [
      {
        host: "/dev/dri",
        container: "/dev/dri",
        comment: "用于 GPU 硬件加速",
      },
    ],
  },
  {
    id: "intelNpu",
    label: "Intel NPU (/dev/accel)",
    description: "映射 /dev/accel 以启用 Intel NPU 加速。",
    disabledWhen: [
      "stable-tensorrt-jp6",
      "apple-silicon",
      "stable-rocm",
      "stable-rk",
      "stable-synaptics",
    ],
    devices: [
      { host: "/dev/accel", container: "/dev/accel", comment: "Intel NPU" },
    ],
  },
  {
    id: "hailo",
    label: "Hailo NPU (/dev/hailo0)",
    description:
      "映射 /dev/hailo0 以启用 Hailo-8 / Hailo-8L NPU 加速。还需要额外[安装驱动](#hailo-8)。",
    disabledWhen: ["apple-silicon", "stable-synaptics"],
    devices: [{ host: "/dev/hailo0", comment: "Hailo NPU" }],
  },
  {
    id: "memryx",
    label: "MemryX MX3 (/dev/memx0)",
    description:
      "映射 /dev/memx0 以启用 MemryX MX3 NPU 加速。还需要额外[安装驱动](#memryx-mx3)。",
    disabledWhen: ["apple-silicon", "stable-synaptics"],
    devices: [{ host: "/dev/memx0", comment: "MemryX MX3 NPU" }],
    volumes: [
      {
        host: "/run/mxa_manager",
        container: "/run/mxa_manager",
        comment: "MemryX 管理器",
      },
    ],
  },
  {
    id: "axera",
    label: "爱芯 AXERA 加速卡",
    description:
      "映射爱芯 AXERA 加速卡设备。需要先[安装 AXCL 驱动](#axera)。",
    disabledWhen: ["apple-silicon", "stable-synaptics"],
    devices: [
      { host: "/dev/axcl_host", comment: "AXERA 算力卡设备" },
      { host: "/dev/ax_mmb_dev", comment: "AXERA MMB 设备" },
      { host: "/dev/msg_userdev", comment: "AXERA 消息设备" },
    ],
    volumes: [
      { host: "/usr/bin/axcl", container: "/usr/bin/axcl", comment: "AXERA 二进制文件" },
      { host: "/usr/lib/axcl", container: "/usr/lib/axcl", comment: "AXERA 库文件" },
    ],
  },
  {
    id: "video11",
    label: "树莓派 (/dev/video11)",
    description: "映射 /dev/video11 以启用树莓派 4B 硬件加速。",
    disabledWhen: [
      "stable-tensorrt",
      "stable-tensorrt-jp6",
      "stable-rocm",
      "stable-rk",
      "stable-synaptics",
      "intel",
      "apple-silicon",
      "stable",
    ],
    devices: [
      { host: "/dev/video11", container: "/dev/video11", comment: "用于树莓派 4B" },
    ],
  },
];

/** 按 ID 快速查找硬件加速项 */
export const hardwareMap: Map<string, HardwareOption> = new Map(
  hardwareOptions.map((option) => [option.id, option])
);

// ---------------------------------------------------------------------------
// 端口
// ---------------------------------------------------------------------------

export const ports: PortConfig[] = [
  {
    id: "8971",
    host: 8971,
    container: 8971,
    protocol: "tcp",
    description: "带鉴权的 UI 与 API 访问端口，反向代理应使用此端口",
    defaultEnabled: true,
    warningType: "warning",
    warningContent:
      "这是 Frigate 的主要访问端口，关闭后将无法访问 Frigate 实例。",
    warningWhen: "unchecked",
  },
  {
    id: "8554",
    host: 8554,
    container: 8554,
    protocol: "tcp",
    description: "RTSP 视频流（go2rtc 转流）",
    defaultEnabled: true,
  },
  {
    id: "8555-tcp",
    host: 8555,
    container: 8555,
    protocol: "tcp",
    description: "基于 TCP 的 WebRTC",
    defaultEnabled: true,
  },
  {
    id: "8555-udp",
    host: 8555,
    container: 8555,
    protocol: "udp",
    description: "基于 UDP 的 WebRTC",
    defaultEnabled: true,
  },
  {
    id: "5000",
    host: 5000,
    container: 5000,
    protocol: "tcp",
    description: "内部无鉴权访问，仅建议在 Docker 网络内使用",
    defaultEnabled: false,
    badge: "⚠️ 谨慎暴露",
    warningType: "danger",
    warningContent:
      "你开启了 5000 端口暴露，这代表任何人可以直接访问你的 Frigate，不需要任何权限。在你拥有公网 IP（尤其是 IPv6）或者没有正确配置防火墙的情况下，这可能导致严重的安全风险，包括但不限于：**未经授权的访问**、**隐私数据泄露**、被攻击者利用进行进一步攻击等；即使你没有公开过你的机器地址，全球依然有很多爬虫能够自动发现你的实例。请确保你了解相关风险，并且在必要时采取适当的安全措施（如配置防火墙规则、使用 VPN 等）来保护你的系统安全。\n\n该端口应仅用于内网环境，并且配置防火墙禁止外部访问。如果你不知道如何配置防护，请不要开启该端口！",
    warningWhen: "checked",
    dangerConfirm: true,
  },
  {
    id: "1984",
    host: 1984,
    container: 1984,
    protocol: "tcp",
    description: "go2rtc Web UI",
    defaultEnabled: false,
  },
];

/** 按 ID 快速查找端口 */
export const portMap: Map<string, PortConfig> = new Map(
  ports.map((port) => [port.id, port])
);

export type {
  DeviceConfig,
  DeviceMapping,
  VolumeMapping,
  HardwareOption,
  PortConfig,
  NvidiaDeployConfig,
} from "./types";
