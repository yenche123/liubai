<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ThreadList from '~/components/level1/thread-list/thread-list.vue';

const { t } = useI18n()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box">

      <div class="liu-highlight-box">
        <span class="liu-selection">{{ t('tip.delete_banner') }}</span>
      </div>

      <thread-list
        view-type="TRASH"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped>


</style>