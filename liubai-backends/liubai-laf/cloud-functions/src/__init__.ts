import cloud from '@lafjs/cloud'
import type { Table_BlockList } from "@/common-types"

export async function main(ctx: FunctionContext) {
  console.log("__init__ 开始运行............")
  await initBlockedIPs()

  return { data123: "Hi! __init__ has been run" }
}


/** 初始化被屏蔽的 ip */
async function initBlockedIPs() {
  const db = cloud.database()
  const w = {
    type: "ip",
    isOn: "Y",
  }
  const res = await db.collection("BlockList").where(w).get<Table_BlockList>()
  console.log("查看获取被屏蔽 ip 的结果: ")
  console.log(res)
  const list = res.data


  if(list.length < 1) {
    console.log("没有 ip 需要屏蔽.....")
    return true
  }

  const ips = list.map(v => {
    return v.value
  })

  console.log("去屏蔽这些 ips: ", ips)
  cloud.shared.set(`liu-blocked-ips`, ips)

  return true
}