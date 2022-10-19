<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SvgIcon from '../../../assets/svg-icon.vue';
import cfg from "../../../config"
import { useRouteAndLiuRouter } from '../../../routes/liu-router';
// 侧边栏: 标签

const { router } = useRouteAndLiuRouter()
const { t } = useI18n()
const naviHeightPx = `${cfg.navi_height}px`

const onNaviBack = () => {
  router.naviBack()
}

</script>
<template>
  
  <div class="st-virtual"></div>

  <div class="liu-frosted-glass st-navibar">
    <div class="liu-hover st-navi-back" @click="onNaviBack">
      <SvgIcon class="st-navi-back-icon" name="arrow-back700" color="var(--main-text)"></SvgIcon>
    </div>
    <div class="st-navi-title">
      <span>{{ t("common.tags") }}</span>
    </div>
  </div>

  <div class="st-virtual-two"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

  <div class="st-box"></div>

</template>
<style scoped>

.st-virtual {
  width: 100%;
  height: 50px;
}

.st-navibar {
  position: sticky;
  top: 15px;
  width: 100%;
  height: v-bind("naviHeightPx");
  display: flex;
  align-items: center;
  user-select: none;
}

.st-navi-back {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  margin-left: 8px;
}

.st-navi-back-icon {
  width: 30px;
  height: 30px;
}

.st-navi-title {
  position: relative;
  font-size: var(--title-font);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
}

.st-virtual-two {
  width: 100%;
  height: 30px;
}

.st-box {
  width: 100%;
  height: 200px;
  margin-bottom: 50px;
  background-color: blanchedalmond;
  color: white;
  border-radius: 10px;
}

</style>