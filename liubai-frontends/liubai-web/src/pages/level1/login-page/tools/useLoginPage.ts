import { reactive } from "vue";
import type { LpData, LoginByThirdParty } from "./types";
import type { BoolFunc, LiuTimeout } from "~/utils/basic/type-tool";
import cui from "~/components/custom-ui";
import { 
  fetchInitLogin, 
  fetchSubmitEmail, 
  fetchEmailCode, 
  fetchUsersSelect,
} from "../../tools/requests";
import { getClientKey } from "../../tools/common-tools"
import { handle_google, handle_github } from "./handle-tap-oauth";
import time from "~/utils/basic/time"
import { encryptTextWithRSA, afterFetchingLogin } from "../../tools/common-utils"
import { loadGoogleIdentityService } from "./handle-gis"
import { isEverythingOkay, showEmojiTip, showOtherTip } from "../../tools/show-msg"
import { useLoginStore } from "./useLoginStore";
import { storeToRefs } from "pinia";
import { useLiuWatch } from "~/hooks/useLiuWatch";
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router";
import { onActivated, onDeactivated, toRef, watch, type WatchStopHandle } from "vue";

// 等待向后端调用 init 的结果
let initPromise: Promise<boolean>

// 避免 initPromise 还没 resolve 时，用户多次点击多次触发
let hasTap = false

export function useLoginPage() {

  const rr = useRouteAndLiuRouter()

  const lpData = reactive<LpData>({
    view: "main",
    email: "",
    accounts: [],
    isSendingEmail: false,
    isSubmittingEmailCode: false,
    isSelectingAccount: false,
  })

  // 0. 去监听登录成功后的 路由切换
  listenRouteAndLastLogged(rr, lpData)

  // 1. 去监听 loginStore 的变化
  listenLoginStore(lpData)

  // 2. 去获取 init 时的数据，比如 state / publicKey
  toGetLoginInitData(rr, lpData)


  // 等待 init 返回结果，并作简单的防抖节流
  const _waitInitLogin = async () => {
    if(hasTap) return false
    hasTap = true
    await initPromise
    hasTap = false
    return true
  }

  const onEmailSubmitted = async (email: string) => {
    const pass = await _waitInitLogin()
    if(!pass) return
    
    toSubmitEmailAddress(email, lpData)
  }

  // code 由 9 个字符组成，中间是一个 "-"
  const onSubmitCode = (code: string) => {
    toSubmitEmailAndCode(rr, code, lpData)
  }

  const onBackFromCode = () => {
    lpData.view = "main"
  }

  const onTapLoginViaThirdParty = async (tp: LoginByThirdParty) => {
    const pass = await _waitInitLogin()
    if(!pass) return

    whenTapLoginViaThirdParty(tp, lpData)
  }

  // 选择了某个用户之后
  const onSelectedAnAccount = (idx: number) => {
    toSelectAnAccount(rr, idx, lpData)
  }

  const onTapBack = () => {
    handleBack(rr, lpData)
  }


  return {
    lpData,
    onEmailSubmitted,
    onSubmitCode,
    onBackFromCode,
    onTapLoginViaThirdParty,
    onSelectedAnAccount,
    onTapBack,
  }
}

// 登录完成后，会进行路由切换
// 这个时候用户会等比较久，所以做一个变量（lastLogged）和路由监听
function listenRouteAndLastLogged(
  rr: RouteAndLiuRouter,
  lpData: LpData,
) {
  let watchStop: WatchStopHandle | undefined
  let timeout: LiuTimeout
  const lastLogged = toRef(lpData, "lastLogged")

  const _close = () => {
    cui.hideLoading()
    lpData.lastLogged = 0
    if(timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  const _setTimeout = () => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      // console.log("3s 到期............")
      timeout = undefined
      _close()
    }, 3000)
  }

  const _toListen = () => {
    watchStop = watch([lastLogged, rr.route], (
      [newLastLogged, newRoute]
    ) => {
      const newName = newRoute.name
      if(!newName || typeof newName !== "string") return
      if(!newLastLogged || newLastLogged <= 0) return

      const isInLoginPage = newName.startsWith("login")
      if(isInLoginPage) {
        // console.log("当前还在 login 相关页中，去新增三秒延迟以避免卡死")
        _setTimeout()
      }
      else {
        // console.log("路由已变化，去关闭 loading 弹窗")
        _close()
      }

    })
  }

  onActivated(() => {
    _toListen()
  })

  onDeactivated(() => {
    watchStop?.()
  })
}


function handleBack(
  rr: RouteAndLiuRouter,
  lpData: LpData,
) {
  const vi = lpData.view

  // 已在选择账号了，不支持返回
  if(vi === "accounts") return

  // 在输入 email 验证码页，返回到 main
  if(vi === "code") {
    lpData.view = "main"
    return
  }

  // [TODO] 剩下的，返回到 home
  
}



// 选定某一个用户
async function toSelectAnAccount(
  rr: RouteAndLiuRouter,
  idx: number,
  lpData: LpData,
) {

  // 1. 获取 userId
  const item = lpData.accounts[idx]
  if(!item) return
  const userId = item.user_id
  if(!userId) return

  // 1.5 判断是否可再登录
  if(!canLoginUsingLastLogged(lpData)) return

  // 2. 获取 multi 相关的参数
  const { 
    multi_credential: m1, 
    multi_credential_id: m2,
    state,
  } = lpData
  if(!m1 || !m2 || !state) return

  // 3. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  lpData.isSelectingAccount = true
  const res = await fetchUsersSelect(userId, m1, m2, state, enc_client_key)
  lpData.isSelectingAccount = false
  const res2 = await afterFetchingLogin(rr, res)
  if(res2) {
    cui.showLoading({ title_key: "login.logging2" })
    lpData.lastLogged = time.getTime()
  }
}

