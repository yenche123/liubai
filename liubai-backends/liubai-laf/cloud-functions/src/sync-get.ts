import { 
  verifyToken,
  getDocAddId,
  checker,
  getAESKey,
  encryptDataWithAES,
  getDecryptedBody,
  getEncryptedData,
  valTool,
} from "@/common-util"
import {
  Sch_SyncGetAtom,
  type LiuRqReturn,
} from "@/common-types"
import cloud from '@lafjs/cloud'
import * as vbot from "valibot"

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {
  // 1. pre-check
  const res1 = preCheck()
  if(res1) return res1
  
  // 2. verify token
  const body = ctx.request?.body ?? {}
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn

  // 3. decrypt body
  const res3 = getDecryptedBody(body, vRes)
  if(!res3.newBody || res3.rqReturn) {
    return res3.rqReturn ?? { code: "E5001" }
  }

  // 4. check body
  const res4 = checkBody(res3.newBody)
  if(res4) return res4

  



  
}


function preCheck() {

  // 1. checking out the AES key of backend
  const backendAESKey = getAESKey()
  if(!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

}



function checkBody(
  body: Record<string, any>,
) {

  const { operateType, atoms } = body
  if(operateType !== "general_sync") {
    return { code: "E4000", errMsg: "operateType is not equal to general_sync" }
  }

  const Sch_Atoms = vbot.array(Sch_SyncGetAtom, [
    vbot.minLength(1),
    vbot.maxLength(5),
  ])
  const res1 = vbot.safeParse(Sch_Atoms, atoms)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }

  return null
}


