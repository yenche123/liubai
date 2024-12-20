// Function Name: __interceptor__
import cloud from '@lafjs/cloud'
import type { 
  BaseIsOn,
  Shared_AccessControl,
  LiuRqReturn,
} from "@/common-types"
import { Sch_X_Liu, Sch_IP } from "@/common-types"
import { getNowStamp, SECONED, MINUTE } from "@/common-time"
import { getIp } from "@/common-util"
import * as vbot from "valibot"

/****************** 一些常量 *****************/

// 一分钟内，最多允许访问的次数
const MAXIMUM_IN_ONE_MINUTE = 60

// 1s 内，最大访问次数
const MAXIMUM_IN_ONE_SEC = 5

// 收集最近多少个访问时间戳
const VISITED_NUM = 60

// 允许不带 token 访问的云函数
const ALLOW_WITHOUT_TOKEN = [
  "hello-world",
  "user-login",
  "payment-order",
]

/****************** 函数组成 *****************/

export async function main(
  ctx: FunctionContext, next: any
) {

  // 0.1 获取云函数名
  const funcName = _getTargetCloudFuncName(ctx)
  if(!funcName) {
    console.warn(`获取云函数名称失败.......`)
    ctx.response?.send({ code: "E5001" })
    return false
  }

  // 0.2 获取请求的实际 IP
  const ip = getIp(ctx)

  // 0.3 是否直接通过
  const preRes = preCheck(ctx, funcName, ip)
  if(preRes === "Y") {
    const nextRes1 = await toNext(ctx, next)
    return nextRes1
  }
  if(preRes === "N") {
    console.warn("非法访问.............")
    console.log("=========== 当前入参特征信息 ===========")
    console.log("目标函数: ", funcName)
    console.log("当前 ip: ", ip)
    console.log("=========== ============== ===========")
    return { code: "E4003" }
  }
  

  // 0.4 检查服务端是否已关闭
  const env = process.env
  if(env.LIU_CLOUD_ON === "02") {
    return { code: "B0001" }
  }

  // 1. 判断 ip 是否存在，是否为 string 类型，是否为 ip 的格式
  const res1 = vbot.safeParse(Sch_IP, ip)
  if(!res1.success) {
    console.warn("the ip format is wrong")
    console.log(ip)
    console.log(res1.success)
    return { code: "E5001", errMsg: "the ip format is wrong" }
  }

  // 2. 检查 ip
  const res2 = checkIp(res1.output)
  if(!res2) {
    console.log(ctx.headers)
    console.log(ctx.body)
    return { code: "E4003", errMsg: "sorry, we cannot serve you" }
  }

  // 3. 检查是否为第三方服务访问我方 webhook
  const isWebhook = funcName.startsWith("webhook-")
  if(isWebhook) {
    const nextRes2 = await toNext(ctx, next)
    return nextRes2
  }
  

  // 4. 最后检查参数是否正确
  const res4 = checkEntry(ctx, funcName)
  if(!res4) {
    return { code: "E4000", errMsg: "checkEntry error......" }
  }

  // 5. toNext
  const res5 = await toNext(ctx, next)
  return res5
}


async function toNext(
  ctx: FunctionContext,
  next: any,
) {
  let nextRes: LiuRqReturn<any> | null = null
  try {
    nextRes = await next(ctx)
  }
  catch(err: any) {
    console.error(`next 异常`)
    console.log(err)
    return { code: `E5002` }
  }

  return nextRes
}


function preCheck(
  ctx: FunctionContext, 
  funcName: string,
  ip: string | string[] | undefined
): BaseIsOn | null {
  const theHeaders = ctx.headers ?? {}
  const xLafTriggerToken = theHeaders['x-laf-trigger-token']
  const debugKey = theHeaders['x-liu-debug-key']

  const _env = process.env
  let isDebugging = false
  if(debugKey && debugKey === _env.LIU_DEBUG_KEY) {
    isDebugging = true
  }

  // console.log(" ")
  // console.log("=========== 当前入参特征信息 ===========")
  // console.log("debugKey: ", debugKey)
  // console.log("isDebugging: ", isDebugging)
  // console.log("目标函数: ", funcName)
  // console.log("当前 ip: ", ip)
  // console.log("x-laf-trigger-token: ", xLafTriggerToken)
  // console.log("=========== ============== ===========")


  // 1. 如果是 __init__ 函数，直接通过
  if(funcName === `__init__`) {
    if(isDebugging) return "Y"
    return "N"
  }

  // 2. 如果是 __interceptor__
  if(funcName === "__interceptor__") {
    if(isDebugging) return "Y"
    return "N"
  }

  // 3. debug 系统，暂时通过
  if(funcName.startsWith("debug-")) {
    if(isDebugging) return "Y"
    return "N"
  }

  // 4. 定时系统，暂时通过
  if(funcName.startsWith("clock-")) {
    if(xLafTriggerToken) return "Y"
    if(isDebugging) return "Y"
    return "N"
  }
  
  return null
}



