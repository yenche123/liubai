import type { LocalTheme } from "~/types/types-atom"
import type { LocalLocale } from "~/types/types-locale"

export interface LanguageItem {
  text: string
  id: LocalLocale
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
  language: LocalLocale
  language_txt: string
  theme: LocalTheme
  openTerms: boolean
  termsList: TermsItem[]
  hasBackend: boolean

  debugBtn: boolean
  openDebug: boolean

}