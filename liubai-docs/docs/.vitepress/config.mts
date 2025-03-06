import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "zh-CN",
  title: "留白记事",
  description: "AI Native + Local First 的超级效率工具",
  head: [
    ['link', { rel: 'icon', href: '/logo_512x512_v2.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo_512x512_v2.png' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: "/logo_512x512_v2.png",
      dark: "/logo_512x512_v2.png",
    },

    nav: [
      { text: "指南", link: "/guide/what-is-liubai", activeMatch: "/guide/" },
      { text: "文章", link: "/article/2024/supercharge-yourself", activeMatch: "/article/" },
      { text: "网页版", link: "https://my.liubai.cc" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "欢迎",
          items: [
            { text: "简介", link: "/guide/what-is-liubai" },
            { text: "社区", link: "/guide/community" },
            { text: "AI 说明书", link: "/guide/three-assistants" }
          ]
        },
        {
          text: "安装",
          link: "/guide/install/",
          items: [
            {
              text: "手机",
              collapsed: true,
              items: [
                { text: "华为", link: "/guide/install/huawei" },
                { text: "iPhone", link: "/guide/install/iphone" },
                { text: "OPPO", link: "/guide/install/oppo" },
                { text: "Realme", link: "/guide/install/realme" },
                { text: "vivo", link: "/guide/install/vivo" },
                { text: "小米", link: "/guide/install/xiaomi" },
              ]
            },
            {
              text: "电脑",
              collapsed: true,
              items: [
                { text: "Mac", link: "/guide/install/mac" },
                { text: "Windows", link: "/guide/install/windows" },
              ]
            }
          ]
        },
        {
          text: "开发与部署",
          collapsed: true,
          items: [
            { text: "快速构建", link: "/guide/development/quick-build" },
            { text: "API文档", link: "/guide/development/api-docs" },
            { text: "提问箱", link: "/guide/faq/" }
          ]
        },
        {
          text: "条款",
          collapsed: true,
          items: [
            { text: "服务协议", link: "/guide/rules/service-terms" },
            { text: "隐私政策", link: "/guide/rules/privacy-policy" },
          ]
        }
      ],

      "/article": [
        {
          text: "使用 devbox 实现 amr 转 mp3",
          link: "/article/2025/devbox-voice-input"
        },
        {
          text: "在微信中使用多个 AI",
          link: "/article/2024/how-to-use-multi-ai-on-wechat"
        },
        {
          text: "开篇",
          link: "/article/2024/supercharge-yourself"
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yenche123/liubai' }
    ],

    footer: {
      copyright: "Copyright © 2025 <a href='https://my.liubai.cc'>Liubai</a>",
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    editLink: {
      pattern: "https://github.com/yenche123/liubai/tree/cool/liubai-docs/docs/:path",
      text: "在 GitHub 上编辑此页面",
    },
  },
  lastUpdated: true,

  markdown: {
    image: {
      lazyLoading: true,
    }
  },

})