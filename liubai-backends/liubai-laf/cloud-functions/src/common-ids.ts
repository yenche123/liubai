// 专门创建 id 们的工具函数
import * as crypto from "crypto"

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}

/********************* 工具函数们 ****************/

// 创建随机字符串
export function createRandom(
  digits: number = 30,
  allowUppercase: boolean = false,
) {
  let abc = "123456789abcdefghijkmnopqrstuvwxyz"
  if(allowUppercase) {
    abc += "ABCDEFGHJKLMNPQRSTUVWXYZ"
  }

  const charset = abc.length
  let randomString = ""
  for(let i=0; i<digits; i++) {
    const r = crypto.randomInt(0, charset)
    randomString += abc[r]
  }
  return randomString
}

// 创建用于 user-login 接口的 "state"
export function createLoginState() {
  return "s0" + createRandom()
}

// 创建 token 
export function createToken() {
  let token = "tk_" + createRandom(17, true) + "-" + createRandom(17, true)
  token += ("-" + createRandom(17, true) + "-" + createRandom(17, true))
  return token
}

// 创建 credential for user-select
export function createCredentialForUserSelect() {
  const c = "cfus_" + createRandom(17, true) + "-" + createRandom(17, true)
  return c
}

// 创建 image id
export function createImgId() {
  return "i0" + createRandom(27)
}

// 创建邮箱验证码
// 结构: 四个英文字母-四个数字
export function createEmailCode() {
  let randomString = ""

  // 四个英文字母
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const charset = ABC.length
  for(let i=0; i<4; i++) {
    const r = crypto.randomInt(0, charset)
    randomString += ABC[r]
  }

  randomString += "-"

  // 四个数字
  const NUMS = "123456789"
  const len = NUMS.length
  for(let i=0; i<4; i++) {
    const r = crypto.randomInt(0, len)
    randomString += NUMS[r]
  }

  return randomString
}

