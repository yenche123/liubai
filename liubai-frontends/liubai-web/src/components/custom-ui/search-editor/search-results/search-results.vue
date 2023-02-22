<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from "vue";
import { useI18n } from 'vue-i18n';
import type { SearchEditorData } from "../tools/types";
import SearchItem from './search-item/search-item.vue';
import { useSearchResults } from './tools/useSearchResults';

const props = defineProps({
  seData: {
    type: Object as PropType<SearchEditorData>,
    required: true
  }
})

useSearchResults(props)

const show = computed(() => {
  const { suggestList, recentList, trimTxt } = props.seData
  if(suggestList.length) return true
  if(recentList.length) return true
  if(trimTxt) return true
  return false
})

const { t } = useI18n()

</script>
<template>

  <div class="sr-container" v-if="show">

    <!-- 输入框为空时 -->
    <div class="sr-box" v-show="!seData.trimTxt">

      <!-- 建议 -->
      <div class="sr-inner-box" v-if="seData.suggestList.length">
        <div class="sri-title">
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
        <div class="sri-title">
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
        <div class="sri-title">
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
        <div class="sri-title">
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
      <div class="sr-no-data"
        v-if="!seData.innerList.length && !seData.thirdList.length"
      >
        <span>{{ t('search_related.no_data') }}</span>
      </div>
    
    </div>

  </div>

</template>
<style lang="scss" scoped>

.sr-container {
  width: 100%;
  position: relative;
  border-top: 0.6px solid var(--main-tip);
  overflow-y: auto;
  max-height: max(50vh, 300px);

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
  user-select: none;
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
  user-select: none;
}


</style>