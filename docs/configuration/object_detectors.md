---
id: object_detectors
title: 物体/目标检测器
---

# 支持的硬件

:::info

Frigate 支持多种不同类型的检测器，可在不同硬件上运行：

**通用硬件**

- [Coral EdgeTPU](#edge-tpu-detector)：Google Coral EdgeTPU 提供 USB 和 m.2 两种接口，兼容多种设备。
- [Hailo](#hailo-8)：Hailo8 和 Hailo8L AI 加速模块提供 m.2 接口和树莓派 HAT，兼容多种设备。
- [MemryX](#memryx-mx3)<Badge text="社区支持" type="warning" />：MX3 加速模块提供 m.2 接口版本，为各种平台提供广泛的兼容性。
- [DeGirum](#degirum)<Badge text="社区支持" type="warning" />：用于在云端或本地使用硬件设备的服务。硬件和模型在[其网站](https://hub.degirum.com)上提供。

**AMD**

- [ROCm](#amdrocm-gpu-detector)：ROCm 可在 AMD 独立显卡上运行，提供高效物体/目标检测。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，ROCm 会在`-rocm`版 Frigate 镜像中自动被检测并使用。

**Apple Silicon**

- [Apple Silicon](#apple-silicon-detector): Apple Silicon 可在 M1 以及更新的 Apple Silicon 设备上运行。

**Intel**

- [OpenVino](#openvino-detector)：OpenVino 可在 Intel Arc 显卡、核显和 CPU 上运行，提供高效的物体/目标检测。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，OpenVINO 会在默认 Frigate 镜像中自动被检测并使用。

**NVIDIA**

- [ONNX](#onnx)：当配置了受支持的 ONNX 模型时，在-tensorrt Frigate 镜像中，TensorRT 将被自动检测并用作检测器。

**Nvidia Jetson**<Badge text="社区支持" type="warning" />

- [TensortRT](#nvidia-tensorrt检测器)：TensorRT 可在 Jetson 设备上运行，使用多种预设模型。
- [ONNX](#onnx)：当配置了支持的 ONNX 模型时，TensorRT 会在`-tensorrt-jp6`版 Frigate 镜像中自动被检测并使用。

**瑞芯微 Rockchip**<Badge text="社区支持" type="warning" />

- [RKNN](#rockchip-platform)：RKNN 模型可在内置 NPU 的瑞芯微 Rockchip 设备上运行。

**Synaptics**<Badge text="社区支持" type="warning" />

- [Synaptics](#synaptics): Synap 模型可在配备内置 NPU 的 Synaptics 设备（例如 Astra Machina）上运行。

**测试用途**

- [CPU 检测器(不推荐实际使用)](#cpu检测器不推荐使用)：使用 CPU 运行 tflite 模型，不推荐使用，在大多数情况下使用 OpenVINO CPU 模式可获得更好效果。

:::

:::note

不能混合使用多种检测器进行物体/目标检测（例如：不能同时使用 OpenVINO 和 Coral EdgeTPU 进行物体/目标检测）。

当然，不影响其他需要使用硬件加速任务，如[语义搜索](./semantic_search.md)。

:::

# 官方支持的检测器

Frigate 提供以下内置检测器类型：`cpu`、`edgetpu`、`hailo8l`、`memryx`、`onnx`、`openvino`、`rknn`和`tensorrt`。默认情况下，Frigate 会使用单个 CPU 检测器。其他检测器可能需要额外配置，如下所述。使用多个检测器时，它们会在专用进程中运行，但会从所有摄像头的公共检测请求队列中获取任务。

## Edge TPU 检测器 {#edge-tpu-detector}

Edge TPU 检测器类型运行 TensorFlow Lite 模型，利用 Google Coral 代理进行硬件加速。要配置 Edge TPU 检测器，将`"type"`属性设置为`"edgetpu"`。

Edge TPU 设备可使用`"device"`属性指定，参考[TensorFlow Lite Python API 文档](https://coral.ai/docs/edgetpu/multiple-edgetpu/#using-the-tensorflow-lite-python-api)。如果未设置，代理将使用它找到的第一个设备。

:::tip

如果未检测到 Edge TPU，请参阅[Edge TPU 常见故障排除步骤](/troubleshooting/edgetpu)。

:::

### 单个 USB Coral

```yaml
detectors:
  coral:
    type: edgetpu
    device: usb
```

### 多个 USB Coral

```yaml
detectors:
  coral1:
    type: edgetpu
    device: usb:0
  coral2:
    type: edgetpu
    device: usb:1
```

### 原生 Coral(开发板)

**警告：`v0.9.x`版本后可能有[兼容性问题](https://github.com/blakeblackshear/frigate/issues/1706)**

```yaml
detectors:
  coral:
    type: edgetpu
    device: ""
```

### 单个 PCIE/M.2 Coral

```yaml
detectors:
  coral:
    type: edgetpu
    device: pci
```

### 多个 PCIE/M.2 Coral

```yaml
detectors:
  coral1:
    type: edgetpu
    device: pci:0
  coral2:
    type: edgetpu
    device: pci:1
```

### 混合使用 Coral

```yaml
detectors:
  coral_usb:
    type: edgetpu
    device: usb
  coral_pci:
    type: edgetpu
    device: pci
```

### EdgeTPU 支持的模型

| 模型                                  | 注释                   |
| ------------------------------------- | ---------------------- |
| [MobileNet v2](#ssdlite-mobilenet-v2) | 默认模型               |
| [YOLOv9](#yolov9)                    | 比默认模型更准确但更慢 |

#### SSDLite MobileNet v2

容器中提供了位于`/edgetpu_model.tflite`的 TensorFlow Lite 模型，默认情况下此检测器类型使用该模型。要提供自己的模型，将文件绑定挂载到容器中，并通过`model.path`提供路径。

#### YOLOv9

支持为 TensorFlow Lite 编译并正确量化的[YOLOv9](https://github.com/dbro/frigate-detector-edgetpu-yolo9/releases/download/v1.0/yolov9-s-relu6-best_320_int8_edgetpu.tflite)模型，但默认不包含。要提供自己的模型，将文件绑定挂载到容器中，并通过`model.path`提供路径。注意模型可能需要自定义标签文件（例如，为上面链接的模型[使用这个 17 标签文件](https://raw.githubusercontent.com/dbro/frigate-detector-edgetpu-yolo9/refs/heads/main/labels-coco17.txt)）。

##### YOLOv9 设置和配置

将 tflite 模型和标签的下载文件放置在配置文件夹中后，你可以使用以下配置：

```yaml
detectors:
  coral:
    type: edgetpu
    device: usb

model:
  model_type: yolo-generic
  width: 320 # <--- 应与模型的 imgsize 匹配，通常为 320
  height: 320 # <--- 应与模型的 imgsize 匹配，通常为 320
  path: /config/model_cache/yolov9-s-relu6-best_320_int8_edgetpu.tflite
  labelmap_path: /config/labels-coco17.txt
```

注意标签图使用了完整 COCO 标签集的一个子集，仅包含 17 个对象。

---

## Hailo-8 检测器 {#hailo-8}

Hailo-8 检测器支持 Hailo-8 和 Hailo-8L AI 加速模块。该集成会自动通过 Hailo CLI 检测你的硬件架构，如果未指定自定义模型，则会选择适当的默认模型。

有关配置 Hailo 硬件的详细信息，请参阅[安装文档](../frigate/installation.md#hailo-8)。

### 配置

配置 Hailo 检测器时，你有两种指定模型的方式：本地**路径**或**URL**。
如果同时提供两者，检测器将首先检查给定的本地路径。如果未找到文件，则会从指定的 URL 下载模型。模型文件缓存在`/config/model_cache/hailo`目录下。

#### YOLO 模型

此配置适用于基于 YOLO 的模型。当未提供自定义模型路径或 URL 时，检测器会根据检测到的硬件自动下载默认模型：

- **Hailo-8 硬件**：使用**YOLOv6n**（默认：`yolov6n.hef`）
- **Hailo-8L 硬件**：使用**YOLOv6n**（默认：`yolov6n.hef`）

```yaml
detectors:
  hailo:
    type: hailo8l
    device: PCIe

model:
  width: 320
  height: 320
  input_tensor: nhwc
  input_pixel_format: rgb
  input_dtype: int
  model_type: yolo-generic
  labelmap_path: /labelmap/coco-80.txt

  # 检测器会根据你的硬件自动选择默认模型：
  # - Hailo-8硬件：YOLOv6n（默认：yolov6n.hef）
  # - Hailo-8L硬件：YOLOv6n（默认：yolov6n.hef）
  #
  # 可选：你可以指定本地模型路径来覆盖默认值。
  # 如果提供了本地路径且文件存在，将使用该文件而不是下载。
  # 示例：
  # path: /config/model_cache/hailo/yolov6n.hef
  #
  # 你也可以使用自定义URL覆盖：
  # path: https://hailo-model-zoo.s3.eu-west-2.amazonaws.com/ModelZoo/Compiled/v2.14.0/hailo8/yolov6n.hef
  # 只需确保根据模型提供正确的配置
```

#### SSD 模型

对于基于 SSD 的模型，请提供你编译的 SSD 模型的路径或 URL。集成将首先检查本地路径，必要时才会下载。

```yaml
detectors:
  hailo:
    type: hailo8l
    device: PCIe

model:
  width: 300
  height: 300
  input_tensor: nhwc
  input_pixel_format: rgb
  model_type: ssd
  # 为 SSD MobileNet v1 指定本地模型路径（如果可用）或 URL
  # 本地路径示例：
  # path: /config/model_cache/h8l_cache/ssd_mobilenet_v1.hef
  #
  # 或使用自定义URL覆盖：
  # path: https://hailo-model-zoo.s3.eu-west-2.amazonaws.com/ModelZoo/Compiled/v2.14.0/hailo8l/ssd_mobilenet_v1.hef
```

#### 自定义模型

Hailo 检测器支持所有为 Hailo 硬件编译并包含后处理的 YOLO 模型。你可以指定自定义 URL 或本地路径来下载或直接使用你的模型。如果同时提供两者，检测器会优先检查本地路径。

```yaml
detectors:
  hailo:
    type: hailo8l
    device: PCIe

model:
  width: 640
  height: 640
  input_tensor: nhwc
  input_pixel_format: rgb
  input_dtype: int
  model_type: yolo-generic
  labelmap_path: /labelmap/coco-80.txt
  # 可选：指定本地模型路径
  # path: /config/model_cache/hailo/custom_model.hef
  #
  # 或者作为备用方案，提供自定义URL：
  # path: https://custom-model-url.com/path/to/model.hef
```

更多现成模型，请访问：[Hailo 模型库](https://github.com/hailo-ai/hailo_model_zoo)

Hailo8 支持 Hailo 模型库中所有包含 HailoRT 后处理的模型。你可以选择任何这些预配置模型。

> **注意：** > `config > path`参数可以接受以`.hef`结尾的本地文件路径或在线 URL 地址。当提供时，检测器将首先检查路径是否为本地文件路径。如果文件在本地存在，将直接使用。如果未找到本地文件或提供了 URL，则会尝试从指定 URL 下载模型。

---

## OpenVINO 检测器 {#openvino-detector}

OpenVINO 检测器可在 AMD CPU 和 Intel CPU、Intel GPU 以及 Intel NPU 上运行 OpenVINO IR 模型。要配置 OpenVINO 检测器，请将`"type"`属性设置为`"openvino"`。

使用的 OpenVINO 设备通过`device`属性指定，需遵循[设备文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes.html)中的命名规定。最常见的设备是 `CPU`、`GPU`以及 `NPU`。

OpenVINO 支持 第 6 代 Intel 平台（Skylake）以及更新的版本。虽然没有官方支持，但它也可以在 AMD CPU 上运行。使用 `GPU` 或 `NPU` 设备需要支持的 Intel 平台。有关详细的系统要求，请参阅[OpenVINO 系统要求](https://docs.openvino.ai/2024/about-openvino/release-notes-openvino/system-requirements.html)

:::tip

**NPU + GPU 的系统：** 如果你同时拥有可用的 NPU 和 GPU（例如英特尔酷睿 Ultra 处理器），请使用 NPU 进行目标检测，使用 GPU 进行增强处理（语义搜索、人脸识别等），以获得最佳性能和兼容性。

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

### OpenVINO 支持的模型 {#openvino-supported-models}

| 模型                                  | GPU | NPU | 注释                                       |
| ------------------------------------- | --- | --- | ------------------------------------------ |
| [YOLOv9](#yolo-v3-v4-v7-v9)           | ✅  | ✅  | 推荐用于 GPU 和 NPU                        |
| [RF-DETR](#rf-detr)                   | ✅  | ✅  | 需要 XE 核显或 Arc 显卡                    |
| [YOLO-NAS](#yolo-nas)                 | ✅  | ✅  |                                            |
| [MobileNet v2](#ssdlite-mobilenet-v2) | ✅  | ✅  | 快速且轻量级的模型，但准确性低于更大的模型 |
| [YOLOX](#yolox)                       | ✅  | ?   |                                            |
| [D-FINE](#d-fine)                     | ❌  | ❌  |                                            |

#### SSDLite MobileNet v2

容器中提供了位于`/openvino-model/ssdlite_mobilenet_v2.xml`的 OpenVINO 模型，默认情况下此检测器类型使用该模型。该模型来自 Intel 的开放模型库[SSDLite MobileNet V2](https://github.com/openvinotoolkit/open_model_zoo/tree/master/models/public/ssdlite_mobilenet_v2)，并转换为 FP16 精度的 IR 模型。

使用默认 OpenVINO 模型时，请使用如下所示的模型配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU # 或 NPU

model:
  width: 300
  height: 300
  input_tensor: nhwc
  input_pixel_format: bgr
  path: /openvino-model/ssdlite_mobilenet_v2.xml
  labelmap_path: /openvino-model/coco_91cl_bkgr.txt
```

#### YOLOX 模型

该检测器也支持 YOLOX 模型。Frigate 没有自带任何 YOLOX 模型，因此你需要自行提供模型。

#### YOLO-NAS 模型

[YOLO-NAS](https://github.com/Deci-AI/super-gradients/blob/master/YOLONAS.md)模型受支持，但默认不包含。有关下载 YOLO-NAS 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载yolo-nas模型)。

:::warning

如果你使用的是 Frigate+ YOLO-NAS 模型，则除了 path 参数外，不应在配置中定义以下任何 model 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的 onnx 模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU

model:
  model_type: yolonas
  width: 320 # <--- 应与notebook中设置的尺寸匹配
  height: 320 # <--- 应与notebook中设置的尺寸匹配
  input_tensor: nchw
  input_pixel_format: bgr
  path: /config/yolo_nas_s.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

#### YOLO(v3,v4,v7,v9)模型

YOLOv3、YOLOv4、YOLOv7 和 [YOLOv9](https://github.com/WongKinYiu/yolov9)模型受支持，但默认不包含。

:::tip

YOLO 检测器设计用于支持 YOLOv3、YOLOv4、YOLOv7 和 YOLOv9 模型，但也可能支持其他 YOLO 模型架构。

:::

:::warning

如果你使用的是 Frigate+ 模型，则除了 path 参数外，不应在配置中定义以下任何 model 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的 onnx 模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU # 或 NPU

model:
  model_type: yolo-generic
  width: 320 # <--- 应与模型导出时设置的imgsize匹配
  height: 320 # <--- 应与模型导出时设置的imgsize匹配
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/yolo.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

#### RF-DETR 模型

[RF-DETR](https://github.com/roboflow/rf-detr)是基于 DETR 的模型。支持导出为 ONNX 模型，Frigate 默认不包含该模型。有关下载 RF-DETR 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载rf-detr模型)。

:::warning

由于 RF-DETR 模型的尺寸和复杂性，建议仅在独立 Arc 显卡上运行。

:::

将下载的 onnx 模型放入`config/model_cache`文件夹后，可以使用以下配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU

model:
  model_type: rfdetr
  width: 320
  height: 320
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/rfdetr.onnx
```

#### D-FINE 模型

[D-FINE](https://github.com/Peterande/D-FINE)是基于 DETR 的模型。支持导出为 ONNX 模型，Frigate 默认不包含该模型。有关下载 D-FINE 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载d-fine模型)。

:::warning

目前 D-FINE 模型只能在 OpenVINO 的 CPU 模式下运行，GPU 目前无法编译该模型

:::

将下载的 onnx 模型放入`config/model_cache`文件夹后，可以使用以下配置：

```yaml
detectors:
  ov: # [!code ++]
    type: openvino # [!code ++]
    device: CPU # [!code ++]

model: # [!code ++]
  model_type: dfine # [!code ++]
  width: 640 # [!code ++]
  height: 640 # [!code ++]
  input_tensor: nchw # [!code ++]
  input_dtype: float # [!code ++]
  path: /config/model_cache/dfine-s.onnx # [!code ++]
  labelmap_path: /labelmap/coco-80.txt # [!code ++]
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

## Apple Silicon 检测器

Apple Silicon 中的 NPU 无法从容器内访问，因此必须先设置[Apple Silicon 检测器客户端](https://cnb.cool/frigate-cn/apple-silicon-detector)。
建议使用带有`-standard-arm64`后缀的 Frigate docker 镜像，例如`ghcr.io/blakeblackshear/frigate:stable-standard-arm64`。

### 设置 {#setup-2}

1. 设置[Apple Silicon 检测器客户端](https://cnb.cool/frigate-cn/apple-silicon-detector)并运行客户端
2. 在 Frigate 中配置检测器并启动 Frigate

### 配置

使用下面的检测器配置将连接到客户端：

```yaml
detectors:
  apple-silicon:
    type: zmq
    endpoint: tcp://host.docker.internal:5555
```

### Apple Silicon 支持的模型

没有提供默认模型，支持以下格式：

#### YOLO (v3, v4, v7, v9)

YOLOv3、YOLOv4、YOLOv7 和[YOLOv9](https://github.com/WongKinYiu/yolov9)模型受支持，但默认不包含。

:::tip

YOLO 检测器设计用于支持 YOLOv3、YOLOv4、YOLOv7 和 YOLOv9 模型，但也可能支持其他 YOLO 模型架构。有关下载 YOLO 模型用于 Frigate 的更多信息，请参见[模型部分](#downloading-yolo-models)。

:::

当 Frigate 使用以下配置启动时，它将连接到检测器客户端并自动传输模型：

```yaml
detectors:
  apple-silicon:
    type: zmq
    endpoint: tcp://host.docker.internal:5555

model:
  model_type: yolo-generic
  width: 320 # <--- 应与模型导出时设置的imgsize匹配
  height: 320 # <--- 应与模型导出时设置的imgsize匹配
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/yolo.onnx
  labelmap_path: /labelmap/coco-80.txt
```

## AMD/ROCm GPU 检测器 {#amdrocm-gpu-detector}

### 设置 {#setup}

AMD GPU 的支持通过[ONNX 检测器](#ONNX)提供。要使用 AMD GPU 进行物体/目标检测，请使用带有`-rocm`后缀的 Frigate docker 镜像，例如`docker.cnb.cool/frigate-cn/frigate:stable-rocm`。

### Docker GPU 访问设置 {#docker-settings-for-gpu-access}

ROCm 需要访问`/dev/kfd`和`/dev/dri`设备。当 docker 或 frigate 不以 root 身份运行时，还应添加`video`（可能还有`render`和`ssl/_ssl`）组。

直接使用`docker run`时，应添加以下变量以访问设备：

```bash
$ docker run --device=/dev/kfd --device=/dev/dri  \
    ... # 此处省略其他参数
```

使用 Docker Compose 时：

```yaml
services:
  frigate:
    ... # 此处省略其他参数
    devices:
    - /dev/dri # [!code ++]
    - /dev/kfd # [!code ++]
```

有关推荐设置的参考，请参阅[在 Docker 中运行 ROCm/pytorch](https://rocm.docs.amd.com/projects/install-on-linux/en/develop/how-to/3rd-party/pytorch-install.html#using-docker-with-pytorch-pre-installed)。

### 覆盖 GPU 芯片组的 Docker 设置 {#docker-settings-for-overriding-the-gpu-chipset}

你的 GPU 可能无需特殊配置即可正常工作，但在许多情况下需要手动调整一些配置。因为 AMD/ROCm 自带的 GPU 驱动程序集并不完整，对于较新或缺失的型号，你需要将芯片组版本覆盖为较旧/通用版本才能使其工作。

此外，AMD/ROCm 没有“官方正式”支持核显。它仍然可以与大多数核显正常工作，但需要特殊设置。必须配置`HSA_OVERRIDE_GFX_VERSION`环境变量。有关背景和示例，请参阅[ROCm 问题报告](https://github.com/ROCm/ROCm/issues/1743)。

对于 rocm frigate 构建，有一些自动检测：

- gfx1031 -> 10.3.0
- gfx1103 -> 11.0.0

如果你有其他芯片组，可能需要在 Docker 启动时覆盖`HSA_OVERRIDE_GFX_VERSION`。假设你需要的版本是`10.0.0`，则应从命令行配置为：

```bash
$ docker run -e HSA_OVERRIDE_GFX_VERSION=10.0.0 \
    ...
```

使用 Docker Compose 时：

```yaml
services:
  frigate:
    ...
    environment:
      HSA_OVERRIDE_GFX_VERSION: "10.0.0" # [!code ++]
```

确定你需要的版本可能很复杂，因为你无法从 AMD 品牌名称中判断芯片组名称和驱动程序。

1. 首先通过在 frigate 容器中运行`/opt/rocm/bin/rocminfo`确保 rocm 环境正常运行 - 它应该列出 CPU 和 GPU 及其属性
2. 从`rocminfo`的输出中找到你拥有的芯片组版本（格式为 gfxNNN，N 为数字）（见下文）
3. 使用搜索引擎查询给定 gfx 名称所需的`HSA_OVERRIDE_GFX_VERSION`("gfxNNN ROCm HSA_OVERRIDE_GFX_VERSION")
4. 用相关值覆盖`HSA_OVERRIDE_GFX_VERSION`
5. 如果仍然无法工作，请检查 frigate docker 日志

#### 检查 AMD/ROCm 是否正常工作并找到你的 GPU {#figuring-out-if-amdrocm-is-working-and-found-your-gpu}

```bash
$ docker exec -it frigate /opt/rocm/bin/rocminfo
```

#### 确定你的 AMD GPU 芯片组版本：{#figuring-out-your-amd-gpu-chipset-version}

我们取消设置`HSA_OVERRIDE_GFX_VERSION`以防止现有覆盖干扰结果：

```bash
$ docker exec -it frigate /bin/bash -c '(unset HSA_OVERRIDE_GFX_VERSION && /opt/rocm/bin/rocminfo |grep gfx)'
```

### ROCm 支持的模型 {#rocm-supported-models}

有关支持的模型，请参阅[ONNX 支持的模型](#supported-models-2)，但有以下注意事项：

- 不支持 D-FINE 模型
- 已知 YOLO-NAS 模型在核显上运行不佳

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
  - 在`-tensorrt-jp(4/5)`版 Frigate 镜像中，Jetson 设备会被自动检测并与 ONNX 检测器一起使用。

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

### ONNX 支持的模型 {#onnx-supported-models}

| 模型                          | Nvidia GPU | AMD GPU | 注释                                            |
| ----------------------------- | ---------- | ------- | ----------------------------------------------- |
| [YOLOv9](#yolo-v3-v4-v7-v9-2) | ✅         | ✅      | 支持 CUDA Graphs 以实现在 Nvidia 平台的最佳性能 |
| [RF-DETR](#rf-detr)           | ✅         | ❌      | 支持 CUDA Graphs 以实现在 Nvidia 平台的最佳性能 |
| [YOLO-NAS](#yolo-nas-1)       | ⚠️         | ⚠️      | 不支持 CUDA Graphs                              |
| [YOLOX](#yolox-1)             | ✅         | ✅      | 支持 CUDA Graphs 以实现在 Nvidia 平台的最佳性能 |
| [D-FINE](#d-fine)             | ⚠️         | ❌      | 不支持 CUDA Graphs                              |

没有提供默认模型，支持以下类型的模型：

#### YOLO-NAS

[YOLO-NAS](https://github.com/Deci-AI/super-gradients/blob/master/YOLONAS.md)模型受支持，但默认不包含。有关下载 YOLO-NAS 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载yolo-nas模型)。

将下载的 onnx 模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  onnx:
    type: onnx

model:
  model_type: yolonas
  width: 320 # <--- 应与notebook中设置的尺寸匹配
  height: 320 # <--- 应与notebook中设置的尺寸匹配
  input_pixel_format: bgr
  input_tensor: nchw
  path: /config/yolo_nas_s.onnx
  labelmap_path: /labelmap/coco-80.txt
```

#### YOLO (v3, v4, v7, v9)

YOLOv3、YOLOv4、YOLOv7 和[YOLOv9](https://github.com/WongKinYiu/yolov9)模型受支持，但默认不包含。

:::tip

YOLO 检测器设计用于支持 YOLOv3、YOLOv4、YOLOv7 和 YOLOv9 模型，但也可能支持其他 YOLO 模型架构。有关下载 YOLO 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载yolo模型)。

:::

:::warning

如果你使用的是 Frigate+ 模型，则除了 `path` 参数外，不应在配置中定义以下任何 `model` 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的 onnx 模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  onnx:
    type: onnx

model:
  model_type: yolo-generic
  width: 320 # <--- 应与模型导出时设置的imgsize匹配
  height: 320 # <--- 应与模型导出时设置的imgsize匹配
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/yolo.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

#### YOLOx

[YOLOx](https://github.com/Megvii-BaseDetection/YOLOX)模型受支持，但默认不包含。有关下载 YOLOx 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载yolo模型)。

将下载的 onnx 模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  onnx:
    type: onnx

model:
  model_type: yolox
  width: 416 # <--- 应与模型导出时设置的imgsize匹配
  height: 416 # <--- 应与模型导出时设置的imgsize匹配
  input_tensor: nchw
  input_dtype: float_denorm
  path: /config/model_cache/yolox_tiny.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

#### RF-DETR

[RF-DETR](https://github.com/roboflow/rf-detr)是基于 DETR 的模型。支持导出的 ONNX 模型，但默认不包含。有关下载 RF-DETR 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载rf-detr模型)。

将下载的 onnx 模型放入`config/model_cache`文件夹后，可以使用以下配置：

```yaml
detectors:
  onnx:
    type: onnx

model:
  model_type: rfdetr
  width: 320
  height: 320
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/rfdetr.onnx
```

#### D-FINE

[D-FINE](https://github.com/Peterande/D-FINE)是基于 DETR 的模型。支持导出的 ONNX 模型，但默认不包含。有关下载 D-FINE 模型用于 Frigate 的更多信息，请参阅[模型部分](#下载d-fine模型)。

将下载的 onnx 模型放入`config/model_cache`文件夹后，可以使用以下配置：

```yaml
detectors:
  onnx:
    type: onnx

model:
  model_type: dfine
  width: 640
  height: 640
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/dfine_m_obj2coco.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：labelmap 使用的是完整的 COCO 标签集的子集，仅包含 80 种类型的目标。

## CPU 检测器(不推荐使用)

CPU 检测器类型运行 TensorFlow Lite 模型，使用 CPU 进行处理而不使用硬件加速。建议使用硬件加速的检测器类型以获得更好的性能。要配置基于 CPU 的检测器，请将`"type"`属性设置为`"cpu"`。

:::danger

不建议将 CPU 检测器用于一般用途。如果你没有 GPU 或 Edge TPU 硬件，使用[OpenVINO 检测器](#openvino-detector)的 CPU 模式通常比使用 CPU 检测器更高效。

:::

可以通过`"num_threads"`属性指定解释器使用的线程数，默认为`3`。

容器中提供了位于`/cpu_model.tflite`的 TensorFlow Lite 模型，默认情况下此检测器类型使用该模型。要提供自己的模型，请将文件绑定挂载到容器中，并通过`model.path`提供路径。

```yaml
detectors:
  cpu1:
    type: cpu
    num_threads: 3
  cpu2:
    type: cpu
    num_threads: 3

model:
  path: "/custom_model.tflite"
```

使用 CPU 检测器时，可以为每个摄像头添加一个 CPU 检测器。添加比摄像头数量更多的检测器不会提高性能。

## Deepstack / CodeProject.AI 服务器检测器

Frigate 的 Deepstack/CodeProject.AI 服务器检测器允许你将 Deepstack 和 CodeProject.AI 的物体/目标检测功能集成到 Frigate 中。CodeProject.AI 和 DeepStack 是开源 AI 平台，可以在各种设备上运行，如树莓派、NVIDIA Jetson 和其他兼容硬件。需要注意的是，集成是通过网络进行的，因此推理时间可能不如原生 Frigate 检测器快，但它仍然为物体/目标检测和追踪提供了高效可靠的解决方案。

### 设置

要开始使用 CodeProject.AI，请访问其[官方网站](https://www.codeproject.com/Articles/5322557/CodeProject-AI-Server-AI-the-easy-way)，按照说明在你选择的设备上下载并安装 AI 服务器。CodeProject.AI 的详细设置说明不在 Frigate 文档范围内。

要将 CodeProject.AI 集成到 Frigate 中，你需要对 Frigate 配置文件进行以下更改：

```yaml
detectors:
  deepstack:
    api_url: http://<你的codeproject_ai服务器IP>:<端口>/v1/vision/detection
    type: deepstack
    api_timeout: 0.1 # 秒
```

将`<你的codeproject_ai服务器IP>`和`<端口>`替换为你的 CodeProject.AI 服务器的 IP 地址和端口。

要验证集成是否正常工作，请启动 Frigate 并观察日志中是否有与 CodeProject.AI 相关的错误消息。此外，你可以检查 Frigate 网络界面，查看 CodeProject.AI 检测到的对象是否正确显示和追踪。

# 由社区支持的检测器

## MemryX MX3

此检测器可用于 MemryX MX3 加速器 M.2 模块。Frigate 在兼容硬件平台上支持 MX3，提供高效和高性能的物体检测。

有关配置 MemryX 硬件的信息，请参阅[安装文档](../frigate/installation.md#memryx-mx3)。

要配置 MemryX 检测器，只需将`type`属性设置为`memryx`并按照下面的配置指南。

### 配置

要配置 MemryX 检测器，请使用以下示例配置：

#### 单个 PCIe MemryX MX3

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0
```

#### 多个 PCIe MemryX MX3 模块

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0

  memx1:
    type: memryx
    device: PCIe:1

  memx2:
    type: memryx
    device: PCIe:2
```

### 支持的模型

如果启用，MemryX `.dfp`模型会在运行时自动下载到容器的`/memryx_models/model_folder/`中。

#### YOLO-NAS

此检测器中包含的[YOLO-NAS](https://github.com/Deci-AI/super-gradients/blob/master/YOLONAS.md)模型从[模型部分](#downloading-yolo-nas-model)下载，并使用[mx_nc](https://developer.memryx.com/tools/neural_compiler.html#usage)编译为 DFP。

**注意：** MemryX 检测器的默认模型是 YOLO-NAS 320x320。

**YOLO-NAS**的输入大小可以设置为**320x320**（默认）或**640x640**。

- **320x320**的默认大小针对较低的 CPU 使用和更快的推理时间进行了优化。

##### 配置

以下是使用**YOLO-NAS**（小）模型与 MemryX 检测器的推荐配置：

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0

model:
  model_type: yolonas
  width: 320 # （可以设置为 640 以获得更高分辨率）
  height: 320 # （可以设置为 640 以获得更高分辨率）
  input_tensor: nchw
  input_dtype: float
  labelmap_path: /labelmap/coco-80.txt
  # 可选：模型通常通过运行时获取，因此除非你想使用自定义或本地模型，否则可以省略 'path'。
  # path: /config/yolonas.zip
  # .zip 文件必须包含：
  # ├── yolonas.dfp          （以 .dfp 结尾的文件）
  # └── yolonas_post.onnx    （可选；仅当模型包含裁剪的后处理网络时）
```

#### YOLOv9

此检测器中包含的 YOLOv9s 模型从[原始 GitHub](https://github.com/WongKinYiu/yolov9)下载，就像[模型部分](#yolov9-1)中那样，并使用[mx_nc](https://developer.memryx.com/tools/neural_compiler.html#usage)编译为 DFP。

##### 配置

以下是使用**YOLOv9**（小）模型与 MemryX 检测器的推荐配置：

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0

model:
  model_type: yolo-generic
  width: 320 # （可以设置为 640 以获得更高分辨率）
  height: 320 # （可以设置为 640 以获得更高分辨率）
  input_tensor: nchw
  input_dtype: float
  labelmap_path: /labelmap/coco-80.txt
  # 可选：模型通常通过运行时获取，因此除非你想使用自定义或本地模型，否则可以省略 'path'。
  # path: /config/yolov9.zip
  # .zip 文件必须包含：
  # ├── yolov9.dfp          （以 .dfp 结尾的文件）
```

#### YOLOX

该模型源自[OpenCV 模型库](https://github.com/opencv/opencv_zoo)并预编译为 DFP。

##### 配置

以下是使用**YOLOX**（小）模型与 MemryX 检测器的推荐配置：

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0

model:
  model_type: yolox
  width: 640
  height: 640
  input_tensor: nchw
  input_dtype: float_denorm
  labelmap_path: /labelmap/coco-80.txt
  # 可选：模型通常通过运行时获取，因此除非你想使用自定义或本地模型，否则可以省略 'path'。
  # path: /config/yolox.zip
  # .zip 文件必须包含：
  # ├── yolox.dfp          （以 .dfp 结尾的文件）
```

#### SSDLite MobileNet v2

该模型源自[OpenMMLab 模型库](https://mmdeploy-oss.openmmlab.com/model/mmdet-det/ssdlite-e8679f.onnx)并已转换为 DFP。

##### 配置

以下是使用**SSDLite MobileNet v2**模型与 MemryX 检测器的推荐配置：

```yaml
detectors:
  memx0:
    type: memryx
    device: PCIe:0

model:
  model_type: ssd
  width: 320
  height: 320
  input_tensor: nchw
  input_dtype: float
  labelmap_path: /labelmap/coco-80.txt
  # 可选：模型通常通过运行时获取，因此除非你想使用自定义或本地模型，否则可以省略 'path'。
  # path: /config/ssdlite_mobilenet.zip
  # .zip 文件必须包含：
  # ├── ssdlite_mobilenet.dfp          （以 .dfp 结尾的文件）
  # └── ssdlite_mobilenet_post.onnx    （可选；仅当模型包含裁剪的后处理网络时）
```

#### 使用自定义模型

要使用你自己的模型：

1.  将编译好的模型打包成 `.zip` 文件。

2.  `.zip` 文件必须包含编译好的 `.dfp` 文件。

3.  根据模型的不同，编译器可能还会生成裁剪的后处理网络。如果存在，将以 `_post.onnx` 为后缀命名。

4.  将 `.zip` 文件绑定挂载到容器中，并在配置中使用 `model.path` 指定其路径。

5.  更新 `labelmap_path` 以匹配自定义模型的标签。

有关编译模型的详细说明，请参阅[MemryX 编译器](https://developer.memryx.com/tools/neural_compiler.html#usage)文档和[教程](https://developer.memryx.com/tutorials/tutorials.html)。

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

英伟达 Jetson 设备可使用 TensorRT 库进行目标检测。由于附加库的大小问题，此检测器仅在带有`-tensorrt-jp6`标签后缀的镜像中提供，例如`docker.cnb.cool/frigate-cn/frigate:stable-tensorrt-jp6`。此检测器旨在与用于目标检测的 Yolo 模型配合使用。

### 生成模型 {#generate-models}

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

```yaml
detectors:
  tensorrt:
    type: tensorrt
    device: 0 # 这是默认值，选择第一个GPU

model:
  path: /config/model_cache/tensorrt/yolov7-320.trt
  labelmap_path: /labelmap/coco-80.txt
  input_tensor: nchw
  input_pixel_format: rgb
  width: 320 # 必须与所选模型匹配，例如 yolov7-320 对应 320，yolov4-416 对应 416
  height: 320 # 必须与所选模型匹配，例如 yolov7-320 对应 320，yolov4-416 对应 416
```

## Synaptics

以下 SoC 支持硬件加速物体检测：

- SL1680

此实现使用[Synaptics 模型转换](https://synaptics-synap.github.io/doc/v/latest/docs/manual/introduction.html#offline-model-conversion)，版本 v3.1.0。

此实现基于 sdk `v1.5.0`。

有关配置 SL 系列 NPU 硬件的信息，请参阅[安装文档](../frigate/installation.md#synaptics)。

### 配置

配置 Synap 检测器时，你必须指定模型：本地**路径**。

#### SSD Mobilenet

容器中提供了位于 `/mobilenet.synap` 的 synap 模型，默认情况下此检测器类型使用该模型。该模型来自[Synap-release Github](https://github.com/synaptics-astra/synap-release/tree/v1.5.0/models/dolphin/object_detection/coco/model/mobilenet224_full80)。

使用 synaptics 检测器和默认 synap 模型时，请使用如下所示的模型配置：

```yaml
detectors: # 必填
  synap_npu: # 必填
    type: synaptics # 必填

model: # 必填
  path: /synaptics/mobilenet.synap # 必填
  width: 224 # 必填
  height: 224 # 必填
  tensor_format: nhwc # 默认值（可选。如果你更改模型，则为必填）
  labelmap_path: /labelmap/coco-80.txt # 必填
```

## 瑞芯微 Rockchip 平台检测器 {#rockchip-platform}

瑞芯微 Rockchip 平台支持以下 SoC 的硬件加速物体/目标检测：

- RK3562
- RK3566
- RK3568
- RK3576
- RK3588

该实现使用[Rockchip 的 RKNN-Toolkit2](https://github.com/airockchip/rknn-toolkit2/) v2.3.2 版本。

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

请确保按照[Rockchip 特定安装说明](../frigate/installation#rockchip-platform)进行操作。

:::tip

你可以通过以下命令查看 NPU 负载：

```bash
$ cat /sys/kernel/debug/rknpu/load
>> NPU load:  Core0:  0%, Core1:  0%, Core2:  0%,
```

:::

### RockChip 支持的模型 {#rockchip-supported-models}

以下`config.yml`展示了配置检测器的所有相关选项并加以说明。除两处外，所有显示的值均为默认值。标记为"required"的行是使用检测器至少需要的配置，其他行均为可选。

```yaml
detectors: # 必填
  rknn: # 必填
    type: rknn # 必填
    # 使用的NPU核心数量
    # 0表示自动选择
    # 如果有多核NPU（如在rk3588上），可增加此值以提高性能，例如设置为3
    num_cores: 0
```

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

#### YOLO-NAS 模型

```yaml
model: # required
  # 模型名称（将自动下载）或自定义.rknn模型文件路径
  # 可选值：
  # - deci-fp16-yolonas_s
  # - deci-fp16-yolonas_m
  # - deci-fp16-yolonas_l
  # 或你的yolonas_model.rknn容器内完整路径
  path: deci-fp16-yolonas_s
  model_type: yolonas
  width: 320
  height: 320
  input_pixel_format: bgr
  input_tensor: nhwc
  labelmap_path: /labelmap/coco-80.txt
```

:::warning

DeciAI 提供的预训练 YOLO-NAS 权重受其许可证约束，不可用于商业用途。更多信息请参阅：https://docs.deci.ai/super-gradients/latest/LICENSE.YOLONAS.html

:::

#### YOLO (v9)模型

```yaml
model: # required
  # 模型名称（将自动下载）或自定义.rknn模型文件路径
  # 可选值：
  # - frigate-fp16-yolov9-t
  # - frigate-fp16-yolov9-s
  # - frigate-fp16-yolov9-m
  # - frigate-fp16-yolov9-c
  # - frigate-fp16-yolov9-e
  # 或你的yolo_model.rknn容器内完整路径
  path: frigate-fp16-yolov9-t
  model_type: yolo-generic
  width: 320
  height: 320
  input_tensor: nhwc
  labelmap_path: /labelmap/coco-80.txt
```

#### YOLOx 模型

```yaml
model: # required
  # 模型名称（将自动下载）或自定义.rknn模型文件路径
  # 可选值：
  # - rock-i8-yolox_nano
  # - rock-i8-yolox_tiny
  # - rock-fp16-yolox_nano
  # - rock-fp16-yolox_tiny
  # 或你的yolox_model.rknn容器内完整路径
  path: rock-i8-yolox_nano
  model_type: yolox
  width: 416
  height: 416
  input_tensor: nhwc
  labelmap_path: /labelmap/coco-80.txt
```

### 将自定义 onnx 模型转换为 rknn 格式 {converting-your-own-onnx-model-to-rknn-format}

要使用[rknn-toolkit2](https://github.com/airockchip/rknn-toolkit2/)将 onnx 模型转换为 rknn 格式，你需要：

1. 将一个或多个 onnx 格式的模型文件放置在 Docker 容器内的`config/model_cache/rknn_cache/onnx`目录下（可能需要`sudo`权限）
2. 将配置文件保存为`config/conv2rknn.yaml`（详见下文）
3. 运行`docker exec <此处填写frigate的容器ID> python3 /opt/conv2rknn.py`。如果转换成功，rknn 模型将被放置在`config/model_cache/rknn_cache`中

以下是需要根据你的 onnx 模型进行调整的配置文件范例：

```yaml
soc: ["rk3562", "rk3566", "rk3568", "rk3576", "rk3588"]
quantization: false

output_name: "{input_basename}"

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

DeGirum 可以使用[其网站](https://hub.degirum.com)上列出的任何类型硬件的检测器。DeGirum 可以通过 DeGirum AI 服务器或使用 `@local` 与本地硬件一起使用。你也可以直接连接到 DeGirum 的 AI Hub 来运行推理。**请注意：**此检测器**不能**用于商业目的。

### 配置

#### AI 服务器推理

在开始本部分的配置文件之前，你必须首先启动一个 AI 服务器。DeGirum 提供了一个可用的 AI 服务器作为 docker 容器。将此添加到你的 `docker-compose.yml` 以开始：

```yaml
degirum_detector:
  container_name: degirum
  image: degirum/aiserver:latest
  privileged: true
  ports:
    - "8778:8778"
```

只要相关运行时和驱动程序在你的机器上正确安装，所有支持的硬件都会在你的 AI 服务器主机上自动找到。如果你有任何问题，请参阅[DeGirum 文档站点](https://docs.degirum.com/pysdk/runtimes-and-drivers)。

完成后，更改 `config.yml` 文件很简单。

```yaml
degirum_detector:
  type: degirum
  location: degirum # 设置为服务名称（degirum_detector）、容器名称（degirum）或主机:端口（192.168.29.4:8778）
  zoo: degirum/public # DeGirum 的公共模型库。库名称应为 "workspace/zoo_name" 格式。degirum/public 对所有人开放，所以如果你不知道从哪里开始，请随意使用。如果你不是从 AI Hub 拉取模型，请将此和 'token' 留空。
  token: dg_example_token # 用于 AI Hub 的身份验证。通过 [AI Hub](https://hub.degirum.com) 主页的"tokens"部分获取此令牌。如果你从公共库拉取模型并使用 @local 或本地 DeGirum AI 服务器在你的本地硬件上运行推理，则可以留空
```

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

也可以不使用 AI 服务器的并直接运行硬件。这种方法的好处是没有将预测结果从 AI 服务器 docker 容器传输到 frigate 容器时产生的任何瓶颈。但是，实现本地推理的方法对每个设备和硬件组合都不同，所以通常得不偿失。实现这一目标的一般指南是：

1. 确保 frigate docker 容器具有你想要使用的运行时。例如，为 Hailo 运行 `@local` 意味着确保你使用的容器安装了 Hailo 运行时。
2. 要再次检查运行时是否被 DeGirum 检测器检测到，确保 `degirum sys-info` 命令正确显示你打算安装的任何运行时。
3. 在你的 `config.yml` 文件中创建 DeGirum 检测器。

```yaml
degirum_detector:
  type: degirum
  location: "@local" # 用于访问 AI Hub 设备和模型
  zoo: degirum/public # DeGirum 的公共模型库。库名称应为 "workspace/zoo_name" 格式。degirum/public 对所有人开放，所以如果你不知道从哪里开始，请随意使用。
  token: dg_example_token # 用于 AI Hub 的身份验证。通过 [AI Hub](https://hub.degirum.com) 主页的"tokens"部分获取此令牌。如果你从公共库拉取模型并使用 @local 或本地 DeGirum AI 服务器在你的本地硬件上运行推理，则可以留空
```

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

```yaml
degirum_detector:
  type: degirum
  location: "@cloud" # 用于访问 AI Hub 设备和模型
  zoo: degirum/public # DeGirum 的公共模型库。库名称应为 "workspace/zoo_name" 格式。degirum/public 对所有人开放，所以如果你不知道从哪里开始，请随意使用。
  token: dg_example_token # 用于 AI Hub 的身份验证。通过 (AI Hub)[https://hub.degirum.com) 主页的"tokens"部分获取此令牌
```

一旦 `degirum_detector` 设置完成，你可以通过 `config.yml` 文件中的'model'部分选择模型。

```yaml
model:
  path: mobilenet_v2_ssd_coco--300x300_quant_n2x_orca1_1
  width: 300 # 宽度在模型名称中作为"int"x"int"部分的第一个数字
  height: 300 # 高度在模型名称中作为"int"x"int"部分的第二个数字
  input_pixel_format: rgb/bgr # 查看 model.json 以确定在这里放置哪个
```

# 模型

Frigate 受限于协议等版权限制，不会自带某些模型，请自行下载相关模型并引用。

## 下载模型

以下是获取不同类型模型的提示

### 下载 D-FINE 模型

您可以通过运行以下命令将 D-FINE 模型导出为 ONNX 格式。请将整段命令复制粘贴到终端执行，只需修改第一行中的`MODEL_SIZE=s`参数，将其调整为`s`、`m`或`l`尺寸。

```sh
docker build . --build-arg MODEL_SIZE=s --output . -f- <<'EOF'
FROM python:3.11 AS build
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /dfine
RUN git clone https://github.com/Peterande/D-FINE.git .
RUN uv pip install --system -r requirements.txt
RUN uv pip install --system onnx onnxruntime onnxsim onnxscript
# 创建输出目录并下载检查点
RUN mkdir -p output
ARG MODEL_SIZE
RUN wget https://github.com/Peterande/storage/releases/download/dfinev1.0/dfine_${MODEL_SIZE}_obj2coco.pth -O output/dfine_${MODEL_SIZE}_obj2coco.pth
# 修改 export_onnx.py 的第 58 行以将批处理大小更改为 1
RUN sed -i '58s/data = torch.rand(.*)/data = torch.rand(1, 3, 640, 640)/' tools/deployment/export_onnx.py
RUN python3 tools/deployment/export_onnx.py -c configs/dfine/objects365/dfine_hgnetv2_${MODEL_SIZE}_obj2coco.yml -r output/dfine_${MODEL_SIZE}_obj2coco.pth
FROM scratch
ARG MODEL_SIZE
COPY --from=build /dfine/output/dfine_${MODEL_SIZE}_obj2coco.onnx /dfine-${MODEL_SIZE}.onnx
EOF
```

::: warning

相关模型的构建需要使用代理，国内网络可能无法正常访问国外的部分服务。

:::

### 下载 RF-DETR 模型

你可以通过运行以下命令将 RF-DETR 导出为 ONNX 格式。请将整段命令复制粘贴到终端执行，并根据需要将第一行中的`MODEL_SIZE=Nano`修改为`Nano`、`Small`或`Medium`规格。

```sh
docker build . --build-arg MODEL_SIZE=Nano --rm --output . -f- <<'EOF'
FROM python:3.11 AS build
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /rfdetr
RUN uv pip install --system rfdetr[onnxexport] torch==2.8.0 onnx==1.19.1 onnxscript
ARG MODEL_SIZE
RUN python3 -c "from rfdetr import RFDETR${MODEL_SIZE}; x = RFDETR${MODEL_SIZE}(resolution=320); x.export(simplify=True)"
FROM scratch
ARG MODEL_SIZE
COPY --from=build /rfdetr/output/inference_model.onnx /rfdetr-${MODEL_SIZE}.onnx
EOF
```

### 下载 YOLO-NAS 模型

点击下方的`Open in colab`按钮即可在 Google Colab 中使用此[构建脚本](https://github.com/blakeblackshear/frigate/blob/dev/notebooks/YOLO_NAS_Pretrained_Export.ipynb)可直接构建并下载预训练兼容模型。
[![在Colab中打开](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/blakeblackshear/frigate/blob/dev/notebooks/YOLO_NAS_Pretrained_Export.ipynb)

:::warning

注意，该在线构建服务由 Google 提供，中国大陆地区可能无法正常访问，请使用科学上网。

DeciAI 提供的预训练 YOLO-NAS 权重文件受其许可证约束，**不可用于商业用途**。更多信息请参阅：https://docs.deci.ai/super-gradients/latest/LICENSE.YOLONAS.html

:::

该 notebook 中的输入图像尺寸默认设置为 320x320。由于 Frigate 在执行检测前会将视频帧裁剪至关注区域，这种设置通常不会影响检测性能，同时还能降低 CPU 使用率并加快推理速度。如果需要，你可以将 notebook 和配置更新为 640x640 的输入尺寸。

### 下载 YOLO 模型

#### YOLOx

YOLOx 模型可以从[YOLOx 仓库](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/demo/ONNXRuntime)下载。

#### YOLOv3、YOLOv4 和 YOLOv7

导出为 ONNX 格式：

```sh
git clone https://github.com/NateMeyer/tensorrt_demos
cd tensorrt_demos/yolo
./download_yolo.sh
python3 yolo_to_onnx.py -m yolov7-320
```

#### YOLOv9

你可以使用以下命令将 YOLOv9 模型导出为 ONNX 格式。请根据需要修改第一行中的`MODEL_SIZE=t`和`IMG_SIZE=320`参数（模型大小`MODEL_SIZE`的值可替换为`t`, `s`, `m`, `c`, 以及 `e`等（从小到大排序） [模型尺寸](https://github.com/WongKinYiu/yolov9#performance)，图像大小`IMG_SIZE`可替换为`320` 或 `640`），然后将整段命令复制粘贴到安装了 Docker 的 Linux 系统中 或 运行 Frigate 的服务器终端执行（注意，**不是** Frigate 的容器终端里！）。

:::tip

如果你当前在中国大陆，建议使用`国内加速优化命令`，将会在构建过程中使用镜像源，提高构建模型的速度。

镜像构建时间大约在 10-15 分钟左右，请耐心等待。

:::

::: code-group

```sh [国内加速优化的脚本]
docker build . --build-arg MODEL_SIZE=t --build-arg IMG_SIZE=320 --output . -f- <<'EOF'
FROM docker.cnb.cool/frigate-cn/mirrors/docker-image/python:3.11 AS build
RUN rm -rf /etc/apt/sources.list
ADD https://cnb.cool/frigate-cn/frigate-cn/-/git/raw/main/scripts/sources.list /etc/apt/sources.list
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.nju.edu.cn/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /yolov9
ADD https://cnb.cool/frigate-cn/mirrors/wongkinyiu/yolov9.git .
RUN uv pip install -i https://mirrors.ustc.edu.cn/pypi/simple --system -r requirements.txt
RUN uv pip install -i https://mirrors.ustc.edu.cn/pypi/simple --system onnx==1.18.0 onnxruntime onnx-simplifier>=0.4.1 onnxscript
ARG MODEL_SIZE
ARG IMG_SIZE
ADD https://cnb.cool/frigate-cn/mirrors/wongkinyiu/yolov9/-/releases/download/v0.1/yolov9-${MODEL_SIZE}-converted.pt yolov9-${MODEL_SIZE}.pt
RUN sed -i "s/ckpt = torch.load(attempt_download(w), map_location='cpu')/ckpt = torch.load(attempt_download(w), map_location='cpu', weights_only=False)/g" models/experimental.py
RUN python3 export.py --weights ./yolov9-${MODEL_SIZE}.pt --imgsz ${IMG_SIZE} --simplify --include onnx
FROM scratch
ARG MODEL_SIZE
ARG IMG_SIZE
COPY --from=build /yolov9/yolov9-${MODEL_SIZE}.onnx /yolov9-${MODEL_SIZE}-${IMG_SIZE}.onnx
EOF
```

```sh [原版命令]
docker build . --build-arg MODEL_SIZE=t --build-arg IMG_SIZE=320 --output . -f- <<'EOF'
FROM python:3.11 AS build
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /yolov9
ADD https://github.com/WongKinYiu/yolov9.git .
RUN uv pip install --system -r requirements.txt
RUN uv pip install --system onnx==1.18.0 onnxruntime onnx-simplifier>=0.4.1 onnxscript
ARG MODEL_SIZE
ARG IMG_SIZE
ADD https://github.com/WongKinYiu/yolov9/releases/download/v0.1/yolov9-${MODEL_SIZE}-converted.pt yolov9-${MODEL_SIZE}.pt
RUN sed -i "s/ckpt = torch.load(attempt_download(w), map_location='cpu')/ckpt = torch.load(attempt_download(w), map_location='cpu', weights_only=False)/g" models/experimental.py
RUN python3 export.py --weights ./yolov9-${MODEL_SIZE}.pt --imgsz ${IMG_SIZE} --simplify --include onnx
FROM scratch
ARG MODEL_SIZE
ARG IMG_SIZE
COPY --from=build /yolov9/yolov9-${MODEL_SIZE}.onnx /yolov9-${MODEL_SIZE}-${IMG_SIZE}.onnx
EOF
```

:::
