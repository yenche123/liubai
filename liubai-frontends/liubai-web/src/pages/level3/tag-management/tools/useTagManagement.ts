import { reactive, watch } from "vue";
import { type TmData } from "./types";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";

export function useTagManagement() {

  const wStore = useWorkspaceStore()
  const { spaceType, spaceId } = storeToRefs(wStore)

  const tmData = reactive<TmData>({
    toPath: "/tag/",
  })

  watch(spaceType, (newV) => {
    let _path = "/tag/"
    if(newV === "TEAM") {
      _path = `/w/${spaceId.value}/tag/`
    }
    tmData.toPath = _path
  }, { immediate: true })


  return {
    tmData,
  }
}