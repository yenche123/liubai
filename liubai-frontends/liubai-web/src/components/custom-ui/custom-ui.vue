<script setup lang="ts">
import SnackBar from "./snack-bar/snack-bar.vue"
import CustomLoading from "./loading/custom-loading.vue"
import { defineLazyCustomUi, requestedCustomUi } from "./tools/lazy-custom-ui"
import { useCustomUiRoute } from "./tools/use-custom-ui-route"
import { useSearchShortcut } from "./tools/use-search-shortcut"

const CustomModal = defineLazyCustomUi("modal", () => import("./modal/custom-modal.vue"))
const TextEditor = defineLazyCustomUi("text-editor", () => import("./text-editor/text-editor.vue"))
const DatePicker = defineLazyCustomUi("date-picker", () => import("./date-picker/date-picker.vue"))
const PreviewImage = defineLazyCustomUi("preview-image", () => import("./preview-image/preview-image.vue"))
const HashtagEditor = defineLazyCustomUi("hashtag-editor", () => import("./hashtag-editor/hashtag-editor.vue"))
const ActionSheet = defineLazyCustomUi("action-sheet", () => import("./action-sheet/action-sheet.vue"))
const StateSelector = defineLazyCustomUi("state-selector", () => import("./state-selector/state-selector.vue"))
const StateEditor = defineLazyCustomUi("state-editor", () => import("./state-editor/state-editor.vue"))
const ShareView = defineLazyCustomUi("share-view", () => import("./share-view/share-view.vue"))
const ContentPanel = defineLazyCustomUi("content-panel", () => import("./content-panel/content-panel.vue"))
const CommentPopup = defineLazyCustomUi("comment-popup", () => import("./comment-popup/comment-popup.vue"))
const HashtagSelector = defineLazyCustomUi("hashtag-selector", () => import("./hashtag-selector/hashtag-selector.vue"))
const QrcodePopup = defineLazyCustomUi("qrcode-popup", () => import("./qrcode-popup/qrcode-popup.vue"))
const BindPopup = defineLazyCustomUi("bind-popup", () => import("./bind-popup/bind-popup.vue"))
const BrowseCode = defineLazyCustomUi("browse-code", () => import("./browse-code/browse-code.vue"))
const SearchEditor = defineLazyCustomUi("search-editor", () => import("./search-editor/search-editor.vue"))

useCustomUiRoute()
useSearchShortcut()
</script>

<template>
  <!-- Keep each popup mounted after first use, preserving route listeners and state. -->
  <CustomModal v-if="requestedCustomUi.modal" />
  <TextEditor v-if="requestedCustomUi['text-editor']" />
  <CustomLoading />
  <HashtagEditor v-if="requestedCustomUi['hashtag-editor']" />
  <HashtagSelector v-if="requestedCustomUi['hashtag-selector']" />
  <DatePicker v-if="requestedCustomUi['date-picker']" />
  <PreviewImage v-if="requestedCustomUi['preview-image']" />
  <ActionSheet v-if="requestedCustomUi['action-sheet']" />
  <SnackBar />
  <SearchEditor v-if="requestedCustomUi['search-editor']" />
  <StateSelector v-if="requestedCustomUi['state-selector']" />
  <StateEditor v-if="requestedCustomUi['state-editor']" />
  <ShareView v-if="requestedCustomUi['share-view']" />
  <ContentPanel v-if="requestedCustomUi['content-panel']" />
  <CommentPopup v-if="requestedCustomUi['comment-popup']" />
  <QrcodePopup v-if="requestedCustomUi['qrcode-popup']" />
  <BindPopup v-if="requestedCustomUi['bind-popup']" />
  <BrowseCode v-if="requestedCustomUi['browse-code']" />
</template>
