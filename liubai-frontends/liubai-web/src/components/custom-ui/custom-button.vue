<script setup lang="ts">

const props = defineProps({
  type: {
    type: String,
    default: "main",     // main: 主要的;  other: 一般的;  transparent: 透明的
  },
  size: {
    type: String,
    default: "normal",   // normal: 正常大小;  mini: 宽度同 slot
  },
  disabled: {
    type: Boolean,
    default: false
  },
  zIndex: Number,
  width: String,
})

const emit = defineEmits(["click"])
const onTapBtn = (e: Event) => {
  emit("click", e)
}

</script>
<template>

  <button 
    class="btn-container"
    :class="{ 
      'btn-mini': props.size === 'mini',
      'btn-other': props.type === 'other',
      'btn-transparent': props.type === 'transparent',
    }"
    :disabled="props.disabled"
    @click="onTapBtn"
  >
    <slot />
  </button>

</template>
<style scoped>

.btn-container {
  height: 50px;
  line-height: 50px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: var(--on-primary);
  cursor: pointer;
  font-size: var(--btn-font);
  transition: .15s;
}

.btn-mini {
  height: 40px;
  line-height: 40px;
  width: auto;
  border-radius: 10px;
  padding: 0 20px;
}

.btn-other {
  background-color: var(--other-btn-bg);
  color: var(--other-btn-text);
}

.btn-transparent {
  background-color: transparent;
  color: var(--primary-color);
}

.btn-container:hover {
  background-color: var(--primary-hover);
}

.btn-container:active {
  background-color: var(--primary-active);
}

.btn-container:disabled {
  background-color: var(--primary-color);
  opacity: .5;
  cursor: default;
}

.btn-transparent:hover {
  opacity: .7;
}

.btn-transparent:active {
  opacity: .6;
}

.btn-other:hover {
  background-color: var(--other-btn-hover);
}

.btn-other:active {
  background-color: var(--other-btn-hover);
}

</style>