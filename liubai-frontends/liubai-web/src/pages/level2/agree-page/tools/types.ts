import type { PageState } from "~/types/types-atom";
import { SyncOperateAPI } from "~/types/types-cloud";

export interface ApData {
  pageState: PageState
  chatId?: string
  contentId?: string
  contentType: SyncOperateAPI.ContentType
}