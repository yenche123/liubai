import { usePrefix } from "~/hooks/useCommon";
import liuEnv from "~/utils/liu-env";

export function useConnectContent() {
  const { prefix } = usePrefix()
  const _env = liuEnv.getEnv()

  return {
    prefix,
    _env,
  }
}