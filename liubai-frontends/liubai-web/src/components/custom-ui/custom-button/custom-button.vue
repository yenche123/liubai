<script setup lang="ts">
import { customBtnProps } from "./tools/types"
import { useCustomButton } from "./tools/useCustomButton"
import RingLoader from "../../loaders/ring-loader/ring-loader.vue"
 
const props = defineProps(customBtnProps)
const emit = defineEmits(["click"])
const { cbData } = useCustomButton(props)

</script>
<template>

  <button 
    class="liu-no-user-select btn-container"
    :class="{ 
      'btn-mini': size === 'mini',
      'btn-other': type === 'other',
      'btn-transparent': type === 'transparent',
      'btn-common': size === 'common',
      'btn-pure': type === 'pure',
    }"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
    <div v-if="cbData.enableLoading" class="btn-loading-box"
      :class="{ 'btn-loading-box_show': cbData.showLoading }"
    >
      <RingLoader :size="20" :color="cbData.loadingColor"></RingLoader>
    </div>
  </button>

</template>
<style scoped lang="scss">

.btn-container {
  padding-block: 10px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: var(--on-primary);
  cursor: pointer;
  font-size: var(--btn-font);
  transition: .15s;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 30px;
  box-sizing: content-box;
}

.btn-mini {
  padding-block: 5px;
  width: auto;
  border-radius: 10px;
  padding-inline: 20px;
}

.btn-common {
  border-radius: 18px;
  width: auto;
  text-align: center;
  min-width: 120px;
  padding-inline: 24px;
  font-weight: 700;
}

.btn-pure {
  background-color: var(--card-bg);
  color: var(--main-text);
}

.btn-other {
  background-color: var(--other-btn-bg);
  color: var(--other-btn-text);
}

.btn-transparent {
  background-color: transparent;
  color: var(--primary-color);
}

.btn-loading-box {
  width: 40px;
  height: 30px;
  max-width: 0;
  opacity: 0;
  transition: .2s;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btn-loading-box_show {
  max-width: 40px;
  opacity: 1;
}


@media(hover: hover) {

  .btn-container:hover {
    background-color: var(--primary-hover);
  }

  .btn-container:active {
    background-color: var(--primary-active);
  }

  .btn-transparent:hover {
    background-color: transparent;
    opacity: .7;
  }

  .btn-transparent:active {
    background-color: transparent;
    opacity: .6;
  }

  .btn-other:hover {
    background-color: var(--other-btn-hover);
  }

  .btn-other:active {
    background-color: var(--other-btn-hover);
  }

  .btn-pure:hover {
    background-color: var(--card-bg);
    opacity: .75;
  }

  .btn-pure:hover {
    background-color: var(--card-bg);
    opacity: .7;
  }

}

.btn-container:disabled {
  background-color: var(--primary-color);
  opacity: .5;
  cursor: default;
}


@media screen and (max-width: 450px) {

  .btn-mini {
    padding-block: 1px;
    border-radius: 8px;
    padding-inline: 14px;
    font-size: var(--mini-font);
  }
  
}

</style>