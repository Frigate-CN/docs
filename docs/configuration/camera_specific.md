---
id: camera_specific
title: 摄像头品牌特定配置
---

:::note

本页面使用了FFmpeg参数的预设。有关预设的更多信息，请参阅[FFmpeg预设](/configuration/ffmpeg_presets)页面。

:::

:::note

许多摄像头支持影响实时视图体验的编码选项，更多信息请参阅[实时视图](/configuration/live)页面。

:::

## Safari浏览器下的H.265摄像头支持

部分摄像头虽然支持H.265编码，但可能采用不同的封装格式。需注意Safari浏览器仅支持annexb格式的H.265流。当使用H.265摄像头进行录像且需要兼容Safari浏览器设备时，应当启用`apple_compatibility`配置选项。

```yaml
cameras:
  h265_cam: # <------ 这里是你摄像头的名称
    ffmpeg: # [!code highlight]
      apple_compatibility: true # <- 启用MacOS和iPhone设备兼容模式 [!code ++]
```

## MJPEG摄像头

注意MJPEG摄像头需要将视频编码为H264才能用于录制和转流角色。这将比直接支持H264的摄像头消耗更多CPU资源。建议使用转流角色创建H264转流，然后将其作为ffmpeg的输入源。

```yaml
go2rtc:
  streams:
    mjpeg_cam: "ffmpeg:http://your_mjpeg_stream_url#video=h264#hardware" # <- 使用硬件加速创建可用于其他组件的H264流

cameras:
  ...
  mjpeg_cam:
    ffmpeg:
      inputs:
        - path: rtsp://127.0.0.1:8554/mjpeg_cam
          roles:
            - detect
            - record
```

## JPEG流摄像头

使用实时变化JPEG图像的摄像头需要如下输入参数

```yaml
input_args: preset-http-jpeg-generic
```

