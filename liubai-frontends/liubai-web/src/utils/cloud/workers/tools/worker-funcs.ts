import time from "~/utils/basic/time";
import type { MainToChildMessage } from "../../tools/types";
import workerReq from "./worker-req";
import { db } from "~/utils/db"

export async function initWorker(msg: MainToChildMessage) {
  time.setDiff(msg.timeDiff, true)
  workerReq.init(msg)

  try {
    await db.open()
  }
  catch(err) {
    console.warn("initWorker error")
    console.log(err)
  }
}

export function endWorker() {
  try {
    db.close()
  }
  catch(err) {
    console.warn("endWorker error")
    console.log(err)
  }
}

db.on("versionchange", (e) => {
  console.log("db versionchange in worker-funcs")
  db.close()
})