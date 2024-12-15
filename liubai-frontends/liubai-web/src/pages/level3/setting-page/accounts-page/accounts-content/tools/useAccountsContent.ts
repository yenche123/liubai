import { reactive, watch } from "vue"
import type { AcData } from "./types"
import { pageStates } from "~/utils/atom"
import liuEnv from "~/utils/liu-env"
import cui from "~/components/custom-ui"
import { useAwakeNum } from "~/hooks/useCommon"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"

export function useAccountsContent() {

  const hasBE = liuEnv.hasBackend()
  const acData = reactive<AcData>({
    pageState: !hasBE ? pageStates.NEED_BACKEND : pageStates.LOADING,
  })
  listenContext(acData)

  const _showUnsupported = () => {
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "setting.unbind_unsupported",
      showCancel: false,
    })
  }

  const onTapPhone = () => {
    if(acData.phone_pixelated) {
      _showUnsupported()
      return
    }
    toBindPhone(acData)
  }

  const onTapWeChat = () => {
    if(acData.wx_gzh_openid) {
      _showUnsupported()
      return
    }
    toBindWeChat(acData)
  }

  const onTapEmail = () => {
    if(acData.email) {
      _showUnsupported()
      return
    }
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "common.under_construction",
      showCancel: false,
    })
  }

  return {
    acData,
    onTapPhone,
    onTapWeChat,
    onTapEmail,
  }
}

async function toBindPhone(
  acData: AcData,
) {
  const res = await cui.showBindPopup({ bindType: "phone", compliance: false })
  if(res.bound) {
    CloudEventBus.addSyncNumManually()
  }
}

async function toBindWeChat(
  acData: AcData,
) {
  await cui.showQRCodePopup({ bindType: "wx_gzh" })
  getMyData(acData)
}

function listenContext(
  acData: AcData,
) {
  if(acData.pageState === pageStates.NEED_BACKEND) return

  const { syncNum, awakeNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    if(newV < 1 || syncNum.value < 1) return
    getMyData(acData)
  }, { immediate: true })
}

async function getMyData(
  acData: AcData,
) {
  const res = await CloudEventBus.getLatestUserInfo()
  if(!res) return

  acData.email = res.email
  acData.phone_pixelated = res.phone_pixelated
  acData.wx_gzh_nickname = res.wx_gzh_nickname
  acData.wx_gzh_openid = res.wx_gzh_openid
  acData.pageState = pageStates.OK
}