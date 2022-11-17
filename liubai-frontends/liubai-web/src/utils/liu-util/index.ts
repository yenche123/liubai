import { getEnv, getIfPurelyLocal } from "./env-status";
import { getHelpTip } from "./help-tip";
import { getDayNames } from "./locale-util";
import { 
  getDefaultDate, 
  areTheDatesEqual,
  showBasicDate,
  formatStamp,
  getLaterStamp,
  getEarlyStamp,
  getRemindMeStr,
} from "./date-util";
import {
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
} from "./file-util"
import {
  toRawData,
  getRawList
} from "./vue-util"

export default {
  getEnv,
  getIfPurelyLocal,
  getHelpTip,
  getDayNames,
  getDefaultDate,
  areTheDatesEqual,
  showBasicDate,
  formatStamp,
  getLaterStamp,
  getEarlyStamp,
  getRemindMeStr,
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  toRawData,
  getRawList,
}