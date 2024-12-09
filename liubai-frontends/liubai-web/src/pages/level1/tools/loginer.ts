import { type Res_UserLoginNormal } from "~/requests/req-types";
import { type RouteAndLiuRouter } from "~/routes/liu-router";
import { useLoginStore } from "../login-page/tools/useLoginStore";
import localCache from "~/utils/system/local-cache";
import { redirectToLoginPage } from "./common-tools";
import { handleUser, handleSpaceAndMembers } from "./cloud-into-db";
import { LocalPreference } from "~/utils/system/tools/types";
import { CloudEventBus } from "~/utils/cloud/CloudEventBus";
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import liuConsole from "~/utils/debug/liu-console";
import time from "~/utils/basic/time";

interface ToLoginOpt {
  autoRedirect?: boolean  // auto redirect to `index` if success
                          // default: true
}

// 开始去初始化本地数据
async function toLogin(
  rr: RouteAndLiuRouter,
  d: Res_UserLoginNormal,
  opt?: ToLoginOpt,
) {
  const autoRedirect = opt?.autoRedirect ?? true

  // 1. 是否要选择用户
  const res1 = checkIfChooseAccounts(rr, d)
  if(res1) return false

  // 2. 已经确定用户（userId）开始登录流程
  // 2.1 检查参数是否存在
  const {
    userId,
    token,
    serial_id,
    spaceMemberList,
  } = d

  if(!userId) return false
  if(!token) return false
  if(!serial_id) return false
  if(!spaceMemberList) return false

  // 2.2 检查密钥是否存在
  const onceData = localCache.getOnceData()
  const ck = onceData.client_key
  if(!ck) {
    console.warn("本地密钥不存在.......")
    return false
  }

  // 2.3 get `goto` of query
  const goto = onceData.goto

  console.log("去登录当前用户 userId: ", userId)

  // 2.4 timer starts
  const t1 = performance.now()

  // 3. 创建 user
  const res2 = await handleUser(userId, d)
  if(!res2) return false

  // 4. 创建 member 和 workspace
  const res3 = await handleSpaceAndMembers(userId, spaceMemberList)
  if(!res3) return false

  // 5. 存入 localStorage
  const obj1: LocalPreference = {
    theme: d.theme,
    language: d.language,
    local_id: userId,
    open_id: d.open_id,
    token,
    serial: serial_id,
    client_key: ck,
    loginStamp: time.getTime(),
  }
  localCache.setAllPreference(obj1)

  // 6. 删除 onceData
  localCache.removeOnceDataWhileLogging()

  // 7. 把用户最近一次进入应用的时间戳设置为刚刚
  CloudEventBus.justLogged()

  // 8. 存入新的语言和主题
  const systemStore = useSystemStore()
  systemStore.setTheme(d.theme)
  systemStore.setLanguage(d.language)
  
  // 9. router 切换
  if(autoRedirect) {
    if(goto) {
      rr.router.replace(goto)
    }
    else {
      rr.router.replace({ name: "index" })
    }
  }
  

  // 10. timer ends
  const t2 = performance.now()
  const T = Math.round(t2 - t1)
  const msg = `init logging time: ${T}ms`
  console.log(msg)
  liuConsole.sendMessage(msg)

  return true
}

/** 跳转到去选择用户 */
function checkIfChooseAccounts(
  rr: RouteAndLiuRouter,
  d: Res_UserLoginNormal,
) {
  const {
    multi_credential,
    multi_credential_id,
    multi_users,
  } = d
  if(!multi_credential) return false
  if(!multi_credential_id) return false
  if(!multi_users) return false

  const loginStore = useLoginStore()
  loginStore.goToAccountsView(multi_users, multi_credential, multi_credential_id)

  redirectToLoginPage(rr)

  return true
}



export default {
  toLogin,
}