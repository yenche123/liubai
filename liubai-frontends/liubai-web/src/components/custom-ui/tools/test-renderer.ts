import { createRenderer } from "vue"

interface TestNode { children: TestNode[]; parent?: TestNode }
export const node = (): TestNode => ({ children: [] })
export const renderer = createRenderer<TestNode, TestNode>({
  createElement: node, createText: node, createComment: node,
  setText() {}, setElementText() {}, patchProp() {},
  insert(child, parent, anchor) {
    if (child.parent) {
      const siblings = child.parent.children
      const oldIndex = siblings.indexOf(child)
      if (oldIndex >= 0) siblings.splice(oldIndex, 1)
    }
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(child)
    else parent.children.splice(index, 0, child)
  },
  remove(child) {
    const children = child.parent?.children
    const index = children?.indexOf(child) ?? -1
    if (children && index >= 0) children.splice(index, 1)
    child.parent = undefined
  },
  parentNode: child => child.parent ?? null,
  nextSibling: child => {
    const siblings = child.parent?.children
    return siblings?.[siblings.indexOf(child) + 1] ?? null
  },
})
