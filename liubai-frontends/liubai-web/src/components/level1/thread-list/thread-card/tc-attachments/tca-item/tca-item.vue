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

  <div class="tca-item" :class="{ 'liu-hover': canHover }">
    <div class="tca-icon">
      <svg-icon :name="iconName" class="tca-svgicon" :color="color"></svg-icon>
    </div>
    <div class="liu-no-user-select tca-title" 
      :aria-label="labelKey ? t(labelKey) : ''"
    >
      <span>{{ title }}</span>
    </div>
  </div>

</template>
<style lang="scss" scoped>
.tca-item {
  display: flex;
  width: fit-content;
  min-width: 160px;
  border-radius: 10px;
  padding-inline-end: 10px;
  overflow: hidden;

  .tca-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 4px;
    padding-block-end: 2px;
    flex: none;

    .tca-svgicon {
      width: 20px;
      height: 20px;
    }
  }

  .tca-title {
    flex: 1;
    flex-wrap: wrap;
    font-size: var(--btn-font);
    font-weight: 400;
    color: var(--main-code);
    line-height: 22px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding-block-start: 5px;
  }
}

</style>