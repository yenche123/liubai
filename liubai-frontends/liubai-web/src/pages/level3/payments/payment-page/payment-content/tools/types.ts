import type { Res_OrderData } from "~/requests/req-types";
import type { PageState } from "~/types/types-atom";

export interface PcData {
  state: PageState
  order_id?: string
  od?: Res_OrderData
  order_amount_txt?: string
  wx_gzh_openid?: string
}