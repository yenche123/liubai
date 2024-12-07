import { reactive, watch } from "vue";
import { pageStates } from "~/utils/atom";
import liuApi from "~/utils/liu-api";
import liuEnv from "~/utils/liu-env";
import localCache from "~/utils/system/local-cache";
import { type WbData } from "./types";
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router";
import valTool from "~/utils/basic/val-tool";
import { useThrottleFn } from "~/hooks/useVueUse";

export function useWechatBind() {
  const rr = useRouteAndLiuRouter()
  const { wbData } = initData()

  listenRoute(wbData, rr)

  return {
    wbData,
  }
}


function initData() {
  let pageState = pageStates.LOADING

  // 1. check out backend
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) {
    pageState = pageStates.NEED_BACKEND
  }

  // 2. check out if we are in wechat
  const cha = liuApi.getCharacteristic()
  if(!cha.isWeChat) {
    pageState = pageStates.NOT_IN_WECHAT
  }

  const wbData = reactive<WbData>({
    pageState,
    oAuthCode: "",
  })

  return { wbData }
}

function listenRoute(
  wbData: WbData,
  rr: RouteAndLiuRouter,
) {
  const pState = wbData.pageState
  if(pState >= 50) return

  const _handleWithoutCode = useThrottleFn(() => {
    handleWithoutCode(wbData)
  }, 1000)

  watch(rr.route, (newV) => {
    const oAuthCode = newV.query.code

    if(valTool.isStringWithVal(oAuthCode)) {
      if(wbData.oAuthCode === oAuthCode) return
      wbData.oAuthCode = oAuthCode
      handleOAuthCode(wbData)
    }
    else {
      _handleWithoutCode()
    }

  }, { immediate: true })
}

function handleOAuthCode(
  wbData: WbData,
) {
  const hasLogged = localCache.hasLoginWithBackend()
  if(hasLogged) {
    // 将当前帐号与 oAuthCode 绑定（即绑定微信）

  }
  else {
    // 去登录

  }
}

function handleWithoutCode(
  wbData: WbData,
) {
  const hasLogged = localCache.hasLoginWithBackend()
  if(hasLogged) {
    // 去检查是否已绑定
    
  }
  else {
    // 去获取登录时所需的数据 Res_UserLoginInit

  }
}

