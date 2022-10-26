<script setup lang="ts">
import { computed, inject, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { mvKey } from "../../utils/provide-keys"

defineProps({
  show: {
    type: Boolean,
    default: false,
  }
})

const critialPoint = 600
const mvRef = inject(mvKey) as Ref<number>
const containerMaxHeightPx = computed(() => {
  if(mvRef.value < critialPoint) return 400
  return 200 
})
const { t } = useI18n()

const default_color = "var(--other-btn-text)"

</script>
<template>
  <div class="ma-container"
    :class="{ 'ma-container_expand': show }"
  >

    <div style="width: 100%; height: 10px"></div>

    <div class="ma-grid"
      :class="{ 'ma-grid-one-column': mvRef < critialPoint }"
    >
      <!-- 什么时候 -->
      <div class="liu-hover ma-item">
        <div class="mai-icon">
          <svg-icon name="when" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.when") }}</span>
        </div>
        <div class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 提醒我 -->
      <div class="liu-hover ma-item">
        <div class="mai-icon">
          <svg-icon name="notification" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.remind") }}</span>
        </div>
        <div class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 加标题 -->
      <div class="liu-hover ma-item">
        <div class="mai-icon">
          <svg-icon name="title" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.add_title") }}</span>
        </div>
        <div class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 加附件 -->
      <div class="liu-hover ma-item">
        <div class="mai-icon">
          <svg-icon name="upload_file" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.add_file") }}</span>
        </div>
        <div class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>


    </div>

  </div>

</template>
<style scoped lang="scss">

.ma-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  transition: .3s;
  max-height: 0;
  opacity: 0;
}

.ma-container_expand {
  max-height: v-bind("containerMaxHeightPx + 'px'");
  opacity: 1;
}

/** 默认使用 两列布局 */
.ma-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 5px;    /** <grid-row-gap> <grid-column-gap> */
}

.ma-grid-one-column {
  grid-template-columns: 1fr;
  gap: 4px;
}

.ma-item {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  height: 46px;

  .mai-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 8px;

    .mai-svgicon {
      width: 24px;
      height: 24px;
    }
  }

  .mai-title {
    flex: 1;
    font-size: var(--btn-font);
    font-weight: 400;
    color: var(--other-btn-text);
    user-select: none;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mai-footer {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-inline-end: 4px;

    .maif-icon {
      width: 16px;
      height: 16px;
    }
  }

}


</style>