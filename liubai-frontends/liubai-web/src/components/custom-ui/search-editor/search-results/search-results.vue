<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from "vue";
import { useI18n } from 'vue-i18n';
import type { SearchEditorData } from "../tools/types";
import SearchItem from './search-item/search-item.vue';
import { useSearchResults } from './tools/useSearchResults';
import liuApi from '~/utils/liu-api';

const props = defineProps({
  seData: {
    type: Object as PropType<SearchEditorData>,
    required: true
  }
})

const { srContainerEl } = useSearchResults(props)

const show = computed(() => {
  const { suggestList, recentList, trimTxt } = props.seData
  if(suggestList.length) return true
  if(recentList.length) return true
  if(trimTxt) return true
  return false
})

const { t } = useI18n()
const { isMobile } = liuApi.getCharacteristic()

</script>
<template>

  <div class="sr-container" v-if="show" ref="srContainerEl">

    <!-- 输入框为空时 -->
    <div class="sr-box" v-show="!seData.trimTxt">

      <!-- 建议 -->
      <div class="sr-inner-box" v-if="seData.suggestList.length">
        <div class="liu-no-user-select sri-title">
          <span>{{ t('search_related.suggest') }}</span>
        </div>
        <template v-for="(item, index) in seData.suggestList" 
          :key="item.atomId"
        >
          <SearchItem
            si-type="suggest"
            :atom-id="item.atomId"
            :content-atom="item"
            :indicator="seData.indicator"
          ></SearchItem>
        </template>
      </div>

      <!-- 最近 -->
      <div class="sr-inner-box" v-if="seData.recentList.length">
        <div class="liu-no-user-select sri-title">
          <span>{{ t('search_related.recent') }}</span>
        </div>
        <template v-for="(item, index) in seData.recentList" 
          :key="item.atomId"
        >
          <SearchItem
            si-type="recent"
            :atom-id="item.atomId"
            :recent-atom="item"
            :indicator="seData.indicator"
          ></SearchItem>
        </template>
      </div>

    </div>

    <!-- 输入框有文字时 -->
    <div class="sr-box" v-show="seData.trimTxt">

      <!-- 搜索结果 -->
      <div class="sr-inner-box" v-if="seData.innerList.length">
        <div class="liu-no-user-select sri-title">
          <span>{{ t('search_related.results') }}</span>
        </div>
        <template v-for="(item, index) in seData.innerList" 
          :key="item.atomId"
        >
          <SearchItem
            si-type="results"
            :atom-id="item.atomId"
            :content-atom="item"
            :indicator="seData.indicator"
          ></SearchItem>
        </template>
      </div>

      <!-- 第三方 -->
      <div class="sr-inner-box" v-if="seData.thirdList.length">
        <div class="liu-no-user-select sri-title">
          <span>{{ t('search_related.third_party') }}</span>
        </div>
        <template v-for="(item, index) in seData.thirdList" 
          :key="item.atomId"
        >
          <SearchItem
            si-type="third_party"
            :atom-id="item.atomId"
            :third-atom="item"
            :indicator="seData.indicator"
          ></SearchItem>
        </template>
      </div>

      <!-- 任何结果都不存在时 -->
      <template v-if="!seData.innerList.length && !seData.thirdList.length">
        <!-- 1. 新建动态 -->
        <div class="sr-inner-box" v-if="seData.mode === 'select_thread'">
          <div class="liu-no-user-select sri-title">
            <span>{{ t('search_related.add_instantly') }}</span>
          </div>
          <SearchItem
            si-type="new_one"
            atom-id="new_one"
            :indicator="seData.indicator"
            :input-txt="seData.trimTxt"
          ></SearchItem>
        </div>

        <!-- 2. 搜索结果为空 -->
        <div class="liu-no-user-select sr-no-data" v-else>
          <span>{{ t('search_related.no_data') }}</span>
        </div>
      </template>
      
    
    </div>

  </div>

</template>
<style lang="scss" scoped>

.sr-container {
  width: 100%;
  position: relative;
  border-top: 0.6px solid var(--main-tip);
  overflow-y: auto;
  max-height: max(66vh, 300px);

  /** refer: https://moderncss.dev/12-modern-css-one-line-upgrades/#overscroll-behavior */
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    display: v-bind("isMobile ? 'none' : 'block'");
  }

  &::-webkit-scrollbar-thumb {
    background: var(--main-note);
  }
}

.sr-box {
  position: relative;
  padding: 7px;
  width: calc(100% - 14px);
}

.sr-inner-box {
  width: 100%;
  position: relative;
  padding-block-start: 10px;
}

.sri-title {
  font-weight: 700;
  color: var(--liu-quote);
  letter-spacing: 1px;
  font-size: var(--mini-font);
  margin-inline-start: 10px;
  margin-block-end: 6px;
}

.sr-no-data {
  height: 50px;
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--mini-font);
  color: var(--main-note);
}

@media screen and (max-width: 600px) {
  .sr-container {
    max-height: max(75vh, 450px);
  }
}


</style>