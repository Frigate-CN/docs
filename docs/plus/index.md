---
id: index
title: 模型
---

:::tip

这是一个额外订阅功能。价格为$50/年，订阅后生效。

:::

<a href="https://frigate.video/plus" target="_blank" rel="nofollow">Frigate+</a> 提供基于Frigate+用户从安防摄像头提交的图像训练的模型，这些模型专门为Frigate分析视频的方式设计。这些模型能以更少资源提供更高准确性。您上传的图像用于微调一个基于所有Frigate+用户上传图像训练的基础模型，最终得到一个针对您特定环境优化的高精度模型。

:::info

订阅后基础模型不会直接可用。未来可能会改变，但目前您需要提交包含最低数量图像的模型请求。

:::

订阅后，每年可进行 12 次模型训练以微调您的模型。此外，在您的订阅有效期内，您将可以使用任何已发布的基础模型。如果您取消订阅，您仍可访问您账户中的任何已训练模型和基础模型。提交模型请求或购买额外训练需有有效订阅。新的基础模型按季度发布，目标发布日期为 1 月 15 日、4 月 15 日、7 月 15 日和 10 月 15 日。

集成Frigate+的方法请参阅[集成文档](/integrations/plus.md)。

## 可用模型类型

Frigate+提供两种模型类型：`mobiledet`和`yolonas`。两者都是目标检测模型，能检测[下方列出的相同标签](#可用标签类型)。

不是所有检测器都支持所有模型类型，请根据[支持的检测器类型](#支持的检测器类型)表格选择匹配您检测器的模型。你可以通过先使用基础模型，在你的硬件上测试模型类型的兼容性和速度。

| 模型类型   | 描述                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `mobiledet` | 基于与Frigate默认模型相同的架构。可在Google Coral设备和CPU上运行。                                    |
| `yolonas`   | 新架构，精度略高且对小目标检测有改进。支持Intel、NVIDIA GPU和AMD GPU。                                |

## 支持的检测器类型

目前Frigate+模型支持CPU(`cpu`)、Google Coral(`edgetpu`)、OpenVino(`openvino`)和ONNX(`onnx`)检测器。

:::warning

Frigate+模型与`onnx`检测器的配合使用仅限Frigate 0.15及以上版本。

:::

| 硬件                                                                                                                     | 推荐检测器类型 | 推荐模型类型 |
| ------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------ |
| [CPU](/configuration/object_detectors.md#cpu检测器不推荐使用)                                                   | `cpu`          | `mobiledet`  |
| [Coral(所有形态)](/configuration/object_detectors.md#edge-tpu检测器)                                                  | `edgetpu`      | `mobiledet`  |
| [Intel](/configuration/object_detectors.md#openvino检测器)                                                             | `openvino`     | `yolonas`    |
| [NVIDIA GPU](/configuration/object_detectors#onnx)\*               | `onnx`         | `yolonas`    |
| [AMD ROCm GPU](/configuration/object_detectors#amdrocm-gpu检测器)\* | `onnx`         | `yolonas`    |

**\* 需要Frigate 0.15版本**

### 改进你的模型

一些用户可能会发现，Frigate+ 模型最初会产生更多误报，但通过提交正确识别和误报的样本，模型将会得到改进。随着订阅者提交所有这些新图像，未来的基础模型会因纳入越来越多的示例而得到提升。请注意，在训练模型时，只会使用至少有一个已验证标签的图像。将 Frigate 中的图像作为正确识别或误报提交，并不能验证该图像。您仍必须在 Frigate+ 中验证该图像，以便将其用于训练。

- **同时提交正确识别和误报的样本**。这将帮助模型区分正确与错误。在您所有的图像中，您应争取达到正确识别样本提交占比 80%，误报样本提交占比 20% 的目标。如果您在特定区域遇到误报情况，提交该区域附近在相似光照条件下任何物体类型的正确识别样本，将有助于教会模型在没有物体时该区域的样子。
- **稍微降低阈值，以便在阈值附近生成更多误报/正确识别样本**。例如，如果您有一些误报得分是 68%，一些正确识别得分是 72%，您可以尝试将阈值降低到 65%，并提交该范围内的正确识别和误报样本。这将帮助模型学习，并扩大正确识别得分与误报得分之间的差距。
- **提交多样化的图像**。为获得最佳效果，每台摄像机您应至少提供 100 张已验证图像。请记住，应涵盖不同的条件。您需要阴天、晴天、黎明、黄昏和夜晚的图像。随着情况的变化，您可能需要提交新的示例来应对新类型的误报。例如，从夏季到冬季下雪天的变化，或者诸如新增烤架或露台家具等其他变化，可能都需要额外的示例和训练。 

## 可用标签类型 {#available-label-types}

Frigate+模型支持更适合安防摄像头的对象集。当前支持以下对象：

- **人物**：`person`、`face`
- **车辆**：`car`、`motorcycle`、`bicycle`、`boat`、`school_bus`、`license_plate`
- **快递标识**：`amazon`、`usps`、`ups`、`fedex`、`dhl`、`an_post`、`purolator`、`postnl`、`nzpost`、`postnord`、`gls`、`dpd`、 `canada_post`、 `royal_mail`
- **动物**：`dog`、`cat`、`deer`、`horse`、`bird`、`raccoon`、`fox`、`bear`、`cow`、`squirrel`、`goat`、`rabbit`、 `skunk`、 `kangaroo`
- **其他**：`package`、`waste_bin`、`bbq_grill`、`robot_lawnmower`、`umbrella`

Frigate默认模型中的其他对象类型暂不支持。未来版本将增加更多对象类型。

### 候选标签

候选标签也可用于标注。这些标签目前没有足够的数据纳入模型，但使用它们将有助于更快地提供支持。你可以通过编辑相机设置来启用这些标签。
在可能的情况下，这些标签在训练期间会映射到现有标签。例如，在添加对新标签的支持之前，任何 “婴儿”（`baby`） 标签都会映射到 “人”（`person`）。

候选标签有：`baby`, `bpost`, `badger`, `possum`, `rodent`, `chicken`, `groundhog`, `boar`, `hedgehog`, `tractor`, `golf cart`, `garbage truck`, `bus`, `sports ball`

候选标签无法使用自动建议。

### 标签属性

使用Frigate+模型时，某些标签有特殊处理方式。`face`、`license_plate`及快递标识如`amazon`、`ups`和`fedex`被视为属性标签，不会像常规对象那样被追踪，也不会直接生成核查项。此外，`threshold`过滤器对这些标签无效，您需要根据需要调整`min_score`和其他过滤值。

要启用这些属性标签，需将其添加到追踪对象列表：

```yaml
objects:
  track:
    - person
    - face
    - license_plate
    - dog
    - cat
    - car
    - amazon
    - fedex
    - ups
    - package
```

使用Frigate+模型时，系统会为人物对象选择面部最清晰的快照，为车辆选择车牌最清晰的快照。这有助于面部识别和车牌识别等二次处理。

![面部属性示例](/img/plus/attribute-example-face.jpg)

快递标识如`amazon`、`ups`和`fedex`用于自动为车辆对象分配子标签。

![Fedex属性示例](/img/plus/attribute-example-fedex.jpg)