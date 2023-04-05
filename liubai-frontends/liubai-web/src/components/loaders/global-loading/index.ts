import { ref } from "vue";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import valTool from "~/utils/basic/val-tool";

const enable = ref(false)
const number = ref(0)
const transition = ref(300)   // 移动时要消耗多少毫秒数
let timeout: LiuTimeout

export function initGlobalLoading() {
  return {
    enable,
    number,
    transition,
  }
}

export async function showGlobalLoading() {
  enable.value = true
  _step0()
}

function _step0() {
  timeout = setTimeout(() => {
    transition.value = 300
    number.value = 30
    _step1()
  }, 16)
}

function _step1() {
  timeout = setTimeout(() => {
    transition.value = 5000
    number.value = 75
    _step2()
  }, 300)
}

function _step2() {
  timeout = setTimeout(() => {
    transition.value = 1000
    number.value = 90
    _step3()
  }, 5000)
}

function _step3() {
  timeout = setTimeout(() => {
    transition.value = 9000
    number.value = 99
  }, 1500)
}


export async function hideGlobalLoading() {
  if(timeout) clearTimeout(timeout)
  timeout = undefined

  transition.value = 400
  number.value = 100

  await valTool.waitMilli(400)
  reset()
}

function reset() {
  enable.value = false
  transition.value = 300
  number.value = 1
}