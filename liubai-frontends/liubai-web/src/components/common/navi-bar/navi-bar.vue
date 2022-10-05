<script setup lang="ts">
import cfg from "../../../config"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

</script>
<template>

  <div class="nb-container">
    {{ t("hello.world") }}
  </div>

</template>
<style scoped>
.nb-container {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
  background-color: brown;
  position: absolute;
  top: 0;
  left: 0;
}

</style>