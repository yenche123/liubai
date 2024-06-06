<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import cfg from "~/config"
import { Draggable } from "@he-tree/vue";
import { useSbTags } from "./tools/useSbTags";
import { RouterLink } from 'vue-router'
import LiuMenu from "~/components/common/liu-menu/liu-menu.vue"
import { useStMenu } from "./tools/useStMenu";
import liuApi from '~/utils/liu-api';

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
  tagNodes,
  oldTagNodes,
  lastTagChangeStamp,
  treeEl,
  onTreeChange,
  onTapTagItem,
  onTapTagArrow,
  toPath,
  onNaviBack,
  currentTagId,
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
} = useStMenu(ctx)


</script>
<template>

  <div class="st-virtual"></div>

  <div class="liu-frosted-glass st-navibar">
    <button class="liu-hover st-navi-back" @click="onNaviBack" :tabindex="show ? 0 : -1">
      <SvgIcon class="st-navi-back-icon" name="arrow-back700"></SvgIcon>
    </button>
    <div class="st-navi-title">
      <span>{{ t("common.tags") }}</span>
    </div>
  </div>

  <div class="st-virtual-two"></div>

  <Draggable v-model="tagNodes" ref="treeEl" :indent="20" @change="onTreeChange" :watermark="false"
    update-behavior="new">
    <template #default="{ node, stat }">

      <RouterLink :to="toPath + node.tagId" custom>

        <a :href="toPath + node.tagId" @click.prevent="onTapTagItem($event, toPath + node.tagId)">

          <div class="liu-hover tag-container"
            :class="{ 'tag-container_selected': node.tagId === currentTagId }"
          >

            <!-- tag 所在的该行 -->
            <div class="tag-box">
              <div class="liu-hover tag-arrow" 
                :class="{ 'tag-arrow_unhover': !stat.children.length }"
                @click.stop.prevent="onTapTagArrow($event, node, stat)"
              >
                <SvgIcon v-if="stat.children.length" class="tag-arrow-icon"
                  :class="{ 'tag-arrow-icon_open': stat.open }" 
                  name="arrow-right" 
                  color="var(--main-normal)"
                ></SvgIcon>
                <div v-else class="tag-arrow-dot"></div>
              </div>
              <div v-if="node.icon" class="tag-icon">
                <span>{{ liuApi.decode_URI_component(node.icon) }}</span>
              </div>
              <div class="tag-title">
                <span>{{ node.text }}</span>
              </div>
            </div>

            <!-- 更多 -->
            <LiuMenu :menu="stat.level < 3 ? menuList2 : menuList" 
              min-width-str="100px"
              @tapitem="(item2, index2) => onTapMenuItem(item2, index2, node, stat)"
            >
              <div class="liu-hover tag-more"
                :class="{ 'tag-more_always': !isPC }"
              >
                <svg-icon 
                  class="tag-more-icon" 
                  name="more" 
                  color="var(--main-normal)"
                ></svg-icon>
              </div>
            </LiuMenu>
            

          </div>

        </a>

      </RouterLink>

    </template>
  </Draggable>

  <div v-if="tagNodes.length < 1" class="st-no-tags">
    <span>{{ t('placeholder.no_tag_yet') }}</span>
  </div>

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
  user-select: none;
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
}

.st-virtual-two {
  width: 100%;
  height: 30px;
}

.st-virtual-three {
  width: 100%;
  height: 60px;
}

.tag-container {
  position: relative;
  padding: 5px 0;
  transition: .15s;
  margin-block-end: 3px;

  .tag-box {
    display: flex;
    align-items: center;
    flex: 1;
    user-select: none;

    .tag-arrow {
      width: 32px;
      height: 32px;
      margin-inline-start: 4px;
      margin-inline-end: 4px;
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

      .tag-arrow-dot {
        width: 5px;
        height: 5px;
        border-radius: 10px;
        background-color: var(--main-normal);
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

    .tag-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      font-size: var(--desc-font);
    }

    .tag-title {
      flex: 1;
      font-size: var(--btn-font);
      color: var(--main-normal);
    }

  }

}

.tag-container_selected::before {
  opacity: .06;
}

.tag-more {
  position: absolute;
  top: 5px;
  right: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: .1s;
  opacity: 0;

  .tag-more-icon {
    width: 26px;
    height: 26px;
  }
}

.tag-container:hover .tag-more {
  opacity: 1;
}

.tag-more_always {
  opacity: 1;
}


.st-no-tags {
  width: 100%;
  padding: 20px 0;
  box-sizing: border-box;
  text-align: center;
  font-size: var(--mini-font);
  color: var(--main-normal);
  line-height: 1.25;
  user-select: none;
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

  }

  .st-virtual-two {
    height: 24px;
  }

  .tag-container {
    padding: 5px 0;
    margin-block-end: 3px;

    .tag-box {
      .tag-arrow {
        width: 28px;
        height: 28px;
        margin-inline-start: 3px;
        margin-inline-end: 0px;
        border-radius: 6px;

        .tag-arrow-icon {
          width: 22px;
          height: 22px;
        }
      }

      .tag-icon {
        width: 32px;
        height: 32px;
      }

    }

    
  }

  .tag-more {
    top: 7px;
    right: 2px;
    width: 28px;
    height: 28px;

    .tag-more-icon {
      width: 24px;
      height: 24px;
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