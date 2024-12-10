
export interface CopyButtonProps {
  textToCopy?: string
  textToShow?: string
  textAfterCopy?: string
}

export const copyButtonProps = {
  textToCopy: {
    type: String,
  },
  textToShow: {
    type: String,
    default: "戳我复制👈",
  },
  textAfterCopy: {
    type: String,
  }
}