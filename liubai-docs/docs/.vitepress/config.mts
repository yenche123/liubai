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

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
      {
        text: "欢迎",
        items: [
          { text: "简介", link: "/what-is-liubai" }
        ]
      },
      {
        text: "安装",
        link: "/install/index",
        items: [
          { text: "iPhone", link: "/install/iphone" },
          { text: "vivo", link: "/install/vivo" },
        ]
      }
    ],

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
