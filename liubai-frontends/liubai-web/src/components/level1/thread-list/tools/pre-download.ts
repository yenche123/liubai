
import { type SyncGet_ContentList } from "~/types/cloud/sync-get/types"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import localCache from "~/utils/system/local-cache"

const MAX_TIMES = 20

export async function preLoadEditFirst(
  spaceId: string,
  lastLoadEditStamp?: number,
) {
  let loadTimes = 0
  let lastItemStamp: number | undefined
  const arg: SyncGet_ContentList = {
    taskType: "content_list",
    spaceId,
    loadType: "EDIT_FIRST",
  }

  while(loadTimes < MAX_TIMES) {
    loadTimes++
    await valTool.waitMilli(2000)

    if(lastItemStamp) {
      arg.lastItemStamp = lastItemStamp
    }

    // console.log(`preLoadEditFirst ${loadTimes}`)
    const parcels = await CloudMerger.request(arg)
    // console.log("preLoadEditFirst parcels: ")
    // console.log(parcels)
    // console.log(" ")
    if(!parcels || parcels.length < 9) break
    if(loadTimes === 1) {
      localCache.setPreference("loadEditStamp", time.getTime())
    }

    const lastParcel = parcels[parcels.length - 1]
    const parcelType = lastParcel?.parcelType
    if(parcelType === "content") {
      lastItemStamp = lastParcel.content?.editedStamp
    }
    if(!lastItemStamp) break

    if(lastLoadEditStamp && lastLoadEditStamp > lastItemStamp) {
      break
    }
  }

}

export async function preLoadCreateFirst(
  spaceId: string,
) {
  let loadTimes = 0
  let lastItemStamp: number | undefined
  const arg: SyncGet_ContentList = {
    taskType: "content_list",
    spaceId,
    loadType: "CREATE_FIRST",
  }

  while(loadTimes < MAX_TIMES) {
    loadTimes++
    await valTool.waitMilli(2000)

    if(lastItemStamp) {
      arg.lastItemStamp = lastItemStamp
    }
    // console.log(`preLoadCreateFirst ${loadTimes}`)
    const parcels = await CloudMerger.request(arg)
    // console.log("preLoadCreateFirst parcels: ")
    // console.log(parcels)
    // console.log(" ")
    if(!parcels || parcels.length < 9) break 

    const lastParcel = parcels[parcels.length - 1]
    const parcelType = lastParcel?.parcelType
    
    if(parcelType === "content") {
      lastItemStamp = lastParcel.content?.createdStamp
    }
    if(!lastItemStamp) break
  }
}