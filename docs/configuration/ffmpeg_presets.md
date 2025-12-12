---
id: ffmpeg_presets
title: FFmpeg预设参数
---

Frigate 默认提供了一些 FFmpeg 参数预设，以简化配置流程。所有预设参数可在[此文件](https://github.com/blakeblackshear/frigate/blob/master/frigate/ffmpeg_presets.py)中查看。

### 硬件加速预设 {#hwaccel-presets}

强烈建议在配置中使用硬件加速预设。这些预设不仅能替代冗长的参数，还能让 Frigate 了解可用硬件信息，从而进行其他 GPU 优化（如鸟瞰图转流编码或非原生分辨率缩放）。

详见[硬件加速文档](/configuration/hardware_acceleration_video.md)获取 GPU/iGPU 设置指南。

| 预设名称              | 适用场景              | 注意事项                             |
| --------------------- | --------------------- | ------------------------------------ |
| preset-rpi-64-h264    | 64 位树莓派+h264 流   |                                      |
| preset-rpi-64-h265    | 64 位树莓派+h265 流   |                                      |
| preset-vaapi          | Intel/AMD VAAPI       | 需确保选择正确的驱动程序             |
| preset-intel-qsv-h264 | Intel QSV+h264 流     | 遇到问题建议改用 vaapi 预设          |
| preset-intel-qsv-h265 | Intel QSV+h265 流     | 遇到问题建议改用 vaapi 预设          |
| preset-nvidia         | NVIDIA 显卡           |                                      |
| preset-jetson-h264    | NVIDIA Jetson+h264 流 |                                      |
| preset-jetson-h265    | NVIDIA Jetson+h265 流 |                                      |
| preset-rkmpp          | 瑞芯微 MPP 视频流     | 需使用\*-rk 后缀镜像以及开启特权模式 |

### 输入参数预设 {#input-args-presets}

输入参数预设可提升配置可读性，并针对不同类型的视频流提供最佳兼容性方案。

详见[摄像头特定配置文档](/configuration/camera_specific.md)获取非标摄像头使用建议。

| 预设名称                         | 适用场景            | 注意事项                                 |
| -------------------------------- | ------------------- | ---------------------------------------- |
| preset-http-jpeg-generic         | HTTP 实时 JPEG 流   | 建议改用转流方式处理                     |
| preset-http-mjpeg-generic        | HTTP MJPEG 流       | 建议改用转流方式处理                     |
| preset-http-reolink              | Reolink HTTP-FLV 流 | 仅适用于原生 HTTP 流，不适用于 RTSP 转流 |
| preset-rtmp-generic              | RTMP 流             |                                          |
| preset-rtsp-generic              | RTSP 流             | 未指定时的默认预设                       |
| preset-rtsp-restream             | RTSP 转流源         | 适用于作为 Frigate 输入源的 RTSP 转流    |
| preset-rtsp-restream-low-latency | RTSP 低延迟转流源   | 可降低延迟，但部分摄像头可能不兼容       |
| preset-rtsp-udp                  | UDP 协议 RTSP 流    | 适用于仅支持 UDP 的摄像头                |
| preset-rtsp-blue-iris            | Blue Iris RTSP 流   | 适用于 Blue Iris 视频源                  |

:::warning
使用转流时需特别注意输入参数，不同协议不可混用。`http`和`rtmp`预设不能用于`rtsp`流。例如当使用 Reolink 摄像头的 RTSP 转流作为录制源时，若误用 preset-http-reolink 会导致崩溃。此时需要在流级别单独设置预设，参考以下示例：
:::

```yaml
go2rtc:
  streams:
    reolink_cam: http://192.168.0.139/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=admin&password=password

cameras:
  reolink_cam:
    ffmpeg:
      inputs:
        - path: http://192.168.0.139/flv?port=1935&app=bcs&stream=channel0_ext.bcs&user=admin&password=password
          input_args: preset-http-reolink
          roles:
            - detect
        - path: rtsp://127.0.0.1:8554/reolink_cam
          input_args: preset-rtsp-generic
          roles:
            - record
```

### 输出参数预设 {#output-args-presets}

输出参数预设可优化录制文件的生成逻辑，确保录制内容的一致性。

| 预设方案                         | 用途说明                     | 其他说明                                                                                                                                                     |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| preset-record-generic            | 无音频录制                   | 如果您的摄像头没有音频功能，或者您不想录制音频，请选择此选项                                                                                                 |
| preset-record-generic-audio-copy | 带原始音频录制               | 使用此选项可在录像中保留音频                                                                                                                                 |
| preset-record-generic-audio-aac  | 带转码 AAC 音频录制          | 这是不指定任何选项时的默认设置。使用此选项可将音频转码为 AAC 格式。如果源音频已经是 AAC 格式，请改用 preset-record-generic-audio-copy 以避免不必要的重新编码 |
| preset-record-mjpeg              | 录制 MJPEG 视频流            | 建议改用 MJPEG 视频流转发方式                                                                                                                                |
| preset-record-jpeg               | 录制实时 JPEG 图像           | 建议改用实时 JPEG 图像转发方式                                                                                                                               |
| preset-record-ubiquiti           | 录制带音频的 Ubiquiti 视频流 | 录制包含 Ubiquiti 非标准音频的视频                                                                                                                           |
