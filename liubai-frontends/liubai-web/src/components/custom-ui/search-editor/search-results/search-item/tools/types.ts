import type { 
  ScContentAtom, 
  ScRecentAtom, 
  ScThirdPartyAtom,
} from "~/utils/controllers/search-controller/types";
import type { SearchListType } from "../../../tools/types";


export interface SiProps {
  siType: SearchListType
  atomId: string
  indicator: string
  contentAtom?: ScContentAtom
  recentAtom?: ScRecentAtom
  thirdAtom?: ScThirdPartyAtom
  inputTxt?: string
}

