---
id: installation
title: 安装
---

Frigate可运行在任何拥有Docker的主机上，甚至可以作为[Home Assistant Add-on插件](https://www.home-assistant.io/addons/)运行。但需要注意的是，Home Assistant插件**并不等同于**集成。无论你是将Frigate作为独立Docker容器运行还是作为Home Assistant插件运行，都需要通过额外的[集成](/integrations/home-assistant)将Frigate接入Home Assistant内。

:::tip

若你已通过Home Assistant插件安装Frigate，请查阅[入门指南](../guides/getting_started#configuring-frigate)进行配置。

:::

## 依赖项 {#dependencies}

**MQTT Broker(可选)** - Frigate本身可以不依赖MQTT Broker运行，但如果你想使用Home Assistant集成功能就必须要安装并配置MQTT。Frigate 和 Home Assistant 必须连接至同一个 MQTT Broker服务器。

## 硬件准备 {#preparing-your-hardware}

### 操作系统 {#operating-system}

Frigate最好工作在安装了Docker的Debian系宿主机上获得最佳性能；同时，你需要让Frigate能够直通访问底层硬件（例如Coral这类AI加速器以及显卡）。不建议在Proxmox、ESXi、Virtualbox等虚拟化平台上运行Frigate（尽管有一部分[用户尝试在Proxmox上运行成功](#proxmox)）

Windows系统未获官方支持，但有用户通过WSL或Virtualbox成功运行。需注意的是在Windows下，显卡或Coral等设备的直通可能比较麻烦。如需帮助，可查阅历史讨论或问题记录。

### 存储 {#storage}

Frigate 容器在运行时会对以下目录进行读写操作，你可以通过 Docker 卷映射将这些目录挂载到宿主机的任意位置：

- `/config`: 用于存储 Frigate 配置文件及 SQLite 数据库。运行期间还会生成若干临时文件。
- `/media/frigate/clips`: 快照存储目录（未来可能更名为 snapshots）。目录结构为系统自动管理，禁止手动修改或浏览。
- `/media/frigate/recordings`: 录像片段内部存储目录。目录结构为系统自动管理，禁止手动修改或浏览。
- `/media/frigate/exports`: 通过网页或API导出的视频片段和延时摄影存储目录。
- `/tmp/cache`: 录像片段缓存目录，原始录像会先写入此处，经校验并转为 MP4 格式后移至recordings目录。通过`clip.mp4`接口生成的片段也在此拼接处理。建议使用 [`tmpfs`](https://docs.docker.com/storage/tmpfs/) 挂载此目录
- `/dev/shm`: 解码帧原始数据的共享内存缓存（不可修改或手动映射）。最小容量受下文 `shm-size`计算规则影响。

### 端口 {#ports}

Frigate会使用以下端口，根据实际需要对以下端口进行映射。

| 端口   | 说明                                                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `8971` | 提供未TLS加密带身份验证的页面和API访问，请使用反代应用（例如Nginx）代理此端口（并最好配置TLS加密）。                                                                                         |
| `5000` | 提供内部未加密且无需认证的UI和API访问。该端口使用需要严格限制，仅限Docker内部网络中使用，供与Frigate集成的服务调用。 |
| `8554` | 提供未加密的实时视频流转发服务（默认无需认证）。可通过配置文件中go2rtc模块启用认证功能。                                             |
| `8555` | 提供双向通话支持的WebRTC连接服务。                                                                                                                             |

#### 常见 Docker Compose 存储配置 {#common-docker-compose-storage-configurations}

写入本地硬盘或外部USB驱动器：

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

### 计算所需的共享内存大小(shm-size) {#calculating-required-shm-size}

Frigate使用共享内存(shm)处理视频帧。Docker默认提供的shm-size为64MB。

对于2个720p摄像头的检测场景，默认128MB共享内存足够。若出现"Bus error"错误退出，通常是由于高分辨率摄像头过多，需通过using [`--shm-size`](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources) （或者Docker Compose中的[`service.shm_size`](https://docs.docker.com/compose/compose-file/compose-file-v2/#shm_size)）增加内存容量。

注意：Frigate容器日志也会占用最多40MB共享内存，计算时需计入。

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

Home Assistant插件无法单独设置容器共享内存。但由于Home Assistant Supervisor默认分配总内存的50%给`/dev/shm`（例如8GB内存机器可分配约4GB），通常无需额外配置。

## 特定硬件的额外设置步骤

以下部分包含仅在使用特定硬件时才需要的额外安装步骤。如果你未使用这些硬件类型中的任何一种，可以直接跳转到 [Docker](#docker) 安装章节。

### 树莓派3/4 {#raspberry-pi-34}

默认情况下，树莓派对GPU可用内存进行了限制。如需使用ffmpeg硬件加速功能，必须按照[官方文档](https://www.raspberrypi.org/documentation/computers/config_txt.html#memory-options)说明，在`config.txt`中将`gpu_mem`设置为最大推荐值以增加可用内存。

需要特别注意USB Coral功耗问题。若同时使用SSD等其他USB设备，可能因供电不足导致系统不稳定必须使用带独立电源的外置USB集线器。部分用户反馈<a href="https://amzn.to/3a2mH0P" target="_blank" rel="nofollow noopener sponsored">此款产品</a>（推广链接）可稳定运行。

### Hailo-8

Hailo-8和Hailo-8L AI加速器提供M.2和树莓派HAT两种规格。M.2版本通常通过PCIe载板连接，作为AI套件组成部分与树莓派5对接；HAT版本则可直接安装于兼容的树莓派机型。两种规格在x86平台亦通过兼容性测试，具备多平台适配能力。

#### 安装 {#installation}

:::warning

对于使用搭载旧版本内核的Raspberry Pi 5用户，安装 Hailo 驱动的过程相对简单，但该驱动与 Frigate 不兼容。你**必须**按照此指南中的安装步骤来安装正确版本的驱动，并且**必须**按照第1步所述禁用内置的内核驱动程序。

:::

1. **禁用内置 Hailo 驱动程序（仅限 树莓派）**:

   :::note

   如果你没有使用`树莓派`，请跳过此步骤，直接进入第 2 步的软件相关操作。

   :::

   如果你使用的是`树莓派`，则需要将内置的内核级 Hailo 驱动列入黑名单，以防止冲突。首先，请检查该驱动是否当前已加载：

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

按照默认安装说明设置Frigate，例如：`docker.cnb.cool/frigate-cn/frigate:stable`

接下来，通过在`docker-compose.yml`文件中添加以下行来授予Docker访问硬件的权限：

```yaml
devices:
  - /dev/hailo0
```

如果你使用`docker run`，请在命令中添加此选项：`--device /dev/hailo0`

#### 配置 {#configuration}

最后，配置[硬件物体/目标检测](/configuration/object_detectors#hailo-8)以完成设置。

### Rockchip平台 {#rockchip-platform}

确保使用带有Rockchip BSP内核5.10或6.1以及必要驱动程序（特别是rkvdec2和rknpu）的Linux发行版。要检查是否满足要求，请输入以下命令：

``` bash
$ uname -r
5.10.xxx-rockchip # 或6.1.xxx；-rockchip后缀很重要
$ ls /dev/dri
by-path  card0  card1  renderD128  renderD129 # 应列出renderD128（VPU）和renderD129（NPU）
$ sudo cat /sys/kernel/debug/rknpu/version
RKNPU driver: v0.9.2 # 或更高版本
```

如果你的开发板受支持，我推荐使用[Armbian](https://www.armbian.com/download/?arch=aarch64)。

#### 设置 {#setup-1}

按照Frigate的默认安装说明进行操作，但使用带有`-rk`后缀的docker镜像，例如`docker.cnb.cool/frigate-cn/frigate:stable-rk`。

接下来，你需要授予docker访问硬件的权限：

- 在配置过程中，你应该在特权模式下运行docker以避免因权限不足而出现错误。为此，在`docker-compose.yml`文件中添加`privileged: true`或在docker run命令中添加`--privileged`标志。
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

#### 配置 {#configuration-1}

接下来，你应该配置[硬件物体/目标检测](/configuration/object_detectors#rockchip平台)和[硬件视频处理](/configuration/hardware_acceleration_video#rockchip平台)。

## Docker

推荐使用Docker Compose进行安装。

:::danger

需要注意，如果没有必要需求，请尽量不要暴露5000端口！并且使用复杂密码，避免你的数据泄露！
如果实在需要使用到5000端口，请务必配置好服务器的防火墙，尤其需要注意IPv6的情况。
如果你不理解上述内容，请直接删除5000端口的内容

:::


```yaml
services:
  frigate:
    container_name: frigate
    privileged: true # 使用特权模式
    restart: unless-stopped
    stop_grace_period: 30s # 为各服务提供足够的关闭时间
    image: docker.cnb.cool/frigate-cn/frigate:stable # 此处为国内镜像源地址，原地址为 ghcr.io/blakeblackshear/frigate:stable
    shm_size: "512mb" # 根据上述计算结果为你的摄像头更新此值
    devices:
      # 以下内容根据你的实际情况进行删改。例如你不用Coral，就将Coral的设备映射给删除
      - /dev/bus/usb:/dev/bus/usb # 用于USB Coral，其他版本需要修改
      - /dev/apex_0:/dev/apex_0 # 用于PCIe Coral，请按照此处的驱动说明操作 https://github.com/jnicolson/gasket-builder
      - /dev/video11:/dev/video11 # 用于树莓派4B
      - /dev/dri/renderD128:/dev/dri/renderD128 # 用于Intel硬件加速，需要根据你的硬件更新
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /path/to/your/config:/config # "/path/to/your/config"为你宿主机上希望存放配置文件的路径，例如 /home/frigate/config
      - /path/to/your/storage:/media/frigate # "/path/to/your/storage"为你宿主机上希望存放监控录像文件的路径 /home/frigate/video
      - type: tmpfs # 可选：将使用1GB内存作为缓存文件，减少SSD/SD卡损耗
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    ports:
      - "8971:8971"
      # - "5000:5000" # 用于内部无鉴权验证的访问。谨慎暴露。 
      - "8554:8554" # RTSP视频流
      - "8555:8555/tcp" # 基于TCP的WebRTC
      - "8555:8555/udp" # 基于UDP的WebRTC
    environment:
      FRIGATE_RTSP_PASSWORD: "password" # rtsp的密码，请修改"password"为你期望的密码
      TZ: "Asia/Shanghai" # 设置为中国+8时区 [!code highlight]
      HF_ENDPOINT: "https://huggingface.mirror.frigate-cn.video" # 由我们提供的Huggingface国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]
      GITHUB_ENDPOINT: "https://github.mirror.frigate-cn.video" # 由我们提供的GitHub国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]
```

如果你无法使用Docker Compose，可以使用类似以下命令运行容器：

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
上面的镜像地址已换为我们托管在国内cnb上的地址，能够在国内获得更快的速度。如不需要使用镜像加速，可以将地址换为官方镜像地址：

ghcr.io/blakeblackshear/frigate:stable

:::


:::warning
默认镜像是不支持N卡或A卡加速的！需要参考下方，使用特定后缀的镜像地址。

amd64**并不是**特指的AMD平台，而是历史遗留原因导致的名称。Intel、AMD的CPU都属于amd64架构。
:::

当前稳定版本的官方Docker镜像标签有：

- `stable` - 适用于**amd64**的标准Frigate构建和适用于**arm64**的树莓派优化Frigate构建。此构建还包括对Hailo设备的支持。推荐Intel核显或使用Coral、Hailo的用户使用
- `stable-standard-arm64` - 适用于**arm64**的标准Frigate构建
- `stable-tensorrt` - 专门用于运行**NVIDIA GPU**的amd64设备的Frigate构建
- `stable-rocm` - 适用于[AMD GPU](../configuration/object_detectors.md#amdrocm-gpu-detector)的Frigate构建

当前稳定版本的社区支持Docker镜像标签有：

- `stable-tensorrt-jp6` - 为运行Jetpack 6的**NVIDIA Jetson**开发板设备优化的Frigate构建
- `stable-rk` - 适用于搭载 **瑞芯微Rockchip SoC** 开发板设备的Frigate构建

## Home Assistant插件 {#home-assistant-add-on}

:::warning

从Home Assistant操作系统10.2和Home Assistant 2023.6版本开始，支持为媒体文件配置独立的网络存储。

需要注意HA OS的以下重要限制：

- Home Assistant尚不支持媒体文件的独立本地存储
- 由于HA OS不包含mesa驱动程序，因此不支持AMD GPU
- 由于插件不支持nvidia运行时，因此不支持NVIDIA GPU

:::

:::tip

请参阅[网络存储指南](/guides/ha_network_storage.md)了解如何为Frigate设置网络存储。

:::

Home Assistant OS用户可以通过插件仓库进行安装。

1. 在Home Assistant中，导航至 _设置_ > _插件_ > _插件商店_ > _仓库_
2. 添加 `https://github.com/blakeblackshear/frigate-hass-addons`
3. 安装所需的Frigate插件版本（见下文）
4. 在`配置`选项卡中设置网络配置
5. 启动插件
6. 使用_打开Web界面_按钮访问Frigate界面，然后点击_齿轮图标_ > _配置编辑器_，根据需要配置Frigate

插件提供以下几种版本：

| 插件版本                   | 描述                                    |
| -------------------------- | --------------------------------------- |
| Frigate                    | 当前发布版本，启用保护模式             |
| Frigate（完全访问）        | 当前发布版本，可选择禁用保护模式       |
| Frigate Beta               | Beta版本，启用保护模式                 |
| Frigate Beta（完全访问）   | Beta版本，可选择禁用保护模式           |

如果你使用ffmpeg硬件加速，你**可能**需要使用_完全访问_版本的插件。这是因为Frigate插件在容器中运行时对主机系统的访问受限。_完全访问_版本允许你禁用_保护模式_，从而让Frigate完全访问主机系统。

你也可以通过[VS Code插件](https://github.com/hassio-addons/addon-vscode)或类似工具编辑Frigate配置文件。在这种情况下，配置文件位于`/addon_configs/<addon_directory>/config.yml`，其中`<addon_directory>`取决于你运行的Frigate插件版本。请参阅[此处](../configuration/index.md#accessing-add-on-config-dir)的目录列表。

## Kubernetes

使用[helm chart](https://github.com/blakeblackshear/blakeshome-charts/tree/master/charts/frigate)进行安装。

## Unraid

许多人拥有足够强大的NAS设备或家庭服务器来运行docker。Unraid提供了一个社区应用。
要安装，请确保你已安装[社区应用插件](https://forums.unraid.net/topic/38582-plug-in-community-applications/)。然后在Unraid的应用部分搜索"Frigate" - 你可以在[这里](https://unraid.net/community/apps?q=frigate#r)查看在线商店。

## Proxmox虚拟化平台 {#proxmox}

根据[Proxmox官方文档](https://pve.proxmox.com/pve-docs/pve-admin-guide.html#chapter_pct)建议，像Frigate这样的应用容器最好运行在Proxmox QEMU虚拟机中。这种部署方式既能获得应用容器化的所有优势，又能享受虚拟机带来的诸多好处，例如：
- 与宿主机实现强隔离
- 支持实时迁移等高级功能（这些功能在直接使用容器时无法实现）

:::warning

如果你选择通过LXC在Proxmox中运行Frigate，设置过程可能会很复杂，请做好阅读Proxmox和LXC文档的准备，Frigate不官方支持在LXC内运行。

:::

建议包括：
- 对于基于Intel的硬件加速，要允许访问主设备号为226、次设备号为128的`/dev/dri/renderD128`设备，请在`/etc/pve/lxc/<id>.conf` LXC配置文件中添加以下行：
  - `lxc.cgroup2.devices.allow: c 226:128 rwm`
  - `lxc.mount.entry: /dev/dri/renderD128 dev/dri/renderD128 none bind,optional,create=file`
- LXC配置可能还需要`features: fuse=1,nesting=1`。这允许在LXC容器中运行Docker容器（`nesting`）并防止文件重复和存储浪费（`fuse`）。
- 通过多层容器化（LXC然后Docker）成功传递硬件设备可能很困难。许多人选择在主机上将`/dev/dri/renderD128`等设备设为全局可读，或在特权LXC容器中运行Frigate。
- 虚拟化层通常会给与Coral设备的通信带来大量开销，但[并非所有情况都如此](https://github.com/blakeblackshear/frigate/discussions/1837)。

更多一般信息请参见[Proxmox LXC讨论](https://github.com/blakeblackshear/frigate/discussions/5773)。

## ESXi

有关使用ESXi运行Frigate的详细信息，请参阅[此处](https://williamlam.com/2023/05/frigate-nvr-with-coral-tpu-igpu-passthrough-using-esxi-on-intel-nuc.html)的说明。

如果你在机架式服务器上运行Frigate并想要直通Google Coral，请[阅读此处](https://github.com/blakeblackshear/frigate/issues/305)。

## 群晖NAS上的 DSM 7 {#synology-nas-on-dsm-7}

这些设置已在 `DSM 7.1.1-42962 Update 4` 版本上通过测试

**常规设置:**

需要启用`使用高权限执行容器`选项，以便为Frigate容器提供可能需要的提升权限。

如果你希望容器在因错误而异常关闭时自动重启，可以启用`启用自动重启`选项。

![image](/img/synology-setting.png)

**高级设置:**

如需使用密码模板功能，应在高级设置中添加"FRIGATE_RTSP_PASSWORD"环境变量并设置你偏好的密码。其余环境变量目前应保持默认值。

![image](https://user-images.githubusercontent.com/4516296/232587163-0eb662d4-5e28-4914-852f-9db1ec4b9c3d.png)

**端口设置:**

网络模式应设置为`bridge`。你需要将Frigate容器的默认端口映射到你想在群晖NAS上使用的本地端口。

如果NAS上有其他服务正在使用Frigate所需的相同端口，你可以将端口设置为自动或指定特定端口。

![image](https://user-images.githubusercontent.com/4516296/232582642-773c0e37-7ef5-4373-8ce3-41401b1626e6.png)

**存储空间设置:**

需要配置2个路径：

- 配置目录的位置，这将根据你的NAS文件夹结构而有所不同，例如`/docker/frigate/config`将挂载到容器内的`/config`
- NAS上用于保存录像的位置，这必须是一个文件夹，例如`/docker/volumes/frigate-0-media`

![image](https://user-images.githubusercontent.com/4516296/232585872-44431d15-55e0-4004-b78b-1e512702b911.png)

## 威联通QNAP NAS {#qnap-nas}

这些说明已在配备Intel J3455 CPU和16G RAM、运行QTS 4.5.4.2117的QNAP上测试通过。

QNAP有一个名为Container Station的图形工具用于安装和管理docker容器。但是，Container Station有两个限制使其不适合安装Frigate：

1. Container Station不支持GitHub镜像站（ghcr），而镜像站托管了Frigate 0.12.0及以上版本的docker镜像。
2. Container Station使用默认64 Mb共享内存大小（`shm-size`），且没有调整机制。Frigate需要更大的shm-size才能正常处理两个以上的高分辨率摄像头。

由于上述限制，安装必须通过命令行完成。以下是具体步骤：

**准备工作**

1. 如果尚未安装，从QNAP应用中心安装Container Station。
2. 在QNAP上启用ssh（请通过网络搜索了解具体操作方法）。
3. 准备Frigate配置文件，命名为`config.yml`。
4. 根据[文档](https://docs.frigate-cn.video/frigate/installation)计算共享内存大小。
5. 从https://en.wikipedia.org/wiki/List_of_tz_database_time_zones 查找你的时区值。
6. 通过ssh连接到QNAP。

**安装**

运行以下命令安装Frigate（以`stable`版本为例）：

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

登录QNAP，打开Container Station。Frigate docker容器应该在"概览"下列出并正在运行。点击Frigate docker，然后点击详情页顶部显示的URL访问Frigate Web界面。