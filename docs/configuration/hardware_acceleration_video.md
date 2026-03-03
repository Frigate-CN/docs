---
id: hardware_acceleration_video
title: 视频解码
---

# 视频解码

在 Frigate 中，**强烈建议使用核显或独立显卡**来实现硬件加速的视频解码。

部分类型的硬件加速会被自动检测并启用，但你可能需要修改配置，才能为 ffmpeg 开启硬件加速解码功能。验证硬件加速是否正常工作的方法如下：

- **查看日志**：日志中会显示“硬件加速已自动检测到”的提示，或者弹出“未自动检测到硬件加速”的警告
- **配置中指定硬件加速时的验证方式**：只需确保日志中没有相关错误即可。硬件加速功能**不提供 CPU 降级兜底方案**。

:::info

Frigate 提供了预设配置，可实现最优的硬件加速视频解码效果：

**AMD 平台**

- [AMD](#amd-based-cpus)：Frigate 可调用新款 AMD 核显和独立显卡，实现视频解码加速。

**Intel 平台**

- [Intel](#intel-based-cpus)：Frigate 可调用大多数 Intel 核显和锐炫系列显卡，实现视频解码加速。

**NVIDIA 显卡**

- [NVIDIA 显卡](#nvidia-gpus)：Frigate 可调用大多数新款 NVIDIA 显卡，实现视频解码加速。

**树莓派 3/4**

- [树莓派](#raspberry-pi-34)：Frigate 可调用树莓派 3 和 4 的媒体引擎，小幅提升视频解码速度。

**NVIDIA Jetson** <Badge text="社区支持" type="warning" />

- [Jetson](#nvidia-jetson)：Frigate 可调用 Jetson 硬件的媒体引擎，实现视频解码加速。

**瑞芯微平台** <Badge text="社区支持" type="warning" />

- [瑞芯微 NPU](#rockchip-platform)：Frigate 可调用瑞芯微片上系统（SOC）的媒体引擎，实现视频解码加速。

**其他硬件**
根据系统环境的不同，上述预设配置可能无法兼容，此时你需要手动配置 `hwaccel_args` 参数，以适配你的硬件。关于 ffmpeg 硬件加速解码的更多信息，可参考官方文档：https://trac.ffmpeg.org/wiki/HWAccelIntro

:::

## 基于 Intel 的 CPU {#intel-based-cpus}

Frigate 可调用大多数 Intel 核显与 Arc 系列显卡，实现视频解码加速。

:::info

**推荐硬件加速预设**

| CPU 代数      | Intel 驱动 | 推荐预设            | 说明                                          |
| ------------- | ---------- | ------------------- | --------------------------------------------- |
| 1-5 代        | i965       | preset-vaapi        | 不支持 qsv，该设备可能无法处理 H.265 编码格式 |
| 6-7 代        | iHD        | preset-vaapi        | 不支持 qsv                                    |
| 8-12 代       | iHD        | preset-vaapi        | 也可使用 preset-intel-qsv-\*                  |
| 13 代+        | iHD/Xe     | preset-intel-qsv-\* |                                               |
| Intel Arc GPU | iHD/Xe     | preset-intel-qsv-\* |                                               |

:::

:::note

默认驱动是 `iHD`。你可能需要通过添加环境变量 `LIBVA_DRIVER_NAME=i965` 来改用 i965 驱动（在 docker-compose 文件中或[在 HA 插件的 config.yml 中](advanced.md#environment_vars)）。

参考[Intel 文档](https://www.intel.com/content/www/us/en/support/articles/000005505/processors.html)确认你的 CPU 是第几代的。

:::

### 通过 QuickSync <Badge text="优先建议"/> {#via-quicksync}

#### H.264 流 {#h264-streams}

```yaml
ffmpeg:
  hwaccel_args: preset-intel-qsv-h264 # [!code ++]
```

#### H.265 流 {#h265-streams}

```yaml
ffmpeg:
  hwaccel_args: preset-intel-qsv-h265 # [!code ++]
```

### 通过 VAAPI {#via-vaapi}

如果你的设备不支持`qsv`，或者使用`qsv`时出现问题，你可以尝试使用 vaapi。

VAAPI 支持自动配置文件选择，可自动处理 `H.264` 和 `H.265` 视频流。

```yaml
ffmpeg:
  hwaccel_args: preset-vaapi # [!code ++]
```

### Docker 中配置 Intel GPU 统计 {#configuring-intel-gpu-stats-in-docker}

需要额外配置才能使 Docker 容器访问 `intel_gpu_top` 命令获取 GPU 统计信息。有两种选择：

1. 以特权模式运行容器。
2. 添加 `CAP_PERFMON` 能力（注意：你可能需要将 `perf_event_paranoid` 设置得足够低以允许访问性能事件系统。）

#### 以特权模式运行 {#run-as-privileged}

这种方法有效，但会赋予容器超出实际需要的权限。

##### Docker Compose - 特权模式 {#docker-compose---privileged}

```yaml
services:
  frigate:
    ... # 省略号为文档省略部分，不代表后面没内容
    image: docker.cnb.cool/frigate-cn/frigate:stable
    privileged: true # [!code ++]
```

##### Docker Run CLI - 特权模式 {#docker-run-cli---privileged}

```bash
docker run -d \
  --name frigate \
  ...  # 省略号为文档省略部分，不代表后面没内容
  --privileged \  # [!code ++]
  docker.cnb.cool/frigate-cn/frigate:stable
```

#### CAP_PERFMON {#cap_perfmon}

只有较新版本的 Docker 支持 `CAP_PERFMON` 能力。你可以通过运行以下命令测试你的版本是否支持：`docker run --cap-add=CAP_PERFMON hello-world`

##### Docker Compose - CAP_PERFMON {#docker-compose---cap_perfmon}

```yaml
services:
  frigate:
    ... # 省略号为文档省略部分，不代表后面没内容
    image: docker.cnb.cool/frigate-cn/frigate:stable
    cap_add: # [!code ++]
      - CAP_PERFMON # [!code ++]
```

##### Docker Run CLI - CAP_PERFMON {#docker-run-cli---cap_perfmon}

```bash
docker run -d \
  --name frigate \
  ...  # 省略号为文档省略部分，不代表后面没内容
  --cap-add=CAP_PERFMON \  # [!code ++]
  docker.cnb.cool/frigate-cn/frigate:stable
```

#### perf_event_paranoid {#perf_event_paranoid}

**注意：此设置必须针对整个系统修改。**

关于不同发行版的值的更多信息，请参见 https://askubuntu.com/questions/1400874/what-does-perf-paranoia-level-four-do。

根据你的操作系统和内核配置，你可能需要更改 `/proc/sys/kernel/perf_event_paranoid` 内核可调参数。你可以通过运行 `sudo sh -c 'echo 2 >/proc/sys/kernel/perf_event_paranoid'` 来测试更改，这将持续到重启。通过运行 `sudo sh -c 'echo kernel.perf_event_paranoid=2 >> /etc/sysctl.d/local.conf'` 使其永久生效。

#### SR-IOV 或其他设备的统计信息配置 {#stats-for-sr-iov-or-other-devices}

当通过 SR-IOV 使用虚拟化 GPU 时，需要额外参数才能获取 GPU 统计信息。你可以通过指定以下配置来启用此功能：即设置用于从`intel_gpu_top`收集统计信息的设备路径。以下示例可能适用于某些使用 SR-IOV 的系统：

```yaml
telemetry: # [!code ++]
  stats: # [!code ++]
    intel_gpu_device: "sriov" # [!code ++]
```

对于其他虚拟化 GPU，可以尝试直接指定设备路径：

```yaml
telemetry:
  stats:
    intel_gpu_device: "drm:/dev/dri/card0" # [!code ++]
```

如果你指定了设备路径，请确保已将设备透传到容器中。

## AMD-based CPUs {#amd-based-cpus}

Frigate 可借助 VAAPI 技术，调用新款 AMD 核显与 AMD 独立显卡，实现视频解码加速。

### 配置 Radeon 设备 {#configuring-radeon-driver}

你需要通过添加环境变量 `LIBVA_DRIVER_NAME=radeonsi` 来改用 radeonsi 驱动（在 docker-compose 文件中或[在 HA 插件的 config.yml 中](advanced.md#environment_vars)）。

### 通过 VAAPI {#via-vaapi-1}

VAAPI 支持配置文件自动选择功能，因此可自动适配 H.264 和 H.265 两种视频流格式。

```yaml
ffmpeg: # [!code highlight]
  hwaccel_args: preset-vaapi # [!code ++]
```

## NVIDIA GPU {#nvidia-gpus}

虽然旧的 GPU 可能也能工作，但建议使用现代的、受支持的 GPU。NVIDIA 提供了[支持的 GPU 和功能矩阵](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new)。如果你的显卡在列表中并支持 CUVID/NVDEC，它很可能可以用于 Frigate 的解码。但是，你必须使用[与 FFmpeg 兼容的驱动版本](https://github.com/FFmpeg/nv-codec-headers/blob/master/README)。旧的驱动版本可能缺少符号而无法工作，而旧的显卡不受新驱动版本支持。解决这个问题的唯一方法是[提供你自己的 FFmpeg](/configuration/advanced#custom-ffmpeg-build)，使其能与你的驱动版本一起工作，但这是不受支持的，可能效果不佳甚至完全无法工作。

更完整的显卡和兼容驱动列表可在[驱动发布说明](https://download.nvidia.com/XFree86/Linux-x86_64/525.85.05/README/supportedchips.html)中找到。

如果你的发行版不提供 NVIDIA 驱动包，你可以[在此下载](https://www.nvidia.com/en-us/drivers/unix/)。

### Docker 中配置 NVIDIA GPU {#configuring-nvidia-gpus-in-docker}

Docker 容器需要额外配置才能访问 NVIDIA GPU。支持的方法是安装 [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker) 并向 Docker 指定 GPU。具体方法取决于 Docker 的运行方式：

#### Docker Compose - Nvidia GPU {#docker-compose---nvidia-gpu}

```yaml
services:
  frigate:
    ...
    image: docker.cnb.cool/frigate-cn/frigate:stable-tensorrt
    deploy:    # <------------- 添加此部分到底部的代码 [!code ++]
      resources: # [!code ++]
        reservations: # [!code ++]
          devices: # [!code ++]
            - driver: nvidia # [!code ++]
              device_ids: ['0'] # 仅在使用多个 GPU 时需要 [!code ++]
              count: 1 # GPU 数量 [!code ++]
              capabilities: [gpu] # [!code ++]
```

#### Docker Run CLI - Nvidia GPU {#docker-run-cli---nvidia-gpu}

```bash
docker run -d \
  --name frigate \
  ... # 省略号为文档省略部分，不代表后面没内容
  --gpus=all \  # [!code ++]
  docker.cnb.cool/frigate-cn/frigate:stable-tensorrt
```

### 设置解码器 {#setup-decoder}

使用 `preset-nvidia` 时，ffmpeg 会自动为输入视频选择必要的配置文件，如果你的 GPU 不支持该配置文件，将记录错误。

```yaml
ffmpeg: # [!code highlight]
  hwaccel_args: preset-nvidia # [!code ++]
```

如果一切正常工作，你应该能看到性能显著提升。
通过运行 `nvidia-smi` 验证硬件解码是否正常工作，应该能看到 `ffmpeg` 进程：

:::note

受 Docker 功能限制（相关说明见链接：https://github.com/NVIDIA/nvidia-docker/issues/179#issuecomment-645579458），在容器内执行 `nvidia-smi` 命令时，**不会显示 `ffmpeg` 进程**。

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

如果你没有看到这些进程，请检查容器的 `docker logs` 中是否有解码错误。

这些说明最初基于 [Jellyfin 文档](https://jellyfin.org/docs/general/administration/hardware-acceleration.html#nvidia-hardware-acceleration-on-docker-linux)。

## 树莓派 3/4 {#raspberry-pi-34}

请确保为图形处理器（GPU）分配的内存至少为 128MB（操作路径：`raspi-config` > 性能选项 > 图形处理器内存）。
若你使用的是 Home Assistant 插件版 Frigate，则可能需要切换为完全访问版本，并关闭**保护模式**，才能启用硬件加速功能。

```yaml
# 如需解码 H264 格式视频流
ffmpeg:
  hwaccel_args: preset-rpi-64-h264

# 如需解码 H265（高效视频编码）格式视频流
ffmpeg:
  hwaccel_args: preset-rpi-64-h265
```

:::note

若通过 Docker 运行 Frigate，你需要以特权模式启动容器，或者将宿主机的 `/dev/video*` 设备映射到容器内。使用 Docker Compose 时，需添加如下配置：

```yaml
services:
  frigate:
    ...
    devices:
      - /dev/video11:/dev/video11
```

若使用 `docker run` 命令，则配置如下：

```bash
docker run -d \
  --name frigate \
  ... # 省略号为文档省略部分，不代表后面没内容
  --device /dev/video11 \
  docker.cnb.cool/frigate-cn/frigate:stable
```

在树莓派 4B 上，`/dev/video11` 是正确的设备路径。你可以运行以下命令，查找带有 `H264` 标识的设备来确认：

```bash
for d in /dev/video*; do
  echo -e "---\n$d"
  v4l2-ctl --list-formats-ext -d $d
done
```

你也可以直接将宿主机所有的 `/dev/video*` 设备映射到容器内。

:::

# 社区支持 {#community-supported}

## NVIDIA Jetson <Badge text="社区支持" type="warning" />

提供 Jetson 设备专用 Docker 镜像。它们包含使用 Jetson 专用媒体引擎的 `ffmpeg` 构建。如果你的 Jetson 主机运行 Jetpack 6.0+，请使用 `stable-tensorrt-jp6` 标签镜像。注意，Orin Nano 没有视频编码器，因此 frigate 将在此平台上使用软件编码，但该镜像仍然允许硬件解码和 tensorrt 物体/目标检测。

你需要使用 nvidia 容器运行时：

### Docker Run CLI - Jetson

```bash
docker run -d \
  ...
  --runtime nvidia # [!code ++]
  docker.cnb.cool/frigate-cn/frigate:stable-tensorrt-jp6
```

### Docker Compose - Jetson

```yaml
services:
  frigate:
    ...
    image: docker.cnb.cool/frigate-cn/frigate:stable-tensorrt-jp6
    runtime: nvidia   # 添加此行 [!code ++]
```

:::note

旧版本的 docker-compose 不支持 `runtime:` 标签。如果遇到这种情况，你可以通过在 `/etc/docker/daemon.json` 中添加 `"default-runtime": "nvidia"` 来系统范围内使用 nvidia 运行时：

```
{
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    },
    "default-runtime": "nvidia" //[!code ++]
}
```

:::

### 设置解码器 {#setup-decoder-1}

你需要在 `hwaccel_args` 中传递的解码器将取决于输入视频。

支持的编解码器列表（你可以在容器中使用 `ffmpeg -decoders | grep nvmpi` 来获取你的显卡支持的编解码器）

```
 V..... h264_nvmpi           h264 (nvmpi) (codec h264)
 V..... hevc_nvmpi           hevc (nvmpi) (codec hevc)
 V..... mpeg2_nvmpi          mpeg2 (nvmpi) (codec mpeg2video)
 V..... mpeg4_nvmpi          mpeg4 (nvmpi) (codec mpeg4)
 V..... vp8_nvmpi            vp8 (nvmpi) (codec vp8)
 V..... vp9_nvmpi            vp9 (nvmpi) (codec vp9)
```

例如，对于 H264 视频，你需要选择 `preset-jetson-h264`。

```yaml
ffmpeg:
  hwaccel_args: preset-jetson-h264 # [!code ++]
```

如果一切正常工作，你应该能看到 ffmpeg CPU 负载和功耗显著降低。
通过运行 `jtop`（`sudo pip3 install -U jetson-stats`）验证硬件解码是否正常工作，应该能看到 NVDEC/NVDEC1 正在使用。

## Rockchip 平台 <Badge text="社区支持" type="warning" /> {#rockchip-platform}

所有 Rockchip SoC 都支持使用基于 [Rockchip 的 mpp 库](https://github.com/rockchip-linux/mpp)的 [Nyanmisaka 的 FFmpeg 6.1 分支](https://github.com/nyanmisaka/ffmpeg-rockchip)进行硬件加速视频编解码。

### 前提条件 {#prerequisites}

请确保遵循 [Rockchip 特定安装说明](/frigate/installation#rockchip-platform)。

### 配置 {#configuration}

在你的 `config.yml` 中添加以下 FFmpeg 预设之一以启用硬件视频处理：

```yaml
ffmpeg:
  hwaccel_args: preset-rkmpp # [!code ++]
```

:::note

确保你的 SoC 支持你的输入流的硬件加速。例如，如果你的摄像头以 h265 编码和 4k 分辨率进行流式传输，你的 SoC 必须能够以 4k 或更高分辨率进行 h265 编解码。如果你不确定你的 SoC 是否满足要求，请查看数据手册。

:::

:::warning

如果你的部分摄像头出现处理异常，且日志中显示如下错误信息：

```
[segment @ 0xaaaaff694790] Timestamps are unset in a packet for stream 0. This is deprecated and will stop working in the future. Fix your code to set the timestamps properly
[Parsed_scale_rkrga_0 @ 0xaaaaff819070] No hw context provided on input
[Parsed_scale_rkrga_0 @ 0xaaaaff819070] Failed to configure output pad on Parsed_scale_rkrga_0
Error initializing filters!
Error marking filters as finished
[out#1/rawvideo @ 0xaaaaff3d8730] Nothing was written into output file, because at least one of its streams received no packets.
Restarting ffmpeg...
```

建议你尝试升级至 FFmpeg 7 版本。可通过以下配置选项实现升级：

```yaml
ffmpeg:
  path: "7.0" # [!code ++]
```

该选项可全局设置（为所有摄像头启用 FFmpeg 7），也可针对单个摄像头单独配置。请注意不要与以下摄像头配置项混淆：

```yaml
cameras:
  name:
    ffmpeg:
      inputs: # 注意，不要把ffmpeg的path和摄像头视频流配置（inputs）下的path混淆！[!code warning]
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 # [!code warning]
```

:::

## Synaptics

Synaptics SL 系列 SoC 支持硬件加速的视频编解码。

### 前提条件

请确保按照 [Synaptics 安装说明](../frigate/installation.md#synaptics)进行操作。

### 配置

在你的 `config.yml` 中添加以下任意一个 FFmpeg 预设，以启用硬件视频处理：

```yaml
ffmpeg:
  hwaccel_args: -c:v h264_v4l2m2m
  input_args: preset-rtsp-restream
output_args:
  record: preset-record-generic-audio-aac
```

:::warning

请确保你的 SoC 支持对输入流进行硬件加速，并且输入流为 **h264 编码**。例如，如果你的摄像头以 h264 编码推流，那么你的 SoC 必须能够对其进行解码和编码。如果不确定你的 SoC 是否满足要求，请查阅其数据手册。

:::
