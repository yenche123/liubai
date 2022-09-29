import { defineConfig } from 'vite'
import { resolve } from "path"
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/vite-plugin-vue-i18n'

const projectRoot = __dirname

const ttt = resolve(projectRoot, "src/locales/messages/**")
console.log("ttt: ", ttt)

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
    })
  ]
})
