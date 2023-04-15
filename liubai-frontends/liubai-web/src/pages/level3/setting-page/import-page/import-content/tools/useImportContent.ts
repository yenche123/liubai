import { ref } from "vue"
import type { Ref } from "vue"
import liuUtil from "~/utils/liu-util"
import JSZip from "jszip"
import cui from "~/components/custom-ui"
import type { 
  ImportedAtom,
  ImportedAtom2,
} from "./types"
import { parseOurJson } from "./our-json"
import checker from "~/utils/other/checker"
import valTool from "~/utils/basic/val-tool"

interface IcCtx {
  list: Ref<ImportedAtom2[]>
}

export function useImportContent() {

  const list = ref<ImportedAtom2[]>([])
  const oursFileEl = ref<HTMLInputElement | null>(null)
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

  const onTapConfirm = () => {

  }


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
  try {
    results = await JSZip.loadAsync(f)
  }
  catch(err) {
    console.warn("loadAsync err: ")
    console.log(err)
    cui.showModal({ title_key: "tip.tip", content_key: "import.t4" })
    return
  }

  const rStr = "^contents\\/\\d{4}\\-\\d{2}\\-\\d{2}\\s\\d{2}_\\d{2}_\\d{2}\\/"
  const reg = new RegExp(rStr)
  const regCardDir = new RegExp(rStr + "$")
  const regCardJSON = new RegExp(rStr + "card\\.json$")
  const regAssets = new RegExp(rStr + "assets\\/")

  let tmpAtom: ImportedAtom = {}
  let atoms: ImportedAtom[] = []

  results.forEach((relativePath, file) => {
    // 第二个参数 file 为 ZipObject 类型
    // 该类型有 async 方法，用来读取文件
    // 详情见: https://stuk.github.io/jszip/documentation/api_zipobject/async.html

    // console.log(relativePath)
    // console.log(file)
    // console.log(" ")

    // 1. 判断是否在 contents/YYYY-MM-DD/ 里头
    const isMatch = reg.test(relativePath)
    if(!isMatch) {
      return
    }

    // 2. 判断当前节点是否为 contents/YYYY-MM-DD/ 文件夹
    const isMatch2 = regCardDir.test(relativePath)
    if(isMatch2 && file.dir) {
      if(tmpAtom.dateStr && tmpAtom.cardJSON) {
        atoms.push(tmpAtom)
      }

      tmpAtom = {
        dateStr: relativePath
      }
      return
    }

    // 3. 判断当前节点是否为 card.json
    const isMatch3 = regCardJSON.test(relativePath)
    if(isMatch3 && !file.dir) {
      tmpAtom.cardJSON = file
      return
    }

    // 4. 判断当前节点是否为 assets 里的资源
    const isMatch4 = regAssets.test(relativePath)
    if(isMatch4 && !file.dir) {
      if(!tmpAtom.assets) tmpAtom.assets = []
      tmpAtom.assets.push(file)
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
