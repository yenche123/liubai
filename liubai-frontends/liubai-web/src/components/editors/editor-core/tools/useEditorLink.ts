import type { 
  EditorCoreProps, 
} from "./types"
import { nextTick, onMounted, ref, toRef, watch } from "vue"
import type { ComponentPublicInstance, Ref } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import liuUtil from "~/utils/liu-util"

// 为每个 "浏览态" 的链接添加 监听器
export function useEditorLink(
  props: EditorCoreProps,
) {
  const ecRef = ref<ComponentPublicInstance>()
  if(!props.isEdit) {
    initEditorLink(props, ecRef)
  }

  return {
    ecRef
  }
}

function initEditorLink(
  props: EditorCoreProps,
  ecRef: Ref<ComponentPublicInstance | undefined>
) {
  const rr = useRouteAndLiuRouter()
  const contentRef = toRef(props, "content")

  const onTapLink = (e: MouseEvent) => {
    e.preventDefault()
    const a = e.target as HTMLLinkElement
    const url = a.href
    if(!url) return
    liuUtil.open.openLink(url, { rr })
  }

  const resetLinks = (parentEl: HTMLElement) => {
    const nodes = parentEl.querySelectorAll<HTMLElement>("a.liu-link")

    nodes.forEach(v => {
      v.removeEventListener("click", onTapLink)
      v.addEventListener("click", onTapLink)
    })
  }

  onMounted(async () => {
    const el = ecRef.value?.$el
    if(!el) return
    await nextTick()
    resetLinks(el)
  })

  watch(contentRef, async (newV) => {
    await nextTick()
    const el = ecRef.value?.$el
    if(!el) return
    resetLinks(el)
  })
}