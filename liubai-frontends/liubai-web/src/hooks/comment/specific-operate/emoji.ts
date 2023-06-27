// 点击或取消表态
import type { CommentShow } from '~/types/types-content';
import valTool from "~/utils/basic/val-tool"

export function toEmoji(
  cs: CommentShow,
  encodeStr: string,         // 若取消点赞，请返回一个 ""
) {

  const cs2 = valTool.copyObject(cs)
  

}