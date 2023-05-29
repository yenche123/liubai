// 全局通知评论发生变化
// 比如:
// 1. 添加评论: 
//      告知某个 id 的 threadShow 或 commentShow ，让其 commentNum +1
// 2. 删除评论: 
//      告知某个 id 的 threadShow 或 commentShow ，让其 commentNum -1
// 3. 编辑评论:
//      刷新某个 comment
import { defineStore } from "pinia";

export const useGlobalStateStore = defineStore("comment", () => {
  
})