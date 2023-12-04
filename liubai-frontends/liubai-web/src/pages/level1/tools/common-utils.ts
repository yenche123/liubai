import cui from "~/components/custom-ui";
import liuUtil from "~/utils/liu-util";

/** 拿到 RSA Public Key 之后，去生成的 AES key，并对其加密 */
export async function getClientKeyEncrypted(
  pem_public_key: string
) {
  const aesKey = await liuUtil.crypto.createKeyWithAES()
  const client_key = `client_key_${aesKey}`
  const pk = await liuUtil.crypto.importRsaPublicKey(pem_public_key)
  if(!pk) {
    console.warn("导入 rsa 密钥失败")
    return ""
  }
  const cipherStr = await liuUtil.crypto.encryptWithRSA(pk, client_key)
  return cipherStr
}

export async function encryptTextWithRSA(pem: string, text: string) {
  const pk = await liuUtil.crypto.importRsaPublicKey(pem)
  if(!pk) return
  const cipherStr = await liuUtil.crypto.encryptWithRSA(pk, text)
  return cipherStr 
}

// 处理未知的登录异常
export async function showLoginErrMsg(
  code: string,
  errMsg?: string,
  showMsg?: string,
) {
  let content_key = "tip.try_again_later"
  let content_opt: Record<string, string> | undefined
  if(showMsg) {
    content_key = "login.err_7"
    content_opt = { errMsg: showMsg, code }
  }
  else if(errMsg) {
    content_key = "login.err_7"
    content_opt = { errMsg, code }
  }
  else {
    console.warn("没有 errMsg 和 showMsg 的错误")
    console.log(code)
    console.log(" ")
    return false
  }

  await cui.showModal({
    title_key: "login.err_login",
    content_key,
    content_opt,
    showCancel: false,
  })
  return true
}