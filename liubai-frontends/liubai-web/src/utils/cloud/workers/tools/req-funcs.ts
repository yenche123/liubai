import type { CryptoCipherAndIV } from "~/types/other/types-custom"
import type { LiuPlainText } from "~/types/types-cloud"
import ider from "~/utils/basic/ider"
import valTool from "~/utils/basic/val-tool"
import liuCrypto from "~/utils/liu-util/crypto-util"

export async function handleBeforeFetching(
  body: any,
  client_key: string,
) {
  const keys = Object.keys(body)
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("plz_enc_")) continue
    const newK = k.replace("plz_enc_", "liu_enc_")
    const data = body[k]
    const res = await toEncrypt(data, client_key)
    body[newK] = res as any
    delete body[k]
  }
}

export async function handleAfterFetching(
  data: any,
  client_key: string,
) {

  if(typeof data !== "object") return data
  
  const keys = Object.keys(data)
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    const v = data[k]
    if(!k.startsWith("liu_enc_")) continue
    const newK = k.replace("liu_enc_", "")
    const res = await toDecrypt(v, client_key)
    if(res === undefined) {
      return
    }
    data[newK] = res
    delete data[k]
  }

  return data
}

async function toEncrypt(data: any, client_key: string) {
  
  const newData: LiuPlainText = {
    pre: client_key.substring(0, 5),
    nonce: ider.createEncNonce(),
    data,
  }
  const str = valTool.objToStr(newData)
  const res = await liuCrypto.encryptWithAES(str, client_key)
  return res
}

async function toDecrypt(
  cipherAndIV: CryptoCipherAndIV,
  client_key: string,
) {
  const str = await liuCrypto.decryptWithAES(cipherAndIV, client_key)
  const lpt = valTool.strToObj(str)

  if(lpt.pre !== client_key.substring(0, 5)) {
    console.warn("toDecrypt error")
    console.log("lpt.pre is not equal to client_key.substring(0, 5)")
    console.log(lpt.pre)
    console.log(client_key)
    return
  }
  
  return lpt.data
}