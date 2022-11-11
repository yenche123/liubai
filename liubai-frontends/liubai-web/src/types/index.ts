
import { SupportedLocale } from "./types-locale"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system"
export type LocalLanguage = SupportedLocale | "system"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  local_id?: string
  token?: string
}

export interface FileLocal {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  file?: File
  cloud_url?: string
}

export interface FileShow {
  id: string
  name: string
  suffix: string   // 后缀的英文
  size: number     // 单位为 bytes
  cloud_url?: string
}

export interface ImageLocal {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  file?: File
  width?: number
  height?: number
  h2w?: string
  cloud_url?: string
}

export interface ImageShow {
  src: string
  id: string,
  width?: number
  height?: number
  h2w?: string
}


export interface LiuUser {
  local_id: string
  user_id?: string
  token?: string
  createdStamp: number
  lastRefresh: number
}