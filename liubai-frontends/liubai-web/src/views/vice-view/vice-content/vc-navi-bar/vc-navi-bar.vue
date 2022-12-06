<script lang="ts" setup>
import cfg from "../../../../config"
import { useI18n } from 'vue-i18n';
const { t } = useI18n()

const emits = defineEmits<{
  (event: "tapback"): void
  (event: "tapclose"): void
  (event: "tapopeninnew"): void
}>()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="vc-navi-bar">

    <!-- 返回键 -->
    <div class="liu-hover vc-navi-btn" :aria-label="t('common.back')" @click="emits('tapback')">
      <svg-icon class="vc-navi-icon" name="arrow-back" :color="iconColor"></svg-icon>
    </div>

    <!-- 关闭按钮 -->
    <div class="liu-hover vc-navi-btn" :aria-label="t('common.close')" @click="emits('tapclose')">
      <svg-icon class="vc-navi-icon" name="close" :color="iconColor"></svg-icon>
    </div>

    <div class="vc-navi-footer">
      <!-- 用新分页打开 -->
      <div class="liu-hover vc-navi-btn" :aria-label="t('common.open_in_new')" @click="emits('tapopeninnew')">
        <svg-icon class="vcn-open-new" name="open_in_new" :color="iconColor"></svg-icon>
      </div>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.vc-navi-bar {
  width: 100%;
  height: v-bind("cfg.vice_navi_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
}

.liu-hover::before {
  border-radius: 0;
}

.vc-navi-btn {
  width: v-bind("cfg.vice_navi_height + 'px'");
  height: v-bind("cfg.vice_navi_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .vc-navi-icon {
    width: 50%;
    height: 50%;
  }

  .vcn-open-new {
    width: 40%;
    height: 40%;
  }
}

.vc-navi-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}


</style>