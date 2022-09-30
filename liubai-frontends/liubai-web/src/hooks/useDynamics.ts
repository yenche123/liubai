// 返回全局动态参数，比如语言 (language) / 主题 (theme)

import { useI18n } from "vue-i18n"

export const useDynamics = () => {
  const i18n = useI18n()
  let language = i18n.locale

  const setLanguage = (val: string) => {
    language.value = val
  }

  return { language, setLanguage }
}