

export interface AgreeBoxProps {
  shakingNum: number
  beCenter: boolean
}

export const agreeBoxProps = {
  shakingNum: {
    type: Number,
    default: 0,
  },
  beCenter: {
    type: Boolean,
    default: false,
  }
}