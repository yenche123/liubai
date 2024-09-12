<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePaymentContent } from "./tools/usePaymentContent"

const { t } = useI18n()
const { pcData, cha } = usePaymentContent()

</script>
<template>

  <PlaceholderView 
    :p-state="pcData.state"
  ></PlaceholderView>

  <!-- 1. the order has been PAID -->
  <div v-if="pcData.od?.orderStatus === 'PAID'" class="pc-container">
    <div class="pc-square">

      <div class="pc-emoji-box">
        <svg-icon 
          name="emojis-ok_hand_color_default" 
          class="pc-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>

      <div class="pc-title">
        <span>{{ t('payment.order_paid') }}</span>
      </div>

    </div>
  </div>

  <!-- 2. the order has been CLOSED-->
  <div v-else-if="pcData.od?.orderStatus === 'CLOSED'" class="pc-container">

    <div class="pc-square">

      <div class="pc-emoji-box">
        <svg-icon 
          name="emojis-face_in_clouds_color" 
          class="pc-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>

      <div class="pc-title">
        <span>{{ t('payment.order_closed') }}</span>
      </div>

    </div>

  </div>

  <!-- 3. wxpay -->
  <div v-else-if="cha?.isWeChat && cha?.isMobile && pcData.od && pcData.order_amount_txt"
    class="liu-no-user-select pc-container"
  >
    <!-- title (like: 年度会员) -->
    <div class="pc-wxpay-title">
      <span v-if="pcData.od.title">{{ pcData.od.title }}</span>
    </div>

    <!-- price (like: ¥150.00) -->
    <div class="pc-wxpay-price">
      <span v-if="pcData.od.currency === 'cny' || pcData.od.currency === 'jpy'" 
        class="pc-wxpay-symbol"
      >¥</span>
      <span v-else class="pc-wxpay-symbol">$</span>
      <span>{{ pcData.order_amount_txt }}</span>
    </div>

    <!-- payee -->
    <div class="pc-wxpay-payee">
      <div class="pcwp-title">
        <span>{{ t('payment.payee') }}</span>
      </div>
      <div class="pcwp-footer">
        <span>{{ t('hello.appName') }}</span>
      </div>
    </div>

    <!-- pay button -->
    <button class="pc-btn pc-wxpay-button">
      <span>{{ t('payment.pay_immediately') }}</span>
    </button>

  </div>

  <!-- 4. alipay -->
  <div v-else-if="cha?.isAlipay && cha?.isMobile && pcData.od && pcData.order_amount_txt"
    class="liu-no-user-select pc-container"
  >
    <!-- title (like: 年度会员) -->
    <div class="pc-wxpay-title">
      <span v-if="pcData.od.title">{{ pcData.od.title }}</span>
    </div>

    <!-- price (like: ¥150.00) -->
    <div class="pc-wxpay-price">
      <span v-if="pcData.od.currency === 'cny' || pcData.od.currency === 'jpy'" 
        class="pc-wxpay-symbol"
      >¥</span>
      <span v-else class="pc-wxpay-symbol">$</span>
      <span>{{ pcData.order_amount_txt }}</span>
    </div>

    <!-- payee -->
    <div class="pc-wxpay-payee">
      <div class="pcwp-title">
        <span>{{ t('payment.payee') }}</span>
      </div>
      <div class="pcwp-footer">
        <span>{{ t('hello.appName') }}</span>
      </div>
    </div>

    <!-- pay button -->
    <button class="pc-btn pc-alipay-button">
      <span>{{ t('payment.pay_immediately') }}</span>
    </button>

  </div>

  <!-- 5. qr code -->



</template>
<style scoped lang="scss">

.pc-container {
  width: 100%;
  min-height: calc(100dvh - 80px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pc-square {
  width: 100%;
  height: calc(100dvh - 160px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.pc-emoji-box {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 30px;

  .pc-emoji {
    width: 80px;
    height: 80px;
  }
}

.pc-title {
  color: var(--main-normal);
  font-weight: 700;
  font-size: var(--title-font);
  line-height: 1.5;
  text-align: center;
  width: 75%;
}

.pc-wxpay-title {
  margin-block-end: 10px;
  font-size: var(--btn-font);
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  width: 75%;
  color: var(--main-text);
}

.pc-wxpay-price {
  font-size: var(--big-word-style);
  color: var(--main-text);
  margin-block-end: 20px;
  text-align: center;
  width: 75%;
  font-weight: 500;
  position: relative;
  line-height: 1.1;
}

.pc-wxpay-symbol {
  font-size: var(--inline-code-font);
  font-weight: 700;
  margin-inline-end: 4px;
  vertical-align: super;
}

.pc-wxpay-payee {
  width: 100%;
  display: flex;
  border-radius: 8px;
  padding: 20px;
  background-color: var(--card-bg);
  box-sizing: border-box;
  margin-block-end: 30px;
  border: 1px solid var(--line-bottom);
}

.pcwp-title {
  font-size: var(--btn-font);
  color: var(--main-code);
  flex: 1;
}

.pcwp-footer {
  flex: 2;
  text-align: right;
  font-size: var(--btn-font);
  color: var(--main-text);
}

.pc-btn {
  color: #fafafa;
  font-size: var(--btn-font);
  width: 100%;
  padding: 12px 24px;
  box-sizing: border-box;
  cursor: pointer;
  transition: .15s;
}

.pc-wxpay-button {
  background-color: var(--wechat-green);
  border-radius: 8px;
}

.pc-alipay-button {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  background-color: var(--alpay-blue);
  border-radius: 50px;
}

@media(hover: hover) {
  .pc-wxpay-button:hover {
    background-color: var(--wechat-green-hover);
  }

  .pc-alipay-button:hover {
    background-color: var(--alpay-blue-hover);
  }
}

.pc-wxpay-button:active {
  background-color: var(--wechat-green-hover);
}

.pc-alipay-button:active {
  background-color: var(--alpay-blue-hover);
}


</style>