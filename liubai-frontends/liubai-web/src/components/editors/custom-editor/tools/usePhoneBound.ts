import type { CeData, CeProps } from "./types"
import type { BaseIsOn } from "~/types/types-basic"
import type { UserLocalTable } from "~/types/types-table"
import { useActiveSyncNum } from "~/hooks/useCommon"
import { watch } from "vue"
import time from "~/utils/basic/time"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"

export function usePhoneBound(
  props: CeProps,
  ceData: CeData,
) {
  if(props.threadId) return

  const { activeSyncNum } = useActiveSyncNum()

  const stop = watch(activeSyncNum, async (newV) => {
    if(newV < 1) return

    // 1. get data from local db
    const res1 = await getDataFromLocalDB()
    if(!res1) return

    // 2. set phoneBound
    ceData.phoneBound = res1.bound
    if(res1.bound === "Y") {
      stop()
      return
    }

    // 3. ignore if user has just updated within 3s
    const { user } = res1
    const updatedStamp = user.updatedStamp
    const now = time.getTime()
    const diff = now - updatedStamp
    if(diff <= time.SECONED * 3) return

    // 4. get latest data
    const res4 = await CloudEventBus.getLatestUserInfo()
    if(!res4) return
    const newBound = Boolean(res4.phone_pixelated) ? "Y" : "N"
    ceData.phoneBound = newBound
    if(newBound === "Y") {
      stop()
    }
  })
}

interface DataForPhoneBound {
  user: UserLocalTable
  bound: BaseIsOn
}

async function getDataFromLocalDB(): Promise<DataForPhoneBound | undefined> {
  const res1 = await CloudEventBus.getUserFromDB()
  if(!res1) return
  const res2 = Boolean(res1.phone_pixelated)
  const data: DataForPhoneBound = {
    user: res1,
    bound: res2 ? "Y" : "N"
  }
  return data
}