import { ref, watch, type Ref } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { SimpleFunc } from "~/utils/basic/type-tool";
import valTool from "~/utils/basic/val-tool";
import liuUtil from "~/utils/liu-util";

interface OpenCloseData {
  enable: boolean
  show: boolean
  [key: string]: any
}

interface OpenCloseOpt {
  duration?: number
  beforeOpen?: SimpleFunc
  afterOpen?: SimpleFunc
  beforeClose?: SimpleFunc
  afterClose?: SimpleFunc
}

export function useOpenClose(
  isOn: Ref<boolean>,
  data: OpenCloseData,
  opt?: OpenCloseOpt,
) {

  watch(isOn, (newV) => {
    if(newV) _open(data, opt)
    else _close(data, opt)
  }, { immediate: true })
}


async function _open(
  data: OpenCloseData,
  opt?: OpenCloseOpt,
) {
  if(data.show) return

  opt?.beforeOpen?.()

  data.enable = true
  await liuUtil.waitAFrame()
  if(data.enable) {
    data.show = true
    opt?.afterOpen?.()
  }
}

async function _close(
  data: OpenCloseData,
  opt?: OpenCloseOpt,
) {
  if(!data.enable) return

  opt?.beforeClose?.()

  data.show = false
  await valTool.waitMilli(opt?.duration ?? 300)
  if(!data.show) {
    data.enable = false
    opt?.afterClose?.()
  }
}


/** simulate page navigation on mobile experience 
 * Effect: when user is back to the previous page, the page will be closed
*/
export function usePageEnabled(pageName: string) {
  const pageEnabled = ref(true)
  const rr = useRouteAndLiuRouter()

  watch(rr.route, (newV) => {
    if(!newV) return
    const stacks = rr.router.getStack()
    const currentPage = stacks.find(v => {
      return v.name === pageName || v.name === `collaborative-${pageName}`
    })
    const hasCurrentPage = Boolean(currentPage)
    console.log("hasCurrentPage: ", hasCurrentPage)
    pageEnabled.value = hasCurrentPage
  })

  return {
    pageEnabled,
  }
}
