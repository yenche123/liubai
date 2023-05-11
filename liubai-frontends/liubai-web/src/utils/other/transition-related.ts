import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { SimpleFunc } from "../basic/type-tool";
import type { ImageShow } from "~/types";

export interface TransitionHelperParam {
  updateDOM: SimpleFunc
  classNames?: string
}

/**
 * View Transition API 辅助函数
 * @param opt { 
 *   updateDOM: startViewTransition 的 callback, 
 *   classNames: 以空格分割的、要加在根节点上的 class 名
 * }
 * @return document.startViewTransition 返回的 transition
 */
export function transitionHelper(opt: TransitionHelperParam) {
  const { updateDOM, classNames = '' } = opt

  const rootEl = document.documentElement

  // 1. 现在根节点上添加几个暂时的 class 以锁定该动画只在这个 .class 下发生
  const classNamesArray = classNames.split(/\s+/g).filter(Boolean)
  rootEl.classList.add(...classNamesArray)

  // 2. 使用 View Transition API
  //@ts-expect-error: View Transition API
  const transition = document.startViewTransition(updateDOM)

  // 会在 transition.finished.then 被触发之前执行
  transition.finished.finally(() => {
    rootEl.classList.remove(...classNamesArray)
  })

  return transition
}

export function getViewTranNames(
  coversRef: Ref<ImageShow[] | undefined>,
) {
  const viewTranNames = ref<Array<string | undefined>>([])
  watch(coversRef, (newV , oldV) => {
    const newLen = newV?.length ?? 0
    const oldLen = oldV?.length ?? 0
    if(newLen === oldLen) return

    const list: string[] = []
    for(let i=0; i<newLen; i++) {
      list.push("")
    }
    viewTranNames.value = list
  })
  return viewTranNames
}