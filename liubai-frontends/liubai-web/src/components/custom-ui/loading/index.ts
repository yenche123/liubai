
import { ref } from "vue";
import valTool from "~/utils/basic/val-tool"

interface LoadingParam {
  title?: string
  mask?: boolean    // 是否显示蒙层，防止点击，默认为 true
}

const enable = ref(false)
const show = ref(false)
const TRANSITION_DURATION = 90
const title = ref("")
const mask = ref(true)

const initLoading = () => {
  return { title, enable, show, TRANSITION_DURATION, mask }
}

const showLoading = async (opt?: LoadingParam): Promise<void> => {
  if(opt && opt.title) title.value = opt.title
  else title.value = ""

  if(opt && opt.mask === false) mask.value = false
  else mask.value = true

  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

const hideLoading = async (): Promise<void> => {
  if(!show.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}


export {
  initLoading,
  showLoading,
  hideLoading,
}