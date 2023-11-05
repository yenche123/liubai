<script setup lang="ts">
import type { LpcProps, LpcEmits } from "./tools/types"
import { useLpCode } from "./tools/useLpCode"
import { useI18n } from "vue-i18n";

const props = defineProps<LpcProps>()
const emit = defineEmits<LpcEmits>()

const { lpCodeInput, lpcData, onEnterCode } = useLpCode(props, emit)
const { t } = useI18n()


</script>
<template>

  <!-- email view -->
  <div class="lp-view">

    <!-- 标题: 邮箱验证 -->
    <div class="lpc-title">
      <span>{{ t('login.email_verification') }}</span>
    </div>

    <!-- 提示: 可以到垃圾邮箱查看 -->
    <div class="lpc-tip">
      <span>{{ t('login.email_verification_tip', { email }) }}</span>
    </div>

    <input class="lp-code-input"
      maxlength="9"
      :placeholder="t('login.verification_code')" 
      v-model="lpcData.code"
      ref="lpCodeInput"
      @keyup.enter.exact="onEnterCode"
    />

    <CustomBtn
      :disabled="!lpcData.canSubmit"
      class="lp-btn"
      @click="onEnterCode"
    >
      <span>{{ t('common.confirm') + ' ↵' }}</span>
    </CustomBtn>

    <CustomBtn
      class="lp-btn lp-btn-back"
      type="transparent"
      @click="$emit('back')"
    >
      <span>{{ t('common.back') }}</span>
    </CustomBtn>
  
  </div>

</template>
<style scoped lang="scss">

.lp-view {
  width: 100%;
  min-height: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lpc-title {
  text-align: center;
  width: 100%;
  max-width: 450px;
  margin-block-end: 24px;
  font-size: var(--title-font);
  color: var(--main-normal);
  font-weight: 700;

  span::selection {
    background-color: var(--select-bg);
  }
}

.lpc-tip {
  text-align: center;
  width: 100%;
  max-width: 450px;
  margin-block-end: 48px;
  font-size: var(--mini-font);
  color: var(--main-normal);
  line-height: 1.5;
  white-space: pre;

  span::selection {
    background-color: var(--select-bg);
  }
}

.lp-code-input {
  box-sizing: border-box;
  text-align: center;
  width: 100%;
  max-width: 450px;
  padding: 12px 24px;
  font-size: var(--title-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  border-radius: 8px;
  margin-block-end: 48px;
  letter-spacing: 4px;
  line-height: 1.25;

  &::placeholder {
    color: var(--main-note);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.lp-btn {
  width: 100%;
  max-width: 450px;
  margin-block-end: 12px;
}

.lp-btn-back {
  margin-block-end: 0;
}

@media screen and (min-height: 700px) {
  
  .lpc-tip, .lp-code-input {
    margin-block-end: 96px;
  }
  
}



</style>