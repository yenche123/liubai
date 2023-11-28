import { reactive, watch } from "vue";
import type { 
  CustomBtnData, 
  CustomBtnProps,
} from "./types";


export function useCustomButton(props: CustomBtnProps) {

  const cbData = reactive<CustomBtnData>({
    enableLoading: false,
    showLoading: false,
    showingTimeout: undefined,
    closingTimeout: undefined,
    loadingColor: "var(--on-primary)",
  })

  watch(() => props.isLoading, (newV) => {
    whenIsLoadingChange(props, cbData)
  }, { immediate: true })

  watch(() => props.type, (newV) => {
    whenTypeChange(props, cbData)
  }, { immediate: true })

  return {
    cbData,
  }
}

function whenTypeChange(
  props: CustomBtnProps,
  cbData: CustomBtnData,
) {
  const newV = props.type
  const oldColor = cbData.loadingColor
  let newColor = oldColor
  if(newV === "other") newColor = `var(--other-btn-text)`
  else if(newV === "transparent") newColor = `var(--primary-color)`
  else if(newV === "pure") newColor = `var(--main-text)`

  if(oldColor !== newColor) cbData.loadingColor = newColor
}


function whenIsLoadingChange(
  props: CustomBtnProps,
  cbData: CustomBtnData,
) {
  if(props.isLoading === cbData.enableLoading) return
  if(props.isLoading) {
    toShow(cbData)
  }
  else {
    toHide(cbData)
  }
}

function toShow(
  cbData: CustomBtnData,
) {
  if(cbData.closingTimeout) {
    clearTimeout(cbData.closingTimeout)
    cbData.closingTimeout = undefined
  }

  if(cbData.showingTimeout) return
  cbData.enableLoading = true
  cbData.showingTimeout = setTimeout(() => {
    cbData.showingTimeout = undefined
    cbData.showLoading = true
  }, 16)
}

function toHide(
  cbData: CustomBtnData,
) {
  if(cbData.showingTimeout) {
    clearTimeout(cbData.showingTimeout)
    cbData.showingTimeout = undefined
  }

  if(cbData.closingTimeout) return
  cbData.showLoading = false
  cbData.closingTimeout = setTimeout(() => {
    cbData.closingTimeout = undefined
    cbData.enableLoading = false
  }, 200)
}