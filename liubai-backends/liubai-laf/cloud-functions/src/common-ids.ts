// 专门创建 id 们的工具函数
import * as crypto from "crypto"

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}

/********************* 工具函数们 ****************/

// 创建随机字符串
export function createRandom(digits: number = 30) {
  const ABC = "123456789abcdefghijkmnopqrstuvwxyz"
  const charset = ABC.length
  let randomString = ""
  for(let i=0; i<digits; i++) {
    const r = crypto.randomInt(0, charset)
    randomString += ABC[r]
  }
  return randomString
}

// 创建用于 user-login 接口的 "state"
export function createLoginState() {
  return "s0" + createRandom()
}