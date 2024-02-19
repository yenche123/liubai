
import type { 
  Res_UserSettings_Enter, 
  Res_UserSettings_Latest,
} from "~/requests/req-types";
import localCache from "~/utils/system/local-cache";

export function afterGettingUserData(
  d: Res_UserSettings_Enter | Res_UserSettings_Latest,
) {

  console.log("afterGettingUserData.......")
  console.log(d)
  console.log(" ")
  const {
    local_id,
    theme,
    language,
  } = localCache.getPreference()
  if(!local_id) return false

  // 1. update theme & language
  if(theme !== d.theme) {
    localCache.setPreference("theme", d.theme)
  }
  if(language !== d.language) {
    localCache.setPreference("language", d.language)
  }




  

  
  
}