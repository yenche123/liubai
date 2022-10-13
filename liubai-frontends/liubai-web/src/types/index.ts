
import { SupportedLocale } from "./types-locale"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system"
export type LocalLanguage = SupportedLocale | "system"

export interface LocalPreference {
  theme?: LocalTheme
  language?: LocalLanguage
  nickName?: string
}