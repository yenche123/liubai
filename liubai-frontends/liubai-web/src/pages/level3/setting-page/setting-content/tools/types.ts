import type { LocalFontSize, LocalTheme } from "~/types/types-atom"
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

export interface FontSizeItem {
  text: string
  id: LocalFontSize
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
  fontSize: LocalFontSize
  openTerms: boolean
  termsList: TermsItem[]
  hasBackend: boolean

  debugBtn: boolean
  openDebug: boolean
  mobileDebug: boolean

  contactLink?: string
  showA2HS: boolean
}