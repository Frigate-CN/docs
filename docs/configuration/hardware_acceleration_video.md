---
id: hardware_acceleration_video
title: 视频解码
---

# 视频解码

强烈建议在 Frigate 中使用 GPU 进行硬件加速视频解码。某些类型的硬件加速会被自动检测并使用，但您可能需要更新配置以在 ffmpeg 中启用硬件加速解码。

根据您的系统，这些参数可能不兼容。更多关于 ffmpeg 硬件加速解码的信息请参考：https://trac.ffmpeg.org/wiki/HWAccelIntro

## 树莓派 3/4

确保为 GPU 分配至少 128MB 内存（通过 `raspi-config` > 性能选项 > GPU 内存设置）。
如果使用 Home Assistant 插件，可能需要使用完全访问版本并关闭"保护模式"以启用硬件加速。

```yaml
# 如果要解码 h264 流
ffmpeg:
  hwaccel_args: preset-rpi-64-h264

# 如果要解码 h265 (hevc) 流
ffmpeg:
  hwaccel_args: preset-rpi-64-h265
```

:::note

如果通过 Docker 运行 Frigate，需要以特权模式运行或将 `/dev/video*` 设备映射到 Frigate。使用 Docker Compose 添加：

```yaml
services:
  frigate:
    ...
    devices:
      - /dev/video11:/dev/video11
```

或使用 `docker run`：

```bash
docker run -d \
  --name frigate \
  ...
  --device /dev/video11 \
  ghcr.io/blakeblackshear/frigate:stable
```

`/dev/video11` 是正确的设备（在树莓派 4B 上）。您可以通过运行以下命令并查找 `H264` 来检查：

```bash
for d in /dev/video*; do
  echo -e "---\n$d"
  v4l2-ctl --list-formats-ext -d $d
done
```

或者映射所有 `/dev/video*` 设备。

:::

## 基于 Intel 的 CPU

:::info

**推荐硬件加速预设**

| CPU 代数 | Intel 驱动 | 推荐预设 | 说明 |
|---------|------------|----------|------|
| 1-5代   | i965       | preset-vaapi | 不支持 qsv |
| 6-7代   | iHD        | preset-vaapi | 不支持 qsv |
| 8-12代  | iHD        | preset-vaapi | 也可使用 preset-intel-qsv-* |
| 13代+   | iHD/Xe     | preset-intel-qsv-* | |
| Intel Arc GPU | iHD/Xe | preset-intel-qsv-* | |

:::

:::note

