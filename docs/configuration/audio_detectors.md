---
id: audio_detectors
title: 音频检测器
---


Frigate自带音频检测功能，该功能直接在CPU上运行。相比图像对象检测，音频检测的计算量要小得多，因此完全可以在CPU上高效运行。

## 配置

音频事件通过检测特定类型的音频并创建事件来工作，当该类型音频在配置的时间内未被检测到时，则结束该事件。音频事件会在事件开始时保存快照，并在整个事件过程中保存录音。录音使用配置的录制保留设置进行保留。

### 启用音频事件

可以为所有摄像头或仅特定摄像头启用音频事件。

```yaml
audio: # <- 为所有摄像头启用音频事件
  enabled: True

cameras:
  front_camera:
    ffmpeg:
    ...
    audio:
      enabled: True # <- 可单独为front_camera启用音频事件
```

如果使用多个流，则必须在用于音频检测的流上设置`audio`功能，这可以是任何流，但该流必须包含音频。

:::note

用于捕获音频的ffmpeg进程将与分配给摄像头的其他功能一起建立到摄像头的单独连接，因此建议使用go2rtc重新流式传输来实现此目的。更多信息请参阅[重新流式传输文档](/configuration/restream.md)。

:::

```yaml
cameras:
  front_camera:
    ffmpeg:
      inputs:
        - path: rtsp://.../main_stream
          roles:
            - record
        - path: rtsp://.../sub_stream # <- 此流必须启用音频
          roles:
            - audio
            - detect
```

### 配置最小音量

音频检测器使用音量级别的方式与摄像头画面中的运动用于对象检测的方式相同。这意味着除非音频音量高于配置的水平，否则Frigate不会运行音频检测以减少资源使用。不同摄像头型号的音量水平可能有很大差异，因此进行测试以了解音量水平非常重要。可以使用MQTT浏览器查看音频主题以了解检测到的音量水平。

:::tip

音频被视为**画面变动**录制（`motion`），这意味着当`record -> retain -> mode`设置为`motion`时，任何声音音量小于最小音量（`min_volume`）的时候，该摄像头的录制片段都将被保留。

:::

### 配置音频事件

内置音频模型可以检测[500多种不同类型](https://github.com/blakeblackshear/frigate/blob/dev/audio-labelmap.txt)的音频，其中许多并不实用。默认情况下会开启`bark`(狗叫)、`fire_alarm`(火警)、`scream`(尖叫)、`speech`(说话)和`yell`(喊叫)这几种音频事件，当然你也可以根据自己的需求进行调整。

```yaml
audio:
  enabled: True
  listen:
    - bark
    - fire_alarm
    - scream
    - speech
    - yell
```