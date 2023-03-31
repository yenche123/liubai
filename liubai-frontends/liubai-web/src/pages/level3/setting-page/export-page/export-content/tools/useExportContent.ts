import cui from "~/components/custom-ui"




export function useExportContent() {

  const _preAsk = async () => {
    const res1 = await cui.showModal({ 
      title_key: "tip.tip", 
      content_key: "export.take_time" 
    })
    if(res1.confirm) return true
    return false
  }

  const onTapMarkdown = async () => {
    const res = await _preAsk()
    if(!res) return
  }

  const onTapJSON = async () => {
    const res = await _preAsk()
    if(!res) return

  }


  return {
    onTapMarkdown,
    onTapJSON,
  }
}