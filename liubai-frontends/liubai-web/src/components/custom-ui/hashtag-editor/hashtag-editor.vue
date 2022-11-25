<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initHtePicker } from "./index"
import HashtagList from "./hashtag-list/hashtag-list.vue";

const {
  inputEl,
  enable,
  show,
  TRANSITION_DURATION: tranMs,
  inputVal,
  emoji,
  errCode,
  newTag,
  list,
  selectedIndex,
  mode,
  onTapCancel,
  onTapItem,
  onInput,
} = initHtePicker()

const { t } = useI18n()

const onMouseEnterItem = (index: number) => {
  selectedIndex.value = index
}

</script>
<template>

  <div v-if="enable" class="hte-container" :class="{ 'hte-container_show': show }">

    <div class="hte-bg" @click="onTapCancel" />

    <div class="hte-box">

      <!-- 第一行: 图标 + 输入框 -->
      <div class="hte-bar">

        <div class="hteb-box">
          <svg-icon v-if="mode === 'search' || !emoji" name="tag" class="hteb-icon"
            color="var(--main-normal)"
          ></svg-icon>
          <span v-else>{{ emoji }}</span>
        </div>

        <input ref="inputEl" class="hteb-input" v-model="inputVal" :maxlength="50" :placeholder="t('tip.tag_ph')"
          @input="onInput" />

      </div>

      <!-- 第二行: 错误提示 -->
      <div v-if="errCode > 0" class="hte-err">
        <span>*</span>
        <span v-if="errCode === 1">{{ t('tip.no_strange_char') }}</span>
      </div>

      <!-- 第三行: 创建标签 -->
      <div v-else-if="newTag" class="hte-create-box">
        <div class="hte-create" :class="{ 'hte-create_selected': selectedIndex === -1 }" @click="() => onTapItem(-1)"
          @mouseenter="() => onMouseEnterItem(-1)">
          <div class="htec-icon">
            <svg-icon name="add" color="var(--main-normal)" class="htec-svgicon"></svg-icon>
          </div>
          <div class="hte-create-title">
            <span>{{ t('tip.add_tag', { tag: newTag }) }}</span>
          </div>
        </div>
      </div>

      <!-- 第四部分: 搜索结果 -->
      <HashtagList v-if="mode === 'search' && list.length > 0" :list="list" :selected-index="selectedIndex"
        @mouseenteritem="onMouseEnterItem" @tapitem="onTapItem"></HashtagList>

    </div>


  </div>

</template>
<style scoped lang="scss">
.hte-container {
  width: 100%;
  min-height: 100vh;
  max-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5100;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: v-bind("tranMs + 'ms'");

  &.hte-container_show {
    opacity: 1;
  }

  .hte-bg {
    z-index: 5101;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
  }

  .hte-box {
    z-index: 5102;
    margin-top: 20vh;
    width: 90vw;
    max-width: 750px;
    border-radius: 20px;
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


    .hte-bar {
      height: 90px;
      display: flex;
      align-items: center;
      flex: 1;
      position: relative;

      .hteb-box {
        width: 90px;
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--main-normal);
        font-weight: 700;
        font-size: var(--title-font);

        .hteb-icon {
          width: 40px;
          height: 40px;
        }

      }

      .hteb-input {
        font-size: var(--title-font);
        color: var(--main-normal);
        line-height: 1.75;
        width: calc(100% - 100px);
      }

      .hteb-input::selection {
        background-color: var(--select-bg);
      }

      .hteb-input::-webkit-input-placeholder {
        color: var(--main-note)
      }

    }

    @media screen and (max-width: 380px) {

      .hte-bar {
        height: 80px;

        .hteb-box {
          height: 80px;
          width: 80px;

          .hteb-icon {
            width: 32px;
            height: 32px;
          }

        }

        .hteb-input {
          width: calc(100% - 90px);
          font-size: var(--desc-font);
        }
      }
    }

    .hte-err {
      position: relative;
      height: 30px;
      margin-inline-start: 90px;
      padding-bottom: 20px;
      font-size: var(--btn-font);
      color: var(--main-note);
    }

    .hte-create-box {
      width: 100%;
      box-sizing: border-box;
      padding: 0px 10px 10px;
      position: relative;

      .hte-create {
        border-radius: 10px;
        overflow: hidden;
        height: 60px;
        display: flex;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        padding: 10px 10px;
        transition: .02s;
        cursor: pointer;
        user-select: none;

        .htec-icon {
          width: 38px;
          height: 38px;
          margin-inline-end: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;

          .htec-svgicon {
            width: 24px;
            height: 24px;
          }
        }

        .hte-create-title {
          font-size: var(--desc-font);
          color: var(--main-normal);
          position: relative;
        }

      }

      .hte-create_selected {
        position: relative;
        overflow: hidden;
        box-shadow: 1px 2px 3px rgba(0, 0, 0, .03);

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--bg-color);
          opacity: .6;
        }
      }

    }


  }

}
</style>