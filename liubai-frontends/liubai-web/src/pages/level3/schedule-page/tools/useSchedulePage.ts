import { ref } from "vue";
import cui from "~/components/custom-ui";
import valTool from "~/utils/basic/val-tool";
import liuUtil from "~/utils/liu-util";
import type { LiuRemindMe } from "~/types/types-atom";
import { db } from "~/utils/db";
import { equipThreads } from "~/utils/controllers/equip/threads";
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import { getDefaultThread } from "~/utils/other/thread-related";

export function useSchedulePage() {
  const selectedDay = ref(new Date())

  const onTapAdd = async () => {
    const minDate = new Date()
    const initialDate = selectedDay.value.getTime() >= minDate.getTime()
      ? selectedDay.value
      : minDate

    // 1. choose a date
    const res1 = await cui.showDatePicker({ minDate, date: initialDate })
    if(!res1.confirm || !res1.date) return
    selectedDay.value = res1.date
    
    // 2. turn date into stamp & str
    const whenStamp = res1.date.getTime()
    const whenStr = liuUtil.showBasicTime(whenStamp)
    await valTool.waitMilli(150)

    // 3. show text editor
    const res3 = await cui.showTextEditor({ 
      title: whenStr, 
      placeholder_key: "calendar.what_to_add",
      confirm_key: "common.add",
    })
    if(!res3.confirm || !res3.value) return
    toAddNewAgenda(whenStamp, res3.value)
  }

  return {
    selectedDay,
    onTapAdd,
  }
}

async function toAddNewAgenda(
  whenStamp: number,
  inputTxt: string,
) {
  // 1. get default thread
  const aThread = getDefaultThread(inputTxt)
  if(!aThread) return

  // 2. add specific info
  whenStamp = liuUtil.formatStamp(whenStamp)
  const remindMe: LiuRemindMe = {
    type: "early",
    early_minute: 0,
  }
  const calendarStamp = liuUtil.getCalendarStamp(whenStamp, remindMe)
  const remindStamp = liuUtil.getRemindStamp(remindMe, whenStamp)

  aThread.whenStamp = whenStamp
  aThread.remindMe = remindMe
  aThread.calendarStamp = calendarStamp
  aThread.remindStamp = remindStamp

  // 3. insert the new thread into db.contents
  const res3 = await db.contents.add(aThread)

  // 4. notify other components
  const threadShows = await equipThreads([aThread])
  const tStore = useThreadShowStore()
  tStore.setNewThreadShows(threadShows)

  // 5. upload to cloud
  if(aThread.storageState === "LOCAL") return
  LocalToCloud.addTask({
    uploadTask: "thread-post", 
    target_id: aThread._id,
    operateStamp: aThread.insertedStamp,
  })
}
