---
id: config_overrides
title: 全局配置与摄像头级配置
---

Frigate 的大部分配置可以一次性为所有摄像头设置，然后为各个摄像头单独调整。全局值作为每个摄像头的默认值，任何摄像头都可以覆盖它。

本页面解释了这种继承机制的工作原理。有关设置界面本身的介绍，请参阅 [Frigate 配置](./config.md)。

## 基础原理 {#the-basics}

在全局设置一个值，所有摄像头都会使用它。在某个摄像头上设置相同的值，该摄像头将使用自己的值。

<ConfigTabs>
<TabItem value="图形化配置">

<FrigateConfigMock
  section="detect"
  :steps="[
    {
      level: 'global',
      focus: 'fps',
      values: { fps: 5 },
      hint: '把检测帧率设为 5，现在所有摄像头都以 5 fps 检测。',
    },
    {
      level: 'camera',
      focus: 'fps',
      values: { fps: 10 },
      label: '覆盖单个摄像头',
      hint: '切换到 前门 摄像头，把检测帧率设为 10，只有这个摄像头会以 10 fps来进行检测。',
    },
  ]"
/>

现在 `前门` 摄像头以 10 fps 检测。其他所有摄像头仍然使用全局值 5。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
detect:
  fps: 5 # 所有摄像头以 5 fps 检测

cameras:
  front_door:
    ffmpeg: ...
  driveway:
    ffmpeg: ...
    detect:
      fps: 10 # [!code ++] 除了这个
```

`front_door` 继承 `fps: 5`，`driveway` 使用 `10`。

</TabItem>
</ConfigTabs>

## 覆盖按值应用，而非按部分 {#overrides-apply-per-value-not-per-section}

覆盖某个部分中的一个值不会使该部分的其他值脱离。你在摄像头上未设置的所有内容仍然来自全局配置。

<ConfigTabs>
<TabItem value="图形化配置">

如果你设置摄像头的**画面变动阈值**但保留**轮廓区域**不变，则只有阈值被覆盖。轮廓区域继续遵循全局配置，在全局处更改仍会影响该摄像头。

<FrigateConfigMock
  section="motion"
  :steps="[
    {
      level: 'camera',
      focus: 'threshold',
      values: { threshold: 40 },
      hint: '只在摄像头上修改画面变动阈值，这一项成为覆盖值。',
    },
    {
      level: 'global',
      focus: 'contour_area',
      values: { contour_area: 10 },
      hint: '轮廓区域没有在摄像头上设置，仍然跟随全局配置，在这里修改会影响该摄像头。',
    },
  ]"
/>

打开某个部分以查看哪些值被覆盖：部分标题会指示有多少字段与全局配置不同。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
motion:
  threshold: 30
  contour_area: 10

cameras:
  driveway:
    motion:
      threshold: 40
```

`driveway` 摄像头的最终结果是 `threshold: 40` 和 `contour_area: 10`。只有你写入的值被覆盖。

</TabItem>
</ConfigTabs>

## 将摄像头恢复为全局值 {#returning-a-camera-to-the-global-value}

<ConfigTabs>
<TabItem value="图形化配置">

拥有自己值的摄像头部分会显示 **已覆盖** 徽章。要移除覆盖并恢复继承，使用部分底部的 **重置为全局** 按钮。

</TabItem>
<TabItem value="YAML配置文件">

Frigate 将摄像头值视为覆盖是因为它被写入了配置文件，而不是因为它与全局值不同。在摄像头下重复全局值仍然会创建覆盖：

```yaml
snapshots:
  enabled: true

cameras:
  driveway:
    snapshots:
      enabled: true # 这是一个覆盖，即使值与全局相同
```

如果你后来将全局 `snapshots.enabled` 改为 `false`，`driveway` 仍然会保存快照，因为它有自己的值。要让摄像头再次遵循全局值，请删除摄像头中的键，而不是将其设置为与全局值匹配。

</TabItem>
</ConfigTabs>

## 列表替换，映射合并 {#lists-replace-maps-merge}

这是最容易让人感到意外的区别。

**列表会完全替换。** 摄像头的列表不会添加到全局列表中，而是取代它。

<ConfigTabs>
<TabItem value="图形化配置">

摄像头页面显示该摄像头当前正在追踪的目标，从全局列表开始。在摄像头配置下更改选择会替换该摄像头的列表，因此请确保你想要追踪的每个目标都被选中，而不仅仅是你正在添加的那些。

<FrigateConfigMock
  :auto-play="false"
  level="camera"
  section="objects"
  focus="track"
  :values="{ track: ['dog'] }"
  hint="在摄像头上重新勾选要追踪的目标，这份列表会整体替换全局列表，而不是追加。"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
objects:
  track:
    - person
    - car

cameras:
  backyard:
    objects:
      track:
        - dog # backyard 仅追踪 dog，而不是 person 或 car
