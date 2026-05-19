---
id: profiles
title: 配置模板
---

配置模板允许你定义命名的摄像头配置覆盖集合，可以在运行时激活和停用，无需重启 Frigate。这对于在"在家"和"外出"模式之间切换、白天和夜间配置或任何需要快速更改多个摄像头行为的场景非常有用。

## 配置模板的工作原理 {#how-profiles-work}

配置模板作为两级系统运行：

1. **模板定义**在配置的顶层 `profiles` 下声明。每个定义有一个机器名称（键）和一个用于界面显示的 `friendly_name`。
2. **摄像头模板覆盖**在每个摄像头的 `profiles` 部分下声明，以模板名称为键。只需指定要更改的设置，其他设置继承摄像头的基础配置。

当激活模板时，Frigate 将每个摄像头的模板覆盖合并到其基础配置之上。当停用模板时，所有摄像头恢复到原始设置。同一时间只能激活一个模板。

:::info

模板变更在内存中应用并立即生效——无需重启。活动模板会在 Frigate 重启后保持（存储在 `/config/.profiles` 文件中）。

:::

## 配置 {#configuration}

### 创建和管理模板 {#creating-and-managing-profiles}

首先在 Frigate 配置的顶层定义模板。摄像头引用的每个模板名称必须在此定义。

```yaml
profiles:
  home:
    friendly_name: Home
  away:
    friendly_name: Away
  night:
    friendly_name: Night Mode
```

在每个摄像头下添加 `profiles` 部分，为每个模板设置覆盖项。只需包含要更改的设置。

```yaml
cameras:
  front_door:
    ffmpeg:
      inputs:
        - path: rtsp://camera:554/stream
          roles:
            - detect
            - record
    detect:
      enabled: true
    record:
      enabled: true
    profiles:
      away:
        detect:
          enabled: true
        notifications:
          enabled: true
        objects:
          track:
            - person
            - car
            - package
        review:
          alerts:
            labels:
              - person
              - car
              - package
      home:
        detect:
          enabled: true
        notifications:
          enabled: false
        objects:
          track:
            - person
```

### 支持覆盖的配置项 {#supported-override-sections}

以下摄像头配置部分可以在模板中覆盖：

| 配置项             | 描述                                 |
| ------------------ | ------------------------------------ |
| `enabled`          | 完全启用或禁用摄像头                 |
| `audio`            | 音频检测设置                         |
| `birdseye`         | 鸟瞰图设置                           |
| `detect`           | 目标检测设置                         |
| `face_recognition` | 人脸识别设置                         |
| `lpr`              | 车牌识别设置                         |
| `motion`           | 画面变动检测设置                     |
| `notifications`    | 通知设置                             |
| `objects`          | 目标追踪和过滤设置                   |
| `record`           | 录制设置                             |
| `review`           | 核查警报和检测设置                   |
| `snapshots`        | 快照设置                             |
| `zones`            | 区域定义（与基础区域合并）           |

:::note

只有你在模板覆盖中明确设置的字段才会被应用，其他字段保留基础配置值。对于遮罩和区域，模板区域**覆盖**摄像头的基础遮罩和区域。如果通过 YAML 配置模板，不应在模板中定义基础配置中未定义的遮罩或区域。

:::

## 激活模板 {#activating-profiles}

可以从 Frigate 界面激活和停用模板。打开设置齿轮，从子菜单中选择**配置模板**查看所有已定义的模板。你可以激活任何模板或停用当前模板。活动模板会在界面中显示，让你始终知道当前生效的是哪个模板。

## 示例：在家 / 外出设置 {#example-home--away-setup}

常见的用例是根据你在家还是外出设置不同的检测和通知配置。以下示例适用于具有两个摄像头 `front_door` 和 `indoor_cam` 的系统。

```yaml
profiles:
  home:
    friendly_name: Home
  away:
    friendly_name: Away

cameras:
  front_door:
    ffmpeg:
      inputs:
        - path: rtsp://camera:554/stream
          roles:
            - detect
            - record
    detect:
      enabled: true
    record:
      enabled: true
    notifications:
      enabled: false
    profiles:
      away:
        notifications:
          enabled: true
        review:
          alerts:
            labels:
              - person
              - car
      home:
        notifications:
          enabled: false

  indoor_cam:
    ffmpeg:
      inputs:
        - path: rtsp://camera:554/indoor
          roles:
            - detect
            - record
    detect:
      enabled: false
    record:
      enabled: false
    profiles:
      away:
        enabled: true
        detect:
          enabled: true
        record:
          enabled: true
      home:
        enabled: false
```

在此示例中：

- **外出模板**：前门摄像头启用通知并追踪特定警报标签。室内摄像头完全启用检测和录制。
- **在家模板**：前门摄像头禁用通知。室内摄像头为保护隐私完全禁用。
- **无活动模板**：所有摄像头使用其基础配置值。
