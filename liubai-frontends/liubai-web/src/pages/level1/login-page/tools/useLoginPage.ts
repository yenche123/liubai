import { reactive } from "vue";
import type { LpData } from "./types";

export function useLoginPage() {

  const lpData = reactive<LpData>({
    view: "main",
  })

  return {
    lpData
  }
}