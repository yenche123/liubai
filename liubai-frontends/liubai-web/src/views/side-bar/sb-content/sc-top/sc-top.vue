<script setup lang="ts">
// 侧边栏顶部区域
import { useScTop } from './tools/useScTop';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const {
  memberShow,
  sidebarWidthPx,
} = useScTop()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="sc-avatar-name">
    <LiuAvatar
      v-if="memberShow"
      :member-show="memberShow"
      class="sc-avatar"
    ></LiuAvatar>
    
    <div class="sc-title" v-if="memberShow?.name">
      <span>{{ memberShow.name }}</span>
    </div>
  </div>

  <div class="sc-toolbar">

    <!-- 搜索 -->
    <div class="liu-hover sct-box">
      <svg-icon name="search" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
      <div class="sctb-title">
        <span>{{ t('common.search') }}</span>
      </div>
    </div>

    <!-- 设置 -->
    <div class="liu-hover sct-box">
      <svg-icon name="setting" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
      <div class="sctb-title">
        <span>{{ t('common.setting') }}</span>
      </div>
    </div>

    <!-- 垃圾桶 -->
    <div class="liu-hover sct-box">
      <svg-icon name="delete_400" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
      <div class="sctb-title">
        <span>{{ t('common.trash') }}</span>
      </div>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.sc-avatar-name {
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

.sc-toolbar {
  padding-inline-start: 12px;
  width: 94%;
  width: calc(95% - 12px);
  margin-block-end: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;


  .sct-box {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    .sct-icon {
      width: 28px;
      height: 28px;
      margin-inline-start: v-bind("sidebarWidthPx > 430 ? '6px' : '0'");
      flex: none;
    }

    .sctb-title {
      padding-inline: 8px;
      font-size: var(--btn-font);
      color: var(--main-normal);
      display: v-bind("sidebarWidthPx > 430 ? 'block' : 'none'");
    }
  }

}


</style>