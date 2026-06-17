---
id: config
title: Frigate 配置
---

Frigate 可以通过**设置界面**或直接编辑 YAML 配置文件来配置。推荐使用设置界面——它提供验证和引导式体验，覆盖所有配置选项。

## 使用设置界面

设置界面将每个配置选项分组到左侧菜单中列出的各个部分。每个部分都提供带验证的引导式表单，因此你无需记住 YAML 的结构或手动查找选项名称。

### 全局配置与摄像头级配置

设置分为两个范围：

- **全局配置**——设置 > 全局配置 下的值默认应用于每个摄像头。这是你设置目标检测、录制、快照、画面变动等基线行为的地方。
- **摄像头配置**——设置 > 摄像头配置 下的值仅应用于单个摄像头。使用这些页面顶部的摄像头选择器按钮选择要编辑的摄像头。

当摄像头级部分未被修改时，摄像头会继承全局值。在摄像头页面上更改值仅**覆盖**该摄像头的全局值——全局设置和其他摄像头不受影响。这与 YAML 的工作方式一致，在 `cameras.<name>` 下设置的值优先于顶层设置的相同值。

要撤销覆盖并恢复从父范围继承，使用部分底部的重置按钮：

- 在摄像头部分，按钮标记为**重置为全局**，将摄像头恢复为全局值。
- 在全局部分，按钮标记为**重置为默认**，恢复 Frigate 的内置默认值。

重置会要求确认，且一旦应用不可撤销。

### 保存更改和全部保存按钮

编辑在你保存之前不会应用。一旦你更改了值，界面会将其跟踪为待保存更改：

- 编辑的部分显示**已修改**标记，更改的字段会高亮显示。
- 部分的**保存**和**撤销**按钮上方会出现**你有未保存的更改**提示。**保存**仅提交该部分；**撤销**放弃其待保存编辑。

由于待保存更改可能跨越多个部分——以及多个摄像头——页眉提供了**全部保存**按钮，可一次性写入所有待保存更改。旁边的**查看待保存更改**会打开一个摘要，列出每个待保存编辑及其范围（全局或特定摄像头）、受影响的字段和新值，以便你在提交前确认将要写入的内容。**全部撤销**会放弃所有部分的待保存更改。

### 需要重启的指示器

大多数设置会立即生效，但有些需要重启 Frigate 才能应用。需要重启的字段会在字段标签旁边标记一个小重启图标和**需要重启**提示。

当你保存涉及这些字段的更改时，Frigate 会确认保存并提醒你需要重启（例如，_"设置已成功保存。重启 Frigate 以应用你的更改。"_）。通知包含一键**重启 Frigate**操作，让你可以立即应用更改，也可以继续编辑稍后重启。

### 摄像头配置菜单中的彩色圆点

当你在设置 > 摄像头配置下工作时，菜单中部分名称旁可能出现小彩色圆点。它们为你提供所选摄像头该部分状态的一览摘要：

- **蓝色圆点**——此部分**覆盖了全局配置**。该部分中有一个或多个值是专门为此摄像头设置的，与全局默认值不同。
- **模板颜色圆点**——当你查看[摄像头模板](./profiles.md)时，该模板指定颜色的圆点表示该部分被该模板**覆盖**。每个模板都有自己的独特颜色，因此你可以一目了然地知道它更改了哪些部分。
- **黄色圆点**——此部分有**未保存的更改**。当你在该部分有待保存编辑时，它会与**已修改**标记一起出现。

将鼠标悬停在任何圆点上可查看描述其含义的提示。打开部分可查看具体覆盖了哪些字段——部分标题会指出有多少字段与全局（或基础）配置不同。

## 配置文件位置

对于偏好直接编辑 YAML 配置文件的用户，建议从最小配置开始，按照[本指南](../guides/getting_started.md)中的描述添加内容。

