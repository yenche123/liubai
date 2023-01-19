import { ShallowRef, InjectionKey, provide, inject } from "vue"
import type { SnIndicatorData } from "./types"
import { shallowRef } from "vue"

// 因为 列表和看板 两个 tab 会生成两个不同实例的 state-navi 导航栏
// 需要一个 provide-inject 统一当前导航栏上的选项卡的指示器位置
// 当一个实例中的指示器有值 (width / left) 时，赋值到 shallowRef 的实例上
// 这样即可在父组件收到，再向下流回两边的 state-navi

export const snIndicatorKey = Symbol() as InjectionKey<ShallowRef<SnIndicatorData>>

const defaultData = {
  width: "0px",
  left: "0px",
}

export function useProvideSnIndicator() {

  const indicatorData = shallowRef<SnIndicatorData>(defaultData)

  provide(snIndicatorKey, indicatorData)

  return {
    indicatorData,
  }
}

export function useInjectSnIndicator() {
  const indicatorData = inject(snIndicatorKey, shallowRef(defaultData))
  return indicatorData
}