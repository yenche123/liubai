/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
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
  author?: {
    name?: string
    email?: string
    url?: string
  }
}

declare const LIU_ENV: LiuEnv

// @see https://pay.weixin.qq.com/docs/merchant/apis/jsapi-payment/jsapi-transfer-payment.html
declare const WeixinJSBridge: {
  invoke: (method: string, ...args: any[]) => void
}