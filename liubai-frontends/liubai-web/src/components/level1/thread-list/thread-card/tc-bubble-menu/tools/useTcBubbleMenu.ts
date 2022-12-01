
import type { TipTapEditor } from '../../../../../../types/types-editor';
import liuApi from "../../../../../../utils/liu-api"
import type { Instance, Props } from 'tippy.js'


interface TcBubbleMenuOpt {
  editor: TipTapEditor | undefined
}

export function useTcBubbleMenu(
  opt: TcBubbleMenuOpt,
) {
  let tippy: Instance | undefined = undefined

  const tippyOptions: Partial<Props> = {
    hideOnClick: true,
    onMount(instance) {
      tippy = instance
    }
  }

  const onTapCopy = () => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      liuApi.copyToClipboard(text)
    }
    tippy?.hide()
  }

  const onTapSearchIn = () => {
    tippy?.hide()
  }

  const onTapSearchOut = () => {
    tippy?.hide()
  }

  return {
    tippyOptions,
    onTapCopy,
    onTapSearchIn,
    onTapSearchOut,
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