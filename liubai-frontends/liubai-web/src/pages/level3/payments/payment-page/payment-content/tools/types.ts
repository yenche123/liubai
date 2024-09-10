import type { Res_OrderData } from "~/requests/req-types";
import type { PageState } from "~/types/types-atom";

export interface PcData {
  state: PageState
  order_id?: string
  od?: Res_OrderData
  wx_gzh_openid?: string
}