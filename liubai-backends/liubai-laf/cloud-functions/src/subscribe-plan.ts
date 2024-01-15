import cloud from "@lafjs/cloud";
import Stripe from "stripe";
import { verifyToken } from '@/common-util';
import type { Table_User } from "@/common-types";

const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. 验证 token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }

  const oT = body.operateType
  if(oT === "info") {

  }
  else if(oT === "create_stripe") {

  }
  else if(oT === "cancel_subscription") {

  }

}


/** 获取订阅方案的消息 */
async function handle_info() {
  
}

/** 创建 stripe checkout session */
async function handle_create_stripe(
  user: Table_User,
) {

  // 1. 去查看 user 是否已经
  
}

