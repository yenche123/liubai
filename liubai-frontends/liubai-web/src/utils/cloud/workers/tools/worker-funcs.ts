import time from "~/utils/basic/time";
import type { MainToChildMessage } from "../../tools/types";

export function initWorker(msg: MainToChildMessage) {
  time.setDiff(msg.timeDiff)
}