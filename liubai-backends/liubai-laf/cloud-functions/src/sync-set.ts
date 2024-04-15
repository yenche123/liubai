import { 
  checkIfUserSubscribed, 
  verifyToken,
} from "@/common-util"
import type { 
  LiuRqReturn,
  SyncSetAtom,
} from "@/common-types"
import { liuUploadTasks } from "@/common-types"

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  // 1. pre-check
  const res1 = preCheck(body)
  if(res1) return res1
  
  // 2. verify token
  const vRes = await verifyToken(ctx, body)
  const user = vRes.userData
  if(!vRes.pass || !user) {
    return vRes.rqReturn ?? { code: "E5001" }
  }
  
  
}


function preCheck(
  body: Record<string, any>,
): LiuRqReturn | null {

  const { operateType, atoms } = body
  if(operateType !== "general_sync") {
    return { code: "E4000", errMsg: "operateType is not equal to general_sync" }
  }

  if(!atoms || !Array.isArray(atoms)) {
    return { code: "E4000", errMsg: "no atoms in body" }
  }

  if(atoms.length < 1) {
    return { code: "E4000" , errMsg: "atoms.length is meant to be bigger than 0" }
  }

  if(atoms.length > 10) {
    return { 
      code: "E4000" , 
      errMsg: "atoms.length is meant to be smaller than or equal to 10", 
    }
  }

  const list = atoms as SyncSetAtom[]
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(!v.taskType) {
      return { code: "E4000", errMsg: `one of taskType is empty` }
    }
    const existed = liuUploadTasks.includes(v.taskType)
    if(!existed) {
      return { code: "E4000", errMsg: "one of taskType is not in liuUploadTasks" }
    }

    // TODO

  }

  return null
}