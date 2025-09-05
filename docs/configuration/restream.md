---
id: restream
title: 转流功能
---

## RTSP转流 {#rtsp}

Frigate可以将您的视频流重新以RTSP协议流式转发传输，供其他应用程序（如Home Assistant）使用，地址为`rtsp://<frigate_host>:8554/<camera_name>`。必须开放转发容器内`8554`端口。[这样您就可以同时使用一个视频流进行Frigate检测和Home Assistant实时查看，而无需与摄像头建立两个独立连接](#reduce-connections-to-camera)。视频流将直接从原始视频流复制，避免重新编码。此流不包含Frigate的任何标注。

Frigate使用[go2rtc](https://github.com/AlexxIT/go2rtc/tree/v1.9.9)提供转流和MSE/WebRTC功能。go2rtc配置位于配置文件的`go2rtc`部分，更多高级配置和功能请参阅[go2rtc文档](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#configuration)。

:::note

您可以通过`/api/go2rtc/streams`访问go2rtc流信息，这对调试很有帮助，也能提供有关摄像头流的有用信息。

:::

### 鸟瞰图转流 {#birdseye-restream}

鸟瞰图RTSP转流可通过`rtsp://<frigate_host>:8554/birdseye`访问。启用鸟瞰图转流将使鸟瞰图24/7运行，这可能会略微增加CPU使用率。

```yaml
birdseye:
  restream: True
```

### 使用认证保护转流 {#securing-restream-with-authentication}

go2rtc转流可以通过设置RTSP的用户名/密码认证进行保护。例如：

```yaml
go2rtc:
  rtsp:
    username: "admin"
    password: "pass"
  streams: ...
```

:::warning

即使设置了go2rtc的RTSP流权限，使用通过Frigate访问自己的go2rtc转流的时候，也无需提供账号密码进行鉴权。

:::

## 减少摄像头连接数 {#reduce-connections-to-camera}

某些摄像头仅支持一个视频流（即只能有一个设备可以访问摄像头）连接，亦或者你希望减少与摄像头不必要的连接数，RTSP转流功能能很好的解决你的问题。

### 单流配置 {#with-single-stream}

与摄像头建立一个连接。一个用于转流，`detect`和`record`连接到转流。

```yaml
go2rtc:
  streams:
    name_your_rtsp_cam: # <- 你的RTSP流名称，修改为你自己希望的摄像头名称，只支持英文数字下划线和连接符
      - rtsp://192.168.1.5:554/live0 # <- 支持视频和AAC音频的流
      - "ffmpeg:name_your_rtsp_cam#audio=opus" # <- 将音频转码为缺失编解码器(通常是opus)的视频流副本
    name_your_http_cam: # <- 其他类型的视频流，例如http
      - http://192.168.50.155/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=user&password=password # <- 支持视频和AAC音频的流
      - "ffmpeg:name_your_http_cam#audio=opus" # <- 将音频转码为缺失编解码器(通常是opus)的视频流副本

cameras:
  name_your_rtsp_cam: # <- 摄像头名称和go2rtc上的视频流名称尽可能一致
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-copy
      inputs:
        - path: rtsp://127.0.0.1:8554/name_your_rtsp_cam # <--- 注意！这里的名称（name_your_rtsp_cam）必须与上面转流中设置的视频流名称一致！记得修改
          input_args: preset-rtsp-restream
          roles:
            - record
            - detect
            - audio # <- 仅在启用音频检测时需要
  name_your_http_cam:
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-copy
      inputs:
        - path: rtsp://127.0.0.1:8554/name_your_http_cam # <--- 注意！这里的名称（name_your_http_cam）必须与上面转流中设置的摄像头名称一致！记得修改
          input_args: preset-rtsp-restream
          roles:
            - record
            - detect
            - audio # <- 仅在启用音频检测时需要
```

### 有子流情况下的配置 {#with-sub-stream}

与摄像头建立两个连接。一个用于子流，一个用于转流，`record`连接到转流。

```yaml
go2rtc:
  streams:
    name_your_rtsp_cam:
      - rtsp://192.168.1.5:554/live0 # <- 支持视频和AAC音频的流。仅适用于RTSP流，HTTP必须使用ffmpeg
      - "ffmpeg:name_your_rtsp_cam#audio=opus" # <- 将音频转码为opus的流副本
    name_your_rtsp_cam_sub:
      - rtsp://192.168.1.5:554/substream # <- 支持视频和AAC音频的流。仅适用于RTSP流，HTTP必须使用ffmpeg
      - "ffmpeg:name_your_rtsp_cam_sub#audio=opus" # <- 将音频转码为opus的流副本
    name_your_http_cam:
      - http://192.168.50.155/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=user&password=password # <- 支持视频和AAC音频的流。仅适用于RTSP流，HTTP必须使用ffmpeg
      - "ffmpeg:name_your_http_cam#audio=opus" # <- 将音频转码为opus的流副本
    name_your_http_cam_sub:
      - http://192.168.50.155/flv?port=1935&app=bcs&stream=channel0_ext.bcs&user=user&password=password # <- 支持视频和AAC音频的流。仅适用于RTSP流，HTTP必须使用ffmpeg
      - "ffmpeg:name_your_http_cam_sub#audio=opus" # <- 将音频转码为opus的流副本

cameras:
  name_your_rtsp_cam:
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-copy
      inputs:
        - path: rtsp://127.0.0.1:8554/name_your_rtsp_cam # <--- 这里的名称必须与转流中的摄像头名称匹配
          input_args: preset-rtsp-restream
          roles:
            - record
        - path: rtsp://127.0.0.1:8554/name_your_rtsp_cam_sub # <--- 这里的名称必须与转流中的camera_sub名称匹配
          input_args: preset-rtsp-restream
          roles:
            - audio # <- 仅在启用音频检测时需要
            - detect
  name_your_http_cam:
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-copy
      inputs:
        - path: rtsp://127.0.0.1:8554/name_your_http_cam # <--- 这里的名称必须与转流中的摄像头名称匹配
          input_args: preset-rtsp-restream
          roles:
            - record
        - path: rtsp://127.0.0.1:8554/name_your_http_cam_sub # <--- 这里的名称必须与转流中的camera_sub名称匹配
          input_args: preset-rtsp-restream
          roles:
            - audio # <- 仅在启用音频检测时需要
            - detect
```

## 处理复杂密码（例如带特殊符号） {#handling-complex-passwords}

如果你的摄像头密码里有特殊符号，需要对**密码**进行URL编码才能正常识别。可以使用[urlencoder.org](https://urlencoder.org)进行编码。

:::warning
注意，只需要对用户名或者密码进行编码！不要把地址直接复制过去进行编码！
:::

例如：

```yaml
go2rtc:
  streams:
    my_camera: rtsp://username:$@foo%@192.168.1.100 # <- 假设你的密码是$@foo%，由于URL里@符号有其他用途，会导致这个地址无效
```

编码后变为：

```yaml
go2rtc:
  streams:
    my_camera: rtsp://username:$%40foo%25@192.168.1.100  # <- 经过url编码后，会将@符号转换为%40，%符号转为%25
```

更多信息请参阅[此评论](https://github.com/AlexxIT/go2rtc/issues/1217#issuecomment-2242296489)。

## 高级转流配置 {#advanced-restream-configurations}

go2rtc中的[exec](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#source-exec)源可用于自定义ffmpeg命令。示例如下：

注意：output需要使用两个花括号传递，如<code v-pre>{{output}}</code>

```yaml
go2rtc:
  streams:
    stream1: exec:ffmpeg -hide_banner -re -stream_loop -1 -i /media/BigBuckBunny.mp4 -c copy -rtsp_transport tcp -f rtsp {{output}}
```