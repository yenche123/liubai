import type { LiuLimit } from "~/types/types-atom"
import liuEnv from "../liu-env"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import cui from "~/components/custom-ui"
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router"

let rr: RouteAndLiuRouter | undefined

function init() {
  rr = useRouteAndLiuRouter()
}

function getMode() {
  const be = liuEnv.hasBackend()
  if(be) return "online"
  return "pure_local"
}

// 返回当前用户对该功能的使用限制（number）
// 返回 -1 代表没有限制
function getLimit(val: LiuLimit) {
  const mode = getMode()
  const { isPremium } = useWorkspaceStore()

  const _env = liuEnv.getEnv()

  if(val === "pin") {
    if(mode === "pure_local") return _env.LOCAL_PIN_NUM
    if(isPremium) return _env.PREMIUM_PIN_NUM
    return _env.FREE_PIN_NUM
  }
  else if(val === "thread") {
    if(mode === "pure_local") return -1
    if(!isPremium) return _env.FREE_THREAD_NUM
  }
  else if(val === "workspace") {
    if(mode === "pure_local") return _env.LOCAL_WORKSPACE_NUM
    if(isPremium) return _env.PREMIUM_WORKSPACE_NUM
    return _env.FREE_WORKSPACE_NUM
  }
  else if(val === "thread_img") {
    if(mode === "pure_local") return _env.LOCAL_THREAD_IMG_NUM
    if(isPremium) return _env.PREMIUM_THREAD_IMG_NUM
    return _env.FREE_THREAD_IMG_NUM
  }
  else if(val === "comment_img") {
    if(mode === "pure_local") return _env.LOCAL_COMMENT_IMG_NUM
    if(isPremium) return _env.PREMIUM_COMMENT_IMG_NUM
    return _env.FREE_COMMENT_IMG_NUM
  }
  else if(val === "file_capacity") {
    if(mode === "pure_local") return _env.LOCAL_FILE_MB
    if(isPremium) return _env.PREMIUM_FILE_MB
    return _env.FREE_FILE_MB
  }

  return -1
}


function handleLimited(
  limitType: LiuLimit,
  maxNum: number,
) {
  const mode = getMode()
  const { isPremium } = useWorkspaceStore()

  // 1. show snackbar
  if(isPremium || mode === "pure_local") {
    _showLimited(limitType, maxNum)
    return
  }

  // 2. show popup to guide user to subscribe
  _guideToSubscribe(limitType)
}

async function _guideToSubscribe(
  limitType: LiuLimit,
) {
  let num = 0
  const _env = liuEnv.getEnv()
  let content_key = ""

  if(limitType === "pin") {
    num = _env.PREMIUM_PIN_NUM
    content_key = "limit.pin_premium"
  }
  else if(limitType === "thread_img") {
    num = _env.PREMIUM_THREAD_IMG_NUM
    content_key = "limit.thread_img_premium"
  }
  else if(limitType === "comment_img") {
    num = _env.PREMIUM_COMMENT_IMG_NUM
    content_key = "limit.comment_img_premium"
  }
  else if(limitType === "file_capacity") {
    num = _env.PREMIUM_FILE_MB
    content_key = "limit.file_capacity_premium"
  }
  
  if(num <= 0 || !content_key) return false

  const res = await cui.showModal({
    title: "🎁",
    content_key,
    content_opt: { num },
    confirm_key: "limit.become_premium",
    isTitleEqualToEmoji: true,
  })
  if(!res.confirm || !rr) return

  rr.router.push({ name: "subscription" })
}


function _showLimited(
  limitType: LiuLimit,
  maxNum: number,
) {
  if(limitType === "pin") {
    cui.showSnackBar({ text_key: "tip.pin_maximum", duration: 3000 })
    return
  }

  if(limitType === "thread_img" || limitType === "comment_img") {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "tip.max_pic_num",
      content_opt: { num: maxNum },
      showCancel: false
    })
    return
  }

  if(limitType === "file_capacity") {
    cui.showModal({
      title_key: "tip.file_exceed_title",
      title_opt: { num: maxNum },
      content_key: "tip.file_exceed_content",
      showCancel: false,
    })
    return
  }

}


export default {
  init,
  getLimit,
  handleLimited,
}