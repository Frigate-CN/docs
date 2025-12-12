---
id: index
title: Frigate 配置
---

对于 Home Assistant 插件安装，配置文件应该位于`/addon_configs/<addon_directory>/config.yml`，其中`<addon_directory`是特定于你正在运行的 Frigate 插件变体的。请参见[此处](#accessing-add-on-config-dir)的目录列表。

对于所有其他类型的安装，配置文件应该映射到容器内的`/config/config.yml`。

文件可以命名为`config.yml`或`config.yaml`，但如果两个文件都存在，将优先使用`config.yml`并忽略`config.yaml`。

建议从最小配置开始，按照[本指南](../guides/getting_started.md)中的描述添加内容，并使用 Frigate 页面中内置的支持验证的配置编辑器。

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

## 访问 Home Assistant 插件配置目录 {#accessing-add-on-config-dir}

当通过 HA 插件运行 Frigate 时，Frigate 的`/config`目录被映射到主机上的`/addon_configs/<addon_directory>`，其中`<addon_directory>`是特定于你正在运行的 Frigate 插件变体的。

| 插件变体                | 配置目录                                  |
| ----------------------- | ----------------------------------------- |
| Frigate                 | `/addon_configs/ccab4aaf_frigate`         |
| Frigate (完全访问)      | `/addon_configs/ccab4aaf_frigate-fa`      |
| Frigate Beta            | `/addon_configs/ccab4aaf_frigate-beta`    |
| Frigate Beta (完全访问) | `/addon_configs/ccab4aaf_frigate-fa-beta` |

**当你在文档中看到`/config`时，它指的是这个目录。**

例如，如果你正在运行标准插件变体并使用[VS Code 插件](https://github.com/hassio-addons/addon-vscode)浏览文件，你可以点击*文件* > *打开文件夹...*并导航到`/addon_configs/ccab4aaf_frigate`来访问 Frigate 的`/config`目录并编辑`config.yaml`文件。你也可以使用 Frigate UI 中内置的文件编辑器来编辑配置文件。

## VS Code 配置模式

VS Code 支持 JSON 模式来自动验证配置文件。你可以通过在配置文件开头添加`# yaml-language-server: $schema=http://frigate_host:5000/api/config/schema.json`来启用此功能。将`frigate_host`替换为你的 Frigate 服务器的 IP 地址或主机名。如果你同时使用 VS Code 和 Frigate 作为插件，你应该使用`ccab4aaf-frigate`。当从另一台机器上的 VS Code 访问配置时，确保暴露内部未认证端口`5000`。

## 环境变量替换

Frigate 仅在[参考配置](./reference.md)中特别指出的地方支持使用以`FRIGATE_`开头的环境变量。例如，以下值可以在运行时通过使用环境变量替换：

```yaml
mqtt:
  user: '{FRIGATE_MQTT_USER}'
  password: '{FRIGATE_MQTT_PASSWORD}'
```

```yaml
- path: rtsp://{FRIGATE_RTSP_USER}:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:8554/unicast
```

```yaml
onvif:
  host: 10.0.10.10
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

## 常见配置示例

以下是一些常见的入门配置示例。有关所有配置值的详细信息，请参阅[参考配置](./reference.md)。

### 带 USB Coral 的树莓派 Home Assistant 插件

- 单个摄像头，720p，5fps 检测流
- MQTT 连接到 Home Assistant Mosquitto 插件
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
  retain:
    days: 7
    mode: motion
  alerts:
    retain:
      days: 30
  detections:
    retain:
      days: 30

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
  retain:
    days: 7
    mode: motion
  alerts:
    retain:
      days: 30
  detections:
    retain:
      days: 30

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
  retain:
    days: 7
    mode: motion
  alerts:
    retain:
      days: 30
  detections:
    retain:
      days: 30

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
