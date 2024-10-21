import { useMyProfile, usePrefix } from "~/hooks/useCommon";

export function useMineContent() {
  const { myProfile, isPremium } = useMyProfile()
  const { prefix } = usePrefix()

  return {
    myProfile,
    isPremium,
    prefix,
  }
}