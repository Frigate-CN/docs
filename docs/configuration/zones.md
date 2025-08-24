---
id: zones
title: 监控区
---

监控区允许您定义画面中的特定区域，并为对象类型应用额外的过滤器，从而判断对象是否位于该区内。系统会根据对象边界框的底部中心点来评估是否进入监控区，边界框与区的重叠面积不影响判断。

例如，下图中的猫当前位于监控区1，但**不在**监控区2。
![底部中心点判断](/img/bottom-center.jpg)

监控区不能与摄像头同名。如需在多摄像头覆盖同一区域时使用相同监控区，可以为每个摄像头配置同名的区。

调试时，请启用摄像头调试视图中的"监控区"选项（设置 --> 调试），以便根据需要调整。当任何对象进入区时，区边界线会变粗。

创建监控区的步骤与[创建"运动遮罩"](masks.md)类似，只需在网页界面使用创建区的功能即可。

### 限定警报和检测在特定区内

通常您可能希望仅当对象进入关注区域时才创建警报。这可以通过设置`required_zones`来实现。例如，仅当对象进入整个院子区时才创建警报，配置如下：

```yaml
cameras:
  您的摄像头名称:
    review:
      alerts:
        required_zones:
          - entire_yard
    zones:
      entire_yard:
        coordinates: ...
```

您可能还想限定检测仅在对象进入次要关注区时创建。例如，当对象进入院子内部区域时触发警报，但进入院子边缘时就创建检测记录：

```yaml
cameras:
  您的摄像头名称:
    review:
      alerts:
        required_zones:
          - inner_yard
      detections:
        required_zones:
          - edge_yard
    zones:
      edge_yard:
        coordinates: ...
      inner_yard:
        coordinates: ...
```

### 限定快照到特定区

```yaml
cameras:
  您的摄像头名称:
    snapshots:
      required_zones:
        - entire_yard
    zones:
      entire_yard:
        coordinates: ...
```

### 限定区内的对象类型

有时需要限制区只对特定对象类型生效，以便更精细地控制警报、检测和快照的保存。以下示例将限制一个区只对人有效，另一个区只对车辆有效。

```yaml
cameras:
  您的摄像头名称:
    zones:
      entire_yard:
        coordinates: ... (您希望检测人的区域)
        objects:
          - person
      front_yard_street:
        coordinates: ... (仅街道区域)
        objects:
          - car
```

只有车辆对象能触发`front_yard_street`区，只有人能触发`entire_yard`区。系统会追踪进入院子任何位置的人，以及进入街道区域的车辆。

### 区内滞留检测

当需要检测对象在区内异常滞留时，可以配置最小滞留时间阈值（单位：秒）：

:::note

当使用滞留检测区域时，系统会持续追踪物体直到它离开该区域。这类区域仅适用于那些通常不会发生物体滞留的监控场景。

:::

```yaml
cameras:
  您的摄像头名称:
    zones:
      sidewalk:
        loitering_time: 4 
        objects:
          - person
```

### 区进入延迟

为防止边界框判断误差导致误报，可以设置对象必须连续多帧位于区内才视为有效进入：

```yaml
cameras:
  您的摄像头名称:
    zones:
      front_yard:
        inertia: 3
        objects:
          - person
```

对于需要快速响应的场景（如车辆驶入车道），可将延迟设为1：

```yaml
cameras:
  您的摄像头名称:
    zones:
      driveway_entrance:
        inertia: 1
        objects:
          - car
```

### 速度估算

Frigate可以估算对象在区内的移动速度。此功能需要将区定义为4个点，并测量实际距离。最适合用于监测道路上车辆的速度。

![地面平面4点区](/img/ground-plane.jpg)

速度估算需要对象被追踪足够多帧才能计算，因此区应远离对象进出位置。_区不应占据整个画面_。对象速度会在其位于区内时持续计算并存入数据库。

配置中需通过`distances`字段指定各点间的实际距离：

```yaml
cameras:
  您的摄像头名称:
    zones:
      street:
        coordinates: 0.033,0.306,0.324,0.138,0.439,0.185,0.042,0.428
        distances: 10,12,11,13.5 # 单位米或英尺
```

距离单位由`ui`配置决定：

```yaml
ui:
  # 可选"metric"(公制)或"imperial"(英制)，默认为公制
  unit_system: metric
```

估算速度会显示在调试视图和MQTT事件中，详见[MQTT文档](/integrations/mqtt.md#frigateevents)。

#### 最佳实践与注意事项

- 速度估算在物体沿直线道路或路径行进时效果最佳。建议选择物体以直线方式通过的路径进行测量。应避免在交叉路口或任何物体会转弯的位置创建测速区域。
- 创建一个测速区域，使物体边界框的底部中心能够直接通过该区域且任何时候都不会被遮挡。
- 可以使用较大的测速区域（如上方示例图片所示），但如果物体的边界框形状发生变化（例如转弯或部分被遮挡），可能会导致估算不准确。通常最佳做法是：将测速区域设置得足够大以捕获多个帧，同时保持足够小，使物体边界框在进入、通过和离开区域时不会改变大小。
- 根据您的测速区域大小和位置，您可能需要将区域的惯性值从默认的3调低。
- 您测量的实际尺寸越准确，速度估算就会越精确。然而，由于Frigate跟踪算法的工作原理，您可能需要调整实际距离值，使估算速度更符合实际速度。
- 一旦物体离开测速区域，由于透视畸变和与校准区域的对齐偏差，速度精度可能会降低。因此，当物体位于速度跟踪区域之外时，速度值将通过MQTT显示为零，并且在调试视图中不可见。
- 所提供的速度仅为**估算值**，高度依赖于相机位置、区域点位和实际尺寸测量。此功能不应被用于执法目的。


### 速度阈值

可设置区的最小速度要求，只有达到该速度的对象才会被视为进入区：

```yaml
cameras:
  您的摄像头名称:
    zones:
      sidewalk:
        coordinates: ...
        distances: ...
        inertia: 1
        speed_threshold: 20 # 单位取决于unit_system设置
```