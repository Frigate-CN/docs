---
id: object_detectors
title: 物体/目标检测器
---

import ConfigTabs from '@site/src/components/ConfigTabs';
import TabItem from '@theme/TabItem';
import NavPath from '@site/src/components/NavPath';
import ModelConfigDropdown from '@site/src/components/ModelConfigDropdown';
import objectDetectorsModels from '@site/data/object_detectors_models.json';

### 支持的硬件

目标检测是 Frigate 用来识别摄像头视野中_什么_内容——人、车、动物等——的能力，而非仅仅对像素变化做出反应。当 Frigate 的画面变动检测在一帧中发现活动时，该区域会被发送到**目标检测器**，检测器返回它识别到的目标及其位置和置信度分数。这些检测结果驱动追踪目标、警报、检测和通知。

目标检测计算量大，因此 Frigate 被设计为在专用的 AI 加速器或 GPU 上运行，而非 CPU。**检测器**是 Frigate 用来运行推理的特定硬件和模型后端。选择与你硬件匹配的检测器是获得良好性能的最重要步骤之一，正确的选择取决于 Frigate 运行在什么设备上。

:::info

Frigate 支持多种不同类型的检测器，可在不同硬件上运行：

**通用硬件**

- [Coral EdgeTPU](#edge-tpu-detector)：Google Coral EdgeTPU 提供 USB、Mini PCIe 和 m.2 三种接口，兼容多种设备。
- [Hailo](#hailo-8)：Hailo8 和 Hailo8L AI 加速模块提供 m.2 接口和树莓派 HAT，兼容多种设备。
- <Badge text="社区支持" type="warning" /> [MemryX](#memryx-mx3)：MX3 加速模块提供 m.2 接口版本，为各种平台提供广泛的兼容性。
- <Badge text="社区支持" type="warning" /> [DeGirum](#degirum)：用于在云端或本地使用硬件设备的服务。硬件和模型在[其网站](https://hub.degirum.com)上提供。
- <Badge text="社区支持" type="warning" /> [AXERA](#axera)：高效的边缘计算模块。

<i><img src="/assets/AMD_E_Wh_RGB.png" class="logo-icon-16"></i> **AMD**

- [ROCm](#amdrocm-gpu-detector)：ROCm 可在 AMD 独立显卡上运行，提供高效物体/目标检测。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，ROCm 会在`-rocm`版 Frigate 镜像中自动被检测并使用。

<i class="fa-brands fa-apple"></i> **Apple Silicon**

- [Apple Silicon](#apple-silicon-detector): Apple Silicon 可在 M1 以及更新的 Apple Silicon 设备上运行。

<i><img src="/assets/intel-header-logo-homepage.svg" class="logo-icon-16"></i> **Intel**

- [OpenVino](#openvino-detector)：OpenVino 可在 Intel Arc 显卡、核显和 CPU 上运行，提供高效的物体/目标检测。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，OpenVINO 会在默认 Frigate 镜像中自动被检测并使用。

<i><img src="/assets/nvidia.png" class="logo-icon-16"></i> **NVIDIA GPU**

- [ONNX](#onnx)：当配置了受支持的 ONNX 模型时，在-tensorrt Frigate 镜像中，TensorRT 将被自动检测并用作检测器。

**Nvidia Jetson** <Badge text="社区支持" type="warning" />

- [TensortRT](#nvidia-tensorrt-detector)：TensorRT 可在 Jetson 设备上运行，使用多种预设模型。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，TensorRT 会在`-tensorrt-jp6`版 Frigate 镜像中自动被检测并使用。

<i><img src="/assets/rockchip.png" class="logo-icon-16"></i> **瑞芯微 Rockchip** <Badge text="社区支持" type="warning" />

- [RKNN](#rockchip-platform)：RKNN 模型可在内置 NPU 的瑞芯微 Rockchip 设备上运行。

**Synaptics** <Badge text="社区支持" type="warning" />

- [Synaptics](#synaptics): Synap 模型可在配备内置 NPU 的 Synaptics 设备（例如 Astra Machina）上运行。

**AXERA** <Badge text="社区支持" type="warning" />

- [AXEngine](#axera): axmodels 可在 AXERA AI 加速设备上运行。

**测试用途**

- [CPU 检测器(不推荐实际使用)](#cpu-detector-not-recommended)：使用 CPU 运行 tflite 模型，不推荐使用，在大多数情况下使用 OpenVINO CPU 模式可获得更好效果。

:::

:::note

不能混合使用多种检测器进行物体/目标检测（例如：不能同时使用 OpenVINO 和 Coral EdgeTPU 进行物体/目标检测）。

当然，不影响其他需要使用硬件加速任务，如[语义搜索](./semantic_search.md)。

:::

### 选择模型大小

除了为你的硬件选择检测器外，你还需要选择模型的**输入分辨率**（如 `320x320` 或 `640x640`），以及对于 YOLOv9 等模型系列，还需选择**变体大小**（`tiny`、`small` 等）。两者都会影响准确性与你的硬件所能承受的推理时间之间的平衡。

**分辨率（320x320 vs 640x640）：** Frigate 针对 `320x320` 模型进行了优化，`320x320` 是绝大多数配置的最佳选择。Frigate 的设计专门通过从全帧中裁剪画面变动区域并在运行检测前放大该区域来弥补较小模型的不足，因此 `320x320` 模型实际上对小型和远距离目标_更优_——而非更差。`640x640` 模型速度更慢、资源消耗更大，其主要优势在于当许多目标分散在大面积区域时，可以在单次推理中容纳更多目标。近期版本的 Frigate 已改善对 `640x640` 模型的支持，但 `320x320` 仍然是几乎所有配置的推荐起点。

**变体大小（tiny/small/medium）：** 更大的变体准确性逐步提高但速度更慢。差异是否明显取决于你的具体摄像头和场景。一个好的经验法则是使用你的硬件在不跳过检测的情况下能运行的最大模型，你可以在界面的 <NavPath path="系统 > 指标 > 摄像头" /> 页面进行监控——更好的准确性只有在你的检测器能跟上所有摄像头的检测负载时才有意义。

**可接受的推理时间取决于你的硬件。** 推理时间本身并不能说明全部情况，因为不同硬件有不同的处理能力。GPU 可以同时运行同一模型的多个实例，因此约 30ms 的推理时间仍然可以跟上多个摄像头。Google Coral 只能运行模型的一个实例，因此需要更低的推理时间（约 10ms）才能跟上。

:::tip

最佳的检测准确性来自在与 Frigate 实际看到的图像相似的图像上训练的模型——即裁剪到关注区域的安全摄像头录像。你可以在此类图像上训练或微调自己的模型并作为自定义模型运行（参见下文各检测器章节），但 [Frigate+](/plus) 通过在你从自己的摄像头提交的图像上为你处理训练，使这一切变得更加简单。对于 YOLOv9，`s`（small）变体在 `320x320` 分辨率下是一个不错的起点。

:::

# 官方支持的检测器

Frigate 官方提供了数种支持的检测器类型。默认情况下，Frigate 会使用单个 CPU 检测器。其他检测器可能需要额外配置，如下所述。使用多个检测器时，它们会在专用进程中运行，但会从所有摄像头的公共检测请求队列中获取任务。

## Edge TPU 检测器 {#edge-tpu-detector}

Edge TPU 检测器类型运行 TensorFlow Lite 模型，利用 Google Coral 代理进行硬件加速。要配置 Edge TPU 检测器，将`"type"`属性设置为`"edgetpu"`。

Edge TPU 设备可使用`"device"`属性指定，参考[TensorFlow Lite Python API 文档](https://coral.ai/docs/edgetpu/multiple-edgetpu/#using-the-tensorflow-lite-python-api)。如果未设置，代理将使用它找到的第一个设备。

:::tip

如果未检测到 Edge TPU，请参阅[Edge TPU 常见故障排除步骤](/troubleshooting/edgetpu)。

:::

### 单个 USB Coral

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加**，将设备设置为 `usb`。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral:
    type: edgetpu
    device: usb
```

</TabItem>
</ConfigTabs>

### 多个 USB Coral

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加** 添加多个检测器，分别指定 `usb:0` 和 `usb:1` 作为设备。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral1:
    type: edgetpu
    device: usb:0
  coral2:
    type: edgetpu
    device: usb:1
```

</TabItem>
</ConfigTabs>

### 原生 Coral（开发板）

_警告：`v0.9.x`版本后可能有[兼容性问题](https://github.com/blakeblackshear/frigate/issues/1706)_

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加**，将设备字段留空。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral:
    type: edgetpu
    device: ""
```

</TabItem>
</ConfigTabs>

### 单个 PCIE/M.2 Coral

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加**，将设备设置为 `pci`。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral:
    type: edgetpu
    device: pci
```

</TabItem>
</ConfigTabs>

### 多个 PCIE/M.2 Coral

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加** 添加多个检测器，分别指定 `pci:0` 和 `pci:1` 作为设备。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral1:
    type: edgetpu
    device: pci:0
  coral2:
    type: edgetpu
    device: pci:1
```

</TabItem>
</ConfigTabs>

### 混合使用 Coral

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 系统 > 检测器和模型" />，从检测器类型下拉菜单中选择 **EdgeTPU**，然后点击 **添加** 添加多个具有不同设备类型的检测器（如 `usb` 和 `pci`）。

</TabItem>
<TabItem value="yaml">

```yaml
detectors:
  coral_usb:
    type: edgetpu
    device: usb
  coral_pci:
    type: edgetpu
    device: pci
```

</TabItem>
</ConfigTabs>

### 配置

<ModelConfigDropdown detectorTitle="EdgeTPU" models={objectDetectorsModels.edgeTPU.models} />

---

## Hailo-8 检测器 {#hailo-8}

Hailo-8 检测器支持 Hailo-8 和 Hailo-8L AI 加速模块。该集成会自动通过 Hailo CLI 检测你的硬件架构，如果未指定自定义模型，则会选择适当的默认模型。

有关配置 Hailo 硬件的详细信息，请参阅[安装文档](../frigate/installation.md#hailo-8)。

:::info

如果未提供自定义模型，Hailo 检测器会在首次启动时从 Hailo 模型库下载默认模型。缓存后，模型可完全离线使用。详见[网络要求](/frigate/network_requirements#hardware-specific-detector-models)。

:::

### 配置

配置 Hailo 检测器时，你有两种指定模型的方式：本地**路径**或**URL**。
如果同时提供两者，检测器将首先检查给定的本地路径。如果未找到文件，则会从指定的 URL 下载模型。模型文件缓存在`/config/model_cache/hailo`目录下。

<ModelConfigDropdown detectorTitle="Hailo-8/Hailo-8L" models={objectDetectorsModels.hailo8l.models} />

更多现成模型，请访问：https://github.com/hailo-ai/hailo_model_zoo

Hailo8 支持 Hailo 模型库中所有包含 HailoRT 后处理的模型。你可以选择任何这些预配置模型。

> **注意：**
> `config.path` 参数可以接受以 `.hef` 结尾的本地文件路径或 URL。当提供时，检测器将首先检查路径是否为本地文件路径。如果文件在本地存在，将直接使用。如果未找到本地文件或提供了 URL，则会尝试从指定 URL 下载模型。

---

## OpenVINO 检测器 {#openvino-detector}

OpenVINO 检测器可在 AMD CPU 和 Intel CPU、Intel GPU 以及 Intel NPU 上运行 OpenVINO IR 模型。要配置 OpenVINO 检测器，请将`"type"`属性设置为`"openvino"`。

使用的 OpenVINO 设备通过`device`属性指定，需遵循[设备文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes.html)中的命名规定。最常见的设备是 `CPU`、`GPU`以及 `NPU`。

OpenVINO 支持 第 6 代 Intel 平台（Skylake）以及更新的版本。虽然没有官方支持，但它也可以在 AMD CPU 上运行。使用 `GPU` 或 `NPU` 设备需要支持的 Intel 平台。有关详细的系统要求，请参阅[OpenVINO 系统要求](https://docs.openvino.ai/2025/about-openvino/release-notes-openvino/system-requirements.html)

:::tip

**NPU + GPU 的系统：** 如果你同时拥有可用的 NPU 和 GPU（例如 Intel 酷睿 Ultra 处理器），请使用 NPU 进行目标检测，使用 GPU 进行增强处理（语义搜索、人脸识别等），以获得最佳性能和兼容性。

当使用多个摄像头时，一个检测器可能无法满足需求。如果有可用的 GPU 资源，可以定义多个检测器。示例配置如下：

```yaml
detectors:
  ov_0:
    type: openvino
    device: GPU # 或 NPU
  ov_1:
    type: openvino
    device: GPU # 或 NPU
```

:::

### 配置

<ModelConfigDropdown detectorTitle="OpenVINO" models={objectDetectorsModels.openvino.models} />

---

## <i class="fa-brands fa-apple"></i> Apple Silicon 检测器 {#apple-silicon-detector}

Apple Silicon 中的 NPU 无法从容器内访问，因此必须先设置[Apple Silicon 检测器客户端](https://github.com/frigate-nvr/apple-silicon-detector)。建议使用带有`-standard-arm64`后缀的 Frigate docker 镜像，例如 `ghcr.io/blakeblackshear/frigate:stable-standard-arm64`。

### 设置

1. 下载并配置安装[Apple Silicon 检测器客户端](https://github.com/frigate-nvr/apple-silicon-detector)并运行客户端。
2. 在 Frigate 中配置检测器并启动 Frigate。

### 配置

使用下面的检测器配置将连接到客户端：

<ModelConfigDropdown detectorTitle="Apple Silicon" models={objectDetectorsModels.appleSilicon.models} />

注意：labelmap 使用的是完整 COCO 标签集的子集，仅包含 80 种类型的目标。

## AMD/ROCm GPU 检测器 {#amdrocm-gpu-detector}

### 设置

AMD GPU 的支持通过[ONNX 检测器](#onnx)提供。要使用 AMD GPU 进行物体/目标检测，请使用带有`-rocm`后缀的 Frigate docker 镜像，例如 `ghcr.io/blakeblackshear/frigate:stable-rocm`。

### Docker GPU 访问设置

ROCm 需要访问`/dev/kfd`和`/dev/dri`设备。当 docker 或 frigate 不以 root 身份运行时，还应添加`video`（可能还有`render`和`ssl/_ssl`）组。

直接使用 `docker run` 时，应添加以下标志以访问设备：

```bash
$ docker run --device=/dev/kfd --device=/dev/dri  \
    ...
```

使用 Docker Compose 时：

```yaml {4-6}
services:
  frigate:
    ...
    devices:
      - /dev/dri
      - /dev/kfd
```

有关推荐设置的参考，请参阅[在 Docker 中运行 ROCm/pytorch](https://rocm.docs.amd.com/projects/install-on-linux/en/develop/how-to/3rd-party/pytorch-install.html#using-docker-with-pytorch-pre-installed)。

### 覆盖 GPU 芯片组的 Docker 设置

你的 GPU 可能无需特殊配置即可正常工作，但在许多情况下需要手动调整一些配置。因为 AMD/ROCm 自带的 GPU 驱动程序集并不完整，对于较新或缺失的型号，你需要将芯片组版本覆盖为较旧/通用版本才能使其工作。

此外，AMD/ROCm 没有"官方正式"支持核显。它仍然可以与大多数核显正常工作，但需要特殊设置。必须配置`HSA_OVERRIDE_GFX_VERSION`环境变量。有关背景和示例，请参阅[ROCm 问题报告](https://github.com/ROCm/ROCm/issues/1743)。

对于 rocm frigate 构建，有一些自动检测：

- gfx1031 -> 10.3.0
- gfx1103 -> 11.0.0

如果你有其他芯片组，可能需要在 Docker 启动时覆盖`HSA_OVERRIDE_GFX_VERSION`。假设你需要的版本是`10.0.0`，则应从命令行配置为：

```bash
$ docker run -e HSA_OVERRIDE_GFX_VERSION=10.0.0 \
    ...
```

使用 Docker Compose 时：

```yaml {4-5}
services:
  frigate:
    ...
    environment:
      HSA_OVERRIDE_GFX_VERSION: "10.0.0"
```

确定你需要的版本可能很复杂，因为你无法从 AMD 品牌名称中判断芯片组名称和驱动程序。

1. 首先通过在 frigate 容器中运行`/opt/rocm/bin/rocminfo`确保 rocm 环境正常运行 - 它应该列出 CPU 和 GPU 及其属性
2. 从`rocminfo`的输出中找到你拥有的芯片组版本（格式为 gfxNNN，N 为数字）（见下文）
3. 使用搜索引擎查询给定 gfx 名称所需的`HSA_OVERRIDE_GFX_VERSION`("gfxNNN ROCm HSA_OVERRIDE_GFX_VERSION")
4. 用相关值覆盖`HSA_OVERRIDE_GFX_VERSION`
5. 如果仍然无法工作，请检查 frigate docker 日志

#### 检查 AMD/ROCm 是否正常工作并找到你的 GPU

```bash
$ docker exec -it frigate /opt/rocm/bin/rocminfo
```

#### 确定你的 AMD GPU 芯片组版本

我们取消设置`HSA_OVERRIDE_GFX_VERSION`以防止现有覆盖干扰结果：

```bash
$ docker exec -it frigate /bin/bash -c '(unset HSA_OVERRIDE_GFX_VERSION && /opt/rocm/bin/rocminfo |grep gfx)'
```

### 配置

:::tip

已知 AMD GPU 内核在将模型转换为 mxr 格式时存在问题。推荐的方法是：

1. 在配置中禁用目标检测。
2. 启动配置了 onnx 检测器的 Frigate，主要目标检测模型将被转换为 mxr 格式并缓存在配置目录中。
3. 日志显示转换完成后，在界面中启用目标检测并确认其正常工作。
4. 在配置中重新启用目标检测。

:::

有关支持的模型，请参阅 [ONNX 支持的模型](#onnx)，但有以下注意事项：

- 不支持 D-FINE / DEIMv2 模型
- 已知 YOLO-NAS 模型在核显上运行不佳

<ModelConfigDropdown detectorTitle="AMD ROCm" models={objectDetectorsModels.onnx.models} />

## ONNX

ONNX 是一种用于构建机器学习模型的开放格式，Frigate 支持在 CPU、OpenVINO、ROCm 和 TensorRT 上运行 ONNX 模型。启动时，Frigate 会自动尝试使用可用的 GPU。

:::info

如果使用了适合你 GPU 的正确构建版本，GPU 将被自动检测并使用。

- **AMD**
  - 在`-rocm`版 Frigate 镜像中，ROCm 会被自动检测并与 ONNX 检测器一起使用。

- **Intel**
  - 在标准 Frigate 镜像中，OpenVINO 会被自动检测并与 ONNX 检测器一起使用。

- **NVIDIA**
  - 在`-tensorrt`版 Frigate 镜像中，NVIDIA GPU 会被自动检测并与 ONNX 检测器一起使用。
  - 在`-tensorrt-jp6`版 Frigate 镜像中，Jetson 设备会被自动检测并与 ONNX 检测器一起使用。

:::

:::tip

当使用多个摄像头时，一个检测器可能无法满足需求。如果有可用的 GPU 资源，可以定义多个检测器。示例配置如下：

```yaml
detectors:
  onnx_0:
    type: onnx
  onnx_1:
    type: onnx
```

:::

### 配置

<ModelConfigDropdown detectorTitle="ONNX" models={objectDetectorsModels.onnx.models} />

---

## CPU 检测器(不推荐使用) {#cpu-detector-not-recommended}

CPU 检测器类型运行 TensorFlow Lite 模型，使用 CPU 进行处理而不使用硬件加速。建议使用硬件加速的检测器类型以获得更好的性能。要配置基于 CPU 的检测器，请将`"type"`属性设置为`"cpu"`。

:::danger

不建议将 CPU 检测器用于一般用途。如果你没有 GPU 或 Edge TPU 硬件，使用[OpenVINO 检测器](#openvino-detector)的 CPU 模式通常比使用 CPU 检测器更高效。

:::

可以通过`"num_threads"`属性指定解释器使用的线程数，默认为`3`。

容器中提供了位于`/cpu_model.tflite`的 TensorFlow Lite 模型，默认情况下此检测器类型使用该模型。要提供自己的模型，请将文件绑定挂载到容器中，并通过`model.path`提供路径。

### 配置

<ModelConfigDropdown detectorTitle="CPU" models={objectDetectorsModels.cpu.models} />

使用 CPU 检测器时，可以为每个摄像头添加一个 CPU 检测器。添加比摄像头数量更多的检测器不会提高性能。

## Deepstack / CodeProject.AI 服务器检测器

Frigate 的 Deepstack/CodeProject.AI 服务器检测器允许你将 Deepstack 和 CodeProject.AI 的物体/目标检测功能集成到 Frigate 中。CodeProject.AI 和 DeepStack 是开源 AI 平台，可以在各种设备上运行，如树莓派、NVIDIA Jetson 和其他兼容硬件。需要注意的是，集成是通过网络进行的，因此推理时间可能不如原生 Frigate 检测器快，但它仍然为物体/目标检测和追踪提供了高效可靠的解决方案。

### 设置

要开始使用 CodeProject.AI，请访问其[官方网站](https://www.codeproject.com/Articles/5322557/CodeProject-AI-Server-AI-the-easy-way)，按照说明在你选择的设备上下载并安装 AI 服务器。CodeProject.AI 的详细设置说明不在 Frigate 文档范围内。

要将 CodeProject.AI 集成到 Frigate 中，请按以下方式配置检测器：

### 配置

<ModelConfigDropdown detectorTitle="DeepStack" models={objectDetectorsModels.deepstack.models} />

将`<your_codeproject_ai_server_ip>`和`<port>`替换为你的 CodeProject.AI 服务器的 IP 地址和端口。

要验证集成是否正常工作，请启动 Frigate 并观察日志中是否有与 CodeProject.AI 相关的错误消息。此外，你可以检查 Frigate 网络界面，查看 CodeProject.AI 检测到的对象是否正确显示和追踪。

# 由社区支持的检测器

## MemryX MX3

此检测器可用于 MemryX MX3 加速器 M.2 模块。Frigate 在兼容硬件平台上支持 MX3，提供高效和高性能的物体检测。

有关配置 MemryX 硬件的信息，请参阅[安装文档](../frigate/installation.md#memryx-mx3)。

要配置 MemryX 检测器，只需将`type`属性设置为`memryx`并按照下面的配置指南。

### 配置

<ModelConfigDropdown detectorTitle="MemryX" models={objectDetectorsModels.memryx.models} />

#### 使用自定义模型

要使用你自己的自定义模型，首先需要将其编译为 [.dfp](https://developer.memryx.com/2p1/specs/files.html#dataflow-program) 文件，这是 MemryX 使用的格式。

#### 编译模型

自定义模型必须使用 **MemryX SDK 2.1** 编译。

在编译模型之前，请在**主机**上从 [安装工具](https://developer.memryx.com/2p1/get_started/install_tools.html) 页面安装 MemryX Neural Compiler 工具。

> **注意：** 建议在主机上或另一台独立机器上编译模型，而不是在 Frigate Docker 容器内编译。在 Docker 中安装编译器可能与容器包冲突。建议创建一个 Python 虚拟环境并在其中安装编译器。

设置好 SDK 2.1 环境后，按照 [MemryX 编译器](https://developer.memryx.com/2p1/tools/neural_compiler.html#usage) 文档编译你的模型。

示例：

```bash
mx_nc -m yolonas.onnx -c 4 --autocrop -v --dfp_fname yolonas.dfp
```

有关编译模型的详细说明，请参阅 [MemryX 编译器](https://developer.memryx.com/2p1/tools/neural_compiler.html#usage) 文档和[教程](https://developer.memryx.com/2p1/tutorials/tutorials.html)。

#### 打包编译好的模型

1.  将编译好的模型打包成 `.zip` 文件。

2.  `.zip` 文件必须包含编译好的 `.dfp` 文件。

3.  根据模型的不同，编译器可能还会生成裁剪的后处理网络。如果存在，将以 `_post.onnx` 为后缀命名。

4.  将 `.zip` 文件绑定挂载到容器中，并在配置中使用 `model.path` 指定其路径。

5.  更新 `labelmap_path` 以匹配自定义模型的标签。

```yaml
# 如果配置中未提供任何内容，检测器将自动选择默认模型。
#
# 或者，你可以指定本地模型路径作为 .zip 文件来覆盖默认值。
# 如果提供了本地路径且文件存在，将使用该文件而不是下载。
#
# 示例：
# path: /config/yolonas.zip
#
# .zip 文件必须包含：
# ├── yolonas.dfp          （以 .dfp 结尾的文件）
# └── yolonas_post.onnx    （可选；仅当模型包含裁剪的后处理网络时）
```

---

## NVIDIA TensorRT 检测器 {#nvidia-tensorrt-detector}

英伟达 Jetson 设备可使用 TensorRT 库进行目标检测。由于附加库的大小问题，此检测器仅在带有`-tensorrt-jp6`标签后缀的镜像中提供，例如 `ghcr.io/blakeblackshear/frigate:stable-tensorrt-jp6`。此检测器旨在与用于目标检测的 Yolo 模型配合使用。

### 生成模型

用于 TensorRT 的模型必须在其运行的同一硬件平台上进行预处理。这意味着每个用户都必须执行额外的设置，为 TensorRT 库生成模型文件。其中包含一个脚本，可构建几种常见的模型。

如果在启动时未找到指定的模型，Frigate 镜像将生成模型文件。已处理的模型存储在`/config/model_cache`文件夹中。通常，`/config`路径已映射到主机上的一个目录，除非用户希望将其存储在主机上的其他位置，否则无需单独映射`model_cache`。

默认情况下，不会生成任何模型，但可以通过在 Docker 中指定`YOLO_MODELS`环境变量来覆盖此设置。可以以逗号分隔的格式列出一个或多个模型，每个模型都将被生成。仅当`model_cache`文件夹中不存在相应的`{model}.trt`文件时，才会生成模型，因此，你可以通过从 Frigate 数据文件夹中删除模型文件，来强制重新生成模型。

如果你拥有带有 DLA（Xavier 或 Orin）的 Jetson 设备，可以通过在模型名称后附加`-dla`来生成将在 DLA 上运行的模型，例如指定`YOLO_MODELS=yolov7-320-dla`。该模型将在 DLA0 上运行（Frigate 目前不支持 DLA1）。与 DLA 不兼容的层将回退到在 GPU 上运行。

如果你的 GPU 不支持 FP16 操作，可以传递环境变量`USE_FP16=False`来禁用它。

可以通过向`docker run`命令或在`docker-compose.yml`文件中传递环境变量来选择特定的模型。使用`-e YOLO_MODELS=yolov4-416,yolov4-tiny-416`的形式来选择一个或多个模型名称。可用的模型如下所示。

<details>
<summary>可用模型</summary>

```
yolov3-288
yolov3-416
yolov3-608
yolov3-spp-288
yolov3-spp-416
yolov3-spp-608
yolov3-tiny-288
yolov3-tiny-416
yolov4-288
yolov4-416
yolov4-608
yolov4-csp-256
yolov4-csp-512
yolov4-p5-448
yolov4-p5-896
yolov4-tiny-288
yolov4-tiny-416
yolov4x-mish-320
yolov4x-mish-640
yolov7-tiny-288
yolov7-tiny-416
yolov7-640
yolov7-416
yolov7-320
yolov7x-640
yolov7x-320
```
</details>

为 Pascal 显卡转换`yolov4-608`和`yolov7x-640`模型的`docker-compose.yml`片段示例如下：

```yml
frigate:
  environment:
    - YOLO_MODELS=yolov7-320,yolov7x-640
    - USE_FP16=false
```

### 配置参数

通过将`tensorrt`指定为模型类型，可以选择 TensorRT 检测器。需要使用[硬件加速](hardware_acceleration_video.md#nvidia-gpu)部分所述的相同方法，将 GPU 透传到 Docker 容器。如果透传多个 GPU，可以使用`device`配置参数选择检测器使用哪个 GPU。`device`参数是 GPU 索引的整数值，可在容器内通过`nvidia-smi`查看。

TensorRT 检测器默认使用位于`/config/model_cache/tensorrt`中的`.trt`模型文件。所使用的模型路径和维度将取决于你生成的模型。

使用以下配置来处理生成的 TRT 模型：

<ModelConfigDropdown detectorTitle="TensorRT" models={objectDetectorsModels.tensorrt.models} />

## Synaptics

以下 SoC 支持硬件加速物体检测：

- SL1680

此实现使用[Synaptics 模型转换](https://synaptics-synap.github.io/doc/v/latest/docs/manual/introduction.html#offline-model-conversion)，版本 v3.1.0。

此实现基于 sdk `v1.5.0`。

有关配置 SL 系列 NPU 硬件的信息，请参阅[安装文档](../frigate/installation.md#synaptics)。

### 配置

配置 Synap 检测器时，你必须指定模型：本地**路径**。

<ModelConfigDropdown detectorTitle="Synaptics" models={objectDetectorsModels.synaptics.models} />

## 瑞芯微 Rockchip 平台检测器 {#rockchip-platform}

瑞芯微 Rockchip 平台支持以下 SoC 的硬件加速物体/目标检测：

- RK3562
- RK3566
- RK3568
- RK3576
- RK3588

该实现使用[Rockchip 的 RKNN-Toolkit2](https://github.com/airockchip/rknn-toolkit2/) v2.3.2 版本。

:::info

如果未提供自定义模型，RKNN 检测器会在首次启动时从 GitHub 下载默认模型。缓存后，模型可完全离线使用。详见[网络要求](/frigate/network_requirements#hardware-specific-detector-models)。

:::

:::tip

多摄像头场景下，单个检测器可能处理不过来。若 NPU 资源允许，可配置多个检测器，例如：

```yaml
detectors:
  rknn_0:
    type: rknn
    num_cores: 0
  rknn_1:
    type: rknn
    num_cores: 0
```

:::

### 前提条件

请确保按照[Rockchip 特定安装说明](/frigate/installation#rockchip-platform)进行操作。

:::tip

你可以通过以下命令查看 NPU 负载：

```bash
$ cat /sys/kernel/debug/rknpu/load
>> NPU load:  Core0:  0%, Core1:  0%, Core2:  0%,
```

:::

### RockChip 支持的模型

以下`config.yml`展示了配置检测器的所有相关选项并加以说明。除两处外，所有显示的值均为默认值。标记为"required"的行是使用检测器至少需要的配置，其他行均为可选。

以下推理时间是在 rk3588 上使用 3 个 NPU 核心测得的：

| 模型                  | 大小(MB) | 推理时间(ms) |
| --------------------- | -------- | ------------ |
| deci-fp16-yolonas_s   | 24       | 25           |
| deci-fp16-yolonas_m   | 62       | 35           |
| deci-fp16-yolonas_l   | 81       | 45           |
| frigate-fp16-yolov9-t | 6        | 35           |
| rock-i8-yolox_nano    | 3        | 14           |
| rock-i8_yolox_tiny    | 6        | 18           |

- 所有模型都会自动下载并存储在`config/model_cache/rknn_cache`文件夹中。升级 Frigate 后，应删除旧模型以释放空间。
- 你也可以提供自己的`.rknn`模型。请不要将自己的模型保存在`rknn_cache`文件夹中，应直接存储在`model_cache`文件夹或其他子文件夹中。要将模型转换为`.rknn`格式，请参阅`rknn-toolkit2`（需要 x86 机器）。注意，仅支持对特定模型进行后处理。

<ModelConfigDropdown detectorTitle="RKNN" models={objectDetectorsModels.rknn.models} />

### 将自定义 onnx 模型转换为 rknn 格式

要使用[rknn-toolkit2](https://github.com/airockchip/rknn-toolkit2/)将 onnx 模型转换为 rknn 格式，你需要：

1. 将一个或多个 onnx 格式的模型文件放置在 Docker 容器内的`config/model_cache/rknn_cache/onnx`目录下（可能需要`sudo`权限）
2. 将配置文件保存为`config/conv2rknn.yaml`（详见下文）
3. 运行`docker exec <此处填写frigate的容器ID> python3 /opt/conv2rknn.py`。如果转换成功，rknn 模型将被放置在`config/model_cache/rknn_cache`中

以下是需要根据你的 onnx 模型进行调整的配置文件范例：

```yaml
soc: ['rk3562', 'rk3566', 'rk3568', 'rk3576', 'rk3588']
quantization: false

output_name: '{input_basename}'

config:
  mean_values: [[0, 0, 0]]
  std_values: [[255, 255, 255]]
  quant_img_RGB2BGR: true
```

参数说明：

- `soc`: 要为其构建 rknn 模型的 SoC 列表。如果不指定此参数，脚本会尝试检测你的 SoC 并为其构建 rknn 模型
- `quantization`: `true`表示将进行 8 位整数(i8)量化，`false`表示为 16 位浮点(fp16)。默认值：`false`
- `output_name`: 模型的输出名称。可以使用下面几个变量：
  - `quant`: 根据配置为"i8"或"fp16"
  - `input_basename`: 输入模型的基本名称（例如，如果输入模型名为"my_model.onnx"，则为"my_model"）
  - `soc`: 模型构建的目标 SoC（如"rk3588"）
  - `tk_version`: `rknn-toolkit2`的版本（如"2.3.0"）
  - **示例**: 指定`output_name = "frigate-{quant}-{input_basename}-{soc}-v{tk_version}"`可能会生成名为`frigate-i8-my_model-rk3588-v2.3.0.rknn`的模型
- `config`: 传递给`rknn-toolkit2`进行模型转换的配置。所有可用参数的说明请参阅[本手册](https://github.com/MarcA711/rknn-toolkit2/releases/download/v2.3.2/03_Rockchip_RKNPU_API_Reference_RKNN_Toolkit2_V2.3.2_EN.pdf)的"2.2. 模型配置"部分

## DeGirum

DeGirum 可以使用[其网站](https://hub.degirum.com)上列出的任何类型硬件的检测器。DeGirum 可以通过 DeGirum AI 服务器或使用 `@local` 与本地硬件一起使用。你也可以直接连接到 DeGirum 的 AI Hub 来运行推理。**请注意：**此检测器_不能_用于商业目的。

### 配置

#### AI 服务器推理

在开始本部分的配置文件之前，你必须首先启动一个 AI 服务器。DeGirum 提供了一个可用的 AI 服务器作为 docker 容器。将此添加到你的 `docker-compose.yml` 以开始：

```yaml
degirum_detector:
  container_name: degirum
  image: degirum/aiserver:latest
  privileged: true
  ports:
    - '8778:8778'
```

只要相关运行时和驱动程序在你的机器上正确安装，所有支持的硬件都会在你的 AI 服务器主机上自动找到。如果你有任何问题，请参阅[DeGirum 文档站点](https://docs.degirum.com/pysdk/runtimes-and-drivers)。

完成后，按以下方式配置检测器：

<ModelConfigDropdown detectorTitle="DeGirum" models={objectDetectorsModels.degirumAiServer.models} />

在 `config.yml` 中设置模型类似于设置 AI 服务器。
你可以将其设置为：

- [AI Hub](https://hub.degirum.com)上列出的模型，前提是在你的检测器中列出了正确的库名称
  - 如果你选择这样做，正确的模型将在运行前下载到你的机器上。
- 作为库的本地目录。请参阅 DeGirum 文档站点[获取更多信息](https://docs.degirum.com/pysdk/user-guide-pysdk/organizing-models#model-zoo-directory-structure)。
- 某个 model.json 的路径。

```yaml
model:
  path: ./mobilenet_v2_ssd_coco--300x300_quant_n2x_orca1_1 # 模型 .json 和文件的目录
  width: 300 # 宽度在模型名称中作为"int"x"int"部分的第一个数字
  height: 300 # 高度在模型名称中作为"int"x"int"部分的第二个数字
  input_pixel_format: rgb/bgr # 查看 model.json 以确定在这里放置哪个
```

#### 本地推理

也可以不使用 AI 服务器而直接运行硬件。这种方法的好处是没有将预测结果从 AI 服务器 docker 容器传输到 frigate 容器时产生的任何瓶颈。但是，实现本地推理的方法对每个设备和硬件组合都不同，所以通常得不偿失。实现这一目标的一般指南是：

1. 确保 frigate docker 容器具有你想要使用的运行时。例如，为 Hailo 运行 `@local` 意味着确保你使用的容器安装了 Hailo 运行时。
2. 要再次检查运行时是否被 DeGirum 检测器检测到，确保 `degirum sys-info` 命令正确显示你打算安装的任何运行时。
3. 在你的 `config.yml` 文件中创建 DeGirum 检测器。

<ModelConfigDropdown detectorTitle="DeGirum" models={objectDetectorsModels.degirumLocal.models} />

一旦 `degirum_detector` 设置完成，你可以通过 `config.yml` 文件中的'model'部分选择模型。

```yaml
model:
  path: mobilenet_v2_ssd_coco--300x300_quant_n2x_orca1_1
  width: 300 # 宽度在模型名称中作为"int"x"int"部分的第一个数字
  height: 300 # 高度在模型名称中作为"int"x"int"部分的第二个数字
  input_pixel_format: rgb/bgr # 查看 model.json 以确定在这里放置哪个
```

#### AI Hub 云推理

如果你不具备想要运行的硬件，也可以选择运行云推理。请注意，你的检测 fps 可能需要降低，因为网络延迟确实会显著减慢这种检测方法。对于与 Frigate 一起使用，我们强烈建议使用如上所述的本地 AI 服务器。要设置云推理，

1. 在[DeGirum 的 AI Hub](https://hub.degirum.com)注册。
2. 获取访问令牌。
3. 在你的 `config.yml` 文件中创建 DeGirum 检测器。

<ModelConfigDropdown detectorTitle="DeGirum" models={objectDetectorsModels.degirumCloud.models} />

一旦 `degirum_detector` 设置完成，你可以通过 `config.yml` 文件中的'model'部分选择模型。

```yaml
model:
  path: mobilenet_v2_ssd_coco--300x300_quant_n2x_orca1_1
  width: 300 # 宽度在模型名称中作为"int"x"int"部分的第一个数字
  height: 300 # 高度在模型名称中作为"int"x"int"部分的第二个数字
  input_pixel_format: rgb/bgr # 查看 model.json 以确定在这里放置哪个
```

## AXERA 算力卡 {#axera}

以下 SoC 支持硬件加速物体检测：

- AX650N
- AX8850N

此实现使用 [AXera Pulsar2 工具链](https://huggingface.co/AXERA-TECH/Pulsar2)。

有关配置 AXEngine 硬件的信息，请参阅[安装文档](../frigate/installation.md#axera)。

:::info

AXEngine 检测器会在首次启动时从 HuggingFace 下载默认模型。缓存后，模型可完全离线使用。详见[网络要求](/frigate/network_requirements#hardware-specific-detector-models)。

:::

### 配置

配置 AXEngine 检测器时，你必须指定模型名称。

<ModelConfigDropdown detectorTitle="AXEngine" models={objectDetectorsModels.axengine.models} />
