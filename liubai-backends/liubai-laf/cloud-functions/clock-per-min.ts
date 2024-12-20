// Function Name: clock-per-min
// 定时系统: 每分钟执行一次
// 发送提醒
import cloud from "@lafjs/cloud";
import { addSeconds, set as date_fn_set } from "date-fns"
import type { 
  Table_Member, 
  Table_User,
  Table_Content,
  RequireSth,
  SupportedLocale,
} from "@/common-types";
import { 
  decryptEncData, 
  getSummary,
  LiuDateUtil,
  valTool,
  checkAndGetWxGzhAccessToken,
} from "@/common-util";
import { commonLang, getCurrentLocale, useI18n } from "@/common-i18n";
import { wx_reminder_tmpl } from "@/common-config";
import { WxGzhSender } from "@/service-send";

const db = cloud.database()
const _ = db.command


/************************** types **************************/
interface RemindAtom {
  contentId: string
  userId: string
  memberId: string
  title?: string
  hasImage?: boolean
  hasFile?: boolean
  calendarStamp: number

  wx_gzh_openid?: string
  locale?: SupportedLocale
  timezone?: string
}

type RemindAtom_2 = RequireSth<RemindAtom, "wx_gzh_openid">

interface AuthorAtom {
  userId: string
  memberId: string

  wx_gzh_openid?: string
  locale?: SupportedLocale
  timezone?: string
}

type AuthorAtom_2 = RequireSth<AuthorAtom, "locale">

type Field_User = {
  [key in keyof Table_User]?: 0 | 1
}

type Field_Member = {
  [key in keyof Table_Member]?: 0 | 1
}


/************************** entry **************************/
export async function main(ctx: FunctionContext) {

  await handle_remind()

  return { code: "0000" }
}

async function handle_remind() {

  // check out if the tmplId is enabled
  const _env = process.env
  const tmplId = _env.LIU_WX_GZ_TMPL_ID_1
  if(!tmplId) {
    return false
  }

  let startDate = addSeconds(new Date(), -59)
  startDate = date_fn_set(startDate, { seconds: 55, milliseconds: 0 })
  let endDate = addSeconds(startDate, 59)

  const startStamp = startDate.getTime()
  const endStamp = endDate.getTime()

  const atoms = await get_remind_atoms(startStamp, endStamp)
  if(atoms.length < 1) {
    return true
  }

  const atoms2 = await find_remind_authors(atoms)
  if(atoms2.length < 1) {
    console.warn("there is no atoms2")
    console.log("see atoms: ")
    console.log(atoms)
    return true
  }

  const access_token = await checkAndGetWxGzhAccessToken()
  if(!access_token) {
    console.warn("access_token is not found")
    return false
  }
  
  await batch_send(access_token, atoms2)

}

async function batch_send(
  access_token: string,
  atoms: RemindAtom_2[],
) {
  const numMap = new Map<string, number>()
  const aLength = atoms.length

  for(let i=0; i<atoms.length; i++) {
    const v = atoms[i]
    const userId = v.userId
    const num = numMap.get(userId) ?? 0
    if(num > 3) continue
    numMap.set(userId, num + 1)
    send_wx_message(access_token, v)

    if(i !== 0 && (i % 5) === 0 && i !== (aLength - 1)) {
      await valTool.waitMilli(200)
    }
  }
  
}

async function send_wx_message(
  access_token: string,
  atom: RemindAtom_2,
) {
  const obj = { ...wx_reminder_tmpl }
  const _env = process.env
  const domain = _env.LIU_DOMAIN
  const tmplId = _env.LIU_WX_GZ_TMPL_ID_1 ?? ""
  obj.template_id = tmplId
  const { 
    contentId, 
    locale, 
    calendarStamp,
    wx_gzh_openid,
    timezone,
  } = atom

  obj.touser = wx_gzh_openid
  if(domain) {
    obj.url = `${domain}/${contentId}`
  }
  
  let title = atom.title
  if(!title) {
    const { t: t1 } = useI18n(commonLang, { locale })
    title = `[${t1("other")}]`
    if(atom.hasImage) title = `[${t1("image")}]`
    else if(atom.hasFile) title = `[${t1("file")}]`
  }
  if(title.length > 20) {
    title = title.substring(0, 17) + "..."
  }
  title = title.replace(/\n/g, " ")

  obj.data.thing18.value = title

  const str_time = LiuDateUtil.displayTime(calendarStamp, locale, timezone)
  obj.data.time4.value = str_time
  
  const res = await WxGzhSender.sendTemplateMessage(access_token, obj)
  return true
}

