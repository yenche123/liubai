import type { 
  EditorCoreProps, 
} from "./types"
import { nextTick, onMounted, ref, toRef, watch } from "vue"
import type { ComponentPublicInstance, Ref } from "vue"
import cui from "~/components/custom-ui"
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router"
import liuApi from "~/utils/liu-api"
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



type LinkType = "phone" | "email" | "other"
function getLinkType(url: string): LinkType {
  const res1 = url.startsWith("mailto:")
  if(res1) return "email"

  const res2 = url.startsWith("tel:")
  if(res2) return "phone"

  return "other"
}

async function whenTapEmail(email: string, rr: RouteAndLiuRouter) {
  const res = await cui.showActionSheet({
    title: email,
    itemList: [
      {
        text_key: "editor.copy",
        iconName: "copy",
      },
      {
        text_key: "editor.mail",
        iconName: "mail",
      }
    ]
  })

  if(res.result !== "option") return
  const idx = res.tapIndex
  if(typeof idx === "undefined") return

  if(idx === 0) {
    liuApi.copyToClipboard(email)
    cui.showSnackBar({ text_key: "common.copied" })
  }
  else if(idx === 1) {
    liuUtil.open.openLink(`mailto:${email}`, { rr })
  }
}

async function whenTapPhoneNumber(phone: string, rr: RouteAndLiuRouter) {
  const cha = liuApi.getCharacteristic()

  if(cha.isPC) {
    liuApi.copyToClipboard(phone)
    cui.showSnackBar({ text_key: "common.copied" })
    return
  }

  const res = await cui.showActionSheet({
    title: phone,
    itemList: [
      {
        text_key: "editor.copy",
        iconName: "copy",
      },
      {
        text_key: "editor.call",
        iconName: "call",
      }
    ]
  })

  if(res.result !== "option") return
  const idx = res.tapIndex
  if(typeof idx === "undefined") return
  
  if(idx === 0) {
    liuApi.copyToClipboard(phone)
    cui.showSnackBar({ text_key: "common.copied" })
  }
  else if(idx === 1) {
    liuUtil.open.openLink(`tel:${phone}`, { rr })
  }
}


async function whenTapLink(url: string, rr: RouteAndLiuRouter) {
  const linkType = getLinkType(url)
  if(linkType === "email") {
    const email = url.substring(7)
    whenTapEmail(email, rr)
    return
  }

  if(linkType === "phone") {
    const phone = url.substring(4)
    whenTapPhoneNumber(phone, rr)
    return
  }

  liuUtil.open.openLink(url, { rr })
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
    whenTapLink(url, rr)
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