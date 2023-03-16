
import type { LocalLanguage, LocalTheme } from "~/types"

export interface LanguageItem {
  text: string
  id: LocalLanguage
}

export interface ThemeItem {
  text: string
  id: LocalTheme
  iconName: string
}

export interface SettingContentData {
  language_txt: string
  theme: LocalTheme
  theme_txt: string
}