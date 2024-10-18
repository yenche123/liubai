

export interface MainViewProps {
  enableDropFiles: boolean
}

export const mainViewProps = {
  enableDropFiles: {
    type: Boolean,
    default: false
  }
}

export interface MainViewEmits {
  (evt: "tapmainview"): void
}