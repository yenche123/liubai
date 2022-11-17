<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { ThreadShow } from '../../../../types/types-content';


export default defineComponent({
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
    const { t } = useI18n()



  }
})

</script>
<template>

  <div class="tc-container">

    <div class="tc-box">

    </div>

  </div>
  
</template>
<style scoped lang="scss">

.tc-container {
  width: 100%;
  border-radius: 20px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: box-shadow .3s;
  margin-bottom: 20px;

  .tc-box {
    width: 100%;
    box-sizing: border-box;
    padding: 20px;

  }


}


</style>