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

interface Stat<T> {
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

let oldTagNodes: TagView[] = []

export function useSbTags() {
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
  const gStore = useGlobalStateStore()
  let lastTagChangeStamp = time.getTime()
  const { tagChangedNum } = storeToRefs(gStore)

  initTagNodes(tagNodes, workspace)

  // 监听 tag 从外部发生变化
  watch(tagChangedNum, (newV) => {
    const diff = time.getTime() - lastTagChangeStamp
    if(diff < 500) {
      console.log("tagChangedNum 才刚内部发生变化 忽略")
      return
    }
    console.log("重新初始化 tagNodes...")
    getLatestSpaceTag(tagNodes)
  })

  const onTreeChange = async (e: any) => {
    console.log("onTreeChange.........")
    const res0 = filterTag(tagNodes.value)
    if(res0.hasChange) {
      console.warn("过滤掉有问题的 tag!!!!")
      tagNodes.value = res0.tree
    }

    const res = await tagMovedInTree(tagNodes.value, oldTagNodes)
    if(!res.moved) {
      tagNodes.value = oldTagNodes
      return
    }

    if(res.newNewTree) {
      console.log("有 newNewTree 所以去赋值......")
      tagNodes.value = res.newNewTree
    }
    
    oldTagNodes = JSON.parse(JSON.stringify(tagNodes.value)) as TagView[]

    // 通知全局 tag 发生了变化
    lastTagChangeStamp = time.getTime()
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
  }

  return { 
    tagNodes, 
    treeEl, 
    onTreeChange, 
    onTapTagItem, 
    onTapTagArrow,
    toPath,
  }
}

function getLatestSpaceTag(tagNodes: Ref<TagView[]>) {
  let list = getCurrentSpaceTagList()
  const { tree } = filterTag(list)
  tagNodes.value = tree
  oldTagNodes = JSON.parse(JSON.stringify(list)) as TagView[]
}

function initTagNodes(
  tagNodes: Ref<TagView[]>,
  workspace: Ref<string>,
) {
  const _get = () => {
    if(!workspace.value) return
    getLatestSpaceTag(tagNodes)
  }

  watch(workspace, (newV) => {
    _get()
  })
  _get()
}