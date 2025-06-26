---
id: gpu
title: GPU故障排除
---

## OpenVINO

### 无法获取 `OPTIMIZATION_CAPABILITIES` 属性，因为未找到支持的设备。

一些用户报告在使用Intel集成显卡（iGPU）和OpenVINO时遇到问题，其中GPU无法被检测到。这个错误可能由多种问题引起，因此确保配置正确设置非常重要。用户提到的一些解决方案：

- 在某些情况下，用户注意到需要将HDMI虚拟插头插入主板的HDMI端口。
- 当混合使用Intel集成显卡和Nvidia显卡时，设备可能会在`/dev/dri/renderD128`和`/dev/dri/renderD129`之间混淆，因此确认正确的设备很重要，或者将整个`/dev/dri`目录映射到Frigate容器中。