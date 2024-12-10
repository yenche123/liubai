import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "留白记事",
  description: "留白文档中心",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

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
        link: "/install",
        items: [
          { text: "iPhone", link: "/install/iphone" },
          { text: "vivo", link: "/install/vivo" },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yenche123/liubai' }
    ]
  }
})
