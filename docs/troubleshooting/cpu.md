---
id: cpu
title: CPU 占用过高
---

CPU 占用过高会影响 Frigate 的性能与响应速度。本文档解释如何解读 Frigate 报告的 CPU 值，并列出最有效的配置修改方案，帮助降低 CPU 消耗并优化资源使用。

## 理解 Frigate 报告的 CPU 使用率 {#understanding-frigates-reported-cpu-usage}

Frigate 报告的 CPU 百分比通常看起来比宿主机报告的要高很多。通常两个数字都是正确的，只是测量基准不同，因此在调优之前请先确认你确实遇到了问题。

### 各进程的值相对于单核

Frigate 为 FFmpeg、采集、检测、检测器等进程报告的值遵循与 `top` 相同的约定：100% 表示一个 CPU 核心已完全饱和，而非整个系统已饱和。FFmpeg 等多线程进程报告超过 100% 是正常现象。

宿主机和虚拟机管理工具则报告机器所有核心的总容量百分比。这包括 `docker stats`、`htop` 摘要、Proxmox 摘要图、Unraid 仪表板、Synology 资源监视器以及 Home Assistant 的系统监视器传感器。要将两者对应起来：

```
宿主机百分比 ≈ (Frigate 各进程百分比之和) / (核心数)
```

在 4 核系统上，FFmpeg 进程报告 100% 表示消耗了整台机器的四分之一，因此宿主机在包含其余 Frigate 进程后会显示约 25% 到 30%。同样的 100% 在 16 核系统上约为 6%。Frigate 自身的警告阈值也使用单核约定，因此 FFmpeg 进程在单核的 20% 时才会被标记，而不是系统 20%。

### 瞬时采样与平均值衡量不同的内容

Frigate 每 15 秒收集一次统计信息，`cpu` 值仅涵盖自上次采集以来的时间间隔。stats API 和 MQTT 负载中的 `cpu_average` 值是该进程整个生命周期内的平均值，也是高 CPU 使用率警告的依据。宿主机仪表板通常绘制较长时间窗口内平均的数据，因此单个 Frigate 采样可能显示宿主机图表永远不会显示的峰值。刚刚启动的进程（例如摄像头重连后的 FFmpeg）在被采样两次之前报告为 0。

### 系统级值取决于容器能看到的内容

系统 CPU 值从 `/proc/stat` 读取。在 Docker 下该文件属于宿主机，因此该值涵盖整个机器（包括与 Frigate 无关的工作负载），不会与 Frigate 容器的 `docker stats` 匹配。在 LXC 容器下，lxcfs 虚拟化了 `/proc/stat`，该值仅反映分配给容器的核心。在虚拟机中，客户机只能看到其分配的 vCPU，而虚拟机管理程序按节点上的每个物理线程进行划分，因此客户机和宿主机百分比即使都准确也不会一致。

## 1. 视频解码硬件加速 {#1-hardware-acceleration-for-video-decoding}
**优先级：关键**

视频解码是 Frigate 中最消耗 CPU 的任务之一。AI 加速器仅负责目标检测，不参与视频流解码。
硬件加速（hwaccel）会将解码工作卸载到 GPU 或专用视频解码硬件，**显著降低 CPU 占用**，并让同一台设备支持更多路摄像头。

### 核心概念 {#key-concepts}
**分辨率与帧率影响**：解码压力随分辨率和帧率**指数级增长**。
相同帧率下，一路 4K@30fps 流的处理需求约为 1080p 的 4 倍；帧率翻倍，解码负载也翻倍。
这就是多路高分辨率摄像头必须使用硬件加速的原因。

**硬件加速优势**：
- 大幅降低每路摄像头的 CPU 占用
- 同一硬件可支持 2–3 倍数量的摄像头
- 释放 CPU 资源用于移动检测及其他 Frigate 进程
- 降低系统发热与功耗

### 配置 {#configuration}
Frigate 为常见硬件加速场景提供了预设配置。
请根据你的硬件，在配置文件中设置 `hwaccel_args`，具体可参考[配置参考](/configuration/advanced/reference)与[快速入门指南](/guides/getting_started)。

