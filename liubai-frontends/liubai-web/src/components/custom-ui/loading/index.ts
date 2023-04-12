
import { reactive, ref } from "vue";
import valTool from "~/utils/basic/val-tool"

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

const showLoading = async (opt?: LoadingParam): Promise<void> => {
  loData.title = opt?.title ?? ""
  loData.title_key = opt?.title_key ?? ""
  loData.mask = opt?.mask === false ? false : true

  if(loData.show) return
  loData.enable = true
  await valTool.waitMilli(16)
  if(loData.enable) loData.show = true
}

const hideLoading = async (): Promise<void> => {
  if(!loData.show) return
  loData.show = false
  await valTool.waitMilli(TRANSITION_DURATION)
  if(!loData.show) loData.enable = false
}


export {
  initLoading,
  showLoading,
  hideLoading,
}