// Function Name: open-connect
import { 
  getNowStamp,
  getBasicStampWhileAdding,
  MINUTE,
} from "@/common-time"
import cloud from "@lafjs/cloud"
import type { 
  OpenConnectOperate,
  LiuRqReturn,
  LiuErrReturn,
  VerifyTokenRes_B,
  Table_Member,
  Table_Credential,
  Ww_Res_Add_Contact_Way,
  Res_OC_CheckWeCom,
  Res_OC_BindWeCom,
  Res_OC_GetWeChat,
  Table_User,
  Wx_Res_Create_QR,
  Res_OC_BindWeChat,
} from "@/common-types"
import { getWeChatAccessToken, getWwQynbAccessToken, liuReq, verifyToken } from "@/common-util"
import { createBindCredential } from "@/common-ids"

const db = cloud.database()

const API_WECOM_ADD_CONTACT = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_contact_way"
const API_WECHAT_CREATE_QRCODE = "https://api.weixin.qq.com/cgi-bin/qrcode/create"
const MIN_10 = 10 * MINUTE

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}
  const oT = body.operateType as OpenConnectOperate


  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "bind-wecom") {
    res = await handle_bind_wecom(vRes, body)
  }
  else if(oT === "check-wecom") {
    res = await handle_check_wecom(vRes, body)
  }
  else if(oT === "get-wechat") {
    res = await handle_get_wechat(vRes, body)
  }
  else if(oT === "set-wechat") {
    res = await handle_set_wechat(vRes, body)
  }
  else if(oT === "bind-wechat") {
    res = await handle_bind_wechat(vRes, body)
  }
  else if(oT === "check-wechat") {
    handle_check_wechat(vRes, body)
  }

  return res
}


async function handle_check_wechat(
  vRes: VerifyTokenRes_B,
  body: Record<string, any>,
) {
  
}

async function handle_bind_wechat(
  vRes: VerifyTokenRes_B,
  body: Record<string, any>,
): Promise<LiuRqReturn<Res_OC_BindWeChat>> {
  // 0. get params
  const userId = vRes.userData._id

  // 1. return directly if wx_gzh_openid exists
  const { wx_gzh_openid } = vRes.userData
  if(wx_gzh_openid) {
    return { code: "Y0001" }
  }

  // 2. checking out memberId
  const memberId = body.memberId
  if(memberId && typeof memberId === "string") {
    const res2 = await checkIfMemberIdIsMine(memberId, userId)
    if(res2) return res2
  }

  // 3. checking out credential
  const cCol = db.collection("Credential")
  const w3: Partial<Table_Credential> = {
    infoType: "bind-wechat",
    userId,
  }
  const q3 = cCol.where(w3).orderBy("expireStamp", "desc").limit(1)
  const res3 = await q3.get<Table_Credential>()
  const list3 = res3.data
  const fir3 = list3[0]

  // 4. checking if expired
  const now4 = getNowStamp()
  const e4 = fir3?.expireStamp ?? 1
  const c4 = fir3?.credential
  const qr4 = fir3?.meta_data?.qr_code
  const diff4 = e4 - now4
  if(diff4 > MINUTE && c4 && qr4) {
    // if the rest of time is enough to bind
    return {
      code: "0000",
      data: {
        operateType: "bind-wechat",
        qr_code: qr4,
        credential: c4,
      },
    }
  }

  // 5. get wechat accessToken
  const accessToken = await getWeChatAccessToken()
  if(!accessToken) {
    return { code: "E5001", errMsg: "wechat accessToken not found" }
  }


  // 6. generate credential
  const cred = createBindCredential()
  const scene_str = `b2=${cred}`
  const w6 = {
    expire_seconds: 60 * 10,
    action_name: "QR_STR_SCENE",
    action_info: {
      scene: {
        scene_str,
      }
    }
  }
  const url6 = new URL(API_WECHAT_CREATE_QRCODE)
  url6.searchParams.set("access_token", accessToken)
  const link6 = url6.toString()
  const res6 = await liuReq<Wx_Res_Create_QR>(link6, w6)


  // 7. extract data from wechat
  const res7 = res6.data
  const qr_code_7 = res7?.url
  if(!qr_code_7) {
    return { 
      code: "E5004", 
      errMsg: "creating QR code from wechat failed",
    }
  }

  // 8. add credential into db
  const b8 = getBasicStampWhileAdding()
  const now8 = b8.insertedStamp
  const data8: Partial<Table_Credential> = {
    ...b8,
    credential: cred,
    infoType: "bind-wechat",
    expireStamp: now8 + MIN_10,
    verifyNum: 0,
    userId,
    meta_data: {
      memberId,
      qr_code: qr_code_7,
    }
  }
  cCol.add(data8)

  return {
    code: "0000",
    data: {
      operateType: "bind-wechat",
      qr_code: qr_code_7,
      credential: cred,
    }
  }
}