```

要在全局目标之外还追踪 `dog`，请在摄像头上列出所有目标。

</TabItem>
</ConfigTabs>

空列表是一个有效的覆盖，是让摄像头退出某项功能的常规方式：

```yaml
review:
  alerts:
    labels:
      - person

cameras:
  street:
    review:
      alerts:
        labels: [] # 此摄像头永不创建警报
```

**映射是逐键合并的。** 摄像头可以添加一个条目而无需重新声明其他条目。

<ConfigTabs>
<TabItem value="图形化配置">

在摄像头配置下为一个目标添加过滤器，不会移除从全局配置继承的过滤器。摄像头保留两者。

<FrigateConfigMock
  :auto-play="false"
  section="objects"
  :steps="[
    {
      level: 'global',
      focus: 'filters',
      hint: '全局为 person 配置了最小面积过滤器。',
    },
    {
      level: 'camera',
      focus: 'filters',
      label: '在摄像头上追加过滤器',
      hint: '摄像头新增 car 过滤器，映射按键合并，person 过滤器依然生效。',
    },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
objects:
  filters:
    person:
      min_area: 5000

cameras:
  driveway:
    objects:
      filters:
        car:
          min_area: 10000
```

`driveway` 摄像头最终同时拥有它定义的 `car` 过滤器和来自全局配置的 `person` 过滤器。

</TabItem>
</ConfigTabs>

## 哪些设置可以被覆盖 {#which-settings-can-be-overridden}

大多数可以，但不是全部。[完整参考配置](./advanced/reference.md)是权威来源：支持摄像头级覆盖的部分标记有注释 `# NOTE: Can be overridden at the camera level`。在界面中，如果某个设置同时出现在 <NavPath path="设置 > 全局配置" /> 和 <NavPath path="设置 > 摄像头配置" /> 下，则可以被覆盖。

此外，还有一些值得了解的要点：

- 有些部分**仅限全局**，没有摄像头级对应项，包括 `go2rtc`、`genai` 提供者、`classification`、`telemetry`、`camera_groups` 和 `ui`。
- 有些部分**仅存在于摄像头级别**，如 `zones` 和 `onvif`。
- 有些部分是**部分可覆盖**的，意味着摄像头只接受全局可用键中的少数几个。`face_recognition`、`lpr` 和 `audio_transcription` 以这种方式工作，参考配置中注明了哪些键适用。

## 必须在全局先启用的增强功能 {#enrichments-that-must-be-enabled-globally-first}

车牌识别和人脸识别比较特殊：全局设置不仅仅是一个默认值，它是一个开关，必须在任何摄像头使用该功能之前处于开启状态。在全局禁用时在摄像头上启用它是配置错误，Frigate 将拒绝启动：

```
Camera driveway has lpr enabled but lpr is disabled at the global level of the config. You must enable lpr at the global level.
```

在全局启用该功能，然后在不需要的摄像头上将其关闭。

<ConfigTabs>
<TabItem value="图形化配置">

<FrigateConfigMock
  section="lpr"
  :steps="[
    {
      level: 'global',
      focus: 'enabled',
      values: { enabled: true },
      hint: '先在全局启用车牌识别，这是功能总开关。',
    },
    {
      level: 'camera',
      focus: 'enabled',
      values: { enabled: false },
      label: '按摄像头关闭',
      hint: '再逐个选中不需要车牌识别的摄像头，把开关关掉。',
    },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
lpr:
  enabled: true

cameras:
  driveway:
    ffmpeg: ... # 继承 lpr，已启用
  backyard:
    ffmpeg: ...
    lpr:
      enabled: false # 退出
```

</TabItem>
</ConfigTabs>

:::note

这仅适用于 `lpr` 和 `face_recognition`，因为全局设置控制着支持性后台进程是否启动。其他功能的工作方式不同。例如，音频转录可以在单个摄像头上启用，而无需在全局启用。

:::

## 模板（Profiles） {#profiles}

[模板](./profiles.md)在以上所有内容的基础上增加了额外的层级。模板是一组命名的摄像头覆盖，你可以在 Frigate 运行时开启或关闭，例如在离家时更改检测和录制行为。

模板应用在摄像头已解析的配置之上，因此当模板处于活动状态时，模板值胜过摄像头值和全局值。模板覆盖摄像头部分的一个子集，并且不会修改你的配置文件。

## 总结 {#summary}

- 摄像头继承你未在其上设置的每个值。
- 覆盖一个值不会使该部分的其他值脱离。
- 在摄像头上写入一个值会覆盖它，即使它与全局值匹配也是如此。删除它以重新继承。
- 列表替换全局列表。映射合并到其中。
- 空列表是一个覆盖，而不是省略。
- `lpr` 和 `face_recognition` 必须先在全局启用，摄像头才能使用它们。
