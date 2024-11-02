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


</script>
<template>
  <div :class="{
    'thread-list_reverse': viewType === 'PAST',
  }">

    <template v-for="(item, index) in tlData.list" 
      :key="item.thread.first_id"
    >

      <!-- the bar of date for TODAY_FUTURE -->
      <template v-if="viewType === 'TODAY_FUTURE' && item.dateText">
        <div v-if="index === 0 || tlData.list[index - 1].dateText !== item.dateText" 
          class="liu-no-user-select thread-list-bar"
        >
          <span>{{ item.dateText }}</span>
        </div>
      </template>
      
      <!-- the card of thread -->
      <ThreadCard 
        :thread-data="item.thread"
        :position="index"
        :view-type="viewType"
        :show-type="item.showType"
        :show-txt="showTxt"
        :css-detect-overflow="tlData.cssDetectOverflow"
        @newoperate="receiveOperation"
        @tapbriefing="whenTapBriefing"
      ></ThreadCard>
    
    </template>
    
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

.thread-list-bar {
  width: 100%;
  padding-inline-start: 8px;
  padding-block: 8px;
  box-sizing: border-box;
  font-size: var(--title-font);
  color: var(--main-text);
  font-weight: 700;
}


</style>