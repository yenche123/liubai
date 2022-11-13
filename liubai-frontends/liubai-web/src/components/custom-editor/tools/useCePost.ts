import type { Ref, ShallowRef } from "vue";
import type { EditorCoreContent, TipTapJSONContent } from "../../../types/types-editor";
import type { TipTapEditor } from "../../../types/types-editor"
import type { CeState } from "./atom-ce"

export interface CepContext {
  canSubmitRef: Ref<boolean>
  editor: ShallowRef<TipTapEditor | undefined>
  state: CeState
}

export type CepToPost = () => void

// 发表
export function useCePost(ctx: CepContext) {


  const toPost: CepToPost = () => {
    if(!ctx.canSubmitRef.value) return

  }


  return { toPost }
}