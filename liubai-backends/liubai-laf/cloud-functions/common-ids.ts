// Function Name: common-ids

// 专门创建 id 们的工具函数
import * as crypto from "crypto"

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}

/******************** constants ***************/
const NUMS = "123456789"
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const abc = "abcdefghijkmnopqrstuvwxyz"

/********************* 工具函数们 ****************/

type LimitType = "allowUppercase" | "onlyUppercase" | "onlyNumber"

// 创建随机字符串
export function createRandom(
  digits: number = 30,
  limitType?: LimitType,
) {
  let alphabet = NUMS + abc
  if(limitType === "allowUppercase") {
    alphabet += ABC
  }
  else if(limitType === "onlyNumber") {
    alphabet = NUMS
  }
  else if(limitType === "onlyUppercase") {
    alphabet = ABC
  }

  const charset = alphabet.length
  let randomString = ""
  for(let i=0; i<digits; i++) {
    const r = crypto.randomInt(0, charset)
    randomString += alphabet[r]
  }
  return randomString
}

// 创建用于 user-login 接口的 "state"
export function createLoginState() {
  return "s0" + createRandom()
}

// 创建 token 
export function createToken() {
  let token = "tk_" + createRandom(17, "allowUppercase")
  token += ("-" + createRandom(17, "allowUppercase"))
  token += ("-" + createRandom(17, "allowUppercase"))
  token += ("-" + createRandom(17, "allowUppercase"))
  return token
}

// 创建 credential for user-select
export function createCredentialForUserSelect() {
  let c = "cfus_" + createRandom(17, "allowUppercase")
  c += ("-" + createRandom(17, "allowUppercase"))
  return c
}

// 创建 image id
export function createImgId() {
  return "i0" + createRandom(27)
}

// 创建邮箱验证码
// 结构: 四个英文字母-四个数字
export function createEmailCode() {
  
  // 先四个大写的英文字母
  let randomString = createRandom(4, "onlyUppercase")

  // 用 "-" 衔接
  randomString += "-"

  // 再四个数字
  randomString += createRandom(4, "onlyNumber")

  return randomString
}


/** 创建 order 单号 */
export function createOrderId() {
  // LD + 4 位数字 + 4 位大写字母 + 4 位数字
  let randomString = "LD" + createRandom(4, "onlyNumber")
  randomString += createRandom(4, "onlyUppercase")
  randomString += createRandom(4, "onlyNumber")
  return randomString
}

/** 创建加密数据里的 nonce */
export function createEncNonce() {
  return createRandom(10)
}

export function createFileRandom() {
  return createRandom(4, "onlyUppercase")
}

export function createOpenId() {
  return "op0" + createRandom(16)
}

export function createBindCredential() {
  return "bc0" + createRandom(16)
}

export function createSignInCredential() {
  return "si0" + createRandom(16)
}

