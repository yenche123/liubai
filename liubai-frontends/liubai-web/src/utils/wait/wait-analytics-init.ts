import valTool from "~/utils/basic/val-tool";
import { waitWindowLoaded } from "./wait-window-loaded";
import time from "../basic/time";

export async function waitAnalyticsInit() {
  const stamp1 = time.getTime()
  const res1 = await waitWindowLoaded()
  if(time.isWithinMillis(stamp1, 10)) {
    return res1
  }
  await valTool.waitMilli(300)
  return res1
}