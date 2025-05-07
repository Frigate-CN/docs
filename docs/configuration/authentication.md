---
id: authentication
title: 认证
---

# 认证

Frigate 在其数据库中存储用户信息。密码哈希使用行业标准 PBKDF2-SHA256 生成，迭代次数为 600,000 次。登录成功后，会生成一个带有过期日期的 JWT 令牌并设置为 cookie。Cookie 会根据需要自动刷新。这个 JWT 令牌也可以在 Authorization 头中作为 bearer 令牌传递。

用户可以在 UI 的设置 > 用户中进行管理。

以下端口可用于访问 Frigate Web UI。

| 端口   | 描述                                                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `8971` | 经过认证的 UI 和 API。反向代理应使用此端口。                                                                                                                                              |
| `5000` | 内部未经认证的 UI 和 API 访问。对此端口的访问应该受限。旨在用于 docker 网络内部，供与 Frigate 集成但不支持认证的服务使用。 |

## 初始设置

在启动时，会生成一个管理员用户和密码并打印在日志中。建议在首次登录后在设置 > 用户下为管理员账户设置新密码。

## 重置管理员密码

如果您被锁定在实例之外，您可以通过在配置文件中使用 `reset_admin_password` 设置来告诉 Frigate 在下次启动时重置管理员密码并将其打印在日志中。

```yaml
auth:
  reset_admin_password: true
```

## 登录失败速率限制

