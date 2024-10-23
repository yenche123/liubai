import { useMyProfile, usePrefix } from "~/hooks/useCommon";
import liuEnv from "~/utils/liu-env";

export function useMineContent() {
  const { myProfile, isPremium } = useMyProfile()
  const { prefix } = usePrefix()
  const { CONNECTORS } = liuEnv.getEnv()

  return {
    myProfile,
    isPremium,
    prefix,
    CONNECTORS,
  }
}