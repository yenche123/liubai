
import { useSystemStore } from "~/hooks/stores/useSystemStore";
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
  const { local_id: userId } = localCache.getPreference()
  if(!userId) return false

  // 1. update theme & language
  const systemStore = useSystemStore()
  systemStore.setTheme(d.theme)
  systemStore.setLanguage(d.language)




  

  
  
}