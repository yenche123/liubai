
import { reactive, ref } from "vue"
import type {
  ShareViewParam,
  SvResolver
} from "./tools/types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"

let _resolve: SvResolver | undefined
const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const svData = reactive({
  public: false,
  allowComment: false,
  threadId: "",
})
const queryKey = "previewimage"
let rr: RouteAndLiuRouter | undefined

export function initShareView() {

  return {
    TRANSITION_DURATION,
    enable,
    show,
    svData,

  }

}

export function showShareView(param: ShareViewParam) {
  svData.public = param.visScope === "PUBLIC"
  svData.allowComment = param.allowComment ?? false
  svData.threadId = param.threadId

}


function onTapMask() {

}