<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSubscribeContent } from "./tools/useSubscribeContent"
import { toRef, watch } from "vue";
import type { ScEmits } from "./tools/types"
import ShinyButton from "~/components/custom-ui/shiny-button/shiny-button.vue";

const emits = defineEmits<ScEmits>()

const { 
  scData,
  onTapBuyViaStripe,
  onTapBuyViaOneOff,
  onTapManage,
  onTapRefund,
} = useSubscribeContent()
const spi = toRef(scData, "subPlanInfo")

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
    <div class="liu-mc-box" v-if="spi && scData.state < 0">

      <!-- 方案标题 -->
      <div class="liu-no-user-select sc-title">
        <span>{{ spi.title }}</span>
      </div>

      <!-- price -->
      <div class="liu-no-user-select sc-price" v-if="scData.price_1">
        <span class="scp-tag">{{ spi.symbol }}</span>

        <!-- integral -->
        <span>{{ scData.price_1 }}</span>

        <!-- point -->
        <span v-if="scData.price_2" class="scp-point">.</span>

        <!-- decimal -->
        <span v-if="scData.price_2" class="scp-decimal">{{ scData.price_2 }}</span>

        <!-- per ... -->
        <span v-if="spi.payment_circle === 'monthly'" 
          class="scp-footer"
        >{{ t('payment.per_month', { currency: spi.currency }) }}</span>
        <span v-else-if="spi.payment_circle === 'yearly'" 
          class="scp-footer"
        >{{ t('payment.per_year', { currency: spi.currency }) }}</span>
        
      </div>

      <!-- 徽章 或 终身会员 -->
      <div class="liu-no-user-select sc-badge">
        <span v-if="scData.isLifelong">{{ t('payment.lifetime') }}</span>
        <span v-else>{{ spi.badge }}</span>
      </div>

      <!-- 什么时候过期 或 什么时候续费 -->
      <div class="liu-no-user-select scb-footer" 
        v-if="!scData.isLifelong && scData.expireStr && scData.isPremium"
      >
        <span v-if="scData.autoRecharge">{{ t('payment.recharge_date', { date: scData.expireStr }) }}</span>
        <span v-else>{{ t('payment.expire_date', { date: scData.expireStr }) }}</span>
      </div>

      <!-- 方案内文 -->
      <div class="sc-content">
        <span class="liu-selection">{{ spi.desc }}</span>
      </div>

      <!-- wechat or alipay -->
      <div v-if="!scData.isLifelong && scData.payment_priority === 'one-off'"
        class="sc-btns"
      >
        <ShinyButton class="sc-btn"
          @click="onTapBuyViaOneOff"
        >
          <span v-if="scData.isPremium">{{ t('payment.renew') }}</span>
          <span v-else>{{ t('payment.buy') }}</span>
        </ShinyButton>

        <!-- Cancel subscription & Refund -->
        <div v-if="scData.showRefundBtn && scData.isPremium" 
          class="liu-no-user-select liu-hover sc-refund"
          @click.stop="onTapRefund"
        >
          <span>{{ t('payment.cancel_refund') }}</span>
        </div>

      </div>

      <!-- stripe -->
      <div
        v-else-if="!scData.isLifelong && scData.payment_priority === 'stripe'"
        class="sc-btns"
      >
        
        <!-- Buy via Stripe -->
        <ShinyButton v-if="!scData.stripe_portal_url" class="sc-btn"
          @click="onTapBuyViaStripe"
        >
          <span>{{ t('payment.buy') }}</span>
        </ShinyButton>

        <!-- Cancel subscription & Refund -->
        <div v-if="scData.showRefundBtn" 
          class="liu-no-user-select liu-hover sc-refund"
          @click.stop="onTapRefund"
        >
          <span>{{ t('payment.cancel_refund') }}</span>
        </div>
        
        <!-- Manage subscription -->
        <custom-btn v-else-if="scData.stripe_portal_url" class="sc-btn"
          type="pure" @click="onTapManage"
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
  margin-block-end: 2.5px;
}

.sc-price {
  font-size: var(--big-word-style);
  margin-block-end: 20px;
  color: rgb(225, 81, 65);
}

.scp-tag {
  vertical-align: middle;
  font-weight: 700;
  font-size: var(--inline-code-font);
  margin-inline-end: 3px;
}

.scp-point {
  vertical-align: text-bottom;
  letter-spacing: 1px;
}

.scp-decimal {
  vertical-align: middle;
  font-weight: 700;
  font-size: var(--inline-code-font);
  letter-spacing: 1px;
}

.scp-footer {
  vertical-align: middle;
  font-weight: 700;
  margin-inline-start: 10px;
  font-size: var(--inline-code-font);
  color: var(--main-text);
}


.sc-badge {
  position: relative;
  font-size: var(--mini-font);
  color: var(--primary-color);
  border-radius: 4px;
  padding: 4px 12px;
  overflow: hidden;
  display: inline-flex;

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
  margin-block-start: 7.5px;
  color: var(--primary-color);
}

.sc-content {
  margin-block-start: 20px;
  width: 100%;
  font-size: var(--desc-font);
  color: var(--main-code);
  line-height: 1.75;
  white-space: pre-wrap;
}

.sc-btns {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block-start: 50px;
  padding-block-end: 50px;
  position: relative;

  .sc-btn {
    width: 60%;
    max-width: var(--btn-max);
  }
}

.sc-refund {
  font-size: var(--mini-font);
  color: var(--main-note);
  margin-block-start: 8px;
  line-height: 2.5;
  width: 60%;
  max-width: var(--btn-max);
  cursor: pointer;
  text-align: center;
}






</style>