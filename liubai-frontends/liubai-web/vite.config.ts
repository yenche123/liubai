import { defineConfig } from 'vite'
import { resolve } from "path"
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import mkcert from 'vite-plugin-mkcert'
const { version } = require("./package.json")

const projectRoot = __dirname

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),

    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [
        resolve(projectRoot, "src/locales/messages/**")
      ]
    }),

    mkcert()    // 使用 SSL
  ],
  server: {
    host: true,
    port: 5174,
    https: true
  },
  define: {
    "LIU_ENV": {
      "version": version,
      "client": "web"
    }
  }
})
