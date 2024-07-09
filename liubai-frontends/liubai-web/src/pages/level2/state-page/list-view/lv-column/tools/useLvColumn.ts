import { inject, reactive } from "vue";
import type { LvcData } from "./types";
import { deviceChaKey } from "~/utils/provide-keys";
import { type KbListEmits } from "../../../tools/types"

export function useLvColumn(emit: KbListEmits) {

  const cha = inject(deviceChaKey)
  const isMobile = cha?.isMobile ?? false

  const lvcData = reactive<LvcData>({
    distance: isMobile ? 0 : 5,
    pressDelay: isMobile ? 250 : 0,
  })

  return {
    lvcData,
  }
}