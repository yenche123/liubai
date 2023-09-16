<script setup lang="ts">
import { initHashtagSelector } from "./tools/useHashtagSelector"
import { useI18n } from "vue-i18n";
import HsInputResults from "./hs-input-results/hs-input-results.vue"

const {
  hsData,
  onTapCancel,
  onTapConfirm,
  onTapClear,
  onTapPopup,
  onFocusOrNot,
  onTapItem,
} = initHashtagSelector()

const { t } = useI18n()

</script>
<template>

  <div v-if="hsData.enable" class="hs-container"
    :class="{ 'hs-container_show': hsData.show }"
  >

    <div class="hs-bg" @click.stop="onTapPopup"></div>

    <div class="hs-box">

      <!-- 取消、标题、确认 -->
      <div class="hs-bar">

        <custom-btn 
          type="pure"
          size="mini"
          @click="onTapCancel"
        >
          <span>{{ t('common.cancel') }}</span>
        </custom-btn>

        <div class="hs-title">
          <span>{{ t('tag_related.edit_tag') }}</span>
        </div>

        <custom-btn 
          type="main"
          size="mini"
          :disabled="!hsData.canSubmit"
          @click="onTapConfirm"
        >
          <span>{{ t('common.confirm') }}</span>
        </custom-btn>

      </div>

      <!-- 已添加的标签 -->
      <div class="hs-bar hs-tags" v-show="hsData.list.length > 0">

        <template v-for="(item, index) in hsData.list" :key="item.text">
          <div class="hs-tag" @click.stop="() => onTapClear(index)">
            <span v-if="item.emoji" class="hs-tag-emoji">{{ item.emoji }}</span>
            <span>{{ item.text }}</span>
            <div class="hs-tag-close">
              <div class="hstc-bg">
                <div class="hstc-bg-dot"></div>
              </div>
              <svg-icon name="close" class="hs-tag-close_svg"
                color="var(--liu-quote)"
              ></svg-icon>
            </div>
          </div>
        </template>

      </div>

      <div class="hs-virtual"></div>

    </div>


    <div class="hsir-container">
      <HsInputResults
        :list-added="hsData.list"
        @focusornot="onFocusOrNot"
        @tapitem="onTapItem"
      ></HsInputResults>
    </div>

    

  </div>

</template>
<style scoped lang="scss">

.hs-container {
  position: fixed;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  top: 0;
  left: 0;
  z-index: 5100;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  opacity: 0;
  transition: v-bind("hsData.transDuration + 'ms'");

  &.hs-container_show {
    opacity: 1;
  }

  .hs-bg {
    z-index: 5101;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
  }
}

.hs-box {
  z-index: 5102;
  margin-top: 16vh;
  margin-top: 16dvh;
  width: 90%;
  max-width: 500px;
  border-radius: 8px;
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
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
}

.hs-bar {
  width: 100%;
  padding: 12px 20px 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;
}

.hs-tags {
  flex-wrap: wrap;
  padding: 10px 20px 0px;
}

.hs-title {
  flex: 1;
  display: flex;
  justify-content: center;
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  user-select: none;
}

.hs-virtual {
  width: 100%;
  height: 80px;
}

.hs-tag {
  padding-inline-start: 14px;
  font-size: var(--mini-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border-radius: 24px;
  margin-inline-end: 10px;
  margin-block-end: 10px;
  user-select: none;
  display: flex;
  align-items: center;
  white-space: pre-wrap;
  position: relative;

  span {
    position: relative;
  }

  .hs-tag-emoji {
    margin-inline-end: 6px;
  }
}

.hs-tag-close {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;

  .hs-tag-close_svg {
    width: 20px;
    height: 20px;
    position: relative;
  }
}

.hstc-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hstc-bg-dot {
  width: 0px;
  height: 0px;
  border-radius: 50%;
  background: var(--primary-color);
  opacity: .07;
  transition: .2s;
  transition-timing-function: cubic-bezier(.88, .1, 1, 1);
  flex: none;
}

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

@media screen and (max-width: 450px) {

  .hs-box {
    margin-top: 12vh;
    margin-top: 12dvh;
    width: 100%;
  }

  .hsir-container {
    width: 100%;
  }

}


@media(hover: hover) {

  .hs-tag-close:hover {

    .hstc-bg-dot {
      width: 48px;
      height: 48px;
      opacity: .17;
    }

  }

}



</style>