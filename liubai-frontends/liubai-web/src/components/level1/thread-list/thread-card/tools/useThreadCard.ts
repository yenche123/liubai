import { onMounted, ref, shallowRef, watch } from 'vue';
import EditorCore from "~/components/editors/editor-core/editor-core.vue"
import type { TipTapEditor } from "~/types/types-editor"
import type { TcEmits, TcProps } from "./types"
import liuApi from '~/utils/liu-api';
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { RouteAndLiuRouter } from '~/routes/liu-router';
import { useGlobalStateStore } from '~/hooks/stores/useGlobalStateStore';
import type {
  GlobalStateStore
} from "~/hooks/stores/useGlobalStateStore"
import liuUtil from '~/utils/liu-util';
import cui from '~/components/custom-ui';

interface TcCtx {
  props: TcProps
  rr: RouteAndLiuRouter
  gStore: GlobalStateStore
}

export function useThreadCard(
  props: TcProps,
  emit: TcEmits,
) {
  const showMore = ref(false)
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  const rr = useRouteAndLiuRouter()
  const gStore = useGlobalStateStore()

  const ctx: TcCtx = {
    props,
    rr,
    gStore
  }

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as TipTapEditor
  })

  const { threadData, displayType } = props
  let isBriefing = ref(Boolean(threadData.briefing))
  if(displayType === "detail") isBriefing.value = false

  const onTapBriefing = (e: MouseEvent) => {
    const { target } = e
    if(liuApi.eventTargetIsSomeTag(target, "a")) return
    emit("tapbriefing")
    isBriefing.value = false
  }

  const onTapAll = (e: MouseEvent) => {
    const { target } = e
    if(liuApi.eventTargetIsSomeTag(target, "a")) return
    
    if(isBriefing.value) {
      emit("tapbriefing")
      isBriefing.value = false
      return
    }
    handleTapThreadCard(e, ctx)
  }

  const onTapThreadCard = (e: MouseEvent) => {
    handleTapThreadCard(e, ctx)
  }

  const onMouseEnter = () => {
    showMore.value = true
  }

  const onMouseLeave = () => {
    showMore.value = false
  }

  watch(() => props.showTxt, (newV) => {
    if(newV !== "false") return
    showMore.value = false
  })

  return {
    editorCoreRef,
    editor,
    isBriefing,
    onTapBriefing,
    onTapAll,
    onTapThreadCard,
    showMore,
    onMouseEnter,
    onMouseLeave,
  }
}

function handleTapThreadCard(
  e: MouseEvent,
  ctx: TcCtx,
) {
  const { target } = e
  const { props } = ctx

  if(liuApi.getSelectionText()) return

  const res = ctx.gStore.isJustSelect()
  if(res) return
  if(liuApi.eventTargetIsSomeTag(target, "a")) return
  if(props.displayType === "detail") return
  if(props.viewType === "TRASH") return

  const { threadData } = props
  if(threadData.oState !== "OK") {
    cui.showSnackBar({ text_key: "thread_related.content_deleted" })
    return
  }

  const cid = threadData._id
  liuUtil.open.openDetail(cid, ctx)
}

