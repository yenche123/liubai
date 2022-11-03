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

</script>
<template>
  <div v-if="isOverDropZone" class="cdz-container">

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
  color: whitesmoke;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background-color: rgba(0, 0, 0, .5);
  }

  .cdz-title {
    position: relative;
    color: whitesmoke;
    font-size: var(--title-font);
    text-align: center;
  }

}



</style>