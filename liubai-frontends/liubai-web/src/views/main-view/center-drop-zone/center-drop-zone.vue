<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps({
  isOverDropZone: {
    type: Boolean,
    default: false
  },
  leftPx: {
    type: Number,
    default: 0
  },
  rightPx: {
    type: Number,
    default: 0
  }
})

const { t } = useI18n()
const color = "#c7c9ca"

</script>
<template>
  <div class="cdz-container"
    :class="{ 'cdz-container_show': isOverDropZone }"
  >

    <div class="cdz-add">
      <svg-icon name="add" class="cdz-add-icon" :color="color"></svg-icon>
    </div>

    <div class="cdz-title">
      <span>{{ t('dnd.add_tip') }}</span>
    </div>
    
  </div>
</template>
<style scoped lang="scss">

.cdz-container {
  top: 0;
  bottom: 0;
  left: v-bind("leftPx + 'px'");
  right: v-bind("rightPx + 'px'");
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: .11s;
  opacity: 0;
  visibility: hidden;
  z-index: 570;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background-color: rgba(0, 0, 0, .75);
  }

  .cdz-add {
    width: 100px;
    height: 100px;
    border: 4px solid v-bind("color");
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 50px;
    position: relative;

    .cdz-add-icon {
      width: 50px;
      height: 50px;
    }
  }

  .cdz-title {
    position: relative;
    color: v-bind("color");
    font-size: var(--title-font);
    text-align: center;
    letter-spacing: 1.2px;
    user-select: none;
  }

}

.cdz-container_show {
  visibility: visible;
  opacity: 1;
}



</style>