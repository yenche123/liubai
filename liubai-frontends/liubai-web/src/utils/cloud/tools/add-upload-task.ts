// 把上传任务添加进 local db
// 处理一些可抵消的操作，比如
// 新建动态后删除，这时可以把新建的动态任务删掉，达到抵消的效果

import { UploadTaskLocalTable } from "~/types/types-table";
import { UploadTaskParam } from "./types";


/**
 * 去检查是否要添加任务到 db 中
 * @param task 
 * @returns boolean true: 表示要触发 preTrigger； false: 表示不需要
 */
export async function addUploadTask(
  param: UploadTaskParam,
  user: string,
) {
  const taskType = param.uploadTask
  if(taskType === "thread-delete") {

  }
  else if(taskType === "thread-edit") {

  }
  

  
}

/** 当 thread 要被删除时，检查
 *  若已存在 content-posts 任务里，去删掉该任务，达到抵消
*/
async function whenThreadDelete(
  param: UploadTaskParam,
  user: string,
) {
  


}



async function whenThreadEdit(
  param: UploadTaskParam,
  user: string,
) {

}
