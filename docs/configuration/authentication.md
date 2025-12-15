---
id: authentication
title: 认证
---

# 认证

Frigate 在其数据库中存储用户信息。密码哈希使用行业标准 PBKDF2-SHA256 生成，迭代次数为 600,000 次。登录成功后，会生成一个带有过期日期的 JWT 令牌并设置为 cookie。Cookie 会根据需要自动刷新。这个 JWT 令牌也可以在 Authorization 头中作为 bearer 令牌传递。

用户可以在页面的设置 > 用户中进行管理。

以下端口可用于访问 Frigate 页面。

| 端口   | 描述                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `8971` | 经过认证的 页面 和 API。各类反向代理（例如 nginx）应使用此端口。                                                               |
| `5000` | 内部未经认证的 页面 和 API 访问。应该严格限制该端口的使用。一般用于 docker 网络内部，供与 Frigate 集成但不支持认证的服务使用。 |

## 初始设置 {#onboarding}

在启动时，会生成一个管理员用户和密码并打印在日志中。建议在首次登录后在设置 > 用户下为管理员账户设置新密码。

## 重置管理员密码 {#resetting-admin-password}

如果你被锁定在实例之外，你可以通过在配置文件中使用 `reset_admin_password` 设置来告诉 Frigate 在下次启动时重置管理员密码并将其打印在日志中。

```yaml
auth:
  reset_admin_password: true
```

## 登录失败速率限制 {#login-failure-rate-limiting}

