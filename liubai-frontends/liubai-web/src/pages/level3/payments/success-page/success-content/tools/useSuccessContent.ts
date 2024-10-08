import { useWorkspaceStore, type WorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { fetchUserSubscription } from "~/utils/cloud/tools/requests";
import { storageMySubscription } from "../../../utils/pay-tools";
import valTool from "~/utils/basic/val-tool";
import { onMounted } from "vue";
import time from "~/utils/basic/time";

const SEC_3 = time.SECONED * 3

export function useSuccessContent() {
  const wStore = useWorkspaceStore()

  onMounted(() => {
    prepareToCheck(wStore)
  })

  return { wStore }
}

// prepare to check my subscription
async function prepareToCheck(
  wStore: WorkspaceStore,
) {
  if(wStore.userId) {
    console.log("toCheck 111")
    toCheck(wStore)
    return
  }

  await valTool.waitMilli(SEC_3)
  if(wStore.userId) {
    console.log("toCheck 222")
    toCheck(wStore)
  }
}

// get to check my subscription out
async function toCheck(
  wStore: WorkspaceStore,
) {
  const res1 = await fetchUserSubscription()
  console.log("toCheck res1: ")
  console.log(res1)

  const sub1 = res1.data?.subscription
  const isPremium1 = wStore.getPremium(sub1)
  console.log("isPremium1: ", isPremium1)
  console.log(" ")
  if(isPremium1) {
    storageMySubscription(sub1)
    return
  }

  await valTool.waitMilli(SEC_3)

  const res2 = await fetchUserSubscription()
  console.log("toCheck res2: ")
  console.log(res2)
  console.log(" ")

  if(res2.code === "0000") {
    const sub2 = res2.data?.subscription
    storageMySubscription(sub2)
  }
}