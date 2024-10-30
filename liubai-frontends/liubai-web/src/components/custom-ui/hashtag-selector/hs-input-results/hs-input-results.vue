<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useHsInputResults } from "./tools/useHsInputResults"
import type { HsirEmit, HsirProps } from "./tools/types"

const props = defineProps<HsirProps>()
const emit = defineEmits<HsirEmit>()
const modelValue = defineModel<string>({ required: true })

const { t } = useI18n()
const {
  inputEl,
  hsirData,
  onFocus,
  onBlur,
  onInput,
  onMouseEnter,
  onTapItem,
} = useHsInputResults(props, emit, modelValue)

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

        <div class="liu-no-user-select hsirr-item" :class="{ 'hsirr-item_selected': hsirData.selectedIndex === index }"
          @mouseenter="() => onMouseEnter(index)"
          @click.stop="() => onTapItem(item)"
        >
          <div class="hsirr-icon-box">
            <span v-if="item.emoji">{{ item.emoji }}</span>
            <span v-else-if="item.parentEmoji">{{ item.parentEmoji }}</span>
            <svg-icon v-else-if="!(item.tagId)" class="hsirr-svg-icon" name="add" :color="icon_color"></svg-icon>
            <svg-icon v-else class="hsirr-svg-icon" name="tag" :color="icon_color"></svg-icon>
          </div>
          <div class="hsirr-text">
            <span>{{ item.text }}</span>
          </div>
          <div class="hsirr-footer" v-if="item.added">
            <svg-icon name="check" class="hsirrf-svg-icon" color="var(--primary-color)"></svg-icon>
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
  caret-color: var(--primary-color);

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
}

.hsirr-item_selected::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background-color: var(--primary-color);
  opacity: .1;
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

.hsirr-footer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  padding-inline: 10px;
  background: var(linear-gradient);
  display: flex;
  align-items: center;

  .hsirrf-svg-icon {
    width: 24px;
    height: 24px;
  }
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