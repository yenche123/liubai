
export type CbcLang = string | null

export interface CbcTextNode {
  text: string
  [otherKey: string]: string
}

export interface CbcFragment {
  content: CbcTextNode[]
  size: number
}