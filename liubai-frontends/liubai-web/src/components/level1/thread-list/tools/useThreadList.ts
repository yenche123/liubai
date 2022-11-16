import { ref } from "vue"
import { ThreadShow } from "../../../../types/types-content"
import type { Ref } from "vue"
import threadController from "../../../../utils/controllers/thread-controller/thread-controller"

interface TlProps {
  viewType: string
}

export function useThreadList(props: TlProps) {

  const list = ref<ThreadShow[]>([])


  loadList(list)

  return { list }
}

async function loadList(
  list: Ref<ThreadShow[]>,
  reload: boolean = false
) {

  const results = await threadController.getList()
  console.log("results 结果.......")
  console.log(results)
  console.log(" ")
  
  const length = results.length
  if(length < 1) return
  const lastOne = results[length - 1]
  const results2 = await threadController.getList({ lastCreatedStamp: lastOne.createdStamp })
  console.log("results2 结果.......")
  console.log(results2)
  console.log(" ")



}