/**
 * 检查入参是否正确
 */
function checkEntry(ctx: FunctionContext, funcName: string) {

  // 1. 检查常规的 x_liu_
  const body = ctx.request?.body ?? {}
  const res1 = vbot.safeParse(Sch_X_Liu, body)
  if(!res1.success) {
    console.warn("checking out x_liu_ fields failed.......")
    console.log(res1.issues)
    return false
  }

  // 2. 是否无需 token
  const allowNoToken = ALLOW_WITHOUT_TOKEN.includes(funcName)
  if(allowNoToken) return true

  const token = body["x_liu_token"]
  const tokenId = body["x_liu_serial"]
  if(!token || token.length < 32) return false
  if(!tokenId) return false

  return true
}

/**
 * 检查 ip 是否被允许访问
 * @param ip 请求来源的 ip
 * @returns true: 允许；false: 拒绝
 */
function checkIp(ip: string) {

  const gShared = cloud.shared

  // 1. 检查是否在屏蔽名单中
  const blockedIps: string[] = gShared.get(`liu-blocked-ips`) ?? []
  const hasBlocked = blockedIps.includes(ip)
  if(hasBlocked) {
    console.warn(`ip ${ip} is blocked!`)
    return false
  }

  const now = getNowStamp()

  // 2. 访问控制
  const liuAC: Map<string, Shared_AccessControl> = gShared.get(`liu-access-control`) ?? new Map()
  const ipAtom = liuAC.get(ip)

  // 3. 若 ip 数据不存在，初始化该 ip 后通过
  if(!ipAtom) {
    const newIpAtom = _getLiuAcAtom(now)
    liuAC.set(ip, newIpAtom)
    gShared.set(`liu-access-control`, liuAC)
    return true
  }

  const {
    lastLifeCircleStamp,
    recentVisitStamps = []
  } = ipAtom
  const diff = now - lastLifeCircleStamp

  // 4. 收集最近 VISITED_NUM 个访问时间戳
  recentVisitStamps.push(now)
  const diff2 = recentVisitStamps.length - VISITED_NUM
  if(diff2 > 0) {
    recentVisitStamps.splice(0, diff2)
  }

  // 5. 上一次访问周期到现在 已经超过 1 分钟了，重置数据
  if(diff > MINUTE) {
    const newIpAtom = _getLiuAcAtom(now)
    newIpAtom.recentVisitStamps = recentVisitStamps
    liuAC.set(ip, newIpAtom)
    return true
  }

  // 6. 多数情况下的访问
  let visitNum = ipAtom.visitNum + 1
  ipAtom.lastVisitStamp = now
  ipAtom.visitNum = visitNum
  ipAtom.recentVisitStamps = recentVisitStamps
  liuAC.set(ip, ipAtom)

  
  // 7. 检查 1s 内的访问次数
  // 即查看 recentVisitStamps 里倒数第 7（MAXIMUM_IN_ONE_SEC + 1）个，是否在 1s 以内
  const rLen = recentVisitStamps.length
  if(rLen > MAXIMUM_IN_ONE_SEC) {
    const idx = rLen - (MAXIMUM_IN_ONE_SEC + 1)
    const item = recentVisitStamps[idx]
    const diff3 = now - item
    if(diff3 < SECONED) {
      console.warn(`too many requests from ip ${ip} in 1 second`)
      return false
    }
  }

  // 8. 检查 1 分钟内的访问次数
  if(visitNum > MAXIMUM_IN_ONE_MINUTE) {
    console.warn(`too many requests from ip ${ip} in 1 minute`)
    return false
  }

  return true
}

/** 初始化（重置）当前 ip 的访问控制 */
function _getLiuAcAtom(now: number) {
  const newIpAtom: Shared_AccessControl = {
    lastVisitStamp: now,
    lastLifeCircleStamp: now,
    visitNum: 1,
    recentVisitStamps: [now],
  }
  return newIpAtom
}

/** 获取目标云函数的名称 */
function _getTargetCloudFuncName(ctx: FunctionContext) {
  const p = ctx.request?.path
  if(!p || p.length < 2) return ``
  const name = p.substring(1)
  return name
}
