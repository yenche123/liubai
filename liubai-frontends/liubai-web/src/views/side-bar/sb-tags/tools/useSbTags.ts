import { Ref, ref } from "vue";
import { Draggable } from "@he-tree/vue";

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
  const tagNodes = ref<TagNode[]>([])

  initTagNodes(tagNodes)

  const onTreeChange = () => {

  }

  const onTapTagArrow = (e: MouseEvent, node: TagNode, stat: Stat<TagNode>) => {
    const length = node.children?.length ?? 0
    if(!length) return
    stat.open = !stat.open
    e.stopPropagation()
  }

  const onTapTagItem = (e: MouseEvent, node: TagNode, stat: Stat<TagNode>) => {
    console.log("onTapTagItem............")
    
  }

  return { tagNodes, treeEl, onTreeChange, onTapTagItem, onTapTagArrow }
}

function initTagNodes(tagNodes: Ref<TagNode[]>) {
  const tree: TagNode[] = [
    {
      text: "收件箱"
    },
    {
      text: "领域",
      children: [
        {
          text: "收件箱",
          children: [
            {
              text: "一封信",
            },
            {
              text: "第 2 封信"
            }
          ]
        },
        {
          text: "投资",
          children: [
            {
              text: "短线"
            },
            {
              text: "长线"
            }
          ]
        },
        {
          text: "计算机",
          children: [
            {
              text: "JS 技术栈",
              children: [
                {
                  text: "HTML"
                },
                {
                  text: "CSS"
                },
                {
                  text: "JavaScript"
                },
                {
                  text: "TypeScript",
                },
                {
                  text: "Vue"
                }
              ]
            },
            {
              text: "AI 人工智能",
            },
            {
              text: "Python",
            }
          ]
        }
      ]
    },
    {
      text: "资源",
      children: [
        {
          text: "书籍",
        },
        {
          text: "电影",
        },
        {
          text: "音乐",
          children: [
            {
              text: "嘻哈 (Hip Hop)",
            },
            {
              text: "R&B",
            },
            {
              text: "华语流行",
            },
            {
              text: "美国流行",
            },
            {
              text: "英伦摇滚"
            }
          ]
        },
      ]
    },
    {
      text: "项目"
    }
  ]
  tagNodes.value = tree
}