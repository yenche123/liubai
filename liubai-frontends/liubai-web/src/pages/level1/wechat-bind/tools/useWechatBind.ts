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
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { 
  Res_OC_GetWeChat, 
  Res_UserLoginInit,
} from "~/requests/req-types";
import { showErrMsg } from "../../tools/show-msg";
import type { DataPass, LiuErrReturn } from "~/requests/tools/types";
import { createClientKey } from "../../tools/common-utils";

export function useWechatBind() {
  const rr = useRouteAndLiuRouter()
  const { wbData } = initData()

  listenContext(wbData, rr)

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

function listenContext(
  wbData: WbData,
  rr: RouteAndLiuRouter,
) {
  const pState = wbData.pageState
  if(pState >= 50) return

  const wStore = useWorkspaceStore()
  const { memberId } = storeToRefs(wStore)

  watch([rr.route, memberId], ([newV1, newV2]) => {
    if(newV1.name !== "wechat-bind") return
    const oAuthCode = newV1.query.code

    if(valTool.isStringWithVal(oAuthCode)) {
      if(wbData.oAuthCode === oAuthCode) return
      wbData.oAuthCode = oAuthCode
      handleOAuthCode(wbData)
    }
    else {
      handleWithoutCode(wbData, newV2)
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

async function handleWithoutCode(
  wbData: WbData,
  memberId: string,
) {
  const hasLogged = localCache.hasLoginWithBackend()
  if(hasLogged && !memberId) {
    console.warn("member id dosen't exist but we are logged in")
    return
  }

  if(hasLogged) {
    //【已登录】去检查是否已绑定
    checkBoundWhenLogged(wbData, memberId)
  }
  else {
    //【未登录】去获取登录时所需的数据 Res_UserLoginInit
    getLoginDataWhenLoggout(wbData)
  }
}


async function getLoginDataWhenLoggout(
  wbData: WbData,
) {
  // 1. fetch
  const res1 = await fetchLoginData()
  if(!res1.pass) {
    handleErr(wbData, res1.err)
    return
  }

  // 2. handle view
  const data2 = res1.data
  wbData.pageState = pageStates.OK
  wbData.loginData = data2
  wbData.status = "logout"

  // 3. generate client_key for communicating for the future
  const pk = data2.publicKey
  if(pk) {
    const { cipher, aesKey } = await createClientKey(pk)
    if(cipher && aesKey) {
      localCache.setOnceData("client_key", aesKey)
      localCache.setOnceData("enc_client_key", cipher)
    }
  }
}


async function checkBoundWhenLogged(
  wbData: WbData,
  memberId: string,
) {
  // 1. fetch bound data
  const res1 = await fetchBound(memberId)
  if(!res1.pass) {
    handleErr(wbData, res1.err)
    return
  }
  
  // 2. handle view
  const data1 = res1.data
  const hasBound = Boolean(data1.wx_gzh_openid)
  wbData.pageState = pageStates.OK
  wbData.status = hasBound ? "success" : "waiting"
  if(hasBound) return

  // 3. get login data for binding
  const res3 = await fetchLoginData()
  if(!res3.pass) return
  wbData.loginData = res3.data
}


function handleErr(
  wbData: WbData,
  res: LiuErrReturn
) {
  const code = res.code
  if(code === "E4003") {
    wbData.pageState = pageStates.NO_AUTH
  }
  else if(code === "E4004") {
    wbData.pageState = pageStates.NO_DATA
  }
  else {
    wbData.pageState = pageStates.NETWORK_ERR
  }
}


async function fetchBound(
  memberId: string,
): Promise<DataPass<Res_OC_GetWeChat>> {
  // 1. fetch
  const url = APIs.OPEN_CONNECT
  const w2 = {
    operateType: "get-wechat",
    memberId,
  }
  const res = await liuReq.request<Res_OC_GetWeChat>(url, w2)

  // 2. handle error
  const code = res?.code
  const data = res?.data
  if(code !== "0000" || !data) {
    console.warn("failed to check out wechat binding")
    console.log(res)
    showErrMsg("other", res)
    return { pass: false, err: res }
  }

  return { pass: true, data }
}


async function fetchLoginData(): Promise<DataPass<Res_UserLoginInit>> {
  // 1. fetch
  const url = APIs.LOGIN
  const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })

  // 2. handle error
  const code = res?.code
  const data = res?.data
  if(code !== "0000" || !data) {
    console.warn("getting login data failed")
    console.log(res)
    showErrMsg("login", res)
    return { pass: false, err: res }
  }

  return { pass: true, data }
}

