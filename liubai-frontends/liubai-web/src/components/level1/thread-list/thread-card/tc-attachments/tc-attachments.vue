<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTcAttachments } from "./tools/useTcAttachments"
import type { MenuItem } from "../../../../../components/common/liu-menu/tools/types"
import type { PropType } from "vue"
import type { ThreadShow } from '../../../../../types/types-content';
import { useWhenAndRemind } from './tools/useWhenAndRemind';
import TcWhenRemind from './tc-when-remind/tc-when-remind.vue';

const default_color = "var(--main-code)"

const menu: MenuItem[] = [
  {
    text_key: "common.reselect",
  },
  {
    text_key: "common.remove",
  }
]

export default defineComponent({

  components: {
    TcWhenRemind,
  },

  props: {
    thread: {
      type: Object as PropType<ThreadShow>,
      required: true,
    }
  },

  setup(props) {
    const { t } = useI18n()
    const {
      onTapFile
    } = useTcAttachments(props)
    const {
      whenStr,
      remindStr,
      canEdit,
      onTapWhenItem,
      onTapRemindItem,
    } = useWhenAndRemind(props)

    return {
      t,
      default_color,
      onTapFile,
      menu,
      whenStr,
      remindStr,
      canEdit,
      onTapWhenItem,
      onTapRemindItem,
    }
  }
})

</script>

<template>
  <div 
    v-if="whenStr || remindStr || thread.files?.length"
    class="tcwr-container"
  >

    <!-- 什么时候 -->
    <div class="tcwr-item-box" v-if="whenStr">
      <LiuMenu 
        :menu="menu"
        min-width-str="100px"
        @tapitem="onTapWhenItem"
        v-if="canEdit"
      >
        <TcWhenRemind
          :title="whenStr"
          icon-name="when"
          :can-hover="true"
          :color="default_color"
          label-key="editor.when"
        ></TcWhenRemind>
      </LiuMenu>
      <TcWhenRemind
        v-else
        :title="whenStr"
        icon-name="when"
        :can-hover="false"
        :color="default_color"
        label-key="editor.when"
      ></TcWhenRemind>
    </div>
    
    <!-- 提醒我 -->
    <div class="tcwr-item-box" v-if="remindStr">
      <LiuMenu 
        :menu="menu"
        min-width-str="100px"
        @tapitem="onTapRemindItem"
        v-if="canEdit"
      >
        <TcWhenRemind
          :title="remindStr"
          icon-name="notification"
          :can-hover="true"
          :color="default_color"
          label-key="editor.remind"
        ></TcWhenRemind>
      </LiuMenu>
      <TcWhenRemind
        v-else
        :title="remindStr"
        icon-name="notification"
        :can-hover="false"
        :color="default_color"
        label-key="editor.remind"
      ></TcWhenRemind>

    </div>
    

    <!-- 文件 -->
    <div class="tca-item" v-if="thread.files?.length">

      <div class="tca-icon">
        <svg-icon name="attachment"
          class="tca-svgicon"
          :color="default_color"
        ></svg-icon>
      </div>

      <div class="tca-list">
        <template v-for="(item, index) in thread.files" :key="item.id">
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

  .tcwr-item-box {
    display: flex;
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