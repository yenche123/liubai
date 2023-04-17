
import { reactive } from "vue";
import type { LiuTimeout } from "~/utils/basic/type-tool";

interface LoadingParam {
  title?: string
  title_key?: string
  mask?: boolean    // 是否显示蒙层，防止点击，默认为 true
}

interface LoadingData {
  title: string
  title_key: string
  mask: boolean
  enable: boolean
  show: boolean
}

const loData = reactive<LoadingData>({
  title: "",
  title_key: "",
  mask: true,
  enable: false,
  show: false,
})
const TRANSITION_DURATION = 90

const initLoading = () => {
  return { TRANSITION_DURATION, loData }
}

let showTimeout: LiuTimeout
let closeTimeout: LiuTimeout

const showLoading = async (opt?: LoadingParam): Promise<void> => {
  loData.title = opt?.title ?? ""
  loData.title_key = opt?.title_key ?? ""
  loData.mask = opt?.mask === false ? false : true

  if(loData.show) return
  if(closeTimeout) clearTimeout(closeTimeout)
  loData.enable = true
  showTimeout = setTimeout(() => {
    showTimeout = undefined
    loData.show = true
  }, 16)
}

const hideLoading = async (): Promise<void> => {
  if(!loData.enable) return
  if(showTimeout) clearTimeout(showTimeout)

  loData.show = false
  closeTimeout = setTimeout(() => {
    closeTimeout = undefined
    loData.enable = false
  }, TRANSITION_DURATION)
}


export {
  initLoading,
  showLoading,
  hideLoading,
}