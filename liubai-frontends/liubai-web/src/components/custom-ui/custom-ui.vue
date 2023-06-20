<script setup lang="ts">
import CustomModal from "./modal/custom-modal.vue"
import TextEditor from "./text-editor/text-editor.vue";
import DatePicker from "./date-picker/date-picker.vue"
import PreviewImage from "./preview-image/preview-image.vue";
import HashtagEditor from "./hashtag-editor/hashtag-editor.vue";
import SnackBar from "./snack-bar/snack-bar.vue";
import ActionSheet from "./action-sheet/action-sheet.vue";
import SearchEditor from "./search-editor/search-editor.vue";
import StateSelector from "./state-selector/state-selector.vue";
import StateEditor from "./state-editor/state-editor.vue";
import ShareView from "./share-view/share-view.vue";
import CustomLoading from "./loading/custom-loading.vue";

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

</template>

<style scoped lang="scss">


</style>