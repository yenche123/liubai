import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import { Draggable } from "@he-tree/vue";
import type { TagView } from "../../../../types/types-atom";
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { getCurrentSpaceTagList } from "../../../../utils/system/workspace";
import { filterTag, tagMovedInTree } from "../../../../utils/system/workspace/tags";
import { useGlobalStateStore } from "../../../../hooks/stores/useGlobalStateStore";
import time from "../../../../utils/basic/time";
import { useRouteAndLiuRouter } from "../../../../routes/liu-router";

export interface Stat<T> {
  data: T
  open: boolean // 是否展开
  parent: Stat<T> | null // 父级节点stat
  children: Stat<T>[] // 子级节点
  level: number // 层级. 层级从1开始.
  isStat: boolean // 是否是stat对象
  hidden: boolean // 是否隐藏
  checked: boolean | null // 是否勾选. null表示后代节点部分勾选
  draggable: boolean | null // 是否可拖动. null表示继承父级.
  droppable: boolean | null // 是否可拖入. null表示继承父级.
  style: any // 自定义样式. 支持Vue的style格式.
  class: any // 自定义样式类. 支持Vue的class格式.
}

interface SbtEmits {
  (event: "aftertap"): void
}

export function useSbTags(emits: SbtEmits) {
  const currentTagId = ref("")
  const wStore = useWorkspaceStore()
  const { workspace } = storeToRefs(wStore)
  const toPath = computed(() => {
    const w = workspace.value
    if(w === "ME") return `/tag/`
    return `/w/${w}/tag/`
  })

  const { router, route } = useRouteAndLiuRouter()

  const treeEl = ref<typeof Draggable | null>(null)
  const tagNodes = ref<TagView[]>([])
  const oldTagNodes = ref<TagView[]>([])
  const gStore = useGlobalStateStore()
  const lastTagChangeStamp = ref(time.getTime())
  const { tagChangedNum } = storeToRefs(gStore)

  initTagNodes(tagNodes, oldTagNodes, workspace)

  // 监听 tag 从外部发生变化
  watch(tagChangedNum, (newV) => {
    const diff = time.getTime() - lastTagChangeStamp.value
    if(diff < 500) {
      console.log("tagChangedNum 才刚内部发生变化 忽略")
      return
    }
    getLatestSpaceTag(tagNodes, oldTagNodes)
  })

  // 监听 route 变化
  watch(route, (newV) => {
    const { name, params } = newV
    if(name !== "tag" && name !== "collaborative-tag") {
      currentTagId.value = ""
      return
    }
    const { tagId } = params
    if(typeof tagId === "string") currentTagId.value = tagId
  })

  const onTreeChange = async (e: any) => {
    console.log("onTreeChange.........")

    const tagNodes2 = JSON.parse(JSON.stringify(tagNodes.value)) as TagView[]
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
    
    oldTagNodes.value = JSON.parse(JSON.stringify(tagNodes.value)) as TagView[]

    // 通知全局 tag 发生了变化
    lastTagChangeStamp.value = time.getTime()
    gStore.addTagChangedNum()
  }

  const onTapTagArrow = (e: MouseEvent, node: TagView, stat: Stat<TagView>) => {
    e.stopPropagation()
    e.preventDefault()
    const length = node.children?.length ?? 0
    if(!length) return
    stat.open = !stat.open
  }

  const onTapTagItem = (e: MouseEvent, href: string) => {
    e.preventDefault()
    router.push({ path: href, query: route.query })
    emits("aftertap")
  }

  const onNaviBack = () => {
    router.naviBack()
  }

  return { 
    currentTagId,
    tagNodes, 
    oldTagNodes,
    lastTagChangeStamp,
    treeEl, 
    onTreeChange, 
    onTapTagItem, 
    onTapTagArrow,
    toPath,
    onNaviBack,
  }
}

function getLatestSpaceTag(
  tagNodes: Ref<TagView[]>,
  oldTagNodes: Ref<TagView[]>,
) {
  let list = getCurrentSpaceTagList()
  const list2 = JSON.parse(JSON.stringify(list)) as TagView[]
  const { tree } = filterTag(list2)
  tagNodes.value = tree
  oldTagNodes.value = JSON.parse(JSON.stringify(list)) as TagView[]
}

function initTagNodes(
  tagNodes: Ref<TagView[]>,
  oldTagNodes: Ref<TagView[]>,
  workspace: Ref<string>,
) {
  const _get = () => {
    if(!workspace.value) return
    getLatestSpaceTag(tagNodes, oldTagNodes)
  }

  watch(workspace, (newV) => {
    _get()
  })
  _get()
}