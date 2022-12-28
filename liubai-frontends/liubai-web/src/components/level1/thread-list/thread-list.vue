<script setup lang="ts">
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';
import { useNewAndUpdate } from './tools/useNewAndUpdate';
import ListBottom from '../list-bottom/list-bottom.vue';
import { useThreadOperateInList } from './tools/useThreadOperateInList';
import type { PropType } from 'vue';

const props = defineProps({
  viewType: {
    type: String as PropType<"" | "TRASH" | "TAG" | "FAVORITE" | "PINNED">,
    default: "",  // "": 默认; "TRASH": 回收站; "TAG": 标签; "FAVORITE": 收藏;  "PINNED": 被置顶
  },
  tagId: {
    type: String,
    default: "",
  }
})

const {
  list
} = useThreadList(props)
useNewAndUpdate(props, list)

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
    
    <ListBottom :has-data="list.length > 0" :reached="true"></ListBottom>

  </div>
</template>
<style lang="scss">


</style>