为了限制暴力破解攻击的风险，登录失败时可以触发使用速率限制。这是通过 SlowApi 实现的，有效值的字符串表示法可在[文档](https://limits.readthedocs.io/en/stable/quickstart.html#examples)中找到。

例如，当失败次数超过以下限制时，`1/second;5/minute;20/hour` 将限制登录后台：

- 每秒 1 次
- 每分钟 5 次
- 每小时 20 次

重启 Frigate 将重置速率限制。

如果你在代理后面运行 Frigate，你需要设置 `trusted_proxies`，否则这些速率限制将应用于上游代理 IP 地址。这意味着暴力攻击将限制来自其他设备的登录尝试，并可能也会暂时将你锁定在实例之外。为了确保速率限制仅应用于请求实际来源的 IP 地址，你需要列出要信任的上游网络。在查找请求源 IP 地址时，这些受信任的代理会与 `X-Forwarded-For` 头进行对比。

如果你在同一个 Docker Compose 文件中运行反向代理和 Frigate，以下是你的认证配置可能的样子：

```yaml
auth:
  failed_login_rate_limit: '1/second;5/minute;20/hour'
  trusted_proxies:
    - 172.18.0.0/16 # <---- 这是内部 Docker Compose 网络的子网
```

## 会话有效期 {#session-length}

Frigate 系统默认的用户认证会话有效期为 24 小时。该设置决定了用户认证会话在需要刷新令牌前保持活跃的时长——超过此时限后，用户必须重新登录才能继续使用系统。

虽然默认值在安全性和用户体验之间取得了不错的平衡，但你可以根据具体的安全需求和使用偏好自定义这个时长。会话有效期以秒为单位进行配置。

默认值`86400`表示认证会话将在 24 小时后过期。其他配置示例：

- `0`：将会话有效期设为 0 意味着用户每次访问应用时都需要重新登录，或会在极短的立即超时后就需要重新认证
- `604800`：设置会话有效期为`604800`秒（7 天）意味着用户只需在 7 天内刷新令牌即可保持登录状态

```yaml
auth:
  session_length: 86400
```

## JWT 令牌密钥 {#jwt-token-secret}

JWT 令牌密钥需要保持安全。任何拥有此密钥的人都可以生成有效的 JWT 令牌来与 Frigate 进行认证。这应该是一个至少 64 个字符的加密随机字符串。

你可以使用 Python secret 库通过以下命令生成令牌：

```shell
python3 -c 'import secrets; print(secrets.token_hex(64))'
```

Frigate 按以下顺序查找 JWT 令牌密钥：

1. 名为 `FRIGATE_JWT_SECRET` 的环境变量
2. 名为 FRIGATE_JWT_SECRET 的文件，位于由环境变量`CREDENTIALS_DIRECTORY`指定的目录中（默认为 Docker Secrets 目录：/run/secrets/）。
3. Home Assistant 插件选项中的 `jwt_secret` 选项
4. 配置目录中的 `.jwt_secret` 文件

如果在启动时未找到密钥，Frigate 会生成一个并将其存储在配置目录中的 `.jwt_secret` 文件中。

更改密钥将使当前令牌失效。

## 代理配置 {#proxy-configuration}

Frigate 可以配置为利用常见上游认证代理（如 Authelia、Authentik、oauth2_proxy 或 traefik-forward-auth）的功能。

如果你正在使用上游代理的认证，你可能想要禁用 Frigate 的认证，因为 Frigate 数据库中的用户与通过代理认证的用户之间没有对应关系。另外，如果反向代理和 Frigate 之间的通信是通过不受信任的网络进行的，你应该在 `proxy` 配置中设置 `auth_secret`，并配置代理以将密钥值作为名为 `X-Proxy-Secret` 的头发送。假设这是一个不受信任的网络，你还需要[配置真实的 TLS 证书](tls.md)以确保流量不会被简单地嗅探来窃取密钥。

以下是如何禁用 Frigate 的认证并确保请求仅来自你已知代理的示例。

```yaml
auth:
  enabled: False

proxy:
  auth_secret: <一些随机的长字符串>
```

你可以使用以下代码生成随机密钥。

```shell
python3 -c 'import secrets; print(secrets.token_hex(64))'
```

### Header 映射 {#header-mapping}

如果你已禁用 Frigate 的认证，并且你的代理支持传递带有已认证用户名和/或权限组的头部，你可以使用 `header_map` 配置来指定头部名称，以便将其传递给 Frigate。例如，以下配置将映射 `X-Forwarded-User` 和 `X-Forwarded-Groups` 值。Header 名称不区分大小写。Header 头中可以包含多个值，但必须使用英文逗号分隔。

```yaml
proxy:
  ...
  separator: "|" # 此默认值为逗号，但Authentik使用管道符作为分隔符
  header_map:
    user: x-forwarded-user
    role: x-forwarded-groups
```

Frigate 支持**管理员**（`admin`） 和**成员**（`viewer`）以及**自定义**权限组（见下文）。当使用端口 `8971` 时，Frigate 验证这些头部，后续请求使用 `remote-user` 和 `remote-role` Header 进行授权。

可以提供默认权限组。映射的 `role` Header 中的任何值都将覆盖默认值。

```yaml
proxy:
  ...
  default_role: viewer
```

## 权限组映射

在某些环境中，上游身份提供者（如 OIDC、SAML、LDAP 等）并不会直接传递与 Frigate 兼容的权限组，而是传递一个或多个组声明（group claims）。为了处理这种情况，Frigate 支持通过`role_map`将上游的组名映射为 Frigate 的内部权限组（`admin`、`viewer`以及自定义权限组）。

```yaml
proxy:
  ...
  header_map:
    user: x-forwarded-user
    role: x-forwarded-groups
    role_map:
      admin:
        - sysadmins
        - access-level-security
      viewer:
        - camera-viewer
      operator:  # 自定义权限组映射
        - operators
```

在上述例子中：

- 如果代理传递的权限组 Header 中包含 sysadmins 或 access-level-security，该用户将被分配 admin 权限组。
- 如果代理传递的权限组 Header 中包含 camera-viewer，该用户将被分配 viewer 权限组。
- 如果代理传递的权限组 Header 中包含 operators，该用户将被分配 operator 自定义权限组。
- 如果没有匹配的映射，Frigate 将回退到配置的 default_role（若存在）。
- 如果未定义 role_map，Frigate 会假定权限组 Header 直接包含 admin、viewer 或一个自定义权限组名称。

### 端口注意事项 {#port-considerations}

**认证端口 (8971)**

- 完全支持头部映射。
- `remote-role` 头部决定用户的权限：
  - **admin** → 完全访问权限（用户管理、配置更改）。
  - **viewer** → 只读访问权限。
  - **自定义权限组**​ → 只读访问权限，仅能访问`auth.roles[role]`中设置的摄像头。
- 确保你的代理同时发送用户和权限组头部以正确执行权限组控制。

**未认证端口 (5000)**

- 忽略 Header 用于权限组控制。
- 所有请求都被视为匿名请求。
- `remote-role` 值被覆盖为管理员级别访问权限。
- 此设计确保在受信任网络内的未认证内部使用。

注意，默认情况下只允许以下 Header：

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

如果你想添加更多选项，可以通过 docker bind mount 在 `/usr/local/nginx/conf/proxy_trusted_headers.conf` 覆盖默认文件。请参考源代码中的默认文件格式。

### 登录页面重定向 {#login-page-redirection}

Frigate 优雅地执行登录页面重定向，应该可以与大多数认证代理配合使用。如果你的反向代理在 `401`、`302` 或 `307` 未授权响应时返回 `Location` 头部，Frigate 的前端将自动检测并重定向到该 URL。

### 自定义登出 URL {#custom-logout-url}

如果你的反向代理有专用的登出 URL，你可以使用 `logout_url` 配置选项指定。这将更新 UI 中"登出"链接的链接。

## 用户权限组 {#user-roles}

Frigate 支持用户权限组来控制对网页和 API 中某些功能的访问，例如管理用户或修改配置设置。权限组可以在数据库中分配给用户或通过代理头部分配，并在通过认证端口（`8971`）访问 UI 或 API 时强制执行。

### 支持的权限组 {#supported-roles}

- **admin**：完全访问所有功能，包括用户管理和配置。
- **viewer**：对网页和 API 的只读访问，包括查看摄像头、核查和回放。网页中的配置编辑器和设置不可访问。
- **自定义权限组**：任意权限组名称（支持字母数字、点号/下划线），并可配置特定的摄像头权限。这些权限组可扩展系统功能，实现细粒度的访问控制（例如，为特定摄像头设置名为 “operator” 的权限）。

### 自定义权限组与摄像头访问权限

成员（`viewer`）权限组在网页和 API 中会提供对所有摄像头的只读访问权限。而**自定义权限组**允许管理员将只读访问权限限制到指定的摄像头。每个权限组需指定一个允许访问的摄像头名称列表。当用户被分配了自定义权限组时，其账户权限与成员（`viewer`）类似，但只能查看指定摄像头的实时监控、回放/历史、浏览与导出功能。
后端 API 会在服务器端强制执行此限制（例如，对未授权的摄像头返回 403），前端网页也会相应过滤内容（例如，摄像头下拉菜单仅显示被允许的摄像头）。

### 权限组配置示例

```yaml
cameras:
  front_door:
    # ... 摄像头配置，此处省略
  side_yard:
    # ... 摄像头配置，此处省略
  garage:
    # ... 摄像头配置，此处省略

auth:
  enabled: true
  roles: # [!code ++]
    operator: # 自定义权限组的名称，仅支持英文数字 [!code ++]
      - front_door # [!code ++]
      - garage # Operator 权限组可以访问 front_door 和 garage 两个摄像头 [!code ++]
    neighbor: # 自定义权限组的名称 [!code ++]
      - side_yard # neighbor权限组可以访问 side_yard 摄像头 [!code ++]
```

如果希望某个用户能访问所有摄像头，只需为其分配成员（`viewer`）权限组即可。

### 管理用户权限组

1. 通过**admin** 用户在端口`8971`登录（推荐），或通过端口 5000 以未认证方式登录。
2. 进入设置页面。
3. 在设置 -> 用户里，从可用权限组（**管理员**、**成员**或**自定义权限组**）中选择并编辑用户的权限。
4. 在 权限组 部分，可添加/编辑/删除自定义权限组（通过开关选择摄像头）。删除某个权限组时，系统会自动将该权限组下的用户重新分配到成员（`views`）。

### 权限组强制执行 {#role-enforcement}

当使用认证端口（`8971`）时，通过 JWT 令牌或代理 Header（如 `remote-role`）验证权限组。

在内部**未认证**端口（`5000`）上，**不强制执行**权限组。所有请求都被视为**匿名**，授予相当于**管理员**权限组的访问权限，没有限制。

要使用基于权限组的访问控制，你必须直接或通过反向代理通过**认证端口（`8971`）**连接到 Frigate。

### 页面中的权限组可见性 {#role-visibility-in-the-ui}

- 通过端口 `8971` 登录时，你的**用户名和权限组**显示在**账户菜单**（底角）中。
- 使用端口 `5000` 时，UI 将始终显示用户名为"anonymous"，权限组为"admin"。

### 管理用户权限组 {#managing-user-roles}

1. 通过端口 `8971` 以**管理员**用户身份登录。
2. 导航到**设置 > 用户**。
3. 通过选择**admin**或**viewer**编辑用户的权限组。

## API 鉴权指南

### 获取 Bearer Token

要使用 Frigate API，需要先完成鉴权。按照以下步骤获取 Bearer Token：

#### 1. 登录

向`/login`发送 POST​ 请求，并提供你的凭证：

```bash
curl -i -X POST https://frigate_ip:8971/api/login \
  -H "Content-Type: application/json" \
  -d '{"user": "admin", "password": "your_password"}'
```

:::note

如果你的 Frigate 实例使用的是自签名证书，可能需要在命令中加入 `-k` 参数（例如：`curl -k -i -X POST ...`）。

:::

响应中会包含一个带有 JWT Token 的 Cookie。

#### 2. 使用 Bearer Token

获取到 Token 后，在后续请求的 Authorization​ 头部中加入该 Token：

```bash
curl -H "Authorization: Bearer <your_token>" https://frigate_ip:8971/api/profile
```

#### 3. Token 生命周期

- Token 在配置的会话时长内有效
- 访问 /auth 端点时，Token 会自动刷新
- 当用户密码更改时，Token 会失效
- 使用 /logout 可清除会话 Cookie