```yaml
mqtt:
  enabled: False

cameras:
  dummy_camera: # <--- 此处改为你摄像头的名称，仅支持英文数字下划线与连接符
    enabled: False
    ffmpeg:
      inputs:
        - path: rtsp://127.0.0.1:554/rtsp # <--- 此处改为你摄像头的rtsp地址
          roles:
            - detect
```

## 访问 Home Assistant App 配置目录 {#accessing-app-config-dir}

当通过 HA App 运行 Frigate 时，Frigate 的`/config`目录被映射到主机上的`/addon_configs/<addon_directory>`，其中`<addon_directory>`是特定于你正在运行的 Frigate App 变体的。

| App 变体                  | 配置目录                                  |
| ----------------------- | ----------------------------------------- |
| Frigate                 | `/addon_configs/ccab4aaf_frigate`         |
| Frigate (完全访问)      | `/addon_configs/ccab4aaf_frigate-fa`      |
| Frigate Beta            | `/addon_configs/ccab4aaf_frigate-beta`    |
| Frigate Beta (完全访问) | `/addon_configs/ccab4aaf_frigate-fa-beta` |

**当你在文档中看到`/config`时，它指的是这个目录。**

例如，如果你正在运行标准 App 变体并使用[VS Code App](https://github.com/hassio-addons/addon-vscode)浏览文件，你可以点击*文件* > *打开文件夹...*并导航到`/addon_configs/ccab4aaf_frigate`来访问 Frigate 的`/config`目录并编辑`config.yaml`文件。你也可以使用 Frigate UI 中内置的文件编辑器来编辑配置文件。

## VS Code 配置模式

VS Code 支持 JSON 模式来自动验证配置文件。你可以通过在配置文件开头添加`# yaml-language-server: $schema=http://frigate_host:5000/api/config/schema.json`来启用此功能。将`frigate_host`替换为你的 Frigate 服务器的 IP 地址或主机名。如果你同时使用 VS Code 和 Frigate 作为 App，你应该使用`ccab4aaf-frigate`。当从另一台机器上的 VS Code 访问配置时，确保暴露内部未认证端口`5000`。

## 环境变量替换

Frigate 仅在[参考配置](./advanced/reference.md)中特别指出的地方支持使用以`FRIGATE_`开头的环境变量。例如，以下值可以在运行时通过使用环境变量替换：

```yaml
mqtt:
  host: "{FRIGATE_MQTT_HOST}"
  user: '{FRIGATE_MQTT_USER}'
  password: '{FRIGATE_MQTT_PASSWORD}'
```

```yaml
- path: rtsp://{FRIGATE_RTSP_USER}:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:8554/unicast
```

```yaml
onvif:
  host: "192.168.1.12"
  port: 8000
  user: '{FRIGATE_RTSP_USER}'
  password: '{FRIGATE_RTSP_PASSWORD}'
```

```yaml
go2rtc:
  rtsp:
    username: '{FRIGATE_GO2RTC_RTSP_USERNAME}'
    password: '{FRIGATE_GO2RTC_RTSP_PASSWORD}'
```

```yaml
genai:
  api_key: '{FRIGATE_GENAI_API_KEY}'
```

## 常见配置示例 {#common-configuration-examples}

以下是一些常见的入门配置示例。有关所有配置值的详细信息，请参阅[参考配置](./advanced/reference.md)。

### 带 USB Coral 的树莓派 Home Assistant App

- 单个摄像头，720p，5fps 检测流
- MQTT 连接到 Home Assistant Mosquitto App
- 用于解码视频的硬件加速
- USB Coral 检测器
- 保存所有包含任何可检测运动的视频 7 天，无论是否检测到任何物体/目标
- 如果视频符合警报或检测条件，继续保留 30 天
- 保存快照 30 天
- 摄像头时间戳的画面变动遮罩

```yaml
mqtt:
  host: core-mosquitto
  user: mqtt-user
  password: xxxxxxxxxx

ffmpeg:
  hwaccel_args: preset-rpi-64-h264

detectors:
  coral:
    type: edgetpu
    device: usb

record:
  enabled: True
  motion:
    days: 7
  alerts:
    retain:
      days: 30
      mode: motion
  detections:
    retain:
      days: 30
      mode: motion

snapshots:
  enabled: True
  retain:
    default: 30

cameras:
  name_of_your_camera:
    detect:
      width: 1280
      height: 720
      fps: 5
    ffmpeg:
      inputs:
        - path: rtsp://10.0.10.10:554/rtsp
          roles:
            - detect
    motion:
      mask:
        - 0.000,0.427,0.002,0.000,0.999,0.000,0.999,0.781,0.885,0.456,0.700,0.424,0.701,0.311,0.507,0.294,0.453,0.347,0.451,0.400
```

### 带 USB Coral 的独立 Intel 迷你 PC

- 单个摄像头，720p，5fps 检测流
- MQTT 禁用（未与 home assistant 集成）
- VAAPI 硬件加速用于解码视频
- USB Coral 检测器
- 保存所有包含任何可检测运动的视频 7 天，无论是否检测到任何物体/目标
- 如果视频符合警报或检测条件，继续保留 30 天
- 保存快照 30 天
- 摄像头时间戳的画面变动遮罩

```yaml
mqtt:
  enabled: False

ffmpeg:
  hwaccel_args: preset-vaapi

detectors:
  coral:
    type: edgetpu
    device: usb

record:
  enabled: True
  motion:
    days: 7
  alerts:
    retain:
      days: 30
      mode: motion
  detections:
    retain:
      days: 30
      mode: motion

snapshots:
  enabled: True
  retain:
    default: 30

cameras:
  name_of_your_camera:
    detect:
      width: 1280
      height: 720
      fps: 5
    ffmpeg:
      inputs:
        - path: rtsp://10.0.10.10:554/rtsp
          roles:
            - detect
    motion:
      mask:
        - 0.000,0.427,0.002,0.000,0.999,0.000,0.999,0.781,0.885,0.456,0.700,0.424,0.701,0.311,0.507,0.294,0.453,0.347,0.451,0.400
```

### 带 OpenVino 的 Home Assistant 集成 Intel 迷你 PC

- 单个摄像头，720p，5fps 检测流
- MQTT 连接到与 home assistant 相同的 mqtt 服务器
- VAAPI 硬件加速用于解码视频
- OpenVino 检测器
- 保存所有包含任何可检测运动的视频 7 天，无论是否检测到任何物体/目标
- 如果视频符合警报或检测条件，继续保留 30 天
- 保存快照 30 天
- 摄像头时间戳的画面变动遮罩

```yaml
mqtt:
  host: 192.168.X.X # <---- 与home assistant使用相同的mqtt代理
  user: mqtt-user
  password: xxxxxxxxxx

ffmpeg:
  hwaccel_args: preset-vaapi

detectors:
  ov:
    type: openvino
    device: AUTO

model:
  width: 300
  height: 300
  input_tensor: nhwc
  input_pixel_format: bgr
  path: /openvino-model/ssdlite_mobilenet_v2.xml
  labelmap_path: /openvino-model/coco_91cl_bkgr.txt

record:
  enabled: True
  motion:
    days: 7
  alerts:
    retain:
      days: 30
      mode: motion
  detections:
    retain:
      days: 30
      mode: motion

snapshots:
  enabled: True
  retain:
    default: 30

cameras:
  name_of_your_camera:
    detect:
      width: 1280
      height: 720
      fps: 5
    ffmpeg:
      inputs:
        - path: rtsp://10.0.10.10:554/rtsp
          roles:
            - detect
    motion:
      mask:
        - 0.000,0.427,0.002,0.000,0.999,0.000,0.999,0.781,0.885,0.456,0.700,0.424,0.701,0.311,0.507,0.294,0.453,0.347,0.451,0.400
```
