import type { 
  EditorCoreProps, 
} from "./types"
import { nextTick, onMounted, ref, toRef, watch } from "vue"
import type { ComponentPublicInstance } from "vue"

// 为每个 "浏览态" 的链接添加 监听器
export function useEditorLink(
  props: EditorCoreProps,
) {
  const contentRef = toRef(props, "content")
  const ecRef = ref<ComponentPublicInstance>()

  if(!props.isEdit) {
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

  return {
    ecRef
  }
}


function onTapLink(e: MouseEvent) {
  e.preventDefault()
  const a = e.target as HTMLLinkElement
  console.log("a.href: ")
  console.log(a.href)
  console.log(" ")
}

function resetLinks(parentEl: HTMLElement) {
  const nodes = parentEl.querySelectorAll<HTMLElement>("a.liu-link")

  nodes.forEach(v => {
    v.removeEventListener("click", onTapLink)
    v.addEventListener("click", onTapLink)
  })
}