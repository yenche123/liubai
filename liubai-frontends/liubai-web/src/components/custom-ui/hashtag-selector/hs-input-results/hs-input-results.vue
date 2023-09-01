<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useHsInputResults } from "./tools/useHsInputResults"
import type { HsirEmit, HsirProps } from "./tools/types"

const props = defineProps<HsirProps>()
const emit = defineEmits<HsirEmit>()

const { t } = useI18n()
const {
  inputEl,
  hsirData,
  onFocus,
  onBlur,
  onInput,
} = useHsInputResults(props, emit)

const icon_color = `var(--main-normal)`

</script>
<template>
  <div class="hsir-box" :class="{ 'hsir-box_focus': hsirData.focus }">

    <input class="hsir-input" autocomplete="nope" ref="inputEl" 
      :placeholder="t('tag_related.add_tag')" @blur="onBlur" @focus="onFocus" 
      @input="onInput" v-model="hsirData.inputTxt" :maxlength="50" 
    />

    <div class="hsir-results" v-show="hsirData.list.length">
      <template v-for="(item, index) in hsirData.list" :key="item.tagId">

        <div class="hsirr-item">
          <div class="hsirr-icon-box">
            <span v-if="item.emoji">{{ item.emoji }}</span>
            <svg-icon v-else-if="!(item.tagId)" class="hsirr-svg-icon" name="add" :color="icon_color"></svg-icon>
            <svg-icon v-else class="hsirr-svg-icon" name="tag" :color="icon_color"></svg-icon>
          </div>
          <div class="hsirr-text">
            <span>{{ item.textBlank }}</span>
          </div>
        </div>

      </template>
    </div>

  </div>
</template>
<style lang="scss" scoped>

.hsir-box {
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  background-color: var(--card-bg);
  position: relative;
  transition: 150ms;
}

.hsir-input {
  line-height: 1.5;
  color: var(--main-normal);
  font-size: var(--inline-code-font);
  width: 100%;
  padding: 10px 20px;
  box-sizing: border-box;

  &::-webkit-input-placeholder {
    color: var(--main-code);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}


.hsir-results {
  width: 100%;
  position: relative;
  border-top: 1px solid var(--line-default);
  padding-block-start: 6px;
  padding-block-end: 10px;
}

.hsirr-item {
  display: flex;
  width: 100%;
  padding: 6px 10px;
  box-sizing: border-box;
  align-items: flex-start;
  position: relative;
  user-select: none;
}

.hsirr-icon-box {
  width: 32px;
  height: 32px;
  margin-inline-end: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--desc-font);
}

.hsirr-svg-icon {
  width: 26px;
  height: 26px;
}

.hsirr-text {
  padding-block-start: 4px;
  width: calc(100% - 40px);
  line-height: 1.5;
  color: var(--main-normal);
  font-size: var(--inline-code-font);
}


@media(hover: hover) {
  .hsir-box:hover {
    box-shadow: var(--cui-snackbar-shadow);
  }
}

.hsir-box_focus {
  box-shadow: var(--cui-snackbar-shadow);
}
</style>