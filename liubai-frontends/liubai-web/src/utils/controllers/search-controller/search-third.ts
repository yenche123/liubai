import type { ScThirdPartyAtom, SearchOpt } from "./types";

export function searchThird(param: SearchOpt) {
  if(param.mode === "select_thread") return []
  let list: ScThirdPartyAtom[] = [
    {
      atomId: "bing"
    },
    {
      atomId: "xhs",
    },
    {
      atomId: "github",
    }
  ]
  return list
}