import { defineConfig } from 'vite'
import { resolve } from "path"
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import mkcert from 'vite-plugin-mkcert'
import { compression as viteCompression } from 'vite-plugin-compression2'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import Inspect from 'vite-plugin-inspect'
import { qrcode } from 'vite-plugin-qrcode';
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from 'vite-plugin-pwa'

const { version } = require("./package.json")

const projectRoot = __dirname

// https://vitejs.dev/config/
export default defineConfig({

  resolve: {
    alias: {
      '~/': `${resolve(projectRoot, 'src')}/`,
    },
  },

  plugins: [
    Inspect(),

    vue(),

    viteCompression({
      threshold: 2048,
    }),

    // vue-i18n 插件
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [
        resolve(projectRoot, "src/locales/messages/**")
      ]
    }),

    // 使用 SSL
    // mkcert(),

    // PWA
    VitePWA({
      registerType: "prompt",
      manifest: false,
      strategies: "generateSW",
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}']
      },
      filename: "service-worker.js",

      // open it if you want to test service worker update on dev mode
      // devOptions: {
      //   enabled: true,
      // },
    }),

    // 使用 svg 雪碧图
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]',
    }),

    // show qrcode in dev mode
    qrcode(),

    // visualize the result of building
    visualizer({
      filename: "analysis.html", // 文件名称
      title: "Project Building Analysis",
    }),
  ],

  server: {
    host: true,
    port: 5175,
  },

  build: {
    sourcemap: true,
  },

  preview: {
    port: 4175,
  },
  
  define: {
    "LIU_ENV": {
      "version": version,
      "client": "web"
    }
  }
})
