import type { PageState } from "~/types/types-atom";


export interface ScData {
  state: PageState
  initStamp: number
  stripe_portal_url?: string
}