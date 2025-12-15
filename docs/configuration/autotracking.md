---
id: autotracking
title: 摄像头自动追踪
---

支持 ONVIF 协议且具备 PTZ(云台变焦)功能的摄像头，如果支持视野(FOV)内相对移动，可以配置为自动追踪移动目标并将其保持在画面中央。

:::video
/img/frigate-autotracking-example.mp4
:::

自动追踪示例(含变焦)

## 自动追踪行为

当 Frigate 确认目标不是误报且已进入指定区域后，自动追踪器会移动 PTZ 摄像头将目标保持在画面中央，直到目标移出画面、PTZ 无法继续移动或 Frigate 丢失追踪目标。

丢失追踪后，Frigate 会在目标消失区域扫描`timeout`秒。如果发现同类型目标，Frigate 会继续追踪该新目标。

追踪结束后，摄像头会返回配置中`return_preset`指定的预设位置。

## 检查 ONVIF 摄像头支持

Frigate 自动追踪功能需要 PTZ 摄像头支持视野内相对移动(符合[ONVIF 规范](https://www.onvif.org/specs/srv/ptz/ONVIF-PTZ-Service-Spec-v1712.pdf)中的`RelativePanTiltTranslationSpace`和`TranslationSpaceFov`条目)。

许多廉价或老旧 PTZ 可能不支持此标准。如果您的 PTZ 不支持，Frigate 会在日志中报告错误并禁用自动追踪功能。

在 [ONVIF 兼容产品数据库](https://www.onvif.org/conformant-products/)的 FeatureList（功能列表）​ 中，可以初步判断某款摄像头是否兼容 Frigate 的自动跟踪功能。请查看该摄像头是否列出了 `PTZRelative`、`PTZRelativePanTilt`以及`PTZRelativeZoom`这些功能项。这些功能是实现自动跟踪所必需的。不过需要注意的是，有些摄像头虽然声称支持，实际仍可能无法正常响应。

你可以在[这里](cameras.md)查看用户反馈的支持 Frigate 自动追踪的摄像头品牌和型号列表。

## 配置方法

首先在摄像头固件中设置 PTZ 预设位置并命名。如果不确定如何操作，请参考摄像头厂商的固件文档。常见品牌教程：[Amcrest](https://www.youtube.com/watch?v=lJlE9-krmrM)、[Reolink](https://www.youtube.com/watch?v=VAnxHUY5i5w)、[Dahua](https://www.youtube.com/watch?v=7sNbc5U-k54)。

编辑 Frigate 配置文件，填写摄像头的 ONVIF 参数。指定要追踪的目标类型、触发自动追踪的必需区域，以及追踪结束后返回的预设位置名称。可选配置追踪结束前的延迟时间(秒)。

自动追踪功能需要[ONVIF 连接](cameras.md)。建议为摄像头时间戳和任何叠加文本设置[画面变动遮罩](masks.md)，确保摄像头移动时这些区域完全排除在场景变化计算之外。

注意`autotracking`默认禁用，可通过配置文件或 MQTT 启用。

```yaml
cameras:
  ptzcamera:
    ...
    onvif:
      # 必填: 摄像头主机地址
      # 注意: 默认使用HTTP协议；如需HTTPS需明确指定，如："https://0.0.0.0"
      host: 0.0.0.0
      # 可选: ONVIF端口(默认如下)
      port: 8000
      # 可选: 登录用户名
      # 注意: 部分设备需要管理员权限访问ONVIF
      user: admin
      # 可选: 登录密码
      password: admin
      # 可选: 跳过ONVIF服务器的TLS验证(默认如下)
      tls_insecure: False
      # 可选: PTZ摄像头自动追踪功能
      # 通过移动PTZ摄像头将移动目标保持在画面中央
      autotracking:
        # 可选: 启用/禁用目标自动追踪(默认如下)
        enabled: False
        # 可选: 启动时校准摄像头(默认如下)
        # 校准会分步移动PTZ并测量移动时间
        # 结果用于帮助估算摄像头移动后追踪目标的位置
        # 校准完成后Frigate会自动更新配置文件
        # 添加摄像头的"movement_weights"参数，之后应将calibrate_on_startup设为False
        calibrate_on_startup: False
        # 可选: 自动追踪时的变焦模式(默认如下)
        # 可用选项: disabled, absolute, relative
        #   disabled - 仅平移/倾斜，不变焦
        #   absolute - 使用绝对变焦(多数PTZ摄像头支持)
        #   relative - 使用相对变焦(非所有PTZ支持，但可实现同步平移/倾斜/变焦)
        zooming: disabled
        # 可选: 改变自动追踪目标变焦行为的参数(默认如下)
        # 较低值会在追踪目标周围保留更多场景
        # 较高值会更大程度放大追踪目标，但可能更快丢失追踪
        # 值应在0.1到0.75之间
        zoom_factor: 0.3
        # 可选: 要追踪的目标列表(来自labelmap.txt)(默认如下)
        track:
          - person
        # 必填: 当目标进入以下任一区域时开始自动追踪
        required_zones:
          - zone_name
        # 必填: 追踪结束后返回的ONVIF预设位置名称(默认如下)
        return_preset: home
        # 可选: 返回预设位置前的延迟秒数(默认如下)
        timeout: 10
        # 可选: 摄像头校准自动生成的值，请勿手动修改(默认如下)
        movement_weights: []
```

## 校准流程

PTZ 电机运行速度各不相同。执行校准会让 Frigate 测量各种移动的速度，用这些测量值更好地预测保持自动追踪目标在画面中央所需的移动量。

校准是可选的，但能极大帮助 Frigate 追踪在摄像头视野中快速移动的目标。

开始校准：将摄像头配置中的`calibrate_on_startup`设为`True`并重启 Frigate。Frigate 会让摄像头进行一系列小幅和大幅移动。校准过程中请勿手动移动 PTZ。完成后，摄像头移动将停止，配置文件会自动更新`movement_weights`参数用于移动计算。请勿手动修改此参数。

校准结束后，PTZ 会移动到`return_preset`指定的预设位置。

:::note

校准过程中 Frigate 网页界面和其他摄像头将无响应。这是正常现象，以避免校准时产生过多网络流量或 CPU 使用。大多数 PTZ 校准约需两分钟。Frigate 日志会显示校准进度和任何错误。

:::

此时 Frigate 会继续运行，并在 PTZ 自动追踪移动时不断获取测量值，自动更新配置文件中的`movement_weights`参数。

重启 Frigate 前，应将配置文件中的`calibrate_on_startup`设为`False`，否则您优化后的`movement_weights`会被覆盖，再次启动时会重新校准。

如需重新校准，可删除`movement_weights`参数，将`calibrate_on_startup`设为`True`后重启 Frigate。如果自动追踪不稳定，可能需要重新校准或完全删除配置中的`movement_weights`。如果更改了`return_preset`或摄像头的检测`fps`值，也建议重新校准。

如果初始校准时禁用变焦，之后启用变焦，也应重新校准。

## 最佳实践与注意事项

每款 PTZ 摄像头都不同，自动追踪可能无法在所有情况下理想工作。此实验性功能最初基于 EmpireTech/Dahua SD1A404XB-GNR 开发。

Frigate 中的目标追踪器会估算 PTZ 移动，在摄像头移动时保持追踪目标。大多数情况下 5fps 足够，但如需追踪更快移动的目标，可适当提高帧率。过高帧率(>10fps)会拖慢 Frigate 和运动估算器，可能导致丢帧，特别是使用实验性变焦功能时。

建议使用较快的[检测器](object_detectors.md)。CPU 检测器性能不佳或完全无法工作。可通过 Frigate 的调试视图查看当前自动追踪目标周围较厚的彩色边框。

![自动追踪调试视图](/img/autotracking-debug.gif)

不建议在`required_zones`中使用全画面区域，特别是摄像头已校准且配置中包含`movement_weights`时。Frigate 会持续追踪已进入`required_zones`的目标，即使它移出该区域。

部分用户发现调整区域`inertia`值有帮助。详见[配置参考](index.md)。

## 变焦功能

变焦是非常实验性的功能，追踪目标时可能比仅平移/倾斜消耗更多 CPU 资源。

绝对变焦使变焦移动独立于平移/倾斜移动。多数 PTZ 摄像头支持绝对变焦。绝对变焦设计保守，以适应各种摄像头和场景。绝对变焦通常只在目标停止或缓慢移动时进行。

相对变焦尝试在平移/倾斜移动同时进行变焦。测试适用于部分 Dahua 和 Amcrest PTZ。但 ONVIF 规范指出，使用相对变焦时，通用变焦范围如何映射到放大倍数、视野或其他物理变焦尺寸没有标准。如果相对变焦行为不稳定或无效，请尝试绝对变焦。

可在配置文件中调整摄像头的`zoom_factor`参数。较低值会在追踪目标周围保留更多场景空间，较高值会让摄像头更大程度放大目标。但请注意，Frigate 需要追踪目标边界框外足够多的像素和场景细节来估算摄像头移动。如果目标占据画面过大，Frigate 将无法估算摄像头移动而丢失目标。

此参数范围 0.1 到 0.75。默认值 0.3 较为保守，适合多数用户。由于每款 PTZ 和场景不同，您应实验确定最佳值。

## 应用场景

安防监控中，常将"观察"摄像头与 PTZ 配合使用。当固定观察摄像头检测到目标时，可通过 Home Assistant 等自动化平台将 PTZ 移动到特定预设位置，使 Frigate 开始自动追踪。例如：住宅东西两侧安装固定摄像头监控街道，当西侧观察摄像头检测到人员时，Home Assistant 自动化可将 PTZ 转向西方预设位置。目标进入指定区域后，Frigate 自动追踪器可继续追踪离开固定摄像头视野的人员。

## 故障排除与常见问题

### 自动追踪丢失目标，为什么？

可能原因很多。如果使用实验性变焦，`zoom_factor`值可能过高、目标移动过快、场景太暗、场景细节不足(如 PTZ 俯视单调背景的车道，缺乏足够边缘或角落)或场景不理想导致 Frigate 难以维持追踪。

摄像头快门速度可能设置过低导致运动模糊。检查摄像头固件能否提高快门速度。

查看 Frigate 调试视图有助于确定原因。自动追踪目标会有较厚的彩色边框。

### 日志显示摄像头"仍处于 ONVIF'MOVING'状态"错误，什么意思？

两个已知原因(可能还有其他未知原因)：PTZ 电机过慢或摄像头固件有 bug。Frigate 使用摄像头提供的 ONVIF 参数`MoveStatus`判断 PTZ 电机移动或空闲状态。据部分用户反馈，Hikvision PTZ(即使最新固件)在 PTZ 移动后不更新此值。由于 Hikvision 固件此 bug 无法解决，自动追踪功能无法正常工作，应在配置中禁用。使用 Hikvision 固件的其他品牌摄像头可能也有此问题。

### 尝试校准摄像头，但日志显示卡在 0%且 Frigate 无法启动

通常原因同上 - 由于摄像头固件 bug，`MoveStatus` ONVIF 参数未变化。另请注意：校准过程中 Frigate 网页界面和其他摄像头无响应是正常现象。但如果日志中未每隔几秒显示校准进度，则您的摄像头不兼容自动追踪功能。

### 日志显示错误："Autotracker: motion estimator couldn't get transformations"，什么意思？

为在 PTZ 移动时维持目标追踪，Frigate 基于画面细节追踪摄像头移动。出现此消息可能因为`zoom_factor`设置过高、检测目标周围场景细节不足(如缺乏明显边缘或色彩变化)，或摄像头快门速度过慢导致运动模糊。尝试降低`zoom_factor`、改变目标周围场景或调整摄像头快门速度。

### 校准似乎已完成，但摄像头未实际追踪目标，为什么？

部分摄像头固件报告支持 FOV RelativeMove(即 Frigate 用于自动追踪的 ONVIF 命令)，但如果目标进入必需区域后摄像头不平移或倾斜，说明固件实际不支持 FOV RelativeMove。例如 Uniview IPC672LR-AX4DUPK 摄像头，它实际移动的是变焦电机而非平移/倾斜，完全不符合 ONVIF 标准。

### Frigate 报告校准失败错误，为什么？

校准测量 Frigate 让 PTZ 进行一系列移动所需时间。如果这些值过高导致 Frigate 无法支持校准后的自动追踪，日志会记录此错误。通常原因是摄像头电机或网络连接过慢，或固件未及时报告电机状态。可尝试不校准运行(删除配置中的`movement_weights`行并重启)，但如果校准失败，通常意味着自动追踪会表现不稳定。
