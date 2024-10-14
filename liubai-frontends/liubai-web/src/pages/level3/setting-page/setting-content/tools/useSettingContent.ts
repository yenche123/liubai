
import { type Ref, reactive, watch } from "vue"
import type { SettingContentData } from "./types"
import cui from "~/components/custom-ui"
import { getLanguageList, getTermsList } from "./get-list"
import { deleteLocalData } from "./handle-logout"
import { whenTapTheme } from "./handle-theme"
import { whenTapLanguage } from "./handle-lang"
import { whenTapFontSize } from "./handle-font-size"
import liuEnv from "~/utils/liu-env"
import { useSystemStore } from "~/hooks/stores/useSystemStore"
import { storeToRefs } from "pinia"
import { useMyProfile, usePrefix } from "~/hooks/useCommon"
import localCache from "~/utils/system/local-cache"
import liuApi from "~/utils/liu-api"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import middleBridge from "~/utils/middle-bridge"
import { type MemberShow } from "~/types/types-content"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"
import { getSWRegistration, toUpdateSW } from "~/hooks/pwa/useServiceWorker"
import valTool from "~/utils/basic/val-tool"
import { useShowAddToHomeScreen } from "~/hooks/pwa/useA2HS"
import liuReq from "~/requests/liu-req"
import APIs from "~/requests/APIs"
import liuUtil from "~/utils/liu-util"

export function useSettingContent() {

  const { myProfile } = useMyProfile()
  const { prefix } = usePrefix()
  const hasBackend = liuEnv.hasBackend()
  const _env = liuEnv.getEnv()
  const onceData = localCache.getOnceData()

  const data = reactive<SettingContentData>({
    language: "system",
    language_txt: "",
    theme: "system",
    fontSize: onceData.fontSize ?? "L",
    openTerms: false,
    termsList: getTermsList(),
    hasBackend,
    debugBtn: Boolean(_env.DEBUG_BTN),
    openDebug: false,
    mobileDebug: Boolean(onceData.mobile_debug),
    dev_email: LIU_ENV.author?.email,
    showA2HS: false,
  })

  const { toA2HS } = listenToA2HS(data)
  listenSystemStore(data)

  const onTapAccounts = () => {
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "common.under_construction",
      showCancel: false,
    })
  }
  const onToggleMobileDebug = (newV: boolean) => {
    data.mobileDebug = newV
    localCache.setOnceData("mobile_debug", newV)
    liuApi.route.reload()
  }

  const version = LIU_ENV.version
  let appName = _env.APP_NAME ?? ""
  if(appName && appName[0]) {
    appName = appName[0].toUpperCase() + appName.substring(1)
  }

  const gStore = useGlobalStateStore()
  const { hasNewVersion } = storeToRefs(gStore)

  const onTapA2HS = () => {
    toA2HS?.()
  }

  return {
    myProfile,
    prefix,
    data,
    onTapTheme: () => whenTapTheme(data),
    onTapLanguage: () => whenTapLanguage(data),
    onTapFontSize: () => whenTapFontSize(data),
    onTapTerms: () => data.openTerms = !data.openTerms,
    onTapLogout: () => whenTapLogout(),
    onTapAccounts,
    onTapDebug: () => whenTapDebug(data),
    onToggleMobileDebug,
    onTapClearCache: () => whenTapClearCache(),
    onTapNickname: () => whenTapNickname(myProfile),
    onTapVerionUpdate: () => whenTapVersionUpdate(hasNewVersion),
    onTapA2HS,
    version,
    appName,
  }
}

async function whenTapVersionUpdate(
  hasNewVersion: Ref<boolean>
) {

  const _newVersion = async () => {
    const res = await cui.showModal({
      title_key: "pwa.new_version_title",
      content_key: "pwa.new_version_desc2",
      confirm_key: "common.update",
    })
    if(res) {
      toUpdateSW(true)
    }
  }

  const _noVersion = () => {
    cui.showModal({
      title: "🍫",
      content_key: "pwa.no_new_version",
      showCancel: false,
      isTitleEqualToEmoji: true,
    })
  }

  const _loadingTip = () => {
    cui.showModal({
      title: "📡",
      content_key: "pwa.installing_tip",
      showCancel: false,
      isTitleEqualToEmoji: true,
    })
  }


  let value = hasNewVersion.value
  if(value) {
    _newVersion()
    return
  }

  cui.showLoading({ title_key: "pwa.checking" })
  await valTool.waitMilli(1500)
  cui.hideLoading()

  value = hasNewVersion.value
  if(value) {
    _newVersion()
    return
  }

  const r = getSWRegistration()
  if(r?.installing) {
    _loadingTip()
    return
  }

  _noVersion()
}

async function whenTapNickname(
  myProfile: Ref<MemberShow | null>,
) {
  const res = await cui.showTextEditor({ 
    title_key: "who_r_u.modify_name", 
    placeholder_key: "who_r_u.modify_name_ph",
    value: myProfile.value?.name,
    maxLength: 20,
  })
  const { confirm, value } = res
  if(!confirm || !value) return
  middleBridge.modifyMemberNickname(value)
}

function listenToA2HS(
  data: SettingContentData,
) {
  const {
    showButtonForA2HS,
    toA2HS,
  } = useShowAddToHomeScreen()
  if(!showButtonForA2HS) return {}
  watch(showButtonForA2HS, (newV) => {
    data.showA2HS = newV
  })

  return { toA2HS }
}

function listenSystemStore(
  data: SettingContentData
) {
  const systemStore = useSystemStore()
  const { 
    local_theme, 
    local_lang,
    local_font_size,
  } = storeToRefs(systemStore)

  watch([local_theme, local_lang, local_font_size], (newV) => {
    const [theme, lang, fontSize] = newV

    if(data.theme !== theme) {
      data.theme = theme
    }

    if(!data.language_txt || data.language !== lang) {
      data.language = lang
      const langList = getLanguageList()
      const langItem = langList.find(v => v.id === lang)
      if(langItem) data.language_txt = langItem.text
    }


    if(fontSize !== data.fontSize) {
      data.fontSize = fontSize
    }

  }, { immediate: true })
}

async function whenTapClearCache() {
  const res = await cui.showModal({
    title_key: "tip.tip",
    content_key: "setting.clear_cache_1"
  })
  if(!res.confirm) return
  localStorage.clear()
  liuApi.route.reload()
}

function whenTapDebug(
  data: SettingContentData
) {
  data.openDebug = !data.openDebug
}


function whenTapLogout() {
  const res0 = liuEnv.hasBackend()
  if(!res0) askLogoutWithPurelyLocal()
  else askLogoutWithBackend()
}

async function askLogoutWithPurelyLocal() {
  const res = await cui.showModal({
    title_key: "setting.logout",
    content_key: "setting.logout_bd_2",
  })
  if(!res.confirm) return
  const res2 = await cui.showModal({
    title_key: "setting.logout_hd_2",
    content_key: "setting.logout_bd_3",
    modalType: "warning",
  })
  if(!res2.confirm) return
  deleteLocalData()
}

async function askLogoutWithBackend() {
  // 0. show popup to ask
  const res = await cui.showModal({
    title_key: "setting.logout",
    content_key: "setting.logout_bd",
    tip_key: "setting.logout_tip",
  })
  if(!res.confirm) return

  // 1. logout remotely
  const url = APIs.LOGOUT
  const res2 = liuReq.request(url, { operateType: "logout" })

  await liuUtil.waitAFrame()

  // 2. logout locally
  CloudEventBus.toLogout()

  // 3. delete local data
  if(res.tipToggle) {
    deleteLocalData()
  }
}