### 硬件加速故障排查 {#troubleshooting-hardware-acceleration}
如果硬件加速不生效：
1. 查看 Frigate 日志中与 hwaccel 相关的 FFmpeg 错误
2. 确认硬件设备在容器内可正常访问
3. 确保摄像头流使用 H.264 或 H.265 编码（最常见）
4. 若自动检测失败，尝试切换不同预设
5. 确认宿主机已正确安装 GPU 驱动

## 2. 检测器选择与配置 {#2-detector-selection-and-configuration}
**优先级：关键**

为硬件选择合适的检测器，是影响检测性能**最重要**的因素。
检测器负责运行 AI 模型，识别视频帧中的目标。不同类型检测器的性能与硬件要求差异极大，详见[硬件文档](/frigate/hardware)。

### 理解检测器性能 {#understanding-detector-performance}
Frigate 会先做移动检测，再执行计算量大的目标检测，详见[移动检测文档](/configuration/motion_detection)。
检测到移动时，Frigate 会生成一个“区域”（调试界面中的绿色框）并发送给检测器。
检测器的推理速度决定了系统每秒能处理多少次检测。

**检测器容量计算**：
检测器的处理能力有限，单位为**每秒检测次数**。
若推理速度为 10ms，则检测器每秒可处理约 100 次检测（1000ms ÷ 10ms = 100）。
如果所有摄像头总需求超过该容量，会出现延迟、漏检或系统跟不上画面。

### 选择合适的检测器 {#choosing-the-right-detector}
不同检测器性能差异巨大，可查看[硬件文档](/frigate/hardware)中目标检测器的预期性能。

### 多检测器实例 {#multiple-detector-instances}
当单个检测器无法满足摄像头数量需求时，部分检测器（`openvino`、`onnx`）支持配置**多个检测器实例**来分担负载。
这对显存充足、可同时运行多个推理进程的 GPU 检测器尤其有用。

多检测器配置详见[目标检测器文档](/configuration/object_detectors)。

**需要添加第二个检测器的情况**：
- 即使在正常活动下，跳过帧率（Skipped FPS）持续大于 0

### 模型选择与优化 {#model-selection-and-optimization}
使用的模型对检测器性能影响极大。Frigate 为每种检测器提供了优化后的默认模型，你也可以自定义，详见[检测器文档](/configuration/object_detectors)。

**模型大小权衡**：
- 更小模型（320x320）：推理更快，Frigate 专门针对 320x320 模型做了优化
- 更大模型（640x640）：推理更慢，但对占据画面大部分的超大目标，精度可能更高

更多模型大小选择细节，请参见[选择模型大小](/configuration/object_detectors.md#choosing-a-model-size)。

## 3. 降低检测器 CPU 使用率 {#3-reducing-detector-cpu-usage}

**优先级：高**

**检测器 CPU 使用率**指标衡量的是将帧转换为模型期望的张量格式以及后处理模型输出所消耗的 CPU 时间。它不包含推理，因此即使你为物体检测配置了 GPU、NPU 或 Coral，该值也可能很高。

该指标随 Frigate 每秒运行的检测次数以及每次检测准备的开销而扩展。调整[画面变动检测](/configuration/motion_detection)通常是减少检测次数的首要建议。此外，你可以：

- **降低 `detect -> fps`。** 对于几乎所有摄像头，5 是推荐值。在 10 下运行会使符合条件的检测帧数翻倍，也是该指标最大的贡献因素之一。
- **使用 320x320 模型。** 640x640 模型的像素数是其 4 倍，每次推理需要转置、转换和复制更多的数据。
- **优先使用接受整数输入的模型。** 配置为 `input_dtype: float` 的模型需要先在 CPU 上每帧转换为 float32 并归一化。接受 `int` 输入的模型（如 Edge TPU 使用的 tflite 模型）则跳过此步骤。
- **不要将检测分辨率与模型分辨率匹配。** 检测流应与摄像头的宽高比匹配，例如 `1280x720`，而不是模型的输入尺寸。Frigate 自行裁剪和缩放运动区域，因此过大的检测流只会增加工作量。
- **调优静止目标行为。** 从未进入静止状态的目标会被持续重新检测。提高 `detect -> stationary -> interval` 会减少对已停靠目标进行检测的频率。参见[静止目标](/configuration/stationary_objects)。

添加[更多检测器实例](#multiple-detector-instances)可以将此工作分散到更多 CPU 核心上，但不会减少总 CPU 使用量。
