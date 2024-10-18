
export interface HeTreeStat<T> {
  [x: string]: any
  data: T
  open: boolean // 是否展开
  parent: HeTreeStat<T> | null // 父级节点stat
  children: HeTreeStat<T>[] // 子级节点
  level: number  // 层级. 层级从1开始.
  isStat: true   // 是否是stat对象
  hidden: boolean // 是否隐藏
  checked: boolean | 0 // 是否勾选. 0表示后代节点部分勾选
  draggable: boolean | null // 是否可拖动. null表示继承父级.
  droppable: boolean | null // 是否可拖入. null表示继承父级.
  style: any // 自定义样式. 支持Vue的style格式.
  class: any // 自定义样式类. 支持Vue的class格式.
}