---
id: installation
title: 安装
---

Frigate 可运行在任何拥有 Docker 的主机上，甚至可以作为[Home Assistant Add-on 插件](https://www.home-assistant.io/addons/)运行。但需要注意的是，Home Assistant 插件**并不等同于**集成。无论你是将 Frigate 作为独立 Docker 容器运行还是作为 Home Assistant 插件运行，都需要通过额外的[集成](/integrations/home-assistant)将 Frigate 接入 Home Assistant 内。

:::tip

若你已通过 Home Assistant 插件安装 Frigate，请查阅[入门指南](../guides/getting_started#configuring-frigate)进行配置。

:::

## 依赖项 {#dependencies}

**MQTT Broker（可选）** - Frigate 本身可以不依赖 MQTT Broker 运行，但如果你想使用 Home Assistant 集成功能就必须要安装并配置 MQTT。Frigate 和 Home Assistant 必须连接至同一个 MQTT Broker 服务器。

## 硬件准备 {#preparing-your-hardware}

### 操作系统 {#operating-system}

Frigate 最好工作在安装了 Docker 的 Debian 系宿主机上获得最佳性能；同时，你需要让 Frigate 能够直通访问底层硬件（例如 Coral 这类 AI 加速器以及显卡）。不建议在 Proxmox、ESXi、Virtualbox 等虚拟化平台上运行 Frigate（尽管有一部分[用户尝试在 Proxmox 上运行成功](#proxmox)）

Windows 系统未获官方支持，但有用户通过 WSL 或 Virtualbox 成功运行。需注意的是在 Windows 下，显卡或 Coral 等设备的直通可能比较麻烦。如需帮助，可查阅历史讨论或问题记录。

### 存储 {#storage}

Frigate 容器在运行时会对以下目录进行读写操作，你可以通过 Docker 卷映射将这些目录挂载到宿主机的任意位置：

- `/config`: 用于存储 Frigate 配置文件及 SQLite 数据库。运行期间还会生成若干临时文件。
- `/media/frigate/clips`: 快照存储目录（未来可能更名为 snapshots）。目录结构为系统自动管理，禁止手动修改或浏览。
- `/media/frigate/recordings`: 录像片段内部存储目录。目录结构为系统自动管理，禁止手动修改或浏览。
- `/media/frigate/exports`: 通过网页或 API 导出的视频片段和延时摄影存储目录。
- `/tmp/cache`: 录像片段缓存目录，原始录像会先写入此处，经校验并转为 MP4 格式后移至 recordings 目录。通过`clip.mp4`接口生成的片段也在此拼接处理。建议使用 [`tmpfs`](https://docs.docker.com/storage/tmpfs/) 挂载此目录
- `/dev/shm`: 解码帧原始数据的共享内存缓存（不可修改或手动映射）。最小容量受下文 `shm-size`计算规则影响。

### 端口 {#ports}

Frigate 会使用以下端口，根据实际需要对以下端口进行映射。

| 端口   | 说明                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `8971` | 提供未 TLS 加密带身份验证的页面和 API 访问，请使用反代应用（例如 Nginx）代理此端口（并最好配置 TLS 加密）。                        |
| `5000` | 提供给内网的未加密且无需认证的 页面 和 API 访问。该端口使用需要严格限制，仅限 Docker 内部网络中使用，供与 Frigate 集成的服务调用。 |
| `8554` | 提供未加密的实时视频流转发服务（默认无需认证）。可通过配置文件中 go2rtc 模块启用认证功能。                                         |
| `8555` | 提供双向通话支持的 WebRTC 连接服务。                                                                                               |

#### 常见 Docker Compose 存储配置 {#common-docker-compose-storage-configurations}

写入本地硬盘或外部 USB 驱动器：

```yaml
services:
  frigate:
    ...
    volumes:
      - /path/to/your/config:/config # "/path/to/your/config"为你宿主机上希望存放配置文件的路径，例如 /home/frigate/config
      - /path/to/your/storage:/media/frigate # "/path/to/your/storage"为你宿主机上希望存放监控录像文件的路径 /home/frigate/video
      - type: tmpfs # 可选：将使用1GB内存作为缓存文件，减少SSD/SD卡损耗
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    ...
```

:::warning

使用 Snapcraft 构建版 Docker 的用户只能将存储位置设置在 $HOME 目录下。

:::

### 计算所需的共享内存大小（shm-size） {#calculating-required-shm-size}

Frigate 使用共享内存(shm)处理视频帧。Docker 默认提供的 shm-size 为 64MB。

对于 2 个 720p 摄像头的检测场景，一般 128MB shm 就足够了。若出现"Bus error"错误退出，通常是由于高分辨率摄像头过多，需通过 using [`--shm-size`](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources) （或者 Docker Compose 中的[`service.shm_size`](https://docs.docker.com/compose/compose-file/compose-file-v2/#shm_size)）增加 shm 容量。

注意：Frigate 容器日志也会占用最多 40MB 的 shm，计算时需计入。

各摄像头最低共享内存需求计算公式（基于检测分辨率）：

```console
# 单摄像头基础计算模板（不含日志），替换<width>和<height>
$ python -c 'print("{:.2f}MB".format((<width> * <height> * 1.5 * 20 + 270480) / 1048576))'

# 1280x720分辨率示例（含日志）
$ python -c 'print("{:.2f}MB".format((1280 * 720 * 1.5 * 20 + 270480) / 1048576 + 40))'
66.63MB

# 8个1280x720摄像头示例（含日志）
$ python -c 'print("{:.2f}MB".format(((1280 * 720 * 1.5 * 20 + 270480) / 1048576) * 8 + 40))'
253MB
```

Home Assistant 插件无法单独设置容器共享内存。但由于 Home Assistant Supervisor 默认分配总内存的 50%给`/dev/shm`（例如 8GB 内存机器可分配约 4GB），通常无需额外配置。

## 特定硬件的额外设置步骤

以下部分包含仅在使用特定硬件时才需要的额外安装步骤。如果你未使用这些硬件类型中的任何一种，可以直接跳转到 [Docker](#docker) 安装章节。

### 树莓派 3/4 {#raspberry-pi-34}

默认情况下，树莓派对 GPU 可用内存进行了限制。如需使用 ffmpeg 硬件加速功能，必须按照[官方文档](https://www.raspberrypi.org/documentation/computers/config_txt.html#memory-options)说明，在`config.txt`中将`gpu_mem`设置为最大推荐值以增加可用内存。

需要特别注意 USB Coral 功耗问题。若同时使用 SSD 等其他 USB 设备，可能因供电不足导致系统不稳定必须使用带独立电源的外置 USB 集线器。部分用户反馈<a href="https://amzn.to/3a2mH0P" target="_blank" rel="nofollow noopener sponsored">此款产品</a>（推广链接）可稳定运行。

### Hailo-8

Hailo-8 和 Hailo-8L AI 加速器提供 M.2 和树莓派 HAT 两种规格。M.2 版本通常通过 PCIe 载板连接，作为 AI 套件组成部分与树莓派 5 对接；HAT 版本则可直接安装于兼容的树莓派机型。两种规格在 x86 平台亦通过兼容性测试，具备多平台适配能力。

#### 安装 {#installation}

:::warning

对于使用搭载旧版本内核的 树莓派 5 用户，安装 Hailo 驱动的过程相对简单，但该驱动与 Frigate 不兼容。你**必须**按照此指南中的安装步骤来安装正确版本的驱动，并且**必须**按照第 1 步所述禁用内置的内核驱动程序。

:::

1. **禁用内置 Hailo 驱动程序（仅限 树莓派）**:

   :::note

   如果你没有使用 树莓派，请跳过此步骤，直接进入第 2 步的软件相关操作。

   :::

   如果你使用的是 树莓派，则需要将内置的内核级 Hailo 驱动列入黑名单，以防止冲突。首先，请检查该驱动是否当前已加载：

   ```bash
   lsmod | grep hailo
   ```

   如果显示 `hailo_pci`，则将其卸载：

   ```bash
   sudo rmmod hailo_pci
   ```

   现在将该驱动加入黑名单，以防止它在系统启动时自动加载：

   ```bash
   echo "blacklist hailo_pci" | sudo tee /etc/modprobe.d/blacklist-hailo_pci.conf
   ```

   更新 initramfs 以确保黑名单设置生效：

   ```bash
   sudo update-initramfs -u
   ```

   重启你的树莓派：

   ```bash
   sudo reboot
   ```

   重启后，验证内置驱动是否未加载：

   ```bash
   lsmod | grep hailo
   ```

   此命令应返回无结果。若仍显示 `hailo_pci`，则表明黑名单未生效，你可能需要检查通过 apt 安装的其他 Hailo 相关软件包是否加载了该驱动。

2. **运行安装脚本**:

   下载安装脚本：

   ```bash
   wget https://raw.githubusercontent.com/blakeblackshear/frigate/dev/docker/hailo8l/user_installation.sh
   ```

   添加可执行权限：

   ```bash
   sudo chmod +x user_installation.sh
   ```

   运行脚本：

   ```bash
   ./user_installation.sh
   ```

   该脚本将执行以下操作：

   - 安装必要的构建依赖项
   - 从官方代码库克隆并编译 Hailo 驱动
   - 安装驱动程序
   - 下载并安装所需的固件
   - 配置 udev 规则

3. **重启系统**:

   脚本执行成功后，请重启设备以加载固件。

   ```bash
   sudo reboot
   ```

4. **验证安装**:

   重启后，请验证 Hailo 设备是否就绪可用：

   ```bash
   ls -l /dev/hailo0
   ```

   对于其他安装方式，请按以下步骤完成安装：安装完成后，你应能在设备列表中看到 Hailo 设备。你还可以通过以下方法验证驱动是否已加载：

   ```bash
   lsmod | grep hailo_pci
   ```

#### 设置 {#setup}

按照默认安装说明设置 Frigate，例如：`docker.cnb.cool/frigate-cn/frigate:stable`

接下来，通过在`docker-compose.yml`文件中添加以下行来授予 Docker 访问硬件的权限：

```yaml
devices:
  - /dev/hailo0
```

如果你使用`docker run`，请在命令中添加此选项：`--device /dev/hailo0`

#### 配置 {#configuration}

最后，配置[硬件物体/目标检测](/configuration/object_detectors#hailo-8)以完成设置。

### MemryX MX3

The MemryX MX3 Accelerator is available in the M.2 2280 form factor (like an NVMe SSD), and supports a variety of configurations:

- x86 (Intel/AMD) PCs
- Raspberry Pi 5
- Orange Pi 5 Plus/Max
- Multi-M.2 PCIe carrier cards

#### Configuration

#### Installation

To get started with MX3 hardware setup for your system, refer to the [Hardware Setup Guide](https://developer.memryx.com/get_started/hardware_setup.html).

Then follow these steps for installing the correct driver/runtime configuration:

1. Copy or download [this script](https://github.com/blakeblackshear/frigate/blob/dev/docker/memryx/user_installation.sh).
2. Ensure it has execution permissions with `sudo chmod +x user_installation.sh`
3. Run the script with `./user_installation.sh`
4. **Restart your computer** to complete driver installation.

#### Setup

To set up Frigate, follow the default installation instructions, for example: `ghcr.io/blakeblackshear/frigate:stable`

Next, grant Docker permissions to access your hardware by adding the following lines to your `docker-compose.yml` file:

```yaml
devices:
  - /dev/memx0
```

During configuration, you must run Docker in privileged mode and ensure the container can access the max-manager.

In your `docker-compose.yml`, also add:

```yaml
privileged: true

volumes:
  - /run/mxa_manager:/run/mxa_manager
```

If you can't use Docker Compose, you can run the container with something similar to this:

```bash
  docker run -d \
    --name frigate-memx \
    --restart=unless-stopped \
    --mount type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000 \
    --shm-size=256m \
    -v /path/to/your/storage:/media/frigate \
    -v /path/to/your/config:/config \
    -v /etc/localtime:/etc/localtime:ro \
    -v /run/mxa_manager:/run/mxa_manager \
    -e FRIGATE_RTSP_PASSWORD='password' \
    --privileged=true \
    -p 8971:8971 \
    -p 8554:8554 \
    -p 5000:5000 \
    -p 8555:8555/tcp \
    -p 8555:8555/udp \
    --device /dev/memx0 \
    ghcr.io/blakeblackshear/frigate:stable
```

#### Configuration

Finally, configure [hardware object detection](/configuration/object_detectors#memryx-mx3) to complete the setup.

### Rockchip 平台 {#rockchip-platform}

确保使用带有 Rockchip BSP 内核 5.10 或 6.1 以及必要驱动程序（特别是 rkvdec2 和 rknpu）的 Linux 发行版。要检查是否满足要求，请输入以下命令：

```bash
$ uname -r
5.10.xxx-rockchip # 或6.1.xxx；-rockchip后缀很重要
$ ls /dev/dri
by-path  card0  card1  renderD128  renderD129 # 应列出renderD128（VPU）和renderD129（NPU）
$ sudo cat /sys/kernel/debug/rknpu/version
RKNPU driver: v0.9.2 # 或更高版本
```

如果你的开发板受支持，我推荐使用[Armbian](https://www.armbian.com/download/?arch=aarch64)。

#### 设置 {#setup-5}

按照 Frigate 的默认安装说明进行操作，但使用带有`-rk`后缀的 docker 镜像，例如`docker.cnb.cool/frigate-cn/frigate:stable-rk`。

接下来，你需要授予 docker 访问硬件的权限：

- 在配置过程中，你应该在特权模式下运行 docker 以避免因权限不足而出现错误。为此，在`docker-compose.yml`文件中添加`privileged: true`或在 docker run 命令中添加`--privileged`标志。
- 在一切正常工作后，你应该只授予必要的权限以提高安全性。禁用特权模式，并在`docker-compose.yml`文件中添加以下行：

```yaml
security_opt:
  - apparmor=unconfined
  - systempaths=unconfined
devices:
  - /dev/dri
  - /dev/dma_heap
  - /dev/rga
  - /dev/mpp_service
volumes:
  - /sys/:/sys/:ro
```

或在`docker run`命令中添加这些选项：

```
--security-opt systempaths=unconfined \
--security-opt apparmor=unconfined \
--device /dev/dri \
--device /dev/dma_heap \
--device /dev/rga \
--device /dev/mpp_service \
--volume /sys/:/sys/:ro
```

#### 配置 {#configuration-5}

接下来，你应该配置[硬件物体/目标检测](/configuration/object_detectors#rockchip平台)和[硬件视频处理](/configuration/hardware_acceleration_video#rockchip平台)。

### Synaptics

- SL1680

#### Setup

Follow Frigate's default installation instructions, but use a docker image with `-synaptics` suffix for example `ghcr.io/blakeblackshear/frigate:stable-synaptics`.

Next, you need to grant docker permissions to access your hardware:

- During the configuration process, you should run docker in privileged mode to avoid any errors due to insufficient permissions. To do so, add `privileged: true` to your `docker-compose.yml` file or the `--privileged` flag to your docker run command.

```yaml
devices:
  - /dev/synap
  - /dev/video0
  - /dev/video1
```

or add these options to your `docker run` command:

```
--device /dev/synap \
--device /dev/video0 \
--device /dev/video1
```

#### Configuration

Next, you should configure [hardware object detection](/configuration/object_detectors#synaptics) and [hardware video processing](/configuration/hardware_acceleration_video#synaptics).

## Docker

推荐使用 Docker Compose 进行安装。

:::danger

需要注意，如果没有必要需求，请尽量不要暴露 5000 端口！并且使用复杂密码，避免你的数据泄露！
如果实在需要使用到 5000 端口，请务必配置好服务器的防火墙，尤其需要注意 IPv6 的情况。
如果你不理解上述内容，请直接删除 5000 端口的内容

:::

```yaml
services:
  frigate:
    container_name: frigate
    privileged: true # 使用特权模式
    restart: unless-stopped
    stop_grace_period: 30s # 为各服务提供足够的关闭时间
    image: docker.cnb.cool/frigate-cn/frigate:stable # 此处为国内镜像源地址，原地址为 ghcr.io/blakeblackshear/frigate:stable
    shm_size: '512mb' # 根据上述计算结果为你的摄像头更新此值
    devices:
      # 以下内容根据你的实际情况进行删改。例如你不用Coral，就将Coral的设备映射给删除
      - /dev/bus/usb:/dev/bus/usb # 用于USB Coral，其他版本需要修改
      - /dev/apex_0:/dev/apex_0 # 用于PCIe Coral，请按照此处的驱动说明操作 https://github.com/jnicolson/gasket-builder
      - /dev/video11:/dev/video11 # 用于树莓派4B
      - /dev/dri/renderD128:/dev/dri/renderD128 # 用于AMD/Intel GPU硬件加速，需要根据你的硬件更新
      - /dev/accel:/dev/accel # Intel NPU
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /path/to/your/config:/config # "/path/to/your/config"为你宿主机上希望存放配置文件的路径，例如 /home/frigate/config
      - /path/to/your/storage:/media/frigate # "/path/to/your/storage"为你宿主机上希望存放监控录像文件的路径 /home/frigate/video
      - type: tmpfs # 必选：将使用1GB内存作为缓存文件
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    ports:
      - '8971:8971'
      # - "5000:5000" # 用于内部无鉴权验证的访问。谨慎暴露。
      - '8554:8554' # RTSP视频流
      - '8555:8555/tcp' # 基于TCP的WebRTC
      - '8555:8555/udp' # 基于UDP的WebRTC
    environment:
      FRIGATE_RTSP_PASSWORD: 'password' # rtsp的密码，请修改"password"为你期望的密码
      TZ: 'Asia/Shanghai' # 设置为中国+8时区 [!code highlight]
      HF_ENDPOINT: 'https://huggingface.mirror.frigate-cn.video' # 由我们提供的Huggingface国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]
      GITHUB_ENDPOINT: 'https://github.mirror.frigate-cn.video' # 由我们提供的GitHub国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]
```

如果你无法使用 Docker Compose，可以使用类似以下命令运行容器：

```bash
docker run -d \
  --name frigate \
  --restart=unless-stopped \
  --stop-timeout 30 \
  --mount type=tmpfs,target=/tmp/cache,tmpfs-size=1000000000 \
  --device /dev/bus/usb:/dev/bus/usb \
  --device /dev/dri/renderD128 \
  --shm-size=64m \
  -v /path/to/your/storage:/media/frigate \
  -v /path/to/your/config:/config \
  -v /etc/localtime:/etc/localtime:ro \
  -e FRIGATE_RTSP_PASSWORD='password' \
  -e TZ='Asia/Shanghai' \
  -e HF_ENDPOINT='https://huggingface.mirror.frigate-cn.video' \
  -e GITHUB_ENDPOINT='https://github.mirror.frigate-cn.video' \
  -p 8971:8971 \
  -p 8554:8554 \
  -p 8555:8555/tcp \
  -p 8555:8555/udp \
  docker.cnb.cool/frigate-cn/frigate:stable
```

:::info
上面的镜像地址已换为我们托管在国内 cnb 上的地址，能够在国内获得更快的速度。如不需要使用镜像加速，可以将地址换为官方镜像地址：

ghcr.io/blakeblackshear/frigate:stable

:::

:::warning
默认镜像是不支持 N 卡或 A 卡加速的！需要参考下方，使用特定后缀的镜像地址。

`amd64` **并不是**特指的 AMD 平台，而是历史遗留原因导致的名称。Intel、AMD 的 CPU 都属于 amd64 架构。
:::

当前稳定版本的官方 Docker 镜像标签有：

- `stable` - 适用于 **amd64** 的标准 Frigate 构建和适用于 **arm64** 的树莓派优化 Frigate 构建。此构建还包括对 Hailo 设备的支持。推荐 Intel 核显或使用 Coral、Hailo 的用户使用
- `stable-standard-arm64` - 适用于 **arm64** 的标准 Frigate 构建
- `stable-tensorrt` - 专门用于运行 **NVIDIA GPU** 的 amd64 设备
- `stable-rocm` - 适用于[AMD GPU](../configuration/object_detectors.md#amdrocm-gpu-detector)

当前稳定版本的社区支持 Docker 镜像标签有：

- `stable-tensorrt-jp6` - 为运行 Jetpack 6 的**NVIDIA Jetson**开发板设备优化
- `stable-rk` - 适用于搭载 **瑞芯微 Rockchip SoC** 开发板设备

## Home Assistant 插件 {#home-assistant-add-on}

:::warning

从 Home Assistant 操作系统 10.2 和 Home Assistant 2023.6 版本开始，支持为媒体文件配置独立的网络存储。

需要注意 HA OS 的以下重要限制：

- Home Assistant 尚不支持媒体文件的独立本地存储
- 由于 HA OS 不包含 mesa 驱动程序，因此不支持 AMD GPU
- 由于插件不支持 nvidia 运行时，因此不支持 NVIDIA GPU

:::

:::tip

请参阅[网络存储指南](/guides/ha_network_storage.md)了解如何为 Frigate 设置网络存储。

:::

Home Assistant OS 用户可以通过插件仓库进行安装。

1. 在 Home Assistant 中，导航至 _设置_ > _插件_ > _插件商店_ > _仓库_
2. 添加 `https://github.com/blakeblackshear/frigate-hass-addons`
3. 安装所需的 Frigate 插件版本（见下文）
4. 在`配置`选项卡中设置网络配置
5. 启动插件
6. 使用*打开 Web 界面*按钮访问 Frigate 界面，然后点击*齿轮图标* > _配置编辑器_，根据需要配置 Frigate

插件提供以下几种版本：

| 插件版本                 | 描述                             |
| ------------------------ | -------------------------------- |
| Frigate                  | 当前发布版本，启用保护模式       |
| Frigate（完全访问）      | 当前发布版本，可选择禁用保护模式 |
| Frigate Beta             | Beta 版本，启用保护模式          |
| Frigate Beta（完全访问） | Beta 版本，可选择禁用保护模式    |

如果你使用 ffmpeg 硬件加速，你**可能**需要使用*完全访问*版本的插件。这是因为 Frigate 插件在容器中运行时对主机系统的访问受限。*完全访问*版本允许你禁用*保护模式*，从而让 Frigate 完全访问主机系统。

你也可以通过[VS Code 插件](https://github.com/hassio-addons/addon-vscode)或类似工具编辑 Frigate 配置文件。在这种情况下，配置文件位于`/addon_configs/<addon_directory>/config.yml`，其中`<addon_directory>`取决于你运行的 Frigate 插件版本。请参阅[此处](../configuration/index.md#accessing-add-on-config-dir)的目录列表。

## Kubernetes

使用[helm chart](https://github.com/blakeblackshear/blakeshome-charts/tree/master/charts/frigate)进行安装。

## Unraid

许多人拥有足够强大的 NAS 设备或家庭服务器来运行 docker。Unraid 提供了一个社区应用。
要安装，请确保你已安装[社区应用插件](https://forums.unraid.net/topic/38582-plug-in-community-applications/)。然后在 Unraid 的应用部分搜索"Frigate" - 你可以在[这里](https://unraid.net/community/apps?q=frigate#r)查看在线商店。

## Proxmox 虚拟化平台 {#proxmox}

根据[Proxmox 官方文档](https://pve.proxmox.com/pve-docs/pve-admin-guide.html#chapter_pct)建议，像 Frigate 这样的应用容器最好运行在 Proxmox QEMU 虚拟机中。这种部署方式既能获得应用容器化的所有优势，又能享受虚拟机带来的诸多好处，例如：

- 与宿主机实现强隔离
- 支持实时迁移等高级功能（这些功能在直接使用容器时无法实现）

Ensure that ballooning is **disabled**, especially if you are passing through a GPU to the VM.

:::warning

如果你选择通过 LXC 在 Proxmox 中运行 Frigate，设置过程可能会很复杂，请做好阅读 Proxmox 和 LXC 文档的准备，Frigate 不官方支持在 LXC 内运行。

:::

建议包括：

- 对于基于 Intel 的硬件加速，要允许访问主设备号为 226、次设备号为 128 的`/dev/dri/renderD128`设备，请在`/etc/pve/lxc/<id>.conf` LXC 配置文件中添加以下行：
  - `lxc.cgroup2.devices.allow: c 226:128 rwm`
  - `lxc.mount.entry: /dev/dri/renderD128 dev/dri/renderD128 none bind,optional,create=file`
- LXC 配置可能还需要`features: fuse=1,nesting=1`。这允许在 LXC 容器中运行 Docker 容器（`nesting`）并防止文件重复和存储浪费（`fuse`）。
- 通过多层容器化（LXC 然后 Docker）成功传递硬件设备可能很困难。许多人选择在主机上将`/dev/dri/renderD128`等设备设为全局可读，或在特权 LXC 容器中运行 Frigate。
- 虚拟化层通常会给与 Coral 设备的通信带来大量开销，但[并非所有情况都如此](https://github.com/blakeblackshear/frigate/discussions/1837)。

更多一般信息请参见[Proxmox LXC 讨论](https://github.com/blakeblackshear/frigate/discussions/5773)。

## ESXi

有关使用 ESXi 运行 Frigate 的详细信息，请参阅[此处](https://williamlam.com/2023/05/frigate-nvr-with-coral-tpu-igpu-passthrough-using-esxi-on-intel-nuc.html)的说明。

如果你在机架式服务器上运行 Frigate 并想要直通 Google Coral，请[阅读此处](https://github.com/blakeblackshear/frigate/issues/305)。

## 群晖 NAS 上的 DSM 7 {#synology-nas-on-dsm-7}

这些设置已在 `DSM 7.1.1-42962 Update 4` 版本上通过测试

**常规设置:**

需要启用`使用高权限执行容器`选项，以便为 Frigate 容器提供可能需要的提升权限。

如果你希望容器在因错误而异常关闭时自动重启，可以启用`启用自动重启`选项。

![image](/img/synology-setting.png)

**高级设置:**

如需使用密码模板功能，应在高级设置中添加"FRIGATE_RTSP_PASSWORD"环境变量并设置你偏好的密码。其余环境变量目前应保持默认值。

![image](https://user-images.githubusercontent.com/4516296/232587163-0eb662d4-5e28-4914-852f-9db1ec4b9c3d.png)

**端口设置:**

网络模式应设置为`bridge`。你需要将 Frigate 容器的默认端口映射到你想在群晖 NAS 上使用的本地端口。

如果 NAS 上有其他服务正在使用 Frigate 所需的相同端口，你可以将端口设置为自动或指定特定端口。

![image](https://user-images.githubusercontent.com/4516296/232582642-773c0e37-7ef5-4373-8ce3-41401b1626e6.png)

**存储空间设置:**

需要配置 2 个路径：

- 配置目录的位置，这将根据你的 NAS 文件夹结构而有所不同，例如`/docker/frigate/config`将挂载到容器内的`/config`
- NAS 上用于保存录像的位置，这必须是一个文件夹，例如`/docker/volumes/frigate-0-media`

![image](https://user-images.githubusercontent.com/4516296/232585872-44431d15-55e0-4004-b78b-1e512702b911.png)

## 威联通 QNAP NAS {#qnap-nas}

这些说明已在配备 Intel J3455 CPU 和 16G RAM、运行 QTS 4.5.4.2117 的 QNAP 上测试通过。

QNAP 有一个名为 Container Station 的图形工具用于安装和管理 docker 容器。但是，Container Station 有两个限制使其不适合安装 Frigate：

1. Container Station 不支持 GitHub 镜像站（ghcr），而镜像站托管了 Frigate 0.12.0 及以上版本的 docker 镜像。
2. Container Station 使用默认 64 Mb 共享内存大小（`shm-size`），且没有调整机制。Frigate 需要更大的 shm-size 才能正常处理两个以上的高分辨率摄像头。

由于上述限制，安装必须通过命令行完成。以下是具体步骤：

**准备工作**

1. 如果尚未安装，从 QNAP 应用中心安装 Container Station。
2. 在 QNAP 上启用 ssh（请通过网络搜索了解具体操作方法）。
3. 准备 Frigate 配置文件，命名为`config.yml`。
4. 根据[文档](https://docs.frigate-cn.video/frigate/installation)计算共享内存大小。
5. 从https://en.wikipedia.org/wiki/List_of_tz_database_time_zones 查找你的时区值。
6. 通过 ssh 连接到 QNAP。

**安装**

运行以下命令安装 Frigate（以`stable`版本为例）：

```shell
# 下载Frigate镜像
docker pull docker.cnb.cool/frigate-cn/frigate:stable
# 在QNAP文件系统上创建目录以存放Frigate配置文件
# 例如，你可以选择在/share/Container下创建
mkdir -p /share/Container/frigate/config
# 将步骤2中准备的配置文件复制到新创建的配置目录
cp path/to/your/config/file /share/Container/frigate/config
# 在QNAP文件系统上创建目录以存放Frigate媒体文件
# （如果你有监控硬盘，请在监控硬盘上创建媒体目录。
# 示例命令假设share_vol2是监控硬盘）
mkdir -p /share/share_vol2/frigate/media
# 创建Frigate docker容器。用准备步骤3中的值替换shm-size值。
# 同时在示例命令中替换'TZ'的时区值。
# 示例命令将创建一个最多使用2个CPU和4G RAM的docker容器。
# 如果你使用特定CPU（如J4125），可能需要在以下docker run命令中添加"--env=LIBVA_DRIVER_NAME=i965 \"。
# 参见 https://docs.frigate-cn.video/configuration/hardware_acceleration。
docker run \
  --name=frigate \
  --shm-size=256m \
  --restart=unless-stopped \
  --env=TZ=Asia/Shanghai \
  --env=HF_ENDPOINT='https://huggingface.mirror.frigate-cn.video' \
  --env=GITHUB_ENDPOINT='https://github.mirror.frigate-cn.video' \
  --volume=/share/Container/frigate/config:/config:rw \
  --volume=/share/share_vol2/frigate/media:/media/frigate:rw \
  --network=bridge \
  --privileged \
  --workdir=/opt/frigate \
  -p 8971:8971 \
  -p 8554:8554 \
  -p 8555:8555 \
  -p 8555:8555/udp \
  --label='com.qnap.qcs.network.mode=nat' \
  --label='com.qnap.qcs.gpu=False' \
  --memory="4g" \
  --cpus="2" \
  --detach=true \
  -t \
  docker.cnb.cool/frigate-cn/frigate:stable
```

登录 QNAP，打开 Container Station。Frigate docker 容器应该在"概览"下列出并正在运行。点击 Frigate docker，然后点击详情页顶部显示的 URL 访问 Frigate Web 界面。
