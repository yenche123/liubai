

export interface NaviBarProps {
  title?: string
  titleKey?: string
  placeholderKey?: string
  showMenu: boolean
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
  }
}