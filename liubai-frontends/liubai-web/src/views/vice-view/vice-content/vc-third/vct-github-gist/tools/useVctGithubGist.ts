import type { VctCommonProps } from "../../tools/types"

export function useVctGithubGist(
  props: VctCommonProps,
) {
  const _getScript = () => {
    const link = props.link
    if(!link) return ""
    const tmp = link.substring(link.length - 3)
    if(tmp === ".js") return link
    return link + ".js"
  }

  const gistUrl = _getScript()
  if(!gistUrl) return {}

  const gistSrcDoc = `<script src="${gistUrl}"></script>`

  return { gistSrcDoc }
}