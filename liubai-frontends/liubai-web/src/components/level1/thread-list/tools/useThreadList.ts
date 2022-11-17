import { onActivated, ref, toRefs, watch, watchEffect } from "vue"
import { ThreadShow } from "../../../../types/types-content"
import type { Ref } from "vue"
import threadController from "../../../../utils/controllers/thread-controller/thread-controller"
import { useRouteAndLiuRouter } from "../../../../routes/liu-router"

interface TlProps {
  viewType: string
  tagId: string
}

interface TlContext {
  list: Ref<ThreadShow[]>
  viewType: Ref<string>
  tagId: Ref<string>
}

export function useThreadList(props: TlProps) {
  let { viewType, tagId } = toRefs(props)

  const list = ref<ThreadShow[]>([])
  const ctx: TlContext = {
    list,
    viewType,
    tagId,
  }

  onActivated(() => {
    console.log("onActivated!!!")
    checkList(ctx)
  })

  watch([viewType, tagId], ([newViewType, newTagId]) => {
    console.log("newViewType: ", newViewType)
    console.log("newTagId: ", newTagId)
    console.log(" ")
    loadList(ctx, true)
  })
  

  return { list }
}

// 页面 onActivated 或者窗口重新被 focus 时，触发该函数
// 来判断要不要重新加载或局部更新
function checkList(
  ctx: TlContext
) {
  const { list } = ctx
  if(list.value.length < 1) {
    loadList(ctx)
    return
  }

  // 局部更新技术
  

}


async function loadList(
  ctx: TlContext,
  reload: boolean = false
) {

  const results = await threadController.getList()
  console.log("results 结果.......")
  console.log(results)
  console.log(" ")
  
  const length = results.length
  if(length < 1) return
  const lastOne = results[length - 1]
  const results2 = await threadController.getList({ lastCreatedStamp: lastOne.createdStamp })
  console.log("results2 结果.......")
  console.log(results2)
  console.log(" ")



}