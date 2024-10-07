<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePaymentContent } from "./tools/usePaymentContent"
import { useQRCode } from "~/hooks/useVueUse"

const { t } = useI18n()
const { 
  pcData, 
  cha,
  onTapAlipay,
  onTapWxpayJSAPI,
  onTapWxpayH5,
} = usePaymentContent()

const qrcode = useQRCode(() => {
  const order_id = pcData.od?.order_id
  if(!order_id) return ""
  return location.href
})

const arrowColor = "var(--main-normal)"

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
    <div class="pc-pay-title">
      <span v-if="pcData.od.title">{{ pcData.od.title }}</span>
    </div>

    <!-- price (like: ¥150.00) -->
    <div class="pc-pay-price">
      <span class="pc-pay-symbol">{{ pcData.od.symbol }}</span>
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
    <button class="pc-btn pc-wxpay-button" @click.stop="onTapWxpayJSAPI">
      <span>{{ t('payment.pay_immediately') }}</span>
    </button>

  </div>

  <!-- 4. alipay -->
  <div v-else-if="cha?.isAlipay && cha?.isMobile && pcData.od && pcData.order_amount_txt"
    class="liu-no-user-select pc-container"
  >
    <!-- title (like: 年度会员) -->
    <div class="pc-pay-title">
      <span v-if="pcData.od.title">{{ pcData.od.title }}</span>
    </div>

    <!-- price (like: ¥150.00) -->
    <div class="pc-pay-price">
      <span class="pc-pay-symbol">{{ pcData.od.symbol }}</span>
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
    <button class="pc-btn pc-alipay-button" @click.stop="onTapAlipay">
      <span>{{ t('payment.pay_immediately') }}</span>
    </button>

  </div>

  <!-- 5. mobile web -->
  <div v-else-if="cha?.isMobile && pcData.od && pcData.order_amount_txt"
    class="liu-no-user-select pc-container"
  >

    <!-- title (like: Payment Method) -->
    <div class="pc-pay-title">
      <span v-if="pcData.od.title">{{ t('payment.choose_pay_method') }}</span>
    </div>

    <!-- price (like: ¥150.00) -->
    <div class="pc-pay-price">
      <span class="pc-pay-symbol">{{ pcData.od.symbol }}</span>
      <span>{{ pcData.order_amount_txt }}</span>
    </div>

    <div class="pc-pay-virtual"></div>

    <!-- alipay button -->
    <div class="pc-pay-button" @click.stop="onTapAlipay">
      <div class="pcpb-icon-box">
        <div class="pcpb-icon pcpb-icon_alipay"></div>
      </div>
      <div class="pcpb-title">
        <span>{{ t('payment.alipay') }}</span>
      </div>
      <div class="pcpb-arrow">
        <svg-icon name="arrow-right2" class="pcpb-arrow-icon"
          :color="arrowColor"
        ></svg-icon>
      </div>
    </div>

    <!-- wxpay button -->
    <div class="pc-pay-button" @click.stop="onTapWxpayH5">
      <div class="pcpb-icon-box">
        <div class="pcpb-icon pcpb-icon_wxpay"></div>
      </div>
      <div class="pcpb-title">
        <span>{{ t('payment.wxpay') }}</span>
      </div>
      <div class="pcpb-arrow">
        <svg-icon name="arrow-right2" class="pcpb-arrow-icon"
          :color="arrowColor"
        ></svg-icon>
      </div>
    </div>

  </div>

  <!-- 6. qr code -->
  <div v-else-if="pcData.od?.order_id && qrcode" class="liu-no-user-select pc-container">
    <div class="pc-square">

      <div class="pc-qrcode">
        <img :src="qrcode" class="pc-qrcode-img">
      </div>

      <div class="pcq-title">
        <span>{{ t('payment.content1') }}</span>
      </div>

      <div class="pcq-desc">
        <span>{{ t('payment.content2') }}</span>
      </div>

    </div>
  </div>



</template>
<style scoped lang="scss">

.pc-container {
  width: 100%;
  min-height: 86vh;
  min-height: calc(100dvh - 80px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pc-square {
  width: 100%;
  height: 80vh;
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

.pc-pay-title {
  margin-block-end: 10px;
  font-size: var(--btn-font);
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  width: 75%;
  color: var(--main-text);
}

.pc-pay-price {
  font-size: var(--big-word-style);
  color: var(--main-text);
  margin-block-end: 20px;
  text-align: center;
  width: 75%;
  font-weight: 500;
  position: relative;
  line-height: 1.1;
}

.pc-pay-symbol {
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

.pc-qrcode {
  width: 200px;
  height: 200px;
  background-color: #fff;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 30px;
  overflow: hidden;
  position: relative;

  .pc-qrcode-img {
    width: 100%;
    height: 100%;
  }
}

.pcq-title {
  font-weight: 700;
  font-size: var(--title-font);
  color: var(--main-normal);
  text-align: center;
  width: 75%;
  margin-block-end: 10px;
  letter-spacing: 1px;
}

.pcq-desc {
  width: 90%;
  text-align: center;
  font-size: var(--btn-font);
  color: var(--main-normal);
  line-height: 1.5;
  text-wrap: balance;
}

.pc-pay-virtual {
  width: 100%;
  height: 16px;
}

.pc-pay-button {
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  background-color: var(--card-bg);
  margin-block-end: 10px;
  cursor: pointer;
  box-shadow: var(--card-shadow-2);
  transition: .15s;
}

.pcpb-icon-box {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 20px;
  flex: none;

  .pcpb-icon {
    width: 28px;
    height: 28px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .pcpb-icon_alipay {
    background-image: url('/images/third-party/alipay.png');
  }

  .pcpb-icon_wxpay {
    background-image: url('/images/third-party/wxpay.png');
  }
}

.pcpb-title {
  flex: 1;
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 700;
}

.pcpb-arrow {
  width: 16px;
  height: 16px;
  position: relative;
  flex: none;
  margin-inline-end: -4px;

  .pcpb-arrow-icon {
    width: 100%;
    height: 100%;
  }
}


@media(hover: hover) {
  .pc-wxpay-button:hover {
    background-color: var(--wechat-green-hover);
  }

  .pc-alipay-button:hover {
    background-color: var(--alpay-blue-hover);
  }

  .pc-pay-button:hover {
    box-shadow: var(--card-shadow2-hover);
  }
}

.pc-wxpay-button:active {
  background-color: var(--wechat-green-hover);
}

.pc-alipay-button:active {
  background-color: var(--alpay-blue-hover);
}

.pc-pay-button:active {
  background-color: var(--on-primary);
  box-shadow: var(--card-shadow2-hover);
}


</style>