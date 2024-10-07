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
import type { MenuItem } from "~/components/common/liu-menu/tools/types";
import { type ScTopEmits, scTopProps } from "./tools/types"

const { t } = useI18n()

const props = defineProps(scTopProps)
const emits = defineEmits<ScTopEmits>()

const onTapItem = () => {
  emits("canclosepopup")
}

const {
  prefix,
  myProfile,
  isPremium,
  MORE_ITEMS,
  onTapMoreMenuItem,
  onTapName,
  onTapAvatar,
} = useScTop(emits)

const {
  boxWidth,
  iconWidth,
  showMore,
  toolWidth,
} = useSctLayout(props)

const {
  sctIndicator
} = useSctRoute()


const onTapSearch = () => {
  cui.showSearchEditor({ type: "search" })
}

const iconColor = "var(--main-normal)"
const searchTip = `${liuUtil.getHelpTip('Mod')} + K`

</script>
<template>

  <div class="sc-avatar-name">
    <LiuAvatar
      v-if="myProfile"
      :member-show="myProfile"
      class="sc-avatar"
      @click.stop="onTapAvatar"
    ></LiuAvatar>
    
    <div class="liu-no-user-select sc-title" v-if="myProfile?.name" @click.stop="onTapName">
      <span>{{ myProfile.name }}</span>
    </div>
  </div>

  <div class="liu-no-user-select sc-premium" v-if="isPremium">
    <span>🥂</span>
    <span class="sc-premium-text">Premium</span>
  </div>

  <div class="sc-virtual"></div>

  <div class="sc-toolbar">


    <!-- 搜索 -->
    <div class="sct-item sct-item-search"
      @mouseenter="$emit('mouseenter', 'search')"
      @mouseleave="$emit('mouseleave')"
    >
      <LiuTooltip
        placement="bottom-start"
        :distance="4"
        :aria-label="t('common.search')"
        :shortcut="searchTip"
      >
        <div class="liu-hover liu-hover_first sct-box"
          @click="onTapSearch"
        >
          <svg-icon name="search" class="sct-icon"
            :color="iconColor"
          ></svg-icon>
        </div>
      </LiuTooltip>
    </div>
    

    <!-- 通知 -->
    <div class="sct-item sct-item-notification"
      @mouseenter="$emit('mouseenter', 'notification')"
      @mouseleave="$emit('mouseleave')"
    >
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
    </div>
    

    <!-- 更多 -->
    <div class="sct-item sct-item-more" v-if="showMore"
      @mouseenter="$emit('mouseenter', 'more')"
      @mouseleave="$emit('mouseleave')"
    >
      <LiuMenu
        :menu="MORE_ITEMS"
        @tapitem="(event1: MenuItem, event2: number) => onTapMoreMenuItem(event1, event2)"
      >
        <div class="liu-hover liu-hover_last sct-box"
          :aria-label="t('whatever.sidebar_more')"
        >
          <svg-icon name="more" class="sct-icon"
            :color="iconColor"
          ></svg-icon>
        </div>
      </LiuMenu>
    </div>
    
    <!-- 设置 -->
    <div class="sct-item sct-item-setting" v-if="!showMore"
      @mouseenter="$emit('mouseenter', 'setting')"
      @mouseleave="$emit('mouseleave')"
    >
      <NaviLink 
        @aftertap="onTapItem"
        :to="prefix + 'settings'"
      >
        <div class="liu-hover sct-box" :aria-label="t('common.setting')"
          :class="{'sc-selected': sctIndicator === 'setting'}"
        >
          <svg-icon name="setting" class="sct-icon"
            :color="iconColor"
          ></svg-icon>
        </div>
      </NaviLink>
    </div>
    

    <!-- 垃圾桶 -->
    <div class="sct-item sct-item-trash" v-if="!showMore"
      @mouseenter="$emit('mouseenter', 'trash')"
      @mouseleave="$emit('mouseleave')"
    >
      <NaviLink 
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
    
  </div>

</template>
<style lang="scss" scoped>

.sc-avatar-name {
  margin-block-start: 10px;
  width: 100%;
  height: 50px;
  margin-block-end: 10px;
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
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 1px;
    cursor: pointer;
    will-change: opacity;
    transition: .12s;
  }

  @media(hover: hover) {
    .sc-title:hover {
      opacity: .8;
    }

    .sc-title:active {
      opacity: .7;
    }
  }

}

.sc-premium {
  margin-inline-start: 16px;
  margin-block-end: 10px;
  font-size: var(--state-font);
  letter-spacing: 1px;
  padding: 2px 10px;
  position: relative;
  color: var(--primary-color);
  border-radius: 24px;
  overflow: hidden;
  width: fit-content;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary-color);
    opacity: .09;
  }
}

.sc-premium-text {
  margin-inline-start: 4px;
  font-weight: 200;
  background: linear-gradient(45deg, var(--inverse-primary), var(--primary-color) 70%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sc-virtual {
  width: 100%;
  height: 10px;
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

  .sct-item {
    position: relative;
  }
}

.sct-box {
  min-width: v-bind("boxWidth");
  height: v-bind("boxWidth");
  max-height: 40px;
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

.sc-selected::before {
  opacity: .11;
}

@media(hover: hover) {
  .sct-box:hover::before {
    opacity: 0;
  }

  .sc-selected:hover::before {
    opacity: .11;
  }
}



</style>