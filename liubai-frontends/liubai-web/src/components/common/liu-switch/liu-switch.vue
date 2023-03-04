<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SwitchChangeEmitOpt } from "./types"

const props = defineProps({
  checked: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})
const switchVal = ref(props.checked)
watch(() => props.checked, (newV, oldV) => {
  if(switchVal.value !== newV) switchVal.value = newV
})

const emit = defineEmits<{
  (event: "change", opt: SwitchChangeEmitOpt): void
}>()
const onTapToggle = (e: MouseEvent) => {
  e.stopPropagation()
  if(props.disabled) return
  switchVal.value = !switchVal.value
  emit("change", { checked: switchVal.value, msg: "toggle changes" })
}

</script>
<template>

  <div class="switch-container" @click="onTapToggle">
    <div class="switch-box" :class="{ 'switch-box_disabled': props.disabled }">
      <div class="switch-bg" :class="{ 'switch-bg_show': switchVal }"></div>
      <div class="switch-ball" :class="{ 'switch-ball_on': switchVal }"></div>
    </div>
  </div>

</template>
<style scoped>

.switch-container {
  width: 48px;
  height: 24px;
  position: relative;
  cursor: pointer;
}

.switch-box {
  border: 2px solid var(--other-btn-text);
  width: 44px;
  height: 20px;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}

.switch-box_disabled {
  opacity: .5;
}

.switch-bg {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  opacity: 0;
  border-radius: 10px;
  overflow: hidden;
  background: var(--cool-bg);
  transition: .15s;
}

.switch-bg_show {
  width: 40px;
  opacity: 1;
}

.switch-ball {
  margin-top: 2px;
  margin-left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--other-btn-text);
  transition: .15s;
}

.switch-ball_on {
  transform: translateX(24px);
  box-shadow: -3px 0 4px rgba(0,0,0,.16);
}


</style>