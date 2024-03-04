import { getHelpTip } from "./help-tip";
import { getDayNames } from "./locale-util";
import { 
  getDefaultDate, 
  areTheDatesEqual,
  showBasicTime,
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
  recycleURL,
  revokeObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  constraintWidthHeight,
} from "./file-util"
import {
  toRawData,
  getRawList,
  unToRefs,
} from "./vue-util"
import {
  colorToShow,
  colorToStorage,
  canKeyUpDown,
  getDefaultRouteQuery,
  needToOpenViceView,
  canTap,
  calibrateSidebarWidth,
  getMainViewCriticalValue,
  lightFireworks,
  isInAPopUp,
  waitAFrame,
} from "./custom-util"
import openUtil from "./open-util"
import {
  makeBoxScrollToShowChild,
  getIndicatorLeftAndWidth,
} from "./element-util"
import trimUtil from "./trim-util"
import viewUtil from "./view-util";
import checkUtil from "./check-util";
import cryptoUtil from "./crypto-util"

export default {
  getHelpTip,
  getDayNames,
  getDefaultDate,
  areTheDatesEqual,
  showBasicTime,
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
  recycleURL,
  revokeObjURLs,
  getArrayFromFileList,
  getOnlyImageFiles,
  getNotImageFiles,
  constraintWidthHeight,
  toRawData,
  getRawList,
  unToRefs,
  colorToShow,
  colorToStorage,
  canKeyUpDown,
  getDefaultRouteQuery,
  needToOpenViceView,
  makeBoxScrollToShowChild,
  getIndicatorLeftAndWidth,
  canTap,
  calibrateSidebarWidth,
  getMainViewCriticalValue,
  lightFireworks,
  isInAPopUp,
  waitAFrame,
  open: openUtil,
  trim: trimUtil,
  view: viewUtil,
  check: checkUtil,
  crypto: cryptoUtil,
}