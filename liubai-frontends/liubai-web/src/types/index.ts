
import { SupportedLocale } from "./types-locale"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system"
export type LocalLanguage = SupportedLocale | "system"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  nickName?: string
}

export interface ImageLocal {
  local_id: string
  name: string
  file: File
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