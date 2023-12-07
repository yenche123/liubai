import type { MemberShow } from "~/types/types-content"

export interface LpaProps {
  accounts: MemberShow[]
  isShown: boolean
  isSelectingAccount: boolean
}

export interface LpaEmit {
  (evt: "confirm", index: number): void
}

export interface LpaData {
  selectedIndex: number
}