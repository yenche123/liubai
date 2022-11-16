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
  console.log("loadList 结果.......")
  console.log(results)
  console.log(" ")
}