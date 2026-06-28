

export interface NaviBarProps {
  title?: string
  titleKey?: string
  placeholderKey?: string
  showAdd: boolean
  confirmKey?: string
  showViewToggle?: boolean
  viewMode?: string
}

export interface NaviBarEmit {
  (evt: "tapadd"): void
  (evt: "tapconfirm"): void
  (evt: "toggleview"): void
}

export const naviBarProps = {
  title: {
    type: String,
  },
  titleKey: {
    type: String,
  },
  placeholderKey: {
    type: String,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  confirmKey: {
    type: String,
  },
  showViewToggle: {
    type: Boolean,
    default: false,
  },
  viewMode: {
    type: String,
    default: "list",
  },
}
