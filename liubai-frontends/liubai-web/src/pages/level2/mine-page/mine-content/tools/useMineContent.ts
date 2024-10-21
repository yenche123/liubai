import { useMyProfile, usePrefix } from "~/hooks/useCommon";
import { useLayoutStore } from "~/views/useLayoutStore";

export function useMineContent() {
  const { myProfile, isPremium } = useMyProfile()
  const { prefix } = usePrefix()
  const layoutStore = useLayoutStore()

  return {
    myProfile,
    isPremium,
    prefix,
    layoutStore,
  }
}