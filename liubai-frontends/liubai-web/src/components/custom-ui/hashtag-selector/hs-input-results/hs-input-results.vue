<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useHsInputResults } from "./tools/useHsInputResults"

const { t } = useI18n()
const {
  inputEl,
  hsirData,
  onFocus,
  onBlur,
} = useHsInputResults()

</script>
<template>

  <div class="hsir-container">

    <div class="hsir-box" :class="{ 'hsir-box_focus': hsirData.focus }">

      <input class="hsir-input" 
        autocomplete="nope" 
        ref="inputEl"
        :placeholder="t('tag_related.add_tag')" 
        @blur="onBlur"
        @focus="onFocus"
      />

    </div>

  </div>


</template>
<style lang="scss" scoped>

.hsir-container {
  z-index: 5103;
  position: relative;
  width: 90%;
  max-width: 500px;
  padding: 10px 20px;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-start: -78px;
}

.hsir-box {
  width: 100%;
  border-radius: 30px;
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


@media(hover: hover) {
  .hsir-box:hover {
    box-shadow: var(--cui-snackbar-shadow);
  }
}

.hsir-box_focus {
  box-shadow: var(--cui-snackbar-shadow);
}


</style>