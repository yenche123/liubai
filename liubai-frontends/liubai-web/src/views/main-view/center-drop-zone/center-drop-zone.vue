<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from 'vue-i18n';
import valTool from "~/utils/basic/val-tool";

defineProps({
  isOverDropZone: {
    type: Boolean,
    default: false
  },
})

defineEmits<{
  (evt: "tap"): void
}>()

const { t } = useI18n()
const color = "#c7c9ca"

const enable = ref(false)
const transDuration = ref("0")
onMounted(async () => {
  await valTool.waitMilli(200)
  enable.value = true
  transDuration.value = "0.11s"
})

</script>
<template>
  <div class="cdz-container"
    :class="{ 
      'cdz-container_enabled': enable,
      'cdz-container_show': isOverDropZone,
    }"
    @click="$emit('tap')"
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


/** cdz-container is relative to mv-center due to 
* the transform / content-visibility  properties 
*/
.cdz-container {
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  position: fixed;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: v-bind("transDuration");
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
  }
}

.cdz-container_enabled {
  display: flex;
}

.cdz-container_show {
  visibility: visible;
  opacity: 1;
}



</style>