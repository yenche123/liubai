<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSubscribeContent } from "./tools/useSubscribeContent"
import { toRef, watch } from "vue";
import type { ScEmits } from "./tools/types"

const emits = defineEmits<ScEmits>()

const { scData } = useSubscribeContent()
const pi = toRef(scData, "subPlanInfo")

const { t } = useI18n()

watch(() => scData.state, (newV) => {
  emits("statechanged", newV)
})

</script>
<template>

  <PlaceholderView
    :p-state="scData.state"
  ></PlaceholderView>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="pi && scData.state < 0">

      <!-- 方案标题 -->
      <div class="sc-title">
        <span>{{ pi.title }}</span>
      </div>

      <div class="sc-box">

        <!-- 徽章 或 终身会员 -->
        <div class="sc-badge">
          <span v-if="scData.isLifelong">{{ t('payment.lifetime') }}</span>
          <span v-else>{{ pi.badge }}</span>
        </div>

        <!-- 什么时候过期 或 什么时候续费 -->
        <div class="scb-footer" v-if="!scData.isLifelong && scData.expireStr">
          <span v-if="scData.autoRecharge">{{ t('payment.recharge_date', { date: scData.expireStr }) }}</span>
          <span v-else>{{ t('payment.expire_date', { date: scData.expireStr }) }}</span>
        </div>
      </div>

      <!-- 方案内文 -->
      <div class="sc-content">
        <span>{{ pi.desc }}</span>
      </div>

      <!-- 按钮 -->
      <div class="sc-btns" v-if="!scData.isLifelong">

        <!-- 购买 -->
        <custom-btn v-if="!scData.stripe_portal_url" class="sc-btn">
          <span>{{ t('payment.buy') }}</span>
        </custom-btn>

        <!-- 管理订单 -->
        <custom-btn v-else-if="pi.stripe?.isOn === 'Y'" class="sc-btn"
          type="other"
        >
          <span>{{ t('payment.manage_sub') }}</span>
        </custom-btn>
        

      </div>
      
      
      
    </div>



  </div>



</template>
<style scoped lang="scss">

.sc-title {
  font-size: var(--big-word-style);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  margin-block-end: 20px;
  user-select: none;
}

.sc-box {
  margin-block-end: 20px;
}

.sc-badge {
  position: relative;
  font-size: var(--mini-font);
  color: var(--primary-color);
  border-radius: 4px;
  padding: 4px 12px;
  overflow: hidden;
  display: inline-block;
  user-select: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary-color);
    opacity: .16;
  }
}

.scb-footer {
  font-size: var(--mini-font);
  color: var(--main-note);
  margin-block-start: 7.5px;
}

.sc-content {
  width: 100%;
  font-size: var(--desc-font);
  color: var(--main-code);
  line-height: 1.75;
  white-space: pre-wrap;

  span::selection {
    background-color: var(--select-bg-2);
  }
}

.sc-btns {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block-start: 50px;
  padding-block-end: 30px;
  position: relative;

  .sc-btn {
    width: 60%;
    max-width: 300px;
  }
}






</style>