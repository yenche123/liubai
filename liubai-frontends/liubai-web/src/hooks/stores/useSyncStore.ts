// 当同步完成后
// 触发此 store 让其通知到各个组件
import { defineStore } from "pinia";

interface CsItem {
  old_id: string
  new_id: string
}

export const useGlobalStateStore = defineStore("content", () => {})