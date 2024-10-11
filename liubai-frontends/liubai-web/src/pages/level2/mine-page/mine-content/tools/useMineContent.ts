import { useMyProfile } from "~/hooks/useCommon";

export function useMineContent() {
  const { myProfile, isPremium } = useMyProfile()

  return {
    myProfile,
    isPremium,
  }
}