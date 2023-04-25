<script setup lang="ts">
import { useCommentEditor } from './tools/useCommentEditor';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';

const {
  myProfile
} = useCommentEditor()

</script>
<template>

  <div v-if="myProfile" class="ce-container">

    <!-- 头像 -->
    <LiuAvatar
      :member-show="myProfile"
      class="ce-avatar"
    ></LiuAvatar>

    <!-- 编辑区域 -->
    <div class="ce-main">


    </div>

  </div>

</template>
<style lang="scss" scoped>

.ce-container {
  width: 100%;
  position: relative;
  display: flex;
}

.ce-avatar {
  margin-inline-end: 16px;
  flex: none;
}

.ce-main {
  flex: 1;
  position: relative;
}



</style>