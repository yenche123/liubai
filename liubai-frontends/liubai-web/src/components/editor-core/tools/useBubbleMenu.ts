import { isTextSelection } from "@tiptap/core"

interface ShowShowProps {
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
}

export function useBubbleMenu(opt: BubbleMenuOpt) {

  const shouldShow = (props: ShowShowProps): boolean => {

    const { state, from, to, view } = props
    const { doc, selection } = state
    const { empty } = selection

    const isEmptyTextBlock = !doc.textBetween(from, to).length
      && isTextSelection(state.selection)

    if(empty || isEmptyTextBlock) return false

    return true
  }

  const tippyOptions: any = {
    // hideOnClick: opt.editMode ? 'toggle' : true
    hideOnClick: true
  }

  return { shouldShow, tippyOptions }
}