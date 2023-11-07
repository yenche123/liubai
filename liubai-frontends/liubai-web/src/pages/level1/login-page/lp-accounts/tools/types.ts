import type { MemberShow } from "~/types/types-content"

export interface LpaProps {
  accounts: MemberShow[]
}

export interface LpaEmit {
  (evt: "confirm", index: number): void
}

export interface LpaData {
  selectedIndex: number
}