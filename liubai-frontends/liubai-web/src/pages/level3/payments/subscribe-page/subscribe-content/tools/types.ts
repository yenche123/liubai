import type { PageState } from "~/types/types-atom";
import type { Res_SubPlan_Info } from "~/requests/req-types";


export interface ScEmits {
  (evt: "statechanged", state: PageState): void
}

export interface ScData {
  state: PageState
  initStamp: number
  stripe_portal_url?: string
  subPlanInfo?: Res_SubPlan_Info
  price_1?: string    // Integral part of price
  price_2?: string    // Decimal part of price
  isLifelong?: boolean
  autoRecharge?: boolean
  expireStr?: string
  showRefundBtn?: boolean
}