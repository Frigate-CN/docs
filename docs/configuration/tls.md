---
id: tls
title: TLS安全传输
---

# TLS安全传输

Frigate 内置的 NGINX 服务器支持 TLS 证书。默认情况下，Frigate 会生成一个自签名证书，用于端口 `8971`。Frigate 的设计初衷是让你能够轻松使用自己偏好的工具来管理证书。

Frigate 通常运行在负责为多个服务管理 TLS 证书的反向代理之后。这种情况下，你可能需要将反向代理配置为允许自签名证书，或者你也可以在 Frigate 的配置中禁用 TLS。然而，如果你是在一个与代理分离的专用设备上运行 Frigate，或者你将 Frigate 直接暴露在互联网上，那么你可能需要使用有效的证书来配置 TLS。

在许多部署场景中，TLS 并非必需。你可以通过以下 YAML 配置在配置文件中禁用 TLS：

## 禁用TLS

在配置文件中添加以下内容即可禁用TLS：

```yaml
tls:
  enabled: False
```

## 证书配置 {#certificates}

### 基本配置

TLS 证书可通过绑定挂载（`bind mount`）或 `Docker 卷`挂载到 `/etc/letsencrypt/live/frigate` 目录。

```yaml
frigate:
  volumes:
    - /证书目录路径:/etc/letsencrypt/live/frigate:ro
```

目录结构要求：
- 私钥文件必须命名为`privkey.pem`
- 证书文件必须命名为`fullchain.pem`

### Certbot用户注意
由于Certbot使用符号链接，需额外挂载archive目录：

```yaml
frigate:
  volumes:
    - /etc/letsencrypt/live/your.fqdn.net:/etc/letsencrypt/live/frigate:ro
    - /etc/letsencrypt/archive/your.fqdn.net:/etc/letsencrypt/archive/your.fqdn.net:ro
```

## 证书自动更新

Frigate会每分钟比对证书指纹，当检测到变更时自动重载NGINX配置。使用有效证书时，建议将8971端口映射到443端口：

:::warning
如果你在中国大陆地区，家用宽带运营商会屏蔽掉`80`和`443`等端口，这种情况建议换为其他端口，例如`1443`
:::

```yaml
frigate:
  ports:
    - "443:8971" # <- 左边为宿主机端口，右边为容器端口。需要注意国内家用宽带无法使用443端口
```

## ACME验证支持

Frigate支持托管ACME验证文件（HTTP验证方式），需将验证文件挂载到：

```
/etc/letsencrypt/www
```
