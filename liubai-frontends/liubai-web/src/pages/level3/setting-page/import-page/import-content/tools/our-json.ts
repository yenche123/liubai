import { ImportedAtom } from "./types";
import valTool from "~/utils/basic/val-tool";
import type { LiuExportContentJSON } from "~/types/other/types-export"
import JSZip from "jszip"

export async function parseOurJson(atom: ImportedAtom) {
  const { cardJSON, dateStr, assets } = atom
  if(!cardJSON || !dateStr) return

  const jsonStr = await cardJSON.async("text")
  const d = valTool.strToObj<LiuExportContentJSON>(jsonStr)
  if(!d._id || !d.spaceId || !d.spaceType || !d.infoType) return





}


export async function parseAssets(assets?: JSZip.JSZipObject[]) {
  if(!assets) return []
  
}

