import { defineConfig, loadEnv } from 'vitepress'

const nodeEnv = process.env.NODE_ENV
const _env = loadEnv(nodeEnv ?? "", process.cwd())

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
      { 
        text: "文章", 
        link: "/article/2025/labour-day", 
        activeMatch: "/(tool-review|article)/"
      },
      { text: "网页版", link: "https://my.liubai.cc" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "欢迎",
          items: [
            { text: "简介", link: "/guide/what-is-liubai" },
            { text: "社区", link: "/guide/community" },
            { text: "AI 说明书", link: "/guide/three-assistants" },
            { 
              text: "亮点",
              link: "/guide/impressive",
              items: [
                {
                  text: "智能口袋",
                  link: "/guide/intelligent-pocket",
                },
                {
                  text: "离线可用",
                  link: "/guide/offline",
                },
                {
                  text: "Markdown 支持",
                  link: "/guide/markdown-support",
                },
                {
                  text: "同步和备份",
                  link: "/guide/sync-and-backup",
                },
                {
                  text: "隐私保护",
                  link: "/guide/privacy",
                },
                {
                  text: "多设备、全平台",
                  link: "/guide/multi-devices",
                }
              ]
            }
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
                { text: "iQOO", link: "/guide/install/iQOO" },
                { text: "OPPO", link: "/guide/install/oppo" },
                { text: "Realme", link: "/guide/install/realme" },
                { text: "三星", link: "/guide/install/samsung" },
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
            },
            {
              text: "IDE",
              link: "/guide/ide/",
              collapsed: true,
              items: [
                { text: "如何使用插件", link: "/guide/ide/how-to-use-vscode-ext" },
                { text: "Cursor", link: "/guide/ide/cursor" },
                { text: "Windsurf", link: "/guide/ide/windsurf" },
                { text: "VS Code", link: "/guide/ide/vscode" },
                { text: "VSCodium", link: "/guide/ide/vscodium" },
                { text: "Trae", link: "/guide/ide/trae" },
                { text: "github.dev", link: "/guide/ide/github-dev" },
                { text: "cnb.cool", link: "/guide/ide/cnb-cool" },
                { text: "Project IDX", link: "/guide/ide/project-idx" },
                { text: "gitpod.io", link: "/guide/ide/gitpod-io" },
                { text: "vscode.dev", link: "/guide/ide/vscode-dev" },
              ]
            }
          ]
        },
        {
          text: "连接",
          link: "/guide/connect/",
          items: [
            { text: "WPS", link: "/guide/connect/wps" },
            { text: "钉钉", link: "/guide/connect/dingtalk" },
            { text: "维格云", link: "/guide/connect/vika" },
          ]
        },
        {
          text: "提问箱",
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
      ],

      "/article/": [
        {
          text: "地图能力",
          link: "/article/2025/labour-day",
        },
        {
          text: "系统二",
          link: "/article/2025/system-two"
        },
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

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            }
          }
        }
      }
    },

    outline: {
      level: [2, 3],
      label: "大纲"
    },

    footer: {
      copyright: "Copyright © 2025 <a href='https://my.liubai.cc'>Liubai</a>",
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换至浅色模式",
    darkModeSwitchTitle: "切换至深色模式",
    sidebarMenuLabel: "目录",
    returnToTopLabel: "回到顶部",
  },

  lastUpdated: true,

  markdown: {
    image: {
      lazyLoading: true,
    }
  },


  transformHead(context) {
    if(nodeEnv !== "production") return

    const umamiSrc = _env.VITE_UMAMI_SRC
    const umamiId = _env.VITE_UMAMI_ID
    if(!umamiSrc || !umamiId) return

    return [

      // for umami
      [
        "script",
        {
          "defer": "true",
          "src": umamiSrc,
          "data-website-id": umamiId
        }
      ]

    ]
  },

})