流输出参数和注意事项与[MJPEG摄像头](#mjpeg摄像头)相同

## RTMP摄像头

RTMP摄像头需要调整输入参数

```yaml
ffmpeg:
  input_args: preset-rtmp-generic
```

## 仅支持UDP的摄像头

如果您的摄像头不支持RTSP的TCP连接，可以使用UDP。

```yaml
ffmpeg:
  input_args: preset-rtsp-udp
```

## 品牌/型号特定设置

### Amcrest & Dahua

Amcrest和Dahua摄像头应使用以下格式通过RTSP连接：

```
rtsp://用户名:密码@摄像头IP/cam/realmonitor?channel=1&subtype=0 # 主码流
rtsp://用户名:密码@摄像头IP/cam/realmonitor?channel=1&subtype=1 # 子码流，通常仅支持低分辨率
rtsp://用户名:密码@摄像头IP/cam/realmonitor?channel=1&subtype=2 # 高端摄像头支持第三码流，中等分辨率(1280x720, 1920x1080)
rtsp://用户名:密码@摄像头IP/cam/realmonitor?channel=1&subtype=3 # 新款高端摄像头支持第四码流，另一中等分辨率(1280x720, 1920x1080)
```

### Annke C800

此摄像头仅支持H.265。要在某些设备(如MacOS或iPhone)上播放片段，需要使用`apple_compatibility`配置调整H.265流。

```yaml
cameras:
  annkec800: # <------ 摄像头名称
    ffmpeg:
      apple_compatibility: true # <- 增加与MacOS和iPhone的兼容性
      output_args:
        record: preset-record-generic-audio-aac

      inputs:
        - path: rtsp://用户名:密码@摄像头IP/H264/ch1/main/av_stream # <----- 根据您的摄像头更新
          roles:
            - detect
            - record
    detect:
      width: # <- 可选，默认Frigate会尝试自动检测分辨率
      height: # <- 可选，默认Frigate会尝试自动检测分辨率
```

### Blue Iris RTSP摄像头

Blue Iris RTSP摄像头需要移除`nobuffer`标志

```yaml
ffmpeg:
  input_args: preset-rtsp-blue-iris
```

### Hikvision摄像头（海康威视）

Hikvision摄像头应使用以下格式通过RTSP连接：

```
rtsp://用户名:密码@摄像头IP/streaming/channels/101 # 主码流
rtsp://用户名:密码@摄像头IP/streaming/channels/102 # 子码流，通常仅支持低分辨率
rtsp://用户名:密码@摄像头IP/streaming/channels/103 # 高端摄像头支持第三码流，中等分辨率(1280x720, 1920x1080)
```

:::note

[部分用户报告](https://www.reddit.com/r/frigate_nvr/comments/1hg4ze7/hikvision_security_settings)新款Hikvision摄像头需要调整安全设置：

```
RTSP认证 - digest/basic
RTSP摘要算法 - MD5
WEB认证 - digest/basic
WEB摘要算法 - MD5
```

:::

### Reolink摄像头（萤石海外版）
Reolink 推出了多款不同型号的摄像头，这些型号在功能支持和行为表现上存在不一致性。下表总结了各种功能特性及使用建议。


| 摄像头分辨率 | 摄像头型号                   | 推荐的视频流类型           | 补充说明                                                        |
|  --------   |  -------------------------- | ------------------------  | --------------------------------------------------------------  |
| 5MP 或更低   | 所有型号                     | http-flv                  | 该流为 h264 编码                                                |
| 6MP 或更高   | 最新一代（例如：Duo3、CX-8##）| 使用 ffmpeg 8.0 的 http-flv，或 rtsp | 此配置采用基于 H265 的新型 http-flv-enhanced 流，需要 ffmpeg 8.0 版本|
| 6MP 或更高   | 较旧型号（例如：RLC-8）      | rtsp                      |                                                                 |


Reolink有旧款摄像头(如410和520)和新款摄像头(如520a和511wa)，支持不同的选项子集。两种情况下都建议使用HTTP流。
Frigate与配置了以下选项的新款Reolink摄像头配合使用效果更好：

如果可用，推荐设置：
- `开启，流畅优先` - 这将摄像头设置为CBR(恒定比特率)
- `帧间空间1x` - 这将I帧间隔设置为与帧率相同

根据[此讨论](https://github.com/blakeblackshear/frigate/issues/3235#issuecomment-1135876973)，HTTP视频流似乎是Reolink最可靠的选择。

通过Reolink NVR连接的摄像头可以使用HTTP流，在流URL中使用`channel[0..15]`表示附加通道。
主码流也可以通过RTSP设置，但并非在所有硬件版本上都可靠。以下示例配置适用于最老的RLN16-410设备和多种类型的摄像头。


```yaml
go2rtc:
  streams:
    your_reolink_camera:
      - "ffmpeg:http://reolink_ip/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=username&password=password#video=copy#audio=copy#audio=opus"
    your_reolink_camera_sub:
      - "ffmpeg:http://reolink_ip/flv?port=1935&app=bcs&stream=channel0_ext.bcs&user=username&password=password"
    your_reolink_camera_via_nvr:
      - "ffmpeg:http://reolink_nvr_ip/flv?port=1935&app=bcs&stream=channel3_main.bcs&user=username&password=password" # 通道号为0-15
      - "ffmpeg:your_reolink_camera_via_nvr#audio=aac"
    your_reolink_camera_via_nvr_sub:
      - "ffmpeg:http://reolink_nvr_ip/flv?port=1935&app=bcs&stream=channel3_ext.bcs&user=username&password=password"

cameras:
  your_reolink_camera:
    ffmpeg:
      inputs:
        - path: rtsp://127.0.0.1:8554/your_reolink_camera
          input_args: preset-rtsp-restream
          roles:
            - record
        - path: rtsp://127.0.0.1:8554/your_reolink_camera_sub
          input_args: preset-rtsp-restream
          roles:
            - detect
  reolink_via_nvr:
    ffmpeg:
      inputs:
        - path: rtsp://127.0.0.1:8554/your_reolink_camera_via_nvr?video=copy&audio=aac
          input_args: preset-rtsp-restream
          roles:
            - record
        - path: rtsp://127.0.0.1:8554/your_reolink_camera_via_nvr_sub?video=copy
          input_args: preset-rtsp-restream
          roles:
            - detect
```

#### Reolink门铃

Reolink门铃支持通过go2rtc和其他应用实现双向音频。重要的是为了稳定性仍要使用http-flv流，可以添加一个仅用于双向音频的辅助RTSP流。

确保在摄像头的高级网络设置中启用了HTTP。要使用Frigate的双向通话功能，请参阅[实时视图文档](../configuration/live#two-way-talk)。

```yaml
go2rtc:
  streams:
    your_reolink_doorbell:
      - "ffmpeg:http://reolink_ip/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=username&password=password#video=copy#audio=copy#audio=opus"
      - rtsp://username:password@reolink_ip/Preview_01_sub
    your_reolink_doorbell_sub:
      - "ffmpeg:http://reolink_ip/flv?port=1935&app=bcs&stream=channel0_ext.bcs&user=username&password=password"
```

### Unifi Protect摄像头

Unifi Protect摄像头需要使用rtspx流与go2rtc配合。
要使用Unifi Protect摄像头，将rtsps链接修改为以rtspx开头。
此外，从Unifi链接末尾移除"?enableSrtp"。

```yaml
go2rtc:
  streams:
    front:
      - rtspx://192.168.1.1:7441/abcdefghijk
```

[更多信息请参阅go2rtc文档](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#source-rtsp)

在Unifi 2.0更新中，Unifi Protect摄像头的音频采样率发生了变化，导致ffmpeg出现问题。如果直接与Unifi Protect配合使用，需要为录制设置输入采样率。

```yaml
ffmpeg:
  output_args:
    record: preset-record-ubiquiti
```

### TP-Link VIGI摄像头

TP-Link VIGI摄像头需要调整主码流设置以避免问题。需要将流配置为`H264`，并将`智能编码`设置为`关闭`。没有这些设置，在尝试观看录制片段时可能会出现问题。例如Firefox会在播放几秒后停止并显示以下错误信息：`媒体播放因损坏问题或媒体使用了浏览器不支持的功能而中止。`。


## USB摄像头（也叫网络摄像头）
若要在Frigate中使用USB摄像头（网络摄像头），建议通过go2rtc的[FFmpeg设备功能](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#source-ffmpeg-device)来实现支持：

- Frigate以外的准备工作：
  - 获取USB摄像头设备路径。在宿主机上运行 `v4l2-ctl --list-devices` 命令查看本地连接的摄像头列表（可能需要根据你的Linux发行版安装`v4l-utils`工具包）。下文示例配置中，我们使用`video=0`来对应检测到的设备路径 `/dev/video0`
  - 查询USB摄像头支持的格式与分辨率。运行 `ffmpeg -f v4l2 -list_formats all -i /dev/video0` 命令获取摄像头支持的编码格式及分辨率列表。下文示例配置基于查询结果，在视频流和检测设置中采用1024×576的分辨率。
  - 若在容器环境（如TrueNAS上的Docker）中使用Frigate，需确保已启用USB透传功能，并在配置中明确指定主机设备（`/dev/video0`）与容器设备（`/dev/video0`）的映射关系
- 在Frigate配置文件中，按需添加go2rtc流媒体配置及功能：

```yaml
go2rtc: # [!code ++]
  streams: # [!code ++]
    usb_camera: # 视频流名称，可自行设置，需要与cameras中配置名称保持一致 [!code ++]
      - "ffmpeg:device?video=0&video_size=1024x576#video=h264" # [!code ++]

cameras:
  usb_camera: # 摄像头名称，与go2rtc中配置名称保持一致 [!code highlight]
    enabled: true
    ffmpeg:
      inputs:
        - path: rtsp://127.0.0.1:8554/usb_camera # usb_camera为go2rtc中配置的视频流名称 [!code ++]
          input_args: preset-rtsp-restream # [!code ++]
          roles:
            - detect
            - record
    detect:
      enabled: false # <---- 在正常获得摄像头视频流之前，先暂时禁用检测功能，正常后再改为true [!code warning]
      width: 1024
      height: 576
```