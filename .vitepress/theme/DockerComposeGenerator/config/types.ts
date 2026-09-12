/**
 * Docker Compose 配置生成器的类型定义。
 *
 * 所有设备、硬件加速项、端口都以声明式的方式定义，
 * 新增设备/硬件时只需要修改 `config/index.ts` 即可，
 * 无需改动生成逻辑与 UI 组件。
 */

/** 单个设备映射（例如 /dev/dri:/dev/dri） */
export interface DeviceMapping {
  /** 宿主机设备路径 */
  host: string;
  /** 容器内设备路径（省略时与宿主机一致） */
  container?: string;
  /** 该行的行内注释 */
  comment?: string;
}

/** 单个卷映射 */
export interface VolumeMapping {
  /** 宿主机路径 */
  host: string;
  /** 容器内路径 */
  container: string;
  /** 是否为只读挂载 */
  readOnly?: boolean;
  /** 行内注释 */
  comment?: string;
}

/** NVIDIA 的 deploy 配置 */
export interface NvidiaDeployConfig {
  /** "all" 或具体的 GPU 数量 */
  count: string;
  /** 具体的 GPU 设备 ID（当 count 为数字时使用） */
  deviceIds?: string[];
}

/** 设备类型完整定义 */
export interface DeviceConfig {
  /** 唯一标识，例如 "intel" */
  id: string;
  /** 展示名称，例如 "Intel 设备" */
  name: string;
  /** 简短描述 */
  description: string;
  /**
   * 设备卡片图标，支持：
   * - Emoji 文本（例如 "💻"）
   * - 图片地址（例如 "/assets/nvidia.png"、"/assets/intel.svg"）
   * - 内联 SVG（例如 "<svg>...</svg>"）
   */
  icon: string;
  /**
   * 应用到图标容器上的额外 CSS 样式。
   * - 图片图标：只要包含 `background-*` 属性（如 `backgroundSize`），
   *   就会以 CSS `background-image` 的方式渲染，从而可以精细控制缩放与位置；
   *   否则渲染为 `<img>` 标签。
   * - Emoji / SVG 图标：样式应用到容器 div 上。
   */
  iconStyle?: Record<string, string>;
  /**
   * 内联 SVG 图标时，直接应用到内部 `<svg>` 元素上的样式
   * （通过 CSS 变量实现），可用来覆盖默认的 `width: 100%; height: 100%`
   * 或设置 `fill`、`transform` 等。对 Emoji / 图片图标无效。
   */
  svgStyle?: Record<string, string>;
  /** 深色模式下的图标，格式与 `icon` 相同 */
  iconDark?: string;
  /** 深色模式图标容器的额外样式 */
  iconDarkStyle?: Record<string, string>;
  /** 深色模式下 SVG 的样式，会覆盖 `svgStyle` */
  svgDarkStyle?: Record<string, string>;
  /** Docker 镜像标签，例如 "stable" */
  imageTag: string;
  /**
   * 追加到基础标签后的后缀。
   * 例如 "-standard-arm64" 会生成 "stable-standard-arm64"
   */
  imageTagSuffix?: string;
  /** 选中该设备时自动启用的硬件加速项 ID */
  autoHardware: string[];
  /** 选中该设备时展示的说明（支持 [文字](链接) 语法） */
  helpText?: string;
  /** 说明使用的提示框类型 */
  helpType?: "info" | "warning" | "danger";
  /** 该设备固定添加的设备映射 */
  devices?: DeviceMapping[];
  /** 该设备固定添加的卷映射 */
  volumes?: VolumeMapping[];
  /** 该设备固定添加的环境变量 */
  env?: Record<string, string>;
  /** NVIDIA deploy 配置（仅 tensorrt 使用） */
  nvidiaDeploy?: NvidiaDeployConfig;
  /** 运行时设置，例如 Jetson 的 "nvidia" */
  runtime?: string;
  /** 额外的 hosts 条目，例如 "host.docker.internal:host-gateway" */
  extraHosts?: string[];
  /** 安全选项，例如 ["apparmor=unconfined"] */
  securityOpt?: string[];
  /** 该设备是否需要展示 NVIDIA GPU 配置界面 */
  needsNvidiaConfig?: boolean;
}

/** 通用硬件加速项定义 */
export interface HardwareOption {
  /** 唯一标识，例如 "usbCoral" */
  id: string;
  /** 展示名称 */
  label: string;
  /** 勾选后展示的说明，支持 [文字](链接) 语法 */
  description?: string;
  /** 选中这些设备时该项被禁用 */
  disabledWhen?: string[];
  /** 勾选后添加的设备映射 */
  devices?: DeviceMapping[];
  /** 勾选后添加的卷映射 */
  volumes?: VolumeMapping[];
  /** 勾选后添加的环境变量 */
  env?: Record<string, string>;
}

/** 端口定义 */
export interface PortConfig {
  /** 唯一标识 */
  id: string;
  /** 宿主机端口 */
  host: number;
  /** 容器内端口 */
  container: number;
  /** 协议 */
  protocol?: "tcp" | "udp";
  /** 端口用途说明 */
  description: string;
  /** 是否默认开启 */
  defaultEnabled: boolean;
  /** 是否锁定（始终开启，不可关闭） */
  locked?: boolean;
  /** 提示框类型 */
  warningType?: "warning" | "danger";
  /** 提示内容（支持 Markdown） */
  warningContent?: string;
  /** 何时展示提示：勾选时或取消勾选时 */
  warningWhen?: "checked" | "unchecked";
  /** 在端口名称后展示的角标（例如 "⚠️ 谨慎暴露"） */
  badge?: string;
  /**
   * 高风险端口：勾选后需要等待冷却倒计时结束，
   * 再手动确认一次才会真正写入配置。
   */
  dangerConfirm?: boolean;
}
