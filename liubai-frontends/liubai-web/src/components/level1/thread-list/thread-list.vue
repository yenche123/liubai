<script setup lang="ts">
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';
import { useNewAndUpdate } from './tools/useNewAndUpdate';
import ListBottom from '../list-bottom/list-bottom.vue';
import { useThreadOperate } from './tools/useThreadOperate';

const props = defineProps({
  viewType: {
    type: String,
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
} = useThreadOperate(props, list)

</script>
<template>
  <div class="tl-container">

    <template v-for="(item, index) in list" :key="item._id">
      
      <ThreadCard 
        :thread-data="item"
        :position="index"
        @newoperate="receiveOperation"
      ></ThreadCard>
    
    </template>
    
    <ListBottom :has-data="list.length > 0" :reached="true"></ListBottom>

  </div>
</template>
<style lang="scss">

.tl-test {
  width: 100%;
  text-align: center;
  font-size: 17px;
  color: var(--main-text);
}


</style>