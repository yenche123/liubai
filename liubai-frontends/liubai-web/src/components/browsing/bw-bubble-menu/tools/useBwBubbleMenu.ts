
import type { TipTapEditor } from '~/types/types-editor';
import liuApi from "~/utils/liu-api"
import type { Instance, Props } from 'tippy.js'
import { inject, ref } from 'vue';
import valTool from '~/utils/basic/val-tool';
import cui from '~/components/custom-ui';
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import liuUtil from '~/utils/liu-util';
import { deviceChaKey } from '~/utils/provide-keys';


interface TcBubbleMenuOpt {
  editor?: TipTapEditor
}

export function useBwBubbleMenu(
  opt: TcBubbleMenuOpt,
) {
  const selectedIndex = ref(-1)
  let tippy: Instance | undefined

  const tippyOptions: Partial<Props> = {
    hideOnClick: true,
    onMount(instance) {
      tippy = instance
    },
    onHidden() {
      // 隐藏时，去取消所有选中......
      const selection = window.getSelection()
      if(!selection) return
      const { isCollapsed } = selection
      if(!isCollapsed) selection.removeAllRanges()
    },
    appendTo: () => document.body
  }

  const rr = useRouteAndLiuRouter()

  const _toCloseTippy = async (idx: number, instantly: boolean = false) => {
    selectedIndex.value = idx
    if(!instantly) {
      await valTool.waitMilli(500)
    }
    selectedIndex.value = -1
    tippy?.hide()
  }

  const onTapCopy = (e: Event) => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      liuApi.copyToClipboard(text)
      cui.showSnackBar({ text_key: "common.copied" })
    }
    _toCloseTippy(0)
  }

  const onTapSearchIn = (e: Event) => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      cui.showSearchEditor({ type: "search", initText: text })
    }
    _toCloseTippy(1, true)
  }

  const onTapSearchOut = (e: Event) => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      liuUtil.open.openOutSearch(text, { rr })
    }
    _toCloseTippy(2)
  }

  const onTapBot = () => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      rr.router.pushCurrentWithNewQuery(rr.route, { gpt3: text })
    }
    _toCloseTippy(3)
  }

  const cha = inject(deviceChaKey)

  return {
    selectedIndex,
    tippyOptions,
    onTapCopy,
    onTapSearchIn,
    onTapSearchOut,
    onTapBot,
    cha,
  }
}

function _getSelectionText(
  editor?: TipTapEditor
) {
  if(!editor) {
    console.log("editor 不存在呀..........")
    return ""
  }
  const { state } = editor
  const { doc, selection } = state
  const { from, to } = selection
  const str = doc.textBetween(from, to)
  return str
}