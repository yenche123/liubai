// 全局类型
// Table_ 开头，表示为数据表结构
// Shared_ 开头，表示为全局缓存 cloud.shared 所涉及的结构

export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}

/************ 数据表类型 ************/

/** 屏蔽表 */
export interface Table_BlockList {
  type: "ip"
  isOn: "Y" | "N"
  value: string
}


/************ 缓存类型 ************/

/** 访问控制每一个 ip */
export interface Shared_LiuAcAtom {
  lastVisitStamp: number
  lastLifeCircleStamp: number
  visitNum: number
  recentVisitStamps: number[]
}
