import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

export interface ThirdScriptAttr {
  name: string
  value: string
}

export function useThirdScript(
  url: string,
  attributes?: Array<ThirdScriptAttr>,
) {

  const boxRef = ref<HTMLDivElement>()

  const s = document.createElement("script")
  s.async = true
  s.src = url

  if(attributes?.length) {
    attributes.forEach(v => {
      s.setAttribute(v.name, v.value)
    })
  }

  onMounted(async () => {
    await nextTick()
    const el = boxRef.value
    if(!el) return
    el.appendChild(s)
  })

  onBeforeUnmount(() => {
    const el = boxRef.value
    if(!el) return
    el.removeChild(s)
  })

  return {
    boxRef
  }
}