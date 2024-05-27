import liuEnv from "~/utils/liu-env";
import type { CommentDetailData } from "./types";
import { useSyncStore, type SyncStoreItem } from "~/hooks/stores/useSyncStore";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import type { CommentShow } from "~/types/types-content";


export function useIdsChanged(
  cdData: CommentDetailData,
) {

  const backend = liuEnv.hasBackend()
  if(!backend) return

  const syncStore = useSyncStore()
  
  const { comments, threads } = storeToRefs(syncStore)
  watch(comments, (newV) => {
    if(newV.length < 1) return
    handleComments(cdData, newV)
  })

  watch(threads, (newV) => {
    if(newV.length < 1) return
    handleThreads(cdData, newV)
  })
}

function handleComments(
  cdData: CommentDetailData,
  items: SyncStoreItem[],
) {

  const { 
    targetId, 
    targetComment,
    aboveList,
    belowList,
  } = cdData

  const _checkList = (
    list: CommentShow[],
    first_id: string,
    new_id: string,
  ) => {
    list.forEach(v => {
      if(v.first_id === first_id) {
        v._id = new_id
      }
      if(v.parentComment === first_id) {
        v.parentComment = new_id
      }
      if(v.replyToComment === first_id) {
        v.replyToComment = new_id
      }
    })
  }

  for(let i=0; i<items.length; i++) {
    const v = items[i]
    const { first_id, new_id } = v

    if(targetId === first_id) {
      cdData.targetId = new_id
    }

    if(targetComment && targetComment.first_id === first_id) {
      targetComment._id = new_id
    }

    _checkList(aboveList, first_id, new_id)
    _checkList(belowList, first_id, new_id)
  }

}

function handleThreads(
  cdData: CommentDetailData,
  items: SyncStoreItem[],
) {
  const {
    thread,
    targetComment,
    aboveList,
    belowList,
  } = cdData


  const _checkComment = (
    v: CommentShow,
    first_id: string,
    new_id: string,
  ) => {
    if(v.parentThread === first_id) {
      v.parentThread = new_id
    }
  }

  const _checkList = (
    list: CommentShow[],
    first_id: string,
    new_id: string,
  ) => {
    list.forEach(v => {
      _checkComment(v, first_id, new_id)
    })
  }

  for(let i=0; i<items.length; i++) {
    const v = items[i]
    const { first_id, new_id } = v

    if(thread && thread.first_id === first_id) {
      thread._id = new_id
    }

    if(targetComment) {
      _checkComment(targetComment, first_id, new_id)
    }

    _checkList(aboveList, first_id, new_id)
    _checkList(belowList, first_id, new_id)
  }
}

