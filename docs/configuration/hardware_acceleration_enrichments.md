---
id: hardware_acceleration_enrichments
title: 功能增强
---

# 功能增强

Frigate 的一些功能增强可以使用独立的 GPU 进行加速处理。

## 要求

对象检测和功能增强（如语义搜索、人脸识别和车牌识别）是独立的功能。要使用 GPU 进行对象检测，请参阅[对象检测器](/configuration/object_detectors.md)文档。如果您想将 GPU 用于任何支持的功能增强，您必须为您的 GPU 选择适当的 Frigate Docker 镜像，并根据其具体文档配置功能增强。

- **AMD**

  - ROCm 将在 `-rocm` Frigate 镜像中自动被检测和使用于功能增强。

- **Intel**

  - OpenVINO 将在默认 Frigate 镜像中自动被检测和使用于功能增强。

- **Nvidia**
  - Nvidia GPU 将在 `-tensorrt` Frigate 镜像中自动被检测和使用于功能增强。
  - Jetson 设备将在 `-tensorrt-jp6` Frigate 镜像中自动被检测和使用于功能增强。

将 GPU 用于功能增强不要求您将同一个 GPU 用于对象检测。例如，您可以运行 `tensorrt` Docker 镜像用于功能增强，同时仍然使用其他专用硬件例如 Coral 或者 Hailo 进行对象检测。但需要注意，TensorRT（用于目标检测）与OpenVINO（用于图像增强）的混合搭配方案当前不受支持。

:::note

Google Coral 是一个 TPU（张量处理单元），而不是专用 GPU（图形处理单元），因此不能为 Frigate 的功能增强提供任何加速。

:::