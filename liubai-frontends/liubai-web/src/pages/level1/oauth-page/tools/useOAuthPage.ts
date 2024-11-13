import { reactive, watch } from "vue"
import { type OpData } from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import localCache from "~/utils/system/local-cache"
import { getClientKey } from "../../tools/common-tools"
import { fetchOAuth } from "../../tools/requests"
import { afterFetchingLogin } from "../../tools/common-utils"
import valTool from "~/utils/basic/val-tool"

export function useOAuthPage() {

  const rr = useRouteAndLiuRouter()
  const opData = reactive<OpData>({
    via: "",
    code: "",
    showLoading: true,
  })

  listenRouteChange(opData, rr)

  const onTapBack = () => {
    rr.router.replace({ name: "login" })
  }

  return {
    opData,
    onTapBack,
  }
}


function listenRouteChange(
  opData: OpData,
  rr: RouteAndLiuRouter,
) {
  watch(rr.route, (newV) => {
    if(!newV) return

    const n = newV.name
    const via = opData.via

    if(n === "login-github" && via !== "github") {
      enterFromGitHub(opData, rr)
    }
    else if(n === "login-google" && via !== "google") {
      enterFromGoogle(opData, rr)
    }
    else if(n === "login-wechat" && via !== "wechat") {
      enterFromWeChat(opData, rr)
    }
    
  }, { immediate: true })
}


async function enterFromGitHub(
  opData: OpData,
  rr: RouteAndLiuRouter,
) {
  const { 
    code, 
    state, 
    error_description, 
    error,
  } = rr.route.query

  if(error_description || error) {
    console.warn("GitHub 授权失败.......")
    console.log(error_description)
    console.log(error)
    console.log(" ")
    rr.router.replace({ name: "login" })
    return
  }

  if(!valTool.isStringWithVal(code)) return
  if(!valTool.isStringWithVal(state)) return

  // 1. 先把 via 切换到 github，避免 route 抖动重复触发 enterFromGitHub
  opData.via = "github"

  // 2. 匹配 state 是否一致
  const onceData = localCache.getOnceData()
  const oldState = onceData.githubOAuthState
  if(oldState !== state) {
    console.warn("state 与 oldState 不匹配！！")
    console.log("oldState: ", oldState)
    console.log(" ")
    return
  }

  // 3. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  // 4. 清除 query
  rr.router.replace({ name: "login-github" })

  // 5. 去请求后端登录
  const res = await fetchOAuth("github_oauth", code, state, enc_client_key)
  afterFetchingLogin(rr, res)
}

async function enterFromGoogle(
  opData: OpData,
  rr: RouteAndLiuRouter,
) {

  const { 
    code, 
    state, 
    error_description, 
    error,
  } = rr.route.query

  if(error_description || error) {
    console.warn("Google 授权失败.......")
    console.log(error_description)
    console.log(error)
    console.log(" ")
    rr.router.replace({ name: "login" })
    return
  }

  if(!valTool.isStringWithVal(code)) return
  if(!valTool.isStringWithVal(state)) return

  // 1. 先把 via 切换到 google
  opData.via = "google"

  // 2. 匹配 state 是否一致
  const onceData = localCache.getOnceData()
  const oldState = onceData.googleOAuthState
  if(oldState !== state) {
    console.warn("state 与 oldState 不匹配！！")
    console.log("oldState: ", oldState)
    console.log(" ")
    return
  }

  // 3. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  // 4. 清除 query
  rr.router.replace({ name: "login-google" })

  // 5. 去请求后端登录
  const redirect_uri = location.origin + "/login-google"
  const res = await fetchOAuth("google_oauth", code, state, enc_client_key, redirect_uri)
  afterFetchingLogin(rr, res)
}


async function enterFromWeChat(
  opData: OpData,
  rr: RouteAndLiuRouter,
) {
  const qry = rr.route.query
  console.log("enterFromWeChat: ")
  console.log(qry)

  const { code, state } = qry

  if(!code || !state) {
    console.warn("WeChat 授权失败.......")
    return
  }

  if(!valTool.isStringWithVal(code)) return
  if(!valTool.isStringWithVal(state)) return

  // 1. switch via
  opData.via = "wechat"

  // 2. check out state
  const onceData = localCache.getOnceData()
  const oldState = onceData.wxGzhOAuthState
  if(oldState !== state) {
    console.warn("state 与 oldState 不匹配！！")
    console.log("oldState: ", oldState)
    console.log(" ")
    return
  }

  // 3 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  // 4. 清除 query
  rr.router.replace({ name: "login-wechat" })

  // 5. 去请求后端登录
  const res = await fetchOAuth("wx_gzh_oauth", code, state, enc_client_key)
  afterFetchingLogin(rr, res)
}

