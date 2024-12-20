import { i18n } from "~/locales"
import type { 
  LanguageItem, 
  ThemeItem,
  TermsItem,
  FontSizeItem
} from "./types"
import { useWindowSize } from "~/hooks/useVueUse"
import cfg from "~/config"

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
  const { width } = useWindowSize()
  const w = width.value
  const breakpoint = cfg.breakpoint_max_size.mobile
  const list: ThemeItem[] = [
    {
      id: "system",
      text: t('setting.system'),
      iconName: w <= breakpoint ? "devices-smartphone" : "devices-app-window",
    },
    {
      id: "auto",
      text: t('setting.day_and_night'),
      iconName: "devices-auto-toggle",
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

export function getFontSizeList() {
  const list: FontSizeItem[] = [
    {
      text: t('setting.font_large'),
      id: "L",
      iconName: "cup_large",
    },
    {
      text: t("setting.font_medium"),
      id: "M",
      iconName: "cup_medium",
    }
  ]
  return list
}