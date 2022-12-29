<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { tcaProps, useTcAttachments } from "./tools/useTcAttachments"

const default_color = "var(--main-code)"

export default defineComponent({

  props: tcaProps,

  setup(props) {
    const { t } = useI18n()
    const {
      onTapFile
    } = useTcAttachments(props)

    return {
      t,
      default_color,
      onTapFile,
    }
  }
})

</script>

<template>
  <div 
    v-if="whenStr || remindStr || files?.length"
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
        :aria-label="t('editor.remind')"
      >
        <span>{{ remindStr }}</span>
      </div>
    </div>

    <!-- 文件 -->
    <div class="tca-item" v-if="files?.length">

      <div class="tca-icon">
        <svg-icon name="attachment"
          class="tca-svgicon"
          :color="default_color"
        ></svg-icon>
      </div>

      <div class="tca-list">
        <template v-for="(item, index) in files" :key="item.id">
          <div class="tcal-item" @click="onTapFile($event, index)">
            <span>{{ item.name }}</span>
          </div>
        </template>
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
    height: 36px;
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

  .tca-item {
    display: flex;
    position: relative;
    width: 100%;
    overflow: hidden;
    min-height: 36px;

    .tca-icon {
      flex: none;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-inline-end: 4px;
      padding-block-start: 1px;

      .tca-svgicon {
        width: 20px;
        height: 20px;
      }
    }

    .tca-list {
      padding-block-start: 1px;
      position: relative;
      display: flex;
      flex-direction: column;
      max-width: calc(100% - 40px);
      overflow: hidden;

      .tcal-item {
        line-height: 32px;
        font-size: var(--btn-font);
        font-weight: 400;
        color: var(--primary-color);
        user-select: none;
        display: inline-block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }


  }




}


</style>