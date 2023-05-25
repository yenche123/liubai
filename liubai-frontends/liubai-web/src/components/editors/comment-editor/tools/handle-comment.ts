// 发表或更新评论的逻辑

import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { CeProps, CeCtx } from "./types";

export function handleComment(props: CeProps, ctx: CeCtx) {

  const wStore = useWorkspaceStore()
  if(!wStore.memberId) return

  if(props.commentId) toUpdate(props, ctx)
  else toRelease(props, ctx)
}

function toUpdate(props: CeProps, ctx: CeCtx) {
  console.log("to update........")
}

function toRelease(props: CeProps, ctx: CeCtx) {
  console.log("to release...........")

}