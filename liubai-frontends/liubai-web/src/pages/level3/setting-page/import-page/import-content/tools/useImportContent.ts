import { ref } from "vue"
import type { Ref } from "vue"
import liuUtil from "~/utils/liu-util"
import JSZip from "jszip"
import cui from "~/components/custom-ui"
import type { 
  ImportedAtom,
  ImportedAtom2,
} from "./types"
import valTool from "~/utils/basic/val-tool"
import type { LiuExportContentJSON } from "~/types/other/types-export"

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

  return {
    list,
    oursFileEl,
    onOursFileChange,
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
      console.log("没有匹配到！！")
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

  console.log("看一下整理过的动态结构: ")
  console.log(atoms)

  // 没有任何符合的格式时
  if(atoms.length < 1) {
    cui.showModal({ title_key: "tip.tip", content_key: "import.t2" })
    return
  }

  parseAtoms(atoms, ctx)
}

async function parseAtoms(
  atoms: ImportedAtom[],
  ctx: IcCtx,
) {

  console.time("start to parse")
  for(let i=0; i<atoms.length; i++) {
    const v = atoms[i]
    const { cardJSON, dateStr } = v
    if(!cardJSON || !dateStr) continue
    const jsonStr = await cardJSON.async("text")

    const jsonData = valTool.strToObj<LiuExportContentJSON>(jsonStr)

    if(i < 1) {
      console.log("jsonStr:")
      console.log(jsonStr)
    }
  }

  console.timeEnd("start to parse")

}
