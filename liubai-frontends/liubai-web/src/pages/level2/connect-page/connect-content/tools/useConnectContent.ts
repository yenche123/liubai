import { usePrefix } from "~/hooks/useCommon";

export function useConnectContent() {
  const { prefix } = usePrefix()

  return {
    prefix,
  }
}