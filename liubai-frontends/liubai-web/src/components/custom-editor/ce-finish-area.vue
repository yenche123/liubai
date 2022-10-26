<script setup lang="ts">
import { useI18n } from "vue-i18n";
import liuUtil from "../../utils/liu-util"

const { t } = useI18n()

defineProps({
  canSubmit: {
    type: Boolean,
    default: false,
  }
})

</script>
<template>

  <div class="ce-finish-area">

    <div class="cefa-virtual"></div>

    <div class="cefa-box">
      <span class="cefa-tip">{{ liuUtil.getHelpTip('Mod_Enter') }}</span>
      <custom-btn size="mini" class="cefa-btn" :disabled="!canSubmit">
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
    }

    .cefa-btn {
      padding: 0 30px;
    }
  }

}
</style>