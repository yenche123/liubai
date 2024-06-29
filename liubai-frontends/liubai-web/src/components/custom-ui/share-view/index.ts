
import { reactive, ref, watch } from "vue"
import type {
  ShareViewParam,
  ShareViewRes,
  SvResolver,
  ShareViewData,
  ShareDataType,
  ShareViaType,
} from "./tools/types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../tools/useCuiTool"
import { handleLinks } from "./tools/handle-links"
import liuUtil from "~/utils/liu-util"
import liuEnv from "~/utils/liu-env"
import { saveAs as fileSaverSaveAs } from 'file-saver';
import time from "~/utils/basic/time"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import { showSnackBar } from "../snack-bar/index"
import liuApi from "~/utils/liu-api"

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
  openCopy: false,
  openExport: false,
  text: "",
  markdown: "",
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
    onTapShareItem,
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


function onTapShareItem(
  dataType: ShareDataType,
  viaType: ShareViaType,
) {
  if(dataType === "markdown") {
    showSnackBar({ text_key: "share_related.under_construction" })
    return
  }

  const text = svData.text
  if(dataType === "text" && !text) {
    showSnackBar({ text_key: "share_related.no_text" })
    return
  }

  if(viaType === "copy" && dataType === "text") {
    liuApi.copyToClipboard(text)
    showSnackBar({ text_key: "common.copied" })
    return
  }

  if(viaType === "file" && dataType === "text") {
    exportFile(dataType, text)
    return
  }

}


function exportFile(
  dataType: ShareDataType,
  content: string,
) {
  const now = time.getTime()
  const date = new Date(now)
  const s = liuUtil.getLiuDate(date)
  const fileName = `${dataType} ${s.YYYY}-${s.MM}-${s.DD} ${s.hh}_${s.mm}_${s.ss}`

  let mimeType = "text/plain;charset=utf-8"
  if(dataType === "markdown") {
    mimeType = "text/markdown;charset=utf-8"
  }

  const blob = new Blob([content], { type: mimeType })
  fileSaverSaveAs(blob, fileName)
}


function onTapIcs(e: MouseEvent) {
  if(!svData.icsLink) return

  const { APP_NAME } = liuEnv.getEnv()
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

let toggleTimeout: LiuTimeout
function _toOpen() {
  if(show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  enable.value = true
  
  toggleTimeout = setTimeout(() => {
    show.value = true
  }, 16)
}

function _toClose() {
  if(!enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  show.value = false

  toggleTimeout = setTimeout(() => {
    enable.value = false

    const icsUrl = svData.icsLink
    if(icsUrl) {
      liuUtil.revokeObjURLs([icsUrl])
      svData.icsLink = ""
    }
    svData.openCopy = false
    svData.openExport = false
  }, TRANSITION_DURATION)
}

function onTapMask() {
  toResolve(true)
  closeIt(rr, queryKey)
}