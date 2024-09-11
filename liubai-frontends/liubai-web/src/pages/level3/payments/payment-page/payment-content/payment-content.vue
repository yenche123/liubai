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
    class="pc-container"
  >
    <!-- title (like: 年度会员) -->
    <div class="pc-wxpay-title">
      <span v-if="pcData.od.title">{{ pcData.od.title }}</span>
    </div>

    <!-- title (like: ¥150.00) -->
    <div class="pc-wxpay-price">
      <span v-if="pcData.od.currency === 'cny' || pcData.od.currency === 'jpy'" 
        class="pc-wxpay-symbol"
      >¥</span>
      <span v-else class="pc-wxpay-symbol">$</span>
      <span>{{ pcData.order_amount_txt }}</span>
    </div>

  </div>






</template>
<style scoped lang="scss">

.pc-container {
  width: 100%;
  min-height: calc(100dvh - 80px);
  position: relative;
}

.pc-square {
  width: 100%;
  height: calc(100dvh - 140px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

</style>