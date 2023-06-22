<script setup lang="ts">
// 内容（动态 or 评论）操作面板:
// 8 个表态、回复、分享、查看详情、举报
// 其中，回复、分享、查看详情和举报，不见得存在
import { useI18n } from "vue-i18n";
import { initContentPanel } from "./tools/useContentPanel"

const { 
  TRANSITION_DURATION,
  cpData,
  onTapCancel,
  onMouseEnterEmoji,
  onMouseLeaveEmoji,
} = initContentPanel()
const { t } = useI18n()

const iconColor = `var(--other-btn-text)`

</script>
<template>

  <!-- 以移动端先进行布局，最后再适配非移动端的模式 -->
  <div class="cp-container" v-if="cpData.enable">

    <div class="cp-bg" 
      :class="{ 'cp-bg_show': cpData.show }"
      @click.stop="onTapCancel"
    ></div>

    <div class="cp-box"
      :class="{ 'cp-box_show': cpData.show }"
    >

      <div class="cp-emojis">

        <template v-for="(item, index) in cpData.emojiList" :key="item.iconName">
          <div class="cp-emoji-item"
            @mouseenter="() => onMouseEnterEmoji(index)"
            @mouseleave="() => onMouseLeaveEmoji(index)"
          >
            <svg-icon :name="item.iconName" 
              class="cp-svg-emoji"
              :style="{ 'filter': item.currentFilter }"
              :coverFillStroke="false"
            ></svg-icon>
          </div>
        </template>

      </div>
      
      <div class="cp-menu" v-if="!cpData.onlyReaction">

        <!-- 回复、分享 -->
        <div class="cp-reply-share">

          <div class="cp-btn">
            <div class="cp-icon">
              <svg-icon name="comment" class="cp-svg-icon"
                :color="iconColor"
              ></svg-icon>
            </div>
            <div class="cp-title">
              <span>{{ t('common.reply') }}</span>
            </div>
          </div>

          <div class="cp-btn">
            <div class="cp-icon">
              <svg-icon name="share" class="cp-svg-icon"
                :color="iconColor"
              ></svg-icon>
            </div>
            <div class="cp-title">
              <span>{{ t('common.share') }}</span>
            </div>
          </div>

        </div>

        <!-- 查看详情、删除（or 举报） -->
        <div class="cp-footer">

          <div class="cpf-detail">
            <div class="cp-icon">
              <svg-icon name="desc_600" class="cp-svg-icon"
                :color="iconColor"
              ></svg-icon>
            </div>
            <div class="cp-title">
              <span>{{ t('common.view_detail') }}</span>
            </div>
          </div>

          <div class="liu-hover cpf-last">
            <svg-icon name="report_600"
              :color="iconColor"
              class="cpfl-svg-icon"
            ></svg-icon>
          </div>
          
        </div>

      </div>


    </div>

  </div>


</template>
<style scoped lang="scss">

.cp-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
  z-index: 4500;

  .cp-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
    z-index: 4505;
    opacity: 0;
    transition: v-bind("TRANSITION_DURATION + 'ms'");

    &.cp-bg_show {
      opacity: 1;
    }
  }
}

.cp-box {
  z-index: 4510;
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(100%);
  opacity: .66;

  &::before {
    background-color: var(--cui-modal);
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  &.cp-box_show {
    opacity: 1;
    transform: translateY(0);
  }
}

.cp-emojis {
  display: grid;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 60px 60px;
  gap: 10px;
}

.cp-emoji-item {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.cp-svg-emoji {
  width: 36px;
  height: 36px;
  will-change: filter;
  transition: filter 222ms;
}


.cp-menu {
  position: relative;
  padding: 0 16px 24px 16px;
  box-sizing: border-box;
  width: 100%;
}

.cp-reply-share {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
}

.cp-btn {
  flex: 1;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
  color: var(--other-btn-text);
  background-color: var(--cui-modal-other-btn-bg);
  cursor: pointer;
  border-radius: 8px;
  transition: .2s;

  &:active {
    background-color: var(--cui-modal-other-btn-hover);
  }
}

.cp-btn:first-child {
  margin-inline-end: 7px;
}

.cp-icon {
  margin-inline-start: 5px;
  width: 50px;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .cp-svg-icon {
    width: 24px;
    height: 24px;
  }
}

.cp-title {
  font-size: var(--btn-font);
  color: var(--other-btn-text);
}

.cp-footer {
  width: 100%;
  position: relative;
  display: flex;
  margin-block-start: 7px;
}

.cpf-detail {
  flex: 1;
  margin-inline-end: 7px;
  height: 50px;
  display: flex;
  align-items: center;
  color: var(--other-btn-text);
  background-color: var(--cui-modal-other-btn-bg);
  cursor: pointer;
  border-radius: 8px;
  transition: .2s;

  &:active {
    background-color: var(--cui-modal-other-btn-hover);
  }
}

.cpf-last {
  width: 50px;
  height: 50px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;

  .cpfl-svg-icon {
    width: 24px;
    height: 24px;
  }
}


/** 平板、桌面端的情况  */
@media screen and (min-width: 500px) {

  .cp-container {
    justify-content: center;
  }

  .cp-box {
    border-radius: 24px;
    width: 60%;
    min-width: 430px;
    max-width: 630px;
    transform: translateY(11%);
    opacity: 0;

    &.cp-box_show {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cp-emojis {
    padding: 20px;
  }

  .cp-menu {
    padding: 0 24px 24px 24px;
  }
  
}


/** 小屏幕适配  */
@media screen and (max-width: 333px) {

  .cp-svg-emoji {
    width: 32px;
    height: 32px;
  }

  .cp-reply-share {
    flex-direction: column;
  }

  .cp-btn {
    flex: none;
    height: 48px;
  }

  .cp-btn:first-child {
    margin-inline-end: 0;
    margin-block-end: 7px;
  }

  .cp-icon {
    width: 48px;
    height: 48px;

    .cp-svg-icon {
      width: 24px;
      height: 24px;
    }
  }

  .cpf-last {
    width: 48px;
    height: 48px;

    .cpfl-svg-icon {
      width: 24px;
      height: 24px;
    }
  }
}

@media(hover: hover) {
  .cp-btn:hover, .cpf-detail:hover {
    background-color: var(--cui-modal-other-btn-hover);
  }
}



</style>