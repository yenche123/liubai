<script setup lang="ts">
import { useI18n } from "vue-i18n";
import liuUtil from "~/utils/liu-util"
import liuApi from "~/utils/liu-api";

defineProps({
  canSubmit: {
    type: Boolean,
    default: false,
  },
  inCodeBlock: Boolean,
  focused: Boolean,
})
defineEmits<{
  (event: "confirm"): void
}>()

const { t } = useI18n()
const cha = liuApi.getCharacteristic()

</script>
<template>

  <div class="ce-finish-area">

    <div class="cefa-virtual"></div>

    <div class="cefa-box">
      <span class="liu-no-user-select cefa-tip"
        :class="{ 'cefa-tip_hidden': !focused || inCodeBlock || cha.isMobile }"
      >{{ liuUtil.getHelpTip('Mod_Enter') }}</span>
      <custom-btn 
        size="mini" 
        class="cefa-btn" 
        :disabled="!canSubmit"
        @click="$emit('confirm')"
      >
        <span>{{ t("common.finish") }}</span>
      </custom-btn>
    </div>

  </div>

</template>
<style scoped lang="scss">
.ce-finish-area {
  position: absolute;
  bottom: 15px;
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

    @media screen and (max-width: 450px) {
      .cefa-btn {
        height: 36px;
        line-height: 36px;
        font-size: var(--btn-font);
        padding: 0 20px;
      }
    }
  }

}
</style>