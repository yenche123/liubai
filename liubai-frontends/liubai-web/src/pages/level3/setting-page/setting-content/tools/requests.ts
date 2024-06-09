import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { LocalTheme } from "~/types/types-atom";
import type { LocalLocale } from "~/types/types-locale";


export async function fetchUserSet(
  theme?: LocalTheme,
  language?: LocalLocale,
) {
  const url = APIs.USER_SET
  const param = {
    operateType: "set",
    theme, 
    language,
  }
  const res = await liuReq.request(url, param)
  return res
}