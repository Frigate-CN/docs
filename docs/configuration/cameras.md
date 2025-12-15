---
id: cameras
title: 摄像头配置
---

## 设置摄像头输入源

可以为每个摄像头配置多个输入源，并根据需求混合搭配每个输入源的功能。这样你可以使用低分辨率视频流进行物体检测，同时使用高分辨率视频流进行录像，反之亦然。

默认情况下摄像头是启用的，但可以通过设置`enabled: False`来禁用。通过配置文件禁用的摄像头不会出现在 Frigate 用户界面中，也不会消耗系统资源。

每个功能在每个摄像头中只能分配给一个输入源。可用的功能选项如下：

| 功能     | 描述                                                |
| -------- | --------------------------------------------------- |
| `detect` | 用于物体检测的主视频流。[文档](object_detectors.md) |
| `record` | 根据配置设置保存视频片段。[文档](record.md)         |
| `audio`  | 用于基于音频的检测。[文档](audio_detectors.md)      |

```yaml
mqtt:
  host: mqtt.server.com
cameras: # [!code highlight]
  back: # <- back为示例摄像头名称，改为你需要的名称，暂时只支持英文数字和下划线 [!code ++]
    enabled: True # [!code ++]
    ffmpeg: # [!code ++]
      inputs: # [!code ++]
        # 摄像头rtsp流地址可查阅摄像头文档或互联网其他人分享的教程，下面的地址仅为范例
        # 可以考虑使用go2rtc，请参考文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 # [!code ++]
          roles: # [!code ++]
            - detect # <- 用于目标/物体检测 [!code ++]
        # 可以设置不同的流用于不同功能，例如上面的流为子码流，节省带宽，适合检测，能够降低检测器负担
        # 而下方的主码流画面清晰，适合录制
        # 可以考虑使用go2rtc，请参考文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/live # [!code ++]
          roles: # [!code ++]
            - record # <- 用于录像的视频流 [!code ++]
    detect: # [!code highlight]
      width: 1280 # <- 可选，默认Frigate会尝试自动检测分辨率 [!code highlight]
      height: 720 # <- 可选，默认Frigate会尝试自动检测分辨率 [!code highlight]
```

:::tip