// 使用 lastLogged 参数判断是否可登录
function canLoginUsingLastLogged(
  lpData: LpData,
) {
  const s = lpData.lastLogged
  if(!s) return true
  const diff = (time.getTime() - s) / time.SECONED
  if(diff < 5) return false
  return true
}


// 去提交 email 地址以发送验证码
async function toSubmitEmailAddress(
  email: string,
  lpData: LpData,
) {
  if(!isEverythingOkay(lpData.initCode)) return
  const { state, lastSendEmail = 1, publicKey } = lpData
  if(!state || !publicKey) return
  if(lpData.isSendingEmail) return

  const now = time.getTime()
  const sec = (now - lastSendEmail) / time.SECONED
  
  let canSubmit = false
  if(email !== lpData.email) canSubmit = true
  else if(sec > 20) canSubmit = true    // 等 20s 就好，21~60s 去检查状态

  // 如果不允许提交，直接切换到 "code" view
  if(!canSubmit) {
    lpData.view = "code"
    return
  }

  const enc_email = await encryptTextWithRSA(publicKey, email)
  if(!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  lpData.isSendingEmail = true
  const res = await fetchSubmitEmail(enc_email, state)
  lpData.isSendingEmail = false

  console.log("fetchSubmitEmail res: ")
  console.log(res)
  console.log(" ")

  const { code, errMsg } = res
  if(code === "E4003" && errMsg === "last_event: bounced") {
    showEmojiTip("login.err_3", "😭")
    return
  }
  else if(code === "U0004" || code === "U0003") {
    console.warn("发送 email 出现关于 state 的异常")
    console.log(code)
    console.log(" ")
    showOtherTip("login.err_5", true)
    return
  }
  else if(code === "E4003" && errMsg === "last_event: complained") {
    showEmojiTip("login.err_2", "🥲")
  }

  lpData.email = email
  lpData.view = "code"
  lpData.lastSendEmail = time.getTime()
}

/** 记得做防抖节流，避免多次点击 */
async function toSubmitEmailAndCode(
  rr: RouteAndLiuRouter,
  code: string,
  lpData: LpData,
) {
  const { email, state, lastSubmitEmailCode = 1, publicKey } = lpData
  if(!state || !publicKey || !email) return
  if(lpData.isSubmittingEmailCode) return

  // 0. 判断是否可再登录
  if(!canLoginUsingLastLogged(lpData)) return

  const now = time.getTime()
  const milli = (now - lastSubmitEmailCode)
  if(milli < 1000) {
    cui.showSnackBar({ text_key: "login.err_4" })
    return
  }

  // 1. 获取加密的 email
  const enc_email = await encryptTextWithRSA(publicKey, email)
  if(!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  // 2. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if(!enc_client_key) return

  // 3. 去登录
  lpData.lastSubmitEmailCode = now
  lpData.isSubmittingEmailCode = true
  const res = await fetchEmailCode(enc_email, code, state, enc_client_key)
  lpData.isSubmittingEmailCode = false
  const res2 = await afterFetchingLogin(rr, res)
  if(res2) {
    cui.showLoading({ title_key: "login.logging2" })
    lpData.lastLogged = time.getTime()
  }
}


function listenLoginStore(lpData: LpData) {
  const loginStore = useLoginStore()
  const { view } = storeToRefs(loginStore)

  const whenViewChange = () => {
    const _v = view.value
    if(!_v) return

    const data = loginStore.getData()
    lpData.view = _v

    if(_v === "code") {
      lpData.email = data.email
      lpData.lastSendEmail = time.getTime()
    }
    else if(_v === "accounts") {
      lpData.accounts = data.accounts
      lpData.multi_credential = data.multi_credential
      lpData.multi_credential_id = data.multi_credential_id
    }
    loginStore.reset()
  }

  useLiuWatch(view, whenViewChange)
}

function whenTapLoginViaThirdParty(
  tp: LoginByThirdParty,
  lpData: LpData,
) {
  const { initCode } = lpData
  const isOkay = isEverythingOkay(initCode)
  if(!isOkay) return

  if(tp === "github") {
    handle_github(lpData)
  }
  else if(tp === "google") {
    handle_google(lpData)
  }
  else if(tp === "apple") {

  }
}



function toGetLoginInitData(
  rr: RouteAndLiuRouter,
  lpData: LpData,
) {
  const _request = async (a: BoolFunc) => {
    const res = await fetchInitLogin()
    const code = res?.code
    const data = res?.data

    console.log("code: ", code)
    console.log(" ")

    lpData.initCode = code
    if(!data || !data.publicKey) {
      a(false)
      return
    }

    lpData.publicKey = data.publicKey
    lpData.githubOAuthClientId = data.githubOAuthClientId
    lpData.googleOAuthClientId = data.googleOAuthClientId
    lpData.state = data.state
    lpData.initStamp = time.getTime()

    // google one-tap 登录后端流程已跑通
    // loadGoogleIdentityService(rr, lpData)
    a(true)
  }
  initPromise = new Promise(_request)
}