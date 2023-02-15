<script setup lang="ts">
// 侧边栏顶部区域
import { useScTop } from './tools/useScTop';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';

const { memberShow } = useScTop()

</script>
<template>

  <div class="sc-top">
    <LiuAvatar
      v-if="memberShow"
      :member-show="memberShow"
      class="sc-avatar"
    ></LiuAvatar>
    
    <div class="sc-title" v-if="memberShow?.name">
      <span>{{ memberShow.name }}</span>
    </div>
  </div>

</template>
<style lang="scss" scoped>

.sc-top {
  margin-block-start: 40px;
  width: 100%;
  height: 50px;
  margin-block-end: 20px;
  display: flex;
  align-items: center;

  .sc-avatar {
    margin-inline-start: 17px;
    margin-inline-end: 16px;
    flex: none;
  }

  .sc-title {
    font-size: var(--desc-font);
    font-weight: 500;
    color: var(--main-normal);
    user-select: none;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 1px;
  }

}


</style>