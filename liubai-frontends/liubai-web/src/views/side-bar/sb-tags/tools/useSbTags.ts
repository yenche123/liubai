import { Ref, ref, watch } from "vue";
import { Draggable } from "@he-tree/vue";
import type { TagView } from "../../../../types/types-atom";
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { getCurrentSpaceTagList } from "../../../../utils/system/workspace";

interface TagNode {
  text: string
  children?: TagNode[]
}

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

export function useSbTags() {
  const treeEl = ref<typeof Draggable | null>(null)
  const tagNodes = ref<TagView[]>([])

  initTagNodes(tagNodes)

  const onTreeChange = () => {

  }

  const onTapTagArrow = (e: MouseEvent, node: TagView, stat: Stat<TagView>) => {
    const length = node.children?.length ?? 0
    if(!length) return
    stat.open = !stat.open
    e.stopPropagation()
  }

  const onTapTagItem = (e: MouseEvent, node: TagView, stat: Stat<TagView>) => {
    console.log("onTapTagItem............")
    
  }

  return { tagNodes, treeEl, onTreeChange, onTapTagItem, onTapTagArrow }
}

function initTagNodes(tagNodes: Ref<TagView[]>) {
  const wStore = useWorkspaceStore()
  const { workspace } = storeToRefs(wStore)

  const _get = () => {
    if(!workspace.value) return
    const list = getCurrentSpaceTagList()
    tagNodes.value = list
  }

  watch(workspace, (newV) => {
    _get()
  })
  _get()
}