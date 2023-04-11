import type { 
  ImportedAtom,
  ImportedAsset,
} from "./types";
import type {
  LiuFileStore,
  LiuImageStore
} from "~/types";
import valTool from "~/utils/basic/val-tool";
import type { LiuExportContentJSON } from "~/types/other/types-export"
import JSZip from "jszip"

export async function parseOurJson(atom: ImportedAtom) {
  const { cardJSON, dateStr, assets } = atom
  if(!cardJSON || !dateStr) return

  const jsonStr = await cardJSON.async("text")
  const d = valTool.strToObj<LiuExportContentJSON>(jsonStr)
  if(!d._id || !d.spaceId || !d.spaceType || !d.infoType) return

  let liuAssets = await parseAssets(dateStr, assets)
  const { images, files } = getImagesAndFiles(d, liuAssets)

}

// 把 zip 里的 assets 转为 { name, arrayBuffer }
async function parseAssets(
  dateStr: string,
  assets?: JSZip.JSZipObject[]
) {
  if(!assets) return []
  const prefix = `${dateStr}assets/`
  const preLen = prefix.length

  let list: ImportedAsset[] = []
  for(let i=0; i<assets.length; i++) {
    const v = assets[i]
    let idx = v.name.indexOf(prefix)
    if(idx < 0) continue
    const name = v.name.substring(idx + preLen)
    const res = await v.async("arraybuffer")
    list.push({ name, arrayBuffer: res })
  }
  
  return list
}

// 把 liuAssets 分别转为 images / files
function getImagesAndFiles(
  d: LiuExportContentJSON,
  liuAssets: ImportedAsset[],
) {
  const images: LiuImageStore[] = []
  const files: LiuFileStore[] = []
  
  if(d.images?.length) {
    for(let i=0; i<d.images.length; i++) {
      const v1 = d.images[i]
      const v2 = liuAssets.find(v3 => v1.name === v3.name)
      if(!v2) continue
      const img: LiuImageStore = {
        ...v1,
        arrayBuffer: v2.arrayBuffer,
      }
      images.push(img)
    }
  }


  if(d.files?.length) {
    for(let i=0; i<d.files.length; i++) {
      const v1 = d.files[i]
      const v2 = liuAssets.find(v3 => v1.name === v3.name)
      if(!v2) continue
      const f: LiuFileStore = {
        ...v1,
        arrayBuffer: v2.arrayBuffer,
      }
      files.push(f)
    }
  }

  return { images, files }
}

