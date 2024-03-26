import ider from "~/utils/basic/ider"
import type { LiuPlainText } from "~/types/types-cloud"
import liuUtil from "~/utils/liu-util"
import valTool from "~/utils/basic/val-tool"
import type { CryptoCipherAndIV } from "~/types/other/types-custom"

export async function toEncrypt(data: any, client_key: string) {
  const newData: LiuPlainText = {
    pre: client_key.substring(0, 5),
    nonce: ider.createEncNonce(),
    data,
  }
  const str = valTool.objToStr(newData)
  const res = await liuUtil.crypto.encryptWithAES(str, client_key)
  return res
}

export async function toDecrypt(
  cipherAndIV: CryptoCipherAndIV,
  client_key: string,
) {
  const str = await liuUtil.crypto.decryptWithAES(cipherAndIV, client_key)
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