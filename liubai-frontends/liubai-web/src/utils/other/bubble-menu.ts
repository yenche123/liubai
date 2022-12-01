import { isTextSelection } from "@tiptap/core"

export interface ShouldShowProps {
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

export function shouldShow(props: ShouldShowProps): boolean {

  const { state, from, to, view } = props
  const { doc, selection } = state
  const { empty } = selection

  const isEmptyTextBlock = !doc.textBetween(from, to).length
    && isTextSelection(state.selection)

  if(empty || isEmptyTextBlock) return false

  return true
}