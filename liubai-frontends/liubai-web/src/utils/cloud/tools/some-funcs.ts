import time from "~/utils/basic/time";
import { db } from "~/utils/db";
import localCache from "~/utils/system/local-cache";
import type { MainToChildMessage } from "./types";
import liuApi from "~/utils/liu-api";

/** put some useful funcs here to let CloudEventBus invoke */

export async function getUser() {
  const { local_id } = localCache.getPreference()
  if(!local_id) return
  const user = await db.users.get(local_id)
  return user
}


export function getMainToChildMessage(
  event: string,
) {
  const { 
    local_id: userId, 
    token,
    serial,
    client_key,
  } = localCache.getPreference()
  const timeDiff = time.getDiff()
  const data: MainToChildMessage = {
    event,
    userId,
    timeDiff,
    token,
    serial,
    client_key,
    system_language: navigator.language,
    system_theme: liuApi.getThemeFromSystem(),
  }
  return data
}