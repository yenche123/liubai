import cloud from "@lafjs/cloud";
import Stripe from "stripe";
import { verifyToken, getIpArea } from '@/common-util';
import type { 
  Table_Subscription, 
  Table_User,
  Res_SubPlan_Info,
  LiuRqReturn,
} from "@/common-types";


const db = cloud.database()

// stripe 的取消订阅，交由 stripe 托管的收据页面去管理
// 应用负责接收 webhook 再去修改订阅信息

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. 验证 token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  const oT = body.operateType
  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "info") {
    res = await handle_info(ctx)
  }
  else if(oT === "create_stripe") {
    handle_create_stripe(user)
  }

  return res
}


/** 获取订阅方案的消息 */
async function handle_info(
  ctx: FunctionContext,
) {
  const col = db.collection("Subscription")
  const res = await col.where({ isOn: "Y" }).getOne<Table_Subscription>()

  const d = res.data
  if(!d) return { code: "E4004" }

  let currency = getSupportedCurrency(ctx)

  //@ts-ignore price
  let price: string | undefined = d[`price_${currency}`]
  if(!price) {
    price = d.price_USD
    if(!price) {
      return { code: "E4004", errMsg: "there is no currency matched" }
    }
    currency = "USD"
  }

  const r: Res_SubPlan_Info = {
    id: d._id,
    payment_circle: d.payment_circle,
    badge: d.badge,
    title: d.title,
    desc: d.desc,
    stripe: d.stripe,
    price,
    currency,
  }
  
  return { code: "0000", data: r }
}

/** [Warning]: 待确认
 *  Get the currency based on ip
 */
function getSupportedCurrency(
  ctx: FunctionContext,
) {
  const area = getIpArea(ctx)
  let c = "USD"
  if(!area) return c

  if(area === "AU") {
    c = "AUD"
  }
  else if(area === "CN") {
    c = "CNY"
  }
  else if(area === "JP") {
    c = "JPY"
  }
  else if(area === "NZ") {
    c = "NZD"
  }
  else if(area === "TW") {
    c = "TWD"
  }

  return c
}



/** 创建 stripe checkout session */
async function handle_create_stripe(
  user: Table_User,
) {

  // 1. 去查看 user 是否已经订阅
  
}

