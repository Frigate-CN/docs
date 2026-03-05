---
id: installation
title: 安装
---

Frigate 可运行在任何拥有 Docker 的主机上，甚至可以作为[Home Assistant Add-on 插件](https://www.home-assistant.io/addons/)运行。但需要注意的是，Home Assistant 插件**并不等同于**集成。无论你是将 Frigate 作为独立 Docker 容器运行还是作为 Home Assistant 插件运行，都需要通过额外的[集成](/integrations/home-assistant)将 Frigate 接入 Home Assistant 内。

:::info 💡 快速导航
第一次使用本项目？查看 [快速开始](/frigate/quick-start) 了解需要什么
:::

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

### Docker Compose 配置生成 {#docker-compose-generator}

<DockerComposeGenerator />

:::warning

使用 Snapcraft 构建版 Docker 的用户只能将存储位置设置在 $HOME 目录下。

:::

### 计算所需的共享内存大小（shm-size） {#calculating-required-shm-size}

Frigate 使用共享内存(shm)处理视频帧。Docker 默认提供的 shm-size 为 64MB。

对于 2 个 720p 摄像头的检测场景，一般 128MB shm 就足够了。若出现"Bus error"错误退出，通常是由于高分辨率摄像头过多，需通过 using [`--shm-size`](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources) （或者 Docker Compose 中的[`service.shm_size`](https://docs.docker.com/compose/compose-file/compose-file-v2/#shm_size)）增加 shm 容量。

注意：Frigate 容器日志也会占用最多 40MB 的 shm，计算时需计入。

<ShmCalculator />

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

在树莓派`Bookworm`系统版本中，内核内置的 Hailo 驱动版本较旧，与 Frigate 不兼容。你**必须**按照下方的安装步骤安装适配的驱动版本，且必须按步骤 1 的说明禁用内核内置驱动。

在树莓派`Trixie`系统版本中，内核已不再预装 Hailo 驱动。该驱动通过 DKMS 方式安装，因此不存在下文所述的驱动冲突问题，你只需直接运行安装脚本即可。

:::

<DetailsCollapse title="Hailo 驱动安装说明">

1. **禁用内置 Hailo 驱动程序（仅限 树莓派`Bookworm`系统版本）**:

   :::note

   如果你的设备不是搭载`Bookworm`版本系统的树莓派，请跳过此步骤，直接进入步骤 2。

   以及，如果你的树莓派使用的是`Trixie`系统，也同样跳过此步骤，直接进入步骤 2。

   :::

   首先，检查驱动当前是否已加载：

   ```bash
   lsmod | grep hailo
   ```

   如果显示 `hailo_pci`，则将其卸载：

   ```bash
   sudo modprobe -r hailo_pci
   ```

   接下来找到内核内置驱动文件并修改其名称，使其无法被加载。
   重命名操作可保留原驱动文件，便于后续需要时恢复。

   首先，查找当前已安装的内核模块：

   ```bash
   modinfo -n hailo_pci
   ```

   可能会输出的内容示例：

   ```
   /lib/modules/6.6.31+rpt-rpi-2712/kernel/drivers/media/pci/hailo/hailo_pci.ko.xz
   ```

   将输出的模块路径保存至变量（请不要复制文档上方给出的实例）：

   ```bash
   BUILTIN=$(modinfo -n hailo_pci)
   ```

   接着通过追加后缀`.bak`来重命名该模块：

   ```bash
   sudo mv "$BUILTIN" "${BUILTIN}.bak"
   ```

   现在刷新内核模块映射表，让系统识别到上述修改：

   ```bash
   sudo depmod -a
   ```

   重启你的树莓派：

   ```bash
   sudo reboot
   ```

   重启后，验证内置驱动是否未加载：

   ```bash
   lsmod | grep hailo
   ```

   此命令应返回无结果。

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

   验证驱动版本：

   ```bash
   cat /sys/module/hailo_pci/version
   ```

   验证固件是否安装正确：

   ```bash
   ls -l /lib/firmware/hailo/hailo8_fw.bin
   ```

   **可选操作：修复 PCIe 描述符页大小错误**

   若你遇到以下错误：

   ```
   [HailoRT] [error] CHECK failed - max_desc_page_size given 16384 is bigger than hw max desc page size 4096
   ```

   创建配置文件以强制设置正确的描述符页大小：

   ```bash
   echo 'options hailo_pci force_desc_page_size=4096' | sudo tee /etc/modprobe.d/hailo_pci.conf
   ```

   然后重启设备：

   ```bash
   sudo reboot
   ```

</DetailsCollapse>

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

### MemryX MX3 加速卡

MemryX MX3 加速卡采用 **M.2 2280 规格**（与 NVMe 固态硬盘尺寸一致），支持以下设备配置：

- x86 架构（Intel/AMD）台式机/主机
- 树莓派 5
- 香橙派 5 Plus/Max
- 多盘位 M.2 PCIe 扩展板

#### 配置说明

#### 驱动安装

如需为你的设备完成 MX3 硬件初始化配置，请参考 →【硬件安装指南】(https://developer.memryx.com/get_started/hardware_setup.html)。

完成硬件安装后，按以下步骤安装适配的驱动及运行环境：

1. 复制或下载【安装脚本】(https://github.com/blakeblackshear/frigate/blob/dev/docker/memryx/user_installation.sh)
2. 执行命令赋予脚本执行权限：`sudo chmod +x user_installation.sh`
3. 运行脚本：`./user_installation.sh`
4. **重启电脑**，完成驱动的最终安装生效。

#### Frigate 部署配置

首先按常规方式安装 Frigate 即可，推荐镜像：`docker.cnb.cool/frigate-cn/frigate:stable`

接下来，为了让 Docker 容器获得硬件访问权限，需要在你的 `docker-compose.yml` 文件中添加以下配置：

```yaml
devices:
  - /dev/memx0
```

配置期间，**必须以特权模式运行 Docker 容器**，并确保容器能够访问 max-manager 服务。

同时在 `docker-compose.yml` 中补充添加以下配置项：

```yaml
privileged: true

volumes:
  - /run/mxa_manager:/run/mxa_manager
```

如果你的环境无法使用 Docker Compose，也可以直接执行以下 `docker run` 命令启动容器（配置等效）：

<DetailsCollapse title="MemryX MX3 参考 Docker run 命令">

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

</DetailsCollapse>

#### 最终配置

最后，参考[硬件目标检测](../configuration/object_detectors.md#memryx-mx3) ，完成相关参数配置，即可完成全部部署流程。

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

### 昇锐（Synaptics） {#synaptics}

- 型号：SL1680

#### 部署配置

请遵循 Frigate 的标准安装流程，但需使用**后缀带 `-synaptics`** 的专属 Docker 镜像，例如：`docker.cnb.cool/frigate-cn/frigate:stable-synaptics`。

接下来，需要为 Docker 容器授予硬件访问权限：

- 配置过程中，**必须以特权模式运行 Docker**，避免因权限不足导致各类异常。操作方式为在 `docker-compose.yml` 文件中添加 `privileged: true` 配置项，或在 `docker run` 命令中加入 `--privileged` 参数。

在 `docker-compose.yml` 中添加如下设备映射配置：

```yaml
devices:
  - /dev/synap
  - /dev/video0
  - /dev/video1
```

或者，在 `docker run` 命令中追加以下参数：

```
--device /dev/synap \
--device /dev/video0 \
--device /dev/video1
```

#### 功能配置

完成上述步骤后，需分别配置 **[硬件目标检测](../configuration/object_detectors.md#synaptics)** 与 **[硬件视频处理](../configuration/hardware_acceleration_video.md#synaptics)** 模块，以启用对应的加速能力。

### AXERA 算力卡 {#axera}

AXERA 算力卡采用 M.2 外形尺寸，支持以下设备配置：

- x86 架构（Intel/AMD）台式机/主机
- 树莓派 5
- 香橙派 5 Plus
- 多盘位 M.2 PCIe 扩展板

#### 安装

使用 AXERA 算力卡需要安装 AXCL 驱动程序。我们提供了一个便捷的 Linux 脚本来完成此安装。请按照以下步骤进行操作：

```bash
wget https://github.com/ivanshi1108/assets/releases/download/v0.17/user_installation.sh
sudo chmod +x user_installation.sh
./user_installation.sh
```

#### 设置

按照 Frigate 的默认安装说明进行操作，但使用带有`-axcl`后缀的 docker 镜像，例如`docker.cnb.cool/frigate-cn/frigate:stable-axcl`。

接下来，通过在 `docker-compose.yml` 文件中添加以下几行，授予 Docker 访问硬件的权限并挂载 axcl 相关目录：

```yaml
devices:
  - /dev/axcl_host
  - /dev/ax_mmb_dev
  - /dev/msg_userdev
volumes:
  - /usr/bin/axcl:/usr/bin/axcl
  - /usr/lib/axcl:/usr/lib/axcl
```

如果您使用 `docker run` 命令，请将此选项添加到您的命令中：

```
--device /dev/axcl_host
--device /dev/ax_mmb_dev
--device /dev/msg_userdev
--volume /usr/bin/axcl:/usr/bin/axcl
--volume /usr/lib/axcl:/usr/lib/axcl
```

#### 配置

接下来，您应该配置[硬件物体/目标检测](../configuration/object_detectors.md#axera)。

## Docker {#docker}

推荐使用 Docker Compose 进行安装。

你可以点击使用上方的 <a href="#docker-compose-generator">Docker Compose 生成器</a>来生成适用于你的配置。

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
      - type: tmpfs # 使用 1GB 内存作为录制片段存储的临时存储
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
      TF_KERAS_MOBILENET_V2_WEIGHTS_URL: https://cnb.cool/frigate-cn/mirrors/storage.googleapis/-/git/raw/main/tensorflow/keras-applications/mobilenet_v2/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_0.35_224_no_top.h5 # 分类模型需要的权重文件 [!code highlight]
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

## macOS - 苹果芯片（Apple Silicon）

:::warning 注意
macOS 系统会将 5000 端口用于 Airplay 接收器服务。若你希望在 Frigate 中暴露 5000 端口，以供本地应用和 API 访问，则需将该端口映射到主机的其他端口（例如 5001 端口）。

即便已在 Docker 中正确暴露 5000 端口，若未在主机上重新映射该端口，仍会导致 5000 端口上的 WebUI 和所有 API 端点无法访问。
:::

macOS 上的 Docker 容器可通过 [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/) 或 [OrbStack](https://orbstack.dev)（原生 Swift 应用）进行编排。两者的推理速度差异微乎其微，但 OrbStack 作为原生 Swift 应用，在 CPU 占用、功耗和容器启动时间方面表现更优。

若要让 Frigate 调用苹果芯片的神经引擎/处理单元（NPU），主机必须运行 [Apple Silicon Detector](../configuration/object_detectors.md#apple-silicon-detector)（需在 Docker 外部的主机环境中运行）。

#### Docker Compose 配置示例

```yaml
services:
  frigate:
    container_name: frigate
    image: docker.cnb.cool/frigate-cn/frigate:stable-standard-arm64 # 需要使用standard-arm64的镜像
    restart: unless-stopped
    shm_size: '512mb' # 根据上文的计算结果，按你的摄像头数量调整
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /path/to/your/config:/config # "/path/to/your/config"为你宿主机上希望存放配置文件的路径，例如 /home/frigate/config
      - /path/to/your/storage:/media/frigate # "/path/to/your/storage"为你宿主机上希望存放监控录像文件的路径 /home/frigate/video
    ports:
      - '8971:8971'
      # 在 macOS 上暴露端口时，映射到主机的其他端口（如 5001 或其他无冲突端口）
      # - "5001:5000" # 内部未认证访问，需谨慎暴露
      - '8554:8554' # RTSP 视频流
    extra_hosts: # [!code highlight]
      # 此项配置至关重要
      # 允许 Frigate 通过 Apple Silicon Detector 访问苹果芯片的 NPU
      - 'host.docker.internal:host-gateway' # 访问 NPU 检测器的必要配置 [!code highlight]
    environment:
      - FRIGATE_RTSP_PASSWORD: 'password'
```
