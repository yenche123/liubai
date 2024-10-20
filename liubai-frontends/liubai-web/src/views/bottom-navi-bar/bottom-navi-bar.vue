<script lang="ts" setup>
import { useBottomNaviBar } from "./tools/useBottomNaviBar"

const { bnbData } = useBottomNaviBar()

</script>
<template>

  <div class="bnb-container"
    :class="{ 'bnb-container_show': bnbData.show }"
  >
    <!-- content area -->
    <div class="bnb-box">

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
}

.bnb-container_show {
  transform: translateY(0);
}



.bnb-virtual {
  width: 100%;
  height: 20px;
}

@media screen and (min-height: 800px) {

  /** the height of home indicator of iPhone is 34px 
  * from https://screensizes.app/?model=iphone-15
  */
  .bnb-virtual {
    height: 40px;
  }

}

</style>