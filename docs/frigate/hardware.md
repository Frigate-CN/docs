---
id: hardware
title: 推荐硬件
---

## 摄像头

若摄像头可输出 H.264 编码的视频与 AAC 音频，便能最大限度兼容 Frigate 和 Home Assistant 的全部功能特性。要是摄像头还支持多子码流设置就更完美了，这样可以给物体检测、实时监控、录像存储分别设置不同的清晰度，避免因为格式转换影响设备性能。

建议使用支持RTSP流和ONVIF功能的摄像头，例如海康威视、~~TP-Link~~等。**不建议**选择萤石等**家用摄像头**，他们对于RTSP的支持并不完善；尤其是不要选择360老款、小米等不支持获取RTSP流的摄像头，它们无法接入到Frigate中。

:::warning

根据中文社区成员反馈，TP-Link国内版大部分摄像头的ONVIF协议并不标准，可能导致自动追踪、PTZ、双向通话等功能无法正常使用。

:::

如果条件允许的话，应**尽可能避免或谨慎选择**WiFi摄像头，其视频流稳定性较差，易导致连接中断或视频数据丢失。尤其是在有多路摄像头的情况下，传输稳定性会受到极大干扰，甚至会影响到你整个WiFi其他设备的使用。（中文相关讨论，需要使用代理访问：[https://www.v2ex.com/t/1126166](https://www.v2ex.com/t/1126166)）。如果你所在的地方WiFi干扰严重（即有非常多2.4G的WiFi，信道干扰严重），强烈建议你选择有线摄像头。


## 服务器

考虑到家用环境，建议使用N100等低功耗CPU的主机，否则你的电费可能会比以往高很多。这些在淘宝或者闲鱼上都能够找到不错的选择。但需要注意关注一下是否有额外的M.2或者PCIe接口，因为可以选配Hailo8 或者 Google Coral 这种AI加速器，能够极大的提升检测效率，并且耗电量相比独立显卡要低很多。当然，如果你需要监控的摄像头数量并不多（1-3路），只使用核显也能够满足需求。但请优先选择Intel的产品，根据社区反馈，AMD核显的配置较为繁琐。

务必使用Linux系统，例如unRAID、TrueNAS、飞牛等专门适配NAS的操作系统；也可以直接安装常规的Linux发行版，例如Ubuntu、Debian等。

需要注意的是，很多N100之类的低功耗迷你主机默认预装的是Windows系统，你可以参考 [入门指南](../guides/getting_started.md)，将系统换为Linux。


## 检测器
检测器是专为高效运行物体识别推理而优化的硬件设备。使用推荐检测器可显著降低检测延迟，并大幅提升每秒检测次数。Frigate的设计理念正是基于检测器硬件实现超低推理延迟——将TensorFlow任务卸载到专用检测器上，其速度可提升一个数量级，同时能极大降低CPU负载。

:::info

Frigate支持多种硬件平台的检测器方案：

**通用硬件**

- [Hailo](#hailo-8): Hailo8和Hailo8L AI加速模块有M.2接口版本及树莓派HAT扩展版本。Hailo8l参考价约为 **600元**。
  - [支持多种模型](/configuration/object_detectors#配置)
  - 最好使用 tiny/small 尺寸的模型

- [Google Coral EdgeTPU](#google-coral-tpu): Google Coral EdgeTPU 有USB/M.2两种版本。参考价约为 **250元**。
  - [主要支持 ssdlite 和 mobilenet 模型](/configuration/object_detectors#edge-tpu检测器)

**AMD**

- [ROCm](#rocm-amd-gpu): ROCm 能够在AMD显卡上运行，提供高效的检测功能
  - [支持一部分模型](/configuration/object_detectors#支持的模型-1)
  - 最好运行在AMD独显上

**Intel**

- [OpenVino](#openvino-intel): OpenVino 可以运行在 Intel Arc独立显卡、Intel 核显以及Intel的CPU
  - [支持大部分主流模型](/configuration/object_detectors#支持的模型)
  - 推荐使用tiny/small/medium尺寸的模型

**Nvidia**

- [TensortRT](#tensorrt-nvidia-gpu): TensorRT可以运行在Nvidia显卡和Jetson开发板上
  - [通过ONNX支持主流模型](/configuration/object_detectors#支持的模型-2)
  - 可流畅运行包括large在内各尺寸模型

**Rockchip**

- [RKNN](#rockchip-平台): 需搭载NPU的瑞芯微芯片
  - [支持少量模型](/configuration/object_detectors#支持的模型-5)
  - 专为低功耗设备优化，适合tiny/small模型

:::

### Hailo-8

Frigate可以使用Hailo-8或Hailo-8L AI加速器，包括集成了Hailo模块的树莓派5。Frigate会自动识别你的Hailo类型，并且能够在你没设置型号的情况下自动选择并选择模型。

**默认模型配置:**
- **Hailo-8L:** 默认模型为 **YOLOv6n**.
- **Hailo-8:** 默认模型为 **YOLOv6n**.

在实际环境中，即使你有多路摄像头，Frigate也能够表现出一致的性能。与树莓派相比，在x86平台上，Frigate能够获得更高的帧率、吞吐量和更低的延迟。

| 模型名称          | Hailo‑8 推理时间 | Hailo‑8L 推理时间 |
| ---------------- | ---------------------- | ----------------------- |
| ssd mobilenet v1 | ~ 6 ms                 | ~ 10 ms                 |
| yolov6n          | ~ 7 ms                 | ~ 11 ms                 |

### Google Coral TPU

Frigate 同时支持 USB 和 M.2 两种版本的 Google Coral 加速模块：
- USB版兼容性最佳，无需安装额外驱动，但缺少自动温控节流功能（长时间高负载可能降频）
- PCIe 和 M.2 需要安装对应的驱动才能运行，参考：https://coral.ai

单个 Coral 使用默认模型即可处理多路摄像头，能满足大多数用户需求。你可以根据 Frigate 报告的推理速度计算 Coral 的最大性能：

当推理速度为 10ms 时，你的 Coral 最高可处理 1000/10=100，即每秒 100 帧。如果你的检测帧率经常接近这个值，你可以调整动态检测遮罩降低检测区域，或考虑增加第二个Coral设备。

### OpenVINO - Intel

OpenVINO检测器类型支持在以下硬件平台上运行：

- 第六代Intel平台及更新版本（配备核显iGPU）
- 搭载Intel Arc显卡的x86架构主机
- 大多数现代AMD处理器（虽然Intel官方支持此平台）
- 通过CPU运行的x86和Arm64架构主机（通常不建议此方式）

:::note
Intel NPU 部署的实际效果根据社区反馈称[较为有限（英文社区讨论）]((https://github.com/blakeblackshear/frigate/discussions/13248#discussioncomment-12347357))，尽管官方目前尚未提供支持。

测试数据显示，NPU的处理性能仅与核显相当，甚至在某些场景下甚至表现更差。
:::

更多详细信息请参阅 [检测器文档](/configuration/object_detectors#openvino检测器)

推理速度因使用的CPU或GPU差异较大，以下是部分已知GPU的推理时间示例：

| 名称           | MobileNetV2 推理时间        | YOLO-NAS 推理时间          | RF-DETR 推理时间       | 注释                               |
| -------------- | -------------------------- | ------------------------- | ---------------------- | ---------------------------------- |
| Intel HD 530   | 15 - 35 ms                 |                           |                        | 只能运行一个检测器实例               |
| Intel HD 620   | 15 - 25 ms                 | 320: ~ 35 ms              |                        |                                    |
| Intel HD 630   | ~ 15 ms                    | 320: ~ 30 ms              |                        |                                    |
| Intel UHD 730  | ~ 10 ms                    | 320: ~ 19 ms 640: ~ 54 ms |                        |                                    |
| Intel UHD 770  | ~ 15 ms                    | 320: ~ 20 ms 640: ~ 46 ms |                        |                                    |
| Intel N100     | ~ 15 ms                    | 320: ~ 25 ms              |                        | 只能运行一个检测器实例               |
| Intel Iris XE  | ~ 10 ms                    | 320: ~ 18 ms 640: ~ 50 ms |                        |                                    |
| Intel Arc A380 | ~ 6 ms                     | 320: ~ 10 ms 640: ~ 22 ms | 336: 20 ms 448: 27 ms  |                                    |
| Intel Arc A750 | ~ 4 ms                     | 320: ~ 8 ms               |                        |                                    |

### TensorRT - Nvidia GPU

Frigate能够使用支持12.x系列CUDA库的NVIDIA GPU。

#### 最低硬件支持

本系统使用的是具有**次版本兼容性**的CUDA 12.x系列库。主机系统必须安装**最低版本号为 >=545 的驱动程序**，同时您的GPU需支持**计算能力（Compute Capability）5.0或更高版本**，这通常对应的是**Maxwell架构或更新的GPU**，具体可参考下方链接中的**NVIDIA GPU计算能力**。

请确保您的主机系统已安装 [nvidia-container-runtime](https://docs.docker.com/config/containers/resource_constraints/#access-an-nvidia-gpu)，这样才能将GPU设备透传给容器；同时主机上还需为当前GPU安装**兼容的驱动程序**。

较新的GPU架构（如支持INT8运算和Tensor Core的架构）具备更强大的特性，TensorRT可以充分利用这些优化能力。当模型转换为trt文件时，系统会针对您的硬件自动优化兼容的功能特性。当前提供的模型生成脚本中包含一个开关，可用于**启用或禁用FP16运算**。但如果您希望使用INT8优化等更新的特性，则需要进行额外的适配工作。

#### 兼容性参考资料

[NVIDIA TensorRT支持矩阵](https://docs.nvidia.com/deeplearning/tensorrt/archives/tensorrt-841/support-matrix/index.html)

[NVIDIA CUDA兼容性](https://docs.nvidia.com/deploy/cuda-compatibility/index.html)

[NVIDIA GPU计算能力](https://developer.nvidia.com/cuda-gpus)

推理速度会因GPU和所用模型的不同而有显著差异。
`tiny`的变体比对应的非tiny模型更快，以下是一些已知示例：

| Name            | YOLOv9 推理时间        | YOLO-NAS 推理时间          | RF-DETR 推理时间          |
| --------------- | --------------------- | ------------------------- | ------------------------- |
| RTX 3050        | t-320: 15 ms          | 320: ~ 10 ms 640: ~ 16 ms | Nano-320: ~ 12 ms      |
| RTX 3070        | t-320: 11 ms          | 320: ~ 8 ms 640: ~ 14 ms  | Nano-320: ~ 9 ms       |
| RTX A4000       |                       | 320: ~ 15 ms              |                        |
| Tesla P40       |                       | 320: ~ 105 ms             |                        |

### ROCm - AMD GPU

通过使用 [rocm](../configuration/object_detectors.md#amdrocm-gpu检测器) 检测器，Frigate可以工作在大部分AMD的显卡上。

| 型号      | YOLOv9 推理时间        | YOLO-NAS 推理时间          |
| --------- | --------------------- | ------------------------- |
| AMD 780M  | ~ 14 ms               | 320: ~ 25 ms 640: ~ 50 ms |
| AMD 8700G |                       | 320: ~ 20 ms 640: ~ 40 ms |

## 社区支持的检测器

### Nvidia Jetson

Frigate支持所有的Jetson开发板，从经济实惠的Jetson Nano到性能强劲的Jetson Orin AGX都有覆盖。能够通过专门的[编解码预设参数](/configuration/ffmpeg_presets#硬件加速预设)来[调用Jetson视频硬解码功能](/configuration/hardware_acceleration_video#nvidia-jetson系列)进行加速。如果还配置了[TensorRT检测器](/configuration/object_detectors#nvidia-tensorrt检测器)则会利用Jetson的GPU和DLA（深度学习加速器）执行目标检测任务。

推理速度会因YOLO模型、Jetson平台型号及NVPMode（GPU/DLA/EMC时钟频率）配置而异。大多数模型的典型推理时间为20-40毫秒。
DLA（深度学习加速器）相比GPU能效更高但速度略慢，因此启用DLA会降低功耗，但会轻微增加推理耗时。

### Rockchip 平台

Frigate 支持所有 Rockchip 开发板的硬件视频加速功能，但硬件目标检测仅限以下型号支持：

- RK3562
- RK3566
- RK3568
- RK3576
- RK3588

| Name            | YOLOv9 推理时间 | YOLO-NAS 推理时间     | YOLOx 推理时间      |
| --------------- | --------------------- | --------------------------- | ------------------------- |
| rk3588 3 cores  | ~ 35 ms               | small: ~ 20 ms med: ~ 30 ms | nano: 18 ms tiny: 20 ms   |
| rk3566 1 core   |                       | small: ~ 96 ms              |                           |


启用全部3个核心的RK3588芯片运行YOLO-NAS S模型时，典型推理时间为25-30毫秒。

## Frigate如何分配CPU和检测器的工作？（通俗说法）

就好比家里的监控要盯着院子，别让野猫进来捣乱。负责处理信息的小 C（也就是 CPU）和专门认东西的小识（也就是那个检测器），俩得搭伙干活。

小 C 自己不太会认东西，看见有动静，也分不清是野猫还是风吹树叶，得琢磨半天。但小识不一样，它对认猫这块特别拿手，扫一眼就知道是不是。可小识也就这一个本事，别的啥也干不了。

所以他俩就商量着分工：小 C 先盯着监控画面，只要瞅见有啥在动，赶紧拍张照给小识。小识一看，很快就能说清那是啥。虽说大部分时候都是瞎报，不是树影晃了就是塑料袋飞过去了，但这不，总算逮着一回真的野猫了，任务总算是完成了。

**提高摄像头分辨率会发生什么？**

可后来发现，院子里还是有野猫来过的痕迹，这咋回事啊？小 C 明明一直盯着的。查了监控才知道，原来是监控镜头不行，视野窄，还模糊，跟蒙了层灰似的，好多地方都没拍到。后来换了个清楚的大镜头，整个院子都能看得明明白白。

但问题也跟着来了。小 C 这边忙得够呛，因为要看的地方比以前大了好几倍，每个角落都得盯着，稍有点风吹草动就得拍照，手忙脚乱的。小识那边也不轻松，现在拍的照片清楚得很，细节太多了，它得一点点看，辨认是不是藏着野猫，比以前费劲多了。

其实这就跟调高监控分辨率一个道理，分辨率一高，小 C 要处理的东西就多了去了，累得不行。小识虽说厉害，可精力也有限，尤其家里摄像头多的时候，根本顾不过来。

所以 Frigate 就想了个办法，让小 C 先当 “哨兵”，就盯着有没有动静，只有发现有东西在动，再把画面给小识去仔细辨认。这样一来，就算家里装了好几个摄像头，也能盯得过来，俩也不至于被累垮。


## 使用 Coral 加速器时，硬件加速参数（hwaccel args）还有用吗？
当然有用！因为Coral并不能进行视频编解码工作。

解压视频流会消耗大量CPU资源。视频压缩使用关键帧（I帧）传输完整画面，后续帧只记录差异，CPU需要将差异帧与关键帧合并还原每一帧（[更多细节可参阅本文（英文）](https://blog.video.ibm.com/streaming-video-tips/keyframes-interframe-video-compression/)）。 更高分辨率和帧率意味着需要更多算力来解码视频流，因此建议直接在摄像头端设置合适参数以避免不必要的解码负担。