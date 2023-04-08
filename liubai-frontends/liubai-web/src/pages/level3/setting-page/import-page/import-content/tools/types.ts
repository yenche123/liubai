import JSZip from "jszip"

export interface ImportedAtom {
  dateStr?: string
  cardJSON?: JSZip.JSZipObject
  assets?: JSZip.JSZipObject[]
}