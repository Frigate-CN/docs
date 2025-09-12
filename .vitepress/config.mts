import { defineConfig } from 'vitepress'
import { sidebar } from './sidebar.ts'
import { defineTeekConfig } from "vitepress-theme-teek/config"
import { vitepressPluginLegend } from 'vitepress-plugin-legend';

const teekConfig = defineTeekConfig({
  teekHome: false,
  markdown: {
    config: md => {
      md.use(vitepressPluginLegend);
    },
    image: {
      lazyLoading: true
    }
  },
  themeEnhance: {
    layoutSwitch: {
      defaultMode: "sidebarWidthAdjustableOnly",
    },
  },
  vitePlugins: {
    sidebar: false,
  },
  social: [
    {
      icon: "mdi:github",
      name: "GitHub",
      link: "https://github.com/frigate-CN/",
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><g fill="none"><path d="M11.5286 1.87149C11.5769 1.73005 11.5356 1.5733 11.4233 1.47452C11.0472 1.14247 10.0965 0.443125 8.66911 0.339708C7.07054 0.223769 6.08089 0.652279 5.58096 0.969951C5.36531 1.10676 5.35326 1.41748 5.55499 1.57422L9.62723 4.73936C9.98617 5.01807 10.5125 4.8604 10.6591 4.43003L11.5286 1.87149Z" fill="currentColor"/><path d="M1.49017 11.2664C1.32368 11.3781 1.24855 11.584 1.30235 11.7774C1.45724 12.3339 1.91868 13.4919 3.22833 14.5456C4.53797 15.5992 6.08738 15.7128 6.74962 15.6966C6.94764 15.692 7.12016 15.5617 7.17998 15.3724L9.79046 7.11064C9.97875 6.51425 9.31048 6.01386 8.79154 6.3626L1.49017 11.2664Z" fill="currentColor"/><path d="M3.39813 2.54827C3.27013 2.49773 3.12683 2.50607 3.00579 2.57193C2.52256 2.83488 1.28526 3.64506 0.647135 5.30947C0.154627 6.59222 0.328071 8.01085 0.463488 8.70463C0.508009 8.9314 0.747306 9.06218 0.962489 8.97824L8.79485 5.92024C9.35414 5.70181 9.35646 4.91111 8.7981 4.6899L3.39813 2.54827Z" fill="currentColor"/><path d="M15.0167 8.46843C15.243 8.62194 15.5528 8.48652 15.5922 8.21569C15.6961 7.49872 15.7861 6.25076 15.371 5.30933C14.8177 4.05487 13.8786 3.28133 13.433 2.9669C13.292 2.86766 13.1019 2.87786 12.9725 2.99241L10.9959 4.74541C10.6732 5.03154 10.7066 5.54492 11.0636 5.78746L15.0167 8.46936V8.46843Z" fill="currentColor"/><path d="M9.49413 15.1604C9.47372 15.3937 9.67128 15.5866 9.90409 15.5616C10.6531 15.4813 12.1918 15.1841 13.3447 14.0827C14.467 13.0109 14.832 11.7384 14.9382 11.2319C14.9669 11.0951 14.9326 10.9528 14.8445 10.8442L11.3886 6.57909C11.0143 6.11719 10.2681 6.34535 10.2162 6.93757L9.49366 15.1604H9.49413Z" fill="currentColor"/></g></svg>`,
      name: "CNB",
      link: "https://cnb.cool/frigate-cn"
    },
    {
      icon: `simple-icons:qq`,
      name: "QQ群",
      link: "https://qm.qq.com/q/uikrC4l46A",
    },
    {
      icon: "simple-icons:bilibili",
      name: "bilibili",
      link: "https://space.bilibili.com/3546894915602564",
    },
  ],
  footerInfo: {
    topMessage: ['本网站使用的 © Frigate 及相关商标（包括但不限于Logo）均为 <strong>Frigate, LLC</strong> 所有，并已获得其授权非商用使用许可。', '本站为非官方中文社区，非 Frigate 官方网站，不代表 Frigate 官方立场。'],
    bottomMessage: [`CDN 加速及安全防护由 <a href="https://edgeone.ai/zh?from=github" class="eo-logo"></a> 提供`],
    icpRecord: {
      name: "渝ICP备2025058994号-1",
      link: "http://beian.miit.gov.cn/",
    },
    copyright: {
      show: true,
      suffix: "Frigate中文社区",
    },
  },
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
  transformPageData(pageData) {
    const canonicalUrl = `https://docs.frigate-cn.video/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
      .replace(/\.html$/, '')

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'link',
      { rel: 'canonical', href: canonicalUrl }
    ])
  },
  cleanUrls: true,
  head:[
    //<meta name="baidu-site-verification" content="codeva-GVV3NnQtwh" />
    ["meta", { name: "baidu-site-verification", content: "codeva-GVV3NnQtwh" }],
    ["meta", { name: "keywords", content: "Frigate,Frigate NVR,Frigate 中文文档,Frigate 中文,Frigate 中文社区,Frigate 中文网,Frigate 中文教程,Frigate 教程,Frigate 入门,Frigate 使用,Frigate 配置,Frigate 安装,Frigate Docker,Frigate Home Assistant,Frigate HA,Frigate AI 视频监控,NVR 视频监控,网络视频监控,视频监控系统" }],
    ["meta", { name: "description", content: "Frigate 是一款基于实时 AI 目标检测技术的开源网络录像机（NVR）。所有视频分析都在您本地设备上完成，摄像头画面全程不会上传到云端，数据安全有保障。" }],
    ["meta", { property: "og:title", content: "Frigate 中文文档" }],
    ["meta", { property: "og:description", content: "Frigate 是一款基于实时 AI 目标检测技术的开源网络录像机（NVR）。所有视频分析都在您本地设备上完成，摄像头画面全程不会上传到云端，数据安全有保障。" }],
    ["meta", { property: "og:image", content: "https://docs.frigate-cn.video/img/logo.svg" }],
    ["link", { rel: "shortcut icon", href: "/img/favicon.ico", type: "image/x-icon" }],
    ["link", { rel: "icon", href: "/img/favicon.ico", type: "image/x-icon" }],
  ],
  sitemap: {
    hostname: 'https://docs.frigate-cn.video',
    xmlns: {
      xhtml: true,
      image: true,
      news: false,
      video: false
    },
    transformItems: (items) => {
      return items.map(item => {
        if (item.url.includes('/404') || item.url.includes('/zh/404')) {
          return null;
        }
        if (item.url === '') {
          item.img = {
            url: 'https://docs.frigate-cn.video/img/logo.svg',
            title: 'Frigate 中文文档',
          }
        }
        return item.url.replace(/\.html$/, '/'); // 移除网址最后的.html
      }).filter(item => item !== null);
    }
  },
  extends: teekConfig,
  srcDir: "docs",
  lang: "zh-CN",
  title: "Frigate中文文档",
  description: "Frigate 是一款基于实时 AI 目标检测技术的开源网络录像机（NVR）。所有视频分析都在您本地设备上完成，摄像头画面全程不会上传到云端，数据安全有保障。",
  locales: {
    root: {
      label: '简体中文',
      lang: 'zhCN'
    }
  },
  markdown: {
    // 开启行号
    lineNumbers: true,
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true,
    },
    // 更改容器默认值标题
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
  },
  themeConfig: {
    editLink: {
      pattern: 'https://cnb.cool/frigate-cn/docs/-/edit/main/docs/:path',
      text: '在 CNB 上编辑此页'
    },
    
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "上次更新时间",
    outline: {
      level: [2, 4],
      label: "本页导航",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true, // 启用详细视图
        disableQueryPersistence: false, // 允许查询持久化
        miniSearch: {
          options: {
            extractField: (document, fieldName) => {
              // 自定义字段提取逻辑
              if (fieldName === 'content') {
                return document.content;
              }
              return document[fieldName];
            },
          },
          searchOptions: {
            prefix: true, // 启用前缀搜索
            fuzzy: 0.2, // 模糊匹配阈值
          },
        },
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            resetButtonTitle: '重置',
            displayDetails: '显示详情',
            noResultsText: '没有找到结果',
            footer: {
              closeText: '关闭',
              closeKeyAriaLabel: '关闭搜索',
              navigateText: '导航',
              selectText: '选择',
            }
          },
        },
      },
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '文档', link: '/frigate' },
      { text: '官网', link: 'https://frigate.video/'},
      { text: '演示Demo', link: 'http://demo.frigate.video/'},
      {
        text: '<svg t="1755502773250" aria-hidden="true" style="display: initial; vertical-align: text-bottom; margin-right: 3px;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1652" width="20" height="20"><path d="M62.3104 51.2C30.208 51.2 4.2496 77.1584 4.2496 109.2096V747.52c0 32.0512 26.0096 58.0096 58.0608 58.0096h335.104l-8.96 47.2576A58.0096 58.0096 0 0 0 445.4912 921.6h516.1984c32.0512 0 58.0608-25.9584 58.0608-58.0096V225.28c0-32.0512-26.0096-58.0096-58.0608-58.0096h-441.856l-13.312-69.0176A58.0096 58.0096 0 0 0 449.536 51.2H62.3104zM445.44 863.5904l10.9568-58.0608h115.8656c36.4544 0 63.8464-33.1776 56.9856-68.9664l-11.4176-59.4432a408.7808 408.7808 0 0 0 98.816-55.296c38.656 29.8496 88.3712 48.9984 155.136 66.9184 6.9632-13.1584 21.248-34.56 31.8464-45.056-63.0272-14.592-111.616-30.464-149.1968-55.6032 38.0928-39.3728 67.584-88.3712 88.9856-148.8896h53.6064v-44.3392h-153.3952l-14.848-53.504h-45.312l14.848 53.504h-134.8096L530.9952 225.28h430.6944v638.3104H445.4912z m126.6176-424.448h219.904c-17.408 47.8208-41.728 86.8864-73.4208 118.4256-21.504-23.2448-37.9904-52.6336-50.688-90.9312l-43.8784 13.5168c16.128 45.8752 34.6624 80.7936 57.9072 108.3392-21.8624 15.5648-46.336 28.672-73.5232 39.5264l-36.352-188.8256zM87.552 573.44V324.1984h184.832v42.1888H137.9328v55.2448h125.1328v41.984H137.9328v67.84h139.264v41.984H87.552z m396.1344 0h-47.7696V481.28c0-19.456-1.024-32.0512-3.072-37.7344a26.368 26.368 0 0 0-26.5216-18.176 38.2976 38.2976 0 0 0-22.272 6.8096 34.7136 34.7136 0 0 0-13.6192 18.0224c-2.3552 7.4752-3.584 21.2992-3.584 41.472V573.44h-47.7184V392.9088H363.52v26.5216c15.7696-20.4288 35.584-30.6176 59.4944-30.6176 10.5472 0 20.1728 1.9456 28.928 5.7856a47.104 47.104 0 0 1 19.712 14.4384c4.5056 5.888 7.68 12.5952 9.3696 20.0704 1.792 7.4752 2.7136 18.176 2.7136 32.1536V573.44z" p-id="1653"></path></svg> 简体中文',
        items: [
          { text: '简体中文', link: '/' },
          { text: 'English', link: 'https://docs.frigate.video/', target: '_blank', },
        ]
      }
    ],
    logo: {
      light: '/img/logo.svg',
      dark: '/img/logo-dark.svg',
    },

    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/blakeblackshear/frigate' }
    ]
  }
})
