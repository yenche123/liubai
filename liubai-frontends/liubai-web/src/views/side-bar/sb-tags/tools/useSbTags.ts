import { reactive, ref, watch, type Ref } from "vue";
import { Draggable } from "@he-tree/vue";
import type { TagView } from "~/types/types-atom";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { getCurrentSpaceTagList } from "~/utils/system/tag-related";
import { filterTag, tagMovedInTree } from "~/utils/system/tag-related/tags";
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import time from "~/utils/basic/time";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import valTool from "~/utils/basic/val-tool";
import type { SbTagsData, SbtEmits, LiuTreeStat } from "./types";
import liuUtil from "~/utils/liu-util";


export function useSbTags(emits: SbtEmits) {
  const wStore = useWorkspaceStore()
  const { spaceType, spaceId } = storeToRefs(wStore)

  const sbtData = reactive<SbTagsData>({
    enable: true,
    everMoved: false,
    currentTagId: "",
    toPath: "/tag/",
  })

  watch(spaceType, (newV) => {
    let _path = "/tag/"
    if(newV === "TEAM") {
      _path = `/w/${spaceId.value}/tag/`
    }
    sbtData.toPath = _path
  }, { immediate: true })

  const { router, route } = useRouteAndLiuRouter()

  const treeEl = ref<typeof Draggable | null>(null)
  const tagNodes = ref<TagView[]>([])
  const oldTagNodes = ref<TagView[]>([])
  const gStore = useGlobalStateStore()
  const lastTagChangeStamp = ref(time.getTime())
  const { tagChangedNum } = storeToRefs(gStore)

  initTagNodes(sbtData, tagNodes, oldTagNodes, spaceId)

  // 监听 tag 从外部发生变化
  watch(tagChangedNum, (newV) => {
    if(time.isWithinMillis(lastTagChangeStamp.value, 500)) {
      console.log("tagChangedNum 才刚内部发生变化 忽略")
      return
    }
    getLatestSpaceTag(sbtData, tagNodes, oldTagNodes)
  })

  // 监听 route 变化
  watch(route, (newV) => {
    const { name, params } = newV
    if(name !== "tag" && name !== "collaborative-tag") {
      sbtData.currentTagId = ""
      return
    }
    const { tagId } = params
    if(typeof tagId === "string") {
      sbtData.currentTagId = tagId
    }
  })

  const onTreeChange = async (e: any) => {
    console.log("onTreeChange.........")
    sbtData.everMoved = true

    const tagNodes2 = valTool.copyObject(tagNodes.value)
    const res0 = filterTag(tagNodes2)
    if(res0.hasChange) {
      console.warn("过滤掉有问题的 tag!!!!")
      tagNodes.value = res0.tree
    }

    const res = await tagMovedInTree(tagNodes.value, oldTagNodes.value)
    if(!res.moved) {
      tagNodes.value = oldTagNodes.value
      return
    }

    if(res.newNewTree) {
      console.log("有 newNewTree 所以去赋值......")
      tagNodes.value = res.newNewTree
    }
    
    oldTagNodes.value = valTool.copyObject(tagNodes.value)
    lastTagChangeStamp.value = time.getTime()
  }

  const onTapTagArrow = (e: MouseEvent, node: TagView, stat: LiuTreeStat) => {
    const length = stat.children.length
    if(!length) return
    stat.open = !stat.open
  }

  const onTapTagItem = (e: MouseEvent, href: string) => {
    router.push({ path: href, query: route.query })
    emits("aftertap")
  }

  const onNaviBack = () => {
    router.naviBackUntilNoSpecificQuery(route, "tags")
  }


  // record which nodes are closed
  const closedNodes: Record<string, boolean | undefined> = {}
  const onOpenNode = (stat: LiuTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return
    closedNodes[tagId] = false
  }

  const onCloseNode = (stat: LiuTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return
    closedNodes[tagId] = true
  }

  const statHandler = (stat: LiuTreeStat) => {
    const tagId = stat.data.tagId
    if(!tagId) return stat
    const isClosed = closedNodes[tagId]
    if(isClosed) stat.open = false
    return stat
  }


  // try to fix the bug that the node we're dragging will be disapeared
  // but it doesn't work
  const onAfterDrop = () => {
    console.log("onAfterDrop............")
  }

  const onLeave = () => {
    console.log("onLeave............")
    // console.log(tagNodes.value)
    // console.log(" ")
  }

  return {
    sbtData,
    tagNodes, 
    oldTagNodes,
    lastTagChangeStamp,
    treeEl, 
    onTreeChange, 
    onTapTagItem, 
    onTapTagArrow,
    onNaviBack,
    onOpenNode,
    onCloseNode,
    statHandler,
    onAfterDrop,
    onLeave,
  }
}

async function getLatestSpaceTag(
  sbtData: SbTagsData,
  tagNodes: Ref<TagView[]>,
  oldTagNodes: Ref<TagView[]>,
) {
  let list = getCurrentSpaceTagList()
  const list2 = valTool.copyObject(list)
  const { tree } = filterTag(list2)
  if(sbtData.everMoved) {
    sbtData.enable = false
    await liuUtil.waitAFrame()
    sbtData.enable = true
    sbtData.everMoved = false
  }

  tagNodes.value = tree
  oldTagNodes.value = valTool.copyObject(list)
}

function initTagNodes(
  sbtData: SbTagsData,
  tagNodes: Ref<TagView[]>,
  oldTagNodes: Ref<TagView[]>,
  spaceId: Ref<string>,
) {
  const _get = () => {
    if(!spaceId.value) return
    getLatestSpaceTag(sbtData, tagNodes, oldTagNodes)
  }

  watch(spaceId, (newV) => {
    _get()
  }, { immediate: true })
}