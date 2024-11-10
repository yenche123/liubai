<script setup lang="ts">
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ScContentAtom,
  ScRecentAtom,
  ScThirdPartyAtom,
} from "~/utils/controllers/search-controller/types"
import type { SearchListType } from "../../tools/types"
import { useSearchItem } from './tools/useSearchItem';

const props = defineProps({
  siType: {
    type: String as PropType<SearchListType>,
    required: true
  },
  atomId: {
    type: String,
    required: true,
  },
  indicator: {
    type: String,
    required: true,
  },
  contentAtom: {
    type: Object as PropType<ScContentAtom>,
  },
  recentAtom: {
    type: Object as PropType<ScRecentAtom>,
  },
  thirdAtom: {
    type: Object as PropType<ScThirdPartyAtom>,
  },
  inputTxt: {
    type: String,
  }
})

const {
  desc,
  onMouseEnter,
  onTapItem,
  showClear,
  onTapClear,
  isSelected
} = useSearchItem(props)

const { t } = useI18n()
const iconColor = "var(--main-code)"

</script>
<template>
  <div class="liu-no-user-select si-container"
    :class="{ 'si-container_selected': isSelected }"
    @mouseenter="onMouseEnter"
    @click.stop="onTapItem"
  >

    <!-- 图片框 -->
    <div class="si-img-box"
      :class="{ 'si-img-box_small': siType === 'recent' }"
    >

      <!-- 最近时，放大镜-->
      <svg-icon v-if="siType === 'recent'"
        class="si-zoom-icon"
        name="search"
        :color="iconColor"
      ></svg-icon>

      <!-- 第三方 -->
      <template v-else-if="siType === 'third_party' && thirdAtom">
        <svg-icon
          :name="'logos-' + thirdAtom.atomId"
          class="si-search-icon"
          :color="iconColor"
        ></svg-icon>
      
      </template>

      <!-- 如果有图片 -->
      <liu-img v-else-if="contentAtom?.imgShow"
        class="si-img"
        :src="contentAtom.imgShow.src"
        :blurhash="contentAtom.imgShow.blurhash"
        object-fit="cover"
        disable-transition
        border-radius="4px"
      ></liu-img>

      <!-- 评论 -->
      <svg-icon v-else-if="contentAtom?.commentId"
        class="si-search-icon si-search-icon_comment"
        name="comment_400"
        :color="iconColor"
      ></svg-icon>

      <!-- ADD -->
      <svg-icon v-else-if="siType === 'new_one'"
        class="si-search-icon"
        name="add"
        :color="iconColor"
      ></svg-icon>

      <!-- 以 desc 兜底 -->
      <svg-icon v-else
        class="si-search-icon"
        name="desc_400"
        :color="iconColor"
      ></svg-icon>

    </div>

    <!-- 标题 & 一点点内文 -->
    <div class="si-main"
      :class="{ 
        'si-main_small': siType === 'recent',
        'si-main_small-2': showClear,
      }"
    >

      <!-- 标题 -->
      <div class="si-title">
        <span v-if="contentAtom?.title">{{ contentAtom.title }}</span>
        <span v-else-if="recentAtom?.title">{{ recentAtom.title }}</span>
        <template v-else-if="thirdAtom">
          <span v-if="atomId === 'bing'">{{ t('search_related.bing_search') }}</span>
          <span v-else-if="atomId === 'xhs'">{{ t('search_related.xhs_search') }}</span>
          <span v-else-if="atomId === 'github'">{{ t('search_related.github_search') }}</span>
        </template>
        <span v-else-if="siType === 'new_one' && inputTxt">{{ inputTxt }}</span>
        <span v-else class="si-placeholder">{{ t('thread_related.img_file') }}</span>
      </div>

      <!--内文-->
      <div v-if="desc" class="si-desc">
        <span>{{ desc }}</span>
      </div>

    </div>

    <div
      class="si-footer"
      :class="{ 'si-footer_show': showClear }"
      @click.stop="onTapClear"
    >
      <div class="liu-hover si-clear">
        <svg-icon name="close" class="si-clear-icon" :color="iconColor"></svg-icon>
      </div>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.si-container {
  width: 100%;
  border-radius: 4px;
  margin-block-end: 4px;
  padding-block: 5px;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  position: relative;
  cursor: pointer;
}

.si-container::before {
  transition: 40ms;
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--card-bg);
  opacity: 0;
}

.si-container_selected {
  box-shadow: 1px 2px 3px rgba(0, 0, 0, .03);
}

.si-container_selected::before {
  opacity: .6;
}

.si-img-box {
  width: 60px;
  height: 48px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.si-img-box_small {
  height: 36px;
}

.si-search-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.si-search-icon_comment {
  width: 30px;
  height: 30px;
}

.si-zoom-icon {
  width: 24px;
  height: 24px;
}

.si-img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.si-main {
  width: calc(100% - 68px);
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.si-main_small {
  min-height: 36px;
}

.si-main_small-2 {
  width: calc(100% - 100px);
}

.si-title {
  font-size: var(--btn-font);
  color: var(--main-normal);
  max-width: 100%;
  line-height: 1.2;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-block: 4px;

  .si-placeholder {
    color: var(--liu-quote);
  }
}

.si-desc {
  font-size: var(--mini-font);
  color: var(--liu-quote);
  max-width: 100%;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-block-end: 4px;
}

.si-footer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60px;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: 40ms;
  visibility: hidden;
}

.si-footer_show {
  opacity: 1;
  visibility: visible;
}

.si-clear {
  width: 36px;
  height: 36px;
  margin-block-start: 6px;
  margin-inline-end: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-clear-icon {
  width: 24px;
  height: 24px;
}


</style>