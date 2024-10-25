<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initHashtagEditor } from "./tools/useHashtagEditor"
import HashtagList from "./hashtag-list/hashtag-list.vue";
import HashtagEmoji from "./hashtag-emoji/hashtag-emoji.vue";

const {
  inputEl,
  hteData,
  onTapMask,
  onTapItem,
  onInput,
  onFocus,
  onBlur,
  onEmojiChange,
} = initHashtagEditor()

const { t } = useI18n()

const onMouseEnterItem = (index: number) => {
  hteData.selectedIndex = index
}

</script>
<template>

  <div v-if="hteData.enable" class="hte-container" 
    :class="{ 'hte-container_show': hteData.show }"
  >

    <div class="hte-bg" @click="onTapMask" />

    <div class="hte-box">

      <!-- 第一行: 图标 + 输入框 -->
      <div class="hte-bar">

        <!-- search 模式，仅显示一个 # 字符 -->
        <div class="hteb-box" v-if="hteData.mode === 'search'">
          <svg-icon name="tag" class="hteb-icon" color="var(--main-normal)"></svg-icon>
        </div>
        <!-- edit 模式，允许被点击-->
        <HashtagEmoji v-else @emojichange="onEmojiChange" 
          :has-emoji="Boolean(hteData.emoji)"
        >
          <div class="liu-hover hteb-box">
            <svg-icon 
              v-if="!hteData.emoji" 
              name="tag" 
              class="hteb-icon" color="var(--main-normal)"
            ></svg-icon>
            <span v-else>{{ hteData.emoji }}</span>
          </div>
        </HashtagEmoji>
        
        <input ref="inputEl" 
          class="hteb-input" 
          v-model="hteData.inputTxt" 
          :maxlength="50"
          :placeholder="t('tip.tag_ph')" 
          @input="onInput" @focus="onFocus" @blur="onBlur" 
          autocomplete="nope" 
        />

      </div>

      <!-- 第二行: 错误提示 -->
      <div v-if="hteData.errCode > 0" class="liu-no-user-select hte-err">
        <span>*</span>
        <span v-if="hteData.errCode === 1">{{ t('tip.no_strange_char') }}</span>
      </div>

      <!-- 第三行: 创建标签 -->
      <div v-else-if="hteData.newTag" class="hte-create-box">
        <div class="liu-no-user-select hte-create" 
          :class="{ 'hte-create_selected': hteData.selectedIndex === -1 }"
          @click="() => onTapItem(-1)" 
          @mouseenter="() => onMouseEnterItem(-1)"
        >
          <div class="htec-icon">
            <svg-icon name="add" color="var(--main-normal)" class="htec-svgicon"></svg-icon>
          </div>
          <div class="hte-create-title">
            <span>{{ t('tip.add_tag', { tag: hteData.newTag }) }}</span>
          </div>
        </div>
      </div>

      <!-- 第四部分: 搜索结果 -->
      <HashtagList v-if="hteData.mode === 'search' && hteData.list.length > 0" 
        :list="hteData.list"
        :selected-index="hteData.selectedIndex" 
        @mouseenteritem="onMouseEnterItem" 
        @tapitem="onTapItem"
      ></HashtagList>

    </div>


  </div>

</template>
<style scoped lang="scss">
.hte-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5100;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: v-bind("hteData.transDuration + 'ms'");

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
}


.hte-box {
  z-index: 5102;
  margin-top: 18vh;
  margin-top: 18dvh;
  width: 90vw;
  max-width: 750px;
  border-radius: 18px;
  box-shadow: var(--card-shadow-2);
  position: relative;
  overflow: hidden;
  transition: .3s;

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

.hte-create-box {
  width: 100%;
  box-sizing: border-box;
  padding: 0px 10px 10px;
  position: relative;
}

.hte-create {
  border-radius: 10px;
  overflow: hidden;
  min-height: 56px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  transition: .02s;
  cursor: pointer;
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
    background-color: var(--card-bg);
    opacity: .6;
  }
}

.htec-icon {
  width: 38px;
  height: 38px;
  margin-inline-end: 8px;
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


.hte-bar {
  height: 72px;
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

.hteb-box {
  width: 66px;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--main-normal);
  font-size: var(--head-font);

  .hteb-icon {
    width: 33px;
    height: 33px;
  }

}

.hteb-input {
  font-size: var(--title-font);
  color: var(--main-normal);
  line-height: 1.75;
  width: calc(100% - 100px);
  caret-color: var(--primary-color);

  &::selection {
    background-color: var(--select-bg);
  }

  &::-webkit-input-placeholder {
    color: var(--main-note)
  }
}


.hte-err {
  position: relative;
  min-height: 30px;
  margin-inline-start: 66px;
  width: calc(100% - 86px);
  padding-block-end: 20px;
  font-size: var(--btn-font);
  color: var(--liu-quote);
}


@media screen and (max-width: 550px) {

  .hte-box {
    margin-top: 12vh;
    margin-top: 12dvh;
    border-radius: 14px;
  }

}


@media screen and (max-width: 480px) {

  .hte-box {
    margin-top: 8vh;
    margin-top: 8dvh;
    border-radius: 10px;
  }

  .hte-bar {
    height: 66px;
  }

  .hteb-input {
    width: calc(100% - 90px);
    font-size: var(--desc-font);
  }

  .hteb-box {
    height: 60px;
    width: 60px;

    .hteb-icon {
      width: 30px;
      height: 30px;
    }
  }

  .hteb-input {
    font-size: var(--desc-font);
  }

  .hte-create {
    min-height: 50px;
  }

  .htec-icon {
    width: 32px;
    height: 32px;

    .htec-svgicon {
      width: 20px;
      height: 20px;
    }
  }

  .hte-create-title {
    font-size: var(--btn-font);
  }

  .hte-err {
    margin-inline-start: 60px;
    width: calc(100% - 80px);
    font-size: var(--mini-font);
    padding-block-end: 10px;
  }

}

</style>