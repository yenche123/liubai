import type { 
  TipTapEditorPropsHandlePaste,
  TipTapEditorView,
} from "~/types/types-editor"
import type { LinkPreview } from '~/types/types-atom'


/**
 * 主要作用:
 * 1. 将格式为 text/link-preview 的链接转为 markdown 格式
 * 2. 将长文（html）里的链接也转为 markdown 格式
 * 
 * @param view EditorView，为 ProseMirror 内部的编辑器视图类型
 * @param evt ClipboardEvent
 * @returns 返回 false | undefined，使用默认行为；返回 true，将阻止默认行为
 */
const handlePaste: TipTapEditorPropsHandlePaste = (view, evt) => {
  const clipboardData = evt.clipboardData
  if(!clipboardData) return false

  const cdTypes = clipboardData.types
  const hasLinkPreview = cdTypes.includes("text/link-preview")
  if(hasLinkPreview) return _handleLinkPreview(view, clipboardData)
}

function _handleLinkPreview(
  view: TipTapEditorView,
  clipboardData: DataTransfer,
) {
  const jsonTxt = clipboardData.getData("text/link-preview")

  let linkJson: LinkPreview
  try {
    linkJson = JSON.parse(jsonTxt)
  }
  catch(err) {
    return false
  }

  const title = linkJson.title
  const url = linkJson.url
  if(!title || !url) return false
  const linkText = `[${title}](${url})`

  const startPoi = view.state.selection.from
  const endPoi = view.state.selection.to
  const transaction = view.state.tr.insertText(linkText, startPoi, endPoi)
  view.dispatch(transaction)

  return true
}


export {
  handlePaste
}