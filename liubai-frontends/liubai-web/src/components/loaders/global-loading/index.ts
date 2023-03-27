import { ref } from "vue";

const enable = ref(false)
const progress = ref(0)

export function initGlobalLoading() {
  return {
    enable,
    progress,
  }
}

export function showGlobalLoading() {

}

export function hideGlobalLoading() {

}