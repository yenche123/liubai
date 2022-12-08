import { isProxy, isReactive, Ref, ref, watch } from "vue";
import { Draggable } from "@he-tree/vue";
import type { TagView } from "../../../../types/types-atom";
import { useWorkspaceStore } from "../../../../hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { getCurrentSpaceTagList } from "../../../../utils/system/workspace";
import { tagMovedInTree } from "../../../../utils/system/workspace/tags";

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

let oldTagNodes: TagView[] = []

export function useSbTags() {
  const treeEl = ref<typeof Draggable | null>(null)
  const tagNodes = ref<TagView[]>([])

  initTagNodes(tagNodes)

  const onTreeChange = async (e: any) => {

    // const tree = treeEl.value
    // if(!tree) return
    // const newData = tree.getData()
    // const newStats = tree.stats
    // console.log("newData: ")
    // console.log(newData)
    // console.log(" ")
    // console.log("newStates: ")
    // console.log(newStats)
    // console.log(" ")
    
    const res = await tagMovedInTree(tagNodes.value, oldTagNodes)
    if(!res.moved) {
      console.log("没有移动！！！！")
      console.log(oldTagNodes)
      console.log(" ")
      tagNodes.value = oldTagNodes
      return
    }

    console.log("有成功移动!!!!!")

    if(res.newNewTree) {
      tagNodes.value = res.newNewTree
    }
    
    oldTagNodes = JSON.parse(JSON.stringify(tagNodes.value)) as TagView[]
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
    oldTagNodes = JSON.parse(JSON.stringify(list)) as TagView[]
  }

  watch(workspace, (newV) => {
    _get()
  })
  _get()
}