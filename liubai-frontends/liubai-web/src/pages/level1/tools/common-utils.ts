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