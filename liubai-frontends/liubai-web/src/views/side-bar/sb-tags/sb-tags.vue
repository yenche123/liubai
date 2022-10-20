<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SvgIcon from '../../../assets/svg-icon.vue';
import cfg from "../../../config"
import { useRouteAndLiuRouter } from '../../../routes/liu-router';
import { Draggable } from "@he-tree/vue";
import { useSbTags } from "./tools/useSbTags";
// 侧边栏: 标签

const { router } = useRouteAndLiuRouter()
const { t } = useI18n()
const naviHeightPx = `${cfg.navi_height}px`

const { 
  tagNodes, 
  treeEl, 
  onTreeChange,
  onTapTagItem,
  onTapTagArrow,
} = useSbTags()

const onNaviBack = () => {
  router.naviBack()
}

</script>
<template>
  
  <div class="st-virtual"></div>

  <div class="liu-frosted-glass st-navibar">
    <div class="liu-hover st-navi-back" @click="onNaviBack">
      <SvgIcon class="st-navi-back-icon" name="arrow-back700"></SvgIcon>
    </div>
    <div class="st-navi-title">
      <span>{{ t("common.tags") }}</span>
    </div>
  </div>

  <div class="st-virtual-two"></div>

  <Draggable v-model="tagNodes" ref="treeEl"
    :indent="20"
    @change="onTreeChange"
  >
    <template #default="{ node, stat }">
      <div class="liu-hover tag-container"
        @click="onTapTagItem($event, node, stat)"
      >

        <!-- tag 所在的该行 -->
        <div class="tag-box">
          <div class="liu-hover tag-arrow"
            :class="{ 'tag-arrow_unhover': !stat.children.length}"
            @click="onTapTagArrow($event, node, stat)"
          >
            <SvgIcon v-if="stat.children.length" 
              class="tag-arrow-icon" 
              :class="{ 'tag-arrow-icon_open': stat.open }"
              name="arrow-right"
              color="var(--main-normal)"
            ></SvgIcon>
          </div>
          <div class="tag-title">
            <span>{{ node.text }}</span>
          </div>
        </div>

      </div>
    </template>
  </Draggable>

</template>
<style scoped lang="scss">

.st-virtual {
  width: 100%;
  height: 50px;
}

.st-navibar {
  position: sticky;
  top: 15px;
  width: 100%;
  height: v-bind("naviHeightPx");
  display: flex;
  align-items: center;
  user-select: none;
  z-index: 500;

  .st-navi-back {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    margin-left: 8px;

    .st-navi-back-icon {
      width: 30px;
      height: 30px;
    }
  }

  .st-navi-title {
    position: relative;
    font-size: var(--head-font);
    color: var(--main-text);
    line-height: 1.5;
    font-weight: 700;
    letter-spacing: 2px;
  }
}

.st-virtual-two {
  width: 100%;
  height: 30px;
}

.tag-container {
  position: relative;
  padding: 8px 0;
  transition: .15s;

  .tag-box {
    display: flex;
    align-items: center;
    flex: 1;
    user-select: none;

    .tag-arrow {
      width: 32px;
      height: 32px;
      margin-left: 4px;
      margin-right: 4px;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      .tag-arrow-icon {
        width: 24px;
        height: 24px;
      }

      .tag-arrow-icon_open {
        transform: rotate(90deg);
      }
    }

    .tag-arrow_unhover {
      cursor: auto;

      &:hover::before {
        opacity: 0;
      }

      &:active::before {
        opacity: 0;
      }
    }

    .tag-title {
      flex: 1;
      font-size: var(--desc-font);
      color: var(--main-normal);
    }

  }

}

</style>
<style>

/** 当标签正在拖动时的 css */

.he-tree-drag-placeholder {
  background-color: var(--drag-bg);
  height: 46px;
  border-radius: 8px;
  border: 1px dashed var(--drag-border);
}

</style>