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
  getRemindMenu,
  getLiuDate,
} from "./date-util";
import {
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  createURLsFromStore,
  revokeObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  constraintWidthHeight,
} from "./file-util"
import {
  toRawData,
  getRawList
} from "./vue-util"
import {
  colorToShow,
  colorToStorage,
  canKeyUpDown,
  getDefaultRouteQuery,
  needToOpenViceView,
  canTap,
  calibrateSidebarWidth,
} from "./custom-util"
import openUtil from "./open-util"
import {
  isChildElementVisible
} from "./element-util"

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
  getRemindMenu,
  getLiuDate,
  getAcceptImgTypesString,
  getAcceptImgTypesArray,
  createObjURLs,
  createURLsFromStore,
  revokeObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  constraintWidthHeight,
  toRawData,
  getRawList,
  colorToShow,
  colorToStorage,
  canKeyUpDown,
  getDefaultRouteQuery,
  needToOpenViceView,
  isChildElementVisible,
  canTap,
  calibrateSidebarWidth,
  open: openUtil,
}