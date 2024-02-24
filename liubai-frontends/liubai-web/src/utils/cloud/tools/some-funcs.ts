import { db } from "~/utils/db";
import localCache from "~/utils/system/local-cache";

/** put some useful funcs here to let CloudEventBus invoke */

export async function getUser() {
  const { local_id } = localCache.getPreference()
  if(!local_id) return
  const user = await db.users.get(local_id)
  return user
}