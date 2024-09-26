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
import reg_exp from "~/config/regular-expressions"

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


type LinkType = "phone" | "email" | "url_scheme" | "other"
function getLinkType(
  url: string,
  dataLink: string | null,
): LinkType {
  const res1 = url.startsWith("mailto:")
  if(res1) return "email"

  const res2 = url.startsWith("tel:")
  if(res2) return "phone"

  if(dataLink && isUrlScheme(dataLink)) {
    return "url_scheme"
  }

  return "other"
}

async function whenTapEmail(email: string) {
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
    location.href = `mailto:${email}`
  }
}


function copyAndSnackBar(text: string) {
  liuApi.copyToClipboard(text)
  cui.showSnackBar({ text_key: "common.copied" })
}

function callThePhoneNumber(phone: string) {
  location.href = `tel:${phone}`
}


async function whenTapPhoneNumber(phone: string) {
  const { 
    isPC, 
    isMac, 
    isWeChat, 
    isAndroid,
    isMobile,
  } = liuApi.getCharacteristic()

  if(isPC && !isMac) {
    // filter macOS beacuse people can use FaceTime on macOS
    copyAndSnackBar(phone)
    return
  }

  if(isWeChat && isAndroid && isMobile) {
    callThePhoneNumber(phone)
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
    copyAndSnackBar(phone)
  }
  else if(idx === 1) {
    callThePhoneNumber(phone)
  }
}

function isUrlScheme(dataLink: string) {
  if(dataLink.startsWith("http")) return false
  const matches = dataLink.matchAll(reg_exp.url_scheme)
  const dLen = dataLink.length
  for(let match of matches) {
    const mTxt = match[0]
    const mLen = mTxt.length
    if(mLen === dLen) return true
  }
  return false
}

async function whenTapUrlScheme(
  dataLink: string,
) {
  const { isInWebView } = liuApi.getCharacteristic()
  if(isInWebView) {
    copyAndSnackBar(dataLink)
    return
  }

  const res = await cui.showActionSheet({
    title: dataLink,
    itemList: [
      {
        text_key: "editor.copy",
        iconName: "copy",
      },
      {
        text_key: "editor.try_to_open",
        iconName: "arrow_outward",
      }
    ]
  })

  if(res.result !== "option") return
  const idx = res.tapIndex
  if(typeof idx === "undefined") return
  
  if(idx === 0) {
    copyAndSnackBar(dataLink)
  }
  else if(idx === 1) {
    location.href = dataLink
  }
}


async function whenTapLink(
  a: HTMLLinkElement,
  url: string, 
  rr: RouteAndLiuRouter,
) {
  const dataLink = a.getAttribute("data-link")
  const linkType = getLinkType(url, dataLink)
  if(linkType === "email") {
    const email = url.substring(7)
    whenTapEmail(email)
    return
  }

  if(linkType === "phone") {
    const phone = url.substring(4)
    whenTapPhoneNumber(phone)
    return
  }

  if(linkType === "url_scheme") {
    whenTapUrlScheme(dataLink as string)
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
    whenTapLink(a, url, rr)
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