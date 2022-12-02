
import type { TipTapEditor } from '../../../../../../types/types-editor';
import liuApi from "../../../../../../utils/liu-api"
import type { Instance, Props } from 'tippy.js'
import { ref } from 'vue';
import valTool from '../../../../../../utils/basic/val-tool';
import cui from '../../../../../custom-ui';


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

  const _toCloseTippy = async (idx: number) => {
    selectedIndex.value = idx
    await valTool.waitMilli(500)
    selectedIndex.value = -1
    tippy?.hide()
  }

  const onTapCopy = () => {
    const text = _getSelectionText(opt.editor)
    if(text) {
      liuApi.copyToClipboard(text)
      cui.showSnackBar({ text_key: "common.copied" })
    }
    _toCloseTippy(0)
  }

  const onTapSearchIn = () => {
    _toCloseTippy(1)
  }

  const onTapSearchOut = () => {
    _toCloseTippy(2)
  }

  return {
    selectedIndex,
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