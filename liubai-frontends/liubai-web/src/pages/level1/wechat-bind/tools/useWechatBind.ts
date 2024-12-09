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
import { getClientKey, redirectToLoginPage } from "../../tools/common-tools";
import { fetchOAuth } from "../../tools/requests";
import loginer from "../../tools/loginer";
import { getGlobalWx, invokeWxJsSdk } from "~/utils/third-party/weixin/handle-wx-js-sdk";
import thirdLink from "~/config/third-link";

export function useWechatBind() {
  const rr = useRouteAndLiuRouter()
  const { wbData } = initData()

  listenContext(wbData, rr)

  const onTapBtn1 = () => {
    const s = wbData.status

    // 1. back to weixin
    if(s === "bound" || s === "logged") {
      goBack(rr)
      return
    }

    // 2. login in with weixin
    redirectToWeChatOAuth(wbData)
  }

  const onTapBtn2 = () => {
    // redirect to login page
    redirectToLoginPage(rr)
  }

  return {
    wbData,
    onTapBtn1,
    onTapBtn2,
  }
}


async function redirectToWeChatOAuth(
  wbData: WbData,
) {
  // 1. get login data
  let loginData = wbData.loginData
  if(!loginData) {
    const res1 = await fetchLoginData()
    if(!res1.pass) return
    loginData = res1.data
  }
  
  // 2. get state & wxGzhAppid
  const { state, wxGzhAppid } = loginData
  if(!state || !wxGzhAppid) {
    console.warn("state and wxGzhAppid are required")
    return
  }
  localCache.setOnceData("wxGzhOAuthState", state)

  // 3. construct redirect_uri
  const redirect_uri = location.origin + "/wechat-bind"
  const url = new URL(thirdLink.WX_GZH_OAUTH)
  const sp = url.searchParams
  sp.append("appid", wxGzhAppid)
  sp.append("redirect_uri", redirect_uri)
  sp.append("response_type", "code")
  sp.append("scope", "snsapi_userinfo")
  sp.append("state", state)
  const link = url.toString() + `#wechat_redirect`
  location.href = link
}


async function goBack(
  rr: RouteAndLiuRouter,
) {
  const res1 = await invokeWxJsSdk(666)
  if(!res1) {
    rr.router.replace({ name: "index" })
    return
  }

  const wx = getGlobalWx()
  wx.closeWindow()
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
    const oAuthState = newV1.query.state

    if(valTool.isStringWithVal(oAuthCode)) {
      if(wbData.oAuthCode === oAuthCode) return
      wbData.oAuthCode = oAuthCode
      if(valTool.isStringWithVal(oAuthState)) {
        handleOAuthCode(wbData, oAuthState, rr)
      }
    }
    else {
      handleWithoutCode(wbData, newV2)
    }

  }, { immediate: true })
}

function handleOAuthCode(
  wbData: WbData,
  oAuthState: string,
  rr: RouteAndLiuRouter,
) {

  // 1. check out state
  const onceData = localCache.getOnceData()
  const oldState = onceData.wxGzhOAuthState
  if(oldState !== oAuthState) {
    console.warn("oAuthState 与 oldState 不匹配！！")
    console.log("oldState: ", oldState)
    console.log("newState: ", oAuthState)
    return
  }

  // 2. decide which path to go
  const hasLogged = localCache.hasLoginWithBackend()
  if(hasLogged) {
    // 将当前帐号与 oAuthCode 绑定（即绑定微信）
    toBindWeChat(wbData, rr)
  }
  else {
    // 去登录
    loginWithWeChat(wbData, oAuthState, rr)
  }
}

async function toBindWeChat(
  wbData: WbData,
  rr: RouteAndLiuRouter,
) {
  const { oAuthCode } = wbData
  if(!oAuthCode) return

  // 1. fetch
  const url = APIs.WECHAT_BIND
  const w1 = {
    operateType: "wechat-bind",
    oauth_code: oAuthCode,
  }
  const res1 = await liuReq.request(url, w1)

  // 2. handle error
  if(res1.code !== "0000") {
    const res2 = await showErrMsg("other", res1)
    rr.router.replace({ name: "index" })
    return
  }
  
  wbData.pageState = pageStates.OK
  wbData.status = "bound"
  invokeWxJsSdk()
}


async function loginWithWeChat(
  wbData: WbData,
  oAuthState: string,
  rr: RouteAndLiuRouter,
) {
  // 1. get params
  const { enc_client_key } = getClientKey()
  const oAuthCode = wbData.oAuthCode
  if(!enc_client_key || !oAuthCode) return

  // 2. fetch
  const res2 = await fetchOAuth(
    "wx_gzh_oauth", 
    oAuthCode, 
    oAuthState, 
    enc_client_key,
  )

  // 3. handle error
  const code3 = res2.code
  const data3 = res2.data
  if(code3 !== "0000" || !data3) {
    showErrMsg("login", res2)
    handleErr(wbData, res2)
    return
  }

  // 4. initialize user data
  const res4 = await loginer.toLogin(rr, data3, {
    autoRedirect: false,
  })
  console.warn("see login result: ")
  console.log(res4)
  if(res4) {
    wbData.pageState = pageStates.OK
    wbData.status = "logged"
    invokeWxJsSdk()
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
  wbData.status = hasBound ? "bound" : "waiting"
  if(hasBound) {
    invokeWxJsSdk()
    return
  }

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
  const w1 = {
    operateType: "get-wechat",
    memberId,
  }
  const res = await liuReq.request<Res_OC_GetWeChat>(url, w1)

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

