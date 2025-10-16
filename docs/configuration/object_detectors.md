---
id: object_detectors
title: 物体/目标检测器
---

# 支持的硬件

:::info

Frigate支持多种不同类型的检测器，可在不同硬件上运行：

**通用硬件**

- [Coral EdgeTPU](#edge-tpu-detector)：Google Coral EdgeTPU提供USB和m.2两种接口，兼容多种设备。
- [Hailo](#hailo-8)：Hailo8和Hailo8L AI加速模块提供m.2接口和树莓派HAT，兼容多种设备。

**AMD**

- [ROCm](#amdrocm-gpu-detector)：ROCm可在AMD独立显卡上运行，提供高效物体/目标检测。
- [ONNX](#onnx)：当配置了支持的ONNX模型时，ROCm会在`-rocm`版Frigate镜像中自动被检测并使用。

**Intel**

- [OpenVino](#openvino-detector)：OpenVino可在Intel Arc 显卡、核显和CPU上运行，提供高效物体/目标检测。
- [ONNX](#onnx)：当配置了支持的ONNX模型时，OpenVINO会在标准Frigate镜像中自动被检测并使用。

**NVIDIA**
- [ONNX](#onnx)：当配置了受支持的 ONNX 模型时，在-tensorrt Frigate 镜像中，TensorRT 将被自动检测并用作检测器。

**Nvidia Jetson**

- [TensortRT](#nvidia-tensorrt检测器)：TensorRT可在Jetson设备上运行，使用多种预设模型。
- [ONNX](#onnx)：当配置了支持的ONNX模型时，TensorRT会在`-tensorrt-jp6`版Frigate镜像中自动被检测并使用。

**瑞芯微Rockchip**

- [RKNN](#rockchip-platform)：RKNN模型可在内置NPU的瑞芯微Rockchip设备上运行。

**测试用途**

- [CPU检测器(不推荐实际使用)](#cpu检测器不推荐使用)：使用CPU运行tflite模型，不推荐使用，在大多数情况下使用OpenVINO CPU模式可获得更好效果。

:::

:::note

不能混合使用多种检测器进行物体/目标检测（例如：不能同时使用OpenVINO和Coral EdgeTPU进行物体/目标检测）。

当然，不影响其他需要使用硬件加速任务，如[语义搜索](./semantic_search.md)。

:::

# 官方支持的检测器

Frigate提供以下内置检测器类型：`cpu`、`edgetpu`、`hailo8l`、`onnx`、`openvino`、`rknn`和`tensorrt`。默认情况下，Frigate会使用单个CPU检测器。其他检测器可能需要额外配置，如下所述。使用多个检测器时，它们会在专用进程中运行，但会从所有摄像头的公共检测请求队列中获取任务。

## Edge TPU检测器 {#edge-tpu-detector}

Edge TPU检测器类型运行TensorFlow Lite模型，利用Google Coral代理进行硬件加速。要配置Edge TPU检测器，将`"type"`属性设置为`"edgetpu"`。

Edge TPU设备可使用`"device"`属性指定，参考[TensorFlow Lite Python API文档](https://coral.ai/docs/edgetpu/multiple-edgetpu/#using-the-tensorflow-lite-python-api)。如果未设置，代理将使用它找到的第一个设备。

容器中提供了位于`/edgetpu_model.tflite`的TensorFlow Lite模型，默认情况下此检测器类型使用该模型。要提供自己的模型，请将文件绑定挂载到容器中，并通过`model.path`提供路径。

:::tip

如果未检测到Edge TPU，请参阅[Edge TPU常见故障排除步骤](/troubleshooting/edgetpu)。

:::

### 单个USB Coral

```yaml
detectors:
  coral:
    type: edgetpu
    device: usb
```

### 多个USB Coral

```yaml
detectors:
  coral1:
    type: edgetpu
    device: usb:0
  coral2:
    type: edgetpu
    device: usb:1
```

### 原生Coral(开发板)

**警告：`v0.9.x`版本后可能有[兼容性问题](https://github.com/blakeblackshear/frigate/issues/1706)**

```yaml
detectors:
  coral:
    type: edgetpu
    device: ""
```

### 单个PCIE/M.2 Coral

```yaml
detectors:
  coral:
    type: edgetpu
    device: pci
```

### 多个PCIE/M.2 Coral

```yaml
detectors:
  coral1:
    type: edgetpu
    device: pci:0
  coral2:
    type: edgetpu
    device: pci:1
```

### 混合使用Coral

```yaml
detectors:
  coral_usb:
    type: edgetpu
    device: usb
  coral_pci:
    type: edgetpu
    device: pci
```

---

## Hailo-8检测器 {#hailo-8}

Hailo-8检测器支持Hailo-8和Hailo-8L AI加速模块。该集成会自动通过Hailo CLI检测你的硬件架构，如果未指定自定义模型，则会选择适当的默认模型。

有关配置Hailo硬件的详细信息，请参阅[安装文档](../frigate/installation.md#hailo-8)。

### 配置

配置Hailo检测器时，你有两种指定模型的方式：本地**路径**或**URL**。
如果同时提供两者，检测器将首先检查给定的本地路径。如果未找到文件，则会从指定的URL下载模型。模型文件缓存在`/config/model_cache/hailo`目录下。

#### YOLO模型

此配置适用于基于YOLO的模型。当未提供自定义模型路径或URL时，检测器会根据检测到的硬件自动下载默认模型：

- **Hailo-8硬件**：使用**YOLOv6n**（默认：`yolov6n.hef`）
- **Hailo-8L硬件**：使用**YOLOv6n**（默认：`yolov6n.hef`）

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

#### SSD模型

对于基于SSD的模型，请提供你编译的SSD模型的路径或URL。集成将首先检查本地路径，必要时才会下载。

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
  # 为SSD MobileNet v1指定本地模型路径（如果可用）或URL
  # 本地路径示例：
  # path: /config/model_cache/h8l_cache/ssd_mobilenet_v1.hef
  #
  # 或使用自定义URL覆盖：
  # path: https://hailo-model-zoo.s3.eu-west-2.amazonaws.com/ModelZoo/Compiled/v2.14.0/hailo8l/ssd_mobilenet_v1.hef
```

#### 自定义模型

Hailo检测器支持所有为Hailo硬件编译并包含后处理的YOLO模型。你可以指定自定义URL或本地路径来下载或直接使用你的模型。如果同时提供两者，检测器会优先检查本地路径。

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

更多现成模型，请访问：[Hailo模型库](https://github.com/hailo-ai/hailo_model_zoo)

Hailo8支持Hailo模型库中所有包含HailoRT后处理的模型。你可以选择任何这些预配置模型用于你的实现。

> **注意：**
> config.path参数可以接受以.hef结尾的本地文件路径或URL。当提供时，检测器将首先检查路径是否为本地文件路径。如果文件在本地存在，将直接使用。如果未找到本地文件或提供了URL，则会尝试从指定URL下载模型。

---

## OpenVINO检测器 {#openvino-detector}

OpenVINO检测器类型可在AMD和Intel CPU、Intel GPU以及Intel VPU硬件上运行OpenVINO IR模型。要配置OpenVINO检测器，请将`"type"`属性设置为`"openvino"`。

使用的OpenVINO设备通过`"device"`属性指定，遵循[设备文档](https://docs.openvino.ai/2024/openvino-workflow/running-inference/inference-devices-and-modes.html)中的命名约定。最常见的设备是`CPU`和`GPU`。目前已知使用`AUTO`存在问题。为了向后兼容，如果在配置中设置了`AUTO`，Frigate将尝试使用`GPU`。

OpenVINO支持第6代Intel平台(Skylake)及更新版本。尽管没有官方支持，它也可以在AMD CPU上运行。使用`GPU`设备需要支持的Intel平台。有关详细的系统要求，请参阅[OpenVINO系统要求](https://docs.openvino.ai/2024/about-openvino/release-notes-openvino/system-requirements.html)

:::tip

当使用多个摄像头时，一个检测器可能无法满足需求。如果有可用的GPU资源，可以定义多个检测器。示例配置如下：

```yaml
detectors:
  ov_0:
    type: openvino
    device: GPU
  ov_1:
    type: openvino
    device: GPU
```

:::

### 支持的模型 {#supported-models}

#### SSDLite MobileNet v2

容器中提供了位于`/openvino-model/ssdlite_mobilenet_v2.xml`的OpenVINO模型，默认情况下此检测器类型使用该模型。该模型来自Intel的开放模型库[SSDLite MobileNet V2](https://github.com/openvinotoolkit/open_model_zoo/tree/master/models/public/ssdlite_mobilenet_v2)，并转换为FP16精度的IR模型。

使用默认OpenVINO模型时，请使用如下所示的模型配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU

model:
  width: 300
  height: 300
  input_tensor: nhwc
  input_pixel_format: bgr
  path: /openvino-model/ssdlite_mobilenet_v2.xml
  labelmap_path: /openvino-model/coco_91cl_bkgr.txt
```

#### YOLOX模型

该检测器也支持YOLOX模型。Frigate没有预加载任何YOLOX模型，因此你需要自行提供模型。

#### YOLO-NAS模型

[YOLO-NAS](https://github.com/Deci-AI/super-gradients/blob/master/YOLONAS.md)模型受支持，但默认不包含。有关下载YOLO-NAS模型用于Frigate的更多信息，请参阅[模型部分](#下载yolo-nas模型)。

:::warning

如果你使用的是 Frigate+ YOLO-NAS 模型，则除了 path 参数外，不应在配置中定义以下任何 model 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的onnx模型放入配置文件夹后，可以使用以下配置：

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

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。

#### YOLO(v3,v4,v7,v9)模型

YOLOv3、YOLOv4、YOLOv7和[YOLOv9](https://github.com/WongKinYiu/yolov9)模型受支持，但默认不包含。

:::tip

YOLO检测器设计用于支持YOLOv3、YOLOv4、YOLOv7和YOLOv9模型，但也可能支持其他YOLO模型架构。

:::

:::warning

如果你使用的是 Frigate+ YOLOv9 模型，则除了 path 参数外，不应在配置中定义以下任何 model 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的onnx模型放入配置文件夹后，可以使用以下配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU

model:
  model_type: yolo-generic
  width: 320 # <--- 应与模型导出时设置的imgsize匹配
  height: 320 # <--- 应与模型导出时设置的imgsize匹配
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/yolo.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。

#### RF-DETR模型

[RF-DETR](https://github.com/roboflow/rf-detr)是基于DETR的模型。支持导出的ONNX模型，但默认不包含。有关下载RF-DETR模型用于Frigate的更多信息，请参阅[模型部分](#下载rf-detr模型)。

:::warning

由于RF-DETR模型的尺寸和复杂性，建议仅在独立Arc显卡上运行。

:::

将下载的onnx模型放入`config/model_cache`文件夹后，可以使用以下配置：

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

#### D-FINE模型

[D-FINE](https://github.com/Peterande/D-FINE)是基于DETR的模型。支持导出的ONNX模型，但默认不包含。有关下载D-FINE模型用于Frigate的更多信息，请参阅[模型部分](#下载d-fine模型)。

:::warning

目前D-FINE模型只能在OpenVINO的CPU模式下运行，GPU目前无法编译该模型

:::

将下载的onnx模型放入`config/model_cache`文件夹后，可以使用以下配置：

```yaml
detectors:
  ov:
    type: openvino
    device: GPU

model:
  model_type: dfine
  width: 640
  height: 640
  input_tensor: nchw
  input_dtype: float
  path: /config/model_cache/dfine_s_obj2coco.onnx
  labelmap_path: /labelmap/coco-80.txt
```

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。


## AMD/ROCm GPU检测器 {#amdrocm-gpu-detector}

### 设置 {#setup}

AMD GPU的支持通过[ONNX检测器](#ONNX)提供。要使用AMD GPU进行物体/目标检测，请使用带有`-rocm`后缀的Frigate docker镜像，例如`docker.cnb.cool/frigate-cn/frigate:stable-rocm`。

### Docker GPU访问设置 {#docker-settings-for-gpu-access}

ROCm需要访问`/dev/kfd`和`/dev/dri`设备。当docker或frigate不以root身份运行时，还应添加`video`（可能还有`render`和`ssl/_ssl`）组。

直接运行docker时，应添加以下标志以访问设备：

```bash
$ docker run --device=/dev/kfd --device=/dev/dri  \
    ...
```

使用Docker Compose时：

```yaml
services:
  frigate:
---
devices:
  - /dev/dri
  - /dev/kfd
```

有关推荐设置的参考，请参阅[在Docker中运行ROCm/pytorch](https://rocm.docs.amd.com/projects/install-on-linux/en/develop/how-to/3rd-party/pytorch-install.html#using-docker-with-pytorch-pre-installed)。

### 覆盖GPU芯片组的Docker设置 {#docker-settings-for-overriding-the-gpu-chipset}

你的GPU可能无需特殊配置即可正常工作，但在许多情况下需要手动设置。AMD/ROCm软件栈附带有限的GPU驱动程序集，对于较新或缺失的型号，你需要将芯片组版本覆盖为较旧/通用版本才能使其工作。

此外，AMD/ROCm不"正式"支持核显。它仍然可以与大多数核显正常工作，但需要特殊设置。必须配置`HSA_OVERRIDE_GFX_VERSION`环境变量。有关背景和示例，请参阅[ROCm问题报告](https://github.com/ROCm/ROCm/issues/1743)。

对于rocm frigate构建，有一些自动检测：

- gfx1031 -> 10.3.0
- gfx1103 -> 11.0.0

如果你有其他芯片组，可能需要在Docker启动时覆盖`HSA_OVERRIDE_GFX_VERSION`。假设你需要的版本是`10.0.0`，则应从命令行配置为：

```bash
$ docker run -e HSA_OVERRIDE_GFX_VERSION=10.0.0 \
    ...
```

使用Docker Compose时：

```yaml
services:
  frigate:

environment:
  HSA_OVERRIDE_GFX_VERSION: "10.0.0"
```

确定你需要的版本可能很复杂，因为你无法从AMD品牌名称中判断芯片组名称和驱动程序。

1. 首先通过在frigate容器中运行`/opt/rocm/bin/rocminfo`确保rocm环境正常运行 - 它应该列出CPU和GPU及其属性
2. 从`rocminfo`的输出中找到你拥有的芯片组版本(gfxNNN)（见下文）
3. 使用搜索引擎查询给定gfx名称所需的`HSA_OVERRIDE_GFX_VERSION`("gfxNNN ROCm HSA_OVERRIDE_GFX_VERSION")
4. 用相关值覆盖`HSA_OVERRIDE_GFX_VERSION`
5. 如果仍然无法工作，请检查frigate docker日志

#### 检查AMD/ROCm是否正常工作并找到你的GPU {#figuring-out-if-amdrocm-is-working-and-found-your-gpu}

```bash
$ docker exec -it frigate /opt/rocm/bin/rocminfo
```

#### 确定你的AMD GPU芯片组版本：{#figuring-out-your-amd-gpu-chipset-version}

我们取消设置`HSA_OVERRIDE_GFX_VERSION`以防止现有覆盖干扰结果：

```bash
$ docker exec -it frigate /bin/bash -c '(unset HSA_OVERRIDE_GFX_VERSION && /opt/rocm/bin/rocminfo |grep gfx)'
```

### 支持的模型 {#supported-models-1}

有关支持的模型，请参阅[ONNX支持的模型](#supported-models-2)，但有以下注意事项：

- 不支持D-FINE模型
- 已知YOLO-NAS模型在核显上运行不佳

## ONNX

ONNX是一种用于构建机器学习模型的开放格式，Frigate支持在CPU、OpenVINO、ROCm和TensorRT上运行ONNX模型。启动时，Frigate会自动尝试使用可用的GPU。

:::info

如果使用了适合你GPU的正确构建版本，GPU将被自动检测并使用。

- **AMD**

  - 在`-rocm`版Frigate镜像中，ROCm会被自动检测并与ONNX检测器一起使用。

- **Intel**

  - 在标准Frigate镜像中，OpenVINO会被自动检测并与ONNX检测器一起使用。

- **NVIDIA**
  - 在`-tensorrt`版Frigate镜像中，NVIDIA GPU会被自动检测并与ONNX检测器一起使用。
  - 在`-tensorrt-jp(4/5)`版Frigate镜像中，Jetson设备会被自动检测并与ONNX检测器一起使用。

:::

:::tip

当使用多个摄像头时，一个检测器可能无法满足需求。如果有可用的GPU资源，可以定义多个检测器。示例配置如下：

```yaml
detectors:
  onnx_0:
    type: onnx
  onnx_1:
    type: onnx
```

:::

### 支持的模型 {#supported-models-2}

没有提供默认模型，支持以下格式：

#### YOLO-NAS

[YOLO-NAS](https://github.com/Deci-AI/super-gradients/blob/master/YOLONAS.md)模型受支持，但默认不包含。有关下载YOLO-NAS模型用于Frigate的更多信息，请参阅[模型部分](#下载yolo-nas模型)。

将下载的onnx模型放入配置文件夹后，可以使用以下配置：

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

YOLOv3、YOLOv4、YOLOv7和[YOLOv9](https://github.com/WongKinYiu/yolov9)模型受支持，但默认不包含。

:::tip

YOLO检测器设计用于支持YOLOv3、YOLOv4、YOLOv7和YOLOv9模型，但也可能支持其他YOLO模型架构。有关下载YOLO模型用于Frigate的更多信息，请参阅[模型部分](#下载yolo模型)。

:::

:::warning

如果你使用的是 Frigate+ YOLOv9 模型，则除了 path 参数外，不应在配置中定义以下任何 model 相关参数。有关模型设置的更多信息，请参阅 [Frigate+ 模型文档](../plus/first_model#step-3-set-your-model-id-in-the-config)。

:::

将下载的onnx模型放入配置文件夹后，可以使用以下配置：

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

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。

#### YOLOx

[YOLOx](https://github.com/Megvii-BaseDetection/YOLOX)模型受支持，但默认不包含。有关下载YOLOx模型用于Frigate的更多信息，请参阅[模型部分](#下载yolo模型)。

将下载的onnx模型放入配置文件夹后，可以使用以下配置：

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

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。

#### RF-DETR

[RF-DETR](https://github.com/roboflow/rf-detr)是基于DETR的模型。支持导出的ONNX模型，但默认不包含。有关下载RF-DETR模型用于Frigate的更多信息，请参阅[模型部分](#下载rf-detr模型)。

将下载的onnx模型放入`config/model_cache`文件夹后，可以使用以下配置：

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

[D-FINE](https://github.com/Peterande/D-FINE)是基于DETR的模型。支持导出的ONNX模型，但默认不包含。有关下载D-FINE模型用于Frigate的更多信息，请参阅[模型部分](#下载d-fine模型)。

将下载的onnx模型放入`config/model_cache`文件夹后，可以使用以下配置：

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

注意：标签映射使用的是完整COCO标签集的子集，仅包含80个对象。

## CPU检测器(不推荐使用)

CPU检测器类型运行TensorFlow Lite模型，使用CPU进行处理而不使用硬件加速。建议使用硬件加速的检测器类型以获得更好的性能。要配置基于CPU的检测器，请将`"type"`属性设置为`"cpu"`。

:::danger

不建议将CPU检测器用于一般用途。如果你没有GPU或Edge TPU硬件，使用[OpenVINO检测器](#openvino-detector)的CPU模式通常比使用CPU检测器更高效。

:::

可以通过`"num_threads"`属性指定解释器使用的线程数，默认为`3`。

容器中提供了位于`/cpu_model.tflite`的TensorFlow Lite模型，默认情况下此检测器类型使用该模型。要提供自己的模型，请将文件绑定挂载到容器中，并通过`model.path`提供路径。

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

使用CPU检测器时，可以为每个摄像头添加一个CPU检测器。添加比摄像头数量更多的检测器不会提高性能。

## Deepstack / CodeProject.AI 服务器检测器

Frigate的Deepstack/CodeProject.AI服务器检测器允许你将Deepstack和CodeProject.AI的物体/目标检测功能集成到Frigate中。CodeProject.AI和DeepStack是开源AI平台，可以在各种设备上运行，如树莓派、NVIDIA Jetson和其他兼容硬件。需要注意的是，集成是通过网络进行的，因此推理时间可能不如原生Frigate检测器快，但它仍然为物体/目标检测和跟踪提供了高效可靠的解决方案。

### 设置

要开始使用CodeProject.AI，请访问其[官方网站](https://www.codeproject.com/Articles/5322557/CodeProject-AI-Server-AI-the-easy-way)，按照说明在你选择的设备上下载并安装AI服务器。CodeProject.AI的详细设置说明不在Frigate文档范围内。

要将CodeProject.AI集成到Frigate中，你需要对Frigate配置文件进行以下更改：

```yaml
detectors:
  deepstack:
    api_url: http://<你的codeproject_ai服务器IP>:<端口>/v1/vision/detection
    type: deepstack
    api_timeout: 0.1 # 秒
```

将`<你的codeproject_ai服务器IP>`和`<端口>`替换为你的CodeProject.AI服务器的IP地址和端口。

要验证集成是否正常工作，请启动Frigate并观察日志中是否有与CodeProject.AI相关的错误消息。此外，你可以检查Frigate网络界面，查看CodeProject.AI检测到的对象是否正确显示和跟踪。

# 由社区支持的检测器

## NVIDIA TensorRT检测器 {#nvidia-tensorrt-detector}

英伟达 Jetson 设备可使用 TensorRT 库进行目标检测。由于附加库的大小问题，此检测器仅在带有`-tensorrt-jp6`标签后缀的镜像中提供，例如`docker.cnb.cool/frigate-cn/frigate:stable-tensorrt-jp6`。此检测器旨在与用于目标检测的 Yolo 模型配合使用。

### 生成模型 {#generate-models}

用于TensorRT的模型必须在其运行的同一硬件平台上进行预处理。这意味着每个用户都必须执行额外的设置，为TensorRT库生成模型文件。其中包含一个脚本，可构建几种常见的模型。

如果在启动时未找到指定的模型，Frigate镜像将生成模型文件。已处理的模型存储在`/config/model_cache`文件夹中。通常，`/config`路径已映射到主机上的一个目录，除非用户希望将其存储在主机上的其他位置，否则无需单独映射`model_cache`。

默认情况下，不会生成任何模型，但可以通过在Docker中指定`YOLO_MODELS`环境变量来覆盖此设置。可以以逗号分隔的格式列出一个或多个模型，每个模型都将被生成。仅当`model_cache`文件夹中不存在相应的`{model}.trt`文件时，才会生成模型，因此，你可以通过从Frigate数据文件夹中删除模型文件，来强制重新生成模型。

如果你拥有带有DLA（Xavier或Orin）的Jetson设备，可以通过在模型名称后附加`-dla`来生成将在DLA上运行的模型，例如指定`YOLO_MODELS=yolov7 - 320 - dla`。该模型将在DLA0上运行（Frigate目前不支持DLA1）。与DLA不兼容的层将回退到在GPU上运行。

如果你的GPU不支持FP16操作，可以传递环境变量`USE_FP16=False`来禁用它。

可以通过向`docker run`命令或在`docker - compose.yml`文件中传递环境变量来选择特定的模型。使用`-e YOLO_MODELS=yolov4 - 416,yolov4 - tiny - 416`的形式来选择一个或多个模型名称。可用的模型如下所示。 

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

为Pascal显卡转换`yolov4-608`和`yolov7x-640`模型的`docker-compose.yml`片段示例如下：

```yml
frigate:
  environment:
    - YOLO_MODELS=yolov7-320,yolov7x-640
    - USE_FP16=false
```

### 配置参数

通过将`tensorrt`指定为模型类型，可以选择TensorRT检测器。需要使用[硬件加速](hardware_acceleration_video.md#nvidia-gpu)部分所述的相同方法，将GPU透传到Docker容器。如果透传多个GPU，可以使用`device`配置参数选择检测器使用哪个GPU。`device`参数是GPU索引的整数值，可在容器内通过`nvidia - smi`查看。

TensorRT检测器默认使用位于`/config/model_cache/tensorrt`中的`.trt`模型文件。所使用的模型路径和维度将取决于你生成的模型。 

使用以下配置来处理生成的TRT模型：

```yaml
detectors:
  tensorrt:
    type: tensorrt
    device: 0 #这是默认值，选择第一个GPU

model:
  path: /config/model_cache/tensorrt/yolov7-320.trt
  labelmap_path: /labelmap/coco-80.txt
  input_tensor: nchw
  input_pixel_format: rgb
  width: 320 # 必须与所选模型匹配，例如 yolov7-320 对应 320，yolov4-416 对应 416
  height: 320 # 必须与所选模型匹配，例如 yolov7-320 对应 320，yolov4-416 对应 416
```

## 瑞芯微Rockchip平台检测器 {#rockchip-platform}

瑞芯微Rockchip平台支持以下SoC的硬件加速物体/目标检测：

- RK3562
- RK3566
- RK3568
- RK3576
- RK3588

该实现使用[Rockchip的RKNN-Toolkit2](https://github.com/airockchip/rknn-toolkit2/) v2.3.2版本。

:::tip

多摄像头场景下，单个检测器可能处理不过来。若NPU资源允许，可配置多个检测器，例如：

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

请确保按照[Rockchip特定安装说明](../frigate/installation#rockchip-platform)进行操作。

:::tip

你可以通过以下命令查看NPU负载：

```bash
$ cat /sys/kernel/debug/rknpu/load
>> NPU load:  Core0:  0%, Core1:  0%, Core2:  0%,
```

:::

### 支持的模型 {#supported-models-3}

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

以下推理时间是在rk3588上使用3个NPU核心测得的：

| 模型               | 大小(MB) | 推理时间(ms) |
| ------------------- | -------- | ------------ |
| deci-fp16-yolonas_s   | 24         | 25                   |
| deci-fp16-yolonas_m   | 62         | 35                   |
| deci-fp16-yolonas_l   | 81         | 45                   |
| frigate-fp16-yolov9-t | 6          | 35                   |
| rock-i8-yolox_nano    | 3          | 14                   |
| rock-i8_yolox_tiny    | 6          | 18                   |

- 所有模型都会自动下载并存储在`config/model_cache/rknn_cache`文件夹中。升级Frigate后，应删除旧模型以释放空间。
- 你也可以提供自己的`.rknn`模型。请不要将自己的模型保存在`rknn_cache`文件夹中，应直接存储在`model_cache`文件夹或其他子文件夹中。要将模型转换为`.rknn`格式，请参阅`rknn-toolkit2`（需要x86机器）。注意，仅支持对特定模型进行后处理。

#### YOLO-NAS模型

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

DeciAI提供的预训练YOLO-NAS权重受其许可证约束，不可用于商业用途。更多信息请参阅：https://docs.deci.ai/super-gradients/latest/LICENSE.YOLONAS.html

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

#### YOLOx模型

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

### 将自定义onnx模型转换为rknn格式 {converting-your-own-onnx-model-to-rknn-format}

要使用[rknn-toolkit2](https://github.com/airockchip/rknn-toolkit2/)将onnx模型转换为rknn格式，你需要：

1. 将一个或多个onnx格式的模型放置在Docker主机的`config/model_cache/rknn_cache/onnx`目录下（可能需要`sudo`权限）
2. 将配置文件保存为`config/conv2rknn.yaml`（详见下文）
3. 运行`docker exec <frigate_container_id> python3 /opt/conv2rknn.py`。如果转换成功，rknn模型将被放置在`config/model_cache/rknn_cache`中

以下是需要根据你的onnx模型进行调整的示例配置文件：

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

- `soc`: 要为其构建rknn模型的SoC列表。如果不指定此参数，脚本会尝试检测你的SoC并为其构建rknn模型
- `quantization`: true表示8位整数(i8)量化，false表示16位浮点(fp16)。默认值：false
- `output_name`: 模型的输出名称。可用变量：
  - `quant`: 根据配置为"i8"或"fp16"
  - `input_basename`: 输入模型的基本名称（例如，如果输入模型名为"my_model.onnx"，则为"my_model"）
  - `soc`: 模型构建的目标SoC（如"rk3588"）
  - `tk_version`: `rknn-toolkit2`的版本（如"2.3.0"）
  - **示例**: 指定`output_name = "frigate-{quant}-{input_basename}-{soc}-v{tk_version}"`可能会生成名为`frigate-i8-my_model-rk3588-v2.3.0.rknn`的模型
- `config`: 传递给`rknn-toolkit2`进行模型转换的配置。所有可用参数的说明请参阅[本手册](https://github.com/MarcA711/rknn-toolkit2/releases/download/v2.3.2/03_Rockchip_RKNPU_API_Reference_RKNN_Toolkit2_V2.3.2_EN.pdf)的"2.2. 模型配置"部分

# 模型

某些模型类型默认不包含在Frigate中。

## 下载模型

以下是获取不同类型模型的提示

### 下载D-FINE模型

您可以通过运行以下命令将D-FINE模型导出为ONNX格式。请将整段命令复制粘贴到终端执行，只需修改第一行中的`MODEL_SIZE=s`参数，将其调整为`s`、`m`或`l`尺寸。

```sh
docker build . --build-arg MODEL_SIZE=s --output . -f- <<'EOF'
FROM python:3.11 AS build
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /dfine
RUN git clone https://github.com/Peterande/D-FINE.git .
RUN uv pip install --system -r requirements.txt
RUN uv pip install --system onnx onnxruntime onnxsim
# Create output directory and download checkpoint
RUN mkdir -p output
ARG MODEL_SIZE
RUN wget https://github.com/Peterande/storage/releases/download/dfinev1.0/dfine_${MODEL_SIZE}_obj2coco.pth -O output/dfine_${MODEL_SIZE}_obj2coco.pth
# Modify line 58 of export_onnx.py to change batch size to 1
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

### 下载RF-DETR模型

你可以通过运行以下命令将RF-DETR导出为ONNX格式。请将整段命令复制粘贴到终端执行，并根据需要将第一行中的`MODEL_SIZE=Nano`修改为`Nano`、`Small`或`Medium`规格。

```sh
docker build . --build-arg MODEL_SIZE=Nano --output . -f- <<'EOF'
FROM python:3.11 AS build
RUN apt-get update && apt-get install --no-install-recommends -y libgl1 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.8.0 /uv /bin/
WORKDIR /rfdetr
RUN uv pip install --system rfdetr[onnxexport]
ARG MODEL_SIZE
RUN python3 -c "from rfdetr import RFDETR${MODEL_SIZE}; x = RFDETR${MODEL_SIZE}(resolution=320); x.export(simplify=True)"
FROM scratch
ARG MODEL_SIZE
COPY --from=build /rfdetr/output/inference_model.onnx /rfdetr-${MODEL_SIZE}.onnx
EOF
```

### 下载YOLO-NAS模型

点击下方的`Open in colab`按钮即可在 Google Colab中使用此[构建脚本](https://github.com/blakeblackshear/frigate/blob/dev/notebooks/YOLO_NAS_Pretrained_Export.ipynb)可直接构建并下载预训练兼容模型。
[![在Colab中打开](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/blakeblackshear/frigate/blob/dev/notebooks/YOLO_NAS_Pretrained_Export.ipynb)

:::warning

注意，该在线构建服务由Google提供，中国大陆地区可能无法正常访问，请使用科学上网。

DeciAI提供的预训练YOLO-NAS权重受其许可证约束，不可用于商业用途。更多信息请参阅：https://docs.deci.ai/super-gradients/latest/LICENSE.YOLONAS.html

:::

本笔记本中的输入图像尺寸默认设置为320x320。由于Frigate在执行检测前会将视频帧裁剪至关注区域，这种设置通常不会影响检测性能，同时还能降低CPU使用率并加快推理速度。如果需要，你可以将笔记本和配置更新为640x640的输入尺寸。

### 下载YOLO模型

#### YOLOx

YOLOx模型可以从[YOLOx仓库](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/demo/ONNXRuntime)下载。

#### YOLOv3、YOLOv4和YOLOv7

导出为ONNX格式：

```sh
git clone https://github.com/NateMeyer/tensorrt_demos
cd tensorrt_demos/yolo
./download_yolo.sh
python3 yolo_to_onnx.py -m yolov7-320
```

#### YOLOv9

你可以使用以下命令将YOLOv9模型导出为ONNX格式。请将整段命令复制粘贴到终端执行，并根据需要修改第一行中的`MODEL_SIZE=t`和`IMG_SIZE=320`参数（模型大小`MODEL_SIZE`的值可替换为`t`, `s`, `m`, `c`, 以及 `e`等 [模型尺寸](https://github.com/WongKinYiu/yolov9#performance)，图像大小`IMG_SIZE`可替换为`320` 或 `640`）。

```sh
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