async function handle_set_wechat(
  vRes: VerifyTokenRes_B,
  body: Record<string, any>,
) {
  const memberId = body.memberId
  const ww_qynb_toggle = body.ww_qynb_toggle
  if(!memberId || typeof memberId !== "string") {
    return { code: "E4000", errMsg: "memberId is required" }
  }
  if(typeof ww_qynb_toggle !== "boolean") {
    return { code: "E4000", errMsg: "ww_qynb_toggle is required" }
  }
  
  // 1. get member
  const mCol = db.collection("Member")
  const res1 = await mCol.doc(memberId).get<Table_Member>()
  const member = res1.data
  if(!member) {
    return { code: "E4004", errMsg: "memeber not found" }
  }
  const userId = vRes.userData._id
  if(member.user !== userId) {
    return { code: "E4003", errMsg: "the member is not yours" }
  }

  // 2. set ww_qynb_toggle
  const noti = member.notification ?? {}
  if(noti.ww_qynb_toggle === ww_qynb_toggle) {
    return { code: "0001" }
  }
  noti.ww_qynb_toggle = ww_qynb_toggle
  const w2: Partial<Table_Member> = {
    notification: noti,
    updatedStamp: getNowStamp(),
  }
  const res2 = await mCol.doc(memberId).update(w2)
  console.log("set wechat result: ")
  console.log(res2)

  return { code: "0000" }
}


async function handle_get_wechat(
  vRes: VerifyTokenRes_B,
  body: Record<string, string>,
) {
  // 0. get params
  const memberId = body.memberId
  if(!memberId || typeof memberId !== "string") {
    return { code: "E4000", errMsg: "memberId is required" }
  }
  const res: LiuRqReturn<Res_OC_GetWeChat> = {
    code: "0000",
  }

  // 1. get user
  const userId = vRes.userData._id
  const uCol = db.collection("User")
  const res1 = await uCol.doc(userId).get<Table_User>()
  const user = res1.data
  if(!user) {
    return { code: "E4004", errMsg: "there is no user" }
  }
  const { 
    wx_gzh_openid,
    ww_qynb_external_userid,
  } = user

  // 2. get member
  const mCol = db.collection("Member")
  const res2 = await mCol.doc(memberId).get<Table_Member>()
  const member = res2.data
  if(!member) {
    return { code: "E4004", errMsg: "there is no memeber" }
  }
  if(member.user !== userId) {
    return { code: "E4003", errMsg: "the member is not yours" }
  }

  // 3. construct response
  const mNoti = member.notification
  const ww_qynb_toggle = mNoti?.ww_qynb_toggle
  const wx_gzh_toggle = mNoti?.wx_gzh_toggle
  
  res.data = {
    operateType: "get-wechat",
    ww_qynb_external_userid,
    ww_qynb_toggle,
    wx_gzh_openid,
    wx_gzh_toggle,
  }
  return res
}


