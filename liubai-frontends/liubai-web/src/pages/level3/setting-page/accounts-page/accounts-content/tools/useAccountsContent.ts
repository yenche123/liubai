import { reactive } from "vue"
import { AcData } from "./types"
import { pageStates } from "~/utils/atom"
import liuEnv from "~/utils/liu-env"
import cui from "~/components/custom-ui"


export function useAccountsContent() {

  const hasBE = liuEnv.hasBackend()
  const acData = reactive<AcData>({
    pageState: !hasBE ? pageStates.NEED_BACKEND : pageStates.LOADING,
  })
  listenContext(acData)

  const onTapPhone = () => {

  }

  const onTapWeChat = () => {

  }

  const onTapEmail = () => {
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

function listenContext(
  acData: AcData,
) {
  if(acData.pageState === pageStates.NEED_BACKEND) return


}