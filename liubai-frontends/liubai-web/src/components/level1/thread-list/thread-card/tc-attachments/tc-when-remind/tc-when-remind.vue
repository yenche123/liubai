<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps({
  title: String,
  iconName: String,
  canHover: Boolean,
  color: String,
  labelKey: String,
})

const { t } = useI18n()

</script>
<template>

  <div class="tcwr-item" :class="{ 'liu-hover': canHover }">
    <div class="tcwr-icon">
      <svg-icon :name="iconName" class="tcwr-svgicon" :color="color"></svg-icon>
    </div>
    <div class="tcwr-title" :aria-label="labelKey ? t(labelKey) : ''">
      <span>{{ title }}</span>
    </div>
  </div>

</template>
<style lang="scss" scoped>
.tcwr-item {
  display: flex;
  align-items: center;
  width: min-content;
  min-width: 160px;
  height: 36px;
  border-radius: 10px;
  padding-inline-end: 10px;
  overflow: hidden;

  .tcwr-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 4px;
    padding-block-end: 2px;

    .tcwr-svgicon {
      width: 20px;
      height: 20px;
    }
  }

  .tcwr-title {
    font-size: var(--btn-font);
    font-weight: 400;
    color: var(--main-code);
    user-select: none;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>