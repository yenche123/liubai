<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAgreeBox } from './tools/useAgreeBox';
import { agreeBoxProps } from './tools/types';

const agree = defineModel<boolean>("agree", { required: true })
const props = defineProps(agreeBoxProps)
const { isShaking, onTapBox } = useAgreeBox(agree, props)

const { t } = useI18n()

</script>
<template>
  <div class="agree-box" @click.stop="onTapBox" :class="{ 'agree-box_shaking': isShaking }">
    <div class="agree-checkbox">
      <LiuCheckbox :checked="agree" :size="19"
        :circleSize="10"
        :borderSize="2.5"
      ></LiuCheckbox>
    </div>
    <div class="agree-text" :class="{ 'agree-text_shaking': isShaking }">
      <span>{{ t('login.agree_1') }}</span>
      <a href="https://www.podcastogether.com/" target="_blank"
        @click.stop
      >{{ t('login.agree_2') }}</a>
      <span>{{ t('login.agree_3') }}</span>
      <a href="https://www.podcastogether.com/" target="_blank"
        @click.stop
      >{{ t('login.agree_4') }}</a>
    </div>
  </div>

</template>
<style scoped>

.agree-box {
  display: flex;
  width: 100%;
  position: relative;
  justify-content: v-bind("beCenter ? 'center' : 'flex-start'");
  align-items: flex-start;
  cursor: pointer;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}

.agree-box_shaking {
  animation: shake .8s cubic-bezier(.36,.07,.19,.97) both;
}

.agree-checkbox {
  width: 30px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.agree-text {
  width: auto;
  font-size: var(--mini-font);
  color: var(--main-code);
  line-height: 1.5;
  word-wrap: break-word;
  padding-block-start: 1px;
  user-select: none;
  -webkit-user-select: none;
  text-wrap: pretty;
  transition: .15s;
}

.agree-text_shaking {
  color: var(--liu-state-3);
}

.agree-box a {
  transition: .15s;
}

.agree-text_shaking a {
  color: var(--liu-state-3)
}

@media(hover: hover) {
  .agree-text a:hover {
    opacity: .8;
  }
}


</style>