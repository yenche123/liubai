/// <reference types="vite/client" />

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