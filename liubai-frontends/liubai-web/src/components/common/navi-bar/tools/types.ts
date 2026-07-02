

export interface NaviBarProps {
  title?: string
  titleKey?: string
  placeholderKey?: string
  showAdd: boolean
  confirmKey?: string
}

export interface NaviBarEmit {
  (evt: "tapadd"): void
  (evt: "tapconfirm"): void
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
}
