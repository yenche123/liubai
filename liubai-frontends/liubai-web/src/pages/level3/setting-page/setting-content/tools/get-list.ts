import { i18n } from "~/locales"
import type { 
  LanguageItem, 
  ThemeItem,
  TermsItem
} from "./types"

const t = i18n.global.t


// TODO: 添加对应的链接
export function getTermsList() {
  const list: TermsItem[] = [
    {
      text: t('setting.service_terms'),
      link: ""
    },
    {
      text: t('setting.privacy_policy'),
      link: ""
    }
  ]
  return list
}

export function getThemeList() {
  const list: ThemeItem[] = [
    {
      id: "system",
      text: t('setting.system'),
      iconName: "theme-system-theme",
    },
    {
      id: "light",
      text: t('setting.light'),
      iconName: "theme-light_mode",
    },
    {
      id: "dark",
      text: t('setting.dark'),
      iconName: "theme-dark_mode",
    }
  ]
  return list
}

export function getLanguageList() {
  const list: LanguageItem[] = [
    {
      id: "system",
      text: t('setting.system'),
    },
    {
      id: "zh-Hans",
      text: "简体中文",
    },
    {
      id: "zh-Hant",
      text: "繁體中文",
    },
    {
      id: "en",
      text: "English",
    }
  ]
  return list
}