import { onDeactivated, ref, useTemplateRef } from "vue"
import type { Ref } from "vue"
import liuUtil from "~/utils/liu-util"
import type JSZip from "jszip"
import cui from "~/components/custom-ui"
import type { 
  LiuJSZip,
  ImportedAtom,
  ImportedAtom2,
} from "./types"
import { parseOurJson } from "./our-json"
import checker from "~/utils/other/checker"
import valTool from "~/utils/basic/val-tool"
import { loadIntoDB } from "./load-into-db"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import cfg from "~/config"
import { getJSZip } from "../../../tools/get-jszip"

interface IcCtx {
  list: Ref<ImportedAtom2[]>
}

export function useImportContent() {

  const { router } = useRouteAndLiuRouter()
  const list = ref<ImportedAtom2[]>([])
  const oursFileEl = useTemplateRef<HTMLInputElement>("oursFileEl")
  const ctx: IcCtx = {
    list,
  }

  const onOursFileChange = () => {
    const el = oursFileEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    const firstFile = files[0]
    if(!firstFile) return
    loadZip(firstFile, ctx)
  }

  const onTapClear = (index: number) => {
    const item = list.value[index]
    if(!item) return
    list.value.splice(index, 1)
  }

  const onTapCancel = () => {
    list.value = []

    // 清除 el 上的 files
    const el = oursFileEl.value
    if(!el) return
    el.value = ''
  }

  const onTapConfirm = async () => {
    const res = await loadIntoDB(list.value)
    if(res) {
      list.value = []
      router.naviBack()
    }
  }

  onDeactivated(() => {
    onTapCancel()
  })


  return {
    list,
    oursFileEl,
    onOursFileChange,
    onTapClear,
    onTapCancel,
    onTapConfirm,
  }
}

async function loadZip(f: File, ctx: IcCtx) {

  let results: JSZip
  const TheJSZip = await getJSZip()
  try {
    results = await TheJSZip.loadAsync(f)
  }
  catch(err) {
    console.warn("loadAsync err: ")
    console.log(err)
    cui.showModal({ title_key: "tip.tip", content_key: "import.t4" })
    return
  }

  const rStr = "contents\\/\\d{4}\\-\\d{2}\\-\\d{2}\\s\\d{2}_\\d{2}_\\d{2}\\/"
  const reg = new RegExp(rStr)
  const regCardJSON = new RegExp(rStr + "card\\.json$")
  const regAssets = new RegExp(rStr + "assets\\/")
  const regDate = /contents\/(\d{4}\-\d{2}\-\d{2}\s\d{2}_\d{2}_\d{2})\//

  let tmpAtom: ImportedAtom = {}
  let atoms: ImportedAtom[] = []

  let sortedResults: LiuJSZip[] = []
  results.forEach((relativePath, file) => {
    let obj: LiuJSZip = {
      relativePath,
      file
    }

    // 1. 判断是否在 contents/YYYY-MM-DD/ 里头
    const isMatch = reg.test(relativePath)
    if(!isMatch) {
      return
    }

    sortedResults.push(obj)
  })

  sortedResults.sort((v1, v2) => {
    const s1 = v1.relativePath
    const s2 = v2.relativePath
    if(s1 < s2) return 1
    if(s1 > s2) return -1
    return 0
  })


  const { max_export_num } = cfg
  sortedResults.forEach(v => {
    const s = v.relativePath
    const s2 = s.match(regDate)
    
    if(!s2) return
    const s3 = s2[1]
    if(!s3) return

    // 1. 判断 dateStr 是否不一致
    if(s3 !== tmpAtom.dateStr) {
      // 如果日期和 cardJSON 存在才添加
      if(tmpAtom.dateStr && tmpAtom.cardJSON) {
        // 并且每次导入有一个最大数的限制
        if(atoms.length < max_export_num) {
          atoms.push(tmpAtom)
        }
      }
      tmpAtom = {
        dateStr: s3
      }
    }

    // 2. 判断当前节点是否为 card.json
    const isMatch3 = regCardJSON.test(s)
    if(isMatch3 && !v.file.dir) {
      tmpAtom.cardJSON = v.file
      return
    }

    // 3. 判断当前节点是否为 assets 里的资源
    const isMatch4 = regAssets.test(s)
    if(isMatch4 && !v.file.dir) {
      if(!tmpAtom.assets) tmpAtom.assets = []
      tmpAtom.assets.push(v.file)
      return
    }
  })

  if(tmpAtom.dateStr && tmpAtom.cardJSON) {
    atoms.push(tmpAtom)
    tmpAtom = {}
  }

  // 没有任何符合的格式时
  if(atoms.length < 1) {
    cui.showModal({ title_key: "tip.tip", content_key: "import.t2", showCancel: false })
    return
  }

  parseAtoms(atoms, ctx)
}

async function parseAtoms(
  atoms: ImportedAtom[],
  ctx: IcCtx,
) {

  const myCtx = checker.getMyContext()
  if(!myCtx) return

  ctx.list.value = []

  cui.showLoading({ title_key: "common.processing" })

  console.time("start to parse")
  for(let i=0; i<atoms.length; i++) {
    const v = atoms[i]
    let item = await parseOurJson(v, myCtx)
    if(!item) continue

    // 去检查是否已经添加过了
    const id = item.id
    const existedItem = ctx.list.value.find(v2 => v2.id === id)
    if(existedItem) continue
    ctx.list.value.push(item)
  }

  console.timeEnd("start to parse")

  cui.hideLoading()

  console.log("看一下 copiedList: ")
  const copiedList = valTool.copyObject(ctx.list.value)
  console.log(copiedList)

}
