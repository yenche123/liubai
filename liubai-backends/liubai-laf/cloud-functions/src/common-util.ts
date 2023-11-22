// 存放一些公共函数
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { SupportedLocale } from './common-types'


/********************* 常量 ****************/
export const reg_exp = {
  // 捕捉 整个字符串都是 email
  email_completed: /^[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*$/g,
}


/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with common-util")
  return true
}

/********************* Crypto 加解密相关的函数 ****************/

/**
 * 使用 RSA 的密钥解密数据
 * @param encryptedText base64 格式的密文
 */
export function decryptWithRSA(encryptedText: string) {
  const pk = getPrivateKey()
  if(!pk) {
    return { err: "no private key" }
  }

  const privateKeyObj = crypto.createPrivateKey({
    key: pk,
    format: 'pem',
    type: 'pkcs8',
  })

  const buffer = Buffer.from(encryptedText, "base64")
  
  try {
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKeyObj,
        oaepHash: "SHA256"
      },
      buffer
    )
    console.log("解密出来的结果: ")
    console.log(decryptedData)
    console.log(" ")
    const plainText = decryptedData.toString('utf8')
    console.log("plainText: ")
    console.log(plainText)
    console.log(" ")
  }
  catch(err1) {
    console.warn("解密失败........")
    console.log(err1)
    console.log(" ")
  }

  return { msg: "先这样" }
}

/** 获取 RSA private key */
function getPrivateKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const privateKey = keyPair?.privateKey
  if(!privateKey) return undefined
  return privateKey as string
}


/********************* 一些 “归一化” 相关的函数 *****************/

/** 检测 val 是否为 email，若是则全转为小写 */
export function isEmailAndNormalize(val: any) {
  if(!val || typeof val !== "string") return false

  // 最短的 email 应该长这样 a@b.cn 至少有 6 个字符
  if(val.length < 6)  return false

  // 使用正则判断是否为 email
  const m = val.match(reg_exp.email_completed)
  let isEmail = Boolean(m?.length)
  if(!isEmail) return false

  // 确保第一个字符和最后一个字符 不会是 \. 和 -
  const tmps = [".", "-"]
  const firstChar = val[0]
  if(tmps.includes(firstChar)) return false
  const lastChar = val[val.length - 1]
  if(tmps.includes(lastChar)) return false

  const newVal = val.toLowerCase()
  return newVal
}

export function normalizeLanguage(val: string): SupportedLocale {
  val = val.toLowerCase()
  if(!val) return "en"

  if(val === "zh-tw") return "zh-Hant"
  if(val === "zh-hk") return "zh-Hant"
  if(val === "zh-cn") return "zh-Hans"
  if(val.startsWith("zh")) return "zh-Hans"

  return "en"
}


