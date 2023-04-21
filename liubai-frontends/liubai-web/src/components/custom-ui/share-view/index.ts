
import { reactive, ref, watch } from "vue"
import type {
  ShareViewParam,
  ShareViewRes,
  SvResolver,
  ShareViewData,
} from "./tools/types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"
import { openIt, closeIt, handleCustomUiQueryErr } from "../tools/useCuiTool"
import { handleLinks } from "./tools/handle-links"
import liuUtil from "~/utils/liu-util"
import { saveAs as fileSaverSaveAs } from 'file-saver';
import time from "~/utils/basic/time"

let _resolve: SvResolver | undefined
const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const svData = reactive<ShareViewData>({
  public: false,
  allowComment: false,
  threadId: "",
  copyLink: "",
  googleCalendarLink: "",
  outlookLink: "",
  icsLink: "",
  twitterLink: "",
  emailLink: "",
  lineLink: "",
})
const queryKey = "shareview"
let rr: RouteAndLiuRouter | undefined

export function initShareView() {
  listenRouteChange()

  return {
    TRANSITION_DURATION,
    enable,
    show,
    svData,
    onTapMask,
    onPublicChanged,
    onTapAllowComment,
    onTapIcs,
  }
}

export function showShareView(param: ShareViewParam) {
  svData.public = param.visScope === "PUBLIC"
  svData.allowComment = param.allowComment ?? false
  svData.threadId = param.threadId

  handleLinks(svData, param.thread)

  openIt(rr, queryKey)

  const _wait = (a: SvResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

function onTapIcs(e: MouseEvent) {
  if(!svData.icsLink) return

  const { APP_NAME } = liuUtil.getEnv()
  const stamp = time.getTime()
  const sec = Math.round(stamp / 1000)
  fileSaverSaveAs(svData.icsLink, `${APP_NAME}-${sec}.ics`)
}

function listenRouteChange() {
  rr = useRouteAndLiuRouter()
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(_resolve) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }

    if(_resolve) {
      toResolve(true)
    }

    _toClose()
  })
}


function onPublicChanged(newV: boolean) {
  svData.public = newV
}

function onTapAllowComment() {
  if(!svData.public) return
  svData.allowComment = !svData.allowComment
}

function toResolve(res: ShareViewRes) {
  if(!_resolve) return
  _resolve(res)
  _resolve = undefined
}

async function _toOpen() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  await valTool.waitMilli(TRANSITION_DURATION)
}

async function _toClose() {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false

  const icsUrl = svData.icsLink
  if(icsUrl) {
    liuUtil.revokeObjURLs([icsUrl])
    svData.icsLink = ""
    console.log("已销毁 icsUrl.........")
  }
}

function onTapMask() {
  toResolve(true)
  closeIt(rr, queryKey)
}