默认驱动是 `iHD`。您可能需要通过添加环境变量 `LIBVA_DRIVER_NAME=i965` 来改用 i965 驱动（在 docker-compose 文件中或[在 HA 插件的 config.yml 中](advanced.md#environment_vars)）。

参考[Intel 文档](https://www.intel.com/content/www/us/en/support/articles/000005505/processors.html)确认您的 CPU 是第几代的。

:::

### 通过 VAAPI

VAAPI 支持自动配置文件选择，可自动处理 H.264 和 H.265 流。

```yaml
ffmpeg:
  hwaccel_args: preset-vaapi
```

### 通过 QuickSync

#### H.264 流

```yaml
ffmpeg:
  hwaccel_args: preset-intel-qsv-h264
```

#### H.265 流

```yaml
ffmpeg:
  hwaccel_args: preset-intel-qsv-h265
```

### Docker 中配置 Intel GPU 统计

需要额外配置才能使 Docker 容器访问 `intel_gpu_top` 命令获取 GPU 统计信息。有两种选择：

1. 以特权模式运行容器。
2. 添加 `CAP_PERFMON` 能力（注意：您可能需要将 `perf_event_paranoid` 设置得足够低以允许访问性能事件系统。）

#### 以特权模式运行

这种方法有效，但会赋予容器超出实际需要的权限。

##### Docker Compose - 特权模式

```yaml
services:
  frigate:
    ...
    image: ghcr.io/blakeblackshear/frigate:stable
    privileged: true
```

##### Docker Run CLI - 特权模式

```bash
docker run -d \
  --name frigate \
  ...
  --privileged \
  ghcr.io/blakeblackshear/frigate:stable
```

#### CAP_PERFMON

只有较新版本的 Docker 支持 `CAP_PERFMON` 能力。您可以通过运行以下命令测试您的版本是否支持：`docker run --cap-add=CAP_PERFMON hello-world`

##### Docker Compose - CAP_PERFMON

```yaml
services:
  frigate:
    ...
    image: ghcr.io/blakeblackshear/frigate:stable
    cap_add:
      - CAP_PERFMON
```

##### Docker Run CLI - CAP_PERFMON

```bash
docker run -d \
  --name frigate \
  ...
  --cap-add=CAP_PERFMON \
  ghcr.io/blakeblackshear/frigate:stable
```

#### perf_event_paranoid

**注意：此设置必须针对整个系统修改。**

关于不同发行版的值的更多信息，请参见 https://askubuntu.com/questions/1400874/what-does-perf-paranoia-level-four-do。

根据您的操作系统和内核配置，您可能需要更改 `/proc/sys/kernel/perf_event_paranoid` 内核可调参数。您可以通过运行 `sudo sh -c 'echo 2 >/proc/sys/kernel/perf_event_paranoid'` 来测试更改，这将持续到重启。通过运行 `sudo sh -c 'echo kernel.perf_event_paranoid=2 >> /etc/sysctl.d/local.conf'` 使其永久生效。

#### SR-IOV或其他设备的统计信息配置

当通过SR-IOV使用虚拟化GPU时，需要额外参数才能获取GPU统计信息。您可以通过指定以下配置来启用此功能：即设置用于从`intel_gpu_top`收集统计信息的设备路径。以下示例可能适用于某些使用SR-IOV的系统：

```yaml
telemetry:
  stats:
    sriov: true
    intel_gpu_device: "sriov"
```

对于其他虚拟化GPU，可以尝试直接指定设备路径：

```yaml
telemetry:
  stats:
    intel_gpu_device: "drm:/dev/dri/card0"
```

如果您指定了设备路径，请确保已将设备透传到容器中。

## AMD/ATI GPU（Radeon HD 2000 及更新的 GPU）通过 libva-mesa-driver

VAAPI 支持自动配置文件选择，可自动处理 H.264 和 H.265 流。

:::note

您需要通过添加环境变量 `LIBVA_DRIVER_NAME=radeonsi` 来改用 radeonsi 驱动（在 docker-compose 文件中或[在 HA 插件的 config.yml 中](advanced.md#environment_vars)）。

:::

```yaml
ffmpeg:
  hwaccel_args: preset-vaapi
```

## NVIDIA GPU

虽然旧的 GPU 可能也能工作，但建议使用现代的、受支持的 GPU。NVIDIA 提供了[支持的 GPU 和功能矩阵](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new)。如果您的显卡在列表中并支持 CUVID/NVDEC，它很可能可以用于 Frigate 的解码。但是，您必须使用[与 FFmpeg 兼容的驱动版本](https://github.com/FFmpeg/nv-codec-headers/blob/master/README)。旧的驱动版本可能缺少符号而无法工作，而旧的显卡不受新驱动版本支持。解决这个问题的唯一方法是[提供您自己的 FFmpeg](/configuration/advanced#custom-ffmpeg-build)，使其能与您的驱动版本一起工作，但这是不受支持的，可能效果不佳甚至完全无法工作。

更完整的显卡和兼容驱动列表可在[驱动发布说明](https://download.nvidia.com/XFree86/Linux-x86_64/525.85.05/README/supportedchips.html)中找到。

如果您的发行版不提供 NVIDIA 驱动包，您可以[在此下载](https://www.nvidia.com/en-us/drivers/unix/)。

### Docker 中配置 NVIDIA GPU

Docker 容器需要额外配置才能访问 NVIDIA GPU。支持的方法是安装 [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker) 并向 Docker 指定 GPU。具体方法取决于 Docker 的运行方式：

#### Docker Compose - Nvidia GPU

```yaml
services:
  frigate:
    ...
    image: ghcr.io/blakeblackshear/frigate:stable-tensorrt
    deploy:    # <------------- 添加此部分到底部的代码
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0'] # 仅在使用多个 GPU 时需要
              count: 1 # GPU 数量
              capabilities: [gpu]
```

#### Docker Run CLI - Nvidia GPU

```bash
docker run -d \
  --name frigate \
  ...
  --gpus=all \
  ghcr.io/blakeblackshear/frigate:stable-tensorrt
```

### 设置解码器

使用 `preset-nvidia` 时，ffmpeg 会自动为输入视频选择必要的配置文件，如果您的 GPU 不支持该配置文件，将记录错误。

```yaml
ffmpeg:
  hwaccel_args: preset-nvidia
```

如果一切正常工作，您应该能看到性能显著提升。
通过运行 `nvidia-smi` 验证硬件解码是否正常工作，应该能看到 `ffmpeg` 进程：

:::note

由于 Docker 限制，在容器内运行时 `nvidia-smi` 可能不会显示 `ffmpeg` 进程。[参见此问题](https://github.com/NVIDIA/nvidia-docker/issues/179#issuecomment-645579458)。

:::

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 455.38       Driver Version: 455.38       CUDA Version: 11.1     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  GeForce GTX 166...  Off  | 00000000:03:00.0 Off |                  N/A |
| 38%   41C    P2    36W / 125W |   2082MiB /  5942MiB |      5%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+

+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|    0   N/A  N/A     12737      C   ffmpeg                            249MiB |
|    0   N/A  N/A     12751      C   ffmpeg                            249MiB |
|    0   N/A  N/A     12772      C   ffmpeg                            249MiB |
|    0   N/A  N/A     12775      C   ffmpeg                            249MiB |
|    0   N/A  N/A     12800      C   ffmpeg                            249MiB |
|    0   N/A  N/A     12811      C   ffmpeg                            417MiB |
|    0   N/A  N/A     12827      C   ffmpeg                            417MiB |
+-----------------------------------------------------------------------------+
```

如果您没有看到这些进程，请检查容器的 `docker logs` 中是否有解码错误。

这些说明最初基于 [Jellyfin 文档](https://jellyfin.org/docs/general/administration/hardware-acceleration.html#nvidia-hardware-acceleration-on-docker-linux)。

# 社区支持

## NVIDIA Jetson（Orin AGX、Orin NX、Orin Nano*、Xavier AGX、Xavier NX、TX2、TX1、Nano）

提供基于 Jetpack/L4T 的专用 Docker 镜像。它们包含使用 Jetson 专用媒体引擎的 `ffmpeg` 构建。如果您的 Jetson 主机运行 Jetpack 6.0+，请使用 `stable-tensorrt-jp6` 标签镜像。注意，Orin Nano 没有视频编码器，因此 frigate 将在此平台上使用软件编码，但该镜像仍然允许硬件解码和 tensorrt 物体/目标检测。

您需要使用 nvidia 容器运行时：

### Docker Run CLI - Jetson

```bash
docker run -d \
  ...
  --runtime nvidia
  ghcr.io/blakeblackshear/frigate:stable-tensorrt-jp6
```

### Docker Compose - Jetson

```yaml
services:
  frigate:
    ...
    image: ghcr.io/blakeblackshear/frigate:stable-tensorrt-jp6
    runtime: nvidia   # 添加此行
```

:::note

旧版本的 docker-compose 不支持 `runtime:` 标签。如果遇到这种情况，您可以通过在 `/etc/docker/daemon.json` 中添加 `"default-runtime": "nvidia"` 来系统范围内使用 nvidia 运行时：

```
{
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    },
    "default-runtime": "nvidia"
}
```

:::

### 设置解码器

您需要在 `hwaccel_args` 中传递的解码器将取决于输入视频。

支持的编解码器列表（您可以在容器中使用 `ffmpeg -decoders | grep nvmpi` 来获取您的显卡支持的编解码器）

```
 V..... h264_nvmpi           h264 (nvmpi) (codec h264)
 V..... hevc_nvmpi           hevc (nvmpi) (codec hevc)
 V..... mpeg2_nvmpi          mpeg2 (nvmpi) (codec mpeg2video)
 V..... mpeg4_nvmpi          mpeg4 (nvmpi) (codec mpeg4)
 V..... vp8_nvmpi            vp8 (nvmpi) (codec vp8)
 V..... vp9_nvmpi            vp9 (nvmpi) (codec vp9)
```

例如，对于 H264 视频，您需要选择 `preset-jetson-h264`。

```yaml
ffmpeg:
  hwaccel_args: preset-jetson-h264
```

如果一切正常工作，您应该能看到 ffmpeg CPU 负载和功耗显著降低。
通过运行 `jtop`（`sudo pip3 install -U jetson-stats`）验证硬件解码是否正常工作，应该能看到 NVDEC/NVDEC1 正在使用。

## Rockchip 平台

所有 Rockchip SoC 都支持使用基于 [Rockchip 的 mpp 库](https://github.com/rockchip-linux/mpp)的 [Nyanmisaka 的 FFmpeg 6.1 分支](https://github.com/nyanmisaka/ffmpeg-rockchip)进行硬件加速视频编解码。

### 前提条件

请确保遵循 [Rockchip 特定安装说明](/frigate/installation#rockchip-platform)。

### 配置

在您的 `config.yml` 中添加以下 FFmpeg 预设之一以启用硬件视频处理：

```yaml
ffmpeg:
  hwaccel_args: preset-rkmpp
```

:::note

确保您的 SoC 支持您的输入流的硬件加速。例如，如果您的摄像头以 h265 编码和 4k 分辨率进行流式传输，您的 SoC 必须能够以 4k 或更高分辨率进行 h265 编解码。如果您不确定您的 SoC 是否满足要求，请查看数据手册。

:::

:::warning

如果您的部分摄像头出现处理异常，且日志中显示如下错误信息：

```
[segment @ 0xaaaaff694790] Timestamps are unset in a packet for stream 0. This is deprecated and will stop working in the future. Fix your code to set the timestamps properly
[Parsed_scale_rkrga_0 @ 0xaaaaff819070] No hw context provided on input
[Parsed_scale_rkrga_0 @ 0xaaaaff819070] Failed to configure output pad on Parsed_scale_rkrga_0
Error initializing filters!
Error marking filters as finished
[out#1/rawvideo @ 0xaaaaff3d8730] Nothing was written into output file, because at least one of its streams received no packets.
Restarting ffmpeg...
```

建议您尝试升级至 FFmpeg 7 版本。可通过以下配置选项实现升级：

```
ffmpeg:
  path: "7.0"
```

该选项可全局设置（为所有摄像头启用 FFmpeg 7），也可针对单个摄像头单独配置。请注意不要与以下摄像头配置项混淆：

```
cameras:
  name:
    ffmpeg:
      inputs:
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
```

:::
