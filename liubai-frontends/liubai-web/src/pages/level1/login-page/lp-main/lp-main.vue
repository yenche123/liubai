<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useLpMain } from "./tools/useLpMain";
import type { LpmEmit } from "./tools/types"

const emit = defineEmits<LpmEmit>()

const { t } = useI18n()
const {
  lpSelectsEl,
  lpEmailInput,
  lpmData,
  onTapSelect,
  onEmailEnter,
} = useLpMain(emit)

</script>
<template>

  <!-- Email / 第三方 等选项-->
  <div class="lp-selects" ref="lpSelectsEl">

    <!-- Email -->
    <div class="lps-item lps-item-1" @click.stop="onTapSelect(1)">
      <span>{{ t('login.email')}}</span>
    </div>

    <!-- 第三方 -->
    <div class="lps-item lps-item-2" @click.stop="onTapSelect(2)">
      <span>{{ t('login.third_party')}}</span>
    </div>

    <!-- 指示器 -->
    <div v-if="lpmData.indicatorData.width !== '0px'" class="lp-indicator"></div>

  </div>

  <!-- email view -->
  <div class="lp-view" v-liu-show="lpmData.current === 1">

    <input class="lp-email-input" type="email" 
      :placeholder="t('login.email_ph')" 
      v-model="lpmData.emailVal"
      ref="lpEmailInput"
      @keyup.enter.exact="onEmailEnter"
    />

    <CustomBtn
      :disabled="!lpmData.showEmailSubmit"
      class="lp-email-btn"
      @click="onEmailEnter"
    >
      <span>{{ t('common.confirm') + ' ↵' }}</span>
    </CustomBtn>
  
  </div>

  <!-- third-party view -->
  <div class="lp-view" v-liu-show="lpmData.current === 2">

    <!-- google -->
    <div class="liu-hover lpv-btn" @click.stop="$emit('tapthirdparty', 'google')">
      <div class="lpv-icon">
        <svg-icon name="logos-google-color" 
          :cover-fill-stroke="false"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_google') }}</span>
      </div>
    </div>

    <!-- github -->
    <div class="liu-hover lpv-btn" @click.stop="$emit('tapthirdparty', 'github')">
      <div class="lpv-icon">
        <svg-icon name="logos-github" 
          color="var(--main-text)"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_github') }}</span>
      </div>
    </div>

    <!-- Apple -->
    <div class="liu-hover lpv-btn" @click.stop="$emit('tapthirdparty', 'apple')">
      <div class="lpv-icon">
        <svg-icon name="logos-apple" 
          color="var(--main-text)"
          class="lpv-svg-icon"
        ></svg-icon>
      </div>
      <div class="lpv-text">
        <span>{{ t('login.continue_with_apple') }}</span>
      </div>
    </div>

  </div>


</template>
<style scoped lang="scss">

.lp-selects {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}

.lps-item {
  width: 48%;
  max-width: 220px;
  height: 50px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  transition: .15s;
  z-index: 90;
  cursor: pointer;
  user-select: none;
}

.lp-indicator {
  position: absolute;
  top: 0;
  left: v-bind("lpmData.indicatorData.left");
  width: v-bind("lpmData.indicatorData.width");
  height: 100%;
  z-index: 80;
  background-color: var(--primary-hover);
  opacity: .08;
  border-radius: 20px;
  transition: .3s;
}


.lp-view {
  width: 100%;
  padding-block-start: 10px;
  padding-block-end: 20px;
  height: 50dvh;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lp-email-input {
  box-sizing: border-box;
  width: 100%;
  max-width: 450px;
  padding: 16px 24px;
  font-size: var(--desc-font);
  color: var(--main-normal);
  background-color: var(--card-bg);
  border: 1.4px solid var(--line-bottom);
  border-radius: 8px;
  margin-block-end: 24px;

  &::placeholder {
    color: var(--main-note);
  }

  /** 消除自动填入时的样式，参考 
  * https://stackoverflow.com/questions/61083813/how-to-avoid-internal-autofill-selected-style-to-be-applied
  **/
  &:-webkit-autofill, &:-webkit-autofill:focus {
    transition: background-color 0s 600000s, color 0s 600000s;
    -webkit-box-shadow: 0 0 0px 1000px var(--card-bg) inset;
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.lp-email-btn {
  width: 100%;
  max-width: 450px;
}


.lpv-btn {
  width: 100%;
  max-width: 450px;
  padding: 4px 16px;
  box-sizing: border-box;
  height: 48px;
  border-radius: 8px;
  border: 1.4px solid var(--line-bottom);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-bg);
  margin-block-end: 12px;
  user-select: none;
}

.lpv-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 10px;

  .lpv-svg-icon {
    width: 25px;
    height: 25px;
  }
}

.lpv-text {
  font-size: var(--btn-font);
  color: var(--main-normal);
  min-width: 180px;
  text-align: center;
}



@media(hover: hover) {
  .lps-item:hover {
    font-size: calc(var(--desc-font) + 2px);
  }
}



</style>