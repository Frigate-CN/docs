---
id: zones
title: 监控区
---

区域允许你划定画面中的特定区域，并为目标应用额外的过滤器，从而判断目标是否位于该区内。系统会根据目标`边界框的底部中心`点来评估是否进入监控区，边界框与区的重叠面积不影响判断。

例如，下图中的猫当前位于监控区 1，而**不在**监控区 2。
![底部中心点判断](/img/bottom-center.jpg)

区域不能与摄像头同名。如需在多摄像头覆盖同一区域时使用相同监控区，可以为每个摄像头配置同名的区域。

调试时，请启用摄像头调试视图中的“区域”选项（设置 --> 调试），以便根据需要调整。当任何目标进入区域时，区边界线会变粗。

创建监控区的步骤与[创建"画面变动遮罩"](masks.md)类似，只需在网页界面使用创建区域的功能即可。

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  level="camera"
  section="masksAndZones"
  :steps="[
    { focus: 'zone.add', label: '添加区域', hint: '点击区域旁边的加号按钮来创建一个新区域。' },
    { focus: 'zone.canvas', label: '绘制区域', hint: '在摄像头画面上点击选点，然后点击第一个点来闭合多边形。' },
    { focus: 'zone.options', label: '区域选项', hint: '配置友好名称、物体、滞留时间、惯性和可选的测速设置。' },
    { focus: 'zone.save', label: '保存', hint: '完成边界和选项后保存区域。' },
  ]"
/>

</TabItem>
<TabItem value="yaml">

也可以直接在配置文件中定义区域：

```yaml
cameras:
  your_camera_name:
    zones:
      entire_yard:
        friendly_name: 整个院子
        coordinates: 0.123,0.456,0.789,0.012,...
```

</TabItem>
</ConfigTabs>

### 限定警报和检测在特定区内

通常你可能希望仅当目标进入关注区域时才创建`警报`。这可以通过设置`required_zones`来实现。例如，仅当目标进入整个院子区域时才创建警报：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  level="camera"
  section="review"
  focus="alerts.required_zones"
  :values="{ 'alerts.required_zones': ['entire_yard'] }"
  hint="选择 entire_yard，这样目标必须进入该区域才会被视为警报。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    review:
      alerts:
        required_zones:
          - entire_yard
    zones:
      entire_yard:
        friendly_name: 整个院子
        coordinates: ...
```

</TabItem>
</ConfigTabs>

你可能还想限定`检测`仅在目标进入次要关注区时创建。例如，当目标进入院子内部区域时触发警报，但进入院子边缘时就创建`检测记录`：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="review"
  :values="{
    'alerts.required_zones': ['inner_yard'],
    'detections.required_zones': ['edge_yard'],
  }"
  :targets="[
    { field: 'alerts.required_zones', hint: '选择 inner_yard，这样目标必须进入内部区域才会被视为警报。' },
    { field: 'detections.required_zones', hint: '选择 edge_yard，这样次要区域的活动可以保留为检测。' },
  ]"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    review:
      alerts:
        required_zones:
          - inner_yard
      detections:
        required_zones:
          - edge_yard
    zones:
      edge_yard:
        friendly_name: 院子边缘
        coordinates: ...
      inner_yard:
        friendly_name: 院子内部
        coordinates: ...
```

</TabItem>
</ConfigTabs>

### 限定快照到特定区

仅当目标进入特定区域（例如`entire_yard`区域）时才保存快照：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="snapshots"
  focus="required_zones"
  :values="{ required_zones: ['entire_yard'] }"
  hint="选择 entire_yard，仅在目标进入该区域后保存快照。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    snapshots:
      required_zones:
        - entire_yard
    zones:
      entire_yard:
        friendly_name: 整个院子
        coordinates: ...
```

</TabItem>
</ConfigTabs>

### 限定区内的目标类型

有时需要限制区只对特定目标类型生效，以便更精细地控制警报、检测和快照的保存。以下示例将限制一个区只对人有效，另一个区只对车辆有效。

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="masksAndZones"
  focus="zone.objects"
  label="物体"
  hint="选择适用于该区域的物体类型。例如，院子区域选择人，街道区域选择车辆。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      entire_yard:
        coordinates: ... # 需要检测人的区域
        objects:
          - person
      front_yard_street:
        coordinates: ... # 仅街道区域
        objects:
          - car
```

</TabItem>
</ConfigTabs>

以上配置代表`front_yard_street`区只有车辆（`car`）才能触发，而`entire_yard`区只有人（`person`）能触发。系统会追踪进入院子（`entire_yard`）任何位置的人，以及进入街道区域（`front_yard_street`）的车辆。

### 区域内滞留检测

当需要检测物品/目标在区内异常滞留时，可以配置最小滞留时间阈值（单位：秒）：

:::note

当使用滞留检测区域时，系统会持续追踪物体直到它离开该区域。这类区域仅适用于那些通常不会发生物体滞留的监控场景。

