<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBottomNaviBar } from "./tools/useBottomNaviBar";

const { 
  bnbData,
  onTapSearch,
  onTapHome,
  onTapMine,
} = useBottomNaviBar()

const { t } = useI18n()

const color = "var(--main-code)"
const color_selected = "var(--main-normal)"

</script>
<template>

  <div class="liu-frosted-glass bnb-container"
    :class="{ 'bnb-container_show': bnbData.show }"
    ref="bottom-navi-bar"
  >
    <!-- content area -->
    <div class="liu-no-user-select bnb-box">

      <!-- search -->
      <div class="bnb-item">
        <div class="bnb-icon-box">
          <svg-icon name="search" class="bnb-icon_search" :color="color"></svg-icon>
        </div>
        <div class="bnb-text">
          <span>{{ t('common.search') }}</span>
        </div>
      </div>

      <!-- home -->
      <div class="bnb-item" :class="{ 'bnb-item_active': bnbData.currentState === 'index' }"
        @click.stop="onTapHome"
      >
        <div class="bnb-icon-box">
          <svg-icon class="bnb-icon bnb-icon_home"
            :name="bnbData.currentState === 'index' ? 'home_selected' : 'home'"
            :color="bnbData.currentState === 'index' ? color_selected : color"
          ></svg-icon>
        </div>
        <div class="bnb-text">
          <span>{{ t('common.home') }}</span>
        </div>
      </div>

      <!-- mine -->
      <div class="bnb-item" :class="{ 'bnb-item_active': bnbData.currentState === 'mine' }"
        @click.stop="onTapMine"
      >
        <div class="bnb-icon-box">
          <svg-icon class="bnb-icon"
            :name="bnbData.currentState === 'mine' ? 'mine_selected' : 'mine'"
            :color="bnbData.currentState === 'mine' ? color_selected : color"
          ></svg-icon>
        </div>
        <div class="bnb-text">
          <span>{{ t('common.mine') }}</span>
        </div>
      </div>

    </div>

    <!-- virtual area -->
    <div class="bnb-virtual"></div>
  </div>

</template>
<style scoped lang="scss">

.bnb-container {
  z-index: 730;
  position: fixed;
  transition: .3s;
  transform: translateY(110%);
  width: 100%;
  left: 0;
  bottom: 0;
  right: 0;

  &::before {
    -webkit-backdrop-filter: blur(0px);
    backdrop-filter: blur(0px);
    background: var(--frosted-glass-6);
  }
}

.bnb-container_show {
  transform: translateY(0);
}

.bnb-box {
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  position: relative;
}

/** Prioritize adaptation for devices 500px (inclusive) and below */
.bnb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-block: 10px;
  min-width: 90px;
  cursor: pointer;
}

.bnb-icon-box {
  width: 32px;
  height: 32px;
  margin-block-end: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bnb-icon {
  width: 30px;
  height: 30px;
}

.bnb-icon_search {
  width: 26px;
  height: 26px;
}


.bnb-text {
  font-size: var(--state-font);
  color: v-bind("color");
}

.bnb-item_active {
  .bnb-text {
    color: v-bind("color_selected");
  }
}



.bnb-virtual {
  width: 100%;
  height: 14px;
}

@media screen and (min-height: 800px) {

  /** the height of home indicator of iPhone is 34px 
  * from https://screensizes.app/?model=iphone-15
  */
  .bnb-virtual {
    height: 34px;
  }

}

@media screen and (min-width: 500px) {
  .bnb-item {
    flex-direction: row;
    min-width: 150px;
  }

  .bnb-icon-box {
    margin-inline-end: 10px;
    margin-block-end: 0;
  }

  .bnb-icon_home{
    margin-block-end: 2px;
  }

  .bnb-text {
    font-size: var(--btn-font);
  }
  
}


</style>