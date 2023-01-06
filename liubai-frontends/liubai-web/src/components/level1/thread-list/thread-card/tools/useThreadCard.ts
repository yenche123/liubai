import { onMounted, ref, shallowRef } from 'vue';
import EditorCore from "../../../../editor-core/editor-core.vue"
import type { TipTapEditor } from "~/types/types-editor"
import type { TcProps } from "./types"
import liuApi from '~/utils/liu-api';
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { LiuRouter } from '~/routes/liu-router';
import type { RouteLocationNormalizedLoaded } from "vue-router"
import { useGlobalStateStore } from '~/hooks/stores/useGlobalStateStore';
import type {
  GlobalStateStore
} from "~/hooks/stores/useGlobalStateStore"
import liuUtil from '~/utils/liu-util';

interface TcCtx {
  props: TcProps
  route: RouteLocationNormalizedLoaded
  router: LiuRouter
  gStore: GlobalStateStore
}

export function useThreadCard(props: TcProps) {
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = shallowRef<TipTapEditor>()
  const { route, router } = useRouteAndLiuRouter()
  const gStore = useGlobalStateStore()

  const ctx: TcCtx = {
    props,
    route,
    router,
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
    const { target, currentTarget } = e
    if(liuApi.eventTargetIsSomeTag(target, "a")) return
    isBriefing.value = false
    e.stopPropagation()
  }

  const onTapThreadCard = (e: MouseEvent) => {
    handleTapThreadCard(e, ctx)
  }

  return {
    editorCoreRef,
    editor,
    isBriefing,
    onTapBriefing,
    onTapThreadCard,
    onTapContent,
  }
}

function onTapContent(e: MouseEvent) {
  // e.stopPropagation()
  // console.log("eeee")
}

function handleTapThreadCard(
  e: MouseEvent,
  ctx: TcCtx,
) {
  const { target, currentTarget } = e
  const { props, route, router } = ctx

  if(liuApi.getSelectionText()) return

  const res = ctx.gStore.isJustSelect()
  if(res) return
  if(liuApi.eventTargetIsSomeTag(target, "a")) return
  if(props.displayType === "detail") return
  if(props.viewType === "TRASH") return

  const { threadData } = props
  const cid = threadData._id
  const toWhere = liuUtil.toWhatDetail()
  
  if(toWhere === "detail-page") {
    // 用 detail-page 打开
    openDetailWithDetailPage(cid, ctx)
  }
  else if(toWhere === "vice-view") {
    // 用侧边栏打开.......
    openDetailWithViceView(cid, ctx)
  }
}


function openDetailWithViceView(cid: string, ctx: TcCtx) {
  const { route, router } = ctx
  router.pushCurrentWithNewQuery(route, { cid })
}

function openDetailWithDetailPage(contentId: string, ctx: TcCtx) {
  const { route, router } = ctx
  router.pushNewPageWithOldQuery(route, { name: "detail", params: { contentId } })
}

