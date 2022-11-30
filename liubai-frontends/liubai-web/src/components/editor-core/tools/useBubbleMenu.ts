import { isTextSelection } from "@tiptap/core"
import { ShallowRef } from "vue"
import type { TipTapEditor } from "../../../types/types-editor"
import liuApi from "../../../utils/liu-api"
import { Instance, Props } from 'tippy.js'

interface ShouldShowProps {
  state: {
    doc: any
    selection: {
      empty: boolean
    }
  }
  view: any
  from: number
  to: number
}

interface BubbleMenuOpt {
  editMode: boolean
  editor: ShallowRef<TipTapEditor | undefined>
}

export function useBubbleMenu(opt: BubbleMenuOpt) {
  const editorRef = opt.editor

  const shouldShow = (props: ShouldShowProps): boolean => {

    const { state, from, to, view } = props
    const { doc, selection } = state
    const { empty } = selection

    const isEmptyTextBlock = !doc.textBetween(from, to).length
      && isTextSelection(state.selection)

    if(empty || isEmptyTextBlock) return false

    return true
  }

  let tippy: Instance | undefined = undefined

  const tippyOptions: Partial<Props> = {
    // hideOnClick: opt.editMode ? 'toggle' : true
    hideOnClick: true,
    interactive: true,
    onMount(instance) {
      tippy = instance
    }
  }

  const _getSelectionText = (editor: TipTapEditor) => {
    const { state } = editor
    const { doc, selection } = state
    const { from, to } = selection
    const str = doc.textBetween(from, to)
    return str
  }

  const onTapCopy = () => {
    const editor = editorRef.value
    if(!editor) return
    const text = _getSelectionText(editor)
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
    shouldShow, 
    tippyOptions,
    onTapCopy,
    onTapSearchIn,
    onTapSearchOut,
  }
}