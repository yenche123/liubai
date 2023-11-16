
import type { SupportedLocale } from "./types-locale"
import type { RouteLocation } from 'vue-router'

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"   // auto 就是日夜切换
export type LocalLanguage = SupportedLocale | "system"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  local_id?: string
  token?: string
  serial?: string     // token 所在的序列号
}

export interface LocalOnceData {
  // 读取 iframe-restriction 提示界面后，点击确认时的时间戳
  // 当此值为 undefined 代表从未读过该提示，就去显示提示界面，否则不显示 
  iframeRestriction?: number

  // 使用 GitHub 登录时，一次性的 state，用于防止无关的第三方请求该界面
  githubOAuthState?: string

  
}

export interface LiuFileStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  mimeType: string
  arrayBuffer?: ArrayBuffer
  cloud_url?: string
}

export interface FileShow {
  id: string
  name: string
  suffix: string   // 后缀的英文
  size: number     // 单位为 bytes
  cloud_url?: string
}


/** 当前有采集的「可交换图像文件格式」
 *    注意: 其每个属性都必须是可选的，因为都不见得会存在
*/
export interface LiuExif {
  gps?: {
    latitude?: string
    longitude?: string
    altitude?: string
  }
  DateTimeOriginal?: string    // 原始拍摄时间，形如 "YYYY:MM:DD hh:mm:ss"
  HostComputer?: string     // 宿主设备，如果图片经过软件再编辑，此值可能缺省
  Model?: string            // 拍摄时的设备，即使图片经过软件再编辑，此值仍可能存在
}

export interface LiuImageStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  mimeType: string
  arrayBuffer?: ArrayBuffer
  width?: number
  height?: number
  h2w?: string
  cloud_url?: string
  blurhash?: string
  someExif?: LiuExif
}

export interface ImageShow {
  src: string
  id: string,
  width?: number
  height?: number
  h2w?: string
  blurhash?: string
}

export interface LiuUser {
  local_id: string
  user_id?: string
  token?: string
  createdStamp: number
  lastRefresh: number
}

export type ToRoute = RouteLocation & { href: string }