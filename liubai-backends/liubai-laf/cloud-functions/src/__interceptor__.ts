import cloud from '@lafjs/cloud'

interface LiuAcAtom {
  lastVisitStamp: number
  lastLifeCircleStamp: number
  visitNum: number
}

// 一分钟内，最多允许访问的次数
const MAXIMUM_IN_ONE_MINUTE = 60

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

  if(!ipAtom) {
    const newIpAtom = _getLiuAcAtom(now)
    liuAC.set(ip, newIpAtom)
    return true
  }

  const lastLifeCircleStamp = ipAtom.lastLifeCircleStamp ?? 1
  const diff = now - lastLifeCircleStamp
  const MINUTE = 60 * 1000

  // 上一次访问周期到现在 已经超过 1 分钟了，重置数据
  if(diff > MINUTE) {
    const newIpAtom = _getLiuAcAtom(now)
    liuAC.set(ip, newIpAtom)
    return true
  }

  let visitNum = ipAtom.visitNum + 1

  ipAtom.lastVisitStamp = now
  ipAtom.visitNum = visitNum
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
  }
  return newIpAtom
}