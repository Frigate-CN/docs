---
id: cameras
title: 摄像头配置
---

## 使用添加摄像头向导添加摄像头 {#adding-a-camera-with-the-add-camera-wizard}

添加摄像头向导是添加摄像头的推荐方式。在 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中点击**添加摄像头**。向导会连接摄像头、测试各条流并生成摄像头配置，其中包括 [go2rtc](go2rtc.md) 转流和实时视图的流映射，因此常规配置无需手写 YAML。

### 步骤 1：命名并连接 {#step-1-name-and-connection}

输入摄像头名称、主机或 IP 地址以及登录凭证，然后选择向导查找摄像头流的方式：

- **探测摄像头**：通过 ONVIF 查询摄像头（ONVIF 端口通常为 80 或 8080），并获取其流地址。有些摄像头使用独立的 ONVIF 服务账号而非设备管理员账号，还有一部分需要勾选**使用摘要认证**。
- **手动选择**：根据所选摄像头品牌模板拼接流地址，支持的品牌包括 Dahua/Amcrest/EmpireTech、Hikvision/Uniview/Annke、Ubiquiti、Reolink、Axis、TP-Link 和 Foscam。选择**其他**则直接输入自定义 RTSP 地址。非 RTSP 类型的流必须[手动配置](#setting-up-camera-inputs)。

你输入的名称会被转为小写，空格替换为下划线。如果转换后仍不是有效的配置键，向导会生成一个安全名称，并把你的输入保存为 `friendly_name`。

### 步骤 2：探测或截图 {#step-2-probe-or-snapshot}

在探测模式下，向导会显示摄像头返回的信息——制造商、型号、固件、配置文件数量，是否支持 PTZ、预置位和[自动追踪](autotracking.md)——以及探测到的 RTSP 地址。你可以逐个测试候选流，查看其分辨率、帧率、编解码器和截图，再决定使用哪一条。

在手动模式下，向导会测试按模板拼接出的地址，并显示同样的信息和截图。

如果找不到 RTSP 地址，可能是凭证有误，或者摄像头不支持 ONVIF。返回上一步改用手动选择。

### 步骤 3：配置流 {#step-3-stream-configuration}

为每条流指定[功能角色](#setting-up-camera-inputs)，并通过**添加另一个流**添加摄像头的其他流，例如用子流做 `detect`、用主流做 `record`。至少有一条流需要具备 `detect` 角色才能继续。

**减少摄像头连接**：让输入经由 go2rtc 转流，使 Frigate 和实时视图共用一条与摄像头的连接，而不是各自建立独立连接。详见[转流](restream.md)。

### 步骤 4：验证与测试 {#step-4-validation-and-testing}

向导会连接每条流，获取实时预览、预估带宽和验证结果。它会检查最常见的配置错误，包括：

- 检测分辨率过高（增加资源消耗），或过低导致无法可靠检测、甚至完全无法探测
- 标记为 `record` 的流，音频编解码器不是 AAC，或者完全没有音频
- 标记为 `audio` 的流不包含音频流
- 给 `record` 角色使用了转流输入
- 品牌相关问题，例如 Reolink 摄像头的 RTSP 流应改用 http-flv，或给 `detect` 选了 Dahua/Hikvision 的子流

**使用流兼容模式**：让流经由 go2rtc 的 ffmpeg 模块转发。如果某条流多次尝试后仍无法加载，可以启用它。注意，启用后该流的[双向通话](/configuration/live#two-way-talk)将无法被检测到。

点击**保存新摄像头**会写入配置并立即启动该摄像头，无需重启。

其余功能，包括[硬件加速](hardware_acceleration_video.md)、[双向通话](/configuration/live#two-way-talk)和音频转码，都在摄像头添加完成后另行配置。摄像头型号相关的问题请参阅[摄像头品牌特定配置](camera_specific.md)。

## 删除摄像头 {#deleting-a-camera}

在 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中点击**删除摄像头**，选择摄像头并确认。删除摄像头需要 `admin` 角色权限，且无法撤销。

:::warning

删除摄像头会永久移除它的录像、追踪目标和配置。如果只是想停止处理某个摄像头，请在 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中把它的状态设为**关闭**或**禁用**。参见[摄像头状态](/configuration/live#camera-state)。

:::

删除摄像头会移除：

- 配置文件中该摄像头的部分，以及它在任何[角色](authentication.md#user-roles)的摄像头列表中的条目。不再关联任何摄像头的自定义角色也会一并移除。
- 数据库中该摄像头的全部记录：追踪目标、核查项、录像、预览、时间线条目、保存的区域网格以及[触发器](semantic_search.md#triggers)。
- 该摄像头的所有媒体文件：录像、快照、缩略图和预览片段。

[导出内容](/usage/exports)默认保留，所以已经导出的录像在删除源摄像头后依然存在。如果也要一起删除，请在确认步骤中打开**同时删除此摄像头的导出**。

摄像头进程会停止，更改立即生效，无需重启。如果生成的配置无法解析，Frigate 会回滚到先前的配置并报错，不会让 Frigate 停留在损坏状态。

有两样东西不会被自动清理：

- **go2rtc 转流。** Frigate 会尽力停止以该摄像头命名的正在运行的 [go2rtc](go2rtc.md) 转流，但配置文件中的转流条目仍然存在，下次重启时又会被重新创建。请在 <NavPath path="设置 > 系统 > go2rtc 转流" /> 或配置文件中手动删除。
- **摄像头分组。** 已删除的摄像头仍会出现在引用它的[摄像头分组](#setting-up-camera-groups)中。分组会自动跳过不存在的摄像头，所以并无危害，但你也可以编辑分组，把失效的条目去掉。

## 设置摄像头输入源 {#setting-up-camera-inputs}

每个摄像头都可以配置多个输入源，并按需要为不同输入源搭配不同功能。这样就能用低分辨率视频流做目标检测，同时用高分辨率视频流做录制，反过来也可以。

摄像头默认启用，可以通过设置 `enabled: False` 禁用。通过配置文件禁用的摄像头不会出现在 Frigate 界面中，也不会消耗系统资源。

同一个功能在每个摄像头中只能分配给一个输入源。可用的功能选项如下：

| 功能     | 描述                                                |
| -------- | --------------------------------------------------- |
| `detect` | 用于目标检测的主视频流。[文档](object_detectors.md) |
| `record` | 按配置保存录像片段。[文档](record.md)               |
| `audio`  | 用于音频检测。[文档](audio_detectors.md)            |

<ConfigTabs>
<TabItem value="图形化配置">

在摄像头配置的**视频流（FFmpeg）**部分添加输入源，并为每个输入源分配功能。

<FrigateConfigMock
  :auto-play="false"
  level="camera"
  section="ffmpeg"
  focus="inputs"
  camera-name="back"
  :values="{
    inputs: [
      {
        title: '视频流 1',
        path: 'rtsp://127.0.0.1:8554/back',
        mode: 'restream',
        stream: 'back',
        roles: ['detect'],
        inputArgMode: 'preset',
        inputArgPreset: 'preset-rtsp-restream',
        hwaccelMode: 'inherit',
      },
    ],
  }"
  hint="填写摄像头 RTSP 流地址，并为该输入源分配功能（例如用 detect 做目标检测）。"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
mqtt:
  host: mqtt.server.com
cameras: # [!code highlight]
  back: # <- back 为示例摄像头名称，改成你需要的名称，目前仅支持英文、数字和下划线 [!code ++]
    enabled: True # [!code ++]
    ffmpeg: # [!code ++]
      inputs: # [!code ++]
        # 摄像头 RTSP 流地址可查阅摄像头文档，或搜索其他人分享的教程，下面的地址仅为示例
        # 也可以考虑使用 go2rtc，请参考本文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 # [!code ++]
          roles: # [!code ++]
            - detect # <- 用于目标检测 [!code ++]
        # 可以为不同功能设置不同的流：上面的子码流带宽占用低，适合做检测，能减轻检测器负担
        # 下面的主码流画面清晰，适合做录制
        # 也可以考虑使用 go2rtc，请参考本文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/live # [!code ++]
          roles: # [!code ++]
            - record # <- 用于录制的视频流 [!code ++]
    detect: # [!code highlight]
      width: 1280 # <- 可选，默认 Frigate 会尝试自动检测分辨率 [!code highlight]
      height: 720 # <- 可选，默认 Frigate 会尝试自动检测分辨率 [!code highlight]
```

</TabItem>
</ConfigTabs>

:::tip

如果你希望实时视图有声音、画面更流畅，可以配置 [go2rtc](../configuration/go2rtc)，并让摄像头的 `path` 指向 go2rtc 的[转流](../configuration/restream#reduce-connections-to-camera)地址。

:::

<ConfigTabs>
<TabItem value="图形化配置">

在 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中使用[添加摄像头向导](#adding-a-camera-with-the-add-camera-wizard)逐个配置其他摄像头。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
mqtt: ...
cameras:
  back: ...
  front: ...
  side: ...
```

</TabItem>
</ConfigTabs>

:::note

如果摄像头下只配置了一个输入源（`input`），且没有为它分配 `detect` 功能，Frigate 会自动为它启用检测（`detect`）。即使你在配置里用 `detect` 的 `enabled: False` 禁用了目标检测，Frigate **仍然会解码视频流**，以支持画面变动检测、鸟瞰图、API 图像和其他功能。

如果你只打算用 Frigate 录制、不做目标识别，仍然建议配置一条低分辨率视频流并把它分配给 `detect` 功能，以减少解码所需的资源消耗。

:::

摄像头型号相关的设置请参阅[摄像头品牌特定配置](camera_specific.md)。

## 设置摄像头 PTZ 控制 {#setting-up-camera-ptz-controls}

:::warning

并非所有 PTZ 摄像头都支持 ONVIF——它是 Frigate 与摄像头通信所用的标准协议。有些摄像头使用私有协议做控制，Frigate 不支持这种方式。请查阅 [ONVIF 认证产品列表](https://www.onvif.org/conformant-products/)、摄像头文档或厂商网站，确认你的 PTZ 摄像头支持 ONVIF。同时，请确保摄像头已更新到最新固件。

:::

为摄像头配置 ONVIF 连接即可启用 PTZ 控制。

<ConfigTabs>
<TabItem value="图形化配置">

<FrigateConfigMock
  level="camera"
  section="onvif"
  :values="{ host: '10.0.10.10', port: 8000, user: 'admin', password: 'password' }"
  :targets="[
    { field: 'host', hint: '填写摄像头的 IP 地址，例如 10.0.10.10。' },
    { field: 'port', hint: '填写摄像头的 ONVIF 端口，例如 8000。' },
    { field: 'user', hint: '填写摄像头的 ONVIF 用户名，例如 admin。' },
    { field: 'password', hint: '填写摄像头的 ONVIF 密码。' },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml {4-8}
cameras:
  back:
    ffmpeg: ...
    onvif:
      host: 10.0.10.10
      port: 8000
      user: admin
      password: password
```

</TabItem>
</ConfigTabs>

ONVIF 连接成功后，即可在摄像头的界面中使用 PTZ 控制。

如果摄像头连接正常但认证失败，有两个可选字段可以帮忙：

- `tls_insecure`：跳过 TLS 证书校验，并以明文（`PasswordText`）而非哈希摘要（`PasswordDigest`）发送 ONVIF 密码。部分摄像头不接受摘要令牌，只接受明文。这会降低连接安全性，因此仅建议在可信的本地网络中启用。
- `ignore_time_mismatch`：ONVIF 认证令牌带时间戳，如果摄像头时钟与 Frigate 相差过大，摄像头会拒绝令牌。启用此项后 Frigate 会补偿时间偏差，让认证依然通过。推荐的做法是在摄像头和 Frigate 主机上启用 NTP 校时；此选项会略微削弱令牌校验，仅在“安全”环境中使用。

:::note

有些摄像头的 ONVIF 账号与设备管理员凭证是分开的。如果用管理员账号做 ONVIF 认证失败，可以尝试在摄像头固件中创建或启用专用的 ONVIF 用户。更多细节请查阅对应厂商的官方文档。

:::

:::tip

如果你的 ONVIF 摄像头不需要认证凭证，仍可能需要为 `user` 和 `password` 指定空字符串，例如 `user: ""` 和 `password: ""`。

:::

如果摄像头有多个 ONVIF 配置文件，可以用 `profile` 选项指定 PTZ 控制要使用哪一个，按令牌或名称匹配。未设置时，Frigate 会选择第一个包含有效 PTZ 配置的配置文件。查看 Frigate 调试日志（`frigate.ptz.onvif: debug`）可以看到摄像头可用的配置文件名称和令牌。

支持视野（FOV）内相对移动的 ONVIF 摄像头，还可以配置为自动追踪移动目标并把它保持在画面中央。自动追踪的设置方法请参阅[自动追踪](autotracking.md)。

## ONVIF PTZ 摄像头兼容情况 {#onvif-ptz-camera-recommendations}

下表中的可用与不可用情况来自用户反馈。如果你发现了某厂商或某款摄像头的特点或问题、且对其他人有帮助，欢迎发起拉取请求（pull request）把它补充进这张表。

在 [ONVIF 认证产品数据库](https://www.onvif.org/conformant-products/)的 FeatureList（功能列表）中，可以初步判断某款摄像头是否兼容 Frigate 的自动追踪功能。查看该摄像头是否列出了 `PTZRelative`、`PTZRelativePanTilt` 和 `PTZRelativeZoom`，这几项是实现自动追踪所必需的。不过要注意，有些摄像头虽然声称支持，实际仍可能无法正常响应；功能项缺失则意味着无法使用自动追踪（不过界面中的基础云台变焦控制也许仍可用）。除非下文确认某款摄像头可用，否则请避免选用数据库中查不到相关条目的摄像头。

| 品牌或具体型号               | PTZ 控制 | 自动追踪 | 备注                                                                                                                                                                                                                       |
| ---------------------------- | :------: | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amcrest                      |    ✅    |    ✅    | ⛔️ 一般来说 Amcrest 应该可以工作，但一些旧型号(如常见的 IP2M-841)不支持自动追踪                                                                                                                                            |
| Amcrest ASH21                |    ✅    |    ❌    | ONVIF 服务端口: 80                                                                                                                                                                                                         |
| Amcrest IP4M-S2112EW-AI      |    ✅    |    ❌    | 不支持 FOV 相对移动。                                                                                                                                                                                                      |
| Amcrest IP5M-1190EW          |    ✅    |    ❌    | ONVIF 端口: 80。不支持 FOV 相对移动。                                                                                                                                                                                      |
| Annke CZ504                  |    ✅    |    ✅    | 安克（Annke）官方支持提供了专用固件版本（[V5.7.1 build 250227](https://github.com/pierrepinon/annke_cz504/raw/refs/heads/main/digicap_V5-7-1_build_250227.dav)）以修复 ONVIF "TranslationSpaceFov" 问题 |
| Axis Q-6155E                 |    ✅    |    ❌    | ONVIF 服务端口：80；该摄像头不支持 MoveStatus 功能。                                                                                                                                                                       |
| Ctronics PTZ                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua                        |    ✅    |    ✅    | 部分低端大华（lite 系列、picoo 系列等）据报告不支持自动追踪。这些型号通常没有四位数字型号加机箱前缀和选项后缀（例如 DH-P5AE-PV vs DH-SD49825GB-HNR）。 |
| Dahua DH-SD2A500HB           |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua DH-SD49825GB-HNR       |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Dahua DH-P5AE-PV             |    ❌    |    ❌    |                                                                                                                                                                                                                            |
| Foscam                       |    ✅    |    ❌    | 一般支持 PTZ，但不支持相对移动。ONVIF 合规产品数据库中没有官方 ONVIF 认证和测试。                                                                                                                                           |
| Foscam R5                    |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Foscam SD4                   |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hanwha XNP-6550RH            |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hikvision                    |    ✅    |    ❌    | ONVIF 支持不完整(即使是最新固件 MoveStatus 也不会更新) - 在 HWP-N4215IH-DE 和 DS-2DE3304W-DE 型号上报告，但可能还有其他型号                                                                                                |
| Hikvision DS-2DE3A404IWG-E/W |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Reolink                      |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Speco O8P32X                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Sunba 405-D20X               |    ✅    |    ❌    | 原始型号和 4k 型号报告 ONVIF 支持不完整。怀疑所有型号都不兼容。                                                                                                                                                            |
| Tapo                         |    ✅    |    ❌    | 支持多种型号，ONVIF 服务端口: 2020                                                                                                                                                                                         |
| Uniview IPC672LR-AX4DUPK     |    ✅    |    ❌    | 固件声称支持 FOV 相对移动，但在发送 ONVIF 命令时摄像头实际上不会移动                                                                                                                                                       |
| Uniview IPC6612SR-X33-VG     |    ✅    |    ✅    | 保持`calibrate_on_startup`为`False`。有用户报告使用`absolute`缩放是有效的。                                                                                                                                                |
| Vikylin PTZ-2804X-I2         |    ❌    |    ❌    | ONVIF 支持不完整                                                                                                                                                                                                           |

## 设置摄像头分组 {#setting-up-camera-groups}

摄像头分组可以按共享的名称和图标把摄像头组织在一起，方便查看和筛选。始终存在一个包含全部摄像头的默认分组。

<ConfigTabs>
<TabItem value="图形化配置">

在实时监控面板上，点击主导航中的**铅笔图标**新建摄像头分组。然后配置分组名称、选择要包含的摄像头、挑选图标并设置显示顺序。

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  section="camera_groups"
  :values="{
    name: 'front',
    cameras: [
      { name: 'driveway_cam', enabled: true },
      { name: 'garage_cam', enabled: true },
      { name: 'back_yard', enabled: false },
    ],
  }"
  :steps="[
    {
      focus: '',
      label: '点击铅笔图标',
      hint: '在实时监控面板左侧的主导航中，点击铅笔图标打开摄像头分组弹窗。',
    },
    {
      focus: 'name',
      label: '填写名称',
      hint: '为分组设置一个名称（例如 front）。',
    },
    {
      focus: 'cameras',
      label: '选择摄像头',
      hint: '打开要加入该分组的摄像头开关。',
    },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
camera_groups:
  front:
    cameras:
      - driveway_cam
      - garage_cam
    icon: LuCar
    order: 0
```

</TabItem>
</ConfigTabs>

## 双向通话 {#two-way-audio}

请参阅[实时监控文档中的双向通话](/configuration/live/#two-way-talk)。
