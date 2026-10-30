import { showLoading, hideLoading } from "./loading"
import { showSnackBar } from "./snack-bar"
import { reserveInputFocus } from "./tools/input-focus"

function withInputFocus<T>(selector: string, open: () => Promise<T>): Promise<T> {
  // Run before import(), while still inside the tap/keyboard gesture.
  const release = reserveInputFocus(selector)
  return open().finally(release)
}

export default {
  showLoading,
  hideLoading,
  showSnackBar,
  showModal: (...args: Parameters<typeof import("./modal/tools/useCustomModal").showModal>) =>
    import("./modal/tools/useCustomModal").then(m => m.showModal(...args)),
  showTextEditor: (...args: Parameters<typeof import("./text-editor/tools/useTextEditor").showTextEditor>) =>
    withInputFocus(".cui-text-editor-input", () => import("./text-editor/tools/useTextEditor").then(m => m.showTextEditor(...args))),
  showDatePicker: (...args: Parameters<typeof import("./date-picker").showDatePicker>) =>
    import("./date-picker").then(m => m.showDatePicker(...args)),
  previewImage: (...args: Parameters<typeof import("./preview-image").previewImage>) =>
    import("./preview-image").then(m => m.previewImage(...args)),
  showHashtagEditor: (...args: Parameters<typeof import("./hashtag-editor/tools/useHashtagEditor").showHashtagEditor>) =>
    withInputFocus(".hteb-input", () => import("./hashtag-editor/tools/useHashtagEditor").then(m => m.showHashtagEditor(...args))),
  showActionSheet: (...args: Parameters<typeof import("./action-sheet").showActionSheet>) =>
    import("./action-sheet").then(m => m.showActionSheet(...args)),
  showSearchEditor: (...args: Parameters<typeof import("./search-editor/tools/useSearchEditor").showSearchEditor>) =>
    withInputFocus(".se-input", () => import("./search-editor/tools/useSearchEditor").then(m => m.showSearchEditor(...args))),
  showStateSelector: (...args: Parameters<typeof import("./state-selector").showStateSelector>) =>
    import("./state-selector").then(m => m.showStateSelector(...args)),
  showStateEditor: (...args: Parameters<typeof import("./state-editor").showStateEditor>) =>
    import("./state-editor").then(m => m.showStateEditor(...args)),
  showShareView: (...args: Parameters<typeof import("./share-view/tools/useShareView").showShareView>) =>
    import("./share-view/tools/useShareView").then(m => m.showShareView(...args)),
  showContentPanel: (...args: Parameters<typeof import("./content-panel/tools/useContentPanel").showContentPanel>) =>
    import("./content-panel/tools/useContentPanel").then(m => m.showContentPanel(...args)),
  showCommentPopup: (...args: Parameters<typeof import("./comment-popup/tools/useCommentPopup").showCommentPopup>) =>
    import("./comment-popup/tools/useCommentPopup").then(m => m.showCommentPopup(...args)),
  showHashtagSelector: (...args: Parameters<typeof import("./hashtag-selector/tools/useHashtagSelector").showHashtagSelector>) =>
    import("./hashtag-selector/tools/useHashtagSelector").then(m => m.showHashtagSelector(...args)),
  showQRCodePopup: (...args: Parameters<typeof import("./qrcode-popup/tools/useQRCodePopup").showQRCodePopup>) =>
    import("./qrcode-popup/tools/useQRCodePopup").then(m => m.showQRCodePopup(...args)),
  showBindPopup: (...args: Parameters<typeof import("./bind-popup/tools/useBindPopup").showBindPopup>) =>
    import("./bind-popup/tools/useBindPopup").then(m => m.showBindPopup(...args)),
  browseCode: (...args: Parameters<typeof import("./browse-code/tools/useBrowseCode").browseCode>) =>
    import("./browse-code/tools/useBrowseCode").then(m => m.browseCode(...args)),
}
