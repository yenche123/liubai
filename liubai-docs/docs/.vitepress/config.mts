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
      { text: "网页版", link: "https://my.liubai.cc" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "欢迎",
          items: [
            { text: "简介", link: "/guide/what-is-liubai" },
            { text: "社区", link: "/guide/community" }
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
          text: "常见问题",
          link: "/guide/faq/"
        },
        {
          text: "条款",
          collapsed: true,
          items: [
            { text: "服务协议", link: "/guide/rules/service-terms" },
            { text: "隐私政策", link: "/guide/rules/privacy-policy" },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yenche123/liubai' }
    ],

    footer: {
      copyright: "Copyright  2024 <a href='https://my.liubai.cc'>Liubai</a>",
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    }
  },
  lastUpdated: true,
})
