import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import thirdLink from "~/config/third-link";

export interface ThirdScriptAttr {
  name: string
  value: string
}

export function useThirdScript(
  url: string,
  attributes?: Array<ThirdScriptAttr>,
) {

  const boxRef = ref<HTMLDivElement>()

  let hasAdded = false
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

    // 若当前是 instagram 的脚本，且已存在，那么直接调用
    // 参考: https://stackoverflow.com/questions/27408917/
    //@ts-expect-error: window.instgrm
    if(url === thirdLink.IG_EMBED && window.instgrm) {
      //@ts-expect-error: window.instgrm
      window.instgrm.Embeds.process()
      return
    }

    el.appendChild(s)
    hasAdded = true
  })

  onBeforeUnmount(() => {
    const el = boxRef.value
    if(!el) return
    if(!hasAdded) return
    el.removeChild(s)
  })

  return {
    boxRef
  }
}