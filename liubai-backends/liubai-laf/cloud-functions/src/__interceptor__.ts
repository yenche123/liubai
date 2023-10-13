import cloud from '@lafjs/cloud'

interface LiuAcAtom {
  lastVisitStamp: number
  lastLifeCircleStamp: number
  visitNum: number
  recentVisitStamps: number[]
}

// 一分钟内，最多允许访问的次数
const MAXIMUM_IN_ONE_MINUTE = 60

// 收集最近多少个访问时间戳
const VISITED_NUM = 60

// 允许不带 token 访问的云函数
const ALLOW_WITHOUT_TOKEN = [
  "__interceptor__",
  "hello-world",
]

export async function main(ctx: FunctionContext) {
  // 0. 获取请求的实际 IP
  const ip = ctx.headers?.['x-real-ip']
  console.log("--------> 当前来源 ip: ", ip)

  // 1. 判断 ip 是否存在，是否为 string 类型
  if(!ip) return false
  if(typeof ip !== "string") {
    console.warn(`当前 ip 不是 string 属性.......`)
    ctx.response?.send({ code: "E5001" })
    return false
  }

  // 2. 检查 ip
  const res = checkIp(ip)
  if(!res) {
    ctx.response?.send({ code: "E4003" })
    return false
  }

  // 3. 初步检查参数是否正确
  const res2 = checkEntry(ctx)
  if(!res2) {
    ctx.response?.send({ code: "E4000" })
    return false
  }

  // 4. 校验 token
  const res3 = checkToken(ctx)
  if(!res3) return false

  return true
}


/**
 * 检查入参是否正确
 */
function checkEntry(ctx: FunctionContext) {
  // 现在皆返回正确

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
  if(hasBlocked) return false

  const now = Date.now()

  // 2. 访问控制
  const liuAC: Map<string, LiuAcAtom> = gShared.get(`liu-access-control`) ?? new Map()
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
  const MINUTE = 60 * 1000

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

  if(visitNum > MAXIMUM_IN_ONE_MINUTE) {
    return false
  }

  return true
}

/** 初始化（重置）当前 ip 的访问控制 */
function _getLiuAcAtom(now: number) {
  const newIpAtom: LiuAcAtom = {
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

/** 检查 token */
function checkToken(ctx: FunctionContext) {
  const funcName = _getTargetCloudFuncName(ctx)
  if(!funcName) {
    console.warn(`获取云函数名称失败.......`)
    ctx.response?.send({ code: "E5001" })
    return false
  }

  const allowNoToken = ALLOW_WITHOUT_TOKEN.includes(funcName)
  if(allowNoToken) return true

  // console.log("去检查 token .....................")
  // console.log(`暂且先都通过`)

  return true
}