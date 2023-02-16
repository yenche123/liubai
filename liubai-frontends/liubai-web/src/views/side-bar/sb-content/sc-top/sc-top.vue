<script setup lang="ts">
// 侧边栏顶部区域
import { useScTop } from './tools/useScTop';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';

const { t } = useI18n()

const {
  memberShow,
  sidebarWidthPx,
} = useScTop()

const boxWidth = ref("36px")
const iconWidth = ref("24px")
const showMore = ref(false)
const toolWidth = ref("calc(96% - 12px)")

const whenSidebarWidthChange = (newV: number) => {
  const oldShowMore = showMore.value
  if(newV < 240 && !oldShowMore) showMore.value = true
  else if(newV >= 240 && oldShowMore) showMore.value = false

  if(newV < 450) toolWidth.value = "calc(96% - 12px)"
  else toolWidth.value = "calc(66% - 12px)"

  if(newV < 320) {
    boxWidth.value = "36px"
    iconWidth.value = "24px"
  }
  else {
    boxWidth.value = "40px"
    iconWidth.value = "28px"
  }
}
watch(sidebarWidthPx, (newV) => {
  whenSidebarWidthChange(newV)
})
whenSidebarWidthChange(sidebarWidthPx.value)



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
    <div class="liu-hover liu-hover_first sct-box"
      :aria-label="t('common.search')"
    >
      <svg-icon name="search" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 通知 -->
    <div class="liu-hover sct-box"
      :aria-label="t('common.notification')"
    >
      <svg-icon name="notification" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 更多 -->
    <div class="liu-hover liu-hover_last sct-box" v-show="showMore"
      :aria-label="t('whatever.sidebar_more')"
    >
      <svg-icon name="more" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 设置 -->
    <div class="liu-hover sct-box" v-show="!showMore"
      :aria-label="t('common.setting')"
    >
      <svg-icon name="setting" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 垃圾桶 -->
    <div class="liu-hover liu-hover_last sct-box" v-show="!showMore"
      :aria-label="t('common.trash')"
    >
      <svg-icon name="delete_400" class="sct-icon sct-icon_big"
        :color="iconColor"
      ></svg-icon>
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
  width: v-bind("toolWidth");
  margin-block-end: 30px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;


  .sct-box {
    min-width: v-bind("boxWidth");
    height: v-bind("boxWidth");
    display: flex;
    align-items: center;
    justify-content: center;

    .sct-icon {
      width: v-bind("iconWidth");
      height: v-bind("iconWidth");
      flex: none;
    }

    .sct-icon_big {
      transform: scale(1.05);
    }
  }

}


</style>