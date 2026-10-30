import SearchWorker from "./worker?worker"
import { db } from "~/utils/db"
import valTool from "~/utils/basic/val-tool";
import type { ContentLocalTable } from "~/types/types-table";
import type { SearchProvider } from "../types";
import type { SearchOpt } from "~/utils/controllers/search-controller/types";
import { getSpaceId } from "~/utils/controllers/search-controller/util";
import type {
  SearchIndexDoc,
  SearchSyncPayload,
  SearchWorkerAction,
  SearchWorkerRequest,
  SearchWorkerRequestMap,
  SearchWorkerResponse,
} from "./types";

interface PendingReq {
  resolve: (value: any) => void
  reject: (reason?: unknown) => void
}

const LOCAL_WORKER_TIMEOUT = 150

class LocalWorkerSearchProvider implements SearchProvider {

  private worker: Worker | undefined
  private hasInit = false
  private hasStartedWorker = false
  private hasHooks = false
  private isBroken = false
  private requestMap = new Map<string, PendingReq>()
  private initPromise: Promise<void> | undefined
  private syncPromise: Promise<void> | undefined
  private pendingUpserts = new Map<string, SearchIndexDoc>()
  private pendingRemovals = new Set<string>()
  private syncTimer: ReturnType<typeof setTimeout> | undefined

