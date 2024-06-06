// 一些常用的响应式工具函数

import { storeToRefs } from "pinia"
import { 
  computed, 
  onActivated, 
  onBeforeUnmount, 
  onDeactivated, 
  ref, 
  watch,
} from "vue"
import { useWorkspaceStore } from "./stores/useWorkspaceStore"
import type { MemberShow } from "~/types/types-content";
import { useLiuWatch } from "./useLiuWatch";
import localCache from "~/utils/system/local-cache";
import { db } from "~/utils/db";
import { usersToMemberShows } from "~/utils/other/member-related";
import { membersToShows } from "~/utils/other/member-related";
import { CloudEventBus } from "~/utils/cloud/CloudEventBus";
import { useThrottleFn } from "~/hooks/useVueUse"

// 获取路径的前缀
// 如果当前非个人工作区，就会加上 `/w/${spaceId}`
export function usePrefix() {
  const wStore = useWorkspaceStore()
  const { isCollaborative, spaceId } = storeToRefs(wStore)
  const prefix = computed(() => {
    const isCo = isCollaborative.value
    const s = spaceId.value
    if(isCo && s) return `/w/${s}/`
    return `/`
  })

  return { prefix }
}

// 显示我当前的头像和昵称，返回 myProfile 其为 Ref<MemberShow | null> 类型
export function useMyProfile() {
  const myProfile = ref<MemberShow | null>(null)

  const wStore = useWorkspaceStore()
  const { myMember } = storeToRefs(wStore)

  const whenMemberChange = async () => {
    const { local_id: userId } = localCache.getPreference()
    if(!userId) {
      myProfile.value = null
      return
    }

    const m = myMember.value
    if(!m) {
      const myUser = await db.users.get({ _id: userId })
      if(!myUser) {
        myProfile.value = null
        return
      }
      const [tmp1] = usersToMemberShows([myUser])
      myProfile.value = tmp1
      return
    }
    const [tmp2] = membersToShows([m])
    myProfile.value = tmp2
  }
  useLiuWatch(myMember, whenMemberChange, true)

  return { myProfile }
}

export function useActiveSyncNum() {
  const activeSyncNum = ref(0)
  const syncNum = CloudEventBus.getSyncNum()
  const isActivated = ref(false)
  onActivated(() => isActivated.value = true)
  onDeactivated(() => isActivated.value = false)
  onBeforeUnmount(() => isActivated.value = false)
  watch([syncNum, isActivated], (
    [newV1, newV2]
  ) => {
    if(newV1 < 1) return
    if(!newV2) return
    activeSyncNum.value = newV1
  }, { immediate: true })

  return {
    activeSyncNum,
  }
}

export function useAwakeNum(
  ms: number = 3000
) {
  const awakeNum = ref(0)

  const syncNum = CloudEventBus.getSyncNum()
  const isActivated = ref(false)
  onActivated(() => isActivated.value = true)
  onDeactivated(() => isActivated.value = false)
  onBeforeUnmount(() => isActivated.value = false)

  const _go = (newSyncNum: number) => {
    const oldV = awakeNum.value
    const newV = oldV < newSyncNum ? newSyncNum : (oldV + 1)
    awakeNum.value = newV
  }

  const _trigger = useThrottleFn(_go, ms)

  watch([syncNum, isActivated], (
    [newV1, newV2],
    [oldV1, oldV2],
  ) => {
    if(!newV2) return

    if(newV1 === 1 && newV2 === oldV2) {
      _go(newV1)
      return
    }

    _trigger(newV1)
  }, { immediate: true })
  
  return {
    awakeNum,
    syncNum,
    isActivated,
  }
}

