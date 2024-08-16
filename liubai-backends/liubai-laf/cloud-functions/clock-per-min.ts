// Function Name: clock-per-min
// 定时系统: 每分钟执行一次
// 发送提醒
import cloud from "@lafjs/cloud";
import { addSeconds, set as date_fn_set } from "date-fns"
import { type Table_Content } from "@/common-types";
import { decryptEncData, getSummary } from "@/common-util";

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {

  handle_remind()

}


interface RemindAtom {
  contentId: string
  userId: string
  memberId?: string
  title?: string
  hasImage?: boolean
  hasFile?: boolean
}

async function handle_remind() {
  let startDate = addSeconds(new Date(), -30)
  startDate = date_fn_set(startDate, { seconds: 55, milliseconds: 0 })
  let endDate = addSeconds(startDate, 59)

  console.log("startDate: ")
  console.log(startDate)
  console.log("endDate: ")
  console.log(endDate)

  const startStamp = startDate.getTime()
  const endStamp = endDate.getTime()

  const atoms = await get_remind_atoms(startStamp, endStamp)
  
  
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
  }
  const cCol = db.collection("Content")
  const atoms: RemindAtom[] = []

  while(runTimes < MAX_TIMES) {
    let q = cCol.where(w)
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


function turnContentIntoAtom(
  v: Table_Content,
) {
  const res1 = decryptEncData(v)
  if(!res1.pass) {
    return
  }

  let title: string | undefined
  if(res1.title) {
    title = res1.title
  }
  else if(res1.liuDesc) {
    title = getSummary(res1.liuDesc)
  }

  if(title && title.length > 20) {
    title = title.substring(0, 20) + "..."
  }

  const atom: RemindAtom = {
    contentId: v._id,
    userId: v.user,
    memberId: v.member,
    title,
    hasImage: Boolean(res1.images?.length),
    hasFile: Boolean(res1.files?.length),
  }
  return atom
}