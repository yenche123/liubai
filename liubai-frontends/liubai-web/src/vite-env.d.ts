/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/vue" />
/// <reference lib="webworker" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-draggable-resizable'

interface LiuEnv {
  version: string
  client: string
}

declare const LIU_ENV: LiuEnv