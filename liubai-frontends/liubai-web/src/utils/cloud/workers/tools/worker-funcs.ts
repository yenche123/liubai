import time from "~/utils/basic/time";
import type { MainToChildMessage } from "../../tools/types";
import workerReq from "./worker-req";

export function initWorker(msg: MainToChildMessage) {
  time.setDiff(msg.timeDiff, true)
  workerReq.init(msg)
}