import characteristic from "./characteristic"
import device from "./device"
import storage from "./storage"
import basic from "./basic"
import { share, canShare } from "./share"

export default {
  copyToClipboard: device.copyToClipboard,
  getStorageSync: storage.getStorageSync,
  setStorageSync: storage.setStorageSync,
  removeStorageSync: storage.removeStorageSync,
  clearStorageSync: storage.clearStorageSync,
  getCharacteristic: characteristic.getCharacteristic,
  requestAnimationFrame: basic.requestAnimationFrame,
  eventTargetIsSomeTag: basic.eventTargetIsSomeTag,
  share,
  canShare,
}