import { watch } from "vue";
import type { CmaProps, MaData } from "./types-cma";
import type { CeState } from "../../tools/types-ce";
import liuUtil from "../../../../utils/liu-util";

export function receiveCmaProps(props: CmaProps, data: MaData) {
  watch(() => props.state, (newV) => {
    stateChanged(data, newV)
  })
  stateChanged(data, props.state)
}

function stateChanged(data: MaData, state?: CeState) {
  if(!state) return
  console.log("stateChanged..............")
  console.log(" ")

  const { 
    whenStamp, 
    storageState, 
    title: newTitle,
    remindMe,
  } = state

  // 开始一个个字段判断

  // 什么时候
  const newWhen = whenStamp ? liuUtil.showBasicDate(whenStamp) : ""
  if(newWhen !== data.when) {
    data.when = newWhen
    if(whenStamp) data.whenDate = new Date(whenStamp)
  }

  // 





}