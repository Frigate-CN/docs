---
id: notifications
title: 通知功能
---

# 通知功能

:::warning

注意，受限于 Google 相关服务在中国大陆地区被屏蔽，该功能可能**无法在中国大陆地区使用**。

如有手机通知的需求，建议使用 MQTT 配合 Home Assistant 通知功能。

:::

Frigate 采用 [WebPush 协议](https://web.dev/articles/push-notifications-web-push-protocol)实现原生通知功能，该协议使用 [VAPID 规范](https://tools.ietf.org/html/draft-thomson-webpush-vapid)通过加密方式向网页应用推送通知。

:::info

推送通知需要 Frigate 服务器能够访问浏览器供应商的推送服务（如 Google FCM、Mozilla autopush）。详见[网络需求](/frigate/network_requirements#push-notifications)。

:::

## 设置通知功能 {#setting-up-notifications}

使用通知功能需满足以下条件：

- 必须以安全的 `https` 连接访问 Frigate，并已作为 Frigate 用户登录（参见[认证文档](/configuration/authentication)）
- 需使用支持的浏览器（目前已知 Chrome、Firefox 和 Safari 支持）
- 如需外部接收通知，Frigate 必须可从外部访问
- iOS 设备需在「设置 > Apps > Safari > 高级 > 功能」中启用通知开关

### 配置 {#configuration}

启用通知功能并填写必要字段。

可选修改默认通知冷却时间。冷却时间也可按摄像头单独覆盖。

以下情况将阻止通知发送：

- 全局冷却时间未过（自任意摄像头上次通知以来）
- 特定摄像头的冷却时间未过

#### 全局通知 {#global-notifications}

<ConfigTabs>
<TabItem value="图形化配置">

在全局配置的 **通知** 部分开启通知，设置通知邮箱与冷却时间。

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  level="global"
  section="notifications"
  :values="{ enabled: true, email: 'johndoe@gmail.com', cooldown: 10 }"
  :targets="[
    { field: 'enabled', hint: '开启通知功能。' },
    { field: 'email', hint: '填写用于接收通知的邮箱。' },
    { field: 'cooldown', hint: '任意摄像头发送下一条通知前等待的秒数。' },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
notifications:
  enabled: True
  email: "johndoe@gmail.com"
  cooldown: 10 # 任意摄像头发送下一条通知前等待 10 秒
```

</TabItem>
</ConfigTabs>

#### 按摄像头通知 {#per-camera-notifications}

```yaml
cameras:
  doorbell:
    ...
    notifications:
      enabled: True
      cooldown: 30 # 门铃摄像头发送下一条通知前等待 30 秒
```

### 设备注册 {#registration}

启用通知后，在所有希望接收通知的设备上点击 `注册此设备` 按钮，注册后台工作进程。完成后需重启 Frigate，然后通知将开始发送。

:::warning

每次注册都绑定到你所登录的 Frigate 用户账户，因此你必须通过安全连接到认证端口（`8971`）进行注册。反向代理和隧道应指向端口 `8971`。

:::

## 支持的通知类型 {#supported-notifications}

当前仅支持核查警报通知，更多通知类型将在未来添加。

:::note
目前仅 Chrome 支持带图片的通知，Safari 和 Firefox 仅显示标题和文字内容。
:::

## 降低通知延迟 {#reduce-notification-latency}

不同平台处理通知的方式各异，可能需要调整设置以获得最佳效果。

### Android 设备 {#android}

多数安卓手机具有电池优化设置。为确保可靠接收通知，建议为浏览器（Chrome/Firefox）禁用电池优化。若以 PWA 形式运行 Frigate，也需同时禁用 Frigate 应用的电池优化。

## 通知常见问题 {#notifications-faq}

### 如何调试通知问题？ {#how-do-i-debug-notifications-issues}

推送通知涉及 Frigate、你的浏览器以及浏览器厂商的推送服务，因此建议从服务器端向外排查。

1. 在 `logger` 配置中添加 `frigate.comms.webpush: debug` 以启用推送客户端的调试日志。更改后重启 Frigate。

   ```yaml
   logger:
     default: info
     logs:
       # highlight-next-line
       frigate.comms.webpush: debug
   ```

   这些日志会准确显示通知在何处停止，包括：
   - `Email must be provided for push notifications to be sent` 表示全局 `email` 字段为空，将不会发送任何内容。
   - `Sending test notification` 和 `Sending push notification for <camera>, review ID <id>` 表示 Frigate 已将消息交给推送服务。
   - `Skipping notification for <camera> - in global cooldown period`（或 `camera-specific cooldown period`）表示你的[冷却时间](#configuration)值抑制了通知。
   - `Notifications for <camera> are currently suspended` 表示通知已从 <NavPath path="设置 > 通知" /> 或 MQTT 挂起。
   - `Notification endpoint expired for <user>, received 410` 表示该设备的订阅不再有效，必须重新注册。
   - `Failed to send notification to <user> :: <status>` 表示推送服务拒绝了消息。`401` 或 `403` 通常指向 VAPID 或 `email` 问题，`5xx` 是推送服务端的问题。
   - 如果警报发生时完全没有看到任何消息，说明通知从未被排队。确认确实创建了**警报**（检测不会发送通知），并且通知在全局和该摄像头级别都已启用。

2. 核实最常见的几个基本问题：
   - Frigate 必须通过 `https` 访问，且证书被你的设备信任。否则浏览器会静默拒绝注册服务工作线程，自签名证书如果未安装为受信任证书也会失败。
   - 在 iOS 上，通知仅在通过**分享 > 添加到主屏幕**将 Frigate 安装到主屏幕并从此图标打开时才有效。Safari 和 Chrome 标签页无法在 iOS 上接收 Web 推送。
   - 每台设备必须单独注册，注册后必须重启 Frigate 才能发送任何内容，包括测试通知。
   - Frigate 服务器需要出站互联网访问浏览器厂商的推送服务。参见[网络要求](/frigate/network_requirements#push-notifications)。

3. 从界面测试。使用 <NavPath path="设置 > 通知" /> 中的 `发送测试通知` 按钮。如果日志显示 `Sending test notification` 但设备上未收到，问题出在推送服务和你的设备之间，而非 Frigate。

4. 在未收到通知的设备上检查浏览器端：
   - 确认浏览器或操作系统设置中站点通知权限为**允许**，且专注/勿扰模式未隐藏通知。
   - 在桌面浏览器中，打开开发者工具 > 应用程序 > 服务工作线程，确认 `notifications-worker.js` 已注册并激活。注销并重新注册设备将重建损坏的订阅。
   - 检查浏览器控制台和反向代理日志，查找加载 `/notifications-worker.js` 或 `/api/notifications/register` 失败的错误。

### 为什么通知在正常工作一段时间后停止？ {#why-did-notifications-stop-arriving-after-working-for-a-while}

推送订阅由浏览器厂商签发，可能被撤销，最常见的情况是浏览器更新后、清除站点数据后或设备长时间离线时。发生这种情况时，设备在 Frigate 中仍然显示为已注册，但推送服务会拒绝消息。调试日志会显示 `Notification endpoint expired` 以及 `404` 或 `410` 状态。

从 <NavPath path="设置 > 通知" /> 中注销并重新注册受影响的设备，然后重启 Frigate。

### 为什么某个特定摄像头收不到通知？ {#why-am-i-not-getting-notifications-for-one-specific-camera}

按顺序排查：

- 通知仅针对**警报**发送。如果摄像头产生的是检测结果，请调整摄像头的 `review > alerts > labels`，使你要关注的目标被归类为警报。
- 确认摄像头在 <NavPath path="设置 > 摄像头配置 > 通知" /> 中已启用通知。
- 检查摄像头的 `cooldown` 值，并记住全局冷却时间适用于所有摄像头。繁忙的摄像头可能消耗全局冷却时间并抑制较安静的摄像头。
- 如果启用了带角色的[认证](/configuration/authentication)，用户只能收到其角色所授权摄像头的通知。