async function find_remind_authors(
  atoms: RemindAtom[],
) {
  const list_1: AuthorAtom[] = []
  const list_2: AuthorAtom_2[] = []
  const list_3: AuthorAtom_2[] = []

  // 1. package list_1
  for(let i=0; i<atoms.length; i++) {
    const v1 = atoms[i]
    const idx = list_1.findIndex(v2 => v1.userId === v2.userId)
    if(idx >= 0) continue
    list_1.push({ userId: v1.userId, memberId: v1.memberId })
  }

  const uCol = db.collection("User")
  let runTimes = 0
  const NUM_ONCE = 50
  const MAX_TIMES = 100

  // 2. find users
  while(list_1.length > 0 && runTimes < MAX_TIMES) {
    let tmpList = list_1.splice(0, NUM_ONCE)

    const userIds = tmpList.map(v => v.userId)
    const w = {
      oState: "NORMAL",
      _id: _.in(userIds),
    }
    const f: Field_User = {
      _id: 1,
      oState: 1,
      thirdData: 1,
      wx_gzh_openid: 1,
      language: 1,
      systemLanguage: 1,
      timezone: 1,
    }
    const res1 = await uCol.where(w).field(f).get<Table_User>()
    const results1 = res1.data
    const tmpList2 = packAuthors1(tmpList, results1)
    list_2.push(...tmpList2)

    runTimes++
  }

  runTimes = 0

  // 3. find members
  const mCol = db.collection("Member")
  while(list_2.length > 0 && runTimes < MAX_TIMES) {
    let tmpList = list_2.splice(0, NUM_ONCE)
    const memberIds = tmpList.map(v => v.memberId)
    const w = {
      oState: "OK",
      _id: _.in(memberIds),
    }
    const f: Field_Member = {
      _id: 1,
      oState: 1,
      config: 1,
      notification: 1,
    }

    const res2 = await mCol.where(w).field(f).get<Table_Member>()
    const results2 = res2.data
    tmpList = packAuthors2(tmpList, results2)
    list_3.push(...tmpList)

    runTimes++
  }

  // 4. get list_3 into atoms
  for(let i=0; i<list_3.length; i++) {
    const v1 = list_3[i]
    for(let j=0; j<atoms.length; j++) {
      const v2 = atoms[j]
      if(v1.userId === v2.userId) {
        v2.wx_gzh_openid = v1.wx_gzh_openid
        v2.timezone = v1.timezone
        v2.locale = v1.locale
      }
    }
  }

  // 5. filter atoms without wx_gzh_openid
  // TODO: web push
  let newAtoms = atoms.filter(v => v.wx_gzh_openid) as RemindAtom_2[]
  
  return newAtoms
}

async function get_remind_atoms(
  startStamp: number,
  endStamp: number,
) {
  let runTimes = 0
  const NUM_ONCE = 50
  const MAX_TIMES = 100

  const w = {
    infoType: "THREAD",
    oState: "OK",
    remindStamp: _.and(_.gte(startStamp), _.lte(endStamp)),
    stateId: _.neq("FINISHED"),
  }
  const cCol = db.collection("Content")
  const atoms: RemindAtom[] = []

  while(runTimes < MAX_TIMES) {
    let q = cCol.where(w).orderBy("remindStamp", "asc")
    if(runTimes > 0) {
      q = q.skip(runTimes * NUM_ONCE)
    }
    const res = await q.limit(NUM_ONCE).get<Table_Content>()
    const tmpList = res.data
    const tLength = tmpList.length

    for(let i=0; i<tLength; i++) {
      const v = tmpList[i]
      const atom = turnContentIntoAtom(v)
      if(atom) {
        atoms.push(atom)
      }
    }

    if(tLength < NUM_ONCE) break
    runTimes++
  }

  return atoms
}

// when we get members, package authors with them
// filter members whose wx_gzh_toggle is false or undefined
function packAuthors2(
  tmpList: AuthorAtom_2[],
  members: Table_Member[],
) {
  if(members.length < 1) return []

  for(let i=0; i<tmpList.length; i++) {
    const v1 = tmpList[i]
    const member = members.find(v2 => v1.memberId === v2._id)
    const wx_gzh_toggle = member?.notification?.wx_gzh_toggle
    if(!wx_gzh_toggle) {
      tmpList.splice(i, 1)
      i--
      continue
    }
  }

  return tmpList
}

// when we get users, package authors with them
function packAuthors1(
  tmpList: AuthorAtom[],
  users: Table_User[],
) {

  if(users.length < 1) return []

  for(let i=0; i<tmpList.length; i++) {
    const v1 = tmpList[i]
    const user = users.find(v2 => v1.userId === v2._id)
    const wx_gzh_openid = user?.wx_gzh_openid
    const wx_subscribe = user?.thirdData?.wx_gzh?.subscribe
    if(!user || !wx_gzh_openid || wx_subscribe !== 1) {
      tmpList.splice(i, 1)
      i--
      continue
    }

    v1.locale = getCurrentLocale({ user })
    v1.wx_gzh_openid = wx_gzh_openid
    v1.timezone = user.timezone
  }

  return tmpList as AuthorAtom_2[]
}


function turnContentIntoAtom(
  v: Table_Content,
) {
  if(!v.member) return
  if(!v.calendarStamp) return

  const res1 = decryptEncData(v)
  if(!res1.pass) return

  let title: string | undefined
  if(res1.title) {
    title = res1.title
  }
  else if(res1.liuDesc) {
    title = getSummary(res1.liuDesc)
  }

  const atom: RemindAtom = {
    contentId: v._id,
    userId: v.user,
    memberId: v.member,
    title,
    hasImage: Boolean(res1.images?.length),
    hasFile: Boolean(res1.files?.length),
    calendarStamp: v.calendarStamp,
  }
  return atom
}