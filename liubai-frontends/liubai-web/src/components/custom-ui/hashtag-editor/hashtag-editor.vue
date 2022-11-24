<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initHtePicker } from "./index"
import HashtagList from "./hashtag-list/hashtag-list.vue";

const {
  inputEl,
  enable,
  show,
  TRANSITION_DURATION: tranMs,
  inputVal,
  emoji,
  errCode,
  newTag,
  list,
  selectedIndex,
  mode,
  onTapCancel,
  onTapItem,
} = initHtePicker()

const { t } = useI18n()

const onMouseEnterItem = (index: number) => {
  selectedIndex.value = index
}


</script>
<template>

  <div 
    v-if="enable"
    class="hte-container"
    :class="{ 'hte-container_show': show }"
  >

    <div class="hte-bg" @click="onTapCancel" />

    <div class="hte-box">

      <!-- 第一行: 图标 + 输入框 -->
      <div class="hte-bar">

        <div class="hteb-box">
          <svg-icon v-if="mode === 'search' || !emoji" name="tag"
            class="hteb-icon"
          ></svg-icon>
          <span v-else>{{ emoji }}</span>
        </div>

        <input ref="inputEl" 
          class="hteb-input" 
          v-model="inputVal" 
          :maxlength="50" 
        />
        
      </div>

      <!-- 第二行: 错误提示 -->
      <div v-if="errCode > 0" class="hte-err">
        <span v-if="errCode === 1">{{ t('tip.no_strange_char') }}</span>
      </div>

      <!-- 第三行: 创建标签 -->
      <div v-else-if="newTag" class="hte-create-box">
        <div class="hte-create"
          
        >
          <span>{{ t('tip.add_tag', { tag: newTag }) }}</span>
        </div>
      </div>

      <!-- 第四部分: 搜索结果 -->
      <HashtagList 
        v-if="mode === 'search' && list.length > 0"
        :list="list" 
        :selected-index="selectedIndex"
        @mouseenteritem="onMouseEnterItem"
        @tapitem="onTapItem"
      ></HashtagList>
      
    </div>

  </div>

</template>
<style scoped lang="scss">


</style>