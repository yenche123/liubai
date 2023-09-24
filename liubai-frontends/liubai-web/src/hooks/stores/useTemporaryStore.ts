// 存储一些 "暂时" 数据，当作隧道用
import { defineStore } from "pinia";

export const useTemporaryStore = defineStore("temp", () => {
  // 是否要聚焦某个评论下的输入框

  let focusCommentEditor = false

  const setFocusCommentEditor = () => {
    focusCommentEditor = true
  }
  const getFocusCommentEditor = () => {
    if(!focusCommentEditor) return false
    focusCommentEditor = false
    return true
  }
  
  return {
    setFocusCommentEditor,
    getFocusCommentEditor,
  }
})