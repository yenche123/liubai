<script setup lang="ts">
import { computed } from "vue";
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';
import { useNewAndUpdate } from './tools/useNewAndUpdate';
import ListBottom from '../../common/list-bottom/list-bottom.vue';
import { useThreadOperateInList } from './tools/useThreadOperateInList';
import { useIdsChanged } from "./tools/useIdsChanged";
import type { TlEmits } from "./tools/types"
import { tlProps } from "./tools/types"

const props = defineProps(tlProps)
const emit = defineEmits<TlEmits>()
const {
  tlData,
  whenTapBriefing,
} = useThreadList(props, emit)
useNewAndUpdate(props, emit, tlData)

const {
  receiveOperation,
} = useThreadOperateInList(props, emit, tlData)

useIdsChanged(tlData)


const enableBottom = computed(() => {
  const { viewType: vT } = props
  if(vT === 'PINNED' || vT === 'CALENDAR') return false
  return true
})


// headless 模式下不渲染可见 DOM，但保留全部加载/分页/响应式 hooks，
// 供日历视图作为「数据引擎」通过 ref 读取 tlData
defineExpose({
  tlData,
  receiveOperation,
  whenTapBriefing,
})


</script>
<template>
  <div v-if="!headless" :class="{
    'thread-list_reverse': viewType === 'PAST',
  }">

    <ThreadCard v-for="(item, index) in tlData.list"
      :key="item.thread.first_id"
      :thread-data="item.thread"
      :position="index"
      :view-type="viewType"
      :show-type="item.showType"
      :show-txt="showTxt"
      :css-detect-overflow="tlData.cssDetectOverflow"
      @newoperate="receiveOperation"
      @tapbriefing="whenTapBriefing"
    ></ThreadCard>
    
    <ListBottom 
      v-if="enableBottom"
      :has-data="tlData.list.length > 0" 
      :reached="tlData.hasReachedBottom"
    ></ListBottom>

  </div>
</template>
<style scoped lang="scss">

.thread-list_reverse {
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  position: relative;
}


</style>