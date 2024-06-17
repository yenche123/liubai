<script setup lang="ts">
// vice-content 里，负责显示拖动文件时的指示
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from "vue";
import liuUtil from '~/utils/liu-util';

defineProps({
  showDropZone: {
    type: Boolean,
    default: false
  },
})

const { t } = useI18n()
const color = "#c7c9ca"
const enable = ref(false)

onMounted(async () => {
  await liuUtil.waitAFrame()
  enable.value = true
})


</script>
<template>

  <div v-if="enable"
    class="cdz-container"
    :class="{ 'cdz-container_show': showDropZone }"
  >

    <div class="cdz-add">
      <svg-icon name="add" class="cdz-add-icon" :color="color"></svg-icon>
    </div>

    <div class="liu-no-user-select cdz-title">
      <span>{{ t('dnd.add_tip') }}</span>
    </div>
    
  </div>


</template>
<style scoped lang="scss">

.cdz-container {
  top: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: .11s;
  opacity: 0;
  visibility: hidden;
  z-index: 770;

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
  }

}

.cdz-container_show {
  visibility: visible;
  opacity: 1;
}

</style>