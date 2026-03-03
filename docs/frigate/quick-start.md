---
id: quick-start
title: 快速开始
---

# 🚀 快速开始

选择你的使用场景，我们将为你导航到最合适的安装文档。

## 📋 安装前准备

在开始安装之前，请确保你已经准备好了：

<DetailsCollapse title="查看完整准备清单" defaultOpen>

### 必要准备

- [ ] **运行环境**：支持 Docker 的操作系统（Linux、macOS，不推荐 Windows）
- [ ] **摄像头**：支持 RTSP 协议的网络摄像头 <InfoIcon href="/frigate/installation#摄像头" text="点击了解支持哪些摄像头"/>

### 推荐配置

- [ ] **内存**：至少 4GB RAM（推荐 8GB+）
- [ ] **CPU**：双核及以上（推荐四核），需支持 AVX 指令集 <InfoIcon text="部分虚拟机的虚拟 CPU 不支持 AVX 指令集，需直通核心给虚拟机"/>
- [ ] **存储**：建议超过 500G 硬盘用于存储录像文件
- [ ] **MQTT Broker**：用于与其他智能家居系统集成（可选）
- [ ] **GPU**：需要至少核显用于解码视频与 AI 加速 <InfoIcon text="Intel 必须要 6 代以上 CPU 核显<br>AMD 核显支持较差，很有可能不兼容</br>NVIDIA 不支持 GTX 10 系以下显卡"/>

### 额外 AI 加速（可选）

如果需要进行**大量**目标实时检测，可以使用额外硬件加速：<InfoIcon href="/frigate/planning_setup#number-of-cameras-and-simultaneous-activity" text="核显就能满足一般家庭的摄像头使用，一般不需要选择额外的 AI 加速。<br>点击图标可查看考量因素"/>
- [ ] AXREA 加速卡
- [ ] Google Coral USB/PCIe 加速卡
- [ ] NVIDIA GPU
- [ ] AMD GPU
- [ ] Hailo-8 加速卡

</DetailsCollapse>


## 🎯 我应该怎么安装？

根据你的使用场景，选择对应的安装方式：

::: navCard 3
```yaml
- name: Docker Compose
  desc: 最常见的安装方式，适合个人用户、树莓派、普通服务器
  link: /frigate/installation#docker-compose-generator
  img: /assets/docker-icon.ico
  badge: 推荐方案
  badgeType: tip

- name: Home Assistant OS
  desc: 已使用 Home Assistant OS 的用户，通过插件快速安装
  link: /frigate/installation#home-assistant-add-on
  img: https://www.home-assistant.io/images/favicon.ico
  badge: 插件安装
  badgeType: info

- name: 群晖 DSM
  desc: 群晖 NAS 用户，通过 Docker 容器安装
  link: /frigate/installation#synology-nas-on-dsm-7
  img: https://fileres.synology.com/images/common/favicon/syno/favicon.ico
  badge: 容器安装
  badgeType: info
```
:::

::: navCard 3
```yaml
- name: 威联通 QNAP
  desc: 威联通 NAS 用户，通过命令行安装
  link: /frigate/installation#qnap-nas
  img: https://www.qnap.com.cn/i/images/favicon/favicon.png
  badge: 命令行安装
  badgeType: info

- name: unRAID
  desc: unRAID 用户，通过应用商店安装
  link: /frigate/installation#unraid
  img: https://cdn.craft.cloud/481d40bf-939a-4dc1-918d-b4d4b48b7c04/builds/9f9c5d25-f717-4e21-a124-9a76217b3dd0/artifacts/static/favicon/favicon.ico
  badge: 应用商店安装
  badgeType: info

- name: Kubernetes
  desc: 企业级部署，使用 Helm Chart 安装
  link: /frigate/installation#kubernetes
  img: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg
  badge: 企业部署
  badgeType: info
```
:::


## ✅ 完成安装后

安装完成后，你可以继续以下步骤：

::: navCard 3
```yaml
- name: 摄像头配置
  desc: 接入 Frigate 前先配置摄像头的一些参数，以获得更好的体验
  link: /frigate/camera_setup
  img: /img/logo.svg
  badge: 下一步
  badgeType: tip

- name: 入门指南
  desc: 了解 Frigate 的基本功能和配置方法
  link: /guides/getting_started#configuring-frigate
  img: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg
  badge: 必读
  badgeType: tip

- name: 配置参考
  desc: 完整的配置选项说明和高级设置
  link: /configuration/
  img: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yaml/yaml-original.svg
```
:::

## ❓ 常见问题

<DetailsCollapse title="安装后无法访问 Web 界面？">

请检查以下几点：
- [ ] 容器是否正常运行：`docker ps`
- [ ] 端口是否正确映射（默认 8971）
- [ ] 是否是使用 `https://` 访问（8971端口默认要求使用https）
- [ ] 防火墙是否放行端口
- [ ] 浏览器是否使用了正确的 IP 和端口

</DetailsCollapse>

<DetailsCollapse title="如何查看容器日志？">

```bash
docker logs -f frigate
```

这会实时显示 Frigate 的运行日志，可以帮助你排查问题。

</DetailsCollapse>

<DetailsCollapse title="如何更新 Frigate？">

详见 [更新指南](/frigate/updating)

</DetailsCollapse>

<DetailsCollapse title="需要更多帮助？">

查看我们的 [常见问题解答](/troubleshooting/faqs) 或 [故障排除](/troubleshooting/) 文档。

</DetailsCollapse>
