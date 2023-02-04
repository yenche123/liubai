<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SlickList, SlickItem, HandleDirective } from 'vue-slicksort'
import type { ThreadShow } from '~/types/types-content';
import { useKanbanThreads } from "../../tools/useKanbanThreads"

export default defineComponent({

  components: {
    SlickList,
    SlickItem,
  },

  emits: {
    "update:threads": (val: ThreadShow[]) => true,
  },

  props: {
    threads: {
      type: Array as PropType<ThreadShow[]>,
      default: []
    },
  },
  
  directives: {
    handle: HandleDirective
  },

  setup(props, { emit }) {
    const {
      list
    } = useKanbanThreads(props, emit)

    return {
      list
    }
  },

})

</script>
<template>

  
</template>
<style lang="scss" scoped>


</style>