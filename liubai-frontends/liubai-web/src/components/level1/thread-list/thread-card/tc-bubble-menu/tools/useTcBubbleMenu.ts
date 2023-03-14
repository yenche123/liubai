
import type { TipTapEditor } from '~/types/types-editor';
import liuApi from "~/utils/liu-api"
import type { Instance, Props } from 'tippy.js'
import { ref } from 'vue';
import valTool from '~/utils/basic/val-tool';
import cui from '../../../../../custom-ui';
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import liuUtil from '~/utils/liu-util';


interface TcBubbleMenuOpt {
  editor: TipTapEditor | undefined
}

export function useTcBubbleMenu(
  opt: TcBubbleMenuOpt,
) {
  const selectedIndex = ref(-1)
  let tippy: Instance | undefined = undefined

  const tippyOptions: Partial<Props> = {
    hideOnClick: true,
    onMount(instance) {
      tippy = instance
    }
  }

  const rr = useRouteAndLiuRouter()

  const _toCloseTippy = async (idx: number) => {
    selectedIndex.value = idx
    await valTool.waitMilli(500)
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
    e.stopPropagation()
  }

  const onTapSearchIn = (e: Event) => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      cui.showSearchEditor({ type: "search", initText: text })
    }
    _toCloseTippy(1)
    e.stopPropagation()
  }

  const onTapSearchOut = (e: Event) => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      liuUtil.open.openOutSearch(text, { rr })
    }
    _toCloseTippy(2)
    e.stopPropagation()
  }

  const onTapBot = () => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      rr.router.pushCurrentWithNewQuery(rr.route, { gpt3: text })
    }
    _toCloseTippy(3)
  }

  return {
    selectedIndex,
    tippyOptions,
    onTapCopy,
    onTapSearchIn,
    onTapSearchOut,
    onTapBot,
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