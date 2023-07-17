import { nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";



export function useThirdScript(
  url: string,
) {

  const boxRef = ref<HTMLDivElement>()

  const s = document.createElement("script")
  s.async = true
  s.src = url

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