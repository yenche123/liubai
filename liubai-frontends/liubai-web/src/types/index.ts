
import { SupportedLocale } from "./types-locale"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system"
export type LocalLanguage = SupportedLocale | "system"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  nickName?: string
}

export interface BlobWithWH {
  width?: number         // 可能为 undefined 表示计算失败
  height?: number
  blob: Blob | File
}