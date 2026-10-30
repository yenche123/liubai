import { Selection, type EditorState } from "@tiptap/pm/state"

export function createHighlightRefresh(state: EditorState, pos: number) {
  const node = state.doc.nodeAt(pos)
  if (node?.type.name !== "codeBlock") return

  // Lowlight needs a document change to rebuild its decorations. Keep exact
  // positions while the replacement has the same size; if a future replacement
  // changes the size, fall back to ProseMirror's mapped selection.
  const tr = state.tr.replaceWith(pos, pos + node.nodeSize, node.copy(node.content))
  tr.setMeta("addToHistory", false)
  try {
    tr.setSelection(Selection.fromJSON(tr.doc, state.selection.toJSON()))
  }
  catch {
    tr.setSelection(state.selection.map(tr.doc, tr.mapping))
  }
  return tr
}
