<script setup lang="ts">
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';
import { useNewAndUpdate } from './tools/useNewAndUpdate';
import ListBottom from '../list-bottom/list-bottom.vue';
import { useThreadOperateInList } from './tools/useThreadOperateInList';
import type { TlEmits } from "./tools/types"
import { tlProps } from "./tools/types"

const props = defineProps(tlProps)
const emit = defineEmits<TlEmits>()
const {
  list,
  lastItemStamp,
  hasReachBottom,
} = useThreadList(props, emit)
useNewAndUpdate(props, list, lastItemStamp)

const {
  receiveOperation
} = useThreadOperateInList(props, list)

</script>
<template>
  <div class="tl-container">

    <template v-for="(item, index) in list" :key="item._id">
      
      <ThreadCard 
        :thread-data="item"
        :position="index"
        :view-type="viewType"
        @newoperate="receiveOperation"
      ></ThreadCard>
    
    </template>
    
    <ListBottom 
      v-if="viewType !== 'PINNED'"
      :has-data="list.length > 0" 
      :reached="hasReachBottom"
    ></ListBottom>

  </div>
</template>
<style lang="scss">


</style>