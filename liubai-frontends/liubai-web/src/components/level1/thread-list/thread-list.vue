<script lang="ts">
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';
import { useNewAndUpdate } from './tools/useNewAndUpdate';
import ListBottom from '../list-bottom/list-bottom.vue';
import { useThreadOperateInList } from './tools/useThreadOperateInList';
import { defineComponent } from "vue";
import type { PropType } from 'vue';
import type { TlViewType } from "./tools/types"

export default defineComponent({
  components: {
    ThreadCard,
    ListBottom,
  },
  props: {
    viewType: {
      type: String as PropType<TlViewType>,
      default: "",
    },
    tagId: {
      type: String,
      default: "",
    },
    stateId: {
      type: String,
      default: "",
    }
  },
  setup(props) {
    const {
      list,
      lastItemStamp,
    } = useThreadList(props)
    useNewAndUpdate(props, list, lastItemStamp)

    const {
      receiveOperation
    } = useThreadOperateInList(props, list)

    return {
      list,
      receiveOperation,
    }
  }
})



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
      :reached="true"
    ></ListBottom>

  </div>
</template>
<style lang="scss">


</style>