  init() {
    if (this.hasInit) return
    this.hasInit = true
    this.installHooks()

    // 延后在浏览器空闲时启动搜索 Worker，避免抢占首屏网络与 IndexedDB IO
    const startIdle = () => {
      const schedule = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200))
      schedule(() => {
        if (location.pathname.startsWith("/login")) return
        this.ensureWorkerInitialized()
      })
    }

    if (document.readyState === "complete") {
      setTimeout(startIdle, 1500)
    } else {
      window.addEventListener("load", () => setTimeout(startIdle, 1500), { once: true })
    }
  }

  private ensureWorkerInitialized() {
    if (this.hasStartedWorker) return this.initPromise
    this.hasStartedWorker = true
    this.ensureWorker()
    this.initPromise = this.call("init", undefined)
      .then(() => {
        console.log("[local-search/provider] init ready")
      })
      .catch(err => {
        this.isBroken = true
        console.warn("local search init failed")
        console.log(err)
      })
    return this.initPromise
  }

  async searchContents(opt: SearchOpt) {
    if (this.isBroken) return []

    const initPromise = this.ensureWorkerInitialized()
    if (initPromise) {
      await initPromise
    }

    if (this.isBroken) return []

    const text = opt.text?.trim()
    if (!text) return []

    const stamp1 = performance.now()
    await this.waitPendingSync()

    const payload = await this.call("search", {
      text,
      mode: opt.mode,
      spaceId: getSpaceId(),
      excludeThreads: opt.excludeThreads ?? [],
    })

    const ids = payload.ids
    if (ids.length < 1) {
      return []
    }

    const rows = await db.contents.where("_id").anyOf(ids).toArray()
    const rowMap = new Map(rows.map(v => [v._id, v]))
    const results: ContentLocalTable[] = []

    for (let i = 0; i < ids.length; i++) {
      const row = rowMap.get(ids[i])
      if (!row) continue
      results.push(row)
    }

    return results
  }

  async clear() {
    if (this.isBroken) return
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = undefined
    }
    this.pendingUpserts.clear()
    this.pendingRemovals.clear()
    if (!this.hasStartedWorker) return
    const initPromise = this.initPromise
    if (initPromise) {
      await initPromise
    }
    await this.call("clear", undefined)
  }

  private ensureWorker() {
    if (this.worker) return this.worker
    const worker = new SearchWorker()
    worker.onmessage = (evt: MessageEvent<SearchWorkerResponse<SearchWorkerAction>>) => {
      const data = evt.data
      const pending = this.requestMap.get(data.id)
      if (!pending) return
      this.requestMap.delete(data.id)

      if (data.ok) {
        pending.resolve(data.payload)
        return
      }

      pending.reject(new Error(data.error || "search worker failure"))
    }

    worker.onerror = (evt) => {
      console.warn("search worker crashed")
      console.log(evt)
      this.isBroken = true
      for (const pending of this.requestMap.values()) {
        pending.reject(new Error("search worker crashed"))
      }
      this.requestMap.clear()
    }

    this.worker = worker
    return worker
  }

  private async call<T extends SearchWorkerAction>(
    action: T,
    payload: SearchWorkerRequestMap[T],
  ) {
    if (this.isBroken) {
      throw new Error("search worker is unavailable")
    }

    const id = `${Date.now()}_${Math.random()}`
    const req: SearchWorkerRequest<T> = {
      id,
      action,
      payload: valTool.copyObject(payload),
    }

    const worker = this.ensureWorker()

    return new Promise<any>((resolve, reject) => {
      this.requestMap.set(id, { resolve, reject })
      worker.postMessage(req)
    })
  }

  private installHooks() {
    if (this.hasHooks) return
    this.hasHooks = true

    db.contents.hook("creating", (_key, obj) => {
      this.queueContent(obj)
    })

    db.contents.hook("updating", (mods, key, obj) => {
      const nextObj = this.mergeNextContent(key, obj, mods as Record<string, unknown>)
      this.queueContent(nextObj)
    })

    db.contents.hook("deleting", (key) => {
      if (typeof key !== "string") return
      this.queueRemove(key)
    })
  }

  private mergeNextContent(
    key: string | number,
    oldObj: ContentLocalTable,
    mods: Record<string, unknown>,
  ) {
    const nextObj = valTool.copyObject(oldObj)
    const keys = Object.keys(mods) as Array<keyof ContentLocalTable>
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      nextObj[k] = mods[k] as never
    }
    if (typeof key === "string") {
      nextObj._id = key
    }
    return nextObj
  }

  private queueContent(content: ContentLocalTable) {
    if (this.isBroken) return

    const doc = contentToSearchDoc(content)
    this.pendingRemovals.delete(doc.id)

    if (!isIndexableDoc(doc)) {
      this.pendingUpserts.delete(doc.id)
      this.pendingRemovals.add(doc.id)
      this.scheduleSync()
      return
    }

    this.pendingUpserts.set(doc.id, doc)
    this.scheduleSync()
  }

  private queueRemove(id: string) {
    if (this.isBroken) return
    this.pendingUpserts.delete(id)
    this.pendingRemovals.add(id)
    this.scheduleSync()
  }

  private scheduleSync() {
    if (this.syncTimer) return
    this.syncTimer = setTimeout(() => {
      this.syncTimer = undefined
      this.flushSync()
    }, LOCAL_WORKER_TIMEOUT)
  }

  private async flushSync() {
    if (this.isBroken) return
    if (this.pendingUpserts.size < 1 && this.pendingRemovals.size < 1) return

    const initPromise = this.ensureWorkerInitialized()
    if (initPromise) {
      await initPromise
    }
    if (this.isBroken) return

    const upsertCount = this.pendingUpserts.size
    const removalCount = this.pendingRemovals.size
    const payload: SearchSyncPayload = {
      upserts: Array.from(this.pendingUpserts.values()),
      removals: Array.from(this.pendingRemovals.values()),
    }
    this.pendingUpserts.clear()
    this.pendingRemovals.clear()

    this.syncPromise = this.call("sync", payload)
      .then(() => {
        console.log("[local-search/provider] sync done", {
          upserts: upsertCount,
          removals: removalCount,
        })
      })
      .catch(err => {
        this.isBroken = true
        console.warn("local search sync failed")
        console.log(err)
      })

    await this.syncPromise
  }

  private async waitPendingSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = undefined
      await this.flushSync()
    }
    if (this.syncPromise) {
      await this.syncPromise
    }
  }
}

function contentToSearchDoc(content: ContentLocalTable): SearchIndexDoc {
  return {
    id: content._id,
    title: content.search_title ?? "",
    body: content.search_other ?? "",
    spaceId: content.spaceId,
    infoType: content.infoType,
    oState: content.oState,
    editedStamp: content.editedStamp,
  }
}

function isIndexableDoc(doc: SearchIndexDoc) {
  if (doc.oState !== "OK") return false
  return Boolean(doc.title || doc.body)
}

const localWorkerSearchProvider = new LocalWorkerSearchProvider()

export default localWorkerSearchProvider
