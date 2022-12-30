
export const getSelectionText = () => {
  const selection = window.getSelection()
  if(!selection) return ""
  const txt = selection.toString()
  return txt
}