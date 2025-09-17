---
layout: home

hero:
  name: "<div class='logo'></div>AI本地智能分析，"
  text: "守护您的安防监控"
  tagline: "Frigate 是一款基于实时 AI 目标检测技术的开源网络录像机（NVR）。所有视频分析都在您本地设备上完成，摄像头画面全程不会上传到云端，数据安全有保障。"
  actions:
    - theme: brand
      text: 立即入门
      link: /frigate
    - theme: alt
      text: 查看源码
      link: https://github.com/blakeblackshear/frigate/
  image:
    src: 'img/live.jpg'

---

<div style="text-align: center; margin-bottom: 3em; margin-top: 3em">
  <h1>功能特点</h1>
  <p>专为注重隐私的家庭自动化用户打造，Frigate究竟有何魅力？</p>
</div>
<ResponsiveGrid/>

<div style="text-align: center; margin-bottom: 3em; margin-top: 3em">
  <h1>他们怎么说</h1>
</div>

::: shareCard 3

```yaml
- name: 司波图
  desc: 一个真正属于我们自己的免订阅的无广告的想看多久就看多久的本地监控系统
  avatar: /assets/sbt.jpg
  link: https://www.bilibili.com/video/BV1F18QzzERD
  bgColor: "#FFB6C1"
  textColor: "#621529"

- name: 宅魂Kill
  desc: 强大，稳定，开源，安全
  avatar: /assets/zhaisoul.jpg
  link: https://github.com/ZhaiSoul
  bgColor: "#CBEAFA"
  textColor: "#6854A1"

- name: 瞳灵、
  desc: 难得一见的、新手可玩的开源NVR系统
  avatar: /assets/tl.jpg
```

:::

<div style="text-align: center; margin-bottom: 1.5em; margin-top: 5em">
  <h1>准备好安装了吗？</h1>
  <p>我们支持多种系统，看看有没有适合你的！</p>
</div>

::: navCard 3
```yaml
- name: unRAID
  desc: unRAID是一个可玩性超高的NAS系统，基于Slackware Linux开发。
  link: /frigate/installation#unraid
  img: https://cdn.craft.cloud/481d40bf-939a-4dc1-918d-b4d4b48b7c04/builds/9f9c5d25-f717-4e21-a124-9a76217b3dd0/artifacts/static/favicon/favicon.ico
  badge: 应用商店安装
  badgeType: tip

#- name: 飞牛 fnOS
#  desc: 飞牛fnOS是基于Debian开发的NAS系统，支持Docker。
#  img: https://www.fnnas.com/favicon.ico
#  badge: 应用商店安装
#  badgeType: tip
  
- name: 群辉DSM
  desc: 群辉是全球知名的NAS方案提供商，其DSM系统是使用最广泛的NAS系统。
  link: /frigate/installation.html#synology-nas-on-dsm-7
  img: https://fileres.synology.com/images/common/favicon/syno/favicon.ico
  badge: 通过容器安装
  badgeType: tip

- name: 威联通QNAP NAS
  desc: QNAP 专注于储存、网络及智能影音产品创新
  link: /frigate/installation.html#qnap-nas
  img: https://www.qnap.com.cn/i/images/favicon/favicon.png
  badge: 通过容器安装
  badgeType: tip
```
:::

::: center
上面没有列出你的系统？但只要你的系统支持<img src="/assets/docker-icon.ico" width="20" style="display: inline; margin: 0px 5px -5px 5px"/>[Docker](/frigate/installation#docker)，都可以安装！
:::

<div style="text-align: center; margin-bottom: 1.5em; margin-top: 5em">
  <h1>还有一些疑问？</h1>
  <p>点击下面的问题，看看我们的常见问题解答。</p>
</div>

::: center
<Question />
:::