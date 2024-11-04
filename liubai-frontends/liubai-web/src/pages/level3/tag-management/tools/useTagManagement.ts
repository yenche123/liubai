import { reactive, type Ref, watch } from "vue";
import { type TmData } from "./types";
import { storeToRefs } from "pinia";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { getCurrentSpaceTagList, useTagsTree } from "~/utils/system/tag-related";
import valTool from "~/utils/basic/val-tool";
import { filterTag, tagMovedInTree } from "~/utils/system/tag-related/tags";
import time from "~/utils/basic/time";
import { usePrefix } from "~/hooks/useCommon";

export function useTagManagement() {
  const tmData = reactive<TmData>({
    toPath: "/tag/",
    tagNodes: [],
    oldTagNodes: [],
    lastTagChangeStamp: 0,
    everMoved: false,
  })

  const { prefix, spaceId } = usePrefix()
  watch(prefix, (newV) => {
    tmData.toPath = newV + "tag/"
  }, { immediate: true })

  const rr = useRouteAndLiuRouter()
  const gStore = useGlobalStateStore()
  const { tagChangedNum } = storeToRefs(gStore)

  initTagNodes(tmData, spaceId)

  watch(tagChangedNum, (newV) => {
    if(time.isWithinMillis(tmData.lastTagChangeStamp, 500)) {
      return
    }
    getLatestTagNodes(tmData)
  })

  const onTreeChange = async (e: any) => {
    console.log("onTreeChange.........")
    tmData.everMoved = true

    const tagNodes2 = valTool.copyObject(tmData.tagNodes)

    console.log("看一下新的 tagNodes2: ")
    console.log(tagNodes2)
    console.log(" ")


    const res0 = filterTag(tagNodes2)
    if(res0.hasChange) {
      console.warn("过滤掉有问题的 tag!!!!")
      tmData.tagNodes = res0.tree
    }

    tmData.lastTagChangeStamp = time.getTime()
    const res = await tagMovedInTree(tmData.tagNodes, tmData.oldTagNodes)
    if(!res.moved) {
      tmData.tagNodes = tmData.oldTagNodes
      return
    }

    if(res.newNewTree) {
      tmData.tagNodes = res.newNewTree
    }
    
    tmData.oldTagNodes = valTool.copyObject(tmData.tagNodes)
  }

  const onTapTagItem = (href: string) => {
    rr.router.push({ path: href, query: rr.route.query })
  }

  const {
    onTapTagArrow,
    onOpenNode,
    onCloseNode,
    statHandler,
  } = useTagsTree()

  return {
    tmData,
    onTreeChange,
    onTapTagItem,
    onTapTagArrow,
    onOpenNode,
    onCloseNode,
    statHandler,
  }
}

async function getLatestTagNodes(
  tmData: TmData,
) {
  const list = getCurrentSpaceTagList()
  const list2 = valTool.copyObject(list)
  const { tree } = filterTag(list2)
  tmData.tagNodes = tree
  tmData.oldTagNodes = valTool.copyObject(list)
}

function initTagNodes(
  tmData: TmData,
  spaceId: Ref<string>,
) {
  watch(spaceId, (newV) => {
    if(!newV) return
    getLatestTagNodes(tmData)
  }, { immediate: true })
}