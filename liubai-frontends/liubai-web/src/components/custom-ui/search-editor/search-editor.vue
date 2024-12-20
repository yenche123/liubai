<script setup lang="ts">
import { initSearchEditor } from "./tools/useSearchEditor"
import SearchResults from "./search-results/search-results.vue";
import { useI18n } from "vue-i18n";
import liuUtil from "~/utils/liu-util";

const {
  TRANSITION_DURATION: tranMs,
  inputEl,
  enable,
  show,
  seData,
  onTapMask,
  onTapClearInput,
  onInput,
} = initSearchEditor()

const { t } = useI18n()


</script>
<template>

  <div v-if="enable" class="se-container"
    :class="{ 'se-container_show': show }"
  >

    <div class="se-bg" @click="onTapMask" />

    <div class="se-virtual-zero"></div>

    <div class="se-box">

      <div class="se-bar">
        <input class="se-input" :placeholder="t('common.search')" ref="inputEl"
          v-model="seData.inputTxt"
          autocomplete="off"
          type="text"
          @input="onInput"
        />
        <div v-if="seData.trimTxt" class="se-close-box" 
          @click.stop="onTapClearInput"
        >
          <svg-icon class="se-close-svg" name="close-circle"
            color="var(--main-note)"
          ></svg-icon>
        </div>
      </div>

      <SearchResults :se-data="seData"></SearchResults>

      <div class="liu-no-user-select se-footer">
        <div class="sef-first">
          <span class="se-bold">Esc</span>
          <span>{{ t('tip.to_leave') }}</span>
        </div>
        <div class="sef-footer">
          <div class="seff-part">
            <span class="se-bold">↑↓</span>
            <span>{{ t('tip.to_navigate') }}</span>
          </div>
          <div class="seff-part">
            <span class="se-bold">{{ liuUtil.getHelpTip('Enter') }}</span>
            <span>{{ t('tip.to_open') }}</span>
          </div>
        </div>

      </div>

    </div>

    
  </div>


</template>
<style lang="scss" scoped>

.se-container {
  width: 100%;
  min-height: 100vh;
  max-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 4900;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: v-bind("tranMs + 'ms'");

  &.se-container_show {
    opacity: 1;
  }

  .se-bg {
    z-index: 4901;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
  }
}

.se-virtual-zero {
  width: 100%;
  height: 10vh;
  height: 10dvh;
  transition: .3s;
}

.se-box {
  z-index: 4902;
  width: 90vw;
  max-width: 750px;
  border-radius: 9px;
  box-shadow: var(--card-shadow-2);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--frosted-glass-2);
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
  }
}

.se-bar {
  height: 70px;
  width: 100%;
  padding: 10px 4px 10px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;
}

.se-input {
  width: calc(100% - 48px);
  font-size: var(--desc-font);
  color: var(--main-normal);
  line-height: 1.75;

  &::-webkit-input-placeholder {
    color: var(--main-code);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.se-close-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  cursor: pointer;
  transition: .15s;

  .se-close-svg {
    width: 24px;
    height: 24px;
  }
}

.se-footer {
  padding-inline-start: 16px;
  padding-inline-end: 16px;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  border-top: 0.6px solid var(--main-tip);
}

.sef-first {
  width: 40%;
  font-size: var(--mini-font);
  color: var(--liu-quote);
}

.se-bold {
  font-weight: 700;
}

.sef-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.seff-part {
  font-size: var(--mini-font);
  color: var(--liu-quote);
}

.seff-part:first-child {
  padding-inline-end: 20px;
}

@media screen and (max-width: 600px) {

  .se-virtual-zero {
    height: 5vh;
    height: 5dvh;
  }

  .se-footer {
    display: none;
  }
}

@media(hover: hover) {
  .se-close-box:hover {
    opacity: .8;
  }
}

</style>