<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    canSubmit: {
      type: Boolean,
      default: false,
    },
    inCodeBlock: Boolean,
  },
})
</script>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import liuUtil from "../../../utils/liu-util"
const { t } = useI18n()

const emits = defineEmits<{
  (event: "confirm"): void
}>()

</script>
<template>

  <div class="ce-finish-area">

    <div class="cefa-virtual"></div>

    <div class="cefa-box">
      <span class="cefa-tip"
        :class="{ 'cefa-tip_hidden': inCodeBlock }"
      >{{ liuUtil.getHelpTip('Mod_Enter') }}</span>
      <custom-btn 
        size="mini" 
        class="cefa-btn" 
        :disabled="!canSubmit"
        @click="emits('confirm')"
      >
        <span>{{ t("common.finish") }}</span>
      </custom-btn>
    </div>

  </div>

</template>
<style scoped lang="scss">
.ce-finish-area {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  pointer-events: none;

  .cefa-virtual {
    width: 40px;
    background: var(--gradient-one);
    pointer-events: none;
  }

  .cefa-box {
    background-color: var(--card-bg);
    display: flex;
    align-items: center;
    pointer-events: auto;
    height: 50px;

    .cefa-tip {
      font-size: var(--mini-font);
      color: var(--main-tip);
      margin-inline-end: 10px;
      user-select: none;
      font-weight: 300;
      opacity: 1;
      transition: .15s;
    }

    .cefa-tip_hidden {
      opacity: 0;
    }

    .cefa-btn {
      padding: 0 30px;
    }
  }

}
</style>