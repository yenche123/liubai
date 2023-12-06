

// 拿到 token / serial / userId 之后

import { type Res_UserLoginNormal } from "~/requests/data-types";
import { type RouteAndLiuRouter } from "~/routes/liu-router";
import { useLoginStore } from "../login-page/tools/useLoginStore";

// 开始去初始化本地数据
function toLogin(
  rr: RouteAndLiuRouter,
  d: Res_UserLoginNormal,
) {

  // 1. 是否要选择用户
  const res1 = checkIfChooseAccounts(rr, d)
  if(res1) return

  // 2. 开始登录流程
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

  const n = rr.route.name
  if(n !== "login") {
    rr.router.replace({ name: "login" })
  }

  return true
}



export default {
  toLogin,
}