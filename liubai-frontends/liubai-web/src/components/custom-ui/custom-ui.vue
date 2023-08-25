<script setup lang="ts">
import { defineAsyncComponent } from "vue"
import SnackBar from "./snack-bar/snack-bar.vue";
import SearchEditor from "./search-editor/search-editor.vue";
import StateEditor from "./state-editor/state-editor.vue";
import CustomLoading from "./loading/custom-loading.vue";

const CustomModal = defineAsyncComponent(() => import("./modal/custom-modal.vue"))
const TextEditor = defineAsyncComponent(() => import("./text-editor/text-editor.vue"))
const DatePicker = defineAsyncComponent(() => import("./date-picker/date-picker.vue"))
const PreviewImage = defineAsyncComponent(() => import("./preview-image/preview-image.vue"))
const HashtagEditor = defineAsyncComponent(() => import("./hashtag-editor/hashtag-editor.vue"))
const ActionSheet = defineAsyncComponent(() => import("./action-sheet/action-sheet.vue"))
const StateSelector = defineAsyncComponent(() => import("./state-selector/state-selector.vue"))
const ShareView = defineAsyncComponent(() => import("./share-view/share-view.vue"))
const ContentPanel = defineAsyncComponent(() => import("./content-panel/content-panel.vue"))
const CommentPopup = defineAsyncComponent(() => import("./comment-popup/comment-popup.vue"))
const HashtagSelector = defineAsyncComponent(() => import("./hashtag-selector/hashtag-selector.vue"))

</script>
<template>

  <!-- 弹窗 -->
  <CustomModal></CustomModal>

  <!-- 文字输入框 -->
  <TextEditor></TextEditor>

  <!-- 加载 loading 框 -->
  <CustomLoading></CustomLoading>

  <!-- hashtag 编辑器 -->
  <HashtagEditor></HashtagEditor>

  <!-- hashtag 选择器 -->
  <HashtagSelector></HashtagSelector>

  <!-- 日期选择器 -->
  <DatePicker></DatePicker>

  <!-- 预览图片 -->
  <PreviewImage></PreviewImage>

  <!-- actionsheet -->
  <ActionSheet></ActionSheet>

  <!-- snack-bar -->
  <SnackBar></SnackBar>

  <!-- 搜索 -->
  <SearchEditor></SearchEditor>

  <!-- 状态选择组件 -->
  <StateSelector></StateSelector>

  <!-- 状态编辑组件 -->
  <StateEditor></StateEditor>

  <!-- 分享管理弹窗: 公开分享、允许评论、到出至 -->
  <ShareView></ShareView>

  <!-- 内容选单 -->
  <ContentPanel></ContentPanel>

  <!-- 评论弹窗 -->
  <CommentPopup></CommentPopup>
  
</template>

<style scoped lang="scss">


</style>