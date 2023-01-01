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
  getRemindMeStrAfterPost,
  getCountDownStr,
  getEditedStr,
} from "./date-util";
import {
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  revokeObjURLs,
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
  getRemindMeStrAfterPost,
  getCountDownStr,
  getEditedStr,
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  revokeObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  toRawData,
  getRawList,
}