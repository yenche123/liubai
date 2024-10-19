

export interface NaviBarProps {
  title?: string
  titleKey?: string
  placeholderKey?: string
  showMenu: boolean
  showAdd: boolean
}

export interface NaviBarEmit {
  (evt: "tapadd"): void
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
  showMenu: {
    type: Boolean,
    default: true,
  },
  showAdd: {
    type: Boolean,
    default: false,
  }
}
