// some requests shared by different pages or components
import APIs from "../APIs"
import liuReq from "../liu-req"
import type { 
  Res_PO_GetOrder,
} from "../req-types"

export async function fetchOrder(
  order_id: string,
) {
  const url = APIs.PAYMENT_ORDER
  const w3 = {
    operateType: "get_order",
    order_id,
  }
  const res3 = await liuReq.request<Res_PO_GetOrder>(url, w3)
  return res3
}


