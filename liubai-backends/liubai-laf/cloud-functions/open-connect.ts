import { 
  getNowStamp,
  MINUTE,
} from "@/common-time"
import cloud from "@lafjs/cloud"
import type { 
  OpenConnectOperate,
  LiuRqReturn,
  VerifyTokenRes_B,
  Table_Member,
  Table_Credential,
  Ww_Add_Contact_Way,
} from "@/common-types"
import { getWwQynbAccessToken, liuReq, verifyToken } from "@/common-util"
import { createBindCredential } from "@/common-ids"

const db = cloud.database()

const API_WECOM_ADD_CONTACT = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_contact_way"

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType as OpenConnectOperate


  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "bind-wecom") {
    handle_bind_wecom(vRes, body)
  }
  else if(oT === "check-wecom") {

  }


  return res
}


async function handle_bind_wecom(
  vRes: VerifyTokenRes_B,
  body: Record<string, string>,
) {

  // 0. get params
  const userId = vRes.userData._id

  // 1. return directly if ww_qynb_external_userid exists
  const { ww_qynb_external_userid } = vRes.userData
  if(ww_qynb_external_userid) {
    return { code: "Y0001" }
  }

  // 2. checking out memberId
  const memberId = body.memberId
  if(memberId) {
    const mCol = db.collection("Member")
    const res2 = await mCol.doc(memberId).get<Table_Member>()
    const d2 = res2.data
    if(!d2) {
      return { code: "E4004", errMsg: "there is no memeber" }
    }
    if(d2._id !== userId) {
      return { code: "E4003" }
    }
  }

  // 3. checking out credential
  const cCol = db.collection("Credential")
  const w3 = {
    infoType: "bind-wecom",
    userId,
  }
  const res3 = await cCol.where(w3).get<Table_Credential>()
  const list3 = res3.data
  const fir3 = list3[0]


  // 4. checking if expired
  const now = getNowStamp()
  const e4 = fir3?.expireStamp ?? 1
  const c4 = fir3?.credential
  const qr4 = fir3?.meta_data?.qr_code
  const diff4 = e4 - now
  if(diff4 > MINUTE && c4 && qr4) {
    return {
      code: "0000",
      data: {
        operateType: "bind-wecom",
        qr_code: qr4,
        credential: c4,
      },
    }
  }

  // 6. get wecom userid
  const res5 = getWeComBotId()
  const bot_id = res5.data?.bot_id
  if(!bot_id) {
    return res5
  }

  // 6. get wecom accessToken
  const accessToken = await getWwQynbAccessToken()
  if(!accessToken) {
    return { code: "E5001", errMsg: "wecom accessToken not found" }
  }
  
  
  // 7. generate credential
  const cred = createBindCredential()
  const state = `b1=${cred}`
  const w7 = {
    access_token: accessToken,
    type: 1,
    scene: 2,
    state,
    user: [bot_id],
  }
  const url7 = API_WECOM_ADD_CONTACT
  console.log("to request wecom for adding contact way: ")
  console.log(w7)
  const res7 = await liuReq<Ww_Add_Contact_Way>(url7, w7)
  console.log("res7: ")
  console.log(res7)

  // 8. extract data from wecom
  const res8 = res7.data
  const c8 = res8?.config_id
  const qr8 = res8?.qr_code
  if(!c8 || !qr8) {
    console.log("res7: ")
    console.log(res7)

    return {
      code: "E5004",
      errMsg: "wecom config_id or qr_code not found",
    }
  }


  // 9. add credential into db
  



}



function getWeComBotId(): LiuRqReturn {
  const bot_ids = process.env.LIU_WECOM_QYNB_BOT_IDS
  if(!bot_ids) {
    return { code: "E5001", errMsg: "wecom bot_ids not found" }
  }
  const bot_list = bot_ids.split(",")
  const len = bot_list.length
  if(len < 1) {
    return { code: "E5001", errMsg: "getting wecom bot_id fails" }
  }

  const idx = Math.floor(Math.random() * len)
  const bot_id = bot_list[idx]
  if(!bot_id) {
    return { code: "E5001", errMsg: "bot_id is empty" }
  }

  return { code: "0000", data: { bot_id } }
}



async function handle_check_wecom() {
  
}
