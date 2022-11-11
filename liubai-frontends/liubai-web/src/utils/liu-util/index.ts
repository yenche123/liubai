import { getEnv, getIfPurelyLocal } from "./env-status";
import { getHelpTip } from "./help-tip";
import { getDayNames } from "./locale-util";
import { 
  getDefaultDate, 
  areTheDatesEqual,
  showBasicDate,
} from "./date-util";
import {
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
} from "./file-util"

export default {
  getEnv,
  getIfPurelyLocal,
  getHelpTip,
  getDayNames,
  getDefaultDate,
  areTheDatesEqual,
  showBasicDate,
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
}