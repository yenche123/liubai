<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import cfg from "~/config"
import { Draggable } from "@he-tree/vue";
import { useSbTags } from "./tools/useSbTags";
import { RouterLink } from 'vue-router'
import SbtItem from './sbt-item/sbt-item.vue';
import { useStMenu } from "./tools/useStMenu";

defineProps({
  show: {
    type: Boolean,
    default: false,
  }
})

const emits = defineEmits<{
  (event: "aftertap"): void
}>()

const { t } = useI18n()
const naviHeightPx = `${cfg.navi_height}px`

const {
  sbtData,
  tagNodes,
  oldTagNodes,
  lastTagChangeStamp,
  treeEl,
  onTreeChange,
  onTapTagItem,
  onTapTagArrow,
  onNaviBack,
} = useSbTags(emits)

const ctx = {
  tagNodes,
  oldTagNodes,
  lastTagChangeStamp
}

const {
  isPC,
  menuList,
  menuList2,
  onTapMenuItem,
  onTapAdd,
} = useStMenu(ctx)


</script>
<template>

  <div class="st-virtual"></div>

  <div class="liu-no-user-select liu-frosted-glass st-navibar">
    <button class="liu-hover st-navi-back" @click.stop="onNaviBack" :tabindex="show ? 0 : -1">
      <SvgIcon class="st-navi-back-icon" name="arrow-back700"></SvgIcon>
    </button>
    <div class="st-navi-title">
      <span>{{ t("common.tags") }}</span>
    </div>
    <div class="st-navi-footer">
      <button class="liu-hover st-navi-back st-add" @click.stop="onTapAdd" :tabindex="show ? 0 : -1">
        <SvgIcon class="st-navi-back-icon" name="add"></SvgIcon>
      </button>
    </div>
  </div>

  <div class="st-virtual-two"></div>

  <div v-if="tagNodes.length < 1" class="liu-no-user-select st-no-tags">
    <span>{{ t('placeholder.no_tag_yet') }}</span>
  </div>

  <Draggable v-if="sbtData.enable"
    v-model="tagNodes" ref="treeEl" :indent="20" 
    @change="onTreeChange" 
    :watermark="false"
    update-behavior="new"
    :max-level="3"
  >
    <template #default="{ node, stat }">

      <RouterLink v-if="isPC" :to="sbtData.toPath + node.tagId" custom>

        <a :href="sbtData.toPath + node.tagId" 
          @click.prevent="onTapTagItem($event, sbtData.toPath + node.tagId)"
        >
          <SbtItem
            :is-p-c="isPC"
            :node="node"
            :stat="stat"
            :current-tag-id="sbtData.currentTagId"
            :menu-list="menuList"
            :menu-list2="menuList2"
            @taptagarrow="onTapTagArrow"
            @tapmenuitem="onTapMenuItem"
          ></SbtItem>

        </a>

      </RouterLink>

      <div v-else @click.stop="onTapTagItem($event, sbtData.toPath + node.tagId)">
        <SbtItem
          :is-p-c="isPC"
          :node="node"
          :stat="stat"
          :current-tag-id="sbtData.currentTagId"
          :menu-list="menuList"
          :menu-list2="menuList2"
          @taptagarrow="onTapTagArrow"
          @tapmenuitem="onTapMenuItem"
        ></SbtItem>
      </div>

    </template>
  </Draggable>

  <div class="st-virtual-three"></div>

</template>
<style scoped lang="scss">
.liu-frosted-glass::before {
  background: none;
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
}

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
  z-index: 600;

  .st-navi-back {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-start: 8px;
    margin-inline-end: 8px;

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

  .st-navi-footer {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .st-add {
    margin-inline-end: -4px;
  }

}

.st-virtual-two {
  width: 100%;
  height: 30px;
}

.st-virtual-three {
  width: 100%;
  height: 60px;
}

.st-no-tags {
  width: 100%;
  padding: 20px 0;
  box-sizing: border-box;
  text-align: center;
  font-size: var(--mini-font);
  color: var(--main-normal);
  line-height: 1.25;
}

@container sidebar (max-width: 190px) {

  .st-virtual {
    height: 40px;
  }

  .st-navibar {

    .st-navi-back {
      width: 38px;
      height: 38px;
      margin-inline-start: 6px;
      margin-inline-end: 6px;

      .st-navi-back-icon {
        width: 26px;
        height: 26px;
      }
    }

    .st-navi-title {
      font-size: var(--title-font);
      line-height: 1.5;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .st-add {
      margin-inline-end: -8px;
    }

  }

  .st-virtual-two {
    height: 24px;
  }
}


</style>
<style>
.he-tree {
  min-height: 300px;
}

/** 当标签正在拖动时的 css */
.he-tree-drag-placeholder {
  background-color: var(--drag-bg);
  height: 46px;
  border-radius: 8px;
  border: 1px dashed var(--drag-border);
}
</style>