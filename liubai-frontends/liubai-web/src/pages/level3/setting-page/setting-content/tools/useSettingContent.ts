
import { reactive } from "vue"
import type { 
  SettingContentData,
} from "./types"
import type { SupportedTheme } from "~/types"
import localCache from "~/utils/system/local-cache"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import { useDynamics } from "~/hooks/useDynamics"
import type { SupportedLocale } from "~/types/types-locale"
import { getLanguageList, getThemeList, getTermsList } from "./get-list"

export function useSettingContent() {
  const data = reactive<SettingContentData>({
    language: "system",
    language_txt: "",
    theme: "system",
    openTerms: false,
    termsList: getTermsList(),
  })

  initSettingContent(data)

  const onTapTheme = () => whenTapTheme(data)
  const onTapLanguage = () => whenTapLanguage(data)
  const onTapTerms = () => data.openTerms = !data.openTerms
  const onTapLogout = () => whenTapLogout(data)


  return {
    data,
    onTapTheme,
    onTapLanguage,
    onTapTerms,
    onTapLogout,
  }
}

function initSettingContent(
  data: SettingContentData
) {

  const localP = localCache.getLocalPreference()

  /** 初始化主题 */
  const theme = localP.theme
  if(theme) {
    data.theme = theme
  }

  /** 初始化语言 */
  let lang = localP.language
  if(!lang) lang = "system"
  data.language = lang
  const langList = getLanguageList()
  const langItem = langList.find(v => v.id === lang)
  if(langItem) {
    data.language_txt = langItem.text
  }
}

function whenTapLogout(
  data: SettingContentData
) {

}

async function whenTapTheme(
  data: SettingContentData
) {
  const list = getThemeList()
  const itemList = list.map(v => {
    return {
      text: v.text,
      iconName: v.iconName,
    }
  })

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return
  const item = list[res.tapIndex]  
  const id = item.id
  if(id === data.theme) return

  localCache.setLocalPreference("theme", id)
  let newTheme: SupportedTheme

  if(id !== "system") {
    newTheme = id
  }
  else {
    newTheme = liuApi.getThemeFromSystem()
  }
  const { setTheme } = useDynamics()
  setTheme(newTheme)

  data.theme = id
}

async function whenTapLanguage(
  data: SettingContentData
) {
  const list = getLanguageList()
  const itemList = list.map(v => ({ text: v.text }))

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return

  const item = list[res.tapIndex]
  const id = item.id
  if(id === data.language) return

  localCache.setLocalPreference("language", id)

  let newLang: SupportedLocale
  let new_lang_txt = item.text
  if(id !== "system") {
    newLang = id
  }
  else {
    newLang = liuApi.getLanguageFromSystem()
  }
  
  const { setLanguage } = useDynamics()
  setLanguage(newLang)

  data.language = id
  data.language_txt = new_lang_txt
}
