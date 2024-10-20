<script setup lang="ts">
import { useFAB } from './tools/useFAB';

const props = defineProps({
  scrollPosition: {
    type: Number,
    default: 0
  },
  considerBottomNaviBar: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits<{
  (event: "tapfab"): void
}>()

const {
  enable,
  show,
} = useFAB(props)

const color = `var(--main-text)`

const onTapBtn = () => {
  emits('tapfab')
}

</script>
<template>

  <div v-if="enable" class="fab-container"
    :class="{ 'fab-container_show': show }"
    @click.stop="onTapBtn"
  >
    <div class="fab-icon-box">
      <svg-icon 
        class="fab-svg-icon"
        name="double_arrow_up" 
        :color="color"
      ></svg-icon>
    </div>
  </div>

</template>
<style scoped lang="scss">

.fab-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  height: 56px;
  min-width: 56px;
  bottom: 24px;
  right: 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--secondary-shadow);
  background-color: var(--secondary-color);
  will-change: transform;
  transform-origin: bottom right;
  transform: scale(0.01);
  cursor: pointer;
  transition: .3s;
  opacity: .8;
}

.fab-container_show {
  transform: scale(1);
  opacity: 1;
}

.fab-icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  .fab-svg-icon {
    width: 24px;
    height: 24px;
  }
}

.fab-title {
  color: v-bind("color");
  font-size: var(--btn-font);
  font-weight: 500;

  .fab-span {
    padding-inline-end: 20px;
  }
}

@media(hover: hover) {
  .fab-container:hover {
    background-color: var(--secondary-hover);
    box-shadow: var(--secondary-shadow-hover);
  }
}

.fab-container:active {
  background-color: var(--secondary-active);
  box-shadow: var(--secondary-shadow-hover);
}

@media screen and (max-width: 500px) and (min-height: 800px) {
  .fab-container {
    bottom: 32px;
  }
}


</style>