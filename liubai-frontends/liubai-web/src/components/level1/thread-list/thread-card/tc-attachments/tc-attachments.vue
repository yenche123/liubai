<script setup lang="ts">
import { useTcAttachments } from "./tools/useTcAttachments"
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import type { PropType } from "vue"
import type { ThreadShow } from '~/types/types-content';
import { useWhenAndRemind } from './tools/useWhenAndRemind';
import TcaItem from './tca-item/tca-item.vue';

const default_color = "var(--main-code)"

const menu: MenuItem[] = [
  {
    text_key: "common.reselect",
  },
  {
    text_key: "common.remove",
  }
]

const props = defineProps({
  thread: {
    type: Object as PropType<ThreadShow>,
    required: true,
  }
})

const {
  onTapFile
} = useTcAttachments(props)
const {
  whenStr,
  remindStr,
  countdownStr,
  canEdit,
  onTapWhenItem,
  onTapRemindItem,
} = useWhenAndRemind(props)

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
        <TcaItem
          :title="whenStr"
          icon-name="when"
          :can-hover="true"
          :color="default_color"
          label-key="editor.when"
        ></TcaItem>
      </LiuMenu>
      <TcaItem
        v-else
        :title="whenStr"
        icon-name="when"
        :color="default_color"
        label-key="editor.when"
      ></TcaItem>
    </div>

    <!-- 倒计时器 -->
    <TcaItem
      v-if="countdownStr"
      :title="countdownStr"
      icon-name="hourglass_empty"
      :color="default_color"
    ></TcaItem>
    
    <!-- 提醒我 -->
    <div class="tcwr-item-box" v-if="remindStr">
      <LiuMenu 
        :menu="menu"
        min-width-str="100px"
        @tapitem="onTapRemindItem"
        v-if="canEdit"
      >
        <TcaItem
          :title="remindStr"
          icon-name="notification"
          :can-hover="true"
          :color="default_color"
          label-key="editor.remind"
        ></TcaItem>
      </LiuMenu>
      <TcaItem
        v-else
        :title="remindStr"
        icon-name="notification"
        :can-hover="false"
        :color="default_color"
        label-key="editor.remind"
      ></TcaItem>

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
          <div class="liu-no-user-select tcal-item" 
            @click.stop="onTapFile($event, index)"
          >
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
  margin-inline-start: -4px;

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