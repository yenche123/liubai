<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useLpMain } from "./tools/useLpMain";

const { t } = useI18n()
const {
  lpSelectsEl,
  lpmData,
  onTapSelect,
} = useLpMain()

</script>
<template>

  <!-- Email / 第三方 等选项-->
  <div class="lp-selects" ref="lpSelectsEl">

    <!-- Email -->
    <div class="lps-item lps-item-1" @click.stop="onTapSelect(1)">
      <span>{{ t('login.email')}}</span>
    </div>

    <!-- 第三方 -->
    <div class="lps-item lps-item-2" @click.stop="onTapSelect(2)">
      <span>{{ t('login.third_party')}}</span>
    </div>

    <!-- 指示器 -->
    <div class="lp-indicator"></div>

  </div>

  <!-- email view -->
  <div class="lp-view" v-show="lpmData.current === 1">
  
  
  </div>

  <!-- third-party view -->
  <div class="lp-view" v-show="lpmData.current === 2">
  
  
</div>


</template>
<style scoped lang="scss">

.lp-selects {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}

.lps-item {
  width: 48%;
  max-width: 220px;
  height: 50px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  transition: .15s;
  z-index: 90;
  cursor: pointer;
}

.lp-indicator {
  position: absolute;
  top: 0;
  left: v-bind("lpmData.indicatorData.left");
  width: v-bind("lpmData.indicatorData.width");
  height: 100%;
  z-index: 80;
  background-color: var(--primary-hover);
  opacity: .08;
  border-radius: 4px;
  transition: .3s;
}


.lp-view {
  width: 100%;
  padding-block-start: 10px;
  padding-block-end: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}



@media(hover: hover) {
  .lps-item:hover {
    font-size: calc(var(--desc-font) + 2px);
  }
}



</style>