<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ThreadList from '~/components/level1/thread-list/thread-list.vue';

const { t } = useI18n()

</script>
<template>

  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">

      <div class="trash-tip-box">
        <span>{{ t('tip.delete_banner') }}</span>
      </div>

      <thread-list
        view-type="TRASH"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped>

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tc-virtual {
  width: 100%;
  height: 10px;
}

.mc-box {
  width: 90%;
  max-width: var(--card-max);
  min-width: var(--card-min);
  position: relative;
}

.trash-tip-box {
  width: calc(100%);
  position: relative;
  padding: 30px;
  border-radius: 8px;
  box-sizing: border-box;
  color: var(--primary-color);
  font-size: var(--mini-font);
  margin-block-end: 20px;
  overflow: hidden;
  background-color: var(--card-bg);
  user-select: none;
}

.trash-tip-box::before {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--primary-color);
  opacity: .19;
}



</style>