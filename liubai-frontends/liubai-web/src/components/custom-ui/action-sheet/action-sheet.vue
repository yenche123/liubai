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
            <span>{{ t(item.text_key) }}</span>
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
    border-radius: 20px;

    .as-title {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: var(--mini-font);
      color: var(--main-tip);
      border-bottom: 0.5px solid var(--line-default);
      font-weight: 700;
      background-color: var(--on-primary);
    }

    .as-item {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: var(--desc-font);
      color: var(--main-normal);
      border-bottom: 0.5px solid var(--line-default);
      background-color: var(--on-primary);
      transition: .15s;

      &:hover {
        opacity: .7;
      }
    }

    .as-item:last-child {
      border-bottom: 0;
    }

  }

  .as-cancel-box {
    margin-top: 10px;
    margin-bottom: 40px;
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: var(--desc-font);
    color: var(--primary-color);
    font-weight: 700;
    background-color: var(--card-bg);
    transition: .15s;
    z-index: 5055;

    &:hover {
      opacity: .7;
    }
  }
}

.as-box_show {
  transform: translateY(0);
  opacity: 1;
}

@media screen and (max-width: 500px) {
  .as-container {
    justify-content: flex-end;
  }

}


</style>