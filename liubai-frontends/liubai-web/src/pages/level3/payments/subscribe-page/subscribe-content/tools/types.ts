import type { PageState } from "~/types/types-atom";
import type { Res_SubPlan_Info } from "~/requests/req-types";

export interface ScData {
  state: PageState
  initStamp: number
  stripe_portal_url?: string
  subPlanInfo?: Res_SubPlan_Info
  isLifelong?: boolean
  autoRecharge?: boolean
  expireStr?: string
}