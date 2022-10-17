/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface LiuEnv {
  version: string
  client: string
}

declare const LIU_ENV: LiuEnv