async function handle_bind_wecom(
  vRes: VerifyTokenRes_B,
  body: Record<string, string>,
): Promise<LiuRqReturn<Res_OC_BindWeCom>> {
  // 0. get params
  const userId = vRes.userData._id

  // 1. return directly if ww_qynb_external_userid exists
  const { ww_qynb_external_userid } = vRes.userData
  if(ww_qynb_external_userid) {
    return { code: "Y0001" }
  }

  // 2. checking out memberId
  const memberId = body.memberId
  if(memberId && typeof memberId === "string") {
    const res2 = await checkIfMemberIdIsMine(memberId, userId)
    if(res2) return res2
  }

  // 3. checking out credential
  const cCol = db.collection("Credential")
  const w3: Partial<Table_Credential> = {
    infoType: "bind-wecom",
    userId,
  }
  const q3 = cCol.where(w3).orderBy("expireStamp", "desc").limit(1)
  const res3 = await q3.get<Table_Credential>()
  const list3 = res3.data
  const fir3 = list3[0]

  // 4. checking if expired
  const now4 = getNowStamp()
  const e4 = fir3?.expireStamp ?? 1
  const c4 = fir3?.credential
  const pic_url_4 = fir3?.meta_data?.pic_url
  const diff4 = e4 - now4
  if(diff4 > MINUTE && c4 && pic_url_4) {
    // if the rest of time is enough to bind
    return {
      code: "0000",
      data: {
        operateType: "bind-wecom",
        pic_url: pic_url_4,
        credential: c4,
      },
    }
  }

  // 5. get wecom userid
  const res5 = getWeComBotId()
  const bot_id = res5.data?.bot_id
  if(!bot_id) {
    return res5 as LiuErrReturn
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
    type: 1,
    scene: 2,
    state,
    user: [bot_id],
  }
  const url7 = new URL(API_WECOM_ADD_CONTACT)
  url7.searchParams.set("access_token", accessToken)
  const link7 = url7.toString()
  const res7 = await liuReq<Ww_Res_Add_Contact_Way>(link7, w7)

  // 8. extract data from wecom
  const res8 = res7.data
  const c8 = res8?.config_id
  const pic_url_8 = res8?.qr_code
  if(!c8 || !pic_url_8) {
    console.log("wecom add contact err7: ")
    console.log("res7: ")
    console.log(res7)

    return {
      code: "E5004",
      errMsg: "wecom config_id or qr_code not found",
    }
  }


  // 9. add credential into db
  const b9 = getBasicStampWhileAdding()
  const now9 = b9.insertedStamp
  const data9: Partial<Table_Credential> = {
    ...b9,
    credential: cred,
    infoType: "bind-wecom",
    expireStamp: now9 + MIN_10,
    verifyNum: 0,
    userId,
    meta_data: {
      memberId,
      pic_url: pic_url_8,
      ww_qynb_config_id: c8,
    }
  }
  cCol.add(data9)

  return {
    code: "0000",
    data: {
      operateType: "bind-wecom",
      pic_url: pic_url_8,
      credential: cred,
    },
  }
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


async function handle_check_wecom(
  vRes: VerifyTokenRes_B,
  body: Record<string, string>,
) {

  // 0. get params
  const credential = body.credential
  if(!credential || typeof credential !== "string") {
    return { code: "E4000", errMsg: "credential is required" }
  }
  const res: LiuRqReturn<Res_OC_CheckWeCom> = {
    code: "0000",
  }

  // 1. get credential
  const w1 = {
    credential,
    infoType: "bind-wecom",
  }
  const cCol = db.collection("Credential")
  const q1 = cCol.where(w1).orderBy("expireStamp", "desc").limit(1)
  const res1 = await q1.get<Table_Credential>()
  const list1 = res1.data
  const len1 = list1?.length
  if(len1 < 1) {
    res.data = {
      operateType: "check-wecom",
      status: "plz_check",
    }
    return res
  }

  // 2. check out permission
  const d2 = list1[0]
  const _userId = d2.userId
  const userId = vRes.userData._id
  if(_userId !== userId) {
    res.code = "E4003"
    res.errMsg = "permission denied"
    return res
  }

  // 3. check out expire
  const now3 = getNowStamp()
  if(now3 > d2.expireStamp) {
    res.data = {
      operateType: "check-wecom",
      status: "expired",
    }
    return res
  }

  // 4. return waiting status
  res.data = {
    operateType: "check-wecom",
    status: "waiting",
  }

  return res
}


async function checkIfMemberIdIsMine(
  memberId: string,
  userId: string,
): Promise<LiuErrReturn | undefined> {
  const mCol = db.collection("Member")
  const res2 = await mCol.doc(memberId).get<Table_Member>()
  const d2 = res2.data
  if(!d2) {
    return { code: "E4004", errMsg: "there is no memeber" }
  }
  if(d2.user !== userId) {
    return { code: "E4003", errMsg: "the member is not yours!" }
  }
}
