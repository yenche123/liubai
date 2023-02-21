<script setup lang="ts">
// 侧边栏顶部区域
import { useScTop } from './tools/useScTop';
import { useSctLayout } from "./tools/useSctLayout";
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import NaviLink from "~/components/common/navi-link/navi-link.vue";
import { useI18n } from 'vue-i18n';
import { useSctRoute } from './tools/useSctRoute';
import cui from '~/components/custom-ui';
import liuUtil from '~/utils/liu-util';

const { t } = useI18n()

const emits = defineEmits<{
  (event: "canclosepopup"): void
}>()

const onTapItem = () => {
  emits("canclosepopup")
}

const {
  prefix,
  memberShow,
} = useScTop()

const {
  boxWidth,
  iconWidth,
  showMore,
  toolWidth,
} = useSctLayout()

const {
  sctIndicator
} = useSctRoute()


const onTapSearch = () => {
  cui.showSearchEditor({ type: "search" })
}


const iconColor = "var(--main-normal)"
const searchTip = ` (${liuUtil.getHelpTip('Mod')} K)`

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
      @click="onTapSearch"
      :aria-label="t('common.search') + searchTip"
    >
      <svg-icon name="search" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 通知 -->
    <NaviLink 
      @aftertap="onTapItem"
      :to="prefix + 'notification'"
    >
      <div class="liu-hover sct-box" :aria-label="t('common.notification')"
        :class="{'sc-selected': sctIndicator === 'notification'}"
      >
        <svg-icon name="notification" class="sct-icon"
          :color="iconColor"
        ></svg-icon>
      </div>
    </NaviLink>

    <!-- 更多 -->
    <div class="liu-hover liu-hover_last sct-box" v-if="showMore"
      :aria-label="t('whatever.sidebar_more')"
    >
      <svg-icon name="more" class="sct-icon"
        :color="iconColor"
      ></svg-icon>
    </div>

    <!-- 设置 -->
    <NaviLink 
      v-if="!showMore"
      @aftertap="onTapItem"
      :to="prefix + 'setting'"
    >
      <div class="liu-hover sct-box" :aria-label="t('common.setting')"
        :class="{'sc-selected': sctIndicator === 'setting'}"
      >
        <svg-icon name="setting" class="sct-icon"
          :color="iconColor"
        ></svg-icon>
      </div>
    </NaviLink>

    <!-- 垃圾桶 -->
    <NaviLink 
      v-if="!showMore"
      @aftertap="onTapItem"
      :to="prefix + 'trash'"
    >
      <div class="liu-hover liu-hover_last sct-box"
        :aria-label="t('common.trash')"
        :class="{'sc-selected': sctIndicator === 'trash'}"
      >
        <svg-icon name="delete_400" class="sct-icon sct-icon_big"
          :color="iconColor"
        ></svg-icon>
      </div>
    </NaviLink>

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

    &::before {
      transition: .25s;
    }

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

.sc-selected::before {
  opacity: .11;
}


</style>