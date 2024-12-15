

export interface MainViewProps {
  enableDropFiles: boolean
  disablePanels: boolean
}

export const mainViewProps = {
  enableDropFiles: {
    type: Boolean,
    default: false
  },
  disablePanels: {
    type: Boolean,
    default: false,
  }
}

export interface MainViewEmits {
  (evt: "tapmainview"): void
}