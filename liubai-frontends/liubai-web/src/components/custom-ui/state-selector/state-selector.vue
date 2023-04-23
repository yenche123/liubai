<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initStateSelector } from "./index"

const {
  list,
  enable,
  show,
  hasRemoveBtn,
  onTapItem,
  onTapMask,
  onTapRemove,
  TRANSITION_DURATION: transDuration,
} = initStateSelector()

const { t } = useI18n()

</script>
<template>

  <div v-if="enable" class="ss-container"
  >

    <div class="ss-bg"
      :class="{ 'ss-bg_show': show }"
      @click="onTapMask"
    ></div>

    <div class="ss-box"
      :class="{ 'ss-box_show': show }"
    >

      <!-- 标题 (+ 移除) -->
      <div class="ss-first-bar">
        <div class="ss-title">
          <span>{{ t('thread_related.select_state') }}</span>
        </div>
        <div class="ssf-footer" v-if="hasRemoveBtn">
          <CustomBtn type="other" size="mini" @click="onTapRemove">
            <span>{{ t('common.remove') }}</span>
          </CustomBtn>
        </div>
      </div>

      <!-- 列表 -->
      <div class="ss-list">
        <template v-for="(item, index) in list" :key="item.id">
          <div class="ss-item" @click="onTapItem(index)">

            <!-- 状态颜色 -->
            <div class="ssi-color"
              :style="{ 'background-color': item.colorShow }"
            ></div>

            <!-- 状态文字 -->
            <div class="ssi-text">
              <span v-if="item.text">{{ item.text }}</span>
              <span v-else-if="item.text_key">{{ t(item.text_key) }}</span>
            </div>

            <!-- 尾部 -->
            <div class="ssi-footer">
              <div class="ssi-select-box">
                <div class="ssi-select-dot" :class="{ 'ssisd-selected': item.selected }"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="ss-virtual"></div>

    </div>

  </div>


</template>
<style scoped lang="scss">

.ss-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4750;
}

.ss-bg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: var(--popup-bg);
  opacity: 0;
  transition: .15s;
}

.ss-bg_show {
  opacity: 1;
}

.ss-box {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  position: relative;
  will-change: transform;
  transform: translateY(100%);
  opacity: 0;
  background-color: var(--card-bg);
  overflow: hidden;
  transition: v-bind("transDuration + 'ms'");
  user-select: none;
}

.ss-box_show {
  transform: translateY(0);
  opacity: 1;
}

.ss-first-bar {
  width: 100%;
  padding: 24px 20px 16px 24px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.ss-title {
  font-size: var(--head-font);
  color: var(--main-text);
  font-weight: 700;
}

.ssf-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.ss-list {
  width: 100%;
  overflow-y: auto;
  max-height: 52vh;
  max-height: 52dvh;
  position: relative;
}

.ss-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}


.ss-item {
  width: 100%;
  padding-inline-start: 24px;
  padding-inline-end: 20px;
  height: 56px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  transition: .12s;
  cursor: pointer;
}

.ssi-color {
  width: 12px;
  height: 12px;
  overflow: hidden;
  border-radius: 50%;
  margin-inline-end: 20px;
}

.ssi-text {
  font-size: var(--desc-font);
  color: var(--main-normal);
}

.ssi-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.ssi-select-box {
  width: 16px;
  height: 16px;
  border: 2px solid var(--main-code);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.ssi-select-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--main-code);
  opacity: 0;
  transition: .1s;
}

.ssisd-selected {
  opacity: 1;
}

.ss-virtual {
  width: 100%;
  height: 20px;
}

@media(hover: hover) {
  .ss-item:hover {
    opacity: .7;
  }
}

.ss-item:active {
  opacity: .7;
}


/** 移动设备时 */
@media screen and (max-width: 500px) {

  .ss-container {
    align-items: flex-end;
  }

  .ss-box {
    max-width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

@media screen and (max-width: 320px) {

  .ss-first-bar {
    padding: 24px 16px 16px 20px;
  }

  .ss-title {
    font-size: var(--title-font);
  }

  .ss-item {
    padding-inline-start: 20px;
    padding-inline-end: 20px;
    height: 50px;
  }

  .ssi-color {
    width: 10px;
    height: 10px;
  }

  .ssi-text {
    font-size: var(--btn-font);
  }

  .ssi-select-box {
    width: 14px;
    height: 14px;
    border: 2px solid var(--main-code);
  }

  .ssi-select-dot {
    width: 7px;
    height: 7px;
  }
  
}


</style>