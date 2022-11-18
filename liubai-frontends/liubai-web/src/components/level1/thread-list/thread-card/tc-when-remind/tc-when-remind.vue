<script setup lang="ts">
import { useI18n } from 'vue-i18n';


defineProps({
  whenStr: String,
  remindStr: String
})

const default_color = "var(--main-code)"

const { t } = useI18n()

</script>

<template>
  <div 
    v-if="whenStr || remindStr"
    class="tcwr-container"
  >

    <div v-if="whenStr" class="liu-hover tcwr-item">
      <div class="tcwr-icon">
        <svg-icon name="when"
          class="tcwr-svgicon"
          :color="default_color"
        ></svg-icon>
      </div>
      <div class="tcwr-title"
        :aria-label="t('editor.when')"
      >
        <span>{{ whenStr }}</span>
      </div>
    </div>

    <div v-if="remindStr" class="liu-hover tcwr-item">
      <div class="tcwr-icon">
        <svg-icon name="notification"
          class="tcwr-svgicon"
          :color="default_color"
        ></svg-icon>
      </div>
      <div class="tcwr-title"
        aria-label="提醒我"
      >
        <span>{{ remindStr }}</span>
      </div>
    </div>

  </div>

</template>
<style scoped lang="scss">

.tcwr-container {
  width: 100%;
  position: relative;
  padding-block-start: 10px;

  .tcwr-item {
    display: flex;
    align-items: center;
    width: min-content;
    min-width: 160px;
    height: 40px;
    border-radius: 10px;
    padding-inline-end: 10px;
    overflow: hidden;

    .tcwr-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-inline-end: 4px;
      padding-block-end: 2px;

      .tcwr-svgicon {
        width: 20px;
        height: 20px;
      }
    }

    .tcwr-title {
      font-size: var(--btn-font);
      font-weight: 400;
      color: var(--main-code);
      user-select: none;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

  }

}


</style>