如果你希望实时监控能够有声音并且画面更流畅，可以考虑配置[go2rtc](../guides/configuring_go2rtc)，并让摄像头的`path`使用 go2rtc 的[视频转流](../configuration/restream#reduce-connections-to-camera)地址。

:::

接下来你只需在配置文件的`cameras`条目下按照上面的例子**添加更多摄像头**即可。

```yaml
mqtt: ...
cameras:
  back: ...
  front: ...
  side: ...
# 上面的back、front、side均为不同的摄像头名字，后面的省略号为文档省略的内容，根据实际情况添加
```

:::note

如果你摄像头下只有一个视频流输入（`input`）且没有为其配置检测（`detect`）功能，Frigate 也会自动启动检测（`detect`）功能。即使你在配置中`detect`设置`enabled: False`禁用了物体/目标检测，Frigate **仍会解码视频流**以支持画面变动检测、鸟瞰图、API 图像和其他功能。

如果你打算 Frigate 只是拿来录像不进行物体/目标识别，仍建议设置一个低分辨率视频流并设置该视频流使用检测（`detect`）功能，以减少所需视频流解码的资源消耗。

:::

关于特定摄像头型号的设置，请查看[摄像头特定](camera_specific.md)信息。

## 设置摄像头 PTZ 控制

:::warning

并非所有 PTZ 摄像头都支持 ONVIF，这是 Frigate 用来与你的摄像头通信的标准协议。部分摄像头可能使用私有协议来进行控制，Frigate 不支持该方式。请检查[官方 ONVIF 兼容产品列表](https://www.onvif.org/conformant-products/)、你的摄像头文档或制造商网站，以确保你的 PTZ 支持 ONVIF。同时，请确保你的摄像头运行最新的固件。

:::

在配置文件的摄像头部分添加 onvif 配置：

```yaml
cameras:
  back: # <- 为名为back的摄像头配置ONVIF
    ffmpeg: ... # 省略号为文档省略部分，不代表后面没内容
    onvif: # [!code ++]
      host: 10.0.10.10 # [!code ++]
      port: 8000 # [!code ++]
      user: admin # [!code ++]
      password: password # [!code ++]
```

如果 ONVIF 连接成功，PTZ 控制将在摄像头的 Web 界面中可用。

:::tip

如果你的 ONVIF 摄像头不需要认证凭据，你可能仍需要为`user`和`password`指定空字符串，例如：`user: ""`和`password: ""`。

需要注意的是，Frigate 只会使用 `ONVIF` 的 `PTZ控制`功能，如果需要使用 ONVIF 的视频流，请使用 go2rtc 进行转流。

:::

支持视野(FOV)内相对移动的 ONVIF 摄像头还可以配置为自动追踪移动物体并将其保持在画面中央。关于自动追踪的设置，请参阅[自动追踪](autotracking.md)文档。

## ONVIF PTZ 摄像头推荐

以下工作与非工作 PTZ 摄像头列表基于用户反馈。如果你想反馈某厂商或某款摄像头存在的特定特性或问题，且这些问题对其他用户会有帮助，你可以发起一个拉取请求（pull request），将这些信息添加到此列表中。

在 [ONVIF 兼容产品数据库](https://www.onvif.org/conformant-products/)的 FeatureList（功能列表）​ 中，可以初步判断某款摄像头是否兼容 Frigate 的自动追踪功能。请查看该摄像头是否列出了 `PTZRelative`、`PTZRelativePanTilt`以及`PTZRelativeZoom`这些功能项。这些功能是实现自动追踪所必需的。不过需要注意的是，有些摄像头虽然声称支持，实际仍可能无法正常响应。如果这些功能项缺失，自动追踪功能将无法使用（不过网页界面中的基本云台变焦控制功能或许仍能使用）。除非下文确认某款摄像头能用，否则请避免选用数据库中没有相关条目的摄像头。

| 品牌或具体型号               | PTZ 控制 | 自动追踪 | 备注                                                                                                                                                                                                                       |
| ---------------------------- | :------: | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Amcrest                      |    ✅    |    ✅    | ⛔️ 一般来说 Amcrest 应该可以工作，但一些旧型号(如常见的 IP2M-841)不支持自动追踪                                                                                                                                           |
| Amcrest ASH21                |    ✅    |    ❌    | ONVIF 服务端口: 80                                                                                                                                                                                                         |
| Amcrest IP4M-S2112EW-AI      |    ✅    |    ❌    | 不支持 FOV 相对移动。                                                                                                                                                                                                      |
| Amcrest IP5M-1190EW          |    ✅    |    ❌    | ONVIF 端口: 80。不支持 FOV 相对移动。                                                                                                                                                                                      |
| Annke CZ504                  |    ✅    |    ✅    | 安克（Annke）官方支持提供了专用固件版本（[V5.7.1 build 250227](https://github.com/pierrepinon/annke_cz504/raw/refs/heads/main/digicap_V5-7-1_build_250227.dav)）以修复 ONVIF 协议中"TranslationSpaceFov"参数的兼容性问题。 |
| Axis Q-6155E                 |    ✅    |    ❌    | ONVIF 服务端口：80；该摄像机不支持 MoveStatus 功能。                                                                                                                                                                       |
| Ctronics PTZ                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua                        |    ✅    |    ✅    | 据用户反馈，部分低端大华摄像头（尤其是 Lite 系列等入门机型）存在 ​​ 不支持自动追踪功能 ​​ 的情况。                                                                                                                         |
| Dahua DH-SD2A500HB           |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua DH-SD49825GB-HNR       |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Dahua DH-P5AE-PV             |    ❌    |    ❌    |                                                                                                                                                                                                                            |
| Foscam R5                    |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hanwha XNP-6550RH            |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hikvision                    |    ✅    |    ❌    | ONVIF 支持不完整(即使是最新固件 MoveStatus 也不会更新) - 在 HWP-N4215IH-DE 和 DS-2DE3304W-DE 型号上报告，但可能还有其他型号                                                                                                |
| Hikvision DS-2DE3A404IWG-E/W |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Reolink                      |    ✅    |    ❌    |                                                                                                                                                                                                                            |     |
| Speco O8P32X                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Sunba 405-D20X               |    ✅    |    ❌    | 原始型号和 4k 型号报告 ONVIF 支持不完整。怀疑所有型号都不兼容。                                                                                                                                                            |
| Tapo                         |    ✅    |    ❌    | 支持多种型号，ONVIF 服务端口: 2020                                                                                                                                                                                         |
| Uniview IPC672LR-AX4DUPK     |    ✅    |    ❌    | 固件声称支持 FOV 相对移动，但在发送 ONVIF 命令时摄像头实际上不会移动                                                                                                                                                       |
| Uniview IPC6612SR-X33-VG     |    ✅    |    ✅    | 保持`calibrate_on_startup`为`False`。有用户报告使用`absolute`缩放是有效的。                                                                                                                                                |
| Vikylin PTZ-2804X-I2         |    ❌    |    ❌    | ONVIF 支持不完整                                                                                                                                                                                                           |

## 设置摄像头分组

:::tip

建议直接在页面上设置摄像头分组。

:::

摄像头可以分组并分配名称和图标，这样可以一起查看和筛选。始终会有一个包含所有摄像头的默认分组。

```yaml
camera_groups:
  front: # <- 分组名称，暂时只支持英文数字和下划线
    cameras:
      - driveway_cam # <- 摄像头名称
      - garage_cam # <- 摄像头名称
    icon: LuCar
    order: 0
```

## 双向通话

更多信息请查看[向导](./live.md#two-way-talk)
