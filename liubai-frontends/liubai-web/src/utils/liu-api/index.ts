import characteristic from "./characteristic"
import device from "./device"
import storage from "./storage"
import basic from "./basic"
import { share, canShare } from "./share"
import {
  getSelectionText
} from "./selection"
import liuMedia from "./media"
import liuPermission from "./permission"

export default {
  copyToClipboard: device.copyToClipboard,
  vibrate: device.vibrate,
  getBattery: device.getBattery,
  getThemeFromSystem: device.getThemeFromSystem,
  getLanguageFromSystem: device.getLanguageFromSystem,
  setAppBadge: device.setAppBadge,
  clearAppBadge: device.clearAppBadge,
  getStorageSync: storage.getStorageSync,
  setStorageSync: storage.setStorageSync,
  removeStorageSync: storage.removeStorageSync,
  clearStorageSync: storage.clearStorageSync,
  getCharacteristic: characteristic.getCharacteristic,
  requestAnimationFrame: basic.requestAnimationFrame,
  eventTargetIsSomeTag: basic.eventTargetIsSomeTag,
  encode_URI_component: basic.encode_URI_component,
  decode_URI_component: basic.decode_URI_component,
  share,
  canShare,
  getSelectionText,
  enumerateDevices: liuMedia.enumerateDevices,
  getUserMedia: liuMedia.getUserMedia,
  getDisplayMedia: liuMedia.getDisplayMedia,
  getSupportedConstraints: liuMedia.getSupportedConstraints,
  permissionsQuery: liuPermission.permissionsQuery,
}