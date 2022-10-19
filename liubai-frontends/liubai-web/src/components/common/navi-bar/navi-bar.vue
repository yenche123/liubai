<script setup lang="ts">
import cfg from "../../../config"
import SvgIcon from "../../../assets/svg-icon.vue";
import { useRouteAndLiuRouter } from "../../../routes/liu-router";

const { router } = useRouteAndLiuRouter()
const props = defineProps({
  title: {
    type: String,
    default: ""
  }
})

const onTapBack = () => {
  router.naviBack()
}

</script>
<template>

  <div class="liu-frosted-glass nb-container">
    <div class="liu-hover nb-back-box" @click="onTapBack">
      <SvgIcon class="nb-back-icon" name="arrow-back700"></SvgIcon>
    </div>
    <div class="nb-title">
      <span>{{ title }}</span>
    </div>
  </div>

</template>
<style scoped>

.liu-frosted-glass::before {
  border-radius: 0;
  background-color: var(--frosted-glass-two);
}

.nb-container {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
}

.nb-back-box {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  margin-left: 8px;
}

.nb-back-icon {
  width: 30px;
  height: 30px;
}

.nb-title {
  position: relative;
  font-size: var(--title-font);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  user-select: none;
}



</style>