为了限制暴力攻击的风险，登录失败时可以使用速率限制。这是通过 SlowApi 实现的，有效值的字符串表示法可在[文档](https://limits.readthedocs.io/en/stable/quickstart.html#examples)中找到。

例如，当失败次数超过以下限制时，`1/second;5/minute;20/hour` 将限制登录端点：

- 每秒 1 次
- 每分钟 5 次
- 每小时 20 次

重启 Frigate 将重置速率限制。

如果您在代理后面运行 Frigate，您需要设置 `trusted_proxies`，否则这些速率限制将应用于上游代理 IP 地址。这意味着暴力攻击将限制来自其他设备的登录尝试，并可能暂时将您锁定在实例之外。为了确保速率限制仅应用于请求实际来源的 IP 地址，您需要列出要信任的上游网络。在查找请求源 IP 地址时，这些受信任的代理会与 `X-Forwarded-For` 头进行对比。

如果您在同一个 Docker Compose 文件中运行反向代理和 Frigate，以下是您的认证配置可能的样子：

```yaml
auth:
  failed_login_rate_limit: "1/second;5/minute;20/hour"
  trusted_proxies:
    - 172.18.0.0/16 # <---- 这是内部 Docker Compose 网络的子网
```

## JWT 令牌密钥

JWT 令牌密钥需要保持安全。任何拥有此密钥的人都可以生成有效的 JWT 令牌来与 Frigate 进行认证。这应该是一个至少 64 个字符的加密随机字符串。

您可以使用 Python secret 库通过以下命令生成令牌：

```shell
python3 -c 'import secrets; print(secrets.token_hex(64))'
```

Frigate 按以下顺序查找 JWT 令牌密钥：

1. 名为 `FRIGATE_JWT_SECRET` 的环境变量
2. `/run/secrets/` 中名为 `FRIGATE_JWT_SECRET` 的 docker 密钥
3. Home Assistant 插件选项中的 `jwt_secret` 选项
4. 配置目录中的 `.jwt_secret` 文件

如果在启动时未找到密钥，Frigate 会生成一个并将其存储在配置目录中的 `.jwt_secret` 文件中。

更改密钥将使当前令牌失效。

## 代理配置

Frigate 可以配置为利用常见上游认证代理（如 Authelia、Authentik、oauth2_proxy 或 traefik-forward-auth）的功能。

如果您正在使用上游代理的认证，您可能想要禁用 Frigate 的认证，因为 Frigate 数据库中的用户与通过代理认证的用户之间没有对应关系。另外，如果反向代理和 Frigate 之间的通信是通过不受信任的网络进行的，您应该在 `proxy` 配置中设置 `auth_secret`，并配置代理以将密钥值作为名为 `X-Proxy-Secret` 的头发送。假设这是一个不受信任的网络，您还需要[配置真实的 TLS 证书](tls.md)以确保流量不会被简单地嗅探来窃取密钥。

以下是如何禁用 Frigate 的认证并确保请求仅来自您已知代理的示例。

```yaml
auth:
  enabled: False

proxy:
  auth_secret: <一些随机的长字符串>
```

您可以使用以下代码生成随机密钥。

```shell
python3 -c 'import secrets; print(secrets.token_hex(64))'
```

### 头部映射

如果您已禁用 Frigate 的认证，并且您的代理支持传递带有已认证用户名和/或角色的头部，您可以使用 `header_map` 配置来指定头部名称，以便将其传递给 Frigate。例如，以下配置将映射 `X-Forwarded-User` 和 `X-Forwarded-Role` 值。头部名称不区分大小写。

```yaml
proxy:
  ...
  header_map:
    user: x-forwarded-user
    role: x-forwarded-role
```

Frigate 支持 `admin` 和 `viewer` 两种角色（见下文）。当使用端口 `8971` 时，Frigate 验证这些头部，后续请求使用 `remote-user` 和 `remote-role` 头部进行授权。

可以提供默认角色。映射的 `role` 头部中的任何值都将覆盖默认值。

```yaml
proxy:
  ...
  default_role: viewer
```

### 端口注意事项

**认证端口 (8971)**

- 完全支持头部映射。
- `remote-role` 头部决定用户的权限：
  - **admin** → 完全访问权限（用户管理、配置更改）。
  - **viewer** → 只读访问权限。
- 确保您的代理同时发送用户和角色头部以正确执行角色控制。

**未认证端口 (5000)**

- 忽略头部用于角色控制。
- 所有请求都被视为匿名请求。
- `remote-role` 值被覆盖为管理员级别访问权限。
- 此设计确保在受信任网络内的未认证内部使用。

注意，默认情况下只允许以下头部：

```
Remote-User
Remote-Groups
Remote-Email
Remote-Name
X-Forwarded-User
X-Forwarded-Groups
X-Forwarded-Email
X-Forwarded-Preferred-Username
X-authentik-username
X-authentik-groups
X-authentik-email
X-authentik-name
X-authentik-uid
```

如果您想添加更多选项，可以通过 docker bind mount 在 `/usr/local/nginx/conf/proxy_trusted_headers.conf` 覆盖默认文件。请参考源代码中的默认文件格式。

### 登录页面重定向

Frigate 优雅地执行登录页面重定向，应该可以与大多数认证代理配合使用。如果您的反向代理在 `401`、`302` 或 `307` 未授权响应时返回 `Location` 头部，Frigate 的前端将自动检测并重定向到该 URL。

### 自定义登出 URL

如果您的反向代理有专用的登出 URL，您可以使用 `logout_url` 配置选项指定。这将更新 UI 中"登出"链接的链接。

## 用户角色

Frigate 支持用户角色来控制对 UI 和 API 中某些功能的访问，例如管理用户或修改配置设置。角色可以在数据库中分配给用户或通过代理头部分配，并在通过认证端口（`8971`）访问 UI 或 API 时强制执行。

### 支持的角色

- **admin**：完全访问所有功能，包括用户管理和配置。
- **viewer**：对 UI 和 API 的只读访问，包括查看摄像头、核查和回放。UI 中的配置编辑器和设置不可访问。

### 角色强制执行

当使用认证端口（`8971`）时，通过 JWT 令牌或代理头部（如 `remote-role`）验证角色。

在内部**未认证**端口（`5000`）上，**不强制执行**角色。所有请求都被视为**匿名**，授予相当于**管理员**角色的访问权限，没有限制。

要使用基于角色的访问控制，您必须直接或通过反向代理通过**认证端口（`8971`）**连接到 Frigate。

### UI 中的角色可见性

- 通过端口 `8971` 登录时，您的**用户名和角色**显示在**账户菜单**（底角）中。
- 使用端口 `5000` 时，UI 将始终显示用户名为"anonymous"，角色为"admin"。

### 管理用户角色

1. 通过端口 `8971` 以**管理员**用户身份登录。
2. 导航到**设置 > 用户**。
3. 通过选择**admin**或**viewer**编辑用户的角色。