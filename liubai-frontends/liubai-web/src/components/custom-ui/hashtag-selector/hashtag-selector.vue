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
  tryToFinish,
} = initHashtagSelector()

const { t } = useI18n()

</script>
<template>
  <!-- 外层壳: 当溢出时，可以滚动 -->
  <div v-if="hsData.enable" class="hashtag-selector-container" 
    :class="{ 'hs-container_show': hsData.show }"
  >

    <!-- 内层壳: 用 position: relative 使得其子元素 hs-bg 可以占满整个盒子 -->
    <!-- 水平居中: 在子元素声明 margin: 0 auto 来实现 -->
    <div class="hs-little-container">
      <div class="hs-bg" @click.stop="onTapPopup"></div>

      <div class="hs-virtual-zero"></div>

      <div class="hs-box">

        <!-- 取消、标题、确认 -->
        <div class="hs-bar">

          <custom-btn type="pure" size="mini" @click="onTapCancel">
            <span>{{ t('common.cancel') }}</span>
          </custom-btn>

          <div class="liu-no-user-select hs-title">
            <span>{{ t('tag_related.edit_tag') }}</span>
          </div>

          <custom-btn type="main" size="mini" :disabled="!hsData.canSubmit" @click="onTapConfirm">
            <span>{{ t('common.confirm') }}</span>
          </custom-btn>

        </div>

        <!-- 已添加的标签 -->
        <div class="hs-bar hs-tags" v-show="hsData.list.length > 0">

          <template v-for="(item, index) in hsData.list" :key="item.text">
            <div class="liu-no-user-select hs-tag">
              <span v-if="item.emoji" class="hs-tag-emoji">{{ item.emoji }}</span>
              <span>{{ item.text }}</span>
              <div class="hs-tag-close" @click.stop="() => onTapClear(index)">
                <div class="liu-flexible-dot_bg">
                  <div class="liu-flexible-dot_circle"></div>
                </div>
                <svg-icon name="close" class="hs-tag-close_svg" color="var(--liu-quote)"></svg-icon>
              </div>
            </div>
          </template>

        </div>

        <div class="hs-virtual"></div>

      </div>

      <!-- 输入框 + 搜索结果 -->
      <div class="hsir-container">
        <HsInputResults :list-added="hsData.list"
          @focusornot="onFocusOrNot"
          @tapitem="onTapItem"
          @toclose="onTapCancel"
          @trytofinish="tryToFinish"
        ></HsInputResults>
      </div>

      <div class="hs-virtual-two"></div>
    </div>

  </div>
</template>
<style scoped lang="scss">
.hashtag-selector-container {
  position: fixed;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  top: 0;
  left: 0;
  z-index: 5100;
  overflow: auto;
  opacity: 0;
  transition: v-bind("hsData.transDuration + 'ms'");
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &.hs-container_show {
    opacity: 1;
  }

  .hs-bg {
    z-index: 5101;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--popup-bg);
  }
}

.hs-little-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
}

.hs-virtual-zero {
  width: 100%;
  height: 14vh;
  height: 14dvh;
  transition: .3s;
}

.hs-box {
  z-index: 5102;
  margin: 0 auto;
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
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
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

.hsir-container {
  margin: 0 auto;
  z-index: 5103;
  position: relative;
  width: 90%;
  max-width: 500px;
  padding: 10px 20px;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-start: -78px;
}

.hs-virtual-two {
  width: 100%;
  height: 20px;
}

@media screen and (max-width: 600px) {
  .hs-virtual-zero {
    height: 10vh;
    height: 10dvh;
  }
}

@media screen and (max-width: 500px) {

  .hs-virtual-zero {
    height: 0;
  }

  .hs-box {
    width: 100%;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .hsir-container {
    width: 100%;
  }

}


@media(hover: hover) {

  .hs-tag-close:hover {

    .liu-flexible-dot_circle {
      width: 48px;
      height: 48px;
      opacity: .17;
    }

  }

}
</style>