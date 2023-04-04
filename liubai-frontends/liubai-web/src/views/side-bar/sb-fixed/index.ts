import { ref } from "vue";
import valTool from "~/utils/basic/val-tool";

const enable = ref(false)
const show = ref(false)
const TRANSITION_DURATION = 300

export function initFixedSideBar() {
  return {
    enable,
    show,
    TRANSITION_DURATION,
    onTapPopup,
  }
}

export function showFixedSideBar() {
  _open()
}

export function closeFixedSideBar() {
  _close()
}

function onTapPopup() {
  _close()
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
