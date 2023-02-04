import { defineConfig } from 'vite'
import { resolve } from "path"
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import mkcert from 'vite-plugin-mkcert'
import viteCompression from 'vite-plugin-compression'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
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
    vue(),

    viteCompression(),

    // vue-i18n 插件
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [
        resolve(projectRoot, "src/locales/messages/**")
      ]
    }),

    // 使用 SSL
    mkcert(),

    // 使用 svg 雪碧图
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]',
    })
  ],

  server: {
    host: true,
    port: 5175,
    https: true
  },
  
  define: {
    "LIU_ENV": {
      "version": version,
      "client": "web"
    }
  }
})
