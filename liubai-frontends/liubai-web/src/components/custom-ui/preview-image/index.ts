import { reactive, ref } from "vue"
import valTool from "../../../utils/basic/val-tool"
import type { ImageShow } from '../../../types';

interface PiParam {
  imgs: ImageShow[]
  index?: number
}

interface PiReturn {
  hasBack: boolean
}

interface PiData {
  imgs: ImageShow[]
  index: number
}

type PiResolver = (res: PiReturn) => void

let _resolve: PiResolver | undefined

const TRANSITION_DURATION = 120
const enable = ref(false)
const show = ref(false)

const data = reactive<PiData>({
  imgs: [],
  index: 0,
})

export function initPreviewImage() {
  return {
    TRANSITION_DURATION,
    enable,
    show,
    data,
    onTapCancel,
  }
}

function onTapCancel() {
  _resolve && _resolve({ hasBack: true })
  _close()
}

export async function previewImage(opt: PiParam) {
  const imgs = opt.imgs
  if(!imgs.length) {
    console.warn("opt.urls 必须有值")
    return
  }

  const idx = opt.index ?? 0
  if(idx < 0 || idx >= imgs.length) {
    console.warn("opt.index 不在合法值内")
    return
  }

  data.imgs = imgs
  data.index = idx

  await _open()

  const _wait = (a: PiResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}

async function _open() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close() {
  if(!show.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}