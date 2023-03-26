
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

export interface TermsItem {
  text: string
  link: string
}

export interface SettingContentData {
  language: LocalLanguage
  language_txt: string
  theme: LocalTheme
  openTerms: boolean
  termsList: TermsItem[]
}