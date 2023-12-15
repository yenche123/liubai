import { type Res_UserLoginNormal } from "~/requests/data-types";
import { type RouteAndLiuRouter } from "~/routes/liu-router";
import { useLoginStore } from "../login-page/tools/useLoginStore";
import localCache from "~/utils/system/local-cache";
import { redirectToLoginPage } from "./common-tools";

// 开始去初始化本地数据
function toLogin(
  rr: RouteAndLiuRouter,
  d: Res_UserLoginNormal,
) {

  // 1. 是否要选择用户
  const res1 = checkIfChooseAccounts(rr, d)
  if(res1) return

  // 2. 已经确定用户（userId）开始登录流程
  // 2.1 检查参数是否存在
  const {
    userId,
    token,
    serial_id,
    spaceMemberList,
  } = d

  if(!userId) return
  if(!token) return
  if(!serial_id) return
  if(!spaceMemberList) return

  // 2.2 检查密钥是否存在
  const onceData = localCache.getOnceData()
  const ck = onceData.client_key
  if(!ck) {
    console.warn("本地密钥不存在.......")
    return
  }


  console.log("去登录当前用户 userId: ", userId)

  // 3. 创建 user
  

}

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