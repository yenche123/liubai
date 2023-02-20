<script setup lang="ts">
import { computed, PropType, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ScContentAtom,
  ScRecentAtom,
  ScThirdPartyAtom,
} from "~/utils/controllers/search-controller/types"
import type { SearchListType } from "../../tools/types"
import { searchFuncsKey } from "../../tools/types"

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
  }
})

const { t } = useI18n()

const desc = computed(() => {
  const { siType, contentAtom } = props
  if(siType === 'suggest' || siType === 'results') {
    if(contentAtom?.desc) return contentAtom.desc
  }

  return ""
})

const iconColor = "var(--main-code)"


const injectData = inject(searchFuncsKey)

const onMouseEnter = () => {
  if(!injectData) return
  injectData.mouseenteritem(props.atomId)
}

const onTapItem = () => {
  if(!injectData) return
  injectData.tapitem(props.siType, props.atomId)
}

</script>
<template>
  <div class="si-container"
    :class="{ 'si-container_selected': indicator && indicator === atomId }"
    @mouseenter="onMouseEnter"
    @click="onTapItem"
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
        border-radius="4px"
      ></liu-img>

      <!-- 评论 -->
      <svg-icon v-else-if="contentAtom?.commentId"
        class="si-search-icon"
        name="comment_400"
        :color="iconColor"
      ></svg-icon>


      <!-- 以 desc 兜底 -->
      <svg-icon v-else
        class="si-search-icon"
        name="desc_400"
        :color="iconColor"
      ></svg-icon>

    </div>

    <div class="si-main"
      :class="{ 'si-main_small': siType === 'recent' }"
    >

      <!-- 标题 -->
      <div class="si-title">
        <span v-if="contentAtom">{{ contentAtom.title }}</span>
        <span v-else-if="recentAtom">{{ recentAtom.title }}</span>
        <template v-else-if="thirdAtom">
          <span v-if="atomId === 'bing'">{{ t('search_related.bing_search') }}</span>
          <span v-else-if="atomId === 'xhs'">{{ t('search_related.xhs_search') }}</span>
          <span v-else-if="atomId === 'github'">{{ t('search_related.github_search') }}</span>
        </template>
      </div>

      <!--内文-->
      <div v-if="desc" class="si-desc">
        <span>{{ desc }}</span>
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
  user-select: none;
}

.si-container::before {
  transition: 80ms;
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

</style>