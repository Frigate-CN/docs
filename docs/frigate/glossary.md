---
id: glossary
title: 术语表
---

本术语表解释 Frigate 文档中的常用术语。

## 警报 {#alert}

两种[核查项](#review-item)严重程度中较高的一种，另一种是[检测](#detection)。默认情况下，当核查项涉及 `person` 或 `car` 时为警报；符合条件的[标签](#label)和[区域](#zone)可以配置。[详见核查文档](/configuration/review)

## 属性 {#attribute}

在[目标](#object)上检测到的属性，与其[标签](#label)并存。与[子标签](#sub-label)不同，一个目标可以同时携带多个属性。某些属性直接来自目标检测[模型](#model)——例如 `face`、`license_plate`，或快递公司标识如 `amazon`、`ups` 和 `fedex`——而其他属性来自配置为 `attribute` 类型的[自定义目标分类模型](/configuration/custom_classification/object_classification)。属性在浏览的追踪目标详情面板、`frigate/events` MQTT 消息和 HTTP API 中可见。

## 边界框 {#bounding-box}

目标检测[模型](#model)返回的框选标记，用于标注画面中检测到的[目标](#object)。在调试视图中，边界框按目标[标签](#label)着色。

### 边界框颜色规则 {#bounding-box-colors}

- 启动时为不同目标标签分配不同颜色
- 深蓝色细线表示当前帧未检测到该目标
- 灰色细线表示目标被判定为静止状态
- 粗线表示该目标是自动追踪目标（启用时）

## 类别 {#class}

分类[模型](#model)被训练来区分的类别。每个类别是模型预测的一个独特视觉类别，外加一个用于不属于任何类别的输入的 `none` 类。例如，用于 `person` 目标的自定义目标分类模型可能使用类别 `delivery_person`、`resident` 和 `none`。预测的类别根据模型的配置作为[子标签](#sub-label)或[属性](#attribute)应用于[目标](#object)。[详见目标分类文档](/configuration/custom_classification/object_classification)

## 检测 {#detection}

两种[核查项](#review-item)严重程度中较低的一种，另一种是[警报](#alert)。默认情况下，不符合警报条件的任何核查项都是检测；符合条件的[标签](#label)和[区域](#zone)可以配置。尽管名称如此，检测是核查项的一个类别——与[模型](#model)执行的目标检测不同。[详见核查文档](/configuration/review)

## 误报 {#false-positive}

目标检测[模型](#model)的错误结果，它为画面中的某物分配了错误的[标签](#label)——例如将狗识别为人，或将椅子识别为狗。在需忽略区域正确识别到的人不属于误报。

## 标签 {#label}

由目标检测[模型](#model)分配给检测到的[目标](#object)的类型，取自模型的标签映射表——例如 `person`、`car` 或 `dog`。Frigate 默认追踪 `person`；通过在目标配置中添加来追踪更多标签。[详见可用目标文档](/configuration/objects)

## 遮罩 {#mask}

Frigate 包含两种遮罩类型。[详见遮罩文档](/configuration/masks)

### 画面变动遮罩 {#motion-mask}

阻止遮罩区域的[画面变动](#motion)触发目标检测。但不会阻止因邻近区域画面变动而连带检测该区域目标。用于画面中不断变化但从不包含你关注的目标的部分——摄像头时间戳、天空、树梢等。

### 目标遮罩 {#object-mask}

将丢弃底部中心点（无论重叠区域）位于遮罩区的所有[边界框](#bounding-box)，强制将其判定为[误报](#false-positive)并忽略。

## 最低分 {#min-score}

目标追踪过程中可接受的最低检测得分。低于此分值的检测将被视为[误报](#false-positive)并丢弃。

## 模型 {#model}

Frigate 用来检测或分类目标的机器学习模型。目标检测模型在每帧中定位[目标](#object)并返回其[标签](#label)和[边界框](#bounding-box)。额外的增强模型在追踪目标上运行以添加细节：人脸识别、车牌识别、鸟类分类、自定义目标和状态分类，以及用于语义搜索的嵌入模型。[详见目标检测器文档](/configuration/object_detectors)

## 画面变动 {#motion}

当前帧与先前帧的像素变化。当大量相邻像素发生变化时，会组合在一起并在调试视图中以红色动态框标记。[详见画面变动文档](/configuration/motion_detection)

## 目标 {#object}

Frigate 可以在摄像头画面中检测和跟随的某物，由其[标签](#label)标识（例如人或车）。Frigate 监视的目标类型在 `objects` 配置中设置。一旦目标被检测到并跨帧跟随，它就成为[追踪目标](#tracked-object-event-in-previous-versions)，可能还携带[子标签](#sub-label)和[属性](#attribute)。[详见可用目标文档](/configuration/objects)

## 检测区域 {#region}

送入目标检测[模型](#model)的画面分区，触发条件包括：[画面变动](#motion)、活跃目标或偶发的静止目标复查。调试视图中以绿色框显示。

## 待审项目 {#review-item}

一个或多个[追踪目标](#tracked-object-event-in-previous-versions)处于活动状态的时间段，分组以供核查。每个核查项被归类为[警报](#alert)或[检测](#detection)。[详见核查文档](/configuration/review)

## 快照分 {#snapshot-score}

快照捕获瞬间该目标的置信度分数。

## 子标签 {#sub-label}

在[追踪目标](#tracked-object-event-in-previous-versions)上除其[标签](#label)外分配的更具体身份。`person` 可能获得识别到的人脸名称，`car` 可能获得已知车牌的名称，`bird` 可能获得其物种。一个目标同时只能有一个子标签。子标签由人脸识别、车牌识别、鸟类分类、配置为 `sub label` 类型的自定义目标分类以及语义搜索触发器产生。

## 判定阈值 {#threshold}

目标分数必须达到的中位数值，方可被判定为有效目标。

## 峰值分 {#top-score}

目标在整个追踪周期内达到的最高中位置信度。

## 被追踪目标 {#tracked-object-event-in-previous-versions}

从[目标](#object)进入画面到离开画面的完整周期（含静止时段），旧称"事件"。当满足[判定阈值](#threshold)且符合快照/录像保存条件时将被存储。

## 监控区域 {#zone}

用户定义的画面内关注区域，可用于通知触发和限制[待审项目](#review-item)生成范围。[详见区域文档](/configuration/zones)
