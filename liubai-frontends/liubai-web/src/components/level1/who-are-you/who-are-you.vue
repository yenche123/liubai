<script setup lang="ts">
// 显示 不支持该浏览器 或者 初始化时显示怎么称呼你

import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import valTool from '../../../utils/basic/val-tool';
import { useWhoAreYou } from './tools/useWhoAreYou';

const inputEl = ref<HTMLInputElement | null>(null) 

const { show, inputValue, onEnter } = useWhoAreYou()
const { t } = useI18n()

watch(show, async (newV) => {
  if(!newV) return

  await nextTick()
  await valTool.waitMilli(60)
  
  if(!inputEl.value) return
  inputEl.value.focus()
})

</script>
<template>

  <div v-if="show" class="wru-container">
    <input ref="inputEl" 
      v-model="inputValue"
      class="wru-input" 
      :placeholder="t('who_r_u.placeholder')" 
      :maxlength="20"
      @keyup.enter="onEnter" 
    />
  </div>

</template>
<style scoped lang="scss">

.wru-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
  z-index: 800;

  .wru-input {
    position: relative;
    width: 60%;
    text-align: center;
    font-size: var(--big-word-style);
    line-height: 2;
    color: var(--main-normal);
    transition: .15s;
    border-bottom: 3px solid transparent;
    letter-spacing: 1px;
  }

  .wru-input:focus {
    border-bottom: 3px solid var(--main-normal);
  }

  .wru-input::-webkit-input-placeholder {
    color: var(--main-note);
  }

  @media screen and (max-width: 400px) {
    .wru-input {
      font-size: var(--head-font)
    }
  }

}


</style>