:::

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="masksAndZones"
  focus="zone.loitering_time"
  label="滞留时间"
  hint="设置目标必须在区域内停留的最小秒数，超过后区域才会激活。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      sidewalk:
        loitering_time: 4 # 单位为秒
        objects:
          - person
```

</TabItem>
</ConfigTabs>

### 区域进入延迟

为防止边界框判断误差导致误报，可以设置目标必须连续多帧位于区内才视为有效进入：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="masksAndZones"
  focus="zone.inertia"
  label="惯性"
  hint="设置目标边界框必须连续位于区域内的帧数。默认值为 3。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      front_yard:
        inertia: 3
        objects:
          - person
```

</TabItem>
</ConfigTabs>

对于需要快速响应的场景（如车辆驶入车道），可将延迟设为 1：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="masksAndZones"
  focus="zone.inertia"
  label="惯性"
  hint="当目标应立即被视为在区域内时，将惯性设为 1。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      driveway_entrance:
        inertia: 1
        objects:
          - car
```

</TabItem>
</ConfigTabs>

### 速度估算

Frigate 可以估算目标在区内的移动速度。此功能需要将区定义为 4 个点，并测量实际距离。最适合用于监测道路上车辆的速度。

![地面平面4点区](/img/ground-plane.jpg)

速度估算需要目标被追踪足够多帧才能计算，因此区应远离目标进出位置。_区不应占据整个画面_。目标速度会在其位于区内时持续计算并存入数据库。

配置中需通过`distances`字段指定各点间的实际距离。最快且最准确的方式是通过 Frigate 界面的区域编辑器来配置：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  level="camera"
  :show-navigation-steps="false"
  section="masksAndZones"
  :steps="[
    { focus: 'zone.canvas', label: '绘制四点区域', hint: '绘制恰好四个点，对齐到目标移动的地面平面。' },
    { focus: 'zone.speed', label: '测速', hint: '输入每对连续点之间的实际距离。单位遵循界面单位系统设置。' },
  ]"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      street:
        coordinates: 0.033,0.306,0.324,0.138,0.439,0.185,0.042,0.428
        distances: 10,12,11,13.5 # 单位为米或英尺
```

在上面的示例中，前两个点（[0.033,0.306] 和 [0.324,0.138]）之间的距离为 10。第二和第三组点（[0.324,0.138] 和 [0.439,0.185]）之间的距离为 12，以此类推。

</TabItem>
</ConfigTabs>

距离单位由`ui`配置决定：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  level="global"
  section="ui"
  focus="unit_system"
  :values="{ unit_system: 'metric' }"
  hint="选择公制以使用公里/小时，或英制以使用英里/小时。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
ui:
  # 可选"metric"(公制)或"imperial"(英制)，默认为公制
  unit_system: metric
```

</TabItem>
</ConfigTabs>

估算速度会显示在调试视图和 MQTT 事件中，详见[MQTT 文档](/integrations/mqtt.md#frigateevents)。

#### 最佳实践与注意事项

- 速度估算在物体沿直线道路或路径行进时效果最佳。建议选择物体以直线方式通过的路径进行测量。应避免在交叉路口或任何物体会转弯的位置创建测速区域。
- 创建一个测速区域，使物体边界框的底部中心能够直接通过该区域且任何时候都不会被遮挡。
- 可以使用较大的测速区域（如上方示例图片所示），但如果物体的边界框形状发生变化（例如转弯或部分被遮挡），可能会导致估算不准确。通常最佳做法是：将测速区域设置得足够大以捕获多个帧，同时保持足够小，使物体边界框在进入、通过和离开区域时不会改变大小。
- 根据你的测速区域大小和位置，你可能需要将区域的惯性值从默认的 3 调低。
- 你测量的实际尺寸越准确，速度估算就会越精确。然而，由于 Frigate 追踪算法的工作原理，你可能需要调整实际距离值，使估算速度更符合实际速度。
- 一旦物体离开测速区域，由于透视畸变和与校准区域的对齐偏差，速度精度可能会降低。因此，当物体位于速度追踪区域之外时，速度值将通过 MQTT 显示为零，并且在调试视图中不可见。
- 所提供的速度仅为**估算值**，高度依赖于相机位置、区域点位和实际尺寸测量。此功能不应被用于执法目的。

### 速度阈值

可设置区的最小速度要求，只有达到该速度的目标才会被视为进入区。区域`distances`必须按上述方式定义：

<ConfigTabs>
<TabItem value="ui">

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="camera"
  section="masksAndZones"
  focus="zone.speed_threshold"
  label="速度阈值"
  hint="设置目标被视为在区域内的最小速度。单位遵循界面单位系统设置。"
/>

</TabItem>
<TabItem value="yaml">

```yaml
cameras:
  your_camera_name:
    zones:
      sidewalk:
        coordinates: ...
        distances: ...
        inertia: 1
        speed_threshold: 20 # 单位为公里/小时或英里/小时，取决于 unit_system 设置
```

</TabItem>
</ConfigTabs>
