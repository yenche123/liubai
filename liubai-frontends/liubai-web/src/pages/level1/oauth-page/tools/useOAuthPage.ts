import { reactive, watch } from "vue"
import { type OpData } from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import typeCheck from "~/utils/basic/type-check"
import localCache from "~/utils/system/local-cache"
import { fetchOAuth, type Fetch_UserLoginNormal } from "../../tools/requests"

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

  if(!code || !typeCheck.isString(code)) return
  if(!state || !typeCheck.isString(state)) return

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

  // 2.5 获取 enc_client_key
  const enc_client_key = onceData.enc_client_key
  if(!enc_client_key) {
    console.warn("enc_client_key is required")
    console.log(" ")
    return
  }

  // 3. 清除 query
  rr.router.replace({ name: "login-github" })

  // 4. 去请求后端登录
  const res = await fetchOAuth("github_oauth", code, state, enc_client_key)
  afterFetching(opData, rr, res)
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

  if(!code || !typeCheck.isString(code)) return
  if(!state || !typeCheck.isString(state)) return

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

  // 2.5 获取 enc_client_key
  const enc_client_key = onceData.enc_client_key
  if(!enc_client_key) {
    console.warn("enc_client_key is required")
    console.log(" ")
    return
  }

  // 3. 清除 query
  rr.router.replace({ name: "login-google" })

  // 4. 去请求后端登录
  const redirect_uri = location.origin + "/login-google"
  const res = await fetchOAuth("google_oauth", code, state, enc_client_key, redirect_uri)
  afterFetching(opData, rr, res)
}

function afterFetching(
  opData: OpData,
  rr: RouteAndLiuRouter,
  res: Fetch_UserLoginNormal,
) {
  console.log("afterFetching.........")
  console.log(res)
  console.log(" ")


  // 1. 如果需要验证 email，路由切换到输入验证码的页面

  // 2. 其他异常，弹提示；提示完回到 login 页

  // 3. 走登录流程


}

