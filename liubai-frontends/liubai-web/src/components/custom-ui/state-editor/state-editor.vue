<script lang="ts" setup>
import { COLORS } from './tools/color';
import { initStateEditor } from "./index"
import { useI18n } from 'vue-i18n';

const {
  TRANSITION_DURATION,
  enable,
  show,
  reData,
  onTapColor,
  onToggleShowIndex,
  onTapConfirm,
  onTapCancel,
} = initStateEditor()

const { t } = useI18n()

</script>
<template>

  <div v-if="enable" class="se-container"
    :class="{ 'se-container_show': show }"
  >

    <div class="se-bg" @click="onTapCancel"></div>

    <div class="se-box">

      <div class="se-virtual" style="height: 30px"></div>

      <!-- 状态名 -->
      <div class="se-bar">
        <div class="seb-hd">
          <span>{{ t('state_related.state_title') }}</span>
        </div>

        <input v-model="reData.text" class="se-input" 
          :placeholder="t('state_related.state_ph')"
        />

      </div>

      <!-- 是否展示在首页 -->
      <div class="se-bar">

        <div class="seb-hd">
          <span>{{ t('state_related.state_showIndex') }}</span>
        </div>

        <div class="seb-footer">
          <liu-switch :checked="reData.showInIndex" 
            @change="onToggleShowIndex($event.checked)"
          ></liu-switch>
        </div>

      </div>

      <div class="se-color-title">
        <span>{{ t('state_related.state_color') }}</span>
      </div>

      <!-- 十个颜色区域 -->
      <div class="se-color-box">
        <template v-for="(item, index) in COLORS" :key="item">
          <div class="se-a-color"
            :class="{ 'se-a-color_selected': item === reData.color }"
            @click="onTapColor(item)"
          >
            <div class="seac-color"
              :style="{
                backgroundColor: 'var(' + item + ')'
              }"
            ></div>
          </div>
        </template>
      </div>

      <!-- 确定/取消 -->
      <div class="se-btns">
        <CustomBtn size="common" type="other" @click="onTapCancel"
          class="se-btn"
        >
          <span>{{ t('common.cancel') }}</span>
        </CustomBtn>

        <CustomBtn size="common" @click="onTapConfirm" 
          :disabled="!reData.canSubmit"
          class="se-btn"
        >
          <span>{{ t('common.confirm') }}</span>
        </CustomBtn>
      </div>

    </div>

  </div>


</template>
<style lang="scss" scoped>

.se-container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4800;
  opacity: 0;
  transition: v-bind("TRANSITION_DURATION + 'ms'");

  &.se-container_show {
    opacity: 1;
  }

  .se-bg {
    z-index: 4801;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
  }
}

.se-box {
  width: 96%;
  max-width: 700px;
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;
  border-radius: 30px;
  background-color: var(--card-bg);
  position: relative;
  z-index: 4802;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.se-virtual {
  width: 100%;
}

.se-bar {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 30px 34px 34px;
  box-sizing: border-box;
  position: relative;
}

.seb-hd {
  color: var(--main-text);
  font-size: var(--title-font);
  font-weight: 700;
  line-height: 1.5;
  padding-inline-end: 10px;
}

.se-input {
  text-align: right;
  width: 50%;
  flex: 1 0 100px;
  color: var(--main-normal);
  font-size: var(--desc-font);
  line-height: 1.5;

  &::-webkit-input-placeholder {
    color: var(--main-note);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.seb-footer {
  flex: 1 0 auto;
  display: flex;
  justify-content: flex-end;
}

.se-color-title {
  color: var(--main-text);
  font-size: var(--title-font);
  font-weight: 700;
  line-height: 1.5;
  padding-inline-start: 34px;
  padding-block-end: 10px;
}

.se-color-box {
  display: grid;
  width: 100%;
  padding: 0 24px 24px 24px;
  box-sizing: border-box;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: 60px 60px;
  justify-items: center;
  align-items: center;
}

.se-a-color {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0px solid transparent;
  cursor: pointer;
  transition: border .12s;

  &.se-a-color_selected {
    border: 3px solid var(--main-normal);
  }
}

.seac-color {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  overflow: hidden;
}

.se-btns {
  padding: 0 30px 34px 30px;
  display: flex;
  justify-content: space-evenly;
}

@media screen and (max-width: 450px) {
  .se-btns {
    justify-content: space-between;
  }

  .se-btn {
    min-width: 45%;
  }
}


@media screen and (max-width: 400px) {
  .se-box {
    border-radius: 24px;
  }

  .se-bar {
    padding: 0 20px 24px 24px;
  }

  .seb-hd {
    padding-inline-end: 5px;
    font-size: var(--desc-font);
  }

  .se-input {
    font-size: var(--btn-font);
  }

  .se-color-title {
    font-size: var(--desc-font);
    padding-inline-start: 24px;
    padding-block-end: 5px;
  }

  .se-color-box {
    grid-template-rows: 50px 50px;
  }

  .se-a-color {
    width: 28px;
    height: 28px;

    &.se-a-color_selected {
      border: 3px solid var(--main-normal);
    }
  }

  .seac-color {
    width: 20px;
    height: 20px;
  }

  .se-btns {
    padding-block-end: 24px;
  }

}

</style>