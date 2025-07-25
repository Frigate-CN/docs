import type * as Preset from '@docusaurus/preset-classic';
import * as path from 'node:path';
import type { Config, PluginConfig } from '@docusaurus/types';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';

const config: Config = {
  title: 'Frigate中文文档',
  tagline: '具有实时目标检测功能的网络摄像机NVR',
  url: 'https://docs.frigate-cn.video',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'frigate-cn',
  projectName: 'frigate_cn',
  themes: ['@docusaurus/theme-mermaid', 'docusaurus-theme-openapi-docs'],
  markdown: {
    mermaid: true,
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh'],
    localeConfigs: {
      zh: {
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
  themeConfig: {
    algolia: {
      appId: '71C73Q4R6H',
      apiKey: '8433b09f8566a28a87c8ecf6ee930764',
      indexName: 'frigate_cn',
      contextualSearch: false
    },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    prism: {
      additionalLanguages: ['bash', 'json'],
    },
    languageTabs: [
      {
        highlight: 'python',
        language: 'python',
        logoClass: 'python',
      },
      {
        highlight: 'javascript',
        language: 'nodejs',
        logoClass: 'nodejs',
      },
      {
        highlight: 'javascript',
        language: 'javascript',
        logoClass: 'javascript',
      },
      {
        highlight: 'bash',
        language: 'curl',
        logoClass: 'curl',
      },
      {
        highlight: "rust",
        language: "rust",
        logoClass: "rust",
      },
    ],
    navbar: {
      title: 'Frigate',
      logo: {
        alt: 'Frigate',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          to: '/',
          activeBasePath: 'docs',
          label: '文档',
          position: 'left',
        },
        {
          href: 'https://frigate.video',
          label: '官网',
          position: 'right',
        },
        {
          href: 'http://demo.frigate.video',
          label: '演示Demo',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          label: 'Language / 语言',
          position: 'right',
          dropdownItemsAfter: [
            {
              label: 'English',
              href: 'https://docs.frigate.video',
            }
          ]
        },
        {
          href: 'https://github.com/blakeblackshear/frigate',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '社区',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/blakeblackshear/frigate',
            },
            {
              label: '论坛（英文）',
              href: 'https://github.com/blakeblackshear/frigate/discussions',
            },
            {
              label: 'bilibili',
              href: 'https://space.bilibili.com/3546894915602564',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Frigate中文社区<br><a href="https://beian.miit.gov.cn/" target="_blank">渝ICP备2025058994号-1</a><br>CDN 加速及安全防护由 <a href="https://edgeone.ai/zh?from=github"><img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" height="16" style="margin-top: 5px;" /></a> 提供`,
    },
  },
  plugins: [
    path.resolve(__dirname, 'plugins', 'raw-loader'),
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'classic', // configured for preset-classic
        config: {
          frigateApi: {
            specPath: 'static/frigate-api.yaml',
            outputDir: 'docs/integrations/api',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
              sidebarCollapsible: true,
              sidebarCollapsed: true,
            },
            showSchemas: true,
          } satisfies OpenApiPlugin.Options,
        },
      },
    ]
  ] as PluginConfig[],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          editUrl: 'https://github.com/frigate-cn/docs/edit/main/',
          sidebarCollapsible: false,
          docItemComponent: '@theme/ApiItem', // Derived from docusaurus-theme-openapi
        },

        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
};

export default async function createConfig() {
  return config;
}
