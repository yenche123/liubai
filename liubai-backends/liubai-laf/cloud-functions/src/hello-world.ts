import { getNowStamp } from "@/common-time"

export async function main(ctx: FunctionContext) {
  const now = getNowStamp()
  const res = {
    code: `0000`,
    data: {
      stamp: now,
    }
  }
  return res
}
