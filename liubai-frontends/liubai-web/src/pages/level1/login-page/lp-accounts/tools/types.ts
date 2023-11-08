import type { MemberShow } from "~/types/types-content"

export interface LpaProps {
  accounts: MemberShow[]
  isShown: boolean
}

export interface LpaEmit {
  (evt: "confirm", index: number): void
}

export interface LpaData {
  selectedIndex: number
}