import { reactive, watch } from "vue"
import { type OpData } from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import typeCheck from "~/utils/basic/type-check"
import localCache from "~/utils/system/local-cache"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"

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

  // 3. 清除 query
  rr.router.replace({ name: "login-github" })

  // 4. 去请求后端登录
  const url = APIs.LOGIN
  const body = {
    operateType: "github_oauth",
    oauth_code: code,
  }
  const res = await liuReq.request(url, body)
  console.log(`enterFromGitHub res: `)
  console.log(res)
  console.log(" ")

}

function enterFromGoogle(
  opData: OpData,
  rr: RouteAndLiuRouter,
) {

}