<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ThreadShow } from '../../../../types/types-content';
import EditorCore from '../../../editor-core/editor-core.vue';
import { useWhenAndRemind } from './tools/useWhenAndRemind';

export default defineComponent({
  components: {
    EditorCore
  },
  props: {
    threadData: {
      type: Object as PropType<ThreadShow>,
      required: true
    },
    displayType: {
      type: String as PropType<"list" | "detail">
    }
  },
  setup(props) {
    const {
      whenStr,
      remindStr,
    } = useWhenAndRemind(props.threadData)


    return {
      whenStr,
      remindStr
    }
  }
})

</script>
<template>

  <div class="tc-container">

    <div class="tc-box">


      <div class="tc-content">
        <EditorCore 
          :edit-mode="false"
          :content="threadData.content"
        ></EditorCore>
      </div>


      
    </div>

  </div>
  
</template>
<style scoped lang="scss">

.tc-container {
  width: 100%;
  border-radius: 20px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  overflow: hidden;
  transition: border-radius .3s;
  margin-bottom: 16px;

  &:hover {
    border-radius: 10px;
  }

  .tc-box {
    width: 100%;
    box-sizing: border-box;
    padding: 20px;
    position: relative;


    .tc-content {
      position: relative;
    }

  }


}


</style>