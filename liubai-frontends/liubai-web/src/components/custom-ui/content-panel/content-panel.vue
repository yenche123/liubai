<script setup lang="ts">
// 内容（动态 or 评论）操作面板:
// 8 个表态、回复、分享、查看详情、举报
// 其中，回复、分享、查看详情和举报，不见得存在
import { useI18n } from "vue-i18n";
import { initContentPanel } from "./tools/useContentPanel"

const { 
  TRANSITION_DURATION,
  cpData,
} = initContentPanel()
const { t } = useI18n()

const iconColor = `var(--main-normal)`

</script>
<template>

  <!-- 以移动端先进行布局，最后再适配非移动端的模式 -->
  <div class="cp-container" v-if="cpData.enable"
    :class="{ 'cp-container_show': cpData.show }"
  >

    <div class="cp-bg"></div>

    <div class="cp-box">

      <div class="cp-emojis">

        <template v-for="(item, index) in cpData.emojis" :key="index">
          <div class="liu-hover cp-emoji-item">
            <span>{{ item }}</span>
          </div>
        </template>

      </div>
      
      <div class="cp-menu" v-if="!cpData.onlyReaction">

        <!-- 回复、分享 -->
        <div class="cp-reply-share">

          <div class="liu-hover cp-btn">
            <div class="cp-icon">
              <svg-icon name="comment" class="cp-svg-icon"
                :color="iconColor"
              ></svg-icon>
            </div>
            <div class="cp-title">
              <span>{{ t('common.reply') }}</span>
            </div>
          </div>

          <div class="liu-hover cp-btn">
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

          <div class="liu-hover cpf-detail">
            <div class="cp-icon">
              <svg-icon name="description" class="cp-svg-icon"
                :color="iconColor"
              ></svg-icon>
            </div>
            <div class="cp-title">
              <span>{{ t('common.view_detail') }}</span>
            </div>
          </div>

          <div class="liu-hover cpf-last">
            <svg-icon name="cpfl-svg-icon"
              :color="iconColor"
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
  transition: v-bind(TRANSITION_DURATION + 'ms');
  opacity: 0;
  user-select: none;
  z-index: 4500;

  &.cp-container_show {
    opacity: 1;
  }

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
  }
}

.cp-box {
  z-index: 4510;
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 16px 16px 0 0;

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
  font-size: var(--title-font);
}

.cp-menu {
  position: relative;
  padding: 0 16px 16px 16px;
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
}

.cp-btn:first-child {
  margin-inline-end: 10px;
}

.cp-icon {
  width: 50px;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .cp-svg-icon {
    width: 26px;
    height: 26px;
  }
}

.cp-title {
  font-size: var(--btn-font);
  color: var(--main-normal);
}

.cp-footer {
  width: 100%;
  position: relative;
  display: flex;
}

.cpf-detail {
  flex: 1;
  margin-inline-end: 10px;
  height: 50px;
}

.cpf-last {
  width: 50px;
  height: 50px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;

  .cpfl-svg-icon {
    width: 26px;
    height: 26px;
  }
}


/** 平板、桌面端的情况  */
@media screen and (min-width: 500px) {

  .cp-container {
    justify-content: center;
  }

  .cp-box {
    border-radius: 10px;
    width: 60%;
    min-width: 450px;
    max-width: 750px;
  }

  .cp-emojis {
    padding: 20px;
  }

  .cp-emoji-item {
    font-size: var(--head-font);
  }
  
}


/** 小屏幕适配  */
@media screen and (max-width: 330px) {
  .cp-reply-share {
    flex-direction: column;
  }

  .cp-btn {
    flex: none;
    height: 48px;
  }

  .cp-btn:first-child {
    margin-inline-end: 0;
    margin-block-end: 10px;
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




</style>