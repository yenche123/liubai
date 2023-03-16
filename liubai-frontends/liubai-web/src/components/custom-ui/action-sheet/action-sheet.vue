<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initActionSheet } from "./index"

const {
  TRANSITION_DURATION,
  enable,
  show,
  asData,
  onTapMask,
  onTapCancel,
  onTapItem
} = initActionSheet()

const { t } = useI18n()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div v-if="enable" class="as-container">

    <div class="as-bg"
      :class="{ 'as-bg_show': show }"
      @click="onTapMask"
    ></div>

    <div class="as-box"
      :class="{ 'as-box_show': show }"
    >

      <div class="as-main-box">
        <div v-if="asData.title_key" class="as-title">
          <span>{{ t(asData.title_key) }}</span>
        </div>

        <template v-for="(item, index) in asData.itemList" :key="item.text_key">
          <div class="as-item" @click="onTapItem(index)">

            <div class="as-item-box">

              <div v-if="item.iconName" class="as-item-icon">
                <svg-icon :name="item.iconName" class="as-item-svg-icon"
                  :color="item.color ? item.color : iconColor"
                ></svg-icon>
              </div>

              <div class="as-item-text"
                :class="{ 'asit-with-icon': item.iconName }"
              >
                <span v-if="item.text">{{ item.text }}</span>
                <span v-else-if="item.text_key">{{ t(item.text_key) }}</span>
              </div>

            </div>
            
          </div>
        </template>

      </div>


      <div class="as-cancel-box" @click="onTapCancel">
        <span>{{ t('common.cancel') }}</span>
      </div>

    </div>


  </div>

</template>
<style scoped lang="scss">

.as-container {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5050;
  display: flex;
  align-items: center;
  justify-content: center;

  .as-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 5051;
    background-color: var(--popup-bg);
    transition: v-bind("TRANSITION_DURATION + 'ms'");
    opacity: 0;
  }

  .as-bg_show {
    opacity: 1;
  }

}

.as-box {
  width: 96%;
  max-width: 480px;
  position: relative;
  z-index: 5055;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(50%);
  opacity: 0;

  .as-main-box {
    width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 24px;

    .as-title {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: var(--mini-font);
      color: var(--liu-quote);
      border-bottom: 0.5px solid var(--line-default);
      background-color: var(--cui-actionsheet-bg);
      font-weight: 700;
    }

    .as-item {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 0.5px solid var(--line-default);
      background-color: var(--cui-actionsheet-bg);
      transition: .15s;
      cursor: pointer;
      user-select: none;
      position: relative;
      padding-inline-start: 12px;
      padding-inline-end: 12px;
      box-sizing: border-box;

      &:hover {
        opacity: .95;
      }

    }

    .as-item:last-child {
      border-bottom: 0;
    }

  }
}

.as-item-box {
  min-width: 190px;
  max-width: 100%;
  position: relative;
  display: flex;

  .as-item-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;

    .as-item-svg-icon {
      width: 24px;
      height: 24px;
    }
  }

  .as-item-text {
    text-align: center;
    font-size: var(--inline-code-font);
    color: var(--main-normal);
    flex: 1;
    line-height: 32px;
  }

  .asit-with-icon {
    padding-inline-end: 32px;
  }

}

.as-cancel-box {
  margin-top: 10px;
  margin-bottom: 32px;
  width: 100%;
  height: 56px;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--desc-font);
  color: var(--primary-color);
  font-weight: 700;
  background-color: var(--card-bg);
  transition: .15s;
  z-index: 5055;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  display: none;

  &:hover {
    opacity: .95;
  }
}

.as-box_show {
  transform: translateY(0);
  opacity: 1;
}

@media screen and (max-width: 500px) {
  .as-container {
    align-items: flex-end;
  }

  .as-cancel-box {
    display: flex;
  }
}


</style>